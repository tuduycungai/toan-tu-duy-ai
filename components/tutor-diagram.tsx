import {useId,useState,useRef} from 'react';
import {Expand,Eye,EyeOff,Shapes} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import type {BuiltDiagram,XY,Segment} from '@/lib/diagram';
const minus=(a:XY,b:XY)=>({x:a.x-b.x,y:a.y-b.y});
const unit=(v:XY)=>{const l=Math.hypot(v.x,v.y);return{x:v.x/l,y:v.y/l};};
export function DiagramSvg({figure,aux=true}:{figure:BuiltDiagram;aux?:boolean}){
 const id=useId();const xs=figure.points.map(p=>p.x),ys=figure.points.map(p=>p.y),left=Math.min(...xs),bottom=Math.min(...ys),w=Math.max(...xs)-left,h=Math.max(...ys)-bottom;
 const scale=Math.min(460/Math.max(w,.001),310/Math.max(h,.001));
 const pts=figure.points.map(p=>({name:p.name,x:50+(460-w*scale)/2+(p.x-left)*scale,y:360-(310-h*scale)/2-(p.y-bottom)*scale}));
 const get=(n:string)=>pts.find(p=>p.name===n)!;
 const center={x:pts.reduce((a,p)=>a+p.x,0)/pts.length,y:pts.reduce((a,p)=>a+p.y,0)/pts.length};
 const placed:{x:number;y:number;name:string}[]=[];
 const labels=pts.map(p=>{
  const candidates=Array.from({length:16},(_,i)=>{const a=Math.atan2(p.y-center.y,p.x-center.x)+i*Math.PI/4;const r=i<8?17:30;return{x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r};});
  const score=(c:XY)=>pts.reduce((s,q)=>s+(Math.hypot(c.x-q.x,c.y-q.y)<12?100:0),0)+placed.reduce((s,q)=>s+(Math.abs(c.x-q.x)<30&&Math.abs(c.y-q.y)<22?100:0),0);
  const best=candidates.reduce((a,c)=>score(c)<score(a)?c:a);const label={...best,name:p.name};placed.push(label);return label;
 });
 const line=(s:Segment)=>({x1:get(s[0]).x,y1:get(s[0]).y,x2:get(s[1]).x,y2:get(s[1]).y});
 const outlines=figure.outline.map((n,i)=>[n,figure.outline[(i+1)%figure.outline.length]] as Segment);
 return <svg className="tutor-geometry-svg" viewBox="0 0 560 410" role="img" aria-labelledby={id+'title '+id+'desc'}><title id={id+'title'}>{figure.title}</title><desc id={id+'desc'}>Hình minh họa gồm các điểm {figure.points.map(p=>p.name).join(', ')}. Đối chiếu hình với giả thiết; hình không thay thế chứng minh.</desc>
 <polygon points={figure.outline.map(n=>`${get(n).x},${get(n).y}`).join(' ')} className="diagram-polygon"/>
 {aux&&figure.segments.map((s,i)=><line key={'s'+i} {...line(s)} className="diagram-aux"/>)}
 {outlines.map((s,i)=><line key={'o'+i} {...line(s)} className="diagram-outline"/>)}
 {figure.marks.map((m,i)=>{
  if(!aux)return null;
  if(m.type==='right'){const p=get(m.at),u=unit(minus(get(m.arms[0]),p)),v=unit(minus(get(m.arms[1]),p));const r=Math.min(13,Math.hypot(get(m.arms[0]).x-p.x,get(m.arms[0]).y-p.y)/4,Math.hypot(get(m.arms[1]).x-p.x,get(m.arms[1]).y-p.y)/4);return <polyline key={i} className="diagram-mark" points={`${p.x+r*u.x},${p.y+r*u.y} ${p.x+r*(u.x+v.x)},${p.y+r*(u.y+v.y)} ${p.x+r*v.x},${p.y+r*v.y}`}/>;}
  return <g key={i}>{m.segments.map((s,j)=>{const a=get(s[0]),b=get(s[1]),u=unit(minus(b,a)),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};const count=figure.marks.slice(0,i+1).filter(k=>k.type===m.type).length;return <g key={j}>{Array.from({length:count},(_,k)=>{const offset=(k-(count-1)/2)*6,c={x:mid.x+u.x*offset,y:mid.y+u.y*offset};return m.type==='equal'?<line key={k} className="diagram-mark" x1={c.x-5*u.y} y1={c.y+5*u.x} x2={c.x+5*u.y} y2={c.y-5*u.x}/>:<polyline key={k} className="diagram-mark" points={`${c.x-5*u.x-4*u.y},${c.y-5*u.y+4*u.x} ${c.x},${c.y} ${c.x-5*u.x+4*u.y},${c.y-5*u.y-4*u.x}`}/>;})}</g>;})}</g>;
 })}
 {pts.map(p=><circle key={p.name} cx={p.x} cy={p.y} r="3.5" className="diagram-point"/>)}
 {labels.map(p=><text key={p.name} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" className="diagram-label">{p.name}</text>)}
 </svg>;
}
export function TutorDiagram({figure}:{figure:BuiltDiagram}){
 const [open,setOpen]=useState(false),[aux,setAux]=useState(true);const trigger=useRef<HTMLButtonElement>(null);
 return <section className="tutor-diagram" aria-label="Hình vẽ theo đề bài"><div className="tutor-diagram-heading"><span><Shapes size={17}/>Hình vẽ theo đề bài</span><button type="button" ref={trigger} onClick={()=>setOpen(true)} aria-label="Phóng to hình vẽ"><Expand size={16}/>Phóng to</button></div><DiagramSvg figure={figure} aux={aux}/><div className="tutor-diagram-foot"><strong>{figure.title}</strong><button type="button" onClick={()=>setAux(!aux)} aria-pressed={aux}>{aux?<EyeOff size={15}/>:<Eye size={15}/>} {aux?'Ẩn':'Hiện'} đường phụ và ký hiệu</button></div><p>Hình minh họa từ dữ kiện AI nhận diện. Em đối chiếu tên điểm và giả thiết; không suy thêm tính chất từ nét vẽ.</p><Dialog open={open} onOpenChange={setOpen}><DialogContent className="diagram-dialog" onCloseAutoFocus={e=>{e.preventDefault();trigger.current?.focus({preventScroll:true});}}><DialogHeader><DialogTitle>{figure.title}</DialogTitle><DialogDescription>Hình vẽ hỗ trợ quan sát; mỗi kết luận vẫn cần có căn cứ.</DialogDescription></DialogHeader><DiagramSvg figure={figure} aux={aux}/><button type="button" onClick={()=>setOpen(false)}>Trở về bài học</button></DialogContent></Dialog></section>;
}
