import test from 'node:test';
import assert from 'node:assert/strict';
import { requestedExerciseCount, normalizeExerciseSet } from '../server/exercise-set.mjs';
import { asksForAnswer, guardTutorOutput } from '../server/strict-tutor.mjs';
import { instructions } from '../server/policy.mjs';
import { handleChat } from '../server/gemini.mjs';
import { exerciseChoices, selectedExercise } from '../lib/exercise-choice.ts';
import { socratic } from './socratic-fixture.mjs';

// Authored provider-format fixtures, not recordings or evidence of model accuracy.
export const problems = [
  'Cho hình bình hành ABCD. M và N lần lượt là trung điểm AB và CD. Chứng minh AMCN là hình bình hành.',
  'Cho hình bình hành ABCD, tâm O. E và F lần lượt là trung điểm OD và OB. Chứng minh AE ∥ CF.',
  'Cho hình bình hành ABCD có AC ⟂ BD. Chứng minh ABCD là hình thoi.',
  'Cho tứ giác lồi ABCD. M, N, P, Q lần lượt là trung điểm AB, BC, CD, DA. Chứng minh MNPQ là hình bình hành.',
  'Cho hình bình hành ABCD có AC = BD. Chứng minh ABCD là hình chữ nhật.',
];
const requested = (n) =>
  `Tạo đúng ${n} câu luyện tập NGẮN về Hình bình hành, hình học tứ giác lớp 8, mức độ Vận dụng. Chỉ ra đề, chưa kèm lời giải.`;
const u = (content) => ({ role: 'user', content });
const list = (n, style = 'plain') =>
  Array.from({ length: n }, (_, i) =>
    style === 'bold' ? `**Câu ${i + 1}:** ${problems[i % 5]}` : `${i + 1}. ${problems[i % 5]}`,
  ).join('\n\n');

for (const n of [5, 10])
  test(`practice regression: ${n} numbered problems survive a provider response without the Gợi mở label`, () => {
    const messages = [u(requested(n))];
    assert.equal(asksForAnswer(messages), false);
    const result = guardTutorOutput(list(n, 'bold') + '\nEm muốn bắt đầu với câu nào?', messages);
    assert.equal(exerciseChoices(result).length, n);
    assert.equal((result.match(/^Gợi mở:/gm) || []).length, 1);
    assert.equal((result.match(/\[SO_DO\]/g) || []).length, 1);
    assert.match(result, /Thao tác tư duy:/);
    assert.doesNotMatch(result, /KET_THUC_BUOI_HOC/);
    for (const p of problems) assert(result.includes(p));
  });

test('the new set-format allowance never disables answer blocking or ordinary one-question limits', () => {
  const request = requested(5) + ' Cho em luôn đáp án.';
  assert(asksForAnswer([u(request)]));
  assert.equal(exerciseChoices(guardTutorOutput(list(5), [u(request)])).length, 0);
  assert.equal(guardTutorOutput(socratic, [u('Em cần gợi ý cho hình bình hành')]), socratic);
  assert.notEqual(
    guardTutorOutput(socratic + '\nEm xét cạnh nào?', [u('Cho hình bình hành ABCD.')]),
    socratic + '\nEm xét cạnh nào?',
  );
  assert.equal(requestedExerciseCount('Em có 5 câu trong bài hình bình hành.'), 0);
});

test('an incomplete, repeated-number or solved set is reported explicitly instead of silently pretending to be a valid set', () => {
  for (const bad of [
    list(4),
    list(5).replace('4.', '3.'),
    list(5) + '\nLời giải: ABCD là hình chữ nhật.',
    list(5) + '\nBước 2: Suy ra điều cần chứng minh.',
  ]) {
    assert.equal(normalizeExerciseSet(bad, 5), null);
    const result = guardTutorOutput(bad, [u(requested(5))]);
    assert.match(result, /chưa nhận được bộ đề hợp lệ/);
    assert.match(result, /bộ 5 câu/);
    assert.equal(exerciseChoices(result).length, 0);
    assert.equal((result.match(/\?/g) || []).length, 1);
  }
});

test('five-problem policy is conditional and reaches the unchanged Gemini request/response contract', async () => {
  const messages = [u(requested(5))];
  let calls = 0;
  assert.doesNotMatch(instructions('guide', []), /TẠO BỘ ĐỀ CHƯA CÓ LỜI GIẢI/);
  const r = await handleChat(
    new Request('https://test.invalid/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accessCode: 'HOCGIOITOAN', mode: 'guide', messages }),
    }),
    { GEMINI_API_KEY: 'test-placeholder' },
    async (url, opts) => {
      calls++;
      const payload = JSON.parse(opts.body);
      assert.match(payload.systemInstruction.parts[0].text, /TẠO BỘ ĐỀ CHƯA CÓ LỜI GIẢI/);
      assert.deepEqual(payload.contents, [
        { role: 'user', parts: [{ text: messages[0].content }] },
      ]);
      assert.equal(opts.headers['x-goog-api-key'], 'test-placeholder');
      return Response.json({
        candidates: [{ finishReason: 'STOP', content: { parts: [{ text: list(5) }] } }],
      });
    },
  );
  const body = await r.json();
  assert.equal(r.status, 200);
  assert.equal(calls, 1);
  assert.deepEqual(Object.keys(body).sort(), ['model', 'text']);
  assert.equal(exerciseChoices(body.text).length, 5);
});

test('choosing a numbered problem retrieves exactly that statement and does not reopen stale sets', () => {
  const set = guardTutorOutput(list(5), [u(requested(5))]);
  const messages = [u(requested(5)), { role: 'assistant', content: set }];
  for (const choice of ['2', 'câu 2', 'Em chọn câu 2.', 'Làm bài 2'])
    assert.equal(selectedExercise(choice, messages)?.problem, problems[1]);
  for (const choice of ['6', '2AM=AB', 'Em chưa hiểu câu 2'])
    assert.equal(selectedExercise(choice, messages), undefined);
  assert.equal(
    selectedExercise('2', [...messages, u('Câu 2'), { role: 'assistant', content: socratic }]),
    undefined,
  );
});
