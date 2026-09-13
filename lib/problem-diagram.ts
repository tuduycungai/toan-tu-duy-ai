import {lessons} from './learning';
import {construct,defaults,distance,intersection,lerp,near,onSegment,parallel,perpendicular,type Recipe,type Drawing,type Segment,type Construction,type DiagramResult,type Shape,type XY} from './geometry';

export const normalizeProblem=(s:string)=>s.normalize('NFC').replace(/\\(?:perp)/g,'⟂').replace(/\\(?:parallel)/g,'∥').replace(/\\(?:cap)/g,'∩').replace(/\\(?:in)\b/g,'∈').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim();
const fingerprint=(s:string)=>normalizeProblem(s).replace(/[“”"]/g,'').replace(/\s*([,;:.!?])\s*/g,'$1').toLocaleLowerCase('vi');
const pair=(s:string):Segment=>[s.replace(/\s/g,'')[0].toUpperCase(),s.replace(/\s/g,'')[1].toUpperCase()];
const P=(s:string)=>s.toUpperCase();
export type Constraint=
 | {type:'equal'|'parallel'|'perpendicular';a:Segment;b:Segment}
 | {type:'on'|'midpoint';point:string;of:Segment}
 | {type:'intersection';point:string;lines:[Segment,Segment]}
 | {type:'reflect';point:string;from:string;center:string}
 | {type:'length';of:Segment;value:number}
 | {type:'less';a:Segment;b:Segment};
export type ParsedProblem={recipe:Recipe;constraints:Constraint[];remainder:string;given:string};
function constraintText(c:Constraint):string{switch(c.type){case'equal':return c.a.join('')+' = '+c.b.join('');case'parallel':return c.a.join('')+' ∥ '+c.b.join('');case'perpendicular':return c.a.join('')+' ⟂ '+c.b.join('');case'on':return c.point+' ∈ '+c.of.join('');case'midpoint':return c.point+' là trung điểm '+c.of.join('');case'intersection':return c.point+' = '+c.lines[0].join('')+' ∩ '+c.lines[1].join('');case'reflect':return c.point+' đối xứng với '+c.from+' qua '+c.center;case'length':return c.of.join('')+' = '+c.value;case'less':return c.a.join('')+' < '+c.b.join('');}}
export function verifyConstraints(d:Drawing,cs:Constraint[]):string[]{
 const p=(n:string)=>{if(!d.points[n])throw Error('Chưa dựng điểm '+n);return d.points[n];};const len=(s:Segment)=>distance(p(s[0]),p(s[1]));
 const checks:string[]=[];for(const c of cs){let ok=false;
 switch(c.type){case'equal':ok=near(len(c.a),len(c.b));break;case'parallel':ok=parallel(...c.a.map(p) as [XY,XY],...c.b.map(p) as [XY,XY]);break;case'perpendicular':ok=perpendicular(...c.a.map(p) as [XY,XY],...c.b.map(p) as [XY,XY]);break;
 case'on':ok=onSegment(p(c.point),p(c.of[0]),p(c.of[1]));break;case'midpoint':ok=near(distance(p(c.point),lerp(p(c.of[0]),p(c.of[1]),.5)),0);break;
 case'intersection':ok=near(distance(p(c.point),intersection(p(c.lines[0][0]),p(c.lines[0][1]),p(c.lines[1][0]),p(c.lines[1][1]))),0);break;
 case'reflect':ok=near(distance(p(c.point),lerp(p(c.from),p(c.center),2)),0);break;
 case'length':ok=near(len(c.of),c.value);break;case'less':ok=len(c.a)<len(c.b)-1e-7;break;}
 if(!ok)throw Error('Hình không thỏa '+constraintText(c));checks.push(constraintText(c));}
 return checks;
}

/** Only consumes understood givens. Unknown text is retained and prevents drawing. */
export function parseProblem(problem:string):ParsedProblem|null{
 const full=normalizeProblem(problem);let given=full.split(/\bchứng\s+minh\b|\bcmr\b|\ba\)\s*|\btính\b|\bhãy\s+kiểm\s+tra\b/iu)[0];
 // Later subquestions can introduce real data too (e.g. b) Biết AB = 8, CD = 14).
 let tail=full.slice(given.length);
 tail=tail.replace(/\b(biết|gọi)\s+(.+?)(?=\b(?:tính|chứng minh|cmr)\b|\b[a-e]\)|$)/giu,(_m,verb,data)=>{given+=' '+verb+' '+data;return ' ';});
 const extraConditions=/(?<![\p{L}])(?:nếu|lấy|kẻ|bổ sung|thêm điều kiện|giả sử)(?![\p{L}])/iu.test(tail);
 let rest=given;
 const shape=rest.match(/(?:hình (bình hành|chữ nhật|thoi|vuông|thang cân|thang)|tứ giác(?: lồi)?|tam giác)\s+([A-Z]{3,4})\b/iu);if(!shape)return null;
 const kind:Shape=shape[0].toLowerCase().startsWith('tam')?'triangle':({'bình hành':'parallelogram','chữ nhật':'rectangle','thoi':'rhombus','vuông':'square','thang cân':'isosceles-trapezoid','thang':'trapezoid'} as Record<string,Shape>)[(shape[1]||'').toLowerCase()]||'quadrilateral';
 const vertices=P(shape[2]).split('');const recipe:Recipe={title:'Hình vẽ theo giả thiết',kind,vertices,points:[],segments:[],marks:[]};rest=rest.replace(shape[0],' ');const constraints:Constraint[]=[];
 const consume=(re:RegExp,fn:(...s:string[])=>void)=>{rest=rest.replace(re,(...args:unknown[])=>{fn(...args.slice(1,-2) as string[]);return ' ';});};
 const add=(c:Construction)=>{const old=recipe.points.find(p=>p.name===c.name);if(old&&JSON.stringify(old)!==JSON.stringify(c))throw Error('Điểm '+c.name+' có nhiều định nghĩa.');if(!old)recipe.points.push(c);};
 const on=(n:string,s:string)=>{n=P(n);const of=pair(s);if(!recipe.points.some(p=>p.name===n))add({name:n,op:'on',of,ratio:.32+(recipe.points.length%3)*.07});constraints.push({type:'on',point:n,of});};
 const mid=(n:string,s:string)=>{n=P(n);const of=pair(s);add({name:n,op:'midpoint',of});constraints.push({type:'midpoint',point:n,of});};
 const inter=(n:string,a:Segment,b:Segment)=>{n=P(n);add({name:n,op:'intersection',lines:[a,b]});constraints.push({type:'intersection',point:n,lines:[a,b]});recipe.segments.push(a,b);};
 if(vertices.length===3){consume(/vuông\s+tại\s+([A-Z])\b/giu,n=>{const i=vertices.indexOf(P(n));if(i<0)throw Error('Đỉnh góc vuông chưa có.');recipe.vertices=[...vertices.slice(i),...vertices.slice(0,i)];recipe.kind='right-triangle';});consume(/cân\s+tại\s+([A-Z])\b/giu,n=>{const i=vertices.indexOf(P(n));if(i<0||recipe.kind==='right-triangle')throw Error('Chưa hỗ trợ cấu hình này.');recipe.vertices=[...vertices.slice(i),...vertices.slice(0,i)];recipe.kind='isosceles-triangle';});}
 consume(/([A-Z])\s*(?:=|là giao điểm(?: của)?)\s*([A-Z]{2})\s*(?:∩|và)\s*([A-Z]{2})/giu,(n,a,b)=>inter(n,pair(a),pair(b)));
 consume(/([A-Z])\s+là giao điểm(?: của)?\s+hai đường chéo(?:\s+([A-Z]{2})\s+và\s+([A-Z]{2}))?/giu,(n,a,b)=>{if(vertices.length!==4)throw Error('Thiếu đường chéo.');inter(n,a?pair(a):[vertices[0],vertices[2]],b?pair(b):[vertices[1],vertices[3]]);});
 consume(/([A-Z](?:\s*,\s*[A-Z]){1,3})\s+lần lượt là trung điểm(?: của)?\s+([A-Z]{2}(?:\s*(?:,|và)\s*[A-Z]{2}){1,3})/giu,(ns,ss)=>{const names=ns.match(/[A-Z]/gi)||[],segs=ss.match(/[A-Z]{2}/gi)||[];if(names.length!==segs.length)throw Error('Thiếu cặp trung điểm và cạnh.');names.forEach((n,i)=>mid(n,segs[i]));});
 consume(/([A-Z])\s+(?:là\s+)?trung điểm(?: của)?\s+([A-Z]{2})/giu,mid);
 consume(/([A-Z])\s+(?:là điểm\s+)?đối xứng(?: với)?\s+([A-Z])\s+qua\s+([A-Z])/giu,(n,a,m)=>{add({name:P(n),op:'reflect',of:[P(a),P(m)]});constraints.push({type:'reflect',point:P(n),from:P(a),center:P(m)});recipe.segments.push([P(a),P(n)]);});
 consume(/trên\s+(?:cạnh\s+|đoạn(?: thẳng)?\s+)?([A-Z]{2})\s+(?:lấy|chọn)\s+(?:điểm\s+)?([A-Z])/giu,(s,n)=>on(n,s));
 consume(/(?<![A-Z])([A-Z](?:\s*,\s*[A-Z]){1,3})\s*∈\s*([A-Z]{2})/giu,(ns,ss)=>(ns.match(/[A-Z]/gi)||[]).forEach(n=>on(n,ss)));
 consume(/([A-Z])\s+(?:nằm\s+(?:trên|trong)\s+(?:cạnh\s+|đoạn(?: thẳng)?\s+)?|thuộc\s+(?:cạnh\s+|đoạn(?: thẳng)?\s+)?|∈\s*)([A-Z]{2})/giu,on);
 // A point declared on a side and perpendicular from a known vertex is a projection.
 const feet=[...rest.matchAll(/([A-Z]{2})\s*(?:⟂|vuông góc(?: với)?)\s*([A-Z]{2})/giu)];
 for(const m of feet){const line=pair(m[1]),base=pair(m[2]);for(const [from,name] of [line,[...line].reverse()] as Segment[]){const index=recipe.points.findIndex(p=>p.name===name&&p.op==='on'&&unordered(p.of)===unordered(base));if(index>=0&&vertices.includes(from))recipe.points[index]={name,op:'foot',from,of:base};}}
 consume(/hai đường chéo(?:\s+([A-Z]{2})\s+và\s+([A-Z]{2}))?\s+(vuông góc|bằng nhau)(?: với nhau)?/giu,(a,b,t)=>{if(vertices.length!==4)throw Error('Thiếu đường chéo.');constraints.push({type:t.toLowerCase()==='vuông góc'?'perpendicular':'equal',a:a?pair(a):[vertices[0],vertices[2]],b:b?pair(b):[vertices[1],vertices[3]]});});
 // Explicit segment equalities retain endpoint order; CI measures from C, never D.
 consume(/([A-Z]{2})\s*(?:=|bằng)\s*([A-Z]{2})/giu,(a,b)=>constraints.push({type:'equal',a:pair(a),b:pair(b)}));
 consume(/([A-Z]{2})\s*(?:⟂|vuông góc(?: với)?)\s*([A-Z]{2})/giu,(a,b)=>constraints.push({type:'perpendicular',a:pair(a),b:pair(b)}));
 consume(/([A-Z]{2})\s+và\s+([A-Z]{2})\s+bằng nhau/giu,(a,b)=>constraints.push({type:'equal',a:pair(a),b:pair(b)}));
 consume(/([A-Z]{2})\s+và\s+([A-Z]{2})\s+vuông góc(?: với nhau)?/giu,(a,b)=>constraints.push({type:'perpendicular',a:pair(a),b:pair(b)}));
 consume(/([A-Z]{2})\s*(?:∥|song song(?: với)?)\s*([A-Z]{2})/giu,(a,b)=>constraints.push({type:'parallel',a:pair(a),b:pair(b)}));
 consume(/([A-Z]{2})\s*=\s*(\d+(?:[.,]\d+)?)\s*(cm)?\b/giu,(s,v)=>constraints.push({type:'length',of:pair(s),value:Number(v.replace(',','.'))}));
 consume(/([A-Z]{2})\s*<\s*([A-Z]{2})/giu,(a,b)=>constraints.push({type:'less',a:pair(a),b:pair(b)}));
 // Consume connective language only. Any unrecognized condition blocks display.
 rest=rest.replace(/(?<![\p{L}\p{N}])(?:cho|gọi|có|và|sao cho|lấy|kẻ|biết|điểm)(?![\p{L}\p{N}])/giu,' ').replace(/[\s.,;:()]+/g,' ').trim();
 // Named segments/polygons in the question may be drawn, but are NEVER constraints.
 const names=new Set([...recipe.vertices,...recipe.points.map(p=>p.name)]);
 for(const m of full.matchAll(/(?<![A-Z])[A-Z]{2,4}(?![A-Z])/g)){const ns=m[0].split('');if(ns.every(n=>names.has(n))&&new Set(ns).size===ns.length){for(let i=0;i<ns.length-1;i++)recipe.segments.push([ns[i],ns[i+1]]);if(ns.length>2)recipe.segments.push([ns.at(-1)!,ns[0]]);}}
 return {recipe,constraints,remainder:extraConditions?rest+' Phần sau còn điều kiện mới; em hãy gửi riêng từng ý.':rest,given};
}
const unordered=(s:Segment)=>[...s].sort().join('');
function satisfy(parsed:ParsedProblem):Drawing{
 const r:Recipe=structuredClone(parsed.recipe),cs=parsed.constraints,v=r.vertices;
 const isDiag=(s:Segment)=>v.length===4&&[v[0]+v[2],v[1]+v[3]].some(x=>unordered(pair(x))===unordered(s));
 const diagPerp=cs.some(c=>c.type==='perpendicular'&&isDiag(c.a)&&isDiag(c.b)&&unordered(c.a)!==unordered(c.b));
 const diagEqual=cs.some(c=>c.type==='equal'&&isDiag(c.a)&&isDiag(c.b)&&unordered(c.a)!==unordered(c.b));
 if(['parallelogram','rectangle','rhombus','square'].includes(r.kind)){
  const rect=r.kind==='rectangle'||r.kind==='square'||diagEqual;const rhom=r.kind==='rhombus'||r.kind==='square'||diagPerp;
  const chosen=rect&&rhom?'square':rect?'rectangle':rhom?'rhombus':r.kind;r.coords=defaults[chosen].map(([x,y])=>({x,y}));
 }else if(r.kind==='quadrilateral'&&diagPerp){r.coords=(diagEqual?[[0,3],[2,0],[0,-1],[-2,0]]:[[0,3],[3,0],[0,-1],[-2,0]]).map(([x,y])=>({x,y}));}
 // Two given bases determine the horizontal dimensions of an isosceles trapezoid.
 if(r.kind==='isosceles-trapezoid'){
  const lengthOf=(s:Segment)=>cs.find(c=>c.type==='length'&&unordered(c.of)===unordered(s));
  const top=lengthOf([v[0],v[1]]),bottom=lengthOf([v[2],v[3]]);
  if(top?.type==='length'&&bottom?.type==='length'&&top.value>0&&bottom.value>top.value){const a=top.value,b=bottom.value,h=Math.max(a,b)*.36;r.coords=[[(b-a)/2,h],[(b+a)/2,h],[b,0],[0,0]].map(([x,y])=>({x,y}));}
 }
 // One absolute length determines a uniform scale. More lengths are checked, never silently ignored.
 const length=cs.find(c=>c.type==='length');if(length?.type==='length'){
  const seed=r.coords||defaults[r.kind].map(([x,y])=>({x,y}));const a=v.indexOf(length.of[0]),b=v.indexOf(length.of[1]);
  if(a>=0&&b>=0&&length.value>0){const k=length.value/distance(seed[a],seed[b]);r.coords=seed.map(p=>({x:p.x*k,y:p.y*k}));}
 }
 // Bind a free point to an already defined length, measured from its explicit anchor.
 for(const c of cs){if(c.type!=='equal')continue;const candidates:{index:number;anchor:string;other:string;length:Segment}[]=[];
 for(const [target,reference] of [[c.a,c.b],[c.b,c.a]] as [Segment,Segment][]){for(const [anchor,n] of [target,[...target].reverse()] as Segment[]){const index=r.points.findIndex(p=>p.name===n&&p.op==='on'&&p.of.includes(anchor));if(index>=0&&!reference.includes(n)){const cp=r.points[index] as Extract<Construction,{op:'on'}>;candidates.push({index,anchor,other:cp.of.find(p=>p!==anchor)!,length:reference});}}}
 candidates.sort((a,b)=>b.index-a.index);const t=candidates[0];if(t)r.points[t.index]={name:r.points[t.index].name,op:'equalOn',of:[t.anchor,t.other],length:t.length};
 }
 // Include only named objects, not conclusions as constraints.
 for(const c of cs)if(['equal','parallel','perpendicular'].includes(c.type)&&'a'in c)r.segments.push(c.a,c.b);
 const free=r.points.filter(p=>['on','equalOn'].includes(p.op));if(free.length===2)r.segments.push([free[0].name,free[1].name]);
 const d=construct(r);d.checks=[baseLabel(r.kind,r.vertices),...verifyConstraints(d,cs)];
 // Marks only reflect explicitly supplied relations. They are numerically rechecked by construct.
 for(const c of cs){if(c.type==='equal')r.marks.push({type:'equal',segments:[c.a,c.b]});if(c.type==='parallel')r.marks.push({type:'parallel',segments:[c.a,c.b]});}
 const result=construct(r);result.checks=d.checks;return result;
}
const baseLabel=(kind:Shape,v:string[])=>({quadrilateral:'Tứ giác lồi',parallelogram:'Hình bình hành',rectangle:'Hình chữ nhật',rhombus:'Hình thoi',square:'Hình vuông',trapezoid:'Hình thang','isosceles-trapezoid':'Hình thang cân',triangle:'Tam giác','right-triangle':'Tam giác vuông','isosceles-triangle':'Tam giác cân'}[kind])+' '+v.join('');

/** Reviewed recipes are used only for a complete matching problem, never for a keyword match. */
export function lessonDrawing(id:string):Drawing{
 const r:Recipe={title:'Hình vẽ theo đề bài',kind:'parallelogram',vertices:['A','B','C','D'],points:[],segments:[],marks:[]};const cs:Constraint[]=[];
 const midpoint=(n:string,s:Segment)=>{r.points.push({name:n,op:'midpoint',of:s});cs.push({type:'midpoint',point:n,of:s});};
 const intersectionPoint=(n:string,a:Segment,b:Segment)=>{r.points.push({name:n,op:'intersection',lines:[a,b]});r.segments.push(a,b);cs.push({type:'intersection',point:n,lines:[a,b]});};
 if(id==='midpoints'){r.kind='quadrilateral';[['E','A','B'],['F','B','C'],['G','C','D'],['H','D','A']].forEach(([n,a,b])=>midpoint(n,[a,b]));r.segments=[['A','C'],['B','D'],['E','F'],['F','G'],['G','H'],['H','E']];}
 else if(id==='reflection'){r.kind='right-triangle';r.vertices=['A','B','C'];midpoint('M',['B','C']);r.points.push({name:'D',op:'reflect',of:['A','M']});r.outline=['A','B','D','C'];r.segments=[['A','D'],['B','C']];r.marks=[{type:'right',at:'A',arms:['B','C']}];cs.push({type:'reflect',point:'D',from:'A',center:'M'},{type:'perpendicular',a:['A','B'],b:['A','C']});}
 else if(id==='concurrency'){midpoint('E',['A','B']);midpoint('F',['C','D']);intersectionPoint('O',['A','C'],['B','D']);r.segments.push(['E','F'],['E','C'],['F','A']);r.marks=[{type:'equal',segments:[['A','E'],['E','B']]},{type:'equal',segments:[['C','F'],['F','D']]}];}
 else if(id==='trapezoid'){r.kind='isosceles-trapezoid';r.coords=[[3,5],[11,5],[14,0],[0,0]].map(([x,y])=>({x,y}));r.points=[{name:'E',op:'foot',from:'A',of:['C','D']},{name:'F',op:'foot',from:'B',of:['C','D']}];r.segments=[['A','E'],['B','F']];r.marks=[{type:'right',at:'E',arms:['A','D']},{type:'right',at:'F',arms:['B','C']}];cs.push({type:'length',of:['A','B'],value:8},{type:'length',of:['C','D'],value:14},{type:'on',point:'E',of:['C','D']},{type:'on',point:'F',of:['C','D']},{type:'perpendicular',a:['A','E'],b:['C','D']},{type:'perpendicular',a:['B','F'],b:['C','D']});}
 else if(id==='square'){r.kind='square';r.points=[{name:'E',op:'on',of:['A','B'],ratio:.57},{name:'F',op:'equalOn',of:['A','D'],length:['A','E']}];intersectionPoint('G',['A','C'],['E','F']);r.segments.push(['C','E'],['C','F']);r.marks=[{type:'equal',segments:[['A','E'],['A','F']]}];cs.push({type:'on',point:'E',of:['A','B']},{type:'on',point:'F',of:['A','D']},{type:'equal',a:['A','E'],b:['A','F']});}
 else if(id==='counterexample'){r.kind='quadrilateral';r.title='Một cấu hình để kiểm tra khẳng định';r.coords=[[0,3],[2,0],[0,-1],[-2,0]].map(([x,y])=>({x,y}));intersectionPoint('O',['A','C'],['B','D']);r.marks=[{type:'right',at:'O',arms:['A','B']},{type:'equal',segments:[['A','C'],['B','D']]}];cs.push({type:'equal',a:['A','C'],b:['B','D']},{type:'perpendicular',a:['A','C'],b:['B','D']});}
 else throw Error('Không có bài mẫu này.');
 const d=construct(r);d.checks=[baseLabel(r.kind,r.vertices),...verifyConstraints(d,cs)];return d;
}
export function resolveProblemDiagram(problem:string):DiagramResult{
 if(!problem.trim())return {status:'none',note:''};
 if(/(?:sửa đề|đính chính|đổi giả thiết|thay giả thiết)/iu.test(problem)&&!/(?:hình|tứ giác|tam giác)\s/iu.test(problem))return {status:'unsupported',note:'Em hãy gửi lại toàn bộ đề đã sửa để Thầy dựng hình theo đúng giả thiết mới.'};
 try{const exact=lessons.find(l=>fingerprint(l.problem)===fingerprint(problem));if(exact)return {status:'ready',drawing:lessonDrawing(exact.id)};
 const parsed=parseProblem(problem);if(!parsed)return {status:'none',note:''};
 if(parsed.remainder)return {status:'unsupported',note:'Thầy chưa dựng hình vì còn dữ kiện chưa đọc được chắc chắn: “'+parsed.remainder.slice(0,160)+'”. Em hãy viết riêng từng giả thiết và vị trí các điểm để Thầy kiểm tra.'};
 return {status:'ready',drawing:satisfy(parsed)};
 }catch(e){return {status:'invalid',note:'Thầy chưa hiển thị hình vì chưa dựng được cấu hình thỏa hết giả thiết. '+(e instanceof Error?e.message:'Em hãy kiểm tra lại tên điểm và các quan hệ trong đề.')};}
}
/** Bind each response to its own original problem. A new task must not reuse a previous figure. */
export function problemForTurn(text:string,previous=''):string{
 const t=normalizeProblem(text);
 if(/(?:sửa đề|đính chính|đổi giả thiết|thay giả thiết)/iu.test(t)&&!/(?:cho|hình|tứ giác|tam giác)\s/iu.test(t))return t;
 if(/(?:bài tương tự|sinh\s+\d|tạo\s+(?:bài|\d)|luyện tập|bài khác)/iu.test(t))return '';
 if(/(?:\bcho\b.{0,50}(?:hình|tứ giác|tam giác)|một bạn khẳng định)/iu.test(t))return t;
 if(/(?:tứ giác|hình bình hành|hình vuông|hình thoi|hình chữ nhật|hình thang|tam giác)\s+[A-Z]{3,4}\b/iu.test(t))return t;
 return previous;
}
