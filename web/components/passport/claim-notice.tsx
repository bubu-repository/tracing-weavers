"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";

/**
 * The moment a claim lands.
 *
 * This is the one screen in the app allowed to celebrate: it happens once per
 * cloth, it is the whole point of the programme, and the holder has just
 * attached their name to somebody's eleven weeks of work. So it congratulates
 * them, says what they now hold, and — the part that matters — says where to
 * find it again, with a button straight there rather than a word in a
 * sentence.
 *
 * Nine seconds, dismissible, and keyed on the passport id so claiming twice
 * never stacks two copies of the same message.
 */
export function ClaimNotice({
    passportId,
    clothName,
    onClose,
}: {
    passportId: string;
    clothName: string;
    onClose: () => void;
}) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (!visible) return;
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 400); // wait for the exit animation
        }, 9000);
        return () => clearTimeout(timer);
    }, [visible, onClose]);

    function close() {
        setVisible(false);
        setTimeout(onClose, 400);
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 96, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 60, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    role="status"
                    aria-live="polite"
                    className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-4 z-[55] mx-auto max-w-md overflow-hidden bg-ink text-white shadow-[0_18px_44px_rgba(32,30,29,.4)] sm:right-6 sm:left-auto sm:w-[26rem] md:bottom-6"
                    data-theme="dark"
                >
                    {/* the finished edge of the weave, across the top */}
                    <div
                        aria-hidden
                        className="selvedge-dye absolute inset-x-0 top-0"
                    />

                    <div className="p-5">
                        <button
                            onClick={close}
                            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-white/45 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                            aria-label="Close"
                        >
                            <X aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                        </button>

                        <div className="eyebrow">Congratulations</div>

                        <p className="mt-2 text-[17px] leading-snug text-white">
                            You now hold the certificate for{" "}
                            <span className="text-salmon">{clothName}</span>.
                        </p>

                        <p className="mt-2 text-[14px] leading-snug text-white/65">
                            It is kept under your account. Open{" "}
                            <span className="text-white/90">Traces</span> any time
                            to see it again — the cloth&apos;s photograph and its
                            data, bound as a book you can open anywhere.
                        </p>

                        <p className="num mt-2 text-[11px] break-all text-white/40">
                            {passportId}
                        </p>

                        <div className="mt-4 flex items-center gap-3">
                            <Link
                                href="/collection"
                                onClick={close}
                                className="pressable inline-flex h-11 flex-1 items-center justify-center bg-salmon px-4 text-[15px] font-medium text-ink hover:bg-white hover:text-ink"
                            >
                                See it in your traces
                            </Link>
                            <Link
                                href={`/verify/${passportId}`}
                                onClick={close}
                                className="inline-flex h-11 items-center justify-center px-4 text-[14px] text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,.3)] hover:bg-white hover:text-ink"
                            >
                                Check it
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}