import {
  ADAPTIVE_SCHEMA,
  adaptiveInstructions,
  readTutorState,
  applyTutorTurn,
  tutorResponse,
} from './adaptive-tutor.mjs';
import {
  IMAGE_PROMPT,
  IMAGE_SCHEMA,
  validateReading,
  recoverTranscription,
} from './image-policy.mjs';
import { imageTikzPrompt } from './tikz-image-prompt.mjs';
import { prepareTikz } from '../public/tikz-format.mjs';
import { validateImage, IMAGE_LIMITS } from '../public/image-format.mjs';
import { checkGeometryCode } from './geometry-checks.mjs';
import { seal, unseal } from './signed-state.mjs';
import { mathText } from './reading-normalization.mjs';
import { generateScene } from './scene-policy.mjs';
import { checkReadingScene } from './scene-reading-checks.mjs';

const reply = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
const fail = (message, status = 400) => Object.assign(Error(message), { status });
export const IMAGE_MODES = [
  'image-read',
  'image-confirm',
  'image-revise',
  'image-diagram',
  'image-restore',
];
export async function handleFeature(body, env, model, fetcher = fetch, provider = null) {
  const secret = provider?.secret || env.STATE_SIGNING_KEY?.trim() || env.GEMINI_API_KEY.trim();
  async function generate(prompt, contents, schema, maxOutputTokens = 6000) {
    if (provider) return provider.generate(prompt, contents, schema, maxOutputTokens);
    const generationConfig = {
      maxOutputTokens,
      ...(schema ? { responseMimeType: 'application/json', responseSchema: schema } : {}),
    };
    if (model === 'gemini-2.5-flash') generationConfig.thinkingConfig = { thinkingBudget: 512 };
    const response = await fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': secret },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: prompt }] },
          contents,
          generationConfig,
        }),
        signal: AbortSignal.timeout(22000),
      },
    );
    if (!response.ok) {
      await response.body?.cancel();
      throw fail(
        response.status === 429
          ? 'Gemini đã đạt hạn mức. Hãy đợi rồi thử lại.'
          : 'Gemini chưa chấp nhận yêu cầu. Giáo viên kiểm tra khóa, mô hình và quyền truy cập.',
        response.status === 429 ? 429 : 502,
      );
    }
    const data = await response.json(),
      candidate = data.candidates?.[0];
    if (data.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY')
      throw fail('Gemini chưa thể xử lý ảnh hoặc nội dung này. Hãy gửi riêng đề toán.', 422);
    if (candidate?.finishReason !== 'STOP')
      throw fail('Gemini chưa trả về đầy đủ. Dữ kiện được giữ lại để thử tiếp.', 502);
    const text = (candidate.content?.parts || [])
      .filter((p) => typeof p.text === 'string' && !p.thought)
      .map((p) => p.text)
      .join('\n')
      .replaceAll(secret, '[đã ẩn]');
    if (!text.trim() || text.length > 50000) throw fail('Phản hồi trống hoặc quá dài.', 502);
    return text;
  }
  try {
    if (body.adaptive === true && !IMAGE_MODES.includes(body.mode)) {
      let state;
      try {
        state = readTutorState(body, secret);
      } catch (e) {
        throw fail(e.message, 409);
      }
      const contents = body.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      let correction = '';
      // At most one format/repetition repair. Failed provider calls are never retried automatically.
      for (let attempt = 0; attempt < 2; attempt++) {
        const raw = await generate(
          adaptiveInstructions(state, body.mode, body.messages) + correction,
          contents,
          ADAPTIVE_SCHEMA,
          4800,
        );
        try {
          return reply({
            ...tutorResponse(applyTutorTurn(state, JSON.parse(raw), body.messages), secret),
            model,
          });
        } catch (e) {
          if (attempt === 1)
            throw fail(
              'Chưa tạo được câu gợi mở phù hợp. Bài làm và trạng thái được giữ lại; em có thể thử gửi lại.',
              502,
            );
          correction =
            '\nPhản hồi trước chưa hợp lệ: ' +
            e.message +
            '. Tạo lại đúng schema, không lặp câu hỏi và không đưa lời giải sớm.';
        }
      }
    }
    if (body.mode === 'image-read') {
      const img = body.image;
      if (
        !img ||
        typeof img.data !== 'string' ||
        img.data.length > 3400000 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(img.data) ||
        img.data.length % 4 !== 0
      )
        throw fail('Ảnh gửi lên không hợp lệ hoặc quá lớn.');
      const bytes = Buffer.from(img.data, 'base64');
      validateImage(bytes, img.mimeType, IMAGE_LIMITS.uploadBytes);
      const note = typeof body.note === 'string' ? body.note.slice(0, 1200) : '';
      const raw = await generate(
        IMAGE_PROMPT,
        [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: img.mimeType, data: img.data } },
              {
                text:
                  'Đọc ảnh đề toán. Câu hỏi bổ sung của học sinh (không tự thay giả thiết): ' +
                  note,
              },
            ],
          },
        ],
        IMAGE_SCHEMA,
        7500,
      );
      let reading;
      try {
        const value = JSON.parse(raw);
        try {
          reading = validateReading(value);
        } catch (e) {
          reading = recoverTranscription(value, e.message);
        }
      } catch (e) {
        throw fail(e.message, 502);
      }
      return reply({
        reading,
        imageToken: seal(
          { reading, confirmed: false, attempt: 0, correction: '' },
          secret,
          'image',
        ),
        confirmed: false,
        model,
      });
    }
    let saved;
    try {
      saved = unseal(body.imageToken, secret, 'image');
    } catch (e) {
      throw fail(e.message, 409);
    }
    if (body.mode === 'image-restore')
      return reply({
        reading: saved.reading,
        imageToken: body.imageToken,
        confirmed: saved.confirmed === true,
        model,
      });
    if (body.mode === 'image-confirm' || body.mode === 'image-revise') {
      const transcript =
        typeof body.transcription === 'string'
          ? body.transcription.trim()
          : saved.reading.transcription;
      const correction = typeof body.correction === 'string' ? body.correction.trim() : '';
      if (!transcript || transcript.length > 6000 || correction.length > 1200)
        throw fail('Phần xác nhận quá dài hoặc trống.');
      const changed = transcript !== saved.reading.transcription || !!correction;
      const needsRepair = saved.reading.structureStatus === 'needs_repair';
      if (body.mode === 'image-revise' && !correction)
        throw fail('Em hãy nêu điểm, quan hệ hoặc nhãn nào đang sai.');
      if (!changed && !saved.reading.ready && !needsRepair)
        throw fail('Còn dữ kiện chưa rõ. Em hãy bổ sung hoặc chụp lại trước khi vẽ.');
      if (changed || needsRepair) {
        const raw = await generate(
          IMAGE_PROMPT,
          [
            {
              role: 'user',
              parts: [
                {
                  text: JSON.stringify({
                    previous: saved.reading,
                    transcriptionConfirmedByStudent: transcript,
                    correction,
                    structureError: needsRepair ? saved.reading.structureIssue : '',
                    task: 'Học sinh vừa xác nhận bản phiên âm. Sửa CẤU TRÚC JSON từ chính đề này, không yêu cầu chụp lại vì lỗi schema. Giữ nguyên transcription nếu không có sửa đề. Tách đủ yêu cầu Tính/Chứng minh đã có. source phải là trích dẫn có trong bản phiên âm, không diễn đạt lại. Không giữ lỗi cấu trúc dưới dạng uncertainty; vẫn giữ và hỏi cụ thể dữ kiện toán học thật sự chưa rõ.',
                  }),
                },
              ],
            },
          ],
          IMAGE_SCHEMA,
          7500,
        );
        let reading;
        try {
          const value = JSON.parse(raw);
          try {
            reading = validateReading(value);
          } catch (e) {
            reading = recoverTranscription(value, e.message);
          }
        } catch {
          throw fail(
            'Chưa kiểm tra được cấu trúc. Bản phiên âm vẫn được giữ; em có thể thử lại.',
            502,
          );
        }
        const confirmed =
          !changed && reading.ready && mathText(reading.transcription) === mathText(transcript);
        return reply({
          reading,
          confirmed,
          imageToken: seal(
            { reading, confirmed, attempt: 0, correction: correction || saved.correction },
            secret,
            'image',
          ),
          model,
        });
      }
      return reply({
        reading: saved.reading,
        confirmed: true,
        imageToken: seal({ ...saved, confirmed: true, attempt: 0 }, secret, 'image'),
        model,
      });
    }
    if (body.mode === 'image-diagram') {
      if (!saved.confirmed || !saved.reading.ready)
        throw fail('Cần xác nhận đề đã rõ trước khi vẽ.', 409);
      if (!Number.isInteger(saved.attempt) || saved.attempt < 0 || saved.attempt >= 3)
        throw fail('Đã hết hai lần tự sửa. Em kiểm tra dữ kiện rồi chọn Thử dựng lại.', 409);
      const previous = typeof body.previous === 'string' ? body.previous.slice(0, 18000) : '';
      const failure =
        typeof body.failure === 'string' ? body.failure.slice(0, 900).replace(/[<>]/g, '') : '';
      if (saved.attempt > 0 && !failure) throw fail('Thiếu lỗi cụ thể để sửa hình.');
      const repairToken = seal({ ...saved, attempt: saved.attempt + 1 }, secret, 'image');
      if (body.diagramFormat === 'geometry-v1' && provider?.name === 'OpenAI') {
        try {
          const result = await generateScene(generate, saved.reading.transcription, {
            reading: saved.reading,
            previous,
            failure,
            correction: saved.correction,
          });
          if (result.scene) {
            const independent = checkReadingScene(result.scene, saved.reading);
            result.validation = {
              ...independent,
              checked: [...new Set([...result.validation.checked, ...independent.checked])],
            };
          }
          return reply({ ...result, repairToken, model });
        } catch (e) {
          if (e.code && e.code !== 'SCENE_INVALID') throw e;
          if (e.status && e.code !== 'SCENE_INVALID') throw e;
          return reply(
            {
              error: 'Chưa có hình hợp lệ.',
              detail: (e.detail || e.message).slice(0, 900),
              latex: '',
              repairToken,
              repairable: saved.attempt < 2,
            },
            502,
          );
        }
      }
      const raw = await generate(
        imageTikzPrompt({ ...saved.reading, drawingCorrection: saved.correction }),
        [
          {
            role: 'user',
            parts: [
              {
                text: saved.attempt
                  ? JSON.stringify({
                      previous,
                      compilerError: failure,
                      task: 'Sửa lỗi cụ thể, giữ nguyên cấu trúc hình học đã xác nhận.',
                    })
                  : 'Vẽ từ cấu trúc hình học đã xác nhận.',
              },
            ],
          },
        ],
        null,
        6500,
      );
      let latex = '';
      try {
        const blocks = [...raw.matchAll(/```latex\s*([\s\S]*?)```/g)];
        if (blocks.length !== 1) throw Error('Cần đúng một khối mã latex hoàn chỉnh.');
        latex = blocks[0][1].trim();
        prepareTikz(latex);
        const validation = checkGeometryCode(latex, saved.reading);
        return reply({ latex, repairToken, validation, model });
      } catch (e) {
        return reply(
          {
            error: 'Chưa có hình hợp lệ.',
            detail: e.message.slice(0, 900),
            latex,
            repairToken,
            repairable: saved.attempt < 2,
          },
          502,
        );
      }
    }
    throw fail('Chế độ không hợp lệ.');
  } catch (e) {
    return reply(
      {
        error: e.status
          ? e.message
          : e.name === 'TimeoutError' || e.name === 'AbortError'
            ? 'Kết nối Gemini quá thời gian. Đề được giữ lại để thử tiếp.'
            : 'Chưa xử lý được yêu cầu. Kiểm tra ảnh hoặc thử lại.',
        ...(e.code ? { code: e.code } : {}),
      },
      e.status || 504,
    );
  }
}
