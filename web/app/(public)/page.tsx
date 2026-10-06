import Link from "next/link";
import { collections, getRecord, originCount, records } from "@/lib/records";
import { passportStore } from "@/lib/store";
import { currentIdentity } from "@/lib/session";
import { t } from "@/lib/copy";
import { RecordGallery } from "@/components/records/record-gallery";
import { ClothMarquee } from "@/components/home/cloth-marquee";
import { Origins } from "@/components/home/origins";
import { PathOfWeave } from "@/components/home/path-of-weave";
import { PassportLeaf } from "@/components/passport/passport-leaf";
import { TagLookupForm } from "@/components/nfc/tag-lookup-form";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { RevealText } from "@/components/ui/reveal-text";
import type { Passport } from "@/lib/types";

export const dynamic = "force-dynamic";

/* Three columns of cloth for the hero wall, dealt out like cards so no two
   neighbours are the same and each column drifts at its own pace. */
const deal = (n: number) =>
    Array.from({ length: n }, (_, col) => records.filter((_, i) => i % n === col));

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

/**
 * The cover of the catalogue, then the catalogue.
 *
 * A visitor in the exhibition usually has one cloth's label in front of them,
 * so the first thing they can do is type its code; the second is to browse.
 * The programme's story — where the threads come from, the path a weave
 * follows, what a certificate is — comes after the cloths, not before them.
 */
export default async function Home() {
    const identity = await currentIdentity();

    /* Which cloths are still available. A store that does not answer must not
       take the catalogue down with it: without counts, the badges simply do
       not show. */
    const issued = await passportStore()
        .issuableCounts(records.map((r) => r.code))
        .catch(() => null);

    const [colA, colB, colC] = deal(3);

    return (
        <>
            {/* ── the cover ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-ink text-white" data-theme="dark">
                <div className="container-x grid grid-cols-1 gap-10 pt-10 pb-12 sm:pt-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 lg:py-0">
                    <div className="flex flex-col justify-center lg:min-h-[calc(100svh-68px)] lg:py-20">
                        <div className="eyebrow">{t.homeEyebrow}</div>
                        <RevealText
                            as="h1"
                            className="t-hero mt-5 text-white"
                            text={`${t.homeTitleA} ${t.homeTitleB}.`}
                            accentFrom={2}
                            accentClass="text-salmon"
                        />
                        <p className="mt-6 max-w-[44ch] text-[17px] leading-relaxed text-white/72 sm:text-[19px]">
                            {t.homeLead}
                        </p>

                        <div className="mt-8 max-w-md border-t border-white/16 pt-6">
                            <TagLookupForm tone="ink" label="Have a label in front of you? Type its code" />
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                            <a
                                href="#collection"
                                className="group inline-flex items-center gap-2 text-[16px] text-white hover:text-salmon"
                            >
                                {t.exploreCloths}
                                <span aria-hidden className="transition-transform duration-200 group-hover:translate-y-0.5">
                                    ↓
                                </span>
                            </a>
                            <Link href="/scan" className="text-[16px] text-white/60 hover:text-white">
                                {t.howItWorks}
                            </Link>
                            {identity && (
                                <Link href="/collection" className="text-[16px] text-white/60 hover:text-white">
                                    {t.openPassport} →
                                </Link>
                            )}
                        </div>

                        <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
                            {[
                                { value: records.length, label: "Cloths" },
                                { value: collections.length, label: "Collections" },
                                { value: originCount, label: "Origins" },
                            ].map((stat) => (
                                <div key={stat.label} className="flex flex-col-reverse border-l border-white/16 pl-3">
                                    <dt className="mt-1 text-[11px] tracking-[.2em] uppercase text-white/50">
                                        {stat.label}
                                    </dt>
                                    <dd className="numeral text-[44px] text-white sm:text-[52px]">{stat.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {/* the wall of cloth: three drifting columns on a desk… */}
                    <div className="relative hidden h-[calc(100svh-68px)] min-h-[560px] grid-cols-3 gap-3 lg:grid">
                        <ClothMarquee records={colA} direction="y" duration={90} tileClassName="aspect-[3/4]" />
                        <ClothMarquee records={colB} direction="y" reverse duration={110} className="-mt-28 h-[calc(100%+7rem)]" tileClassName="aspect-[3/4]" />
                        <ClothMarquee records={colC} direction="y" duration={100} tileClassName="aspect-[3/4]" />
                    </div>
                </div>

                {/* …and two drifting rows on a phone */}
                <div className="space-y-2 pb-10 lg:hidden">
                    <ClothMarquee records={[...colA, ...colB]} duration={80} tileClassName="h-28 w-24 sm:h-36 sm:w-32" />
                    <ClothMarquee records={[...colC, ...colA]} reverse duration={95} tileClassName="h-28 w-24 sm:h-36 sm:w-32" />
                </div>
            </section>

            {/* ── the catalogue ─────────────────────────────────────────── */}
            <section id="collection" className="container-x scroll-mt-16 pt-16 sm:pt-24">
                <div className="grid grid-cols-1 gap-6 pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
                    <div>
                        <div className="eyebrow">{t.recordsEyebrow}</div>
                        <h2 className="mt-3 text-[clamp(2.4rem,7vw,4.5rem)]">{t.recordsTitle}</h2>
                    </div>
                    <p className="max-w-[48ch] text-[17px] leading-relaxed text-muted-foreground lg:justify-self-end">
                        {t.recordsLead}
                    </p>
                </div>
                <RecordGallery records={records} issued={issued} />
            </section>

            {/* ── where the threads come from ──────────────────────────── */}
            <section className="container-x pt-24 sm:pt-32">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
                    <div className="lg:sticky lg:top-28 lg:self-start">
                        <div className="eyebrow">Origins</div>
                        <h2 className="mt-3">Where the threads come from.</h2>
                        <p className="mt-4 max-w-[42ch] text-[17px] leading-relaxed text-muted-foreground">
                            {originCount} places across Indonesia, from Bali to Sulawesi.
                            Each square is one cloth, in its own main colour. Point at a
                            square to see the cloth; choose a place to see its cloths.
                        </p>
                    </div>
                    <Origins />
                </div>
            </section>

            {/* ── the path of a weave ──────────────────────────────────── */}
            <section className="mt-24 bg-ink py-16 text-white sm:mt-32 sm:py-24" data-theme="dark">
                <div className="container-x">
                    <div className="grid grid-cols-1 gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
                        <div>
                            <div className="eyebrow">{t.journeyEyebrow}</div>
                            <h2 className="mt-3 text-white">{t.journeyTitle}</h2>
                        </div>
                        <p className="max-w-[46ch] text-[17px] leading-relaxed text-white/68 lg:justify-self-end">
                            {t.journeyLead}
                        </p>
                    </div>

                    <PathOfWeave />

                    <dl className="mt-14 grid grid-cols-1 gap-x-10 gap-y-6 border-t border-white/16 pt-8 sm:grid-cols-3">
                        {t.explain.map((item) => (
                            <div key={item.title}>
                                <dt className="text-[11px] tracking-[.22em] uppercase text-salmon">
                                    {item.title}
                                </dt>
                                <dd className="mt-2 text-[16px] leading-snug text-white/72">{item.body}</dd>
                            </div>
                        ))}
                    </dl>

                    <Reveal tone="ink" summary="Why this matters" className="mt-10">
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
                </div>
            </section>

            {/* ── the certificate ──────────────────────────────────────── */}
            <section className="container-x pt-24 sm:pt-32">
                <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-20">
                    <div>
                        <div className="eyebrow">Your certificate</div>
                        <h2 className="mt-3">Put your name to a cloth.</h2>
                        <p className="mt-4 max-w-[46ch] text-[17px] leading-relaxed text-muted-foreground">
                            Each cloth has one certificate. Claim it, and it is issued in
                            your name — a page in your own book of traces, which anyone
                            can check by its link. The cloth and its motifs stay with
                            the weaver and their community.
                        </p>

                        <ol className="mt-8 border-t border-ink">
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
                    </div>

                    {/* a specimen, on a small stack of pages */}
                    <div className="relative mx-auto w-full max-w-[22rem]">
                        <div aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 bg-card shadow-[var(--ring)]" />
                        <div aria-hidden className="absolute inset-0 translate-x-2 translate-y-2 bg-card shadow-[var(--ring)]" />
                        <div className="relative">
                            <PassportLeaf passport={specimen} record={specimenRecord} specimen />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
