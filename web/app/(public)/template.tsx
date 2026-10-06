"use client";

import { useEffect, useState } from "react";

/* the dye pots: morinda, indigo, turmeric, clay, cotton, ink, and the red */
const DYES = ["#B1241A", "#2F4479", "#E3A21A", "#E8916A", "#E9E2D6", "#201E1D", "#EC3013"];
const STRIPS = 30;

let hydrated = false;

/**
 * Between pages, a curtain of dyed thread lifts off the new page — strips of
 * colour raised one after another, left to right, like a shed opening on the
 * loom. Never on the first page a visitor lands on (it would only stand
 * between them and the page), never under reduced motion, and it never takes
 * a click: it is gone in under three-quarters of a second.
 */
export default function Template({ children }: { children: React.ReactNode }) {
    const [curtain, setCurtain] = useState(
        () =>
            typeof window !== "undefined" &&
            hydrated &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );

    useEffect(() => {
        hydrated = true;
    }, []);

    return (
        <>
            {children}
            {curtain && (
                <div aria-hidden className="thread-curtain no-print pointer-events-none fixed inset-0 z-40 flex">
                    {Array.from({ length: STRIPS }, (_, i) => (
                        <span
                            key={i}
                            className="h-full flex-1"
                            style={{
                                backgroundColor: DYES[(i * 3) % DYES.length],
                                animationDelay: `${i * 10}ms`,
                            }}
                            onAnimationEnd={i === STRIPS - 1 ? () => setCurtain(false) : undefined}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
