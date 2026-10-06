"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Share this cloth.
 *
 * In the exhibition the most natural thing to do with a record is to send it
 * to someone — so the phone's own share sheet when there is one, and a copied
 * link (with a visible "Link copied") when there is not.
 */
export function ShareButton({
    title,
    text,
    className,
}: {
    title: string;
    text?: string;
    className?: string;
}) {
    const [copied, setCopied] = useState(false);

    async function share() {
        const url = window.location.href.split("?")[0];
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return;
            } catch (error) {
                if ((error as Error)?.name === "AbortError") return;
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
        } catch {
            window.prompt("Copy this link", url);
        }
    }

    return (
        <button
            type="button"
            onClick={share}
            className={cn(
                "pressable inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-[14px] text-ink-2 shadow-[var(--ring)] hover:text-ink hover:shadow-[var(--ring-hover)]",
                className,
            )}
        >
            {copied ? (
                <Check aria-hidden className="h-4 w-4 text-success" strokeWidth={1.5} />
            ) : (
                <Share2 aria-hidden className="h-4 w-4" strokeWidth={1.5} />
            )}
            <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
        </button>
    );
}
