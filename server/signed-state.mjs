import {createHmac, timingSafeEqual} from 'node:crypto';

// Purpose-separated authentication, using the existing server secret. No extra env var.
export function seal(value, secret, purpose) {
  const data = Buffer.from(JSON.stringify({v:1, expires:Date.now()+12*3600000, value})).toString('base64url');
  const mac = createHmac('sha256', secret).update('tutor-v623:'+purpose+':'+data).digest('base64url');
  return data+'.'+mac;
}
export function unseal(token, secret, purpose) {
  if(typeof token!=='string'||token.length>110000)throw Error('Trạng thái không hợp lệ. Hãy mở bài mới.');
  const [data,signature,...extra]=token.split('.');
  if(!data||!signature||extra.length)throw Error('Thiếu trạng thái đã xác thực.');
  const expected=createHmac('sha256',secret).update('tutor-v623:'+purpose+':'+data).digest();
  const actual=Buffer.from(signature,'base64url');
  if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error('Trạng thái bị thay đổi. Hãy mở bài mới.');
  const parsed=JSON.parse(Buffer.from(data,'base64url').toString('utf8'));
  if(parsed.v!==1||!Number.isFinite(parsed.expires)||parsed.expires<Date.now())throw Error('Phiên học đã hết hạn. Hãy mở bài mới.');
  return parsed.value;
}
