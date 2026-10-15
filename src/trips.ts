// Disposable cameras: one per trip, each with its own look. The photos come from `npm run photos`
// (scripts/import-disposables.mjs → src/data/disposables.json); the look of each trip's camera is set here.
// A trip with no entry in LOOKS still shows up, with a look picked for it.
import rolls from './data/disposables.json';

export type CameraLook = { body: string; wrap: string; stripe: string; ink: string; brand: string; sub: string };
export type Trip = { slug: string; name: string; place?: string; look: CameraLook; photos: { id: string; src: string; sm: string; w: number; h: number }[] };

// Where each trip was.
const PLACES: Record<string, string> = {
  'lake-summer-2026': 'Lac-Supérieur, QC',
};

const LOOKS: Record<string, Partial<CameraLook>> = {
  'lake-summer-2026': { wrap: '#3f8f86', stripe: '#f2c94c', ink: '#fbf5ec', brand: 'LAKE', sub: 'SUMMER 2026' },
};
// Looks handed out to trips that don't have one yet: [wrap, stripe, ink].
const SPARE: [string, string, string][] = [['#f2c94c', '#d94f3d', '#1d1d20'], ['#2f5d8a', '#f2c94c', '#fbf5ec'], ['#d94f3d', '#fbf5ec', '#fbf5ec'], ['#6b4f8a', '#f2c94c', '#fbf5ec'], ['#2e6b4f', '#e9dfc6', '#fbf5ec']];

export const TRIPS: Trip[] = Object.entries(rolls as Record<string, { name: string; photos: Trip['photos'] }>)
  .map(([slug, r], i) => {
    const spare = SPARE[i % SPARE.length];
    const words = r.name.toUpperCase().split(/\s+/);
    const look: CameraLook = { body: '#1d1d20', wrap: spare[0], stripe: spare[1], ink: spare[2], brand: words[0], sub: words.slice(1).join(' '), ...LOOKS[slug] };
    return { slug, name: r.name, place: PLACES[slug], look, photos: r.photos };
  })
  // Newest trip first (by the year in its name, then name).
  .sort((a, b) => (b.name.match(/\d{4}/)?.[0] ?? '').localeCompare(a.name.match(/\d{4}/)?.[0] ?? '') || a.name.localeCompare(b.name));

// The plain camera on /resources: no trip on it, just the site's own disposable.
export const PLAIN_LOOK: CameraLook = { body: '#1d1d20', wrap: '#f2c94c', stripe: '#d94f3d', ink: '#1d1d20', brand: 'MANSFIELD', sub: 'SINGLE USE' };

export const PHOTO_COUNT = TRIPS.reduce((n, t) => n + t.photos.length, 0);
