// Reproducible renderer review. Fixtures exercise different families without an API key.
import { writeFile, mkdir } from 'node:fs/promises';
import { cases } from '../tests/fixtures/scene-cases.mjs';
import { renderScene } from '../public/geometry-scene.mjs';
const root = 'docs/v640-review';
await mkdir(root, { recursive: true });
const manifest = [];
for (const sample of cases()) {
  const result = renderScene(sample.scene);
  await writeFile(root + '/' + sample.name + '.svg', result.svg);
  manifest.push({
    name: sample.name,
    problem: sample.problem,
    points: sample.scene.nodes.length,
    checked: result.validation.checked,
    renderer: result.renderer,
  });
}
await writeFile(root + '/checks.json', JSON.stringify(manifest, null, 2) + '\n');
const selected = [
  'rays-eight',
  'external-altitude',
  'incircle',
  'bisector',
  'tangents',
  'secant',
  'rectangle',
  'trapezoid',
  'parabola',
  'hyperbola',
  'cuboid',
  'pyramid',
];
let parts = [];
for (const [i, name] of selected.entries()) {
  const svg = renderScene(cases().find((c) => c.name === name).scene).svg;
  parts.push(
    `<image x="${24 + (i % 3) * 568}" y="${90 + Math.floor(i / 3) * 414}" width="552" height="394.286" href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"/>`,
  );
}
await writeFile(
  root + '/gallery.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="1752" height="1780" viewBox="0 0 1752 1780"><rect width="1752" height="1780" fill="#e9eff6"/><text x="28" y="43" font-family="Arial" font-size="28" font-weight="bold" fill="#18304e">Tư duy Toán học 6.4 — Kiểm tra bộ dựng tổng quát</text><text x="28" y="70" font-family="Arial" font-size="16" fill="#526881">12 hình đại diện trong 20 nhóm kiểm thử • Kết xuất bằng bộ dựng của ứng dụng</text>${parts.join('')}<text x="28" y="1760" font-family="Arial" font-size="15" fill="#526881">Đây là kiểm thử bộ dựng; khả năng AI đọc đúng mọi đề chưa được bảo đảm.</text></svg>`,
);
console.log('Rendered ' + manifest.length + ' families and a 12-figure gallery.');
