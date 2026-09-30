/**
 * Vercel Web Analytics, read back into the app.
 *
 * Vercel collects the visits; this reads the same aggregated data the dashboard
 * shows, through the public Web Analytics API (GA since May 2026), so the
 * programme's own page can report "how many people read a cloth this week"
 * without a second analytics provider and without cookies of our own.
 *
 * Setup, in order (see DEPLOY.md):
 *   1. Vercel → Project → Analytics → enable Web Analytics
 *   2. Create an access token: vercel.com/account/tokens
 *   3. Project → Settings → General → copy the Project ID
 *   4. Add env vars: VERCEL_ANALYTICS_TOKEN, VERCEL_PROJECT_ID
 *      (+ VERCEL_TEAM_ID or VERCEL_TEAM_SLUG for a team project)
 *   5. Redeploy
 *
 * Two things to know before trusting a number: the API reports PRODUCTION only,
 * and the range you can ask for is capped by the plan's reporting window.
 */

const API = "https://api.vercel.com/v1/query/web-analytics";

type Aggregate = { pageviews: number; visitors: number };
type DayRow = Aggregate & { timestamp: string };
type RouteRow = Aggregate & { route: string };

function config() {
    return {
        token:
            process.env.VERCEL_ANALYTICS_TOKEN ??
            process.env.VERCEL_ACCESS_TOKEN ??
            process.env.VERCEL_TOKEN ??
            "",
        projectId: process.env.VERCEL_PROJECT_ID ?? "",
        teamId: process.env.VERCEL_TEAM_ID,
        slug: process.env.VERCEL_TEAM_SLUG,
    };
}

export function analyticsConfigured() {
    const { token, projectId } = config();
    return Boolean(token && projectId);
}

/** The env vars that are still missing, for the setup card. */
export function analyticsMissing() {
    const { token, projectId } = config();
    const missing: string[] = [];
    if (!token) missing.push("VERCEL_ANALYTICS_TOKEN");
    if (!projectId) missing.push("VERCEL_PROJECT_ID");
    return missing;
}

const day = (date: Date) => date.toISOString().slice(0, 10);

async function query(
    path: "visits/count" | "visits/aggregate",
    params: Record<string, string>,
) {
    const { token, projectId, teamId, slug } = config();
    if (!token || !projectId) {
        throw new Error(
            `Web analytics is not configured yet: ${analyticsMissing().join(", ")} missing.`,
        );
    }

    const url = new URL(`${API}/${path}`);
    url.searchParams.set("projectId", projectId);
    if (teamId) url.searchParams.set("teamId", teamId);
    else if (slug) url.searchParams.set("slug", slug);
    for (const [key, value] of Object.entries(params)) {
        if (value) url.searchParams.set(key, value);
    }

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    if (!res.ok) {
        /* 403 is the common one: the token is valid but has no access to this
           project, or Web Analytics was never enabled for it. */
        throw new Error(
            `Vercel answered ${res.status}. ${(await res.text()).slice(0, 200)}`,
        );
    }

    return (await res.json()) as { data: unknown };
}

export type DayTraffic = { day: string; pageviews: number; visitors: number };

/** Page views and visitors per day, oldest first, with empty days filled in. */
export async function dailyTraffic(days = 7): Promise<DayTraffic[]> {
    const today = new Date();
    const since = day(new Date(today.getTime() - (days - 1) * 86_400_000));
    const until = day(today);

    const { data } = await query("visits/aggregate", { since, until, by: "day" });
    const rows = (Array.isArray(data) ? data : []) as DayRow[];
    const byDay = new Map(rows.map((row) => [row.timestamp.slice(0, 10), row]));

    return Array.from({ length: days }, (_, i) => {
        const key = day(new Date(today.getTime() - (days - 1 - i) * 86_400_000));
        const row = byDay.get(key);
        return { day: key, pageviews: row?.pageviews ?? 0, visitors: row?.visitors ?? 0 };
    });
}

export async function trafficTotals(days = 7): Promise<Aggregate> {
    const today = new Date();
    const since = day(new Date(today.getTime() - (days - 1) * 86_400_000));
    const until = day(today);

    const { data } = await query("visits/count", { since, until });
    const totals = (data ?? {}) as Aggregate;
    return { pageviews: totals.pageviews ?? 0, visitors: totals.visitors ?? 0 };
}

export async function topRoutes(days = 7, limit = 6): Promise<RouteRow[]> {
    const today = new Date();
    const since = day(new Date(today.getTime() - (days - 1) * 86_400_000));
    const until = day(today);

    const { data } = await query("visits/aggregate", {
        since,
        until,
        by: "route",
        limit: String(limit),
    });
    return (Array.isArray(data) ? data : []) as RouteRow[];
}