import type { Metadata, Viewport } from "next";
import { Archivo_Narrow, Caveat, Hanken_Grotesk, Newsreader } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ScrollThread } from "@/components/motif/scroll-thread";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ThreadCursor } from "@/components/motif/thread-cursor";
import { Providers } from "@/components/providers";
import { brand, siteUrl } from "@/lib/brand";

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

/* The reading voice: long prose (chapter leads, a cloth's description, the
   story paragraphs) is set in a book face with optical sizes, so the page
   reads like a catalogue essay rather than a screen. */
const newsreader = Newsreader({
    variable: "--font-serif-family",
    subsets: ["latin"],
    style: ["normal", "italic"],
    axes: ["opsz"],
});

const caveat = Caveat({
    variable: "--font-script-family",
    subsets: ["latin"],
    weight: ["600", "700"],
});

const description =
    "Tracing Weavers — Indonesia Heritage for Human Flourishing. One cloth, one page: trace every thread back to the hands that wove it.";

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: { default: brand, template: `%s | ${brand}` },
    description,
    openGraph: {
        type: "website",
        siteName: brand,
        title: brand,
        description,
        images: ["/imagery/weaving-hands-loom.jpg"],
    },
};

/* `viewport-fit=cover` is what makes env(safe-area-inset-bottom) non-zero, so
   the phone tab bar clears the home indicator instead of sitting under it. */
export const viewport: Viewport = {
    themeColor: "#F0EADF",
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body
                className={`${hanken.variable} ${archivo.variable} ${newsreader.variable} ${caveat.variable} antialiased`}
                style={{
                    ["--font-mono-family" as string]:
                        "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                }}
            >
                <SmoothScroll />
                <Analytics />
                <ScrollThread />
                <ThreadCursor />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}