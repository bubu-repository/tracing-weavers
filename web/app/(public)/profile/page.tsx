import Link from "next/link";
import { currentIdentity, heldIds } from "@/lib/session";
import { passportStore } from "@/lib/store";
import { accountStore, formatMemberNo, highestMemberNo } from "@/lib/accounts";
import { ProfileForms } from "@/components/profile-forms";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";
import { WarpField } from "@/components/motif/marks";
import { BrandMark } from "@/components/motif/brand-mark";
import { PageHeader } from "@/components/page-header";
import { getRecord, paletteFor } from "@/lib/records";
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
            <>
                <PageHeader
                    eyebrow="Profile"
                    title="Your membership."
                    lead="Sign in to see your member card and manage the account your certificates are kept under."
                />
                <div className="container-x mt-10 flex flex-wrap gap-3">
                    <Button asChild size="lg">
                        <Link href={`/login?next=${encodeURIComponent("/profile")}`}>Sign in</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <Link href={`/login?mode=register&next=${encodeURIComponent("/profile")}`}>
                            Create an account
                        </Link>
                    </Button>
                </div>
            </>
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
    const ownedById = new Map<string, Passport>();
    for (const p of [...held, ...byAccount]) {
        if (p && (p.email ?? "").trim().toLowerCase() === identity.email) ownedById.set(p.id, p);
    }
    const owned = [...ownedById.values()].sort((a, b) => (a.issuedAt < b.issuedAt ? -1 : 1));

    /* The card's edge gains a band for every cloth claimed, in that cloth's
       main colour; a new member's card wears the four dye pots. */
    const bands = owned
        .map((p) => {
            const record = getRecord(p.code);
            return record ? paletteFor(record)?.colors[0]?.hex : undefined;
        })
        .filter((hex): hex is string => Boolean(hex));

    return (
        <>
            <PageHeader
                eyebrow="Profile"
                title="Your membership."
                lead="A certificate is issued to a member and kept under this account. Everything here is what identifies you."
            />

            <div className="container-x mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
                {/* ── the member card, as a card ── */}
                <section aria-label="Member card" className="lg:sticky lg:top-28 lg:self-start">
                    <div
                        className="ink-band cloth relative mx-auto flex aspect-[1.586] w-full max-w-[30rem] flex-col justify-between overflow-hidden p-5 shadow-[0_30px_60px_-30px_rgba(32,30,29,.7)] sm:p-7"
                        data-theme="dark"
                    >
                        <WarpField className="pointer-events-none absolute inset-0 h-full w-full text-white/7" />
                        <div className="relative flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                                <BrandMark className="h-6 w-6" />
                                <span className="display text-[16px] text-white">{brand}</span>
                            </div>
                            <span className="text-[11px] tracking-[.18em] text-white/65 uppercase">Member</span>
                        </div>

                        <div className="relative">
                            <p className="data text-[clamp(1.3rem,5vw,1.9rem)] tracking-[.12em] text-salmon">
                                {memberNo}
                            </p>
                            <p className="display mt-2 truncate text-[clamp(1.4rem,5vw,2rem)] leading-tight text-white">
                                {identity.name}
                            </p>
                            <div className="mt-1 flex items-center justify-between gap-4 text-[12px] tracking-[.12em] text-white/50 uppercase">
                                <span className="truncate">{identity.outlet ?? identity.email}</span>
                                {since && <span className="shrink-0">Since {since}</span>}
                            </div>
                        </div>

                        <div aria-hidden className="absolute inset-x-0 bottom-0 flex h-2">
                            {bands.length ? (
                                bands.map((hex, i) => <span key={i} className="flex-1" style={{ background: hex }} />)
                            ) : (
                                <span className="selvedge-dye h-full w-full" />
                            )}
                        </div>
                    </div>

                    <dl className="mx-auto mt-6 grid max-w-[30rem] grid-cols-2 border-t border-ink">
                        <div className="border-b border-border py-4 pr-4">
                            <dt className="label">Certificates</dt>
                            <dd className="numeral mt-1 text-[44px]">{owned.length}</dd>
                        </div>
                        <div className="border-b border-l border-border py-4 pl-4">
                            <dt className="label">Member since</dt>
                            <dd className="mt-2 text-[18px] text-ink">{since ?? "—"}</dd>
                        </div>
                    </dl>
                    <p className="mx-auto mt-3 max-w-[30rem] text-[14px] text-muted-foreground">
                        The card&apos;s edge takes a band of colour from every cloth you
                        claim.{" "}
                        <Link href="/collection" className="text-ink underline underline-offset-2 hover:text-bt-red">
                            Open your book →
                        </Link>
                    </p>
                </section>

                {/* ── what can be changed ── */}
                <div className="space-y-10">
                    <section>
                        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                            <h2 className="eyebrow">Account details</h2>
                            <p className="text-[13px] text-muted-foreground">Each change asks for your password</p>
                        </div>
                        <ProfileForms name={identity.name} email={identity.email} />
                        <p className="mt-3 text-[13px] text-muted-foreground">
                            Your member number {memberNo} never changes — it is the one
                            thing here you cannot edit.
                        </p>
                    </section>

                    <section className="flex flex-wrap items-center justify-between gap-4 border-t border-ink pt-6">
                        <p className="max-w-[40ch] text-[14px] text-muted-foreground">
                            Signing out clears this device: the session and the local copy
                            of your certificates. They stay safe under your account.
                        </p>
                        <SignOutButton variant="outline" />
                    </section>
                </div>
            </div>
        </>
    );
}
