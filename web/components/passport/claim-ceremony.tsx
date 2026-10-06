"use client";

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { PassportLeaf } from "@/components/passport/passport-leaf";
import { getRecord } from "@/lib/records";
import type { Passport } from "@/lib/types";

const ROWS = 16;
const EASE = [0.23, 1, 0.32, 1] as const;
const FALLBACK = ["#B1241A", "#2F4479", "#E3A21A", "#E8916A", "#E9E2D6"];

/* relative luminance, to keep near-black threads off a near-black stage */
function luminance(hex: string) {
    const n = parseInt(hex.replace("#", ""), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The moment a claim lands.
 *
 * The one screen in the app allowed to celebrate: it happens once per cloth,
 * it is the whole point of the programme, and the holder has just attached
 * their name to somebody's eleven weeks of work. So the screen goes dark and
 * the cloth's own colours — measured from its photograph — weave across it,
 * row by row, into a band; the holder's name is written under it; the
 * certificate rises beside it; offcuts of thread fall. Then it says where to
 * find the certificate again, with buttons straight there.
 *
 * A real dialog: focus moves in and is kept in, Esc and the close button
 * leave, the page behind does not scroll. Under reduced motion it simply
 * fades in, with no weaving and no falling thread.
 */
export function ClaimCeremony({
    passport,
    clothName,
    colors,
    onClose,
}: {
    passport: Passport;
    clothName: string;
    /** the cloth's measured palette, leading colour first */
    colors?: string[];
    onClose: () => void;
}) {
    const root = useRef<HTMLDivElement | null>(null);
    const primary = useRef<HTMLAnchorElement | null>(null);
    const confetti = useRef<HTMLCanvasElement | null>(null);
    const band = useRef<HTMLDivElement | null>(null);

    const threads = (colors?.length ? colors : FALLBACK).filter((hex) => luminance(hex) > 0.025);
    const weft = threads.length ? threads : FALLBACK;
    const rows = Array.from({ length: ROWS }, (_, i) => weft[(i * 2 + (i % 3 === 0 ? 1 : 0)) % weft.length]);

    /* lock the page, take focus, listen for Esc */
    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const focus = window.setTimeout(() => primary.current?.focus({ preventScroll: true }), 60);
        function onKey(event: KeyboardEvent) {
            if (event.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            window.clearTimeout(focus);
            window.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    /* offcuts of thread, falling */
    useEffect(() => {
        const canvas = confetti.current;
        if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const g = canvas.getContext("2d");
        if (!g) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);

        const palette = [...weft, "#EC3013", "#FF9783"];
        const origin = band.current?.getBoundingClientRect();
        const ox = origin ? origin.left + origin.width / 2 : w / 2;
        const oy = origin ? origin.top + origin.height / 2 : h * 0.35;
        const count = w < 640 ? 60 : 96;
        const pieces = Array.from({ length: count }, () => {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
            const speed = 5 + Math.random() * 9;
            return {
                x: ox + (Math.random() - 0.5) * (origin?.width ?? 200) * 0.8,
                y: oy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r: Math.random() * Math.PI * 2,
                vr: (Math.random() - 0.5) * 0.3,
                len: 8 + Math.random() * 14,
                bend: (Math.random() - 0.5) * 10,
                sway: Math.random() * Math.PI * 2,
                color: palette[Math.floor(Math.random() * palette.length)],
            };
        });

        let frame = 0;
        let start = 0;
        const tick = (now: number) => {
            if (!start) start = now;
            const t = now - start;
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.clearRect(0, 0, w, h);
            let alive = 0;
            for (const p of pieces) {
                p.vy += 0.16;
                p.vx *= 0.985;
                p.vy *= 0.985;
                p.sway += 0.05;
                p.x += p.vx + Math.sin(p.sway) * 0.6;
                p.y += p.vy;
                p.r += p.vr;
                if (p.y > h + 30) continue;
                alive++;
                const fade = t > 3200 ? Math.max(0, 1 - (t - 3200) / 900) : 1;
                g.save();
                g.translate(p.x, p.y);
                g.rotate(p.r);
                g.strokeStyle = p.color;
                g.globalAlpha = fade;
                g.lineWidth = 2;
                g.lineCap = "round";
                g.beginPath();
                g.moveTo(-p.len / 2, 0);
                g.quadraticCurveTo(0, p.bend, p.len / 2, 0);
                g.stroke();
                g.restore();
            }
            if (alive && t < 4200) frame = window.requestAnimationFrame(tick);
            else g.clearRect(0, 0, w, h);
        };
        const delay = window.setTimeout(() => {
            frame = window.requestAnimationFrame(tick);
        }, 1050);
        return () => {
            window.clearTimeout(delay);
            window.cancelAnimationFrame(frame);
        };
        // the burst is fired once, when the ceremony opens
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* keep Tab inside */
    function trap(event: ReactKeyboardEvent<HTMLDivElement>) {
        if (event.key !== "Tab" || !root.current) return;
        const items = [...root.current.querySelectorAll<HTMLElement>("a[href], button")].filter(
            (el) => el.offsetParent !== null,
        );
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    const record = getRecord(passport.code);
    const up = (delay: number) => ({
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, delay, ease: EASE },
    });

    return createPortal(
        <motion.div
            ref={root}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ceremony-title"
            aria-describedby="ceremony-holder"
            onKeyDown={trap}
            data-lenis-prevent
            data-theme="dark"
            data-cursor="off"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-ink text-white"
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="pressable fixed top-4 right-4 z-20 grid h-11 w-11 place-items-center text-white/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,.22)] hover:bg-white hover:text-ink"
            >
                <X aria-hidden className="h-5 w-5" strokeWidth={1.75} />
            </button>

            <div className="container-x relative z-10 grid min-h-full items-center gap-10 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] lg:gap-16">
                <div>
                    {/* the weave: one row of weft per colour, shot from alternate sides */}
                    <div ref={band} aria-hidden className="relative w-full max-w-[560px] overflow-hidden">
                        {rows.map((hex, i) => (
                            <motion.div
                                key={i}
                                className="h-[9px] sm:h-[11px]"
                                style={{
                                    backgroundColor: hex,
                                    backgroundImage:
                                        "repeating-linear-gradient(90deg, rgba(0,0,0,.32) 0 2px, rgba(0,0,0,0) 2px 7px), linear-gradient(180deg, rgba(255,255,255,.16), rgba(0,0,0,0) 45%, rgba(0,0,0,.28))",
                                    backgroundPosition: i % 2 ? "3.5px 0, 0 0" : "0 0, 0 0",
                                    transformOrigin: i % 2 ? "100% 50%" : "0% 50%",
                                }}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.5, delay: 0.25 + i * 0.055, ease: EASE }}
                            />
                        ))}
                        {/* the warp, standing through it */}
                        <motion.div
                            className="pointer-events-none absolute inset-0"
                            style={{
                                backgroundImage:
                                    "repeating-linear-gradient(90deg, rgba(233,226,214,.16) 0 1px, rgba(0,0,0,0) 1px 7px)",
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6 }}
                        />
                    </div>

                    <motion.p {...up(1.05)} className="eyebrow mt-8">
                        Woven into your name
                    </motion.p>
                    <motion.h2
                        id="ceremony-title"
                        {...up(1.15)}
                        className="mt-3 max-w-[16ch] text-[clamp(2.6rem,7vw,5rem)] leading-[.92] text-white"
                    >
                        {clothName}
                    </motion.h2>
                    <motion.p
                        id="ceremony-holder"
                        {...up(1.3)}
                        className="mt-5 max-w-[44ch] text-[17px] leading-relaxed text-white/72 sm:text-[19px]"
                    >
                        Certificate <span className="num text-white">#{passport.serial}</span> is issued to{" "}
                        <span className="font-script text-[1.6em] leading-none text-salmon">{passport.holder}</span>.
                        It is kept under your account, and the record now carries your name.
                    </motion.p>
                    <motion.div {...up(1.5)} className="mt-8 flex flex-wrap items-center gap-3">
                        <Link
                            ref={primary}
                            href="/collection"
                            onClick={onClose}
                            className="pressable inline-flex h-12 items-center justify-center bg-salmon px-5 text-[15px] font-medium text-ink hover:bg-white hover:text-ink"
                        >
                            See it in your traces
                        </Link>
                        <Link
                            href={`/verify/${passport.id}`}
                            onClick={onClose}
                            className="inline-flex h-12 items-center justify-center px-5 text-[15px] text-white/85 shadow-[inset_0_0_0_1px_rgba(255,255,255,.3)] hover:bg-white hover:text-ink"
                        >
                            Check the certificate
                        </Link>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-12 items-center px-2 text-[15px] text-white/60 underline-offset-4 hover:text-white hover:underline"
                        >
                            Stay with the cloth
                        </button>
                    </motion.div>
                    <motion.p {...up(1.6)} className="data mt-6 text-[11px] break-all text-white/35">
                        {passport.id}
                    </motion.p>
                </div>

                {/* the certificate, rising */}
                <motion.div
                    initial={{ opacity: 0, y: 60, rotate: -3 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ duration: 0.95, delay: 1.2, ease: EASE }}
                    className="mx-auto w-full max-w-[400px] lg:mx-0 lg:justify-self-end"
                >
                    <PassportLeaf passport={passport} record={record} />
                </motion.div>
            </div>

            <canvas
                ref={confetti}
                aria-hidden
                className="pointer-events-none fixed inset-0 z-30 h-screen w-screen"
            />
        </motion.div>,
        document.body,
    );
}
