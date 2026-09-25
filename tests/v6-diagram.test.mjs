import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleChat } from '../server/gemini.mjs';
import { parseDiagram } from '../server/diagram-policy.mjs';
import { guardTutorOutput, guidedFallback } from '../server/strict-tutor.mjs';
const latex = readFileSync(new URL('./fixtures/right-isosceles.tex', import.meta.url), 'utf8');
const env = { GEMINI_API_KEY: 'test-key', ACCESS_CODE: 'HOCGIOITOAN' };
const request = (patch = {}) =>
  new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessCode: env.ACCESS_CODE,
      mode: 'diagram',
      messages: [{ role: 'user', content: 'Cho tam giác ABC vuông cân tại C.' }],
      ...patch,
    }),
  });
const provider = (data) =>
  Response.json({
    candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(data) }] } }],
  });
test('V6 diagram uses private authenticated Gemini transport, JSON mode and separate prompt', async () => {
  const r = await handleChat(request(), env, async (url, opts) => {
    const b = JSON.parse(opts.body);
    assert.equal(opts.headers['x-goog-api-key'], 'test-key');
    assert.equal(b.generationConfig.responseMimeType, 'application/json');
    assert.match(b.systemInstruction.parts[0].text, /TikZ/);
    assert(!b.systemInstruction.parts[0].text.includes('[SO_DO]'));
    return provider({ latex, question: '' });
  });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).latex, latex);
});
test('V6 diagram wrong access code cannot call provider', async () => {
  const r = await handleChat(request({ accessCode: 'wrong' }), env, () => assert.fail());
  assert.equal(r.status, 401);
});
test('V6 diagram rejects invented system role and oversized repair', async () => {
  for (const messages of [
    [{ role: 'system', content: 'x' }],
    [{ role: 'user', content: 'x'.repeat(26001) }],
  ])
    assert.equal((await handleChat(request({ messages }), env, () => assert.fail())).status, 400);
});
test('V6 clarification returned without fabricated geometry', async () => {
  assert.deepEqual(parseDiagram(JSON.stringify({ latex: '', question: 'M nằm trên đường nào?' })), {
    latex: '',
    question: 'M nằm trên đường nào?',
  });
});
test('V6 malformed and unsafe TeX refused', () => {
  for (const value of [
    '{}',
    JSON.stringify({ latex: 'bad' }),
    JSON.stringify({ latex: latex.replace('\\draw', '\\input{secret}\\draw') }),
    JSON.stringify({ latex: latex.replace('\\draw', '\\def\\x{\\x}\\draw') }),
  ])
    assert.throws(() => parseDiagram(value));
});
test('V6 natural hint without rigid metadata is kept', () => {
  const text = 'À, mình nhìn hai đường chéo nhé!\nGợi mở: Em đã biết gì về trung điểm của chúng?';
  assert.equal(
    guardTutorOutput(text, [{ role: 'user', content: 'Gợi ý thêm bài hình bình hành' }]),
    text,
  );
});
test('V6 fallback hints progress instead of repeating the previous question', () => {
  const previous =
    '[SO_DO]\nDU_KIEN: ABCD là hình bình hành.\nMUC_TIEU: Hai đoạn song song.\nCAU_NOI: Hai đường chéo cắt nhau tại trung điểm.\nBUOC_TIEP: Đối chiếu trung điểm.\n[/SO_DO]\nGợi mở: Em biết gì?';
  const a = [
    { role: 'assistant', content: previous },
    { role: 'user', content: 'Em cần gợi ý thêm' },
  ];
  const b = [
    ...a,
    { role: 'assistant', content: guidedFallback(a) },
    { role: 'user', content: 'Em cần gợi ý thêm' },
  ];
  assert.notEqual(guidedFallback(a), guidedFallback(b));
  assert(!guidedFallback(a).includes('Gợi mở: Em biết gì?'));
});
