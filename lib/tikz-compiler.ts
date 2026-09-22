import {prepareTikz} from '../public/tikz-format.mjs';
import {sanitizeSVG} from '../public/svg-safety.mjs';

export async function compileTikz(latex:string,signal:AbortSignal):Promise<string>{
  prepareTikz(latex);
  if(signal.aborted)throw new DOMException('Đã dừng','AbortError');
  return new Promise((resolve,reject)=>{
    const frame=document.createElement('iframe'),id=crypto.randomUUID();
    frame.src='/tikz-frame.html?v=6.2.3';frame.title='Bộ dựng hình';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
    frame.style.cssText='position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0';
    frame.sandbox.add('allow-scripts','allow-same-origin');
    let done=false;
    const finish=(error?:Error,svg?:string)=>{if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',cancel);window.removeEventListener('message',receive);frame.contentWindow?.postMessage({type:'cancel',jobId:id},location.origin);frame.remove();if(error)reject(error);else resolve(svg!);};
    const send=()=>frame.contentWindow?.postMessage({type:'compile',jobId:id,latex},location.origin);
    const cancel=()=>finish(new DOMException('Đã dừng dựng hình','AbortError'));
    const receive=(event:MessageEvent)=>{
      if(event.source!==frame.contentWindow||event.origin!==location.origin)return;
      if(event.data?.type==='ready'){send();return;}
      if(event.data?.jobId!==id)return;
      if(event.data.type==='compiled'){try{finish(undefined,sanitizeSVG(event.data.svg));}catch(e){finish(e as Error);}}
      else if(event.data.type==='error')finish(Error(String(event.data.error||'Lỗi biên dịch').slice(0,900)));
    };
    const timer=setTimeout(()=>finish(Error('Bộ dựng hình quá thời gian 35 giây.')),35000);
    frame.onload=send;window.addEventListener('message',receive);signal.addEventListener('abort',cancel,{once:true});document.body.append(frame);
  });
}
