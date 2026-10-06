import Link from "next/link";
import { passportStore } from "@/lib/store";
import { currentIdentity, heldIds } from "@/lib/session";
import { records } from "@/lib/records";
import { PassportShelf } from "@/components/passport/PassportShelf";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import type { Passport } from "@/lib/types";

/* the cloths bound into the sample book */
const SPECIMEN_CODES = ["07/TM", "14/GW", "05/GW"];

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
        /* a book to turn before there is one of your own: real cloths, a
           placeholder name, SPECIMEN where the ids would be */
        const sample: Passport[] = SPECIMEN_CODES.map((code, i) => ({
            id: `SPECIMEN-${i + 1}`,
            code,
            holder: "Your name here",
            issuedAt: "2026-09-24T09:00:00.000Z",
            serial: 1,
            status: "issued" as const,
        })).filter((p) => records.some((r) => r.code === p.code));
        return (
            <>
                <PageHeader
                    eyebrow="Traces"
                    title="Your book of traces."
                    lead="Every cloth you claim becomes a page in it — the photograph, the cloth's data, and a certificate in your name that anyone can check. Here is a sample: drag a page to turn it."
                />
                <div className="mt-10">
                    <PassportShelf issued={sample} records={records} specimen />
                </div>
                <div className="container-x mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
                    <div className="flex flex-wrap gap-3">
                        <Button asChild size="lg">
                            <Link href={`/login?next=${encodeURIComponent("/collection")}`}>Sign in</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link href={`/login?mode=register&next=${encodeURIComponent("/collection")}`}>
                                Create an account
                            </Link>
                        </Button>
                    </div>
                    <Link
                        href="/#collection"
                        className="text-[16px] text-ink-2 hover:text-bt-red lg:justify-self-end"
                    >
                        Or browse the cloths first →
                    </Link>
                </div>
            </>
        );
    }

    const emptyState = (
        <div className="container-x mt-10">
            <div className="px-6 py-16 text-center shadow-[inset_0_0_0_1px_var(--bt-stone-2)]">
                <p className="display text-[30px]">Your book is empty — for now.</p>
                <p className="mx-auto mt-3 max-w-[48ch] text-[16px] text-muted-foreground">
                    Claim a cloth and its certificate is bound in here — one page per
                    weave, kept under {identity.email}.
                </p>
                <Button asChild size="lg" className="mt-7">
                    <Link href="/#collection">Choose a cloth</Link>
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <PageHeader
                eyebrow="Traces"
                title="Your book of traces."
                lead={
                    issued.length === 0
                        ? `Kept under ${identity.email}.`
                        : `${issued.length} certificate${
                              issued.length === 1 ? "" : "s"
                          } kept under ${identity.email}. Drag a page, or use the arrows, to turn it.`
                }
                rule={issued.length === 0}
            />

            <PassportShelf issued={issued} records={records} emptyState={emptyState} />

            {issued.length > 0 && (
                <p className="container-x mt-8 max-w-[56ch] text-[15px] text-muted-foreground">
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
        </>
    );
}
