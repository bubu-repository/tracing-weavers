"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Compass, LayoutGrid, UserRound, type LucideIcon } from "lucide-react";

/**
 * The four places in the app, in two shapes, both on ink.
 *
 * From `md` up they are text links in the header, with a salmon thread under
 * the current one that slides between them (`layoutId`). On a phone they are
 * a tab bar at the bottom of the screen, where a thumb already is.
 *
 * Icons are a deliberate, flagged addition to a system that has none: the
 * readme allows Lucide at 1.5px stroke for mobile navigation.
 */
const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/", label: "Collection", icon: LayoutGrid },
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
        <nav aria-label="Sections" className={className}>
            <ul className="flex items-center gap-1">
                {ITEMS.map((item) => {
                    const on = item.href === current;
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                aria-current={on ? "page" : undefined}
                                className={`relative flex h-16 items-center px-3.5 text-[13px] tracking-[.16em] uppercase transition-colors duration-150 ${
                                    on ? "text-white hover:text-white" : "text-white/55 hover:text-white"
                                }`}
                            >
                                {item.label}
                                {on && (
                                    <motion.span
                                        layoutId="nav-thread"
                                        aria-hidden
                                        className="absolute inset-x-3.5 bottom-0 h-[3px] bg-salmon"
                                        transition={{ type: "spring", duration: 0.36, bounce: 0.12 }}
                                    />
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

/** The phone's tab bar: ink, fixed to the bottom, clear of the home indicator. */
export function BottomNav() {
    const current = useCurrent();

    return (
        <nav
            aria-label="Sections"
            className="no-print fixed inset-x-0 bottom-0 z-50 bg-ink pb-[env(safe-area-inset-bottom)] md:hidden"
            data-theme="dark"
        >
            <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
                {ITEMS.map(({ href, label, icon: Icon }) => {
                    const on = href === current;
                    return (
                        <li key={href} className="relative">
                            <Link
                                href={href}
                                aria-current={on ? "page" : undefined}
                                className={`pressable flex h-full flex-col items-center justify-center gap-1 text-[11px] tracking-[.1em] uppercase ${
                                    on ? "text-salmon hover:text-salmon" : "text-white/65 hover:text-white"
                                }`}
                            >
                                {on && (
                                    <motion.span
                                        layoutId="bottom-nav-mark"
                                        aria-hidden
                                        className="absolute inset-x-6 top-0 h-[3px] bg-salmon"
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
