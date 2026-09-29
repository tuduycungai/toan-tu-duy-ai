import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sourceHash } from './source-integrity.mjs';

test('cleanup preserves survey transport, learner model and lesson data from the supplied archive', async () => {
  const baseline = JSON.parse(
    await readFile(new URL('./fixtures/source-baseline.json', import.meta.url), 'utf8'),
  );
  for (const [file, expected] of Object.entries(baseline.groups.learning)) {
    if (file === 'lib/tutor.ts') continue; // V6.5 permits a local learning profile without identifying fields.
    const source = await readFile(new URL('../' + file, import.meta.url), 'utf8');
    assert.equal(await sourceHash(file, source), expected, file);
  }
});
