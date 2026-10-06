import { notFound } from "next/navigation";

/* Any address nothing else answers: hand it to app/not-found.tsx inside the
   public shell, so a mistyped link still has the header, the tab bar and a
   way back — not a bare page. */
export default function Missing() {
    notFound();
}
