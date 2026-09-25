import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTS } from './load-ts.mjs';
const { resolveProblemDiagram, parseProblem } = await loadTS('lib/problem-diagram.ts');
const { distance, near, onSegment, segmentVisible, toTikZ } = await loadTS('lib/geometry.ts');
const screenshot =
  'Cho hình bình hành ABCD . Gọi K , I lần lượt là trung điểm các cạnh AB và CD . Chứng minh: AI=CK';
function ready(q) {
  const r = resolveProblemDiagram(q);
  assert.equal(r.status, 'ready', JSON.stringify(r));
  return r.drawing;
}
function checkMidpoints(d, k = 'K', i = 'I', vertices = 'ABCD') {
  const p = d.points,
    [a, b, c, e] = vertices.split('');
  assert(onSegment(p[k], p[a], p[b]));
  assert(near(distance(p[k], p[a]), distance(p[k], p[b])));
  assert(onSegment(p[i], p[c], p[e]));
  assert(near(distance(p[i], p[c]), distance(p[i], p[e])));
}
test('exact screenshot: midpoint wording is recognized and both AI/CK are drawn', () => {
  const d = ready(screenshot);
  checkMidpoints(d);
  assert(segmentVisible(d, ['A', 'I']));
  assert(segmentVisible(d, ['C', 'K']));
  assert(near(distance(d.points.A, d.points.I), distance(d.points.C, d.points.K)));
  assert.equal(
    parseProblem(screenshot).constraints.filter((c) => c.type === 'equal').length,
    0,
    'AI = CK is a goal, not an assumed given',
  );
  assert.equal(d.marks.length, 2);
});
const descriptions = [
  'K, I lần lượt là trung điểm của AB và CD',
  'K và I lần lượt là trung điểm các cạnh AB và CD',
  'K, I lần lượt là trung điểm của các cạnh AB, CD',
  'K và I là trung điểm của hai cạnh AB và CD',
  'K, I là các trung điểm của AB và CD',
  'K, I là hai trung điểm của các đoạn AB và CD',
  'K, I lần lượt là trung điểm hai đoạn thẳng AB, CD',
  'K và I lần lượt là trung điểm của các đoạn thẳng AB và CD',
  'K, I là trung điểm đoạn thẳng AB và đoạn thẳng CD',
  'K, I là trung điểm cạnh AB và cạnh CD',
  'hai điểm K và I lần lượt là trung điểm các cạnh AB và CD',
  'các điểm K, I lần lượt là trung điểm của AB và CD',
  'K là trung điểm cạnh AB và I là trung điểm cạnh CD',
  'K là trung điểm của đoạn thẳng AB; I là trung điểm của CD',
  'K là trung điểm AB. I là trung điểm CD',
  'K, I tương ứng là trung điểm của AB và CD',
  'Trung điểm của các cạnh AB và CD lần lượt là K, I',
  'Trung điểm hai đoạn thẳng AB, CD lần lượt là K và I',
  'Trung điểm của AB là K; trung điểm của CD là I',
  'AB và CD lần lượt có trung điểm là K và I',
  'AB, CD có các trung điểm lần lượt là K, I',
];
for (const clause of descriptions)
  test('equivalent natural description: ' + clause, () =>
    checkMidpoints(ready('Cho hình bình hành ABCD. Gọi ' + clause + '. Chứng minh AI = CK.')),
  );
test('uppercase, lowercase point names, whitespace and Unicode composition preserve the same geometry', () => {
  for (const q of [
    screenshot.toUpperCase(),
    screenshot.toLowerCase(),
    screenshot.replaceAll(' ', '\n  '),
    screenshot.normalize('NFD'),
  ]) {
    const d = ready(q);
    checkMidpoints(d);
    assert(segmentVisible(d, ['A', 'I']));
    assert(segmentVisible(d, ['C', 'K']));
  }
});
test('ordered lists keep their order, even if the given edges are reversed', () => {
  const d = ready(
    'Cho hình bình hành ABCD. Gọi K và I lần lượt là trung điểm các cạnh CD và AB. Chứng minh AK = CI.',
  );
  const p = d.points;
  assert(onSegment(p.K, p.C, p.D));
  assert(onSegment(p.I, p.A, p.B));
  assert(!onSegment(p.K, p.A, p.B));
});
test('renaming points does not select a memorized example', () => {
  const d = ready(
    'Cho hình bình hành MNPQ. Gọi E, F lần lượt là trung điểm các cạnh MN và PQ. Chứng minh MF = PE.',
  );
  checkMidpoints(d, 'E', 'F', 'MNPQ');
  assert(segmentVisible(d, ['M', 'F']));
  assert(segmentVisible(d, ['P', 'E']));
});
test('four midpoint list accepts commas and a final và', () => {
  const d = ready(
    'Cho tứ giác lồi ABCD. E, F, G và H lần lượt là trung điểm các cạnh AB, BC, CD và DA. Chứng minh EFGH là hình bình hành.',
  );
  for (const [m, a, b] of [
    ['E', 'A', 'B'],
    ['F', 'B', 'C'],
    ['G', 'C', 'D'],
    ['H', 'D', 'A'],
  ]) {
    assert(onSegment(d.points[m], d.points[a], d.points[b]));
    assert(near(distance(d.points[m], d.points[a]), distance(d.points[m], d.points[b])));
  }
});
test('one common midpoint verifies both segments instead of guessing a second point', () => {
  const d = ready(
    'Cho hình bình hành ABCD. O là trung điểm hai đường chéo AC và BD. Chứng minh OA = OC.',
  );
  assert(near(distance(d.points.O, d.points.A), distance(d.points.O, d.points.C)));
  assert(near(distance(d.points.O, d.points.B), distance(d.points.O, d.points.D)));
});
for (const clause of [
  'K, I lần lượt là trung điểm các cạnh AB, BC và CD',
  'K, I, M lần lượt là trung điểm các cạnh AB và CD',
  'K, I lần lượt là trung điểm các cạnh AB và CZ',
  'K, I không phải là trung điểm các cạnh AB và CD',
  "K', I là trung điểm các cạnh AB và CD",
  'K, I là trung điểm các cạnh AB và CD, K không thuộc AB',
  'K là trung điểm cạnh AB; K là trung điểm cạnh CD',
])
  test('do not hide missing or contradictory midpoint data: ' + clause, () =>
    assert.notEqual(
      resolveProblemDiagram('Cho hình bình hành ABCD. ' + clause + '. Chứng minh AI = CK.').status,
      'ready',
    ),
  );
test('TikZ contains the verified midpoints and required segments', () => {
  const tex = toTikZ(ready(screenshot));
  assert(tex.includes('\\coordinate (p4) at (3,0);'));
  assert(tex.includes('\\coordinate (p5) at (4.4,3.5);'));
  assert(tex.includes('(p0) -- (p5)'));
  assert(tex.includes('(p2) -- (p4)'));
});
