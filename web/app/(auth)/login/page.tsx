import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/login-form";
import { brand } from "@/lib/brand";
import { currentIdentity } from "@/lib/session";
import { PartnerNodes, WarpField } from "@/components/motif/marks";

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

    const claiming = safeNext?.startsWith("/record/");

    return (
        <div className="grid min-h-screen md:grid-cols-2">
            {/* ink panel: the wordmark set in type, threads as the only ground */}
            <div
                className="ink-band cloth relative hidden flex-col justify-between overflow-hidden p-10 md:flex"
                data-theme="dark"
            >
                <WarpField className="pointer-events-none absolute inset-0 h-full w-full text-white/10" />
                <Link
                    href="/"
                    className="eyebrow relative w-fit hover:text-white"
                >
                    {brand} · Trace every thread
                </Link>

                <div className="relative max-w-md">
                    <p className="display text-[clamp(2rem,3.4vw,2.75rem)] leading-tight text-white">
                        A certificate needs a name to belong to.
                    </p>
                    <p className="mt-5 text-[17px] text-white/75">
                        Reading a record is open to anyone. Claiming it is not —
                        a certificate saying “issued to you” has to be issued to
                        someone who can be proved.
                    </p>
                </div>

                <div className="relative flex items-center gap-4">
                    <PartnerNodes className="h-7 w-32 text-salmon" aria-hidden />
                    <span className="text-[12px] tracking-[.12em] uppercase text-white/50">
                        ICM × TBN × Torajamelo
                    </span>
                </div>
            </div>

            <div className="flex flex-col">
                {/* on a phone the ink panel is gone, so the way home has to be here */}
                <div className="flex h-14 items-center justify-between border-b border-border px-5 md:hidden">
                    <Link href="/" className="display text-[18px] text-bt-red">
                        {brand}
                    </Link>
                    <Link
                        href={safeNext ?? "/"}
                        className="text-[14px] text-muted-foreground hover:text-ink"
                    >
                        Cancel
                    </Link>
                </div>

                <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-12 md:py-14">
                    <div className="mx-auto w-full max-w-sm">
                        <div className="eyebrow">Account</div>
                        <h1 className="mt-3">
                            {claiming ? "One step to claim it." : "Welcome."}
                        </h1>
                        <p className="mt-3 text-[15px] text-muted-foreground">
                            {claiming
                                ? "Sign in or create an account, and you will go straight back to the cloth to claim its certificate."
                                : "Your certificates are kept under your account — sign in to see them, or create one in a minute."}
                        </p>

                        <div className="mt-7 rounded-lg bg-card p-5 shadow-[var(--ring)] sm:p-6">
                            <LoginForm
                                next={safeNext}
                                initialMode={mode === "register" ? "register" : "login"}
                            />
                        </div>

                        <Link
                            href="/"
                            className="mt-6 inline-block text-[14px] text-muted-foreground hover:text-ink"
                        >
                            Read records without an account →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
