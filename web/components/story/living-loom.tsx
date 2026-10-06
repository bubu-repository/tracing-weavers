"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { disableLoomSound, enableLoomSound, pluck } from "@/lib/loom-sound";

export type LoomCloth = { code: string; number: string; name: string; colors: string[] };

/* The visitor's shuttles: the four dye pots, and cotton left undyed. */
const SHUTTLES = [
    { id: "morinda", label: "Morinda", hex: "#B1241A" },
    { id: "indigo", label: "Indigo", hex: "#2F4479" },
    { id: "turmeric", label: "Turmeric", hex: "#E3A21A" },
    { id: "clay", label: "Clay", hex: "#E8916A" },
    { id: "cotton", label: "Undyed cotton", hex: "#E9E2D6" },
];

/* The cloth already on the loom when you arrive — a few bands to start from. */
const OPENING = ["cotton", "cotton", "morinda", "morinda", "cotton", "indigo", "indigo", "indigo", "turmeric", "indigo", "cotton", "cotton", "clay", "cotton"];

const POINTS = 26; // control points along each warp thread
const BG = "#201E1D";

type Thread = {
    x: number;
    color: string;
    cloth: number;
    p: Float32Array; // sideways offset of each point
    v: Float32Array;
    plucked: number;
};

type Row = { color: string };

const shade = (hex: string, amount: number) => {
    const n = Number.parseInt(hex.slice(1), 16);
    const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amount * 255)));
    return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

/* The warp as strings: one explicit step of the wave equation per thread,
   ends held fast, a little damping so a plucked thread rings and settles. */
function integrate(threads: Thread[], dt: number) {
    for (const t of threads) {
        for (let k = 1; k < POINTS - 1; k++) {
            const a = 1500 * (t.p[k - 1] + t.p[k + 1] - 2 * t.p[k]) - 8 * t.p[k];
            t.v[k] = (t.v[k] + a * dt) * 0.986;
        }
        for (let k = 1; k < POINTS - 1; k++) t.p[k] += t.v[k] * dt;
    }
}

/* push one point of one thread */
function nudge(t: Thread, k: number, dv: number) {
    t.v[k] += dv;
}

/* a knock near the fell, as when the beater comes down */
function shake(threads: Thread[], amount: number) {
    for (const t of threads) t.v[POINTS - 2] += (Math.random() - 0.5) * amount;
}

/**
 * The cover is a loom, and you are the weaver.
 *
 * Its warp — one band of threads for every cloth in the collection, in that
 * cloth's own colours — hangs from the top of the screen and moves like
 * string: brush past it and it sways, tap it and it rings. Move back and
 * forth across it and the shuttle throws a weft: each pass lays one row of
 * cloth at the fell, over and under, in the dye you chose. When the cloth
 * grows too tall it winds down onto the beam, as it would on a real loom.
 *
 * Nobody else will weave the cloth you weave here; "Keep your weave" turns
 * it into a picture you can save or send. Sound is off until you ask for it.
 * Reduced motion keeps the loom still until you touch it.
 */
export function LivingLoom({
    cloths,
    className,
    children,
}: {
    cloths: LoomCloth[];
    className?: string;
    children?: React.ReactNode;
}) {
    const host = useRef<HTMLElement | null>(null);
    const canvas = useRef<HTMLCanvasElement | null>(null);
    const label = useRef<HTMLDivElement | null>(null);
    const [shuttle, setShuttle] = useState(SHUTTLES[0]);
    const shuttleRef = useRef(SHUTTLES[0]);
    const [sound, setSound] = useState(false);
    const soundRef = useRef(false);
    const [rowCount, setRowCount] = useState(0);
    const [saving, setSaving] = useState(false);

    /* everything the animation touches lives outside React */
    const S = useRef({
        w: 0,
        h: 0,
        dpr: 1,
        spacing: 13,
        tw: 2.4,
        rh: 7,
        threads: [] as Thread[],
        rows: [] as Row[],
        woven: null as HTMLCanvasElement | null,
        wovenH: 0,
        maxWoven: 0,
        pointer: { x: -1, y: -1, px: -1, py: -1, inside: false, mouse: false, t: 0 },
        pass: { active: false, dir: 0, from: 0, to: 0 },
        demo: { stage: 0, t: 0 },
        beat: 0,
        visible: true,
        reduce: false,
        frame: 0,
        lastBreath: 0,
    });

    useEffect(() => {
        shuttleRef.current = shuttle;
    }, [shuttle]);
    useEffect(() => {
        soundRef.current = sound;
    }, [sound]);

    /* ── the cloth on the beam ─────────────────────────────────────────── */

    const drawRow = useCallback((ctx: CanvasRenderingContext2D, y: number, color: string, index: number) => {
        const s = S.current;
        const jitter = ((index * 7919) % 11) / 11 - 0.5; // handwoven: no two rows quite alike
        const rh = s.rh + jitter * 0.8;
        /* the weft, shaded like a round thread: lit on top, in shadow below */
        const g = ctx.createLinearGradient(0, y, 0, y + rh);
        g.addColorStop(0, shade(color, 0.12 + jitter * 0.04));
        g.addColorStop(0.45, shade(color, jitter * 0.04));
        g.addColorStop(1, shade(color, -0.22));
        ctx.fillStyle = g;
        ctx.fillRect(0, y, s.w, rh);
        for (let i = 0; i < s.threads.length; i++) {
            const t = s.threads[i];
            if ((i + index) % 2 === 1) {
                /* the warp comes over the weft here, shaded across its width */
                const x = t.x - s.tw / 2 - 0.3;
                const wg = ctx.createLinearGradient(x, 0, x + s.tw + 0.6, 0);
                wg.addColorStop(0, shade(t.color, 0.14));
                wg.addColorStop(0.5, t.color);
                wg.addColorStop(1, shade(t.color, -0.2));
                ctx.fillStyle = wg;
                ctx.fillRect(x, y - 0.6, s.tw + 0.6, rh + 1.2);
            } else {
                /* and dips under it here: a shadow where it goes in */
                ctx.fillStyle = "rgba(0,0,0,0.16)";
                ctx.fillRect(t.x - s.tw / 2, y + rh * 0.35, s.tw, rh * 0.3);
            }
        }
    }, []);

    /** Redraw every row that still shows, from the record of rows. */
    const repaintCloth = useCallback(() => {
        const s = S.current;
        if (!s.woven) return;
        const ctx = s.woven.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
        ctx.clearRect(0, 0, s.w, s.h);
        const fit = Math.floor(s.maxWoven / s.rh);
        const shown = s.rows.slice(-fit);
        s.wovenH = shown.length * s.rh;
        shown.forEach((row, k) => {
            const index = s.rows.length - shown.length + k;
            /* newest row at the top of the cloth, oldest at the bottom */
            const y = s.h - (k + 1) * s.rh;
            drawRow(ctx, y, row.color, index);
        });
    }, [drawRow]);

    const commitRow = useCallback(
        (color: string) => {
            const s = S.current;
            s.rows.push({ color });
            if (s.rows.length > 600) s.rows.shift();
            repaintCloth();
            s.beat = 1;
            /* the beater shakes the warp a little */
            shake(s.threads, 60);
            setRowCount((n) => n + 1);
        },
        [repaintCloth],
    );

    /* ── set up, and re-set up on resize ──────────────────────────────── */

    const build = useCallback(() => {
        const s = S.current;
        const el = host.current;
        const cv = canvas.current;
        if (!el || !cv) return;
        const box = el.getBoundingClientRect();
        s.w = Math.max(1, Math.round(box.width));
        s.h = Math.max(1, Math.round(box.height));
        s.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        const small = s.w < 640;
        s.spacing = small ? 11 : 13;
        s.tw = small ? 2 : 2.4;
        s.rh = small ? 6 : 7;
        s.maxWoven = Math.round(s.h * (small ? 0.24 : 0.3));
        cv.width = Math.round(s.w * s.dpr);
        cv.height = Math.round(s.h * s.dpr);

        const count = Math.max(8, Math.floor(s.w / s.spacing));
        const per = Math.max(1, Math.round(count / Math.max(cloths.length, 1)));
        const offset = (s.w - (count - 1) * s.spacing) / 2;
        s.threads = Array.from({ length: count }, (_, i) => {
            const cloth = Math.floor(i / per) % Math.max(cloths.length, 1);
            const colors = cloths[cloth]?.colors.length ? cloths[cloth].colors : ["#CFC8BB"];
            return {
                x: offset + i * s.spacing,
                color: colors[i % colors.length],
                cloth,
                p: new Float32Array(POINTS),
                v: new Float32Array(POINTS),
                plucked: 0,
            };
        });

        s.woven = s.woven ?? document.createElement("canvas");
        s.woven.width = cv.width;
        s.woven.height = cv.height;
        if (!s.rows.length) {
            s.rows = OPENING.map((id) => ({ color: SHUTTLES.find((x) => x.id === id)!.hex }));
        }
        repaintCloth();
    }, [cloths, repaintCloth]);

    /* ── the frame ─────────────────────────────────────────────────────── */

    const step = useCallback(() => {
        const s = S.current;
        const dt = 1 / 120;
        const fell = s.h - s.wovenH;
        for (let sub = 0; sub < 2; sub++) integrate(s.threads, dt);

        /* the hand brushing the warp */
        const ptr = s.pointer;
        if (ptr.inside && ptr.px >= 0 && ptr.y < fell) {
            const vx = (ptr.x - ptr.px) * 60;
            const R = 30;
            for (const t of s.threads) {
                const kf = (ptr.y / fell) * (POINTS - 1);
                const k0 = Math.round(kf);
                const off = t.p[Math.min(Math.max(k0, 0), POINTS - 1)];
                const dx = t.x + off - ptr.x;
                if (Math.abs(dx) > R) continue;
                const near = 1 - Math.abs(dx) / R;
                for (let k = 1; k < POINTS - 1; k++) {
                    const w = Math.max(0, 1 - Math.abs(k - kf) / 4);
                    if (w > 0) nudge(t, k, vx * 0.06 * near * w);
                }
            }
        }

        /* a breath now and then, so the loom reads as alive */
        if (!s.reduce && performance.now() - s.lastBreath > 1600) {
            s.lastBreath = performance.now();
            const t = s.threads[Math.floor(Math.random() * s.threads.length)];
            if (t) nudge(t, Math.floor(POINTS / 2), (Math.random() - 0.5) * 120);
        }
        s.beat *= 0.9;
    }, []);

    const paint = useCallback(() => {
        const s = S.current;
        const cv = canvas.current;
        const ctx = cv?.getContext("2d");
        if (!cv || !ctx) return;
        ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, s.w, s.h);
        if (s.woven) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(s.woven, 0, 0);
            ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
        }
        const fell = s.h - s.wovenH;

        /* the open warp, from the top of the loom to the fell */
        ctx.lineCap = "round";
        ctx.lineWidth = s.tw;
        ctx.globalAlpha = 0.92;
        const gap = fell / (POINTS - 1);
        for (const t of s.threads) {
            ctx.strokeStyle = t.color;
            ctx.beginPath();
            ctx.moveTo(t.x + t.p[0], 0);
            for (let k = 1; k < POINTS; k++) {
                const x0 = t.x + t.p[k - 1];
                const y0 = (k - 1) * gap;
                const x1 = t.x + t.p[k];
                const y1 = k * gap;
                ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
            }
            ctx.lineTo(t.x, fell);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        /* the reed, just above the fell; it flashes on each beat */
        ctx.fillStyle = `rgba(255,151,131,${0.18 + s.beat * 0.6})`;
        ctx.fillRect(0, fell - s.rh - 5, s.w, 1.5);

        /* the pass in progress: weft laid as far as the shuttle has gone */
        const pass = s.pass;
        if (pass.active && Math.abs(pass.to - pass.from) > 2) {
            const y = fell - s.rh - 1;
            const a = Math.max(0, Math.min(pass.from, pass.to));
            const b = Math.min(s.w, Math.max(pass.from, pass.to));
            const color = shuttleRef.current.hex;
            ctx.fillStyle = color;
            ctx.fillRect(a, y, b - a, s.rh);
            const index = s.rows.length;
            for (let i = 0; i < s.threads.length; i++) {
                const t = s.threads[i];
                if (t.x < a || t.x > b || (i + index) % 2 === 0) continue;
                ctx.fillStyle = t.color;
                ctx.fillRect(t.x - s.tw / 2 - 0.4, y - 0.4, s.tw + 0.8, s.rh + 0.8);
            }
            /* the shuttle itself, riding the shed */
            const sx = pass.to;
            ctx.save();
            ctx.translate(sx, y + s.rh / 2);
            ctx.fillStyle = "#C9A27A";
            ctx.beginPath();
            ctx.ellipse(0, 0, 17, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = color;
            ctx.fillRect(-6, -1.5, 12, 3);
            ctx.restore();
        }
    }, []);

    /* ── the loop: runs while the loom is on screen ────────────────────── */

    useEffect(() => {
        const s = S.current;
        s.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        build();

        let raf = 0;
        let last = 0;
        const loop = (now: number) => {
            raf = requestAnimationFrame(loop);
            if (!s.visible || document.hidden) return;
            if (now - last < 15) return;
            last = now;

            /* the opening demonstration: the shuttle crosses twice by itself */
            const d = s.demo;
            if (d.stage > 0 && d.stage < 3 && !s.pointer.inside) {
                d.t += 1 / 60;
                const span = s.w * 0.92;
                const start = d.stage === 1 ? s.w * 0.04 : s.w * 0.96;
                const progress = Math.min(d.t / 1.1, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                s.pass = {
                    active: true,
                    dir: d.stage === 1 ? 1 : -1,
                    from: start,
                    to: start + (d.stage === 1 ? 1 : -1) * span * eased,
                };
                if (progress >= 1) {
                    commitRow(d.stage === 1 ? SHUTTLES[0].hex : SHUTTLES[4].hex);
                    s.pass.active = false;
                    d.stage += 1;
                    d.t = 0;
                }
            }

            step();
            paint();
        };
        raf = requestAnimationFrame(loop);

        const observer = new IntersectionObserver(([entry]) => {
            s.visible = entry.isIntersecting;
        });
        if (host.current) observer.observe(host.current);

        const resize = new ResizeObserver(() => build());
        if (host.current) resize.observe(host.current);

        /* begin the demonstration shortly after arrival, unless asked for stillness */
        const demo = window.setTimeout(() => {
            if (!s.reduce && !s.pointer.inside) s.demo = { stage: 1, t: 0 };
        }, 900);

        return () => {
            cancelAnimationFrame(raf);
            observer.disconnect();
            resize.disconnect();
            window.clearTimeout(demo);
        };
    }, [build, commitRow, paint, step]);

    /* ── the hand ──────────────────────────────────────────────────────── */

    function local(e: React.PointerEvent) {
        const box = host.current!.getBoundingClientRect();
        return { x: e.clientX - box.left, y: e.clientY - box.top };
    }

    const interactive = (target: EventTarget | null) =>
        target instanceof Element && Boolean(target.closest("input, button, a, label, select, textarea"));

    function onMove(e: React.PointerEvent<HTMLElement>) {
        const s = S.current;
        const ptr = s.pointer;
        const { x, y } = local(e);
        ptr.px = ptr.inside ? ptr.x : x;
        ptr.py = ptr.inside ? ptr.y : y;
        ptr.x = x;
        ptr.y = y;
        ptr.inside = true;
        ptr.mouse = e.pointerType === "mouse";
        if (s.demo.stage > 0 && s.demo.stage < 3) {
            s.demo.stage = 3;
            s.pass.active = false;
        }

        const fell = s.h - s.wovenH;
        const dx = x - ptr.px;
        const dy = y - ptr.py;

        /* strum: every thread the hand crosses rings, if sound is on */
        if (Math.abs(dx) > 0.5 && y < fell) {
            const lo = Math.min(ptr.px, x);
            const hi = Math.max(ptr.px, x);
            const now = performance.now();
            const speed = Math.min(Math.abs(dx) / 40, 1);
            for (let i = 0; i < s.threads.length; i++) {
                const t = s.threads[i];
                if (t.x <= lo || t.x > hi || now - t.plucked < 90) continue;
                t.plucked = now;
                if (soundRef.current) pluck(i / Math.max(s.threads.length - 1, 1), 0.25 + speed * 0.6);
            }
        }

        /* weave: a horizontal sweep is a pass of the shuttle */
        if (!interactive(e.target) && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 0.5) {
            const dir = Math.sign(dx);
            const pass = s.pass;
            if (!pass.active) {
                s.pass = { active: true, dir, from: ptr.px, to: x };
            } else if (dir === pass.dir) {
                pass.to = x;
            } else {
                if (Math.abs(pass.to - pass.from) > s.w * 0.22) commitRow(shuttleRef.current.hex);
                s.pass = { active: true, dir, from: x, to: x };
            }
        }

        /* which cloth this thread belongs to */
        const tip = label.current;
        if (tip) {
            if (ptr.mouse && y < fell - 20 && !interactive(e.target)) {
                const i = Math.min(s.threads.length - 1, Math.max(0, Math.round((x - (s.threads[0]?.x ?? 0)) / s.spacing)));
                const cloth = cloths[s.threads[i]?.cloth ?? -1];
                if (cloth) {
                    tip.textContent = `${cloth.number} · ${cloth.name}`;
                    tip.style.transform = `translate(${Math.min(x + 16, s.w - 220)}px, ${y + 18}px)`;
                    tip.style.opacity = "1";
                }
            } else {
                tip.style.opacity = "0";
            }
        }
    }

    function onLeave() {
        const s = S.current;
        if (s.pass.active && Math.abs(s.pass.to - s.pass.from) > s.w * 0.22) commitRow(shuttleRef.current.hex);
        s.pass.active = false;
        s.pointer.inside = false;
        if (label.current) label.current.style.opacity = "0";
    }

    function onDown(e: React.PointerEvent<HTMLElement>) {
        if (interactive(e.target)) return;
        const s = S.current;
        const { x, y } = local(e);
        const fell = s.h - s.wovenH;
        if (y >= fell) return;
        /* a tap plucks the nearest thread: it rings along its whole length */
        const i = Math.min(s.threads.length - 1, Math.max(0, Math.round((x - (s.threads[0]?.x ?? 0)) / s.spacing)));
        const t = s.threads[i];
        if (!t) return;
        for (let k = 1; k < POINTS - 1; k++) nudge(t, k, Math.sin((k / (POINTS - 1)) * Math.PI) * 260 * (x >= t.x ? -1 : 1));
        t.plucked = performance.now();
        if (soundRef.current) pluck(i / Math.max(s.threads.length - 1, 1), 0.8);
    }

    async function toggleSound() {
        if (soundRef.current) {
            disableLoomSound();
            setSound(false);
            return;
        }
        const ok = await enableLoomSound();
        setSound(ok);
        if (ok) pluck(0.5, 0.6);
    }

    /* ── keep your weave ───────────────────────────────────────────────── */

    async function keep() {
        const s = S.current;
        setSaving(true);
        try {
            const W = 1080;
            const H = 1380;
            const out = document.createElement("canvas");
            out.width = W;
            out.height = H;
            const ctx = out.getContext("2d");
            if (!ctx) return;
            ctx.fillStyle = BG;
            ctx.fillRect(0, 0, W, H);

            /* the cloth, re-woven at print size from the record of rows */
            const clothH = 1040;
            const spacing = 15;
            const tw = 3.2;
            const rh = 9;
            const count = Math.floor(W / spacing);
            const per = Math.max(1, Math.round(count / Math.max(cloths.length, 1)));
            const warps = Array.from({ length: count }, (_, i) => {
                const cloth = Math.floor(i / per) % Math.max(cloths.length, 1);
                const colors = cloths[cloth]?.colors.length ? cloths[cloth].colors : ["#CFC8BB"];
                return { x: (W - (count - 1) * spacing) / 2 + i * spacing, color: colors[i % colors.length] };
            });
            const fit = Math.floor(clothH / rh);
            const rows = s.rows.slice(-fit);
            const top = clothH - rows.length * rh;
            /* the warp above the cloth, still on the loom */
            ctx.lineWidth = tw;
            for (const w of warps) {
                ctx.strokeStyle = w.color;
                ctx.beginPath();
                ctx.moveTo(w.x, 0);
                ctx.lineTo(w.x, top);
                ctx.stroke();
            }
            rows.forEach((row, k) => {
                const index = s.rows.length - rows.length + k;
                const y = clothH - (rows.length - k) * rh;
                ctx.fillStyle = row.color;
                ctx.fillRect(0, y, W, rh);
                ctx.fillStyle = "rgba(255,255,255,0.10)";
                ctx.fillRect(0, y, W, 1.2);
                ctx.fillStyle = "rgba(0,0,0,0.22)";
                ctx.fillRect(0, y + rh - 1.2, W, 1.2);
                warps.forEach((w, i) => {
                    if ((i + index) % 2 === 1) {
                        ctx.fillStyle = w.color;
                        ctx.fillRect(w.x - tw / 2 - 0.5, y - 0.5, tw + 1, rh + 1);
                    }
                });
            });

            /* the label, like the one beside a cloth in the room */
            ctx.fillStyle = "#AE1800";
            ctx.fillRect(0, clothH, W, 6);
            ctx.fillStyle = "#FF9783";
            ctx.font = "600 22px ui-monospace, Menlo, monospace";
            ctx.fillText(`WOVEN BY YOU · ${s.rows.length} ROWS`, 64, clothH + 76);
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "900 64px system-ui, -apple-system, Segoe UI, sans-serif";
            ctx.fillText("A cloth no one else will weave.", 64, clothH + 160);
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.font = "400 26px system-ui, -apple-system, Segoe UI, sans-serif";
            const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
            ctx.fillText(`On the loom at Tracing Weavers · ${date}`, 64, clothH + 218);
            ctx.fillText("The warp is dyed in the colours of the collection's cloths.", 64, clothH + 258);

            const blob: Blob | null = await new Promise((resolve) => out.toBlob(resolve, "image/png"));
            if (!blob) return;
            const file = new File([blob], "my-weave-tracing-weavers.png", { type: "image/png" });
            const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
            if (nav.canShare?.({ files: [file] })) {
                try {
                    await nav.share({ files: [file], title: "My weave — Tracing Weavers" });
                    return;
                } catch (error) {
                    if ((error as Error)?.name === "AbortError") return;
                }
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 4000);
        } finally {
            setSaving(false);
        }
    }

    return (
        <section
            ref={host}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            onPointerUp={(e) => {
                if (e.pointerType !== "mouse") onLeave();
            }}
            onPointerCancel={onLeave}
            onPointerDown={onDown}
            className={cn("grain relative isolate overflow-hidden bg-ink text-white", className)}
            style={{ touchAction: "pan-y" }}
            data-theme="dark"
            data-cursor="off"
        >
            <canvas ref={canvas} aria-hidden className="absolute inset-0 -z-10 h-full w-full" />
            <p className="sr-only">
                An interactive loom. Its warp threads are coloured from the cloths in the
                collection; moving across it weaves rows of cloth, and tapping a thread plucks it.
            </p>
            <div
                ref={label}
                aria-hidden
                className="pointer-events-none absolute top-0 left-0 z-20 bg-ink/90 px-2.5 py-1.5 text-[12px] tracking-[.06em] whitespace-nowrap text-white opacity-0 transition-opacity duration-150"
            />

            {children}

            {/* the weaver's tools */}
            <div className="absolute inset-x-0 bottom-0 z-10">
                <div className="container-x flex flex-wrap items-end justify-between gap-3 pb-4 sm:pb-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-ink/85 px-3 py-2">
                        <span className="hidden text-[13px] text-white/75 lg:inline">
                            Sweep across to weave · tap a thread to pluck it
                        </span>
                        <span className="hidden h-5 w-px bg-white/20 lg:inline" aria-hidden />
                        <span className="text-[11px] tracking-[.18em] text-white/60 uppercase">Your shuttle</span>
                        <div role="group" aria-label="Choose the weft colour" className="flex gap-1.5">
                            {SHUTTLES.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    aria-pressed={shuttle.id === s.id}
                                    aria-label={`Weave in ${s.label.toLowerCase()}`}
                                    title={s.label}
                                    onClick={() => setShuttle(s)}
                                    className={cn(
                                        "pressable h-7 w-7 rounded-full",
                                        shuttle.id === s.id
                                            ? "shadow-[0_0_0_2px_var(--bt-ink),0_0_0_4px_#fff]"
                                            : "hover:shadow-[0_0_0_2px_var(--bt-ink),0_0_0_3px_rgba(255,255,255,.5)]",
                                    )}
                                    style={{ background: s.hex }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="num hidden bg-ink/80 px-3 py-2 text-[12px] tracking-[.14em] text-white/70 uppercase sm:inline">
                            {rowCount} {rowCount === 1 ? "row" : "rows"} woven
                        </span>
                        <button
                            type="button"
                            onClick={toggleSound}
                            aria-pressed={sound}
                            className="pressable inline-flex h-10 items-center gap-2 bg-ink/80 px-3 text-[13px] text-white/85 shadow-[inset_0_0_0_1px_rgba(255,255,255,.22)] hover:bg-white hover:text-ink"
                        >
                            {sound ? (
                                <Volume2 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                            ) : (
                                <VolumeX aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                            )}
                            {sound ? "Sound on" : "Play the loom"}
                        </button>
                        <button
                            type="button"
                            onClick={keep}
                            disabled={saving}
                            className="pressable inline-flex h-10 items-center gap-2 bg-salmon px-3.5 text-[13px] font-medium text-ink hover:bg-white disabled:opacity-60"
                        >
                            <Download aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                            {saving ? "Weaving…" : "Keep your weave"}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
