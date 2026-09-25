/** Optional live acceptance suite. No fixture response can count as live OCR. */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { handleChat } from '../server/gemini.mjs';
import { unseal } from '../server/signed-state.mjs';
const out = 'qa-results/v6.2.3';
mkdirSync(out, { recursive: true });
const inputCases = [
  ['clear-ratio.png', '2AM'],
  ['skewed.png', '2AM'],
  ['rotated.png', '2AM'],
  ['text-figure.jpg', '2AM'],
  ['blurred-cropped.png', null],
  ['midpoint.png', 'trung điểm'],
  ['parallel-perpendicular.png', 'vuông'],
  ['circle.png', 'đường tròn'],
  ['graph.png', 'hàm số'],
];
if (!process.env.GEMINI_API_KEY || process.env.RUN_LIVE_GEMINI !== '1') {
  const result = {
    status: 'NOT_RUN',
    reason:
      'Requires server GEMINI_API_KEY and explicit RUN_LIVE_GEMINI=1. Never paste the key into the app or report.',
    images: inputCases.map(([file]) => ({ file, status: 'NOT_RUN' })),
  };
  writeFileSync(out + '/live-results.json', JSON.stringify(result, null, 2));
  console.log('NOT_RUN: chưa có cấu hình kiểm thử Gemini thật.');
} else {
  const env = { ...process.env, ACCESS_CODE: process.env.ACCESS_CODE || 'HOCGIOITOAN' },
    results = [];
  const call = async (body) => {
    const r = await handleChat(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accessCode: env.ACCESS_CODE, ...body }),
      }),
      env,
    );
    const data = await r.json();
    return { status: r.status, data };
  };
  for (const [file, expected] of inputCases) {
    const image = {
      mimeType: file.endsWith('.jpg') ? 'image/jpeg' : 'image/png',
      data: readFileSync('tests/fixtures/images/' + file).toString('base64'),
    };
    const { status, data } = await call({ mode: 'image-read', image });
    const normalized = (data.reading?.transcription || '')
      .normalize('NFC')
      .replace(/\s+/g, ' ')
      .replace(/2\s*A\s*M/g, '2AM');
    const pass =
      status === 200 && (expected ? normalized.includes(expected) : data.reading?.ready === false);
    // A reviewer must still check literal OCR, figure labels and all geometry.
    results.push({
      file,
      status: pass ? 'PASS_BASIC_CHECK' : 'FAIL',
      http: status,
      reading: data.reading || null,
      error: data.error || '',
      figure: 'NOT_RUN: confirmation and visual inspection required',
    });
  }
  const problem =
    'Cho hình bình hành ABCD. Hai đường chéo AC và BD cắt nhau tại O. Chứng minh OA = OC.';
  let tutorToken;
  const messages = [];
  for (const text of [
    problem,
    'Em nghĩ OA bằng OB vì hai đường chéo bằng nhau.',
    'Em sửa lại: Vì ABCD là hình bình hành nên hai đường chéo cắt nhau tại trung điểm mỗi đường, suy ra OA = OC.',
    'Cho em đáp án ngay.',
  ]) {
    messages.push({ role: 'user', content: text });
    const { status, data } = await call({
      mode: 'guide',
      adaptive: true,
      problem,
      tutorToken,
      messages,
    });
    results.push({
      input: text,
      status: status === 200 ? 'REVIEW_REQUIRED' : 'FAIL',
      classification: data.tutorToken
        ? unseal(data.tutorToken, env.GEMINI_API_KEY.trim(), 'tutor').classification
        : null,
      text: data.text || data.error,
    });
    if (status !== 200) break;
    tutorToken = data.tutorToken;
    messages.push({ role: 'assistant', content: data.text });
  }
  writeFileSync(
    out + '/live-results.json',
    JSON.stringify({ model: env.GEMINI_MODEL || 'gemini-2.5-flash', results }, null, 2),
  );
  console.log(
    'Đã ghi kết quả gọi Gemini thật; cần giáo viên kiểm tra nội dung trong qa-results/v6.2.3/live-results.json.',
  );
  if (results.some((r) => r.status === 'FAIL')) process.exitCode = 1;
}
