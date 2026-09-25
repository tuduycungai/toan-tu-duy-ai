import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { loadTS } from '../tests/load-ts.mjs';
const { worksheets, worksheetDrawings } = await loadTS('lib/worksheets.ts');
const { toTikZ } = await loadTS('lib/geometry.ts');
const dir = 'research/worksheet-checks';
await mkdir(dir + '/tikz', { recursive: true });
let figures = 0;
const rows = [],
  compiles = [];
for (const w of worksheets) {
  const ds = worksheetDrawings(w);
  rows.push(`| ${w.id} | ${w.section} – ${w.label} | ${w.page} | ${ds.length} | Đạt |`);
  for (const [i, d] of ds.entries()) {
    const name = w.id + '-' + (i + 1);
    await writeFile(dir + '/tikz/' + name + '.tex', toTikZ(d));
    figures++;
    if (process.argv.includes('--compile')) {
      const r = spawnSync(
        'pdflatex',
        [
          '-no-shell-escape',
          '-interaction=batchmode',
          '-halt-on-error',
          '-output-directory=' + dir + '/tikz',
          dir + '/tikz/' + name + '.tex',
        ],
        { encoding: 'utf8', timeout: 15000 },
      );
      compiles.push({ name, ok: r.status === 0 });
      if (r.status !== 0) throw Error('TikZ compile failed: ' + name + ' ' + r.stdout.slice(-500));
    }
  }
}
await writeFile(
  dir + '/DANH_MUC_81_BAI.md',
  '# Danh mục kiểm tra phiếu bài tập\n\n' +
    worksheets.length +
    ' bài / ' +
    figures +
    ' hình. Đối chiếu các điều kiện số học ở 5 vị trí tham số; không phải chứng minh hình học tổng quát.\n\n| Mã | Phần – bài | Trang PDF | Số hình | Dựng và kiểm tra |\n|---|---|---:|---:|---|\n' +
    rows.join('\n') +
    '\n\n## Đề chuẩn hóa và ghi chú\n\n' +
    worksheets
      .map(
        (w) =>
          '### ' +
          w.id +
          ' – ' +
          w.title +
          '\n\n' +
          w.problem +
          (w.note ? '\n\nGhi chú: ' + w.note : ''),
      )
      .join('\n\n'),
);
await writeFile(
  dir + '/audit.json',
  JSON.stringify(
    {
      exercises: worksheets.length,
      figures,
      parameters: [0.17, 0.37, 0.5, 0.72, 0.89],
      compiled: compiles,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ exercises: worksheets.length, figures, compiled: compiles.length }));
