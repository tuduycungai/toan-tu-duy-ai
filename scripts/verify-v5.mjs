import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=new URL('../research/v5-checks/',import.meta.url);
await mkdir(out,{recursive:true});
const results=[];
async function run(label,cmd,args,file,timeout=120000){
 const start=Date.now();let output='';
 const child=spawn(cmd,args,{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
 const timer=setTimeout(()=>child.kill('SIGTERM'),timeout);
 const code=await new Promise(resolve=>{child.on('error',e=>{output+=e.message;resolve(-1);});child.on('close',code=>resolve(code??-1));});clearTimeout(timer);
 await writeFile(new URL(file,out),output);
 const result={label,command:[cmd,...args].join(' '),exitCode:code,durationMs:Date.now()-start,at:new Date().toISOString(),log:file};results.push(result);console.log(label+': '+(code===0?'PASS':'FAIL')+' ('+result.durationMs+' ms)');
 return code;
}
await run('Existing package tests','npm',['test'],'npm-test.log');
await run('Per-case structured report','node',['--test','--test-reporter=./scripts/test-report.mjs','tests/*.test.mjs'],'tests.jsonl');
await run('TypeScript','npx',['tsc','--noEmit'],'tsc.log');
await run('Production build','npm',['run','build'],'build.log');
await run('React/SVG render of ten mandatory problems','node',['scripts/check-v5-render.mjs'],'render.log');
// Smoke-test local unchanged adapter; never contact a live provider or send a feedback form.
const child=spawn('npm',['start'],{cwd:root,env:{...process.env,PORT:'3098',GEMINI_API_KEY:''},stdio:'ignore'});
let smoke;try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch('http://127.0.0.1:3098')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
 if(!ready)throw Error('Local server did not start.');
 const noKey=await fetch('http://127.0.0.1:3098/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
 const feedback=await fetch('http://127.0.0.1:3098/.netlify/functions/feedback');
 smoke={home:200,chatWithoutKey:noKey.status,feedbackReadOnly:feedback.status,pass:noKey.status===503&&feedback.status===405};
}catch(e){smoke={pass:false,error:e.message};}finally{child.kill('SIGTERM');}
results.push({label:'Local HTTP smoke (no external writes)',exitCode:smoke.pass?0:1,result:smoke});console.log('HTTP smoke: '+(smoke.pass?'PASS':'FAIL'));
const events=(await readFile(new URL('tests.jsonl',out),'utf8')).split('\n').filter(s=>s.startsWith('{')).map(s=>JSON.parse(s));
const summary={at:new Date().toISOString(),node:process.version,tests:{total:events.length,passed:events.filter(e=>e.status==='pass').length,failed:events.filter(e=>e.status==='fail').length,skipped:events.filter(e=>e.status==='skip').length},commands:results,liveGemini:'NOT RUN: no live API key; unit tests use synthetic fetch responses',browser:'NOT VERIFIED: local Chromium startup failed; React/SVG render is not browser interaction coverage'};
await writeFile(new URL('summary.json',out),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary.tests));if(results.some(r=>r.exitCode!==0))process.exitCode=1;
