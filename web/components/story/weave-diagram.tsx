"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { WeaveKind } from "@/lib/techniques";

const COLS = 16;
const ROWS = 12;
const C = 18; // one cell of the grid
const W = COLS * C;
const H = ROWS * C;

function luminance(hex: string) {
    const n = Number.parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function saturation(hex: string) {
    const n = Number.parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    const max = Math.max(r, g, b);
    return max ? (max - Math.min(r, g, b)) / max : 0;
}

const rgb = (hex: string) => {
    const n = Number.parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const distance = (a: string, b: string) => {
    const [x, y] = [rgb(a), rgb(b)];
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};

/* The cloth's own colours, cast as warp, weft, dye and float: dark against
   light so the interlacing reads, and for the pattern the palette colour
   that stands furthest from the threads it has to show against. */
function castColours(colors: string[], warpFaced: boolean) {
    const fallback = ["#2B3A67", "#E9E2D6", "#AE1800", "#ECA406"];
    const list = colors.length ? colors : fallback;
    const byLight = [...list].sort((a, b) => luminance(a) - luminance(b));
    const warp = byLight[0];
    let weft = byLight[byLight.length - 1];
    if (luminance(weft) - luminance(warp) < 0.22) weft = "#E9E2D6"; // undyed cotton
    const rest = list.filter((c) => c !== warp && c !== weft);
    const standout = (c: string) =>
        (warpFaced ? distance(c, warp) : Math.min(distance(c, warp), distance(c, weft))) * (0.6 + saturation(c));
    const ranked = [...rest].sort((a, b) => standout(b) - standout(a));
    const dye = ranked[0] ?? "#AE1800";
    const extra = ranked[1] ?? ranked[0] ?? "#EC3013";
    return { warp, weft, dye, extra };
}

/* the motif: a diamond in a diamond, the commonest figure in the room */
const motif = (i: number, j: number) => {
    const d = Math.abs(i - 7.5) + Math.abs(j - 5.5);
    return d < 1.8 || (d > 3.6 && d < 5.1);
};
/* ikat's blur: the warp shifts a little on the loom, so the dyed edges drift */
const drift = (i: number) => [0, 0.7, 0, -0.7][i % 4];

const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.085, delayChildren: 0.35 } },
};
const pass: Variants = {
    hidden: { opacity: 0, x: -16 },
    show: { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.23, 1, 0.32, 1] } },
};

/**
 * How this cloth was woven, woven again in front of you, in its own colours.
 *
 * The warp is on the loom from the start — that is how weaving works — and
 * the weft goes in a row at a time, over and under, as the diagram comes
 * into view. Ikat's dye is in the warp before the first row; supplementary
 * floats and embroidery arrive last, on top. A diagram of the structure, not
 * a copy of the cloth's motif: communities decide which motifs are shown.
 */
export function WeaveDiagram({ kind, colors, caption }: { kind: WeaveKind; colors: string[]; caption: string }) {
    const [run, setRun] = useState(0);

    /* Ikat cloths from these islands are warp-faced: the warp is packed
       close and the weft barely shows, which is why the dyed warp reads as
       the pattern. Balanced weaves give both threads the same weight. */
    const warpFaced = kind === "warp-ikat" || kind === "embroidery";
    const WT = warpFaced ? 15 : 13; // warp thickness
    const FT = warpFaced ? 10 : 13; // weft thickness
    const WP = (C - WT) / 2;
    const FP = (C - FT) / 2;
    const T = 13;
    const PAD = (C - T) / 2;
    const { warp, weft, dye, extra } = castColours(colors, warpFaced);

    const warpDyed = (i: number, j: number) =>
        (kind === "warp-ikat" || kind === "embroidery") ? motif(i, j + drift(i)) : kind === "double-ikat" ? motif(i, j) : false;
    const weftDyed = (i: number, j: number) => (kind === "double-ikat" ? motif(i, j) : false);
    /* warp-faced: the weft only shows in the gaps between warp threads */
    const weftOver = (i: number, j: number) => !warpFaced && (i + j) % 2 === 0;
    const warpFill = (i: number, j: number) => (warpDyed(i, j) ? dye : warp);
    const weftFill = (i: number, j: number) => (weftDyed(i, j) ? dye : weft);

    /* what lies on top of the ground, by technique */
    const floats: React.ReactNode[] = [];
    if (kind === "supp-warp") {
        [2, 5, 10, 13].forEach((i, k) => {
            const blocks = k % 2 === 0 ? [[1, 3], [6, 8]] : [[3, 5], [8, 10]];
            blocks.forEach(([a, b]) =>
                floats.push(
                    <rect key={`sw-${i}-${a}`} x={i * C + PAD - 1.5} y={a * C + 2} width={T + 3} height={(b - a + 1) * C - 4} fill={extra} rx={2} />,
                ),
            );
        });
    }
    if (kind === "supp-weft") {
        [2, 5, 8].forEach((j, k) => {
            const blocks = k === 1 ? [[0, 3], [6, 9], [12, 15]] : [[3, 6], [9, 12]];
            blocks.forEach(([a, b]) =>
                floats.push(
                    <rect key={`sf-${j}-${a}`} x={a * C + 2} y={j * C + PAD - 1} width={(b - a + 1) * C - 4} height={T + 2} fill={extra} rx={2} />,
                ),
            );
        });
    }
    if (kind === "embroidery") {
        for (let i = 1; i < COLS; i += 2) {
            for (let j = 1; j < ROWS; j += 2) {
                const d = Math.abs(i - 7.5) + Math.abs(j - 5.5);
                if (d > 2.4 && d < 3.6) {
                    const cx = i * C + C / 2;
                    const cy = j * C + C / 2;
                    floats.push(
                        <g key={`x-${i}-${j}`} stroke={extra} strokeWidth={3} strokeLinecap="round">
                            <line x1={cx - 6} y1={cy - 6} x2={cx + 6} y2={cy + 6} />
                            <line x1={cx + 6} y1={cy - 6} x2={cx - 6} y2={cy + 6} />
                        </g>,
                    );
                }
            }
        }
    }

    const showsDye = kind === "warp-ikat" || kind === "double-ikat" || kind === "embroidery";
    const showsExtra = kind === "supp-warp" || kind === "supp-weft" || kind === "embroidery";

    return (
        <figure>
            <div className="bg-[#1a1918] p-4 sm:p-6" data-theme="dark">
                <motion.svg
                    key={run}
                    viewBox={`0 0 ${W} ${H}`}
                    role="img"
                    aria-label={caption}
                    className="block h-auto w-full"
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "0px 0px -20% 0px" }}
                    variants={container}
                >
                    {/* the warp, set on the loom first */}
                    <g>
                        {Array.from({ length: COLS }, (_, i) =>
                            Array.from({ length: ROWS }, (_, j) => (
                                <rect key={`w-${i}-${j}`} x={i * C + WP} y={j * C} width={WT} height={C + 0.6} fill={warpFill(i, j)} />
                            )),
                        )}
                    </g>
                    {/* the weft, a row at a time: over, under, over */}
                    {Array.from({ length: ROWS }, (_, j) => (
                        <motion.g key={`row-${j}`} variants={pass} className="story-motion">
                            {Array.from({ length: COLS }, (_, i) => (
                                <rect key={`f-${i}`} x={i * C} y={j * C + FP} width={C + 0.6} height={FT} fill={weftFill(i, j)} />
                            ))}
                            {Array.from({ length: COLS }, (_, i) =>
                                weftOver(i, j) ? null : (
                                    <rect key={`p-${i}`} x={i * C + WP} y={j * C + FP - 0.5} width={WT} height={FT + 1} fill={warpFill(i, j)} />
                                ),
                            )}
                        </motion.g>
                    ))}
                    {floats.length > 0 && (
                        <motion.g variants={pass} className="story-motion">
                            {floats}
                        </motion.g>
                    )}
                </motion.svg>
            </div>
            <figcaption className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <p className="max-w-[44ch] text-[14px] leading-relaxed text-muted-foreground">{caption}</p>
                <button
                    type="button"
                    onClick={() => setRun((r) => r + 1)}
                    className="pressable inline-flex shrink-0 items-center gap-2 px-3 py-2 text-[13px] text-ink shadow-[inset_0_0_0_1px_var(--bt-stone)] hover:bg-ink hover:text-white hover:shadow-none"
                >
                    <RotateCcw aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Weave it again
                </button>
            </figcaption>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px] tracking-[.12em] text-ink-2 uppercase">
                <Legend colour={warp} label="Warp" />
                <Legend colour={weft} label="Weft" />
                {showsDye && <Legend colour={dye} label="Dyed before weaving" />}
                {showsExtra && <Legend colour={extra} label={kind === "embroidery" ? "Embroidery" : "Supplementary thread"} />}
            </ul>
        </figure>
    );
}

function Legend({ colour, label }: { colour: string; label: string }) {
    return (
        <li className="flex items-center gap-2">
            <span aria-hidden className="h-3.5 w-3.5 shadow-[inset_0_0_0_1px_rgba(32,30,29,.15)]" style={{ background: colour }} />
            {label}
        </li>
    );
}
