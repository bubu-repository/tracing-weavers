import Link from "next/link";
import { collections, originCount, records } from "@/lib/records";
import { t } from "@/lib/copy";
import { TagLookupForm } from "@/components/nfc/tag-lookup-form";
import { Button } from "@/components/ui/button";
import { ThreadRule, WarpField, WeftCrossing } from "@/components/motif/marks";

export const metadata = { title: "How it works" };

const STEPS = [
    {
        title: "Find a cloth",
        body: "Every cloth in the exhibition carries a code — look for it on the label beside each piece.",
    },
    {
        title: "Open its record",
        body: "Scan the label, type its code above, or browse the gallery. No app to install, no account needed.",
    },
    {
        title: "Read its story",
        body: "Where it was woven, in which technique, from what — and where it hangs in the room.",
    },
    {
        title: "Claim the certificate",
        body: "Create an account and put your name on a cloth's certificate. It is kept as a page in your book of traces.",
    },
];

/* How to explore the collection — a guide plus the one tool a visitor with a
   label in front of them actually needs: the code box. */
export default function ScanPage() {
    return (
        <div className="mx-auto max-w-3xl">
            <header>
                <div className="eyebrow">{t.scanEyebrow}</div>
                <h1 className="mt-4">
                    {t.scanTitleA} <span className="text-bt-red">{t.scanTitleB}</span>
                </h1>
                <p className="mt-4 max-w-[54ch] text-[17px] text-muted-foreground">
                    {records.length} cloths across {collections.length} collections,
                    woven in {originCount} places across Indonesia. One page per weave.
                </p>
            </header>

            {/* the tool first: someone here usually has a label in front of them */}
            <section
                aria-labelledby="lookup"
                className="ink-band cloth relative mt-8 overflow-hidden rounded-xl p-5 sm:p-7"
                data-theme="dark"
            >
                <WarpField className="pointer-events-none absolute inset-0 h-full w-full text-white/8" />
                <div className="relative max-w-md">
                    <h2 id="lookup" className="text-[22px] text-white">
                        Have a code from a label?
                    </h2>
                    <p className="mt-2 text-[15px] text-white/70">
                        Type it as printed — <span className="font-mono">07/TM</span>,{" "}
                        <span className="font-mono">07tm</span> or just{" "}
                        <span className="font-mono">7</span> all work.
                    </p>
                    <TagLookupForm className="mt-5" tone="ink" />
                </div>
            </section>

            <WeftCrossing className="mt-10 h-12 w-full text-stone" aria-hidden />

            <ol className="mt-6">
                {STEPS.map((step, i) => (
                    <li key={step.title} className="flex gap-5 border-t border-border py-5">
                        <span className="data w-6 shrink-0 pt-1 text-bt-red">
                            {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>
                            <span className="block text-[19px] leading-tight text-ink">
                                {step.title}
                            </span>
                            <span className="mt-1.5 block text-[16px] text-muted-foreground">
                                {step.body}
                            </span>
                        </span>
                    </li>
                ))}
            </ol>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-8">
                <Button asChild size="lg">
                    <Link href="/#records" className="text-white hover:text-white">
                        Browse all {records.length} cloths
                    </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link href="/login?mode=register" className="text-ink hover:text-ink">
                        Create an account
                    </Link>
                </Button>
            </div>

            <p className="mt-8 max-w-[60ch] text-[15px] text-muted-foreground">
                Anyone can read a record — no sign-in required. If the cloth changes
                hands, its record travels with it.
            </p>

            <ThreadRule className="mt-12 h-2 w-full text-stone" aria-hidden />
        </div>
    );
}
