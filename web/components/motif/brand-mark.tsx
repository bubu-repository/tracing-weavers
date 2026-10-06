/** Three warp threads and the weft carried across them — the app's mark, the
    same drawing as app/icon.svg. Inherits nothing: it is always salmon on
    morinda, so it reads on ink and on paper alike. */
export function BrandMark({ className }: { className?: string }) {
    return (
        <svg aria-hidden viewBox="0 0 32 32" className={className}>
            <g stroke="#FF9783" strokeWidth="2.4" strokeLinecap="square">
                <line x1="9" y1="5" x2="9" y2="27" />
                <line x1="16" y1="5" x2="16" y2="27" />
                <line x1="23" y1="5" x2="23" y2="27" />
            </g>
            <line x1="4" y1="16" x2="28" y2="16" stroke="#EC3013" strokeWidth="3.4" strokeLinecap="square" />
        </svg>
    );
}
