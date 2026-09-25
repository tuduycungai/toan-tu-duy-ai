import config from './form-config.json';
export type FeedbackData = {
  name: string;
  school: string;
  email: string;
  rating: number;
  comment: string;
  consent: boolean;
  submissionId: string;
};
export function formLink(data: FeedbackData) {
  const url = new URL(config.viewUrl);
  url.searchParams.set('usp', 'pp_url');
  for (const [key, entry] of Object.entries(config.fields))
    url.searchParams.set(entry, String(data[key as keyof FeedbackData]));
  return url.toString();
}
export async function submitFeedback(data: FeedbackData, accessCode: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const r = await fetch('/.netlify/functions/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, accessCode }),
      signal: controller.signal,
    });
    if (!r.headers.get('content-type')?.includes('application/json'))
      throw Error('Dịch vụ đánh giá chưa sẵn sàng. Em có thể mở Google Form bên dưới.');
    const d = await r.json();
    if (!r.ok) throw Error(d.error || 'Chưa gửi được đánh giá.');
    return d as { ok: boolean; delivery: 'confirmed' | 'unconfirmed'; message: string };
  } finally {
    clearTimeout(timer);
  }
}
