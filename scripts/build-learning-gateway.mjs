import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const parts = await Promise.all(
  ['server/learning/domain.mjs', 'server/learning/engine.mjs'].map((p) =>
    readFile(new URL(p, root), 'utf8'),
  ),
);
const text =
  '// Generated from server/learning/domain.mjs and engine.mjs. Edit sources, then run npm run build:gateway.\n' +
  parts.map((s) => s.replace(/^import\s+[\s\S]*?;\s*\n/gm, '').replace(/^export /gm, '')).join('\n');
await writeFile(new URL('google-apps-script/Domain.gs', root), text);
