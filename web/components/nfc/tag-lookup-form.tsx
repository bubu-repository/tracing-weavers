"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { attr, clothName, findRecord, formatPlace, records, recordSwatch, type ProductRecord } from "@/lib/records";
import { resolveTag } from "@/lib/tags";
import { catalogueNumber } from "@/components/records/RecordCard";

type Preview =
    | { kind: "cloth"; record: ProductRecord }
    | { kind: "several"; count: number }
    | { kind: "none" }
    | null;

/* What the box would open, worked out as you type — the same order the
   server uses in /t/<code>: the tag register first, then the record codes. */
function preview(raw: string): Preview {
    const code = raw.trim();
    if (!code) return null;
    const record = resolveTag(code)?.record ?? findRecord(code);
    if (record) return { kind: "cloth", record };
    const digits = code.replace(/[^0-9]/g, "");
    if (digits && digits === code.replace(/\s/g, "")) {
        const count = records.filter((r) => Number.parseInt(r.code, 10) === Number(digits)).length;
        if (count > 1) return { kind: "several", count };
    }
    return code.length >= 2 ? { kind: "none" } : null;
}

/**
 * Type the code printed on the label beside a cloth ("07/TM", "07tm", or just
 * "7") and go straight to its record. Resolution happens on the server, in
 * /t/<code>, which knows both the tag register and the record codes — so a
 * phone that will not read a tag and a visitor with only the label both land
 * in the same place.
 *
 * As you type, the cloth the code would open steps up under the box — its
 * swatch, number, name and place — so you know before you press Open that
 * you have it right, and a typo shows up as "no cloth" straight away.
 */
export function TagLookupForm({
    className,
    tone = "paper",
    label = "Code on the label",
    id = "label-code",
}: {
    className?: string;
    tone?: "paper" | "ink";
    label?: string;
    /** fixed rather than useId(): one box per page, and a generated id
        drifted between server and client on a cold load */
    id?: string;
}) {
    const [code, setCode] = useState("");
    const found = preview(code);
    const [pending, startTransition] = useTransition();
    const router = useRouter();
    const ink = tone === "ink";

    return (
        <form
            className={cn("min-w-0", className)}
            onSubmit={(e) => {
                e.preventDefault();
                const trimmed = code.trim();
                if (!trimmed) return;
                startTransition(() => router.push(`/t/${encodeURIComponent(trimmed)}`));
            }}
        >
            <label htmlFor={id} className={cn("label block", ink && "text-white/60")}>
                {label}
            </label>
            <div className="mt-2 flex">
                <input
                    id={id}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="07/TM"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    enterKeyHint="go"
                    required
                    className={cn(
                        "h-13 w-0 min-w-0 flex-1 px-4 font-mono text-[18px] tracking-[.06em] uppercase transition-shadow duration-[160ms] placeholder:normal-case focus-visible:outline-none",
                        ink
                            ? "bg-white/8 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.28)] placeholder:text-white/55 focus-visible:shadow-[inset_0_0_0_2px_var(--bt-salmon)]"
                            : "bg-white text-ink shadow-[var(--shadow-field)] placeholder:text-ink-3 focus-visible:shadow-[inset_0_0_0_2px_var(--bt-ink)]",
                    )}
                />
                <button
                    type="submit"
                    disabled={pending}
                    className={cn(
                        "pressable inline-flex h-13 shrink-0 items-center gap-2 px-5 text-[16px] font-medium disabled:opacity-50",
                        ink
                            ? "bg-salmon text-ink hover:bg-white"
                            : "bg-bt-red text-white hover:bg-bt-red-bright",
                    )}
                >
                    {pending ? "Opening…" : "Open"}
                    <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} />
                </button>
            </div>
            <div aria-live="polite" className="min-h-0">
                {found?.kind === "cloth" && (
                    <Link
                        key={found.record.code}
                        href={`/record/${encodeURIComponent(found.record.code)}`}
                        className={cn(
                            "rise mt-2 flex items-center gap-3 p-2 pr-4",
                            ink ? "bg-white/8 text-white hover:bg-white/14 hover:text-white" : "card-stock text-ink hover:text-ink",
                        )}
                        style={{ ["--i" as string]: "0" }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={recordSwatch(found.record)} alt="" className="h-12 w-12 shrink-0 object-cover" />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[16px] leading-tight font-medium">
                                <span className="numeral mr-1.5 text-[20px] text-bt-red">{catalogueNumber(found.record.code)}</span>
                                {clothName(found.record)}
                            </span>
                            <span className={cn("block truncate text-[13px]", ink ? "text-white/65" : "text-ink-3")}>
                                {formatPlace(attr(found.record, "Origin")) || found.record.collection} · this is the cloth
                            </span>
                        </span>
                        <ArrowRight aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    </Link>
                )}
                {found?.kind === "several" && (
                    <p className={cn("rise mt-2 text-[14px]", ink ? "text-white/70" : "text-ink-2")}>
                        {found.count} cloths share that number — add the letters from the label, like{" "}
                        <span className="font-mono">07/TM</span>.
                    </p>
                )}
                {found?.kind === "none" && (
                    <p className={cn("rise mt-2 text-[14px]", ink ? "text-white/70" : "text-ink-2")}>
                        No cloth with that code yet — check the label, or try just its number.
                    </p>
                )}
            </div>
        </form>
    );
}
