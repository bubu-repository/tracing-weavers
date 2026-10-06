"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { t } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { ChapterHead } from "@/components/story/story-thread";

/* A photograph for each stage. Documentary images from the programme's
   material (see README: some are reference images, to be replaced with
   licensed community photography before publication). */
const PHOTOS: Record<string, string> = {
    Seed: "/imagery/story/cotton-carding.webp",
    Loom: "/imagery/story/weaving-hands-loom.webp",
    Trace: "/imagery/story/weaving-detail.webp",
    Teach: "/imagery/story/weaver-portrait.webp",
    Regenerate: "/imagery/story/village-flores.webp",
    Hub: "/imagery/story/cloth-hanging.webp",
    Flourish: "/imagery/tenun/18-GW.jpg",
};

/**
 * Chapter II: the seven stages, told as a sequence you scroll through.
 *
 * On a desk the chapter pins to the screen and the stages travel sideways as
 * you scroll down — one gesture, seven pictures, and a counter that says
 * where you are. On a phone, where sideways pinning fights the thumb, the
 * same stages stack as a vertical photo story. Reduced motion gets the
 * stack's calm on any screen: no pin, a native sideways scroll.
 */
export function StagesScroll({ id = "chapter-path" }: { id?: string }) {
    const section = useRef<HTMLElement | null>(null);
    const track = useRef<HTMLOListElement | null>(null);
    const [distance, setDistance] = useState(0);
    const [active, setActive] = useState(0);
    const steps = t.steps;

    useEffect(() => {
        const el = track.current;
        if (!el) return;
        const measure = () => setDistance(Math.max(el.scrollWidth - el.clientWidth, 0));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
    const x = useTransform(scrollYProgress, (v) => -Math.min(Math.max(v, 0), 1) * distance);
    useMotionValueEvent(scrollYProgress, "change", (v) => {
        setActive(Math.min(steps.length - 1, Math.max(0, Math.floor(v * steps.length * 0.999))));
    });

    return (
        <section
            ref={section}
            id={id}
            data-chapter
            data-theme="dark"
            className="grain relative scroll-mt-16 bg-ink text-white lg:h-[480vh] motion-reduce:lg:h-auto"
        >
            <div className="py-20 lg:sticky lg:top-[68px] lg:flex lg:h-[calc(100svh-68px)] lg:flex-col lg:justify-center lg:overflow-hidden lg:py-0 motion-reduce:lg:static motion-reduce:lg:h-auto motion-reduce:lg:py-24">
                <div className="container-x flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <ChapterHead
                        numeral="II"
                        kicker={t.journeyEyebrow}
                        title="Seed to loom, and beyond."
                        lead={t.journeyLead}
                        tone="ink"
                        className="lg:[&_h2]:text-[clamp(2.4rem,4.6vw,4rem)]"
                    />

                    {/* where you are in the seven — desk only, where the pin is */}
                    <div className="hidden shrink-0 items-end gap-5 pb-2 lg:flex motion-reduce:lg:hidden" aria-hidden>
                        <span className="numeral text-[72px] leading-none text-salmon">
                            {String(active + 1).padStart(2, "0")}
                        </span>
                        <div className="pb-2">
                            <div className="flex gap-1">
                                {steps.map((step, i) => (
                                    <span
                                        key={step.id}
                                        className={cn(
                                            "h-1 w-7 transition-colors duration-300",
                                            i <= active ? "bg-salmon" : "bg-white/18",
                                        )}
                                    />
                                ))}
                            </div>
                            <p className="mt-2 text-[12px] tracking-[.2em] text-white/55 uppercase">
                                {steps[active]?.id_label} · of seven
                            </p>
                        </div>
                    </div>
                </div>

                <motion.ol
                    ref={track}
                    style={{ x }}
                    className="story-motion mt-12 flex flex-col gap-14 px-4 sm:px-6 lg:mt-12 lg:flex-row lg:gap-8 lg:px-[max(2.5rem,calc((100vw-1280px)/2+2.5rem))] max-lg:!transform-none motion-reduce:lg:no-scrollbar motion-reduce:lg:overflow-x-auto"
                >
                    {steps.map((step, i) => (
                        <li
                            key={step.id}
                            className="shrink-0 lg:w-[min(56vw,560px)] lg:last:mr-[max(2.5rem,calc((100vw-1280px)/2+2.5rem))]"
                        >
                            <figure className="relative aspect-[4/3] overflow-hidden bg-white/5 lg:aspect-[16/11]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={PHOTOS[step.id]}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover"
                                    draggable={false}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                                <span className="numeral absolute bottom-3 left-4 text-[clamp(4rem,9vw,6.5rem)] text-white">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                            </figure>
                            <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-white/16 pt-4">
                                <h3 className="text-[clamp(1.8rem,4vw,2.5rem)] text-white">{step.id_label}</h3>
                                <p className="text-[16px] leading-snug text-white/68">{step.note}</p>
                            </div>
                        </li>
                    ))}
                </motion.ol>
            </div>
        </section>
    );
}
