"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/* the watermark pressed into every certificate's paper: the app's mark —
   three warp threads and a weft across them — with the certificate's own id
   running between, the way a banknote carries its serial in the sheet */
function watermark(id: string) {
    const safe = id.replace(/[^A-Za-z0-9-]/g, "");
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='132' height='132' viewBox='0 0 132 132'><g fill='none' stroke='%23201E1D' stroke-width='2' opacity='.9'><path d='M22 14v34M32 14v34M42 14v34'/><path d='M14 31h36' stroke-width='3'/></g><g fill='%23201E1D' font-family='monospace' font-size='7' letter-spacing='1'><text x='60' y='34'>TRACING WEAVERS</text><text x='6' y='74' transform='rotate(-12 66 74)'>${safe}</text><text x='60' y='112'>ADONARA · LEMBATA</text></g><g fill='none' stroke='%23201E1D' stroke-width='2' opacity='.9'><path d='M88 82v34M98 82v34M108 82v34'/><path d='M80 99h36' stroke-width='3'/></g></svg>`;
    return `url("data:image/svg+xml;utf8,${svg}")`;
}

/**
 * Hold the certificate up to the light.
 *
 * Paper certificates are checked this way: against a window, the watermark
 * in the sheet shows through. Here a lamp follows the pointer (or a finger
 * dragged across the certificate) and brings up the watermark under it —
 * the programme's mark and this certificate's own id, pressed into the
 * paper. "Hold it up to the light" lights the whole sheet at once, for a
 * keyboard, a screen reader, or a tap.
 */
export function LightTable({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
    const host = useRef<HTMLDivElement | null>(null);
    const [lamp, setLamp] = useState(false);
    const [backlit, setBacklit] = useState(false);

    function follow(event: ReactPointerEvent<HTMLDivElement>) {
        const el = host.current;
        if (!el) return;
        const box = el.getBoundingClientRect();
        el.style.setProperty("--lx", `${event.clientX - box.left}px`);
        el.style.setProperty("--ly", `${event.clientY - box.top}px`);
    }

    return (
        <div className={className}>
            <div
                ref={host}
                onPointerMove={follow}
                onPointerEnter={(e) => {
                    follow(e);
                    setLamp(true);
                }}
                onPointerLeave={() => setLamp(false)}
                onPointerDown={(e) => {
                    follow(e);
                    setLamp(true);
                }}
                onPointerUp={(e) => {
                    /* a finger cannot hover: the lamp stays where it tapped for a moment */
                    if (e.pointerType !== "mouse") window.setTimeout(() => setLamp(false), 1800);
                }}
                className={cn(
                    "relative transition-[filter] duration-500",
                    backlit && "brightness-[1.06] drop-shadow-[0_0_38px_rgba(255,226,170,.7)]",
                )}
            >
                {children}
                {/* the watermark, seen only where the light comes through */}
                <div
                    aria-hidden
                    className={cn(
                        "pointer-events-none absolute inset-0 transition-opacity duration-300",
                        backlit ? "opacity-[.22]" : lamp ? "opacity-[.34]" : "opacity-0",
                    )}
                    style={{
                        backgroundImage: watermark(id),
                        backgroundSize: "132px 132px",
                        mixBlendMode: "multiply",
                        maskImage: backlit
                            ? "none"
                            : "radial-gradient(circle 130px at var(--lx, 50%) var(--ly, 50%), #000 0, rgba(0,0,0,.6) 45%, transparent 100%)",
                        WebkitMaskImage: backlit
                            ? "none"
                            : "radial-gradient(circle 130px at var(--lx, 50%) var(--ly, 50%), #000 0, rgba(0,0,0,.6) 45%, transparent 100%)",
                    }}
                />
                {/* the lamp itself: warm light on the paper */}
                <div
                    aria-hidden
                    className={cn(
                        "pointer-events-none absolute inset-0 transition-opacity duration-300",
                        lamp && !backlit ? "opacity-100" : "opacity-0",
                    )}
                    style={{
                        background:
                            "radial-gradient(circle 150px at var(--lx, 50%) var(--ly, 50%), rgba(255,236,200,.55), rgba(255,236,200,0) 70%)",
                        mixBlendMode: "soft-light",
                    }}
                />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                    type="button"
                    aria-pressed={backlit}
                    onClick={() => setBacklit((v) => !v)}
                    className="pressable inline-flex h-10 items-center gap-2 px-3 text-[14px] text-ink shadow-[inset_0_0_0_1px_var(--bt-stone)] hover:bg-ink hover:text-white"
                >
                    <Sun aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    {backlit ? "Put it down" : "Hold it up to the light"}
                </button>
                <span className="text-[13px] text-ink-3">
                    {backlit ? "The watermark carries this certificate's id." : "Or move across it to find the watermark."}
                </span>
            </div>
        </div>
    );
}
