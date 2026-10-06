/** Three warp threads and the weft carried across them — the app's mark, the
    same drawing as app/icon.svg. On ink the warp is salmon; on paper it is
    ink, with the red weft carried across it. */
export function BrandMark({ className, tone = "ink" }: { className?: string; tone?: "ink" | "paper" }) {
    return (
        <svg aria-hidden viewBox="0 0 32 32" className={className}>
            <g stroke={tone === "paper" ? "#201E1D" : "#FF9783"} strokeWidth="2.4" strokeLinecap="square">
                <line x1="9" y1="5" x2="9" y2="27" />
                <line x1="16" y1="5" x2="16" y2="27" />
                <line x1="23" y1="5" x2="23" y2="27" />
            </g>
            <line x1="4" y1="16" x2="28" y2="16" stroke="#EC3013" strokeWidth="3.4" strokeLinecap="square" />
        </svg>
    );
}
