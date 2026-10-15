import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(), // shown after the title, not bold
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});
// One memo a month, for /personal: src/content/memos/<yyyy-mm>.md. Files starting with _ are skipped
// (see _template.md).
const memos = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/memos' }),
  schema: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/), // e.g. 2026-10
    title: z.string().optional(), // shown as "Memo of October, 2026: <title>"
    draft: z.boolean().default(false),
  }),
});
export const collections = { writing, memos };
