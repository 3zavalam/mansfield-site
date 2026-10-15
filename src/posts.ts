import { getCollection } from 'astro:content';
// Drafts are shown (clearly labelled) so Emilio can review them on the live site.
// Flip SHOW_DRAFTS to false to hide them in production.
export const SHOW_DRAFTS = true;
// Title and subtitle as one line of plain text (page titles, RSS, alt text).
export const fullTitle = (p: { data: { title: string; subtitle?: string } }) => (p.data.subtitle ? `${p.data.title}: ${p.data.subtitle}` : p.data.title);
export async function getPosts() {
  const all = await getCollection('writing', (p) => SHOW_DRAFTS || !p.data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// Monthly memos, newest first. Each is called "Memo of October, 2026", plus ": its title" if it has one.
export const monthName = (month: string) => new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }) + `, ${month.slice(0, 4)}`;
export const memoName = (m: { data: { month: string; title?: string } }) => `Memo of ${monthName(m.data.month)}${m.data.title ? `: ${m.data.title}` : ''}`;
export async function getMemos() {
  const all = await getCollection('memos', (m) => SHOW_DRAFTS || !m.data.draft);
  return all.sort((a, b) => b.data.month.localeCompare(a.data.month));
}
