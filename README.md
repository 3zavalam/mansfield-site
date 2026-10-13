# getmansfield.com — Runnin' Down My Dream

Emilio Zavala Miceli's personal and freelance site. Astro 5 + Tailwind 4, fully static.

- `npm install && npm run build` → static output in `dist/`
- Posts: add Markdown to `src/content/writing/` (frontmatter: title, description, date, draft, tags). Template: `templates/analysis-template.md`.
- Drafts are shown with a "Draft" label; set `SHOW_DRAFTS = false` in `src/posts.ts` to hide them.
- Placeholders: `UPWORK_URL` and `X_URL` in `src/consts.ts`.
- Screenshots: `npm run preview` then `node scripts/shots.mjs` (OG image: `node scripts/shots.mjs og`).
