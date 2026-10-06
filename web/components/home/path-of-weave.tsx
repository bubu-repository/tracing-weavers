"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { t } from "@/lib/copy";

/**
 * The programme's seven stages, as cards you swipe through.
 *
 * Each stage gets a whole card — its number set large, its name, one line —
 * because a stage is a chapter of the programme, not a dot on a line. The
 * track scrolls natively (snap points, momentum, trackpads, keyboard), and
 * the arrows only move it.
 */
export function PathOfWeave() {
    const track = useRef<HTMLOListElement | null>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    function onScroll() {
        const el = track.current;
        if (!el) return;
        setAtStart(el.scrollLeft < 8);
        setAtEnd(el.scrollLeft + el.clientWidth > el.scrollWidth - 8);
    }

    function nudge(direction: 1 | -1) {
        const el = track.current;
        if (!el) return;
        const card = el.querySelector("li");
        const step = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
        el.scrollBy({ left: step * direction, behavior: "smooth" });
    }

    return (
        <div>
            <ol
                ref={track}
                onScroll={onScroll}
                aria-label="The seven stages"
                className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-pl-6 sm:px-6 lg:-mx-10 lg:scroll-pl-10 lg:px-10"
            >
                {t.steps.map((step, i) => (
                    <li
                        key={step.id}
                        className="flex min-h-[19rem] w-[78%] shrink-0 snap-start flex-col justify-between border border-white/16 p-6 sm:w-[46%] sm:p-7 lg:w-[31%] xl:w-[23.5%]"
                    >
                        <span className="numeral text-[88px] text-salmon sm:text-[104px]">
                            {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                            <h3 className="text-[30px] text-white sm:text-[34px]">{step.id_label}</h3>
                            <p className="mt-2 text-[16px] leading-snug text-white/68">{step.note}</p>
                        </div>
                    </li>
                ))}
            </ol>

            <div className="mt-5 flex items-center justify-between gap-4">
                <p className="text-[14px] text-white/50">
                    Swipe through the three-year path
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => nudge(-1)}
                        disabled={atStart}
                        aria-label="Previous stage"
                        className="pressable grid h-11 w-11 place-items-center text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.3)] hover:bg-white hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
                    >
                        <ArrowLeft aria-hidden className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                    <button
                        type="button"
                        onClick={() => nudge(1)}
                        disabled={atEnd}
                        aria-label="Next stage"
                        className="pressable grid h-11 w-11 place-items-center text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.3)] hover:bg-white hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
                    >
                        <ArrowRight aria-hidden className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                </div>
            </div>
        </div>
    );
}
