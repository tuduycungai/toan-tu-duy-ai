let started=false;
addEventListener('message',e=>{
 if(e.source!==parent||e.origin!==location.origin||started||typeof e.data?.latex!=='string')return;
 started=true;
 const source=e.data.latex;
 const body=source.match(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/)?.[0];
 if(!body){parent.postMessage({error:'Thiếu môi trường tikzpicture'},location.origin);return;}
 const script=document.createElement('script');script.type='text/tikz';script.textContent=body;
 script.dataset.tikzLibraries=[...source.matchAll(/\\usetikzlibrary\{([^}]+)\}/g)].map(m=>m[1]).join(',');
 script.dataset.disableCache='true';
 let done=false;
 const finish=async()=>{
  if(done)return;
  const svg=document.querySelector('svg.tikz:not(.tikzjax-loader),svg.tikzjax:not(.tikzjax-loader)');
  const error=document.querySelector('.tikzjax-error,.tikzjax-broken-wrapper');
  if(svg){done=true;
   // Embed TeX fonts so exported SVG/PNG and image elements retain exact labels.
   const families=[...new Set([...svg.querySelectorAll('[font-family]')].map(n=>n.getAttribute('font-family')))];
   let css='';
   for(const family of families){if(!/^[a-zA-Z0-9]+$/.test(family))continue;try{const r=await fetch('/tikz/fonts/'+family+'.woff2');if(!r.ok)continue;const bytes=new Uint8Array(await r.arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);css+='@font-face{font-family:'+family+';src:url(data:font/woff2;base64,'+btoa(binary)+') format("woff2")}';}catch{}}
   const style=document.createElementNS('http://www.w3.org/2000/svg','style');style.textContent=css;svg.prepend(style);svg.style.color='black';
   parent.postMessage({svg:new XMLSerializer().serializeToString(svg)},location.origin);
  }
  else if(error){done=true;parent.postMessage({error:error.textContent.slice(0,1800)},location.origin);}
 };
 new MutationObserver(finish).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('tikzjax-load-finished',finish);
 document.body.append(script);
 setTimeout(()=>{if(!done){done=true;parent.postMessage({error:'Biên dịch quá thời gian chờ'},location.origin);}},30000);
});
parent.postMessage({ready:true},location.origin);
