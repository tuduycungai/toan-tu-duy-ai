import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
test('V4 preserves V3 auth, Gemini transport, Forms and deployment files',async()=>{
 const expected=JSON.parse(await readFile(new URL('./v2-preserved.json',import.meta.url),'utf8'));
 // Authorized V4 additions require these frontend/parser/test files to change.
 const allowed=new Set(['app/page.tsx','app/globals.css','lib/learning.ts','tests/learning.test.mjs']);
 for(const [file,hash] of Object.entries(expected).filter(([file])=>!allowed.has(file)))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});
