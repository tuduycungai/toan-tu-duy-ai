import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
test('Unchanged auth HOCGIOITOAN, Gemini, Forms, UI assets and deploy files remain byte-identical',async()=>{
 const expected=JSON.parse(await readFile(new URL('./v2-preserved.json',import.meta.url),'utf8'));
 // Only the three UI integration files authorized for the drawing repair are exempt.
 const drawingIntegration=new Set(['app/page.tsx','app/globals.css','lib/learning.ts']);
 for(const [file,hash] of Object.entries(expected)){if(drawingIntegration.has(file))continue;assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);}
});
test('V3 five-stage teaching policy is unchanged by geometry rendering',async()=>{
 const expected=JSON.parse(await readFile(new URL('./v3-policy-integrity.json',import.meta.url),'utf8'));
 for(const [file,hash] of Object.entries(expected))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});
test('original light/dark styles are preserved; drawing styles are appended',async()=>{
 const expected=JSON.parse(await readFile(new URL('./v2-preserved.json',import.meta.url),'utf8'));
 const css=await readFile(new URL('../app/globals.css',import.meta.url),'utf8');const original=css.split('/* Verified mathematical figures share the existing light/dark theme. */')[0];
 assert.equal(createHash('sha256').update(original).digest('hex'),expected['app/globals.css']);
});
