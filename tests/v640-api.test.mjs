import test from 'node:test';
import assert from 'node:assert/strict';
import { handleChat } from '../server/chat.mjs';
import { strictSchema } from '../server/openai.mjs';
import { SCENE_SCHEMA } from '../server/scene-policy.mjs';
import { seal, unseal } from '../server/signed-state.mjs';
import { loadTS } from './load-ts.mjs';
import { cases, point, node, stroke, constraint, scene } from './fixtures/scene-cases.mjs';
import { reading, latex } from './fixtures/v623-data.mjs';
const env = { OPENAI_API_KEY: 'test-scene-not-a-real-key', ACCESS_CODE: 'HOCGIOITOAN' };
const response = (value) =>
  Response.json({
    status: 'completed',
    output: [
      {
        type: 'message',
        role: 'assistant',
        content: [
          { type: 'output_text', text: typeof value === 'string' ? value : JSON.stringify(value) },
        ],
      },
    ],
  });
const request = (body) =>
  new Request('https://local.test/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessCode: env.ACCESS_CODE, ...body }),
  });
const bodyFor = (c) => ({
  mode: 'diagram',
  diagramFormat: 'geometry-v1',
  problem: c.problem,
  messages: [{ role: 'user', content: c.problem }],
});
const imageScene = () =>
  scene(
    'Tam giác vuông ABC',
    [
      point('A', 0, 0),
      point('B', 6, 0),
      point('C', 0, 4),
      node('M', 'interpolate', ['A', 'B'], [0.5]),
    ],
    [stroke('polygon', ['A', 'B', 'C'])],
    [
      constraint('perpendicular', ['A', 'B', 'A', 'C'], 0, 'tam giác ABC vuông tại A'),
      constraint('ratio', ['A', 'M', 'A', 'B'], 0.5, '2AM = AB'),
    ],
  );
const imageToken = (confirmed = true, attempt = 0) =>
  seal(
    { reading: { ...reading, ready: true }, confirmed, attempt, correction: '' },
    env.OPENAI_API_KEY,
    'image',
  );
const { requestDiagram } = await loadTS('lib/diagram-request.ts');
test('new schema closes every nested object and permits only construction operations', () => {
  const strict = strictSchema(SCENE_SCHEMA);
  const walk = (s) => {
    if (s.type === 'object') {
      assert.equal(s.additionalProperties, false);
      assert.deepEqual(s.required, Object.keys(s.properties));
      Object.values(s.properties).forEach(walk);
    }
    if (s.items) walk(s.items);
  };
  walk(strict);
  assert(strict.properties.nodes.items.properties.op.enum.includes('circleCircle'));
});
for (const c of cases())
  test('server/browser contract: ' + c.name, async () => {
    let calls = 0;
    const d = await requestDiagram(
      c.problem,
      env.ACCESS_CODE,
      new AbortController().signal,
      '',
      '',
      async (_u, options) => {
        const body = JSON.parse(options.body);
        assert.equal(body.diagramFormat, 'geometry-v1');
        return handleChat(request(body), env, async (_url, o) => {
          calls++;
          const upstream = JSON.parse(o.body);
          assert.equal(upstream.model, 'gpt-6-luna');
          assert.equal(upstream.reasoning.effort, 'low');
          assert.equal(upstream.text.format.type, 'json_schema');
          assert.equal(upstream.store, false);
          assert.equal(JSON.parse(upstream.input[0].content[0].text).problem, c.problem);
          return response(c.scene);
        });
      },
    );
    assert.equal(calls, 1);
    assert.equal(d.renderer, 'geometry-v1');
    assert(d.svg.includes('<svg'));
    assert.equal(d.validation.checked.length, c.scene.constraints.length);
  });
test('invalid coordinates return a repairable error, never fallback/unchecked markup', async () => {
  const c = cases()[0],
    bad = structuredClone(c.scene);
  bad.nodes[0].values = [0, 0];
  // An explicitly false given cannot be passed through SVG or legacy TikZ.
  bad.constraints.push(constraint('length', ['A', 'B'], 99, c.problem));
  const r = await handleChat(request(bodyFor(c)), env, async () => response(bad));
  assert.equal(r.status, 502);
  const d = await r.json();
  assert.equal(d.code, 'SCENE_INVALID');
  assert.equal(d.repairable, true);
  assert(!d.svg && !d.latex && !d.fallback);
});
test('malformed JSON and unknown protocol versions are repairable', async () => {
  for (const value of ['{bad}', { ...cases()[0].scene, version: 'whatever' }, null]) {
    const r = await handleChat(request(bodyFor(cases()[0])), env, async () => response(value));
    assert.equal(r.status, 502);
    assert.equal((await r.json()).repairable, true);
  }
});
test('clarification is surfaced; unsupported operations alone may use legacy renderer', async () => {
  const empty = (status) => ({
    ...scene('C', [], []),
    status,
    question: status === 'clarify' ? 'Em bổ sung độ dài AB nhé.' : 'Mặt trụ cần công cụ mở rộng.',
  });
  const c = cases()[0];
  let calls = 0;
  const d = await requestDiagram(
    c.problem,
    env.ACCESS_CODE,
    new AbortController().signal,
    '',
    '',
    async (_u, o) =>
      handleChat(request(JSON.parse(o.body)), env, async () => {
        calls++;
        return response(empty('clarify'));
      }),
  );
  assert.equal(calls, 1);
  assert(d.question);
  assert(!d.svg);
  let formats = [];
  const f = await requestDiagram(
    c.problem,
    env.ACCESS_CODE,
    new AbortController().signal,
    '',
    '',
    async (_u, o) => {
      const b = JSON.parse(o.body);
      formats.push(b.diagramFormat);
      return handleChat(request(b), env, async () =>
        response(
          b.diagramFormat === 'geometry-v1' ? empty('unsupported') : { latex, question: '' },
        ),
      );
    },
  );
  assert.deepEqual(formats, ['geometry-v1', 'tikz']);
  assert.equal(f.renderer, 'tikz');
  assert(f.validation.unverified.length > 0);
});
test('client regenerates SVG and refuses tampered geometry from a successful HTTP response', async () => {
  const c = cases()[0];
  const r = await requestDiagram(
    c.problem,
    'test',
    new AbortController().signal,
    '',
    '',
    async () => Response.json({ scene: c.scene, svg: '<svg><script>bad()</script></svg>' }),
  );
  assert(!r.svg.includes('<script>'));
  const bad = structuredClone(c.scene);
  bad.nodes[0].values[0] = null;
  await assert.rejects(
    requestDiagram(c.problem, 'test', new AbortController().signal, '', '', async () =>
      Response.json({ scene: bad }),
    ),
    (e) => e.repairable === true,
  );
});
test('signed image confirmation is still mandatory before generalized drawing', async () => {
  for (const confirmed of [false, true]) {
    let calls = 0;
    const r = await handleChat(
      request({
        mode: 'image-diagram',
        diagramFormat: 'geometry-v1',
        imageToken: imageToken(confirmed),
      }),
      env,
      async () => {
        calls++;
        return response(imageScene());
      },
    );
    assert.equal(r.status, confirmed ? 200 : 409);
    assert.equal(calls, confirmed ? 1 : 0);
    if (confirmed) {
      const d = await r.json();
      assert(d.scene);
      assert(d.validation.checked.includes('2AM = AB'));
      assert.equal(unseal(d.repairToken, env.OPENAI_API_KEY, 'image').attempt, 1);
    }
  }
});
test('image givens independently reject coordinates even when AI omits a check', async () => {
  const s = imageScene();
  s.nodes.find((n) => n.id === 'M').values = [0.6];
  s.constraints = s.constraints.filter((r) => r.kind !== 'ratio');
  const r = await handleChat(
    request({ mode: 'image-diagram', diagramFormat: 'geometry-v1', imageToken: imageToken() }),
    env,
    async () => response(s),
  );
  assert.equal(r.status, 502);
  const d = await r.json();
  assert.match(d.detail, /2AM = AB/);
  assert(d.repairToken && d.repairable);
});
test('image repair budgets, network/quota errors and partial output are respected', async () => {
  let calls = 0;
  const r = await handleChat(
    request({
      mode: 'image-diagram',
      diagramFormat: 'geometry-v1',
      imageToken: imageToken(true, 3),
      failure: 'bad',
    }),
    env,
    async () => {
      calls++;
      return response(imageScene());
    },
  );
  assert.equal(r.status, 409);
  assert.equal(calls, 0);
  for (const fetcher of [
    async () => Response.json({ error: { code: 'insufficient_quota' } }, { status: 429 }),
    async () => {
      throw Error('socket closed');
    },
    async () => Response.json({ status: 'incomplete', output: [] }),
  ]) {
    const r = await handleChat(
      request({ mode: 'image-diagram', diagramFormat: 'geometry-v1', imageToken: imageToken() }),
      env,
      fetcher,
    );
    const d = await r.json();
    assert(r.status >= 400);
    assert(!d.repairable);
    assert(!JSON.stringify(d).includes(env.OPENAI_API_KEY));
  }
});
test('original legacy clients retain their response shape', async () => {
  const b = bodyFor(cases()[0]);
  delete b.diagramFormat;
  const r = await handleChat(request(b), env, async () => response({ latex, question: '' }));
  assert.equal(r.status, 200);
  const d = await r.json();
  assert(d.latex);
  assert(!d.scene);
});
