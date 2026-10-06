"use client";

import { motion } from "framer-motion";
import { useBookNav } from "@/components/passport/passport-book";
import { BrandMark } from "@/components/motif/brand-mark";

export type CoverBand = { colors: { hex: string; share: number }[] };

const COTTON = "#E6DDCD";
const ROWS = 72;

/* The weft, row by row: each cloth held lays down its own colours (as many
   rows of each as the share of the cloth it covers), a pick of undyed
   cotton between cloths, and the sequence repeats until the cover is full —
   so a book of three cloths is woven in three cloths' colours, and the next
   claim weaves a new band into it. */
function weft(bands: CoverBand[]): string[] {
    const unit: string[] = [];
    for (const band of bands) {
        for (const c of band.colors.slice(0, 5)) {
            const n = Math.max(1, Math.round(c.share * 9));
            for (let k = 0; k < n; k++) unit.push(c.hex);
        }
        unit.push(COTTON, COTTON);
    }
    if (!unit.length) unit.push("#B1241A", COTTON, "#2F4479", COTTON);
    return Array.from({ length: ROWS }, (_, i) => unit[i % unit.length]);
}

/**
 * The cover, bound in the holder's own cloth: woven, row by row, from the
 * measured colours of every cloth they hold, with a label sewn on and the
 * spine stab-bound in red thread. It weaves itself in the first time it is
 * seen.
 */
export function WovenCover({
    holder,
    count,
    bands,
    specimen = false,
}: {
    holder: string;
    count: number;
    bands: CoverBand[];
    specimen?: boolean;
}) {
    const rows = weft(bands);
    return (
        <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: COTTON }}>
            <div className="absolute inset-0 flex flex-col">
                {rows.map((hex, i) => (
                    <motion.div
                        key={i}
                        className="min-h-0 flex-1"
                        style={{
                            backgroundColor: hex,
                            backgroundImage:
                                "repeating-linear-gradient(90deg, rgba(0,0,0,.26) 0 1.5px, rgba(0,0,0,0) 1.5px 5px), linear-gradient(180deg, rgba(255,255,255,.16), rgba(0,0,0,0) 45%, rgba(0,0,0,.24))",
                            backgroundPosition: i % 2 ? "2.5px 0, 0 0" : "0 0, 0 0",
                            transformOrigin: i % 2 ? "100% 50%" : "0% 50%",
                        }}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.45, delay: 0.15 + i * 0.018, ease: [0.23, 1, 0.32, 1] }}
                    />
                ))}
            </div>
            {/* the warp, standing through the weft */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(240,234,223,.13) 0 1px, transparent 1px 5px)" }}
            />
            {/* the turned-in edge of the cloth over the board */}
            <div aria-hidden className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_6px_rgba(0,0,0,.12),inset_0_0_24px_rgba(0,0,0,.25)]" />
            {/* stab binding: five holes along the spine, red thread through them */}
            <svg aria-hidden viewBox="0 0 28 400" preserveAspectRatio="none" className="pointer-events-none absolute inset-y-0 left-0 h-full w-7">
                <line x1="14" y1="0" x2="14" y2="400" stroke="rgba(0,0,0,.25)" strokeWidth="1" />
                {[50, 125, 200, 275, 350].map((y) => (
                    <g key={y}>
                        <path d={`M0 ${y} H14`} stroke="#AE1800" strokeWidth="2.4" strokeLinecap="round" />
                        <circle cx="14" cy={y} r="2.6" fill="#201E1D" />
                    </g>
                ))}
                <path d="M14 50 V350" stroke="#AE1800" strokeWidth="2.4" opacity=".9" />
            </svg>

            {/* the label sewn on the cover */}
            <div className="absolute top-[30%] left-1/2 w-[70%] -translate-x-1/2 bg-[#F8F3E9] px-4 py-4 shadow-[0_2px_4px_rgba(0,0,0,.3),0_10px_18px_-8px_rgba(0,0,0,.45)] sm:px-5 sm:py-5">
                <div aria-hidden className="absolute inset-1.5 border border-dashed border-bt-red/60" />
                <div className="relative">
                    <div className="flex items-center justify-between gap-2">
                        <span className="eyebrow text-[11px]">Book of traces</span>
                        <BrandMark tone="paper" className="h-5 w-5" />
                    </div>
                    <p className="display mt-2 text-[clamp(1.25rem,3.6vw,1.75rem)] leading-[1.02] text-ink">{holder}</p>
                    <p className="mt-2 text-[13px] text-ink-2">
                        <span className="numeral text-[22px] text-bt-red">{count}</span>{" "}
                        {count === 1 ? "cloth" : "cloths"}, woven into its cover
                    </p>
                </div>
            </div>
            <p className="absolute right-0 bottom-4 left-0 text-center">
                <span className="bg-[#F8F3E9]/90 px-2 py-1 text-[11px] tracking-[.16em] text-ink uppercase">
                    {specimen ? "A sample · drag to open" : "Drag the page to open it"}
                </span>
            </p>
        </div>
    );
}

export type RegisterEntry = { pageId: string; number: string; name: string; date: string; color: string };

/**
 * The register: the book's own ledger, ruled like the registrar's, with the
 * entries written in by hand. Each entry turns the book to its page.
 */
export function BookRegister({ entries, total }: { entries: RegisterEntry[]; total: number }) {
    const nav = useBookNav();
    return (
        <div
            className="flex h-full w-full flex-col p-5 sm:p-6"
            style={{
                backgroundColor: "#F6F1E6",
                backgroundImage:
                    "linear-gradient(90deg, transparent 34px, rgba(174,24,0,.32) 34px 35.5px, transparent 35.5px), repeating-linear-gradient(180deg, transparent 0 33px, rgba(43,58,103,.17) 33px 34px)",
                backgroundPosition: "0 0, 0 52px",
            }}
        >
            <div className="flex items-baseline justify-between gap-3">
                <span className="eyebrow">Register</span>
                <span className="data text-[11px] text-ink-3">{total} bound in</span>
            </div>
            <ol className="mt-3 min-h-0 flex-1 overflow-hidden">
                {entries.slice(0, 9).map((entry) => (
                    <li key={entry.pageId} className="h-[34px]">
                        <button
                            type="button"
                            onClick={() => nav?.toPage(entry.pageId)}
                            className="group flex h-full w-full items-center gap-2.5 text-left"
                        >
                            <span aria-hidden className="h-3 w-3 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.2)]" style={{ backgroundColor: entry.color }} />
                            <span className="numeral w-6 shrink-0 text-[17px] text-bt-red">{entry.number}</span>
                            <span className="min-w-0 flex-1 truncate font-script text-[21px] leading-none text-ink group-hover:text-bt-red">
                                {entry.name}
                            </span>
                            <span className="data shrink-0 text-[10.5px] text-ink-3">{entry.date}</span>
                        </button>
                    </li>
                ))}
            </ol>
            <p className="mt-2 text-[12.5px] leading-snug text-ink-2">Tap an entry to turn to its page.</p>
        </div>
    );
}

/** The inside of the boards: a sheet of indigo-dyed cotton, plain weave. */
export function IndigoEndpaper({ children }: { children?: React.ReactNode }) {
    return (
        <div
            data-theme="dark"
            className="relative flex h-full w-full flex-col justify-between p-6 text-[#EEE7DA] sm:p-7"
            style={{
                backgroundColor: "#27355F",
                backgroundImage:
                    "repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, rgba(0,0,0,.12) 0 1px, transparent 1px 3px), radial-gradient(120% 80% at 30% 20%, rgba(255,255,255,.08), transparent 60%)",
            }}
        >
            {children}
        </div>
    );
}
