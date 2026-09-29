import { createHmac, randomUUID } from 'node:crypto';
import { runOperation } from '../server/learning/engine.mjs';
import { TABLES, CONSENT_VERSION, RULE_VERSION } from '../server/learning/domain.mjs';
import { digest } from '../server/learning/security.mjs';
export const env = {
  ACCESS_CODE: 'HOCGIOITOAN',
  LEARNING_GATEWAY_URL: 'https://script.google.com/macros/s/test_gateway/exec',
  LEARNING_GATEWAY_SECRET: 'test-only-gateway-'.repeat(4),
  LEARNING_SIGNING_KEY: 'test-only-signing-'.repeat(4),
  TEACHER_ADMIN_KEY: 'test-only-teacher-'.repeat(4),
  GEMINI_API_KEY: 'test-only-gemini',
  STATE_SIGNING_KEY: 'test-only-state'.repeat(4),
};
export const token = 's_00000000-0000-4000-8000-000000000001.' + 'a'.repeat(43);
export const auth = { studentId: token.split('.')[0], recoveryHash: digest(token.split('.')[1]) };
export function database() {
  let state = Object.fromEntries(TABLES.map((t) => [t, {}]));
  let commits = 0;
  return {
    get state() {
      return state;
    },
    get commits() {
      return commits;
    },
    transaction() {
      const copy = structuredClone(state);
      return {
        get: (t, id) => copy[t][id] || null,
        list: (t, f = {}) =>
          Object.values(copy[t]).filter((r) => !f.studentId || r.studentId === f.studentId),
        put: (t, r) => {
          copy[t][r.id] = structuredClone(r);
        },
        remove: (t, id) => {
          delete copy[t][id];
        },
        removeStudent: (t, id) => {
          for (const r of Object.values(copy[t])) if (r.studentId === id) delete copy[t][r.id];
        },
        commit: () => {
          state = copy;
          commits++;
        },
      };
    },
    run(op, args, now) {
      const tx = this.transaction();
      const data = runOperation(tx, op, args, now);
      tx.commit();
      return data;
    },
  };
}
export function enrolled() {
  const db = database();
  db.run('enroll', {
    ...auth,
    consent: true,
    guardianConfirmed: true,
    consentVersion: CONSENT_VERSION,
  });
  return db;
}
export function event(patch = {}) {
  return {
    id: 't_' + randomUUID(),
    studentId: auth.studentId,
    sessionId: 'session_' + '1'.repeat(20),
    updatedAt: new Date().toISOString(),
    problemId: 'problem_midpoint',
    stage: 4,
    nextStage: 5,
    skill: 'midpoint',
    question: 'Cần điều kiện nào?',
    answer: 'Vì M thuộc AB và AM = MB nên M là trung điểm AB.',
    verdict: 'correct',
    classification: 'correct_complete',
    errorKind: '',
    hintLevel: 1,
    nextHintLevel: 0,
    nextAction: 'ask_next_step',
    nextQuestion: 'Em giải thích điều kiện vị trí thế nào?',
    evidence: true,
    answerHash: 'hash1',
    ruleVersion: RULE_VERSION,
    exampleVersion: 'base',
    consentRevision: 1,
    redacted: false,
    ...patch,
  };
}
export function mockGateway(db, settings = {}) {
  const calls = [];
  const fetcher = async (url, options) => {
    if (url !== env.LEARNING_GATEWAY_URL) throw Error('Unexpected network URL: ' + url);
    const e = JSON.parse(options.body),
      c = JSON.parse(e.payload);
    calls.push(c);
    const signature = createHmac('sha256', env.LEARNING_GATEWAY_SECRET)
      .update(e.timestamp + '.' + e.nonce + '.' + e.payload)
      .digest('hex');
    if (e.signature !== signature) throw Error('bad gateway signature');
    if (settings.failOp === c.op) throw Error('simulated network loss');
    try {
      const data = db.run(c.op, c.args);
      if (settings.loseAcknowledgement === c.op) {
        settings.loseAcknowledgement = '';
        throw Error('ack lost');
      }
      return Response.json({ ok: true, data, nonce: e.nonce });
    } catch (error) {
      return Response.json({ ok: false, status: error.status || 503, error: error.message });
    }
  };
  return { fetcher, calls };
}
export function req(body, cookie = '', path = '/api/learning') {
  return new Request('https://test.local' + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
      'x-nf-client-connection-ip': randomUUID(),
    },
    body: JSON.stringify(body),
  });
}
