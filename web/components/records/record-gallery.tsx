"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import RecordCard from "@/components/records/RecordCard";
import {
    attr,
    clothName,
    COLOR_FAMILIES,
    formatPlace,
    paletteFor,
    type ColorFamily,
    type ProductRecord,
} from "@/lib/records";
import { cn } from "@/lib/utils";

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
            String(attr(record, "Origin") ?? ""),
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
 * The catalogue: search, collections, colours, and the grid.
 *
 * Colours are the cloth's own, measured from its photograph
 * (data/palettes.json) — "show me the indigo ones" is how people actually
 * look at textiles, and no label in the room can answer it.
 *
 * The view lives in the URL (`?q=`, `?c=`, `?colour=`): the back button from
 * a record returns to it, a filtered view can be shared, and links elsewhere
 * on the page (the origins) can set it.
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
    const readCollection = (value: string | null) =>
        value && records.some((r) => r.collection === value) ? value : ALL;
    const readColour = (value: string | null) =>
        (COLOR_FAMILIES.find((f) => f.id === value)?.id ?? null) as ColorFamily | null;

    const [query, setQuery] = useState(() => params.get("q") ?? "");
    const [collection, setCollection] = useState(() => readCollection(params.get("c")));
    const [colour, setColour] = useState<ColorFamily | null>(() => readColour(params.get("colour")));
    const [openOnly, setOpenOnly] = useState(false);
    const deferred = useDeferredValue(query);
    const written = useRef<string | null>(null);

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

    /* Only the colours this collection actually has at least two of. */
    const colours = useMemo(
        () =>
            COLOR_FAMILIES.map((family) => ({
                ...family,
                count: records.filter((r) => paletteFor(r)?.families.includes(family.id)).length,
            })).filter((family) => family.count >= 2),
        [records],
    );

    const left = (record: ProductRecord) =>
        issued ? Math.max(record.supply - (issued[record.code] ?? 0), 0) : undefined;

    const shown = indexed
        .filter(({ record }) => collection === ALL || record.collection === collection)
        .filter(({ record }) => !colour || paletteFor(record)?.families.includes(colour))
        .filter(({ record }) => !openOnly || (left(record) ?? 1) > 0)
        .filter(({ record, text }) => matches(record, text, deferred))
        .map(({ record }) => record);

    /* State → URL, without a navigation. */
    useEffect(() => {
        const url = new URL(window.location.href);
        const set = (key: string, value: string | null) =>
            value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
        set("q", deferred.trim() || null);
        set("c", collection !== ALL ? collection : null);
        set("colour", colour);
        const next = `${url.pathname}${url.search}${url.hash}`;
        if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
            written.current = url.searchParams.toString();
            /* `null`, not the current state: Next only adopts the new URL
               into its own router state when the state argument is empty,
               and otherwise writes the old URL back on the next navigation. */
            window.history.replaceState(null, "", next);
        }
    }, [deferred, collection, colour]);

    /* URL → state, when something else changed it (an origin link). Our own
       writes are skipped, or fast typing would be overwritten by the lag. */
    useEffect(() => {
        const current = params.toString();
        if (current === written.current) return;
        written.current = current;
        setQuery(params.get("q") ?? "");
        setCollection(readCollection(params.get("c")));
        setColour(readColour(params.get("colour")));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    const filtered =
        collection !== ALL || openOnly || colour !== null || deferred.trim() !== "";
    const clear = () => {
        setQuery("");
        setCollection(ALL);
        setColour(null);
        setOpenOnly(false);
    };

    if (!records.length) {
        return (
            <div className="px-6 py-16 text-center shadow-[var(--ring)]">
                <p className="display text-2xl">No records yet</p>
                <p className="mx-auto mt-3 max-w-[46ch] text-[17px] text-muted-foreground">
                    Records appear as soon as the first cloth is registered.
                </p>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* the filter bar: sticky on a desk, where there is room for it */}
            <div className="z-30 -mx-4 paper border-y border-border px-4 py-4 sm:-mx-6 sm:px-6 lg:sticky lg:top-[68px] lg:-mx-10 lg:px-10">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
                    <label className="relative block lg:w-[20rem] lg:shrink-0">
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
                            className="h-12 w-full bg-card pr-11 pl-11 text-[16px] shadow-[var(--shadow-field)] transition-shadow duration-[160ms] placeholder:text-ink-3 focus-visible:shadow-[inset_0_0_0_2px_var(--bt-ink)] focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                aria-label="Clear search"
                                className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center text-ink-3 hover:bg-ink/5 hover:text-ink"
                            >
                                <X aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                        )}
                    </label>

                    <div
                        role="group"
                        aria-label="Filter by collection"
                        className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
                    >
                        {[[ALL, records.length] as const, ...collections].map(([name, count]) => {
                            const on = name === collection;
                            return (
                                <button
                                    key={name}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => setCollection(name)}
                                    className="pressable relative h-10 shrink-0 px-3.5 text-[12px] tracking-[.12em] uppercase"
                                >
                                    {on && (
                                        <motion.span
                                            layoutId="record-filter-pill"
                                            aria-hidden
                                            className="absolute inset-0 bg-ink"
                                            transition={{ type: "spring", duration: 0.34, bounce: 0.14 }}
                                        />
                                    )}
                                    <span
                                        className={`relative whitespace-nowrap ${
                                            on ? "text-white" : "text-ink-2 hover:text-ink"
                                        }`}
                                    >
                                        {name}
                                        <span className={`num ml-1.5 ${on ? "text-white/70" : "text-ink-3"}`}>{count}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
                    <div role="group" aria-label="Filter by colour" className="flex items-center gap-1.5">
                        <span className="label mr-1.5">Colour</span>
                        {colours.map((family) => {
                            const on = colour === family.id;
                            return (
                                <button
                                    key={family.id}
                                    type="button"
                                    aria-pressed={on}
                                    aria-label={`${family.label} (${family.count})`}
                                    title={`${family.label} · ${family.count}`}
                                    onClick={() => setColour(on ? null : family.id)}
                                    className={cn(
                                        "pressable grid h-8 w-8 place-items-center rounded-full",
                                        on
                                            ? "shadow-[0_0_0_2px_var(--surface-page),0_0_0_4px_var(--bt-ink)]"
                                            : "hover:shadow-[0_0_0_2px_var(--surface-page),0_0_0_3px_var(--bt-stone)]",
                                    )}
                                    style={{ background: family.hex }}
                                >
                                    {on && (
                                        <Check
                                            aria-hidden
                                            strokeWidth={2.25}
                                            className={cn(
                                                "h-4 w-4",
                                                family.id === "natural" ? "text-ink" : "text-white",
                                            )}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {issued && (
                        <button
                            type="button"
                            role="switch"
                            aria-checked={openOnly}
                            onClick={() => setOpenOnly((v) => !v)}
                            className="flex items-center gap-2.5 text-[14px] text-ink-2 hover:text-ink"
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    "relative h-5 w-9 rounded-full transition-colors duration-200",
                                    openOnly ? "bg-bt-red" : "bg-stone",
                                )}
                            >
                                <span
                                    className={cn(
                                        "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
                                        openOnly && "translate-x-4",
                                    )}
                                />
                            </span>
                            Only cloths still to claim
                        </button>
                    )}

                    <p
                        aria-live="polite"
                        className="flex items-center gap-3 text-[14px] text-muted-foreground lg:ml-auto"
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
                                Clear
                            </button>
                        )}
                    </p>
                </div>
            </div>

            {shown.length ? (
                <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-7">
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
                <div className="mt-8 px-6 py-16 text-center shadow-[inset_0_0_0_1px_var(--bt-stone-2)]">
                    <p className="display text-[26px]">No cloth matches that.</p>
                    <p className="mx-auto mt-2 max-w-[44ch] text-[15px] text-muted-foreground">
                        Try the cloth&apos;s name, where it was woven, or the code on
                        its label — for example <span className="data text-ink">07/TM</span>.
                    </p>
                    <button
                        type="button"
                        onClick={clear}
                        className="pressable mt-6 inline-flex h-11 items-center bg-ink px-5 text-white hover:bg-ink/88"
                    >
                        Show all cloths
                    </button>
                </div>
            )}
        </div>
    );
}
