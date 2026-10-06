import Link from "next/link";
import { currentIdentity } from "@/lib/session";
import { brand } from "@/lib/brand";
import { t } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { BottomNav, NavPills } from "@/components/nav-pills";
import { SignOutButton } from "@/components/sign-out-button";
import { BrandMark } from "@/components/motif/brand-mark";

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "·";

/* The gallery wall: an ink bar with the four dye pots woven along its lower
   edge. On a phone it is the mark, the name and the account; the sections
   live in the tab bar at the bottom. */
export default async function Header() {
    const identity = await currentIdentity();

    return (
        <>
            <a
                href="#main"
                className="sr-only z-[80] bg-salmon px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
                Skip to content
            </a>

            <header className="no-print sticky top-0 z-50 bg-ink text-white" data-theme="dark">
                <div className="container-x flex h-14 items-center justify-between gap-4 md:h-16">
                    <Link
                        href="/"
                        className="group flex min-w-0 items-center gap-2.5 text-white hover:text-white"
                    >
                        <BrandMark className="h-7 w-7 shrink-0" />
                        <span className="display text-[19px] whitespace-nowrap">{brand}</span>
                        <span className="hidden border-l border-white/20 pl-2.5 text-[11px] tracking-[.22em] whitespace-nowrap text-white/60 uppercase xl:inline">
                            {t.brandLine}
                        </span>
                    </Link>

                    <div className="flex shrink-0 items-center gap-3">
                        <NavPills className="hidden md:block" />

                        {identity ? (
                            <div className="flex items-center gap-1">
                                <Link
                                    href="/profile"
                                    aria-label={`Your profile — ${identity.name}`}
                                    title={identity.name}
                                    className="pressable grid h-9 w-9 place-items-center rounded-full bg-salmon text-[13px] font-semibold tracking-[.04em] text-ink hover:bg-white hover:text-ink"
                                >
                                    {initials(identity.name)}
                                </Link>
                                <SignOutButton
                                    tone="ink"
                                    className="hidden md:inline-flex"
                                />
                            </div>
                        ) : (
                            <Button asChild size="sm" variant="inverse">
                                <Link href="/login">{t.signIn}</Link>
                            </Button>
                        )}
                    </div>
                </div>
                <div className="selvedge-dye" aria-hidden />
            </header>

            <BottomNav />
        </>
    );
}
