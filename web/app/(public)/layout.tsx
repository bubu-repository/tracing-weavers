import Header from "@/components/header";
import Footer from "@/components/footer";

/* Pages own their width: full-bleed bands run edge to edge, everything else
   sits in `.container-x`. The bottom padding below `md` is the phone tab
   bar's height plus the home indicator. */
export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
            <Header />
            <main id="main" tabIndex={-1} className="w-full flex-1 outline-none">
                {children}
            </main>
            <Footer />
        </div>
    );
}
