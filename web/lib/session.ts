import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Identity } from "@/lib/types";

/**
 * Identity without a wallet and without passwords.
 *
 * Two cookies, and the difference between them is the whole security model:
 *
 *   dpp_session  a name and an email, so a form can be prefilled and a visitor
 *                can be greeted. It proves NOTHING: anybody can type any email
 *                into /login. It is never used to decide what may be seen.
 *   dpp_held     the ids of the passports this browser has proved it holds,
 *                signed. Set when a passport is issued here, and when a holder
 *                opens their own verification link and saves it. This is what
 *                /collection lists.
 *
 * So knowing somebody's email address no longer reads their passports, which is
 * what the earlier version allowed. When the programme wants sign-in on a new
 * device without the link, add an emailed one-time code: only this file changes.
 */

const SESSION_COOKIE = "dpp_session";
const ADMIN_COOKIE = "dpp_admin";
const HELD_COOKIE = "dpp_held";
const MAX_AGE = 60 * 60 * 24 * 180;
const MAX_HELD = 200;

export type { Identity } from "@/lib/types";

function signatureKey(): string | null {
    const value = process.env.PASSPORT_SIGNING_SECRET;
    if (value) return value;
    /* A dev fallback, and nothing else. In production a missing secret means we
       cannot sign or verify, and we say so by returning null instead of
       throwing: a read path that throws would 500 every page that renders the
       header, including the page a scan lands on. */
    return process.env.NODE_ENV === "production"
        ? null
        : "dev-only-insecure-secret-change-me";
}

/** Can we sign at all? Issuing must fail closed when we cannot. */
export function signingAvailable() {
    return signatureKey() !== null;
}

function b64url(input: Buffer | string) {
    return Buffer.from(input)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

/** One key, two domains: a session cookie can never be replayed as a held one. */
function mac(domain: string, payload: string): string | null {
    const key = signatureKey();
    if (!key) return null;
    return b64url(createHmac("sha256", key).update(`${domain}:${payload}`).digest());
}

function verify(domain: string, token: string | undefined): string | null {
    if (!token) return null;
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expected = mac(domain, payload);
    if (!expected) return null;

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return payload;
}

function cookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: MAX_AGE,
    };
}

export const sessionCookieName = SESSION_COOKIE;
export const adminCookieName = ADMIN_COOKIE;
export const heldCookieName = HELD_COOKIE;

/* ─────────────────────────── the session ─────────────────────────── */

export function encodeIdentity(identity: Identity) {
    const payload = b64url(JSON.stringify(identity));
    const signature = mac("session", payload);
    if (!signature) {
        throw new Error(
            "PASSPORT_SIGNING_SECRET is not set, so a session cannot be signed.",
        );
    }
    return `${payload}.${signature}`;
}

export function decodeIdentity(token: string | undefined): Identity | null {
    const payload = verify("session", token);
    if (!payload) return null;
    try {
        const parsed = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
        if (!parsed?.name || !parsed?.email) return null;
        return parsed as Identity;
    } catch {
        return null;
    }
}

/* ───────────────────────── the held passports ───────────────────────── */

export function encodeHeld(ids: string[]) {
    const payload = b64url(JSON.stringify([...new Set(ids)].slice(0, MAX_HELD)));
    const signature = mac("held", payload);
    if (!signature) {
        throw new Error(
            "PASSPORT_SIGNING_SECRET is not set, so held passports cannot be recorded.",
        );
    }
    return `${payload}.${signature}`;
}

export function decodeHeld(token: string | undefined): string[] {
    const payload = verify("held", token);
    if (!payload) return [];
    try {
        const parsed = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
        return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
    } catch {
        return [];
    }
}

/** Read the signed-in identity (server components, route handlers). */
export async function currentIdentity(): Promise<Identity | null> {
    const jar = await cookies();
    return decodeIdentity(jar.get(SESSION_COOKIE)?.value);
}

/** The passport ids this browser has proved it holds. */
export async function heldIds(): Promise<string[]> {
    const jar = await cookies();
    return decodeHeld(jar.get(HELD_COOKIE)?.value);
}

/**
 * Record passports as held by this browser. Called when one is issued here, and
 * when a holder opens their own verification link: possession of the link is
 * the proof, which is why an id alone is never enough on its own.
 */
export async function holdPassports(ids: string[]) {
    const jar = await cookies();
    const next = [...new Set([...ids, ...decodeHeld(jar.get(HELD_COOKIE)?.value)])].slice(
        0,
        MAX_HELD,
    );
    jar.set(HELD_COOKIE, encodeHeld(next), cookieOptions());
    return next;
}

export async function setSession(identity: Identity) {
    const jar = await cookies();
    jar.set(SESSION_COOKIE, encodeIdentity(identity), cookieOptions());
}

/* ─────────────────────────── the programme team ─────────────────────────── */

/** Constant-time compare against PASSPORT_ADMIN_TOKEN. */
export function adminKeyMatches(presented: string | undefined): boolean {
    const expected = process.env.PASSPORT_ADMIN_TOKEN;
    if (!expected || !presented) return false;
    const a = Buffer.from(presented);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

export function adminConfigured() {
    return Boolean(process.env.PASSPORT_ADMIN_TOKEN);
}

/** A signed cookie, so the key does not have to stay in the URL or a bookmark. */
export async function setAdminSession() {
    const jar = await cookies();
    const signature = mac("admin", "team");
    if (!signature) {
        throw new Error(
            "PASSPORT_SIGNING_SECRET is not set, so the admin session cannot be signed.",
        );
    }
    jar.set(ADMIN_COOKIE, `team.${signature}`, cookieOptions());
}

export async function isAdminSession(): Promise<boolean> {
    const jar = await cookies();
    const token = jar.get(ADMIN_COOKIE)?.value;
    const [payload, signature] = (token ?? "").split(".");
    if (payload !== "team" || !signature) return false;
    const expected = mac("admin", payload);
    if (!expected) return false;
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

export async function clearAdminSession() {
    const jar = await cookies();
    jar.delete(ADMIN_COOKIE);
}

export async function clearSession() {
    const jar = await cookies();
    jar.delete(SESSION_COOKIE);
    jar.delete(HELD_COOKIE);
}