import { handleFeature, IMAGE_MODES } from './feature-api.mjs';
import { DIAGRAM_PROMPT, parseDiagram } from './diagram-policy.mjs';
import { timingSafeEqual } from 'node:crypto';
import { instructions } from './policy.mjs';
import { asksForAnswer, guidedFallback, guardTutorOutput } from './strict-tutor.mjs';
export function validMessages(value) {
  if (!Array.isArray(value) || !value.length || value.length > 39) return false;
  let n = 0;
  for (let i = 0; i < value.length; i++) {
    const m = value[i];
    if (
      !m ||
      m.role !== (i % 2 === 0 ? 'user' : 'assistant') ||
      typeof m.content !== 'string' ||
      !m.content.trim() ||
      m.content.length > 12000
    )
      return false;
    n += m.content.length;
  }
  return value.at(-1).role === 'user' && n <= 60000;
}
export async function handleChat(request, env, fetcher = fetch) {
  const reply = (v, status = 200) =>
    Response.json(v, {
      status,
      headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  if (request.method !== 'POST') return reply({ error: 'Chỉ hỗ trợ gửi yêu cầu POST.' }, 405);
  if (request.headers.get('sec-fetch-site') === 'cross-site')
    return reply({ error: 'Yêu cầu không hợp lệ.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json'))
    return reply({ error: 'Định dạng yêu cầu không hợp lệ.' }, 415);
  const apiKey = env.GEMINI_API_KEY?.trim(),
    access = (env.ACCESS_CODE?.trim() || 'HOCGIOITOAN').normalize('NFC');
  if (!apiKey || !access || access.length < 10)
    return reply(
      {
        error:
          'Giáo viên cần kiểm tra GEMINI_API_KEY trong Netlify. Nếu tự đặt ACCESS_CODE, mã phải có ít nhất 10 ký tự. Sau đó triển khai lại.',
      },
      503,
    );
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: 'Thiếu nội dung.' }, 400);
  let raw = '',
    size = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 3900000) {
        await reader.cancel();
        return reply({ error: 'Nội dung quá dài. Hãy mở bài mới.' }, 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  } catch {
    return reply({ error: 'Không đọc được nội dung.' }, 400);
  }
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply({ error: 'Dữ liệu không hợp lệ.' }, 400);
  }
  if (!body || typeof body !== 'object') return reply({ error: 'Dữ liệu không hợp lệ.' }, 400);
  const provided =
    typeof body.accessCode === 'string' ? body.accessCode.trim().normalize('NFC') : '';
  const a = Buffer.from(provided),
    b = Buffer.from(access);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    return reply({ error: 'Mã truy cập chưa đúng. Hãy hỏi giáo viên để nhận mã.' }, 401);
  if (!IMAGE_MODES.includes(body.mode) && size > 250000)
    return reply({ error: 'Nội dung quá dài. Hãy mở bài mới.' }, 413);
  const check = body.check === true;
  const featureImage = IMAGE_MODES.includes(body.mode);
  const diagram = body.mode === 'diagram';
  if (
    !check &&
    !featureImage &&
    (!(diagram
      ? Array.isArray(body.messages) &&
        body.messages.length === 1 &&
        body.messages[0]?.role === 'user' &&
        typeof body.messages[0].content === 'string' &&
        body.messages[0].content.length > 0 &&
        body.messages[0].content.length <= 26000
      : validMessages(body.messages)) ||
      !['guide', 'review', 'compare', 'diagram'].includes(body.mode))
  )
    return reply({ error: 'Hội thoại không hợp lệ hoặc quá dài. Hãy mở bài mới.' }, 400);
  const model = env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  if (!/^gemini-[a-zA-Z0-9.-]+$/.test(model))
    return reply({ error: 'GEMINI_MODEL chưa hợp lệ. Giáo viên cần kiểm tra cấu hình.' }, 503);
  if (!check && (featureImage || body.adaptive === true))
    return handleFeature(body, env, model, fetcher, null, request);
  if (!check && !diagram && asksForAnswer(body.messages))
    return reply({ text: guidedFallback(body.messages), model });
  const contents = check
    ? [{ role: 'user', parts: [{ text: 'Reply with OK only.' }] }]
    : body.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
  const generationConfig = { maxOutputTokens: check ? 128 : diagram ? 6000 : 2400 };
  if (diagram) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = {
      type: 'OBJECT',
      properties: { latex: { type: 'STRING' }, question: { type: 'STRING' } },
      required: ['latex', 'question'],
    };
  }
  if (model === 'gemini-2.5-flash')
    generationConfig.thinkingConfig = { thinkingBudget: check ? 0 : 512 };
  try {
    const response = await fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: check
                  ? 'Reply with OK only.'
                  : diagram
                    ? DIAGRAM_PROMPT
                    : instructions(body.mode, body.messages),
              },
            ],
          },
          contents,
          generationConfig,
        }),
        signal: AbortSignal.timeout(22000),
      },
    );
    if (!response.ok) {
      const s = response.status;
      await response.body?.cancel();
      return reply(
        {
          error:
            s === 429
              ? 'Gemini đã đạt giới hạn lượt gọi hoặc hạn mức. Hãy đợi và thử lại; giáo viên kiểm tra hạn mức trong Google AI Studio.'
              : s === 400 || s === 401 || s === 403
                ? 'Gemini không chấp nhận khóa API hoặc cấu hình. Giáo viên kiểm tra khóa, quyền truy cập và mô hình.'
                : s === 404
                  ? 'Không tìm thấy mô hình. Giáo viên cần đổi GEMINI_MODEL sang mã đang được Google cung cấp.'
                  : 'Gemini tạm thời chưa phản hồi. Hãy thử lại.',
        },
        s === 429 ? 429 : 502,
      );
    }
    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (data.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY')
      return reply(
        {
          error:
            'Gemini chưa thể phản hồi nội dung này. Hãy diễn đạt lại đề toán và bỏ thông tin cá nhân.',
        },
        422,
      );
    if (candidate?.finishReason !== 'STOP')
      return reply(
        { error: 'Gemini chưa trả lời trọn vẹn. Hãy gửi nội dung ngắn hơn hoặc thử lại.' },
        502,
      );
    const text = (candidate.content?.parts ?? [])
      .filter((p) => typeof p.text === 'string' && !p.thought)
      .map((p) => p.text)
      .join('\n');
    if (!text.trim()) return reply({ error: 'Gemini chưa trả về văn bản. Hãy thử lại.' }, 502);
    if (diagram) {
      try {
        return reply({ ...parseDiagram(text), model });
      } catch (e) {
        return reply(
          {
            error: 'Chưa nhận được mã hình hợp lệ. Em thử vẽ lại nhé.',
            code: 'DIAGRAM_FORMAT',
            repairable: true,
            detail: e.message,
          },
          502,
        );
      }
    }
    return reply(
      check ? { ok: true, model } : { text: guardTutorOutput(text, body.messages), model },
    );
  } catch {
    return reply(
      {
        error:
          'Kết nối Gemini gián đoạn hoặc quá thời gian chờ. Nội dung được giữ lại để em thử gửi lần nữa.',
      },
      504,
    );
  }
}
