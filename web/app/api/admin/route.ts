import { NextResponse } from "next/server";
import {
    adminConfigured,
    adminKeyMatches,
    clearAdminSession,
    setAdminSession,
} from "@/lib/session";
import { allowRequest, tooMany } from "@/lib/request-guard";

/**
 * Unlock the programme team's own view, once.
 *
 * Opening this with ?key=<PASSPORT_ADMIN_TOKEN> sets a signed cookie and sends
 * you to /insights, so the key can stay out of bookmarks and history after the
 * first visit. It is not an account system — it is a door that only the team has
 * the key to, and it is rate limited like every other write path.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const url = new URL(request.url);
        const key = url.searchParams.get("key") ?? undefined;

    if (url.searchParams.get("signout") === "1") {
        await clearAdminSession();
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (!allowRequest(request, { limit: 10, windowMs: 60_000, scope: "admin" })) {
        return tooMany();
    }

    if (!adminConfigured() || !adminKeyMatches(key)) {
        return NextResponse.json(
            {
                error: adminConfigured()
                    ? "That key does not open this page."
                    : "PASSPORT_ADMIN_TOKEN is not set on this deployment, so there is nothing to unlock yet.",
            },
            { status: 401, headers: { "Cache-Control": "no-store" } },
        );
    }

    await setAdminSession();
    return NextResponse.redirect(new URL("/insights", request.url), {
        headers: { "Cache-Control": "no-store" },
    });
}

export async function DELETE() {
    await clearAdminSession();
    return NextResponse.json(
        { admin: null },
        { headers: { "Cache-Control": "no-store" } },
    );
}