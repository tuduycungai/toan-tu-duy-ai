import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareTikz, parseDiagramText } from '../public/tikz-format.mjs';
import { handleChat } from '../server/gemini.mjs';
import { loadTS } from './load-ts.mjs';
const { requestDiagram } = await loadTS('lib/diagram-request.ts');
const tex = readFileSync(new URL('./fixtures/right-isosceles.tex', import.meta.url), 'utf8');
test('TikZ environment spaces and comment containing a false end marker do not break extraction', () => {
  const variant = tex
    .replace('\\begin{tikzpicture}', '\\begin { tikzpicture }')
    .replace('\\draw (A)', '% Ignore this: \\end{tikzpicture}\n\\draw (A)');
  assert(prepareTikz(variant).body.includes('\\coordinate (M)'));
  assert(prepareTikz(variant).body.includes('\\draw (A)'));
});
test('Missing calc library gets the supported runtime defaults', () => {
  assert(prepareTikz(tex.replace(/\\usetikzlibrary\{.*\}/, '')).libraries.includes('calc'));
});
test('Unsafe TeX hidden in a comment is ignored, executable unsafe TeX rejected', () => {
  assert.doesNotThrow(() => prepareTikz('% \\input{file}\n' + tex));
  assert.throws(() => prepareTikz(tex.replace('\\draw (A)', '\\input{file}\\draw (A)')));
});
test('Preamble definitions are caught before silent loss in renderer', () => {
  assert.throws(
    () =>
      prepareTikz(
        tex.replace('\\begin{document}', '\\definecolor{myblue}{RGB}{0,0,255}\n\\begin{document}'),
      ),
    /bên trong/,
  );
});
test('Null, empty JSON and truncated programs cannot become an endless drawing state', () => {
  for (const s of ['null', '{}', '{"text":"chat"}', JSON.stringify({ latex: tex.slice(0, 100) })])
    assert.throws(() => parseDiagramText(s));
});
test('Wrong API deployment returning HTML yields useful terminal error', async () => {
  await assert.rejects(
    requestDiagram(
      'problem',
      'test',
      new AbortController().signal,
      '',
      '',
      async () => new Response('<html/>', { headers: { 'content-type': 'text/html' } }),
    ),
    /Netlify Functions/,
  );
});
test('Successful HTTP with wrong payload is repairable, not accepted as empty image', async () => {
  await assert.rejects(
    requestDiagram('problem', 'test', new AbortController().signal, '', '', async () =>
      Response.json({ text: 'old server' }),
    ),
    (e) => e.repairable === true,
  );
});
test('Server format errors are repairable but auth/quota errors are not auto-retried', async () => {
  for (const [status, data, repairable] of [
    [502, { error: 'format', repairable: true, detail: 'bad' }, true],
    [401, { error: 'auth' }, false],
    [429, { error: 'quota' }, false],
  ])
    await assert.rejects(
      requestDiagram('p', 'x', new AbortController().signal, '', '', async () =>
        Response.json(data, { status }),
      ),
      (e) => e.repairable === repairable,
    );
});
test('Diagram transport schema and correction metadata are returned for malformed output', async () => {
  const req = new Request('http://local/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      accessCode: 'HOCGIOITOAN',
      mode: 'diagram',
      messages: [{ role: 'user', content: 'Đề toán' }],
    }),
  });
  const res = await handleChat(req, { GEMINI_API_KEY: 'fixture' }, async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body).generationConfig.responseSchema.required, [
      'latex',
      'question',
    ]);
    return Response.json({
      candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{}' }] } }],
    });
  });
  assert.equal(res.status, 502);
  assert.equal((await res.json()).repairable, true);
});
