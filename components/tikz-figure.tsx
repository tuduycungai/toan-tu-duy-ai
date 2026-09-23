import {useEffect,useRef,useState} from 'react';
import {compileTikz} from '../lib/tikz-compiler';
import {useBlobURL} from '../lib/use-blob-url';
import {mobileDevice} from '../lib/device-budget';
import {downloadBlob,exportPNG} from '../lib/diagram-export';
import {TheoryPanel} from './theory-panel';
import {compileGeometry} from '../lib/geometry-model';
import {requestDiagram,DiagramRequestError,type DiagramResult} from '../lib/diagram-request';
import {readFigure,saveFigure} from '../lib/figure-cache';

export function ProblemFigure({problem,accessCode,redrawToken=0,suspended=false,level='Cơ bản',onProblemChange,onConnect}:{problem:string;accessCode:string;redrawToken?:number;suspended?:boolean;reply?:string;level?:string;onProblemChange?:(s:string)=>void;onConnect?:()=>void}){
 const [manual,setManual]=useState(false);
 const [mobile]=useState(mobileDevice);
 const [result,setResult]=useState<DiagramResult|null>(null),[svg,setSvg]=useState(''),[error,setError]=useState(''),[status,setStatus]=useState(''),[revision,setRevision]=useState(0),[answer,setAnswer]=useState(''),[zoom,setZoom]=useState(false);
 const controller=useRef<AbortController|null>(null),svgURL=useBlobURL(svg);
 const lastTrigger=useRef({revision:0,redrawToken}),lastProblem=useRef(problem);
 useEffect(()=>{
  const c=new AbortController();controller.current=c;setError('');
  if(lastProblem.current!==problem){setSvg('');setResult(null);lastProblem.current=problem;}
  const forced=revision!==lastTrigger.current.revision||redrawToken!==lastTrigger.current.redrawToken;
  lastTrigger.current={revision,redrawToken};
  const update=(fn:()=>void)=>{if(!c.signal.aborted)fn();};
  async function run(){
   const saved=forced?null:readFigure(problem);
   if(saved){setResult({latex:saved.latex,question:''});setSvg(saved.svg);setStatus('');return;}
   if(!accessCode||(mobile&&!manual&&!forced)){setStatus('');return;}
   let previous='',failure='';
   for(let attempt=0;attempt<2;attempt++){
    let phase:'request'|'compile'='request';
    try{
     update(()=>setStatus(attempt?'Thầy đang sửa lại mã hình…':'Thầy đang dựng hình từ đề bài…'));
     const r=await requestDiagram(problem,accessCode,c.signal,previous,failure);
     if(c.signal.aborted)return;setResult(r);
     if(r.question){setStatus('');return;}
     previous=r.latex;phase='compile';setStatus('Đang vẽ hình…');const output=await compileTikz(r.latex,c.signal);
     if(c.signal.aborted)return;saveFigure(problem,{latex:r.latex,svg:output});
     setSvg(output);setStatus('');return;
    }catch(e){if(c.signal.aborted)return;const err=e as Error;if(err.name==='AbortError'){setStatus('');return;}
     const repairable=phase==='compile'||e instanceof DiagramRequestError&&e.repairable;
     if(attempt===0&&repairable){failure=e instanceof DiagramRequestError?e.detail||e.message:err.message;continue;}
     setError(phase==='compile'?'Chưa biên dịch được hình. Em thử vẽ lại nhé.':err.message);setStatus('');return;
    }
   }
  }
  void run();return()=>{c.abort();};
 // Sending a chat turn does not cancel, clear or restart a drawing. suspended
 // only disables the redraw controls; it is deliberately not a job dependency.
 },[problem,accessCode,revision,redrawToken,manual,mobile]);
 useEffect(()=>{const pause=()=>{if(document.hidden){controller.current?.abort();setStatus('');}};document.addEventListener('visibilitychange',pause);return()=>document.removeEventListener('visibilitychange',pause);},[]);
 const redraw=()=>{setManual(true);setRevision(v=>v+1);};
 async function download(kind:'svg'|'png'){try{downloadBlob(kind==='svg'?new Blob([svg],{type:'image/svg+xml'}):await exportPNG(svg),'hinh-hoc-v6.1.'+kind);}catch{setError('Chưa tải được ảnh. Em có thể tải mã TikZ.');}}
 return <><section className="problem-figure" aria-label="Hình vẽ theo đề bài"><div className="problem-figure-head"><strong>Hình minh họa</strong>{svg&&<button onClick={()=>setZoom(!zoom)}>{zoom?'Thu gọn':'Phóng to'}</button>}</div>
 {!accessCode&&!svg&&<div className="figure-caption"><p>Kết nối AI để Thầy dựng hình từ đề bài.</p><button onClick={onConnect}>Kết nối & vẽ hình</button></div>}
 {mobile&&!manual&&!svg&&<p className="figure-caption">Để giảm tải cho điện thoại, em nhấn Vẽ hình khi muốn xem hình minh họa.</p>}
 {svg&&<p className="figure-caption">Đang giữ hình của bài này. Chỉ vẽ lại khi em yêu cầu hoặc thay đổi đề.</p>}
 {status&&<p role="status" className="figure-caption">{status}</p>}
 {error&&<p role="alert" className="error">{error}</p>}
 {result?.question&&<form className="figure-caption" onSubmit={e=>{e.preventDefault();if(answer.trim())onProblemChange?.(problem+'\n'+answer.trim());}}><p>{result.question}</p><label>Bổ sung cho hình<input value={answer} onChange={e=>setAnswer(e.target.value)} maxLength={1000}/></label><button disabled={!answer.trim()}>Cập nhật hình</button></form>}

 {svg&&<img className="tikz-result" style={{maxHeight:zoom?'none':430}} src={svgURL||undefined} alt={'Hình minh họa cho đề: '+problem}/>}
 <div className="problem-figure-tools"><button disabled={suspended||!!status||!accessCode} onClick={redraw}>{svg?'Vẽ lại hình':'Vẽ hình'}</button>{status&&<button onClick={()=>{controller.current?.abort();setStatus('');setError('Đã dừng dựng hình. Em có thể vẽ lại.');}}>Dừng vẽ</button>}{svg&&<><button onClick={()=>void download('png')}>Tải PNG</button><button onClick={()=>void download('svg')}>Tải SVG</button></>}{result?.latex&&<button onClick={()=>downloadBlob(new Blob([result.latex],{type:'text/x-tex;charset=utf-8'}),'hinh-hoc-v6.3.tex')}>Tải TikZ</button>}</div>
 <p className="figure-caption">Hình giúp quan sát; kết luận cần có lập luận chứng minh.</p></section><TheoryPanel problem={problem} model={compileGeometry(problem)} level={level}/></>;
}
