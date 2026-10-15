// Posters of the /iterate site. Each one becomes /iterate/<slug>.
export type Section = { slug: string; label: string; art: 'grid' | 'waves' | 'orbit' };
export const SECTIONS: Section[] = [
  { slug: 'projects', label: 'Projects', art: 'grid' },
  { slug: 'resources', label: 'Resources', art: 'waves' },
  { slug: 'personal', label: 'Personal', art: 'orbit' },
];

// Colour palettes for the switcher. bg is a mid-tone (neither day nor night); c1–c6 colour the posters.
export type Palette = { id: string; name: string; bg: string; ink: string; colors: string[] };
export const PALETTES: Palette[] = [
  { id: 'citrus', name: 'Citrus', bg: '#b7b1a6', ink: '#25211b', colors: ['#ffd23f', '#ff6b6b', '#4ecdc4', '#6c9cff', '#ff9f43', '#a3e05b'] },
  { id: 'lagoon', name: 'Lagoon', bg: '#9ea8ac', ink: '#1b2428', colors: ['#2ed3e6', '#ffcd4a', '#ff7aa2', '#7ee08a', '#8f7bff', '#ff9b54'] },
  { id: 'sorbet', name: 'Sorbet', bg: '#b9a8ab', ink: '#2a1f22', colors: ['#ff7eb6', '#ffb84d', '#6fd6ff', '#b4e66b', '#c59bff', '#ff8a65'] },
];
// Which palette colour (1–6) each poster uses, by position.
const TINTS = [1, 2, 3];
export const tintIndex = (slug: string) => TINTS[SECTIONS.findIndex((s) => s.slug === slug)] ?? 1;
export const tint = (slug: string) => `var(--c${tintIndex(slug)})`;
