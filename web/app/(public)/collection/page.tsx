import Link from "next/link";
import { passportStore } from "@/lib/store";
import { currentIdentity, heldIds } from "@/lib/session";
import { records } from "@/lib/records";
import { PassportShelf } from "@/components/passport/PassportShelf";
import { Button } from "@/components/ui/button";
import type { Passport } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Traces" };

/**
 * Traces — the certificates you hold.
 *
 * What is listed is the signed held-passport cookie (the ids this browser has
 * proved it holds) plus everything issued to the signed-in account. That
 * distinction is the whole security model: a typed email reads nothing, and
 * knowing somebody's address does not open their certificates.
 *
 * Signed out, this page is a sign-in prompt rather than an empty book —
 * "no certificates yet" would be a lie for someone who has simply not signed
 * in on this device.
 */
export default async function CollectionPage() {
    const [identity, ids] = await Promise.all([currentIdentity(), heldIds()]);
    const store = passportStore();

    /* The held cookie is a device convenience, not a claim of ownership: it
       records "this browser once proved it held this id", which the verify
       page can set from anyone's link. So a held passport only counts when it
       belongs to the signed-in account — otherwise saving a friend's
       certificate to this device would put it in your traces. */
    const held = (
        await Promise.all(ids.map((id) => store.get(id).catch(() => null)))
    ).filter(
        (p): p is Passport =>
            p !== null &&
            (p.email ?? "").trim().toLowerCase() === (identity?.email ?? "\u0000"),
    );

    const byAccount = identity
        ? await store.listByHolder(identity.email).catch(() => [] as Passport[])
        : [];

    const merged = new Map<string, Passport>();
    for (const passport of [...held, ...byAccount]) merged.set(passport.id, passport);
    const issued = [...merged.values()].sort((a, b) =>
        a.issuedAt < b.issuedAt ? 1 : -1,
    );

    if (!identity) {
        return (
            <div className="mx-auto max-w-lg">
                <header className="border-b border-border pb-5">
                    <div className="eyebrow">Traces</div>
                    <h1 className="mt-3">Your certificates</h1>
                </header>
                <div className="mt-6 rounded-lg bg-card p-6 shadow-[var(--ring)]">
                    <p className="text-[16px] text-muted-foreground">
                        Every cloth you claim becomes a page in your book of
                        traces — the photograph, the cloth&apos;s data, and a
                        certificate in your name that anyone can check.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button asChild size="lg">
                            <Link
                                href={`/login?next=${encodeURIComponent("/collection")}`}
                                className="text-white hover:text-white"
                            >
                                Sign in
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link
                                href={`/login?mode=register&next=${encodeURIComponent("/collection")}`}
                                className="text-ink hover:text-ink"
                            >
                                Create an account
                            </Link>
                        </Button>
                    </div>
                </div>
                <Link
                    href="/#records"
                    className="mt-6 inline-block text-[15px] text-muted-foreground hover:text-ink"
                >
                    Browse the cloths first →
                </Link>
            </div>
        );
    }

    const emptyState = (
        <div className="rounded-lg px-6 py-14 text-center shadow-[var(--ring)]">
            <p className="display text-2xl">No certificates yet</p>
            <p className="mx-auto mt-3 max-w-[48ch] text-[15px] text-muted-foreground">
                Claim a cloth and its certificate appears here — one page per
                weave, kept under {identity.email}.
            </p>
            <Button asChild size="lg" className="mt-6">
                <Link href="/#records" className="text-white hover:text-white">
                    Browse the cloths
                </Link>
            </Button>
        </div>
    );

    return (
        <div className="space-y-9">
            <header className="border-b border-border pb-5">
                <div className="eyebrow">Traces</div>
                <h1 className="mt-3">Your certificates</h1>
                <p className="mt-3 max-w-[52ch] text-[15px] text-muted-foreground">
                    {issued.length === 0
                        ? `Kept under ${identity.email}.`
                        : `${issued.length} certificate${
                              issued.length === 1 ? "" : "s"
                          } kept under ${identity.email}. Drag a page, or use the arrows, to turn the book.`}
                </p>
            </header>

            <PassportShelf issued={issued} records={records} emptyState={emptyState} />

            {issued.length > 0 && (
                <p className="max-w-[56ch] text-[14px] text-muted-foreground">
                    Your certificates follow your account: sign in on any device
                    and this book is there.{" "}
                    <Link
                        href="/profile"
                        className="underline underline-offset-2 hover:text-ink"
                    >
                        Manage your account →
                    </Link>
                </p>
            )}
        </div>
    );
}