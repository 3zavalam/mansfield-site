import { getPosts } from '../posts';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
export async function GET({ site }: { site: URL }) {
  const posts = await getPosts();
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const items = posts.map((p) => `<item><title>${esc(p.data.title)}</title><link>${new URL(`/writing/${p.id}`, site)}</link><guid>${new URL(`/writing/${p.id}`, site)}</guid><pubDate>${p.data.date.toUTCString()}</pubDate><description>${esc(p.data.description)}</description></item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(SITE_TITLE)}</title><link>${site}</link><description>${esc(SITE_DESCRIPTION)}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
