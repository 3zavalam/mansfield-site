// Turns the source photos in assets-src/ into small WebP files in public/img/.
//   assets-src/demos/<site>/<name>.jpg → public/img/demos/<site>/<name>-800.webp and -1600.webp
//   assets-src/webs/<id>.jpg           → public/img/webs/<id>-480.webp (desktop icon) and -1200.webp (window)
// Run with `npm run images` after adding or replacing a photo.
import sharp from 'sharp';
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { join, parse } from 'node:path';

const jobs = [
  { from: 'assets-src/demos', to: 'public/img/demos', widths: [800, 1600], quality: 70 },
  { from: 'assets-src/webs', to: 'public/img/webs', widths: [480, 1200], quality: 74 },
];
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

let total = 0;
for (const { from, to, widths, quality } of jobs) {
  for (const file of walk(from).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
    const { dir, name } = parse(file);
    const outDir = join(to, dir.slice(from.length));
    mkdirSync(outDir, { recursive: true });
    for (const w of widths) {
      const out = join(outDir, `${name}-${w}.webp`);
      const info = await sharp(file).resize({ width: w, withoutEnlargement: true }).webp({ quality, effort: 6 }).toFile(out);
      total += info.size;
    }
  }
}
console.log(`done: ${(total / 1024).toFixed(0)} KB written`);
