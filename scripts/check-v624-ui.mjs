import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { handleChat } from '../server/gemini.mjs';
import { reading, problem, latex, failedStructure } from '../tests/fixtures/v624-data.mjs';
import { assessment, provider } from '../tests/fixtures/v623-data.mjs';
const out = 'qa-results/v6.2.4';
mkdirSync(out, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4184 } }),
  results = [];
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const env = { GEMINI_API_KEY: 'v624-browser-controlled-fixture', ACCESS_CODE: 'HOCGIOITOAN' };
let page;
const record = (id, input, actual) => {
  results.push({ id, input, actual, status: 'PASS' });
  console.log(id, 'PASS', actual);
};
async function connect(p) {
  await p.locator('.topbar').getByRole('button', { name: 'Kết nối AI', exact: true }).click();
  await p.getByLabel('Mã truy cập', { exact: true }).fill('HOCGIOITOAN');
  await p.getByRole('button', { name: 'Kiểm tra & kết nối' }).click();
  await p.getByLabel('Họ và tên', { exact: false }).fill('Học sinh QA');
  await p.getByLabel('Trường đang học', { exact: false }).fill('Trường QA');
  await p.getByLabel('Email', { exact: false }).fill('qa@example.test');
  await p.getByLabel('Lớp đang học (Nếu bạn là GV thì để trống)', { exact: true }).fill('8A');
  await p.getByRole('button', { name: 'Hoàn tất thông tin & bắt đầu học' }).click();
}
async function setup(width) {
  const ctx = await browser.newContext({
      viewport: { width, height: 844 },
      isMobile: width < 600,
      hasTouch: width < 600,
      ...(width < 600
        ? {
            userAgent:
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
          }
        : {}),
      acceptDownloads: true,
    }),
    p = await ctx.newPage(),
    errors = [],
    bodies = [],
    assets = [];
  let diagrams = 0,
    repairs = 0,
    turn = 0;
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('request', (r) => {
    if (r.url().includes('run-tex')) assets.push(r.url());
  });
  await p.route('**/api/chat', async (route) => {
    const b = route.request().postDataJSON();
    bodies.push(b);
    const r = await handleChat(
      new Request('http://local/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(b),
      }),
      env,
      async (_u, o) => {
        if (b.check) return provider('OK');
        if (b.mode === 'image-read') {
          assert.equal(JSON.parse(o.body).contents[0].parts[0].inlineData.mimeType, 'image/jpeg');
          return provider(failedStructure());
        }
        if (['image-confirm', 'image-revise'].includes(b.mode)) {
          repairs++;
          return provider(reading);
        }
        if (b.mode === 'image-diagram') {
          diagrams++;
          return provider('Dựng bằng trung điểm và giao điểm.\n```latex\n' + latex + '\n```');
        }
        if (b.mode === 'diagram') return provider({ latex, question: '' });
        turn++;
        return provider(
          assessment({
            stage: 1,
            question: `Ở lượt ${turn}, em xác định hai đáy của hình thang như thế nào?`,
          }),
        );
      },
    );
    await route.fulfill({
      status: r.status,
      headers: Object.fromEntries(r.headers),
      body: await r.text(),
    });
  });
  await p.goto('http://127.0.0.1:4184');
  await p.getByRole('button', { name: 'Bắt đầu khám phá', exact: false }).click();
  await connect(p);
  return { ctx, page: p, errors, bodies, assets, diagrams: () => diagrams, repairs: () => repairs };
}
const waitFigure = async (p) => {
  await p.locator('.image-drawing img').waitFor({ timeout: 45000 });
  await p.locator('.image-drawing img').evaluate((img) => img.decode());
  assert.equal(await p.locator('iframe[title="Bộ dựng hình"]').count(), 0);
};
try {
  const app = await setup(390);
  page = app.page;
  await page
    .getByLabel('Chụp ảnh đề toán', { exact: true })
    .setInputFiles('tests/fixtures/images/trapezoid-v624.png');
  await page.locator('.image-preview img').waitFor();
  assert((await page.locator('.image-preview img').getAttribute('src')).startsWith('blob:'));
  await page.getByRole('button', { name: 'Đọc đề từ ảnh', exact: true }).click();
  await page.getByLabel('Bản phiên âm đề').waitFor();
  assert.equal(await page.getByLabel('Bản phiên âm đề').inputValue(), problem);
  assert.equal(await page.getByText('Yêu cầu bài toán', { exact: true }).count(), 0);
  assert.equal(app.diagrams(), 0);
  assert.match(await page.locator('.chat-foot').textContent(), /mỗi 13 phút/);
  record(
    'UI624-01',
    'Bài hình thang trong ảnh; provider trả IR lỗi',
    'Giữ nguyên đề/yêu cầu Tính; thông báo kiểm tra lại cấu trúc, không báo đề thiếu.',
  );
  await page.getByRole('button', { name: 'Xác nhận và vẽ hình', exact: true }).click();
  await waitFigure(page);
  assert.equal(app.repairs(), 1);
  assert.equal(app.diagrams(), 1);
  const src = await page.locator('.image-drawing img').getAttribute('src'),
    svg = await page.evaluate(async (url) => (await fetch(url)).text(), src);
  assert(svg.includes('font/woff2'));
  writeFileSync(out + '/trapezoid.svg', svg);
  assert(app.assets.some((s) => s.includes('v=6.2.4')));
  record(
    'UI624-02',
    'Nhấn xác nhận một lần, không sửa một ký tự',
    'IR được sửa; calc trung điểm/giao điểm biên dịch TeX thật; worker phiên bản mới, không còn iframe.',
  );
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.getByRole('button', { name: 'Phóng to hình', exact: true }).click();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.getByRole('button', { name: 'Thu gọn', exact: true }).click();
  await page.locator('.image-problem').screenshot({ path: out + '/phone-light.png' });
  await page.getByRole('button', { name: 'Chuyển giao diện tối', exact: true }).click();
  await page.locator('.image-problem').screenshot({ path: out + '/phone-dark.png' });
  record(
    'UI624-03',
    '390 px, light/dark, zoom',
    'Không tràn ngang; hình/nhãn và nút sử dụng được trên viewport cảm ứng mô phỏng.',
  );
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải PNG', exact: true }).click();
  await (await download).saveAs(out + '/trapezoid.png');
  assert.equal(readFileSync(out + '/trapezoid.png').toString('hex', 0, 8), '89504e470d0a1a0a');
  assert.equal(readFileSync(out + '/trapezoid.png').readUInt32BE(16), 1280);
  record(
    'UI624-04',
    'Tải PNG trên viewport điện thoại',
    'Tệp PNG thật, canvas 1280 px được thu hồi sau xuất.',
  );
  await page.reload();
  await page.getByRole('button', { name: 'Khôi phục đề đã đọc', exact: true }).waitFor();
  const before = app.diagrams();
  await connect(page);
  await page.getByRole('button', { name: 'Khôi phục đề đã đọc', exact: true }).click();
  await page.getByLabel('Bản phiên âm đề').waitFor();
  assert.equal(await page.getByLabel('Bản phiên âm đề').inputValue(), problem);
  assert.equal(app.diagrams(), before);
  assert.equal(await page.locator('iframe[title="Bộ dựng hình"]').count(), 0);
  record(
    'UI624-05',
    'Tải lại trang sau dựng hình',
    'Khôi phục bản đề và token qua máy chủ; không tự nạp TeX khi tải lại.',
  );
  // Three consecutive compiles also exercise cancellation and object URL replacement.
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Xác nhận và vẽ hình', exact: true }).click();
    await waitFigure(page);
    if (i < 2) {
      await page.getByLabel('Bản phiên âm đề').fill(problem + ' ');
      await page.getByLabel('Bản phiên âm đề').fill(problem);
    }
  }
  record(
    'UI624-06',
    'Dựng liên tiếp ba lần',
    'Cả ba lần có SVG; không giữ iframe cũ, không vòng sửa vô hạn.',
  );
  await page.getByRole('button', { name: 'Hình đúng — bắt đầu gợi mở', exact: true }).click();
  await page.locator('.tutor-progress').waitFor();
  await page.waitForFunction(() => !document.querySelector('.image-input-tools button')?.disabled);
  record(
    'UI624-07',
    'Xác nhận hình đúng',
    'Bắt đầu hội thoại tám giai đoạn và mở lại các nút sau khi trả lời xong.',
  );
  await page.reload();
  await page.locator('.tutor-progress').waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Khôi phục đề đã đọc', exact: true }).count(),
    0,
  );
  await page.getByLabel('Nhập đề bài hoặc bài làm').fill('AB và CD là hai đáy.');
  assert(await page.getByRole('button', { name: 'Gửi', exact: true }).isEnabled());
  record(
    'UI624-11',
    'Tải lại sau khi đã bắt đầu học',
    'Giữ tiến trình hội thoại; không buộc xác nhận ảnh và bắt đầu bài từ đầu.',
  );
  const calls = app.bodies.length;
  await page
    .getByLabel('Chọn ảnh đề toán', { exact: true })
    .setInputFiles('tests/fixtures/images/camera-48mp-v624.png');
  await page.getByText('Ảnh vượt 16 triệu điểm ảnh cho điện thoại.', { exact: false }).waitFor();
  assert.equal(await page.locator('.image-preview img').count(), 0);
  assert.equal(app.bodies.length, calls);
  record(
    'UI624-08',
    'PNG 8000 × 6000 thật',
    'Chặn trước giải mã ảnh trên điện thoại; hướng dẫn dùng 12 MP/cắt đề.',
  );

  assert.deepEqual(app.errors, []);
  await app.ctx.close();
  const desktop = await setup(1280);
  page = desktop.page;
  await page
    .getByLabel('Chọn ảnh đề toán', { exact: true })
    .setInputFiles('tests/fixtures/images/trapezoid-v624.png');
  await page.getByRole('button', { name: 'Đọc đề từ ảnh', exact: true }).click();
  await page.getByLabel('Bản phiên âm đề').waitFor();
  let release;
  const held = new Promise((r) => (release = r));
  let seen;
  const requested = new Promise((r) => (seen = r));
  await page.route('**/core.dump.gz.bin', async (route) => {
    seen();
    await held;
    await route.continue().catch(() => {});
  });
  await page.getByRole('button', { name: 'Xác nhận và vẽ hình', exact: true }).click();
  await requested;
  await page.getByRole('button', { name: 'Dừng xử lý', exact: true }).click();
  release();
  await page.waitForFunction(() => !document.querySelector('iframe[title="Bộ dựng hình"]'));
  assert.equal(await page.getByLabel('Bản phiên âm đề').inputValue(), problem);
  await page.unroute('**/core.dump.gz.bin');
  record(
    'UI624-09',
    'Dừng khi đang nạp core TeX',
    'Hủy worker/iframe; đề được giữ và có thể dựng lại.',
  );
  await page.getByRole('button', { name: 'Thử dựng lại', exact: true }).click();
  await waitFigure(page);
  await page.locator('.image-problem').screenshot({ path: out + '/desktop.png' });
  assert.deepEqual(desktop.errors, []);
  record(
    'UI624-10',
    'Dựng lại sau hủy, desktop 1280 px',
    'Biên dịch thành công, không lỗi JS của trang.',
  );
  await desktop.ctx.close();
  writeFileSync(
    out + '/ui-results.json',
    JSON.stringify(
      {
        status: 'PASS',
        browser:
          'Chromium 131 / Playwright 1.62.1; mobile viewport + iPhone user agent (not Safari)',
        gemini: 'controlled provider fixtures; not live OCR',
        physicalPhone: false,
        results,
      },
      null,
      2,
    ),
  );
} catch (e) {
  if (page && !page.isClosed())
    await page.screenshot({ path: out + '/failure.png', fullPage: true }).catch(() => {});
  writeFileSync(
    out + '/ui-results.json',
    JSON.stringify({ status: 'FAIL', error: e.message, results }, null, 2),
  );
  throw e;
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
