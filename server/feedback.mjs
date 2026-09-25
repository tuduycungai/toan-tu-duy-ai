// Additive feedback endpoint. The Gemini handler and its contract remain unchanged.
import { timingSafeEqual, createHash } from 'node:crypto';
import config from '../lib/form-config.json' with { type: 'json' };
const submitted = new Map();
export function feedbackPayload(data) {
  if (!data || typeof data !== 'object') throw Error('Thiếu dữ liệu đánh giá.');
  const result = {};
  for (const [key, max] of [
    ['name', 120],
    ['school', 180],
    ['email', 180],
    ['comment', 3000],
  ]) {
    if (typeof data[key] !== 'string' || data[key].length > max)
      throw Error('Thông tin chưa hợp lệ hoặc quá dài.');
    result[key] = data[key].trim();
  }
  if (!result.name || !result.school || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email))
    throw Error('Hãy kiểm tra họ tên, trường và email.');
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5)
    throw Error('Em hãy chọn mức độ hài lòng từ 1 đến 5.');
  if (data.consent !== true) throw Error('Em cần đồng ý gửi thông tin và đánh giá cho giáo viên.');
  result.rating = String(data.rating);
  return new URLSearchParams(Object.entries(config.fields).map(([k, v]) => [v, result[k]]));
}
export async function handleFeedback(request, env, fetcher = fetch) {
  const reply = (data, status = 200) =>
    Response.json(data, {
      status,
      headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  if (request.method !== 'POST') return reply({ error: 'Chỉ hỗ trợ POST.' }, 405);
  if (request.headers.get('sec-fetch-site') === 'cross-site')
    return reply({ error: 'Yêu cầu không hợp lệ.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json'))
    return reply({ error: 'Cần dữ liệu JSON.' }, 415);
  let body;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw Error();
    let raw = '',
      size = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16000) {
        await reader.cancel();
        return reply({ error: 'Nội dung quá dài.' }, 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    body = JSON.parse(raw + decoder.decode());
  } catch {
    return reply({ error: 'Không đọc được dữ liệu.' }, 400);
  }
  const expected = (env.ACCESS_CODE?.trim() || 'HOCGIOITOAN').normalize('NFC');
  const given = typeof body?.accessCode === 'string' ? body.accessCode.trim().normalize('NFC') : '';
  const a = Buffer.from(expected),
    b = Buffer.from(given);
  if (expected.length < 10 || a.length !== b.length || !timingSafeEqual(a, b))
    return reply({ error: 'Mã truy cập chưa đúng. Hãy kết nối lại.' }, 401);
  let data;
  try {
    data = feedbackPayload(body);
  } catch (e) {
    return reply({ error: e.message }, 400);
  }
  if (typeof body.submissionId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(body.submissionId))
    return reply({ error: 'Mã phiên đánh giá chưa hợp lệ.' }, 400);
  for (const [key, value] of submitted) {
    if (Date.now() - value.created > 3600000) submitted.delete(key);
  }
  const id = body.submissionId,
    hash = createHash('sha256').update(data.toString()).digest('hex');
  if (submitted.has(id)) {
    const old = submitted.get(id);
    if (old.hash !== hash)
      return reply({ error: 'Phiên đánh giá đã được xử lý. Hãy mở buổi học mới.' }, 409);
    return reply(await old.promise);
  }
  if (submitted.size >= 1000)
    return reply({ error: 'Đang có nhiều đánh giá. Vui lòng thử lại sau.' }, 429);
  const entry = { created: Date.now(), hash, promise: null };
  entry.promise = (async () => {
    try {
      const r = await fetcher(config.submitUrl + '?hl=en', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data,
        signal: AbortSignal.timeout(15000),
      });
      const html = await r.text();
      // An HTTP 200 alone can be a validation/login page; never treat it as delivery proof.
      const validationForm = /<form[^>]*action=["'][^"']*formResponse|name=["']entry\./i.test(html);
      const confirmation =
        !validationForm &&
        /Your response has been recorded|Câu trả lời của bạn đã được ghi lại|Đã ghi lại câu trả lời của bạn/i.test(
          html,
        );
      if (r.ok && confirmation)
        return {
          ok: true,
          delivery: 'confirmed',
          message: 'Google Forms đã xác nhận ghi nhận đánh giá. Cảm ơn em!',
        };
      return {
        ok: false,
        delivery: 'unconfirmed',
        message:
          'Chưa nhận được xác nhận từ Google Forms. Em có thể mở biểu mẫu để kiểm tra và gửi trực tiếp nếu cần.',
      };
    } catch {
      return {
        ok: false,
        delivery: 'unconfirmed',
        message:
          'Kết nối gián đoạn; chưa xác nhận được đánh giá đã lưu. Không tự gửi lại để tránh trùng dữ liệu.',
      };
    }
  })();
  submitted.set(id, entry);
  return reply(await entry.promise);
}
