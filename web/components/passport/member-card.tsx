"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The member card, as a card: it leans toward the hand that holds it (a
 * mouse tilts it, and the light slides across its surface), and it turns
 * over. The back is where a card is signed.
 *
 * Both faces are server-rendered and handed in; the side facing away is
 * hidden from assistive technology, and "Turn the card over" is a real
 * button. Under reduced motion the card neither tilts nor spins — it simply
 * shows its other face.
 */
export function MemberCard({ front, back, className }: { front: React.ReactNode; back: React.ReactNode; className?: string }) {
    const holder = useRef<HTMLDivElement | null>(null);
    const [flipped, setFlipped] = useState(false);

    function lean(event: ReactPointerEvent<HTMLDivElement>) {
        const el = holder.current;
        if (!el || event.pointerType !== "mouse") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const box = el.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width;
        const y = (event.clientY - box.top) / box.height;
        el.style.setProperty("--tilt-x", `${(0.5 - y) * 12}deg`);
        el.style.setProperty("--tilt-y", `${(x - 0.5) * 16}deg`);
        el.style.setProperty("--glare-x", `${x * 100}%`);
        el.style.setProperty("--glare-y", `${y * 100}%`);
        el.style.setProperty("--glare", "1");
    }

    function rest() {
        const el = holder.current;
        if (!el) return;
        el.style.setProperty("--tilt-x", "0deg");
        el.style.setProperty("--tilt-y", "0deg");
        el.style.setProperty("--glare", "0");
    }

    return (
        <div className={cn("mx-auto w-full max-w-[30rem]", className)}>
            <div className="[perspective:1400px]">
                <div
                    ref={holder}
                    onPointerMove={lean}
                    onPointerLeave={rest}
                    className="relative aspect-[1.586] transition-transform duration-300 ease-out will-change-transform"
                    style={{ transform: "rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))", transformStyle: "preserve-3d" }}
                >
                    <div
                        className="relative h-full w-full transition-transform duration-[800ms] ease-[cubic-bezier(.2,.8,.2,1)]"
                        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "none" }}
                    >
                        <div className="absolute inset-0 [backface-visibility:hidden]" aria-hidden={flipped} inert={flipped}>
                            {front}
                        </div>
                        <div
                            className="absolute inset-0 [backface-visibility:hidden]"
                            style={{ transform: "rotateY(180deg)" }}
                            aria-hidden={!flipped}
                            inert={!flipped}
                        >
                            {back}
                        </div>
                    </div>
                    {/* the light sliding over the laminate */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                        style={{
                            opacity: "var(--glare, 0)",
                            background:
                                "radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,244,226,.38), rgba(255,244,226,0) 55%)",
                            mixBlendMode: "soft-light",
                        }}
                    />
                </div>
            </div>
            <div className="mt-3 flex justify-center">
                <button
                    type="button"
                    aria-pressed={flipped}
                    onClick={() => setFlipped((v) => !v)}
                    className="pressable inline-flex h-10 items-center gap-2 px-3 text-[14px] text-ink-2 hover:text-ink"
                >
                    <RefreshCcw aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    {flipped ? "Turn it back" : "Turn the card over"}
                </button>
            </div>
        </div>
    );
}
