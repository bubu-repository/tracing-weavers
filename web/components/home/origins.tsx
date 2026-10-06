import Link from "next/link";
import { attr, clothName, paletteFor, records, recordSwatch } from "@/lib/records";

/**
 * Where the threads come from — a typographic map.
 *
 * No outline of the archipelago (none was supplied, and drawing one would be
 * decoration); instead each province is a row, and each cloth from it is one
 * square in its own main colour, measured from its photograph. The row is the
 * count, and it is also the collection's palette, place by place. Every place
 * name filters the catalogue above.
 */
export function Origins() {
    const provinces = new Map<
        string,
        { place: string; code: string; name: string; hex: string; swatch: string }[]
    >();
    for (const record of records) {
        const raw = String(attr(record, "Origin") ?? "");
        const [place, province = place] = raw.split("/").map((part) => part.trim());
        if (!place) continue;
        const list = provinces.get(province) ?? [];
        list.push({
            place,
            code: record.code,
            name: clothName(record),
            hex: paletteFor(record)?.colors[0]?.hex ?? "#5A5755",
            swatch: recordSwatch(record),
        });
        provinces.set(province, list);
    }
    const rows = [...provinces.entries()].sort(
        (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
    );

    return (
        <ol className="border-t border-ink">
            {rows.map(([province, cloths]) => {
                const places = [...new Set(cloths.map((c) => c.place))];
                return (
                    <li
                        key={province}
                        className="grid grid-cols-1 gap-x-6 gap-y-3 border-b border-border py-5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_3rem] sm:items-center"
                    >
                        <div>
                            <h3 className="text-[22px] sm:text-[26px]">{province}</h3>
                            <p className="mt-1 text-[14px] text-muted-foreground">
                                {places.map((place, i) => (
                                    <span key={place}>
                                        {i > 0 && " · "}
                                        <Link
                                            href={`/?q=${encodeURIComponent(place)}#collection`}
                                            scroll={false}
                                            className="text-ink-2 underline decoration-stone underline-offset-[3px] hover:text-bt-red hover:decoration-bt-red"
                                        >
                                            {place}
                                        </Link>
                                    </span>
                                ))}
                            </p>
                        </div>

                        <ul className="flex flex-wrap gap-1.5" aria-label={`${cloths.length} cloths from ${province}`}>
                            {cloths.map((cloth) => (
                                <li key={cloth.code}>
                                    <Link
                                        href={`/record/${encodeURIComponent(cloth.code)}`}
                                        title={`${cloth.name} · ${cloth.place}`}
                                        aria-label={`${cloth.name}, ${cloth.place}`}
                                        className="weave-cloth group relative block h-11 w-11 overflow-hidden shadow-[var(--shadow-rest)] sm:h-12 sm:w-12"
                                        style={{ backgroundColor: cloth.hex }}
                                    >
                                        {/* the colour first; the cloth itself on hover */}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={cloth.swatch}
                                            alt=""
                                            loading="lazy"
                                            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <span className="numeral hidden text-right text-[40px] text-ink-3 sm:block">
                            {cloths.length}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
