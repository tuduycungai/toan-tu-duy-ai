import { resolveCurriculum, curriculumInstructions, curriculumExerciseSet } from './curriculum.mjs';
import { studentRequest as curriculumStudent } from './strict-tutor.mjs';
import { timingSafeEqual } from 'node:crypto';
import { validMessages } from './gemini.mjs';
import { handleFeature, IMAGE_MODES } from './feature-api.mjs';
import { DIAGRAM_PROMPT, parseDiagram } from './diagram-policy.mjs';
import { instructions } from './policy.mjs';
import { generateScene } from './scene-policy.mjs';
import { asksForAnswer, guidedFallback, guardTutorOutput } from './strict-tutor.mjs';

export const OPENAI_MODELS = ['gpt-6-luna', 'gpt-6-sol', 'gpt-6-astra'];
const reply = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
const fail = (message, status = 502, code = 'OPENAI_ERROR') =>
  Object.assign(new Error(message), { status, code });
const timeoutError = () =>
  fail(
    'OpenAI chưa hoàn tất trong thời gian cho phép. Đề bài và hình đang có vẫn được giữ; em có thể thử vẽ lại.',
    504,
    'OPENAI_TIMEOUT',
  );

export function openAIConfig(env) {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const model = env.OPENAI_MODEL?.trim() || 'gpt-6-luna';
  const effort = env.OPENAI_REASONING_EFFORT?.trim() || 'medium';
  const diagramEffort = env.OPENAI_DIAGRAM_REASONING_EFFORT?.trim() || 'low';
  const timeoutMs = Number(env.OPENAI_TIMEOUT_MS || 50000);
  if (!apiKey)
    throw fail(
      'Giáo viên cần đặt OPENAI_API_KEY trong biến môi trường của máy chủ, rồi triển khai lại. ChatGPT Plus không bao gồm phí API.',
      503,
    );
  if (!OPENAI_MODELS.includes(model))
    throw fail(
      'OPENAI_MODEL chưa được hỗ trợ. Chọn gpt-6-luna, gpt-6-sol hoặc gpt-6-astra trong cấu hình máy chủ.',
      503,
    );
  const efforts =
    model === 'gpt-6-astra'
      ? ['low', 'medium', 'high', 'xhigh', 'max']
      : ['none', 'low', 'medium', 'high', 'xhigh', 'max'];
  if (!efforts.includes(effort) || !efforts.includes(diagramEffort))
    throw fail(
      'Mức suy luận chưa phù hợp với mô hình. Dùng low, medium hoặc high; GPT-6 Luna/Sol còn hỗ trợ none.',
      503,
    );
  if (!Number.isInteger(timeoutMs) || timeoutMs < 5000 || timeoutMs > 52000)
    throw fail('OPENAI_TIMEOUT_MS phải là số nguyên từ 5000 đến 52000.', 503);
  return {
    apiKey,
    model,
    effort,
    diagramEffort,
    timeoutMs,
    secret: env.STATE_SIGNING_KEY?.trim() || apiKey,
  };
}

export function strictSchema(schema) {
  const result = { type: schema.type.toLowerCase() };
  if (schema.enum) result.enum = [...schema.enum];
  if (schema.description) result.description = schema.description;
  if (schema.items) result.items = strictSchema(schema.items);
  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([k, v]) => [k, strictSchema(v)]),
    );
    result.required = Object.keys(result.properties);
    result.additionalProperties = false;
  }
  return result;
}

export async function generateOpenAI(
  config,
  prompt,
  contents,
  schema,
  maxOutputTokens = 6000,
  fetcher = fetch,
  check = false,
) {
  const input = contents.map((m) =>
    m.role === 'model'
      ? { role: 'assistant', content: m.parts.map((p) => p.text || '').join('\n') }
      : {
          role: 'user',
          content: m.parts.map((p) =>
            p.inlineData
              ? {
                  type: 'input_image',
                  image_url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`,
                  detail: 'high',
                }
              : { type: 'input_text', text: p.text },
          ),
        },
  );
  const body = {
    model: config.model,
    instructions: prompt,
    input,
    store: false,
    reasoning: {
      effort: check ? (config.model === 'gpt-6-astra' ? 'low' : 'none') : config.effort,
    },
    max_output_tokens: check ? 1024 : Math.min(14000, maxOutputTokens + 4000),
    ...(schema
      ? {
          text: {
            format: {
              type: 'json_schema',
              name: 'math_tutor',
              strict: true,
              schema: strictSchema(schema),
            },
          },
        }
      : {}),
  };

  const remaining = Math.min(
    config.timeoutMs || 50000,
    (config.deadlineAt || Date.now() + 52000) - Date.now(),
  );
  if (remaining < 1000) throw timeoutError();
  const timeoutSignal = AbortSignal.timeout(remaining);
  let response;
  try {
    response = await fetcher('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify(body),
      signal: timeoutSignal,
    });
  } catch (e) {
    if (timeoutSignal.aborted || e?.name === 'TimeoutError') throw timeoutError();
    throw fail(
      'Kết nối tới OpenAI bị gián đoạn. Đề bài và hình đang có vẫn được giữ; em thử lại khi mạng ổn định.',
      502,
      'OPENAI_NETWORK',
    );
  }
  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch {
      if (timeoutSignal.aborted) throw timeoutError();
    }
    const code = data?.error?.code || data?.error?.type;
    if (response.status === 429)
      throw fail(
        code === 'insufficient_quota'
          ? 'Tài khoản API OpenAI chưa có hoặc đã hết hạn mức thanh toán. Giáo viên kiểm tra Billing trên OpenAI Platform; ChatGPT Plus không cấp hạn mức API.'
          : 'OpenAI đang giới hạn số yêu cầu. Hãy đợi rồi thử lại; không cần đăng nhập lại.',
        429,
      );
    if ([401, 403].includes(response.status))
      throw fail(
        'OpenAI không chấp nhận khóa hoặc quyền truy cập. Giáo viên kiểm tra OPENAI_API_KEY. Mã lớp và bài làm vẫn được giữ.',
      );
    if (response.status === 404)
      throw fail(
        'Tài khoản chưa truy cập được mô hình đã chọn. Giáo viên kiểm tra OPENAI_MODEL và quyền của dự án OpenAI.',
      );
    throw fail(
      response.status === 400
        ? 'OpenAI chưa chấp nhận cấu hình yêu cầu. Giáo viên kiểm tra mô hình và cấu hình API.'
        : 'OpenAI tạm thời chưa phản hồi. Hãy thử lại sau.',
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    if (timeoutSignal.aborted) throw timeoutError();
    throw fail('OpenAI trả về dữ liệu không hợp lệ. Hãy thử lại.', 502, 'OPENAI_INVALID_JSON');
  }
  const parts = (Array.isArray(data.output) ? data.output : [])
    .filter((item) => item.type === 'message' && item.role === 'assistant')
    .flatMap((item) => item.content || []);
  if (parts.some((p) => p.type === 'refusal'))
    throw fail('AI chưa thể xử lý nội dung này. Hãy gửi riêng đề toán.', 422);
  if (data.status !== 'completed')
    throw fail(
      'OpenAI chưa trả lời trọn vẹn. Nội dung và hình đã có vẫn được giữ; hãy thử yêu cầu ngắn hơn.',
    );
  const text = parts
    .filter((p) => p.type === 'output_text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('\n')
    .replaceAll(config.apiKey, '[đã ẩn]');
  if (!text.trim() || text.length > 50000)
    throw fail('OpenAI chưa trả về văn bản hợp lệ. Hãy thử lại.');
  return text;
}

export async function handleOpenAI(request, env, fetcher = fetch) {
  if (request.method !== 'POST') return reply({ error: 'Chỉ hỗ trợ gửi yêu cầu POST.' }, 405);
  if (request.headers.get('sec-fetch-site') === 'cross-site')
    return reply({ error: 'Yêu cầu không hợp lệ.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json'))
    return reply({ error: 'Định dạng yêu cầu không hợp lệ.' }, 415);
  let config;
  try {
    config = openAIConfig(env);
  } catch (e) {
    return reply({ error: e.message }, e.status);
  }
  const access = (env.ACCESS_CODE?.trim() || 'HOCGIOITOAN').normalize('NFC');
  if (access.length < 10)
    return reply(
      { error: 'ACCESS_CODE phải có ít nhất 10 ký tự. Giáo viên kiểm tra cấu hình máy chủ.' },
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
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return reply({ error: 'Dữ liệu không hợp lệ.' }, 400);
  const provided =
    typeof body.accessCode === 'string' ? body.accessCode.trim().normalize('NFC') : '';
  const a = Buffer.from(provided),
    b = Buffer.from(access);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    return reply({ error: 'Mã truy cập chưa đúng. Hãy hỏi giáo viên để nhận mã.' }, 401);
  const check = body.check === true,
    featureImage = IMAGE_MODES.includes(body.mode),
    diagram = body.mode === 'diagram';
  if (!featureImage && size > 250000)
    return reply({ error: 'Nội dung quá dài. Hãy mở bài mới.' }, 413);
  const validDiagram =
    Array.isArray(body.messages) &&
    body.messages.length === 1 &&
    body.messages[0]?.role === 'user' &&
    typeof body.messages[0].content === 'string' &&
    body.messages[0].content.trim().length > 0 &&
    body.messages[0].content.length <= 26000;
  if (
    !check &&
    !featureImage &&
    (!(diagram ? validDiagram : validMessages(body.messages)) ||
      !['guide', 'review', 'compare', 'diagram'].includes(body.mode))
  )
    return reply({ error: 'Hội thoại không hợp lệ hoặc quá dài. Hãy mở bài mới.' }, 400);
  const { model } = config;
  config.deadlineAt = Date.now() + 52000;
  const drawingConfig = { ...config, effort: config.diagramEffort };
  const generate = (prompt, contents, schema, maxTokens) =>
    generateOpenAI(
      body.mode === 'image-diagram' ? drawingConfig : config,
      prompt,
      contents,
      schema,
      maxTokens,
      fetcher,
    );
  let curriculumContext;
  if (!check) {
    try {
      curriculumContext = resolveCurriculum(body);
    } catch (e) {
      return reply({ error: e.message }, e.status || 400);
    }
    if (!featureImage && !diagram && curriculumContext.chapterId !== 'c3') {
      const student = curriculumStudent(body.messages);
      const generation = student.match(/^Tạo đúng (\d+) câu/iu);
      if (generation)
        return reply({
          ...curriculumExerciseSet(curriculumContext, Number(generation[1]), student),
          model,
        });
      body.adaptive = true;
    }
  }
  if (!check && (featureImage || body.adaptive === true))
    return handleFeature(
      body,
      env,
      model,
      fetcher,
      {
        name: 'OpenAI',
        secret: config.secret,
        generate,
      },
      request,
    );
  if (!check && !diagram && asksForAnswer(body.messages))
    return reply({ text: guidedFallback(body.messages), model, provider: 'openai' });
  try {
    if (!check && diagram && body.diagramFormat === 'geometry-v1') {
      const problem =
        typeof body.problem === 'string' ? body.problem.trim() : body.messages[0].content;
      if (!problem || problem.length > 26000)
        return reply({ error: 'Đề bài trống hoặc quá dài.' }, 400);
      const result = await generateScene(
        (prompt, contents, schema, maxTokens) =>
          generateOpenAI(drawingConfig, prompt, contents, schema, maxTokens, fetcher),
        problem,
        {
          previous: typeof body.previous === 'string' ? body.previous : '',
          failure: typeof body.failure === 'string' ? body.failure : '',
        },
      );
      return reply({ ...result, model, provider: 'openai' });
    }
    const contents = check
      ? [{ role: 'user', parts: [{ text: 'Reply with OK only.' }] }]
      : body.messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));
    const schema = diagram
      ? {
          type: 'OBJECT',
          properties: { latex: { type: 'STRING' }, question: { type: 'STRING' } },
          required: ['latex', 'question'],
        }
      : null;
    const text = await generateOpenAI(
      diagram ? drawingConfig : config,
      check
        ? 'Reply with OK only.'
        : diagram
          ? DIAGRAM_PROMPT
          : instructions(body.mode, body.messages) +
            (curriculumContext && body.chapterId
              ? curriculumInstructions(curriculumContext, body.problem)
              : ''),
      contents,
      schema,
      diagram ? 6000 : 4800,
      fetcher,
      check,
    );
    if (diagram) {
      try {
        return reply({ ...parseDiagram(text), model, provider: 'openai' });
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
      check
        ? { ok: true, model, provider: 'openai' }
        : { text: guardTutorOutput(text, body.messages), model, provider: 'openai' },
    );
  } catch (e) {
    return reply(
      {
        error: e.status ? e.message : 'Chưa xử lý được yêu cầu OpenAI. Nội dung được giữ lại.',
        code: e.code || 'OPENAI_ERROR',
        ...(e.repairable ? { repairable: true, detail: e.detail } : {}),
      },
      e.status || 502,
    );
  }
}
