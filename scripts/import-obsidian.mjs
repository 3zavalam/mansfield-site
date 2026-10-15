// Brings books, podcasts and museums in from the Obsidian vault: `npm run resources`.
//
// Reads (never writes) the vault at $VAULT (default /workspace/obsidian/obsidian-vault):
//   Main/Resources/Leer/Lista/*.md  one note per book; frontmatter `estado` + `next` give the status:
//                                   "Leyendo" → reading, "Leído" → read, "Pausado" → paused, `next: true` → next.
//                                   Bought-only, people (tipo: Persona) and EXCLUDE are left out.
//   Readwise/Books/*.md             the author (**Autor:**) and the first "**Mi nota:**" as a fallback note.
//   Readwise/Podcasts/*.md          one note per episode; **Autor:** is the show, source_url the link.
//   Main/Resources/Museos/*.md      "<Museum> - <City> (<mon> <year>).md"; the visit date is read from the text.
// Personal/ is never read. Writes src/data/books.json, podcasts.json and museums.json (read by src/resources.ts).
// Notes in those files are edited by hand and kept as they are (even when empty); only a new entry gets its
// first "Mi nota" as a starting note. Re-running adds and removes entries.
import fs from 'node:fs';
import path from 'node:path';

const VAULT = process.env.VAULT ?? '/workspace/obsidian/obsidian-vault';
const OUT = 'src/data';
// Kept off the site on purpose (health / therapy / addiction).
const EXCLUDE = ['The Glucose Revolution', 'Sin miedo', 'In the Realm of Hungry Ghosts', 'Good Sugar Bad Sugar'];

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
  const fm = front(read(path.join(VAULT, 'Main/Resources/Leer/Lista', f)));
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

// Podcasts
const oldPods = prev('podcasts.json', (p) => `${p.show}|${p.title}`);
const podcasts = [];
for (const f of md(path.join(VAULT, 'Readwise/Podcasts'))) {
  const txt = read(path.join(VAULT, 'Readwise/Podcasts', f));
  const show = field(txt, 'Autor');
  if (!show) continue;
  const title = f.replace(/\.md$/, '');
  const url = txt.match(/^source_url:\s*(\S+)/m)?.[1];
  const key = `${show}|${title}`;
  const note = oldPods.has(key) ? oldPods.get(key).note : field(txt, 'Mi nota');
  podcasts.push(clean({ show, title, url, note }));
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
  const full = txt.match(new RegExp(`${short} \\(([^)]+)\\)`))?.[1];
  const day = txt.match(/el (\d{1,2}) de (\w+) de (\d{4})/);
  const month = String(MONTHS[mon.toLowerCase().slice(0, 3)]).padStart(2, '0');
  const date = day && MESES.indexOf(day[2].toLowerCase()) >= 0
    ? `${day[3]}-${String(MESES.indexOf(day[2].toLowerCase()) + 1).padStart(2, '0')}-${day[1].padStart(2, '0')}`
    : `${year}-${month}`;
  const old = oldMuseums.get(`${city}|${date.slice(0, 7)}`);
  museums.push(clean({ name: old?.name ?? (full ? `${full} (${short})` : short), city, date, note: old?.note }));
}
write('museums.json', museums);
