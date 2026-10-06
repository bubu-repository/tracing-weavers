import Link from "next/link";
import { passportStore } from "@/lib/store";
import { t } from "@/lib/copy";
import type { Passport } from "@/lib/types";

export const dynamic = "force-dynamic";

/* Holder names and emails are on this page: keep it out of search results. */
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const issuedOn = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    });

/**
 * Admin: every passport ever issued, newest first.  No auth gate — the
 * data is the same data anyone can verify one-by-one; this is the table
 * view of it.  A gate can be bolted on later without touching the query.
 */
export default async function AdminPage() {
    const store = passportStore();
    const all: Passport[] = await store.all().catch(() => []) ?? [];

    return (
        <div className="mx-auto max-w-5xl">
            <header className="border-b border-border pb-5">
                <div className="eyebrow">Admin</div>
                <h1 className="mt-3">Issued passports</h1>
                <p className="mt-2 text-[15px] text-muted-foreground">
                    {all.length} passport{all.length === 1 ? "" : "s"} issued
                    across {new Set(all.map((p) => p.code)).size} record
                    {new Set(all.map((p) => p.code)).size === 1 ? "" : "s"}.
                </p>
            </header>

            {all.length === 0 ? (
                <div className="mt-12 rounded-lg px-6 py-14 text-center shadow-[var(--ring)]">
                    <p className="display text-2xl">No passports issued yet</p>
                    <p className="mx-auto mt-3 max-w-[46ch] text-[17px] text-muted-foreground">
                        Passports appear here as soon as the first cloth is
                        claimed.
                    </p>
                </div>
            ) : (
                <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead>
                            <tr className="border-b border-border text-[11px] uppercase tracking-[.16em] text-muted-foreground">
                                <th className="py-2 pr-4 font-medium">Passport ID</th>
                                <th className="py-2 pr-4 font-medium">Record</th>
                                <th className="py-2 pr-4 font-medium">Holder</th>
                                <th className="py-2 pr-4 font-medium">Email</th>
                                <th className="py-2 pr-4 font-medium">Outlet</th>
                                <th className="py-2 pr-4 font-medium">Issued</th>
                                <th className="py-2 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {all.map((passport) => (
                                <tr
                                    key={passport.id}
                                    className="border-b border-border/60 hover:bg-card/60"
                                >
                                    <td className="data py-2.5 pr-4 text-[12px] whitespace-nowrap">
                                        <Link
                                            href={`/verify/${encodeURIComponent(passport.id)}`}
                                            className="text-ink hover:text-bt-red"
                                        >
                                            {passport.id}
                                        </Link>
                                    </td>
                                    <td className="py-2.5 pr-4 whitespace-nowrap">
                                        <Link
                                            href={`/record/${encodeURIComponent(passport.code)}`}
                                            className="text-ink hover:text-bt-red"
                                        >
                                            {passport.code}
                                        </Link>
                                    </td>
                                    <td className="py-2.5 pr-4 font-medium">
                                        {passport.holder}
                                    </td>
                                    <td className="py-2.5 pr-4 text-muted-foreground">
                                        {passport.email ?? "—"}
                                    </td>
                                    <td className="py-2.5 pr-4 text-muted-foreground">
                                        {passport.outlet ?? "—"}
                                    </td>
                                    <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                                        {issuedOn(passport.issuedAt)}
                                    </td>
                                    <td className="py-2.5">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[.1em] ${
                                                passport.status === "revoked"
                                                    ? "bg-bt-red/10 text-bt-red"
                                                    : "bg-success/10 text-success"
                                            }`}
                                        >
                                            {passport.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
}