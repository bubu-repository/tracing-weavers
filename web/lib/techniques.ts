/**
 * The weaving techniques in the collection, explained in a sentence or two.
 *
 * General descriptions of each structure — how the threads are arranged —
 * not claims about any one cloth, its makers or its meaning. Motif meaning
 * stays with the community (see the record page's motif note).
 */

export type WeaveKind =
    | "plain"
    | "warp-ikat"
    | "double-ikat"
    | "supp-warp"
    | "supp-weft"
    | "embroidery";

export function weaveKind(technique: string): WeaveKind {
    const t = technique.toLowerCase();
    if (t.includes("double")) return "double-ikat";
    if (t.includes("embroider")) return "embroidery";
    if (t.includes("supplementary weft")) return "supp-weft";
    if (t.includes("supplementary warp")) return "supp-warp";
    if (t.includes("ikat")) return "warp-ikat";
    return "plain";
}

export const TECHNIQUE: Record<WeaveKind, { body: string; diagram: string }> = {
    "warp-ikat": {
        body: "Before the loom, bundles of warp threads are bound tightly with fibre and dyed. The bound parts resist the dye, so the pattern is in the threads before a single weft is passed — and its edges soften into ikat's blur as the warp shifts on the loom.",
        diagram: "The dyed sections are already in the warp. Watch the pattern appear as the weft goes in, row by row.",
    },
    "double-ikat": {
        body: "Both the warp and the weft are bound and dyed before weaving, and the two patterns have to meet exactly on the loom. It is one of the most exacting techniques in weaving; the gringsing of Tenganan in Bali is among the few double ikats made anywhere.",
        diagram: "Warp and weft both carry their dye. The motif only exists where the two meet.",
    },
    "supp-warp": {
        body: "Extra warp threads, laid alongside the ground warp, are lifted to float over the weave and build the motif. The pattern rises from the surface of the cloth.",
        diagram: "The ground is woven first; the extra warp floats over it to draw the motif.",
    },
    "supp-weft": {
        body: "Extra weft threads are passed between the ground rows and float over the warp to build the motif — the structure behind songket, where the floats are often metallic thread.",
        diagram: "Between rows of the ground, an extra weft floats across to draw the motif.",
    },
    plain: {
        body: "The simplest interlacing: each weft passes over one warp and under the next, and the next row reverses it. The colour comes from the threads themselves — stripes in the warp, bands in the weft.",
        diagram: "The warp is set on the loom first. Watch the weft go over and under it, row by row.",
    },
    embroidery: {
        body: "An ikat ground, its pattern dyed into the threads before weaving, with embroidery worked on top once the cloth is off the loom.",
        diagram: "The ikat pattern comes with the warp; the stitches are added after the weaving.",
    },
};

/** Extra lines for techniques named alongside the main one. */
export function techniqueNotes(technique: string): string[] {
    const t = technique.toLowerCase();
    const notes: string[] = [];
    if (t.includes("buna")) {
        notes.push("Buna, from Timor, adds motifs with coloured threads wrapped around the warp as the cloth is woven.");
    }
    return notes;
}
