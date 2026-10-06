import Link from "next/link";
import { attr, clothName, formatPlace, recordVisual, type ProductRecord } from "@/lib/records";

/**
 * Explore surface: the photograph does the work, the metadata sits under it
 * in two registers — title (display), origin (warm grey). The whole card is
 * the link, so there is no separate "Read the record" row to aim at; on a
 * phone that row was a third of every card.
 *
 * The code sits on the photograph because it is what the label beside the
 * cloth in the exhibition says — it is how a visitor matches the two.
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

    return (
        <article className="rise" style={{ ["--i" as string]: String(index % 8) }}>
            <Link
                href={`/record/${encodeURIComponent(record.code)}`}
                className="group block rounded-lg text-ink hover:text-ink"
            >
                <div className="relative overflow-hidden rounded-lg bg-ink shadow-[var(--ring)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={recordVisual(record)}
                        alt=""
                        loading={index < 8 ? "eager" : "lazy"}
                        decoding="async"
                        className="sheen aspect-4/5 w-full object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.23,1,0.32,1)] [@media(hover:hover)]:group-hover:scale-[1.03] motion-reduce:transition-none"
                        draggable={false}
                    />
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2 sm:p-2.5">
                        <span className="rounded-[4px] bg-ink/75 px-1.5 py-0.5 font-mono text-[11px] tracking-[.04em] text-white">
                            {record.code}
                        </span>
                        {claimed ? (
                            <span className="rounded-full bg-paper/95 px-2 py-0.5 text-[10px] tracking-[.12em] text-ink uppercase">
                                Claimed
                            </span>
                        ) : shared && remaining !== undefined ? (
                            <span className="rounded-full bg-paper/95 px-2 py-0.5 text-[10px] tracking-[.12em] text-ink uppercase">
                                {remaining} left
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="mt-3 text-[12px] text-muted-foreground sm:text-[13px]">
                    {record.collection ?? "Record"}
                </div>
                <h3 className="mt-1 line-clamp-2 text-[16px] leading-tight transition-colors duration-150 group-hover:text-bt-red sm:text-[18px]">
                    {clothName(record)}
                </h3>
                {origin && (
                    <p className="mt-1 line-clamp-1 text-[13px] text-muted-foreground sm:text-[14px]">
                        {origin}
                    </p>
                )}
            </Link>
        </article>
    );
}
