"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The chapters, as a column of knots at the right edge of a wide screen.
 *
 * It appears only while you are inside the story, marks the chapter at the
 * middle of the screen, and jumps to any of them. Names show on hover or
 * focus only — at rest it is a column of knots in the margin, off the text.
 */
export function StoryNav({ chapters }: { chapters: { id: string; label: string }[] }) {
    const [active, setActive] = useState<string | null>(null);

    useEffect(() => {
        const inView = new Set<string>();
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) inView.add(entry.target.id);
                    else inView.delete(entry.target.id);
                }
                setActive(chapters.find((chapter) => inView.has(chapter.id))?.id ?? null);
            },
            { rootMargin: "-48% 0px -48% 0px" },
        );
        for (const chapter of chapters) {
            const el = document.getElementById(chapter.id);
            if (el) observer.observe(el);
        }
        return () => observer.disconnect();
    }, [chapters]);

    return (
        <nav
            aria-label="Chapters"
            className={cn(
                "no-print fixed top-1/2 right-5 z-40 hidden -translate-y-1/2 transition-opacity duration-300 min-[1380px]:block",
                active ? "opacity-100" : "pointer-events-none opacity-0",
            )}
        >
            <ol className="flex flex-col items-end gap-3.5">
                {chapters.map((chapter) => {
                    const on = chapter.id === active;
                    return (
                        <li key={chapter.id}>
                            <a
                                href={`#${chapter.id}`}
                                aria-current={on ? "step" : undefined}
                                className="group flex items-center gap-3"
                            >
                                <span
                                    className={cn(
                                        "bg-ink px-2 py-1 text-[11px] tracking-[.14em] whitespace-nowrap text-white uppercase transition-opacity duration-200",
                                        "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                                    )}
                                >
                                    {chapter.label}
                                </span>
                                <span
                                    aria-hidden
                                    className={cn(
                                        "block rounded-full border-2 transition-all duration-300",
                                        on
                                            ? "h-3.5 w-3.5 border-bt-red-bright bg-bt-red-bright"
                                            : "h-2.5 w-2.5 border-ink-3 bg-paper group-hover:border-bt-red-bright",
                                    )}
                                />
                            </a>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
