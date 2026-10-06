import Link from "next/link";
import {
    attr,
    clothName,
    formatPlace,
    paletteFor,
    recordThumb,
    type ProductRecord,
} from "@/lib/records";
import { catalogueNumber } from "@/components/records/RecordCard";
import { Selvedge } from "@/components/records/selvedge";

/** A shelf of cloths: a horizontal rail that scrolls natively. */
export function RelatedRail({ records }: { records: ProductRecord[] }) {
    if (!records.length) return null;
    return (
        <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 pt-2 pb-8 sm:-mx-6 sm:scroll-pl-6 sm:px-6 lg:-mx-10 lg:scroll-pl-10 lg:px-10">
            {records.map((record) => {
                const palette = paletteFor(record);
                return (
                    <li key={record.code} className="w-[42%] shrink-0 snap-start sm:w-[28%] lg:w-[19%]">
                        <Link
                            href={`/record/${encodeURIComponent(record.code)}`}
                            className="card-stock lift group block h-full p-1.5 pb-3 text-ink hover:text-ink sm:p-2"
                        >
                            <div
                                className="aspect-square overflow-hidden"
                                style={{ background: palette?.colors[0]?.hex ?? "var(--bt-ink)" }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={recordThumb(record)}
                                    alt=""
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
                                />
                            </div>
                            <Selvedge palette={palette} />
                            <div className="mt-2.5 flex items-start gap-2 px-1">
                                <span className="numeral text-[28px] text-ink-3 group-hover:text-bt-red">
                                    {catalogueNumber(record.code)}
                                </span>
                                <div className="min-w-0">
                                    <p className="line-clamp-2 text-[16px] leading-tight">{clothName(record)}</p>
                                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                                        {formatPlace(attr(record, "Origin"))}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
