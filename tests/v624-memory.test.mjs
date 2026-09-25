import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { streamCoreToMemory } from '../scripts/tikz-core-stream.mjs';
import { patchWorkerMemory } from '../scripts/patch-tikz-memory.mjs';
import { saveImageSession, readImageSession, clearImageSession } from '../lib/image-session.ts';
// Controlled chunk producer checks bounded writes; real gzip/TeX runs in browser tests.
function producer() {
  return {
    err: 0,
    ended: false,
    strm: { msg: '' },
    push(chunk, final) {
      if (chunk.length) this.onData(chunk);
      if (final) {
        this.ended = true;
        this.onEnd(0);
      }
    },
  };
}
const response = (chunks) =>
  new Response(
    new ReadableStream({
      start(c) {
        for (const x of chunks) c.enqueue(x);
        c.close();
      },
    }),
  );
test('MEM-01: streaming core writes exactly once into fixed target and rejects overflow/truncation', async () => {
  const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 }),
    a = new Uint8Array(32768).fill(7),
    b = new Uint8Array(32768).fill(9);
  const r = await streamCoreToMemory(memory, response([a, b]), producer);
  assert.equal(r, memory);
  assert.equal(new Uint8Array(memory.buffer)[32767], 7);
  assert.equal(new Uint8Array(memory.buffer)[32768], 9);
  await assert.rejects(streamCoreToMemory(memory, response([a]), producer), /chưa tải đủ/);
  await assert.rejects(
    streamCoreToMemory(memory, response([a, b, new Uint8Array(1)]), producer),
    /vượt kích thước/,
  );
});
test('MEM-02: vendor patch is reproducible, guarded, and keeps the upstream memory limit and license', () => {
  const base = readFileSync('node_modules/@rod2ik/tikzjax/dist/run-tex.js', 'utf8')
    .replaceAll('tex.wasm.gz', 'tex.wasm.gz.bin')
    .replaceAll('core.dump.gz', 'core.dump.gz.bin')
    .replaceAll('${A}.gz`', '${A}.gz.bin`');
  const patched = patchWorkerMemory(base);
  assert.equal(readFileSync('public/tikz/run-tex.js', 'utf8'), patched);
  assert.match(patched, /on=2500/);
  assert.match(patched, /run-tex.js.LICENSE.txt/);
  assert(!patched.includes('new Uint8Array(t.buffer,0,A).set(Jn)'));
  assert(!patched.includes('$n("core.dump.gz.bin")'));
  assert.throws(() => patchWorkerMemory('unexpected version'));
});
test('MEM-03: recovery saves only transcript and signed token, clears explicitly, fails safely on quota', () => {
  let raw;
  globalThis.sessionStorage = {
    getItem: () => raw,
    setItem: (_k, v) => {
      raw = v;
    },
    removeItem: () => {
      raw = undefined;
    },
  };
  saveImageSession({ transcription: 'Đề đã đọc', imageToken: 'payload.signature' });
  assert.equal(readImageSession().transcription, 'Đề đã đọc');
  assert(!/data:image|accessCode|GEMINI/.test(raw));
  clearImageSession();
  assert.equal(readImageSession(), null);
  globalThis.sessionStorage.setItem = () => {
    throw Error('Quota exceeded');
  };
  assert.doesNotThrow(() => saveImageSession({ transcription: 'Đề', imageToken: 'x.y' }));
});
