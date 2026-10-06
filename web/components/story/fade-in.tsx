"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A passage that arrives as you reach it: it rises a little and comes up from
 * nothing, once. Used for the story's paragraphs and pictures — never for the
 * first screen, which must be there before any script runs.
 */
export function FadeIn({
    children,
    delay = 0,
    y = 28,
    className,
}: {
    children: React.ReactNode;
    delay?: number;
    y?: number;
    className?: string;
}) {
    return (
        <motion.div
            className={cn("story-motion", className)}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -12% 0px" }}
            transition={{ duration: 0.9, delay, ease: [0.23, 1, 0.32, 1] }}
        >
            {children}
        </motion.div>
    );
}
