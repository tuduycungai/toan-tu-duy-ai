import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { handleChat } from '../server/chat.mjs';
import { handleLearning, handleTeacher } from '../server/learning/api.mjs';
import { studentRequest } from '../server/strict-tutor.mjs';
import { database, env, mockGateway } from '../tests/v650-fixture.mjs';
import { assessment, problem, provider } from '../tests/fixtures/v623-data.mjs';
const out = 'qa-results/v6.5.0';
mkdirSync(out, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4195 } });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
const db = database(),
  mock = mockGateway(db),
  errors = [],
  results = [];
const pass = (text) => {
  results.push(text);
  console.log('PASS:', text);
};
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on('pageerror', (e) => errors.push(e.message));
let turns = 0;
await page.route('**/api/*', async (route) => {
  const browserRequest = route.request(),
    headers = await browserRequest.allHeaders(),
    body = browserRequest.postDataJSON();
  const request = new Request(browserRequest.url(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  let response;
  if (browserRequest.url().endsWith('/learning'))
    response = await handleLearning(request, env, mock.fetcher);
  else if (browserRequest.url().endsWith('/teacher'))
    response = await handleTeacher(request, env, mock.fetcher);
  else
    response = await handleChat(
      request,
      { ...env, AI_PROVIDER: 'gemini' },
      async (url, options) => {
        if (url === env.LEARNING_GATEWAY_URL) return mock.fetcher(url, options);
        assert.match(url, /generativelanguage.googleapis.com/);
        if (body.check) return provider('OK');
        turns++;
        const quote = studentRequest(body.messages);
        return provider(
          assessment({
            stage: 4,
            classification:
              turns === 1 ? 'ambiguous' : turns >= 3 ? 'wrong_theorem' : 'correct_complete',
            question: `Ở bước ${turns}, em kiểm tra điều kiện của trung điểm như thế nào?`,
            error: turns >= 3 ? 'Cần kiểm tra điều kiện vị trí.' : '',
            accepted:
              turns === 2 ? [{ claim: 'AM = MB', reason: 'Cộng đoạn', studentQuote: quote }] : [],
          }),
        );
      },
    );
  await route.fulfill({
    status: response.status,
    headers: Object.fromEntries(response.headers),
    body: await response.text(),
  });
});
try {
  await page.goto('http://127.0.0.1:4195');
  assert.equal(Object.keys(db.state.Students).length, 0);
  await page.getByRole('button', { name: 'Bộ nhớ học tập', exact: true }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Bật lưu tiến bộ', exact: true }).isDisabled(),
    true,
  );
  await page.keyboard.press('Escape');
  pass('Không tự ghi dữ liệu; nút đồng ý mặc định chưa chọn.');
  await page.locator('.topbar').getByRole('button', { name: 'Kết nối AI', exact: true }).click();
  await page.getByLabel('Mã truy cập', { exact: true }).fill('HOCGIOITOAN');
  await page.getByRole('button', { name: 'Kiểm tra & kết nối' }).click();
  await page.getByLabel('Lớp đang học (Nếu bạn là GV thì để trống)', { exact: true }).fill('8A');
  await page.getByRole('button', { name: 'Hoàn tất thông tin & bắt đầu học' }).click();
  pass('Học được khi bỏ trống họ tên, trường và email.');
  await page.getByRole('button', { name: 'Bộ nhớ học tập', exact: true }).click();
  await page.getByLabel('Em đồng ý lưu dữ liệu học tập theo nội dung trên.').check();
  await page.getByLabel('Nếu cần sự đồng ý của cha mẹ/người giám hộ', { exact: false }).check();
  await page.getByRole('button', { name: 'Bật lưu tiến bộ', exact: true }).click();
  await page.getByLabel('Mã khôi phục mới').waitFor();
  const recovery = await page.getByLabel('Mã khôi phục mới').inputValue();
  assert.match(recovery, /^s_/);
  assert.equal(Object.keys(db.state.Students).length, 1);
  assert((await context.cookies()).some((c) => c.name === 'tutor_learner' && c.httpOnly));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => {
    const r = document.querySelector('.memory-dialog')?.getBoundingClientRect();
    return r && r.y >= 0 && r.bottom <= innerHeight;
  });
  const bounds = await page.locator('.memory-dialog').boundingBox();
  assert(bounds.y >= 0 && bounds.y + bounds.height <= 845);
  await page.screenshot({ path: out + '/dong-y-mobile.png' });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  pass('Đồng ý tạo mã riêng, cookie HttpOnly; hộp thoại không tràn ngang ở 390 px.');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Bắt đầu khám phá', exact: false }).click();
  for (const text of [
    problem,
    'Vì AB = AM + MB và AB = 2AM nên AM = MB.',
    'Hai cạnh bằng nhau nên là hình bình hành.',
    'Hai đường chéo bằng nhau nên là hình chữ nhật.',
  ]) {
    await page.locator('#problem').fill(text);
    await page.getByRole('button', { name: 'Gửi', exact: true }).click();
    await page.locator('.working').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.querySelector('#problem')?.value === '');
  }
  assert.equal(Object.keys(db.state.Turns).length, 3);
  assert.match(await page.locator('.memory-status').textContent(), /đã xác nhận/);
  assert.equal(Object.keys(db.state.ReviewQueue).length, 1);
  await page.screenshot({ path: out + '/hoc-co-bo-nho.png', fullPage: true });
  pass(
    'Chat thật trong trình duyệt gọi hai lớp máy chủ mô phỏng, lưu 3 lượt, tạo hàng đợi từ lỗi lặp.',
  );
  await page.getByRole('button', { name: 'Bộ nhớ học tập', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất dữ liệu của em', exact: true }).click();
  assert.equal((await download).suggestedFilename(), 'du-lieu-hoc-tap.json');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Khảo sát đánh giá ứng dụng', exact: true }).last().click();
  await page.getByLabel('4 sao — Hài lòng', { exact: true }).check();
  await page.getByLabel('Tôi đồng ý gửi đánh giá theo mã học sinh', { exact: false }).check();
  await page.getByRole('button', { name: 'Gửi khảo sát', exact: true }).click();
  await page.getByText('Google Sheets đã xác nhận lưu đánh giá theo mã học sinh.', { exact: true }).waitFor();
  assert.equal(Object.keys(db.state.Surveys).length, 1);
  assert(!JSON.stringify(db.state.Surveys).includes('email'));
  await page.getByRole('button', { name: 'Tiếp tục sử dụng', exact: true }).click();
  pass('Xuất dữ liệu tải được tệp JSON; khảo sát vào Sheets không yêu cầu tên/email.');
  await page.getByRole('button', { name: 'Bộ nhớ học tập', exact: true }).click();
  await page.getByRole('button', { name: 'Ngừng ghi dữ liệu', exact: true }).click();
  await page.getByText('Máy chủ đã xác nhận ngừng ghi.', { exact: false }).last().waitFor();
  assert.equal(Object.values(db.state.Students)[0].consent, false);
  await page.keyboard.press('Escape');
  pass('Nút ngừng ghi cập nhật phía máy chủ và giữ buổi học hoạt động.');
  await page.goto('http://127.0.0.1:4195/?teacher=1');
  await page.getByLabel('Khóa quản trị riêng').fill(env.TEACHER_ADMIN_KEY);
  await page.getByRole('button', { name: 'Đăng nhập giáo viên' }).click();
  await page.getByRole('heading', { name: /Hàng đợi cần kiểm duyệt/ }).waitFor();
  await page
    .getByLabel('Mẫu gợi mở khái quát, không kèm thông tin học sinh')
    .fill('Em hãy đối chiếu vị trí điểm và các độ dài trong định nghĩa trung điểm.');
  await page
    .getByLabel('Câu kiểm tra bước tiếp theo')
    .fill('Nếu điểm ở ngoài đoạn, điều kiện bằng nhau có đủ không?');
  await page.getByLabel('Tôi đã kiểm tra toán học', { exact: false }).check();
  await page.getByRole('button', { name: 'Duyệt vào kho chung' }).click();
  await page.getByText('Đã ghi nhận quyết định.').waitFor();
  assert.equal(Object.keys(db.state.Versions).length, 1);
  await page.screenshot({ path: out + '/giao-vien-desktop.png', fullPage: true });
  await page.getByLabel('Phiên bản', { exact: false }).selectOption('base');
  await page.getByRole('button', { name: 'Dùng lại phiên bản đã chọn' }).click();
  await page.getByText('Đã chuyển kho đang dùng.', { exact: false }).waitFor();
  assert.equal(db.state.Settings.active.versionId, 'base');
  pass('Giáo viên duyệt mẫu, phiên bản mới xuất hiện; rollback về base hoạt động.');
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await page.getByLabel('Khóa quản trị riêng').waitFor();
  await page.goto('http://127.0.0.1:4195/');
  await page.getByRole('button', { name: 'Bộ nhớ học tập', exact: true }).click();
  await page.getByRole('button', { name: 'Yêu cầu xóa dữ liệu' }).waitFor();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Yêu cầu xóa dữ liệu' }).click();
  await page.getByText('Máy chủ đã xác nhận xóa dữ liệu', { exact: false }).waitFor();
  assert.equal(Object.keys(db.state.Students).length, 0);
  assert.equal(Object.keys(db.state.Turns).length, 0);
  assert.equal(Object.keys(db.state.Versions).length, 1);
  pass(
    'Xóa dữ liệu theo danh tính xác thực; mẫu giáo viên đã khái quát hóa còn trong lịch sử phiên bản.',
  );
  assert.deepEqual(errors, []);
  writeFileSync(
    out + '/ui-results.json',
    JSON.stringify(
      {
        passed: results.length,
        results,
        errors,
        scope:
          'Chromium desktop/mobile viewport; all Google and AI responses mocked; no live credentials used.',
      },
      null,
      2,
    ),
  );
} finally {
  await page.screenshot({ path: out + '/last-screen.png', fullPage: true }).catch(() => {});
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
