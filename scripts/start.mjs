// Local adapter only. Production continues to use the unchanged Netlify function.
import http from 'node:http';
import {Readable} from 'node:stream';
import {createServer as createViteServer} from 'vite';
import {handleChat} from '../server/gemini.mjs';
import {handleFeedback} from '../server/feedback.mjs';
const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'});
const server=http.createServer(async(req,res)=>{
 if(['/api/chat','/.netlify/functions/feedback'].includes(req.url?.split('?')[0])){
  try{const request=new Request('http://localhost'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
  const handler=req.url.startsWith('/api/chat')?handleChat:handleFeedback;
  const result=await handler(request,process.env);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));}
  catch{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Máy chủ cục bộ không xử lý được yêu cầu.'}));}
 }else vite.middlewares(req,res);
});
server.listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log('AI Tutor: http://localhost:'+(process.env.PORT||3000)));
async function stop(){await vite.close();server.close(()=>process.exit(0));}process.on('SIGINT',stop);process.on('SIGTERM',stop);
