import {parseDiagramValue} from '../public/tikz-format.mjs';
export type DiagramResult={latex:string;question:string};
export class DiagramRequestError extends Error{constructor(message:string,public repairable=false,public detail=''){super(message);}}
export async function requestDiagram(problem:string,accessCode:string,signal:AbortSignal,previous='',failure='',fetcher:typeof fetch=fetch):Promise<DiagramResult>{
 const c=new AbortController();const cancel=()=>c.abort();signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)c.abort();
 const timeout=setTimeout(()=>c.abort(new Error('timeout')),35000);
 try{
  const content=problem+(failure?'\nYêu cầu sửa hình: '+failure.slice(0,1500)+(previous?'\nMã cần sửa:\n'+previous:''):'');
  const response=await fetcher('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:c.signal,body:JSON.stringify({accessCode,mode:'diagram',messages:[{role:'user',content}]})});
  if(!response.headers.get('content-type')?.includes('application/json'))throw new DiagramRequestError('Dịch vụ hình chưa được triển khai đúng. Giáo viên cần cập nhật cả Netlify Functions.');
  const data=await response.json();
  if(!response.ok)throw new DiagramRequestError(data.error||'Chưa dựng được hình. Em thử lại nhé.',data.repairable===true,typeof data.detail==='string'?data.detail:'');
  try{return parseDiagramValue(data);}catch(e){throw new DiagramRequestError('AI chưa trả mã hình hợp lệ.',true,(e as Error).message);}
 }catch(e){if(signal.aborted)throw new DOMException('Cancelled','AbortError');if(c.signal.aborted)throw new DiagramRequestError('Dịch vụ vẽ phản hồi quá lâu. Em thử lại nhé.');throw e;}
 finally{clearTimeout(timeout);signal.removeEventListener('abort',cancel);}
}
