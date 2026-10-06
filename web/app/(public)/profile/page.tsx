import Link from "next/link";
import { currentIdentity, heldIds } from "@/lib/session";
import { passportStore } from "@/lib/store";
import { accountStore, formatMemberNo, highestMemberNo } from "@/lib/accounts";
import { ProfileForms } from "@/components/profile-forms";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";
import { ThreadRule, WarpField } from "@/components/motif/marks";
import type { Passport } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Profile" };

const longDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
    });

/**
 * The member's card, and the three things they can change about it.
 *
 * Membership is the frame the whole thing sits in: a certificate is issued to
 * a member, kept under a member's address, and checkable by a member's number.
 * So the page leads with the card — number, name, email, since when — and only
 * then offers the editing. Before this it was a bare pair of forms with no
 * sign that there was an account at all.
 */
export default async function ProfilePage() {
    const identity = await currentIdentity();

    if (!identity) {
        return (
            <div className="mx-auto max-w-lg">
                <header className="border-b border-border pb-5">
                    <div className="eyebrow">Profile</div>
                    <h1 className="mt-3">Not signed in</h1>
                </header>
                <div className="mt-6 rounded-lg bg-card p-6 shadow-[var(--ring)]">
                    <p className="text-[15px] text-muted-foreground">
                        Sign in to see your member card and manage the account
                        your certificates are kept under.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Button asChild size="lg">
                            <Link
                                href={`/login?next=${encodeURIComponent("/profile")}`}
                                className="text-white hover:text-white"
                            >
                                Sign in
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link
                                href={`/login?mode=register&next=${encodeURIComponent("/profile")}`}
                                className="text-ink hover:text-ink"
                            >
                                Create an account
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const store = accountStore();
    let account = await store.get(identity.email).catch(() => null);

    /* Accounts made before member numbers existed repair themselves the first
       time their owner opens this page, instead of showing a blank. */
    if (account && !account.memberNo) {
        account = {
            ...account,
            memberNo: formatMemberNo(highestMemberNo([account]) + 1),
        };
        await store.save(account).catch(() => {});
    }

    const memberNo = account?.memberNo ?? "—";
    const since = account?.createdAt ? longDate(account.createdAt) : null;

    /* The same two sources the Traces page reads — held on this device, and
       issued to this account — so the count here matches the book there. It
       used to count only this device's cookie, and read 0 on a new phone. */
    const ids = await heldIds();
    const passports = passportStore();
    const [held, byAccount] = await Promise.all([
        Promise.all(ids.map((id) => passports.get(id).catch(() => null))),
        passports.listByHolder(identity.email).catch(() => [] as Passport[]),
    ]);
    const owned = new Set(
        [...held, ...byAccount]
            .filter(
                (p): p is Passport =>
                    p !== null &&
                    (p.email ?? "").trim().toLowerCase() === identity.email,
            )
            .map((p) => p.id),
    );

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <header className="border-b border-border pb-5">
                <div className="eyebrow">Profile</div>
                <h1 className="mt-3">Your membership</h1>
                <p className="mt-2 max-w-[52ch] text-[15px] text-muted-foreground">
                    A certificate is issued to a member and kept under this
                    account. Everything below is what identifies you.
                </p>
            </header>

            {/* ── the member card ── */}
            <section
                className="ink-band cloth relative overflow-hidden rounded-xl"
                data-theme="dark"
            >
                <WarpField className="pointer-events-none absolute inset-0 h-full w-full text-white/10" />

                <div className="relative flex flex-col gap-7 p-6 sm:flex-row sm:items-stretch sm:justify-between sm:p-8">
                    <div className="min-w-0">
                        <div className="eyebrow">{brand}</div>
                        <p className="display mt-3 text-[clamp(1.6rem,5vw,2.2rem)] leading-tight text-white">
                            {identity.name}
                        </p>
                        <p className="mt-1.5 truncate text-[15px] text-white/70">
                            {identity.email}
                        </p>
                        {identity.outlet && (
                            <p className="mt-0.5 truncate text-[14px] text-white/50">
                                {identity.outlet}
                            </p>
                        )}

                        {since && (
                            <p className="mt-4 text-[12px] tracking-[.14em] uppercase text-white/45">
                                Member since {since}
                            </p>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-col justify-between gap-5 border-t border-white/18 pt-5 sm:items-end sm:border-t-0 sm:border-l sm:border-white/18 sm:pt-0 sm:pl-8 sm:text-right">
                        <div>
                            <div className="text-[11px] tracking-[.2em] uppercase text-salmon">
                                Member no.
                            </div>
                            <p className="num mt-2 text-[clamp(1.6rem,5vw,2rem)] leading-none text-white">
                                {memberNo}
                            </p>
                        </div>

                        <div>
                            <div className="text-[11px] tracking-[.2em] uppercase text-white/45">
                                Certificates
                            </div>
                            <p className="num mt-1.5 text-[19px] leading-none text-white">
                                {owned.size}
                            </p>
                            <Link
                                href="/collection"
                                className="mt-2 inline-block text-[13px] text-salmon underline decoration-salmon/40 underline-offset-2 hover:text-white"
                            >
                                See them →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── what can be changed ── */}
            <section>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="eyebrow">Account details</h2>
                    <p className="text-[13px] text-muted-foreground">
                        Each change asks for your password
                    </p>
                </div>

                <ProfileForms name={identity.name} email={identity.email} />

                <p className="mt-3 text-[13px] text-muted-foreground">
                    Your member number {memberNo} never changes — it is the one
                    thing on this page you cannot edit.
                </p>
            </section>

            <section className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                <p className="max-w-[44ch] text-[14px] text-muted-foreground">
                    Signing out clears this device: the session and the local copy
                    of your certificates. They stay safe under your account.
                </p>
                <SignOutButton variant="outline" />
            </section>

            <ThreadRule className="h-2 w-full text-stone" aria-hidden />
        </div>
    );
}