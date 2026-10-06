"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Compass, LayoutGrid, UserRound, type LucideIcon } from "lucide-react";

/**
 * The four places in the app, in two shapes.
 *
 * From `md` up they are one pill in the header; the highlight is a single
 * shared element (`layoutId`) that slides between items. On a phone the pill
 * did not fit beside the name — the brand was cut to "T…", and once signed in
 * the row pushed the page sideways — so below `md` the same items become a tab
 * bar at the bottom of the screen, where a thumb already is.
 *
 * Icons are a deliberate, flagged addition to a system that has none: the
 * readme allows Lucide at 1.5px stroke for mobile navigation only.
 */
const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/", label: "Records", icon: LayoutGrid },
    { href: "/scan", label: "Guide", icon: Compass },
    { href: "/collection", label: "Traces", icon: BookOpen },
    { href: "/profile", label: "Profile", icon: UserRound },
];

function useCurrent() {
    const path = usePathname() ?? "/";
    return (
        ITEMS.map((item) => item.href)
            .filter((href) => (href === "/" ? path === "/" : path.startsWith(href)))
            .sort((a, b) => b.length - a.length)[0] ??
        (path.startsWith("/record") || path.startsWith("/t/") || path.startsWith("/verify")
            ? "/"
            : "")
    );
}

export function NavPills({ className }: { className?: string }) {
    const current = useCurrent();

    return (
        <nav
            aria-label="Sections"
            className={`items-center gap-0.5 rounded-full bg-muted/70 p-1 ${className ?? "flex"}`}
        >
            {ITEMS.map((item) => {
                const on = item.href === current;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={on ? "page" : undefined}
                        className="pressable relative rounded-full px-3.5 py-1.5 text-[13px] tracking-[.08em] uppercase"
                    >
                        {on && (
                            <motion.span
                                layoutId="nav-pill"
                                aria-hidden
                                className="absolute inset-0 rounded-full bg-card shadow-[var(--ring)]"
                                transition={{ type: "spring", duration: 0.32, bounce: 0.15 }}
                            />
                        )}
                        <span
                            className={`relative transition-colors duration-150 ${
                                on ? "text-ink" : "text-ink-3 hover:text-ink"
                            }`}
                        >
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}

/** The phone's tab bar: fixed to the bottom, clear of the home indicator. */
export function BottomNav() {
    const current = useCurrent();

    return (
        <nav
            aria-label="Sections"
            className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
        >
            <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
                {ITEMS.map(({ href, label, icon: Icon }) => {
                    const on = href === current;
                    return (
                        <li key={href} className="relative">
                            <Link
                                href={href}
                                aria-current={on ? "page" : undefined}
                                className={`pressable flex h-full flex-col items-center justify-center gap-1 text-[11px] tracking-[.08em] uppercase ${
                                    on ? "text-bt-red" : "text-ink-3 hover:text-ink"
                                }`}
                            >
                                {on && (
                                    <motion.span
                                        layoutId="bottom-nav-mark"
                                        aria-hidden
                                        className="absolute inset-x-5 top-0 h-[2px] rounded-full bg-bt-red"
                                        transition={{ type: "spring", duration: 0.3, bounce: 0.12 }}
                                    />
                                )}
                                <Icon aria-hidden className="h-[22px] w-[22px]" strokeWidth={1.5} />
                                {label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
