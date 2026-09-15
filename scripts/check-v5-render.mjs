/** Real React/SVG render, independent of a browser. This does NOT claim browser interaction QA. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from '../tests/load-ts.mjs';
const out=new URL('../research/v5-checks/',import.meta.url);
await mkdir(out,{recursive:true});
const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const {ProblemFigure,DiagramSVG}=await vite.ssrLoadModule('/components/problem-figure.tsx');
 const {compileGeometry}=await loadTS('lib/geometry-model.ts');
 const {theoryForProblem}=await loadTS('lib/theory.ts');
 const cases=[
  ['01-parallelogram','Cho hình bình hành ABCD tâm O, E và F theo thứ tự là trung điểm của OD và OB. Chứng minh rằng AE // CF.'],
  ['02-rectangle','Cho hình chữ nhật ABCD. M thuộc AB. Qua M kẻ đường thẳng d vuông góc AB, cắt CD tại N. Chứng minh MN song song AD.'],
  ['03-rhombus','Cho hình thoi ABCD tâm O. E là trung điểm AD, F là trung điểm AB. Chứng minh EF song song BD.'],
  ['04-trapezoid','Cho hình thang ABCD có AB // CD. M và N theo thứ tự là trung điểm AD và BC. Chứng minh MN // AB.'],
  ['05-triangle','Cho tam giác ABC. M là trung điểm AB. N thuộc AC. MN // BC. Chứng minh N là trung điểm AC.'],
  ['06-circle','Cho đường tròn (O) bán kính 3 cm. Dây cung AB. Kẻ tiếp tuyến d tại A. Chứng minh OA vuông góc d.'],
  ['07-novel','Cho hình chữ nhật KLMN. P là trung điểm KL. Qua P kẻ đường thẳng d song song KN, cắt MN tại Q. Chứng minh KP = NQ.'],
  ['08-latex',String.raw`Cho hình bình hành \(ABCD\) tâm \(O\). \(E\) và \(F\) theo thứ tự là trung điểm của \(OD\) và \(OB\). Chứng minh \(AE\parallel CF\).`],
  ['09-ordered','Cho hình bình hành ABCD tâm O. Các điểm E và F theo thứ tự là trung điểm của OD và OB. Chứng minh AE ∥ CF.'],
  ['10-missing','Cho hình bình hành ABCD. E là trung điểm OD. Chứng minh AE // CF.']
 ];
 const styles={
  'problem-fill':'fill="#dceee2" opacity="0.65"',
  'problem-edge':'stroke="#2459cc" stroke-width="2.2" stroke-linecap="round"',
  'problem-aux':'stroke="#167b76" stroke-width="1.65" stroke-dasharray="7 5"',
  'problem-mark':'stroke="#17304b" stroke-width="1.5" stroke-linecap="round"',
  'problem-point':'fill="#2459cc"',
  'problem-label':'fill="#17304b" font-family="DejaVu Sans,Arial,sans-serif" font-size="16" font-weight="700" stroke="#dcefdc" stroke-width="3" stroke-linejoin="round" paint-order="stroke"'
 };
 const rows=[];
 for(const [id,problem] of cases){
  const model=compileGeometry(problem),theory=theoryForProblem(problem,{model});
  const html=renderToStaticMarkup(React.createElement(ProblemFigure,{problem}));
  assert(html.includes('data-testid="problem-svg"'));assert(html.includes('LÝ THUYẾT DỰ KIẾN DÙNG'));
  for(const control of ['Vẽ lại hình','Tải PNG','Tải SVG','Mức phóng hình','Áp dụng và vẽ lại'])assert(html.includes(control));
  assert(!html.includes('NaN'));assert(!html.includes('chưa dựng hình vì'));
  if(id==='10-missing')assert(html.includes('Giả định đang sử dụng'));
  let svg=renderToStaticMarkup(React.createElement(DiagramSVG,{drawing:model.drawing,aux:true}));
  svg=svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="1680" height="1215" ');
  svg=svg.replace(/class="(problem-(?:fill|edge|aux|mark|point|label))"/g,(_,name)=>'class="'+name+'" '+styles[name]);
  svg=svg.replace(/(<svg[^>]*>)/,'$1<rect width="560" height="405" fill="#dcefdc"/>');
  await writeFile(new URL(id+'.svg',out),svg);await writeFile(new URL(id+'.html',out),html);
  if(id==='01-parallelogram')await writeFile(new URL('primary-model.json',out),JSON.stringify(model,null,2));
  rows.push({id,problem,status:model.status,validation:model.validation.valid,points:model.drawing.points,theories:theory.map(t=>t.title),render:'React SVG SSR passed',assumptions:model.assumptions,missing:model.missingInformation});
 }
 await writeFile(new URL('mandatory-cases.json',out),JSON.stringify(rows,null,2));
 console.log('PASS: 10 actual React figure/theory renders, valid SVG, controls present; not a browser click test.');
 // Optional local rasterizer, not a production dependency.
 if(process.env.V5_SHARP_MODULE){const sharp=(await import(process.env.V5_SHARP_MODULE)).default;for(const [id] of cases)await sharp(await readFile(new URL(id+'.svg',out))).png().toFile(new URL(id+'.png',out).pathname);console.log('PASS: 10 PNGs rasterized from the actual DiagramSVG output.');}
}finally{await vite.close();}
