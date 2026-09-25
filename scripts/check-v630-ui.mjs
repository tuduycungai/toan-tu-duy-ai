import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { handleChat } from '../server/chat.mjs';
import { problem, latex, assessment } from '../tests/fixtures/v623-data.mjs';
const out = 'qa-results/v6.3.0';
mkdirSync(out, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4185 } });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const env = {
  AI_PROVIDER: 'openai',
  OPENAI_API_KEY: 'browser-fixture-no-live-key',
  ACCESS_CODE: 'HOCGIOITOAN',
};
const results = [],
  errors = [];
const record = (name, details) => {
  results.push({ name, status: 'PASS', details });
  console.log(name, 'PASS');
};
const completion = (value) =>
  Response.json({
    status: 'completed',
    output: [
      {
        type: 'message',
        role: 'assistant',
        content: [
          { type: 'output_text', text: typeof value === 'string' ? value : JSON.stringify(value) },
        ],
      },
    ],
  });
let p;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  p = await context.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  let drawings = 0,
    turns = 0,
    quota = false;
  const bodies = [];
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
      async (url, o) => {
        assert.equal(url, 'https://api.openai.com/v1/responses');
        const body = JSON.parse(o.body);
        assert.equal(body.model, 'gpt-6-luna');
        if (b.check) return completion('OK');
        if (b.mode === 'diagram') {
          drawings++;
          return completion({ latex, question: '' });
        }
        if (quota) return Response.json({ error: { code: 'insufficient_quota' } }, { status: 429 });
        turns++;
        return completion(
          assessment({
            stage: 1,
            question: `Ở lượt ${turns}, em nêu căn cứ để xác định vị trí của M nhé?`,
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
  await p.goto('http://127.0.0.1:4185');
  await p.locator('.topbar').getByRole('button', { name: 'Kết nối AI', exact: true }).click();
  await p.getByText('Giáo viên: lấy API và chọn mô hình', { exact: true }).click();
  await p.locator('.connection-dialog').screenshot({ path: out + '/ket-noi-openai.png' });
  assert.match(await p.locator('.connection-dialog').textContent(), /OpenAI API tính phí riêng/);
  await p.getByLabel('Mã truy cập', { exact: true }).fill('HOCGIOITOAN');
  await p.getByRole('button', { name: 'Kiểm tra & kết nối' }).click();
  await p.getByLabel('Họ và tên', { exact: false }).fill('Học sinh kiểm thử');
  await p.getByLabel('Trường đang học', { exact: false }).fill('Trường kiểm thử');
  await p.getByLabel('Email', { exact: false }).fill('test@example.test');
  await p.getByLabel('Lớp đang học (Nếu bạn là GV thì để trống)', { exact: true }).fill('8A');
  await p.getByRole('button', { name: 'Hoàn tất thông tin & bắt đầu học' }).click();
  await p.getByRole('button', { name: 'Bắt đầu khám phá', exact: false }).click();
  await p.locator('#problem').fill(problem);
  await p.getByRole('button', { name: 'Xem hình & lý thuyết', exact: true }).click();
  if (
    await p.getByRole('button', { name: 'Dựng hình khác bằng AI (cần API)', exact: true }).count()
  ) {
    assert.equal(drawings, 0);
    assert((await p.locator('.current-problem svg.problem-svg').count()) > 0);
    record('UI630-01', 'Hình cục bộ không gọi API.');
    await p.getByRole('button', { name: 'Dựng hình khác bằng AI (cần API)', exact: true }).click();
  }
  await p.locator('.current-problem img.tikz-result').waitFor({ timeout: 60000 });
  await p.locator('.current-problem img.tikz-result').evaluate((img) => img.decode());
  assert.equal(drawings, 1);
  let src = await p.locator('.current-problem img.tikz-result').getAttribute('src');
  record('UI630-02', 'OpenAI adapter trả TikZ hợp lệ; biên dịch TeX thật ra SVG.');
  for (const answer of ['Em nhận thấy M thuộc đoạn AB.', 'AB = 2AM nên AM = MB.']) {
    await p.locator('#problem').fill(answer);
    await p.getByRole('button', { name: 'Gửi', exact: true }).click();
    await p.locator('.working').waitFor({ state: 'hidden' });
    assert.equal(drawings, 1);
    assert.equal(await p.locator('.current-problem img.tikz-result').getAttribute('src'), src);
  }
  record('UI630-03', 'Hai câu trả lời giữ nguyên SVG và không tạo yêu cầu diagram mới.');
  await p.locator('.followups').getByRole('button', { name: 'Vẽ lại hình', exact: true }).click();
  await p.waitForFunction(
    () => !document.querySelector('.current-problem [role="status"]'),
    {},
    { timeout: 60000 },
  );
  assert.equal(drawings, 2);
  src = await p.locator('.current-problem img.tikz-result').getAttribute('src');
  await p.locator('#problem').fill('Thầy giúp em kiểm tra căn cứ vừa nêu.');
  await p.getByRole('button', { name: 'Gửi', exact: true }).click();
  await p.locator('.working').waitFor({ state: 'hidden' });
  assert.equal(drawings, 2);
  assert.equal(await p.locator('.current-problem img.tikz-result').getAttribute('src'), src);
  record('UI630-04', 'Vẽ lại đúng một lần; lượt chat tiếp theo không vẽ lặp.');
  quota = true;
  await p.locator('#problem').fill('Em cần thêm một gợi ý.');
  await p.getByRole('button', { name: 'Gửi', exact: true }).click();
  await p.locator('.working').waitFor({ state: 'hidden' });
  assert.match(
    await p.locator('.chat-main > .error, .error[role="alert"]').last().textContent(),
    /thanh toán/,
  );
  assert.equal(await p.locator('.topbar .connection.connected').count(), 1);
  assert.equal(drawings, 2);
  assert.equal(await p.locator('.current-problem img.tikz-result').getAttribute('src'), src);
  record('UI630-05', 'Hết hạn mức không đăng xuất mã lớp và không làm mất hình.');
  await p.locator('.current-problem').screenshot({ path: out + '/giu-hinh-desktop.png' });
  // Trigger pagehide so the production session-saving path runs before reload.
  await p.evaluate(() => dispatchEvent(new Event('pagehide')));
  await p.reload();
  await p.locator('.current-problem img.tikz-result').waitFor();
  assert.equal(drawings, 2);
  await p.locator('.current-problem img.tikz-result').evaluate((img) => img.decode());
  record('UI630-06', 'Tải lại cùng tab khôi phục hình mà không gọi API và chưa cần kết nối lại.');
  await p.setViewportSize({ width: 390, height: 844 });
  assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await p.locator('.current-problem').screenshot({ path: out + '/giu-hinh-mobile.png' });
  await p.getByRole('button', { name: 'Chuyển giao diện tối', exact: true }).click();
  await p.locator('.current-problem').screenshot({ path: out + '/giu-hinh-mobile-dark.png' });
  record('UI630-07', 'Hình đã lưu hiển thị ở 390 px, sáng/tối, không tràn ngang.');
  assert(!bodies.some((b) => JSON.stringify(b).includes(env.OPENAI_API_KEY)));
  assert.deepEqual(errors, []);
  record('UI630-08', 'Không có lỗi JavaScript; trình duyệt không nhận khóa API.');
  await p.goto('http://127.0.0.1:4185/huong-dan-api.html');
  assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  record('UI630-09', 'Hướng dẫn API mở được trên màn hình điện thoại.');
  writeFileSync(
    out + '/summary.json',
    JSON.stringify(
      {
        mode: 'OpenAI responses mocked; real UI and TikZ compiler',
        results,
        errors,
        drawings,
        turns,
      },
      null,
      2,
    ),
  );
} catch (e) {
  if (p) await p.screenshot({ path: out + '/failure.png', fullPage: true }).catch(() => {});
  throw e;
} finally {
  await browser.close();
  await server.httpServer.close();
}
