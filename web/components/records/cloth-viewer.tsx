"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

type View = { s: number; x: number; y: number };
type Point = { x: number; y: number };

const MIN = 1;
const MAX = 6;
const REST: View = { s: 1, x: 0, y: 0 };

/**
 * The photograph, and a way to look closer at it.
 *
 * A weave is read up close — the ikat's blur at the edge of a motif, the
 * float of a supplementary thread — and a phone screen shows a cloth the size
 * of a stamp. So the photograph opens into a viewer: pinch or scroll to zoom
 * (towards the point under the fingers or the pointer), drag to move,
 * double-tap to jump in and out, + − 0 and Esc on a keyboard.
 */
export function ClothViewer({
    src,
    alt,
    title,
    className,
    imgClassName,
    style,
    children,
}: {
    src: string;
    alt: string;
    /** shown in the viewer's top bar */
    title: string;
    className?: string;
    imgClassName?: string;
    style?: React.CSSProperties;
    /** overlays drawn on the photograph (number, status) */
    children?: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement | null>(null);
    const close = useCallback(() => {
        setOpen(false);
        trigger.current?.focus();
    }, []);

    return (
        <>
            <button
                ref={trigger}
                type="button"
                onClick={() => setOpen(true)}
                aria-label={`Look closer at ${alt}`}
                className={cn("group relative block w-full cursor-zoom-in overflow-hidden", className)}
                style={style}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt}
                    fetchPriority="high"
                    draggable={false}
                    className={cn("settle", imgClassName)}
                />
                {children}
                <span className="absolute right-3 bottom-3 inline-flex items-center gap-2 bg-ink/82 px-3 py-2 text-[11px] tracking-[.16em] text-white uppercase transition-colors duration-200 group-hover:bg-salmon group-hover:text-ink">
                    <Maximize2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Look closer
                </span>
            </button>
            {open && <Lightbox src={src} alt={alt} title={title} onClose={close} />}
        </>
    );
}

function Lightbox({
    src,
    alt,
    title,
    onClose,
}: {
    src: string;
    alt: string;
    title: string;
    onClose: () => void;
}) {
    const root = useRef<HTMLDivElement | null>(null);
    const stage = useRef<HTMLDivElement | null>(null);
    const closeButton = useRef<HTMLButtonElement | null>(null);
    const [view, setView] = useState<View>(REST);
    const [moving, setMoving] = useState(false);
    const [hint, setHint] = useState(true);
    const viewRef = useRef<View>(REST);
    const pointers = useRef(new Map<number, Point>());
    const pinch = useRef<{ dist: number; mid: Point; view: View } | null>(null);
    const lastTap = useRef<{ t: number; p: Point } | null>(null);

    const apply = useCallback((next: View) => {
        const el = stage.current;
        const s = Math.min(Math.max(next.s, MIN), MAX);
        let { x, y } = next;
        if (el) {
            const box = el.getBoundingClientRect();
            const maxX = (box.width * (s - 1)) / 2;
            const maxY = (box.height * (s - 1)) / 2;
            x = Math.min(Math.max(x, -maxX), maxX);
            y = Math.min(Math.max(y, -maxY), maxY);
        }
        const clamped = s === 1 ? REST : { s, x, y };
        viewRef.current = clamped;
        setView(clamped);
    }, []);

    /* A point on screen, relative to the centre of the stage. */
    const rel = useCallback((clientX: number, clientY: number): Point => {
        const box = stage.current?.getBoundingClientRect();
        if (!box) return { x: 0, y: 0 };
        return { x: clientX - (box.left + box.width / 2), y: clientY - (box.top + box.height / 2) };
    }, []);

    /* Zoom by `factor`, keeping the point `p` where it is. */
    const zoomAt = useCallback(
        (factor: number, p: Point = { x: 0, y: 0 }) => {
            const v = viewRef.current;
            const s = Math.min(Math.max(v.s * factor, MIN), MAX);
            const k = s / v.s;
            apply({ s, x: p.x - (p.x - v.x) * k, y: p.y - (p.y - v.y) * k });
            setHint(false);
        },
        [apply],
    );

    /* Lock the page behind, focus the viewer, listen for keys and the wheel. */
    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeButton.current?.focus();

        function onKey(event: KeyboardEvent) {
            if (event.key === "Escape") onClose();
            else if (event.key === "+" || event.key === "=") zoomAt(1.5);
            else if (event.key === "-" || event.key === "_") zoomAt(1 / 1.5);
            else if (event.key === "0") apply(REST);
        }
        const el = stage.current;
        function onWheel(event: WheelEvent) {
            event.preventDefault();
            zoomAt(Math.exp(-event.deltaY * 0.0022), rel(event.clientX, event.clientY));
        }
        window.addEventListener("keydown", onKey);
        el?.addEventListener("wheel", onWheel, { passive: false });
        const timer = window.setTimeout(() => setHint(false), 3200);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKey);
            el?.removeEventListener("wheel", onWheel);
            window.clearTimeout(timer);
        };
    }, [apply, onClose, rel, zoomAt]);

    /* Keep Tab inside the dialog. */
    function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
        if (event.key !== "Tab" || !root.current) return;
        const items = [...root.current.querySelectorAll<HTMLElement>("button")];
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

    /* ── pointer: drag, pinch, double tap ─────────────────────────────── */

    function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
        event.currentTarget.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        setMoving(true);
        setHint(false);

        if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            pinch.current = {
                dist: Math.hypot(a.x - b.x, a.y - b.y),
                mid: rel((a.x + b.x) / 2, (a.y + b.y) / 2),
                view: viewRef.current,
            };
            return;
        }

        /* double tap / double click */
        const now = performance.now();
        const p = rel(event.clientX, event.clientY);
        const prev = lastTap.current;
        if (prev && now - prev.t < 300 && Math.hypot(p.x - prev.p.x, p.y - prev.p.y) < 30) {
            lastTap.current = null;
            if (viewRef.current.s > 1.05) apply(REST);
            else zoomAt(2.5, p);
            return;
        }
        lastTap.current = { t: now, p };
    }

    function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
        const before = pointers.current.get(event.pointerId);
        if (!before) return;
        const now = { x: event.clientX, y: event.clientY };
        pointers.current.set(event.pointerId, now);

        if (pointers.current.size >= 2 && pinch.current) {
            const [a, b] = [...pointers.current.values()];
            const start = pinch.current;
            const s = Math.min(Math.max(start.view.s * (Math.hypot(a.x - b.x, a.y - b.y) / start.dist), MIN), MAX);
            const k = s / start.view.s;
            const mid = rel((a.x + b.x) / 2, (a.y + b.y) / 2);
            apply({
                s,
                x: start.mid.x - (start.mid.x - start.view.x) * k + (mid.x - start.mid.x),
                y: start.mid.y - (start.mid.y - start.view.y) * k + (mid.y - start.mid.y),
            });
            return;
        }

        const v = viewRef.current;
        if (v.s > 1) apply({ ...v, x: v.x + now.x - before.x, y: v.y + now.y - before.y });
    }

    function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
        pointers.current.delete(event.pointerId);
        if (pointers.current.size < 2) pinch.current = null;
        if (pointers.current.size === 0) setMoving(false);
    }

    const zoomed = view.s > 1.01;

    return createPortal(
        <div
            ref={root}
            role="dialog"
            aria-modal="true"
            aria-label={`${title} — close-up`}
            onKeyDown={trapFocus}
            data-lenis-prevent
            data-theme="dark"
            className="fixed inset-0 z-[100] flex flex-col bg-[#141312] text-white"
        >
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <p className="min-w-0 truncate text-[15px] text-white/80">{title}</p>
                <div className="flex shrink-0 items-center gap-1">
                    <ToolButton label="Zoom out" onClick={() => zoomAt(1 / 1.5)} disabled={!zoomed}>
                        <Minus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    </ToolButton>
                    <span className="data w-12 text-center text-[12px] text-white/60" aria-live="polite">
                        {Math.round(view.s * 100)}%
                    </span>
                    <ToolButton label="Zoom in" onClick={() => zoomAt(1.5)} disabled={view.s >= MAX}>
                        <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    </ToolButton>
                    <ToolButton label="Reset zoom" onClick={() => apply(REST)} disabled={!zoomed}>
                        <RotateCcw aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    </ToolButton>
                    <button
                        ref={closeButton}
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="pressable ml-2 grid h-10 w-10 place-items-center bg-white text-ink hover:bg-salmon"
                    >
                        <X aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                    </button>
                </div>
            </div>

            <div
                ref={stage}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className={cn(
                    "relative flex-1 touch-none overflow-hidden select-none",
                    zoomed ? (moving ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
                )}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    className={cn(
                        "absolute inset-0 h-full w-full object-contain will-change-transform",
                        !moving && "transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    )}
                    style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.s})` }}
                />
                <p
                    className={cn(
                        "pointer-events-none absolute inset-x-0 bottom-6 mx-auto w-fit bg-ink/80 px-4 py-2 text-center text-[13px] text-white/80 transition-opacity duration-500",
                        hint ? "opacity-100" : "opacity-0",
                    )}
                >
                    Pinch or scroll to zoom · drag to move · double-tap to jump
                </p>
            </div>
        </div>,
        document.body,
    );
}

function ToolButton({
    label,
    onClick,
    disabled,
    children,
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className="pressable grid h-10 w-10 place-items-center text-white/85 shadow-[inset_0_0_0_1px_rgba(255,255,255,.22)] hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
        >
            {children}
        </button>
    );
}
