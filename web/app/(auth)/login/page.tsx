import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/login-form";
import { brand } from "@/lib/brand";
import { currentIdentity } from "@/lib/session";
import { getRecord, records, recordSwatch, clothName } from "@/lib/records";
import { BrandMark } from "@/components/motif/brand-mark";
import { ClothMarquee } from "@/components/home/cloth-marquee";
import { PartnerNodes } from "@/components/motif/marks";

export const metadata = { title: "Sign in" };

export default async function Login({
    searchParams,
}: {
    searchParams: Promise<{ next?: string; mode?: string }>;
}) {
    const { next, mode } = await searchParams;
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

    /* Already signed in: there is nothing to do here, so go where they meant to. */
    if (await currentIdentity()) redirect(safeNext ?? "/collection");

    /* Arriving from a cloth's claim button: show that cloth, so the visitor
       knows what they are signing in for. */
    const claimingCode = safeNext?.startsWith("/record/")
        ? decodeURIComponent(safeNext.slice("/record/".length).split(/[?#]/)[0])
        : undefined;
    const claiming = claimingCode ? getRecord(claimingCode) : undefined;

    return (
        <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* the wall of cloth */}
            <div className="relative hidden overflow-hidden bg-ink lg:block" data-theme="dark">
                <div className="absolute inset-0 grid grid-cols-4 gap-1.5 p-1.5 opacity-80">
                    {records.slice(0, 24).map((record) => (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            key={record.code}
                            src={recordSwatch(record)}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/20" />
                <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
                    <Link href="/" className="flex w-fit items-center gap-2.5 text-white hover:text-white">
                        <BrandMark className="h-7 w-7" />
                        <span className="display text-[20px]">{brand}</span>
                    </Link>

                    <div className="max-w-lg">
                        <p className="display text-[clamp(2.4rem,4vw,3.6rem)] leading-[.95] text-white">
                            A certificate needs a name to belong to.
                        </p>
                        <p className="mt-5 text-[18px] leading-relaxed text-white/75">
                            Reading a record is open to anyone. Claiming it is not — a
                            certificate saying “issued to you” has to be issued to
                            someone who can be proved.
                        </p>
                        <div className="mt-10 flex items-center gap-4">
                            <PartnerNodes className="h-6 w-28 text-salmon" aria-hidden />
                            <span className="text-[12px] tracking-[.14em] text-white/55 uppercase">
                                ICM × TBN × Torajamelo
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex min-w-0 flex-col">
                {/* on a phone the wall is a strip, and the way home is here */}
                <div className="bg-ink text-white lg:hidden" data-theme="dark">
                    <div className="flex h-14 items-center justify-between px-4">
                        <Link href="/" className="flex items-center gap-2.5 text-white hover:text-white">
                            <BrandMark className="h-6 w-6" />
                            <span className="display text-[18px]">{brand}</span>
                        </Link>
                        <Link href={safeNext ?? "/"} className="text-[14px] text-white/65 hover:text-white">
                            Cancel
                        </Link>
                    </div>
                    <div className="selvedge-dye" aria-hidden />
                    <ClothMarquee records={records} duration={90} className="py-2" tileClassName="h-16 w-14" />
                </div>

                <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-12 lg:py-14">
                    <div className="mx-auto w-full max-w-md">
                        <div className="eyebrow">Account</div>
                        <h1 className="mt-3 text-[clamp(2.4rem,7vw,3.75rem)]">
                            {claiming ? "One step to claim it." : "Welcome."}
                        </h1>

                        {claiming ? (
                            <div className="mt-5 flex items-center gap-4 border-y border-border py-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={recordSwatch(claiming)}
                                    alt=""
                                    className="h-16 w-16 shrink-0 object-cover"
                                />
                                <p className="text-[15px] leading-snug text-muted-foreground">
                                    Sign in or create an account and you will go straight back
                                    to <span className="text-ink">{clothName(claiming)}</span> to
                                    claim its certificate.
                                </p>
                            </div>
                        ) : (
                            <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
                                Your certificates are kept under your account — sign in to
                                see them, or create one in a minute.
                            </p>
                        )}

                        <div className="mt-8 bg-card p-5 shadow-[inset_0_0_0_1px_var(--bt-stone-2)] sm:p-7">
                            <LoginForm
                                next={safeNext}
                                initialMode={mode === "register" ? "register" : "login"}
                            />
                        </div>

                        <Link
                            href="/"
                            className="mt-6 inline-block text-[15px] text-muted-foreground hover:text-ink"
                        >
                            Read records without an account →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
