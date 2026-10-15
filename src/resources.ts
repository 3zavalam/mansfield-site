// Everything the /resources pages show. Add your own entries here; anything marked `sample: true` is a
// placeholder (the pages show a small notice while any samples are left in a list).
//
// Images go in public/img/resources/<kind>/ and are referenced as '/img/resources/<kind>/file.jpg'.
// Without an image, an entry is drawn from its `tone` (two colours) so the layout still works.

import { TRIPS } from './trips';
import moviePosters from './data/movies.json';
import bookList from './data/books.json';
import podcastList from './data/podcasts.json';
import museumList from './data/museums.json';

type Tone = [string, string];

export type Movie = { title: string; year?: string; img?: string; tone?: Tone; rating?: number; series?: boolean; doc?: boolean; sample?: boolean };
export type Book = { title: string; author?: string; status: 'reading' | 'read' | 'paused' | 'next'; note?: string; sample?: boolean };
export type Episode = { title: string; url?: string; date?: string; ideas?: string[] };
export type PodcastEpisode = Episode & { show: string; hosts?: string; img?: string; tone?: Tone; sample?: boolean };
export type Podcast = { name: string; hosts?: string; img?: string; tone?: Tone; comment?: string; episodes: Episode[]; sample?: boolean };
export type MuseumPiece = { museum: string; city: string; year?: string; title?: string; note?: string; section?: string; img?: string; sm?: string; w?: number; h?: number; tone?: Tone; size?: 's' | 'm' | 'l'; sample?: boolean };

const sampleTones: Tone[] = [['#2f5d8a', '#13253a'], ['#c8553d', '#5b2117'], ['#2e6b4f', '#123224'], ['#e0a83e', '#7a4a10'], ['#6b4f8a', '#2a1d3b'], ['#1f1f22', '#55555c'], ['#b7413e', '#3b0f0e'], ['#3d7c8c', '#13323a'], ['#8a6e4f', '#33281b'], ['#d9734e', '#5c2a17'], ['#4a5a3a', '#1b2216'], ['#a3485f', '#3a1420']];
const tone = (i: number) => sampleTones[i % sampleTones.length];

// The posters come from movies/ (`npm run movies`, which also reads the rating from the file name: "(fav)",
// "(ultrafav)", "(dislike)", "(ultradislike)"). Here each poster gets its proper title, series and
// documentaries are marked, and `sort` orders a saga; a poster missing here shows its file name.
const MOVIE_INFO: Record<string, { title: string; series?: boolean; doc?: boolean; sort?: string }> = {
  '50-50': { title: '50/50' },
  '500-days-of-summer': { title: '(500) Days of Summer' },
  '72-hours': { title: '72 Hours' },
  'a-haunted-house': { title: 'A Haunted House' },
  'a-time-to-kill': { title: 'A Time to Kill' },
  'anyone-but-you': { title: 'Anyone but You' },
  'being-eddie': { title: 'Being Eddie', doc: true },
  'delivery-man': { title: 'Delivery Man' },
  'dont-say-good-luck': { title: 'Don’t Say Good Luck' },
  'dudes-wheres-my-car': { title: 'Dude, Where’s My Car?' },
  'el-futbol-o-yo': { title: 'El fútbol o yo' },
  'friends': { title: 'Friends', series: true },
  'famous-last-words-eric-dane': { title: 'Famous Last Words: Eric Dane', series: true, doc: true },
  'i-love-you-beth-cooper': { title: 'I Love You, Beth Cooper' },
  'last-dance': { title: 'The Last Dance', series: true, doc: true },
  'ladies-first': { title: 'Ladies First' },
  'marty-supreme': { title: 'Marty Supreme' },
  'office-romance': { title: 'Office Romance' },
  'people-we-meet-on-vacation': { title: 'People We Meet on Vacation' },
  'rafa': { title: 'Rafa', series: true, doc: true },
  'rockstar-duki': { title: 'Rockstar: Duki desde el fin del mundo', doc: true },
  'springsteen': { title: 'Springsteen: Deliver Me from Nowhere' },
  'starting-5': { title: 'Starting 5', series: true, doc: true },
  'the-break-up': { title: 'The Break-Up' },
  'the-dink': { title: 'The Dink' },
  'the-minimalists': { title: 'The Minimalists: Less Is Now', doc: true },
  'voicemails-for-isabelle': { title: 'Voicemails for Isabelle' },
  'young-sheldon': { title: 'Young Sheldon', series: true },
  '17-again': { title: '17 Again' },
  'about-time': { title: 'About Time' },
  'barbie': { title: 'Barbie' },
  'bride-wars': { title: 'Bride Wars' },
  'devil-wears-prada': { title: 'The Devil Wears Prada' },
  'devil-wears-prada-2': { title: 'The Devil Wears Prada 2' },
  'diary-of-a-princess': { title: 'The Princess Diaries' },
  'diary-of-a-princess-2': { title: 'The Princess Diaries 2: Royal Engagement' },
  'digger': { title: 'Digger' },
  'el-juego-perfecto': { title: 'The Perfect Game' },
  'glam-girls': { title: 'The Hustle' },
  'high-school-musical-i': { title: 'High School Musical' },
  'high-school-musical-2': { title: 'High School Musical 2' },
  'high-school-musical-3': { title: 'High School Musical 3: Senior Year' },
  'im-leyend': { title: 'I Am Legend' },
  'inception': { title: 'Inception' },
  'interstellar': { title: 'Interstellar' },
  'love-other-drugs': { title: 'Love & Other Drugs' },
  'mickey-17': { title: 'Mickey 17' },
  'one-day': { title: 'One Day' },
  'oppenheimer': { title: 'Oppenheimer' },
  'star-wars-episode-1': { title: 'Star Wars: Episode I – The Phantom Menace', sort: 'Star Wars 1' },
  'star-wars-episode-ii': { title: 'Star Wars: Episode II – Attack of the Clones', sort: 'Star Wars 2' },
  'star-wars-episode-iii': { title: 'Star Wars: Episode III – Revenge of the Sith', sort: 'Star Wars 3' },
  'star-wars-episode-iv': { title: 'Star Wars: Episode IV – A New Hope', sort: 'Star Wars 4' },
  'star-wars-episode-v': { title: 'Star Wars: Episode V – The Empire Strikes Back', sort: 'Star Wars 5' },
  'star-wars-episode-vi': { title: 'Star Wars: Episode VI – Return of the Jedi', sort: 'Star Wars 6' },
  'star-wars-episode-vii': { title: 'Star Wars: Episode VII – The Force Awakens', sort: 'Star Wars 7' },
  'star-wars-episode-viii': { title: 'Star Wars: Episode VIII – The Last Jedi', sort: 'Star Wars 8' },
  'star-wars-episode-ix': { title: 'Star Wars: Episode IX – The Rise of Skywalker', sort: 'Star Wars 9' },
  'ted-lasso': { title: 'Ted Lasso', series: true },
  'the-idea-of-you': { title: 'The Idea of You' },
  'the-intern': { title: 'The Intern' },
  'the-odyssey': { title: 'The Odyssey' },
  'valentines-day': { title: 'Valentine’s Day' },
};
// Best rated first (dislikes last), then by title.
const sortKey = (id: string, name: string) => (MOVIE_INFO[id]?.sort ?? MOVIE_INFO[id]?.title ?? name).replace(/^\W+/, '');
export const MOVIES: Movie[] = moviePosters
  .map((p) => ({ ...p, key: sortKey(p.id, p.name) }))
  .sort((a, b) => b.rating - a.rating || a.key.localeCompare(b.key, 'en', { numeric: true }))
  .map((p) => ({ title: MOVIE_INFO[p.id]?.title ?? p.name, series: MOVIE_INFO[p.id]?.series, doc: MOVIE_INFO[p.id]?.doc, rating: p.rating, img: p.img }));

// From the vault (`npm run resources`, see scripts/import-obsidian.mjs): src/data/books.json.
export const BOOK_STATUS = [['reading', 'Reading'], ['read', 'Read'], ['paused', 'Paused'], ['next', 'Next']] as const;
export const BOOKS: Book[] = bookList as Book[];
// Favorites, kept here so `npm run resources` never touches them. Matched by title against the vault's list;
// a favorite that isn't in the list carries its own author.
const FAVORITES: { title: string; author?: string }[] = [
  { title: "Goal - The Ball Doesn't Go In By Chance" },
  { title: 'Running Down a Dream' },
  { title: 'What I Talk About When I Talk About Running', author: 'Haruki Murakami' },
  { title: 'Thinking, Fast and Slow' },
  { title: 'Excellent Advice for Living' },
];
export const FAVORITE_BOOKS: Book[] = FAVORITES.map((f) => BOOKS.find((b) => b.title === f.title) ?? { title: f.title, author: f.author, status: 'read' });

// His podcast ideas from the vault (Main/Ideas, `tipo: podcast`; see scripts/import-obsidian.mjs), one card per episode.
const PODCAST_INFO: Record<string, { hosts?: string; comment?: string }> = {
  Acquired: { hosts: 'Ben Gilbert & David Rosenthal', comment: 'Their Microsoft episode is the reason this site is called Mansfield: I liked how they named things and wanted a name like that.' },
};
export const EPISODES: PodcastEpisode[] = podcastList.map((p, i) => ({ title: p.title, url: p.url, date: p.date, ideas: p.ideas, show: p.show ?? 'Other', hosts: PODCAST_INFO[p.show ?? '']?.hosts, tone: tone(i) }));
const shows = [...new Set(podcastList.map((p) => p.show ?? 'Other'))];
export const PODCASTS: Podcast[] = shows
  .map((name, i) => ({ name, ...PODCAST_INFO[name], tone: tone(i), episodes: podcastList.filter((p) => (p.show ?? 'Other') === name).map(({ title, url, date, ideas }) => ({ title, url, date, ideas })) }))
  .sort((a, b) => b.episodes.length - a.episodes.length || a.name.localeCompare(b.name));

// Photos are per trip, from the disposable cameras: see src/trips.ts and `npm run photos`.
export const PHOTOS = TRIPS.flatMap((t) => t.photos);

// Visits from the vault (src/data/museums.json): every photo and curiosity in the museum's note.
const fmtMonth = (d: string) => new Date(`${d.slice(0, 7)}-01T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
export const MUSEUMS: MuseumPiece[] = museumList.flatMap((m, v) => (m.pieces ?? []).map((p, i) => ({
  museum: m.name, city: m.city, year: m.date ? fmtMonth(m.date) : undefined, title: p.title, note: p.note, section: p.section,
  img: p.img, sm: p.sm, w: p.w, h: p.h, tone: tone(v + i), size: p.w && p.h && p.h > p.w ? ('l' as const) : ('m' as const),
})));

// One entrance per museum visit; each gets its own page at /resources/museums/<slug>/. The entrance poster is
// the visit's cover from MUSEUM_COVERS (by slug; images in public/img/resources/museums/covers/, which
// `npm run resources` leaves alone), or else its first photo.
const MUSEUM_COVERS: Record<string, string> = {
  rom: '/img/resources/museums/covers/rom',
};
const slugify = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export type MuseumVisit = { slug: string; name: string; city: string; year?: string; note?: string; cover?: MuseumPiece; pieces: MuseumPiece[] };
export const MUSEUM_VISITS: MuseumVisit[] = museumList.map((m: { name: string; city: string; date?: string; slug?: string; note?: string }) => {
  const pieces = MUSEUMS.filter((p) => p.museum === m.name && p.city === m.city);
  const slug = m.slug ?? slugify(m.name.match(/\(([^)]+)\)\s*$/)?.[1] ?? m.name);
  const own = MUSEUM_COVERS[slug];
  const cover = own ? { museum: m.name, city: m.city, title: m.name, img: `${own}.webp`, sm: `${own}-sm.webp` } : pieces.find((p) => p.img);
  return { slug, name: m.name, city: m.city, year: m.date ? fmtMonth(m.date) : undefined, note: m.note, cover, pieces };
});

export const COLLECTIONS = [
  { slug: 'museums', label: 'Museums', kind: 'museum', note: 'Curious things, one photo each', color: '#ffe680', list: MUSEUMS },
  { slug: 'photos', label: 'Photos', kind: 'camera', note: 'Disposable camera', color: '#ffb8c6', list: PHOTOS },
  { slug: 'podcasts', label: 'Podcasts', kind: 'mic', note: 'What I think of them', color: '#b6e3f4', list: EPISODES },
  { slug: 'books', label: 'Books', kind: 'cover', note: 'The shelf', color: '#c6f0b8', list: BOOKS },
  { slug: 'movies', label: 'Movies', kind: 'reel', note: 'Films, series and documentaries', color: '#ffcf9e', list: MOVIES },
] as const;

export const hasSamples = (list: readonly { sample?: boolean }[]) => list.some((x) => x.sample);
export const bg = (t?: Tone) => (t ? `linear-gradient(150deg, ${t[0]}, ${t[1]})` : '#ddd');
