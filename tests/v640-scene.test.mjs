import test from 'node:test';
import assert from 'node:assert/strict';
import { cases, point, node, stroke, constraint, scene } from './fixtures/scene-cases.mjs';
import { evaluateScene, renderScene } from '../public/geometry-scene.mjs';
import { parsePlotExpression } from '../public/plot-expression.mjs';
import { checkSceneSources, givenText } from '../server/scene-policy.mjs';
import { prepareTikz } from '../public/tikz-format.mjs';
const distance = (a, b) => Math.hypot(...a.map((x, i) => x - b[i]));
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const sub = (a, b) => a.map((x, i) => x - b[i]);
for (const c of cases()) {
  test('scene family: ' + c.name, () => {
    const { points, checked } = evaluateScene(c.scene),
      { svg, latex } = renderScene(c.scene);
    assert.equal(points.size, c.scene.nodes.length);
    assert.equal(checked.length, c.scene.constraints.length);
    assert.doesNotThrow(() => checkSceneSources(c.scene, c.problem));
    assert(svg.includes('<svg') && !/NaN|Infinity|undefined/.test(svg));
    for (const p of c.scene.nodes.filter((n) => n.label))
      assert(svg.includes('>' + p.label + '</text>'));
    assert.doesNotThrow(() => prepareTikz(latex));
  });
}

for (const [scale, rotation, offset] of [
  [0.15, 0.36, [-31, 11]],
  [1.75, 1.23, [17, -9]],
  [12, -2.1, [220, 76]],
]) {
  for (const c of cases().filter(
    (c) =>
      c.scene.view === 'plane' && !c.scene.strokes.some((s) => ['plot', 'axes'].includes(s.kind)),
  )) {
    test(`transformed ${c.name} ×${scale}`, () => {
      const s = structuredClone(c.scene),
        names = new Map(s.nodes.map((n, i) => [n.id, 'P' + i]));
      for (const n of s.nodes) {
        n.id = names.get(n.id);
        n.args = n.args.map((id) => names.get(id));
        if (n.op === 'free') {
          const [x, y] = n.values;
          n.values = [
            offset[0] + scale * (x * Math.cos(rotation) - y * Math.sin(rotation)),
            offset[1] + scale * (x * Math.sin(rotation) + y * Math.cos(rotation)),
          ];
        }
        if (n.op === 'distancePoint') n.values[0] *= scale;
      }
      for (const r of [...s.strokes, ...s.constraints]) r.args = r.args.map((id) => names.get(id));
      s.constraints.filter((r) => r.kind === 'length').forEach((r) => (r.value *= scale));
      const before = evaluateScene(c.scene).points,
        after = evaluateScene(s).points;
      for (const a of c.scene.nodes.filter((n) => n.label))
        for (const b of c.scene.nodes.filter((n) => n.label)) {
          const delta = Math.abs(
            distance(after.get(names.get(a.id)), after.get(names.get(b.id))) -
              scale * distance(before.get(a.id), before.get(b.id)),
          );
          assert(delta < 1e-5, 'Similarity changed ' + a.id + b.id);
        }
      assert.doesNotThrow(() => renderScene(s));
    });
  }
}
test('independent tangent dot products, lengths, and centroid ratio', () => {
  const get = (name) => evaluateScene(cases().find((c) => c.name === name).scene).points;
  const p = get('tangents');
  for (const id of ['T', 'U']) {
    const t = p.get(id);
    assert(Math.abs(distance(t, p.get('O')) - 3) < 1e-9);
    assert(Math.abs(dot(sub(t, p.get('O')), sub(p.get('P'), t))) < 1e-9);
  }
  const q = get('medians');
  assert(Math.abs(distance(q.get('A'), q.get('G')) / distance(q.get('G'), q.get('M')) - 2) < 1e-9);
});
test('forward references work; cyclic or missing dependencies fail', () => {
  const s = scene(
    'T',
    [node('M', 'midpoint', ['A', 'B']), point('B', 2, 0), point('A', 0, 0)],
    [stroke('segment', ['A', 'B'])],
  );
  assert.deepEqual(evaluateScene(s).points.get('M'), [1, 0, 0]);
  s.nodes[2] = node('A', 'midpoint', ['M', 'B']);
  assert.throws(() => evaluateScene(s), /vòng/);
  s.nodes.pop();
  assert.throws(() => evaluateScene(s), /Thiếu điểm/);
});
test('additional operations: interpolation, rotation, reflection and distance', () => {
  const s = scene(
    'T',
    [
      point('A', 0, 0),
      point('B', 4, 0),
      node('M', 'interpolate', ['A', 'B'], [0.25]),
      node('R', 'rotate', ['B', 'A'], [90]),
      node('F', 'reflect', ['B', 'A']),
      node('D', 'distancePoint', ['A', 'R'], [3]),
    ],
    [stroke('polygon', ['A', 'B', 'R'])],
  );
  const ps = evaluateScene(s).points;
  assert.deepEqual(ps.get('M'), [1, 0, 0]);
  assert(distance(ps.get('R'), [0, 4, 0]) < 1e-10);
  assert.deepEqual(ps.get('F'), [-4, 0, 0]);
  assert(distance(ps.get('D'), [0, 3, 0]) < 1e-10);
});
test('arc and right angle use computed vertices, including a full circular arc', () => {
  const s = scene(
    'C',
    [point('O', 0, 0), point('A', 3, 0), point('B', 0, 3)],
    [stroke('arc', ['O', 'A'], [0, 360]), stroke('rightAngle', ['A', 'O', 'B'])],
  );
  assert.doesNotThrow(() => renderScene(s));
  s.strokes[0].values = [0, 361];
  assert.throws(() => renderScene(s), /Góc cung/);
});
test('parallel lines, impossible circles and collinear triangle centers are rejected', () => {
  const base = [point('A', 0, 0), point('B', 2, 0), point('C', 0, 4), point('D', 2, 4)];
  for (const n of [
    node('X', 'intersection', ['A', 'B', 'C', 'D']),
    node('X', 'lineCircle', ['C', 'D', 'A', 'B'], [1]),
    node('X', 'circumcenter', ['A', 'B', 'E']),
  ]) {
    const s = scene('Invalid', [...base, point('E', 4, 0), n], [stroke('segment', ['A', 'B'])]);
    assert.throws(() => evaluateScene(s));
  }
  const noCircle = scene(
    'C',
    [
      point('A', 0, 0),
      point('B', 1, 0),
      point('C', 5, 0),
      point('D', 6, 0),
      node('X', 'circleCircle', ['A', 'B', 'C', 'D'], [1]),
    ],
    [stroke('segment', ['A', 'B'])],
  );
  assert.throws(() => evaluateScene(noCircle));
});
test('mathematical contradictions never become a successful image', () => {
  const s = scene(
    'C',
    [point('A', 0, 0), point('B', 2, 0), point('C', 1, 1)],
    [stroke('polygon', ['A', 'B', 'C'])],
    [constraint('perpendicular', ['A', 'B', 'A', 'C'])],
  );
  assert.throws(() => renderScene(s), /chưa thỏa/);
  s.constraints = [];
  s.strokes.push(stroke('rightAngle', ['B', 'A', 'C']));
  assert.throws(() => renderScene(s), /chưa vuông/);
  s.strokes.pop();
  s.strokes.push(stroke('equalMark', ['A', 'B'], [1]), stroke('equalMark', ['A', 'C'], [1]));
  assert.throws(() => renderScene(s), /độ dài khác nhau/);
});
test('ray direction and segment membership are enforced', () => {
  for (const kind of ['onRay', 'onSegment']) {
    const s = scene(
      'T',
      [point('A', 0, 0), point('B', 2, 0), point('P', -1, 0)],
      [stroke('ray', ['A', 'B'])],
      [constraint(kind, ['P', 'A', 'B'])],
    );
    assert.throws(() => renderScene(s), /chưa thỏa/);
  }
});
test('source grounding rejects proof conclusions and invented premises', () => {
  const c = cases()[0],
    problem = c.problem + ' a) Chứng minh tam giác ABC cân.';
  assert.equal(givenText(problem), c.problem);
  assert.equal(
    givenText('Cho tam giác ABC vuông tại A. M thuộc AB. Chứng minh M là trung điểm.'),
    'Cho tam giác ABC vuông tại A. M thuộc AB.',
  );
  const s = structuredClone(c.scene);
  s.constraints[0].source = 'tam giác ABC cân';
  assert.throws(() => checkSceneSources(s, problem), /giả thiết/);
  s.constraints[0].source = 'AB = 99';
  assert.throws(() => checkSceneSources(s, problem));
  s.constraints[0].source = '';
  assert.throws(() => checkSceneSources(s, problem));
});
test('untrusted labels are escaped, markup and expressions cannot execute code', () => {
  const c = structuredClone(cases()[0].scene);
  c.title = '<script>alert(1)</script>';
  c.nodes[0].label = '<img src=x onerror=1>';
  const { svg } = renderScene(c);
  assert(!svg.includes('<script>'));
  assert(svg.includes('&lt;img'));
  for (const input of [
    'process.exit()',
    'constructor(1)',
    'x;fetch(1)',
    'Math.sin(x)',
    'x=>x',
    '<script>',
    '__proto__',
    '1e999',
    'x'.repeat(201),
  ])
    assert.throws(() => parsePlotExpression(input));
});
test('arithmetic parser has correct precedence, associativity and domain gaps', () => {
  for (const [expression, x, expected] of [
    ['-x^2', 3, -9],
    ['2^3^2', 0, 512],
    ['2^-2', 0, 0.25],
    ['sin(pi/2)+cos(0)', 0, 2],
    ['sqrt(x)+abs(-3)', 4, 5],
    ['1e-2*x', 2, 0.02],
    ['ln(e)+log(100)', 0, 3],
  ])
    assert(Math.abs(parsePlotExpression(expression)(x) - expected) < 1e-10);
  assert(Number.isNaN(parsePlotExpression('sqrt(x)')(-1)));
  assert.throws(() =>
    renderScene(
      scene('No domain', [], [stroke('plot', [], [-3, -1, 0, 5], '', 'main', 'sqrt(x)')]),
    ),
  );
  const { svg } = renderScene(cases().find((c) => c.name === 'hyperbola').scene);
  assert.equal((svg.match(/<polyline/g) || []).length, 2, 'Two branches must not join across x=0');
});
test('oversized, non-finite, duplicate, degenerate and nonplanar input rejected', () => {
  const c = cases()[0].scene;
  for (const mutate of [
    (s) => {
      s.nodes[0].values[0] = Infinity;
    },
    (s) => s.nodes.push(s.nodes[0]),
    (s) => {
      s.nodes[0].values = [0, 0, 1];
    },
    (s) => {
      s.nodes = Array(65).fill(point('A', 0, 0));
    },
    (s) => {
      s.nodes[0].id = '__proto__';
    },
    (s) => {
      s.strokes[0].kind = 'script';
    },
  ]) {
    const s = structuredClone(c);
    mutate(s);
    assert.throws(() => renderScene(s));
  }
  assert.throws(() =>
    renderScene(
      scene(
        'T',
        [point('A', 0, 0), point('B', 1, 1), point('C', 2, 2)],
        [stroke('polygon', ['A', 'B', 'C'])],
      ),
    ),
  );
  assert.throws(() =>
    renderScene(
      scene(
        'T',
        [point('A', 0, 0, 0), point('B', 1, 0, 0), point('C', 1, 1, 0), point('D', 0, 1, 1)],
        [stroke('polygon', ['A', 'B', 'C', 'D'])],
        [],
        'space',
      ),
    ),
  );
});
