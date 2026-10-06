"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** PassportClaim fires this the moment a certificate is issued. */
export const CLAIMED_EVENT = "tw:claimed";

/**
 * The claim, within thumb's reach.
 *
 * On a phone the claim card sits below the photograph, the facts and the
 * swatches — three screens down from where a scan lands. This bar rides above
 * the tab bar until the card itself comes into view, then gets out of the way;
 * it never claims anything on its own, it only takes you to the card.
 */
export function ClaimBar({
    swatch,
    name,
    status,
}: {
    swatch: string;
    name: string;
    status: string;
}) {
    const [below, setBelow] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [claimed, setClaimed] = useState(false);

    useEffect(() => {
        const card = document.getElementById("claim");
        if (!card) return;
        /* Shown while the card is still below the screen; hidden once it is
           on screen or has been scrolled past. */
        const observer = new IntersectionObserver(
            ([entry]) => {
                setBelow(!entry.isIntersecting && entry.boundingClientRect.top > 0);
            },
            { rootMargin: "0px 0px -96px 0px" },
        );
        observer.observe(card);
        /* Not on arrival: the first screen belongs to the cloth and its name. */
        const onScroll = () => setScrolled(window.scrollY > 280);
        onScroll();
        const onClaimed = () => setClaimed(true);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener(CLAIMED_EVENT, onClaimed);
        return () => {
            observer.disconnect();
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener(CLAIMED_EVENT, onClaimed);
        };
    }, []);

    return (
        <AnimatePresence>
            {below && scrolled && !claimed && (
                <motion.div
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 24, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                    className="no-print fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 md:hidden"
                    data-theme="dark"
                >
                    <div className="flex items-center gap-3 bg-ink p-2 pr-2 text-white shadow-[0_18px_40px_-12px_rgba(0,0,0,.55)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={swatch} alt="" className="h-11 w-11 shrink-0 object-cover" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] leading-tight">{name}</p>
                            <p className="text-[11px] tracking-[.14em] text-white/55 uppercase">{status}</p>
                        </div>
                        <a
                            href="#claim"
                            className="pressable inline-flex h-11 shrink-0 items-center bg-salmon px-4 text-[15px] font-medium text-ink hover:bg-white hover:text-ink"
                        >
                            Claim
                        </a>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
