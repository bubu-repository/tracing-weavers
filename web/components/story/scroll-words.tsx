"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A sentence you read by scrolling: each word comes out of the page as the
 * line passes the middle of the screen, so the reading pace is yours. The
 * whole sentence is in the markup (and read whole to a screen reader), only its
 * ink is tied to the scroll; reduced motion shows it all at once.
 */
export function ScrollWords({
    text,
    className,
    accent = [],
    accentClass = "text-bt-red",
}: {
    text: string;
    className?: string;
    /** words (as written) to set in the accent colour */
    accent?: string[];
    /** morinda on paper, salmon on ink */
    accentClass?: string;
}) {
    const ref = useRef<HTMLParagraphElement | null>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 82%", "end 42%"] });
    const words = text.split(" ");

    return (
        <p ref={ref} className={cn("story-words", className)}>
            {/* read whole by assistive technology; the words below are ink only */}
            <span className="sr-only">{text}</span>
            {words.map((word, i) => (
                <Word
                    key={`${word}-${i}`}
                    progress={scrollYProgress}
                    range={[i / words.length, (i + 1) / words.length]}
                    accentClass={accent.includes(word.replace(/[.,;:—]/g, "")) ? accentClass : undefined}
                >
                    {word}
                </Word>
            ))}
        </p>
    );
}

function Word({
    children,
    progress,
    range,
    accentClass,
}: {
    children: string;
    progress: MotionValue<number>;
    range: [number, number];
    accentClass?: string;
}) {
    const opacity = useTransform(progress, range, [0.16, 1]);
    return (
        <>
            <motion.span aria-hidden style={{ opacity }} className={accentClass}>
                {children}
            </motion.span>{" "}
        </>
    );
}
