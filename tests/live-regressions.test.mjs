import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { moduleURL } from './load-ts.mjs';
import { correctTheoremBridge } from '../server/theorem-checks.mjs';
import { guardTutorOutput } from '../server/strict-tutor.mjs';

const badBridge =
  'CAU_NOI: Các dấu hiệu nhận biết hình chữ nhật đều yêu cầu tứ giác đó phải là hình bình hành trước.';
const answer = `[SO_DO]
DU_KIEN: Tứ giác ABCD có AC = BD.
MUC_TIEU: Kiểm tra điều kiện của dấu hiệu đang dùng.
${badBridge}
BUOC_TIEP: Đối chiếu tiền đề của dấu hiệu với giả thiết.
[/SO_DO]
Thao tác tư duy: Phân tích — kiểm tra một điều kiện.
Gợi mở: Trong dấu hiệu em đang dùng, điều kiện nào chưa có căn cứ?`;
const messages = [
  {
    role: 'user',
    content:
      'Cho tứ giác ABCD có AC = BD. Em viết: AC = BD nên ABCD là hình chữ nhật. Thầy kiểm tra giúp em bước này.',
  },
];

test('live review regression: a false universal rectangle criterion is repaired in the public bridge', () => {
  const corrected = guardTutorOutput(answer, messages);
  assert(!corrected.includes(badBridge));
  assert.match(corrected, /Dấu hiệu dùng hai đường chéo bằng nhau áp dụng cho hình bình hành/);
  assert.match(corrected, /không phải mọi dấu hiệu/);
  assert.match(corrected, /\[SO_DO\][\s\S]*\[\/SO_DO\]/);
  assert.equal((corrected.match(/\?/g) || []).length, 1);
  assert.match(corrected, /Thao tác tư duy: Phân tích/);
});

test('theorem repair preserves valid rules, explicit negations and quoted student work', () => {
  for (const bridge of [
    'CAU_NOI: Hình bình hành có hai đường chéo bằng nhau là hình chữ nhật.',
    'CAU_NOI: Tứ giác có ba góc vuông là hình chữ nhật.',
    'CAU_NOI: Không phải mọi dấu hiệu hình chữ nhật đều cần tiền đề hình bình hành.',
    'CAU_NOI: Các dấu hiệu hình chữ nhật không nhất thiết đều yêu cầu hình bình hành.',
  ])
    assert.equal(correctTheoremBridge(bridge), bridge);
  const quote =
    'Em viết: “Các dấu hiệu nhận biết hình chữ nhật đều yêu cầu tứ giác phải là hình bình hành.”';
  assert.equal(correctTheoremBridge(quote), quote);
});

test('the theorem repair does not weaken the complete-answer guard', () => {
  const denied = guardTutorOutput(answer + '\nBước 2: Đây là lời giải hoàn chỉnh.', messages);
  assert(!denied.includes('Bước 2:'));
  assert.equal((denied.match(/\?/g) || []).length, 1);
});

let source = readFileSync(new URL('../components/math-text.tsx', import.meta.url), 'utf8').replace(
  /import 'katex\/dist\/katex.min.css';/,
  '',
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
  (_, q, path) =>
    'from ' +
    q +
    (path.startsWith('.')
      ? moduleURL(path + '.ts', new URL('../components/math-text.tsx', import.meta.url))
      : import.meta.resolve(path)) +
    q,
);
const { MathText } = await import(
  'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
);
const render = (text) => renderToStaticMarkup(React.createElement(MathText, { text }));

test('live text regression: bold notation displays as emphasis beside intact mathematical fractions', () => {
  const html = render('M là **trung điểm** của AB. $AM = \\frac{AB}{2}$.');
  assert.match(html, /<strong>trung điểm<\/strong>/);
  assert(!html.includes('**'));
  assert(html.includes('katex'));
  assert(!html.includes('katex-error'));
});

test('rich tutor text keeps model HTML escaped and leaves unfinished emphasis readable', () => {
  const html = render('**<img src=x onerror=alert(1)>** $AB$');
  assert(html.includes('&lt;img'));
  assert(!html.includes('<img'));
  assert(render('Em nhập **trung điểm').includes('**trung điểm'));
});
