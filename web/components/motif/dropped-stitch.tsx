"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const STEP = 26;
const DASH = 16;
const COUNT = 20;
const GAP = 9; // the stitch that was dropped

/**
 * The 404's dropped stitch, there to be picked up: a running stitch with one
 * missing and its thread hanging loose. Tap the gap and the needle goes back
 * through, the stitch closes, and the code box is handed to you — which is
 * what you came here needing anyway.
 */
export function DroppedStitch({ focusId = "label-code" }: { focusId?: string }) {
    const [mended, setMended] = useState(false);

    function mend() {
        if (mended) return;
        setMended(true);
        window.setTimeout(() => document.getElementById(focusId)?.focus({ preventScroll: true }), 1100);
    }

    const gapX = GAP * STEP;

    return (
        <div className="mt-6">
            <div className="relative w-full max-w-[520px]">
                <svg viewBox={`0 0 ${COUNT * STEP} 64`} className="block h-auto w-full overflow-visible" aria-hidden>
                    {Array.from({ length: COUNT }, (_, i) =>
                        i === GAP ? null : (
                            <line key={i} x1={i * STEP} y1="30" x2={i * STEP + DASH} y2="30" stroke="var(--bt-red)" strokeWidth="3" strokeLinecap="round" />
                        ),
                    )}
                    {/* the loose end */}
                    <motion.path
                        d={`M${gapX - STEP + DASH} 30 C ${gapX + 2} 42, ${gapX - 10} 52, ${gapX - 2} 62`}
                        fill="none"
                        stroke="var(--bt-red)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        initial={false}
                        animate={mended ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    />
                    {/* the stitch, picked up */}
                    <motion.line
                        x1={gapX}
                        y1="30"
                        x2={gapX + DASH}
                        y2="30"
                        stroke="var(--bt-red)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={false}
                        animate={mended ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                        transition={{ duration: 0.45, delay: mended ? 0.55 : 0 }}
                    />
                    {/* the needle, going back through */}
                    <motion.g
                        initial={false}
                        animate={
                            mended
                                ? { x: [0, -48, -70, -54], y: [0, -14, 8, -6], rotate: [0, -20, 18, 0], opacity: [1, 1, 1, 0] }
                                : { x: 0, y: 0, rotate: 0, opacity: 1 }
                        }
                        transition={{ duration: 1.1, ease: "easeInOut" }}
                    >
                        <line x1={gapX + 60} y1="18" x2={gapX + 86} y2="8" stroke="#8C877F" strokeWidth="2.2" strokeLinecap="round" />
                        <ellipse cx={gapX + 83} cy="9.2" rx="2.4" ry="1.2" fill="none" stroke="#8C877F" strokeWidth="1.2" transform={`rotate(-21 ${gapX + 83} 9.2)`} />
                    </motion.g>
                </svg>
                {!mended && (
                    <button
                        type="button"
                        onClick={mend}
                        aria-label="Pick up the dropped stitch"
                        className="group absolute top-0 h-full -translate-x-1/2"
                        style={{ left: `${((gapX + DASH / 2) / (COUNT * STEP)) * 100}%`, width: "18%" }}
                    >
                        <span className="note absolute top-full left-1/2 mt-1 -translate-x-1/2 text-[20px] whitespace-nowrap text-bt-red transition-transform group-hover:translate-y-0.5">
                            tap to pick it up
                        </span>
                    </button>
                )}
            </div>
            <p aria-live="polite" className="read mt-9 min-h-[1.6em] text-[17px] text-ink-2">
                {mended ? "Picked up. Now — the cloth you were looking for:" : ""}
            </p>
        </div>
    );
}
