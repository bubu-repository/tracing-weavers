import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/copy";
import { siteUrl } from "@/lib/brand";
import type { Passport } from "@/lib/types";
import {
    attr,
    clothName,
    formatPlace,
    formatSize,
    recordVisual,
    type ProductRecord,
} from "@/lib/records";

const issuedOn = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
    });

/**
 * One page of the certificate book: the cloth's photograph, then its data.
 *
 * The shape is fixed (3:4 — the same shape a page has inside the book, so the
 * leaf and the sheet agree) because a card that grows with its content reads
 * as a web card, not as a page you could hold and turn.
 *
 * The data rows are the cloth's own attributes from the record — origin,
 * technique, material, size — not a restatement of the holder. A certificate
 * for a claimed cloth should tell you what the cloth *is*; the holder's name
 * and the passport id are already in the identity block above.
 *
 * `fill` is the book: the sheet has already given the page its shape, so the
 * leaf takes the height it is handed.
 */
export function PassportLeaf({
    passport,
    record,
    fill = false,
    className,
}: {
    passport: Passport;
    record?: ProductRecord;
    fill?: boolean;
    className?: string;
}) {
    const revoked = passport.status === "revoked";

    /* Only the attributes this record actually carries; a row that would read
       "—" is noise. Displayed at is left out on purpose: it is where the piece
       hangs in one exhibition, which is not a fact about the cloth. */
    const facts: { label: string; value: string }[] = [];
    for (const key of ["Origin", "Technique", "Material", "Size"]) {
        const value = record ? attr(record, key) : undefined;
        if (value !== undefined && String(value).trim()) {
            facts.push({
                label: key,
                value:
                    key === "Origin"
                        ? formatPlace(value)
                        : key === "Size"
                          ? formatSize(value)
                          : String(value),
            });
        }
    }

    return (
        <article
            className={`cloth relative flex w-full flex-col overflow-hidden bg-card ${
                fill ? "h-full" : "aspect-[3/4] rounded-lg shadow-[var(--ring)]"
            } ${className ?? ""}`}
        >
            {/* the cloth itself — the photograph is the point of the page */}
            <div className="relative h-[34%] shrink-0 overflow-hidden bg-ink">
                {record && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={recordVisual(record)}
                        alt={record.title}
                        className="h-full w-full object-cover"
                        draggable={false}
                    />
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink/92 to-transparent px-4 pt-10 pb-3">
                    <span className="num text-[13px] text-salmon">
                        {record?.code ?? passport.code}
                    </span>
                    <Badge variant={revoked ? "default" : "accent"}>
                        {revoked ? "Revoked" : "Issued"}
                    </Badge>
                </div>
            </div>

            {/* the identity block */}
            <div className="flex min-h-0 flex-1 flex-col px-4 pt-3 pb-3 sm:px-5">
                <div className="eyebrow">
                    {revoked ? "Revoked" : "Certificate"}
                </div>
                <p className="num mt-1 text-[13px] break-all text-ink sm:text-[14px]">
                    {passport.id}
                </p>

                <p className="display mt-1.5 truncate text-[clamp(1.2rem,4.4vw,1.5rem)] leading-tight">
                    {passport.holder}
                </p>
                {passport.outlet && (
                    <p className="truncate text-[13px] text-muted-foreground">
                        {passport.outlet}
                    </p>
                )}

                <dl className="mt-auto pt-2">
                    <Row
                        label="Cloth"
                        value={record ? clothName(record) : passport.code}
                        strong
                    />
                    {facts.map((fact) => (
                        <Row key={fact.label} label={fact.label} value={fact.value} />
                    ))}
                    <Row
                        label="Position"
                        value={`${passport.serial} / ${record?.supply ?? "—"}`}
                    />
                    <Row label={t.claimedIssued} value={issuedOn(passport.issuedAt)} />
                </dl>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2">
                    <Link
                        href={`/verify/${passport.id}`}
                        className="min-h-6 py-1 text-[13px] font-medium text-ink hover:text-bt-red"
                    >
                        Check the certificate →
                    </Link>
                    {record && (
                        <Link
                            href={`/record/${encodeURIComponent(record.code)}`}
                            className="min-h-6 py-1 text-[13px] text-muted-foreground hover:text-ink"
                        >
                            Read the record →
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}

function Row({
    label,
    value,
    strong,
}: {
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div className="flex items-baseline justify-between gap-3 border-t border-border py-1">
            <dt className="label shrink-0">{label}</dt>
            <dd
                className={`num min-w-0 truncate text-right text-[13px] ${
                    strong ? "text-ink" : "text-ink-2"
                }`}
            >
                {value}
            </dd>
        </div>
    );
}