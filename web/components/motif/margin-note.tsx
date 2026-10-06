import { cn } from "@/lib/utils";

/**
 * A pencil note in the margin, in the cataloguer's hand, with the little
 * arrow people draw to point at the thing they mean. Used sparingly — two or
 * three on the whole site — so it reads as someone having been here, not as a
 * style. Always decoration beside text that already says the same thing, so
 * it is hidden from assistive technology.
 */
export function MarginNote({
    children,
    arrow = "down-left",
    className,
}: {
    children: React.ReactNode;
    arrow?: "down-left" | "down-right" | "left";
    className?: string;
}) {
    return (
        <div aria-hidden className={cn("note pointer-events-none flex items-start gap-1.5 select-none", className)}>
            {arrow === "left" && <Arrow className="mt-1 h-7 w-10 -scale-x-100" />}
            <span>{children}</span>
            {arrow !== "left" && (
                <Arrow className={cn("mt-5 h-10 w-9 shrink-0", arrow === "down-left" ? "-scale-x-100 rotate-[8deg]" : "rotate-[-4deg]")} />
            )}
        </div>
    );
}

/* drawn once, by hand: a shaky curve and an open head */
function Arrow({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 40 44" fill="none" className={className}>
            <path
                d="M4 3c7 2.5 15 8 19.5 16.5S28 34 33 40"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path d="M25.5 37.5 33.4 40.6l1.1-8.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
