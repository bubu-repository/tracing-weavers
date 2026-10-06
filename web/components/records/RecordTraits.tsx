import { attr, formatPlace, formatSize, type ProductRecord } from "@/lib/records";

/**
 * The fact table of the record: hairline rows, label caps left, value right.
 *
 * One list instead of three tabs. The tabs held five facts between them, put
 * two of them behind a click, and their active label rendered grey-on-ink
 * because the resting text sat above the highlight. On a phone a list of six
 * rows is shorter than the tab bar plus its panel.
 */
export function RecordTraits({ record }: { record: ProductRecord }) {
    const rows: { label: string; value: string }[] = [
        { label: "Origin", value: formatPlace(attr(record, "Origin")) },
        { label: "Technique", value: String(attr(record, "Technique") ?? "") },
        { label: "Material", value: String(attr(record, "Material") ?? "") },
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
            <dl className="mt-3">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="flex items-baseline justify-between gap-6 border-t border-border py-2.5 last:border-b"
                    >
                        <dt className="label shrink-0">{row.label}</dt>
                        <dd className="num text-right text-[15px] text-ink">{row.value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
