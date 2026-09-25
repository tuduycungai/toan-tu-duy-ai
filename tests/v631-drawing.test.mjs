import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTS } from './load-ts.mjs';
import { generateOpenAI, handleOpenAI, openAIConfig } from '../server/openai.mjs';
const { compileGeometry } = await loadTS('lib/geometry-model.ts');
const g = await loadTS('lib/geometry.ts');
export const problem =
  'Cho tam giác ABC có đường cao AI. Từ A kẻ tia Ax vuông góc với AC, từ B kẻ tia By song song với AC. Gọi M là giao điểm của tia Ax và tia By. Nối M với trung điểm P của AB, đường MP cắt AC tại Q và BQ cắt AI tại H. a) Tứ giác AMBQ là hình gì?';

function verify(text) {
  const m = compileGeometry(text);
  assert.equal(m.status, 'verified', m.missingData.join('; '));
  const d = m.drawing,
    p = d.points;
  assert.deepEqual(Object.keys(p).sort(), ['A', 'B', 'C', 'H', 'I', 'M', 'P', 'Q']);
  assert(g.onLine(p.I, ['B', 'C'], p));
  assert(g.perpendicular(p.A, p.I, p.B, p.C));
  assert(g.perpendicular(p.A, p.M, p.A, p.C));
  assert(g.parallel(p.B, p.M, p.A, p.C));
  assert(g.near(g.distance(p.A, p.P), g.distance(p.P, p.B)));
  assert(g.onLine(p.P, ['A', 'B'], p));
  assert(g.onLine(p.Q, ['M', 'P'], p));
  assert(g.onLine(p.Q, ['A', 'C'], p));
  assert(g.onLine(p.H, ['B', 'Q'], p));
  assert(g.onLine(p.H, ['A', 'I'], p));
  // The entire MP line reaches Q, even though Q lies beyond the midpoint P.
  assert(d.segments.some((s) => s.includes('M') && s.includes('Q')));
  assert.equal(d.guides.filter((l) => l.ray).length, 2);
  assert.equal(m.goal, 'Tứ giác AMBQ là hình gì?');
  assert.match(g.toTikZ(d), /dashed,->/);
}
test('screenshot problem constructs all eight points and checks every given without AI', () =>
  verify(problem));
test('Unicode NFD and line breaks preserve the construction', () =>
  verify(problem.normalize('NFD').replaceAll('. ', '.\n')));
test('equivalent midpoint wording preserves the construction', () =>
  verify(problem.replace('Nối M với trung điểm P của AB', 'Gọi P là trung điểm AB. Nối M với P')));
test('renamed geometry is parsed rather than a hardcoded screenshot', () => {
  const map = { A: 'D', B: 'E', C: 'F', I: 'K', M: 'N', P: 'R', Q: 'S', H: 'T' };
  const renamed = problem.replace(/(?<![\p{L}])([A-Z]+[xy]?)(?![\p{L}])/gu, (token) =>
    token.replace(/[ABCIMPQH]/g, (x) => map[x]),
  );
  assert.equal(compileGeometry(renamed).status, 'verified');
});
test('missing or contradictory hypotheses are not shown as verified', () => {
  for (const text of [
    problem.replace('có đường cao AI', ''),
    problem.replace('Nối M với trung điểm P của AB,', ''),
    problem.replace('tia By song song với AC', 'tia By vuông góc với AC'),
    problem.replace('a)', 'Biết AP = PB và AP = 2PB. a)'),
    problem.replace('a)', 'Góc BAC bằng 38 độ. a)'),
    problem.replace('Từ A kẻ tia Ax', 'Từ C kẻ tia Ax'),
  ])
    assert.equal(compileGeometry(text).status, 'provisional', text);
});
test('a false conclusion does not alter the coordinates or become a given', () => {
  const other = compileGeometry(
    problem.replace('Tứ giác AMBQ là hình gì?', 'Chứng minh AMBQ là hình vuông.'),
  );
  assert.equal(other.status, 'verified');
  assert.deepEqual(other.drawing.points, compileGeometry(problem).drawing.points);
  assert(!other.givens.some((s) => s.includes('vuông AMBQ')));
});

const env = { OPENAI_API_KEY: 'test-not-a-real-secret', ACCESS_CODE: 'TEST-CLASS-CODE' };
const completed = (text) =>
  Response.json({
    status: 'completed',
    output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] }],
  });
test('drawing uses its own low effort while tutor remains medium', async () => {
  const config = openAIConfig(env);
  assert.equal(config.effort, 'medium');
  assert.equal(config.timeoutMs, 50000);
  const request = new Request('https://example.test/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      accessCode: env.ACCESS_CODE,
      mode: 'diagram',
      messages: [{ role: 'user', content: problem }],
    }),
  });
  const r = await handleOpenAI(request, env, async (_url, o) => {
    const b = JSON.parse(o.body);
    assert.equal(b.model, 'gpt-6-luna');
    assert.equal(b.reasoning.effort, 'low');
    assert.equal(b.store, false);
    return completed(JSON.stringify({ latex: '', question: 'Em bổ sung dữ kiện nhé?' }));
  });
  assert.equal(r.status, 200);
});
test('an expired shared deadline prevents another billable request', async () => {
  await assert.rejects(
    generateOpenAI({ ...openAIConfig(env), deadlineAt: Date.now() - 1 }, '', [], null, 6000, () =>
      assert.fail('must not call provider'),
    ),
    (e) => e.status === 504 && e.code === 'OPENAI_TIMEOUT',
  );
});
test('network failures are distinct from timeouts and do not leak provider messages', async () => {
  await assert.rejects(
    generateOpenAI(openAIConfig(env), '', [], null, 6000, async () => {
      throw Error(env.OPENAI_API_KEY);
    }),
    (e) =>
      e.status === 502 && e.code === 'OPENAI_NETWORK' && !e.message.includes(env.OPENAI_API_KEY),
  );
  await assert.rejects(
    generateOpenAI(openAIConfig(env), '', [], null, 6000, async () => {
      throw new DOMException('upstream', 'TimeoutError');
    }),
    (e) => e.status === 504 && e.code === 'OPENAI_TIMEOUT',
  );
});
test('response-body reading is included in the timeout', async () => {
  const hold = setTimeout(() => {}, 2000);
  try {
    await assert.rejects(
      generateOpenAI(
        { ...openAIConfig(env), timeoutMs: 1100, deadlineAt: Date.now() + 1100 },
        '',
        [],
        null,
        6000,
        async (_url, o) => ({
          ok: true,
          json: () =>
            new Promise((resolve, reject) => {
              o.signal.addEventListener('abort', () => reject(o.signal.reason), { once: true });
            }),
        }),
      ),
      (e) => e.code === 'OPENAI_TIMEOUT',
    );
  } finally {
    clearTimeout(hold);
  }
});
test('invalid deployment settings are rejected without calling OpenAI', () => {
  for (const settings of [
    { OPENAI_TIMEOUT_MS: '60000' },
    { OPENAI_TIMEOUT_MS: 'NaN' },
    { OPENAI_DIAGRAM_REASONING_EFFORT: 'minimal' },
    { OPENAI_MODEL: 'gpt-6-astra', OPENAI_REASONING_EFFORT: 'none' },
  ])
    assert.throws(() => openAIConfig({ ...env, ...settings }));
});
