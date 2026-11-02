import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { handleChat } from '../server/chat.mjs';
import { handleLanguage, pcmWave } from '../server/language.mjs';
import { handleLearning } from '../server/learning/api.mjs';
import { env, enrolled, mockGateway, token } from '../tests/v650-fixture.mjs';
import { assessment, provider } from '../tests/fixtures/v623-data.mjs';
const out = process.env.QA_OUTPUT || '/tmp/tutor-v670-ui';
mkdirSync(out, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4197 } });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
  page = await context.newPage();
const errors = [],
  results = [],
  requests = [];
const gateway = mockGateway(enrolled());
let turn = 0,
  failSpeech = false,
  holdSpeech = false,
  releaseSpeech;
page.on('pageerror', (e) => errors.push(e.message));
await context.addCookies([
  {
    name: 'tutor_learner',
    value: token,
    url: 'http://127.0.0.1:4197',
    httpOnly: true,
    sameSite: 'Strict',
  },
]);
await context.addInitScript(
  ({ studentId }) => {
    localStorage.setItem('tutor-memory-v650', JSON.stringify({ studentId, consent: true }));
    window.micCalls = 0;
    window.micTracks = [];
    navigator.mediaDevices.getUserMedia = async () => {
      window.micCalls++;
      if (window.denyMic) throw new DOMException('denied', 'NotAllowedError');
      const ctx = new AudioContext(),
        osc = ctx.createOscillator(),
        gain = ctx.createGain(),
        dst = ctx.createMediaStreamDestination();
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(dst);
      osc.start();
      window.micTracks.push(...dst.stream.getTracks());
      dst.stream.getTracks()[0].addEventListener('ended', () => ctx.close());
      return dst.stream;
    };
  },
  { studentId: token.split('.')[0] },
);
const problems = [
  [
    'Xác định hệ số và bậc của đơn thức -6xy.',
    'Identify the coefficient and degree of the monomial -6xy.',
  ],
  [
    'Nêu cách kiểm tra hằng đẳng thức bình phương một tổng.',
    'Explain how to check the identity for the square of a sum.',
  ],
  [
    'Cho hình bình hành ABCD. Hai đường chéo AC và BD cắt nhau tại O. Chứng minh OA=OC.',
    'Given parallelogram ABCD, its diagonals AC and BD intersect at O. Prove OA=OC.',
  ],
  [
    'Cho tam giác ABC có M thuộc AB, N thuộc AC, MN song song BC. Biết AM=3 cm, AB=9 cm, AC=12 cm. Tính AN.',
    'In triangle ABC, M lies on AB, N lies on AC, and MN is parallel to BC. Given AM=3 cm, AB=9 cm, AC=12 cm, find AN.',
  ],
  [
    'Nêu cách phân loại dữ liệu định tính và định lượng.',
    'Explain how to classify qualitative and quantitative data.',
  ],
];
function translate(p) {
  return (
    problems.find((x) => x[0] === p)?.[1] ||
    p.replace('Thu gọn', 'Simplify').replace('nhân', 'times')
  );
}
await page.route('**/api/*', async (route) => {
  const req = route.request(),
    b = req.postDataJSON();
  requests.push(b);
  const request = new Request(req.url(), {
    method: 'POST',
    headers: await req.allHeaders(),
    body: JSON.stringify(b),
  });
  let response;
  if (req.url().endsWith('/learning'))
    response = await handleLearning(request, env, gateway.fetcher);
  else if (req.url().endsWith('/language')) {
    if (b.action === 'speak' && holdSpeech)
      await new Promise((resolve) => (releaseSpeech = resolve));
    response = await handleLanguage(request, env, async () => {
      if (failSpeech) return new Response('unavailable', { status: 503 });
      if (b.action === 'speak') {
        const pcm = Buffer.alloc(48000 * 2);
        for (let i = 0; i < pcm.length; i += 2)
          pcm.writeInt16LE(Math.round(2000 * Math.sin(i / 15)), i);
        return Response.json({
          candidates: [
            {
              content: {
                parts: [
                  { inlineData: { mimeType: 'audio/wav', data: pcmWave(pcm).toString('base64') } },
                ],
              },
            },
          ],
        });
      }
      return provider({
        transcript: b.target,
        clarity: 'practice',
        feedbackEn: 'Try saying it more slowly.',
        feedbackVi: 'Em thử đọc chậm hơn.',
        words: [
          {
            word: b.target.split(' ')[0].replace(/[^a-z]/gi, ''),
            status: 'practice',
            tipEn: 'Listen to the first syllable.',
            tipVi: 'Nghe âm tiết đầu.',
          },
        ],
      });
    });
  } else
    response = await handleChat(request, env, async (url, options) => {
      if (url === env.LEARNING_GATEWAY_URL) return gateway.fetcher(url, options);
      if (b.check) return provider('OK');
      if (['image-read', 'image-confirm'].includes(b.mode))
        return provider({
          transcription: b.transcription || 'Thu gọn 2x nhân 3x.',
          transcriptionEn: translate(b.transcription || 'Thu gọn 2x nhân 3x.'),
          transcriptionVi: b.transcription || 'Thu gọn 2x nhân 3x.',
          figureLabels: [],
          givens: [b.transcription || 'Thu gọn 2x nhân 3x.'],
          goals: ['Thu gọn đơn thức'],
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
        });
      turn++;
      return provider(
        assessment({
          stage: 1,
          classification: turn === 1 ? 'ambiguous' : 'correct_partial',
          question: `Lượt ${turn}: em chọn dữ kiện nào để bắt đầu?`,
          feedback: 'Em hãy đối chiếu các dữ kiện đã cho.',
          givens: 'Dữ kiện của đề đã xác nhận.',
          goal: 'Xác định việc cần làm.',
          bridge: 'Đối chiếu điều kiện với kiến thức.',
          english: {
            feedback: 'Check the given information.',
            question: `Turn ${turn}: which given fact would you start with?`,
            operation: 'Analyse',
            givens: 'The information in the confirmed problem.',
            goal: 'Identify the task.',
            bridge: 'Compare the conditions with what you know.',
            summary: '',
            problemEn: translate(b.problem),
            problemVi: b.problem,
          },
        }),
      );
    });
  try {
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: Buffer.from(await response.arrayBuffer()),
    });
  } catch (e) {
    if (!/closed|cancel|intercept|handled/i.test(e.message)) throw e;
  }
});
const pass = (s) => {
  results.push(s);
  console.log('PASS', s);
};
async function enter(i) {
  await page.locator('.chapter-card').nth(i).getByRole('button').click();
  await page.getByLabel('Chọn bài học').waitFor();
}
async function home() {
  await page.getByRole('button', { name: 'Về trang chủ', exact: true }).click();
  await page.locator('.chapter-card').first().waitFor();
}
async function connect() {
  await page.locator('.topbar').getByRole('button', { name: 'Kết nối AI', exact: true }).click();
  await page.getByLabel('Mã truy cập', { exact: true }).fill(env.ACCESS_CODE);
  await page.getByRole('button', { name: 'Kiểm tra & kết nối' }).click();
  await page.getByLabel('Lớp đang học (Nếu bạn là GV thì để trống)', { exact: true }).fill('8A');
  await page.getByRole('button', { name: 'Hoàn tất thông tin & bắt đầu học' }).click();
}
async function send(text) {
  await page.locator('#problem').fill(text);
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await page.locator('.working').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.querySelector('#problem')?.value === '');
}
try {
  await page.goto('http://127.0.0.1:4197');
  await enter(0);
  await connect();
  await page.locator('.curriculum-bank .exercise-card').first().click();
  await page.getByRole('button', { name: 'Bài mới', exact: true }).click();
  await send(problems[0][0]);
  assert.equal(await page.locator('.bilingual-message').count(), 1);
  assert.match(
    await page.locator('.bilingual-message [lang=en]').last().textContent(),
    /which given fact/,
  );
  assert.match(await page.locator('.bilingual-message .vietsub').last().textContent(), /^\(/);
  assert.equal(await page.evaluate(() => window.micCalls), 0);
  assert.equal(requests.filter((r) => r.action === 'speak').length, 0);
  pass('English above parenthesized Vietnamese; no automatic speech or microphone.');
  await send('The coefficient is negative six.');
  await page.waitForFunction(() =>
    document.querySelector('.stars-badge summary')?.textContent.includes('3 sao'),
  );
  await send('The coefficient is negative six.');
  assert.match(await page.locator('.stars-badge summary').textContent(), /3 sao/);
  pass('English effort saves 3 stars through signed Sheets handler; duplicate answer adds zero.');
  await page
    .locator('.bilingual-message')
    .last()
    .getByRole('button', { name: /Nghe tiếng Anh/ })
    .click();
  await page
    .locator('.bilingual-message')
    .last()
    .getByRole('button', { name: /Nghe tiếng Anh/ })
    .getByText('Dừng', { exact: true })
    .waitFor();
  await page
    .locator('.bilingual-message')
    .last()
    .getByLabel('Tốc độ đọc tiếng Anh')
    .selectOption('1');
  await page
    .locator('.bilingual-message')
    .last()
    .getByRole('button', { name: /Nghe tiếng Anh/ })
    .click();
  pass('Listen, stop and speed controls work with mocked WAV returned by the real speech handler.');
  const word = page.locator('.vocabulary-table tr').filter({ hasText: 'coefficient' });
  await word.getByRole('button', { name: /Luyện phát âm/ }).click();
  const practice = page.getByRole('region', { name: 'Luyện phát âm tự chọn' });
  assert.equal(await page.evaluate(() => window.micCalls), 0);
  assert(await practice.getByRole('button', { name: 'Bắt đầu ghi âm' }).isDisabled());
  await practice.locator('input[type=checkbox]').check();
  assert.equal(await page.evaluate(() => window.micCalls), 0);
  await practice.getByRole('button', { name: 'Bắt đầu ghi âm' }).click();
  await practice.getByRole('button', { name: /Dừng ghi/ }).waitFor();
  await page.waitForTimeout(1300);
  await practice.getByRole('button', { name: /Dừng ghi/ }).click();
  await practice.getByRole('button', { name: 'Kiểm tra phát âm' }).waitFor();
  assert.equal(
    await page.evaluate(() => window.micTracks.every((t) => t.readyState === 'ended')),
    true,
  );
  await practice.getByRole('button', { name: 'Kiểm tra phát âm' }).click();
  await practice.locator('.pronunciation-result').waitFor();
  assert.match(
    await practice.locator('.pronunciation-result').textContent(),
    /Try saying it more slowly/,
  );
  assert.equal(requests.filter((r) => r.action === 'pronounce').length, 1);
  pass(
    'Opt-in microphone, real browser recording → WAV encoding → mocked AI review; tracks stop after recording.',
  );
  await page.evaluate(() => (window.denyMic = true));
  await practice.getByRole('button', { name: 'Ghi lại' }).click();
  await practice.getByRole('alert').waitFor();
  assert.match(await practice.getByRole('alert').textContent(), /quyền micro/);
  await page.evaluate(() => (window.denyMic = false));
  failSpeech = true;
  await word.getByRole('button', { name: /Nghe tiếng Anh/ }).click();
  await word.getByRole('button', { name: 'Dùng giọng thiết bị' }).waitFor();
  failSpeech = false;
  pass(
    'Denied microphone and AI audio outage show actionable errors; device voice is explicitly labeled.',
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: out + '/desktop.png', animations: 'disabled', fullPage: true });
  await page.reload();
  await page.locator('#problem').waitFor();
  assert.equal(await page.locator('.bilingual-message').count(), 3);
  await page.waitForFunction(() =>
    document.querySelector('.stars-badge summary')?.textContent.includes('3 sao'),
  );
  await connect();
  pass('Reload restores bilingual turns and saved account stars.');
  for (let i = 1; i < 5; i++) {
    await home();
    await enter(i);
    await page.locator('.curriculum-bank .exercise-card').first().click();
    await page.getByRole('button', { name: 'Bài mới', exact: true }).click();
    await send(problems[i][0]);
    assert((await page.locator('.bilingual-message [lang=en]').count()) > 0);
    assert((await page.locator('.vocabulary-table tbody tr').count()) > 0);
    assert.match(await page.locator('.stars-badge summary').textContent(), /3 sao/);
  }
  pass(
    'All five chapters show relevant vocabulary and share account stars without mixing conversations.',
  );
  await home();
  await enter(0);
  await page.getByRole('button', { name: 'Bài mới', exact: true }).click();
  await page
    .getByLabel('Chọn ảnh đề toán', { exact: true })
    .setInputFiles('tests/fixtures/images/clear-ratio.png');
  await page.getByRole('button', { name: 'Đọc đề từ ảnh', exact: true }).click();
  await page.getByLabel('Bản phiên âm đề', { exact: true }).waitFor();
  assert.match(
    await page.locator('.image-reading [lang=en]').textContent(),
    /Simplify 2x times 3x/,
  );
  await page.getByLabel('Bản phiên âm đề', { exact: true }).fill('Thu gọn 2x nhân 4x.');
  assert.equal(await page.locator('.image-reading [lang=en]').count(), 0);
  await page.getByRole('button', { name: 'Xác nhận đề và bắt đầu học', exact: true }).click();
  await page.waitForFunction(() =>
    document.querySelector('.image-reading [lang=en]')?.textContent.includes('4x'),
  );
  await page.waitForFunction(() => !document.querySelector('.image-problem button:disabled'));
  await page.getByRole('button', { name: 'Xác nhận đề và bắt đầu học', exact: true }).click();
  await page.locator('.bilingual-message').waitFor();
  pass('Photo English/Vietnamese updates on edited transcription before confirmation.');
  // Starting a pending speech request then leaving the lesson must not play it later.
  holdSpeech = true;
  await page
    .locator('.bilingual-message')
    .last()
    .getByRole('button', { name: /Nghe tiếng Anh/ })
    .click();
  await page.waitForTimeout(150);
  await home();
  releaseSpeech?.();
  holdSpeech = false;
  await enter(4);
  pass('Leaving a lesson cancels pending speech and keeps the destination conversation separate.');
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `horizontal overflow ${width}`,
    );
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Từ vựng · Nghe · Luyện nói', exact: true }).click();
  await page.screenshot({ path: out + '/mobile.png', animations: 'disabled', fullPage: true });
  await home();
  await page.getByRole('button', { name: 'Đổi giao diện sáng tối' }).click();
  await enter(4);
  await page.screenshot({ path: out + '/dark.png', animations: 'disabled', fullPage: true });
  pass(
    '375 / 768 / 1280px layouts avoid horizontal overflow; mobile shortcut and dark theme work.',
  );
  assert.deepEqual(errors, []);
  writeFileSync(
    out + '/results.json',
    JSON.stringify(
      {
        results,
        errors,
        scope:
          'Local Chromium; actual app and handlers. Gemini, speech, pronunciation, Sheets and microphone input are test fixtures; no live-provider quality claim.',
      },
      null,
      2,
    ),
  );
  console.log('UI PASSED', results.length);
} finally {
  await browser.close();
  await server.httpServer.close();
}
