import { handleTeacher } from '../../server/learning/api.mjs';
export default (request) => handleTeacher(request, process.env);
export const config = {
  path: '/api/teacher',
  rateLimit: { windowLimit: 40, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
