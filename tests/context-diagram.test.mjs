import test from 'node:test';import assert from 'node:assert/strict';import {loadTS} from './load-ts.mjs';
const p=await loadTS('lib/problem-diagram.ts'),g=await loadTS('lib/geometry.ts'),ai=await loadTS('lib/diagram-interpretation.ts'),{parseTutorResponse}=await loadTS('lib/learning.ts');
const full='Cho hình bình hành ABCD. AC cắt BD tại O.\nQua điểm O vẽ đường\nthẳng d song song với AB\nd cắt hai cạnh AD tại M\nd cắt cạnh BC tại N, .\nTrên AB lấy điểm P\ntrên CD lấy điểm Q,\nsao cho AP = CQ . Gọi AC cắt PQ tại I . Chứng minh: Ba đường thẳng AC, MN, PQ đồng quy';
const ready=q=>{const r=p.resolveProblemDiagram(q);assert.equal(r.status,'ready',JSON.stringify(r));return r.drawing;};
const dist=(d,a,b)=>g.distance(d.points[a],d.points[b]);
function verifyNew(d){const v=d.points;assert(g.onSegment(v.O,v.A,v.C));assert(g.onSegment(v.O,v.B,v.D));assert(g.onSegment(v.M,v.A,v.D));assert(g.onSegment(v.N,v.B,v.C));assert(g.parallel(v.M,v.N,v.A,v.B));assert(g.onSegment(v.O,v.M,v.N));assert(g.near(dist(d,'A','P'),dist(d,'C','Q')));assert(g.onSegment(v.I,v.P,v.Q));assert(g.onSegment(v.I,v.A,v.C));assert(g.near(dist(d,'O','I'),0));}
test('new screenshot: construct the same named line through every step',()=>{const d=ready(full);verifyNew(d);assert.equal(d.guides.length,1);assert.equal(d.guides[0].name,'d');assert.equal(p.parseProblem(full).constraints.filter(c=>c.type==='equal').length,1);assert(!d.checks.some(s=>s==='O = I'));});
for(const clause of [
 'Qua O kẻ đường thẳng d song song với AB. d cắt hai cạnh AD và BC lần lượt tại M và N.',
 'Qua O vẽ đường thẳng d ∥ AB, cắt hai cạnh AD, BC lần lượt tại M, N.',
 'Qua điểm O kẻ đường thẳng song song với AB, cắt AD tại M và BC tại N.',
 'Đường thẳng d đi qua O và song song với AB. d cắt AD tại M và BC tại N.',
 'Kẻ đường thẳng d qua O và song song với AB. d cắt AD tại M. d cắt BC tại N.'
])test('equivalent line context: '+clause,()=>{const d=ready('Cho hình bình hành ABCD. AC và BD cắt nhau tại O. '+clause+' Trên AB lấy điểm P, trên CD lấy điểm Q sao cho AP = CQ. Gọi AC cắt PQ tại I. Chứng minh AC, MN, PQ đồng quy.');verifyNew(d);});
test('line dependencies are evaluated by geometry, not mention order',()=>{const d=ready('Cho hình bình hành ABCD. Qua O kẻ đường thẳng d song song với AB. d cắt AD tại M và BC tại N. AC cắt BD tại O. Trên AB lấy điểm P, trên CD lấy điểm Q sao cho AP = CQ. AC cắt PQ tại I. Chứng minh AC, MN, PQ đồng quy.');verifyNew(d);});
test('perpendicular is not interpreted as parallel',()=>{const d=ready('Cho hình chữ nhật ABCD. AC cắt BD tại O. Qua O kẻ đường thẳng d vuông góc với AB. d cắt hai cạnh AB và CD lần lượt tại M và N. Chứng minh OM = ON.');assert(g.perpendicular(d.points.M,d.points.N,d.points.A,d.points.B));assert(g.near(dist(d,'O','M'),dist(d,'O','N')));});
test('different point names at the same coordinate form one visible group in SVG/TikZ',()=>{const d=ready(full),group=g.pointGroups(d).find(x=>x.names.includes('O'));assert.deepEqual(group.names,['O','I']);const tex=g.toTikZ(d);assert(tex.includes('O,\\,I'));assert(!tex.includes('{$I$}'));});
test('a contradictory change AP = DQ must not be forced to the requested concurrency',()=>{const d=ready(full.replace('AP = CQ','AP = DQ'));assert(g.near(dist(d,'A','P'),dist(d,'D','Q')));assert(!g.near(dist(d,'O','I'),0));});
for(const q of [full.replace('song song với AB','song song với AD'),full.replace('AC cắt BD tại O.',''),full.replace('d cắt cạnh BC tại N','e cắt cạnh BC tại N'),full.replace('d cắt hai cạnh AD tại M','d cắt hai cạnh AD và BC lần lượt tại M, N, E')])test('incomplete or incompatible line definition is not guessed: '+q.slice(0,100),()=>assert.notEqual(p.resolveProblemDiagram(q).status,'ready'));
const unknown='ABCD là một hình bình hành. Đặt K ở chính giữa cạnh AB, còn I ở chính giữa cạnh CD. Chứng minh AI = CK.';
const given=p.problemParts(unknown).given.trim();
const normalized='Cho hình bình hành ABCD. K là trung điểm của AB. I là trung điểm của CD.';
function reply(problem,quote,text,extra={}){return '[DE_HINH_HOC]'+JSON.stringify({v:1,id:ai.diagramId(problem),facts:[{quote,text}],...extra})+'[/DE_HINH_HOC]';}
test('Gemini language normalization may bridge an unfamiliar phrasing without supplying coordinates',()=>{assert.notEqual(p.resolveProblemDiagram(unknown).status,'ready');const r=ai.resolveTutorDiagram(unknown,reply(unknown,given,normalized));assert.equal(r.status,'ready');assert.equal(r.drawing.interpretation,'ai');assert(g.near(dist(r.drawing,'A','K'),dist(r.drawing,'B','K')));assert(g.near(dist(r.drawing,'C','I'),dist(r.drawing,'D','I')));assert(g.segmentVisible(r.drawing,['A','I']));assert(ai.diagramPrompt(unknown).includes('[CHUAN_HOA_HINH]'));});
test('locally understood problems do not ask for additional normalization',()=>assert.equal(ai.diagramPrompt(full),''));
for(const [name,r] of [
 ['wrong problem ID',reply(unknown,given,normalized,{id:'g00000000'})],
 ['omitted givens',reply(unknown,'ABCD là một hình bình hành.','Cho hình bình hành ABCD.')],
 ['invented point',reply(unknown,given,normalized+' E là trung điểm AC.')],
 ['invented length',reply(unknown,given,normalized+' AB = 8 cm.')],
 ['goal promoted to given',reply(unknown,given,normalized+' Chứng minh AI = CK.')],
 ['arbitrary coordinates',reply(unknown,given,'<svg>bad</svg>')]
])test('reject unsafe model normalization: '+name,()=>assert.notEqual(ai.resolveTutorDiagram(unknown,r).status,'ready'));
test('the model cannot erase a negation while translating',()=>{const q=unknown.replace('Đặt K','K không là trung điểm AB. Đặt K');assert.notEqual(ai.resolveTutorDiagram(q,reply(q,p.problemParts(q).given,normalized)).status,'ready');});
test('original known constraints are rechecked after AI normalization',()=>{const q='Cho hình bình hành ABCD. E là trung điểm AB. I được đặt ngay chính giữa CD. AE = EI. Chứng minh AI = CE.';const normalized='Cho hình bình hành ABCD. E là trung điểm AB. I là trung điểm CD.';assert.notEqual(ai.resolveTutorDiagram(q,reply(q,p.problemParts(q).given,normalized)).status,'ready');});
test('metadata stays hidden from the student while the pedagogical answer remains',()=>{const r=parseTutorResponse('Thao tác tư duy: Phân tích. Gợi mở: Em cần điều kiện nào?\n'+reply(unknown,given,normalized));assert(!r.text.includes('facts'));assert(!r.text.includes('DE_HINH_HOC'));assert(r.text.includes('Gợi mở:'));});
test('a student explanation does not silently replace the original problem',()=>assert.equal(p.problemForTurn('Vì hình bình hành ABCD có hai cặp cạnh đối bằng nhau.',full),full));
test('a model cannot turn a freely chosen point into an unstated midpoint',()=>{const q='Cho hình bình hành ABCD. Chọn K ở một vị trí bất kỳ trên AB và chọn I trên CD sao cho AK = CI. Chứng minh KI cắt AC.';const canonical='Cho hình bình hành ABCD. K là trung điểm AB. I là trung điểm CD. AK = CI.';assert.notEqual(ai.resolveTutorDiagram(q,reply(q,p.problemParts(q).given,canonical)).status,'ready');});
test('a model cannot strengthen a parallelogram into an unstated rectangle',()=>{const q='Cho hình bình hành ABCD. Đặt K ở chính giữa AB và I ở chính giữa CD. Chứng minh AI = CK.';const canonical='Cho hình chữ nhật ABCD. K là trung điểm AB. I là trung điểm CD.';assert.notEqual(ai.resolveTutorDiagram(q,reply(q,p.problemParts(q).given,canonical)).status,'ready');});
