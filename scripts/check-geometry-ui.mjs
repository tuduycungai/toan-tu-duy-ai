// Local browser regression; never sends real pupil data to Gemini or Google Forms.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { loadTS } from '../tests/load-ts.mjs';
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url)),
  port = process.env.GEOMETRY_UI_PORT || '3026',
  output = process.env.GEOMETRY_UI_OUTPUT || root + 'research/geometry-checks';
await mkdir(output, { recursive: true });
const { lessons } = await loadTS('lib/learning.ts');
const { diagramId } = await loadTS('lib/diagram-interpretation.ts');
const { problemParts, normalizeProblem } = await loadTS('lib/problem-diagram.ts');
const unfamiliar =
  'ABCD là một hình bình hành. Đặt K ở chính giữa cạnh AB, còn I ở chính giữa cạnh CD. Chứng minh AI = CK.';
let normalizationCalls = 0;
const problem =
  'Cho hình bình hành ABCD, gọi O là giao điểm của hai đường chéo. Trên AB lấy điểm K, trên CD lấy điểm I sao cho AK bằng CI. Chứng minh rằng ba điểm K, O, I thẳng hàng và các đường thẳng AC, BD, KI đồng quy.';
const server = spawn('npm', ['start'], {
  cwd: root,
  env: { ...process.env, PORT: port },
  stdio: 'ignore',
});
let browser;
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`http://localhost:${port}`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote'],
  });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1080 },
      reducedMotion: 'reduce',
    }),
    errors = [],
    calls = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/api/chat', async (route) => {
    const b = route.request().postDataJSON();
    calls.push(b);
    let semantic = '';
    if (!b.check && b.messages.at(-1).content.includes('[CHUAN_HOA_HINH]')) {
      normalizationCalls++;
      if (normalizationCalls === 1)
        semantic =
          '\n[DE_HINH_HOC]' +
          JSON.stringify({
            v: 1,
            id: diagramId(unfamiliar),
            facts: [
              {
                quote: normalizeProblem(problemParts(unfamiliar).given),
                text: 'Cho hình bình hành ABCD. K là trung điểm của AB. I là trung điểm của CD.',
              },
            ],
          }) +
          '[/DE_HINH_HOC]';
    }
    await route.fulfill({
      json: b.check
        ? { ok: true, model: 'gemini-2.5-flash' }
        : {
            text:
              '[SO_DO]\nDU_KIEN: Các giả thiết trong đề bài.\nMUC_TIEU: Xác định điều kiện cần dùng.\nCAU_NOI: Dấu hiệu nhận biết hình bình hành.\nBUOC_TIEP: Nêu một căn cứ từ giả thiết.\n[/SO_DO]\n[HINH_VE]{"status":"ok","I":[2,3],"points":"malformed"}[/HINH_VE]\nThao tác tư duy: Phân tích — tách các dữ kiện đã biết.\nGợi mở: Em hãy nêu một quan hệ đã cho và căn cứ của quan hệ ấy?' +
              semantic,
            model: 'gemini-2.5-flash',
          },
    });
  });
  await page.route('**/.netlify/functions/feedback', (r) => r.abort());
  await page.route('https://docs.google.com/**', (r) => r.abort());
  const button = (n) => page.getByRole('button', { name: n, exact: true }),
    newChat = async () => {
      await button('Bài mới').first().click();
    },
    send = async (q) => {
      await page.getByLabel('Nhập đề bài hoặc bài làm').fill(q);
      await button('Gửi').click();
      await page.locator('.message.assistant').last().waitFor();
      await page.locator('.thinking').waitFor({ state: 'hidden' });
    };
  await page.goto(`http://localhost:${port}`);
  await button('Kết nối AI').click();
  await page.getByLabel('Mã truy cập', { exact: true }).fill('HOCGIOITOAN');
  await button('Kiểm tra & kết nối').click();
  await page.getByLabel('Họ và tên', { exact: false }).fill('Học sinh kiểm thử');
  await page.getByLabel('Trường đang học', { exact: false }).fill('Trường kiểm thử');
  await page.getByLabel('Email', { exact: false }).fill('student@example.com');
  await page.getByRole('button', { name: 'Hoàn tất thông tin & bắt đầu học' }).click();
  await button('Bắt đầu khám phá').click();
  for (const l of lessons) {
    await newChat();
    await send(l.problem);
    const card = page.locator('.problem-figure');
    assert.equal(await card.count(), 1, l.id);
    assert.equal(await card.locator('svg.problem-svg').count(), 1);
    assert.equal(await page.locator('.figure-notice').count(), 0);
    assert(
      !(await page
        .locator('.message.assistant')
        .innerText()
        .then((t) => /malformed|HINH_VE/.test(t))),
    );
    await card.scrollIntoViewIfNeeded();
    await card.screenshot({ path: output + '/sample-' + l.id + '.png' });
  }
  // Exact follow-up screenshot: a common Vietnamese midpoint phrase must render normally.
  await newChat();
  await send(
    'Cho hình bình hành ABCD . Gọi K , I lần lượt là trung điểm các cạnh AB và CD . Chứng minh: AI=CK',
  );
  const midpointCard = page.locator('.problem-figure');
  assert.equal(await midpointCard.count(), 1);
  assert.equal(await page.locator('.figure-notice').count(), 0);
  await midpointCard.scrollIntoViewIfNeeded();
  await midpointCard.screenshot({ path: output + '/midpoint-wording-light.png' });
  const mp = await midpointCard
    .locator('[data-point]')
    .evaluateAll((nodes) =>
      Object.fromEntries(
        nodes.map((n) => [n.dataset.point, { x: Number(n.dataset.x), y: Number(n.dataset.y) }]),
      ),
    );
  const mDist = (a, b) => Math.hypot(mp[a].x - mp[b].x, mp[a].y - mp[b].y);
  assert(Math.abs(mDist('A', 'K') - mDist('B', 'K')) < 1e-7);
  assert(Math.abs(mDist('C', 'I') - mDist('D', 'I')) < 1e-7);
  assert(Math.abs(mDist('A', 'I') - mDist('C', 'K')) < 1e-7);
  const midpointDownload = page.waitForEvent('download');
  await button('Tải TikZ (.tex)').click();
  await (await midpointDownload).saveAs(output + '/midpoint-wording.tex');
  await button('Chuyển giao diện tối').click();
  await midpointCard.screenshot({ path: output + '/midpoint-wording-dark.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await midpointCard.scrollIntoViewIfNeeded();
  await midpointCard.screenshot({ path: output + '/midpoint-wording-mobile.png' });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.setViewportSize({ width: 1440, height: 1080 });
  await button('Chuyển giao diện sáng').click();
  const contextProblem =
    'Cho hình bình hành ABCD. AC cắt BD tại O. Qua điểm O vẽ đường thẳng d song song với AB. d cắt hai cạnh AD tại M. d cắt cạnh BC tại N. Trên AB lấy điểm P, trên CD lấy điểm Q, sao cho AP = CQ. Gọi AC cắt PQ tại I. Chứng minh: Ba đường thẳng AC, MN, PQ đồng quy.';
  await newChat();
  await send(contextProblem);
  const contextCard = page.locator('.problem-figure');
  assert.equal(await contextCard.count(), 1);
  assert.equal(await page.locator('.figure-notice').count(), 0);
  assert.equal(await contextCard.locator('[data-line="d"]').count(), 1);
  assert.equal(await contextCard.locator('[data-point-group="O,I"]').count(), 1);
  await contextCard.scrollIntoViewIfNeeded();
  await contextCard.screenshot({ path: output + '/named-line-light.png' });
  await button('Chuyển giao diện tối').click();
  await contextCard.screenshot({ path: output + '/named-line-dark.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await contextCard.scrollIntoViewIfNeeded();
  await contextCard.screenshot({ path: output + '/named-line-mobile.png' });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.setViewportSize({ width: 1440, height: 1080 });
  await button('Chuyển giao diện sáng').click();
  const lineDownload = page.waitForEvent('download');
  await button('Tải TikZ (.tex)').click();
  await (await lineDownload).saveAs(output + '/named-line.tex');
  await newChat();
  await send(unfamiliar);
  const interpreted = page.locator('.problem-figure');
  assert.equal(await interpreted.count(), 1);
  assert((await interpreted.innerText()).includes('Giả thiết AI đọc từ đề'));
  assert(
    !(await page
      .locator('.message.assistant')
      .innerText()
      .then((t) => t.includes('DE_HINH_HOC') || t.includes('facts'))),
  );
  await interpreted.scrollIntoViewIfNeeded();
  await interpreted.screenshot({ path: output + '/ai-normalization.png' });
  const nBefore = await page.locator('.message.assistant').count();
  await button('Gợi ý thêm').click();
  await page.waitForFunction(
    (n) => document.querySelectorAll('.message.assistant').length > n,
    nBefore,
  );
  assert.equal(
    await page.locator('.message.assistant').last().locator('.problem-figure').count(),
    1,
    'Retain validated interpretation across followup without another block',
  );
  await newChat();
  await send(problem);
  let card = page.locator('.problem-figure');
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: output + '/ak-ci-light.png' });
  const points = await page
    .locator('.problem-svg [data-point]')
    .evaluateAll((nodes) =>
      Object.fromEntries(
        nodes.map((n) => [n.dataset.point, { x: Number(n.dataset.x), y: Number(n.dataset.y) }]),
      ),
    );
  const dist = (a, b) => Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y);
  assert(Math.abs(dist('A', 'K') - dist('C', 'I')) < 1e-7);
  assert(Math.abs(dist('A', 'K') - dist('D', 'I')) > 0.1);
  assert(Math.abs(dist('K', 'O') + dist('O', 'I') - dist('K', 'I')) < 1e-7);
  await button('Ẩn nét phụ').click();
  assert.equal(await card.locator('.problem-aux').count(), 0);
  await button('Hiện nét phụ').click();
  assert((await card.locator('.problem-aux').count()) >= 3);
  const downloadPromise = page.waitForEvent('download');
  await button('Tải TikZ (.tex)').click();
  const download = await downloadPromise;
  await download.saveAs(output + '/screenshot-problem.tex');
  const tex = await readFile(output + '/screenshot-problem.tex', 'utf8');
  assert(tex.includes('at (5.06,3.5)'));
  assert(!tex.includes('malformed'));
  await button('Phóng to').click();
  await page.getByRole('dialog').waitFor();
  assert.equal(await page.getByRole('dialog').locator('svg.problem-svg').count(), 1);
  await page.keyboard.press('Escape');
  await button('Chuyển giao diện tối').click();
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: output + '/ak-ci-dark.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await card.scrollIntoViewIfNeeded();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await card.screenshot({ path: output + '/ak-ci-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1080 });
  const count = await page.locator('.message.assistant').count();
  await button('Vẽ lại hình').click();
  await page.waitForFunction(
    (n) => document.querySelectorAll('.message.assistant').length > n,
    count,
  );
  assert.equal(await page.locator('.problem-figure').count(), 2);
  await send('Cho hình vuông MNPQ có MN = 4 cm. Chứng minh MP = NQ.');
  const last = page.locator('.message.assistant').last();
  assert.equal(await last.locator('[data-point="M"]').count(), 1);
  assert.equal(await last.locator('[data-point="I"]').count(), 0);
  await send('Cho hình bình hành ABCD, K là phân giác góc ABC. Chứng minh AK = CI.');
  await page.locator('.message.assistant').last().locator('.figure-notice').waitFor();
  assert.equal(
    await page.locator('.message.assistant').last().locator('.problem-figure').count(),
    0,
  );
  for (const b of calls.filter((c) => !c.check)) {
    assert.deepEqual(Object.keys(b).sort(), ['accessCode', 'messages', 'mode']);
    assert.equal(b.accessCode, 'HOCGIOITOAN');
    for (const m of b.messages) assert.deepEqual(Object.keys(m).sort(), ['content', 'role']);
    assert(!JSON.stringify(b).includes('student@example.com'));
  }
  assert.deepEqual(errors, []);
  await writeFile(
    output + '/browser-result.json',
    JSON.stringify(
      {
        status: 'passed',
        samples: 6,
        midpointWordingScreenshot: true,
        namedLineContext: true,
        coincidentPointLabels: true,
        normalization: 'mocked; accepted with complete source coverage',
        akEqualsCi: true,
        kOiCollinear: true,
        wrongModelGeometryIgnored: true,
        tikzDownload: true,
        lightDarkMobile: true,
        apiContractUnchanged: true,
        gemini: 'mocked',
        feedback: 'blocked',
      },
      null,
      2,
    ),
  );
  console.log(
    'PASS geometry UI: named line context; O/I shared label; AI normalization and followup; exact midpoint wording screenshot; 6 examples; screenshot AK = CI; incorrect model metadata ignored; light/dark/mobile; enlarge; auxiliary lines; TikZ; redraw; new-problem isolation; unchanged API payload. Gemini mocked; Forms blocked.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
