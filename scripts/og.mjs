import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chrome' });
for (const [src, out] of [['og-clinicas', 'og-clinicas'], ['og-mansfield', 'og']]) {
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('file://' + process.cwd() + `/scripts/${src}.html`); await p.waitForTimeout(1500);
  await p.screenshot({ path: `public/${out}.png` });
}
await b.close();
