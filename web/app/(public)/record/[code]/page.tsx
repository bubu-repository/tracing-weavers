import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    attr,
    clothName,
    formatPlace,
    getRecord,
    isPlaceholder,
    neighbours,
    recordVisual,
    type ProductRecord,
} from "@/lib/records";
import { passportStore } from "@/lib/store";
import { currentIdentity } from "@/lib/session";
import { t } from "@/lib/copy";
import { PassportClaim } from "@/components/passport/PassportClaim";
import { PassportLeaf } from "@/components/passport/passport-leaf";
import { RecordTraits } from "@/components/records/RecordTraits";
import { JourneyRail } from "@/components/journey-rail";
import { ShareButton } from "@/components/share-button";
import { ThreadRule } from "@/components/motif/marks";

export const dynamic = "force-dynamic";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ code: string }>;
}): Promise<Metadata> {
    const { code } = await params;
    const record = getRecord(code);
    if (!record) return { title: "Record not found" };
    const title = `${clothName(record)} · ${record.code}`;
    return {
        title,
        description: record.description,
        openGraph: {
            title,
            description: record.description,
            images: [recordVisual(record)],
        },
    };
}

/**
 * LEARN surface with one Configure action: where a tap or a scan lands, on a
 * phone, one-handed.
 *
 * The photograph leads (it is the object), then the name — once, not three
 * times — what it is, the facts, and the claim. On a desk the photograph stays
 * put while the story scrolls beside it. At the foot, the cloths hung either
 * side of this one, so a visitor can walk the exhibition from their phone.
 */
export default async function RecordPage({
    params,
}: {
    params: Promise<{ code: string }>;
}) {
    const { code } = await params;
    const record = getRecord(code);
    if (!record) notFound();

    const store = passportStore();
    /* Two queries on purpose: `issued` is the row list the holder is matched
       against (any status), while the quota counts only what the claim path
       counts — a revoked passport must not read as "sold out" while the API
       would still issue. */
    const [issued, issuedCount, identity] = await Promise.all([
        store.listByRecord(record.code),
        store.issuableCount(record.code),
        currentIdentity(),
    ]);
    const remaining = Math.max(record.supply - issuedCount, 0);

    const mine = identity
        ? issued.find(
              (p) =>
                  (p.email ?? "").trim().toLowerCase() ===
                  identity.email.trim().toLowerCase(),
          )
        : undefined;

    const step = attr(record, "Journey step");
    const origin = formatPlace(attr(record, "Origin"));
    const name = clothName(record);
    const { previous, next } = neighbours(record.code);

    return (
        <div>
            <div className="flex items-center justify-between gap-3">
                <Link
                    href="/#records"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[14px] text-muted-foreground hover:text-ink"
                >
                    <span aria-hidden>←</span> {t.backToRecords}
                </Link>
                <ShareButton title={`${name} · ${record.code}`} text={record.description} />
            </div>

            <div className="mt-5 grid gap-8 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
                {/* the cloth */}
                <div className="lg:sticky lg:top-24 lg:self-start">
                    <figure className="relative overflow-hidden rounded-xl bg-ink shadow-[var(--ring)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={recordVisual(record)}
                            alt={`${name}, handwoven cloth from ${origin}`}
                            fetchPriority="high"
                            className="aspect-4/5 w-full object-cover"
                            draggable={false}
                        />
                        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
                            <span className="rounded-[4px] bg-ink/75 px-2 py-1 font-mono text-[13px] tracking-[.04em] text-white">
                                {record.code}
                            </span>
                            <span className="rounded-full bg-paper/95 px-2.5 py-1 text-[11px] tracking-[.12em] text-ink uppercase">
                                {remaining <= 0
                                    ? "Claimed"
                                    : record.supply > 1
                                      ? `${remaining} of ${record.supply} left`
                                      : "Available"}
                            </span>
                        </div>
                    </figure>
                    {!isPlaceholder(record.photoCredit) && (
                        <p className="mt-2.5 text-[13px] text-ink-2">
                            Photo: {record.photoCredit}
                        </p>
                    )}
                </div>

                {/* the story, the facts, the action */}
                <div className="space-y-8">
                    <header>
                        <div className="eyebrow">{record.collection ?? t.recordEyebrow}</div>
                        <h1 className="mt-3">{name}</h1>
                        <p className="mt-2 text-[15px] text-ink-2">
                            {origin}
                            <span className="text-ink-3">
                                {" · "}
                                {record.supply > 1
                                    ? t.supplyShared.replace("{n}", String(record.supply))
                                    : t.supplyUnique}
                            </span>
                        </p>
                        <p className="mt-4 max-w-[58ch] text-[17px] leading-relaxed text-muted-foreground">
                            {record.description}
                        </p>
                    </header>

                    <RecordTraits record={record} />

                    <div className="max-w-[58ch] border-l-2 border-bt-red/40 pl-4">
                        <div className="text-[11px] tracking-[.2em] uppercase text-bt-red">The motif</div>
                        <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                            The community decides how much of a motif may be recorded
                            and shown. What it means stays with the weaver and their
                            family.
                        </p>
                    </div>

                    {mine ? (
                        <section aria-labelledby="your-certificate" className="space-y-4">
                            <h2 id="your-certificate" className="eyebrow">
                                {t.yourPassport}
                            </h2>
                            <PassportLeaf passport={mine} record={record} className="max-w-md" />
                        </section>
                    ) : (
                        <PassportClaim
                            code={record.code}
                            title={record.title}
                            supply={record.supply}
                            remaining={remaining}
                            identity={identity}
                        />
                    )}
                </div>
            </div>

            {/* walk the exhibition */}
            {(previous || next) && (
                <nav
                    aria-label="More cloths"
                    className="mt-14 grid grid-cols-2 gap-3 border-t border-border pt-6 sm:gap-6"
                >
                    {previous ? <Neighbour record={previous} direction="previous" /> : <span />}
                    {next ? <Neighbour record={next} direction="next" /> : <span />}
                </nav>
            )}

            {/* Where this piece sits in the three-year path. */}
            <section className="mt-12">
                <ThreadRule className="h-2 w-full text-stone" aria-hidden />
                <div className="mt-6">
                    <div className="eyebrow">{t.journeyEyebrow}</div>
                    <h2 className="mt-2 text-[clamp(1.3rem,4vw,1.7rem)]">
                        {t.journeyTitle}
                    </h2>
                    {/* Same self-running rail as the home page. `activeStep`
                        keeps the stage this cloth sits at marked "this
                        record" while the journey animates. */}
                    <JourneyRail
                        activeStep={step ? String(step) : undefined}
                        autoPlay
                        className="mt-3"
                    />
                </div>
            </section>
        </div>
    );
}

function Neighbour({
    record,
    direction,
}: {
    record: ProductRecord;
    direction: "previous" | "next";
}) {
    const forward = direction === "next";
    return (
        <Link
            href={`/record/${encodeURIComponent(record.code)}`}
            className={`group flex min-w-0 items-center gap-3 rounded-lg p-2 text-ink hover:bg-card hover:text-ink sm:gap-4 ${
                forward ? "flex-row-reverse text-right" : ""
            }`}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={recordVisual(record)}
                alt=""
                loading="lazy"
                className="h-16 w-13 shrink-0 rounded-md object-cover shadow-[var(--ring)] sm:h-20 sm:w-16"
                draggable={false}
            />
            <span className="min-w-0">
                <span className="label block">
                    {forward ? "Next →" : "← Previous"}
                </span>
                <span className="mt-1 block truncate text-[15px] leading-tight group-hover:text-bt-red sm:text-[17px]">
                    {clothName(record)}
                </span>
                <span className="data mt-0.5 block text-muted-foreground">{record.code}</span>
            </span>
        </Link>
    );
}
