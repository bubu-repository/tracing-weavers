import { Skeleton } from "@/components/ui/skeleton";
import { ThreadRule } from "@/components/motif/marks";

/**
 * What a holder sees while a record is being read from the store.
 *
 * Records and collections are force-dynamic, so an NFC tap on a slow connection
 * waits on a round trip with nothing on screen. This keeps the page's shape —
 * artwork band, title, fact rows — so the arrival is a fill-in, not a jump.
 */
export default function Loading() {
    return (
        <div className="container-x py-5">
            <Skeleton className="h-4 w-28" />

            <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
                <div>
                    <Skeleton className="aspect-square w-full rounded-none" />
                    <Skeleton className="mt-3 h-3 w-40" />
                </div>

                <div className="space-y-5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-16 w-full" />

                    <div className="space-y-3 pt-4">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="flex items-baseline justify-between gap-6 border-t border-border py-3"
                            >
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ThreadRule className="mt-16 h-2 w-full text-stone" aria-hidden />

            <p className="mt-6 text-[14px] text-muted-foreground" role="status">
                Reading the record…
            </p>
        </div>
    );
}