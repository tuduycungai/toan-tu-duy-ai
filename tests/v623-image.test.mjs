import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {validateImage,IMAGE_LIMITS} from '../public/image-format.mjs';import {prepareTikz} from '../public/tikz-format.mjs';
import {validateReading} from '../server/image-policy.mjs';import {checkGeometryCode} from '../server/geometry-checks.mjs';
import {handleChat} from '../server/gemini.mjs';import {seal,unseal} from '../server/signed-state.mjs';
import {reading,latex,provider} from './fixtures/v623-data.mjs';
const env={GEMINI_API_KEY:'fixture-only-no-real-key',ACCESS_CODE:'HOCGIOITOAN'};
const req=body=>new Request('https://test.local/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accessCode:env.ACCESS_CODE,...body})});
const bytes=readFileSync(new URL('./fixtures/images/clear-ratio.png',import.meta.url));
const image={mimeType:'image/png',data:bytes.toString('base64')};
const saved=(confirmed=true,attempt=0,r=reading)=>seal({reading:validateReading(r),confirmed,attempt,correction:''},env.GEMINI_API_KEY,'image');
for(const [id,file,mime] of [['IMG-01','clear-ratio.png','image/png'],['IMG-02','skewed.png','image/png'],['IMG-03','rotated.png','image/png'],['IMG-04','text-figure.jpg','image/jpeg'],['IMG-05','blurred-cropped.png','image/png'],['IMG-06','midpoint.png','image/png'],['IMG-07','parallel-perpendicular.png','image/png'],['IMG-08','circle.png','image/png'],['IMG-09','graph.png','image/png'],['IMG-10','clear.webp','image/webp']])test(`${id}: authentic authored image bytes accepted (${file}); no OCR claim`,()=>{
 const h=validateImage(readFileSync(new URL('./fixtures/images/'+file,import.meta.url)),mime);assert(h.width>=64&&h.height>=64);
});
test('IMG-11: invalid format, spoofed MIME, tiny and oversized files are refused',()=>{
 assert.throws(()=>validateImage(new TextEncoder().encode('<svg/>'),'image/svg+xml'));assert.throws(()=>validateImage(bytes,'image/jpeg'));
 assert.throws(()=>validateImage(new Uint8Array(IMAGE_LIMITS.fileBytes+1),'image/png'));
 const small=Buffer.from(bytes);small.writeUInt32BE(2,16);assert.throws(()=>validateImage(small,'image/png'));
});
test('IMG-12: 2AM = AB remains a half ratio; incorrect normalization blocks drawing',()=>{
 assert(validateReading(reading).ready);const bad=structuredClone(reading);bad.relations[2].value=1;const d=validateReading(bad);assert(!d.ready);assert(d.uncertainties.some(x=>x.text==='2AM = AB'));
 assert.equal(checkGeometryCode(latex,validateReading(reading)).checked.length,3);
 assert.throws(()=>checkGeometryCode(latex.replace('(M) at (3,0)','(M) at (2,0)'),reading),/chưa thỏa/);
});
test('IMG-13: ambiguity, blur, cut-off and low confidence cannot become ready',()=>{
 for(const change of [{confidence:.5},{uncertainties:[{text:'M ?',question:'M thuộc đường nào?',critical:true}]},{clarification:'Em chụp lại góc bị cắt nhé?'},{transcription:reading.transcription+' [không rõ]'}])assert(!validateReading({...reading,...change}).ready);
});
test('IMG-14: intermediate representation requires source and valid point references',()=>{
 const d=structuredClone(reading);d.relations[0].source='invented condition';assert.throws(()=>validateReading(d));
 const e=structuredClone(reading);e.relations[0].items[0]='Z';assert.throws(()=>validateReading(e));
});
test('IMG-15: read endpoint really sends inline image bytes, no API key in body',async()=>{
 const response=await handleChat(req({mode:'image-read',image,note:'Giữ 2AM = AB'}),env,async(url,o)=>{assert.match(url,/generateContent$/);const p=JSON.parse(o.body);assert.equal(p.contents[0].parts[0].inlineData.data,image.data);assert(!o.body.includes(env.GEMINI_API_KEY));assert.equal(p.generationConfig.responseMimeType,'application/json');return provider(reading);});
 assert.equal(response.status,200);const d=await response.json();assert(d.reading.ready);assert.equal(d.confirmed,false);assert.equal(unseal(d.imageToken,env.GEMINI_API_KEY,'image').confirmed,false);
});
test('IMG-16: image auth and confirmation gates make zero unauthorized provider calls',async()=>{
 for(const body of [{mode:'image-read',image,accessCode:'wrong'},{mode:'image-diagram',imageToken:saved(false)},{mode:'image-diagram',imageToken:'tampered'},{mode:'image-confirm',imageToken:saved(false,0,{...reading,confidence:.5}),transcription:reading.transcription}]){
 let calls=0;const r=await handleChat(req(body),env,async()=>{calls++;return provider(reading);});assert(r.status>=400);assert.equal(calls,0);
 }
});
test('IMG-17: unchanged clear transcript confirms; edited transcript must be reviewed again',async()=>{
 const r=await handleChat(req({mode:'image-confirm',imageToken:saved(false),transcription:reading.transcription}),env,()=>assert.fail('No model call for unchanged confirmation'));assert.equal((await r.json()).confirmed,true);
 let called=false;const edit=await handleChat(req({mode:'image-confirm',imageToken:saved(false),transcription:reading.transcription+' Vẽ hình.'}),env,async()=>{called=true;return provider(reading);});assert(called);assert.equal((await edit.json()).confirmed,false);
});
test('IMG-18: wrong figure revision includes precise correction and preserves review gate',async()=>{
 const r=await handleChat(req({mode:'image-revise',imageToken:saved(),correction:'Nhãn M đè lên cạnh AB, hãy đặt bên dưới.'}),env,async(_u,o)=>{const p=JSON.parse(o.body);assert.match(p.contents[0].parts[0].text,/Nhãn M/);return provider(reading);});assert.equal(r.status,200);assert.equal((await r.json()).confirmed,false);
});
test('IMG-19: user TikZ prompt, actual code validation and at most two repair tokens',async()=>{
 let token=saved(),calls=0;
 for(let i=0;i<3;i++){
 const r=await handleChat(req({mode:'image-diagram',imageToken:token,previous:i?latex:'',failure:i?'Undefined control sequence':''}),env,async(_u,o)=>{calls++;const p=JSON.parse(o.body);assert.match(p.systemInstruction.parts[0].text,/Hỗ trợ vẽ ảnh\. Vẽ hình này chỉ bằng một câu lệnh trong Gemini/);assert.match(p.systemInstruction.parts[0].text,/MÔ TẢ BÀI TOÁN ĐÃ ĐƯỢC CHUẨN HÓA/);return provider('Đặt A tại gốc tọa độ.\n```latex\n'+latex+'\n```');});assert.equal(r.status,200);const d=await r.json();assert.equal(d.validation.checked.length,3);token=d.repairToken;
 }
 const denied=await handleChat(req({mode:'image-diagram',imageToken:token,failure:'again'}),env,()=>assert.fail('Must stop'));assert.equal(denied.status,409);assert.equal(calls,3);
});
test('SEC-01: allowlist rejects file, shell, hidden commands, unsupported packages and runaway loops',()=>{
 for(const code of ['\\input{secret}','\\write18{command}','\\csname input\\endcsname','\\newcommand{\\x}{bad}','\\special{html:bad}','\\directlua{bad}','\\foreach \\p in {1,...,999999}{\\draw (0,0)--(1,1);}','\\tikzset{x/.code={\\draw (0,0)--(1,1);}}','\\input{secret}\\pgfmathsetmacro{\\input}{1}','\\special{html:bad}\\pgfmathtruncatemacro{\\special}{1}'])assert.throws(()=>prepareTikz(latex.replace('\\draw (A)',code+'\\draw (A)')),code);
 assert.throws(()=>prepareTikz(latex.replace('\\begin{document}','\\usepackage{pgfplots}\\begin{document}')));
 assert.throws(()=>prepareTikz(latex.replace('calc,angles','../file,angles')));assert.throws(()=>prepareTikz(latex+'\\input{secret}'));
 assert.doesNotThrow(()=>prepareTikz(latex));
});
test('SEC-02: finite point loops are expanded and numeric resources bounded',()=>{
 const src=readFileSync(new URL('./fixtures/right-isosceles.tex',import.meta.url),'utf8');const body=prepareTikz(src).body;assert(!body.includes('\\foreach'));assert(body.includes('\\fill (A)'));
 assert.throws(()=>prepareTikz(latex.replace('[thick]','[samples=999999]')));assert.throws(()=>prepareTikz(latex+' '.repeat(18000)));
});
test('IMG-20: existing byte-identical class code remains HOCGIOITOAN on new feature modes',async()=>{
 const r=await handleChat(req({mode:'image-read',image}),{GEMINI_API_KEY:env.GEMINI_API_KEY},async()=>provider(reading));assert.equal(r.status,200);
});
test('IMG-21: circle membership, radius and tangent are independently checked',()=>{
 const r={...reading,points:['O','A','T'],objects:[{name:'(O)',type:'circle',points:['O'],definition:'Đường tròn tâm O',source:'đường tròn tâm O bán kính 2'}],relations:[{kind:'on_circle',items:['A','O'],value:0,description:'A thuộc (O)'},{kind:'tangent',items:['O','A','T'],value:0,description:'AT tiếp xúc tại A'}]};
 const code=String.raw`\begin{tikzpicture}\coordinate (O) at (0,0);\coordinate (A) at (2,0);\coordinate (T) at (2,3);\draw (O) circle (2);\draw (A)--(T);\end{tikzpicture}`;
 assert.equal(checkGeometryCode(code,r).unverified.length,0);assert.throws(()=>checkGeometryCode(code.replace('(T) at (2,3)','(T) at (3,3)'),r));assert.throws(()=>checkGeometryCode(code.replace('circle (2)','circle (3)'),r));
});
test('IMG-22: midpoint and parallel/perpendicular data are checked independently',()=>{
 const r={...reading,relations:[{kind:'midpoint',items:['M','A','B'],value:0,description:'M là trung điểm AB'},{kind:'perpendicular',items:['A','B','A','C'],value:0,description:'AB vuông AC'},{kind:'parallel',items:['A','M','M','B'],value:0,description:'AM cùng phương MB'}]};
 assert.equal(checkGeometryCode(latex,r).checked.length,3);assert.throws(()=>checkGeometryCode(latex.replace('(M) at (3,0)','(M) at (3,1)'),r));
});
test('IMG-23: invalid geometric extraction keeps legible OCR and asks confirmation',async()=>{
 const bad=structuredClone(reading);bad.relations[0].source='not in original';
 const r=await handleChat(req({mode:'image-read',image}),env,async()=>provider(bad));assert.equal(r.status,200);const d=await r.json();assert.equal(d.reading.transcription,reading.transcription);assert.equal(d.reading.ready,false);assert.equal(d.reading.relations.length,0);
});
test('IMG-24: polygon type and coordinates cannot be contradicted by drawing transforms',()=>{
 const r={...reading,transcription:'Cho hình chữ nhật ABCD.',points:['A','B','C','D'],objects:[{name:'ABCD',type:'polygon',points:['A','B','C','D'],source:'hình chữ nhật ABCD'}],relations:[]};
 const code=String.raw`\begin{tikzpicture}\coordinate (A) at (0,0);\coordinate (B) at (6,0);\coordinate (C) at (6,3);\coordinate (D) at (0,3);\draw (A)--(B)--(C)--(D)--cycle;\end{tikzpicture}`;
 assert(checkGeometryCode(code,r).checked.includes('hình chữ nhật ABCD'));
 assert.throws(()=>checkGeometryCode(code.replace('(D) at (0,3)','(D) at (1,3)'),r));assert.throws(()=>checkGeometryCode(code.replace('tikzpicture}','tikzpicture}[xscale=2]'),r));
});
