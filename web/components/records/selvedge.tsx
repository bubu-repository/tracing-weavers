import type { ClothPalette } from "@/lib/records";
import { cn } from "@/lib/utils";

/**
 * The cloth's own selvedge: its main colours as a woven edge, each band as
 * wide as the share of the cloth it covers. Measured from the photograph
 * (data/palettes.json), so no two records wear the same stripe. Without a
 * palette it falls back to the brand's four dye pots.
 */
export function Selvedge({
    palette,
    className,
}: {
    palette?: ClothPalette;
    className?: string;
}) {
    if (!palette?.colors.length) {
        return <div aria-hidden className={cn("selvedge-dye", className)} />;
    }
    return (
        <div aria-hidden className={cn("flex h-1.5 w-full", className)}>
            {palette.colors.map((color) => (
                <span
                    key={color.hex}
                    className="h-full"
                    style={{ background: color.hex, flexGrow: Math.max(color.share, 0.06) }}
                />
            ))}
        </div>
    );
}

/** The same colours as named chips, for the record page. */
export function PaletteSwatches({
    palette,
    className,
}: {
    palette?: ClothPalette;
    className?: string;
}) {
    if (!palette?.colors.length) return null;
    return (
        <div className={className}>
            <div className="label">Colours in this cloth</div>
            <ul className="mt-2.5 flex flex-wrap gap-2">
                {palette.colors.map((color) => (
                    <li key={color.hex} className="flex items-center gap-2">
                        <span
                            aria-hidden
                            className="h-7 w-7 shadow-[inset_0_0_0_1px_rgba(32,30,29,.12)]"
                            style={{ background: color.hex }}
                        />
                        <span className="data pr-1.5 text-[11px] text-ink-2">
                            {color.hex}
                            <span className="sr-only">, {Math.round(color.share * 100)}% of the cloth</span>
                        </span>
                    </li>
                ))}
            </ul>
            <p className="mt-2 text-[13px] text-muted-foreground">
                Measured from the photograph — light and camera shift them a little.
            </p>
        </div>
    );
}
