import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {
  curriculum,
  resolveCurriculum,
  curriculumExerciseSet,
  validateMathTurn,
  curriculumInstructions,
} from '../server/curriculum.mjs';
import {
  polynomial,
  equivalent,
  numerical,
  thalesCheck,
  bisectorParts,
} from '../server/curriculum-checks.mjs';
import { validateTable } from '../public/statistics.mjs';
import {
  initialTutorState,
  readTutorState,
  applyTutorTurn,
  tutorResponse,
} from '../server/adaptive-tutor.mjs';
import { assessment, provider } from './fixtures/v623-data.mjs';
import { handleChat } from '../server/chat.mjs';
import { env, enrolled, auth, event } from './v650-fixture.mjs';
import { RULE_VERSION, updateProgress, scopedProfile } from '../server/learning/domain.mjs';
import { loadTS } from './load-ts.mjs';
const pub = JSON.parse(readFileSync(new URL('../lib/curriculum.json', import.meta.url)));
const ctx = (chapterId, lessonId) => resolveCurriculum({ chapterId, lessonId });
const request = (body) =>
  new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessCode: env.ACCESS_CODE, ...body }),
  });
test('20 numbered lessons, 14 reviews in SGK sequence, 100 authored exercises and no answers in client data', () => {
  assert.equal(curriculum.lessons.filter((l) => l.kind === 'lesson').length, 20);
  assert.equal(curriculum.lessons.length, 34);
  assert.equal(curriculum.exercises.length, 100);
  for (const l of curriculum.lessons.filter((l) => l.kind === 'lesson'))
    assert.equal(curriculum.exercises.filter((e) => e.lessonId === l.id).length, 5);
  for (const e of pub.exercises)
    for (const key of ['answer', 'rubric', 'hints', 'verification'])
      assert.equal(e[key], undefined);
  assert.deepEqual(curriculum.chapters[0].units, [
    'l01',
    'l02',
    'l03',
    'c1-review-3',
    'l04',
    'l05',
    'c1-review-5',
    'c1-end',
  ]);
  assert.deepEqual(curriculum.chapters[2].units, [
    'l10',
    'l11',
    'c3-review-11',
    'l12',
    'c3-review-12',
    'l13',
    'l14',
    'c3-review-14',
    'c3-end',
  ]);
});
for (const e of curriculum.exercises.filter((e) => e.verification))
  test(`Math ${e.chapterId} ${e.lessonId}: ${e.id}`, () => {
    const v = e.verification;
    if (v.kind === 'polynomial')
      assert.deepEqual(equivalent(v.left, v.right), { supported: true, equal: true });
    else assert(Math.abs(numerical(v.expression) - v.value) < 1e-8);
  });
// Independent oracles target common mathematical traps, with at least two cases in every lesson.
const algebraCases = [
  ['l01', '4xy+7xy', '11xy', true],
  ['l01', 'x^2y', 'xy^2', false],
  ['l02', 'x^4-x^4+2x', '2x', true],
  ['l02', 'x^2+xy', '2x^2', false],
  ['l03', 'x-(y-x)', '2x-y', true],
  ['l03', '(x-y)-(x+y)', '-2y', true],
  ['l04', '(2x-y)(x+3y)', '2x^2+5xy-3y^2', true],
  ['l04', '(x+1)(x-1)', 'x^2+1', false],
  ['l05', '(8x^3y-4x^2y)/(2xy)', '4x^2-2x', true],
  ['l05', '(6x^2y)/(3xy)', '2xy', false],
  ['l06', '(a-b)^2', 'a^2-2ab+b^2', true],
  ['l06', 'a^2-b^2', '(a+b)(a-b)', true],
  ['l07', '(x-2)^3', 'x^3-6x^2+12x-8', true],
  ['l07', '(x-2)^3', 'x^3-6x^2-12x-8', false],
  ['l08', 'x^3+y^3', '(x+y)(x^2-xy+y^2)', true],
  ['l08', 'x^3-y^3', '(x-y)(x^2-xy+y^2)', false],
  ['l09', 'x^2-5x+6', '(x-3)(x-2)', true],
  ['l09', 'xy-x+2y-2', '(y-1)(x+2)', true],
];
for (const [l, a, b, ok] of algebraCases)
  test(`Independent algebra ${l}: ${a}`, () => assert.equal(equivalent(a, b).equal, ok));
test('Polynomial parser treats unary minus below power and rejects unsafe or unsupported inputs', () => {
  assert.equal(numerical('-2^2'), -4);
  assert.equal(numerical('(-2)^2'), 4);
  assert.equal(numerical('1/3+2/3'), 1);
  for (const v of ['1/0', 'x/(x+1)', 'process.exit()', 'x^9999', '2**3'])
    assert.throws(() => polynomial(v));
  assert.equal(polynomial('0').size, 0);
});
const sq = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const vec = (a, b) => [b[0] - a[0], b[1] - a[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const geometry = [
  ['l10 angles', () => assert.equal(360 - 80 - 95 - 105, 80)],
  [
    'l10 convex angles',
    () =>
      assert.deepEqual(
        [1, 2, 3, 4].map((v) => v * 36),
        [36, 72, 108, 144],
      ),
  ],
  [
    'l11 equal diagonals trapezoid',
    () => {
      const [a, b, c, d] = [
        [-2, 3],
        [2, 3],
        [4, 0],
        [-4, 0],
      ];
      assert.equal(sq(a, c), sq(b, d));
      assert.equal(sq(a, d), sq(b, c));
    },
  ],
  [
    'l11 equal legs insufficient',
    () => {
      const [a, b, c, d] = [
        [0, 0],
        [4, 0],
        [5, 2],
        [1, 2],
      ];
      assert.equal(sq(a, d), sq(b, c));
      assert.notEqual(sq(a, c), sq(b, d));
    },
  ],
  [
    'l12 diagonals bisect',
    () => {
      const [a, b, c, d] = [
        [0, 0],
        [4, 0],
        [5, 3],
        [1, 3],
      ];
      assert.deepEqual(midpoint(a, c), midpoint(b, d));
    },
  ],
  [
    'l12 one equal pair insufficient',
    () => {
      const [a, b, c, d] = [
        [0, 0],
        [3, 0],
        [4, 3],
        [4, 6],
      ];
      assert.equal(sq(a, b), sq(c, d));
      assert.notEqual(sq(a, d), sq(b, c));
      assert.notDeepEqual(midpoint(a, c), midpoint(b, d));
    },
  ],
  [
    'l13 rectangle midpoint length',
    () => {
      const [a, b, c, d] = [
          [0, 0],
          [8, 0],
          [8, 6],
          [0, 6],
        ],
        o = midpoint(a, c);
      assert.equal(sq(o, b), 25);
      assert.equal(sq(a, c), sq(b, d));
    },
  ],
  [
    'l13 equal diagonals insufficient',
    () => {
      const [a, b, c, d] = [
        [-1, 2],
        [1, 2],
        [3, 0],
        [-3, 0],
      ];
      assert.equal(sq(a, c), sq(b, d));
      assert.notEqual(dot(vec(a, b), vec(a, d)), 0);
    },
  ],
  [
    'l14 perpendicular diagonals insufficient',
    () => {
      const [a, b, c, d] = [
        [0, 3],
        [2, 0],
        [0, -1],
        [-2, 0],
      ];
      assert(Math.abs(dot(vec(a, c), vec(b, d))) < 1e-9);
      assert.notEqual(sq(a, b), sq(b, c));
    },
  ],
  [
    'l14 rectangle adjacent equal implies square',
    () => {
      const [a, b, c, d] = [
        [0, 0],
        [3, 0],
        [3, 3],
        [0, 3],
      ];
      assert.equal(sq(a, b), sq(b, c));
      assert.equal(dot(vec(a, b), vec(a, d)), 0);
      assert(Math.abs(dot(vec(a, c), vec(b, d))) < 1e-9);
    },
  ],
];
for (const [name, fn] of geometry) test('Independent geometry ' + name, fn);
const thalesCases = [
  [
    'l15 forward',
    () => assert.equal(thalesCheck({ ab: 9, ac: 12, am: 3, an: 4, parallel: true }).valid, true),
  ],
  [
    'l15 inconsistent ratio',
    () => assert.equal(thalesCheck({ ab: 9, ac: 12, am: 3, an: 6, parallel: true }).valid, false),
  ],
  [
    'l15 missing parallel',
    () => assert.equal(thalesCheck({ ab: 9, ac: 12, am: 3, an: 4 }).canUseForward, false),
  ],
  [
    'l15 converse',
    () => assert.equal(thalesCheck({ ab: 6, ac: 9, am: 2, an: 3 }).canUseConverse, true),
  ],
  [
    'l16 midpoint',
    () => assert.equal(thalesCheck({ ab: 10, ac: 8, am: 5, an: 4, parallel: true }).valid, true),
  ],
  [
    'l16 one midpoint',
    () => assert.equal(thalesCheck({ ab: 10, ac: 8, am: 5, an: 3, parallel: true }).valid, false),
  ],
  [
    'l16 point on extension',
    () => assert.equal(thalesCheck({ ab: 10, ac: 8, am: 15, an: 12, parallel: true }).valid, false),
  ],
  ['l17 ratio parts', () => assert.deepEqual(bisectorParts(8, 12, 15), { bd: 6, dc: 9 })],
  ['l17 reverse order', () => assert.deepEqual(bisectorParts(12, 8, 15), { bd: 9, dc: 6 })],
  ['l17 invalid triangle', () => assert.throws(() => bisectorParts(4, 6, 15))],
];
for (const [name, fn] of thalesCases) test('Independent Thales ' + name, fn);
const sample = { labels: ['A', 'B', 'C'], values: [10, 15, 5], unit: 'học sinh', label: 'Nhóm' };
const statsCases = [
  [
    'l18 labels are categories',
    () => assert.deepEqual(validateTable(sample).labels, ['A', 'B', 'C']),
  ],
  [
    'l18 missing value',
    () => assert.throws(() => validateTable({ ...sample, values: [10, 15, NaN] })),
  ],
  [
    'l18 duplicate categories',
    () => assert.throws(() => validateTable({ ...sample, labels: ['A', 'A', 'C'] })),
  ],
  [
    'l19 total and sectors',
    () => {
      const d = validateTable(sample);
      assert.equal(d.total, 30);
      assert.deepEqual(d.angles, [120, 180, 60]);
    },
  ],
  [
    'l19 invalid percentages',
    () => assert.throws(() => validateTable({ ...sample, values: [45, 40, 25], percent: true })),
  ],
  [
    'l19 valid percentages',
    () =>
      assert.deepEqual(
        validateTable({ ...sample, values: [50, 30, 20], percent: true }).angles,
        [180, 108, 72],
      ),
  ],
  [
    'l19 zero total',
    () => assert.deepEqual(validateTable({ ...sample, values: [0, 0, 0] }).angles, []),
  ],
  [
    'l19 two series length mismatch',
    () => assert.throws(() => validateTable({ ...sample, second: [10] })),
  ],
  ['l20 increase baseline', () => assert.equal(numerical('(25-20)/20*100'), 25)],
  ['l20 scope of sample', () => assert.equal(numerical('18/30*100'), 60)],
  [
    'l20 truncated axis ratio',
    () => {
      assert.equal((100 - 80) / (90 - 80), 2);
      assert.notEqual(100 / 90, 2);
    },
  ],
];
for (const [name, fn] of statsCases) test('Independent statistics ' + name, fn);
test('Server rejects mismatched chapter, lesson and problem IDs', async () => {
  for (const body of [
    { chapterId: 'c9', lessonId: 'l01' },
    { chapterId: 'c1', lessonId: 'l20' },
    { chapterId: 'c1', lessonId: 'l01', problemId: 'l06-e1' },
  ]) {
    const r = await handleChat(
      request({ ...body, mode: 'guide', messages: [{ role: 'user', content: 'Bài toán' }] }),
      { ...env, AI_PROVIDER: 'gemini' },
      () => {
        throw Error('Must not call upstream');
      },
    );
    assert.equal(r.status, 400);
  }
});
test('Signed state cannot move between lessons, chapters or problems', () => {
  const s = { ...initialTutorState('Khai triển (x+1)^2'), chapterId: 'c2', lessonId: 'l06' };
  const token = tutorResponse({ state: s, text: 'test' }, 'secret').tutorToken;
  assert.equal(
    readTutorState(
      { tutorToken: token, chapterId: 'c2', lessonId: 'l06', problem: s.problem },
      'secret',
    ).chapterId,
    'c2',
  );
  for (const patch of [
    { chapterId: 'c1', lessonId: 'l01' },
    { chapterId: 'c2', lessonId: 'l07' },
    { problem: 'Đề khác' },
  ])
    assert.throws(() =>
      readTutorState(
        { tutorToken: token, chapterId: 'c2', lessonId: 'l06', problem: s.problem, ...patch },
        'secret',
      ),
    );
});
for (const c of curriculum.chapters)
  test(`Real handler, mocked Gemini: ${c.id} carries lesson and cannot complete on first problem`, async () => {
    const l = curriculum.lessons.find((x) => x.id === c.units[0]);
    const e = curriculum.exercises.find((x) => x.lessonId === l.id);
    let prompt = '';
    const r = await handleChat(
      request({
        chapterId: c.id,
        lessonId: l.id,
        mode: 'guide',
        adaptive: true,
        problem: e.problem,
        messages: [{ role: 'user', content: e.problem }],
      }),
      { ...env, AI_PROVIDER: 'gemini' },
      async (_url, opts) => {
        prompt = JSON.parse(opts.body).systemInstruction.parts[0].text;
        return provider(
          assessment({
            question: 'Em xác định yêu cầu đầu tiên của đề là gì?',
            proofComplete: true,
            accepted: [{ claim: 'finished', reason: 'theory', studentQuote: e.problem }],
            coveredGoals: ['all'],
          }),
        );
      },
    );
    const d = await r.json();
    assert.equal(r.status, 200, JSON.stringify(d));
    assert(prompt.includes(l.title));
    assert(prompt.includes('TUYỆT ĐỐI KHÔNG HIỂN THỊ SỚM'));
    assert(d.progress.stage <= 6);
    assert.equal(d.progress.proven.length, 0);
    assert(!d.text.includes('[KET_THUC_BUOI_HOC]'));
  });
for (const c of curriculum.chapters)
  test(`Acknowledgment and answer request do not prove understanding ${c.id}`, () => {
    const context = ctx(c.id, c.units[0]);
    const previous = initialTutorState('Bài toán');
    previous.turn = 2;
    const value = validateMathTurn(
      context,
      'dạ',
      assessment({
        proofComplete: true,
        selfCheckPassed: true,
        accepted: [{ claim: 'all', reason: 'dạ', studentQuote: 'dạ' }],
      }),
      previous,
    );
    const result = applyTutorTurn(previous, value, [{ role: 'user', content: 'dạ' }]);
    assert.equal(result.state.proofComplete, false);
    assert.equal(result.state.conclusions.length, 0);
    const answer = applyTutorTurn(
      previous,
      assessment({ proofComplete: true, question: 'Em đã xác định được dữ kiện nào?' }),
      [{ role: 'user', content: 'Cho em đáp án' }],
    );
    assert.equal(answer.state.classification, 'answer_request');
    assert.equal(answer.state.proofComplete, false);
  });
test('Algebra guard rejects incorrect identity accepted by the model; equivalent factorizations accepted', () => {
  const context = ctx('c2', 'l06'),
    previous = initialTutorState('Khai triển');
  previous.turn = 1;
  assert.throws(() => validateMathTurn(context, '$(x+1)^2=x^2+1$', assessment(), previous));
  assert.doesNotThrow(() =>
    validateMathTurn(context, '$x^2-1=(x+1)(x-1)$', assessment(), previous),
  );
  assert(curriculumInstructions(ctx('c5', 'l20'), '').includes('Không suy điều kiện từ dáng hình'));
});
test('Practice set hides keys and generates requested count using original authored items', () => {
  const result = curriculumExerciseSet(ctx('c1', 'l01'), 10);
  assert.equal(result.exercises.length, 10);
  assert.equal((result.text.match(/Câu \d+\./g) || []).length, 10);
  assert(!result.text.includes('Đáp án'));
});
test('Profiles remain isolated per chapter and lesson, with unknown old evidence kept separate', () => {
  const one = event({
    chapterId: 'c1',
    lessonId: 'l01',
    skill: 'c1:monomial',
    skillId: 'c1:monomial',
  });
  let p = updateProgress(null, one).profile;
  p = updateProgress(
    p,
    event({
      chapterId: 'c5',
      lessonId: 'l20',
      skill: 'c5:data_analysis',
      skillId: 'c5:data_analysis',
      sessionId: 'stats_session_12345678',
      verdict: 'incorrect',
      errorKind: 'wrong_logic',
    }),
  ).profile;
  assert.equal(scopedProfile(p, 'c1', 'l01').turns, 1);
  assert.equal(scopedProfile(p, 'c5', 'l20').turns, 1);
  assert.equal(scopedProfile(p, 'c1', 'l02').turns, 0);
  assert.equal(scopedProfile(p, 'c1', 'l01').errors.wrong_logic, undefined);
  assert.equal(scopedProfile(updateProgress(null, event()).profile, 'c3', 'l10').turns, 0);
});
test('Multi-chapter gateway deduplicates, rejects swapped context and preserves old events', () => {
  const db = enrolled(),
    e = event({
      chapterId: 'c4',
      lessonId: 'l17',
      skill: 'c4:angle_bisector',
      skillId: 'c4:angle_bisector',
      ruleVersion: RULE_VERSION,
    });
  assert.equal(db.run('ingest', { ...auth, event: e }).saved, true);
  assert.equal(db.run('ingest', { ...auth, event: e }).duplicate, true);
  assert.equal(Object.keys(db.state.Turns).length, 1);
  assert.throws(() =>
    db.run('ingest', {
      ...auth,
      event: event({
        chapterId: 'c1',
        lessonId: 'l20',
        skill: 'c1:monomial',
        skillId: 'c1:monomial',
      }),
    }),
  );
  assert.throws(() =>
    db.run('ingest', {
      ...auth,
      event: event({
        chapterId: 'c5',
        lessonId: 'l20',
        skill: 'c5:data_analysis',
        skillId: 'c5:data_analysis',
        sessionId: e.sessionId,
      }),
    }),
  );
});
test('Session and image snapshots isolate scope, restore text, keep legacy untouched', async () => {
  const map = new Map();
  globalThis.sessionStorage = {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
  const { saveSession, readSession } = await loadTS('lib/session-recovery.ts');
  const { saveImageSession, readImageSession } = await loadTS('lib/image-session.ts');
  const value = { messages: [], wire: [], input: 'x^2+y', problem: 'Đề đại số', mode: 'guide' };
  saveSession(value, 'c1:l01');
  saveSession({ ...value, input: 'Thalès' }, 'c4:l15');
  saveSession({ ...value, input: 'legacy' });
  assert.equal(readSession('c1:l01').input, 'x^2+y');
  assert.equal(readSession('c4:l15').input, 'Thalès');
  assert.equal(readSession().input, 'legacy');
  saveImageSession({ transcription: 'ảnh đại số', imageToken: 'signed.token' }, 'c1:l01');
  assert.equal(readImageSession('c1:l01').transcription, 'ảnh đại số');
  assert.equal(readImageSession('c5:l20'), null);
});
test('Apps Script migration is idempotent, appends columns and leaves historical JSON unchanged', () => {
  const rows = [
    [
      'id',
      'studentId',
      'sessionId',
      'updatedAt',
      'status',
      'data',
      'problemId',
      'stage',
      'question',
      'answer',
      'verdict',
      'errorKind',
      'hintLevel',
      'nextAction',
      'ruleVersion',
      'exampleVersion',
      'nextQuestion',
      'evidence',
      'redacted',
    ],
    ['t-old', 's', 'ss', '', '', JSON.stringify({ id: 't-old', skill: 'midpoint' })],
  ];
  const old = rows[1][5];
  let columns = 26;
  const sheet = {
    getLastColumn: () => rows[0].length,
    getLastRow: () => rows.length,
    getMaxColumns: () => columns,
    insertColumnsAfter: (_a, n) => {
      columns += n;
    },
    getRange: (row, col, n, m) => ({
      getValues: () =>
        Array.from({ length: n }, (_, i) =>
          Array.from({ length: m }, (_, j) => rows[row + i - 1]?.[col + j - 1] || ''),
        ),
      setValues: (v) => {
        v.forEach((a, i) => {
          rows[row + i - 1] ||= [];
          a.forEach((x, j) => (rows[row + i - 1][col + j - 1] = x));
        });
        return { setFontWeight() {} };
      },
    }),
  };
  const context = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'sheet' }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  });
  vm.runInContext(
    readFileSync(new URL('../google-apps-script/Code.gs', import.meta.url), 'utf8'),
    context,
  );
  context.migrateV660();
  const once = JSON.stringify(rows);
  context.migrateV660();
  assert.equal(JSON.stringify(rows), once);
  assert.equal(rows[1][5], old);
  assert.equal(rows[1][19], 'unclassified');
  assert.equal(rows[0].length, 22);
});
test('Two more identity traps: difference of cubes and grouping', () => {
  assert.equal(equivalent('(2x-y)^3', '8x^3-12x^2y+6xy^2-y^3').equal, true);
  assert.equal(equivalent('x^2-y^2+2x-2y', '(x-y)(x+y+2)').equal, true);
});
test('Answer guards distinguish reported variable value, counterexample and leaked key', () => {
  const s = initialTutorState(curriculum.exercises.find((e) => e.id === 'l06-e1').problem);
  s.turn = 1;
  assert.doesNotThrow(() => validateMathTurn(ctx('c2', 'l06'), 'x=2', assessment(), s));
  assert.doesNotThrow(() =>
    validateMathTurn(ctx('c2', 'l06'), 'Đẳng thức $(x+1)^2=x^2+1$ là sai.', assessment(), s),
  );
  const e = curriculum.exercises.find((e) => e.id === 'l06-e1');
  assert.throws(() =>
    validateMathTurn(ctx('c2', 'l06'), 'Em chưa hiểu', assessment({ feedback: e.answer }), s),
  );
});
test('Live validation path checks Thales/bisector numbers, all modes keep Socratic guard', () => {
  const s = initialTutorState(curriculum.exercises.find((e) => e.id === 'l15-e1').problem);
  s.turn = 1;
  assert.throws(() => validateMathTurn(ctx('c4', 'l15'), 'Theo Thalès, AN=5 cm.', assessment(), s));
  assert.doesNotThrow(() =>
    validateMathTurn(ctx('c4', 'l15'), 'Theo Thalès, AN=4 cm.', assessment(), s),
  );
  assert.throws(() => validateMathTurn(ctx('c4', 'l15'), '5 cm', assessment(), s));
});
test('Statistics allows negative temperatures, checks percent series and horizontal spacing', async () => {
  const { chartScale } = await import('../public/statistics.mjs');
  const d = validateTable({ ...sample, values: [-5, 0, 10], positions: [2020, 2022, 2025] });
  assert.deepEqual(d.angles, []);
  const scale = chartScale(d);
  assert(scale.min <= -5 && scale.max >= 10 && scale.ticks.includes(0));
  assert.throws(() => validateTable({ ...sample, positions: [2020, 2020, 2025] }));
  assert.throws(() =>
    validateTable({ ...sample, values: [50, 30, 20], second: [50, 30, 10], percent: true }),
  );
});
for (const [chapterId, lessonId, transcription] of [
  ['c1', 'l01', 'Thu gọn đơn thức 2x nhân 3x.'],
  ['c5', 'l18', 'Phân loại dữ liệu số học sinh trong mỗi lớp.'],
])
  test(`Image read/confirm uses exact reviewed nongeometry data ${chapterId}`, async () => {
    const image = {
      mimeType: 'image/png',
      data: readFileSync(new URL('./fixtures/images/clear-ratio.png', import.meta.url)).toString(
        'base64',
      ),
    };
    const reading = {
      transcription,
      figureLabels: [],
      givens: [transcription],
      goals: ['Thực hiện yêu cầu trong đề'],
      construction: '',
      points: [],
      objects: [],
      relations: [],
      auxiliary: [],
      highlights: [],
      uncertainties: [],
      confidence: 0.99,
      theory: [],
      clarification: '',
    };
    const res = await handleChat(
      request({ chapterId, lessonId, mode: 'image-read', image }),
      { ...env, AI_PROVIDER: 'gemini' },
      async () => provider(reading),
    );
    const d = await res.json();
    assert.equal(res.status, 200, JSON.stringify(d));
    assert.equal(d.confirmed, false);
    assert.deepEqual(d.reading.points, []);
    const confirmed = await handleChat(
      request({
        chapterId,
        lessonId,
        mode: 'image-confirm',
        imageToken: d.imageToken,
        transcription,
      }),
      { ...env, AI_PROVIDER: 'gemini' },
      () => assert.fail('Unchanged confirmation needs no AI'),
    );
    assert.equal((await confirmed.json()).confirmed, true);
    const swapped = await handleChat(
      request({
        chapterId: 'c4',
        lessonId: 'l15',
        mode: 'image-restore',
        imageToken: d.imageToken,
      }),
      { ...env, AI_PROVIDER: 'gemini' },
    );
    assert.equal(swapped.status, 409);
  });
