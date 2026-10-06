import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveTag } from "@/lib/tags";
import { findRecord } from "@/lib/records";
import { safeDecode } from "@/lib/safe";
import { TagLookupForm } from "@/components/nfc/tag-lookup-form";
import { ThreadRule } from "@/components/motif/marks";

export const dynamic = "force-dynamic";

export const metadata = { title: "Code not found", robots: { index: false } };

/**
 * The NFC / QR landing route, and the code lookup.
 *
 * A tag is written with exactly one URL: `${NEXT_PUBLIC_SITE_URL}/t/<TAG_CODE>`.
 * The code is resolved against data/tags.json first — so a tag can be
 * re-pointed without rewriting the chip — and then against the record codes
 * themselves, so the code printed on an exhibition label ("07/TM", "07tm",
 * "7") opens its cloth too.
 */
export default async function TagPage({
    params,
}: {
    params: Promise<{ tag: string }>;
}) {
    const { tag } = await params;
    const resolved = resolveTag(tag);

    if (resolved) {
        redirect(`/record/${encodeURIComponent(resolved.record.code)}?tag=${encodeURIComponent(tag)}`);
    }

    const record = findRecord(tag);
    if (record) redirect(`/record/${encodeURIComponent(record.code)}`);

    const shown = safeDecode(tag);

    return (
        <div className="mx-auto max-w-xl">
            <div className="eyebrow">Code not found</div>
            <h1 className="mt-4">No cloth answers to that code.</h1>
            <p className="mt-4 max-w-[52ch] text-[17px] text-muted-foreground">
                We looked for <span className="data text-[15px] text-ink">{shown}</span>{" "}
                and found nothing. Check the label beside the cloth and try again —
                the code looks like <span className="data text-[15px] text-ink">07/TM</span>.
            </p>

            <div className="mt-8 rounded-lg bg-card p-5 shadow-[var(--ring)] sm:p-6">
                <TagLookupForm />
            </div>

            <Link
                href="/#records"
                className="mt-6 inline-flex min-h-9 items-center text-[15px] font-medium text-ink hover:text-bt-red"
            >
                Browse all the cloths instead →
            </Link>

            <ThreadRule className="mt-10 h-2 w-full text-stone" aria-hidden />

            <p className="mt-4 text-[13px] text-muted-foreground">
                Field team: a tag that should open a record needs its code in{" "}
                <span className="data text-ink">data/tags.json</span>, pointing at that
                record, then a redeploy.
            </p>
        </div>
    );
}
