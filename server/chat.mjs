import {handleChat as handleGemini} from './gemini.mjs';
import {handleOpenAI} from './openai.mjs';

export async function handleChat(request,env,fetcher=fetch){
  const provider=env.AI_PROVIDER?.trim().toLowerCase()||(env.OPENAI_API_KEY?.trim()?'openai':env.GEMINI_API_KEY?.trim()?'gemini':'openai');
  if(provider==='openai')return handleOpenAI(request,env,fetcher);
  if(provider==='gemini')return handleGemini(request,env,fetcher);
  return Response.json({error:'AI_PROVIDER phải là openai hoặc gemini. Giáo viên kiểm tra cấu hình máy chủ.'},{status:503,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
