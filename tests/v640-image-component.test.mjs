import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { moduleURL } from './load-ts.mjs';
import { cases } from './fixtures/scene-cases.mjs';
import { renderScene } from '../public/geometry-scene.mjs';
import { reading } from './fixtures/v623-data.mjs';
const fixture = cases()[0];
let source = readFileSync(new URL('../components/image-problem.tsx', import.meta.url), 'utf8')
  .replace(/import \{\s*MathText\s*\}[^\n]+/, 'const MathText=({text})=>text;')
  .replace(
    /import \{\s*compileTikz\s*\}[^\n]+/,
    'const compileTikz=()=>{throw Error("Compiler must not run for a scene");};',
  )
  .replace(
    /import \{[^}]*\} from '..\/lib\/image-session';/,
    'const readImageSession=()=>({transcription:"fixture",imageToken:"fixture.token"}),saveImageSession=()=>{},clearImageSession=()=>{};',
  );
let js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
  },
}).outputText;
js = js.replace(
  /from (['"])([^'"]+)\1/g,
  (_m, q, p) =>
    'from ' +
    q +
    (p.startsWith('.')
      ? moduleURL(
          p.endsWith('.ts') ? p : p + '.ts',
          new URL('../components/image-problem.tsx', import.meta.url),
        )
      : import.meta.resolve(p)) +
    q,
);
const { ImageProblem } = await import(
  'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.document = Object.assign(new EventTarget(), { hidden: false });
globalThis.addEventListener = document.addEventListener.bind(document);
globalThis.removeEventListener = document.removeEventListener.bind(document);
const button = (root, label) =>
  root.root.findAllByType('button').find((b) => b.children.join('').includes(label));
const restored = {
  reading: { ...reading, transcription: 'fixture', ready: true },
  imageToken: 'fixture.token',
  confirmed: true,
};
async function setup(responses) {
  let root,
    calls = 0;
  const bodies = [],
    original = globalThis.fetch;
  globalThis.fetch = async (_u, o) => {
    bodies.push(JSON.parse(o.body));
    return responses[calls++]();
  };
  await act(async () => {
    root = create(
      React.createElement(ImageProblem, {
        accessCode: 'test',
        disabled: false,
        onConnect: () => {},
        onReady: () => {},
        onStateChange: () => {},
      }),
    );
  });
  await act(async () => button(root, 'Khôi phục đề').props.onClick());
  return {
    root,
    bodies,
    close: async () => {
      await act(async () => root.unmount());
      globalThis.fetch = original;
    },
  };
}
test('confirmed image uses direct SVG and accepts a figure only after it is displayed', async () => {
  const r = await setup([
    () => Response.json(restored),
    () => Response.json({ ...renderScene(fixture.scene), repairToken: 'next' }),
  ]);
  try {
    assert.equal(r.root.root.findAllByType('img').length, 0);
    await act(async () => button(r.root, 'Thử dựng lại').props.onClick());
    assert.equal(r.bodies[1].diagramFormat, 'geometry-v1');
    assert.equal(r.root.root.findAllByType('img').length, 1);
    assert(button(r.root, 'Hình đúng — bắt đầu gợi mở'));
    assert.equal(r.root.root.findAllByProps({ role: 'alert' }).length, 0);
  } finally {
    await r.close();
  }
});
test('image scene repair carries the signed token and a concrete error', async () => {
  const r = await setup([
    () => Response.json(restored),
    () =>
      Response.json(
        { error: 'bad', detail: 'Giao điểm sai', repairable: true, repairToken: 'repair.1' },
        { status: 502 },
      ),
    () => Response.json({ ...renderScene(fixture.scene), repairToken: 'repair.2' }),
  ]);
  try {
    await act(async () => button(r.root, 'Thử dựng lại').props.onClick());
    assert.equal(r.bodies[2].imageToken, 'repair.1');
    assert.equal(r.bodies[2].failure, 'Giao điểm sai');
    assert.equal(r.root.root.findAllByType('img').length, 1);
    assert.equal(r.root.root.findAllByProps({ role: 'status' }).length, 0);
  } finally {
    await r.close();
  }
});
test('failed image correction retains the last drawing and exposes the error', async () => {
  const r = await setup([
    () => Response.json(restored),
    () => Response.json({ ...renderScene(fixture.scene), repairToken: 'next' }),
    () => Response.json(restored),
    () => Response.json({ error: 'Mạng gián đoạn' }, { status: 502 }),
  ]);
  try {
    await act(async () => button(r.root, 'Thử dựng lại').props.onClick());
    const src = r.root.root.findByType('img').props.src;
    await act(async () => button(r.root, 'Hình chưa đúng').props.onClick());
    const correction = r.root.root
      .findAllByType('textarea')
      .find((t) => t.props.maxLength === 1200);
    assert(correction);
    await act(async () =>
      correction.props.onChange({ target: { value: 'Kiểm tra lại vị trí nhãn' } }),
    );
    await act(async () => button(r.root, 'Cập nhật dữ kiện hình').props.onClick());
    assert.equal(r.root.root.findByType('img').props.src, src);
    assert(
      JSON.stringify(r.root.root.findByProps({ role: 'alert' }).children).includes(
        'Mạng gián đoạn',
      ),
    );
    assert.equal(r.bodies.length, 4);
  } finally {
    await r.close();
  }
});
