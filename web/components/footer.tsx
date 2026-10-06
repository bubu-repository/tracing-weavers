import Link from "next/link";
import { collections, originCount, records } from "@/lib/records";
import { brand } from "@/lib/brand";
import { PartnerNodes } from "@/components/motif/marks";

const EXPLORE = [
    { href: "/#collection", label: "The collection" },
    { href: "/scan", label: "How it works" },
    { href: "/collection", label: "Your traces" },
    { href: "/profile", label: "Profile" },
];

/* The back cover of the catalogue: ink, the name set as large as the page
   allows, and every figure counted from data/records.json. */
export default function Footer() {
    return (
        <footer className="no-print grain relative mt-24 overflow-hidden bg-ink text-white" data-theme="dark">
            <div className="selvedge-dye" aria-hidden />
            <div className="container-x pt-14 pb-8">
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="col-span-2 max-w-[44ch] lg:col-span-1">
                        <div className="eyebrow">Indonesia Heritage for Human Flourishing</div>
                        <p className="mt-4 text-[17px] leading-relaxed text-white/70">
                            Tracing every thread back to the hands that wove it. A
                            digital record for handwoven cloth from across
                            Indonesia — one page per weave, from seed to loom and
                            beyond.
                        </p>
                        <div className="mt-6 flex items-center gap-4">
                            <PartnerNodes className="h-6 w-28 shrink-0 text-salmon" aria-hidden />
                            <span className="text-[12px] tracking-[.14em] text-white/55 uppercase">
                                ICM × TBN × Torajamelo
                            </span>
                        </div>
                    </div>

                    <nav aria-label="Footer">
                        <div className="label">Explore</div>
                        <ul className="mt-4 space-y-2">
                            {EXPLORE.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-[16px] text-white/75 hover:text-salmon"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div>
                        <div className="label">The collection</div>
                        <ul className="mt-4 space-y-2 text-[16px]">
                            {(
                                [
                                    [records.length, "cloths"],
                                    [collections.length, "collections"],
                                    [originCount, "places of origin"],
                                ] as const
                            ).map(([value, label]) => (
                                <li key={label} className="flex items-baseline gap-2.5">
                                    <span className="display num w-8 text-[22px] text-salmon">
                                        {value}
                                    </span>
                                    <span className="text-white/70">{label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* the name, as large as the page allows */}
                <p
                    aria-hidden
                    className="display mt-16 -mb-[0.12em] text-[clamp(3.2rem,14.2vw,12.5rem)] leading-[.8] tracking-[-.055em] whitespace-nowrap text-white select-none"
                >
                    {brand}
                </p>

                <div className="mt-8 flex flex-col gap-2 border-t border-white/14 pt-5 text-[12px] tracking-[.12em] text-white/45 uppercase sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        &copy; {brand} &middot; All rights reserved &middot; Confidential
                    </span>
                    <span>Adonara &middot; Lembata &middot; Manggarai</span>
                </div>
            </div>
        </footer>
    );
}
