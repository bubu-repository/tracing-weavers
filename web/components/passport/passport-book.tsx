"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
} from "react";
import {
    animate,
    motion,
    motionValue,
    useReducedMotion,
    useTransform,
    type MotionValue,
} from "framer-motion";
import { Button } from "@/components/ui/button";

export type BookPage = { id: string; label: string; content: ReactNode };

type Sheet = { id: string; front: BookPage; back: BookPage | null };

/* Two pages to a sheet, the way paper works: what you see on the right is the
   front of the next sheet, and turning it puts its back on the left. */
function toSheets(pages: BookPage[]): Sheet[] {
    const sheets: Sheet[] = [];
    for (let i = 0; i < pages.length; i += 2) {
        sheets.push({
            id: pages[i].id,
            front: pages[i],
            back: pages[i + 1] ?? null,
        });
    }
    return sheets;
}

/**
 * The passport as a book you actually turn.
 *
 * The first version rotated a single card and called it a page turn. This one
 * is built the way a book is built: sheets with two faces, hinged at the spine
 * in the middle of the spread. Turning a sheet rotates it about that hinge, its
 * front leaves the right-hand page and its back arrives on the left-hand one,
 * and the lighting follows — the lifting face darkens towards the spine, the
 * arriving face brightens out of it, and the sheet casts a soft gradient across
 * the page underneath. On a phone the spread is clipped to the right-hand page,
 * so the same book reads as a single page with the spine at its left edge.
 *
 * You can drag it. Pull the page anywhere across the spread and it follows the
 * pointer one-to-one; let go past a third of the way, or flick it, and it
 * completes on its own. A flick is enough (velocity > 0.5 px/ms) — a real page
 * does not demand that you carry it all the way over.
 *
 * Everything works without any of that: the buttons, the arrow keys and the
 * page dots move the same index, and `prefers-reduced-motion` swaps the spread
 * with no rotation at all.
 */
export function PassportBook({
    pages,
    insideCover,
    backCover,
    tone = "paper",
    className,
}: {
    pages: BookPage[];
    /** "ink" when the book lies on the gallery wall: light controls */
    tone?: "paper" | "ink";
    /** Printed on the left-hand page while no sheet has been turned onto it —
        a real passport's inside cover, so the spread is never half empty. */
    insideCover?: ReactNode;
    /** Printed on the right-hand page once every sheet has been turned. */
    backCover?: ReactNode;
    className?: string;
}) {
    /* Keyed on the page ids: the parent rebuilds the array on every render, and
       the turn effect below must not restart mid-animation because of it. */
    const key = pages.map((page) => page.id).join("|");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const sheets = useMemo(() => toSheets(pages), [key]);
    const count = sheets.length;
    const reduce = useReducedMotion();

    /* How many sheets are lying on the left: 0 = closed on the cover. */
    const [index, setIndex] = useState(0);
    const [drag, setDrag] = useState<number | null>(null);
    const [hint, setHint] = useState(true);

    /* One rotation value per sheet, kept outside React so the drag can write to
       it every frame without a re-render. */
    const rots = useRef(new Map<string, MotionValue<number>>());
    const rotFor = useCallback((sheet: Sheet, turned: boolean) => {
        const found = rots.current.get(sheet.id);
        if (found) return found;
        const made = motionValue(turned ? -180 : 0);
        rots.current.set(sheet.id, made);
        return made;
    }, []);

    const atStart = index === 0;
    const atEnd = index >= count;

    const go = useCallback(
        (delta: number) => {
            setIndex((p) => Math.min(Math.max(p + delta, 0), count));
            setHint(false);
        },
        [count],
    );

    /* Buttons, keys and dots move the index; the sheets follow it here. The
       sheet that was just dragged is already at its target, so this is a
       no-op for it rather than a second animation. */
    useEffect(() => {
        sheets.forEach((sheet, i) => {
            const rot = rotFor(sheet, i < index);
            const target = i < index ? -180 : 0;
            if (rot.get() === target) return;
            if (reduce) {
                rot.set(target);
                return;
            }
            animate(rot, target, { duration: 0.75, ease: [0.23, 1, 0.32, 1] });
        });
    }, [index, reduce, sheets, rotFor]);

    useEffect(() => {
        function onKey(event: KeyboardEvent) {
            /* Never steal the arrows from someone typing, or from a control
               that uses them itself (a tab list, a slider). */
            const target = event.target as HTMLElement | null;
            if (
                event.altKey ||
                event.metaKey ||
                event.ctrlKey ||
                target?.closest("input, textarea, select, [contenteditable], [role=tablist], [role=slider]")
            ) {
                return;
            }
            if (event.key === "ArrowRight") go(1);
            if (event.key === "ArrowLeft") go(-1);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [go]);

    /* ── the drag ─────────────────────────────────────────────────────────
       Direction is decided by the first few pixels of movement, not by which
       half was grabbed: on a phone there is only one half to grab. */
    const pull = useRef<{
        x: number;
        t: number;
        lastX: number;
        lastT: number;
        width: number;
        sheet: number | null;
        forward: boolean;
    } | null>(null);

    function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const box = event.currentTarget.getBoundingClientRect();
        pull.current = {
            x: event.clientX,
            t: performance.now(),
            lastX: event.clientX,
            lastT: performance.now(),
            width: box.width,
            sheet: null,
            forward: true,
        };
    }

    function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
        const p = pull.current;
        if (!p) return;
        const dx = event.clientX - p.x;

        if (p.sheet === null) {
            if (Math.abs(dx) < 8) return;
            const forward = dx < 0;
            const sheet = forward ? index : index - 1;
            if (sheet < 0 || sheet >= count) {
                pull.current = null;
                return;
            }
            p.forward = forward;
            p.sheet = sheet;
            setDrag(sheet);
            setHint(false);
            event.currentTarget.setPointerCapture?.(event.pointerId);
        }

        p.lastX = event.clientX;
        p.lastT = performance.now();

        const sheet = sheets[p.sheet];
        const rot = rotFor(sheet, !p.forward);
        /* The page follows the pointer one to one across the width of a page. */
        const span = Math.max(p.width / 2, 1);
        const amount = Math.min(Math.max(Math.abs(dx) / span, 0), 1);
        rot.set(p.forward ? -180 * amount : -180 * (1 - amount));
    }

    function endPull(event: ReactPointerEvent<HTMLDivElement>) {
        const p = pull.current;
        pull.current = null;
        if (!p || p.sheet === null) {
            setDrag(null);
            return;
        }

        const sheet = sheets[p.sheet];
        const rot = rotFor(sheet, !p.forward);
        const travelled = Math.abs(rot.get()) / 180;
        const amount = p.forward ? travelled : 1 - travelled;

        const elapsed = Math.max(performance.now() - p.lastT + 1, 1);
        const velocity = Math.abs(event.clientX - p.lastX) / elapsed;
        const flicked = velocity > 0.5;
        const commit = amount > 0.34 || flicked;

        const target = commit === p.forward ? -180 : 0;
        const settle = () => {
            setDrag(null);
            setIndex(commit ? (p.forward ? p.sheet! + 1 : p.sheet!) : index);
        };

        if (reduce) {
            rot.set(target);
            settle();
            return;
        }
        animate(rot, target, {
            duration: commit ? 0.42 : 0.28,
            ease: [0.23, 1, 0.32, 1],
            onComplete: settle,
        });
    }

    const spreadLabel = atStart
        ? `Cover · ${count} ${count === 1 ? "sheet" : "sheets"}`
        : atEnd
          ? "Back cover"
          : (sheets[index]?.front.label ?? "");

    return (
        <div className={className}>
            {/* the block of the book: the closed edges under the spread */}
            <div className="relative">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-2 top-1.5 bottom-0 -z-10 rounded-[3px] bg-card shadow-[var(--ring),0_18px_44px_rgba(32,30,29,.14)]"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-3.5 top-3 bottom-0 -z-20 rounded-[3px] bg-card/70 shadow-[var(--ring)]"
                />

                <div
                    data-theme="light"
                    className="relative aspect-[3/4] w-full touch-pan-y overflow-hidden rounded-[3px] text-ink select-none sm:aspect-[3/2]"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endPull}
                    onPointerCancel={endPull}
                >
                    <div
                        className="absolute inset-y-0 -left-full w-[200%] [perspective:2200px] [transform-style:preserve-3d] sm:left-0 sm:w-full"
                        style={{ perspectiveOrigin: "50% 50%" }}
                    >
                        {/* the inside of the covers, behind every sheet */}
                        <Endpaper side="left">{insideCover}</Endpaper>
                        <Endpaper side="right">{backCover}</Endpaper>

                        {sheets.map((sheet, i) => (
                            <BookSheet
                                key={sheet.id}
                                sheet={sheet}
                                rot={rotFor(sheet, i < index)}
                                dragging={drag === i}
                                live={drag === i || i === index || i === index - 1}
                                z={
                                    drag === i
                                        ? count + 2
                                        : i < index
                                          ? i + 1
                                          : count - i
                                }
                                showCorner={i === index && drag === null}
                            />
                        ))}

                        {/* the spine, drawn over the pages it binds */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0 left-1/2 z-[60] w-6 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(32,30,29,.16)_42%,rgba(32,30,29,.30)_50%,rgba(32,30,29,.16)_58%,transparent)] sm:w-10"
                        />
                    </div>
                </div>
            </div>

            {/* the controls, which do exactly what the drag does */}
            <div className="mt-5 flex items-center justify-between gap-3">
                <Button
                    variant={tone === "ink" ? "inverseGhost" : "ghost"}
                    size="sm"
                    onClick={() => go(-1)}
                    disabled={atStart}
                    aria-label="Previous page"
                >
                    ← Back
                </Button>

                <p
                    aria-live="polite"
                    className="data min-w-0 flex-1 truncate text-center text-[12px] text-muted-foreground"
                >
                    {spreadLabel}
                </p>

                <Button
                    size="sm"
                    variant={tone === "ink" ? "inverse" : "primary"}
                    onClick={() => go(1)}
                    disabled={atEnd}
                    aria-label="Next page"
                >
                    Turn →
                </Button>
            </div>

            <div className="mt-3 flex justify-center gap-1.5">
                {Array.from({ length: count + 1 }, (_, i) => (
                    <button
                        key={i}
                        type="button"
                        aria-label={`Go to spread ${i + 1}`}
                        onClick={() => {
                            setIndex(i);
                            setHint(false);
                        }}
                        className={`pressable h-1.5 rounded-full transition-[width,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                            i === index
                                ? tone === "ink"
                                    ? "w-7 bg-salmon"
                                    : "w-7 bg-bt-red"
                                : tone === "ink"
                                  ? "w-3 bg-white/25 hover:bg-white/60"
                                  : "w-3 bg-stone hover:bg-ink-3"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

/* ── one sheet, two faces ───────────────────────────────────────────────── */

function BookSheet({
    sheet,
    rot,
    z,
    dragging,
    live,
    showCorner,
}: {
    sheet: Sheet;
    rot: MotionValue<number>;
    z: number;
    dragging: boolean;
    live: boolean;
    showCorner: boolean;
}) {
    /* Light: the face that is lifting falls into shadow towards the spine, the
       face arriving comes out of it. Both are gradients over the page, not a
       filter on it, so the text underneath stays crisp. */
    const frontShade = useTransform(rot, [0, -30, -90], [0, 0.06, 0.4]);
    const backShade = useTransform(rot, [-180, -150, -90], [0, 0.08, 0.42]);
    /* The shadow the lifted sheet throws across the page beneath it. */
    const cast = useTransform(rot, [0, -20, -90, -160, -180], [0, 0.22, 0.3, 0.22, 0]);

    return (
        <motion.div
            aria-hidden={!live}
            className="absolute inset-y-0 left-1/2 w-1/2 [transform-style:preserve-3d]"
            style={{
                rotateY: rot,
                transformOrigin: "left center",
                zIndex: z,
                pointerEvents: live ? "auto" : "none",
                willChange: dragging ? "transform" : undefined,
            }}
        >
            {/* front: the right-hand page */}
            <div className="absolute inset-0 overflow-hidden rounded-r-[3px] [backface-visibility:hidden]">
                {sheet.front.content}
                <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(32,30,29,1),rgba(32,30,29,0)_55%)]"
                    style={{ opacity: frontShade }}
                />
                {showCorner && <Corner />}
            </div>

            {/* back: what lands on the left-hand page, already mirrored */}
            <div
                className="absolute inset-0 overflow-hidden rounded-l-[3px] [backface-visibility:hidden]"
                style={{ transform: "rotateY(180deg)" }}
            >
                {sheet.back?.content ?? <Endpaper side="plain" />}
                <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(270deg,rgba(32,30,29,1),rgba(32,30,29,0)_55%)]"
                    style={{ opacity: backShade }}
                />
            </div>

            {/* the sheet's own shadow, thrown to the right as it lifts */}
            <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -right-16 w-16 bg-[linear-gradient(90deg,rgba(32,30,29,.5),transparent)]"
                style={{ opacity: cast, transform: "translateZ(-1px)" }}
            />
        </motion.div>
    );
}

/* The corner you can take hold of: a fold that lifts under the pointer. */
function Corner() {
    return (
        <div aria-hidden className="group/corner absolute right-0 bottom-0 h-20 w-20">
            <div className="absolute inset-0 bg-[linear-gradient(315deg,rgba(32,30,29,.16),transparent_46%)] transition-opacity duration-200 [@media(hover:hover)]:opacity-60 [@media(hover:hover)]:group-hover/corner:opacity-100" />
            <div
                className="absolute right-0 bottom-0 h-7 w-7 bg-card shadow-[-2px_-2px_6px_rgba(32,30,29,.18)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] [clip-path:polygon(100%_0,100%_100%,0_100%)] [@media(hover:hover)]:group-hover/corner:scale-125 motion-reduce:transition-none"
            />
            {/* No label: the cover says "drag the page to open it", and a
                second hint on top of the fold only made the corner noisy. */}
        </div>
    );
}

/* Inside the covers: woven paper, so a half-turned sheet never shows a hole.
   The gutter gradient is an inline style on purpose — a class name built by
   string interpolation is not in the stylesheet Tailwind generates. */
function Endpaper({
    side,
    children,
}: {
    side: "left" | "right" | "plain";
    children?: ReactNode;
}) {
    const place =
        side === "left"
            ? "absolute inset-y-0 left-0 w-1/2 rounded-l-[3px]"
            : side === "right"
              ? "absolute inset-y-0 right-0 w-1/2 rounded-r-[3px]"
              : "absolute inset-0";
    const gutter = side === "right" ? "90deg" : "270deg";
    return (
        <div
            aria-hidden
            className={`${place} cloth bg-[#EDE7DC] shadow-[inset_0_0_0_1px_var(--bt-stone-2)]`}
        >
            {children}
            <div
                className="absolute inset-y-0 w-10"
                style={{
                    [side === "right" ? "left" : "right"]: 0,
                    backgroundImage: `linear-gradient(${gutter},rgba(32,30,29,.14),transparent)`,
                }}
            />
        </div>
    );
}
