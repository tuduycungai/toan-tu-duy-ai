// Static review uses the application's actual coordinate renderer. No API call.
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdir, writeFile } from 'node:fs/promises';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { compileGeometry } = await vite.ssrLoadModule('/lib/geometry-model.ts');
  const { DiagramSVG } = await vite.ssrLoadModule('/components/problem-figure.tsx');
  const problem =
    'Cho tam giác ABC có đường cao AI. Từ A kẻ tia Ax vuông góc với AC, từ B kẻ tia By song song với AC. Gọi M là giao điểm của tia Ax và tia By. Nối M với trung điểm P của AB, đường MP cắt AC tại Q và BQ cắt AI tại H. a) Tứ giác AMBQ là hình gì?';
  const model = compileGeometry(problem);
  if (model.status !== 'verified') throw Error(model.missingData.join('; '));
  let svg = renderToStaticMarkup(createElement(DiagramSVG, { drawing: model.drawing, aux: true }));
  svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="810" ');
  svg = svg.replace(
    /(<svg[^>]*>)/,
    '$1<style>text{font-family:Arial,sans-serif}.problem-fill{fill:#e2f2f0;opacity:.65}.problem-edge{stroke:#295cc0;stroke-width:2.2;stroke-linecap:round}.problem-aux{stroke:#268276;stroke-width:1.65;stroke-dasharray:7 5}.problem-mark{stroke:#203147;stroke-width:1.5;stroke-linecap:round}.problem-point{fill:#295cc0}.problem-label{fill:#203147;font-size:16px;font-weight:700;paint-order:stroke;stroke:white;stroke-width:4px;stroke-linejoin:round}</style><rect width="560" height="405" fill="white"/>',
  );
  await mkdir('docs/v631-review', { recursive: true });
  await writeFile('docs/v631-review/hinh-bai-toan.svg', svg);
  await writeFile(
    'docs/v631-review/kiem-tra-hinh.json',
    JSON.stringify(
      { problem, status: model.status, checks: model.givens, points: model.drawing.points },
      null,
      2,
    ) + '\n',
  );
  console.log('Saved verified drawing and numerical checks to docs/v631-review.');
} finally {
  await vite.close();
}
