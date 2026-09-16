import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
test('Unaffected auth, Forms, original assets and deploy files remain byte-identical',async()=>{
 const expected=JSON.parse(await readFile(new URL('./v2-preserved.json',import.meta.url),'utf8'));
 // Explicitly authorized integrations are separately tested, not declared byte-identical.
 const drawingIntegration=new Set(['netlify.toml','lib/tutor.ts','app/page.tsx','app/globals.css','lib/learning.ts','components/learning-visuals.tsx','main.tsx','package.json','package-lock.json','server/gemini.mjs','tests/gemini.test.mjs','README.md']);
 for(const [file,hash] of Object.entries(expected)){if(drawingIntegration.has(file))continue;assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);}
});
test('Gemini transport is byte-identical after reversing documented V6 diagram and tutor integrations',async()=>{
 const expected=JSON.parse(await readFile(new URL('./v2-preserved.json',import.meta.url),'utf8'));
 const source=(await readFile(new URL('../server/gemini.mjs',import.meta.url),'utf8'))

 .replace("import {DIAGRAM_PROMPT,parseDiagram} from './diagram-policy.mjs';\n","")
 .replace(" const diagram=body.mode==='diagram';\n if(!check&&(!(diagram?Array.isArray(body.messages)&&body.messages.length===1&&body.messages[0]?.role==='user'&&typeof body.messages[0].content==='string'&&body.messages[0].content.length>0&&body.messages[0].content.length<=26000:validMessages(body.messages))||!['guide','review','compare','diagram'].includes(body.mode)))return reply({error:'Hội thoại không hợp lệ hoặc quá dài. Hãy mở bài mới.'},400);\n"," if(!check&&(!validMessages(body.messages)||!['guide','review','compare'].includes(body.mode)))return reply({error:'Hội thoại không hợp lệ hoặc quá dài. Hãy mở bài mới.'},400);\n")
 .replace(" if(!check&&!diagram&&asksForAnswer(body.messages))return reply({text:guidedFallback(body.messages),model});\n"," if(!check&&asksForAnswer(body.messages))return reply({text:guidedFallback(body.messages),model});\n")
 .replace(" const generationConfig={maxOutputTokens:check?128:diagram?6000:2400};\n if(diagram)generationConfig.responseMimeType='application/json';\n"," const generationConfig={maxOutputTokens:check?128:2400};\n")
 .replace(" const response=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({systemInstruction:{parts:[{text:check?'Reply with OK only.':diagram?DIAGRAM_PROMPT:instructions(body.mode,body.messages)}]},contents,generationConfig}),signal:AbortSignal.timeout(22000)});\n"," const response=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({systemInstruction:{parts:[{text:check?'Reply with OK only.':instructions(body.mode,body.messages)}]},contents,generationConfig}),signal:AbortSignal.timeout(22000)});\n")
 .replace(" if(diagram){try{return reply({...parseDiagram(text),model});}catch{return reply({error:'Chưa nhận được mã hình hợp lệ. Em thử vẽ lại nhé.'},502);}}\n","")
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
