import test from 'node:test';import assert from 'node:assert/strict';
import {validateReading,recoverTranscription} from '../server/image-policy.mjs';
import {coordinateMap,scalar} from '../server/tikz-coordinates.mjs';import {checkGeometryCode} from '../server/geometry-checks.mjs';
import {handleChat} from '../server/gemini.mjs';import {provider} from './fixtures/v623-data.mjs';
import {reading,problem,latex,failedStructure} from './fixtures/v624-data.mjs';
import {seal} from '../server/signed-state.mjs';
const env={GEMINI_API_KEY:'v624-fixture-only',ACCESS_CODE:'HOCGIOITOAN'};
const request=body=>new Request('http://local/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accessCode:'HOCGIOITOAN',...body})});
test('FIX-01: screenshot transcription remains complete after IR validation failure',()=>{
 assert.throws(()=>validateReading(failedStructure()));const r=recoverTranscription(failedStructure(),'Source mismatch');
 assert.equal(r.transcription,problem);assert.equal(r.structureStatus,'needs_repair');assert.deepEqual(r.goals,['Tính độ dài các đoạn MI, IK, KN.']);assert.equal(r.uncertainties.length,0);assert.equal(r.ready,false);
});
test('FIX-02: clear transcript confirmation repairs IR and permits drawing without editing text',async()=>{
 const token=seal({reading:recoverTranscription(failedStructure()),confirmed:false,attempt:0},env.GEMINI_API_KEY,'image');let calls=0;
 const response=await handleChat(request({mode:'image-confirm',imageToken:token,transcription:problem}),env,async(_u,options)=>{calls++;assert.match(JSON.parse(options.body).contents[0].parts[0].text,/CẤU TRÚC JSON/);return provider(reading);});
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.confirmed,true);assert.equal(data.reading.ready,true);assert.equal(calls,1);
 const diagram=await handleChat(request({mode:'image-diagram',imageToken:data.imageToken}),env,async()=>provider('Dựng bằng trung điểm và giao điểm.\n```latex\n'+latex+'\n```'));
 assert.equal(diagram.status,200);assert.equal((await diagram.json()).validation.checked.length,7);
});
test('FIX-03: repeated malformed IR stops after one repair call, preserving text',async()=>{
 const token=seal({reading:recoverTranscription(failedStructure()),confirmed:false,attempt:0},env.GEMINI_API_KEY,'image');let calls=0;
 const r=await handleChat(request({mode:'image-confirm',imageToken:token,transcription:problem}),env,async()=>{calls++;return provider(failedStructure());});
 const d=await r.json();assert.equal(calls,1);assert.equal(d.confirmed,false);assert.equal(d.reading.transcription,problem);assert.equal(d.reading.structureStatus,'needs_repair');
});
test('FIX-04: genuine geometric uncertainty still cannot be confirmed unchanged',async()=>{
 const r=validateReading({...reading,confidence:.5,uncertainties:[{text:'AB = ?',question:'AB dài 8 hay 9 cm?',critical:true}]});
 const token=seal({reading:r,confirmed:false,attempt:0},env.GEMINI_API_KEY,'image');
 const response=await handleChat(request({mode:'image-confirm',imageToken:token,transcription:problem}),env,()=>assert.fail('Must not call model'));
 assert.equal(response.status,400);
});
test('FIX-05: notation, compact segment references and numeric strings normalize without changing facts',()=>{
 const d=structuredClone(reading);d.points.push('A');d.relations[0].source=String.raw`$AB\parallel CD$`;d.relations[0].items=['AB','CD'];delete d.relations[0].value;
 d.relations[1].items=['M','AD'];d.relations[3].items=['I','MN','BD'];d.relations[5].value='8';d.goals=[];
 const r=validateReading(d);assert.equal(r.ready,true);assert.equal(r.points.length,8);assert.deepEqual(r.relations[3].items,['I','M','N','B','D']);assert.equal(r.goals.length,1);
 d.relations[0].source='AB // AC';assert.throws(()=>validateReading(d));
});
test('FIX-06: calc midpoint and exact intersections satisfy all trapezoid givens',()=>{
 const p=coordinateMap(latex);assert.deepEqual(p.get('M'),[1.5,2.5]);assert.deepEqual(p.get('I'),[5.5,2.5]);assert.deepEqual(p.get('K'),[9.5,2.5]);
 assert.equal(checkGeometryCode(latex,reading).checked.length,7);
 assert.throws(()=>checkGeometryCode(latex.replace('!0.5!(D)','!0.4!(D)'),reading));
 assert.throws(()=>checkGeometryCode(latex.replace('M--N and B--D','M--N and A--C'),reading));
});
test('FIX-07: numerical interpreter handles signs/functions and rejects executable or cyclic expressions',()=>{
 assert.equal(scalar('-2^2'),-4);assert.equal(scalar('2^(-2)'),.25);assert.equal(scalar('sqrt(9)+1/2'),3.5);assert(Math.abs(scalar('sin(30)')-.5)<1e-8);
 for(const x of ['fetch(1)','1/0','sqrt(-1)','(()=>42)()','2;process.exit()'])assert.throws(()=>scalar(x));
 assert.throws(()=>coordinateMap(String.raw`\coordinate (A) at ($(B)!0.5!(C)$);\coordinate (B) at (A);\coordinate (C) at (0,0);`));
});
test('FIX-08: restore endpoint authenticates signed reading without a Gemini request',async()=>{
 const token=seal({reading:validateReading(reading),confirmed:true,attempt:0},env.GEMINI_API_KEY,'image');
 const r=await handleChat(request({mode:'image-restore',imageToken:token}),env,()=>assert.fail('Restore is local server validation only'));
 assert.equal(r.status,200);assert.equal((await r.json()).reading.transcription,problem);
 const bad=await handleChat(request({mode:'image-restore',imageToken:token+'x'}),env,()=>assert.fail());assert.equal(bad.status,409);
});
