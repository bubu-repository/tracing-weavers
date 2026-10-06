import Link from "next/link";
import { adminConfigured, adminKeyMatches, isAdminSession } from "@/lib/session";
import {
    analyticsConfigured,
    analyticsMissing,
    dailyTraffic,
    topRoutes,
    trafficTotals,
    type DayTraffic,
} from "@/lib/web-analytics";
import { ThreadRule, WarpField } from "@/components/motif/marks";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Insights",
    robots: { index: false, follow: false },
};

/**
 * How many people read the cloth.
 *
 * The numbers come from Vercel's own Web Analytics through its public API, so
 * this page adds no second tracker and sets no cookie of its own. It is for the
 * programme team, gated behind PASSPORT_ADMIN_TOKEN, and it says plainly what
 * the numbers do and do not cover rather than presenting a bare total.
 */
export default async function InsightsPage({
    searchParams,
}: {
    searchParams: Promise<{ key?: string }>;
}) {
    const { key } = await searchParams;
    const unlocked = adminKeyMatches(key) || (await isAdminSession());

    if (!unlocked) return <Locked />;

    if (!analyticsConfigured()) return <Setup />;

    const [days, totals, routes] = await Promise.all([
        dailyTraffic(7).then((value) => ({ ok: true as const, value })).catch((error: Error) => ({ ok: false as const, error })),
        trafficTotals(7).then((value) => ({ ok: true as const, value })).catch((error: Error) => ({ ok: false as const, error })),
        topRoutes(7, 6).then((value) => ({ ok: true as const, value })).catch((error: Error) => ({ ok: false as const, error })),
    ]);

    if (!days.ok) return <Failed message={days.error.message} />;

    const peak = Math.max(...days.value.map((entry) => entry.visitors), 1);

    return (
        <div className="container-x max-w-4xl space-y-10 py-10 sm:py-14">
            <header>
                <div className="eyebrow">Insights · Vercel Web Analytics</div>
                <h1 className="mt-3">How many people read the cloth.</h1>
                <p className="read mt-3 max-w-[52ch] text-[17px] text-muted-foreground">
                    {totals.ok
                        ? `${totals.value.visitors.toLocaleString("en-GB")} visitors and ${totals.value.pageviews.toLocaleString("en-GB")} page views in the last seven days.`
                        : "Seven days of traffic."}
                </p>
            </header>

            {/* the week, as a row of bars — visitors above, page views under */}
            <section>
                <div className="flex items-end justify-between gap-2 sm:gap-3">
                    {days.value.map((entry: DayTraffic) => {
                        const height = Math.round((entry.visitors / peak) * 132);
                        return (
                            <div key={entry.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                                <span className="num text-[13px] text-ink">{entry.visitors}</span>
                                <div className="flex h-[132px] w-full items-end">
                                    <div
                                        className="w-full rounded-sm bg-bt-red/85"
                                        style={{ height: `${Math.max(height, entry.visitors ? 6 : 0)}px` }}
                                    />
                                </div>
                                <span className="data text-[11px] whitespace-nowrap text-muted-foreground">
                                    {new Date(`${entry.day}T00:00:00Z`).toLocaleDateString("en-GB", {
                                        weekday: "short",
                                        day: "numeric",
                                        timeZone: "Asia/Jakarta",
                                    })}
                                </span>
                                <span className="data text-[11px] text-muted-foreground/70">
                                    {entry.pageviews}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <p className="mt-3 text-[13px] text-muted-foreground">
                    Bars are visitors per day; the small number under each date is page
                    views.
                </p>
            </section>

            {routes.ok && routes.value.length > 0 && (
                <section>
                    <h2 className="eyebrow">Most-read routes</h2>
                    <dl className="mt-4">
                        {routes.value.map((row) => (
                            <div
                                key={row.route}
                                className="flex items-baseline justify-between gap-6 border-t border-border py-2.5"
                            >
                                <dt className="data truncate text-[14px] text-ink">{row.route}</dt>
                                <dd className="num shrink-0 text-right text-[14px]">
                                    {row.visitors} / {row.pageviews}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
            )}

            <section className="rounded-lg bg-card p-6 shadow-[var(--ring)]">
                <h2 className="eyebrow">What these numbers are</h2>
                <p className="mt-3 max-w-[62ch] text-[15px] text-muted-foreground">
                    Counted by Vercel from the analytics script in the page, so they cover
                    production visits only and someone with JavaScript off is not counted.
                    Nobody is identified: there are no cookies from us and no holder data
                    here. The dashboard can group by country, referrer and device; the same
                    API returns those if you ever want them on this page.
                </p>
                <Link
                    href="/api/admin?signout=1"
                    className="mt-4 inline-block min-h-6 py-1 text-[14px] text-muted-foreground hover:text-ink"
                >
                    Sign out of insights →
                </Link>
            </section>

            <ThreadRule className="h-2 w-full text-stone" aria-hidden />
        </div>
    );
}

function Page({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
    return (
        <div className="container-x max-w-3xl py-10 sm:py-14">
            <div className="eyebrow">{eyebrow}</div>
            <h1 className="mt-4">{title}</h1>
            <div className="read mt-4 space-y-4 text-[17px] text-muted-foreground">{children}</div>
        </div>
    );
}

function Locked() {
    return (
        <Page eyebrow="Insights" title="This page is for the programme team.">
            <p>
                Open it once with your admin key and it will remember this browser:
            </p>
            <p className="data rounded-md bg-card p-4 text-[14px] text-ink shadow-[var(--ring)]">
                /api/admin?key=YOUR_PASSPORT_ADMIN_TOKEN
            </p>
            {!adminConfigured() && (
                <p>
                    Nothing can unlock it yet: <span className="data text-ink">PASSPORT_ADMIN_TOKEN</span>{" "}
                    is not set on this deployment. Add it in Vercel, then redeploy.
                </p>
            )}
        </Page>
    );
}

function Setup() {
    return (
        <Page
            eyebrow="Insights · setup"
            title="Two variables and this page fills itself."
        >
            <p>
                Vercel already collects the visits once Web Analytics is switched on for
                the project. This page reads them back through the public Web Analytics
                API, so it needs the missing piece(s):{" "}
                <span className="data text-ink">{analyticsMissing().join(", ")}</span>.
            </p>
            <ol className="space-y-2 text-[16px]">
                <li>1. Vercel → Project → Analytics → enable Web Analytics.</li>
                <li>2. vercel.com/account/tokens → create a token.</li>
                <li>3. Project → Settings → General → copy the Project ID.</li>
                <li>
                    4. Add <span className="data text-ink">VERCEL_ANALYTICS_TOKEN</span> and{" "}
                    <span className="data text-ink">VERCEL_PROJECT_ID</span> to the project&apos;s
                    environment variables (plus <span className="data text-ink">VERCEL_TEAM_ID</span>{" "}
                    for a team project).
                </li>
                <li>5. Redeploy, then reload this page.</li>
            </ol>
            <div className="ink-band cloth relative mt-6 overflow-hidden rounded-lg p-6" data-theme="dark">
                <WarpField className="pointer-events-none absolute inset-0 h-full w-full text-white/10" />
                <p className="relative text-[14px] text-white/75">
                    Until then, the Vercel dashboard shows the same numbers: Analytics →
                    Visitors, and set the range to the last 7 days.
                </p>
            </div>
        </Page>
    );
}

function Failed({ message }: { message: string }) {
    return (
        <Page eyebrow="Insights" title="Vercel would not answer.">
            <p>
                The variables are set, but the API refused the query. The usual causes are a
                token without access to this project, Web Analytics not enabled, or a
                project still running on a plan whose reporting window does not cover the
                range.
            </p>
            <p className="data rounded-md bg-card p-4 text-[13px] text-ink shadow-[var(--ring)]">
                {message}
            </p>
        </Page>
    );
}