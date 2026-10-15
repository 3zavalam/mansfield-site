// Brings disposable-camera photos into the site: `npm run photos`.
//
// Every trip is a folder in disposables/ (next to package.json; DISPOSABLES=<dir> to use another), holding
// just the photos to publish.
// Each photo is turned upright (EXIF, plus ROTATE below for sideways scans), resized to a 1600px WebP plus
// a 640px thumbnail in public/img/resources/photos/<trip-slug>/, and listed in src/data/disposables.json,
// which the Photos page reads. Run it again whenever a folder changes; photos
// you remove are removed from the site too.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.env.DISPOSABLES ?? 'disposables';
const OUT = 'public/img/resources/photos';
const MANIFEST = 'src/data/disposables.json';
// Scans that came out sideways: trip slug → photo id → degrees clockwise.
const ROTATE = {};
const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const manifest = {};
for (const trip of fs.readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
  const s = slug(trip), out = path.join(OUT, s);
  const images = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|heic)$/i.test(f)).sort() : []);
  const src = path.join(ROOT, trip);
  const files = images(src);
  fs.mkdirSync(out, { recursive: true });
  const keep = new Set();
  const photos = [];
  for (const f of files) {
    const name = path.parse(f).name.replace(/ copy( \d+)?$/i, ''), big = `${name}.webp`, small = `${name}-sm.webp`;
    keep.add(big); keep.add(small);
    const from = path.join(src, f), to = path.join(out, big);
    if (!fs.existsSync(to) || fs.statSync(to).mtimeMs < fs.statSync(from).mtimeMs) {
      const turn = ROTATE[s]?.[name] ?? 0;
      const upright = () => sharp(from).rotate().rotate(turn);
      await upright().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(to);
      await upright().resize({ width: 640, height: 640, fit: 'inside' }).webp({ quality: 74 }).toFile(path.join(out, small));
    }
    const { width, height } = await sharp(to).metadata();
    photos.push({ id: name, src: `/img/resources/photos/${s}/${big}`, sm: `/img/resources/photos/${s}/${small}`, w: width, h: height });
  }
  for (const old of fs.readdirSync(out)) if (!keep.has(old)) fs.rmSync(path.join(out, old));
  manifest[s] = { name: trip, photos };
  console.log(`${trip}: ${photos.length} photo${photos.length === 1 ? '' : 's'}`);
}
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
