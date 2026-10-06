"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";

export type TapDemoCloth = {
    code: string;
    number: string;
    name: string;
    origin: string;
    photo: string;
};

/**
 * "Hold your phone to the tag" — tried here, before the visitor is standing
 * in front of a cloth.
 *
 * A cloth lies on the table with its woven label sewn into the corner (the
 * label the tag is in). The phone beside it can be picked up and laid on the
 * label: the tag answers with a ripple, the phone gives a small buzz where it
 * can, and its screen opens the cloth's page — the real one, linked. A button
 * does the same for anyone without a pointer to drag with; under reduced
 * motion the phone simply shows the page.
 */
export function TapDemo({ cloth }: { cloth: TapDemoCloth }) {
    const area = useRef<HTMLDivElement | null>(null);
    const tag = useRef<HTMLSpanElement | null>(null);
    const phone = useRef<HTMLDivElement | null>(null);
    const [read, setRead] = useState(false);
    const [near, setNear] = useState(false);
    const [round, setRound] = useState(0);
    /* where the phone is on the table: it stays where it was laid */
    const px = useMotionValue(0);
    const py = useMotionValue(0);
    const move = (x: number, y: number) => {
        const how = reduce ? { duration: 0 } : { type: "spring" as const, duration: 0.7, bounce: 0.12 };
        animate(px, x, how);
        animate(py, y, how);
    };
    const reduce = useReducedMotion();

    const overlapping = () => {
        const a = tag.current?.getBoundingClientRect();
        const b = phone.current?.getBoundingClientRect();
        if (!a || !b) return false;
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    };

    function answer() {
        if (read) return;
        setRead(true);
        setNear(false);
        try {
            navigator.vibrate?.(28);
        } catch {
            /* not every phone lets a page buzz it */
        }
    }

    function tapForMe() {
        const a = tag.current?.getBoundingClientRect();
        const b = phone.current?.getBoundingClientRect();
        if (a && b) {
            move(px.get() + a.left + a.width / 2 - (b.left + b.width / 2), py.get() + a.top + a.height / 2 - (b.top + b.height / 2));
        }
        answer();
    }

    function again() {
        setRead(false);
        setRound((n) => n + 1);
        move(0, 0);
    }

    return (
        <div className="card-stock relative overflow-hidden p-5 sm:p-8">
            <div aria-hidden className="stitch absolute inset-x-5 top-3.5" />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:items-center">
                <div>
                    <div className="eyebrow mt-2">Try it here</div>
                    <h2 className="mt-3 text-[clamp(1.8rem,5vw,3rem)] text-ink">Hold the phone to the tag.</h2>
                    <p className="read mt-3 max-w-[40ch] text-[17px] text-ink-2">
                        In the room, every cloth has a woven label with a tag inside it. Pick up the phone
                        and lay it on the label — that is the whole of it. No app, no account.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        {read ? (
                            <button
                                type="button"
                                onClick={again}
                                className="pressable inline-flex h-11 items-center gap-2 px-4 text-[15px] text-ink shadow-[inset_0_0_0_1px_var(--bt-ink)] hover:bg-ink hover:text-white"
                            >
                                <RotateCcw aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                                Try again
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={tapForMe}
                                className="pressable tactile inline-flex h-11 items-center bg-ink px-4 text-[15px] font-medium text-white hover:bg-ink/88 hover:text-white"
                            >
                                Tap the tag for me
                            </button>
                        )}
                        <span className="text-[14px] text-ink-3">{read ? "That is all it takes." : "or drag the phone onto the label"}</span>
                    </div>
                </div>

                {/* the table */}
                <div
                    ref={area}
                    className="relative mx-auto grid h-[380px] w-full max-w-[560px] grid-cols-[1fr_auto] items-center gap-4 sm:h-[420px]"
                >
                    {/* the cloth, with its label sewn into the corner */}
                    <div className="relative aspect-square w-full max-w-[300px] justify-self-center shadow-[0_18px_30px_-18px_rgba(60,44,28,.55)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cloth.photo} alt={`${cloth.name}, the cloth in this demonstration`} className="h-full w-full object-cover" draggable={false} />
                        <span ref={tag} className="woven-label absolute right-3 bottom-3">
                            {cloth.code}
                        </span>
                        {/* the tag answering */}
                        <AnimatePresence>
                            {read && !reduce && (
                                <span aria-hidden className="pointer-events-none absolute right-3 bottom-3 h-9 w-20">
                                    {[0, 1, 2].map((i) => (
                                        <motion.span
                                            key={`${round}-${i}`}
                                            className="absolute inset-0 rounded-full border-2 border-bt-red"
                                            initial={{ opacity: 0.9, scale: 0.6 }}
                                            animate={{ opacity: 0, scale: 2.6 }}
                                            transition={{ duration: 1.1, delay: i * 0.18, ease: "easeOut" }}
                                        />
                                    ))}
                                </span>
                            )}
                        </AnimatePresence>
                        {near && !read && (
                            <span aria-hidden className="pointer-events-none absolute right-2 bottom-2 h-11 w-24 rounded-sm shadow-[0_0_0_2px_var(--bt-red)]" />
                        )}
                    </div>

                    {/* the phone */}
                    <motion.div
                        ref={phone}
                        drag={!read}
                        dragConstraints={area}
                        dragElastic={0.08}
                        dragMomentum={false}
                        style={{ x: px, y: py }}
                        onDrag={() => setNear(overlapping())}
                        onDragEnd={() => {
                            if (overlapping()) answer();
                            else {
                                setNear(false);
                                move(0, 0);
                            }
                        }}
                        whileDrag={{ scale: 1.04, rotate: -3 }}
                        className="relative z-10 h-[250px] w-[130px] cursor-grab touch-none rounded-[22px] bg-ink p-[7px] shadow-[0_24px_40px_-18px_rgba(32,30,29,.7)] select-none active:cursor-grabbing sm:h-[280px] sm:w-[144px]"
                        aria-label={read ? `The phone shows ${cloth.name}` : "A phone you can drag onto the label"}
                        role="img"
                    >
                        <div className="relative h-full overflow-hidden rounded-[16px] bg-[#FBF8F2]">
                            <span aria-hidden className="absolute top-1.5 left-1/2 z-10 h-1.5 w-10 -translate-x-1/2 rounded-full bg-ink/80" />
                            <AnimatePresence mode="wait" initial={false}>
                                {read ? (
                                    <motion.div
                                        key="page"
                                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.45, delay: reduce ? 0 : 0.35 }}
                                        className="flex h-full flex-col"
                                    >
                                        <div className="h-[3px] w-full" style={{ backgroundImage: "var(--dye-selvedge)" }} />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={cloth.photo} alt="" className="aspect-square w-full object-cover" draggable={false} />
                                        <div className="flex flex-1 flex-col px-2.5 pt-2 pb-2.5">
                                            <span className="numeral text-[26px] text-bt-red">{cloth.number}</span>
                                            <span className="display text-[14px] leading-tight text-ink">{cloth.name}</span>
                                            <span className="mt-0.5 truncate text-[10.5px] text-ink-3">{cloth.origin}</span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="idle"
                                        exit={{ opacity: 0 }}
                                        className="flex h-full flex-col items-center justify-center gap-3 px-3 text-center"
                                    >
                                        <svg aria-hidden viewBox="0 0 40 40" className="h-10 w-10 text-bt-red" fill="none">
                                            <path d="M14 13a10 10 0 0 1 0 14M19 9a16 16 0 0 1 0 22M24 5a22 22 0 0 1 0 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <circle cx="9" cy="20" r="2.4" fill="currentColor" />
                                        </svg>
                                        <span className="text-[12.5px] leading-snug text-ink-2">Hold me near the label on the cloth</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {read && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: reduce ? 0 : 0.6 }}
                        className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"
                        aria-live="polite"
                    >
                        <p className="read text-[17px] text-ink-2">
                            The tag opened <span className="text-ink">{cloth.number} · {cloth.name}</span>, from {cloth.origin}.
                        </p>
                        <Link
                            href={`/record/${encodeURIComponent(cloth.code)}`}
                            className="inline-flex items-center gap-2 text-[16px] font-medium text-bt-red hover:text-bt-red-bright"
                        >
                            Open its real page <span aria-hidden>→</span>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
