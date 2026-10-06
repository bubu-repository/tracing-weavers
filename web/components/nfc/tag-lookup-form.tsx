"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
}: {
    className?: string;
    tone?: "paper" | "ink";
}) {
    const [code, setCode] = useState("");
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    return (
        <form
            className={className}
            onSubmit={(e) => {
                e.preventDefault();
                const trimmed = code.trim();
                if (!trimmed) return;
                startTransition(() => router.push(`/t/${encodeURIComponent(trimmed)}`));
            }}
        >
            <label
                htmlFor="label-code"
                className={cn("label", tone === "ink" && "text-white/60")}
            >
                Code on the label
            </label>
            <div className="mt-1.5 flex gap-2">
                <input
                    id="label-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="07/TM"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    enterKeyHint="go"
                    required
                    className="h-12 min-w-0 flex-1 rounded-md bg-white px-3.5 font-mono text-[16px] tracking-[.04em] text-ink uppercase shadow-[var(--ring)] transition-shadow duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] placeholder:text-ink-3 placeholder:normal-case focus-visible:shadow-[0_0_0_2px_var(--bt-red)]"
                />
                <Button
                    type="submit"
                    size="lg"
                    variant={tone === "ink" ? "inverse" : "primary"}
                    className="h-12 shrink-0"
                    disabled={pending}
                >
                    {pending ? "Opening…" : "Open"}
                </Button>
            </div>
        </form>
    );
}
