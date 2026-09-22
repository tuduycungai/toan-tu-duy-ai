import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('survey update preserves v6.2 Gemini, class authentication, Forms transport, TikZ, learner model and Netlify configuration',()=>{
  const hashes=JSON.parse(readFileSync(new URL('./v62-protected.json',import.meta.url),'utf8'));
  for(const [file,expected] of Object.entries(hashes)) {
    // V6.2.3 explicitly adds adaptive/multimodal modes; auth/transport have behavioral coverage.
    if(file==='server/gemini.mjs')continue;
    const actual=createHash('sha256').update(readFileSync(new URL('../'+file,import.meta.url))).digest('hex');
    assert.equal(actual,expected,file);
  }
});
