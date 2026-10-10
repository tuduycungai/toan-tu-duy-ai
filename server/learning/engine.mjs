import {
  RULE_VERSION,
  LEGACY_RULE_VERSION,
  validLearningContext,
  CONSENT_VERSION,
  RETENTION_DAYS,
  TABLES,
  SKILLS,
  ERRORS,
  cleanText,
  updateProgress,
  profileSummary,
  validateExample,
  metrics,
} from './domain.mjs';
const fail = (message, status = 400) => {
  throw Object.assign(Error(message), { status });
};
const idOk = (s) => typeof s === 'string' && /^[a-zA-Z0-9_-]{12,100}$/.test(s);
// The adapter executes runOperation and commit while holding one distributed ScriptLock.
export function runOperation(db, op, a, now = Date.now()) {
  const at = new Date(now).toISOString();
  if (op !== 'purge') {
    const raw = db;
    const fresh = (table, row) =>
      !row ||
      !['Profiles', 'Sessions', 'Turns', 'Surveys', 'ReviewQueue'].includes(table) ||
      now - Date.parse(row.updatedAt) <= RETENTION_DAYS * 86400000;
    db = {
      get: (table, id) => {
        const row = raw.get(table, id);
        return fresh(table, row) ? row : null;
      },
      list: (table, filter) => raw.list(table, filter).filter((row) => fresh(table, row)),
      put: raw.put.bind(raw),
      remove: raw.remove.bind(raw),
      removeStudent: raw.removeStudent.bind(raw),
    };
  }
  const put = (table, row) => db.put(table, { ...row, updatedAt: row.updatedAt || at });
  const current = () =>
    db.get('Settings', 'active') || { id: 'active', versionId: 'base', revision: 0 };
  const auth = () => {
    const s = db.get('Students', a.studentId);
    if (
      !s ||
      s.recoveryHash !== a.recoveryHash ||
      now - Date.parse(s.updatedAt) > RETENTION_DAYS * 86400000
    )
      fail('Mã học sinh hoặc mã khôi phục đã hết hiệu lực.', 401);
    return s;
  };
  const activeStudent = () => {
    const s = auth();
    if (!s.consent || s.consentVersion !== CONSENT_VERSION)
      fail('Chưa có đồng ý lưu dữ liệu đang hiệu lực.', 403);
    return s;
  };
  const rate = (s, max = 30) => {
    const bucket = Math.floor(now / 60000);
    const count = s.bucket === bucket ? (s.count || 0) + 1 : 1;
    if (count > max) fail('Em đợi một phút rồi thử lại.', 429);
    put('Students', { ...s, bucket, count, updatedAt: at });
  };
  if (op === 'enroll') {
    if (
      !idOk(a.studentId) ||
      !/^[a-f0-9]{64}$/.test(a.recoveryHash) ||
      a.consent !== true ||
      a.consentVersion !== CONSENT_VERSION ||
      a.guardianConfirmed !== true
    )
      fail('Cần xác nhận đồng ý phù hợp trước khi lưu.');
    const old = db.get('Students', a.studentId);
    if (old && old.recoveryHash !== a.recoveryHash) fail('Mã học sinh bị trùng.', 409);
    if (!old)
      put('Students', {
        id: a.studentId,
        studentId: a.studentId,
        recoveryHash: a.recoveryHash,
        consent: true,
        consentVersion: CONSENT_VERSION,
        guardianConfirmed: true,
        consentedAt: at,
        revokedAt: null,
        revision: 1,
        createdAt: at,
      });
    return {
      studentId: a.studentId,
      consent: old ? old.consent : true,
      retentionDays: RETENTION_DAYS,
    };
  }
  if (
    [
      'status',
      'restore',
      'consent',
      'context',
      'ingest',
      'survey',
      'report',
      'export',
      'delete',
    ].includes(op)
  ) {
    const s = auth();
    if (op === 'delete') {
      for (const t of ['Students', 'Sessions', 'Turns', 'Profiles', 'Surveys', 'ReviewQueue'])
        db.removeStudent(t, s.id);
      return { deleted: true };
    }
    if (op === 'export') {
      const tables = ['Students', 'Sessions', 'Turns', 'Profiles', 'Surveys', 'ReviewQueue'];
      const safe = (rows) => rows.map(({ recoveryHash: _secret, ...r }) => r);
      if (a.table) {
        if (!tables.includes(a.table) || !Number.isInteger(a.offset) || a.offset < 0)
          fail('Trang xuất dữ liệu không hợp lệ.');
        const rows = db.list(a.table, { studentId: s.id });
        return {
          rows: safe(rows.slice(a.offset, a.offset + 200)),
          nextOffset: rows.length > a.offset + 200 ? a.offset + 200 : null,
        };
      }
      const result = { next: {} };
      for (const t of tables) {
        const rows = db.list(t, { studentId: s.id });
        result[t] = safe(rows.slice(0, 200));
        if (rows.length > 200) result.next[t] = 200;
      }
      return result;
    }
    if (op === 'consent') {
      if (a.consent !== true && a.consent !== false) fail('Thiếu lựa chọn đồng ý.');
      if (a.consent && a.guardianConfirmed !== true) fail('Cần xác nhận lại quyền đồng ý.');
      put('Students', {
        ...s,
        consent: a.consent,
        consentVersion: CONSENT_VERSION,
        revision: s.revision + 1,
        consentedAt: a.consent ? at : s.consentedAt,
        revokedAt: a.consent ? null : at,
        updatedAt: at,
      });
      return { consent: a.consent, studentId: s.id };
    }
    if (op === 'status' || op === 'restore') {
      rate(s);
      return {
        studentId: s.id,
        consent: s.consent,
        consentVersion: s.consentVersion,
        profile: profileSummary(db.get('Profiles', s.id)),
        retentionDays: RETENTION_DAYS,
      };
    }
    activeStudent();
    rate(s);
    if (op === 'context') {
      const active = current();
      return {
        revision: s.revision,
        profile: db.get('Profiles', s.id),
        version: db.get('Versions', active.versionId) || { id: 'base', examples: [] },
      };
    }
    if (op === 'ingest') {
      const e = a.event;
      if (
        !e ||
        e.studentId !== s.id ||
        e.consentRevision !== s.revision ||
        !idOk(e.id) ||
        !idOk(e.sessionId) ||
        !SKILLS.includes(e.skill) ||
        !Number.isInteger(e.stage) ||
        e.stage < 1 ||
        e.stage > 8 ||
        !Number.isInteger(e.hintLevel) ||
        e.hintLevel < 0 ||
        e.hintLevel > 4 ||
        !['correct', 'incorrect', 'uncertain'].includes(e.verdict) ||
        !['', ...ERRORS].includes(e.errorKind) ||
        ![RULE_VERSION, LEGACY_RULE_VERSION].includes(e.ruleVersion) ||
        (e.ruleVersion === RULE_VERSION && !validLearningContext(e)) ||
        JSON.stringify(e).length > 10000 ||
        now - Date.parse(e.updatedAt) > 86400000 ||
        Date.parse(e.updatedAt) > now + 60000 ||
        !Number.isFinite(Date.parse(e.updatedAt))
      )
        fail('Lượt học không hợp lệ, hết hạn hoặc đã ngừng ghi.', 409);
      const old = db.get('Turns', e.id);
      if (old) {
        if (JSON.stringify(old) !== JSON.stringify(e))
          fail('Mã lượt học đã được dùng với nội dung khác.', 409);
        return { saved: true, duplicate: true };
      }
      const session = db.get('Sessions', e.sessionId);
      if (session && session.studentId !== s.id) fail('Phiên học không hợp lệ.', 403);
      if (
        session?.chapterId &&
        session.chapterId !== 'unclassified' &&
        (session.chapterId !== e.chapterId || session.lessonId !== e.lessonId)
      )
        fail('Phiên thuộc chương hoặc bài khác.', 409);
      if ((session?.turns || 0) >= 150)
        fail('Phiên đã đủ 150 lượt lưu. Em có thể tiếp tục học không ghi hoặc mở buổi mới.', 429);
      const day = at.slice(0, 10);
      const daily = s.day === day ? s.daily || 0 : 0;
      if (daily >= 300) fail('Đã đủ 300 lượt lưu trong ngày.', 429);
      const { profile, candidate, corroborated } = updateProgress(db.get('Profiles', s.id), e);
      put('Turns', e);
      put('Profiles', { ...profile, id: s.id });
      put('Students', {
        ...s,
        bucket: Math.floor(now / 60000),
        count: s.bucket === Math.floor(now / 60000) ? (s.count || 0) + 1 : 1,
        day,
        daily: daily + 1,
        updatedAt: at,
      });
      put('Sessions', {
        id: e.sessionId,
        studentId: s.id,
        turns: (session?.turns || 0) + 1,
        chapterId: e.chapterId || session?.chapterId || 'unclassified',
        lessonId: e.lessonId || session?.lessonId || 'unclassified',
        createdAt: session?.createdAt || at,
        updatedAt: at,
      });
      if (candidate && !e.redacted)
        put('ReviewQueue', {
          id: e.id,
          studentId: s.id,
          kind: candidate,
          status: 'pending',
          skill: e.skill,
          chapterId: e.chapterId || 'unclassified',
          lessonId: e.lessonId || 'unclassified',
          errorKind: e.errorKind,
          question: e.question,
          answer: e.answer,
          nextQuestion: e.nextQuestion,
        });
      return { saved: true, corroborated, profile: profileSummary(profile) };
    }
    if (op === 'survey') {
      if (
        !idOk(a.id) ||
        a.consent !== true ||
        !Number.isInteger(a.rating) ||
        a.rating < 1 ||
        a.rating > 5 ||
        typeof a.comment !== 'string' ||
        a.comment.length > 1800
      )
        fail('Đánh giá chưa hợp lệ.');
      const row = {
        id: s.id + '_' + a.id,
        studentId: s.id,
        sessionId: idOk(a.sessionId) ? a.sessionId : '',
        rating: a.rating,
        comment: cleanText(a.comment, 1800),
        consentVersion: CONSENT_VERSION,
        type: 'feedback',
      };
      const old = db.get('Surveys', row.id);
      if (old) {
        if (old.rating !== row.rating || old.comment !== row.comment)
          fail('Mã đánh giá đã dùng.', 409);
        return { saved: true, duplicate: true };
      }
      put('Surveys', row);
      return { saved: true };
    }
    if (op === 'report') {
      const e = db.get('Turns', a.eventId);
      if (!e || e.studentId !== s.id) fail('Không tìm thấy lượt học của em.', 404);
      const old = db.get('ReviewQueue', e.id);
      if (!old)
        put('ReviewQueue', {
          id: e.id,
          studentId: s.id,
          kind: 'guidance_concern',
          status: 'pending',
          skill: e.skill,
          chapterId: e.chapterId || 'unclassified',
          lessonId: e.lessonId || 'unclassified',
          errorKind: e.errorKind,
          question: e.question,
          answer: e.answer,
          nextQuestion: e.nextQuestion,
        });
      return { saved: true };
    }
  }
  if (op.startsWith('teacher:')) {
    if (a.teacher !== true) fail('Cần quyền giáo viên.', 403);
    if (op === 'teacher:list') {
      const active = current(),
        profiles = db.list('Profiles');
      const pending = db
        .list('ReviewQueue')
        .filter((i) => i.status === 'pending')
        .sort((x, y) => y.updatedAt.localeCompare(x.updatedAt));
      const offset = Number.isInteger(a.offset) && a.offset >= 0 ? Math.min(a.offset, 20000) : 0;
      return {
        active,
        offset,
        queueCount: pending.length,
        queue: pending.slice(offset, offset + 100),
        versions: db
          .list('Versions')
          .map((v) => ({ id: v.id, updatedAt: v.updatedAt, count: v.examples.length })),
        metrics: metrics(profiles),
        profiles: profiles.map((p) => ({ studentId: p.studentId, ...profileSummary(p) })),
      };
    }
    if (op === 'teacher:version')
      return db.get('Versions', a.versionId) || { id: 'base', examples: [] };
    if (op === 'teacher:review') {
      const item = db.get('ReviewQueue', a.id);
      if (!item) fail('Không tìm thấy trường hợp.', 404);
      if (!['approve', 'reject', 'draft'].includes(a.decision)) fail('Quyết định không hợp lệ.');
      if (a.decision === 'draft') {
        put('ReviewQueue', { ...item, draft: validateExample(a.example), updatedAt: at });
        return { saved: true };
      }
      if (item.status !== 'pending') return { saved: true, alreadyReviewed: true };
      const active = current();
      if (a.expectedRevision !== active.revision)
        fail('Kho đã thay đổi. Hãy tải lại trước khi duyệt.', 409);
      if (a.decision === 'approve') {
        if (a.verified !== true)
          fail('Giáo viên cần xác nhận đã kiểm tra toán học và bỏ thông tin cá nhân.');
        const example = validateExample(a.example);
        const oldVersion = db.get('Versions', active.versionId);
        const examples = [...(oldVersion?.examples || []), example];
        if (examples.length > 40)
          fail('Kho tối đa 40 mẫu. Xuất bản kho đã tinh gọn trước khi thêm.', 409);
        const id = 'v' + (active.revision + 1) + '_' + a.id.slice(-12);
        put('Versions', { id, examples, ruleVersion: RULE_VERSION });
        put('Settings', {
          id: 'active',
          revision: active.revision + 1,
          versionId: id,
          updatedAt: at,
        });
      }
      put('ReviewQueue', {
        ...item,
        status: a.decision === 'approve' ? 'approved' : 'rejected',
        draft: null,
        updatedAt: at,
      });
      put('Audit', { id: 'review_' + a.id, action: a.decision, versionBefore: active.versionId });
      return { saved: true };
    }
    if (op === 'teacher:rollback' || op === 'teacher:publish') {
      const active = current();
      if (a.expectedRevision !== active.revision) fail('Kho đã thay đổi. Hãy tải lại.', 409);
      let id = a.versionId;
      if (op === 'teacher:publish') {
        if (a.verified !== true || !Array.isArray(a.examples) || a.examples.length > 40)
          fail('Cần kiểm tra kho trước khi xuất bản.');
        id = 'v' + (active.revision + 1) + '_' + now;
        put('Versions', {
          id,
          examples: a.examples.map(validateExample),
          ruleVersion: RULE_VERSION,
        });
      } else if (id !== 'base' && !db.get('Versions', id)) fail('Không tìm thấy phiên bản.', 404);
      put('Settings', {
        id: 'active',
        versionId: id,
        revision: active.revision + 1,
        updatedAt: at,
      });
      put('Audit', {
        id: 'version_' + (active.revision + 1),
        action: op,
        versionBefore: active.versionId,
        versionAfter: id,
      });
      return { saved: true, versionId: id };
    }
  }
  if (op === 'purge' && a.teacher === true) {
    let removed = 0;
    for (const table of TABLES.filter((t) => !['Settings', 'Versions'].includes(t))) {
      for (const r of db.list(table))
        if (now - Date.parse(r.updatedAt) > RETENTION_DAYS * 86400000) {
          db.remove(table, r.id);
          removed++;
        }
    }
    return { removed };
  }
  fail('Thao tác không được hỗ trợ.', 400);
}
