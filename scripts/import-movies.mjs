// Brings movie posters into the site: `npm run movies`.
//
// Every poster is an image in movies/ (next to package.json), named after the film. A tag in the name
// rates it: "(ultrafav)" 2, "(fav)" 1, "(dislike)" -1, "(ultradislike)" -2 (none is 0). Each is resized to a 600px WebP in
// public/img/resources/movies/ and listed in src/data/movies.json, which src/resources.ts reads (proper
// titles and series go in MOVIE_INFO there).
// Run it again whenever the folder changes; posters you remove are removed from the site too.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = 'movies';
const OUT = 'public/img/resources/movies';
const MANIFEST = 'src/data/movies.json';
const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

fs.mkdirSync(OUT, { recursive: true });
const files = fs.readdirSync(ROOT).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)).sort((a, b) => a.localeCompare(b));
const manifest = [];
for (const f of files) {
  const base = path.parse(f).name;
  const tag = base.match(/\((ultra ?)?(fav|dislike)\)/i);
  const rating = tag ? (tag[2].toLowerCase() === 'fav' ? 1 : -1) * (tag[1] ? 2 : 1) : 0;
  const name = base.replace(/\((ultra ?)?(fav|dislike)\)/i, '').trim();
  const id = slug(name);
  const out = path.join(OUT, `${id}.webp`);
  await sharp(path.join(ROOT, f)).rotate().resize({ width: 600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
  manifest.push({ id, name, rating, img: `/img/resources/movies/${id}.webp` });
}
const keep = new Set(manifest.map((m) => `${m.id}.webp`));
for (const f of fs.readdirSync(OUT)) if (!keep.has(f)) fs.rmSync(path.join(OUT, f));
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`${manifest.length} posters (${manifest.filter((m) => m.rating > 0).length} favourites, ${manifest.filter((m) => m.rating < 0).length} dislikes) → ${OUT}`);
