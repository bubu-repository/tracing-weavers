import Link from "next/link";
import { collections, originCount, records } from "@/lib/records";
import { brand } from "@/lib/brand";
import { ThreadRule, TallyMarks } from "@/components/motif/marks";

const LINKS = [
    { href: "/", label: "All records" },
    { href: "/scan", label: "How it works" },
    { href: "/collection", label: "Your traces" },
    { href: "/profile", label: "Profile" },
];

/* Every figure here is counted from data/records.json, so the footer can never
   drift from the catalogue again (it used to say "four collections" by hand). */
export default function Footer() {
    return (
        <footer className="no-print mt-16 border-t border-border sm:mt-20">
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="col-span-2 max-w-[46ch] lg:col-span-1">
                        <div className="eyebrow">{brand}</div>
                        <p className="mt-3 text-[15px] leading-snug text-muted-foreground">
                            Tracing every thread back to the hands that wove it. A
                            digital record for handwoven cloth from across
                            Indonesia — one page per weave, from seed to loom and
                            beyond.
                        </p>
                    </div>

                    <nav aria-label="Footer">
                        <div className="label">Explore</div>
                        <ul className="mt-3 space-y-1.5">
                            {LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="inline-block py-0.5 text-[15px] text-ink-2 hover:text-ink"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div>
                        <div className="label">The collection</div>
                        <div className="mt-3 flex items-center gap-3">
                            <TallyMarks className="h-4 w-14 shrink-0 text-bt-red" aria-hidden />
                            <span className="num text-[15px] text-ink-2">
                                {records.length} cloths
                            </span>
                        </div>
                        <p className="num mt-1.5 text-[15px] text-muted-foreground">
                            {collections.length} collections · {originCount} places of
                            origin
                        </p>
                    </div>
                </div>

                <ThreadRule className="mt-8 h-2 w-full text-stone" aria-hidden />

                <p className="mt-4 text-[12px] leading-relaxed tracking-[.12em] uppercase text-muted-foreground">
                    &copy; {brand} &middot; All rights reserved &middot; Confidential &middot; Adonara &middot; Lembata &middot; Manggarai
                </p>
            </div>
        </footer>
    );
}
