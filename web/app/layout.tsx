import type { Metadata } from "next";
import { Archivo_Narrow, Caveat, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ScrollThread } from "@/components/motif/scroll-thread";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ThreadCursor } from "@/components/motif/thread-cursor";
import { brand } from "@/lib/brand";

/* Beyond Tenun type: Telegraf Black → Hanken Grotesk 900, Archivo Narrow is
   the real deck face, Biro Script Plus → Caveat for the single script use.
   Codes and ids use the system monospace (see the `.data` utility) so a
   passport id reads as machine output rather than as prose. */
const hanken = Hanken_Grotesk({
    variable: "--font-display-family",
    subsets: ["latin"],
    weight: ["400", "500", "700", "900"],
});

const archivo = Archivo_Narrow({
    variable: "--font-body",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
    variable: "--font-script-family",
    subsets: ["latin"],
    weight: ["600", "700"],
});

export const metadata: Metadata = {
    title: { default: brand, template: `%s | ${brand}` },
    description:
        "Tracing Weavers — Indonesia Heritage for Human Flourishing. One cloth, one page: trace every thread back to the hands that wove it.",
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body
                className={`${hanken.variable} ${archivo.variable} ${caveat.variable} antialiased`}
                style={{
                    ["--font-mono-family" as string]:
                        "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                }}
            >
                <SmoothScroll />
                                <Analytics />
                <ScrollThread />
                <ThreadCursor />
                {children}
            </body>
        </html>
    );
}