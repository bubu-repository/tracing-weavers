import Link from "next/link";
import { attr, clothName, collections, formatPlace, getRecord, originCount, records, recordThumb } from "@/lib/records";
import { t } from "@/lib/copy";
import { TagLookupForm } from "@/components/nfc/tag-lookup-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { WarpField } from "@/components/motif/marks";
import { TapDemo } from "@/components/nfc/tap-demo";
import { catalogueNumber } from "@/components/records/RecordCard";

/* the cloth on the table in the demonstration: a bold, square-friendly ikat */
const DEMO_CODE = "07/TM";

export const metadata = { title: "How it works" };

const STEPS = [
    {
        title: "Find a cloth",
        body: "Every cloth in the exhibition carries a code — look for it on the label beside each piece.",
    },
    {
        title: "Open its record",
        body: "Scan the label, type its code, or browse the collection. No app to install, no account needed.",
    },
    {
        title: "Read its story",
        body: "Where it was woven, in which technique, from what, its colours — and where it hangs in the room.",
    },
    {
        title: "Claim the certificate",
        body: "Create an account and put your name on a cloth's certificate. It becomes a page in your book of traces.",
    },
];

/* Answers drawn from how the app actually behaves — nothing promised here
   that the code does not do. */
const FAQ = [
    {
        q: "Do I need an app or an account to read a cloth?",
        a: "No. Every record is a public web page. Scan the label or type its code and it opens in your browser. An account is only needed to claim a certificate.",
    },
    {
        q: "What does claiming a certificate mean?",
        a: "A certificate is issued in your name for one cloth and kept under your account, where it appears as a page in your book of traces. Anyone can check it through its link. It records the cloth and your name; the cloth and its motifs stay with the weaver and their community.",
    },
    {
        q: "How many certificates does a cloth have?",
        a: "One. The first person to claim it is named on it; after that, the record stays open for anyone to read, but the certificate is held.",
    },
    {
        q: "Is this a token, an NFT, or crypto?",
        a: "No. There is no blockchain, no wallet and nothing to trade. A certificate is an entry in the programme's register, signed so that it can be checked.",
    },
    {
        q: "What are the colours on each record?",
        a: "The main colours of the cloth, measured from its photograph. Light and camera shift them a little, so they are a guide to the cloth, not a dye recipe.",
    },
    {
        q: "Why are some motifs not explained?",
        a: "Communities decide how much of a motif may be recorded and shown. What it means stays with the weaver and their family.",
    },
];

/* How to explore the collection: the code box first — someone here usually
   has a label in front of them — then the four steps and the questions. */
export default function ScanPage() {
    const demo = getRecord(DEMO_CODE) ?? records[0];
    return (
        <>
            <PageHeader
                eyebrow={t.scanEyebrow}
                title={
                    <>
                        {t.scanTitleA} <span className="text-bt-red">{t.scanTitleB}</span>
                    </>
                }
                lead={`${records.length} cloths across ${collections.length} collections, woven in ${originCount} places across Indonesia. One page per weave.`}
            />

            {/* try the tap before standing in front of a cloth */}
            {demo && (
                <section className="container-x mt-10">
                    <TapDemo
                        cloth={{
                            code: demo.code,
                            number: catalogueNumber(demo.code),
                            name: clothName(demo),
                            origin: formatPlace(attr(demo, "Origin")) || (demo.collection ?? ""),
                            photo: recordThumb(demo),
                        }}
                    />
                </section>
            )}

            {/* no tag, or a phone that will not read one: the code works too */}
            <section className="container-x mt-8">
                <div className="card-stock relative overflow-hidden p-6 sm:p-10">
                    <WarpField className="pointer-events-none absolute inset-0 h-full w-full text-ink/[.05]" />
                    <div aria-hidden className="stitch absolute inset-x-5 top-3.5" />
                    <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
                        <div>
                            <h2 className="text-[clamp(1.8rem,5vw,3rem)] text-ink">
                                Have a code from a label?
                            </h2>
                            <p className="read mt-3 max-w-[40ch] text-[17px] leading-[1.9] text-ink-2">
                                Type it as printed — <span className="woven-label mx-0.5">07/TM</span>{" "}
                                <span className="woven-label mx-0.5">07tm</span> or just{" "}
                                <span className="woven-label mx-0.5">7</span> — all open the same cloth.
                            </p>
                        </div>
                        <TagLookupForm />
                    </div>
                </div>
            </section>

            {/* the four steps */}
            <section className="container-x mt-20" aria-labelledby="steps">
                <h2 id="steps" className="eyebrow">
                    Four steps
                </h2>
                <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {STEPS.map((step, i) => (
                        <li
                            key={step.title}
                            className="card-stock border-t-2 border-bt-red p-6"
                        >
                            <span className="numeral text-[64px] text-bt-red">
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <h3 className="mt-4 text-[24px]">{step.title}</h3>
                            <p className="read mt-2 text-[16px] leading-relaxed text-muted-foreground">{step.body}</p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* the questions */}
            <section className="container-x mt-20" aria-labelledby="faq">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
                    <div>
                        <div className="eyebrow">Questions</div>
                        <h2 id="faq" className="mt-3">What people ask.</h2>
                    </div>
                    <div className="border-t border-ink">
                        {FAQ.map((item) => (
                            <details key={item.q} className="group border-b border-border">
                                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[19px] leading-snug text-ink transition-colors hover:text-bt-red [&::-webkit-details-marker]:hidden">
                                    {item.q}
                                    <span
                                        aria-hidden
                                        className="mt-1 grid h-6 w-6 shrink-0 place-items-center text-[20px] leading-none text-ink-3 transition-transform duration-200 group-open:rotate-45"
                                    >
                                        +
                                    </span>
                                </summary>
                                <p className="read max-w-[60ch] pb-6 text-[16px] leading-relaxed text-muted-foreground">
                                    {item.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            <section className="container-x mt-20">
                <div className="flex flex-col gap-6 border-y border-ink py-10 sm:flex-row sm:items-center sm:justify-between">
                    <p className="display max-w-[22ch] text-[clamp(1.8rem,4vw,2.6rem)]">
                        {records.length} cloths are waiting to be read.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button asChild size="lg">
                            <Link href="/#collection">Browse the collection</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link href="/login?mode=register">Create an account</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </>
    );
}
