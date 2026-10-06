/**
 * Thumbnails and colour palettes for every record photo.
 *
 *   npm run images
 *
 * Writes, for each record in data/records.json:
 *   public/imagery/thumbs/<name>.webp  — 520px wide, for catalogue cards
 *   public/imagery/swatches/<name>.webp — 240px square, for strips and lists
 *   public/imagery/story/<name>.webp   — 1400px, the documentary photos the
 *                                        home page's story chapters use
 *   data/palettes.json                 — the cloth's five main colours
 *
 * Why: the catalogue used to load every full-size photo (120–390 KB each, ~7
 * MB for the page) on a phone in an exhibition hall. A 520px WebP is a
 * fraction of that. And the palette is the cloth's own — each record page takes its
 * selvedge stripe, its swatches and its colour filter from the photograph,
 * not from a stylesheet.
 *
 * `sharp` ships with Next.js (it is how next/image resizes), so there is
 * nothing extra to install. Run it again after adding or replacing a photo,
 * and commit both outputs.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const records = JSON.parse(readFileSync(resolve(root, "data/records.json"), "utf8")).records;
const thumbsDir = resolve(root, "public/imagery/thumbs");
const swatchesDir = resolve(root, "public/imagery/swatches");
mkdirSync(thumbsDir, { recursive: true });
mkdirSync(swatchesDir, { recursive: true });

/* ── colour maths ─────────────────────────────────────────────────────── */

const hex = ([r, g, b]) =>
    "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

function hsv([r, g, b]) {
    const [R, G, B] = [r / 255, g / 255, b / 255];
    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    const d = max - min;
    let h = 0;
    if (d) {
        if (max === R) h = ((G - B) / d) % 6;
        else if (max === G) h = (B - R) / d + 2;
        else h = (R - G) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    return { h, s: max ? d / max : 0, v: max };
}

/* Families a visitor can filter by. A cloth belongs to every family that
   makes up a real share of it, so a red-and-indigo ikat answers to both. */
function family(rgb) {
    const { h, s, v } = hsv(rgb);
    if (v < 0.22) return "dark";
    if (s < 0.18) return v > 0.7 ? "natural" : "dark";
    /* warm and muted: tan, beige, undyed cotton, or brown */
    if (s < 0.38 && (h < 55 || h >= 330)) return v > 0.6 ? "natural" : "dark";
    if (h >= 330 || h < 18) return "red";
    if (h < 68) return v < 0.42 ? "dark" : "ochre";
    if (h < 165) return "green";
    if (h < 255) return "blue";
    return "purple";
}

/* k-means on a small sample: deterministic seeds (spread along brightness),
   a dozen rounds, clusters sorted by how much of the cloth they cover. */
function kmeans(pixels, k = 5, rounds = 12) {
    const sorted = [...pixels].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
    let centres = Array.from({ length: k }, (_, i) => sorted[Math.floor(((i + 0.5) / k) * sorted.length)]);
    let assign = new Array(pixels.length).fill(0);
    for (let round = 0; round < rounds; round++) {
        assign = pixels.map((p) => {
            let best = 0;
            let bestD = Infinity;
            centres.forEach((c, i) => {
                const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
                if (d < bestD) {
                    bestD = d;
                    best = i;
                }
            });
            return best;
        });
        centres = centres.map((c, i) => {
            const members = pixels.filter((_, j) => assign[j] === i);
            if (!members.length) return c;
            return [0, 1, 2].map((ch) => members.reduce((sum, m) => sum + m[ch], 0) / members.length);
        });
    }
    const counts = centres.map((_, i) => assign.filter((a) => a === i).length);
    return centres
        .map((rgb, i) => ({ rgb, share: counts[i] / pixels.length }))
        .filter((c) => c.share > 0)
        .sort((a, b) => b.share - a.share);
}

async function analyse(file) {
    /* The centre 80% of the frame: the edges are often floor, wall or hand. */
    const meta = await sharp(file).metadata();
    const cropW = Math.round(meta.width * 0.8);
    const cropH = Math.round(meta.height * 0.8);
    const { data, info } = await sharp(file)
        .extract({
            left: Math.round((meta.width - cropW) / 2),
            top: Math.round((meta.height - cropH) / 2),
            width: cropW,
            height: cropH,
        })
        .resize(72, 72, { fit: "fill" })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const pixels = [];
    for (let i = 0; i < data.length; i += info.channels) {
        pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
    const clusters = kmeans(pixels, 5);
    const colors = clusters.map((c) => ({ hex: hex(c.rgb), share: Number(c.share.toFixed(3)) }));

    const weights = {};
    for (const c of clusters) {
        const f = family(c.rgb);
        weights[f] = (weights[f] ?? 0) + c.share;
    }
    const families = Object.entries(weights)
        .filter(([, w]) => w >= 0.14)
        .sort((a, b) => b[1] - a[1])
        .map(([f]) => f);

    return { colors, families, ratio: Number((meta.width / meta.height).toFixed(3)) };
}

/* ── run ───────────────────────────────────────────────────────────────── */

const out = {};
const seen = new Set();
for (const record of records) {
    const src = record.photo ?? record.image;
    if (!src || !/\.(jpe?g|png|webp)$/i.test(src)) continue;
    const file = resolve(root, "public", src.replace(/^\//, ""));
    if (!existsSync(file)) {
        console.warn(`skip ${record.code}: ${src} not found`);
        continue;
    }

    const name = basename(src, extname(src));
    const thumb = `/imagery/thumbs/${name}.webp`;
    if (!seen.has(name)) {
        await sharp(file)
            .resize({ width: 520, withoutEnlargement: true })
            .webp({ quality: 64 })
            .toFile(resolve(thumbsDir, `${name}.webp`));
        await sharp(file)
            .resize(240, 240, { fit: "cover", position: "attention" })
            .webp({ quality: 62 })
            .toFile(resolve(swatchesDir, `${name}.webp`));
        seen.add(name);
    }

    const swatch = `/imagery/swatches/${name}.webp`;
    out[record.code] = { thumb, swatch, ...(await analyse(file)) };
    console.log(
        record.code.padEnd(10),
        out[record.code].colors.map((c) => c.hex).join(" "),
        out[record.code].families.join(","),
    );
}

/* The story chapters' photographs: documentary, not cloth records. */
const STORY = [
    "cotton-carding.jpg",
    "weaving-hands-loom.jpg",
    "weaving-detail.jpg",
    "weaver-portrait.jpg",
    "village-flores.jpg",
    "cloth-hanging.jpg",
];
const storyDir = resolve(root, "public/imagery/story");
mkdirSync(storyDir, { recursive: true });
for (const name of STORY) {
    const file = resolve(root, "public/imagery", name);
    if (!existsSync(file)) continue;
    await sharp(file)
        .resize({ width: 1400, withoutEnlargement: true })
        .webp({ quality: 68 })
        .toFile(resolve(storyDir, `${basename(name, extname(name))}.webp`));
}

writeFileSync(
    resolve(root, "data/palettes.json"),
    JSON.stringify(
        {
            _comment:
                "Generated by `npm run images` from each record's photo — do not edit by hand. colors: the cloth's main colours, most-covering first; families: what the colour filter matches; ratio: width / height of the photo; thumb: the 520px WebP used by cards; swatch: a 240px square crop for strips and lists.",
            palettes: out,
        },
        null,
        2,
    ) + "\n",
);
console.log(`\n${Object.keys(out).length} palettes → data/palettes.json, ${seen.size} thumbnails + swatches → public/imagery/`);
