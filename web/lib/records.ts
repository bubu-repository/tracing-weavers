import recordsJson from "@/data/records.json";
import { safeDecode } from "@/lib/safe";

/**
 * A record is the passport's subject: one product, one origin story.
 * It is a plain JSON file in the repo (data/records.json) — no chain, no
 * dashboard. Publishing = adding a row here (see `npm run publish`).
 */

export type RecordAttribute = { trait_type: string; value: string | number };

export type ProductRecord = {
    code: string;
    title: string;
    subtitle?: string;
    description: string;
    /** documentary photo for the page — hands, cloth, looms */
    photo?: string;
    /** who took it, under whose permission; shown under the photo */
    photoCredit?: string;
    /** the record sheet drawn by `npm run record:svg` — passport + print */
    image: string;
    collection?: string;
    /** How many passports this record may ever issue. 1 = unique item. */
    supply: number;
    /** How many one account may hold. */
    perHolder?: number;
    attributes?: RecordAttribute[];
};

export const records: ProductRecord[] = (recordsJson as { records: ProductRecord[] })
    .records;

export function getRecord(code: string): ProductRecord | undefined {
    const wanted = safeDecode(code).trim().toUpperCase();
    return records.find((r) => r.code.toUpperCase() === wanted);
}

export function attr(record: ProductRecord, name: string) {
    return record.attributes?.find(
        (a) => a.trait_type.toLowerCase() === name.toLowerCase(),
    )?.value;
}

export const collectionName = (record: ProductRecord) =>
    record.collection ?? "Digital Product Passport";

/** The object itself: the photo when there is one, else the record sheet. */
export const recordVisual = (record: ProductRecord) => record.photo ?? record.image;
/** The cloth's own name, without the " · …" suffix some titles carry. */
export const clothName = (record: ProductRecord) => record.title.split(" · ")[0];

/** "Timor Tengah Utara (TTU)/NTT" → "Timor Tengah Utara (TTU), NTT". The
    sheet writes regency/province with a slash; on a page it reads as a typo. */
export const formatPlace = (value: unknown) =>
    String(value ?? "")
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)
        .join(", ");

/** Sizes in the sheet are centimetres without a unit. */
export const formatSize = (value: unknown) => {
    const text = String(value ?? "").trim();
    return text && !/cm$/i.test(text) ? `${text} cm` : text;
};

/** Credits still waiting for a name are written "[LIKE THIS]" — a brief's
    placeholder, not something a visitor should read. */
export const isPlaceholder = (value?: string) => !value || /^\s*\[.*\]\s*$/.test(value);

export const collections: string[] = [
    ...new Set(records.map((r) => r.collection).filter((c): c is string => Boolean(c))),
];

export const originCount = new Set(
    records.map((r) => formatPlace(attr(r, "Origin"))).filter(Boolean),
).size;

const compact = (value: string) => safeDecode(value).replace(/[^A-Za-z0-9]/g, "").toUpperCase();

/**
 * What a visitor types from the label beside the cloth: "07/TM", "07TM",
 * "07-tm", "7". Exact code first, then the number alone when it names exactly
 * one record.
 */
export function findRecord(query: string): ProductRecord | undefined {
    const exact = getRecord(query);
    if (exact) return exact;

    const wanted = compact(query);
    if (!wanted) return undefined;
    const byCompact = records.find((r) => compact(r.code) === wanted);
    if (byCompact) return byCompact;

    if (/^\d+$/.test(wanted)) {
        const n = Number(wanted);
        const matches = records.filter((r) => Number.parseInt(r.code, 10) === n);
        if (matches.length === 1) return matches[0];
    }
    return undefined;
}

/** The records either side of this one, for walking the exhibition in order. */
export function neighbours(code: string) {
    const i = records.findIndex((r) => r.code === code);
    if (i < 0) return { previous: undefined, next: undefined };
    return {
        previous: i > 0 ? records[i - 1] : undefined,
        next: i < records.length - 1 ? records[i + 1] : undefined,
    };
}
