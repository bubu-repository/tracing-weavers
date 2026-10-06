import { Fragment } from "react";

/**
 * A line of type that rises out of its own baseline, word by word, once.
 *
 * Pure CSS now. The framer version rendered every word at translateY(108%)
 * on the server and only lifted it after hydration, so on a slow connection
 * the headline was blank until JavaScript arrived, and it rendered a different
 * tree for reduced motion than the server had sent. A keyframe needs neither:
 * the words are in the HTML, the animation runs on paint, and the global
 * `prefers-reduced-motion` rule in globals.css collapses it to nothing.
 *
 * It takes a plain string rather than children on purpose: splitting arbitrary
 * markup into words would break links and emphasis.
 */
export function RevealText({
    text,
    as: Tag = "span",
    className,
    delay = 0,
    accentFrom,
    accentClass = "text-bt-red",
}: {
    text: string;
    as?: "span" | "h1" | "h2" | "h3" | "p";
    className?: string;
    /** Seconds before the first word moves. */
    delay?: number;
    /** Word index from which the line takes the accent colour. */
    accentFrom?: number;
    /** Which accent: morinda red on paper, salmon on ink. */
    accentClass?: string;
}) {
    const words = text.split(" ");

    return (
        <Tag className={className} aria-label={text}>
            {words.map((word, i) => (
                <Fragment key={`${word}-${i}`}>
                    {/* The band the word is lifted out of. `pb` leaves room
                        for descenders, which a plain overflow-hidden would
                        shave. The space sits outside the band: trailing
                        whitespace inside an inline-block is dropped. */}
                    <span
                        aria-hidden
                        className="inline-block overflow-hidden pb-[0.12em] align-bottom"
                    >
                        <span
                            className={`word-rise inline-block ${
                                accentFrom !== undefined && i >= accentFrom ? accentClass : ""
                            }`}
                            style={{ animationDelay: `${delay + i * 0.045}s` }}
                        >
                            {word}
                        </span>
                    </span>
                    {i < words.length - 1 ? " " : null}
                </Fragment>
            ))}
        </Tag>
    );
}
