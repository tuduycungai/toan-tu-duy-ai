import { handleChat } from '../../server/gemini.mjs';
export default async function handler(request){return handleChat(request,process.env);}
