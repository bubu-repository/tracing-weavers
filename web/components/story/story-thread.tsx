"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/* One long warp thread with a gentle weave in it: seven turns over the
   height of the story, stretched to whatever height the story has. */
const WAVE = (() => {
    const turns = 14;
    const step = 1000 / turns;
    let d = "M12 0";
    for (let i = 0; i < turns; i++) {
        const y0 = i * step;
        const side = i % 2 === 0 ? 20 : 4;
        d += ` C${side} ${y0 + step * 0.33}, ${side} ${y0 + step * 0.66}, 12 ${y0 + step}`;
    }
    return d;
})();

/**
 * The red thread the story is told along.
 *
 * It runs down the left edge of the page column through every chapter and
 * draws itself as you read (scroll-linked, sprung so it never jitters), with
 * a needle at its tip. On a phone the column has no margin to hold it, so it
 * is a desk-only device — the chapters read the same without it. Reduced
 * motion shows it whole.
 */
export function StoryThread({ children, className }: { children: React.ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 55%", "end 70%"] });
    const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.0005 });
    const needleTop = useTransform(progress, (v) => `${Math.min(Math.max(v, 0), 1) * 100}%`);

    return (
        <div ref={ref} className={cn("relative", className)}>
            <div
                aria-hidden
                className="story-thread-x pointer-events-none absolute top-0 bottom-0 z-20 hidden w-6 -translate-x-1/2 lg:block"
            >
                <svg viewBox="0 0 24 1000" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                    <path d={WAVE} fill="none" stroke="rgba(123,123,123,.28)" strokeWidth="1.25" strokeDasharray="6 6" />
                    <motion.path
                        d={WAVE}
                        fill="none"
                        stroke="#EC3013"
                        strokeWidth="2.25"
                        className="story-motion"
                        style={{ pathLength: progress }}
                    />
                </svg>
                <motion.span
                    className="story-motion story-needle absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bt-red-bright shadow-[0_0_0_4px_rgba(236,48,19,.18)]"
                    style={{ top: needleTop }}
                />
            </div>
            {children}
        </div>
    );
}

/**
 * A chapter of the story: a full-width section with its knot on the thread.
 * The knot fills in as the chapter reaches the middle of the screen.
 */
export function Chapter({
    id,
    children,
    className,
    tone = "paper",
}: {
    id: string;
    children: React.ReactNode;
    className?: string;
    tone?: "paper" | "ink";
}) {
    const ink = tone === "ink";
    return (
        <section
            id={id}
            data-chapter
            className={cn("relative scroll-mt-16", ink && "grain gallery-light bg-ink text-white", className)}
            data-theme={ink ? "dark" : undefined}
        >
            <motion.span
                aria-hidden
                className="story-thread-x absolute top-[7.25rem] z-30 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-bt-red-bright lg:block"
                initial={{ backgroundColor: ink ? "rgba(32,30,29,1)" : "rgba(243,242,242,1)", scale: 0.8 }}
                whileInView={{ backgroundColor: "rgba(236,48,19,1)", scale: 1 }}
                viewport={{ margin: "-45% 0px -45% 0px" }}
                transition={{ duration: 0.35 }}
            />
            {children}
        </section>
    );
}

/** The opening of a chapter: its numeral, its kicker, its title, its lead. */
export function ChapterHead({
    numeral,
    kicker,
    title,
    lead,
    tone = "paper",
    className,
}: {
    numeral: string;
    kicker: string;
    title: React.ReactNode;
    lead?: React.ReactNode;
    tone?: "paper" | "ink";
    className?: string;
}) {
    const ink = tone === "ink";
    return (
        <header className={className}>
            <div className="flex items-end gap-4">
                <span
                    aria-hidden
                    className={cn("numeral text-[clamp(3.6rem,8vw,6.25rem)]", ink ? "text-salmon/35" : "text-bt-red/25")}
                >
                    {numeral}
                </span>
                <span className="eyebrow pb-2.5 sm:pb-4">{kicker}</span>
            </div>
            <h2 className={cn("mt-2 max-w-[18ch] text-[clamp(2.4rem,6.5vw,4.75rem)] leading-[.92]", ink && "text-white")}>
                {title}
            </h2>
            {lead && (
                <p
                    className={cn(
                        "read mt-5 max-w-[50ch] text-[17px] leading-relaxed sm:text-[19px]",
                        ink ? "text-white/70" : "text-muted-foreground",
                    )}
                >
                    {lead}
                </p>
            )}
        </header>
    );
}
