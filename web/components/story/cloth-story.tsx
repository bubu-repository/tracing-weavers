import Link from "next/link";
import {
    attr,
    clothName,
    paletteFor,
    records,
    recordSwatch,
    type ProductRecord,
} from "@/lib/records";
import { TECHNIQUE, techniqueNotes, weaveKind } from "@/lib/techniques";
import { FadeIn } from "@/components/story/fade-in";
import { WeaveDiagram } from "@/components/story/weave-diagram";
import { PaletteThreads } from "@/components/story/palette-threads";
import { cn } from "@/lib/utils";

/**
 * The story of one cloth, in four short chapters: where it was woven, how,
 * from what, and where it is now. Every line comes from the record — its
 * origin, technique, material, measured colours and place in the room — or
 * from a general description of the technique; nothing about its makers or
 * its motif's meaning is invented.
 */
export function ClothStory({ record, remaining }: { record: ProductRecord; remaining: number }) {
    const raw = String(attr(record, "Origin") ?? "");
    const [place, province = place] = raw.split("/").map((part) => part.trim());
    const technique = String(attr(record, "Technique") ?? "");
    const material = String(attr(record, "Material") ?? "");
    const displayedAt = String(attr(record, "Displayed at") ?? "");
    const palette = paletteFor(record);
    const kind = weaveKind(technique);
    const notes = techniqueNotes(technique);

    const neighbours = records.filter((r) => provinceOf(r) === province);

    return (
        <section className="container-x mt-28" aria-labelledby="cloth-story">
            <div className="border-t border-ink pt-10">
                <div className="eyebrow">The story of this cloth</div>
                <h2 id="cloth-story" className="mt-3 max-w-[20ch] text-[clamp(2.2rem,5.5vw,4rem)]">
                    From {place} to this page.
                </h2>
            </div>

            <ol className="mt-16 space-y-24 sm:space-y-32">
                <Row n="01" kicker="Where it was woven" title={place} flip={false}
                    visual={
                        <div>
                            <p className="display text-[clamp(1.6rem,4vw,2.4rem)] text-ink-3">{province}</p>
                            <ul className="mt-5 flex flex-wrap gap-2" aria-label={`Cloths from ${province}`}>
                                {neighbours.map((r) => {
                                    const self = r.code === record.code;
                                    return (
                                        <li key={r.code}>
                                            <Link
                                                href={`/record/${encodeURIComponent(r.code)}`}
                                                aria-current={self ? "page" : undefined}
                                                title={clothName(r)}
                                                className={cn(
                                                    "group relative block h-16 w-16 overflow-hidden sm:h-20 sm:w-20",
                                                    self && "shadow-[0_0_0_3px_var(--surface-page),0_0_0_5px_var(--bt-red)]",
                                                )}
                                                style={{ background: paletteFor(r)?.colors[0]?.hex }}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={recordSwatch(r)}
                                                    alt={clothName(r)}
                                                    loading="lazy"
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    }
                >
                    <p>
                        Handwoven in {place}, {province}.{" "}
                        {neighbours.length === 1
                            ? `It is the only cloth in the collection from ${province}.`
                            : `${neighbours.length} of the collection's ${records.length} cloths come from ${province} — this one is ringed in red.`}
                    </p>
                </Row>

                {technique && (
                    <Row n="02" kicker="How it was woven" title={technique} flip
                        visual={
                            <WeaveDiagram
                                kind={kind}
                                colors={(palette?.colors ?? []).map((c) => c.hex)}
                                caption={TECHNIQUE[kind].diagram}
                            />
                        }
                    >
                        <p>{TECHNIQUE[kind].body}</p>
                        {notes.map((note) => (
                            <p key={note}>{note}</p>
                        ))}
                        <p className="border-l-2 border-bt-red pl-4 text-[15px]">
                            The community decides how much of a motif may be recorded and
                            shown. What it means stays with the weaver and their family —
                            so the diagram shows how the threads go, not the motif itself.
                        </p>
                    </Row>
                )}

                {palette && (
                    <Row n="03" kicker="What it is made of" title={material || "Its colours"} flip={false}
                        visual={<PaletteThreads colors={palette.colors} />}
                    >
                        <p>
                            These are its five main colours, each hanging as long as the share
                            of the cloth it covers — measured from the photograph, so light and
                            camera shift them a little.
                        </p>
                    </Row>
                )}

                <Row n="04" kicker="Where it is now" title={displayedAt ? "On display" : "In the collection"} flip
                    visual={
                        <div className="bg-ink p-6 text-white sm:p-8" data-theme="dark">
                            <div className="label">Certificate</div>
                            <p className="display mt-2 text-[clamp(2rem,5vw,3rem)] text-white">
                                {remaining <= 0 ? "Claimed." : record.supply > 1 ? `${remaining} of ${record.supply} left.` : "Still to claim."}
                            </p>
                            <p className="mt-3 text-[15px] text-white/70">
                                {remaining <= 0
                                    ? "Its certificate is held. The record stays open for anyone to read."
                                    : "One certificate, issued in the name of whoever claims it first."}
                            </p>
                            {remaining > 0 && (
                                <a
                                    href="#claim"
                                    className="mt-6 inline-flex items-center gap-2 bg-salmon px-5 py-3 text-[15px] font-medium text-ink hover:bg-white hover:text-ink"
                                >
                                    Claim its certificate <span aria-hidden>↑</span>
                                </a>
                            )}
                        </div>
                    }
                >
                    {displayedAt ? (
                        <p>
                            In the exhibition it hangs at{" "}
                            <span className="text-ink">{displayedAt.charAt(0).toLowerCase() + displayedAt.slice(1)}</span>.
                            Its record goes wherever the cloth goes, including when it changes
                            hands.
                        </p>
                    ) : (
                        <p>Its record goes wherever the cloth goes, including when it changes hands.</p>
                    )}
                </Row>
            </ol>
        </section>
    );
}

/* "Sumba Timur/NTT" → "NTT"; a place with no province is its own. */
function provinceOf(record: ProductRecord) {
    const [place, province = place] = String(attr(record, "Origin") ?? "")
        .split("/")
        .map((part) => part.trim());
    return province;
}

function Row({
    n,
    kicker,
    title,
    flip,
    visual,
    children,
}: {
    n: string;
    kicker: string;
    title: string;
    flip: boolean;
    visual: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <li className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
            <FadeIn className={cn(flip && "lg:order-2")}>
                <div className="flex items-end gap-4">
                    <span aria-hidden className="numeral text-[clamp(4rem,9vw,6.5rem)] text-bt-red/25">
                        {n}
                    </span>
                    <span className="eyebrow pb-3">{kicker}</span>
                </div>
                <h3 className="mt-2 text-[clamp(2rem,4.5vw,3.25rem)] leading-[.95]">{title}</h3>
                <div className="mt-5 max-w-[46ch] space-y-4 text-[17px] leading-relaxed text-muted-foreground">
                    {children}
                </div>
            </FadeIn>
            <FadeIn delay={0.1} className={cn(flip && "lg:order-1")}>
                {visual}
            </FadeIn>
        </li>
    );
}
