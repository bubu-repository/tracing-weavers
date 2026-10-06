import { Skeleton } from "@/components/ui/skeleton";

/**
 * What a visitor sees while a signed-in page reads from the store: a heading
 * and a block. Only the pages that wait on the store use it — a loading
 * boundary over the whole shell made /t/<code> answer 200 and redirect in the
 * browser instead of sending a real redirect, and turned 404s into 200s.
 */
export function PageSkeleton() {
    return (
        <div aria-busy="true">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-9 w-2/3 max-w-md" />
            <Skeleton className="mt-3 h-4 w-1/2 max-w-sm" />
            <Skeleton className="mt-8 h-64 w-full rounded-xl" />
            <p className="sr-only" role="status">
                Loading…
            </p>
        </div>
    );
}
