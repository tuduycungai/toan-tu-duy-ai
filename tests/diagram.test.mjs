import test from 'node:test';import assert from 'node:assert/strict';import {moduleURL} from './load-ts.mjs';import {diagrams,drawingBlock} from './diagram-fixtures.mjs';
import {DIAGRAM_INSTRUCTIONS,instructions} from '../server/policy.mjs';
const {buildDiagram,parseDiagram}=await import(moduleURL('lib/diagram.ts'));
const {parseTutorResponse}=await import(moduleURL('lib/learning.ts'));
const p=(d,n)=>d.points.find(p=>p.name===n),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),close=(a,b)=>assert(Math.abs(a-b)<1e-7);
for(const [name,data] of Object.entries(diagrams))test('constructs full named figure: '+name,()=>{const d=buildDiagram(data);assert(d.points.length>=5);assert(d.segments.length>=2);assert.equal(parseDiagram(drawingBlock(data)).status,'ready');});
test('rhombus conditions stay true and perpendicular diagonals meet at midpoints',()=>{const d=buildDiagram(diagrams.rhombus),a=p(d,'A'),b=p(d,'B'),c=p(d,'C'),e=p(d,'D'),o=p(d,'O');close(dist(a,b),dist(b,c));close(dist(a,o),dist(c,o));close(dist(b,o),dist(e,o));close((a.x-c.x)*(b.x-e.x)+(a.y-c.y)*(b.y-e.y),0);});
test('reflection computes D through M; ABDC has right angles without assuming target shape',()=>{const d=buildDiagram(diagrams.reflection),a=p(d,'A'),b=p(d,'B'),c=p(d,'C'),x=p(d,'D'),m=p(d,'M');close(x.x,2*m.x-a.x);close(x.y,2*m.y-a.y);close((b.x-a.x)*(c.x-a.x)+(b.y-a.y)*(c.y-a.y),0);close(dist(a,b),dist(c,x));});
test('feet are on base and perpendicular, isosceles offsets equal',()=>{const d=buildDiagram(diagrams.feet);close(p(d,'E').y,p(d,'D').y);close(p(d,'A').x,p(d,'E').x);close(dist(p(d,'D'),p(d,'E')),dist(p(d,'F'),p(d,'C')));});
test('midpoint polygon stays a parallelogram for generic quadrilateral',()=>{const d=buildDiagram(diagrams.midpoints),e=p(d,'E'),f=p(d,'F'),g=p(d,'G'),h=p(d,'H');close(e.x+g.x,f.x+h.x);close(e.y+g.y,f.y+h.y);});
test('custom labels follow provided order without hard-coded ABCD',()=>{const d=buildDiagram({version:1,status:'ok',title:'Hình MNPQ',base:{kind:'rectangle',vertices:['M','N','P','Q']}});assert.deepEqual(d.outline,['M','N','P','Q']);});
const badCases=[
 ['unknown names',d=>d.segments.push(['A','Z'])],['duplicate names',d=>d.points.push({name:'A',op:'midpoint',of:['A','B']})],
 ['parallel lines',d=>d.points=[{name:'O',op:'intersection',lines:[['A','B'],['C','D']]}]],
 ['false equal marks',d=>d.marks=[{type:'equal',segments:[['A','C'],['B','D']]}]],
 ['false right marks',d=>d.marks=[{type:'right',at:'A',arms:['B','D']}]],
 ['false parallel marks',d=>d.marks=[{type:'parallel',segments:[['A','C'],['B','D']]}]],
 ['subtype mismatch',d=>d.base.kind='rectangle'],['crossed vertices',d=>d.base.coords=[[0,0],[4,4],[0,4],[4,0]]],
 ['nonfinite input',d=>d.base.coords[0][0]=NaN],['HTML labels',d=>d.base.vertices[0]='<img>'],['bad title',d=>d.title='<script>'],
 ['too many points',d=>d.points=Array(17).fill({})],['external image',d=>d.base.kind='https://evil.invalid/a.svg'],['invalid ratio',d=>d.points=[{name:'O',op:'on',of:['A','B'],ratio:2}]],
 ['prototype kind',d=>d.base.kind='__proto__'],['coincident points',d=>d.points=[{name:'O',op:'foot',from:'A',of:['A','B']}]]
];
for(const [name,edit] of badCases)test('rejects '+name+' without crashing chat',()=>{const d=structuredClone(diagrams.rhombus);edit(d);assert.throws(()=>buildDiagram(d));assert.equal(parseDiagram(drawingBlock(d)).status,'invalid');});
test('new metadata remains hidden while existing plan and completion parse normally',()=>{const raw='[SO_DO]\nDU_KIEN: ABCD là hình bình hành.\nMUC_TIEU: Xét đường chéo.\nCAU_NOI: Dấu hiệu nhận biết.\nBUOC_TIEP: Chọn dấu hiệu.\n[/SO_DO]\n'+drawingBlock(diagrams.rhombus)+'\nThao tác tư duy: Phân tích.\nGợi mở: Em chọn dấu hiệu nào?';const r=parseTutorResponse(raw);assert(r.plan);assert(r.diagram);assert(!r.complete);assert(!r.text.includes('version'));assert(!r.text.includes('HINH_VE'));assert.match(r.text,/Gợi mở:/);});
test('truncated, duplicate and oversized blocks fail closed and do not expose metadata',()=>{for(const raw of ['[HINH_VE]{"version":',drawingBlock(diagrams.rhombus)+drawinging(), '[HINH_VE]'+ ' '.repeat(13000)+'[/HINH_VE]']){const r=parseTutorResponse(raw);assert.equal(r.status,'invalid');assert(!r.text.includes('version'));}function drawinging(){return drawingBlock(diagrams.square);}});
test('insufficient data shows model clarification, old replies remain compatible',()=>{assert.equal(parseDiagram(drawingBlock({version:1,status:'insufficient',reason:'Em cho biết tên bốn đỉnh theo thứ tự nhé.'})).status,'insufficient');assert.equal(parseTutorResponse('Em hãy giải thích căn cứ.').text,'Em hãy giải thích căn cứ.');});
test('all existing modes receive diagram instructions without changing pedagogy contract',()=>{for(const mode of ['guide','review','compare'])assert(instructions(mode).includes(DIAGRAM_INSTRUCTIONS));});
