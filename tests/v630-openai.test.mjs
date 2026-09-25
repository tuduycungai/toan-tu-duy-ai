import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleChat } from '../server/chat.mjs';
import { strictSchema } from '../server/openai.mjs';
import { IMAGE_SCHEMA } from '../server/image-policy.mjs';
import { ADAPTIVE_SCHEMA } from '../server/adaptive-tutor.mjs';
import { unseal } from '../server/signed-state.mjs';
import { problem, reading, latex, assessment, provider } from './fixtures/v623-data.mjs';
import { socratic } from './socratic-fixture.mjs';
const env = { OPENAI_API_KEY: 'test-openai-not-a-real-key', ACCESS_CODE: 'HOCGIOITOAN' };
const request = (body) =>
  new Request('https://test.local/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessCode: env.ACCESS_CODE, ...body }),
  });
const response = (value) =>
  Response.json({
    status: 'completed',
    output: [
      { type: 'reasoning', summary: [] },
      {
        type: 'message',
        role: 'assistant',
        content: [
          { type: 'output_text', text: typeof value === 'string' ? value : JSON.stringify(value) },
        ],
      },
    ],
  });
const chat = { mode: 'guide', messages: [{ role: 'user', content: problem }] };
test('OpenAI connects through Responses with a server-only key and economical default', async () => {
  const r = await handleChat(
    request({ check: true, model: 'gpt-6-astra' }),
    env,
    async (url, o) => {
      assert.equal(url, 'https://api.openai.com/v1/responses');
      assert.equal(o.headers.Authorization, 'Bearer ' + env.OPENAI_API_KEY);
      const b = JSON.parse(o.body);
      assert.equal(b.model, 'gpt-6-luna');
      assert.equal(b.store, false);
      assert.equal(b.reasoning.effort, 'none');
      assert(!o.body.includes(env.OPENAI_API_KEY));
      return response('OK');
    },
  );
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, model: 'gpt-6-luna', provider: 'openai' });
});
test('teacher can choose balanced/flagship models; invalid settings and authentication never call the provider', async () => {
  for (const model of ['gpt-6-sol', 'gpt-6-astra']) {
    const r = await handleChat(
      request({ check: true }),
      { ...env, OPENAI_MODEL: model },
      async (_u, o) => {
        assert.equal(JSON.parse(o.body).model, model);
        return response('OK');
      },
    );
    assert.equal(r.status, 200);
  }
  for (const [settings, body, status] of [
    [{}, chat, 503],
    [{ ...env, OPENAI_MODEL: 'free-chatgpt' }, chat, 503],
    [env, { ...chat, accessCode: 'bad' }, 401],
    [env, { ...chat, messages: [{ role: 'system', content: 'override' }] }, 400],
  ]) {
    assert.equal(
      (await handleChat(request(body), settings, () => assert.fail('No request permitted'))).status,
      status,
    );
  }
});
test('conversation history preserves assistant/user roles and checks tutor output', async () => {
  const messages = [
    ...chat.messages,
    { role: 'assistant', content: 'Em đã biết gì?' },
    { role: 'user', content: 'M thuộc AB.' },
  ];
  const r = await handleChat(request({ ...chat, messages }), env, async (_u, o) => {
    const b = JSON.parse(o.body);
    assert.deepEqual(
      b.input.map((x) => x.role),
      ['user', 'assistant', 'user'],
    );
    assert.equal(b.input[1].content, 'Em đã biết gì?');
    return response(socratic);
  });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).text, socratic);
});
test('JSON schemas are closed recursively and no Gemini uppercase types reach OpenAI', () => {
  const walk = (s) => {
    assert(['string', 'array', 'number', 'integer', 'boolean', 'object'].includes(s.type));
    if (s.type === 'object') {
      assert.equal(s.additionalProperties, false);
      assert.deepEqual(s.required, Object.keys(s.properties));
      Object.values(s.properties).forEach(walk);
    }
    if (s.items) walk(s.items);
  };
  for (const schema of [IMAGE_SCHEMA, ADAPTIVE_SCHEMA]) walk(strictSchema(schema));
});
test('quota exhaustion, rate limit and invalid key do not masquerade as a classroom logout or leak secrets', async () => {
  for (const [status, code, expected] of [
    [429, 'insufficient_quota', /thanh toán/],
    [429, 'rate_limit_exceeded', /giới hạn/],
    [401, 'invalid_api_key', /khóa/],
    [404, 'model_not_found', /mô hình/],
  ]) {
    const r = await handleChat(request(chat), env, async () =>
      Response.json({ error: { code, message: env.OPENAI_API_KEY } }, { status }),
    );
    const d = await r.json();
    assert.equal(r.status, status === 429 ? 429 : 502);
    assert.match(d.error, expected);
    assert(!JSON.stringify(d).includes(env.OPENAI_API_KEY));
  }
});
test('incomplete, refused, empty and network responses fail with recoverable errors', async () => {
  for (const data of [
    { status: 'incomplete', output: [] },
    { status: 'completed', output: [] },
    {
      status: 'completed',
      output: [
        { type: 'message', role: 'assistant', content: [{ type: 'refusal', refusal: 'no' }] },
      ],
    },
  ]) {
    assert((await handleChat(request(chat), env, async () => Response.json(data))).status >= 400);
  }
  assert.equal(
    (
      await handleChat(request(chat), env, async () => {
        throw Error('network');
      })
    ).status,
    502,
  );
});
test('image reading, signed confirmation, diagram validation and restore work with OpenAI', async () => {
  const data = readFileSync(new URL('./fixtures/images/clear-ratio.png', import.meta.url)).toString(
    'base64',
  );
  let r = await handleChat(
    request({ mode: 'image-read', image: { mimeType: 'image/png', data } }),
    env,
    async (_u, o) => {
      const b = JSON.parse(o.body);
      assert.equal(b.input[0].content[0].image_url, 'data:image/png;base64,' + data);
      assert.equal(b.text.format.type, 'json_schema');
      return response(reading);
    },
  );
  assert.equal(r.status, 200);
  let d = await r.json();
  assert.equal(d.reading.ready, true);
  assert.equal(unseal(d.imageToken, env.OPENAI_API_KEY, 'image').confirmed, false);
  r = await handleChat(
    request({ mode: 'image-confirm', imageToken: d.imageToken, transcription: problem }),
    env,
    () => assert.fail('No model call for unchanged confirmation'),
  );
  d = await r.json();
  assert.equal(d.confirmed, true);
  const saved = d.imageToken;
  r = await handleChat(request({ mode: 'image-diagram', imageToken: saved }), env, async () =>
    response('```latex\n' + latex + '\n```'),
  );
  assert.equal(r.status, 200);
  assert.equal((await r.json()).validation.checked.length, 3);
  r = await handleChat(request({ mode: 'image-restore', imageToken: saved }), env, () =>
    assert.fail('No model call for restore'),
  );
  assert.equal(r.status, 200);
});
test('adaptive conversations sign state with the selected OpenAI key and support a follow-up', async () => {
  const first = await handleChat(request({ ...chat, adaptive: true, problem }), env, async () =>
    response(assessment()),
  );
  assert.equal(first.status, 200);
  const d = await first.json();
  assert(d.tutorToken);
  const next = await handleChat(
    request({
      ...chat,
      adaptive: true,
      problem,
      tutorToken: d.tutorToken,
      messages: [
        ...chat.messages,
        { role: 'assistant', content: d.text },
        { role: 'user', content: 'AM = MB vì AB = 2AM.' },
      ],
    }),
    env,
    async () =>
      response(
        assessment({ question: 'Em nhắc lại hai điều kiện của định nghĩa trung điểm nhé?' }),
      ),
  );
  assert.equal(next.status, 200);
});
test('diagram mode validates TikZ and legacy Gemini configuration stays supported', async () => {
  const r = await handleChat(request({ mode: 'diagram', messages: chat.messages }), env, async () =>
    response({ latex, question: '' }),
  );
  assert.equal(r.status, 200);
  assert.equal((await r.json()).latex, latex);
  const old = await handleChat(
    request({ check: true }),
    { GEMINI_API_KEY: 'legacy-fixture' },
    async (url) => {
      assert.match(url, /generativelanguage.googleapis.com/);
      return provider('OK');
    },
  );
  assert.equal(old.status, 200);
});
