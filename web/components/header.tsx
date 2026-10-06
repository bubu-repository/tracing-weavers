import Link from "next/link";
import { currentIdentity } from "@/lib/session";
import { brand } from "@/lib/brand";
import { t } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { BottomNav, NavPills } from "@/components/nav-pills";
import { SignOutButton } from "@/components/sign-out-button";

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "·";

/* Solid ground, hairline rule, and a selvedge under it — the header's only
   ornament. No blur, no glass: the cloth is opaque.

   On a phone the header is the name and the account, nothing else: the four
   sections live in the tab bar at the bottom (components/nav-pills), so the
   name is never cut short and the row never pushes the page sideways. */
export default async function Header() {
    const identity = await currentIdentity();

    return (
        <>
            <a
                href="#main"
                className="sr-only z-[80] rounded-md bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
                Skip to content
            </a>

            <header className="no-print sticky top-0 z-50 border-b border-border bg-background">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
                    <Link
                        href="/"
                        className="flex min-w-0 items-baseline gap-2.5 py-2 text-bt-red hover:text-bt-red-bright"
                    >
                        <span className="display text-[18px] whitespace-nowrap sm:text-[19px]">
                            {brand}
                        </span>
                        <span className="hidden text-[10px] tracking-[.28em] whitespace-nowrap uppercase lg:inline">
                            {t.brandLine}
                        </span>
                    </Link>

                    <div className="flex shrink-0 items-center gap-2">
                        <NavPills className="hidden md:flex" />

                        {identity ? (
                            <>
                                <Link
                                    href="/profile"
                                    aria-label={`Your profile — ${identity.name}`}
                                    title={identity.name}
                                    className="pressable grid h-9 w-9 place-items-center rounded-full bg-ink text-[13px] font-medium tracking-[.04em] text-white hover:bg-ink/85 hover:text-white"
                                >
                                    {initials(identity.name)}
                                </Link>
                                <SignOutButton className="hidden md:inline-flex" />
                            </>
                        ) : (
                            <Button asChild size="sm">
                                <Link href="/login" className="text-white hover:text-white">
                                    {t.signIn}
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
                <div className="selvedge" aria-hidden />
            </header>

            <BottomNav />
        </>
    );
}
