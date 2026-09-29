import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
export const digest = (text) => createHash('sha256').update(text).digest('hex');
export const equal = (a, b) =>
  typeof a === 'string' &&
  typeof b === 'string' &&
  Buffer.byteLength(a) === Buffer.byteLength(b) &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const random = () => randomBytes(32).toString('base64url');
export const failure = (message, status = 400) => Object.assign(Error(message), { status });
export function configured(env) {
  return !!(
    env.LEARNING_GATEWAY_URL &&
    env.LEARNING_GATEWAY_SECRET?.length >= 32 &&
    env.LEARNING_SIGNING_KEY?.length >= 32
  );
}
export function sign(value, secret, purpose, ttl = 86400000) {
  const data = Buffer.from(JSON.stringify({ value, exp: Date.now() + ttl })).toString('base64url');
  return (
    data +
    '.' +
    createHmac('sha256', secret)
      .update(purpose + ':' + data)
      .digest('base64url')
  );
}
export function verify(token, secret, purpose) {
  if (typeof token !== 'string' || token.length > 30000 || !secret)
    throw failure('Mã xác thực không hợp lệ.', 401);
  const [data, mac, extra] = token.split('.');
  if (
    !data ||
    !mac ||
    extra ||
    !equal(
      mac,
      createHmac('sha256', secret)
        .update(purpose + ':' + data)
        .digest('base64url'),
    )
  )
    throw failure('Mã xác thực không hợp lệ.', 401);
  const parsed = JSON.parse(Buffer.from(data, 'base64url').toString());
  if (!Number.isFinite(parsed.exp) || parsed.exp < Date.now())
    throw failure('Mã xác thực hết hạn.', 401);
  return parsed.value;
}
export function cookies(request) {
  return Object.fromEntries(
    (request.headers.get('cookie') || '').split(';').map((s) => s.trim().split('=')),
  );
}
export function learnerAuth(token) {
  if (typeof token !== 'string' || !/^s_[a-f0-9-]{36}\.[\w-]{43}$/.test(token))
    throw failure('Em cần bật ghi nhớ hoặc khôi phục bằng mã riêng.', 401);
  const [studentId, secret] = token.split('.');
  return { studentId, recoveryHash: digest(secret) };
}
export function cookie(request, name, value, seconds = 90 * 86400) {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (
    request.headers.get('sec-fetch-site') === 'cross-site' ||
    (origin && origin !== new URL(request.url).origin)
  )
    throw failure('Yêu cầu khác nguồn bị từ chối.', 403);
}
export async function readJson(request, limit = 40000) {
  if (request.method !== 'POST') throw failure('Chỉ hỗ trợ POST.', 405);
  sameOrigin(request);
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw failure('Cần dữ liệu JSON.', 415);
  const reader = request.body?.getReader();
  if (!reader) throw failure('Thiếu dữ liệu.');
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > limit) {
      await reader.cancel();
      throw failure('Nội dung quá lớn.', 413);
    }
    chunks.push(Buffer.from(value));
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString());
    if (!body || Array.isArray(body) || typeof body !== 'object') throw Error();
    return body;
  } catch {
    throw failure('JSON không hợp lệ.');
  }
}
export function reply(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers },
  });
}
const buckets = new Map();
export function localLimit(request, group, max = 40) {
  const ip = request.headers.get('x-nf-client-connection-ip') || 'local';
  const now = Date.now(),
    key = group + ':' + digest(ip);
  for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
  const b = buckets.get(key) || { count: 0, until: now + 60000 };
  if (++b.count > max || buckets.size > 10000)
    throw failure('Quá nhiều yêu cầu. Hãy đợi một phút.', 429);
  buckets.set(key, b);
}
