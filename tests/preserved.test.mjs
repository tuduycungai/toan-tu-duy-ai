import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sourceHash } from './source-integrity.mjs';

const baseline = JSON.parse(
  await readFile(new URL('./fixtures/source-baseline.json', import.meta.url), 'utf8'),
);

// V6.5 intentionally integrates memory in both providers and adds function paths/rate limits.
const updatedInV631 = new Set([
  'server/openai.mjs',
  'server/feature-api.mjs',
  '.env.example',
  'server/gemini.mjs',
  'netlify.toml',
  'netlify/functions/chat.mjs',
]);
for (const group of ['api', 'deployment', 'styles']) {
  test(`V6.3.1 preserves unchanged V6.3.0 ${group} files`, async () => {
    const expectedFiles =
      group === 'styles' ? baseline.commentOnlyCleanup.styles : baseline.groups[group];
    for (const [file, expected] of Object.entries(expectedFiles)) {
      if (updatedInV631.has(file)) continue;
      const source = await readFile(new URL('../' + file, import.meta.url), 'utf8');
      assert.equal(await sourceHash(file, source), expected, file);
    }
  });
}
