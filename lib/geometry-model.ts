import {construct, distance, near, onSegment, perpendicular, type Drawing, type XY, type Segment} from './geometry';
import {normalizeProblem, parseProblem, problemParts, satisfy, type ParsedProblem} from './problem-diagram';
import {resolveTutorDiagram} from './diagram-interpretation';

export type GeometryEntity = {name:string;type:'point'|'segment'|'line'|'ray'|'circle'|'polygon';points?:string[];coordinates?:XY;radius?:number};
export type GeometryRelation = {type:string;description:string;source:string;verified:boolean;data?:unknown};
export type GeometryModel = {
 version:'5.0'; original:string; normalized:string; entities:GeometryEntity[]; relations:GeometryRelation[];
 givens:string[]; goal:string; auxiliaryLines:string[]; assumptions:string[]; missingData:string[];
 questions:string[]; confidence:number; status:'verified'|'provisional'; drawing:Drawing;
};

const namesIn=(text:string)=>[...new Set([...text.matchAll(/(?<![\p{L}\p{N}])[A-Z]{1,4}(?![\p{L}\p{N}])/gu)]
 .filter(m=>!['CM','CMR','CHO','VA'].includes(m[0])).flatMap(m=>m[0].split('')))];
const goalOf=(text:string)=>text.match(/(?:chứng minh(?: rằng)?|cmr|tính)\s*[:：]?\s*([\s\S]+)/iu)?.[1].trim()||'';

function entitiesOf(d:Drawing):GeometryEntity[]{
 return [
  ...Object.entries(d.points).map(([name,coordinates])=>({name,type:'point' as const,coordinates})),
  ...(d.outline.length?[{name:d.outline.join(''),type:'polygon' as const,points:d.outline}]:[]),
  ...d.segments.map(points=>({name:points.join(''),type:'segment' as const,points})),
  ...(d.guides||[]).map((g,i)=>({name:g.name||'d'+(i+1),type:'line' as const})),
  ...(d.circles||[]).map(c=>({name:'('+c.center+')',type:'circle' as const,points:[c.center],radius:c.radius})),
  ...(d.rays||[]).map(r=>({name:r.from+r.through,type:'ray' as const,points:[r.from,r.through]})),
 ];
}

/** An explicit provisional layout. Coordinates are never promoted to givens or proof. */
function scaffold(source:string):Drawing{
 const names=namesIn(source).slice(0,24),points:Record<string,XY>={};
 names.forEach((name,i)=>{points[name]={x:(i%5)*2,y:-Math.floor(i/5)*2+(i%2)*.35};});
 return {title:'Hình tạm — cần xác nhận dữ kiện',points,outline:[],segments:[],marks:[],checks:[]};
}

function partialDrawing(parsed:ParsedProblem|null,source:string):{drawing:Drawing;validated:boolean;error?:string}{
 if(parsed){
  try{return {drawing:satisfy(parsed),validated:true};}catch(e){
   // Preserve only a valid base when a relation conflicts or refers to an undefined point.
   try{return {drawing:construct({...parsed.recipe,points:[],segments:[],marks:[],guides:[]}),validated:false,error:String((e as Error).message)};}catch{/* show named objects below */}
  }
 }
 return {drawing:scaffold(source),validated:false};
}

/** Deterministic circle/radius/diameter/tangent construction, with an unconsumed-text check. */
function circleModel(source:string):{drawing:Drawing;rest:string;assumptions:string[];relations:GeometryRelation[]}|null{
 const given=problemParts(source).given;
 const match=given.match(/đường\s+tròn\s*(?:tâm\s+)?\(?([A-Z])\)?(?![\p{L}])/iu);
 if(!match)return null;
 const center=match[1].toUpperCase(),assumptions:string[]=[],relations:GeometryRelation[]=[];
 let rest=given.replace(match[0],' '),radius=3;
 const points:Record<string,XY>={[center]:{x:0,y:0}},segments:Segment[]=[],guides:NonNullable<Drawing['guides']>=[],marks:Drawing['marks']=[];
 const addRelation=(type:string,description:string)=>relations.push({type,description,source:given,verified:true});
 const ensureOn=(name:string)=>{name=name.toUpperCase();if(name===center)throw Error('Tâm không thể thuộc đường tròn có bán kính dương.');if(!points[name]){const index=Object.keys(points).length-1,angle=index*1.31;points[name]={x:radius*Math.cos(angle),y:radius*Math.sin(angle)};}return name;};
 const numeric=rest.match(/bán\s+kính\s+(?:([A-Z]{2}|R)\s*=\s*)?(\d+(?:[.,]\d+)?)\s*(?:cm|dm|m)?/iu);
 if(numeric){radius=Number(numeric[2].replace(',','.'));if(radius<=0)throw Error('Bán kính phải dương.');rest=rest.replace(numeric[0],' ');
  if(numeric[1]?.length===2){const ends=numeric[1].toUpperCase().split('');if(!ends.includes(center))throw Error('Bán kính phải có một đầu tại tâm.');const name=ensureOn(ends.find(n=>n!==center)!);segments.push([center,name]);}
 }else assumptions.push('Bán kính chưa có số đo: chọn 3 đơn vị để minh họa, không dùng làm dữ kiện tính toán.');
 rest=rest.replace(/bán\s+kính\s+([A-Z]{2})(?![\p{L}])/giu,(_s,segment:string)=>{const ns=segment.toUpperCase().split('');if(!ns.includes(center))throw Error('Bán kính không đi qua tâm đã cho.');const n=ensureOn(ns.find(x=>x!==center)!);segments.push([center,n]);return ' ';});
 rest=rest.replace(/đường\s+kính\s+([A-Z]{2})(?![\p{L}])/giu,(_s,segment:string)=>{const [a,b]=segment.toUpperCase().split('');if(a===b||a===center||b===center)throw Error('Hai đầu đường kính phải khác nhau và khác tâm.');points[a]={x:radius,y:0};points[b]={x:-radius,y:0};segments.push([a,b]);addRelation('diameter',segment.toUpperCase()+' là đường kính qua '+center);return ' ';});
 const circleRef=String.raw`(?:đường\s+tròn\s*)?\(?${center}\)?`;
 rest=rest.replace(new RegExp(String.raw`(?<![\p{L}])([A-Z](?:\s*(?:,|và)\s*[A-Z])*)\s*(?:thuộc|∈|nằm\s+trên)\s*${circleRef}(?![\p{L}])`,'giu'),(_s,ns:string)=>{for(const m of ns.matchAll(/[A-Z]/giu))ensureOn(m[0]);return ' ';});
 rest=rest.replace(/(?:(?:kẻ|vẽ)\s+)?(?:([A-Z]{2}|[a-z])\s+là\s+)?tiếp\s+tuyến(?:\s+([A-Z]{2}|[a-z]))?(?:\s+của\s+\([A-Z]\))?\s+tại\s+([A-Z])(?![\p{L}])/giu,(_s,before:string,after:string,at:string)=>{
  const n=ensureOn(at),p=points[n],v={x:-p.y/radius,y:p.x/radius},name=before||after||'';
  const a={x:p.x-v.x*radius*1.15,y:p.y-v.y*radius*1.15},b={x:p.x+v.x*radius*1.15,y:p.y+v.y*radius*1.15};
  if(!perpendicular(points[center],p,a,b))throw Error('Tiếp tuyến chưa vuông góc với bán kính.');
  guides.push({name:name.length===1?name:'',a,b});segments.push([center,n]);
  if(name.length===2){const ends=name.toUpperCase().split('');if(!ends.includes(n))throw Error('Tiếp tuyến phải đi qua tiếp điểm.');const other=ends.find(x=>x!==n)!;if(points[other])throw Error('Cần đối chiếu thêm vị trí điểm trên tiếp tuyến.');points[other]=b;segments.push([n,other]);marks.push({type:'right',at:n,arms:[center,other]});assumptions.push(other+' được chọn trên tiếp tuyến; khoảng cách tới '+n+' chưa có số đo.');}
  addRelation('tangent','Tiếp tuyến tại '+n+' vuông góc với '+center+n);return ' ';
 });
 rest=rest.replace(/nối\s+([A-Z])\s+(?:với\s+)?([A-Z])(?![\p{L}])/giu,(_s,a:string,b:string)=>{a=a.toUpperCase();b=b.toUpperCase();if(!points[a]||!points[b])throw Error('Chưa xác định đầu mút đoạn nối.');segments.push([a,b]);return ' ';});
 for(const [name,p] of Object.entries(points)){if(name!==center&&near(distance(p,points[center]),radius))addRelation('onCircle',name+' thuộc ('+center+'), '+center+name+' = bán kính');}
 rest=rest.replace(/(?<![\p{L}\p{N}])(?:cho|gọi|và|có|kẻ|vẽ|lấy|điểm)(?![\p{L}\p{N}])/giu,' ').replace(/[\s.,;:()]+/g,' ').trim();
 const drawing:Drawing={title:'Đường tròn và các quan hệ đã đọc',points,outline:[],segments,marks,guides,circles:[{center,radius}],checks:relations.map(r=>r.description)};
 return {drawing,rest,assumptions,relations};
}

export function compileGeometry(problem:string,reply=''):GeometryModel{
 const normalized=normalizeProblem(problem),parts=problemParts(normalized),goal=goalOf(normalized);
 const model:GeometryModel={version:'5.0',original:problem,normalized,entities:[],relations:[],givens:[],goal,auxiliaryLines:[],assumptions:[],missingData:[],questions:[],confidence:0,status:'provisional',drawing:scaffold(parts.given)};
 if(!normalized){model.missingData.push('Chưa nhập đề bài.');return model;}
 const rays=[...parts.given.matchAll(/(?:vẽ|dựng|kẻ)\s+tia\s+([A-Z]{2})(?![\p{L}])/giu)].map(m=>m[1].toUpperCase());
 const readable=normalized.replace(/(?:vẽ|dựng|kẻ)\s+tia\s+([A-Z]{2})(?![\p{L}])/giu,(_s,n:string)=>'nối '+n);
 let parsed:ParsedProblem|null=null,parseError='';
 try{parsed=parseProblem(readable);}catch(e){parseError=(e as Error).message;}
 const strict=resolveTutorDiagram(readable,reply);
 if(strict.status==='ready'){
  model.drawing=strict.drawing;model.status='verified';model.confidence=1;
 }else if(/đường\s+tròn/iu.test(parts.given)){
  try{const circle=circleModel(normalized);if(circle){model.drawing=circle.drawing;model.assumptions.push(...circle.assumptions);model.relations.push(...circle.relations);if(circle.rest){model.missingData.push('Chưa đối chiếu: '+circle.rest);model.confidence=.5;}else{model.status='verified';model.confidence=1;}}}catch(e){model.missingData.push((e as Error).message);}
 }else{
  const partial=partialDrawing(parsed,parts.given);model.drawing=partial.drawing;
  if(partial.validated){model.confidence=.6;}else{model.confidence=.15;model.drawing.checks=[];}
  if(parsed?.remainder)model.missingData.push('Chưa đối chiếu: '+parsed.remainder);
  if(parseError||partial.error)model.missingData.push(parseError||partial.error!);
  if(!parsed&&!parseError)model.missingData.push('Chưa xác định được loại hình và vị trí các điểm từ câu đã nhập.');
  if(partial.validated&&parsed)model.relations.push(...parsed.constraints.map(c=>({type:c.type,description:JSON.stringify(c),source:parsed!.given,verified:true,data:c})));
 }
 if(model.status==='verified'&&parsed){
  model.relations.push(...parsed.constraints.map(c=>({type:c.type,description:JSON.stringify(c),source:parsed!.given,verified:true,data:c})));
  model.relations.unshift({type:'shape',description:parsed.recipe.kind+' '+parsed.recipe.vertices.join(''),source:parsed.given,verified:true});
 }
 if(model.status==='provisional'){
  model.drawing.title='Hình tạm — cần xác nhận dữ kiện';
  model.assumptions.unshift('Chỉ các quan hệ trong mục đã đối chiếu được xác nhận. Phần còn thiếu chưa được dùng để suy luận.');
  if(!model.drawing.checks.length)model.assumptions.push('Vị trí đang hiển thị chỉ bố trí các đối tượng; chưa thỏa toàn bộ giả thiết.');
  if(!model.missingData.length)model.missingData.push('Cần làm rõ vị trí điểm hoặc quan hệ trong đề.');
  model.questions.push('Em xác nhận hoặc bổ sung dữ kiện ở mục cần làm rõ để dựng lại hình được không?');
 }
 if(parsed?.recipe.points.some(p=>p.op==='on'))model.assumptions.push('Các điểm tự do trên đoạn được chọn ở vị trí đại diện; không xem tỉ lệ đo trên hình là giả thiết.');
 if(!goal){model.missingData.push('Chưa nêu mục tiêu chứng minh hoặc tính toán.');model.questions.push('Bài yêu cầu chứng minh hay tính đại lượng nào?');}
 for(const s of rays){if(model.drawing.points[s[0]]&&model.drawing.points[s[1]])(model.drawing.rays??=[]).push({from:s[0],through:s[1]});}
 // Only draw goals whose endpoints already exist, never solve their relations.
 for(const m of goal.matchAll(/(?<![A-Z])[A-Z]{2}(?![A-Z])/g)){
  const pair=m[0].split('') as Segment;if(pair[0]!==pair[1]&&pair.every(n=>model.drawing.points[n])&&!model.drawing.segments.some(s=>s.includes(pair[0])&&s.includes(pair[1])))model.drawing.segments.push(pair);
 }
 // Right-angle marks require a numerically verified given, never a goal.
 for(const relation of model.relations){const c=relation.data as {type?:string;a?:Segment;b?:Segment}|undefined;if(c?.type!=='perpendicular'||!c.a||!c.b)continue;
  const p=model.drawing.points,a=c.a,b=c.b;if(![...a,...b].every(n=>p[n]))continue;
  const common=Object.keys(p).find(n=>onSegment(p[n],p[a[0]],p[a[1]])&&onSegment(p[n],p[b[0]],p[b[1]]));if(!common)continue;
  const u=a.find(n=>distance(p[n],p[common])>1e-7),v=b.find(n=>distance(p[n],p[common])>1e-7);
  if(u&&v&&perpendicular(p[common],p[u],p[common],p[v])&&!model.drawing.marks.some(m=>m.type==='right'&&m.at===common))model.drawing.marks.push({type:'right',at:common,arms:[u,v]});
 }
 model.givens=model.drawing.checks;
 model.entities=entitiesOf(model.drawing);
 model.auxiliaryLines=model.drawing.segments.filter(s=>!model.drawing.outline.some((n,i)=>s.includes(n)&&s.includes(model.drawing.outline[(i+1)%model.drawing.outline.length]))).map(s=>s.join(''));
 return model;
}
