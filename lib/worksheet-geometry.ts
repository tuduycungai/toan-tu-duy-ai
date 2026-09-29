import {
  distance,
  lerp,
  sub,
  dot,
  cross,
  norm,
  near,
  onSegment,
  parallel,
  perpendicular,
  intersection,
  resolveLine,
  markStrokes,
  type Drawing,
  type XY,
  type Segment,
  type LineRef,
} from './geometry';
export const xy = (x: number, y: number): XY => ({ x, y });
export const angle = (a: XY, o: XY, b: XY) =>
  (Math.acos(
    Math.max(-1, Math.min(1, dot(sub(a, o), sub(b, o)) / (distance(a, o) * distance(b, o)))),
  ) *
    180) /
  Math.PI;
const seg = (s: string): Segment => s.split('') as Segment;

export class WorksheetFigure {
  points: Record<string, XY> = Object.create(null);
  outline: string[];
  segments: Segment[] = [];
  marks: Drawing['marks'] = [];
  checks: string[] = [];
  private hidden: string[] = [];
  hide(...prefixes: string[]) {
    this.hidden.push(...prefixes);
    return this;
  }
  private assertions: { label: string; verify: () => boolean }[] = [];
  constructor(
    public title: string,
    names: string,
    coords: number[][],
  ) {
    this.outline = names.split('');
    names.split('').forEach((n, i) => this.put(n, xy(...(coords[i] as [number, number]))));
    this.polygon(names);
  }
  put(n: string, p: XY) {
    if (
      !/^[A-Z]$/.test(n) ||
      this.points[n] ||
      !Number.isFinite(p.x + p.y) ||
      Math.max(Math.abs(p.x), Math.abs(p.y)) > 9999
    )
      throw Error('Điểm không hợp lệ: ' + n);
    this.points[n] = p;
    return this;
  }
  p(n: string) {
    if (!this.points[n]) throw Error('Chưa có điểm ' + n);
    return this.points[n];
  }
  length(s: string) {
    return distance(this.p(s[0]), this.p(s[1]));
  }
  require(label: string, verify: () => boolean) {
    this.assertions.push({ label, verify });
    return this;
  }
  check(label: string, verify: (f: WorksheetFigure) => boolean) {
    return this.require(label, () => verify(this));
  }
  angle(s: string) {
    return angle(this.p(s[0]), this.p(s[1]), this.p(s[2]));
  }
  perimeter(value: number) {
    return this.check('Chu vi = ' + value, (f) =>
      near(
        f.outline.reduce(
          (sum, n, i) => sum + f.length(n + f.outline[(i + 1) % f.outline.length]),
          0,
        ),
        value,
      ),
    );
  }
  bisector(at: string, a: string, n: string, b: string) {
    return this.check(at + n + ' là phân giác ∠' + a + at + b, (f) =>
      near(f.angle(a + at + n), f.angle(n + at + b)),
    );
  }
  edge(...ss: string[]) {
    for (const s of ss) {
      if (s.length !== 2) throw Error('Sai tên đoạn');
      this.segments.push(seg(s));
    }
    return this;
  }
  polygon(s: string) {
    s.split('').forEach((n, i) => this.edge(n + s[(i + 1) % s.length]));
    return this;
  }
  on(n: string, s: string, t: number) {
    this.put(n, lerp(this.p(s[0]), this.p(s[1]), t));
    return this.require(
      n + ' nằm trong đoạn ' + s,
      () => t > 0 && t < 1 && onSegment(this.p(n), this.p(s[0]), this.p(s[1])),
    );
  }
  mid(n: string, s: string) {
    this.on(n, s, 0.5);
    this.marks.push({ type: 'equal', segments: [seg(s[0] + n), seg(n + s[1])] });
    return this.require(n + ' là trung điểm ' + s, () =>
      near(this.length(s[0] + n), this.length(n + s[1])),
    );
  }
  foot(n: string, from: string, s: string) {
    const a = this.p(s[0]),
      b = this.p(s[1]),
      v = sub(b, a);
    this.put(n, lerp(a, b, dot(sub(this.p(from), a), v) / dot(v, v)));
    this.edge(from + n, s);
    if (!onSegment(this.p(n), a, b)) this.edge(n + s[0], n + s[1]);
    this.require(n + ' thuộc đường thẳng ' + s, () => Math.abs(cross(sub(this.p(n), a), v)) < 1e-6);
    if (distance(this.p(from), this.p(n)) > 1e-7) {
      this.perp(from + n, s);
      this.marks.push({
        type: 'right',
        at: n,
        arms: [from, distance(this.p(n), a) > 1e-7 ? s[0] : s[1]],
      });
    }
    return this;
  }
  inter(n: string, a: LineRef | string, b: LineRef | string) {
    const aa = typeof a === 'string' ? seg(a) : a,
      bb = typeof b === 'string' ? seg(b) : b;
    this.put(n, intersection(...resolveLine(aa, this.points), ...resolveLine(bb, this.points)));
    for (const l of [aa, bb]) {
      if (Array.isArray(l)) {
        this.edge(l.join(''));
        if (!onSegment(this.p(n), this.p(l[0]), this.p(l[1]))) this.edge(n + l[0], n + l[1]);
      } else this.edge(l.through + n);
    }
    return this.require(n + ' là giao điểm hai đường đã dựng', () =>
      [aa, bb].every((l) => {
        const [x, y] = resolveLine(l, this.points);
        return Math.abs(cross(sub(this.p(n), x), sub(y, x))) < 1e-6;
      }),
    );
  }
  cut(n: string, through: string, of: string, target: string, perp = false) {
    return this.inter(
      n,
      { through, of: seg(of), relation: perp ? 'perpendicular' : 'parallel' },
      target,
    );
  }
  reflect(n: string, from: string, center: string) {
    this.put(n, lerp(this.p(from), this.p(center), 2));
    this.edge(from + n);
    return this.require(
      n + ' đối xứng ' + from + ' qua ' + center,
      () => distance(lerp(this.p(n), this.p(from), 0.5), this.p(center)) < 1e-7,
    );
  }
  mirror(n: string, from: string, axis: string) {
    const [a, b] = [this.p(axis[0]), this.p(axis[1])],
      v = sub(b, a),
      h = lerp(a, b, dot(sub(this.p(from), a), v) / dot(v, v));
    this.put(n, lerp(this.p(from), h, 2));
    this.edge(from + n);
    return this.require(
      n + ' đối xứng ' + from + ' qua đường ' + axis,
      () =>
        Math.abs(cross(sub(lerp(this.p(n), this.p(from), 0.5), a), v)) < 1e-6 &&
        perpendicular(this.p(n), this.p(from), a, b),
    );
  }
  bisect(n: string, at: string, a: string, b: string, target: string) {
    const o = this.p(at),
      u = sub(this.p(a), o),
      v = sub(this.p(b), o),
      z = xy(o.x + u.x / norm(u) + v.x / norm(v), o.y + u.y / norm(u) + v.y / norm(v));
    this.put(n, intersection(o, z, this.p(target[0]), this.p(target[1])));
    this.edge(at + n);
    return this.require(at + n + ' là phân giác ∠' + a + at + b, () =>
      near(angle(this.p(a), o, this.p(n)), angle(this.p(n), o, this.p(b))),
    );
  }
  equ(a: string, b: string, k = 1) {
    return this.require(a + ' = ' + (k === 1 ? '' : k + ' × ') + b, () =>
      near(this.length(a), k * this.length(b)),
    );
  }
  parallel(a: string, b: string) {
    return this.require(a + ' ∥ ' + b, () =>
      parallel(this.p(a[0]), this.p(a[1]), this.p(b[0]), this.p(b[1])),
    );
  }
  perp(a: string, b: string) {
    return this.require(a + ' ⟂ ' + b, () =>
      perpendicular(this.p(a[0]), this.p(a[1]), this.p(b[0]), this.p(b[1])),
    );
  }
  len(s: string, v: number) {
    return this.require(s + ' = ' + v, () => near(this.length(s), v));
  }
  deg(s: string, v: number) {
    return this.require('∠' + s + ' = ' + v + '°', () =>
      near(angle(this.p(s[0]), this.p(s[1]), this.p(s[2])), v),
    );
  }
  shape(kind: string, s = this.outline.join('')) {
    const [a, b, c, d] = s;
    this.require(s + ' là đa giác lồi không suy biến', () => {
      const ps = s.split('').map((n) => this.p(n)),
        turns = ps.map((p, i) =>
          cross(sub(ps[(i + 1) % ps.length], p), sub(ps[(i + 2) % ps.length], p)),
        );
      return turns.every((t) => Math.abs(t) > 1e-7 && t * turns[0] > 0);
    });
    if (['hbh', 'rect', 'rhomb', 'square'].includes(kind)) {
      this.parallel(a + b, c + d);
      this.parallel(a + d, b + c);
    }
    if (['rect', 'square', 'right'].includes(kind)) this.perp(a + b, a + (d || c));
    if (['rhomb', 'square', 'isos'].includes(kind)) this.equ(a + b, a + (d || c));
    if (kind === 'trap' || kind === 'isoTrap') this.parallel(a + b, c + d);
    if (kind === 'isoTrap') {
      this.equ(a + d, b + c);
      this.check('∠' + d + a + b + ' = ∠' + a + b + c, (f) =>
        near(f.angle(d + a + b), f.angle(a + b + c)),
      );
    }
    return this;
  }
  build(): Drawing {
    for (const a of this.assertions) {
      if (!a.verify()) throw Error(this.title + ': không thỏa ' + a.label);
    }
    const unique = new Map<string, Segment>();
    for (const s of this.segments) {
      this.p(s[0]);
      this.p(s[1]);
      if (this.length(s.join('')) > 1e-7) unique.set([...s].sort().join(''), s);
    }
    const d: Drawing = {
      title: this.title,
      points: this.points,
      outline: this.outline,
      segments: [...unique.values()],
      marks: this.marks,
      checks: this.assertions
        .map((a) => a.label)
        .filter((s) => !this.hidden.some((p) => s.startsWith(p))),
    };
    if (!d.checks.length) throw Error('Hình chưa có kiểm chứng');
    for (const m of d.marks) {
      if (
        m.type === 'right' &&
        !perpendicular(this.p(m.at), this.p(m.arms[0]), this.p(m.at), this.p(m.arms[1]))
      )
        throw Error('Sai kí hiệu góc vuông');
      if (
        m.type === 'equal' &&
        !m.segments.every((s) => near(this.length(s.join('')), this.length(m.segments[0].join(''))))
      )
        throw Error('Sai dấu bằng');
    }
    markStrokes(d);
    return d;
  }
}
export function quad(title: string, kind = 'hbh', names = 'ABCD', coords?: number[][]) {
  const cs =
    coords ||
    (kind === 'square'
      ? [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4],
        ]
      : kind === 'rect'
        ? [
            [0, 0],
            [6, 0],
            [6, 4],
            [0, 4],
          ]
        : kind === 'rhomb'
          ? [
              [0, 0],
              [5, 0],
              [8, 4],
              [3, 4],
            ]
          : kind === 'isoTrap'
            ? [
                [1.5, 3],
                [4.5, 3],
                [6, 0],
                [0, 0],
              ]
            : kind === 'quad'
              ? [
                  [0, 0],
                  [6, 0.6],
                  [5, 4],
                  [-1, 3],
                ]
              : [
                  [0, 0],
                  [6, 0],
                  [7.4, 3.5],
                  [1.4, 3.5],
                ]);
  return new WorksheetFigure(title, names, cs).shape(kind);
}
export function triangle(title: string, kind = 'triangle', coords?: number[][], names = 'ABC') {
  return new WorksheetFigure(
    title,
    names,
    coords ||
      (kind === 'right'
        ? [
            [0, 0],
            [5, 0],
            [0, 7],
          ]
        : kind === 'isos'
          ? [
              [0, 5],
              [-3, 0],
              [3, 0],
            ]
          : [
              [1, 4],
              [0, 0],
              [7, 0],
            ]),
  ).shape(kind);
}

export function angleQuad(title: string, names: string, degrees: number[]) {
  if (
    !near(
      degrees.reduce((a, b) => a + b),
      360,
    ) ||
    degrees.some((a) => a <= 0 || a >= 180)
  )
    throw Error('Bộ góc không tạo tứ giác lồi');
  const A = xy(0, 0),
    B = xy(5, 0),
    theta = ((180 - degrees[1]) * Math.PI) / 180,
    rayD = xy(Math.cos((degrees[0] * Math.PI) / 180), Math.sin((degrees[0] * Math.PI) / 180));
  let result: XY[] | undefined,
    quality = -1;

  for (const t of [0.3, 0.5, 0.8, 1, 1.3, 2, 3, 4, 5, 6, 8, 10, 12, 20]) {
    const C = xy(5 + t * Math.cos(theta), t * Math.sin(theta)),
      phi = theta + ((180 - degrees[2]) * Math.PI) / 180;
    try {
      const D = intersection(C, xy(C.x + Math.cos(phi), C.y + Math.sin(phi)), A, rayD),
        ps = [A, B, C, D];
      if (ps.every((p, i) => near(angle(ps[(i + 3) % 4], p, ps[(i + 1) % 4]), degrees[i]))) {
        const lengths = ps.map((p, i) => distance(p, ps[(i + 1) % 4])),
          area = Math.abs(ps.reduce((sum, p, i) => sum + cross(p, ps[(i + 1) % 4]), 0)) / 2,
          score =
            ((area / lengths.reduce((a, b) => a + b) ** 2) * Math.min(...lengths)) /
            Math.max(...lengths);
        if (score > quality) {
          result = ps;
          quality = score;
        }
      }
    } catch {}
  }
  if (!result) throw Error('Chưa chọn được cạnh cho bộ góc');
  const f = quad(
    title,
    'quad',
    names,
    result.map((p) => [p.x, p.y]),
  );
  names.split('').forEach((n, i) => f.deg(names[(i + 3) % 4] + n + names[(i + 1) % 4], degrees[i]));
  return f;
}
