import { handleChat } from '../../server/chat.mjs';
export default async function handler(request) {
  return handleChat(request, process.env);
}
