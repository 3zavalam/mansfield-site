// Attributes for a demo photo made by scripts/optimize-images.mjs: WebP at 800 and 1600 px wide,
// so phones download the small one. `base` is the path without the -800/-1600 suffix.
export const pic = (base: string, sizes = '100vw', eager = false) => ({
  src: `${base}-1600.webp`,
  srcset: `${base}-800.webp 800w, ${base}-1600.webp 1600w`,
  sizes,
  loading: eager ? ('eager' as const) : ('lazy' as const),
  fetchpriority: eager ? ('high' as const) : ('auto' as const),
  decoding: 'async' as const,
});
