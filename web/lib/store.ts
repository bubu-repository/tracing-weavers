import { promises as fs } from "node:fs";
import path from "node:path";
import type { Identity, Passport, PassportPayload } from "@/lib/types";

/**
 * Where issued passports live.
 *
 *   file (default)  data/passports.json — zero setup for local dev and for a
 *                   self-hosted box. NOT usable on Vercel: its filesystem is
 *                   read-only apart from /tmp.
 *   kv              Redis over REST — the Upstash integration from Vercel's
 *                   Marketplace (Storage → Upstash). No SDK, plain fetch, so
 *                   nothing extra to install. Set PASSPORT_STORE=kv and let the
 *                   integration inject the url + token.
 *
 * Postgres (Neon, Supabase, Prisma Postgres, Nile, Turso) is not wired up: the
 * storage interface below is the seam. A passport is one append-only table —
 *
 *   create table passports (
 *     id text primary key, code text not null, holder text not null,
 *     email text, outlet text, issued_at timestamptz not null,
 *     serial int not null, status text not null default 'issued', tags text[]
 *   );
 *
 * — and the five methods below become SQL. Nothing outside this file changes.
 */

export type { Passport, Identity } from "@/lib/types";

export type IssueDraft = {
    code: string;
    holder: string;
    email?: string;
    outlet?: string;
    issuedAt: string;
    tags?: string[];
    /** How many passports this record may ever issue. */
    supply: number;
    /** How many one holder (email) may take. */
    perHolder: number;
};

export type IssueOutcome =
    | { ok: true; passport: Passport }
    | { ok: false; reason: "sold_out" | "one_per_holder" };

export interface PassportStore {
    backend: "file" | "kv";
    issuableCount(code: string): Promise<number>;
    /** The same count for many records in one round trip — the catalogue
        shows which cloths are still available without 29 separate reads. */
    issuableCounts(codes: string[]): Promise<Record<string, number>>;
    listByHolder(email: string): Promise<Passport[]>;
    listByRecord(code: string): Promise<Passport[]>;
    all(): Promise<Passport[]>;
    get(id: string): Promise<Passport | null>;
    save(passport: Passport): Promise<void>;
    /**
     * Reserve the serial and write the passport in ONE atomic step.
     *
     * Issuing must not be check-then-write: two holders racing for the last
     * slot both pass a separate check and both get a passport (measured: three
     * parallel claims on a supply-1 record all returned 201 with serial 1).
     */
    issue(draft: IssueDraft, makeId: (serial: number) => string): Promise<IssueOutcome>;
}

/* ───────────────────────── file backend ───────────────────────── */

const FILE = path.join(process.cwd(), "data", "passports.json");

type FileShape = { _comment?: string; passports: Passport[] };

async function readFileStore(): Promise<FileShape> {
    try {
        const raw = await fs.readFile(FILE, "utf8");
        const parsed = JSON.parse(raw) as FileShape;
        return { ...parsed, passports: parsed.passports ?? [] };
    } catch (cause) {
        /* A missing file is a fresh store. A file we cannot parse is NOT an
           empty store: treating it as empty resets the supply and lets a
           one-of-one cloth be claimed twice. Fail instead of guessing. */
        if ((cause as NodeJS.ErrnoException)?.code === "ENOENT") {
            return { passports: [] };
        }
        throw new Error(
            `The passport store at ${FILE} could not be read, so issuing stopped instead of resetting the supply: ${(cause as Error)?.message}`,
        );
    }
}

async function writeFileStore(data: FileShape) {
    const tmp = `${FILE}.tmp`;
    try {
        await fs.mkdir(path.dirname(FILE), { recursive: true });
        /* Write beside the target, then rename: a reader never sees half a file
           and two writers cannot interleave. */
        await fs.writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
        await fs.rename(tmp, FILE);
    } catch (cause) {
        await fs.rm(tmp, { force: true }).catch(() => {});
        const detail = (cause as Error)?.message ?? "unknown error";
        throw new Error(
            process.env.VERCEL
                ? "The passport store is set to `file`, which cannot be written on a deployment (Vercel's filesystem is read-only). Connect Upstash from Vercel → Storage → Marketplace, then set PASSPORT_STORE=kv and redeploy."
                : `Could not write ${FILE}: ${detail}. Locally that usually means the directory is not writable, or PASSPORT_STORE points at kv without the Redis env vars.`,
        );
    }
}

/* One writer at a time inside this process. A serverless deployment runs many
   processes, so the file backend stays a local/self-hosted convenience; the kv
   backend is the one that is correct under real concurrency. */
let fileLock: Promise<unknown> = Promise.resolve();

function withFileLock<T>(work: () => Promise<T>): Promise<T> {
    const run = fileLock.then(work, work);
    fileLock = run.then(
        () => undefined,
        () => undefined,
    );
    return run;
}

const issuedIn = (passports: Passport[], code: string) =>
    passports.filter((p) => p.code === code && p.status === "issued");

const heldBy = (passports: Passport[], code: string, email: string | undefined) =>
    passports.filter(
        (p) =>
            p.code === code &&
            p.status === "issued" &&
            Boolean(email) &&
            (p.email ?? "").trim().toLowerCase() === email,
    );

const fileStore: PassportStore = {
    backend: "file",
    async issuableCount(code) {
        const { passports } = await readFileStore();
        return passports.filter((p) => p.code === code && p.status === "issued").length;
    },
    async issuableCounts(codes) {
        const { passports } = await readFileStore();
        const counts: Record<string, number> = Object.fromEntries(codes.map((c) => [c, 0]));
        for (const p of passports) {
            if (p.status === "issued" && p.code in counts) counts[p.code] += 1;
        }
        return counts;
    },
    async listByHolder(email) {
        const { passports } = await readFileStore();
        const wanted = email.trim().toLowerCase();
        return passports.filter(
            (p) =>
                (p.email ?? "").trim().toLowerCase() === wanted ||
                (!p.email && p.holder.trim().toLowerCase() === wanted),
        );
    },
    async listByRecord(code) {
        const { passports } = await readFileStore();
        return passports.filter((p) => p.code === code);
    },
    async all() {
        return (await readFileStore()).passports;
    },
    async get(id) {
        const { passports } = await readFileStore();
        return passports.find((p) => p.id === id) ?? null;
    },
    async save(passport) {
        await withFileLock(async () => {
            const data = await readFileStore();
            data.passports = [
                ...data.passports.filter((p) => p.id !== passport.id),
                passport,
            ];
            await writeFileStore(data);
        });
    },
    async issue(draft, makeId) {
        return withFileLock(async () => {
            const data = await readFileStore();
            const email = draft.email?.trim().toLowerCase();

            if (issuedIn(data.passports, draft.code).length >= draft.supply) {
                return { ok: false, reason: "sold_out" } as IssueOutcome;
            }
            if (heldBy(data.passports, draft.code, email).length >= draft.perHolder) {
                return { ok: false, reason: "one_per_holder" } as IssueOutcome;
            }

            const highest = data.passports
                .filter((p) => p.code === draft.code)
                .reduce((max, p) => Math.max(max, p.serial ?? 0), 0);
            const serial =
                Math.max(highest, issuedIn(data.passports, draft.code).length) + 1;

            const passport: Passport = {
                id: makeId(serial),
                code: draft.code,
                holder: draft.holder,
                email: draft.email,
                outlet: draft.outlet,
                issuedAt: draft.issuedAt,
                serial,
                status: "issued",
                tags: draft.tags,
            };

            data.passports = [
                ...data.passports.filter((p) => p.id !== passport.id),
                passport,
            ];
            await writeFileStore(data);
            return { ok: true, passport } as IssueOutcome;
        });
    },
};

/* ─────────────────────────── kv backend ─────────────────────────── */

/* Vercel's KV product is served by Upstash now, and the Marketplace install
   injects whatever the "Custom Prefix" field said. Accept every name it
   plausibly produces — it is the same REST endpoint either way, and no SDK is
   needed: KV_REST_API_* (the KV-era names), UPSTASH_REDIS_REST_* (Upstash's
   own), and STORAGE_* (what the prefix field defaults to). */
function kvConfig() {
    const url = (
        process.env.KV_REST_API_URL ??
        process.env.UPSTASH_REDIS_REST_URL ??
        process.env.STORAGE_URL ??
        ""
    ).replace(/\/$/, "");
    const token =
        process.env.KV_REST_API_TOKEN ??
        process.env.UPSTASH_REDIS_REST_TOKEN ??
        process.env.STORAGE_TOKEN;

    if (!url || !token) {
        throw new Error(
            "PASSPORT_STORE=kv is set, but no Redis REST url/token was found. Install Upstash from Vercel → Storage → Marketplace and connect it to this project, then redeploy. It injects either KV_REST_API_URL / KV_REST_API_TOKEN, UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN, or <prefix>_URL / <prefix>_TOKEN depending on the prefix you typed in the connect dialog.",
        );
    }
    return { url, token };
}

async function kvCommand<T>(command: (string | number)[]): Promise<T> {
    const { url, token } = kvConfig();
    const res = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(`KV command failed (${res.status}): ${await res.text()}`);
    }

    const body = (await res.json()) as { result: T };
    return body.result;
}

/* Several commands, one request: Upstash's REST API takes a list at /pipeline
   and answers with one { result } per command, in order. */
async function kvPipeline<T>(commands: (string | number)[][]): Promise<T[]> {
    const { url, token } = kvConfig();
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(commands),
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(`KV pipeline failed (${res.status}): ${await res.text()}`);
    }

    const body = (await res.json()) as { result?: T; error?: string }[];
    return body.map((entry) => {
        if (entry.error) throw new Error(`KV pipeline command failed: ${entry.error}`);
        return entry.result as T;
    });
}

const PASSPORT_KEY = (id: string) => `dpp:passport:${id}`;
const RECORD_SET = (code: string) => `dpp:record:${code}`;
const HOLDER_SET = (email: string) => `dpp:holder:${email.trim().toLowerCase()}`;
const CLAIMER_SET = (code: string) => `dpp:claimer:${code}`;
const SERIAL_KEY = (code: string) => `dpp:serial:${code}`;
/* an index of ids, so listing never needs KEYS (which blocks Redis and walks
   the whole keyspace) */
const INDEX_SET = "dpp:index";

const kvStore: PassportStore = {
    backend: "kv",
    async issuableCount(code) {
        return Number(await kvCommand<number>(["SCARD", RECORD_SET(code)])) || 0;
    },
    async issuableCounts(codes) {
        if (!codes.length) return {};
        const results = await kvPipeline<number>(codes.map((code) => ["SCARD", RECORD_SET(code)]));
        return Object.fromEntries(codes.map((code, i) => [code, Number(results[i]) || 0]));
    },
    async listByHolder(email) {
        return readIds(await kvCommand<string[]>(["SMEMBERS", HOLDER_SET(email)]));
    },
    async listByRecord(code) {
        return readIds(await kvCommand<string[]>(["SMEMBERS", RECORD_SET(code)]));
    },
    async all() {
        const ids = await kvCommand<string[]>(["SMEMBERS", INDEX_SET]);
        return readIds(ids ?? []);
    },
    async get(id) {
        const raw = await kvCommand<string | null>(["GET", PASSPORT_KEY(id)]);
        return raw ? (JSON.parse(raw) as Passport) : null;
    },
    async save(passport) {
        await kvCommand(["SET", PASSPORT_KEY(passport.id), JSON.stringify(passport)]);
        await kvCommand(["SADD", RECORD_SET(passport.code), passport.id]);
        await kvCommand(["SADD", INDEX_SET, passport.id]);
        const holderKey = passport.email ?? passport.holder;
        if (holderKey) {
            await kvCommand(["SADD", HOLDER_SET(holderKey), passport.id]);
        }
    },
    async issue(draft, makeId) {
        const email = draft.email?.trim().toLowerCase();

        /* One SADD decides the per-holder rule atomically: it returns 0 when the
           member was already there, so two parallel requests cannot both pass. */
        if (email) {
            const added = Number(
                await kvCommand<number>(["SADD", CLAIMER_SET(draft.code), email]),
            );
            if (!added) return { ok: false, reason: "one_per_holder" };
        }

        /* The serial comes from an atomic INCR. Seed the counter first from what
           already exists, so a store that predates it never re-issues serial 1. */
        await kvCommand([
            "SETNX",
            SERIAL_KEY(draft.code),
            Number(await kvCommand<number>(["SCARD", RECORD_SET(draft.code)])) || 0,
        ]);
        const serial = Number(await kvCommand<number>(["INCR", SERIAL_KEY(draft.code)]));

        if (serial > draft.supply) {
            await kvCommand(["DECR", SERIAL_KEY(draft.code)]);
            if (email) await kvCommand(["SREM", CLAIMER_SET(draft.code), email]);
            return { ok: false, reason: "sold_out" };
        }

        const passport: Passport = {
            id: makeId(serial),
            code: draft.code,
            holder: draft.holder,
            email: draft.email,
            outlet: draft.outlet,
            issuedAt: draft.issuedAt,
            serial,
            status: "issued",
            tags: draft.tags,
        };

        try {
            await kvStore.save(passport);
        } catch (cause) {
            /* Give the slot back, so a failed write does not burn a serial. */
            await kvCommand(["DECR", SERIAL_KEY(draft.code)]).catch(() => {});
            if (email) {
                await kvCommand(["SREM", CLAIMER_SET(draft.code), email]).catch(() => {});
            }
            throw cause;
        }

        return { ok: true, passport };
    },
};

async function readIds(ids: string[] | null): Promise<Passport[]> {
    if (!ids?.length) return [];
    const many = await Promise.all(ids.map((id) => kvStore.get(id)));
    return many.filter((p): p is Passport => Boolean(p));
}

/* ──────────────────────────── selector ──────────────────────────── */

export function passportStore(): PassportStore {
    return process.env.PASSPORT_STORE === "kv" ? kvStore : fileStore;
}