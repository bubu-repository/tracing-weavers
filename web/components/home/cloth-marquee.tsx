import Link from "next/link";
import { clothName, recordSwatch, type ProductRecord } from "@/lib/records";
import { cn } from "@/lib/utils";

/**
 * The collection, drifting past like warp threads through a loom.
 *
 * Every tile is a real cloth, and tapping one opens it. The strip is a
 * picture of the collection rather than a way through it — the catalogue
 * below lists the same cloths properly — so it is hidden from assistive
 * technology and kept out of the tab order instead of adding 58 tab stops.
 * The content is rendered twice so the CSS loop (-50%) is seamless. It pauses
 * under the pointer and stands still for anyone who has asked for less motion.
 */
export function ClothMarquee({
    records,
    direction = "x",
    reverse = false,
    duration = 70,
    className,
    tileClassName,
}: {
    records: ProductRecord[];
    direction?: "x" | "y";
    reverse?: boolean;
    /** seconds for one full loop */
    duration?: number;
    className?: string;
    tileClassName?: string;
}) {
    const vertical = direction === "y";
    const tiles = (copy: number) =>
        records.map((record) => (
            /* spacing as padding, not gap: with a gap, -50% lands half a gap
               short and the loop jumps */
            <li
                key={`${copy}-${record.code}`}
                className={cn("shrink-0", vertical ? "pb-2 sm:pb-3" : "pr-2 sm:pr-3")}
            >
                <Link
                    href={`/record/${encodeURIComponent(record.code)}`}
                    tabIndex={-1}
                    title={clothName(record)}
                    className={cn("group relative block overflow-hidden bg-white/5", tileClassName)}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={recordSwatch(record)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="h-full w-full object-cover opacity-90 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105 group-hover:opacity-100 group-focus-visible:opacity-100"
                    />
                    <span className="data absolute bottom-1.5 left-1.5 bg-ink/70 px-1 py-0.5 text-[10px] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {record.code}
                    </span>
                </Link>
            </li>
        ));

    return (
        <div
            aria-hidden
            className={cn("marquee-host overflow-hidden", vertical ? "fade-y" : "fade-x", className)}
        >
            <ul
                className={cn(
                    "flex w-max",
                    vertical ? "marquee-y h-max w-full flex-col" : "marquee",
                    reverse && "marquee-reverse",
                )}
                style={{ ["--marquee-duration" as string]: `${duration}s` }}
            >
                {tiles(0)}
                {tiles(1)}
            </ul>
        </div>
    );
}
