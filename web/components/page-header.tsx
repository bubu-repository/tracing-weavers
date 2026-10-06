import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The opening of a page that is not a cloth: eyebrow, a large title, one line
 * of lead, and a hairline under it. `ink` sets it on the gallery wall instead
 * of paper, for pages that open with a verdict or a book.
 */
export function PageHeader({
    eyebrow,
    title,
    lead,
    aside,
    tone = "paper",
    rule = true,
    className,
    children,
}: {
    eyebrow: string;
    title: ReactNode;
    lead?: ReactNode;
    /** sits to the right of the title on a desk */
    aside?: ReactNode;
    tone?: "paper" | "ink";
    /** the hairline under a paper header; off when an ink band follows */
    rule?: boolean;
    className?: string;
    children?: ReactNode;
}) {
    const ink = tone === "ink";
    return (
        <section
            className={cn(ink && "bg-ink text-white", className)}
            data-theme={ink ? "dark" : undefined}
        >
            <div className="container-x pt-10 pb-10 sm:pt-16 sm:pb-12">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div>
                        <div className="eyebrow">{eyebrow}</div>
                        <h1 className={cn("mt-4 text-[clamp(2.6rem,8vw,5.25rem)] leading-[.92]", ink && "text-white")}>
                            {title}
                        </h1>
                        {lead && (
                            <p
                                className={cn(
                                    "mt-5 max-w-[52ch] text-[17px] leading-relaxed sm:text-[19px]",
                                    ink ? "text-white/70" : "text-muted-foreground",
                                )}
                            >
                                {lead}
                            </p>
                        )}
                    </div>
                    {aside}
                </div>
                {children}
            </div>
            {!ink && rule && (
                <div className="container-x">
                    <div className="border-t border-ink" />
                </div>
            )}
        </section>
    );
}
