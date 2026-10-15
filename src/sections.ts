// The site's sections. Each one is /<slug>; the header and the home grid use the same list.
export type Kind = 'pitch' | 'book' | 'postcard' | 'circuit' | 'clipboard' | 'museum' | 'camera' | 'mic' | 'cover' | 'reel' | 'goals' | 'weeks';
export type Section = { slug: string; label: string; kind: Kind };
export const SECTIONS: Section[] = [
  { slug: 'projects', label: 'Projects', kind: 'pitch' },
  { slug: 'personal', label: 'Personal', kind: 'circuit' },
  { slug: 'analysis', label: 'Analysis', kind: 'clipboard' },
  { slug: 'resources', label: 'Resources', kind: 'book' },
];
export const HOME = '/';
export const href = (slug: string) => `/${slug}`;
export const NAV: [string, string][] = SECTIONS.map((s) => [s.label, href(s.slug)]);
