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
    paletteFor,
    recordSwatch,
    recordThumb,
    recordVisual,
    sameCollection,
    type ProductRecord,
} from "@/lib/records";
import { passportStore } from "@/lib/store";
import { currentIdentity } from "@/lib/session";
import { t } from "@/lib/copy";
import { PassportClaim } from "@/components/passport/PassportClaim";
import { PassportLeaf } from "@/components/passport/passport-leaf";
import { RecordTraits } from "@/components/records/RecordTraits";
import { ClothViewer } from "@/components/records/cloth-viewer";
import { ClaimBar } from "@/components/records/claim-bar";
import { RelatedRail } from "@/components/records/related-rail";
import { Selvedge } from "@/components/records/selvedge";
import { ClothStory } from "@/components/story/cloth-story";
import { catalogueNumber } from "@/components/records/RecordCard";
import { JourneyRail } from "@/components/journey-rail";
import { ShareButton } from "@/components/share-button";

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
 * The object page: where a tap or a scan lands, on a phone, one-handed.
 *
 * It wears the cloth's own colours — a selvedge measured from the photograph
 * runs under the header — and leads with the photograph, edge to edge on a
 * phone, mounted on a linen board on a desk, with a viewer for looking closer. Then
 * the catalogue entry: number, name, place, what it is, its colours, its
 * specification, and the claim. At the foot, the cloths either side of it
 * and the rest of its collection, so the exhibition can be walked from here.
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
    const palette = paletteFor(record);
    /* width / height of the photograph, measured by `npm run images` */
    const photoRatio = palette?.ratio && palette.ratio > 0 ? Number(palette.ratio.toFixed(4)) : 0.8;
    const { previous, next } = neighbours(record.code);
    const related = sameCollection(record, 8);
    const status =
        remaining <= 0
            ? "Claimed"
            : record.supply > 1
              ? `${remaining} of ${record.supply} left`
              : "Available";

    return (
        <article>
            {/* the cloth's own selvedge, under the brand's */}
            <Selvedge palette={palette} className="h-2" />

            <div className="container-x flex items-center justify-between gap-3 py-4 lg:py-5">
                <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[14px] text-muted-foreground">
                    <Link href="/#collection" className="shrink-0 text-ink-2 hover:text-ink">
                        ← The collection
                    </Link>
                    <span aria-hidden className="text-stone">/</span>
                    <span className="truncate">{record.collection}</span>
                </nav>
                <ShareButton title={`${name} · ${record.code}`} text={record.description} />
            </div>

            <div className="container-x grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
                {/* the photograph, mounted on card at its own proportions — a tall
                    cloth stays tall, a wide one wide; nothing cropped, no empty
                    board around it. As tall as the screen allows, never taller. */}
                <div className="lg:sticky lg:top-[92px] lg:self-start">
                    <div
                        className="card-stock mx-auto p-1.5 [--photo-h:min(60svh,600px)] sm:p-2.5 lg:[--photo-h:min(calc(100svh-170px),860px)]"
                        style={{ width: `min(100%, calc(var(--photo-h) * ${photoRatio} + 1.25rem))` }}
                    >
                        <ClothViewer
                            src={recordVisual(record)}
                            alt={`${name}, handwoven cloth from ${origin}`}
                            title={`${catalogueNumber(record.code)} · ${name}`}
                            className="bg-ink"
                            style={{ aspectRatio: String(photoRatio), background: palette?.colors[0]?.hex }}
                            imgClassName="block h-full w-full object-cover"
                        >
                            <span className="woven-label pointer-events-none absolute top-3 left-3 sm:top-4 sm:left-4">
                                {record.code}
                            </span>
                            <span
                                className={`stamp pointer-events-none absolute top-4 right-4 text-[12.5px] sm:top-5 sm:right-5 ${
                                    remaining <= 0 ? "" : "stamp-ink"
                                }`}
                            >
                                {status}
                            </span>
                        </ClothViewer>
                    </div>
                    {!isPlaceholder(record.photoCredit) && (
                        <p className="mt-2.5 text-center text-[13px] text-ink-2">
                            Photo: {record.photoCredit}
                        </p>
                    )}
                </div>

                {/* the entry */}
                <div className="min-w-0 space-y-10 lg:pt-2">
                    <header>
                        <div className="flex items-end gap-4">
                            <span className="numeral text-[84px] text-ink/18 sm:text-[112px]">
                                {catalogueNumber(record.code)}
                            </span>
                            <div className="pb-2">
                                <div className="eyebrow">{record.collection ?? t.recordEyebrow}</div>
                                <div className="data mt-1.5 text-ink-2">{record.code}</div>
                            </div>
                        </div>
                        <h1 className="mt-3 text-[clamp(2.6rem,7vw,4.75rem)] leading-[.92]">{name}</h1>
                        <p className="mt-4 text-[17px] text-ink-2">
                            {origin}
                            <span className="text-ink-3">
                                {" · "}
                                {record.supply > 1
                                    ? t.supplyShared.replace("{n}", String(record.supply))
                                    : t.supplyUnique}
                            </span>
                        </p>
                        <p className="read mt-6 max-w-[52ch] border-l-2 border-bt-red pl-4 text-[19px] leading-relaxed text-ink sm:text-[21px]">
                            {record.description}
                        </p>
                    </header>

                    <RecordTraits record={record} />

                    <a
                        href="#cloth-story"
                        className="group flex items-center justify-between gap-4 border-y border-border py-4 text-ink hover:text-bt-red"
                    >
                        <span>
                            <span className="label block">Read its story</span>
                            <span className="mt-1 block text-[17px]">
                                Where it was woven, how, and from what — in four short chapters
                            </span>
                        </span>
                        <span aria-hidden className="text-[22px] transition-transform duration-300 group-hover:translate-y-1">
                            ↓
                        </span>
                    </a>

                    {mine ? (
                        <section id="claim" aria-labelledby="your-certificate" className="scroll-mt-24 space-y-4">
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
                            colors={palette?.colors.map((c) => c.hex)}
                        />
                    )}
                </div>
            </div>

            <ClothStory record={record} remaining={remaining} />

            {/* walk the exhibition */}
            {(previous || next) && (
                <nav aria-label="Next and previous cloths" className="container-x mt-20">
                    <div className="grid grid-cols-2 border-y border-ink">
                        {previous ? <Neighbour record={previous} direction="previous" /> : <span />}
                        {next ? <Neighbour record={next} direction="next" /> : <span />}
                    </div>
                </nav>
            )}

            {related.length > 0 && (
                <section className="container-x mt-16" aria-labelledby="more-from">
                    <div className="mb-6 flex items-end justify-between gap-4">
                        <div>
                            <div className="eyebrow">More from the collection</div>
                            <h2 id="more-from" className="mt-2 text-[clamp(1.6rem,4vw,2.4rem)]">
                                {record.collection}
                            </h2>
                        </div>
                        <Link
                            href={`/?c=${encodeURIComponent(record.collection ?? "")}#collection`}
                            className="shrink-0 pb-1 text-[15px] text-ink-2 hover:text-bt-red"
                        >
                            See all →
                        </Link>
                    </div>
                    <RelatedRail records={related} />
                </section>
            )}

            {/* where this piece sits in the three-year path */}
            <section className="container-x mt-16">
                <div className="border-t border-border pt-8">
                    <div className="eyebrow">{t.journeyEyebrow}</div>
                    <h2 className="mt-2 text-[clamp(1.6rem,4vw,2.4rem)]">{t.journeyTitle}</h2>
                    {/* `activeStep` keeps the stage this cloth sits at marked
                        "this record" while the rail walks itself. */}
                    <JourneyRail activeStep={step ? String(step) : undefined} autoPlay className="mt-4" />
                </div>
            </section>

            {!mine && remaining > 0 && (
                <ClaimBar swatch={recordSwatch(record)} name={name} status={status} />
            )}
        </article>
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
            className={`group flex min-w-0 items-center gap-3 py-5 text-ink hover:text-ink sm:gap-5 ${
                forward ? "flex-row-reverse border-l border-border pl-3 text-right sm:pl-6" : "pr-3 sm:pr-6"
            }`}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={recordThumb(record)}
                alt=""
                loading="lazy"
                className="h-20 w-16 shrink-0 object-cover transition-transform duration-500 group-hover:scale-[1.04] sm:h-28 sm:w-22"
                draggable={false}
            />
            <span className="min-w-0">
                <span className="label block">{forward ? "Next →" : "← Previous"}</span>
                <span className="numeral mt-1 block text-[30px] text-ink-3 group-hover:text-bt-red sm:text-[40px]">
                    {catalogueNumber(record.code)}
                </span>
                <span className="mt-1 block truncate text-[15px] leading-tight sm:text-[19px]">
                    {clothName(record)}
                </span>
            </span>
        </Link>
    );
}
