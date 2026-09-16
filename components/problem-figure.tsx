import {useId,useMemo,useRef,useState} from 'react';
import {CheckCheck,Download,Eye,EyeOff,Expand,Shapes,RotateCcw,ZoomIn,ZoomOut} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from './ui/dialog';
import {markStrokes,onSegment,pointGroups,lerp,toTikZ,near,distance,perpendicular,type Drawing,type Segment,type XY} from '../lib/geometry';
import {compileGeometry} from '../lib/geometry-model';
import {serializeDiagram,downloadBlob,exportPNG} from '../lib/diagram-export';
import {TheoryPanel} from './theory-panel';
import {findWorksheet,worksheetDrawings} from '../lib/worksheets';

const onBoundary=(d:Drawing,s:Segment)=>d.outline.some((n,i)=>{const a=d.points[n],b=d.points[d.outline[(i+1)%d.outline.length]];return onSegment(d.points[s[0]],a,b)&&onSegment(d.points[s[1]],a,b);});
export function DiagramSVG({drawing:d,aux}:{drawing:Drawing;aux:boolean}){
 const id=useId(),entries=Object.entries(d.points),extent=[...entries.map(([,p])=>p),...(d.guides||[]).flatMap(g=>[g.a,g.b]),...(d.circles||[]).flatMap(c=>{const p=d.points[c.center];return [{x:p.x-c.radius,y:p.y-c.radius},{x:p.x+c.radius,y:p.y+c.radius}];})];
 const rayEnds=(d.rays||[]).map(r=>({r,end:lerp(d.points[r.from],d.points[r.through],1.55)}));extent.push(...rayEnds.map(r=>r.end));
 const xs=extent.map(p=>p.x),ys=extent.map(p=>p.y),minX=Math.min(0,...xs),maxX=Math.max(1,...xs),minY=Math.min(0,...ys),maxY=Math.max(1,...ys);
 const scale=Math.min(430/Math.max(maxX-minX,.1),280/Math.max(maxY-minY,.1));
 const project=(p:XY)=>({x:280+(p.x-(minX+maxX)/2)*scale,y:190-(p.y-(minY+maxY)/2)*scale});
 const pts=Object.fromEntries(entries.map(([n,p])=>[n,project(p)]));const sides=d.outline.map((n,i)=>[n,d.outline[(i+1)%d.outline.length]] as Segment);
 const extraCandidates=d.segments.filter(s=>!onBoundary(d,s)&&!(d.guides||[]).some(g=>s.every(n=>onSegment(d.points[n],g.a,g.b))));
 const extra=extraCandidates.filter(s=>!extraCandidates.some(t=>s!==t&&distance(d.points[t[0]],d.points[t[1]])>distance(d.points[s[0]],d.points[s[1]])+1e-7&&s.every(n=>onSegment(d.points[n],d.points[t[0]],d.points[t[1]]))));
 const strokes=markStrokes(aux?d:{...d,marks:d.marks.filter(m=>m.type==='right'?onBoundary(d,[m.at,m.arms[0]])&&onBoundary(d,[m.at,m.arms[1]]):m.segments.every(s=>onBoundary(d,s)))});
 // Greedy label placement considers all point locations and earlier label rectangles.
 const boxes:{x:number;y:number;w:number;h:number}[]=[];
 const labels=pointGroups(d).map(({names,point:p})=>{const q=project(p),w=Math.max(15,names.join(', ').length*10),candidates=[[14,-13],[-w-14,-13],[14,24],[-w-14,24],[0,-24],[0,35],[25,5],[-w-25,5]];
  const score=([dx,dy]:number[])=>{const b={x:q.x+dx-3,y:q.y+dy-17,w:w+6,h:23};let score=Math.hypot(dx,dy)/100;
   for(const o of boxes)if(b.x<o.x+o.w&&b.x+b.w>o.x&&b.y<o.y+o.h&&b.y+b.h>o.y)score+=100;
   for(const pt of Object.values(pts))if(pt.x>b.x-4&&pt.x<b.x+b.w+4&&pt.y>b.y-4&&pt.y<b.y+b.h+4)score+=20;
   if(b.x<5||b.x+b.w>555||b.y<5||b.y+b.h>380)score+=200;return score;};
  const [dx,dy]=candidates.sort((a,b)=>score(a)-score(b))[0];boxes.push({x:q.x+dx-3,y:q.y+dy-17,w:w+6,h:23});return {names,q,x:q.x+dx,y:q.y+dy};
 });
 return <svg className="problem-svg" viewBox="0 0 560 405" role="img" aria-labelledby={id} data-testid="problem-svg"><title id={id}>{d.title}. {d.checks.join('; ')}. Hình không thay thế chứng minh.</title><defs><marker id={id+'arrow'} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" className="problem-edge"/></marker></defs>
 {d.outline.length>2&&<polygon points={d.outline.map(n=>`${pts[n].x},${pts[n].y}`).join(' ')} className="problem-fill"/>}
 {(d.circles||[]).map(c=><circle key={c.center} cx={pts[c.center].x} cy={pts[c.center].y} r={c.radius*scale} className="problem-circle"/>)}
 {sides.map(([a,b],i)=><line key={'s'+i} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y} className="problem-edge"/>)}
 {aux&&extra.map(([a,b],i)=><line key={'a'+i} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y} className="problem-aux"/>)}
 {aux&&(d.guides||[]).map((g,i)=>{const a=project(g.a),b=project(g.b),label=project(lerp(g.a,g.b,.88));return <g key={'guide'+i} data-line={g.name}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="problem-aux"/>{g.name&&<text x={label.x+4} y={label.y-9} className="problem-label" fontStyle="italic">{g.name}</text>}</g>;})}
 {aux&&rayEnds.map(({r,end},i)=>{const a=pts[r.from],b=project(end);return <line key={'ray'+i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="problem-aux" markerEnd={`url(#${id}arrow)`}/>;})}
 {aux&&(d.circles||[]).flatMap(c=>(d.guides||[]).flatMap((g,i)=>Object.entries(d.points).filter(([n,p])=>n!==c.center&&near(distance(p,d.points[c.center]),c.radius)&&onSegment(p,g.a,g.b)&&perpendicular(d.points[c.center],p,g.a,g.b)).map(([n,p])=>{const o=project(p),center=project(d.points[c.center]),end=project(g.b),u=lerp(o,center,10/Math.max(1,distance(o,center))),v=lerp(o,end,10/Math.max(1,distance(o,end)));return <path key={'tangent'+c.center+n+i} d={`M${u.x},${u.y} L${u.x+v.x-o.x},${u.y+v.y-o.y} L${v.x},${v.y}`} className="problem-mark" fill="none"/>;})))}
 {strokes.map((s,i)=>{const a=project(s.a),b=project(s.b);return <line key={'m'+i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="problem-mark"/>;})}
 {labels.map(({names,q,x,y})=><g key={names[0]} data-point-group={names.join(',')}><circle cx={q.x} cy={q.y} r="3.1" className="problem-point"/><text x={x} y={y} className="problem-label">{names.join(', ')}</text>{names.map(n=><g key={n} data-point={n} data-x={d.points[n].x} data-y={d.points[n].y}/>)}</g>)}
 {!entries.length&&<><path d="M160 245 L235 125 L380 245" className="provisional-placeholder"/><text x="280" y="295" textAnchor="middle" className="problem-label">Chờ dữ kiện để xác định các điểm</text></>}
 </svg>;
}
export function ProblemFigure({problem,reply='',level='Cơ bản',onProblemChange}:{problem:string;reply?:string;level?:string;onProblemChange?:(problem:string)=>void}){
 const [addition,setAddition]=useState(problem),[applied,setApplied]=useState(''),[revision,setRevision]=useState(0),[exportError,setExportError]=useState('');
 const source=applied||problem;
 const model=useMemo(()=>compileGeometry(source,reply),[source,reply,revision]);const collection=useMemo(()=>{const w=findWorksheet(source);return w?worksheetDrawings(w):[];},[source]);const [variant,setVariant]=useState(0),[expanded,setExpanded]=useState(false),[aux,setAux]=useState(true),[zoom,setZoom]=useState(1);const svgHost=useRef<HTMLDivElement>(null);
 const drawing=collection[Math.min(variant,collection.length-1)]||model.drawing;
 function downloadTikZ(){try{downloadBlob(new Blob([toTikZ(drawing)],{type:'text/x-tex;charset=utf-8'}),'hinh-hoc-v5.tex');}catch(e){setExportError((e as Error).message);}}
 async function download(kind:'svg'|'png'){try{setExportError('');const svg=svgHost.current?.querySelector('svg');if(!svg)return;const caption=model.status==='provisional'?'Hình tạm: còn dữ kiện chưa xác nhận. Không dùng thay chứng minh.':'Hình theo giả thiết. Không dùng thay chứng minh.';const content=serializeDiagram(svg,caption);downloadBlob(kind==='svg'?new Blob([content],{type:'image/svg+xml;charset=utf-8'}):await exportPNG(content),'hinh-hoc-v5.'+kind);}catch(e){setExportError((e as Error).message);}}
 return <><section className="problem-figure" aria-label="Hình vẽ theo đề bài" data-geometry-status={model.status}><div className="problem-figure-head"><strong><Shapes size={18}/>{drawing.title}</strong><button type="button" className="quiet" onClick={()=>setExpanded(true)}><Expand size={15}/>Phóng to</button></div>
 <p className={'geometry-status '+model.status}>{model.status==='verified'?'Đã đối chiếu tọa độ với các giả thiết đã đọc':'Hình tạm · còn dữ kiện cần xác nhận'}</p>
 {model.goal&&<p className="figure-goal"><strong>Mục tiêu:</strong> {model.goal}</p>}
 {collection.length>1&&<label className="figure-variant">Chọn hình trong bài<select value={Math.min(variant,collection.length-1)} onChange={e=>setVariant(Number(e.target.value))}>{collection.map((d,i)=><option key={i} value={i}>{d.title}</option>)}</select></label>}
 <div ref={svgHost} className="diagram-viewport"><div style={{width:`${zoom*100}%`,'--figure-zoom':zoom} as React.CSSProperties}><DiagramSVG drawing={drawing} aux={aux}/></div></div>
 <div className="problem-figure-tools"><button type="button" className="quiet" onClick={()=>{setRevision(v=>v+1);setZoom(1);setAux(true);}}><RotateCcw size={15}/>Vẽ lại hình</button><button type="button" className="quiet" onClick={()=>void download('png')}><Download size={15}/>Tải PNG</button><details className="figure-more"><summary>Tùy chọn hình</summary><div className="figure-more-tools"><button type="button" onClick={()=>void download('svg')}>Tải SVG</button><button type="button" onClick={downloadTikZ}>Tải TikZ (.tex)</button><button type="button" aria-label="Thu nhỏ hình" disabled={zoom<=1} onClick={()=>setZoom(v=>Math.max(1,v-.25))}><ZoomOut size={15}/></button><span>{Math.round(zoom*100)}%</span><button type="button" aria-label="Phóng lớn hình" disabled={zoom>=2} onClick={()=>setZoom(v=>Math.min(2,v+.25))}><ZoomIn size={15}/></button><button type="button" aria-pressed={!aux} onClick={()=>setAux(v=>!v)}>{aux?<EyeOff size={15}/>:<Eye size={15}/>} {aux?'Ẩn nét phụ':'Hiện nét phụ'}</button></div></details></div>
 {exportError&&<p role="alert" className="error">{exportError}</p>}
 <details className="figure-checks"><summary><CheckCheck size={15}/>Giả thiết đã đối chiếu ({drawing.checks.length})</summary><ul>{drawing.checks.map((c,i)=><li key={i}>{c}</li>)}</ul></details>
 {(model.assumptions.length>0||model.missingData.length>0)&&<details className="geometry-assumptions"><summary>Giả định và dữ kiện cần làm rõ ({model.missingData.length})</summary><ul>{model.assumptions.map((s,i)=><li key={'a'+i}>{s}</li>)}{model.missingData.map((s,i)=><li key={'m'+i}><strong>{s}</strong></li>)}</ul>{model.questions.map(q=><p key={q}>{q}</p>)}<form onSubmit={e=>{e.preventDefault();setApplied(addition.trim());onProblemChange?.(addition.trim());}}><label>Chỉnh đề và giả định dựng hình<textarea value={addition} maxLength={2000} onChange={e=>setAddition(e.target.value)} placeholder="Ví dụ: O là giao điểm AC và BD."/></label><button type="submit">Áp dụng dữ kiện & vẽ lại</button></form></details>}
 <details className="figure-checks teacher-geometry"><summary>Chi tiết phân tích đề dành cho giáo viên</summary><p>Các quan hệ kiểm tra bằng tọa độ chỉ xác nhận hình minh họa. Mục tiêu chưa được coi là đã chứng minh.</p><button type="button" onClick={()=>downloadBlob(new Blob([JSON.stringify(model,null,2)],{type:'application/json'}),'mo-hinh-hinh-hoc-v5.json')}>Tải mô hình hình học</button></details>
 <p className="figure-caption">Nét liền: đường bao. Nét đứt: đoạn hỗ trợ và đường phụ. Hình vẽ không thay thế lập luận chứng minh.</p></section><TheoryPanel problem={source} model={model} level={level}/>
 <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="figure-dialog"><DialogHeader><DialogTitle>{drawing.title}</DialogTitle><DialogDescription>{model.status==='provisional'?'Hình tạm có dữ kiện chưa được xác nhận.':model.goal||'Đối chiếu giả thiết trên hình.'}</DialogDescription></DialogHeader><DiagramSVG drawing={drawing} aux={aux}/><div className="problem-figure-tools"><button type="button" className="quiet" onClick={()=>void download('png')}>Tải PNG</button><button type="button" className="quiet" onClick={()=>void download('svg')}>Tải SVG</button></div></DialogContent></Dialog></>;
}
