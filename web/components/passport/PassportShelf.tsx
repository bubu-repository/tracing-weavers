"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { PassportLeaf } from "@/components/passport/passport-leaf";
import { PassportBook, type BookPage } from "@/components/passport/passport-book";
import { readLocalPassports } from "@/lib/local-passports";
import { WarpField } from "@/components/motif/marks";
import { brand } from "@/lib/brand";
import type { Passport } from "@/lib/types";
import { recordVisual, type ProductRecord } from "@/lib/records";

const issuedOn = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
    });

/**
 * The holder's passports, bound as a book: a cover, the register of what is in
 * it, one page per claimed tag, and a colophon at the end. The book itself —
 * sheets, spine, the turn — lives in PassportBook; this file only decides what
 * is printed on each page.
 *
 * Server-issued passports plus anything this browser was handed and the store
 * has not returned yet (or cannot, when no store is configured). The empty
 * state lives here, not in the page: the page only knows the server list, so a
 * holder whose passports exist solely in this browser used to see "No passports
 * here yet" printed directly above their own passport.
 */
export function PassportShelf({
    issued,
    records,
    emptyState,
}: {
    issued: Passport[];
    records: ProductRecord[];
    emptyState?: ReactNode;
}) {
    const [merged, setMerged] = useState<Passport[]>(issued);

    useEffect(() => {
        const byId = new Map<string, Passport>();
        for (const passport of [...issued, ...readLocalPassports()]) {
            byId.set(passport.id, passport);
        }
        setMerged(
            [...byId.values()].sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1)),
        );
    }, [issued]);

    if (!merged.length) return <>{emptyState ?? null}</>;

    const holder = merged[0]?.holder ?? "Holder";

    const pages: BookPage[] = [
        /* the cover */
        {
            id: "cover",
            label: "Cover",
            content: (
                <div
                    className="ink-band cloth relative flex h-full w-full flex-col justify-between overflow-hidden p-6 text-white sm:p-7"
                    data-theme="dark"
                >
                    <WarpField className="pointer-events-none absolute inset-0 h-full w-full text-white/10" />
                    <div className="relative">
                        <div className="eyebrow">{brand}</div>
                        <p className="display mt-3 max-w-[18ch] text-[clamp(1.4rem,4.4vw,2rem)] leading-tight">
                            {holder}
                        </p>
                    </div>
                    <div className="relative">
                        <p className="num text-[clamp(2.6rem,9vw,4rem)] leading-none text-salmon">
                            {merged.length}
                        </p>
                        <p className="mt-1 text-[14px] text-white/70">
                            {merged.length === 1
                                ? "certificate in this book"
                                : "certificates in this book"}
                        </p>
                    </div>
                    <p className="relative text-[11px] tracking-[.16em] uppercase text-white/50">
                        Drag the page to open it
                    </p>
                </div>
            ),
        },
        /* the register: what is bound in, in the order it was claimed */
        {
            id: "register",
            label: "Register",
            content: (
                <div className="cloth flex h-full w-full flex-col bg-[#EDE7DC] p-6 sm:p-7">
                    <div className="eyebrow">In this book</div>
                    <ol className="mt-4 min-h-0 flex-1 overflow-hidden">
                        {merged.slice(0, 7).map((passport, i) => (
                            <li
                                key={passport.id}
                                className="flex items-baseline justify-between gap-3 border-t border-ink/12 py-2"
                            >
                                <span className="data w-5 shrink-0 text-bt-red">
                                    {"0" + (i + 1)}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[15px]">
                                    {records.find((r) => r.code === passport.code)
                                        ?.title.split(" · ")[0] ?? passport.code}
                                </span>
                                <span className="data shrink-0 text-[11px] text-ink-2">
                                    {issuedOn(passport.issuedAt)}
                                </span>
                            </li>
                        ))}
                    </ol>
                    <p className="mt-3 border-t border-ink/12 pt-3 text-[13px] text-ink-2">
                        One page per claimed cloth. Every page can be checked on its
                        own.
                    </p>
                </div>
            ),
        },
        /* one page per certificate */
        ...merged.map((passport, i) => ({
            id: passport.id,
            label: `Certificate ${i + 1} of ${merged.length}`,
            content: (
                <PassportLeaf
                    fill
                    passport={passport}
                    record={records.find((r) => r.code === passport.code)}
                />
            ),
        })),
        /* the colophon, so the last sheet always has a back */
        {
            id: "colophon",
            label: "Colophon",
            content: (
                <div className="cloth flex h-full w-full flex-col justify-between bg-[#EDE7DC] p-6 sm:p-7">
                    <div className="eyebrow">{brand}</div>
                    <p className="max-w-[26ch] text-[16px] leading-relaxed text-ink-2">
                        The record travels with the cloth, including when it changes
                        hands. Every resale returns value to the household that wove
                        it.
                    </p>
                    <p className="data text-[11px] text-ink-3">
                        Seed to Loom · Adonara · Lembata · Manggarai
                    </p>
                </div>
            ),
        },
    ];

    /* What is printed on the left-hand page before anything has been turned
       onto it, and on the right-hand one once everything has: a spread with an
       empty half is exactly the problem this redesign set out to fix. */
    const insideCover = (
        <div className="flex h-full w-full flex-col justify-between p-6 sm:p-7">
            <div>
                <div className="eyebrow">Issued by</div>
                <p className="display mt-2 text-[18px] leading-tight">{brand}</p>
                <p className="mt-1 text-[13px] text-ink-2">
                    ICM × TBN × Torajamelo · Seed to Loom
                </p>
            </div>
            <p className="max-w-[24ch] text-[14px] leading-snug text-ink-2">
                This book records cloth, not ownership. The cloth and its motifs stay
                with the weaver and their community.
            </p>
            <div className="flex items-end justify-between gap-3">
                <span className="data text-[10px] text-ink-3">Adonara · Lembata</span>
                <span
                    aria-hidden
                    className="grid h-12 w-12 place-items-center rounded-full text-[9px] leading-tight tracking-[.1em] text-bt-red/70 uppercase shadow-[0_0_0_1.5px_rgba(174,24,0,.35)]"
                >
                    seed to
                    <br />
                    loom
                </span>
            </div>
        </div>
    );

    const backCover = (
        <div className="flex h-full w-full flex-col justify-end p-6 sm:p-7">
            <p className="data text-[11px] text-ink-3">End of the book</p>
            <p className="mt-2 max-w-[24ch] text-[15px] leading-snug text-ink-2">
                Claim another tag and a new sheet is bound in here.
            </p>
        </div>
    );

    return (
        <div className="space-y-12">
            <div className="mx-auto max-w-sm sm:max-w-3xl">
                <PassportBook
                    pages={pages}
                    insideCover={insideCover}
                    backCover={backCover}
                />
            </div>

            {/* The same certificates as a plain list: quicker than turning
                pages to find one, and the book's pages are hidden from screen
                readers except the spread that is open. */}
            <section aria-labelledby="all-certificates">
                <h2 id="all-certificates" className="eyebrow">
                    Every certificate
                </h2>
                <ul className="mt-3 divide-y divide-border border-y border-border">
                    {merged.map((passport) => {
                        const record = records.find((r) => r.code === passport.code);
                        return (
                            <li
                                key={passport.id}
                                className="flex items-center gap-4 py-3"
                            >
                                {record && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={recordVisual(record)}
                                        alt=""
                                        loading="lazy"
                                        className="h-14 w-11 shrink-0 rounded-md object-cover shadow-[var(--ring)]"
                                        draggable={false}
                                    />
                                )}
                                <div className="min-w-0 flex-1">
                                    <Link
                                        href={`/record/${encodeURIComponent(passport.code)}`}
                                        className="block truncate text-[16px] text-ink hover:text-bt-red"
                                    >
                                        {record?.title.split(" · ")[0] ?? passport.code}
                                    </Link>
                                    <p className="data mt-0.5 truncate text-muted-foreground">
                                        {passport.code} · {issuedOn(passport.issuedAt)}
                                        {passport.status === "revoked" ? " · revoked" : ""}
                                    </p>
                                </div>
                                <Link
                                    href={`/verify/${encodeURIComponent(passport.id)}`}
                                    className="shrink-0 rounded-full px-3 py-1.5 text-[13px] text-ink-2 shadow-[var(--ring)] hover:text-ink hover:shadow-[var(--ring-hover)]"
                                >
                                    Check
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </section>
        </div>
    );
}
