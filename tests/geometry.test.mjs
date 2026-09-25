import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTS } from './load-ts.mjs';
const g = await loadTS('lib/geometry.ts'),
  p = await loadTS('lib/problem-diagram.ts'),
  { lessons, parseTutorResponse } = await loadTS('lib/learning.ts');
export const screenshotProblem =
  'Cho hình bình hành ABCD, gọi O là giao điểm của hai đường chéo. Trên AB lấy điểm K, trên CD lấy điểm I sao cho AK bằng CI. Chứng minh rằng ba điểm K, O, I thẳng hàng và các đường thẳng AC, BD, KI đồng quy.';
function ready(q) {
  const r = p.resolveProblemDiagram(q);
  assert.equal(r.status, 'ready', JSON.stringify(r));
  return r.drawing;
}
const coords = (d) => d.points,
  len = (d, a, b) => g.distance(d.points[a], d.points[b]);
const base = () => ({
  title: 'Test',
  kind: 'parallelogram',
  vertices: ['A', 'B', 'C', 'D'],
  points: [],
  segments: [],
  marks: [],
});

test('regression screenshot: AK = CI, K/O/I collinear, independent of a model response', () => {
  const d = ready(screenshotProblem),
    v = coords(d);
  assert(g.near(len(d, 'A', 'K'), len(d, 'C', 'I')));
  assert(!g.near(len(d, 'A', 'K'), len(d, 'D', 'I')));
  assert(g.onSegment(v.O, v.K, v.I));
  assert(g.onSegment(v.K, v.A, v.B));
  assert(g.onSegment(v.I, v.C, v.D));
  assert(
    !g.near(len(d, 'A', 'K'), len(d, 'K', 'B')),
    'Do not hide direction error by using the midpoint',
  );
});
test('original wrong screenshot coordinates are rejected against the actual problem', () => {
  const d = ready(screenshotProblem);
  d.points.I = g.lerp(d.points.D, d.points.C, len(d, 'A', 'K') / len(d, 'A', 'B'));
  assert.throws(
    () => p.verifyConstraints(d, p.parseProblem(screenshotProblem).constraints),
    /AK = CI/,
  );
});
for (const [label, q] of [
  ['reverse equality', screenshotProblem.replace('AK bằng CI', 'CI = AK')],
  ['reverse segment endpoint names', screenshotProblem.replace('AK bằng CI', 'KA = IC')],
  ['reverse CD membership description', screenshotProblem.replace('trên CD', 'trên DC')],
  [
    'symbol membership',
    screenshotProblem.replace(
      'Trên AB lấy điểm K, trên CD lấy điểm I sao cho',
      'K ∈ AB, I ∈ CD và',
    ),
  ],
  ['new lines and spaces', screenshotProblem.replaceAll(' ', ' \n ')],
  ['Unicode decomposed Vietnamese', screenshotProblem.normalize('NFD')],
])
  test('same verified result: ' + label, () => {
    const d = ready(q);
    assert(g.near(len(d, 'A', 'K'), len(d, 'C', 'I')));
    assert(g.onSegment(d.points.O, d.points.K, d.points.I));
  });
test('renamed vertices and free points retain direction', () => {
  const d = ready(
    'Cho hình bình hành MNPQ, gọi O là giao điểm của hai đường chéo. Trên MN lấy điểm E, trên PQ lấy điểm F sao cho ME bằng PF. Chứng minh E, O, F thẳng hàng.',
  );
  assert(g.near(len(d, 'M', 'E'), len(d, 'P', 'F')));
  assert(g.onSegment(d.points.O, d.points.E, d.points.F));
});
test('do not force a desired conclusion when the given is AK = DI instead', () => {
  const d = ready(screenshotProblem.replace('AK bằng CI', 'AK bằng DI'));
  assert(g.near(len(d, 'A', 'K'), len(d, 'D', 'I')));
  assert(!g.onSegment(d.points.O, d.points.K, d.points.I));
  assert(
    !p.parseProblem(screenshotProblem).constraints.some((c) => c.type === 'on' && c.point === 'O'),
  );
});
for (const lesson of lessons)
  test('all six curated problems render without any Gemini diagram: ' + lesson.id, () => {
    const d = ready(lesson.problem);
    assert(d.points.A);
    assert(d.segments.length >= 4);
    assert(d.checks.length >= 3);
    for (const s of d.segments) assert(g.segmentVisible(d, s));
  });
test('subsegments AE and CF on drawn AB/CD accept valid equal and parallel marks', () => {
  const r = base();
  r.points = [
    { name: 'E', op: 'midpoint', of: ['A', 'B'] },
    { name: 'F', op: 'midpoint', of: ['C', 'D'] },
  ];
  r.marks = [
    {
      type: 'equal',
      segments: [
        ['A', 'E'],
        ['C', 'F'],
      ],
    },
    {
      type: 'parallel',
      segments: [
        ['A', 'E'],
        ['C', 'F'],
      ],
    },
  ];
  const d = g.construct(r);
  assert(g.segmentVisible(d, ['A', 'E']));
  assert(g.segmentVisible(d, ['C', 'F']));
});
test('subsegment visibility never accepts a line off the drawn edge', () => {
  const d = ready(screenshotProblem);
  assert(!g.segmentVisible({ ...d, segments: [['A', 'B']] }, ['A', 'I']));
});
test('trapezoid example uses exact supplied lengths, not a decorative sketch', () => {
  const d = p.lessonDrawing('trapezoid');
  assert(g.near(len(d, 'A', 'B'), 8));
  assert(g.near(len(d, 'C', 'D'), 14));
  assert(g.near(len(d, 'D', 'E'), 3));
  assert(g.near(len(d, 'C', 'F'), 3));
});
test('square example constrains AE = AF and computes G, without assuming the goal', () => {
  const d = p.lessonDrawing('square');
  assert(g.near(len(d, 'A', 'E'), len(d, 'A', 'F')));
  assert(g.onSegment(d.points.G, d.points.A, d.points.C));
  assert(g.onSegment(d.points.G, d.points.E, d.points.F));
  assert(g.perpendicular(d.points.A, d.points.C, d.points.E, d.points.F));
  assert(!d.marks.some((m) => m.type === 'right' && m.at === 'G'));
});
test('counterexample remains a counterexample', () => {
  const d = p.lessonDrawing('counterexample');
  assert(g.near(len(d, 'A', 'C'), len(d, 'B', 'D')));
  assert(g.perpendicular(d.points.A, d.points.C, d.points.B, d.points.D));
  assert(!g.near(len(d, 'A', 'O'), len(d, 'C', 'O')));
});
for (const q of [
  'Cho hình bình hành ABCD có hai đường chéo AC và BD vuông góc. Chứng minh ABCD là hình thoi.',
  'Cho hình bình hành ABCD có hai đường chéo bằng nhau. Chứng minh ABCD là hình chữ nhật.',
  'Cho tam giác ABC vuông tại A, M là trung điểm của BC. Lấy D đối xứng với A qua M. Chứng minh ABDC là hình chữ nhật.',
  'Cho hình thang cân ABCD có AB ∥ CD và AB < CD. Kẻ AE ⟂ CD, BF ⟂ CD (E, F ∈ CD). Chứng minh DE = CF.',
  'Cho tứ giác lồi ABCD. E, F, G, H lần lượt là trung điểm của AB, BC, CD, DA. Chứng minh EFGH là hình bình hành.',
  'Cho hình vuông ABCD. E nằm trong cạnh AB, F nằm trong cạnh AD sao cho AE = AF. Chứng minh CE = CF.',
])
  test('construct common non-template problem: ' + q.slice(0, 65), () => {
    ready(q);
  });
for (const [name, q] of [
  [
    'unknown additional angle',
    screenshotProblem.replace('. Chứng minh', ' và ∠DAB = 60°. Chứng minh'),
  ],
  [
    'a bisector cannot be guessed',
    screenshotProblem.replace('. Chứng minh', ' và KI là phân giác góc ABC. Chứng minh'),
  ],
  ['missing definition of I', screenshotProblem.replace('trên CD lấy điểm I', 'lấy điểm I')],
  ['unknown vertex', screenshotProblem.replace('AK bằng CI', 'AK = CZ')],
  ['inconsistent square condition', 'Cho hình vuông ABCD có AB ⟂ CD. Chứng minh AC = BD.'],
  ['conflicting lengths', 'Cho hình vuông ABCD có AB = 3 cm, CD = 4 cm. Chứng minh AC = BD.'],
])
  test('withhold unsafe diagram: ' + name, () =>
    assert.notEqual(p.resolveProblemDiagram(q).status, 'ready'),
  );
test('raw model JSON, even malicious or geometrically plausible, is hidden and cannot affect a figure', () => {
  const raw =
    '[SO_DO]\nDU_KIEN: A\nMUC_TIEU: B\nCAU_NOI: C\nBUOC_TIEP: D\n[/SO_DO]\n[HINH_VE]{"I":[2,3],"run":"<script>bad()</script>"}[/HINH_VE]\nThao tác tư duy: Phân tích.\nGợi mở: Em dùng dấu hiệu nào?';
  const r = parseTutorResponse(raw);
  assert(!r.text.includes('HINH_VE'));
  assert(!r.text.includes('script'));
  assert(r.plan);
  assert.equal(ready(screenshotProblem).points.I.x, 5.0600000000000005);
});
test('TikZ exports the exact numeric coordinates and safe labels', () => {
  const d = ready(screenshotProblem),
    tex = g.toTikZ(d);
  assert(tex.includes('\\coordinate (p6) at (5.06,3.5);'));
  assert(tex.includes('\\documentclass[tikz,border=8pt]{standalone}'));
  assert(!tex.includes('write18'));
  assert(!tex.includes('input{'));
  assert(tex.endsWith('\\end{document}\n'));
});
test('unsafe point names are refused, including TeX injection', () => {
  const r = base();
  r.vertices[0] = 'A}\\input{secrets}';
  assert.throws(() => g.construct(r));
});
test('invalid intersection, NaN, duplicate points, degenerate bases are rejected', () => {
  const r = base();
  r.points = [
    {
      name: 'O',
      op: 'intersection',
      lines: [
        ['A', 'B'],
        ['C', 'D'],
      ],
    },
  ];
  assert.throws(() => g.construct(r));
  r.points = [{ name: 'K', op: 'on', of: ['A', 'B'], ratio: NaN }];
  assert.throws(() => g.construct(r));
  r.points = [{ name: 'A', op: 'midpoint', of: ['B', 'C'] }];
  assert.throws(() => g.construct(r));
  r.points = [];
  r.coords = [
    { x: 0, y: 0 },
    { x: 2, y: 2 },
    { x: 0, y: 2 },
    { x: 2, y: 0 },
  ];
  assert.throws(() => g.construct(r));
});
test('false relation marks are refused', () => {
  const r = base();
  r.marks = [
    {
      type: 'equal',
      segments: [
        ['A', 'B'],
        ['B', 'C'],
      ],
    },
  ];
  assert.throws(() => g.construct(r));
  r.marks = [{ type: 'right', at: 'A', arms: ['B', 'D'] }];
  assert.throws(() => g.construct(r));
});
test('a new problem resets the source; followup preserves it; generated exercises clear it', () => {
  assert.equal(p.problemForTurn('Em chưa hiểu.', screenshotProblem), screenshotProblem);
  assert.equal(p.problemForTurn('Vẽ lại hình.', screenshotProblem), screenshotProblem);
  assert.equal(p.problemForTurn('Hãy cho em một bài tương tự.', screenshotProblem), '');
  const next = 'Hình vuông MNPQ có E là trung điểm MN. Chứng minh PE = QE.';
  assert.equal(p.problemForTurn(next, screenshotProblem), next);
  assert.equal(p.problemForTurn(screenshotProblem, ''), screenshotProblem);
});
test('equalOn remains anchored to C over multiple free positions and parallelograms', () => {
  for (const skew of [-1.8, 0.4, 2.6])
    for (const ratio of [0.12, 0.32, 0.61, 0.87]) {
      const r = base();
      r.coords = [
        [0, 0],
        [6, 0],
        [6 + skew, 3.5],
        [skew, 3.5],
      ].map(([x, y]) => ({ x, y }));
      r.points = [
        { name: 'K', op: 'on', of: ['A', 'B'], ratio },
        { name: 'I', op: 'equalOn', of: ['C', 'D'], length: ['A', 'K'] },
        {
          name: 'O',
          op: 'intersection',
          lines: [
            ['A', 'C'],
            ['B', 'D'],
          ],
        },
      ];
      r.segments = [
        ['A', 'C'],
        ['B', 'D'],
        ['K', 'I'],
      ];
      const d = g.construct(r);
      assert(g.near(len(d, 'A', 'K'), len(d, 'C', 'I')));
      assert(g.onSegment(d.points.O, d.points.K, d.points.I));
    }
});
test('decimal changes cannot select an old lesson drawing', () => {
  const l = lessons.find((l) => l.id === 'trapezoid');
  const r = p.resolveProblemDiagram(l.problem.replace('14 cm', '1.4 cm'));
  if (r.status === 'ready') assert(g.near(len(r.drawing, 'C', 'D'), 1.4));
});
test('renamed prime points cannot select an old lesson drawing', () => {
  const l = lessons.find((l) => l.id === 'square');
  assert.notEqual(p.resolveProblemDiagram(l.problem.replaceAll('E', "E'")).status, 'ready');
});
test('a correction without a full new statement withholds the old diagram', () => {
  const text = 'Em sửa đề: K thuộc AD.';
  const next = p.problemForTurn(text, screenshotProblem);
  assert.equal(next, text);
  assert.equal(p.resolveProblemDiagram(next).status, 'unsupported');
});
test('later subquestion data is parsed and verified, not dropped after the first goal', () => {
  const q = lessons.find((l) => l.id === 'trapezoid').problem.replace('14 cm', '16 cm');
  const d = ready(q);
  assert(g.near(len(d, 'A', 'B'), 8));
  assert(g.near(len(d, 'C', 'D'), 16));
  assert(g.near(len(d, 'D', 'E'), 4));
});
