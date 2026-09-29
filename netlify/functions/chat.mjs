import { handleChat } from '../../server/chat.mjs';
export default async function handler(request) {
  return handleChat(request, process.env);
}

export const config = {
  path: '/api/chat',
  rateLimit: { windowLimit: 120, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
