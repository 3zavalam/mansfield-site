// Live palette for the /iterate canvases: reads the CSS vars, re-reads when the switcher
// changes <html data-palette>, and blends `current` toward the new colours every frame.
export type RGB = [number, number, number];
export const CREAM: RGB = [251, 246, 236];
const KEYS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'ink'];

const hex = (v: string): RGB => {
  let h = v.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgba = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const rand = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
};
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const read = () => {
  const s = getComputedStyle(document.documentElement);
  return Object.fromEntries(KEYS.map((k) => [k, hex(s.getPropertyValue('--' + k))])) as Record<string, RGB>;
};
let target = read();
export const current: Record<string, RGB> = Object.fromEntries(KEYS.map((k) => [k, [...target[k]] as RGB]));
/** The six folder colours, in order, as currently blended. */
export const colors = () => [1, 2, 3, 4, 5, 6].map((n) => current['c' + n]);

new MutationObserver(() => { target = read(); })
  .observe(document.documentElement, { attributes: true, attributeFilter: ['data-palette'] });

let last = performance.now();
const tick = (now: number) => {
  const dt = Math.min((now - last) / 1000, .05); last = now;
  const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 5);
  KEYS.forEach((key) => { current[key] = mix(current[key], target[key], k); });
  requestAnimationFrame(tick);
};
requestAnimationFrame(tick);
