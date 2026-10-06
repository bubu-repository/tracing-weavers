"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { forgetLocalPassports } from "@/lib/local-passports";
import { cn } from "@/lib/utils";

/**
 * Sign out — and mean it.
 *
 * Both cookies and the local copy of the holder's certificates go, so a shared
 * phone keeps nothing of the last person. If the request fails the button says
 * so instead of pretending: the session cookie is httpOnly, so only the server
 * can clear it.
 */
export function SignOutButton({
    className,
    variant = "ghost",
    tone = "paper",
}: {
    className?: string;
    variant?: "ghost" | "outline";
    /** "ink" for the header: an icon-and-word on the dark bar */
    tone?: "paper" | "ink";
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);

    async function signOut() {
        setBusy(true);
        setFailed(false);
        try {
            const res = await fetch("/api/auth", { method: "DELETE" });
            if (!res.ok) throw new Error(String(res.status));
        } catch {
            setBusy(false);
            setFailed(true);
            return;
        }
        forgetLocalPassports();
        router.push("/");
        router.refresh();
    }

    return (
        <Button
            variant={variant}
            size="sm"
            className={cn(
                "gap-2",
                variant === "ghost" && tone === "paper" && "text-ink-2",
                tone === "ink" && "text-white/60 hover:bg-white/10 hover:text-white",
                className,
            )}
            onClick={signOut}
            disabled={busy}
            title={failed ? "Could not sign out — try again" : undefined}
        >
            <LogOut aria-hidden className="h-4 w-4" strokeWidth={1.5} />
            {busy ? "Signing out…" : failed ? "Try again" : "Sign out"}
        </Button>
    );
}
