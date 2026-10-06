import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecord } from "@/lib/records";
import { passportStore } from "@/lib/store";
import { readPassportToken } from "@/lib/passport";
import { heldIds } from "@/lib/session";
import { safeDecode } from "@/lib/safe";
import { PassportLeaf } from "@/components/passport/passport-leaf";
import { HoldButton } from "@/components/passport/hold-button";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/copy";
import type { Passport } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Check a certificate", robots: { index: false } };

/**
 * Verification, two ways:
 *  · the store knows the id (the normal case) → show the issued passport
 *  · the store is empty or elsewhere and the holder presents ?t=<token> → the
 *    signature still proves the passport was issued here, without a database.
 *
 * The token must be FOR THE ID IN THE URL. Before this, the page took whatever
 * payload the token carried and rendered it under the requested id, so anyone
 * holding one passport could repaint it as any other id. A stored "revoked"
 * also always wins over a token that says "issued".
 *
 * An id that resolves to nothing is a 404 now, not a 200 with an apology.
 */
export default async function VerifyPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ t?: string }>;
}) {
    const { id } = await params;
    const { t: token } = await searchParams;
    const wanted = safeDecode(id).trim();

    const stored = await passportStore()
        .get(wanted)
        .catch(() => null);

    const fromToken = token ? readPassportToken(token) : null;
    const proven = fromToken && fromToken.id === wanted ? fromToken : null;

    const passport: Passport | null =
        stored ?? (proven ? { ...proven, status: "issued" as const } : null);

    if (!passport) notFound();

    const record = getRecord(passport.code);
    const alreadyHeld = (await heldIds()).includes(passport.id);

    const revoked = passport.status === "revoked";
    const issuedOn = new Date(passport.issuedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
    });
    const cloth = record ? record.title.split(" · ")[0] : passport.code;

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            <header>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="eyebrow">{t.verifyEyebrow}</span>
                    <Badge variant={revoked ? "default" : stored ? "positive" : "amber"}>
                        {revoked ? "Revoked" : stored ? t.verifyStored : t.verifySignature}
                    </Badge>
                </div>
                <h1 className="mt-4">
                    {revoked ? "This certificate was revoked." : "This certificate is genuine."}
                </h1>
                <p className="mt-3 max-w-[56ch] text-[17px] text-muted-foreground">
                    {revoked ? (
                        <>
                            It was issued for <span className="text-ink">{cloth}</span>, but
                            it no longer stands.
                        </>
                    ) : (
                        <>
                            Issued by Tracing Weavers to{" "}
                            <span className="text-ink">{passport.holder}</span> for{" "}
                            <span className="text-ink">{cloth}</span> on {issuedOn}.
                        </>
                    )}
                </p>
            </header>

            <PassportLeaf passport={passport} record={record} className="mx-auto max-w-md" />

            {!alreadyHeld && !revoked && (
                <div className="rounded-lg bg-card p-5 shadow-[var(--ring)]">
                    <p className="text-[15px] text-ink">Is this yours?</p>
                    <p className="mt-1 text-[14px] text-muted-foreground">
                        Save it to this device and it appears in your traces whenever
                        you are signed in here.
                    </p>
                    <HoldButton id={passport.id} token={token} />
                </div>
            )}

            <section className="border-t border-border pt-6">
                <h2 className="eyebrow">{t.verifyProves}</h2>
                <p className="mt-3 max-w-[62ch] text-[16px] text-muted-foreground">
                    {stored
                        ? "This certificate is in the Tracing Weavers register, under the name shown. The cloth it names has its own public record, so the two can be checked against each other."
                        : "The register is not answering right now, but the signature on this link proves the certificate was issued by Tracing Weavers. Open the record to match the cloth."}
                </p>
                {record && (
                    <Link
                        href={`/record/${encodeURIComponent(record.code)}`}
                        className="mt-4 inline-flex min-h-9 items-center text-[15px] font-medium text-ink hover:text-bt-red"
                    >
                        Read the cloth&apos;s record →
                    </Link>
                )}
            </section>
        </div>
    );
}
