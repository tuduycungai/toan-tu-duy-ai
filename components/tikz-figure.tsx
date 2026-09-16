import {useEffect,useRef,useState} from 'react';
import {downloadBlob,exportPNG} from '../lib/diagram-export';
import {TheoryPanel} from './theory-panel';
import {compileGeometry} from '../lib/geometry-model';
import {requestDiagram,DiagramRequestError,type DiagramResult} from '../lib/diagram-request';

type Saved={latex:string;svg:string};
const cache=new Map<string,Saved>();
type Job={id:string;latex:string};
type Pending={id:string;resolve:(svg:string)=>void;reject:(e:Error)=>void};
export function ProblemFigure({problem,accessCode,redrawToken=0,level='Cơ bản',onProblemChange,onConnect}:{problem:string;accessCode:string;redrawToken?:number;reply?:string;level?:string;onProblemChange?:(s:string)=>void;onConnect?:()=>void}){
 const [result,setResult]=useState<DiagramResult|null>(null),[svg,setSvg]=useState(''),[error,setError]=useState(''),[status,setStatus]=useState(''),[revision,setRevision]=useState(0),[job,setJob]=useState<Job|null>(null),[answer,setAnswer]=useState(''),[zoom,setZoom]=useState(false);
 const frame=useRef<HTMLIFrameElement>(null),pending=useRef<Pending|null>(null),currentJob=useRef<Job|null>(null),controller=useRef<AbortController|null>(null);
 const submitJob=()=>{const j=currentJob.current;if(j)frame.current?.contentWindow?.postMessage({type:'compile',jobId:j.id,latex:j.latex},location.origin);};
 useEffect(()=>{const receive=(e:MessageEvent)=>{
  if(e.source!==frame.current?.contentWindow||e.origin!==location.origin)return;
  if(e.data?.type==='ready'){submitJob();return;}
  if(!pending.current||e.data?.jobId!==pending.current.id)return;
  if(e.data.type==='compiled'&&typeof e.data.svg==='string'&&e.data.svg.includes('<svg'))pending.current.resolve(e.data.svg);
  else if(e.data.type==='error')pending.current.reject(new Error(String(e.data.error||'Lỗi biên dịch hình').slice(0,1500)));
 };addEventListener('message',receive);return()=>removeEventListener('message',receive);},[]);
 useEffect(()=>{
  const c=new AbortController();controller.current=c;setSvg('');setError('');setResult(null);setJob(null);currentJob.current=null;
  const update=(fn:()=>void)=>{if(!c.signal.aborted)fn();};
  async function compile(latex:string){return await new Promise<string>((resolve,reject)=>{
   const id=crypto.randomUUID();const j={id,latex};
   const timer=setTimeout(()=>finish(new Error('Không nhận được hình từ bộ biên dịch. Kiểm tra tệp TikZ/khung vẽ của website.')),40000);
   const abort=()=>finish(new DOMException('Cancelled','AbortError'));
   let finished=false;
   function finish(error?:Error,value?:string){if(finished)return;finished=true;clearTimeout(timer);c.signal.removeEventListener('abort',abort);if(pending.current?.id===id){pending.current=null;currentJob.current=null;update(()=>setJob(null));}if(error)reject(error);else resolve(value!);}
   pending.current={id,resolve:value=>finish(undefined,value),reject:e=>finish(e)};currentJob.current=j;c.signal.addEventListener('abort',abort,{once:true});
   if(c.signal.aborted)abort();else setJob(j);
  });}
  async function run(){
   if(!accessCode){setStatus('');return;}
   const saved=revision===0&&redrawToken===0?cache.get(problem):null;
   if(saved){setResult({latex:saved.latex,question:''});setSvg(saved.svg);setStatus('');return;}
   let previous='',failure='';
   for(let attempt=0;attempt<2;attempt++){
    let phase:'request'|'compile'='request';
    try{
     update(()=>setStatus(attempt?'Thầy đang sửa lại mã hình…':'Thầy đang dựng hình từ đề bài…'));
     const r=await requestDiagram(problem,accessCode,c.signal,previous,failure);
     if(c.signal.aborted)return;setResult(r);
     if(r.question){setStatus('');return;}
     previous=r.latex;phase='compile';setStatus('Đang vẽ hình…');const output=await compile(r.latex);
     if(c.signal.aborted)return;cache.set(problem,{latex:r.latex,svg:output});if(cache.size>20)cache.delete(cache.keys().next().value!);
     setSvg(output);setStatus('');return;
    }catch(e){if(c.signal.aborted)return;const err=e as Error;
     const repairable=phase==='compile'||e instanceof DiagramRequestError&&e.repairable;
     if(attempt===0&&repairable){failure=e instanceof DiagramRequestError?e.detail||e.message:err.message;continue;}
     setError(phase==='compile'?'Chưa biên dịch được hình. Em thử vẽ lại nhé.':err.message);setStatus('');return;
    }
   }
  }
  void run();return()=>{c.abort();};
 },[problem,accessCode,revision,redrawToken]);
 const redraw=()=>{cache.delete(problem);setRevision(v=>v+1);};
 async function download(kind:'svg'|'png'){try{downloadBlob(kind==='svg'?new Blob([svg],{type:'image/svg+xml'}):await exportPNG(svg),'hinh-hoc-v6.1.'+kind);}catch{setError('Chưa tải được ảnh. Em có thể tải mã TikZ.');}}
 return <><section className="problem-figure" aria-label="Hình vẽ theo đề bài"><div className="problem-figure-head"><strong>Hình minh họa</strong>{svg&&<button onClick={()=>setZoom(!zoom)}>{zoom?'Thu gọn':'Phóng to'}</button>}</div>
 {!accessCode&&<div className="figure-caption"><p>Kết nối AI để Thầy dựng hình từ đề bài.</p><button onClick={onConnect}>Kết nối & vẽ hình</button></div>}
 {status&&<p role="status" className="figure-caption">{status}</p>}
 {error&&<p role="alert" className="error">{error}</p>}
 {result?.question&&<form className="figure-caption" onSubmit={e=>{e.preventDefault();if(answer.trim())onProblemChange?.(problem+'\n'+answer.trim());}}><p>{result.question}</p><label>Bổ sung cho hình<input value={answer} onChange={e=>setAnswer(e.target.value)} maxLength={1000}/></label><button disabled={!answer.trim()}>Cập nhật hình</button></form>}
 {job&&<iframe key={job.id} ref={frame} onLoad={submitJob} src="/tikz-frame.html?v=6.1" title="Bộ dựng hình" style={{position:'absolute',width:1,height:1,opacity:0,pointerEvents:'none',border:0}} aria-hidden="true" tabIndex={-1}/>}
 {svg&&<img className="tikz-result" style={{maxHeight:zoom?'none':430}} src={'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)} alt={'Hình minh họa cho đề: '+problem}/>}
 <div className="problem-figure-tools"><button disabled={!!status||!accessCode} onClick={redraw}>Vẽ lại hình</button>{status&&<button onClick={()=>{controller.current?.abort();pending.current=null;currentJob.current=null;setJob(null);setStatus('');setError('Đã dừng dựng hình. Em có thể vẽ lại.');}}>Dừng vẽ</button>}{svg&&<><button onClick={()=>void download('png')}>Tải PNG</button><button onClick={()=>void download('svg')}>Tải SVG</button></>}{result?.latex&&<button onClick={()=>downloadBlob(new Blob([result.latex],{type:'text/x-tex;charset=utf-8'}),'hinh-hoc-v6.1.tex')}>Tải TikZ</button>}</div>
 <p className="figure-caption">Hình giúp quan sát; kết luận cần có lập luận chứng minh.</p></section><TheoryPanel problem={problem} model={compileGeometry(problem)} level={level}/></>;
}
