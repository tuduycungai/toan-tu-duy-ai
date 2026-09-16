import {prepareTikz} from './tikz-format.mjs?v=6.1';
let started=false,jobId='',done=false,lastError='';
const send=data=>parent.postMessage({...data,jobId},location.origin);
const warn=console.warn.bind(console);
console.warn=(...args)=>{if(String(args[0]).includes('TikZJax'))lastError=args.map(a=>a instanceof Error?a.message:String(a)).join(' ').slice(0,1500);warn(...args);};
addEventListener('message',e=>{
 if(e.source!==parent||e.origin!==location.origin||started||e.data?.type!=='compile'||typeof e.data.latex!=='string'||typeof e.data.jobId!=='string')return;
 started=true;jobId=e.data.jobId;
 let parsed;try{parsed=prepareTikz(e.data.latex);}catch(error){send({type:'error',error:error.message});return;}
 const script=document.createElement('script');script.type='text/tikz';script.textContent=parsed.body;script.dataset.tikzLibraries=parsed.libraries;script.dataset.disableCache='true';
 const timer=setTimeout(()=>fail('Biên dịch quá thời gian chờ'),30000);
 function fail(error){if(done)return;done=true;clearTimeout(timer);observer.disconnect();send({type:'error',error});}
 let finishing=false;
 async function finish(){
  if(done||finishing)return;
  const svg=document.querySelector('svg.tikz:not(.tikzjax-loader),svg.tikzjax:not(.tikzjax-loader)');
  const error=document.querySelector('.tikzjax-error,.tikzjax-broken-wrapper');
  if(error){fail(lastError||error.textContent||'TeX không biên dịch được mã hình.');return;}
  if(!svg)return;finishing=true;
  try{
   const families=[...new Set([...svg.querySelectorAll('[font-family]')].map(n=>n.getAttribute('font-family')))];let css='';
   for(const family of families){if(!/^[a-zA-Z0-9]+$/.test(family))continue;
    const c=new AbortController();const fontTimer=setTimeout(()=>c.abort(),5000);
    try{const r=await fetch('/tikz/fonts/'+family+'.woff2',{signal:c.signal});if(!r.ok)continue;const bytes=new Uint8Array(await r.arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);css+='@font-face{font-family:'+family+';src:url(data:font/woff2;base64,'+btoa(binary)+') format("woff2")}';}finally{clearTimeout(fontTimer);}
   }
   if(done)return;const style=document.createElementNS('http://www.w3.org/2000/svg','style');style.textContent=css;svg.prepend(style);svg.style.color='black';done=true;clearTimeout(timer);observer.disconnect();
   send({type:'compiled',svg:new XMLSerializer().serializeToString(svg)});
  }catch{fail('Chưa tải được font của hình. Kiểm tra lại kết nối.');}
 }
 const observer=new MutationObserver(finish);observer.observe(document.body,{childList:true,subtree:true});document.addEventListener('tikzjax-load-finished',finish);document.body.append(script);
});
parent.postMessage({type:'ready'},location.origin);
