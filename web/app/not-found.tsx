import Link from "next/link";
import { TagLookupForm } from "@/components/nfc/tag-lookup-form";
import { Button } from "@/components/ui/button";
import { ThreadRule } from "@/components/motif/marks";

export const metadata = { title: "Not found", robots: { index: false } };

/* Rendered inside the public shell (the catch-all in app/(public) sends
   unknown addresses here too), so it is a page-sized block, not a screen. */
export default function NotFound() {
    return (
        <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col justify-center px-1 py-6">
            <div className="eyebrow">404 · Not found</div>
            <h1 className="mt-4">This address points at nothing.</h1>
            <p className="mt-4 max-w-[48ch] text-[17px] text-muted-foreground">
                The link may be mistyped, or the page has moved. If you have a code
                from a cloth&apos;s label, type it here.
            </p>

            <div className="mt-7 rounded-lg bg-card p-5 shadow-[var(--ring)]">
                <TagLookupForm />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                    <Link href="/#records" className="text-white hover:text-white">
                        Browse the cloths
                    </Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                    <Link href="/scan">How it works</Link>
                </Button>
            </div>

            <ThreadRule className="mt-10 h-2 w-full text-stone" aria-hidden />
        </div>
    );
}
