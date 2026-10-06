"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";
import RecordCard from "@/components/records/RecordCard";
import { attr, clothName, formatPlace, type ProductRecord } from "@/lib/records";

const ALL = "All";

const fold = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();

/* What a visitor might type: the name, the place, the technique, or the code
   from the label ("07/TM", "07tm", "7"). */
function haystack(record: ProductRecord) {
    return fold(
        [
            record.code,
            record.code.replace(/[^A-Za-z0-9]/g, ""),
            clothName(record),
            record.collection ?? "",
            formatPlace(attr(record, "Origin")),
            String(attr(record, "Technique") ?? ""),
            String(attr(record, "Material") ?? ""),
        ].join(" "),
    );
}

function matches(record: ProductRecord, text: string, query: string) {
    const q = fold(query.trim());
    if (!q) return true;
    if (/^\d{1,2}$/.test(q)) return Number.parseInt(record.code, 10) === Number(q);
    return q.split(/\s+/).every((word) => text.includes(word));
}

/**
 * The catalogue: search, the collections as filters, and the grid.
 *
 * It used to be a sideways rail on a phone — fine for four records, a chore
 * for twenty-nine — filtered by fifteen places of origin that each held one
 * cloth. Now it is two columns on a phone and four on a desk, filtered by the
 * four collections the exhibition is actually hung in, with a search box that
 * also takes the code printed on the label beside each cloth.
 *
 * The filters live in the URL (`?q=`, `?c=`), so the back button from a
 * record returns to the same view instead of to the top of an unfiltered list.
 */
export function RecordGallery({
    records,
    issued,
    className,
}: {
    records: ProductRecord[];
    /** certificates issued per record code; null when the store did not answer */
    issued: Record<string, number> | null;
    className?: string;
}) {
    /* Read from the live URL, not from props: "back" restores the page's first
       render from the router cache, whose props predate the search. */
    const params = useSearchParams();
    const [query, setQuery] = useState(() => params.get("q") ?? "");
    const [collection, setCollection] = useState(() => {
        const wanted = params.get("c");
        return wanted && records.some((r) => r.collection === wanted) ? wanted : ALL;
    });
    const [openOnly, setOpenOnly] = useState(false);
    const deferred = useDeferredValue(query);

    const indexed = useMemo(
        () => records.map((record) => ({ record, text: haystack(record) })),
        [records],
    );

    const collections = useMemo(() => {
        const counts = new Map<string, number>();
        for (const r of records) {
            if (r.collection) counts.set(r.collection, (counts.get(r.collection) ?? 0) + 1);
        }
        return [...counts.entries()];
    }, [records]);

    const left = (record: ProductRecord) =>
        issued ? Math.max(record.supply - (issued[record.code] ?? 0), 0) : undefined;

    const shown = indexed
        .filter(({ record }) => collection === ALL || record.collection === collection)
        .filter(({ record }) => !openOnly || (left(record) ?? 1) > 0)
        .filter(({ record, text }) => matches(record, text, deferred))
        .map(({ record }) => record);

    /* Mirror the view into the URL without a navigation. */
    useEffect(() => {
        const url = new URL(window.location.href);
        const q = deferred.trim();
        if (q) url.searchParams.set("q", q);
        else url.searchParams.delete("q");
        if (collection !== ALL) url.searchParams.set("c", collection);
        else url.searchParams.delete("c");
        const next = `${url.pathname}${url.search}${url.hash}`;
        if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
            /* `null`, not the current state: Next only adopts the new URL
               into its own router state when the state argument is empty,
               and otherwise writes the old URL back on the next navigation,
               so "back" from a record lost the search. */
            window.history.replaceState(null, "", next);
        }
    }, [deferred, collection]);

    const filtered = collection !== ALL || openOnly || deferred.trim() !== "";
    const clear = () => {
        setQuery("");
        setCollection(ALL);
        setOpenOnly(false);
    };

    if (!records.length) {
        return (
            <div className="rounded-lg px-6 py-16 text-center shadow-[var(--ring)]">
                <p className="display text-2xl">No records yet</p>
                <p className="mx-auto mt-3 max-w-[46ch] text-[17px] text-muted-foreground">
                    Records appear as soon as the first cloth is registered.
                </p>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="flex flex-col gap-3">
                <label className="relative block sm:max-w-md">
                    <span className="sr-only">Search the cloths</span>
                    <Search
                        aria-hidden
                        strokeWidth={1.5}
                        className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-ink-3"
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Name, place, or label code"
                        autoComplete="off"
                        spellCheck={false}
                        enterKeyHint="search"
                        className="h-12 w-full rounded-full bg-card pr-11 pl-11 text-[16px] shadow-[var(--ring)] transition-shadow duration-[160ms] placeholder:text-ink-3 focus-visible:shadow-[0_0_0_2px_var(--bt-red)] [&::-webkit-search-cancel-button]:hidden"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            aria-label="Clear search"
                            className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:bg-ink/5 hover:text-ink"
                        >
                            <X aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                    )}
                </label>

                <div
                    role="group"
                    aria-label="Filter by collection"
                    className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
                >
                    {[[ALL, records.length] as const, ...collections].map(([name, count]) => {
                        const on = name === collection;
                        return (
                            <button
                                key={name}
                                type="button"
                                aria-pressed={on}
                                onClick={() => setCollection(name)}
                                className="pressable relative shrink-0 rounded-full px-3.5 py-2 text-[12px] tracking-[.1em] uppercase shadow-[var(--ring)]"
                            >
                                {on && (
                                    <motion.span
                                        layoutId="record-filter-pill"
                                        aria-hidden
                                        className="absolute inset-0 rounded-full bg-ink"
                                        transition={{ type: "spring", duration: 0.34, bounce: 0.18 }}
                                    />
                                )}
                                <span
                                    className={`relative whitespace-nowrap ${
                                        on ? "text-white" : "text-ink-2 hover:text-ink"
                                    }`}
                                >
                                    {name}
                                    <span className="num ml-1.5 opacity-60">{count}</span>
                                </span>
                            </button>
                        );
                    })}
                    {issued && (
                        <button
                            type="button"
                            aria-pressed={openOnly}
                            onClick={() => setOpenOnly((v) => !v)}
                            className={`pressable shrink-0 rounded-full px-3.5 py-2 text-[12px] tracking-[.1em] whitespace-nowrap uppercase ${
                                openOnly
                                    ? "bg-blush text-bt-red shadow-[0_0_0_1px_rgba(174,24,0,.3)]"
                                    : "text-ink-2 shadow-[var(--ring)] hover:text-ink"
                            }`}
                        >
                            {openOnly ? "✓ " : ""}Unclaimed only
                        </button>
                    )}
                </div>
            </div>

            <p
                aria-live="polite"
                className="mt-4 mb-5 flex min-h-6 flex-wrap items-center gap-x-3 text-[14px] text-muted-foreground"
            >
                <span className="num">
                    {filtered
                        ? `${shown.length} of ${records.length} cloths`
                        : `${records.length} cloths`}
                </span>
                {filtered && (
                    <button
                        type="button"
                        onClick={clear}
                        className="text-bt-red underline underline-offset-2 hover:text-bt-red-bright"
                    >
                        Clear filters
                    </button>
                )}
            </p>

            {shown.length ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4 lg:gap-x-6">
                    {shown.map((record, i) => (
                        <RecordCard
                            key={record.code}
                            record={record}
                            index={i}
                            remaining={left(record)}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-lg px-6 py-14 text-center shadow-[var(--ring)]">
                    <p className="display text-[22px]">No cloth matches that.</p>
                    <p className="mx-auto mt-2 max-w-[44ch] text-[15px] text-muted-foreground">
                        Try the cloth&apos;s name, where it was woven, or the code on
                        its label — for example <span className="data text-ink">07/TM</span>.
                    </p>
                    <button
                        type="button"
                        onClick={clear}
                        className="pressable mt-5 inline-flex h-11 items-center rounded-md bg-ink px-5 text-white hover:bg-ink/90"
                    >
                        Show all cloths
                    </button>
                </div>
            )}
        </div>
    );
}
