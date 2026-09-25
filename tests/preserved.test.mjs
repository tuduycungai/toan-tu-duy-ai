import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sourceHash } from './source-integrity.mjs';

const baseline = JSON.parse(
  await readFile(new URL('./fixtures/source-baseline.json', import.meta.url), 'utf8'),
);
// V6.3.1 intentionally repairs these surfaces. Behavioral coverage is in
// v630-openai and v631-drawing; the original cleanup hashes remain historical.
const updatedInV631 = new Set(['server/openai.mjs', 'server/feature-api.mjs', '.env.example']);
for (const group of ['api', 'deployment', 'styles']) {
  test(`V6.3.1 preserves unchanged V6.3.0 ${group} files`, async () => {
    for (const [file, expected] of Object.entries(baseline.groups[group])) {
      if (updatedInV631.has(file)) continue;
      const source = await readFile(new URL('../' + file, import.meta.url), 'utf8');
      assert.equal(await sourceHash(file, source), expected, file);
    }
  });
}
