import { handleLearning } from '../../server/learning/api.mjs';
export default (request) => handleLearning(request, process.env);
export const config = {
  path: '/api/learning',
  rateLimit: { windowLimit: 100, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
