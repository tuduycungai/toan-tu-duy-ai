import {useId,useMemo,useState} from 'react';
import {CheckCheck,Download,Eye,EyeOff,Expand,Shapes} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from './ui/dialog';
import {markStrokes,onSegment,toTikZ,type Drawing,type Segment,type XY} from '../lib/geometry';
import {resolveProblemDiagram} from '../lib/problem-diagram';

const onBoundary=(d:Drawing,s:Segment)=>d.outline.some((n,i)=>{const a=d.points[n],b=d.points[d.outline[(i+1)%d.outline.length]];return onSegment(d.points[s[0]],a,b)&&onSegment(d.points[s[1]],a,b);});
function DiagramSVG({drawing:d,aux}:{drawing:Drawing;aux:boolean}){
 const id=useId(),entries=Object.entries(d.points),xs=entries.map(([,p])=>p.x),ys=entries.map(([,p])=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const scale=Math.min(450/Math.max(maxX-minX,.1),295/Math.max(maxY-minY,.1));
 const project=(p:XY)=>({x:280+(p.x-(minX+maxX)/2)*scale,y:200-(p.y-(minY+maxY)/2)*scale});
 const pts=Object.fromEntries(entries.map(([n,p])=>[n,project(p)]));const sides=d.outline.map((n,i)=>[n,d.outline[(i+1)%d.outline.length]] as Segment);
 const extra=d.segments.filter(s=>!onBoundary(d,s));
 const strokes=markStrokes(aux?d:{...d,marks:d.marks.filter(m=>m.type==='right'?onBoundary(d,[m.at,m.arms[0]])&&onBoundary(d,[m.at,m.arms[1]]):m.segments.every(s=>onBoundary(d,s)))});
 return <svg className="problem-svg" viewBox="0 0 560 405" role="img" aria-labelledby={id} data-testid="problem-svg"><title id={id}>{d.title}. {d.checks.join('; ')}. Hình không thay thế chứng minh.</title><polygon points={d.outline.map(n=>`${pts[n].x},${pts[n].y}`).join(' ')} className="problem-fill"/>
 {sides.map(([a,b],i)=><line key={'s'+i} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y} className="problem-edge"/>)}
 {aux&&extra.map(([a,b],i)=><line key={'a'+i} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y} className="problem-aux"/>)}
 {strokes.map((s,i)=>{const a=project(s.a),b=project(s.b);return <line key={'m'+i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="problem-mark"/>;})}
 {entries.map(([n,p])=>{const q=pts[n],dx=q.x-280,dy=q.y-200;const offsetX=Math.abs(dx)>50?(dx>0?12:-12):12,offsetY=Math.abs(dy)>30?(dy>0?21:-12):-13;return <g key={n} data-point={n} data-x={p.x} data-y={p.y}><circle cx={q.x} cy={q.y} r="3.1" className="problem-point"/><text x={q.x+offsetX} y={q.y+offsetY} textAnchor={offsetX<0?'end':'start'} className="problem-label">{n}</text></g>;})}</svg>;
}
export function ProblemFigure({problem}:{problem:string}){
 const result=useMemo(()=>resolveProblemDiagram(problem),[problem]);const [expanded,setExpanded]=useState(false),[aux,setAux]=useState(true);
 if(result.status==='none')return null;
 if(result.status!=='ready')return <div className="figure-notice" role="status"><Shapes size={18}/><p>{result.note}</p></div>;
 const drawing=result.drawing;
 function download(){const blob=new Blob([toTikZ(drawing)],{type:'text/x-tex;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='hinh-hoc-tikz.tex';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <><section className="problem-figure" aria-label="Hình vẽ theo đề bài"><div className="problem-figure-head"><strong><Shapes size={18}/>{drawing.title}</strong><button type="button" className="quiet" onClick={()=>setExpanded(true)}><Expand size={15}/>Phóng to</button></div><DiagramSVG drawing={drawing} aux={aux}/><div className="problem-figure-tools"><button type="button" className="quiet" aria-pressed={!aux} onClick={()=>setAux(v=>!v)}>{aux?<EyeOff size={15}/>:<Eye size={15}/>} {aux?'Ẩn nét phụ':'Hiện nét phụ'}</button><button type="button" className="quiet" onClick={download}><Download size={15}/>Tải TikZ (.tex)</button></div><details className="figure-checks"><summary><CheckCheck size={15}/>Giả thiết đã đối chiếu ({drawing.checks.length})</summary><ul>{drawing.checks.map((c,i)=><li key={i}>{c}</li>)}</ul></details><p className="figure-caption">Hình minh họa các giả thiết đã đối chiếu. Em vẫn cần lập luận để chứng minh kết luận.</p></section>
 <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="figure-dialog"><DialogHeader><DialogTitle>{drawing.title}</DialogTitle><DialogDescription>{drawing.checks.join(' · ')}</DialogDescription></DialogHeader><DiagramSVG drawing={drawing} aux={aux}/><button type="button" className="quiet" onClick={download}><Download size={16}/>Tải hình TikZ (.tex)</button></DialogContent></Dialog></>;
}
