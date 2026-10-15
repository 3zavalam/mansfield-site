// What the /personal page shows: goals, a few life events, and life in weeks up to 90.
// Edit the dates here; the page recomputes the weeks in the browser every time it loads.

// TODO(Emilio): real birth date. 2004-01-01 is a placeholder.
export const BIRTH = '2004-01-01';
export const YEARS = 90;
export const WEEKS_PER_YEAR = 52;

// done: already happened. Otherwise it's still ahead.
export const GOALS: { goal: string; when: string; done?: boolean }[] = [
  { goal: 'Graduate in Computer Systems Engineering', when: '2026', done: true },
  { goal: 'Work in football', when: '2026', done: true },
  { goal: 'Land my first 5 freelance clients', when: 'Early 2027' },
  { goal: 'Move to Valencia for a master’s', when: 'Feb 2027' },
  { goal: 'Publish 12 club analyses', when: 'End of 2027' },
  { goal: 'Live off what I like doing', when: 'Someday' },
];

// Stretches of life marked on the grid (to: undefined means "until now"). Everything else lived is plain black.
export const EVENTS: { label: string; from: string; to?: string; color: string }[] = [
  { label: 'Uni', from: '2021-08-01', to: '2026-05-31', color: '#93ad91' },
  { label: 'Montreal', from: '2026-05-01', to: '2026-08-31', color: '#7fa3c4' },
];

const WEEK = 7 * 24 * 60 * 60 * 1000;
export const weekOf = (date: string | Date) => Math.max(0, Math.floor((new Date(date).getTime() - new Date(BIRTH).getTime()) / WEEK));

export const lifeWeeks = (now = new Date()) => {
  const total = YEARS * WEEKS_PER_YEAR;
  const lived = Math.min(total, weekOf(now));
  return { total, lived, pct: (lived / total) * 100, age: (now.getTime() - new Date(BIRTH).getTime()) / (365.25 * 24 * 60 * 60 * 1000) };
};

// One SVG path of small squares for weeks [from, to): row = year of life, column = week of that year.
export const CELL = 10, BOX = 7.4;
export const squares = (from: number, to: number) => {
  let d = '';
  for (let w = from; w < to; w++) {
    const x = (w % WEEKS_PER_YEAR) * CELL, y = Math.floor(w / WEEKS_PER_YEAR) * CELL;
    d += `M${x} ${y}h${BOX}v${BOX}h${-BOX}z`;
  }
  return d;
};

// Where "Now" sits on Seth Godin's Dip curve: 0 = just started, ~0.5 = the bottom of the dip, 1 = through it.
export const DIP_ME = 0.08;
