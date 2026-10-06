"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Type the code printed on the label beside a cloth ("07/TM", "07tm", or just
 * "7") and go straight to its record. Resolution happens on the server, in
 * /t/<code>, which knows both the tag register and the record codes — so a
 * phone that will not read a tag and a visitor with only the label both land
 * in the same place.
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
                            ? "bg-white/8 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.28)] placeholder:text-white/35 focus-visible:shadow-[inset_0_0_0_2px_var(--bt-salmon)]"
                            : "bg-white text-ink shadow-[inset_0_0_0_1px_var(--bt-stone)] placeholder:text-ink-3 focus-visible:shadow-[inset_0_0_0_2px_var(--bt-ink)]",
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
        </form>
    );
}
