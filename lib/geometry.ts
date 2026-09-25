/** Geometry construction and validation. Never executes model code or trusts model coordinates. */
export type XY = { x: number; y: number };
export type Segment = [string, string];
export type DirectedLine = {
  through: string;
  of: Segment;
  relation: 'parallel' | 'perpendicular';
  name?: string;
  ray?: boolean;
};
export type LineRef = Segment | DirectedLine;
export type Mark =
  | { type: 'equal' | 'parallel'; segments: Segment[] }
  | { type: 'right'; at: string; arms: Segment };
export type Construction =
  | { name: string; op: 'midpoint'; of: Segment }
  | { name: string; op: 'on'; of: Segment; ratio: number }
  | { name: string; op: 'equalOn'; of: Segment; length: Segment; factor?: number }
  | { name: string; op: 'intersection'; lines: [LineRef, LineRef] }
  | { name: string; op: 'reflect'; of: Segment }
  | { name: string; op: 'foot'; from: string; of: Segment };
export type Shape =
  | 'quadrilateral'
  | 'parallelogram'
  | 'rectangle'
  | 'rhombus'
  | 'square'
  | 'trapezoid'
  | 'isosceles-trapezoid'
  | 'triangle'
  | 'right-triangle'
  | 'isosceles-triangle';
export type Recipe = {
  title: string;
  kind: Shape;
  vertices: string[];
  coords?: XY[];
  points: Construction[];
  segments: Segment[];
  marks: Mark[];
  outline?: string[];
  guides?: DirectedLine[];
};
export type Drawing = {
  title: string;
  points: Record<string, XY>;
  outline: string[];
  segments: Segment[];
  marks: Mark[];
  checks: string[];
  guides?: { name: string; a: XY; b: XY; ray?: boolean }[];
  interpretation?: 'ai';
  circles?: { center: string; radius: number }[];
  rays?: { from: string; through: string }[];
};
export type DiagramResult =
  | { status: 'ready'; drawing: Drawing }
  | { status: 'unsupported' | 'invalid' | 'none'; note: string };
export const EPS = 1e-7;
export const sub = (a: XY, b: XY): XY => ({ x: a.x - b.x, y: a.y - b.y });
export const cross = (a: XY, b: XY) => a.x * b.y - a.y * b.x;
export const dot = (a: XY, b: XY) => a.x * b.x + a.y * b.y;
export const norm = (a: XY) => Math.hypot(a.x, a.y);
export const distance = (a: XY, b: XY) => norm(sub(a, b));
export const near = (a: number, b: number) =>
  Math.abs(a - b) <= EPS * Math.max(1, Math.abs(a), Math.abs(b));
export const lerp = (a: XY, b: XY, t: number): XY => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
export function onSegment(p: XY, a: XY, b: XY) {
  const v = sub(b, a),
    w = sub(p, a);
  return (
    norm(v) > EPS &&
    Math.abs(cross(v, w)) <= EPS * Math.max(1, norm(v) * norm(w)) &&
    dot(w, v) >= -EPS &&
    dot(w, v) <= dot(v, v) + EPS
  );
}
export function parallel(a: XY, b: XY, c: XY, d: XY) {
  const u = sub(b, a),
    v = sub(d, c);
  return norm(u) > EPS && norm(v) > EPS && Math.abs(cross(u, v)) <= EPS * norm(u) * norm(v);
}
export function perpendicular(a: XY, b: XY, c: XY, d: XY) {
  const u = sub(b, a),
    v = sub(d, c);
  return norm(u) > EPS && norm(v) > EPS && Math.abs(dot(u, v)) <= EPS * norm(u) * norm(v);
}
export function intersection(a: XY, b: XY, c: XY, d: XY): XY {
  const u = sub(b, a),
    v = sub(d, c),
    det = cross(u, v);
  if (Math.abs(det) < EPS * norm(u) * norm(v))
    throw Error('Hai đường không có giao điểm duy nhất.');
  return lerp(a, b, cross(sub(c, a), v) / det);
}
export const linePoints = (line: LineRef): string[] =>
  Array.isArray(line) ? line : [line.through, ...line.of];
export function resolveLine(line: LineRef, points: Record<string, XY>): [XY, XY] {
  const p = (n: string) => {
    if (!Object.hasOwn(points, n)) throw Error('Thiếu điểm ' + n);
    return points[n];
  };
  if (Array.isArray(line)) {
    const a = p(line[0]),
      b = p(line[1]);
    if (distance(a, b) < EPS) throw Error('Hai điểm trùng nhau chưa xác định được đường thẳng.');
    return [a, b];
  }
  const a = p(line.through),
    v = sub(p(line.of[1]), p(line.of[0]));
  if (norm(v) < EPS) throw Error('Hướng của đường thẳng chưa xác định.');
  const w = line.relation === 'parallel' ? v : { x: -v.y, y: v.x };
  return [a, { x: a.x + w.x, y: a.y + w.y }];
}
export const describeLine = (line: LineRef) =>
  Array.isArray(line)
    ? line.join('')
    : line.name ||
      'đường qua ' +
        line.through +
        ' ' +
        (line.relation === 'parallel' ? '∥' : '⟂') +
        ' ' +
        line.of.join('');
export function onLine(point: XY, line: LineRef, points: Record<string, XY>) {
  const [a, b] = resolveLine(line, points);
  return (
    Math.abs(cross(sub(b, a), sub(point, a))) <=
    EPS * Math.max(1, distance(a, b) * distance(point, a))
  );
}
export function pointGroups(d: Drawing): { names: string[]; point: XY }[] {
  const groups: { names: string[]; point: XY }[] = [];
  for (const [name, point] of Object.entries(d.points)) {
    const found = groups.find((g) => distance(g.point, point) < EPS);
    if (found) found.names.push(name);
    else groups.push({ names: [name], point });
  }
  return groups;
}
export const defaults: Record<Shape, number[][]> = {
  quadrilateral: [
    [0, 0],
    [6, 0.6],
    [5, 4],
    [-1, 3],
  ],
  parallelogram: [
    [0, 0],
    [6, 0],
    [7.4, 3.5],
    [1.4, 3.5],
  ],
  rectangle: [
    [0, 0],
    [6, 0],
    [6, 3.6],
    [0, 3.6],
  ],
  rhombus: [
    [0, 0],
    [5, 0],
    [8, 4],
    [3, 4],
  ],
  square: [
    [0, 0],
    [4, 0],
    [4, 4],
    [0, 4],
  ],
  trapezoid: [
    [1.2, 3.6],
    [4.6, 3.6],
    [6, 0],
    [0, 0],
  ],
  'isosceles-trapezoid': [
    [1.3, 3.6],
    [4.7, 3.6],
    [6, 0],
    [0, 0],
  ],
  triangle: [
    [0, 3.8],
    [-2, 0],
    [4, 0],
  ],
  'right-triangle': [
    [0, 0],
    [5, 0],
    [0, 3.6],
  ],
  'isosceles-triangle': [
    [0, 4],
    [-3, 0],
    [3, 0],
  ],
};
export function validateShape(kind: Shape, q: XY[]) {
  const size = kind.includes('triangle') ? 3 : 4;
  if (q.length !== size) throw Error('Sai số đỉnh.');
  for (let i = 0; i < q.length; i++)
    if (distance(q[i], q[(i + 1) % q.length]) < EPS) throw Error('Cạnh suy biến.');
  const turns = q.map((p, i) =>
    cross(sub(q[(i + 1) % q.length], p), sub(q[(i + 2) % q.length], q[(i + 1) % q.length])),
  );
  if (turns.some((t) => Math.abs(t) < EPS) || !turns.every((t) => t * turns[0] > 0))
    throw Error('Sai thứ tự đỉnh hoặc hình suy biến.');
  const [a, b, c, d] = q;
  if (
    ['parallelogram', 'rectangle', 'rhombus', 'square'].includes(kind) &&
    !(parallel(a, b, c, d) && parallel(a, d, b, c))
  )
    throw Error('Không đúng hình bình hành.');
  if (['rectangle', 'square', 'right-triangle'].includes(kind) && !perpendicular(a, b, a, d || c))
    throw Error('Thiếu góc vuông.');
  if (['rhombus', 'square'].includes(kind) && !near(distance(a, b), distance(a, d)))
    throw Error('Cạnh kề không bằng nhau.');
  if (kind.includes('trapezoid') && !parallel(a, b, c, d)) throw Error('Hai đáy không song song.');
  if (
    kind === 'isosceles-trapezoid' &&
    (!near(distance(a, d), distance(b, c)) || parallel(a, d, b, c))
  )
    throw Error('Hình thang cân chưa phù hợp.');
  if (kind === 'isosceles-triangle' && !near(distance(a, b), distance(a, c)))
    throw Error('Tam giác không cân tại đỉnh thứ nhất.');
}
export function construct(recipe: Recipe): Drawing {
  if (
    !Object.hasOwn(defaults, recipe.kind) ||
    recipe.points.length > 20 ||
    recipe.segments.length > 40 ||
    recipe.marks.length > 16
  )
    throw Error('Cấu hình hình vẽ không hợp lệ.');
  const points: Record<string, XY> = Object.create(null);
  const validName = (n: string) => /^[A-Z](?:[0-9]{1,2}|['′]{1,2})?$/.test(n);
  function put(n: string, p: XY) {
    if (
      !validName(n) ||
      Object.hasOwn(points, n) ||
      ![p.x, p.y].every((v) => Number.isFinite(v) && Math.abs(v) < 1e4)
    )
      throw Error('Tên điểm hoặc vị trí không hợp lệ.');
    points[n] = p;
  }
  function p(n: string) {
    if (!Object.hasOwn(points, n)) throw Error('Thiếu điểm ' + n);
    return points[n];
  }
  const coords = recipe.coords || defaults[recipe.kind].map(([x, y]) => ({ x, y }));
  validateShape(recipe.kind, coords);
  if (coords.length !== recipe.vertices.length) throw Error('Sai số đỉnh.');
  recipe.vertices.forEach((n, i) => put(n, coords[i]));
  const todo = [...recipe.points];
  let attempts = todo.length + 1;
  while (todo.length && attempts-- > 0) {
    let made = 0;
    for (let i = 0; i < todo.length; ) {
      const c = todo[i];
      let v: XY;
      // Only defer unresolved dependencies. Invalid geometry must never be ignored.
      const refs =
        c.op === 'intersection'
          ? c.lines.flatMap(linePoints)
          : c.op === 'foot'
            ? [c.from, ...c.of]
            : c.op === 'equalOn'
              ? [...c.of, ...c.length]
              : c.of;
      if (refs.some((n) => !Object.hasOwn(points, n))) {
        i++;
        continue;
      }
      if (c.op === 'intersection')
        v = intersection(...resolveLine(c.lines[0], points), ...resolveLine(c.lines[1], points));
      else {
        const a = p(c.of[0]),
          b = p(c.of[1]);
        if (distance(a, b) < EPS) throw Error('Đoạn dựng suy biến.');
        if (c.op === 'midpoint') v = lerp(a, b, 0.5);
        else if (c.op === 'reflect') v = lerp(a, b, 2);
        else if (c.op === 'foot') {
          const w = sub(b, a);
          v = lerp(a, b, dot(sub(p(c.from), a), w) / dot(w, w));
        } else {
          const t =
            c.op === 'on'
              ? c.ratio
              : ((c.factor ?? 1) * distance(p(c.length[0]), p(c.length[1]))) / distance(a, b);
          if (!Number.isFinite(t) || t <= EPS || t >= 1 - EPS)
            throw Error('Điểm phải nằm trong đoạn và không trùng đầu mút.');
          v = lerp(a, b, t);
        }
      }
      put(c.name, v);
      todo.splice(i, 1);
      made++;
    }
    if (!made) throw Error('Điểm thiếu định nghĩa hoặc phụ thuộc vòng.');
  }
  const outline = recipe.outline || recipe.vertices;
  validateShape(outline.length === 3 ? 'triangle' : 'quadrilateral', outline.map(p));
  const sides = outline.map((n, i) => [n, outline[(i + 1) % outline.length]] as Segment);
  const segments: Segment[] = [];
  const seen = new Set<string>();
  for (const seg of [...sides, ...recipe.segments]) {
    if (distance(p(seg[0]), p(seg[1])) < EPS) continue;
    const key = [...seg].sort().join('|');
    if (!seen.has(key)) {
      segments.push(seg);
      seen.add(key);
    }
  }
  const guides = (recipe.guides || []).map((line) => {
    if (line.name && !(line.ray ? /^[A-Z][a-z]$/ : /^[a-z](?:['′])?$/i).test(line.name))
      throw Error('Tên đường thẳng không hợp lệ.');
    const [a, b] = resolveLine(line, points),
      hits: XY[] = [];
    if (line.ray) {
      const onRay = Object.entries(points)
        .filter(
          ([n, pt]) => n !== line.through && distance(a, pt) > EPS && onLine(pt, line, points),
        )
        .map(([, pt]) => pt);
      // An undirected construction does not establish which way an unspecified
      // ray points. Choose the side containing its known points, or ask for data.
      if (!onRay.length) throw Error('Cần thêm điểm trên tia ' + line.name + ' để xác định hướng.');
      const direction = sub(onRay[0], a);
      if (onRay.some((pt) => dot(sub(pt, a), direction) < -EPS))
        throw Error('Các điểm nằm ở hai phía của gốc tia ' + line.name + '.');
      onRay.sort((x, y) => distance(a, x) - distance(a, y));
      return { name: line.name || '', a, b: lerp(a, onRay.at(-1)!, 1.3), ray: true };
    }
    // Clip the guide to the polygon. No artificial named point is introduced.
    for (const [u, v] of sides) {
      try {
        const hit = intersection(a, b, p(u), p(v));
        if (onSegment(hit, p(u), p(v)) && !hits.some((h) => distance(h, hit) < EPS)) hits.push(hit);
      } catch {
        /* parallel edge */
      }
    }
    for (const pt of Object.values(points))
      if (onLine(pt, line, points) && !hits.some((h) => distance(h, pt) < EPS)) hits.push(pt);
    if (hits.length < 2) {
      const span = Math.max(1, ...Object.values(points).map((pt) => distance(pt, a)));
      const v = sub(b, a),
        k = span / norm(v);
      hits.splice(0, hits.length, lerp(a, b, -k), lerp(a, b, k));
    }
    hits.sort((x, y) => dot(sub(x, a), sub(b, a)) - dot(sub(y, a), sub(b, a)));
    return { name: line.name || '', a: hits[0], b: hits.at(-1)! };
  });
  const drawing: Drawing = {
    title: recipe.title.slice(0, 140),
    points,
    outline,
    segments,
    marks: recipe.marks,
    checks: [],
    guides,
  };
  for (const mark of recipe.marks) {
    if (mark.type === 'right') {
      if (
        !segmentVisible(drawing, [mark.at, mark.arms[0]]) ||
        !segmentVisible(drawing, [mark.at, mark.arms[1]]) ||
        !perpendicular(p(mark.at), p(mark.arms[0]), p(mark.at), p(mark.arms[1]))
      )
        throw Error('Kí hiệu góc vuông không đúng.');
    } else {
      if (mark.segments.length < 2 || mark.segments.some((s) => !segmentVisible(drawing, s)))
        throw Error('Kí hiệu dùng đoạn chưa vẽ.');
      const [a, b] = mark.segments[0].map(p);
      for (const seg of mark.segments.slice(1)) {
        const [c, d] = seg.map(p);
        if (mark.type === 'equal' ? !near(distance(a, b), distance(c, d)) : !parallel(a, b, c, d))
          throw Error('Kí hiệu quan hệ không đúng.');
      }
    }
  }
  return drawing;
}
/** A subsegment of a drawn edge is visible (AE on AB, CF on CD). */
export function segmentVisible(d: Drawing, s: Segment) {
  const a = d.points[s[0]],
    b = d.points[s[1]];
  return (
    !!a &&
    !!b &&
    distance(a, b) > EPS &&
    (d.segments.some(
      ([u, v]) => onSegment(a, d.points[u], d.points[v]) && onSegment(b, d.points[u], d.points[v]),
    ) ||
      (d.guides || []).some((g) => onSegment(a, g.a, g.b) && onSegment(b, g.a, g.b)))
  );
}

// Numeric primitives are shared by SVG and TikZ so that both exports show the same relations.
export function markStrokes(d: Drawing): { a: XY; b: XY; type: Mark['type'] }[] {
  const pts = d.points,
    all = Object.values(pts),
    scale = Math.max(...all.map((p) => p.x)) - Math.min(...all.map((p) => p.x));
  const size = Math.max(scale, 0.1) * 0.017;
  const out: { a: XY; b: XY; type: Mark['type'] }[] = [];
  d.marks.forEach((m, index) => {
    if (m.type === 'right') {
      const o = pts[m.at],
        u = sub(pts[m.arms[0]], o),
        v = sub(pts[m.arms[1]], o),
        r = Math.min(norm(u), norm(v), size * 1.7);
      const a = lerp(o, pts[m.arms[0]], r / norm(u)),
        b = lerp(o, pts[m.arms[1]], r / norm(v)),
        c = { x: a.x + b.x - o.x, y: a.y + b.y - o.y };
      out.push({ a, b: c, type: m.type }, { a: c, b, type: m.type });
    } else
      m.segments.forEach(([u, v]) => {
        const a = pts[u],
          b = pts[v],
          w = sub(b, a),
          len = norm(w),
          ux = w.x / len,
          uy = w.y / len,
          mid = lerp(a, b, 0.5),
          count = m.type === 'equal' ? 1 + (index % 3) : 1;
        for (let j = 0; j < count; j++) {
          const off = (j - (count - 1) / 2) * size * 0.7,
            center = { x: mid.x + ux * off, y: mid.y + uy * off };
          if (m.type === 'equal')
            out.push({
              a: { x: center.x - uy * size, y: center.y + ux * size },
              b: { x: center.x + uy * size, y: center.y - ux * size },
              type: m.type,
            });
          else {
            out.push(
              {
                a: {
                  x: center.x - ux * size - uy * size * 0.6,
                  y: center.y - uy * size + ux * size * 0.6,
                },
                b: center,
                type: m.type,
              },
              {
                a: {
                  x: center.x - ux * size + uy * size * 0.6,
                  y: center.y - uy * size - ux * size * 0.6,
                },
                b: center,
                type: m.type,
              },
            );
          }
        }
      });
  });
  return out;
}
export function toTikZ(d: Drawing): string {
  const entries = Object.entries(d.points),
    ids = Object.fromEntries(entries.map(([n], i) => [n, 'p' + i]));
  const f = (n: number) => String(Number(n.toFixed(7)));
  const xy = (p: XY) => `(${f(p.x)},${f(p.y)})`;
  // Labels come only from the point-name grammar. No model TeX is interpolated.
  const label = (n: string) => {
    if (!/^[A-Z](?:[0-9]{1,2}|['′]{1,2})?$/.test(n)) throw Error('Unsafe point label');
    return n.replace(/([A-Z])(\d+)/, '$1_{$2}').replace(/′/g, "'");
  };
  const xs = entries.map(([, p]) => p.x),
    ys = entries.map(([, p]) => p.y),
    width = Math.max(...xs) - Math.min(...xs),
    height = Math.max(...ys) - Math.min(...ys),
    scale = Math.min(1, 11 / Math.max(width, height));
  const center = {
    x: xs.reduce((a, b) => a + b, 0) / xs.length,
    y: ys.reduce((a, b) => a + b, 0) / ys.length,
  };
  const isSide = ([a, b]: Segment) =>
    d.outline.some(
      (n, i) =>
        (n === a && d.outline[(i + 1) % d.outline.length] === b) ||
        (n === b && d.outline[(i + 1) % d.outline.length] === a),
    );
  return [
    '% Constructed and checked from the problem; not a geometric proof.',
    '\\documentclass[tikz,border=8pt]{standalone}',
    '\\begin{document}',
    `\\begin{tikzpicture}[scale=${f(scale)},line cap=round,line join=round]`,
    ...entries.map(([n, p]) => `\\coordinate (${ids[n]}) at ${xy(p)};`),
    ...d.segments.map(
      (s) => `\\draw[${isSide(s) ? 'thick' : 'dashed'}] (${ids[s[0]]}) -- (${ids[s[1]]});`,
    ),
    ...(d.circles || []).map((c) => `\\draw[thick] (${ids[c.center]}) circle (${f(c.radius)});`),
    ...markStrokes(d).map((s) => `\\draw ${xy(s.a)} -- ${xy(s.b)};`),
    ...(d.guides || []).map(
      (g) =>
        `\\draw[dashed${g.ray ? ',->' : ''}] ${xy(g.a)} -- ${xy(g.b)}${g.name ? ' node[pos=0.88,above] {$' + label((g.ray ? g.name.slice(1) : g.name).toUpperCase()).toLowerCase() + '$}' : ''};`,
    ),
    ...pointGroups(d).map(
      ({ names, point: p }) =>
        `\\fill (${ids[names[0]]}) circle (1.1pt) node[fill=white,inner sep=1pt,${p.y >= center.y ? 'above' : 'below'} ${p.x >= center.x ? 'right' : 'left'}] {$${names.map(label).join(',\\,')}$};`,
    ),
    '\\end{tikzpicture}',
    '\\end{document}',
    '',
  ].join('\n');
}
