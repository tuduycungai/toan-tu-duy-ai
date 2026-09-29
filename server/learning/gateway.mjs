import { createHmac, randomUUID } from 'node:crypto';
import { configured, failure } from './security.mjs';
export async function gateway(env, op, args, fetcher = fetch) {
  if (!configured(env))
    throw failure(
      'Giáo viên chưa kết nối Google Sheets. Em vẫn có thể học không ghi dữ liệu.',
      503,
    );
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(env.LEARNING_GATEWAY_URL))
    throw failure('URL lưu trữ chưa hợp lệ.', 503);
  const payload = JSON.stringify({ op, args }),
    timestamp = Date.now(),
    nonce = randomUUID();
  const signature = createHmac('sha256', env.LEARNING_GATEWAY_SECRET)
    .update(timestamp + '.' + nonce + '.' + payload)
    .digest('hex');
  let response;
  try {
    response = await fetcher(env.LEARNING_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp, nonce, payload, signature }),
      signal: AbortSignal.timeout(op === 'context' ? 6000 : op === 'ingest' ? 6500 : 12000),
      redirect: 'follow',
    });
  } catch {
    throw failure('Kết nối lưu trữ gián đoạn; chưa xác nhận đã lưu.', 503);
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw failure('Google chưa xác nhận dữ liệu. Giáo viên kiểm tra triển khai Apps Script.', 503);
  }
  if (!response.ok || data?.ok !== true || data?.nonce !== nonce)
    throw failure(
      data?.error || 'Chưa nhận được xác nhận lưu.',
      [400, 401, 403, 404, 409, 429, 503].includes(data?.status) ? data.status : 503,
    );
  if (
    [
      'ingest',
      'survey',
      'report',
      'teacher:review',
      'teacher:publish',
      'teacher:rollback',
    ].includes(op) &&
    data.data?.saved !== true
  )
    throw failure('Chưa nhận được xác nhận ghi bản ghi.', 503);
  return data.data;
}
