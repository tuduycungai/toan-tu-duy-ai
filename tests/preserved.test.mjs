import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
test('V2 application, auth HOCGIOITOAN, Gemini, Forms, UI and deploy files remain byte-identical',async()=>{
 const expected=JSON.parse(await readFile(new URL('./v2-preserved.json',import.meta.url),'utf8'));
 for(const [file,hash] of Object.entries(expected))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});
