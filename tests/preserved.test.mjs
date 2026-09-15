import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
test('Unaffected auth, Forms, original assets and deploy files remain byte-identical',async()=>{
 const expected=JSON.parse(await readFile(new URL('./v2-preserved.json',import.meta.url),'utf8'));
 // Explicitly authorized integrations are separately tested, not declared byte-identical.
 const drawingIntegration=new Set(['app/page.tsx','app/globals.css','lib/learning.ts','components/learning-visuals.tsx','main.tsx','package.json','package-lock.json','server/gemini.mjs','tests/gemini.test.mjs','README.md']);
 for(const [file,hash] of Object.entries(expected)){if(drawingIntegration.has(file))continue;assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);}
});
test('Gemini transport is byte-identical after reversing only documented tutor integrations',async()=>{
 const expected=JSON.parse(await readFile(new URL('./v2-preserved.json',import.meta.url),'utf8'));
 const source=(await readFile(new URL('../server/gemini.mjs',import.meta.url),'utf8'))
 .replace("import { asksForAnswer, guidedFallback, guardTutorOutput } from './strict-tutor.mjs';\n",'')
 .replace(' if(!check&&asksForAnswer(body.messages))return reply({text:guidedFallback(body.messages),model});\n','')
 .replace('instructions(body.mode,body.messages)','instructions(body.mode)')
 .replace('text:guardTutorOutput(text,body.messages),model','text,model');
 assert.equal(createHash('sha256').update(source).digest('hex'),expected['server/gemini.mjs']);
});
test('original light/dark styles are preserved; drawing styles are appended',async()=>{
 const expected=JSON.parse(await readFile(new URL('./v2-preserved.json',import.meta.url),'utf8'));
 const css=await readFile(new URL('../app/globals.css',import.meta.url),'utf8');const original=css.split('/* Verified mathematical figures share the existing light/dark theme. */')[0];
 assert.equal(createHash('sha256').update(original).digest('hex'),expected['app/globals.css']);
});
