import Link from "next/link";
import { TagLookupForm } from "@/components/nfc/tag-lookup-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Not found", robots: { index: false } };

/* Rendered inside the public shell (the catch-all in app/(public) sends
   unknown addresses here too). A dropped stitch: the page is missing, the
   cloth is not — so the way back is a code box and the collection. */
export default function NotFound() {
    return (
        <div className="container-x grid grid-cols-1 gap-10 py-14 sm:py-20 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-20">
            <span aria-hidden className="numeral text-[clamp(8rem,30vw,16rem)] text-ink/12">
                404
            </span>
            <div className="max-w-xl">
                <div className="eyebrow">Not found</div>
                <h1 className="mt-4 text-[clamp(2.4rem,6vw,4rem)]">A dropped stitch.</h1>
                <p className="mt-4 max-w-[46ch] text-[17px] leading-relaxed text-muted-foreground">
                    This address points at nothing — the link may be mistyped, or the
                    page has moved. If you have a code from a cloth&apos;s label, type it
                    here.
                </p>

                <TagLookupForm className="mt-8 max-w-md" />

                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button asChild size="lg">
                        <Link href="/#collection">Browse the collection</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <Link href="/scan">How it works</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
