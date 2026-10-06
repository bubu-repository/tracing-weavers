"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThreadRule } from "@/components/motif/marks";

/**
 * The boundary that was missing.
 *
 * Before this, a misconfigured store or an unreadable request turned into a
 * blank 500 with no header, no footer and nothing to act on. Now a holder gets
 * the paper treatment and one instruction that actually helps.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[error boundary]", error);
    }, [error]);

    return (
        <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-4">
            <div className="eyebrow">Something came loose</div>
            <h1 className="mt-4">This page cannot be opened right now.</h1>
            <p className="read mt-4 max-w-[48ch] text-[17px] text-muted-foreground">
                Try again. If it keeps failing, the passport store or the signing key on this deployment is not ready.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button onClick={reset} size="lg">
                    Try again
                </Button>
                <Link
                    href="/"
                    className="text-[15px] text-muted-foreground underline decoration-border underline-offset-4 hover:text-ink"
                >
                    Back to the records
                </Link>
            </div>

            <ThreadRule className="mt-10 h-2 w-full text-stone" aria-hidden />

            <p className="mt-4 text-[13px] text-muted-foreground">
                To diagnose: open{" "}
                <code className="data text-ink">/api/health</code> — it shows whether passports can be issued.
            </p>
        </div>
    );
}