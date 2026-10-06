import Link from "next/link";
import {
    attr,
    clothName,
    formatPlace,
    paletteFor,
    recordThumb,
    type ProductRecord,
} from "@/lib/records";
import { Selvedge } from "@/components/records/selvedge";

/** "07/TM" → "07": the number on the exhibition label. */
export const catalogueNumber = (code: string) => {
    const n = Number.parseInt(code, 10);
    return Number.isFinite(n) ? String(n).padStart(2, "0") : code;
};

/**
 * One entry in the catalogue, set like a museum label.
 *
 * A print mounted on card stock: the photograph inset in a narrow mat, the
 * caption on the card below it, and the card lifts toward the pointer.
 *
 * The photograph, square-cornered, with the cloth's own colours woven along
 * its lower edge; then the number from the label beside the cloth in the
 * room — big, light, the way a catalogue sets it — and the caption: name,
 * collection, origin. The whole entry is the link.
 */
export default function RecordCard({
    record,
    remaining,
    index = 0,
}: {
    record: ProductRecord;
    /** certificates still to issue; undefined when the store did not answer */
    remaining?: number;
    index?: number;
}) {
    const origin = formatPlace(attr(record, "Origin"));
    const claimed = remaining !== undefined && remaining <= 0;
    const shared = record.supply > 1;
    const palette = paletteFor(record);

    return (
        <article className="rise h-full" style={{ ["--i" as string]: String(index % 8) }}>
            <Link
                href={`/record/${encodeURIComponent(record.code)}`}
                className="card-stock lift group block h-full p-1.5 pb-3.5 text-ink hover:text-ink sm:p-2.5 sm:pb-5"
            >
                <div
                    className="relative aspect-4/5 overflow-hidden bg-ink"
                    style={palette ? { background: palette.colors[0]?.hex } : undefined}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={recordThumb(record)}
                        alt=""
                        loading={index < 8 ? "eager" : "lazy"}
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.23,1,0.32,1)] [@media(hover:hover)]:group-hover:scale-[1.06] motion-reduce:transition-none"
                        draggable={false}
                    />
                    {(claimed || (shared && remaining !== undefined)) && (
                        <span className={`stamp absolute top-3 right-3 ${claimed ? "" : "stamp-ink"}`}>
                            {claimed ? "Claimed" : `${remaining} left`}
                        </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between bg-ink/88 px-3 py-2 text-[12px] tracking-[.14em] text-white uppercase transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] [@media(hover:hover)]:group-hover:translate-y-0">
                        Read the record <span aria-hidden>→</span>
                    </span>
                </div>
                <Selvedge palette={palette} />

                <div className="mt-2.5 flex items-start gap-2 px-1 sm:mt-3 sm:gap-3">
                    <span className="numeral text-[26px] text-ink-3 transition-colors duration-200 group-hover:text-bt-red sm:text-[40px]">
                        {catalogueNumber(record.code)}
                    </span>
                    <div className="min-w-0 pt-0.5">
                        <div className="label line-clamp-2 sm:truncate">{record.collection ?? "Record"}</div>
                        <h3 className="mt-1 line-clamp-3 text-[16px] leading-[1.1] sm:line-clamp-2 sm:text-[19px]">
                            {clothName(record)}
                        </h3>
                        {origin && (
                            <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted-foreground sm:truncate sm:text-[14px]">
                                {origin}
                            </p>
                        )}
                    </div>
                </div>
            </Link>
        </article>
    );
}
