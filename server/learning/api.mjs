import { randomUUID } from 'node:crypto';
import { CONSENT_VERSION, RETENTION_DAYS } from './domain.mjs';
import {
  configured,
  random,
  learnerAuth,
  cookie,
  cookies,
  equal,
  sign,
  verify,
  readJson,
  reply,
  failure,
  localLimit,
} from './security.mjs';
import { gateway } from './gateway.mjs';
export async function handleLearning(request, env, fetcher = fetch) {
  try {
    const b = await readJson(request);
    localLimit(request, 'learning', 100);
    if (b.action === 'config')
      return reply({
        configured: configured(env),
        consentVersion: CONSENT_VERSION,
        retentionDays: RETENTION_DAYS,
      });
    if (!configured(env))
      throw failure('Chưa kết nối lưu trữ. Em vẫn học được như bình thường.', 503);
    if (b.action === 'enroll') {
      if (!equal(b.accessCode?.trim(), env.ACCESS_CODE?.trim() || 'HOCGIOITOAN'))
        throw failure('Mã lớp chưa đúng.', 401);
      if (b.consent !== true || b.guardianConfirmed !== true)
        throw failure('Cần xác nhận đồng ý lưu dữ liệu.');
      const recovery = 's_' + randomUUID() + '.' + random();
      const result = await gateway(
        env,
        'enroll',
        {
          ...learnerAuth(recovery),
          consent: true,
          guardianConfirmed: true,
          consentVersion: CONSENT_VERSION,
        },
        fetcher,
      );
      return reply({ ...result, recovery }, 200, {
        'Set-Cookie': cookie(request, 'tutor_learner', recovery),
      });
    }
    if (b.action === 'restore') {
      const auth = learnerAuth(b.recovery);
      const result = await gateway(env, 'restore', auth, fetcher);
      return reply(result, 200, { 'Set-Cookie': cookie(request, 'tutor_learner', b.recovery) });
    }
    if (b.action === 'logout')
      return reply({ ok: true }, 200, { 'Set-Cookie': cookie(request, 'tutor_learner', '', 0) });
    const auth = learnerAuth(cookies(request).tutor_learner);
    if (b.action === 'retry') {
      if (!Array.isArray(b.receipts) || !b.receipts.length || b.receipts.length > 5)
        throw failure('Chỉ gửi lại tối đa 5 lượt mỗi lần.');
      const results = [];
      for (const token of b.receipts) {
        let event;
        try {
          event = verify(token, env.LEARNING_SIGNING_KEY, 'turn');
          if (event.studentId !== auth.studentId) throw failure('Lượt học thuộc mã khác.', 403);
          const result = await gateway(env, 'ingest', { ...auth, event }, fetcher);
          results.push({ id: event.id, ...result });
        } catch (e) {
          results.push({ id: event?.id, saved: false, status: e.status || 503, error: e.message });
        }
      }
      return reply({ results });
    }
    if (!['status', 'consent', 'survey', 'export', 'delete', 'report'].includes(b.action))
      throw failure('Thao tác không hợp lệ.');
    const args = { ...auth };
    for (const k of [
      'consent',
      'guardianConfirmed',
      'id',
      'rating',
      'comment',
      'sessionId',
      'eventId',
      'table',
      'offset',
    ])
      if (b[k] !== undefined) args[k] = b[k];
    const result = await gateway(env, b.action, args, fetcher);
    return reply(
      result,
      200,
      b.action === 'delete' ? { 'Set-Cookie': cookie(request, 'tutor_learner', '', 0) } : {},
    );
  } catch (e) {
    return reply(
      { error: e.status ? e.message : 'Chưa xử lý được dữ liệu học tập.' },
      e.status || 503,
    );
  }
}
export async function handleTeacher(request, env, fetcher = fetch) {
  try {
    const b = await readJson(request, 50000);
    localLimit(
      request,
      b.action === 'login' ? 'teacher-login' : 'teacher',
      b.action === 'login' ? 5 : 40,
    );
    if (!env.TEACHER_ADMIN_KEY || env.TEACHER_ADMIN_KEY.length < 32 || !configured(env))
      throw failure('Giáo viên chưa cấu hình quyền quản trị và lưu trữ.', 503);
    if (b.action === 'login') {
      if (!equal(b.key, env.TEACHER_ADMIN_KEY)) throw failure('Khóa giáo viên không đúng.', 401);
      const token = sign({ teacher: true }, env.TEACHER_ADMIN_KEY, 'teacher', 8 * 3600000);
      return reply({ ok: true }, 200, {
        'Set-Cookie': cookie(request, 'tutor_teacher', token, 8 * 3600),
      });
    }
    if (b.action === 'logout')
      return reply({ ok: true }, 200, { 'Set-Cookie': cookie(request, 'tutor_teacher', '', 0) });
    verify(cookies(request).tutor_teacher, env.TEACHER_ADMIN_KEY, 'teacher');
    if (!['list', 'version', 'review', 'rollback', 'publish', 'purge'].includes(b.action))
      throw failure('Thao tác không hợp lệ.');
    const result = await gateway(
      env,
      b.action === 'purge' ? 'purge' : 'teacher:' + b.action,
      { ...b, teacher: true },
      fetcher,
    );
    return reply(result);
  } catch (e) {
    return reply(
      { error: e.status ? e.message : 'Chưa xử lý được yêu cầu quản trị.' },
      e.status || 503,
    );
  }
}
