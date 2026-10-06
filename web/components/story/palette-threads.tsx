"use client";

import { motion } from "framer-motion";

/**
 * The cloth's colours as threads hanging from a bar, each as long as the
 * share of the cloth it covers. They drop into place as the chapter is
 * reached; the numbers underneath are the measurements.
 */
export function PaletteThreads({ colors }: { colors: { hex: string; share: number }[] }) {
    if (!colors.length) return null;
    const max = Math.max(...colors.map((c) => c.share));
    return (
        <figure>
            <div className="border-t-4 border-ink" />
            <div className="flex h-[260px] items-start gap-3 sm:h-[320px] sm:gap-5">
                {colors.map((color, i) => (
                    <div key={color.hex} className="flex h-full flex-1 flex-col">
                        <motion.span
                            aria-hidden
                            className="story-motion block w-full origin-top"
                            style={{ background: color.hex, height: `${Math.max((color.share / max) * 100, 12)}%` }}
                            initial={{ scaleY: 0 }}
                            whileInView={{ scaleY: 1 }}
                            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                            transition={{ duration: 1, delay: 0.15 + i * 0.12, ease: [0.23, 1, 0.32, 1] }}
                        />
                        <span className="data mt-2 text-[10px] text-ink-2 sm:text-[11px]">{color.hex}</span>
                        <span className="num text-[13px] text-ink">{Math.round(color.share * 100)}%</span>
                    </div>
                ))}
            </div>
        </figure>
    );
}
