import Link from "next/link";
import {
    attr,
    clothName,
    collections,
    formatPlace,
    getRecord,
    originCount,
    paletteFor,
    records,
    recordSwatch,
} from "@/lib/records";
import { catalogueNumber } from "@/components/records/RecordCard";
import { passportStore } from "@/lib/store";
import { currentIdentity } from "@/lib/session";
import { t } from "@/lib/copy";
import { RecordGallery } from "@/components/records/record-gallery";
import { LivingLoom, type LoomCloth } from "@/components/story/living-loom";
import { Origins } from "@/components/home/origins";
import { StoryThread, Chapter, ChapterHead } from "@/components/story/story-thread";
import { ScrollWords } from "@/components/story/scroll-words";
import { StagesScroll } from "@/components/story/stages-scroll";
import { ColourLoom, type LoomThread } from "@/components/story/colour-loom";
import { StoryNav } from "@/components/story/story-nav";
import { FadeIn } from "@/components/story/fade-in";
import { PassportLeaf } from "@/components/passport/passport-leaf";
import { TagLookupForm } from "@/components/nfc/tag-lookup-form";
import { Button } from "@/components/ui/button";
import { RevealText } from "@/components/ui/reveal-text";
import type { Passport } from "@/lib/types";

export const dynamic = "force-dynamic";

/* The loom's warp: one band per cloth, in that cloth's measured colours. */
const loomCloths: LoomCloth[] = records.map((record) => ({
    code: record.code,
    number: catalogueNumber(record.code),
    name: clothName(record),
    colors: (paletteFor(record)?.colors ?? []).map((c) => c.hex),
}));

/* The specimen in the certificate section: a real cloth, a placeholder
   holder, and SPECIMEN where the id would be — so it cannot pass for one. */
const specimenRecord = getRecord("07/TM") ?? records[0];
const specimen: Passport = {
    id: "SPECIMEN",
    code: specimenRecord.code,
    holder: "Your name here",
    issuedAt: "2026-09-24T09:00:00+07:00",
    serial: 1,
    status: "issued",
};

const CHAPTERS = [
    { id: "chapter-name", label: "I · The name" },
    { id: "chapter-path", label: "II · The path" },
    { id: "chapter-colours", label: "III · The colours" },
    { id: "chapter-places", label: "IV · The places" },
    { id: "collection", label: "V · The cloths" },
    { id: "chapter-certificate", label: "Epilogue" },
];

function hsl(hex: string) {
    const n = Number.parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h = (h * 60 + 360) % 360;
    }
    return { h, s, l };
}

/* One loom thread per cloth. Its place in "by colour" is the hue of its most
   colourful large patch, so a red ikat on a dark ground sorts with the reds;
   cloths with no real colour gather at the end, light to dark. */
const threads: LoomThread[] = records.map((record) => {
    const colors = paletteFor(record)?.colors ?? [];
    const lead = [...colors].sort(
        (a, b) => b.share * (0.15 + hsl(b.hex).s) - a.share * (0.15 + hsl(a.hex).s),
    )[0];
    const tone = lead ? hsl(lead.hex) : { h: 0, s: 0, l: 0.5 };
    return {
        code: record.code,
        number: catalogueNumber(record.code),
        name: clothName(record),
        origin: formatPlace(attr(record, "Origin")),
        swatch: recordSwatch(record),
        colors,
        hue: tone.s < 0.18 ? 400 + (1 - tone.l) * 100 : (tone.h + 345) % 360,
        lightness: tone.l,
    };
});

/**
 * The cover, then the story, told along a red thread.
 *
 * A visitor in the exhibition usually has one cloth's label in front of them,
 * so the cover still opens with the code box and a jump to the cloths. Below
 * it the page is a story in five chapters and an epilogue — the name that is
 * never written down, the path from seed to loom, the colours, the places,
 * the cloths themselves, and the certificate — each one moving as you read.
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
            {/* ── the cover: a loom you weave on ─────────────────────────── */}
            <LivingLoom
                cloths={loomCloths}
                className="h-[calc(100svh-7.75rem)] min-h-[600px] lg:h-[calc(100svh-68px)] lg:min-h-[640px]"
            >
                {/* shade behind the words, so the loom stays bright elsewhere */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/92 via-ink/70 to-transparent lg:bg-gradient-to-r lg:from-ink/95 lg:via-ink/72 lg:to-transparent"
                />
                <div className="container-x relative flex flex-col pt-8 sm:pt-14 lg:h-[70%] lg:justify-center lg:pt-6">
                    <div className="max-w-2xl">
                        <div className="eyebrow">{t.homeEyebrow}</div>
                        <RevealText
                            as="h1"
                            className="t-hero mt-4 text-[clamp(3.2rem,14vw,6.6rem)] text-white"
                            text={`${t.homeTitleA} ${t.homeTitleB}.`}
                            accentFrom={2}
                            accentClass="text-salmon"
                        />
                        <p className="mt-5 hidden max-w-[44ch] text-[17px] leading-relaxed text-white/75 sm:block sm:text-[18px]">
                            {t.homeLead}
                        </p>
                        <p className="mt-4 border-l-2 border-salmon pl-3 text-[14px] text-white/85 lg:hidden">
                            This cover is a loom: sweep across it to weave, tap a thread to pluck it.
                        </p>

                        <div className="mt-6 max-w-md">
                            <TagLookupForm tone="ink" label="Have a label in front of you? Type its code" />
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                            <a
                                href="#chapter-name"
                                className="group inline-flex items-center gap-2 text-[16px] text-white hover:text-salmon"
                            >
                                Follow the thread
                                <span aria-hidden className="transition-transform duration-200 group-hover:translate-y-0.5">
                                    ↓
                                </span>
                            </a>
                            <a href="#collection" className="text-[16px] text-white/65 hover:text-white">
                                {t.exploreCloths}
                            </a>
                            {identity && (
                                <Link href="/collection" className="text-[16px] text-white/65 hover:text-white">
                                    {t.openPassport} →
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </LivingLoom>

            <StoryNav chapters={CHAPTERS} />

            <StoryThread>
                {/* ── I · the name ───────────────────────────────────────── */}
                <Chapter id="chapter-name" className="pt-24 pb-16 sm:pt-32 sm:pb-24">
                    <div className="container-x">
                        <ChapterHead numeral="I" kicker="The name" title="A name, rarely written down." />
                        <ScrollWords
                            text="In Adonara a weaver's name rarely appears anywhere. The cloth is sold, the motifs are photographed, the price is noted — the name is not."
                            accent={["name", "not"]}
                            className="display mt-12 max-w-[22ch] text-[clamp(2rem,5.6vw,4.4rem)] leading-[1.02] tracking-[-.035em]"
                        />
                        <div className="mt-16 grid grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
                            <FadeIn>
                                <figure className="relative aspect-[4/3] overflow-hidden bg-ink">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src="/imagery/story/weaver-portrait.webp"
                                        alt=""
                                        loading="lazy"
                                        className="h-full w-full object-cover"
                                    />
                                </figure>
                            </FadeIn>
                            <FadeIn delay={0.12}>
                                <p className="max-w-[44ch] text-[19px] leading-relaxed text-ink sm:text-[21px]">
                                    Yet one length can mean eleven weeks of work, three dye
                                    baths, and a motif only certain families may wear.
                                </p>
                                <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-muted-foreground">
                                    This record writes the name down. Every cloth that leaves
                                    the garden and the loom carries one page: who made it, from
                                    what, for how long. That page goes wherever the cloth goes.
                                </p>
                            </FadeIn>
                        </div>
                    </div>
                </Chapter>

                {/* ── II · the path (pins and travels sideways on a desk) ─── */}
                <StagesScroll id="chapter-path" />

                {/* ── III · the colours ──────────────────────────────────── */}
                <Chapter id="chapter-colours" className="pt-24 pb-16 sm:pt-32 sm:pb-24">
                    <div className="container-x">
                        <ChapterHead
                            numeral="III"
                            kicker="The colours"
                            title="Every cloth keeps its colours."
                            lead="Each thread below is one cloth, made of its own main colours — each as long as the share of the cloth it covers, measured from the photograph. Thread them by colour, and the collection reads as one weave."
                        />
                        <div className="mt-12">
                            <ColourLoom threads={threads} />
                        </div>
                    </div>
                </Chapter>

                {/* ── IV · the places ────────────────────────────────────── */}
                <Chapter id="chapter-places" className="pt-24 pb-16 sm:pt-32 sm:pb-24">
                    <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
                        <div className="lg:sticky lg:top-28 lg:self-start">
                            <ChapterHead
                                numeral="IV"
                                kicker="The places"
                                title="Where the threads come from."
                                lead={`${originCount} places across Indonesia, from Bali to Sulawesi. Each square is one cloth, in its own main colour. Point at a square to see the cloth; choose a place to see its cloths below.`}
                            />
                        </div>
                        <FadeIn>
                            <Origins />
                        </FadeIn>
                    </div>
                </Chapter>

                {/* ── V · the cloths ─────────────────────────────────────── */}
                <Chapter id="collection" className="pt-24 sm:pt-32">
                    <div className="container-x">
                        <div className="grid grid-cols-1 gap-6 pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end">
                            <ChapterHead numeral="V" kicker={t.recordsEyebrow} title={t.recordsTitle} />
                            <p className="max-w-[48ch] text-[17px] leading-relaxed text-muted-foreground lg:justify-self-end">
                                {t.recordsLead}
                            </p>
                        </div>
                        <RecordGallery records={records} issued={issued} />
                    </div>
                </Chapter>

                {/* ── epilogue · the certificate ─────────────────────────── */}
                <Chapter id="chapter-certificate" className="pt-28 sm:pt-36">
                    <div className="container-x grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-20">
                        <div>
                            <ChapterHead
                                numeral="VI"
                                kicker="Epilogue · your certificate"
                                title="Put your name to a cloth."
                                lead="Each cloth has one certificate. Claim it, and it is issued in your name — a page in your own book of traces, which anyone can check by its link. The cloth and its motifs stay with the weaver and their community."
                            />

                            <ol className="mt-10 border-t border-ink">
                                {[
                                    ["Create an account", "A name, an email and a password. No app, no wallet."],
                                    ["Open a cloth and claim it", "One certificate per cloth — first come, first named."],
                                    ["Keep it in your book", "Every certificate is a page you can turn, on any device."],
                                ].map(([title, body], i) => (
                                    <li key={title} className="flex gap-5 border-b border-border py-4">
                                        <span className="numeral w-10 shrink-0 text-[34px] text-bt-red">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <span>
                                            <span className="block text-[18px] text-ink">{title}</span>
                                            <span className="mt-0.5 block text-[15px] text-muted-foreground">{body}</span>
                                        </span>
                                    </li>
                                ))}
                            </ol>

                            <div className="mt-8 flex flex-wrap gap-3">
                                {identity ? (
                                    <Button asChild size="lg">
                                        <Link href="/collection">Open your traces</Link>
                                    </Button>
                                ) : (
                                    <Button asChild size="lg">
                                        <Link href="/login?mode=register">{t.joinButton}</Link>
                                    </Button>
                                )}
                                <Button asChild size="lg" variant="outline">
                                    <a href="#collection">Choose a cloth</a>
                                </Button>
                            </div>

                            <dl className="mt-12 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
                                {t.explain.map((item) => (
                                    <div key={item.title} className="border-t border-border pt-3">
                                        <dt className="text-[12px] tracking-[.18em] text-bt-red uppercase">{item.title}</dt>
                                        <dd className="mt-1.5 text-[15px] leading-snug text-muted-foreground">{item.body}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>

                        {/* a specimen, on a small stack of pages */}
                        <FadeIn className="relative mx-auto w-full max-w-[22rem]">
                            <div aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 bg-card shadow-[var(--ring)]" />
                            <div aria-hidden className="absolute inset-0 translate-x-2 translate-y-2 bg-card shadow-[var(--ring)]" />
                            <div className="relative">
                                <PassportLeaf passport={specimen} record={specimenRecord} specimen />
                            </div>
                        </FadeIn>
                    </div>
                </Chapter>
            </StoryThread>
        </>
    );
}
