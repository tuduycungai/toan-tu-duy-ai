import { handleLanguage } from '../../server/language.mjs';
export default (request) => handleLanguage(request, process.env);
export const config = {
  path: '/api/language',
  rateLimit: { windowLimit: 24, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
