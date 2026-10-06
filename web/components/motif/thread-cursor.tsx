"use client";

import { useEffect, useRef } from "react";

const POINTS = 24;
const SEGMENT = 8;
const RED = "236, 48, 19";

/**
 * A red thread that follows the pointer, as if the cursor were a needle.
 *
 * The thread is a short rope (verlet points held a fixed distance apart): its
 * head is pinned to the pointer, the rest trails behind, whips on a fast move
 * and hangs under its own weight when the hand rests. A click leaves a small
 * cross-stitch that fades. After a moment of stillness the thread lets go and
 * fades away, and the loop stops until the pointer moves again.
 *
 * Decoration only, so:
 *  · never on touch devices (no pointer to follow)
 *  · skipped entirely under prefers-reduced-motion
 *  · aria-hidden and pointer-events-none, so it can never intercept a click
 *  · it steps aside over anything marked `data-cursor="off"` (the living loom
 *    on the cover, which draws its own shuttle under the pointer)
 */
export function ThreadCursor() {
    const ref = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const canvas = ref.current;
        if (!fine || calm || !canvas) return;
        const g = canvas.getContext("2d");
        if (!g) return;

        let w = 0;
        let h = 0;
        let dpr = 1;
        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
        };
        resize();

        const xs = new Float32Array(POINTS);
        const ys = new Float32Array(POINTS);
        const px = new Float32Array(POINTS);
        const py = new Float32Array(POINTS);
        let placed = false;
        const pointer = { x: 0, y: 0 };
        let lastMove = 0;
        let off = false;
        let alpha = 0;
        let frame = 0;
        let running = false;
        const stitches: { x: number; y: number; t: number }[] = [];

        const place = (x: number, y: number) => {
            for (let i = 0; i < POINTS; i++) {
                xs[i] = px[i] = x;
                ys[i] = py[i] = y + i * 2;
            }
            placed = true;
        };

        const start = () => {
            if (running || document.hidden) return;
            running = true;
            frame = window.requestAnimationFrame(tick);
        };

        const onMove = (event: PointerEvent) => {
            if (event.pointerType !== "mouse") return;
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            const target = event.target as Element | null;
            off = !!target?.closest?.('[data-cursor="off"]');
            if (!placed) place(pointer.x, pointer.y);
            lastMove = performance.now();
            start();
        };

        const onDown = (event: PointerEvent) => {
            if (event.pointerType !== "mouse" || off) return;
            stitches.push({ x: event.clientX, y: event.clientY, t: performance.now() });
            if (stitches.length > 12) stitches.shift();
            start();
        };

        const onLeave = () => {
            lastMove = 0;
        };

        const step = () => {
            /* head pinned to the pointer */
            xs[0] = px[0] = pointer.x;
            ys[0] = py[0] = pointer.y;
            for (let i = 1; i < POINTS; i++) {
                const vx = (xs[i] - px[i]) * 0.9;
                const vy = (ys[i] - py[i]) * 0.9;
                px[i] = xs[i];
                py[i] = ys[i];
                xs[i] += vx;
                ys[i] += vy + 0.32;
            }
            for (let k = 0; k < 4; k++) {
                for (let i = 1; i < POINTS; i++) {
                    const dx = xs[i] - xs[i - 1];
                    const dy = ys[i] - ys[i - 1];
                    const d = Math.hypot(dx, dy) || 0.0001;
                    const diff = (d - SEGMENT) / d;
                    if (i === 1) {
                        xs[i] -= dx * diff;
                        ys[i] -= dy * diff;
                    } else {
                        xs[i] -= dx * diff * 0.5;
                        ys[i] -= dy * diff * 0.5;
                        xs[i - 1] += dx * diff * 0.5;
                        ys[i - 1] += dy * diff * 0.5;
                    }
                }
            }
        };

        const drawThread = () => {
            if (alpha <= 0.01) return;
            /* the thread, fading toward its loose end */
            const chunks = 4;
            const per = Math.ceil((POINTS - 1) / chunks);
            g.lineCap = "round";
            g.lineJoin = "round";
            for (let c = 0; c < chunks; c++) {
                const from = c * per;
                const to = Math.min(POINTS - 1, from + per);
                g.beginPath();
                g.moveTo(xs[from], ys[from]);
                for (let i = from + 1; i < to; i++) {
                    const mx = (xs[i] + xs[i + 1]) / 2;
                    const my = (ys[i] + ys[i + 1]) / 2;
                    g.quadraticCurveTo(xs[i], ys[i], mx, my);
                }
                g.lineTo(xs[to], ys[to]);
                g.strokeStyle = `rgba(${RED}, ${alpha * (1 - c / chunks) * 0.95})`;
                g.lineWidth = 1.7 - c * 0.25;
                g.stroke();
            }
            /* the needle: a sliver of steel leading the thread */
            const dx = xs[0] - xs[2];
            const dy = ys[0] - ys[2];
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            g.strokeStyle = `rgba(150, 146, 140, ${alpha * 0.9})`;
            g.lineWidth = 1.4;
            g.beginPath();
            g.moveTo(xs[0] - ux * 4, ys[0] - uy * 4);
            g.lineTo(xs[0] + ux * 9, ys[0] + uy * 9);
            g.stroke();
        };

        const drawStitches = (now: number) => {
            for (let i = stitches.length - 1; i >= 0; i--) {
                const s = stitches[i];
                const age = (now - s.t) / 1400;
                if (age >= 1) {
                    stitches.splice(i, 1);
                    continue;
                }
                const a = 1 - age;
                const r = 4 + age * 2;
                g.strokeStyle = `rgba(${RED}, ${a})`;
                g.lineWidth = 1.6;
                g.beginPath();
                g.moveTo(s.x - r, s.y - r);
                g.lineTo(s.x + r, s.y + r);
                g.moveTo(s.x + r, s.y - r);
                g.lineTo(s.x - r, s.y + r);
                g.stroke();
            }
        };

        let last = 0;
        const tick = (now: number) => {
            frame = 0;
            if (now - last < 15) {
                frame = window.requestAnimationFrame(tick);
                return;
            }
            last = now;
            const idle = now - lastMove;
            const want = lastMove && !off && idle < 1100 ? 1 : 0;
            alpha += (want - alpha) * (want ? 0.25 : 0.08);
            step();
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.clearRect(0, 0, w, h);
            drawThread();
            drawStitches(now);
            if (alpha < 0.01 && !want && stitches.length === 0) {
                alpha = 0;
                g.clearRect(0, 0, w, h);
                running = false;
                return;
            }
            frame = window.requestAnimationFrame(tick);
        };

        const onVisibility = () => {
            if (document.hidden && frame) {
                window.cancelAnimationFrame(frame);
                frame = 0;
                running = false;
            }
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerdown", onDown, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
        window.addEventListener("resize", resize);
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerdown", onDown);
            document.documentElement.removeEventListener("pointerleave", onLeave);
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    return (
        <canvas
            ref={ref}
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[70] h-screen w-screen max-md:hidden"
        />
    );
}
