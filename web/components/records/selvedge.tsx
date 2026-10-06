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
        <div aria-hidden className={cn("woven flex h-1.5 w-full", className)}>
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
