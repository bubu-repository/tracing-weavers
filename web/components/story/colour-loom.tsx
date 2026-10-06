"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type LoomThread = {
    code: string;
    number: string;
    name: string;
    origin: string;
    swatch: string;
    colors: { hex: string; share: number }[];
    /** hue of the cloth's leading colour, for sorting by colour */
    hue: number;
    /** lightness, to order the greys and browns among themselves */
    lightness: number;
};

type Order = "catalogue" | "colour";

/**
 * Chapter III: the collection as one loom.
 *
 * Every cloth is a warp thread made of its own colours, each as long as the
 * share of the cloth it covers — measured from the photograph. Point at a
 * thread (or tap it) and the cloth steps forward; tap again, or follow the
 * link, to open its record. "By colour" re-threads the loom so the reds lie
 * with the reds and the indigos with the indigos, and the collection reads as
 * a single woven palette.
 */
export function ColourLoom({ threads }: { threads: LoomThread[] }) {
    const router = useRouter();
    const [order, setOrder] = useState<Order>("catalogue");
    const [active, setActive] = useState<string | null>(null);
    /* focus that a pointer caused is not a keyboard visit */
    const pointerDown = useRef(false);

    const sorted =
        order === "catalogue"
            ? threads
            : [...threads].sort((a, b) => a.hue - b.hue || a.lightness - b.lightness);
    const current = threads.find((thread) => thread.code === active) ?? null;
    const colourCount = threads.reduce((n, thread) => n + thread.colors.length, 0);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-[14px] text-muted-foreground">
                    <span className="num text-ink">{threads.length}</span> cloths ·{" "}
                    <span className="num text-ink">{colourCount}</span> measured colours
                </p>
                <div role="group" aria-label="Order the threads" className="flex items-center gap-1 bg-muted p-1">
                    {(
                        [
                            ["catalogue", "As catalogued"],
                            ["colour", "By colour"],
                        ] as const
                    ).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={order === value}
                            onClick={() => setOrder(value)}
                            className="pressable relative h-9 px-3.5 text-[13px] tracking-[.06em]"
                        >
                            {order === value && (
                                <motion.span
                                    layoutId="loom-order"
                                    aria-hidden
                                    className="absolute inset-0 bg-ink"
                                    transition={{ type: "spring", duration: 0.32, bounce: 0.12 }}
                                />
                            )}
                            <span className={cn("relative", order === value ? "text-white" : "text-ink-2")}>
                                {label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* the loom */}
            <div
                role="group"
                aria-label="One thread per cloth"
                onPointerLeave={(e) => {
                    if (e.pointerType === "mouse") setActive(null);
                }}
                className="mt-6 flex h-[280px] items-stretch gap-[3px] sm:h-[400px] sm:gap-1.5"
            >
                {sorted.map((thread, i) => {
                    const on = thread.code === active;
                    return (
                        <motion.button
                            key={thread.code}
                            layout="position"
                            type="button"
                            aria-label={`${thread.number} · ${thread.name}, ${thread.origin}`}
                            aria-pressed={on}
                            /* a mouse previews on hover; a finger previews on the
                               first tap and opens on the second — a touch also
                               fires a synthetic hover, which must not count */
                            onPointerEnter={(e) => {
                                if (e.pointerType === "mouse") setActive(thread.code);
                            }}
                            onPointerDown={() => {
                                pointerDown.current = true;
                            }}
                            onFocus={() => {
                                if (!pointerDown.current) setActive(thread.code);
                                pointerDown.current = false;
                            }}
                            onClick={() =>
                                on
                                    ? router.push(`/record/${encodeURIComponent(thread.code)}`)
                                    : setActive(thread.code)
                            }
                            initial={{ scaleY: 0 }}
                            whileInView={{ scaleY: 1 }}
                            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                            transition={{
                                scaleY: { duration: 0.9, delay: i * 0.03, ease: [0.23, 1, 0.32, 1] },
                                layout: { type: "spring", duration: 0.7, bounce: 0.15 },
                            }}
                            className={cn(
                                "story-motion relative flex min-w-0 origin-top flex-col overflow-hidden transition-[flex-grow,box-shadow] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none",
                                on
                                    ? "shadow-[0_0_0_2px_var(--bt-ink)]"
                                    : active
                                      ? "opacity-70"
                                      : "",
                            )}
                            style={{ flexGrow: on ? 6 : 1, flexBasis: 0 }}
                        >
                            {thread.colors.map((color) => (
                                <span
                                    key={color.hex}
                                    className="block w-full"
                                    style={{ background: color.hex, flexGrow: Math.max(color.share, 0.04) }}
                                />
                            ))}
                        </motion.button>
                    );
                })}
            </div>

            {/* the cloth that stepped forward */}
            <div className="mt-6 min-h-[7.5rem] border-t border-ink pt-5" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                    {current ? (
                        <motion.div
                            key={current.code}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.22 }}
                            className="flex items-center gap-5"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={current.swatch} alt="" className="h-20 w-20 shrink-0 object-cover sm:h-24 sm:w-24" />
                            <div className="min-w-0">
                                <div className="flex items-baseline gap-3">
                                    <span className="numeral text-[40px] text-bt-red">{current.number}</span>
                                    <span className="data text-ink-2">{current.code}</span>
                                </div>
                                <p className="display truncate text-[clamp(1.4rem,4vw,2rem)] leading-tight">{current.name}</p>
                                <p className="text-[14px] text-muted-foreground">{current.origin}</p>
                            </div>
                            <Link
                                href={`/record/${encodeURIComponent(current.code)}`}
                                className="ml-auto hidden shrink-0 items-center gap-2 bg-ink px-5 py-3 text-[15px] text-white hover:bg-bt-red hover:text-white sm:inline-flex"
                            >
                                Open the record <span aria-hidden>→</span>
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[16px] text-muted-foreground"
                        >
                            Point at a thread — or tap one — to meet its cloth. Tap it again to open
                            the record.
                        </motion.p>
                    )}
                </AnimatePresence>
                {current && (
                    <Link
                        href={`/record/${encodeURIComponent(current.code)}`}
                        className="mt-4 inline-flex items-center gap-2 bg-ink px-5 py-3 text-[15px] text-white hover:bg-bt-red hover:text-white sm:hidden"
                    >
                        Open the record <span aria-hidden>→</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
