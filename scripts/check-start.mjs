import {spawn} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
const dir='research/release-checks';mkdirSync(dir,{recursive:true});
const startedAt=new Date().toISOString(),start=performance.now();
const child=spawn('npm',['start'],{stdio:['ignore','pipe','pipe'],detached:true});let log='';
try {
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server startup timeout')),20000);child.stdout.on('data',b=>{log+=b;if(log.includes('AI Tutor: http://localhost:')){clearTimeout(timeout);resolve();}});child.stderr.on('data',b=>{log+=b;});child.on('error',reject);child.on('exit',c=>{clearTimeout(timeout);reject(Error('Server exited: '+c));});});
 const url=log.match(/AI Tutor: (http:\/\/localhost:\d+)/)[1].replace('localhost','127.0.0.1');
 const root=await fetch(url);const html=await root.text();
 const chat=await fetch(url+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessCode:'HOCGIOITOAN',mode:'guide',messages:[{role:'user',content:'Cho hình bình hành ABCD.'}]})});
 const body=await chat.json();const feedback=await fetch(url+'/.netlify/functions/feedback',{method:'GET'});
 const ok=root.status===200&&html.includes('main.tsx')&&chat.status===503&&feedback.status===405;
 const report={command:'npm start',startedAt,finishedAt:new Date().toISOString(),durationMs:performance.now()-start,ok,rootStatus:root.status,rootHasApp:html.includes('main.tsx'),chatWithoutKeyStatus:chat.status,chatError:body.error,feedbackGetStatus:feedback.status,scope:'Khởi động cục bộ không có .env: HTTP giao diện và API. Không gọi Gemini thật; không gửi Google Forms.'};
 writeFileSync(dir+'/start-smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!ok)process.exitCode=1;
} finally {writeFileSync(dir+'/npm-start.log',log);try{process.kill(-child.pid,'SIGTERM');}catch{}}
