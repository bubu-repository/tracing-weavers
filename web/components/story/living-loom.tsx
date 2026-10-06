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
    { id: "cotton", label: "Undyed cotton", hex: "#DCCFBB" },
];

/* The cloth already on the loom when you arrive — a few bands to start from. */
const OPENING = ["cotton", "cotton", "morinda", "morinda", "cotton", "indigo", "indigo", "indigo", "turmeric", "indigo", "cotton", "cotton", "clay", "cotton"];

const POINTS = 26; // control points along each warp thread
/* the loom stands in daylight on undyed cotton paper */
const PAPER = "#F0EADF";
const SHADOW = "rgba(60, 44, 28, 0.17)";

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
    stageClassName,
}: {
    cloths: LoomCloth[];
    className?: string;
    /** the height of the warp, e.g. "h-[480px]" */
    stageClassName?: string;
}) {
    const host = useRef<HTMLDivElement | null>(null);
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
        /* the paper shows through: the section is the sheet the loom stands on */
        ctx.clearRect(0, 0, s.w, s.h);
        const fell = s.h - s.wovenH;
        const gap = fell / (POINTS - 1);

        /* one warp thread, from the top of the loom to the fell */
        const trace = (t: Thread, dx: number) => {
            ctx.beginPath();
            ctx.moveTo(t.x + t.p[0] + dx, 0);
            for (let k = 1; k < POINTS; k++) {
                const x0 = t.x + t.p[k - 1] + dx;
                const y0 = (k - 1) * gap;
                const x1 = t.x + t.p[k] + dx;
                const y1 = k * gap;
                ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
            }
            ctx.lineTo(t.x + dx, fell);
        };
        ctx.lineCap = "round";

        /* the warp is stretched a finger's width above the sheet, so each
           thread throws a soft shadow down and to the right of it */
        ctx.strokeStyle = SHADOW;
        ctx.lineWidth = s.tw + 1.6;
        for (const t of s.threads) {
            trace(t, 3);
            ctx.stroke();
        }
        /* the threads themselves */
        ctx.lineWidth = s.tw;
        for (const t of s.threads) {
            ctx.strokeStyle = t.color;
            trace(t, 0);
            ctx.stroke();
        }

        /* the cloth on the beam, with the shadow it lays on the paper above it */
        if (s.woven) {
            const shade = ctx.createLinearGradient(0, fell - 14, 0, fell);
            shade.addColorStop(0, "rgba(60,44,28,0)");
            shade.addColorStop(1, "rgba(60,44,28,0.2)");
            ctx.fillStyle = shade;
            ctx.fillRect(0, fell - 14, s.w, 14);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(s.woven, 0, 0);
            ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
        }

        /* the reed, just above the fell; it darkens on each beat */
        ctx.fillStyle = `rgba(174,24,0,${0.22 + s.beat * 0.55})`;
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
            ctx.fillStyle = SHADOW;
            ctx.beginPath();
            ctx.ellipse(3, 3, 17, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#B8895C";
            ctx.beginPath();
            ctx.ellipse(0, 0, 17, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#7A5634";
            ctx.lineWidth = 0.8;
            ctx.stroke();
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
            ctx.fillStyle = PAPER;
            ctx.fillRect(0, 0, W, H);
            /* fibre in the sheet */
            for (let i = 0; i < 2600; i++) {
                ctx.fillStyle = `rgba(90,68,44,${0.03 + Math.random() * 0.06})`;
                ctx.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 5, 0.8);
            }

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
            /* the warp above the cloth, still on the loom, with its shadow */
            for (const [dx, width, colour] of [[4, tw + 2, SHADOW], [0, tw, ""]] as const) {
                ctx.lineWidth = width;
                for (const w of warps) {
                    ctx.strokeStyle = colour || w.color;
                    ctx.beginPath();
                    ctx.moveTo(w.x + dx, 0);
                    ctx.lineTo(w.x + dx, top);
                    ctx.stroke();
                }
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
            /* a running stitch along the hem */
            ctx.fillStyle = "#AE1800";
            for (let x = 0; x < W; x += 22) ctx.fillRect(x, clothH + 14, 13, 3);
            ctx.fillStyle = "#AE1800";
            ctx.font = "600 22px ui-monospace, Menlo, monospace";
            ctx.fillText(`WOVEN BY YOU · ${s.rows.length} ROWS`, 64, clothH + 76);
            ctx.fillStyle = "#201E1D";
            ctx.font = "900 64px system-ui, -apple-system, Segoe UI, sans-serif";
            ctx.fillText("A cloth no one else will weave.", 64, clothH + 160);
            ctx.fillStyle = "#55504A";
            ctx.font = "400 26px Georgia, 'Times New Roman', serif";
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
        <div className={cn("relative", className)}>
            {/* the loom: warp stretched between two beams, on a sheet of paper */}
            <div className="card-stock relative px-2 py-1 sm:px-2.5">
                <Beam />
                <div
                    ref={host}
                    onPointerMove={onMove}
                    onPointerLeave={onLeave}
                    onPointerUp={(e) => {
                        if (e.pointerType !== "mouse") onLeave();
                    }}
                    onPointerCancel={onLeave}
                    onPointerDown={onDown}
                    className={cn("paper relative isolate h-[440px] overflow-hidden", stageClassName)}
                    style={{ touchAction: "pan-y" }}
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
                        className="card-stock pointer-events-none absolute top-0 left-0 z-20 px-2.5 py-1.5 text-[12.5px] tracking-[.04em] whitespace-nowrap text-ink opacity-0 transition-opacity duration-150"
                    />
                </div>
                <Beam />
            </div>

            {/* the weaver's tools, under the loom */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                <div className="flex items-center gap-3">
                    <span className="text-[12px] tracking-[.14em] text-ink-3 uppercase">Shuttle</span>
                    <div role="group" aria-label="Choose the weft colour" className="flex gap-2">
                        {SHUTTLES.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                aria-pressed={shuttle.id === s.id}
                                aria-label={`Weave in ${s.label.toLowerCase()}`}
                                title={s.label}
                                onClick={() => setShuttle(s)}
                                className={cn(
                                    "pressable h-8 w-8 rounded-full",
                                    shuttle.id === s.id
                                        ? "shadow-[0_0_0_2px_var(--surface-page),0_0_0_3.5px_var(--bt-ink)]"
                                        : "shadow-[inset_0_0_0_1px_rgba(32,30,29,.18)] hover:shadow-[0_0_0_2px_var(--surface-page),0_0_0_3px_var(--bt-stone)]",
                                )}
                                style={{ background: s.hex }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="num hidden pr-1 text-[13px] text-ink-3 sm:inline">
                        {rowCount} {rowCount === 1 ? "row" : "rows"} woven
                    </span>
                    <button
                        type="button"
                        onClick={toggleSound}
                        aria-pressed={sound}
                        className="pressable inline-flex h-10 items-center gap-2 px-3 text-[14px] text-ink shadow-[inset_0_0_0_1px_var(--bt-stone)] hover:bg-ink hover:text-white"
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
                        className="pressable tactile inline-flex h-10 items-center gap-2 bg-bt-red px-3.5 text-[14px] font-medium text-white hover:bg-bt-red-bright disabled:opacity-60"
                    >
                        <Download aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                        {saving ? "Weaving…" : "Keep your weave"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* A beam of the loom: a rod of wood, turned and oiled, a little longer than
   the warp is wide. */
function Beam() {
    return (
        <div
            aria-hidden
            className="relative z-10 -mx-3 h-3.5 rounded-full shadow-[0_3px_4px_-1px_rgba(60,44,28,.45)] sm:-mx-4 sm:h-4"
            style={{
                backgroundImage:
                    "repeating-linear-gradient(90deg, rgba(60,36,16,.12) 0 1px, transparent 1px 9px, rgba(255,240,220,.08) 9px 10px, transparent 10px 23px), linear-gradient(180deg, #D9AE80 0%, #B98A5C 38%, #93683F 78%, #7A5533 100%)",
            }}
        />
    );
}
