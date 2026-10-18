// Brings books, podcasts and museums in from the Obsidian vault: `npm run resources`.
//
// Reads (never writes) the vault at $VAULT (default /workspace/obsidian/obsidian-vault):
//   Main/Resources/Leer/Lista/*.md  one note per book; frontmatter `estado` + `next` give the status:
//                                   "Leyendo" → reading, "Leído" → read, "Pausado" → paused, `next: true` → next.
//                                   Bought-only, people (tipo: Persona) and EXCLUDE are left out.
//   Readwise/Books/*.md             the author (**Autor:**) and the first "**Mi nota:**" as a fallback note.
//   Main/Ideas/*.md                 podcast ideas: notes with `tipo: podcast` (titulo, show, link, fecha); the body,
//                                   his own bullet points, is kept word for word. Duplicates ("X 2.md") keep the newest;
//                                   "Prueba" (a test note) is skipped.
//   Main/Resources/Museos/*.md      "<Museum> - <City> (<mon> <year>).md"; the visit date is read from the text. Each
//                                   embedded photo (![[...]] in Attachments/) and the text under it becomes one piece,
//                                   grouped by the note's ## sections. Photos go to public/img/resources/museums/<visit>/
//                                   as 1600px WebP + 600px thumbs; sharp drops all EXIF/GPS metadata.
// House inspiration ("Casa", Main/Resources/Casa) is never imported anywhere on the site. Museums are read ONLY
// from Main/Resources/Museos/ (plus the photos those notes embed, from Attachments/). As guards: any note under a
// Casa/ folder or tagged casa/house, any museum ## section about the house ("Para la casa"), any line tagged
// #casa/#house, and the pieces listed in CASA_PIECES (a safety net) are all skipped.
// Personal/ is never read. Writes src/data/books.json, podcasts.json and museums.json (read by src/resources.ts).
// Notes in those files are edited by hand and kept as they are (even when empty); only a new entry gets its
// first "Mi nota" as a starting note. Re-running adds and removes entries.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const VAULT = process.env.VAULT ?? '/workspace/obsidian/obsidian-vault';
const OUT = 'src/data';
// Kept off the site on purpose (health / therapy / addiction).
const EXCLUDE = ['The Glucose Revolution', 'Sin miedo', 'In the Realm of Hungry Ghosts', 'Good Sugar Bad Sugar'];

// Safety net: house items by source note and piece title, in case a note still holds them.
const CASA_PIECES = { 'ROM - Toronto (oct 2026)': ['Platos celadon', 'Mesa tallada'] };
const CASA_TAGS = /^(casa|house)(\/|$)/i;
const CASA_SECTION = /\b(casa|house|home)\b/i;
const isCasaPath = (rel) => /(^|\/)Casa\//i.test(rel.split(path.sep).join('/'));
const tagsOf = (txt) => {
  const head = txt.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const inline = head.match(/^tags:\s*\[?([^\]\n]*)\]?\s*$/m)?.[1] ?? '';
  const list = [...head.matchAll(/^\s*-\s*(.+)$/gm)].filter((m) => /^tags:\s*$/m.test(head.slice(0, m.index))).map((m) => m[1]);
  const body = [...txt.matchAll(/(?:^|\s)#([\p{L}\w/-]+)/gu)].map((m) => m[1]);
  return [...inline.split(','), ...list, ...body].map((t) => t.trim().replace(/^["'#]|["']$/g, '')).filter(Boolean);
};
const isCasa = (rel, txt = '') => isCasaPath(rel) || tagsOf(txt).some((t) => CASA_TAGS.test(t));
const md = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort((a, b) => a.localeCompare(b)) : []);
const read = (f) => fs.readFileSync(f, 'utf8');
const front = (txt) => {
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  const o = {};
  for (const l of m ? m[1].split('\n') : []) { const k = l.match(/^(\w+):\s*(.*)$/); if (k) o[k[1]] = k[2].replace(/^"|"$/g, '').trim(); }
  return o;
};
const field = (txt, name) => txt.match(new RegExp(`\\*\\*${name}:\\*\\*\\s*(.+)`))?.[1].trim() || undefined;
const prev = (file, key) => { try { return new Map(JSON.parse(read(path.join(OUT, file))).map((x) => [key(x), x])); } catch { return new Map(); } };
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));
const write = (file, data) => { fs.writeFileSync(path.join(OUT, file), JSON.stringify(data, null, 2) + '\n'); console.log(`${file}: ${data.length}`); };

// Books
const RW_BOOKS = path.join(VAULT, 'Readwise/Books');
const oldBooks = prev('books.json', (b) => b.title);
const books = [];
for (const f of md(path.join(VAULT, 'Main/Resources/Leer/Lista'))) {
  const btxt = read(path.join(VAULT, 'Main/Resources/Leer/Lista', f));
  if (isCasa(path.join('Main/Resources/Leer/Lista', f), btxt)) continue;
  const fm = front(btxt);
  const [title, byline] = f.replace(/\.md$/, '').split(' — ');
  if (fm.tipo !== 'Libro' || EXCLUDE.includes(title)) continue;
  const status = fm.estado === 'Leyendo' ? 'reading' : fm.estado === 'Leído' ? 'read' : fm.estado === 'Pausado' ? 'paused' : fm.next === 'true' ? 'next' : null;
  if (!status) continue;
  const link = fm.readwise?.match(/\[\[(?:Readwise\/Books\/)?([^\]|]+)/)?.[1];
  const rw = link && fs.existsSync(path.join(RW_BOOKS, `${link}.md`)) ? read(path.join(RW_BOOKS, `${link}.md`)) : '';
  const author = byline ?? (rw && field(rw, 'Autor'));
  const note = oldBooks.has(title) ? oldBooks.get(title).note : rw && field(rw, 'Mi nota');
  books.push(clean({ title, author, status, note }));
}
write('books.json', books);

// Podcasts: his ideas, one note per episode
const SKIP_PODCASTS = ['Prueba'];
const ideas = new Map();
const POD_DIRS = ['Main/Ideas', 'Main/Ideas/Podcasts'];
for (const f of POD_DIRS.flatMap((d) => md(path.join(VAULT, d)).map((n) => path.join(d, n)))) {
  const txt = read(path.join(VAULT, f));
  if (!/^tipo:\s*podcast\s*$/m.test(txt) || isCasa(f, txt)) continue;
  const head = txt.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const get = (k) => head.match(new RegExp(`^${k}:[ \\t]*(.*)$`, "m"))?.[1].trim().replace(/^'(.*)'$/, (_, v) => v.replace(/''/g, "'")).replace(/^"(.*)"$/, '$1').trim();
  const title = get('titulo') || path.basename(f).replace(/( \d+)?\.md$/, '');
  if (SKIP_PODCASTS.includes(title)) continue;
  const url = get('link') || head.match(/^link:\s*\n\s*-\s*(\S+)/m)?.[1];
  const date = get('fecha');
  const cover = get('portada') || head.match(/^portada:\s*\n\s*-\s*(\S+)/m)?.[1];
  const body = txt.slice(txt.indexOf('---', 3) + 3).split('\n').filter((l) => l.trim() && !/^!\[/.test(l.trim()))
    .map((l) => l.replace(/^\s*[-*⁠\u2060]+\s*/, (m) => (m.trim() ? '- ' : '')).replace(/[\u2060]/g, '').trim());
  const item = clean({ file: path.basename(f, '.md'), show: get('show') || 'Other', title, url, date, cover, ideas: body });
  const old = ideas.get(title);
  if (!old || (item.date ?? '') > (old.date ?? '') || (!old.show && item.show)) ideas.set(title, { ...old, ...item });
}
// Flat list, one entry per episode (the site shows one card each, with the show as a label).
const podcasts = [...ideas.values()].sort((x, y) => (y.date ?? '').localeCompare(x.date ?? '') || x.title.localeCompare(y.title));
// Covers (`portada`): downloaded once into public/img/resources/podcasts/<slug>.webp so the site never hotlinks.
// A failed download keeps any earlier copy; no copy means the card falls back to the show's colours.
const POD_IMG = path.resolve('public/img/resources/podcasts');
fs.mkdirSync(POD_IMG, { recursive: true });
const pslug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
for (const p of podcasts) {
  const src = p.cover, name = pslug(p.file ?? p.title); delete p.cover; delete p.file;
  const file = path.join(POD_IMG, `${name}.webp`);
  if (src && !fs.existsSync(file)) {
    try {
      const r = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await sharp(Buffer.from(await r.arrayBuffer())).resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(file);
    } catch (e) { console.warn(`podcast cover failed: ${p.title}: ${e.message}`); }
  }
  if (fs.existsSync(file)) p.img = `/img/resources/podcasts/${path.basename(file)}`;
}
write('podcasts.json', podcasts);

// Museums
const MONTHS = { ene: 1, jan: 1, feb: 2, mar: 3, abr: 4, apr: 4, may: 5, jun: 6, jul: 7, ago: 8, aug: 8, sep: 9, oct: 10, nov: 11, dic: 12, dec: 12 };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const oldMuseums = prev('museums.json', (m) => `${m.city}|${m.date?.slice(0, 7)}`);
const museums = [];
for (const f of md(path.join(VAULT, 'Main/Resources/Museos'))) {
  const m = f.match(/^(.+?) - (.+?) \((\w+)\.? (\d{4})\)\.md$/);
  if (!m) continue;
  const [, short, city, mon, year] = m;
  const txt = read(path.join(VAULT, 'Main/Resources/Museos', f));
  if (isCasa(path.join('Main/Resources/Museos', f), txt)) continue;
  const skipTitles = CASA_PIECES[f.replace(/\.md$/, '')] ?? [];
  const full = txt.match(new RegExp(`${short} \\(([^)]+)\\)`))?.[1];
  const day = txt.match(/el (\d{1,2}) de (\w+) de (\d{4})/);
  const month = String(MONTHS[mon.toLowerCase().slice(0, 3)]).padStart(2, '0');
  const date = day && MESES.indexOf(day[2].toLowerCase()) >= 0
    ? `${day[3]}-${String(MESES.indexOf(day[2].toLowerCase()) + 1).padStart(2, '0')}-${day[1].padStart(2, '0')}`
    : `${year}-${month}`;
  const old = oldMuseums.get(`${city}|${date.slice(0, 7)}`);
  const id = `${short}-${city}-${date.slice(0, 7)}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const imgDir = path.join('public/img/resources/museums', id);
  fs.rmSync(imgDir, { recursive: true, force: true });
  fs.mkdirSync(imgDir, { recursive: true });
  const pieces = [];
  let section;
  let cur;
  for (const line of txt.split('\n')) {
    const h = line.match(/^##\s+(.+)/);
    if (h) { section = h[1].trim(); cur = undefined; continue; }
    if (section && CASA_SECTION.test(section)) continue; // e.g. "## Para la casa"
    if (/(?:^|\s)#(casa|house)\b/i.test(line)) { cur = undefined; continue; }
    const e = line.match(/^!\[\[([^\]|]+\.(?:jpe?g|png|webp|heic))(?:\|[^\]]*)?\]\]/i);
    if (e) {
      const src = path.join(VAULT, 'Attachments', e[1]);
      const slug = e[1].replace(/\.[^.]+$/, '').replace(/^.*? - /, '');
      const skipped = skipTitles.some((t) => t.toLowerCase() === slug.toLowerCase());
      if (!fs.existsSync(src) || skipped) { cur = skipped ? null : undefined; continue; }
      const name = slug.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
      const big = await sharp(src).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(imgDir, `${name}.webp`));
      await sharp(src).rotate().resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(imgDir, `${name}-sm.webp`));
      cur = { section, title: slug.charAt(0).toUpperCase() + slug.slice(1), text: [], img: `/img/resources/museums/${id}/${name}.webp`, sm: `/img/resources/museums/${id}/${name}-sm.webp`, w: big.width, h: big.height };
      pieces.push(cur);
      continue;
    }
    if (!line.trim() || /^\[\[.*\]\]$/.test(line.trim())) continue;
    if (!section) continue; // the intro line
    if (cur === null) continue; // the text under a skipped (house) photo
    if (!cur) { cur = { section, text: [] }; pieces.push(cur); }
    cur.text.push(line.trim());
  }
  const out = pieces.map(({ text, ...p }) => clean({ ...p, note: text.join('\n') }));
  museums.push(clean({ name: old?.name ?? (full ? `${full} (${short})` : short), city, date, note: old?.note, pieces: out }));
}
write('museums.json', museums);
