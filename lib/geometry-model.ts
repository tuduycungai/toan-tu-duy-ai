import {solveExtended,angleDegrees} from './geometry-constraints';
/** V5 intermediate representation. Geometry is computed locally; goals never constrain it. */
import {construct,defaults,validateShape,intersection,lerp,distance,near,perpendicular,onSegment,parallel,sub,dot,norm,resolveLine,type Shape,type Drawing,type XY,type Segment,type Recipe,type Construction} from './geometry';
import {normalizeProblem,problemParts,parseProblem,satisfy,verifyConstraints,type Constraint,type ParsedProblem} from './problem-diagram';
import {resolveTutorDiagram} from './diagram-interpretation';

export type GeometryRelation={type:string;point?:string;object?:string;target?:string;of?:Segment;objects?:string[];source:string;role:'given'|'goal'|'auxiliary';detail?:unknown;angle?:{names:string;degrees:number}};
export type GeometryModel={version:'5.0';source:string;normalized:string;entities:{id:string;type:string}[];relations:GeometryRelation[];givens:string[];goal:string;auxiliaries:string[];assumptions:string[];confidence:number;missingInformation:string[];validation:{valid:boolean;checks:string[];errors:string[]};status:'verified'|'provisional';drawing:Drawing};
const pair=(s:string)=>s.toUpperCase().split('') as Segment;
const clean=(s:string)=>s.replace(/(?<![\p{L}\p{N}])(?:cho|gọi|có|và|sao cho|lấy|kẻ|vẽ|biết|điểm|các|hai)(?![\p{L}\p{N}])/giu,' ').replace(/[\s.,;:()]+/g,' ').trim();
const namesIn=(s:string)=>[...new Set([...s.matchAll(/(?<![\p{L}\p{N}])[A-Z]{1,4}(?![\p{L}\p{N}])/gu)].flatMap(m=>m[0].split('')))];
const goalOf=(s:string)=>{const i=s.search(/chứng\s+minh|cmr|tính|hãy\s+kiểm\s+tra/iu);return i>=0?s.slice(i).trim():'';};

function canonicalize(s:string){
 return normalizeProblem(s)
 .replace(/(?:kẻ\s+)?([A-Z])([A-Z])\s*(?:⟂|vuông góc(?: với)?)\s*([A-Z]{2})\s+tại\s+\2/giu,(_m,a,h,bc)=>`${h} thuộc ${bc}. ${a}${h} ⟂ ${bc}`)
 .replace(/(?:kẻ\s+)?([A-Z])([A-Z])\s+là\s+(?:đường cao|đường vuông góc)\s*(?:của\s+tam giác\s+[A-Z]{3})?/giu,(_m,a,h)=>`${a}${h}`)
 .replace(/([A-Z]{3,4})\s+là\s+(?:một\s+)?(hình bình hành|hình chữ nhật|hình thoi|hình vuông|tứ giác lồi|tam giác)/giu,'$2 $1')
 .replace(/các\s+điểm\s+/giu,'điểm ')
 .replace(/(?<![\p{L}])CM(?=\s|:)/gu,'Chứng minh');
}
function attachGoalSegments(d:Drawing,goal:string){
 for(const m of goal.matchAll(/(?<![\p{L}\p{N}])[A-Z]{2}(?![\p{L}\p{N}])/gu)){
  const seg=pair(m[0]);if(seg.every(n=>d.points[n])&&!d.segments.some(s=>s.includes(seg[0])&&s.includes(seg[1])))d.segments.push(seg);
 }
}
function relationsOf(parsed:ParsedProblem|null,normalized:string):GeometryRelation[]{
 const relations:GeometryRelation[]=(parsed?.constraints||[]).map(c=>({type:c.type,...('point'in c?{point:c.point}:{}),...('of'in c?{of:c.of}:{}),...('a'in c?{objects:[c.a.join(''),c.b.join('')]}:{}),source:parsed!.given,role:'given',detail:c}));
 const center=normalized.match(/(?:hình bình hành|hình chữ nhật|hình thoi|hình vuông)\s+([A-Z]{4})\s+(?:có\s+)?tâm\s+([A-Z])/iu);
 if(center)relations.push({type:'centerOf',object:center[2].toUpperCase(),target:center[1].toUpperCase(),source:center[0],role:'given'});
 const goal=goalOf(normalized);for(const m of goal.matchAll(/([A-Z]{2})\s*(∥|⟂|=|song song(?: với)?|vuông góc(?: với)?)\s*([A-Z]{2})/gu))relations.push({type:/∥|song/.test(m[2])?'parallel':/⟂|vuông/.test(m[2])?'perpendicular':'equal',objects:[m[1],m[3]],source:m[0],role:'goal'});
 return relations;
}
/** A directed segment through a known point + membership determines an intersection. */
function solveDirectionalPoints(p:ParsedProblem){
 for(const c of p.constraints){if(c.type!=='parallel'&&c.type!=='perpendicular')continue;
  for(const [target,base] of [[c.a,c.b],[c.b,c.a]] as [Segment,Segment][]){
   for(const [through,n] of [target,[...target].reverse()] as Segment[]){
    const i=p.recipe.points.findIndex(x=>x.name===n&&x.op==='on');const cp=p.recipe.points[i];
    if(i>=0&&cp.op==='on'&&!base.includes(n)&&through!==n){p.recipe.points[i]={name:n,op:'intersection',lines:[{through,of:base,relation:c.type},cp.of]};break;}
   }
  }
 }
}
/** Structural and numeric checks are independent from parsing and rendering. */
export function validateGeometryModel(m:GeometryModel){
 const errors:string[]=[],d=m.drawing;
 const point=(n:string)=>{if(!d.points[n]){errors.push('Thiếu điểm '+n);return null;}return d.points[n];};
 if(!Object.keys(d.points).length)errors.push('Chưa có điểm xác định.');
 for(const [n,p] of Object.entries(d.points))if(!/^[A-Z](?:[0-9]{1,2}|['′]{1,2})?$/.test(n)||!Number.isFinite(p.x+p.y))errors.push('Điểm không hợp lệ '+n);
 for(const entity of m.entities)if(Object.hasOwn(defaults,entity.type))try{const q=entity.id.split('').map(n=>{const p=point(n);if(!p)throw Error('Thiếu đỉnh hình.');return p;});validateShape(entity.type as Shape,q);}catch(e){errors.push(e instanceof Error?e.message:'Loại hình chưa đúng.');}
 for(const circle of d.circles||[])if(!point(circle.center)||!Number.isFinite(circle.radius)||circle.radius<=0)errors.push('Tâm hoặc bán kính đường tròn chưa hợp lệ.');
 for(const seg of d.segments){if(seg.length!==2||seg[0]===seg[1])errors.push('Đoạn không có hai đầu mút phân biệt.');seg.forEach(point);}
 for(const rel of m.relations.filter(r=>r.role!=='goal')){
  try{
   if(rel.angle){const a=rel.angle,q=a.names.split('').map(point);if(q.some(p=>!p)||Math.abs(angleDegrees(q[0]!,q[1]!,q[2]!)-a.degrees)>1e-6)throw Error('Góc chưa đúng dữ kiện.');}
   if(rel.detail)verifyConstraints(d,[rel.detail as Constraint]);
   if(rel.type==='centerOf'&&rel.object&&rel.target){const q=rel.target.split('').map(point),o=point(rel.object);if(o&&q.every(Boolean)&&(!near(distance(o,lerp(q[0]!,q[2]!,.5)),0)||!near(distance(o,lerp(q[1]!,q[3]!,.5)),0)))throw Error('Tâm không phải trung điểm cả hai đường chéo.');}
   if(rel.type==='tangent'&&rel.point&&rel.target){const g=d.guides?.find(g=>g.name===rel.object),o=point(rel.target),p=point(rel.point);if(!g||!o||!p||!onSegment(p,g.a,g.b)||!perpendicular(o,p,g.a,g.b))throw Error('Tiếp tuyến chưa đúng tại tiếp điểm.');}
   if(rel.type==='onCircle'&&rel.point){const circle=d.circles?.find(c=>c.center===rel.target),p=point(rel.point);if(!circle||!p||!near(distance(p,d.points[circle.center]),circle.radius))throw Error('Điểm không thuộc đường tròn.');}
  }catch(e){errors.push(e instanceof Error?e.message:'Quan hệ chưa hợp lệ.');}
 }
 return {valid:errors.length===0,checks:d.checks,errors:[...new Set(errors)]};
}

function circleDrawing(source:string):{drawing:Drawing;relations:GeometryRelation[];rest:string;assumptions:string[]}|null{
 let rest=problemParts(source).given;
 const m=rest.match(/đường tròn\s*(?:tâm\s*)?\(?([A-Z])(?:\s*;\s*([0-9]+(?:[.,][0-9]+)?|R))?\)?(?:\s*(?:có\s+)?bán kính\s*(?:R\s*=\s*)?([0-9]+(?:[.,][0-9]+)?))?/iu);if(!m)return null;
 const O=m[1].toUpperCase(),radius=Number((m[3]||m[2]||'3').replace(',','.'))||3;if(!(radius>0&&radius<1e4))throw Error('Bán kính phải dương.');rest=rest.replace(m[0],' ').replace(/\bcm\b/giu,' ');
 const d:Drawing={title:'Hình đường tròn theo giả thiết',points:{[O]:{x:0,y:0}},outline:[],segments:[],marks:[],circles:[{center:O,radius}],guides:[],checks:['Đường tròn tâm '+O]},relations:GeometryRelation[]=[],assumptions:string[]=[];
 const putCircle=(n:string,t:number)=>{if(d.points[n]){if(!near(distance(d.points[n],d.points[O]),radius))throw Error('Điểm '+n+' không thể vừa là tâm vừa thuộc đường tròn.');return;}d.points[n]={x:radius*Math.cos(t),y:radius*Math.sin(t)};relations.push({type:'onCircle',point:n,target:O,source:'Điểm trên đường tròn được nêu trong đề',role:'given'});};
 rest=rest.replace(/đường kính\s+([A-Z]{2})/giu,(_s,ab)=>{putCircle(ab[0],0);putCircle(ab[1],Math.PI);d.segments.push(pair(ab));d.checks.push(ab+' là đường kính');return ' ';});
 rest=rest.replace(/dây(?:\s+cung)?\s+([A-Z]{2})/giu,(_s,ab)=>{putCircle(ab[0],.35);putCircle(ab[1],2.2);d.segments.push(pair(ab));d.checks.push(ab+' là dây cung');return ' ';});
 rest=rest.replace(/([A-Z](?:\s*(?:,|và)\s*[A-Z])*)\s*(?:thuộc|nằm trên|∈)\s*(?:đường tròn\s*)?\(?([A-Z])\)?/giu,(_s,ns,o)=>{if(o!==O)throw Error('Chưa xác định đường tròn '+o);ns.match(/[A-Z]/g).forEach((n:string,i:number)=>putCircle(n,.35+i*1.3));return ' ';});
 rest=rest.replace(/bán kính\s+([A-Z]{2})/giu,(_s,ab)=>{if(!ab.includes(O))throw Error('Bán kính phải có một đầu mút ở tâm.');putCircle(ab.replace(O,''),.35);d.segments.push(pair(ab));return ' ';});
 rest=rest.replace(/(?:kẻ\s+)?(?:tiếp tuyến\s+([a-z])?\s*(?:của\s+đường tròn\s*\([A-Z]\)\s*)?tại\s+([A-Z])|([a-z])\s+là\s+tiếp tuyến\s+tại\s+([A-Z]))/gu,(_s,name,a,name2,a2)=>{
  const n=a||a2;putCircle(n,.35);const p=d.points[n],v=sub(p,d.points[O]);const q={x:-v.y,y:v.x};d.guides!.push({name:name||name2||'',a:{x:p.x-q.x,y:p.y-q.y},b:{x:p.x+q.x,y:p.y+q.y}});d.segments.push([O,n]);d.checks.push('Tiếp tuyến tại '+n+' vuông góc '+O+n);relations.push({type:'tangent',point:n,target:O,object:name||name2||'',source:_s,role:'given'});return ' ';
 });
 const mids=rest.matchAll(/([A-Z])\s+(?:là\s+)?trung điểm\s+(?:của\s+)?([A-Z]{2})/giu);
 for(const m of mids){const[a,b]=pair(m[2]);if(d.points[a]&&d.points[b]){d.points[m[1]]=lerp(d.points[a],d.points[b],.5);d.marks.push({type:'equal',segments:[[a,m[1]],[m[1],b]]});relations.push({type:'midpoint',point:m[1],of:[a,b],source:m[0],role:'given',detail:{type:'midpoint',point:m[1],of:[a,b]}});rest=rest.replace(m[0],' ');}}
 rest=rest.replace(/nối\s+([A-Z])\s+(?:với\s+)?([A-Z])/giu,(_s,a,b)=>{d.segments.push([a,b]);return ' ';}).replace(/nối\s+([A-Z]{2})/giu,(_s,ab)=>{d.segments.push(pair(ab));return ' ';});
 if(Object.keys(d.points).length===1)assumptions.push('Chỉ có tâm và đường tròn; các điểm chưa được định nghĩa sẽ chưa nối vào hình.');
 return {drawing:d,relations,rest:clean(rest),assumptions};
}

function partialDrawing(parsed:ParsedProblem|null,source:string,assumptions:string[],errors:string[]):Drawing{
 if(parsed){
  const r:Recipe={...structuredClone(parsed.recipe),points:[],segments:[],marks:[],guides:[]};let d=construct(r);
  let todo=parsed.recipe.points.slice();
  for(let pass=0;pass<25&&todo.length;pass++){let made=false;todo=todo.filter(cp=>{try{const candidate=construct({...r,points:[...r.points,cp]});r.points.push(cp);d=candidate;made=true;return false;}catch{return true;}});if(!made)break;}
  for(const cp of todo)errors.push('Chưa dựng điểm '+cp.name+': thiếu định nghĩa hoặc quan hệ mâu thuẫn.');
  for(const s of parsed.recipe.segments)if(s.every(n=>d.points[n]))r.segments.push(s);
  for(const line of parsed.recipe.guides||[])try{construct({...r,guides:[...(r.guides||[]),line]});r.guides!.push(line);}catch{}
  d=construct(r);d.checks=['Phần hình đã dựng theo các định nghĩa xác định được'];
  for(const c of parsed.constraints)try{d.checks.push(...verifyConstraints(d,[c]));}catch(e){errors.push((e as Error).message);}
  assumptions.push('Hình tạm chỉ thể hiện phần dữ kiện đã đọc; các điều kiện ghi ở mục cần xác nhận chưa được bảo đảm đồng thời.');return d;
 }
 const ns=namesIn(problemParts(source).given).slice(0,12),points:Record<string,XY>={};ns.forEach((n,i)=>{points[n]={x:(i%4)*2,y:Math.floor(i/4)*2};});
 if(!ns.length){assumptions.push('Đề chưa xác định được đối tượng: tạm minh họa tam giác A, B, C. Cả loại hình và các tên điểm này đều là giả định để xem trước, không phải dữ kiện đề bài.');return {title:'Minh họa tạm theo giả định: tam giác ABC',points:{A:{x:0,y:0},B:{x:4,y:0},C:{x:1,y:2.5}},outline:['A','B','C'],segments:[],marks:[],checks:['Các điểm A, B, C là tên tạm; cần xác nhận đề.']};}
 assumptions.push('Vị trí các điểm chỉ là bố trí tạm để đọc tên; chưa nối đoạn khi chưa xác định quan hệ.');
 return {title:'Hình tạm chờ xác nhận dữ kiện',points,outline:[],segments:[],marks:[],checks:[]};
}

function compileGeometryInternal(problem:string,reply='',correction=''):GeometryModel{
 const source=problem.slice(0,12000),normalized=canonicalize(source);let originalGoal=goalOf(normalized);
 let input=normalized;if(correction.trim()){const p=problemParts(normalized);if(/^\s*(?:Cho|Hình|Tam giác|Tứ giác|Đường tròn)\s/iu.test(correction)){input=canonicalize(correction);originalGoal=goalOf(input);}else input=p.given+' '+canonicalize(correction)+'. '+originalGoal;}
 const assumptions:string[]=correction.trim()?['Dữ kiện bổ sung do người học xác nhận: '+correction.trim()]:[],errors:string[]=[],missing:string[]=[];
 let parsed:ParsedProblem|null=null,d:Drawing|undefined,relations:GeometryRelation[]=[],status:GeometryModel['status']='verified';
 try{parsed=parseProblem(input);}catch(e){errors.push((e as Error).message);try{const shape=input.match(/(?:hình (?:bình hành|chữ nhật|thoi|vuông|thang cân|thang)|tứ giác(?: lồi)?|tam giác)\s+[A-Z]{3,4}/iu);if(shape)parsed=parseProblem(shape[0]);}catch{}}
 relations=relationsOf(parsed,input);
 try{
  const strict=resolveTutorDiagram(input,reply);
  if(strict.status==='ready')d=strict.drawing;
  else if(/đường tròn/iu.test(input)){
   const circle=circleDrawing(input);if(circle){d=circle.drawing;relations.push(...circle.relations);assumptions.push(...circle.assumptions);if(circle.rest)missing.push('Cần làm rõ: '+circle.rest);}
  }else if(parsed){solveDirectionalPoints(parsed);if(!parsed.remainder)d=satisfy(parsed);else missing.push('Cần xác nhận cách hiểu: '+parsed.remainder);}
 }catch(e){errors.push((e as Error).message);}
 if(!d)try{const extended=solveExtended(input);if(extended){d=extended.drawing;parsed=extended.parsed;relations=relationsOf(parsed,input);relations.push(...extended.angles.map(a=>({type:'angle',angle:a,source:a.source,role:'given' as const})));errors.length=0;missing.length=0;}}catch(e){errors.push((e as Error).message);}
 if(!d){d=partialDrawing(parsed,input,assumptions,errors);status='provisional';}
 attachGoalSegments(d,originalGoal);
 // Mark only given/inherent right angles, never a goal awaiting proof.
 const addRight=(a:XY,b:XY,c:XY,e:XY)=>{try{if(!perpendicular(a,b,c,e))return;const at=intersection(a,b,c,e);if(!onSegment(at,a,b)||!onSegment(at,c,e))return;const armA=distance(at,a)>1e-5?a:b,armB=distance(at,c)>1e-5?c:e;(d!.rightAngles??=[]).push({at,a:armA,b:armB});}catch{}};
 for(const rel of relations){const c=rel.detail as Constraint|undefined;if(c?.type==='perpendicular'&&[...c.a,...c.b].every(n=>d!.points[n]))addRight(d.points[c.a[0]],d.points[c.a[1]],d.points[c.b[0]],d.points[c.b[1]]);}
 if(parsed&&['rectangle','square','right-triangle'].includes(parsed.recipe.kind)){const v=parsed.recipe.vertices;if(v.every(n=>d!.points[n]))addRight(d.points[v[0]],d.points[v[1]],d.points[v[0]],d.points[v.at(-1)!]);}
 for(const rel of relations.filter(r=>r.type==='tangent')){const guide=d.guides?.find(g=>g.name===rel.object);if(guide&&rel.target&&rel.point)addRight(d.points[rel.target],d.points[rel.point],guide.a,guide.b);}
 const angleRelations=relations.filter(r=>r.angle);for(const rel of angleRelations){const a=rel.angle!;if(angleRelations.filter(r=>Math.abs(r.angle!.degrees-a.degrees)<1e-7).length>1&&a.names.split('').every(n=>d!.points[n]))(d.angleMarks??=[]).push({at:d.points[a.names[1]],a:d.points[a.names[0]],b:d.points[a.names[2]],group:a.degrees});}
 // Rays are strokes with direction; never invented named endpoints.
 for(const m of problemParts(input).given.matchAll(/tia\s+([A-Z]{2})(?![\p{L}])/gu))if(pair(m[1]).every(n=>d!.points[n]))(d.rays??=[]).push({from:m[1][0],through:m[1][1]});
 for(const n of namesIn(originalGoal))if(!d.points[n])missing.push('Điểm '+n+' xuất hiện trong mục tiêu nhưng chưa có định nghĩa.');
 const entities=[...new Set([...Object.keys(d.points),...namesIn(input)])].map(id=>({id,type:'point'}));if(parsed)entities.push({id:parsed.recipe.vertices.join(''),type:parsed.recipe.kind});for(const c of d.circles||[])entities.push({id:'circle-'+c.center,type:'circle'});for(const s of d.segments)entities.push({id:s.join(''),type:'segment'});
 const model:GeometryModel={version:'5.0',source,normalized:input,entities,relations,givens:parsed?[parsed.given]:[problemParts(input).given],goal:originalGoal,auxiliaries:[...source.matchAll(/(?:nối|kẻ|vẽ|qua)\s+[^.;]+/giu)].map(m=>m[0]),assumptions,confidence:1,missingInformation:missing,validation:{valid:false,checks:[],errors:[]},status,drawing:d};
 const checked=validateGeometryModel(model);model.validation={...checked,errors:[...new Set([...errors,...checked.errors])]};model.validation.valid=model.validation.errors.length===0&&missing.length===0;
 if(!model.validation.valid||assumptions.some(a=>!a.startsWith('Dữ kiện bổ sung'))){model.status='provisional';model.confidence=.4;model.missingInformation=[...new Set([...missing,...model.validation.errors])];if(!assumptions.length)assumptions.push('Chỉ sử dụng các quan hệ đã kiểm tra được; phần chưa rõ đang chờ em xác nhận.');}
 return model;
}

/** Malformed input cannot break the React tree. No assumed segment is rendered. */
export function compileGeometry(problem:string,reply='',correction=''):GeometryModel{
 try{return compileGeometryInternal(problem,reply,correction);}catch(e){const message=e instanceof Error?e.message:'Dữ kiện chưa hợp lệ',assumptions=['Chưa thể xác nhận quan hệ; không được dùng hình tạm để kết luận.'],drawing=partialDrawing(null,problem,assumptions,[]);return {version:'5.0',source:problem,normalized:normalizeProblem(problem),entities:Object.keys(drawing.points).map(id=>({id,type:'point'})),relations:[],givens:[],goal:goalOf(problem),auxiliaries:[],assumptions,confidence:0,missingInformation:[message],validation:{valid:false,checks:[],errors:[message]},status:'provisional',drawing };}
}
