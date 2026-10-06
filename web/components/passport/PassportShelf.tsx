"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { PassportLeaf } from "@/components/passport/passport-leaf";
import { PassportBook, type BookPage, type BookTab } from "@/components/passport/passport-book";
import { BookRegister, IndigoEndpaper, WovenCover } from "@/components/passport/book-pages";
import { catalogueNumber } from "@/components/records/RecordCard";
import { readLocalPassports } from "@/lib/local-passports";
import { brand } from "@/lib/brand";
import type { Passport } from "@/lib/types";
import { clothName, paletteFor, recordSwatch, type ProductRecord } from "@/lib/records";

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
    specimen = false,
}: {
    issued: Passport[];
    records: ProductRecord[];
    emptyState?: ReactNode;
    /** a sample book for someone signed out: marked, without the list, and
        never mixed with certificates this browser happens to hold */
    specimen?: boolean;
}) {
    const [merged, setMerged] = useState<Passport[]>(issued);

    useEffect(() => {
        if (specimen) return;
        const byId = new Map<string, Passport>();
        for (const passport of [...issued, ...readLocalPassports()]) {
            byId.set(passport.id, passport);
        }
        setMerged(
            [...byId.values()].sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1)),
        );
    }, [issued, specimen]);

    if (!merged.length) return <>{emptyState ?? null}</>;

    const holder = merged[0]?.holder ?? "Holder";
    const recordOf = (code: string) => records.find((r) => r.code === code);
    const tabs: BookTab[] = merged.map((passport) => {
        const record = recordOf(passport.code);
        return {
            pageId: passport.id,
            label: catalogueNumber(passport.code),
            title: record ? clothName(record) : passport.code,
            color: (record && paletteFor(record)?.colors[0]?.hex) || "#B1241A",
        };
    });

    const pages: BookPage[] = [
        /* the cover, bound in the cloths it holds */
        {
            id: "cover",
            label: "Cover",
            content: (
                <WovenCover
                    holder={holder}
                    count={merged.length}
                    specimen={specimen}
                    bands={merged
                        .map((p) => recordOf(p.code))
                        .map((r) => (r ? paletteFor(r) : undefined))
                        .filter((pal): pal is NonNullable<typeof pal> => Boolean(pal))
                        .map((pal) => ({ colors: pal.colors }))}
                />
            ),
        },
        /* the register: what is bound in, in the order it was claimed */
        {
            id: "register",
            label: "Register",
            content: (
                <BookRegister
                    total={merged.length}
                    entries={merged.map((passport) => {
                        const record = recordOf(passport.code);
                        return {
                            pageId: passport.id,
                            number: catalogueNumber(passport.code),
                            name: record ? clothName(record) : passport.code,
                            date: issuedOn(passport.issuedAt),
                            color: (record && paletteFor(record)?.colors[0]?.hex) || "#B1241A",
                        };
                    })}
                />
            ),
        },
        /* one page per certificate */
        ...merged.map((passport, i) => ({
            id: passport.id,
            label: `Certificate ${i + 1} of ${merged.length}`,
            content: (
                <PassportLeaf
                    fill
                    specimen={specimen}
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
                <div className="cloth flex h-full w-full flex-col justify-between bg-[#F3EDE2] p-6 sm:p-7">
                    <div>
                        <div className="eyebrow">Colophon</div>
                        <p className="read mt-4 max-w-[26ch] text-[17px] leading-relaxed text-ink-2">
                            The record travels with the cloth, including when it changes
                            hands. Every resale returns value to the household that wove
                            it.
                        </p>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                        <p className="data text-[11px] text-ink-3">
                            Seed to Loom
                            <br />
                            Adonara · Lembata · Manggarai
                        </p>
                        <span className="stamp stamp-ink text-[11px]">Bound by hand</span>
                    </div>
                </div>
            ),
        },
    ];

    /* What is printed on the left-hand page before anything has been turned
       onto it, and on the right-hand one once everything has: a spread with an
       empty half is exactly the problem this redesign set out to fix. */
    const insideCover = (
        <IndigoEndpaper>
            <div>
                <div className="eyebrow">Issued by</div>
                <p className="display mt-2 text-[20px] leading-tight text-white">{brand}</p>
                <p className="mt-1 text-[13px] text-white/70">ICM × TBN × Torajamelo · Seed to Loom</p>
            </div>
            <p className="read max-w-[24ch] text-[16px] leading-snug text-white/85">
                This book records cloth, not ownership. The cloth and its motifs stay
                with the weaver and their community.
            </p>
            <div className="flex items-end justify-between gap-3">
                <span className="data text-[11px] text-white/60">Adonara · Lembata</span>
                <span
                    aria-hidden
                    className="grid h-14 w-14 rotate-[-8deg] place-items-center rounded-full text-center text-[9.5px] leading-tight tracking-[.1em] text-[#F2C7A8] uppercase shadow-[0_0_0_1.5px_rgba(242,199,168,.7),inset_0_0_0_4px_rgba(39,53,95,1),inset_0_0_0_5px_rgba(242,199,168,.5)]"
                >
                    seed to
                    <br />
                    loom
                </span>
            </div>
        </IndigoEndpaper>
    );

    const backCover = (
        <IndigoEndpaper>
            <span />
            <div>
                <p className="data text-[11px] text-white/60">End of the book</p>
                <p className="read mt-2 max-w-[24ch] text-[17px] leading-snug text-white/90">
                    Claim another cloth and a new sheet is bound in here — and its
                    colours are woven into the cover.
                </p>
            </div>
        </IndigoEndpaper>
    );

    return (
        <div className="space-y-12">
            {/* the book lies on the gallery wall */}
            {/* the book lies on a linen cloth on the table */}
            <div
                className="relative overflow-hidden py-10 shadow-[inset_0_14px_22px_-16px_rgba(60,44,28,.45),inset_0_-14px_22px_-16px_rgba(60,44,28,.45)] sm:py-14"
                style={{
                    backgroundColor: "#E2D8C5",
                    backgroundImage:
                        "repeating-linear-gradient(90deg, rgba(60,44,28,.07) 0 1px, transparent 1px 4px), repeating-linear-gradient(0deg, rgba(255,255,255,.18) 0 1px, transparent 1px 4px)",
                }}
            >
                {specimen && (
                    <span className="stamp absolute top-3 left-4 z-10 text-[12px] sm:top-8 sm:right-10 sm:left-auto sm:text-[13px]">Specimen</span>
                )}
                <div className="container-x">
                    <div className="mx-auto max-w-sm pr-8 sm:max-w-[56rem] sm:pr-11">
                        <PassportBook pages={pages} insideCover={insideCover} backCover={backCover} tabs={tabs} />
                    </div>
                </div>
            </div>

            {/* The same certificates as a plain list: quicker than turning
                pages to find one, and the book's pages are hidden from screen
                readers except the spread that is open. */}
            {!specimen && (
            <section aria-labelledby="all-certificates" className="container-x">
                <h2 id="all-certificates" className="eyebrow">
                    Every certificate
                </h2>
                <ul className="mt-4 divide-y divide-border border-y border-ink">
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
                                        src={recordSwatch(record)}
                                        alt=""
                                        loading="lazy"
                                        className="h-16 w-13 shrink-0 object-cover"
                                        draggable={false}
                                    />
                                )}
                                <div className="min-w-0 flex-1">
                                    <Link
                                        href={`/record/${encodeURIComponent(passport.code)}`}
                                        className="block truncate text-[18px] text-ink hover:text-bt-red"
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
                                    className="shrink-0 px-3.5 py-2 text-[13px] text-ink shadow-[inset_0_0_0_1px_var(--bt-stone)] hover:bg-ink hover:text-white hover:shadow-none"
                                >
                                    Check
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </section>
            )}
        </div>
    );
}
