import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecord } from "@/lib/records";
import { passportStore } from "@/lib/store";
import { readPassportToken } from "@/lib/passport";
import { heldIds } from "@/lib/session";
import { safeDecode } from "@/lib/safe";
import { PassportLeaf } from "@/components/passport/passport-leaf";
import { HoldButton } from "@/components/passport/hold-button";
import { LightTable } from "@/components/passport/light-table";
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
        <>
            {/* the check, on paper: the register's stamp struck on the page, and
                the certificate laid on a light table to show its watermark */}
            <section className="stamp-thud">
                <div className="container-x grid grid-cols-1 gap-10 pt-10 pb-6 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-center lg:gap-16">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="eyebrow">{t.verifyEyebrow}</span>
                            <Badge variant={revoked ? "default" : stored ? "positive" : "amber"}>
                                {revoked ? "Revoked" : stored ? t.verifyStored : t.verifySignature}
                            </Badge>
                        </div>
                        <h1 className={`stamp stamp-big mt-8 ${revoked ? "stamp-ink" : ""}`}>
                            {revoked ? "Revoked" : "Genuine"}
                        </h1>
                        <p className="read mt-8 max-w-[48ch] text-[18px] leading-relaxed text-ink-2 sm:text-[20px]">
                            {revoked ? (
                                <>
                                    This certificate was issued for{" "}
                                    <span className="text-ink">{cloth}</span>, but it no
                                    longer stands.
                                </>
                            ) : (
                                <>
                                    Issued by Tracing Weavers to{" "}
                                    <span className="font-script text-[1.45em] leading-none text-ink">{passport.holder}</span> for{" "}
                                    <span className="text-bt-red">{cloth}</span> on {issuedOn}.
                                </>
                            )}
                        </p>
                        <p className="data mt-4 text-ink-3">{passport.id}</p>
                    </div>

                    <LightTable id={passport.id} className="mx-auto w-full max-w-sm lg:max-w-none">
                        <PassportLeaf passport={passport} record={record} />
                    </LightTable>
                </div>
            </section>

            <div className="container-x mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
                <section>
                    <h2 className="eyebrow">{t.verifyProves}</h2>
                    <p className="read mt-4 max-w-[56ch] text-[17px] leading-relaxed text-muted-foreground">
                        {stored
                            ? "This certificate is in the Tracing Weavers register, under the name shown. The cloth it names has its own public record, so the two can be checked against each other."
                            : "The register is not answering right now, but the signature on this link proves the certificate was issued by Tracing Weavers. Open the record to match the cloth."}
                    </p>
                    {record && (
                        <Link
                            href={`/record/${encodeURIComponent(record.code)}`}
                            className="mt-5 inline-flex min-h-9 items-center text-[16px] font-medium text-ink hover:text-bt-red"
                        >
                            Read the cloth&apos;s record →
                        </Link>
                    )}
                </section>

                {!alreadyHeld && !revoked && (
                    <section className="border-t border-ink pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
                        <h2 className="eyebrow">Is this yours?</h2>
                        <p className="read mt-4 max-w-[46ch] text-[16px] leading-relaxed text-muted-foreground">
                            Save it to this device and it appears in your traces whenever
                            you are signed in here.
                        </p>
                        <HoldButton id={passport.id} token={token} />
                    </section>
                )}
            </div>
        </>
    );
}
