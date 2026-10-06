"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { t } from "@/lib/copy";
import { cn } from "@/lib/utils";

/**
 * The programme's seven stages, as a rail you drag along — not a dropdown.
 *
 * The old shape was a disclosure ("See the seven stages") that opened a
 * two-column list: it pushed the page down, and on a wide screen it left the
 * column beside it empty. A rail fixes both at once — it is always open, it is
 * one line tall, it scrolls sideways on a phone instead of downward, and the
 * note for the selected stage lands in a slot of fixed height so nothing below
 * it ever moves.
 *
 * The thread is not an absolutely positioned line over the stages: each stage
 * draws its own segment of it and hangs its dot in the middle of that segment,
 * so the dots sit ON the thread by construction. (Drawn the other way, a line
 * at a hand-picked offset, they missed it by nine pixels.) The segment left of
 * a reached stage is dyed morinda, which is what makes the rail read as
 * progress rather than as a row of buttons.
 *
 * `activeStep` is where this particular record sits (its "Journey step"), and
 * that stage is the one selected on arrival: the rail is data, not decoration.
 *
 * Operation is the tab pattern — one Tab stop, arrows to move, Home/End for
 * the ends — because seven buttons in a row should not be seven Tab stops.
 */
export function JourneyRail({
    activeStep,
    tone = "light",
    autoPlay = false,
    className,
}: {
    activeStep?: string;
    tone?: "light" | "ink";
    /** Advance through all seven stages on a loop, one every 3s.  For the
        home page where no single stage is "this record" — it shows the
        journey moving. */
    autoPlay?: boolean;
    className?: string;
}) {
    const steps = t.steps;
    const n = steps.length;
    const norm = (value: string) => value.trim().toLowerCase();
    const here = steps.findIndex((s) => norm(s.id) === norm(activeStep ?? ""));

    const [index, setIndex] = useState(here < 0 ? 0 : here);
    const reduce = useReducedMotion();
    const nodes = useRef<(HTMLSpanElement | null)[]>([]);
    const rail = useRef<HTMLDivElement | null>(null);
    const ink = tone === "ink";
    /* The first note is in the server HTML as it is; only later changes fade
       in, so nothing is invisible before hydration. */
    const [moved, setMoved] = useState(false);
    const select = (next: number | ((prev: number) => number)) => {
        setMoved(true);
        setIndex(next);
    };

    /* Keep the selected stage in view on a phone, where the rail scrolls
       sideways. This scrolls the rail itself, never the page: the old
       `scrollIntoView` could tug the whole page while it auto-played, and in
       auto-play it had no node to scroll to, so Hub and Flourish lit up off
       screen. */
    useEffect(() => {
        const box = rail.current;
        const node = nodes.current[index];
        if (!box || !node || box.scrollWidth <= box.clientWidth) return;
        const left = node.offsetLeft - (box.clientWidth - node.offsetWidth) / 2;
        box.scrollTo({ left: Math.max(left, 0), behavior: reduce ? "auto" : "smooth" });
    }, [index, reduce]);

    /* Auto-play: walk through all seven stages, one every 2.5 seconds.
       No pause, no click — purely decorative, the journey tells itself. */
    useEffect(() => {
        if (!autoPlay || reduce) return;
        const timer = setInterval(() => {
            setMoved(true);
            setIndex((prev) => (prev + 1) % n);
        }, 2500);
        return () => clearInterval(timer);
    }, [autoPlay, reduce, n]);

    function move(to: number) {
        const next = (to + n) % n;
        select(next);
        nodes.current[next]?.focus();
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        const keys: Record<string, number> = {
            ArrowRight: index + 1,
            ArrowDown: index + 1,
            ArrowLeft: index - 1,
            ArrowUp: index - 1,
            Home: 0,
            End: n - 1,
        };
        if (!(event.key in keys)) return;
        event.preventDefault();
        move(keys[event.key]);
    }

    const step = steps[index];
    const thread = (dyed: boolean) =>
        dyed
            ? ink
                ? "bg-salmon"
                : "bg-bt-red"
            : ink
              ? "bg-white/20"
              : "bg-border";

    return (
        <div className={className}>
            <div
                role="tablist"
                aria-label="The seven stages"
                onKeyDown={onKeyDown}
                /* items-start, and every warp thread the same height: with the
                   items centred, the stage carrying the extra "this record"
                   line sat five pixels above the rest and broke the thread. */
                ref={rail}
                className="-mx-4 flex snap-x snap-mandatory flex-nowrap items-start overflow-x-auto px-4 pt-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
            >
                {steps.map((s, i) => {
                    const on = i === index;
                    const reached = i <= index;
                    const isRecord = i === here;
                    return (
                        <span
                            key={s.id}
                            ref={(el) => {
                                nodes.current[i] = el;
                            }}
                            role={autoPlay ? "presentation" : "tab"}
                            aria-selected={autoPlay ? undefined : on}
                            tabIndex={autoPlay ? undefined : on ? 0 : -1}
                            onClick={autoPlay ? undefined : () => select(i)}
                            /* flex-1 from sm up so the thread spans the full
                               width of the section instead of stopping short. */
                            className="group/step relative shrink-0 snap-center px-3 pb-2 text-center sm:flex-1 outline-none"
                        >
                            {/* the warp thread of this stage, heavier once reached */}
                            <span
                                aria-hidden
                                className={cn(
                                    "mx-auto block h-3.5 w-px transition-colors duration-[200ms]",
                                    thread(reached),
                                    on ? "opacity-100" : "opacity-70",
                                )}
                            />

                            {/* this stage's length of the weft, and its dot */}
                            {/* -mx-3 so the segment covers the button's padding
                                too: at w-full it stopped at the text and the
                                thread came out broken between stages. */}
                            <span
                                aria-hidden
                                className="relative -mx-3 flex h-px w-[calc(100%+1.5rem)]"
                            >
                                <span
                                    className={cn(
                                        "h-px w-1/2 transition-colors duration-[200ms]",
                                        thread(reached),
                                    )}
                                />
                                <span
                                    className={cn(
                                        "h-px w-1/2 transition-colors duration-[200ms]",
                                        thread(i < index),
                                    )}
                                />
                                <span
                                    className={cn(
                                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,height,background-color] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
                                        on ? "h-4 w-4" : "h-3 w-3",
                                        reached
                                            ? on
                                                ? ink
                                                    ? "bg-salmon"
                                                    : "bg-bt-red"
                                                : ink
                                                  ? "bg-salmon/60"
                                                  : "bg-bt-red/55"
                                            : ink
                                              ? "bg-white/30"
                                              : "bg-stone",
                                    )}
                                />
                            </span>

                            <span
                                className={cn(
                                    "mt-3 block text-[11px] tracking-[.14em] whitespace-nowrap uppercase transition-colors duration-[160ms]",
                                    on
                                        ? ink
                                            ? "text-white"
                                            : "text-ink"
                                        : ink
                                          ? "text-white/45"
                                          : "text-ink-3",
                                    ink
                                        ? "[@media(hover:hover)]:group-hover/step:text-white/80"
                                        : "[@media(hover:hover)]:group-hover/step:text-ink",
                                )}
                            >
                                {s.id_label}
                            </span>

                            {isRecord && (
                                <span
                                    className={cn(
                                        "data mt-1 block text-[9px] leading-none tracking-[.12em] whitespace-nowrap",
                                        ink ? "text-salmon" : "text-bt-red",
                                    )}
                                >
                                    this record
                                </span>
                            )}
                        </span>
                    );
                })}
            </div>

            {/* the note, in a slot of its own height: the page never reflows */}
            <div
                className={cn(
                    "mt-3 flex min-h-[4rem] items-start gap-3 border-t pt-3 sm:min-h-[3.5rem]",
                    ink ? "border-white/18" : "border-border",
                )}
            >
                <span
                    className={cn(
                        "data w-6 shrink-0 pt-[3px]",
                        ink ? "text-salmon" : "text-bt-red",
                    )}
                >
                    {"0" + (index + 1)}
                </span>
                <motion.p
                    key={step.id}
                    aria-live={autoPlay ? "off" : "polite"}
                    initial={moved ? { opacity: 0, y: 4 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className={cn(
                        "max-w-[48ch] text-[15px] leading-snug",
                        ink ? "text-white/72" : "text-muted-foreground",
                    )}
                >
                    <span className={ink ? "text-white" : "text-ink"}>
                        {step.id_label}.
                    </span>{" "}
                    {step.note}
                </motion.p>
            </div>
        </div>
    );
}
