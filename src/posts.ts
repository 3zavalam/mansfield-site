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
