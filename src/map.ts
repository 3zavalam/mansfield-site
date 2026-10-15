// Map drawing for /resources/places, done at build time: SVG path strings for the world and for each visited
// country by state/province, so the page ships plain SVG and no map library.
// Data: world-atlas (countries, 1:110m) and Natural Earth admin-1 (states/provinces, simplified into
// src/data/admin1.topo.json).
import { geoNaturalEarth1, geoAzimuthalEqualArea, geoPath, geoArea, geoCentroid, geoDistance } from 'd3-geo';
import { feature } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';
import admin1 from './data/admin1.topo.json';
import { COUNTRIES, type Country } from './places';

type Feat = GeoJSON.Feature<GeoJSON.Geometry, Record<string, any>>;
const countries = (feature(world as any, (world as any).objects.countries) as any).features as Feat[];
const regions = (feature(admin1 as any, (admin1 as any).objects.admin1) as any).features as Feat[];

export const WORLD = { w: 960, h: 470 };
const worldProj = geoNaturalEarth1().fitExtent([[4, 4], [WORLD.w - 4, WORLD.h - 4]], { type: 'FeatureCollection', features: countries.filter((c) => c.id !== '010') } as any);
const worldPath = geoPath(worldProj);
const visited = new Set(COUNTRIES.map((c) => c.num));

export const worldShapes = countries
  .filter((c) => c.id !== '010') // no Antarctica
  .map((c) => ({ id: String(c.id), name: c.properties.name as string, d: worldPath(c) ?? '', visited: visited.has(String(c.id)) }));

export const worldPins = COUNTRIES.flatMap((c) => c.places.map((p) => {
  const [x, y] = worldProj([p.lon, p.lat])!;
  return { x, y, name: p.name, country: c.a3 };
}));

// Pin labels: each takes the first spot around its pin (right, left, then further below or above) that
// stays inside the map and doesn't overlap a label already placed, so clusters (Montreal and
// Lac-Supérieur, the Cancún coast) don't print on each other or off the edge.
const labelled = <T extends { x: number; y: number; name: string; r?: number }>(pins: T[], W: number, H: number) => {
  // Every dot is an obstacle too, so no label sits on another place's dot.
  const dot = (p: T): [number, number, number, number] => { const r = (p.r ?? 5) + 2; return [p.x - r, p.y - r, p.x + r, p.y + r]; };
  const boxes: [number, number, number, number][] = pins.map(dot);
  const hit = (b: [number, number, number, number]) => b[0] < 2 || b[2] > W - 2 || b[1] < 2 || b[3] > H - 2 || boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
  return [...pins].sort((a, b) => a.y - b.y).map((p) => {
    const w = p.name.length * 7.6 + 4, h = 15;
    const spots: [number, number, 'start' | 'end'][] = [];
    const gap = (p.r ?? 5) + 4;
    for (const dx of [gap, gap + 25, gap + 55]) for (const dy of [4, 20, -12, 36, -28, 52, -44, 68, -60]) spots.push([dx, dy, 'start'], [-dx, dy, 'end']);
    const own = boxes.findIndex((b) => b[0] === dot(p)[0] && b[1] === dot(p)[1]);
    if (own >= 0) boxes.splice(own, 1); // its own dot doesn't block it
    const [dx, dy, anchor] = spots.find(([dx, dy, an]) => !hit(box(p.x + dx, p.y + dy, an))) ?? spots[0];
    boxes.push(box(p.x + dx, p.y + dy, anchor), dot(p));
    return { ...p, lx: dx, ly: dy, anchor };
    function box(x: number, y: number, an: 'start' | 'end'): [number, number, number, number] { const x0 = an === 'start' ? x : x - w; return [x0, y - h + 3, x0 + w, y + 3]; }
  });
};

// One country, by region. The view is fitted to the country's main body (the regions around the biggest one
// near where I've been), so Alaska, far-off islands and overseas territories don't shrink it.
export const COUNTRY = { w: 900, h: 560 };
export const countryMap = (c: Country) => {
  const feats = regions.filter((r) => r.properties.adm0_a3 === c.a3);
  const here = geoCentroid({ type: 'MultiPoint', coordinates: c.places.map((p) => [p.lon, p.lat]) } as any);
  const candidates = feats.filter((f) => geoDistance(geoCentroid(f), here) < 0.6);
  const main = (candidates.length ? candidates : feats).reduce((a, b) => (geoArea(b) > geoArea(a) ? b : a));
  const near = feats.filter((f) => geoDistance(geoCentroid(f), geoCentroid(main)) < 0.5);
  const proj = geoAzimuthalEqualArea().rotate([-geoCentroid(main)[0], -geoCentroid(main)[1]]).fitExtent([[16, 16], [COUNTRY.w - 16, COUNTRY.h - 16]], { type: 'FeatureCollection', features: near } as any);
  const path = geoPath(proj);
  const been = new Set(c.places.map((p) => p.region));
  const regionName = (code: string) => (feats.find((f) => f.properties.iso_3166_2 === code)?.properties.name ?? code) as string;
  const pts = c.places.map((p) => { const [x, y] = proj([p.lon, p.lat])!; return { ...p, x, y }; });

  // Places closer than CLUSTER px on the country map become one group: a numbered dot named after their
  // state (or "N places"). Clicking a group zooms into it, where its places are drawn and labelled at a
  // size that reads at that zoom (sizes divided by the zoom factor k).
  const CLUSTER = 24;
  const groups: (typeof pts)[] = [];
  for (const p of pts) {
    const g = groups.find((g) => g.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < CLUSTER));
    if (g) g.push(p); else groups.push([p]);
  }
  const singles = groups.filter((g) => g.length === 1).map((g) => g[0]);
  const clusters = groups.filter((g) => g.length > 1).map((g, i) => {
    const xs = g.map((p) => p.x), ys = g.map((p) => p.y);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const regionsIn = [...new Set(g.map((p) => p.region))];
    let minD = Infinity;
    for (const a of g) for (const b of g) if (a !== b) minD = Math.min(minD, Math.hypot(a.x - b.x, a.y - b.y));
    const fit = Math.min((COUNTRY.w - 220) / Math.max(x1 - x0, 1), (COUNTRY.h - 140) / Math.max(y1 - y0, 1));
    const k = Math.max(1.6, Math.min(12, fit, Math.max(3, 40 / Math.max(minD, 1))));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = COUNTRY.w / k, h = COUNTRY.h / k;
    const box = { x: cx - w / 2, y: cy - h / 2, w, h };
    const zoomed = labelled(g.map((p) => ({ ...p, x: (p.x - box.x) * k, y: (p.y - box.y) * k })), COUNTRY.w, COUNTRY.h)
      .map((p) => ({ ...p, x: p.x / k + box.x, y: p.y / k + box.y, lx: p.lx / k, ly: p.ly / k }));
    return {
      id: `${c.a3}-${i}`, x: xs.reduce((a, b) => a + b) / g.length, y: ys.reduce((a, b) => a + b) / g.length, count: g.length,
      name: regionsIn.length === 1 ? regionName(regionsIn[0]) : `${g.length} places`, box, k, pins: zoomed,
    };
  });
  // Labels on the whole-country map: single places and groups, laid out together.
  const top = labelled([...singles.map((p) => ({ ...p, kind: 'place' as const })), ...clusters.map((g) => ({ ...g, r: 11, kind: 'group' as const }))], COUNTRY.w, COUNTRY.h);
  return {
    regions: feats.map((f) => ({ code: f.properties.iso_3166_2 as string, name: (f.properties.name ?? '') as string, d: path(f) ?? '', visited: been.has(f.properties.iso_3166_2) })).filter((r) => r.d),
    singles: top.filter((p) => p.kind === 'place'),
    groups: top.filter((p) => p.kind === 'group').map((t) => ({ ...clusters.find((g) => g.id === (t as any).id)!, lx: t.lx, ly: t.ly, anchor: t.anchor })),
    regionName,
  };
};
