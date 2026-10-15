// What the /personal page shows: goals, a few life events, and life in weeks up to 90.
// Edit the dates here; the page recomputes the weeks in the browser every time it loads.

// TODO(Emilio): real birth date. 2004-01-01 is a placeholder.
export const BIRTH = '2004-01-01';
export const YEARS = 90;
export const WEEKS_PER_YEAR = 52;

// Each goal: when I set it (set), the deadline (by; left out for open-ended ones, `when` is how it's shown)
// and the day it was done, if it was. analyses: the goal is that many published analyses, so its progress
// is counted from the posts. missions: the small steps toward it; give one a done date when it's done.
// Open goals show first, in this order; done ones go below, newest first.
export type Mission = { task: string; done?: string };
export type Goal = { goal: string; when: string; set: string; by?: string; done?: string; analyses?: number; missions?: Mission[] };
export const GOALS: Goal[] = [
  // TODO(Emilio): the missions are a first draft; make them yours.
  {
    goal: 'Publish 15 analyses', when: 'End of 2026', set: '2026-10-14', by: '2026-12-31', analyses: 15,
    missions: [
      { task: 'Publish the first one', done: '2026-10-13' },
      { task: 'List the next 14 clubs to analyse' },
      { task: 'Get to 5 by mid-November' },
      { task: 'Get to 10 by early December' },
    ],
  },
  {
    goal: 'Find an income stream', when: 'Feb 2027', set: '2026-10-14', by: '2027-02-28',
    missions: [
      { task: 'Decide what to sell, and for how much' },
      { task: 'Put it on the Work with me page' },
      { task: 'Pitch 10 clubs, agencies or media' },
      { task: 'Get the first paid job' },
    ],
  },
  {
    goal: 'Get a job in the sports industry, in Europe or the US', when: 'End of 2027', set: '2026-10-14', by: '2027-12-31',
    missions: [
      { task: 'CV and portfolio in English' },
      { task: 'List 30 clubs and companies I’d want to work for' },
      { task: 'Send my work to someone at 10 of them' },
      { task: 'Apply to 20 roles' },
    ],
  },
  {
    goal: 'Read 2 books a month', when: 'For life', set: '2026-10-14',
    missions: [
      { task: 'Pick next month’s 2 books before it starts' },
      { task: 'Read 20 minutes every day' },
      { task: 'Add each finished one to the Books shelf' },
    ],
  },
  { goal: 'Graduate in Computer Systems Engineering', when: '2026', set: '2022-08-01', by: '2026-05-31', done: '2026-05-31' },
  // TODO(Emilio): the real dates for this one (when you set it, and when it was done).
  { goal: 'Spend a summer in Canada', when: 'Summer 2026', set: '2026-01-01', by: '2026-08-31', done: '2026-08-31' },
];

// Stretches of life marked on the grid (to: undefined means "until now"). Everything else lived is plain black.
export const EVENTS: { label: string; from: string; to?: string; color: string }[] = [
  { label: 'Uni', from: '2022-08-01', to: '2026-05-31', color: '#93ad91' },
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
