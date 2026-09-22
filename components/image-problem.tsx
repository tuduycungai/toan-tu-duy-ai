import {useEffect,useRef,useState} from 'react';
import {Camera,ImagePlus,X} from 'lucide-react';
import {prepareImage,type PreparedImage} from '../lib/image-input';
import {imageRequest,ImageAPIError,type ImageReading,type ImageResponse,type DiagramResponse} from '../lib/image-workflow';
import {compileTikz} from '../lib/tikz-compiler';
import {downloadBlob,exportPNG} from '../lib/diagram-export';
import {MathText} from './math-text';

type Props={accessCode:string;disabled:boolean;onConnect:()=>void;onReady:(problem:string)=>void;onStateChange:(state:'none'|'pending'|'accepted')=>void};
export function ImageProblem({accessCode,disabled,onConnect,onReady,onStateChange}:Props){
  const [image,setImage]=useState<PreparedImage|null>(null),[note,setNote]=useState(''),[reading,setReading]=useState<ImageReading|null>(null),[token,setToken]=useState('');
  const [transcript,setTranscript]=useState(''),[correction,setCorrection]=useState(''),[revising,setRevising]=useState(false),[accepted,setAccepted]=useState(false);
  const [svg,setSVG]=useState(''),[latex,setLatex]=useState(''),[validation,setValidation]=useState<DiagramResponse['validation']|null>(null),[confirmed,setConfirmed]=useState(false);
  const [busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState(''),[zoom,setZoom]=useState(false),[drag,setDrag]=useState(false);
  const library=useRef<HTMLInputElement>(null),camera=useRef<HTMLInputElement>(null),controller=useRef<AbortController|null>(null),lock=useRef(false),generation=useRef(0);
  useEffect(()=>()=>{generation.current++;controller.current?.abort();},[]);
  const pending=()=>{setAccepted(false);onStateChange('pending');};
  function remove(){generation.current++;controller.current?.abort();lock.current=false;setBusy(false);setImage(null);setNote('');setReading(null);setToken('');setSVG('');setLatex('');setConfirmed(false);setAccepted(false);setRevising(false);setCorrection('');setStatus('');setError('');onStateChange('none');}
  async function select(file?:File){
    if(!file||disabled||lock.current)return;remove();const id=generation.current;lock.current=true;setBusy(true);setStatus('Đang chuẩn bị ảnh…');onStateChange('pending');
    try{const value=await prepareImage(file);if(id===generation.current)setImage(value);}catch(e){if(id===generation.current){setError((e as Error).message);onStateChange('none');}}
    finally{if(id===generation.current){lock.current=false;setBusy(false);setStatus('');}}
  }
  async function job(task:(signal:AbortSignal)=>Promise<void>){
    if(disabled||lock.current)return;if(!accessCode){onConnect();return;}lock.current=true;setBusy(true);setError('');const c=new AbortController();controller.current=c;
    try{await task(c.signal);}catch(e){if(!c.signal.aborted)setError((e as Error).message);}
    finally{if(controller.current===c){lock.current=false;setBusy(false);setStatus('');controller.current=null;}}
  }
  function applyReading(d:ImageResponse){setReading(d.reading);setTranscript(d.reading.transcription);setToken(d.imageToken);setConfirmed(d.confirmed);setCorrection('');setSVG('');setLatex('');setValidation(null);pending();}
  const read=()=>void job(async signal=>{if(!image)return;setStatus('AI đang đọc đề và kiểm tra ký hiệu…');const d=await imageRequest<ImageResponse>({mode:'image-read',image:{data:image.data,mimeType:image.mimeType},note},accessCode,signal);if(!signal.aborted)applyReading(d);});
  async function draw(imageToken:string,signal:AbortSignal){
    let repairToken=imageToken,previous='',failure='';setSVG('');setLatex('');setValidation(null);pending();
    for(let attempt=0;attempt<3;attempt++){
      setStatus(attempt?`Đang sửa hình (${attempt}/2)…`:'Đang sinh và kiểm tra mã hình…');
      let received:DiagramResponse|undefined;
      try{
        received=await imageRequest<DiagramResponse>({mode:'image-diagram',imageToken:repairToken,previous,failure},accessCode,signal);
        if(signal.aborted)return;repairToken=received.repairToken;previous=received.latex;setLatex(previous);setStatus('Đang biên dịch hình…');
        const output=await compileTikz(previous,signal);if(signal.aborted)return;setSVG(output);setValidation(received.validation);return;
      }catch(e){
        if(signal.aborted)throw e;
        if(e instanceof ImageAPIError){if(!e.repairable||attempt===2)throw e;repairToken=e.repairToken;previous=e.latex;failure=e.detail||e.message;}
        else if(received&&attempt<2)failure=(e as Error).message.slice(0,900);
        else throw Error('Chưa dựng được hình sau tối đa hai lần sửa. Đề đã đọc vẫn được giữ; em có thể sửa dữ kiện hoặc thử dựng lại.');
      }
    }
  }
  const confirm=()=>void job(async signal=>{
    setStatus('Đang đối chiếu đề em xác nhận…');const d=await imageRequest<ImageResponse>({mode:revising?'image-revise':'image-confirm',imageToken:token,transcription:transcript,correction},accessCode,signal);
    if(signal.aborted)return;applyReading(d);setRevising(false);
    if(d.confirmed)await draw(d.imageToken,signal);else setError('Đã cập nhật bản đọc. Em kiểm tra lại rồi nhấn Xác nhận và vẽ hình.');
  });
  async function download(kind:'png'|'svg'){try{downloadBlob(kind==='svg'?new Blob([svg],{type:'image/svg+xml'}):await exportPNG(svg),'de-toan-v6.2.3.'+kind);}catch(e){setError((e as Error).message);}}
  return <section className={`image-problem ${drag?'drag-active':''}`} aria-label="Gửi ảnh đề toán" onDragOver={e=>{e.preventDefault();if(!busy&&!disabled)setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);void select(e.dataTransfer.files[0]);}}>
    <div className="image-input-tools"><strong>Gửi ảnh đề toán</strong><button type="button" disabled={busy||disabled} onClick={()=>library.current?.click()}><ImagePlus size={17}/>Chọn ảnh</button><button type="button" disabled={busy||disabled} onClick={()=>camera.current?.click()}><Camera size={17}/>Chụp ảnh</button></div>
    <input ref={library} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Chọn ảnh đề toán" onChange={e=>{void select(e.target.files?.[0]);e.target.value='';}}/>
    <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Chụp ảnh đề toán" onChange={e=>{void select(e.target.files?.[0]);e.target.value='';}}/>
    {!image&&!reading&&<p className="caption">PNG, JPG/JPEG, WebP · tối đa 24 MB. Có thể kéo ảnh vào đây. Chụp rõ toàn bộ đề và ký hiệu; tránh kèm thông tin cá nhân.</p>}
    {image&&<div className="image-preview"><img src={image.preview} alt="Ảnh đề đã chọn"/><div><span>{image.name}</span><small>{image.width} × {image.height}{image.compressed?' · đã tối ưu dung lượng':''}</small><button type="button" onClick={remove} disabled={disabled}><X size={15}/>Xóa ảnh / chọn lại</button></div></div>}
    {image&&!reading&&<><label>Câu hỏi bổ sung (không bắt buộc)<textarea value={note} maxLength={1200} rows={2} disabled={busy} onChange={e=>setNote(e.target.value)}/></label><button type="button" className="primary" onClick={read} disabled={busy||disabled}>Đọc đề từ ảnh</button></>}
    {reading&&<div className="image-reading"><h3>1. Đề bài AI đã đọc</h3><label>Kiểm tra và sửa bản phiên âm<textarea aria-label="Bản phiên âm đề" value={transcript} maxLength={6000} rows={5} disabled={busy||disabled} onChange={e=>{setTranscript(e.target.value);setConfirmed(false);setSVG('');pending();}}/></label>
      {(reading.uncertainties.length>0||!reading.ready)&&<div className="image-uncertain" role="status"><strong>Cần làm rõ trước khi vẽ</strong>{reading.uncertainties.map((u,i)=><p key={i}><mark>{u.text}</mark> — {u.question}</p>)}{reading.clarification&&<p>{reading.clarification}</p>}{!reading.uncertainties.length&&!reading.clarification&&<p>Độ rõ của ảnh chưa đủ. Em hãy xác nhận các dữ kiện hoặc chụp lại.</p>}</div>}
      <details><summary>Giả thiết, kết luận và quan hệ đã đọc</summary><p><strong>Giả thiết:</strong> {reading.givens.join('; ')}</p><p><strong>Yêu cầu:</strong> {reading.goals.join('; ')||reading.construction}</p>{reading.relations.map((r,i)=><p key={i}><MathText text={r.description}/></p>)}</details>
      {(!svg||revising)&&<><label>{revising?'Hình sai ở điểm, quan hệ hoặc nhãn nào?':'Bổ sung / xác nhận ký hiệu còn nghi ngờ'}<textarea value={correction} onChange={e=>{setCorrection(e.target.value);setConfirmed(false);}} maxLength={1200} rows={2} disabled={busy||disabled}/></label><button type="button" className="primary" disabled={busy||disabled||!transcript.trim()||(revising&&!correction.trim())} onClick={confirm}>{revising?'Cập nhật dữ kiện hình':'Xác nhận và vẽ hình'}</button></>}
      {confirmed&&!svg&&!busy&&<button type="button" onClick={()=>void job(s=>draw(token,s))} disabled={disabled}>Thử dựng lại</button>}
      {svg&&<><h3>2. Hình minh họa</h3><div className={`image-drawing ${zoom?'zoomed':''}`} tabIndex={0}><img src={'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)} alt={'Hình minh họa: '+reading.transcription}/></div><div className="image-input-tools"><button type="button" onClick={()=>setZoom(!zoom)}>{zoom?'Thu gọn':'Phóng to hình'}</button><button type="button" onClick={()=>void download('png')}>Tải PNG</button><button type="button" onClick={()=>void download('svg')}>Tải SVG</button></div>
        {validation&&<p className="caption">{validation.notice}{validation.unverified.length>0&&' Cần đối chiếu: '+validation.unverified.join('; ')}</p>}
        <h3>3. Lý thuyết dự kiến dùng</h3>{reading.theory.length?reading.theory.map((t,i)=><p key={i}><strong>{t.name}</strong> — {t.conditions}</p>):<p>Đối chiếu giả thiết, kết luận và định nghĩa của các đối tượng trong đề.</p>}
        <p className="caption">Hình chỉ minh họa. Em kiểm tra vị trí điểm, ký hiệu và các quan hệ trước khi học.</p>
        {!accepted&&!revising&&<button type="button" className="primary" disabled={busy||disabled} onClick={()=>{setAccepted(true);onStateChange('accepted');onReady(reading.transcription);}}>Hình đúng — bắt đầu gợi mở</button>}
        {accepted&&<p role="status" className="success-note">Đã xác nhận hình. Tiếp tục trả lời trong ô hội thoại bên dưới.</p>}
        <button type="button" disabled={busy||disabled} onClick={()=>{setRevising(true);setConfirmed(false);pending();}}>Hình chưa đúng — yêu cầu sửa</button>
      </>}
      {latex&&<details className="teacher-tikz"><summary>Mã TikZ dành cho giáo viên</summary><pre>{latex}</pre><button type="button" onClick={()=>downloadBlob(new Blob([latex],{type:'text/x-tex;charset=utf-8'}),'de-toan-v6.2.3.tex')}>Tải mã TikZ</button></details>}
    </div>}
    {status&&<p role="status">{status}</p>}{busy&&<button type="button" onClick={()=>{if(controller.current)controller.current.abort();else{generation.current++;lock.current=false;setBusy(false);setStatus('');onStateChange(image?'pending':'none');}setError('Đã dừng. Em có thể thử lại với dữ kiện đã giữ.');}}>Dừng xử lý</button>}
    {error&&<p className="error" role="alert">{error}</p>}
  </section>;
}
