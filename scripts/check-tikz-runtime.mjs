import {createServer} from 'vite';import {chromium} from 'playwright';import {writeFileSync,mkdirSync} from 'node:fs';import assert from 'node:assert/strict';import {cases} from '../tests/fixtures/tikz-cases.mjs';
const server=await createServer({server:{host:'127.0.0.1',port:4176}});await server.listen();const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
mkdirSync('research/v6-checks',{recursive:true});const report=[];
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:4176');
for(const [name,code] of cases){
 const result=await page.evaluate(code=>new Promise(resolve=>{const f=document.createElement('iframe');f.src='/tikz-frame.html';document.body.replaceChildren(f);f.style='width:700px;height:520px';const receive=e=>{if(e.source!==f.contentWindow)return;if(e.data.ready)f.contentWindow.postMessage({latex:code},location.origin);if(e.data.svg||e.data.error){removeEventListener('message',receive);resolve(e.data);}};addEventListener('message',receive);}),code);
 assert(result.svg,name+': '+result.error);assert(!result.svg.includes('tikzjax-loader'));assert(result.svg.includes('<path'));writeFileSync('research/v6-checks/'+name+'.svg',result.svg);report.push({name,status:'pass'});console.log(name,'PASS');
}writeFileSync('research/v6-checks/compiler-results.json',JSON.stringify({source:'authored TikZ fixtures; not live Gemini output',results:report},null,2));
}finally{await browser.close();await server.close();}
