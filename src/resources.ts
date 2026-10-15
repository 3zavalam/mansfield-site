// Everything the /resources pages show. Add your own entries here; anything marked `sample: true` is a
// placeholder (the pages show a small notice while any samples are left in a list).
//
// Images go in public/img/resources/<kind>/ and are referenced as '/img/resources/<kind>/file.jpg'.
// Without an image, an entry is drawn from its `tone` (two colours) so the layout still works.

import { TRIPS } from './trips';
import moviePosters from './data/movies.json';

type Tone = [string, string];

export type Movie = { title: string; year?: string; img?: string; tone?: Tone; rating?: number; series?: boolean; doc?: boolean; sample?: boolean };
export type Book = { title: string; author: string; sample?: boolean };
export type Podcast = { name: string; hosts?: string; img?: string; tone?: Tone; comment: string; sample?: boolean };
export type MuseumPiece = { museum: string; city: string; year?: string; title: string; note: string; img?: string; tone?: Tone; size?: 's' | 'm' | 'l'; sample?: boolean };

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

// From the old portfolio's reading list. TODO(Emilio): the rest of the shelf.
export const BOOKS: Book[] = [
  { title: 'Goal: The Ball Doesn’t Go In By Chance', author: 'Ferran Soriano' },
  { title: 'Excellent Advice for Living', author: 'Kevin Kelly' },
  { title: 'The Dip', author: 'Seth Godin' },
  ...Array.from({ length: 9 }, (_, i) => ({ title: `Book ${String(i + 1).padStart(2, '0')}`, author: 'Author', sample: true })),
];

export const PODCASTS: Podcast[] = [
  { name: 'Acquired', hosts: 'Ben Gilbert & David Rosenthal', tone: ['#1d1d1f', '#3a3a3e'], comment: 'Their Microsoft episode is the reason this site is called Mansfield: I liked how they named things and wanted a name like that.' },
  ...Array.from({ length: 5 }, (_, i) => ({ name: `Podcast ${String(i + 1).padStart(2, '0')}`, hosts: 'Hosts', tone: tone(i + 3), comment: 'Your comment about this podcast goes here.', sample: true })),
];

// Photos are per trip, from the disposable cameras: see src/trips.ts and `npm run photos`.
export const PHOTOS = TRIPS.flatMap((t) => t.photos);

// TODO(Emilio): one entry per photo: what caught your eye, and where.
export const MUSEUMS: MuseumPiece[] = [
  { museum: 'Museum name', city: 'City', year: '2025', title: 'What caught my eye', note: 'Why it was curious, in a line or two.', tone: tone(1), size: 'l', sample: true },
  { museum: 'Museum name', city: 'City', year: '2025', title: 'A detail', note: 'Why it was curious.', tone: tone(4), size: 's', sample: true },
  { museum: 'Museum name', city: 'City', year: '2024', title: 'Another one', note: 'Why it was curious.', tone: tone(7), size: 'm', sample: true },
  { museum: 'Museum name', city: 'City', year: '2024', title: 'A strange object', note: 'Why it was curious.', tone: tone(2), size: 'm', sample: true },
  { museum: 'Museum name', city: 'City', year: '2023', title: 'A room', note: 'Why it was curious.', tone: tone(9), size: 'l', sample: true },
  { museum: 'Museum name', city: 'City', year: '2023', title: 'Small thing', note: 'Why it was curious.', tone: tone(5), size: 's', sample: true },
];

export const COLLECTIONS = [
  { slug: 'museums', label: 'Museums', kind: 'museum', note: 'Curious things, one photo each', color: '#ffe680', list: MUSEUMS },
  { slug: 'photos', label: 'Photos', kind: 'camera', note: 'Disposable camera', color: '#ffb8c6', list: PHOTOS },
  { slug: 'podcasts', label: 'Podcasts', kind: 'mic', note: 'What I think of them', color: '#b6e3f4', list: PODCASTS },
  { slug: 'books', label: 'Books', kind: 'cover', note: 'The shelf', color: '#c6f0b8', list: BOOKS },
  { slug: 'movies', label: 'Movies', kind: 'reel', note: 'Films, series and documentaries', color: '#ffcf9e', list: MOVIES },
] as const;

export const hasSamples = (list: readonly { sample?: boolean }[]) => list.some((x) => x.sample);
export const bg = (t?: Tone) => (t ? `linear-gradient(150deg, ${t[0]}, ${t[1]})` : '#ddd');
