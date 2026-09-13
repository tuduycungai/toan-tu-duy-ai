/** Declarative geometry only: never execute model code or insert model SVG/HTML. */
export type XY={x:number;y:number};
export type Segment=[string,string];
export type DiagramMark={type:'right';at:string;arms:Segment}|{type:'equal'|'parallel';segments:Segment[]};
export type BuiltDiagram={title:string;points:(XY&{name:string})[];outline:string[];segments:Segment[];marks:DiagramMark[]};
export type DiagramResult={diagram:BuiltDiagram|null;status:'ready'|'missing'|'invalid'|'insufficient';note:string};
const names=/^[A-Z](?:[0-9]{1,2}|['′]{1,2})?$/;
const defaults:Record<string,number[][]>={
 quadrilateral:[[0,0],[6,.6],[5,4],[-1,3]],parallelogram:[[0,0],[6,0],[7.4,3.5],[1.4,3.5]],
 rectangle:[[0,0],[6,0],[6,3.6],[0,3.6]],rhombus:[[0,0],[5,0],[8,4],[3,4]],square:[[0,0],[4,0],[4,4],[0,4]],
 trapezoid:[[1.2,3.6],[4.6,3.6],[6,0],[0,0]],'isosceles-trapezoid':[[1.3,3.6],[4.7,3.6],[6,0],[0,0]],
 triangle:[[0,3.8],[-2,0],[4,0]],'right-triangle':[[0,0],[5,0],[0,3.6]],'isosceles-triangle':[[0,4],[-3,0],[3,0]]
};
const sub=(a:XY,b:XY):XY=>({x:a.x-b.x,y:a.y-b.y});
const cross=(a:XY,b:XY)=>a.x*b.y-a.y*b.x;
const dot=(a:XY,b:XY)=>a.x*b.x+a.y*b.y;
const length=(a:XY)=>Math.hypot(a.x,a.y);
const near=(a:number,b:number)=>Math.abs(a-b)<=1e-5*Math.max(1,Math.abs(a),Math.abs(b));
const perpendicular=(a:XY,b:XY)=>Math.abs(dot(a,b))<=1e-5*length(a)*length(b);
const parallel=(a:XY,b:XY)=>Math.abs(cross(a,b))<=1e-5*length(a)*length(b);
function need(v:unknown):asserts v{if(!v)throw Error('Invalid geometry');}
function record(v:unknown):Record<string,any>{need(v&&typeof v==='object'&&!Array.isArray(v));return v as Record<string,any>;}
function list(v:unknown,max:number):any[]{need(Array.isArray(v)&&v.length<=max);return v;}
function numeric(n:unknown){need(typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=10000);return n;}
function title(v:unknown,max=120){need(typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[<>\x00-\x1f]/.test(v));return v.trim();}
function convex(points:XY[]){const signs=points.map((p,i)=>cross(sub(points[(i+1)%points.length],p),sub(points[(i+2)%points.length],points[(i+1)%points.length])));need(signs.every(n=>n>1e-7)||signs.every(n=>n< -1e-7));}
export function buildDiagram(value:unknown):BuiltDiagram{
 const d=record(value);need(d.version===1&&d.status==='ok');const base=record(d.base);need(typeof base.kind==='string'&&Object.hasOwn(defaults,base.kind));
 const vertices=list(base.vertices,4);const coords=base.coords===undefined?defaults[base.kind]:list(base.coords,4);need(vertices.length===defaults[base.kind].length&&coords.length===vertices.length);
 const points=new Map<string,XY>();const add=(name:unknown,p:XY)=>{need(typeof name==='string'&&names.test(name)&&!points.has(name)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=10000&&Math.abs(p.y)<=10000);need([...points.values()].every(q=>length(sub(q,p))>1e-6));points.set(name,p);};
 const get=(name:unknown)=>{need(typeof name==='string'&&points.has(name));return points.get(name)!;};
 const pair=(v:unknown):Segment=>{const s=list(v,2);need(s.length===2&&s[0]!==s[1]);get(s[0]);get(s[1]);return [s[0],s[1]];};
 vertices.forEach((n,i)=>{const c=list(coords[i],2);need(c.length===2);add(n,{x:numeric(c[0]),y:numeric(c[1])});});
 const p=vertices.map(get);convex(p);
 const edge=p.map((a,i)=>sub(p[(i+1)%p.length],a));
 if(['parallelogram','rectangle','rhombus','square'].includes(base.kind)){need(parallel(edge[0],edge[2])&&parallel(edge[1],edge[3]));}
 if(['rectangle','square'].includes(base.kind))need(perpendicular(edge[0],edge[1]));
 if(['rhombus','square'].includes(base.kind))need(near(length(edge[0]),length(edge[1])));
 if(['trapezoid','isosceles-trapezoid'].includes(base.kind))need(parallel(edge[0],edge[2]));
 if(base.kind==='isosceles-trapezoid'){need(!parallel(edge[1],edge[3])&&near(length(edge[1]),length(edge[3])));}
 if(base.kind==='right-triangle')need(perpendicular(sub(p[1],p[0]),sub(p[2],p[0])));
 if(base.kind==='isosceles-triangle')need(near(length(sub(p[1],p[0])),length(sub(p[2],p[0]))));
 for(const raw of list(d.points??[],16)){
  const q=record(raw);let result:XY;
  if(['midpoint','on','reflect','foot'].includes(q.op)){
   const [a,b]=pair(q.of),u=get(a),v=get(b);
   if(q.op==='midpoint')result={x:(u.x+v.x)/2,y:(u.y+v.y)/2};
   else if(q.op==='on'){const ratio=numeric(q.ratio);need(ratio>0&&ratio<1);result={x:u.x+ratio*(v.x-u.x),y:u.y+ratio*(v.y-u.y)};}
   else if(q.op==='reflect')result={x:2*v.x-u.x,y:2*v.y-u.y}; // point a through center b
   else{const s=get(q.from),ab=sub(v,u),t=dot(sub(s,u),ab)/dot(ab,ab);result={x:u.x+t*ab.x,y:u.y+t*ab.y};}
  }else if(q.op==='intersection'){
   const [a,b]=pair(q.lines?.[0]),[c,e]=pair(q.lines?.[1]);need(q.lines.length===2);
   const u=get(a),v=get(b),w=get(c),z=get(e),ab=sub(v,u),cd=sub(z,w),den=cross(ab,cd);need(Math.abs(den)>1e-7*length(ab)*length(cd));const t=cross(sub(w,u),cd)/den;result={x:u.x+t*ab.x,y:u.y+t*ab.y};
  }else throw Error('Unsupported construction');
  add(q.name,result);
 }
 const segments=list(d.segments??[],30).map(pair);
 const rendered=new Set([...vertices.map((n,i)=>[n,vertices[(i+1)%vertices.length]]),...segments].map(s=>[...s].sort().join(':')));
 const visible=(s:Segment)=>rendered.has([...s].sort().join(':'));
 const vector=(s:Segment)=>sub(get(s[1]),get(s[0]));
 const marks:DiagramMark[]=list(d.marks??[],8).map(raw=>{
  const m=record(raw);
  if(m.type==='right'){
   const at=get(m.at),arms=pair(m.arms),u=sub(get(arms[0]),at),v=sub(get(arms[1]),at);need(length(u)>1e-6&&length(v)>1e-6&&perpendicular(u,v));
   // A ray may be a subsegment of a drawn diagonal.
   const rayVisible=(name:string)=>[...vertices.map((n,i)=>[n,vertices[(i+1)%vertices.length]]),...segments].some(s=>{const a=get(s[0]),b=get(s[1]),ab=sub(b,a);return parallel(sub(at,a),ab)&&parallel(sub(get(name),a),ab)&&dot(sub(at,a),sub(at,b))<=1e-6&&dot(sub(get(name),a),sub(get(name),b))<=1e-6;});
   need(arms.every(rayVisible));return {type:'right',at:m.at,arms};
  }
  need(m.type==='equal'||m.type==='parallel');const group=list(m.segments,4).map(pair);need(group.length>=2&&group.every(visible));
  need(new Set(group.map(s=>[...s].sort().join(':'))).size===group.length);
  for(const s of group.slice(1))need(m.type==='equal'?near(length(vector(group[0])),length(vector(s))):parallel(vector(group[0]),vector(s)));
  return {type:m.type,segments:group};
 });
 const all=[...points].map(([name,p])=>({...p,name}));const xs=all.map(p=>p.x),ys=all.map(p=>p.y);const span=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));need(span>1e-4);
 // Reject almost invisible edges or extreme constructions before scaling.
 need(edge.every(e=>length(e)/span>.025));
 return {title:title(d.title),points:all,outline:[...vertices],segments,marks};
}
export function parseDiagram(raw:string):DiagramResult{
 const start=raw.indexOf('[HINH_VE]');if(start<0)return {diagram:null,status:'missing',note:''};
 const invalid:DiagramResult={diagram:null,status:'invalid',note:'Chưa dựng được hình phù hợp từ phản hồi này. Em có thể yêu cầu Thầy kiểm tra tên điểm và dữ kiện rồi vẽ lại.'};
 if(raw.indexOf('[HINH_VE]',start+9)>=0)return invalid;
 const end=raw.indexOf('[/HINH_VE]',start);if(end<0||end-start>12000)return invalid;
 try{const value=JSON.parse(raw.slice(start+9,end).trim());if(value?.version===1&&value.status==='insufficient')return {diagram:null,status:'insufficient',note:title(value.reason,240)};return {diagram:buildDiagram(value),status:'ready',note:''};}catch{return invalid;}
}
export function stripDiagram(raw:string){return raw.replace(/\[HINH_VE\][\s\S]*?(?:\[\/HINH_VE\]|$)/g,'').replace(/\[\/?HINH_VE\]/g,'');}
