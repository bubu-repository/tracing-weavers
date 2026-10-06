"use client";

import { MotionConfig } from "framer-motion";

/**
 * Reduced motion, decided once for the whole app.
 *
 * Components used to branch on `useReducedMotion()` and render a different
 * tree when it was true. The server cannot know the preference, so it always
 * rendered the animated tree, the client rendered the other one, and React
 * reported a hydration mismatch on every page for anyone who had asked for
 * less motion. `reducedMotion="user"` lets framer drop the movement itself,
 * with the same markup on both sides.
 */
export function Providers({ children }: { children: React.ReactNode }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
