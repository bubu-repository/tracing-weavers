import Header from "@/components/header";
import Footer from "@/components/footer";

/* The bottom padding below `md` is the phone tab bar's height plus the home
   indicator, so the footer's last line is never hidden under it. */
export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
            <Header />
            <main
                id="main"
                tabIndex={-1}
                className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-6 sm:py-10"
            >
                {children}
            </main>
            <Footer />
        </div>
    );
}
