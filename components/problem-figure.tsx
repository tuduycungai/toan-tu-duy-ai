import {useId,useMemo,useState,useRef,useEffect} from 'react';
import {CheckCheck,Download,Eye,EyeOff,Expand,Shapes} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from './ui/dialog';
import {markStrokes,onSegment,pointGroups,lerp,toTikZ,type Drawing,type Segment,type XY} from '../lib/geometry';
import {compileGeometry} from '../lib/geometry-model';
import {TheoryPanel} from './theory-panel';
import {findWorksheet,worksheetDrawings} from '../lib/worksheets';

const onBoundary=(d:Drawing,s:Segment)=>d.outline.some((n,i)=>{const a=d.points[n],b=d.points[d.outline[(i+1)%d.outline.length]];return onSegment(d.points[s[0]],a,b)&&onSegment(d.points[s[1]],a,b);});
export function DiagramSVG({drawing:d,aux}:{drawing:Drawing;aux:boolean}){
 const id=useId().replace(/:/g,''),entries=Object.entries(d.points),bounds=[...entries.map(([,p])=>p),...(d.guides||[]).flatMap(g=>[g.a,g.b]),...(d.circles||[]).flatMap(c=>[{x:d.points[c.center].x-c.radius,y:d.points[c.center].y-c.radius},{x:d.points[c.center].x+c.radius,y:d.points[c.center].y+c.radius}]),...(d.rays||[]).map(r=>lerp(d.points[r.from],d.points[r.through],1.6))],xs=bounds.length?bounds.map(p=>p.x):[-1,1],ys=bounds.length?bounds.map(p=>p.y):[-1,1],minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const scale=Math.min(450/Math.max(maxX-minX,.1),295/Math.max(maxY-minY,.1));
 const project=(p:XY)=>({x:280+(p.x-(minX+maxX)/2)*scale,y:200-(p.y-(minY+maxY)/2)*scale});
 const pts=Object.fromEntries(entries.map(([n,p])=>[n,project(p)]));const sides=d.outline.map((n,i)=>[n,d.outline[(i+1)%d.outline.length]] as Segment);
 const extra=d.segments.filter(s=>!onBoundary(d,s)&&!(d.guides||[]).some(g=>s.every(n=>onSegment(d.points[n],g.a,g.b))));
 const labelBoxes:{x:number;y:number;w:number;h:number}[]=[];
 const labelPosition=(names:string[],q:XY)=>{const w=names.join(', ').length*12;const candidates=[[12,-14],[-w-12,-14],[12,23],[-w-12,23],[16,5],[-w-16,5],[0,-28],[0,36]];let best={x:q.x+12,y:q.y-14},cost=Infinity;
 for(const [dx,dy] of candidates){const x=q.x+dx,y=q.y+dy,box={x,y:y-18,w,h:23};let score=(x<5||x+w>555||y<20||y>398)?1000:0;score+=labelBoxes.filter(b=>box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y).length*100;score+=Object.values(pts).filter(p=>p.x>box.x-4&&p.x<box.x+w+4&&p.y>box.y-4&&p.y<box.y+23+4).length*20;if(score<cost){cost=score;best={x,y};}}
 labelBoxes.push({x:best.x,y:best.y-18,w,h:23});return best;};
 const strokes=markStrokes(aux?d:{...d,marks:d.marks.filter(m=>m.type==='right'?onBoundary(d,[m.at,m.arms[0]])&&onBoundary(d,[m.at,m.arms[1]]):m.segments.every(s=>onBoundary(d,s)))});
 return <svg className="problem-svg" viewBox="0 0 560 405" role="img" aria-labelledby={id} data-testid="problem-svg"><title id={id}>{d.title+'. '+d.checks.join('; ')+'. Hình không thay thế chứng minh.'}</title><defs><marker id={id+'arrow'} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#367bc3"/></marker></defs>{(d.circles||[]).map((c,i)=>{const o=project(d.points[c.center]);return <circle key={i} cx={o.x} cy={o.y} r={c.radius*scale} className="problem-edge" fill="none" data-circle={c.center}/>;})}<polygon points={d.outline.map(n=>`${pts[n].x},${pts[n].y}`).join(' ')} className="problem-fill"/>
 {sides.map(([a,b],i)=><line key={'s'+i} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y} className="problem-edge"/>)}
 {aux&&extra.map(([a,b],i)=><line key={'a'+i} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y} className="problem-aux"/>)}
 {aux&&(d.guides||[]).map((g,i)=>{const a=project(g.a),b=project(g.b),label=project(lerp(g.a,g.b,.88));return <g key={'guide'+i} data-line={g.name}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="problem-aux"/>{g.name&&<text x={label.x+4} y={label.y-9} className="problem-label" fontStyle="italic">{g.name}</text>}</g>;})}
 {(d.rays||[]).map((r,i)=>{const a=pts[r.from],b=project(lerp(d.points[r.from],d.points[r.through],1.6));return <line key={'ray'+i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} markerEnd={'url(#'+id+'arrow)'} className="problem-aux"/>;})}
 {aux&&(d.rightAngles||[]).map((m,i)=>{const o=project(m.at),a=project(m.a),b=project(m.b),u={x:a.x-o.x,y:a.y-o.y},v={x:b.x-o.x,y:b.y-o.y},lu=Math.hypot(u.x,u.y),lv=Math.hypot(v.x,v.y),r=Math.min(11,lu/3,lv/3);const p={x:o.x+u.x/lu*r,y:o.y+u.y/lu*r},q={x:p.x+v.x/lv*r,y:p.y+v.y/lv*r},t={x:o.x+v.x/lv*r,y:o.y+v.y/lv*r};return <path key={'right'+i} d={`M ${p.x} ${p.y} L ${q.x} ${q.y} L ${t.x} ${t.y}`} className="problem-mark" fill="none"/>;})}
 {aux&&(d.angleMarks||[]).map((m,i)=>{const o=project(m.at),a=project(m.a),b=project(m.b),u={x:a.x-o.x,y:a.y-o.y},v={x:b.x-o.x,y:b.y-o.y},lu=Math.hypot(u.x,u.y),lv=Math.hypot(v.x,v.y),r=19,p={x:o.x+u.x/lu*r,y:o.y+u.y/lu*r},q={x:o.x+v.x/lv*r,y:o.y+v.y/lv*r};return <path key={'angle'+i} d={`M ${p.x} ${p.y} A ${r} ${r} 0 0 ${u.x*v.y-u.y*v.x>0?1:0} ${q.x} ${q.y}`} fill="none" className="problem-mark"/>;})}
 {strokes.map((s,i)=>{const a=project(s.a),b=project(s.b);return <line key={'m'+i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="problem-mark"/>;})}
 {pointGroups(d).map(({names,point:p})=>{const q=project(p),label=labelPosition(names,q);return <g key={names[0]} data-point-group={names.join(',')}><circle cx={q.x} cy={q.y} r="3.1" className="problem-point"/><text x={label.x} y={label.y} textAnchor="start" className="problem-label">{names.join(', ')}</text>{names.map(n=><g key={n} data-point={n} data-x={d.points[n].x} data-y={d.points[n].y}/>)}</g>;})}</svg>;
}
export function ProblemFigure({problem,reply='',level='Cơ bản',showTheory=true,aiTheory}:{problem:string;reply?:string;level?:string;showTheory?:boolean;aiTheory?:unknown}){
 const [correction,setCorrection]=useState(''),[edit,setEdit]=useState(''),[revision,setRevision]=useState(0),[zoom,setZoom]=useState(1),[downloadError,setDownloadError]=useState('');
 const model=useMemo(()=>compileGeometry(problem,reply,correction),[problem,reply,correction,revision]);
 const collection=useMemo(()=>{try{const w=findWorksheet(problem);return w?worksheetDrawings(w):[];}catch{return [];}},[problem]);
 const [variant,setVariant]=useState(0),[expanded,setExpanded]=useState(false),[aux,setAux]=useState(true);const figureRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{setCorrection('');setEdit('');setVariant(0);setZoom(1);},[problem]);
 if(!problem.trim())return null;
 const drawing=collection[Math.min(variant,collection.length-1)]||model.drawing;
 const downloadBlob=(blob:Blob,name:string)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);};
 function download(){downloadBlob(new Blob([toTikZ(drawing)],{type:'text/x-tex;charset=utf-8'}),'hinh-hoc-tikz.tex');}
 async function exportImage(format:'svg'|'png'){
  setDownloadError('');try{
   const original=figureRef.current?.querySelector('svg.problem-svg');if(!original)throw Error('Chưa có hình để tải.');
   const clone=original.cloneNode(true) as SVGSVGElement;clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width','1680');clone.setAttribute('height','1215');
   const os=[original,...original.querySelectorAll('*')],cs=[clone,...clone.querySelectorAll('*')];
   os.forEach((n,i)=>{const style=getComputedStyle(n);for(const property of ['fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','paint-order'])cs[i].setAttribute(property,style.getPropertyValue(property));});
   const bg=document.createElementNS('http://www.w3.org/2000/svg','rect');bg.setAttribute('width','560');bg.setAttribute('height','405');bg.setAttribute('fill',getComputedStyle(original).backgroundColor==='rgba(0, 0, 0, 0)'?'#ffffff':getComputedStyle(original).backgroundColor);clone.insertBefore(bg,clone.firstChild);
   const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml;charset=utf-8'});
   if(format==='svg'){downloadBlob(blob,'hinh-hoc.svg');return;}
   const url=URL.createObjectURL(blob);try{const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(Error('Không chuyển được SVG thành ảnh.'));img.src=url;});const canvas=document.createElement('canvas');canvas.width=1680;canvas.height=1215;const context=canvas.getContext('2d');if(!context)throw Error('Trình duyệt chưa hỗ trợ xuất PNG.');context.drawImage(img,0,0);const png=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Không tạo được PNG.')),'image/png'));downloadBlob(png,'hinh-hoc.png');}finally{URL.revokeObjectURL(url);}
  }catch(e){setDownloadError(e instanceof Error?e.message:'Không tải được hình.');}
 }
 return <><section className="problem-figure" aria-label="Hình vẽ theo đề bài" data-geometry-status={model.status}><div className="problem-figure-head"><strong><Shapes size={18}/>{model.status==='provisional'?'Hình tạm thời':drawing.title}</strong><button type="button" className="quiet" onClick={()=>setExpanded(true)}><Expand size={15}/>Phóng to</button></div>
 {collection.length>1&&<label className="figure-variant">Chọn hình trong bài<select value={Math.min(variant,collection.length-1)} onChange={e=>setVariant(Number(e.target.value))}>{collection.map((d,i)=><option key={i} value={i}>{d.title}</option>)}</select></label>}
 <div ref={figureRef} className="figure-scroll"><div style={{width:zoom*100+'%',minWidth:'100%'}}><DiagramSVG drawing={drawing} aux={aux}/></div></div>
 {model.goal&&<p className="figure-caption"><strong>Mục tiêu:</strong> {model.goal}</p>}
 {model.status==='provisional'&&<div className="figure-assumptions" role="status"><strong>Giả định đang sử dụng</strong><ul>{model.assumptions.map((a,i)=><li key={i}>{a}</li>)}</ul>{model.missingInformation.length>0&&<details open><summary>Dữ kiện cần xác nhận</summary><ul>{model.missingInformation.map((a,i)=><li key={i}>{a}</li>)}</ul></details>}<p>Em xác nhận hoặc bổ sung quan hệ còn thiếu để dựng lại hình nhé.</p></div>}
 <div className="problem-figure-tools"><button type="button" className="quiet" onClick={()=>setRevision(v=>v+1)}>Vẽ lại hình</button><button type="button" className="quiet" aria-pressed={!aux} onClick={()=>setAux(v=>!v)}>{aux?<EyeOff size={15}/>:<Eye size={15}/>} {aux?'Ẩn nét phụ':'Hiện nét phụ'}</button><button type="button" className="quiet" onClick={()=>void exportImage('png')}><Download size={15}/>Tải PNG</button><button type="button" className="quiet" onClick={()=>void exportImage('svg')}><Download size={15}/>Tải SVG</button><button type="button" className="quiet" onClick={download}><Download size={15}/>Tải TikZ (.tex)</button><label>Thu/phóng <input aria-label="Mức phóng hình" type="range" min="1" max="2.5" step=".25" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label></div>
 {downloadError&&<p role="alert" className="error">{downloadError}</p>}
 <details className="figure-checks"><summary><CheckCheck size={15}/>{drawing.interpretation==='ai'?'Giả thiết AI đọc từ đề':'Giả thiết đã đối chiếu'} ({drawing.checks.length})</summary><ul>{drawing.checks.map((c,i)=><li key={i}>{c}</li>)}</ul></details>
 <details className="figure-checks" open={model.status==='provisional'}><summary>Bổ sung dữ kiện hoặc đường phụ</summary><label>Dữ kiện bổ sung<textarea maxLength={1600} value={edit} onChange={e=>setEdit(e.target.value)} placeholder="Bổ sung: M thuộc AB. Hoặc dán toàn bộ đề đã sửa, bắt đầu bằng Cho…"/></label><button type="button" className="quiet" onClick={()=>setEdit(problem)}>Chép đề để chỉnh lại</button><button type="button" className="quiet" onClick={()=>{setCorrection(edit);setRevision(v=>v+1);}}>Áp dụng và vẽ lại</button>{correction&&<p>Dữ kiện đang bổ sung: {correction}</p>}</details>
 <p className="figure-caption">Hình minh họa không thay thế chứng minh. Vị trí các điểm tự do là một cách chọn thỏa quan hệ, không phải dữ kiện đo đạc.</p></section>{showTheory&&<TheoryPanel problem={problem} level={level} model={model} ai={aiTheory}/>}
 <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="figure-dialog"><DialogHeader><DialogTitle>{drawing.title}</DialogTitle><DialogDescription>{model.status==='provisional'?'Hình tạm, cần xác nhận dữ kiện.':drawing.checks.join(' · ')}</DialogDescription></DialogHeader><DiagramSVG drawing={drawing} aux={aux}/><button type="button" className="quiet" onClick={()=>void exportImage('png')}><Download size={16}/>Tải PNG</button></DialogContent></Dialog></>;
}
