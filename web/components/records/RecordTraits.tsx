import { attr, formatPlace, formatSize, type ProductRecord } from "@/lib/records";

/**
 * The cloth's specification, set like the sheet on a museum plinth: a grid of
 * hairline cells, the label small above, the value large below. Two columns
 * even on a phone — six short facts read faster side by side than stacked.
 */
export function RecordTraits({ record }: { record: ProductRecord }) {
    const rows: { label: string; value: string; wide?: boolean }[] = [
        { label: "Technique", value: String(attr(record, "Technique") ?? "") },
        { label: "Material", value: String(attr(record, "Material") ?? "") },
        { label: "Origin", value: formatPlace(attr(record, "Origin")) },
        { label: "Size", value: formatSize(attr(record, "Size")) },
        { label: "Collection", value: record.collection ?? "" },
        { label: "On display", value: String(attr(record, "Displayed at") ?? "") },
    ].filter((row) => row.value.trim());

    if (!rows.length) return null;

    return (
        <section aria-labelledby="cloth-notes">
            <h2 id="cloth-notes" className="eyebrow">
                Cloth notes
            </h2>
            <dl className="card-stock mt-4 grid grid-cols-2 border-t-2 border-ink px-4 sm:px-5">
                {rows.map((row, i) => (
                    <div
                        key={row.label}
                        className={`border-border py-3.5 ${i < rows.length - (rows.length % 2 === 0 ? 2 : 1) ? "border-b" : ""} ${i % 2 === 0 ? "pr-4" : "border-l pl-4"}`}
                    >
                        <dt className="label">{row.label}</dt>
                        <dd className="mt-1.5 text-[17px] leading-snug text-ink sm:text-[18px]">{row.value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
