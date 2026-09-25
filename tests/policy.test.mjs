import test from 'node:test';
import { socratic } from './socratic-fixture.mjs';
import assert from 'node:assert/strict';
import { instructions, SYSTEM } from '../server/policy.mjs';
import { handleChat } from '../server/gemini.mjs';
import { cases } from './pedagogy-cases.mjs';
// Contract tests check instructions wired to Gemini, NOT actual model compliance.
const clauses = [
  ['first-turn', 'LƯỢT ĐẦU CỦA BÀI MỚI: không đưa lời giải hoàn chỉnh'],
  ['single-question', 'đúng một câu hỏi chính sau “Gợi mở:”'],
  ['diagram', 'BUOC_TIEP: Một nhiệm vụ nhỏ học sinh tự thực hiện.'],
  ['operation', 'Thao tác tư duy: Tên thao tác'],
  ['increase', 'Mức 5: nếu vẫn bế tắc'],
  ['decrease', 'giảm ít nhất một mức hỗ trợ'],
  ['first-error', 'chỉ sửa lỗi đầu tiên theo thứ tự lập luận'],
  ['backward', 'tìm một điều kiện ĐỦ'],
  ['no-invention', 'Không tự thêm giả thiết hoặc tự sửa thứ tự đỉnh'],
  ['completion', 'không còn câu hỏi tự kiểm tra đang chờ'],
];
for (const [name, clause] of clauses)
  test('policy contract: ' + name, () => assert(SYSTEM.includes(clause)));
for (const mode of ['guide', 'review', 'compare'])
  test('Gemini receives strict policy and original history/contract: ' + mode, async () => {
    const history = cases.find((c) => c.id === 'wrong').messages;
    let payload;
    const response = await handleChat(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accessCode: 'HOCGIOITOAN', mode, messages: history }),
      }),
      { GEMINI_API_KEY: 'unit-test-placeholder' },
      async (url, opts) => {
        assert.match(url, /models\/gemini-2.5-flash:generateContent$/);
        payload = JSON.parse(opts.body);
        return Response.json({
          candidates: [{ finishReason: 'STOP', content: { parts: [{ text: socratic }] } }],
        });
      },
    );
    assert.equal(payload.systemInstruction.parts[0].text, instructions(mode, history));
    assert.deepEqual(
      payload.contents.map((x) => x.parts[0].text),
      history.map((x) => x.content),
    );
    assert.deepEqual(
      payload.contents.map((x) => x.role),
      ['user', 'model', 'user'],
    );
    assert.deepEqual(await response.json(), { text: socratic, model: 'gemini-2.5-flash' });
  });
