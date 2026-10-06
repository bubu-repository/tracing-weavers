import Link from "next/link";
import { collections, originCount, records } from "@/lib/records";
import { passportStore } from "@/lib/store";
import { currentIdentity } from "@/lib/session";
import { t } from "@/lib/copy";
import { RecordGallery } from "@/components/records/record-gallery";
import { JourneyRail } from "@/components/journey-rail";
import { ThreadRule, WarpField } from "@/components/motif/marks";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { RevealText } from "@/components/ui/reveal-text";

export const dynamic = "force-dynamic";

/* The four dyestuffs the weavers actually use — the brand's reserved dye
   colours, so each swatch is a material, not a decoration. */
const DYES = [
    { name: "Indigo", hex: "#2B3A67", note: "indigo leaf, steeped for days" },
    { name: "Morinda", hex: "#AE1800", note: "morinda root, a red that lasts" },
    { name: "Turmeric", hex: "#ECA406", note: "turmeric, a warm yellow" },
    { name: "Clay", hex: "#F29A6A", note: "clay and tree bark" },
];

/**
 * Explore surface, written for a phone held in one hand.
 *
 * The promise, three real numbers, then the catalogue — searchable, because a
 * visitor in the exhibition is usually looking for one cloth whose label they
 * have just read. The programme's story comes after the cloths, not before.
 */
export default async function Home() {
    const identity = await currentIdentity();

    /* Which cloths are still available. A store that does not answer must not
       take the catalogue down with it: without counts, the badges simply do
       not show. */
    const issued = await passportStore()
        .issuableCounts(records.map((r) => r.code))
        .catch(() => null);

    return (
        <>
            {/* masthead — a photo band with a scrim */}
            <section
                className="relative overflow-hidden rounded-xl bg-ink"
                data-theme="dark"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/imagery/weaving-hands-loom.jpg"
                    alt=""
                    aria-hidden
                    fetchPriority="high"
                    className="absolute inset-0 h-full w-full object-cover"
                    draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/35 sm:bg-gradient-to-r sm:from-ink sm:via-ink/75 sm:to-ink/10" />
                <WarpField className="pointer-events-none absolute inset-0 h-full w-full text-white/8" />

                <div className="relative px-5 pt-28 pb-7 sm:px-10 sm:py-16 lg:py-20">
                    <div className="max-w-2xl">
                        <div className="eyebrow leading-relaxed">{t.homeEyebrow}</div>
                        <RevealText
                            as="h1"
                            className="mt-3 text-[clamp(2.2rem,8vw,3.6rem)] text-white"
                            text={`${t.homeTitleA} ${t.homeTitleB}.`}
                            accentFrom={2}
                            accentClass="text-salmon"
                        />
                        <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-white/80 sm:text-[17px]">
                            {t.homeLead}
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <Button asChild variant="inverse" size="lg">
                                <a href="#records" className="text-ink hover:text-ink">
                                    {t.exploreCloths}
                                </a>
                            </Button>
                            <Button asChild variant="inverseGhost" size="lg">
                                <Link href="/scan" className="text-white hover:text-white">
                                    {t.howItWorks}
                                </Link>
                            </Button>
                        </div>
                        {identity && (
                            <Link
                                href="/collection"
                                className="mt-4 inline-block text-[15px] text-white/75 underline decoration-white/30 underline-offset-4 hover:text-white"
                            >
                                {t.openPassport} →
                            </Link>
                        )}
                    </div>

                    <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-white/18 pt-5">
                        {[
                            { value: records.length, label: "Cloths" },
                            { value: collections.length, label: "Collections" },
                            { value: originCount, label: "Origins" },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <dt className="text-[11px] tracking-[.16em] uppercase text-white/55">
                                    {stat.label}
                                </dt>
                                <dd className="display num mt-1 text-[28px] text-white sm:text-[34px]">
                                    {stat.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {/* the catalogue */}
            <section id="records" className="mt-10 scroll-mt-20 sm:mt-14">
                <div className="mb-5 border-b border-border pb-4">
                    <div className="eyebrow">{t.recordsEyebrow}</div>
                    <h2 className="mt-2">{t.recordsTitle}</h2>
                    <p className="mt-2 max-w-[56ch] text-[15px] text-muted-foreground">
                        {t.recordsLead}
                    </p>
                </div>
                <RecordGallery records={records} issued={issued} />
            </section>

            {/* the dyes — one line of materials, not a section */}
            <section className="mt-12 border-t border-border pt-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="eyebrow shrink-0">{t.dyeEyebrow}</div>
                    <ul className="flex flex-wrap items-center gap-x-5 gap-y-3">
                        {DYES.map((dye) => (
                            <li
                                key={dye.name}
                                className="flex items-center gap-2"
                                title={dye.note}
                            >
                                <span
                                    aria-hidden
                                    className="h-5 w-5 shrink-0 rounded-sm shadow-[var(--ring)]"
                                    style={{ background: dye.hex }}
                                />
                                <span className="text-[15px]">{dye.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* one chapter: what a certificate is, and the path it follows */}
            <section
                className="ink-band cloth mt-10 rounded-xl px-5 py-9 sm:mt-14 sm:px-10 sm:py-12"
                data-theme="dark"
            >
                <div className="eyebrow">{t.journeyEyebrow}</div>
                <RevealText
                    as="h2"
                    className="mt-3 max-w-[24ch] text-white"
                    text={t.journeyTitle}
                />
                <p className="mt-2 max-w-[48ch] text-[15px] text-white/70">
                    {t.journeyLead}
                </p>

                <JourneyRail className="mt-5" tone="ink" autoPlay />

                <dl className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-3">
                    {t.explain.map((item) => (
                        <div key={item.title} className="border-t border-white/18 pt-3">
                            <dt className="text-[11px] tracking-[.2em] uppercase text-salmon">
                                {item.title}
                            </dt>
                            <dd className="mt-1.5 text-[15px] leading-snug text-white/72">
                                {item.body}
                            </dd>
                        </div>
                    ))}
                </dl>

                {/* the story earns its length, so it is offered, not imposed */}
                <Reveal tone="ink" summary="Why this matters" className="mt-7">
                    <p>
                        In Adonara a weaver&apos;s name rarely appears anywhere: the
                        cloth is sold, the motifs are photographed, the price is noted,
                        the name is not. Yet one length can mean eleven weeks of work,
                        three dye baths, and a motif only certain families may wear.
                    </p>
                    <p>
                        This record writes the name down. Every cloth that leaves the
                        garden and the loom carries one page: who made it, from what,
                        for how long. That page goes wherever the cloth goes.
                    </p>
                </Reveal>

                {!identity && (
                    <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/18 pt-6">
                        <p className="max-w-[44ch] text-[15px] text-white/75">
                            {t.joinLead}
                        </p>
                        <Button asChild variant="inverse">
                            <Link href="/login?mode=register" className="text-ink hover:text-ink">
                                {t.joinButton}
                            </Link>
                        </Button>
                    </div>
                )}
            </section>

            <ThreadRule className="mt-10 h-2 w-full text-stone" aria-hidden />
        </>
    );
}
