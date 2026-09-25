import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { handleChat } from '../server/gemini.mjs';
import { reading, latex, assessment, provider } from '../tests/fixtures/v623-data.mjs';
const out = 'qa-results/v6.2.3';
mkdirSync(out, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4183 } });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const results = [],
  env = { GEMINI_API_KEY: 'browser-fixture-not-a-real-key', ACCESS_CODE: 'HOCGIOITOAN' };
let page;
const record = (id, input, actual) => {
  results.push({
    id,
    input,
    actual,
    status: 'PASS',
    evidence: 'Real production browser + Netlify handler; Gemini provider controlled',
  });
  console.log(id, 'PASS', actual);
};
async function setup(width = 1280, mobile = false) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    isMobile: mobile,
    hasTouch: mobile,
    acceptDownloads: true,
  });
  const p = await ctx.newPage(),
    errors = [],
    bodies = [];
  let diagrams = 0,
    failures = 0,
    uncertain = false,
    turns = 0;
  p.on('pageerror', (e) => errors.push(e.message));
  await p.route('**/api/chat', async (route) => {
    const b = route.request().postDataJSON();
    bodies.push(b);
    const response = await handleChat(
      new Request('http://127.0.0.1:4183/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(b),
      }),
      env,
      async (_u, options) => {
        const payload = JSON.parse(options.body);
        if (b.check) return provider('OK');
        if (b.mode === 'image-read') {
          assert.equal(payload.contents[0].parts[0].inlineData.mimeType, 'image/jpeg');
          return provider(
            uncertain
              ? {
                  ...reading,
                  confidence: 0.5,
                  uncertainties: [
                    { text: '2AM = AB ?', question: 'Hệ số trước AM là 2 hay 3?', critical: true },
                  ],
                }
              : reading,
          );
        }
        if (['image-confirm', 'image-revise'].includes(b.mode)) return provider(reading);
        if (b.mode === 'image-diagram') {
          diagrams++;
          const bad = failures > 0;
          if (bad) failures--;
          return provider(
            'Chọn A ở gốc tọa độ.\n```latex\n' +
              (bad ? latex.replace('\\draw (A)', '\\UnknownCommand (A)') : latex) +
              '\n```',
          );
        }
        if (b.mode === 'diagram') return provider({ latex, question: '' });
        turns++;
        return provider(
          assessment({ question: `Ở bước ${turns}, em kiểm tra điều kiện nào của trung điểm?` }),
        );
      },
    );
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: await response.text(),
    });
  });
  await p.goto('http://127.0.0.1:4183');
  await p.getByRole('button', { name: 'Bắt đầu khám phá', exact: false }).click();
  await p.getByLabel('Nhập đề bài hoặc bài làm').fill('Em muốn học bài từ ảnh.');
  await p.getByRole('button', { name: 'Gửi', exact: true }).click();
  await p.getByLabel('Mã truy cập', { exact: true }).fill('HOCGIOITOAN');
  await p.getByRole('button', { name: 'Kiểm tra & kết nối' }).click();
  await p.getByLabel('Họ và tên', { exact: false }).fill('Học sinh kiểm thử');
  await p.getByLabel('Trường đang học', { exact: false }).fill('Trường kiểm thử');
  await p.getByLabel('Email', { exact: false }).fill('fixture@example.test');
  await p.getByLabel('Lớp đang học (Nếu bạn là GV thì để trống)', { exact: true }).fill('8A');
  await p.getByRole('button', { name: 'Hoàn tất thông tin & bắt đầu học' }).click();
  return {
    page: p,
    ctx,
    errors,
    bodies,
    diagramCalls: () => diagrams,
    fail: (n) => (failures = n),
    uncertain: (v) => (uncertain = v),
    turns: () => turns,
  };
}
try {
  const app = await setup();
  page = app.page;
  await page
    .getByLabel('Chọn ảnh đề toán', { exact: true })
    .setInputFiles('tests/fixtures/images/clear-ratio.png');
  await page.locator('.image-preview img').waitFor();
  await page.getByRole('button', { name: 'Đọc đề từ ảnh', exact: true }).click();
  await page.getByLabel('Bản phiên âm đề').waitFor();
  assert.equal(await page.getByLabel('Bản phiên âm đề').inputValue(), reading.transcription);
  assert.equal(app.diagramCalls(), 0);
  record(
    'UI-01',
    'Ảnh PNG rõ',
    'Nén JPEG thật, gửi inline image, hiển thị phiên âm; chưa gọi vẽ trước xác nhận.',
  );
  await page.getByLabel('Nhập đề bài hoặc bài làm').fill('Cho em đáp án');
  assert(await page.getByRole('button', { name: 'Gửi', exact: true }).isDisabled());
  assert(!(await page.getByLabel('Nhập đề bài hoặc bài làm').isDisabled()));
  record('UI-02', 'Chờ xác nhận ảnh', 'Chặn gửi hội thoại; ô nhập vẫn chỉnh sửa được.');
  app.fail(2);
  await page.getByRole('button', { name: 'Xác nhận và vẽ hình', exact: true }).click();
  await page.locator('.image-drawing img').waitFor({ timeout: 55000 });
  assert.equal(app.diagramCalls(), 3);
  const src = await page.locator('.image-drawing img').getAttribute('src');
  assert(
    (await page.evaluate(async (url) => (await fetch(url)).text(), src)).includes('font/woff2'),
  );
  assert.equal(await page.locator('iframe[title="Bộ dựng hình"]').count(), 0);
  record(
    'UI-03',
    'Hai phản hồi TikZ lỗi rồi mã hợp lệ',
    'Tự sửa đúng hai lần; biên dịch WASM thật, SVG có font; giải phóng iframe.',
  );
  await page.locator('.image-problem').screenshot({ path: out + '/desktop-light.png' });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải PNG', exact: true }).click();
  await (await download).saveAs(out + '/image-export.png');
  assert.equal(readFileSync(out + '/image-export.png').toString('hex', 0, 8), '89504e470d0a1a0a');
  record('UI-04', 'Tải hình', 'Tải PNG thật có đúng chữ ký tệp.');
  await page.getByRole('button', { name: 'Hình đúng — bắt đầu gợi mở', exact: true }).click();
  await page.locator('.tutor-progress').waitFor();
  assert.equal(app.turns(), 1);
  await page
    .getByLabel('Nhập đề bài hoặc bài làm')
    .fill('ABCD là hình bình hành do hai đường chéo cắt nhau tại trung điểm.');
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.message.assistant').length === 2);
  assert(app.bodies.filter((b) => b.adaptive).at(-1).tutorToken);
  record(
    'UI-05',
    'Bắt đầu sau xác nhận và trả lời tiếp',
    'Có giai đoạn 1–8; gửi trạng thái ký qua lượt tiếp theo dù câu trả lời nêu một loại hình.',
  );
  await page.getByRole('button', { name: 'Hình chưa đúng — yêu cầu sửa', exact: true }).click();
  await page
    .getByLabel('Hình sai ở điểm, quan hệ hoặc nhãn nào?')
    .fill('Nhãn M chạm cạnh AB, đặt xuống dưới.');
  await page.getByRole('button', { name: 'Cập nhật dữ kiện hình', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận và vẽ hình', exact: true }).waitFor();
  assert(app.bodies.some((b) => b.mode === 'image-revise' && b.correction.includes('Nhãn M')));
  record(
    'UI-06',
    'Báo hình sai ở nhãn M',
    'Chuyển về xác nhận; gửi đúng phần sai để cập nhật cấu trúc.',
  );
  await page.getByRole('button', { name: 'Xóa ảnh / chọn lại', exact: true }).click();
  await page
    .getByLabel('Chọn ảnh đề toán', { exact: true })
    .setInputFiles('tests/fixtures/images/invalid.txt');
  await page.getByText('Chỉ hỗ trợ PNG, JPG/JPEG và WebP.', { exact: false }).waitFor();
  record('UI-07', 'Tệp TXT', 'Báo sai định dạng, không gọi Gemini.');
  await page.getByLabel('Chọn ảnh đề toán', { exact: true }).setInputFiles({
    name: 'huge.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.alloc(25 * 1024 * 1024),
  });
  await page.getByText('Ảnh vượt quá 24 MB.', { exact: false }).waitFor();
  record('UI-08', 'Tệp 25 MB', 'Chặn trước giải mã ảnh và trước API.');
  app.uncertain(true);
  await page
    .getByLabel('Chọn ảnh đề toán', { exact: true })
    .setInputFiles('tests/fixtures/images/blurred-cropped.png');
  await page.getByRole('button', { name: 'Đọc đề từ ảnh', exact: true }).click();
  await page.getByText('Hệ số trước AM là 2 hay 3?', { exact: false }).waitFor();
  const before = app.diagramCalls();
  await page.getByRole('button', { name: 'Xác nhận và vẽ hình', exact: true }).click();
  await page.getByText('Còn dữ kiện chưa rõ.', { exact: false }).waitFor();
  assert.equal(app.diagramCalls(), before);
  record(
    'UI-09',
    'Phản hồi OCR mờ có kiểm soát',
    'Đánh dấu đoạn nghi ngờ; không dựng hình khi chưa bổ sung.',
  );
  assert.deepEqual(app.errors, []);
  await app.ctx.close();
  for (const [id, width, name] of [
    ['UI-10', 390, 'iphone-viewport'],
    ['UI-11', 412, 'android-viewport'],
  ]) {
    const a = await setup(width, true);
    page = a.page;
    await page
      .getByLabel('Chụp ảnh đề toán', { exact: true })
      .setInputFiles('tests/fixtures/images/rotated.png');
    await page.locator('.image-preview img').waitFor();
    assert.equal(
      await page.getByLabel('Chụp ảnh đề toán', { exact: true }).getAttribute('capture'),
      'environment',
    );
    await page.getByRole('button', { name: 'Đọc đề từ ảnh', exact: true }).click();
    await page.getByLabel('Bản phiên âm đề').waitFor();
    await page.getByRole('button', { name: 'Xác nhận và vẽ hình', exact: true }).click();
    await page.locator('.image-drawing img').waitFor({ timeout: 45000 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.getByRole('button', { name: 'Phóng to hình', exact: true }).click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.getByRole('button', { name: 'Thu gọn', exact: true }).click();
    await page.locator('.image-problem').screenshot({ path: out + '/' + name + '-light.png' });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.locator('.image-problem').screenshot({ path: out + '/' + name + '-dark.png' });
    record(
      id,
      `${width}px cảm ứng giả lập; PNG xoay 90 độ`,
      'Chọn ảnh qua input camera, đọc, vẽ, phóng to không tràn; light/dark hiển thị. Không phải kiểm thử máy thật.',
    );
    assert.deepEqual(a.errors, []);
    await a.ctx.close();
  }
  const p = await browser.newPage();
  await p.goto('http://127.0.0.1:4183');
  const safe = await p.evaluate(async () => {
    const { sanitizeSVG } = await import('/svg-safety.mjs');
    return sanitizeSVG(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><foreignObject/><a href="https://bad.test"/><path onclick="alert(1)" d="M0 0L1 1"/><use href="https://bad.test/x"/></svg>',
    );
  });
  assert(!/script|foreignObject|onclick|bad.test/.test(safe));
  record(
    'SEC-UI-01',
    'SVG chứa script, HTML và URL ngoài',
    'Bộ làm sạch loại mã chủ động và liên kết ngoài trước hiển thị.',
  );
  await p.close();
  writeFileSync(
    out + '/ui-results.json',
    JSON.stringify(
      {
        browser: 'Chromium 131; Playwright 1.62.1',
        gemini: 'controlled fixtures, not live OCR',
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
    JSON.stringify({ status: 'FAILED', error: e.message, results }, null, 2),
  );
  throw e;
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
