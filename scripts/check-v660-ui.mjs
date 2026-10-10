import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { handleChat } from '../server/chat.mjs';
import { handleLearning } from '../server/learning/api.mjs';
import { env, database, mockGateway } from '../tests/v650-fixture.mjs';
import { assessment, provider } from '../tests/fixtures/v623-data.mjs';
import { curriculum } from '../server/curriculum.mjs';
const out = 'docs/v660/minh-chung';
mkdirSync(out, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4196 } });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
  page = await context.newPage();
const errors = [],
  results = [],
  bodies = [],
  mock = mockGateway(database());
let turn = 0,
  release = null,
  hold = false;
page.on('pageerror', (e) => errors.push(e.message));
const pass = (s) => {
  results.push(s);
  console.log('PASS:', s);
};
await page.route('**/api/*', async (route) => {
  const req = route.request(),
    body = req.postDataJSON(),
    request = new Request(req.url(), {
      method: 'POST',
      headers: await req.allHeaders(),
      body: JSON.stringify(body),
    });
  let response;
  if (req.url().endsWith('/learning')) response = await handleLearning(request, env, mock.fetcher);
  else {
    if (!body.check) bodies.push(body);
    if (hold && !body.check)
      await new Promise((resolve) => {
        release = resolve;
      });
    response = await handleChat(
      request,
      { ...env, AI_PROVIDER: 'gemini' },
      async (url, options) => {
        if (url === env.LEARNING_GATEWAY_URL) return mock.fetcher(url, options);
        if (body.check) return provider('OK');
        if (body.mode === 'image-read' || body.mode === 'image-confirm')
          return provider({
            transcription: body.transcription || 'Thu gọn 2x nhân 3x.',
            figureLabels: [],
            givens: ['Thu gọn 2x nhân 3x.'],
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
            classification: 'ambiguous',
            question: `Lượt ${turn}: em xác định yêu cầu nào cần làm trước?`,
            feedback: 'Hãy đọc từng dữ kiện và nêu cách hiểu của em.',
            givens: 'Dữ kiện theo đề đã xác nhận.',
            goal: 'Xác định yêu cầu của đề.',
            bridge: 'Đối chiếu điều kiện và kiến thức bài đang học.',
          }),
        );
      },
    );
  }
  try {
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: await response.text(),
    });
  } catch (e) {
    if (!/closed|cancel|intercept|handled/i.test(e.message)) throw e;
  }
});
const home = async () => {
  await page.getByRole('button', { name: 'Về trang chủ', exact: true }).click();
  await page.locator('.chapter-card').first().waitFor();
};
const enter = async (i) => {
  await page.locator('.chapter-card').nth(i).getByRole('button').click();
  await page.getByLabel('Chọn bài học').waitFor();
};
async function connect() {
  await page.locator('.topbar').getByRole('button', { name: 'Kết nối AI', exact: true }).click();
  await page.getByLabel('Mã truy cập', { exact: true }).fill(env.ACCESS_CODE);
  await page.getByRole('button', { name: 'Kiểm tra & kết nối' }).click();
  await page.getByLabel('Lớp đang học (Nếu bạn là GV thì để trống)', { exact: true }).fill('8A');
  await page.getByRole('button', { name: 'Hoàn tất thông tin & bắt đầu học' }).click();
}
try {
  await page.goto('http://127.0.0.1:4196');
  assert.equal(await page.title(), 'TƯ DUY TOÁN HỌC 8');
  assert.equal(await page.locator('.chapter-card').count(), 5);
  await page.screenshot({
    animations: 'disabled',
    path: out + '/01-trang-chu.png',
    fullPage: true,
  });
  for (let i = 0; i < 5; i++) {
    await enter(i);
    assert.equal(
      await page.getByLabel('Chọn bài học').inputValue(),
      curriculum.chapters[i].units[0],
    );
    assert.equal(
      await page.getByLabel('Chọn bài học').locator('option').count(),
      curriculum.chapters[i].units.length,
    );
    await home();
  }
  pass('5 thẻ mở không gian thật; tên và 34 mục bài/ôn tập đúng dữ liệu chương trình.');
  await enter(0);
  await connect();
  for (let i = 0; i < 5; i++) {
    if (i) {
      await home();
      await enter(i);
    }
    const e = curriculum.exercises.find((e) => e.chapterId === `c${i + 1}`);
    await page.locator('.curriculum-bank .exercise-card').first().click();
    assert.equal(await page.locator('#problem').inputValue(), e.problem);
    await page.getByRole('button', { name: 'Gửi', exact: true }).click();
    await page.locator('.working').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.querySelector('#problem')?.value === '');
    assert.equal(bodies.at(-1).chapterId, e.chapterId);
    assert.equal(bodies.at(-1).lessonId, e.lessonId);
    assert.equal(bodies.at(-1).problemId, e.id);
    await page.locator('.current-question p').waitFor();
    assert.match(await page.locator('.current-question p').textContent(), /Lượt \d+/);
    await page.screenshot({
      animations: 'disabled',
      path: out + `/0${i + 2}-chuong-${i + 1}.png`,
      fullPage: true,
    });
  }
  pass(
    'Cả 5 chương gửi câu thật trong trình duyệt qua handler máy chủ; Gemini được mô phỏng, chương/bài/đề khớp.',
  );
  await home();
  await enter(0);
  assert.match(await page.locator('main').textContent(), /Lượt 1/);
  await page.locator('#problem').fill('Bản nháp riêng Chương I');
  await home();
  await enter(4);
  assert.equal(await page.locator('#problem').inputValue(), '');
  await page.goBack();
  await page.locator('.chapter-card').first().waitFor();
  await page.goBack();
  await page.locator('#problem').waitFor();
  assert.equal(await page.locator('#problem').inputValue(), 'Bản nháp riêng Chương I');
  await page.reload();
  await page.locator('#problem').waitFor();
  assert.equal(await page.locator('#problem').inputValue(), 'Bản nháp riêng Chương I');
  assert.match(await page.locator('main').textContent(), /Lượt 1/);
  pass('Đổi chương, Back và tải lại khôi phục đúng hội thoại/bản nháp của chương.');
  // Access code is intentionally memory-only and must be re-entered after reload.
  await page.locator('.topbar').getByRole('button', { name: 'Kết nối AI', exact: true }).click();
  await page.getByLabel('Mã truy cập', { exact: true }).fill(env.ACCESS_CODE);
  await page.getByRole('button', { name: 'Kiểm tra & kết nối' }).click();
  await page.getByRole('button', { name: 'Hoàn tất thông tin & bắt đầu học' }).click();
  hold = true;
  await page.locator('#problem').fill('Em cần kiểm tra một bước đang làm.');
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await page.waitForFunction(() => !!document.querySelector('.working'));
  await home();
  await enter(4);
  assert(release);
  release();
  hold = false;
  await page.waitForTimeout(200);
  assert(!/Lượt 6/.test(await page.locator('main').textContent()));
  await home();
  await enter(0);
  assert.equal(await page.locator('#problem').inputValue(), 'Em cần kiểm tra một bước đang làm.');
  pass(
    'Chuyển chương lúc đang chờ hủy yêu cầu; phản hồi muộn không trộn phiên, giữ câu chưa gửi xong.',
  );
  await home();
  await enter(4);
  await page.getByLabel('Chọn bài học').selectOption('l19');
  await page.locator('.curriculum-bank .exercise-card').first().click();
  const lab = page.locator('.statistics-lab');
  await lab.locator('textarea').fill('2020;10\n2022;15\n2025;5');
  await lab.getByLabel('Đơn vị', { exact: true }).fill('học sinh');
  assert.equal(await lab.locator('svg[role=img]').count(), 0);
  await lab.getByRole('button', { name: 'Xác nhận dữ liệu và vẽ' }).click();
  await lab.locator('svg[role=img]').waitFor();
  await lab.getByLabel('Loại biểu đồ').selectOption('line');
  const points = await lab.locator('polyline').getAttribute('points');
  const xs = points.split(' ').map((p) => Number(p.split(',')[0]));
  assert(Math.abs((xs[1] - xs[0]) / (xs[2] - xs[0]) - 0.4) < 1e-8);
  await lab.getByLabel('Loại biểu đồ').selectOption('pie');
  assert.equal(await lab.locator('path').count(), 3);
  const download = page.waitForEvent('download');
  await lab.getByRole('button', { name: 'Tải SVG' }).click();
  assert.equal((await download).suggestedFilename(), 'bieu-do.svg');
  await page.screenshot({ animations: 'disabled', path: out + '/07-bieu-do.png', fullPage: true });
  pass(
    'Bảng→xác nhận→cột/đoạn thẳng/quạt tròn; mốc 2020–2022–2025 có tỉ lệ ngang đúng, tải SVG được.',
  );
  await home();
  await enter(0);
  await page.getByRole('button', { name: 'Bài mới', exact: true }).click();
  await page
    .getByLabel('Chọn ảnh đề toán', { exact: true })
    .setInputFiles('tests/fixtures/images/clear-ratio.png');
  await page.getByRole('button', { name: 'Đọc đề từ ảnh', exact: true }).click();
  await page.getByLabel('Bản phiên âm đề', { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel('Bản phiên âm đề', { exact: true }).inputValue(),
    'Thu gọn 2x nhân 3x.',
  );
  await page.getByLabel('Bản phiên âm đề', { exact: true }).fill('Thu gọn 2x nhân 4x.');
  await page.getByRole('button', { name: 'Xác nhận đề và bắt đầu học', exact: true }).click();
  await page
    .getByRole('button', { name: 'Xác nhận đề và bắt đầu học', exact: true })
    .waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('.image-problem button:disabled'));
  await page.getByRole('button', { name: 'Xác nhận đề và bắt đầu học', exact: true }).click();
  await page.waitForFunction(() =>
    document.querySelector('.current-question')?.textContent.includes('Lượt'),
  );
  assert(!bodies.some((b) => b.chapterId === 'c1' && b.mode === 'image-diagram'));
  pass(
    'Ảnh đại số: chọn tệp, đọc bằng phản hồi OCR mô phỏng, sửa văn bản, xác nhận lại và học; không gọi dựng hình.',
  );
  await page.setViewportSize({ width: 375, height: 812 });
  for (let i = 0; i < 5; i++) {
    await home();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await enter(i);
    assert(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `overflow c${i + 1}`,
    );
  }
  await page.getByLabel('Chọn bài học').selectOption('l19');
  await page.locator('#problem').waitFor();
  await page
    .locator('.statistics-lab')
    .getByRole('button', { name: 'Xác nhận dữ liệu và vẽ' })
    .click();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ animations: 'disabled', path: out + '/08-mobile.png', fullPage: true });
  await home();
  await page.getByRole('button', { name: 'Đổi giao diện sáng tối' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.screenshot({
    animations: 'disabled',
    path: out + '/09-trang-chu-toi-mobile.png',
    fullPage: true,
  });
  pass('375 px: cả 5 chương, công thức, bảng và biểu đồ không gây tràn trang; sáng/tối hoạt động.');
  assert.deepEqual(errors, []);
  pass('Không có lỗi JavaScript trình duyệt.');
} finally {
  await page
    .screenshot({ animations: 'disabled', path: out + '/last-screen.png', fullPage: true })
    .catch(() => {});
  writeFileSync(
    out + '/ui-results.json',
    JSON.stringify(
      {
        environment: 'Chromium local; handlers real; external AI and Google simulated',
        results,
        errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
  await server.httpServer.close();
}
