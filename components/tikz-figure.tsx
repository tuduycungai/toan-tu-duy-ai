import {useEffect,useRef,useState} from 'react';
import {downloadBlob,exportPNG} from '../lib/diagram-export';
import {TheoryPanel} from './theory-panel';
import {compileGeometry} from '../lib/geometry-model';

type Result={latex:string;question:string};
const cache=new Map<string,Result>();
export function ProblemFigure({problem,accessCode,level='Cơ bản',onProblemChange}:{problem:string;accessCode:string;reply?:string;level?:string;onProblemChange?:(s:string)=>void}){
 const [result,setResult]=useState<Result|null>(null),[svg,setSvg]=useState(''),[error,setError]=useState(''),[status,setStatus]=useState(''),[revision,setRevision]=useState(0),[frameKey,setFrameKey]=useState(0),[answer,setAnswer]=useState(''),[zoom,setZoom]=useState(false);
 const frame=useRef<HTMLIFrameElement>(null),repair=useRef(0),controller=useRef<AbortController|null>(null);
 const active=useRef(true);
 async function generate(previous='',failure=''){
  controller.current?.abort();const c=new AbortController();controller.current=c;
  setError('');setStatus(previous?'Thầy đang chỉnh lại hình…':'Thầy đang dựng hình từ đề bài…');setSvg('');setResult(null);
  try{
   const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.any([c.signal,AbortSignal.timeout(35000)]),body:JSON.stringify({accessCode,mode:'diagram',messages:[{role:'user',content:problem+(previous?'\nMã cần sửa:\n'+previous+'\nLỗi biên dịch:\n'+failure:'')}]})});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Chưa dựng được hình.');
   if(!active.current||c.signal.aborted)return;
   const r={latex:data.latex||'',question:data.question||''};setResult(r);cache.set(problem,r);if(cache.size>20)cache.delete(cache.keys().next().value!);setFrameKey(k=>k+1);setStatus(r.question?'':'Đang vẽ hình…');
  }catch(e){if(!c.signal.aborted&&active.current){setError((e as Error).message);setStatus('');}}
 }
 useEffect(()=>{active.current=true;repair.current=0;setSvg('');setError('');setResult(null);
  if(!accessCode){setStatus('Kết nối với Thầy để dựng hình theo đề bài.');return;}
  const saved=revision===0?cache.get(problem):null;if(saved){setResult(saved);setStatus(saved.question?'':'Đang vẽ hình…');}else void generate();
  return()=>{active.current=false;controller.current?.abort();};
 },[problem,accessCode,revision]);
 useEffect(()=>{
  const timeout=result?.latex?setTimeout(()=>{setStatus('');setError('Chưa tải được bộ dựng hình. Em thử vẽ lại nhé.');setResult(null);},40000):undefined;
  const receive=(e:MessageEvent)=>{
   if(e.source!==frame.current?.contentWindow||e.origin!==location.origin)return;
   if(e.data?.ready&&result?.latex)frame.current?.contentWindow?.postMessage({latex:result.latex},location.origin);
   if(typeof e.data?.svg==='string'){
    // SVG stays an image resource, never executable HTML in the application.
    clearTimeout(timeout);setSvg(e.data.svg);setStatus('');
   }
   if(typeof e.data?.error==='string'){clearTimeout(timeout);
    if(repair.current++===0&&result?.latex)void generate(result.latex,e.data.error);
    else{setResult(null);setError('Hình chưa biên dịch được. Em thử vẽ lại hoặc kiểm tra đề nhé.');setStatus('');}
   }
  };addEventListener('message',receive);return()=>{clearTimeout(timeout);removeEventListener('message',receive);};
 },[result,problem,accessCode]);
 async function download(kind:'svg'|'png'){try{downloadBlob(kind==='svg'?new Blob([svg],{type:'image/svg+xml'}):await exportPNG(svg),'hinh-hoc-v6.'+kind);}catch{setError('Chưa tải được ảnh. Em có thể tải mã TikZ.');}}
 return <><section className="problem-figure" aria-label="Hình vẽ theo đề bài"><div className="problem-figure-head"><strong>Hình minh họa</strong>{svg&&<button onClick={()=>setZoom(!zoom)}>{zoom?'Thu gọn':'Phóng to'}</button>}</div>
 {status&&<p role="status" className="figure-caption">{status}</p>}
 {error&&<p role="alert" className="error">{error}</p>}
 {result?.question&&<form className="figure-caption" onSubmit={e=>{e.preventDefault();if(answer.trim())onProblemChange?.(problem+'\n'+answer.trim());}}><p>{result.question}</p><label>Bổ sung cho hình<input value={answer} onChange={e=>setAnswer(e.target.value)} maxLength={1000}/></label><button disabled={!answer.trim()}>Cập nhật hình</button></form>}
 {result?.latex&&<iframe key={frameKey} ref={frame} src="/tikz-frame.html" title="Bộ dựng hình" style={{position:'absolute',width:1,height:1,opacity:0,pointerEvents:'none',border:0}} aria-hidden="true" tabIndex={-1}/>}
 {svg&&<img className="tikz-result" style={{maxHeight:zoom?'none':430}} src={'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)} alt={'Hình minh họa cho đề: '+problem}/>}
 <div className="problem-figure-tools"><button disabled={!!status||!accessCode} onClick={()=>setRevision(v=>v+1)}>Vẽ lại hình</button>{svg&&<><button onClick={()=>void download('png')}>Tải PNG</button><button onClick={()=>void download('svg')}>Tải SVG</button></>}{result?.latex&&<button onClick={()=>downloadBlob(new Blob([result.latex],{type:'text/x-tex;charset=utf-8'}),'hinh-hoc-v6.tex')}>Tải TikZ</button>}</div>
 <p className="figure-caption">Hình giúp quan sát; kết luận cần có lập luận chứng minh.</p></section><TheoryPanel problem={problem} model={compileGeometry(problem)} level={level}/></>;
}
