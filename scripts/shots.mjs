import { chromium } from 'playwright';
const b = await chromium.launch();
const mode = process.argv[2];
if (mode === 'og') {
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('file://' + process.cwd() + '/scripts/og.html'); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'public/og.png' });
  const f = await b.newPage({ viewport: { width: 180, height: 180 } });
  await f.setContent(`<body style="margin:0">${(await import('fs')).readFileSync('public/favicon.svg','utf8').replace('<svg ','<svg width="180" height="180" ')}</body>`);
  await f.screenshot({ path: 'public/apple-touch-icon.png' });
} else {
  const pages = ['/', '/writing/', '/writing/why-im-running-down-my-dream/', '/work-with-me/', '/projects/', '/now/', '/about/'];
  for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) for (const dark of [false, true]) {
    if (dark && tag === 'mobile') continue;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: dark ? 'dark' : 'light', deviceScaleFactor: tag === 'mobile' ? 2 : 1 });
    const p = await ctx.newPage();
    for (const u of pages) {
      if (dark && u !== '/') continue;
      await p.goto('http://localhost:4321' + u, { waitUntil: 'networkidle' });
      const name = (u.replace(/\//g, '_').replace(/^_|_$/g, '') || 'home');
      await p.screenshot({ path: `screenshots/${tag}${dark ? '-dark' : ''}-${name}.png`, fullPage: true });
    }
  }
}
await b.close();
