import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleChat } from '../server/chat.mjs';
import { bilingualReply, translation } from '../server/bilingual.mjs';
import { initialTutorState, applyTutorTurn } from '../server/adaptive-tutor.mjs';
import { seal } from '../server/signed-state.mjs';
import { handleLearning } from '../server/learning/api.mjs';
import { handleLanguage, pcmWave, validateRecording, validateReview } from '../server/language.mjs';
import { awardStars, emptyProgress, RULE_VERSION } from '../server/learning/domain.mjs';
import { env, enrolled, auth, event, token, mockGateway, req } from './v650-fixture.mjs';
import { assessment, problem, provider, reading } from './fixtures/v623-data.mjs';
import { loadTS } from './load-ts.mjs';
export function pairedAssessment(patch = {}) {
  return assessment({
    english: {
      feedback: 'You have identified the condition to check.',
      question: 'How can you state the other condition using the position of M on AB?',
      operation: 'Analyse',
      goal: 'Prove that M is the midpoint of AB',
      bridge: 'Midpoint definition: a point on the segment with equal distances to both endpoints.',
      givens: 'M lies on segment AB; 2AM = AB.',
      summary: '',
      problemEn:
        'Triangle ABC is right-angled at A. M lies on segment AB and 2AM = AB. Prove that M is the midpoint of AB.',
      problemVi: problem,
    },
    ...patch,
  });
}
const aiResponse = (value, ai) =>
  ai === 'gemini'
    ? provider(value)
    : Response.json({
        status: 'completed',
        output: [
          {
            type: 'message',
            role: 'assistant',
            content: [{ type: 'output_text', text: JSON.stringify(value) }],
          },
        ],
      });
for (const ai of ['gemini', 'openai'])
  test(`${ai}: bilingual schema keeps English/Vietnamese, signed state and English evidence`, async () => {
    const answer = 'Because AB = AM + MB and AB = 2AM, the two segments are equal.';
    const state = {
      ...initialTutorState(problem),
      turn: 1,
      stage: 4,
      questions: ['Từ hai đẳng thức, em suy ra quan hệ nào?'],
    };
    const db = enrolled(),
      gateway = mockGateway(db);
    let calls = 0;
    const value = pairedAssessment({
      accepted: [{ claim: 'AM = MB', reason: 'Cộng đoạn', studentQuote: answer }],
    });
    const response = await handleChat(
      req(
        {
          accessCode: env.ACCESS_CODE,
          learningLanguage: 'en-vi',
          adaptive: true,
          mode: 'guide',
          problem,
          tutorToken: seal(state, env.STATE_SIGNING_KEY, 'tutor'),
          messages: [{ role: 'user', content: answer }],
          memory: {
            enabled: true,
            sessionId: 'session_bilingual_1234567',
            turnId: 'turn_bilingual_123456789',
          },
        },
        'tutor_learner=' + token,
      ),
      { ...env, AI_PROVIDER: ai, OPENAI_API_KEY: 'test-only' },
      async (url, options) => {
        if (url === env.LEARNING_GATEWAY_URL) return gateway.fetcher(url, options);
        calls++;
        const input = JSON.parse(options.body),
          serialized = JSON.stringify(input);
        assert.match(serialized, /BILINGUAL LEARNING/);
        assert.match(serialized, /problemEn/);
        return aiResponse(value, ai);
      },
    );
    const d = await response.json();
    assert.equal(response.status, 200, JSON.stringify(d));
    assert.equal(calls, 1);
    assert.equal(d.bilingual.pairs.at(-1).en, value.english.question);
    assert.equal(d.bilingual.pairs.at(-1).vi, value.question);
    assert(d.tutorToken);
    assert.deepEqual(d.progress.proven, ['AM = MB']);
    assert.equal(d.learning.starsEarned, 3);
    assert.equal(d.learning.profile.gamification.total, 3);
  });
test('English translation cannot reveal a suppressed summary', () => {
  const value = pairedAssessment({
    summary: 'Không được tiết lộ kết quả.',
    english: { ...pairedAssessment().english, summary: 'SECRET ANSWER' },
  });
  const result = applyTutorTurn(initialTutorState(problem), value, [
    { role: 'user', content: problem },
  ]);
  assert(!JSON.stringify(bilingualReply(value, result, problem)).includes('SECRET'));
});
for (const [en, vi] of [
  ['The coefficient is 6.', 'Hệ số là -6.'],
  ['Use $x^3$.', 'Dùng $x^2$.'],
  ['Value 7', 'Giá trị 8'],
  ['', 'Đề bài'],
])
  test(`reject inconsistent translation ${en}`, () => assert.throws(() => translation(en, vi)));
test('missing English triggers bounded retry then preserves previous signed state', async () => {
  let calls = 0;
  const r = await handleChat(
    req({
      accessCode: env.ACCESS_CODE,
      learningLanguage: 'en-vi',
      adaptive: true,
      mode: 'guide',
      problem,
      messages: [{ role: 'user', content: problem }],
    }),
    env,
    async () => {
      calls++;
      return provider(assessment());
    },
  );
  assert.equal(r.status, 502);
  assert.equal(calls, 2);
  assert.equal((await r.json()).tutorToken, undefined);
});
test('bilingual photograph translations survive confirmation, restore and edits', async () => {
  const image = {
    mimeType: 'image/png',
    data: readFileSync(new URL('./fixtures/images/clear-ratio.png', import.meta.url)).toString(
      'base64',
    ),
  };
  const value = {
    ...reading,
    transcriptionEn: pairedAssessment().english.problemEn,
    transcriptionVi: problem,
  };
  const call = async (body) => {
    const r = await handleChat(
      req({ accessCode: env.ACCESS_CODE, learningLanguage: 'en-vi', ...body }),
      env,
      async () => provider(value),
    );
    const d = await r.json();
    assert.equal(r.status, 200, JSON.stringify(d));
    return d;
  };
  const first = await call({ mode: 'image-read', image });
  assert.equal(first.reading.transcriptionEn, value.transcriptionEn);
  assert.equal(first.confirmed, false);
  const confirmed = await call({
    mode: 'image-confirm',
    imageToken: first.imageToken,
    transcription: problem,
  });
  assert(confirmed.confirmed);
  const restored = await call({ mode: 'image-restore', imageToken: confirmed.imageToken });
  assert.equal(restored.reading.transcriptionEn, value.transcriptionEn);
});
const rewardEvent = (patch = {}) =>
  event({
    languageMode: 'en-vi',
    answer: 'The coefficient is negative six.',
    rewardKey: 'a'.repeat(64),
    ...patch,
  });
test('stars: duplicate id, duplicate content across sessions and forged client delta never multiply points', () => {
  const db = enrolled(),
    e = rewardEvent({ starsEarned: 9999 });
  assert.equal(db.run('ingest', { ...auth, event: e }).starsEarned, 3);
  assert.equal(db.run('ingest', { ...auth, event: e }).profile.gamification.total, 3);
  const repeated = rewardEvent({ sessionId: 'session_other_12345678' });
  assert.equal(db.run('ingest', { ...auth, event: repeated }).starsEarned, 0);
  assert.equal(db.state.Profiles[auth.studentId].gamification.total, 3);
  assert.equal(db.run('restore', auth).profile.gamification.total, 3);
});
test('stars: same global account across chapters; no repeated awards in nested lesson profiles', () => {
  const db = enrolled();
  for (const [i, chapterId, lessonId, skill] of [
    [1, 'c1', 'l01', 'c1:monomial'],
    [2, 'c3', 'l12', 'c3:parallelogram'],
  ])
    db.run('ingest', {
      ...auth,
      event: rewardEvent({
        chapterId,
        lessonId,
        skill,
        skillId: skill,
        sessionId: 'session_' + String(i).repeat(20),
        rewardKey: String(i).repeat(64),
      }),
    });
  const p = db.state.Profiles[auth.studentId];
  assert.equal(p.gamification.total, 6);
  assert.equal(p.scopes['c1:l01'].gamification, undefined);
});
test('stars: UTC+7 daily cap survives out-of-order previous-day receipts and resets on new day', () => {
  const p = emptyProgress('test'),
    now = Date.parse('2026-11-02T17:05:00Z');
  for (let i = 0; i < 12; i++)
    awardStars(
      p,
      rewardEvent({
        updatedAt: new Date(now).toISOString(),
        rewardKey: String(i).padStart(64, '0'),
      }),
      now,
    );
  assert.equal(p.gamification.total, 30);
  assert.equal(p.gamification.days['2026-11-03'].earned, 30);
  assert.equal(
    awardStars(
      p,
      rewardEvent({ updatedAt: '2026-11-02T16:59:00Z', rewardKey: 'b'.repeat(64) }),
      now,
    ),
    3,
  );
  assert.equal(
    awardStars(
      p,
      rewardEvent({ updatedAt: new Date(now).toISOString(), rewardKey: 'c'.repeat(64) }),
      now,
    ),
    0,
  );
  const next = now + 86400000;
  assert.equal(
    awardStars(
      p,
      rewardEvent({ updatedAt: new Date(next).toISOString(), rewardKey: 'a'.repeat(64) }),
      next,
    ),
    3,
  );
});
for (const patch of [
  { classification: 'vague' },
  { classification: 'answer_request' },
  { classification: 'off_topic' },
  { ruleVersion: '6.6.0-r1' },
  { redacted: true },
  { answer: 'ok' },
  { languageMode: undefined },
  { rewardKey: undefined },
])
  test('no stars for ' + JSON.stringify(patch), () => {
    const p = emptyProgress('test');
    assert.equal(awardStars(p, rewardEvent(patch)), 0);
  });
test('Vietnamese reasoning and a meaningful incorrect attempt still receive an effort star', () => {
  const p = emptyProgress('test');
  assert.equal(
    awardStars(
      p,
      rewardEvent({
        answer: 'Em cho rằng hai cạnh này song song vì giả thiết.',
        classification: 'wrong_logic',
      }),
    ),
    1,
  );
});
test('lost acknowledgment: signed replay restores points exactly once; client stars ignored', async () => {
  const db = enrolled(),
    g = mockGateway(db, { loseAcknowledgement: 'ingest' }),
    e = rewardEvent();
  const { sign } = await import('../server/learning/security.mjs');
  const receipt = sign(e, env.LEARNING_SIGNING_KEY, 'turn');
  const call = () =>
    handleLearning(
      req({ action: 'retry', receipts: [receipt], starsEarned: 999 }, 'tutor_learner=' + token),
      env,
      g.fetcher,
    );
  const first = await (await call()).json();
  assert.equal(first.results[0].saved, false);
  const second = await (await call()).json();
  assert.equal(second.results[0].duplicate, true);
  assert.equal(second.results[0].profile.gamification.total, 3);
});
function recording(seconds = 1, silent = false) {
  const pcm = Buffer.alloc(Math.floor(seconds * 32000));
  for (let i = 0; i < pcm.length; i += 2)
    pcm.writeInt16LE(silent ? 0 : Math.round(4000 * Math.sin(i / 12)), i);
  return pcmWave(pcm, 16000).toString('base64');
}
const review = {
  transcript: 'parallel',
  clarity: 'practice',
  feedbackEn: 'Try saying the word more slowly.',
  feedbackVi: 'Em thử đọc từ chậm hơn.',
  words: [
    {
      word: 'parallel',
      status: 'practice',
      tipEn: 'Listen and repeat the first syllable.',
      tipVi: 'Nghe và nhắc lại âm tiết đầu.',
    },
  ],
};
for (const ai of ['openai', 'gemini'])
  test(`${ai}: actual language handler returns WAV and reviews actual audio`, async () => {
    const settings = { ...env, AI_PROVIDER: ai, OPENAI_API_KEY: 'test-only' };
    let calls = 0;
    const fetcher = async (url, options) => {
      calls++;
      const p = JSON.parse(options.body);
      if (calls === 1) {
        assert.match(JSON.stringify(p), /parallel/);
        return ai === 'openai'
          ? Response.json({ choices: [{ message: { audio: { data: recording() } } }] })
          : Response.json({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        inlineData: {
                          mimeType: 'audio/L16;codec=pcm;rate=24000',
                          data: Buffer.alloc(48000, 1).toString('base64'),
                        },
                      },
                    ],
                  },
                },
              ],
            });
      }
      assert.match(JSON.stringify(p), /actual audio/);
      assert.match(JSON.stringify(p), /audio/);
      assert(!JSON.stringify(p).includes('LEARNING_GATEWAY'));
      return ai === 'openai'
        ? Response.json({ choices: [{ message: { content: JSON.stringify(review) } }] })
        : provider(review);
    };
    const audio = await handleLanguage(
      req({ action: 'speak', accessCode: env.ACCESS_CODE, text: 'parallel' }),
      settings,
      fetcher,
    );
    assert.equal(audio.status, 200);
    assert.equal(audio.headers.get('content-type'), 'audio/wav');
    assert.equal(Buffer.from(await audio.arrayBuffer()).toString('ascii', 0, 4), 'RIFF');
    const result = await handleLanguage(
      req({
        action: 'pronounce',
        accessCode: env.ACCESS_CODE,
        target: 'parallel',
        audio: recording(),
        consent: true,
      }),
      settings,
      fetcher,
    );
    assert.equal(result.status, 200, await result.clone().text());
    assert.deepEqual((await result.json()).review, review);
    assert.equal(calls, 2);
  });
for (const [patch, status] of [
  [{ accessCode: 'wrong' }, 401],
  [{ consent: false }, 403],
  [{ audio: recording(1, true) }, 422],
  [{ audio: recording(16) }, 400],
  [{ audio: recording(0.1) }, 400],
  [{ audio: 'not wav' }, 400],
  [{ target: 'a'.repeat(241) }, 400],
])
  test('audio rejects invalid request ' + JSON.stringify(Object.keys(patch)), async () => {
    let calls = 0;
    const r = await handleLanguage(
      req({
        action: 'pronounce',
        accessCode: env.ACCESS_CODE,
        target: 'parallel',
        audio: recording(),
        consent: true,
        ...patch,
      }),
      env,
      async () => {
        calls++;
        throw Error();
      },
    );
    assert.equal(r.status, status);
    assert.equal(calls, 0);
  });
test('audio cross-origin, provider failure and no key never pretend success', async () => {
  const r = req({ action: 'speak', accessCode: env.ACCESS_CODE, text: 'parallel' });
  r.headers.set('origin', 'https://other.test');
  assert.equal((await handleLanguage(r, env)).status, 403);
  assert.equal(
    (
      await handleLanguage(
        req({ action: 'speak', accessCode: env.ACCESS_CODE, text: 'parallel' }),
        { ACCESS_CODE: env.ACCESS_CODE },
      )
    ).status,
    503,
  );
  assert.equal(
    (
      await handleLanguage(
        req({ action: 'speak', accessCode: env.ACCESS_CODE, text: 'parallel' }),
        env,
        async () => new Response('secret key', { status: 429 }),
      )
    ).status,
    429,
  );
});
test('pronunciation review rejects unrelated words and never surfaces an invented score', () => {
  assert.throws(() =>
    validateReview({ ...review, words: [{ ...review.words[0], word: 'password' }] }, 'parallel'),
  );
  assert.equal(validateReview({ ...review, score: 100 }, 'parallel').score, undefined);
  assert(validateRecording(recording()).length > 44);
});
test('curated vocabulary and prerequisite knowledge cover every numbered lesson', async () => {
  const { wordsFor, lessonKnowledge } = await loadTS('lib/math-english.ts');
  for (let i = 1; i <= 20; i++) {
    const ids = ['l' + String(i).padStart(2, '0')];
    assert(wordsFor('', ids).length >= 2);
    assert.equal(lessonKnowledge(ids).length, 1);
  }
  assert.equal(wordsFor('Hệ số của đơn thức', ['l01'])[0].word.en, 'monomial');
  assert.equal(RULE_VERSION, '6.7.0-r1');
});

for (const [chapterId, lessonId, english] of [
  [
    'c1',
    'l01',
    String.raw`Simplify the monomial $2x^2y\cdot(-3xy^2)$, then state its coefficient and degree.`,
  ],
  ['c2', 'l06', String.raw`Expand $(x+3)^2$.`],
  ['c3', 'l10', 'Convex quadrilateral ABCD has angles A=80°, B=95°, C=105°. Find angle D.'],
  [
    'c4',
    'l15',
    'In triangle ABC, M lies on AB, N lies on AC, and MN is parallel to BC. Given AM=3 cm, AB=9 cm, AC=12 cm, find AN.',
  ],
  ['c5', 'l18', 'What type of data are the names of favourite sports?'],
])
  test(`bilingual practice list for ${chapterId} uses authored problems without answer keys`, async () => {
    const r = await handleChat(
      req({
        accessCode: env.ACCESS_CODE,
        learningLanguage: 'en-vi',
        mode: 'guide',
        chapterId,
        lessonId,
        messages: [{ role: 'user', content: 'Tạo đúng 1 câu luyện tập.' }],
      }),
      env,
      async (_url, options) => {
        const payload = JSON.parse(options.body);
        assert(!JSON.stringify(payload.contents).includes('rubric'));
        return provider({
          english: 'Question 1. ' + english + '\n\nWhich question would you like to start with?',
        });
      },
    );
    const d = await r.json();
    assert.equal(r.status, 200, JSON.stringify(d));
    assert.equal(d.exercises.length, 1);
    assert.match(d.bilingual.pairs[0].en, /Question 1/);
    assert.match(d.bilingual.pairs[0].vi, /Câu 1/);
    assert.equal(d.answer, undefined);
  });

test('inequality signs in a bilingual problem remain renderable', () => {
  assert.deepEqual(translation('Given x < 3 and y > 0.', 'Cho x < 3 và y > 0.'), {
    en: 'Given x < 3 and y > 0.',
    vi: 'Cho x < 3 và y > 0.',
  });
});
test('speech reads comparison text through the authenticated audio endpoint', async () => {
  const r = await handleLanguage(
    req({ action: 'speak', accessCode: env.ACCESS_CODE, text: 'Compare x < 3 and y > 0.' }),
    { ...env, AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test-only' },
    async () => Response.json({ choices: [{ message: { audio: { data: recording() } } }] }),
  );
  assert.equal(r.status, 200);
});
