"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * "Save to my traces" on a verification page.
 *
 * This is how a passport reaches a second device: the holder already has the
 * link (it is printed on the sheet and in the QR), so opening it and saving it
 * is proof enough for THIS id — which lib/session.ts then remembers in a signed
 * cookie. Nothing about anybody else's passports is involved.
 */
export function HoldButton({ id, token }: { id: string; token?: string }) {
    const [state, setState] = useState<"idle" | "busy" | "saved" | "error">("idle");
    const [message, setMessage] = useState<string | null>(null);

    async function save() {
        setState("busy");
        setMessage(null);
        try {
            const res = await fetch("/api/hold", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, token }),
            });
            const raw = await res.text();
            let body: { error?: string } = {};
            try {
                body = JSON.parse(raw) as typeof body;
            } catch {
                body = {};
            }

            if (!res.ok) {
                setState("error");
                setMessage(body.error ?? `Could not save (HTTP ${res.status}).`);
                return;
            }
            setState("saved");
        } catch {
            setState("error");
            setMessage("The request did not reach the server. Try again.");
        }
    }

    if (state === "saved") {
        return (
            <p className="mt-4 text-[15px] text-success" role="status">
                Saved. It now appears in your traces on this device.
            </p>
        );
    }

    return (
        <div className="mt-4">
            <Button variant="outline" onClick={save} disabled={state === "busy"}>
                {state === "busy" ? "Saving…" : "Save to my traces"}
            </Button>
            {message && (
                <p role="alert" className="mt-2 text-[15px] text-bt-red">
                    {message}
                </p>
            )}
        </div>
    );
}