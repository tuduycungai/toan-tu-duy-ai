// Real Chromium UI and image-export checks. AI / feedback requests are explicitly mocked.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright'),
  root = fileURLToPath(new URL('../', import.meta.url)),
  out = root + 'research/v5-checks',
  port = process.env.UI_TEST_PORT || '3185';
await mkdir(out, { recursive: true });
const server = spawn(process.execPath, ['scripts/start.mjs'], {
  cwd: root,
  env: { ...process.env, PORT: port },
  stdio: 'pipe',
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));
let browser;
const target =
  'Cho hình bình hành ABCD tâm O, E và F theo thứ tự là trung điểm của OD và OB. Chứng minh rằng AE // CF.';
const results = [],
  report = (name, extra = {}) => results.push({ name, status: 'pass', ...extra });
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch('http://127.0.0.1:' + port)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      ...JSON.parse(process.env.CHROMIUM_EXTRA_ARGS || '[]'),
    ],
  });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
      acceptDownloads: true,
    }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let chatCalls = [];
  await page.route('**/api/chat', async (route) => {
    const data = route.request().postDataJSON();
    chatCalls.push(data);
    await route.fulfill({
      json: data.check
        ? { ok: true, model: 'gemini-2.5-flash' }
        : {
            text: '[SO_DO]\nDU_KIEN: ABCD là hình bình hành; O là giao hai đường chéo; E, F là trung điểm OD, OB.\nMUC_TIEU: Chứng minh AE ∥ CF.\nCAU_NOI: Đối chiếu định nghĩa trung điểm với hai đường chéo.\nBUOC_TIEP: Giải thích vị trí và độ dài các đoạn quanh O.\n[/SO_DO]\nThao tác tư duy: Phân tích — đọc một quan hệ từ giả thiết.\nGợi mở: Điểm E nằm trên đoạn nào và vì sao em biết điều đó?',
            model: 'gemini-2.5-flash',
          },
    });
  });
  await page.route('**/.netlify/functions/feedback', (route) =>
    route.fulfill({ json: { ok: true, delivery: 'confirmed' } }),
  );
  await page.goto('http://127.0.0.1:' + port);
  await page.getByRole('button', { name: 'Bắt đầu khám phá', exact: false }).click();
  const input = page.getByLabel('Nhập đề bài hoặc bài làm');
  const preview = async (q) => {
    await input.fill(q);
    await page.getByRole('button', { name: 'Xem hình & lý thuyết', exact: true }).click();
  };
  await preview(target);
  await page.locator('[data-point="E"]').waitFor({ state: 'attached' });
  assert.equal(
    await page.locator('[data-geometry-status]').getAttribute('data-geometry-status'),
    'verified',
  );
  const p = await page
    .locator('[data-point]')
    .evaluateAll((es) =>
      Object.fromEntries(
        es.map((e) => [e.dataset.point, { x: Number(e.dataset.x), y: Number(e.dataset.y) }]),
      ),
    );
  assert(Math.abs(p.E.x - (p.O.x + p.D.x) / 2) < 1e-7);
  assert(Math.abs(p.F.y - (p.O.y + p.B.y) / 2) < 1e-7);
  assert.equal(chatCalls.length, 0);
  report('Read and construct screenshot problem without API');
  await page.locator('.current-problem').screenshot({ path: out + '/01-hinh-binh-hanh.png' });
  await page.screenshot({ path: out + '/02-desktop-light.png', fullPage: true });
  // Labels may not overlap each other; check rendered boxes, not just coordinates.
  const labels = await page.locator('.current-problem .problem-label').evaluateAll((es) =>
    es.map((e) => {
      const b = e.getBoundingClientRect();
      return { text: e.textContent, x: b.x, y: b.y, w: b.width, h: b.height };
    }),
  );
  for (let i = 0; i < labels.length; i++)
    for (let j = i + 1; j < labels.length; j++) {
      const a = labels[i],
        b = labels[j];
      assert(
        !(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y),
        'Overlapping labels ' + a.text + '/' + b.text,
      );
    }
  report('Seven point labels do not overlap');
  const pngEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải PNG', exact: true }).click();
  const png = await pngEvent;
  await png.saveAs(out + '/03-export.png');
  const pngBytes = await readFile(out + '/03-export.png');
  assert.equal(pngBytes.toString('hex', 0, 8), '89504e470d0a1a0a');
  assert.equal(pngBytes.readUInt32BE(16), 1680);
  report('PNG export is a real 1680 × 1215 image');
  await page.locator('.figure-more summary').click();
  const svgEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải SVG', exact: true }).click();
  await (await svgEvent).saveAs(out + '/04-export.svg');
  const svg = await readFile(out + '/04-export.svg', 'utf8');
  assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert(svg.includes('data-point="E"'));
  assert(svg.includes('stroke='));
  report('SVG export contains geometry, labels and embedded styles');
  const beforeZoom = await page.locator('.current-problem .problem-svg').boundingBox();
  await page.getByLabel('Phóng lớn hình', { exact: true }).click();
  const afterZoom = await page.locator('.current-problem .problem-svg').boundingBox();
  assert(afterZoom.height > beforeZoom.height * 1.15, 'Zoom must increase rendered geometry size');
  assert.match(await page.locator('.figure-more-tools').innerText(), /125%/);
  await page.getByLabel('Thu nhỏ hình', { exact: true }).click();
  await page.getByRole('button', { name: 'Vẽ lại hình', exact: true }).first().click();
  assert.equal(await page.locator('[data-point="O"]').count(), 1);
  report('Zoom and redraw controls work');
  await page.getByRole('button', { name: 'Chuyển giao diện tối' }).click();
  await page.locator('.current-problem').screenshot({ path: out + '/05-dark-geometry.png' });
  const theory = page.getByRole('region', { name: 'Lý thuyết dự kiến dùng' });
  assert.equal(await theory.count(), 1);
  assert.equal(await theory.locator('details').first().getAttribute('open'), null);
  await theory.locator('summary').first().click();
  await theory.locator('.theory-card summary').first().click();
  assert(await theory.innerText().then((s) => s.includes('Điều kiện:')));
  report('Theory is visible, expandable and collapsed by default');
  await preview(
    'Cho hình bình hành ABCD. E và F theo thứ tự là trung điểm của OD và OB. Chứng minh AE // CF.',
  );
  assert.equal(
    await page.locator('[data-geometry-status]').getAttribute('data-geometry-status'),
    'provisional',
  );
  await page.locator('.geometry-assumptions summary').click();
  await page.locator('.current-problem').screenshot({ path: out + '/06-provisional.png' });
  await page.getByLabel('Chỉnh đề và giả định dựng hình').fill(target);
  await page.getByRole('button', { name: 'Áp dụng dữ kiện & vẽ lại' }).click();
  assert.equal(
    await page.locator('[data-geometry-status]').getAttribute('data-geometry-status'),
    'verified',
  );
  report('Incomplete problem shows assumptions and can be corrected without API');
  await preview(
    'Cho đường tròn (O) bán kính OA = 3 cm. Kẻ tiếp tuyến d tại A. Chứng minh d vuông góc OA.',
  );
  assert.equal(await page.locator('.problem-circle').count(), 1);
  await page.locator('.current-problem').screenshot({ path: out + '/07-circle.png' });
  report('Circle and tangent render');
  await preview(target);
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await page.getByLabel('Mã truy cập', { exact: true }).fill('HOCGIOITOAN');
  await page.getByRole('button', { name: 'Kiểm tra & kết nối' }).click();
  await page.getByLabel('Họ và tên', { exact: false }).fill('Học sinh kiểm thử');
  await page.getByLabel('Trường đang học', { exact: false }).fill('Trường kiểm thử');
  await page.getByLabel('Email', { exact: false }).fill('test@example.test');
  await page.getByLabel('Lớp đang học (Nếu bạn là GV thì để trống)', { exact: true }).fill('8A');
  await page.getByLabel('Ghi nhớ hồ sơ trên thiết bị này').check();
  await page.getByRole('button', { name: 'Hoàn tất thông tin & bắt đầu học' }).click();
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await page.locator('.message.assistant').waitFor();
  assert(chatCalls.at(-1).messages.at(-1).content.includes('[HO_SO_TU_DUY_V5]'));
  assert(!JSON.stringify(chatCalls).includes('test@example.test'));
  report('Existing chat API contract retained; learner context contains no identity fields', {
    api: 'mocked',
  });
  await page.locator('.learner-panel>summary').click();
  await page.locator('.diagnostic-panel>summary').click();
  const answers = [0, 1, 2, 1];
  for (let i = 0; i < 4; i++) {
    await page.locator('.diagnostic-option input').nth(answers[i]).check();
    await page
      .getByLabel('Vì sao em chọn như vậy?')
      .fill('Em đối chiếu định nghĩa với dữ kiện và điều kiện.');
    await page.getByRole('button', { name: 'Ghi nhận & câu tiếp theo' }).click();
    if (i === 0) assert.equal(await page.getByLabel('Điều chỉnh mức học').inputValue(), 'Cơ bản');
  }
  assert.equal(await page.getByLabel('Điều chỉnh mức học').inputValue(), 'Giỏi');
  await page.getByLabel('Điều chỉnh mức học').selectOption('Khá');
  await page.locator('.learner-panel').screenshot({ path: out + '/08-learner-profile.png' });
  assert.equal(await page.getByLabel('Điều chỉnh mức học').inputValue(), 'Khá');
  report('Four diagnostics classify gradually; manual adjustment works');
  await input.fill('Em chưa biết vì sao.');
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('ai-tutor-learner-v5')).observations.length === 1,
  );
  assert.equal(await page.locator('.past-message').count(), 2);
  report('Follow-up updates evidence and collapses older messages', { api: 'mocked' });
  await page.locator('.creators-footer').screenshot({ path: out + '/09-footer-desktop.png' });
  const footerText = await page.locator('.creators-footer').innerText();
  for (const n of ['NGƯỜI SÁNG TẠO', 'Phan Trí Dũng', 'Phạm Nam Hải', 'GV. Trần Ngọc Phú Sang'])
    assert(footerText.includes(n));
  report('Creator footer has all exact required names');
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    assert(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      'Horizontal overflow ' + width,
    );
    await page.locator('.current-problem').screenshot({ path: out + `/10-mobile-${width}.png` });
    report('Responsive layout at ' + width + ' px');
  }
  await page.locator('.creators-footer').screenshot({ path: out + '/11-footer-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: out + '/12-desktop-chat.png', fullPage: true });
  assert.deepEqual(errors, []);
  report('No JavaScript errors in browser');
  await page.reload();
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem('ai-tutor-learner-v5')).level),
    'Khá',
  );
  report('Opt-in learner persistence survives reload');
  await writeFile(
    out + '/browser-results.json',
    JSON.stringify(
      {
        date: new Date().toISOString(),
        browser: await browser.version(),
        ai: 'mocked; no live Gemini request',
        results,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({ status: 'pass', checks: results.length, ai: 'mocked', output: out }),
  );
} catch (e) {
  await writeFile(
    out + '/browser-results.json',
    JSON.stringify({ status: 'fail', error: String(e), results, serverLog }, null, 2),
  );
  throw e;
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
