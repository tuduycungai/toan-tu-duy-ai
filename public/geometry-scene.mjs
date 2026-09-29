import { parsePlotExpression } from './plot-expression.mjs';

export const SCENE_VERSION = 'geometry-v1';
export const NODE_OPS = [
  'free',
  'midpoint',
  'interpolate',
  'foot',
  'intersection',
  'parallelPoint',
  'perpendicularPoint',
  'lineCircle',
  'circleCircle',
  'circumcenter',
  'incenter',
  'centroid',
  'orthocenter',
  'reflect',
  'reflectLine',
  'rotate',
  'translate',
  'distancePoint',
  'bisectorPoint',
  'regularVertex',
];
export const STROKE_KINDS = [
  'segment',
  'line',
  'ray',
  'polygon',
  'circle',
  'arc',
  'rightAngle',
  'angle',
  'equalMark',
  'axes',
  'plot',
];
export const CONSTRAINT_KINDS = [
  'distinct',
  'collinear',
  'onLine',
  'onRay',
  'onSegment',
  'midpoint',
  'parallel',
  'perpendicular',
  'equalLength',
  'length',
  'ratio',
  'angle',
  'equalAngle',
  'onCircle',
  'coplanar',
];
const EPS = 1e-7;
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const mul = (a, t) => a.map((x) => x * t);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a) => Math.hypot(...a);
const distance = (a, b) => norm(sub(a, b));
const near = (a, b) => Math.abs(a - b) <= EPS * Math.max(1, Math.abs(a), Math.abs(b));
const requireValue = (condition, message) => {
  if (!condition) throw Error(message);
};
const unit = (a) => {
  const n = norm(a);
  requireValue(n > EPS, 'Hai điểm trùng nhau không xác định được phương.');
  return mul(a, 1 / n);
};
const perpendicular = (a) => [-a[1], a[0], 0];
const normal2 = (a, b) => a[0] * b[1] - a[1] * b[0];
const angle = (a, b, c) =>
  (Math.acos(Math.max(-1, Math.min(1, dot(unit(sub(a, b)), unit(sub(c, b)))))) * 180) / Math.PI;
const planar = (ps) =>
  requireValue(
    ps.every((p) => near(p[2], 0)),
    'Phép dựng này cần các điểm nằm trên mặt phẳng z = 0.',
  );
const foot = (p, a, b) => {
  const d = unit(sub(b, a));
  return add(a, mul(d, dot(sub(p, a), d)));
};
const meet = (a, b, c, d) => {
  planar([a, b, c, d]);
  const v = sub(b, a),
    w = sub(d, c),
    den = normal2(v, w);
  requireValue(
    norm(v) > EPS && norm(w) > EPS && Math.abs(den) > EPS * norm(v) * norm(w),
    'Hai đường song song hoặc trùng nhau, không có giao điểm duy nhất.',
  );
  return add(a, mul(v, normal2(sub(c, a), w) / den));
};
const onLine = (p, a, b) =>
  distance(a, b) > EPS &&
  norm(cross(sub(p, a), unit(sub(b, a)))) <= EPS * Math.max(1, distance(p, a), distance(b, a));
const parallel = (a, b, c, d) => norm(cross(unit(sub(b, a)), unit(sub(d, c)))) <= EPS;
const orthogonal = (a, b, c, d) => Math.abs(dot(unit(sub(b, a)), unit(sub(d, c)))) <= EPS;
const fixed = (args, values, n, m = 0) =>
  requireValue(
    args.length === n && values.length === m,
    'Sai số lượng điểm hoặc tham số của phép dựng.',
  );
const text = (value, max = 600) =>
  typeof value === 'string' &&
  value.length <= max &&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value);
const ids = (args) =>
  Array.isArray(args) &&
  args.length <= 64 &&
  args.every((a) => typeof a === 'string' && /^[A-Za-z][A-Za-z0-9_'′]{0,15}$/.test(a));
const numbers = (values) =>
  Array.isArray(values) &&
  values.length <= 8 &&
  values.every((n) => Number.isFinite(n) && Math.abs(n) <= 1e6);

function construct(node, ps) {
  const { op, values: v, args } = node,
    [a, b, c, d] = ps;
  const f = (n, m = 0) => fixed(args, v, n, m);
  switch (op) {
    case 'free':
      f(0, v.length);
      requireValue(v.length === 2 || v.length === 3, 'Điểm tự do cần 2 hoặc 3 tọa độ.');
      return [v[0], v[1], v[2] || 0];
    case 'midpoint':
      f(2);
      return mul(add(a, b), 0.5);
    case 'interpolate':
      f(2, 1);
      return add(a, mul(sub(b, a), v[0]));
    case 'foot':
      f(3);
      return foot(a, b, c);
    case 'intersection':
      f(4);
      return meet(a, b, c, d);
    case 'parallelPoint':
      f(3);
      return add(a, sub(c, b));
    case 'perpendicularPoint':
      f(3);
      planar(ps);
      return add(a, perpendicular(unit(sub(c, b))));
    case 'translate':
      f(3);
      return add(a, sub(c, b));
    case 'reflect':
      f(2);
      return sub(mul(b, 2), a);
    case 'reflectLine':
      f(3);
      return sub(mul(foot(a, b, c), 2), a);
    case 'distancePoint':
      f(2, 1);
      requireValue(v[0] > 0, 'Khoảng cách phải dương.');
      return add(a, mul(unit(sub(b, a)), v[0]));
    case 'rotate': {
      f(2, 1);
      planar(ps);
      const t = (v[0] * Math.PI) / 180,
        u = sub(a, b);
      return add(b, [
        u[0] * Math.cos(t) - u[1] * Math.sin(t),
        u[0] * Math.sin(t) + u[1] * Math.cos(t),
        0,
      ]);
    }
    case 'centroid':
      f(3);
      return mul(add(add(a, b), c), 1 / 3);
    case 'circumcenter': {
      f(3);
      planar(ps);
      const m = mul(add(a, b), 0.5),
        n = mul(add(a, c), 0.5);
      return meet(m, add(m, perpendicular(sub(b, a))), n, add(n, perpendicular(sub(c, a))));
    }
    case 'orthocenter':
      f(3);
      planar(ps);
      return meet(a, add(a, perpendicular(sub(c, b))), b, add(b, perpendicular(sub(c, a))));
    case 'incenter': {
      f(3);
      const u = distance(b, c),
        w = distance(a, c),
        t = distance(a, b);
      requireValue(norm(cross(sub(b, a), sub(c, a))) > EPS, 'Tam giác suy biến.');
      return mul(add(add(mul(a, u), mul(b, w)), mul(c, t)), 1 / (u + w + t));
    }
    case 'bisectorPoint':
      f(3);
      return add(b, unit(add(unit(sub(a, b)), unit(sub(c, b)))));
    case 'regularVertex': {
      f(2, 2);
      planar(ps);
      requireValue(
        Number.isInteger(v[0]) &&
          v[0] >= 3 &&
          v[0] <= 40 &&
          Number.isInteger(v[1]) &&
          v[1] >= 0 &&
          v[1] < v[0],
        'Số đỉnh hoặc chỉ số đỉnh không hợp lệ.',
      );
      const t = (v[1] * 2 * Math.PI) / v[0],
        u = sub(b, a);
      requireValue(norm(u) > EPS, 'Đa giác đều cần bán kính dương.');
      return add(a, [
        u[0] * Math.cos(t) - u[1] * Math.sin(t),
        u[0] * Math.sin(t) + u[1] * Math.cos(t),
        0,
      ]);
    }
    case 'lineCircle': {
      f(4, 1);
      planar(ps);
      requireValue(Math.abs(v[0]) === 1, 'Chọn giao điểm -1 hoặc 1.');
      const r = distance(c, d),
        h = foot(c, a, b),
        u = unit(sub(b, a)),
        t = r * r - distance(c, h) ** 2;
      requireValue(r > EPS && t >= -EPS * Math.max(1, r * r), 'Đường thẳng không cắt đường tròn.');
      return add(h, mul(u, v[0] * Math.sqrt(Math.max(0, t))));
    }
    case 'circleCircle': {
      f(4, 1);
      planar(ps);
      requireValue(Math.abs(v[0]) === 1, 'Chọn giao điểm -1 hoặc 1.');
      const r = distance(a, b),
        s = distance(c, d),
        l = distance(a, c);
      requireValue(
        r > EPS && s > EPS && l > EPS && l <= r + s + EPS && l >= Math.abs(r - s) - EPS,
        'Hai đường tròn không có giao điểm xác định.',
      );
      const u = unit(sub(c, a)),
        x = (r * r - s * s + l * l) / (2 * l),
        y2 = r * r - x * x;
      requireValue(y2 >= -EPS * Math.max(1, r * r), 'Hai đường tròn không cắt nhau.');
      return add(add(a, mul(u, x)), mul(perpendicular(u), v[0] * Math.sqrt(Math.max(0, y2))));
    }
    default:
      throw Error('Phép dựng chưa được hỗ trợ: ' + op);
  }
}
function checkConstraint(r, points) {
  requireValue(
    CONSTRAINT_KINDS.includes(r.kind) &&
      ids(r.args) &&
      Number.isFinite(r.value) &&
      Math.abs(r.value) <= 1e6 &&
      text(r.source),
    'Quan hệ kiểm tra không hợp lệ.',
  );
  const ps = r.args.map((id) => {
    requireValue(points.has(id), 'Quan hệ thiếu điểm ' + id);
    return points.get(id);
  });
  const [a, b, c, d, e, f] = ps,
    value = r.value;
  const arity = {
    distinct: 2,
    collinear: 3,
    onLine: 3,
    onRay: 3,
    onSegment: 3,
    midpoint: 3,
    parallel: 4,
    perpendicular: 4,
    equalLength: 4,
    length: 2,
    ratio: 4,
    angle: 3,
    equalAngle: 6,
    onCircle: 3,
    coplanar: 4,
  };
  requireValue(ps.length === arity[r.kind], 'Sai số điểm của quan hệ ' + r.kind);
  const along = () => dot(sub(a, b), unit(sub(c, b)));
  let ok = false;
  switch (r.kind) {
    case 'distinct':
      ok = distance(a, b) > EPS;
      break;
    case 'collinear':
    case 'onLine':
      ok = onLine(a, b, c);
      break;
    case 'onRay':
      ok = onLine(a, b, c) && along() >= -EPS;
      break;
    case 'onSegment':
      ok = onLine(a, b, c) && along() >= -EPS && along() <= distance(b, c) + EPS;
      break;
    case 'midpoint':
      ok = distance(a, mul(add(b, c), 0.5)) <= EPS * Math.max(1, distance(b, c));
      break;
    case 'parallel':
      ok = parallel(a, b, c, d);
      break;
    case 'perpendicular':
      ok = orthogonal(a, b, c, d);
      break;
    case 'equalLength':
      ok = distance(a, b) > EPS && near(distance(a, b), distance(c, d));
      break;
    case 'length':
      ok = value > 0 && near(distance(a, b), value);
      break;
    case 'ratio':
      ok = value > 0 && distance(c, d) > EPS && near(distance(a, b) / distance(c, d), value);
      break;
    case 'angle':
      ok = value > 0 && value < 180 && near(angle(a, b, c), value);
      break;
    case 'equalAngle':
      ok = near(angle(a, b, c), angle(d, e, f));
      break;
    case 'onCircle':
      ok = distance(b, c) > EPS && near(distance(a, b), distance(b, c));
      break;
    case 'coplanar': {
      const u = cross(sub(b, a), sub(c, a));
      ok = norm(u) > EPS && Math.abs(dot(unit(u), sub(d, a))) <= EPS * Math.max(1, distance(d, a));
      break;
    }
  }
  requireValue(ok, 'Tọa độ chưa thỏa: ' + (r.source || r.kind + ' ' + r.args.join(',')));
  return r.source || r.kind + ' ' + r.args.join(',');
}

export function evaluateScene(scene) {
  requireValue(
    scene && typeof scene === 'object' && !Array.isArray(scene) && scene.version === SCENE_VERSION,
    'Phiên bản cấu trúc hình không hợp lệ.',
  );
  requireValue(
    ['ready', 'clarify', 'unsupported'].includes(scene.status) &&
      ['plane', 'space'].includes(scene.view) &&
      text(scene.title, 150) &&
      text(scene.question, 1200),
    'Trạng thái hoặc tiêu đề hình không hợp lệ.',
  );
  requireValue(
    Array.isArray(scene.nodes) &&
      scene.nodes.length <= 64 &&
      Array.isArray(scene.strokes) &&
      scene.strokes.length <= 128 &&
      Array.isArray(scene.constraints) &&
      scene.constraints.length <= 128 &&
      Array.isArray(scene.assumptions) &&
      scene.assumptions.length <= 12 &&
      scene.assumptions.every((s) => text(s, 300)),
    'Cấu trúc hình vượt giới hạn.',
  );
  requireValue(JSON.stringify(scene).length <= 48000, 'Cấu trúc hình quá lớn.');
  if (scene.status !== 'ready') {
    requireValue(
      scene.question.trim().length > 0 &&
        !scene.nodes.length &&
        !scene.strokes.length &&
        !scene.constraints.length,
      'Cần nêu rõ dữ kiện thiếu hoặc phép dựng chưa hỗ trợ.',
    );
    return { scene, points: new Map(), checked: [], notice: scene.question };
  }
  requireValue(
    !scene.question && scene.strokes.length > 0,
    'Hình hoàn chỉnh cần nét vẽ và không kèm câu hỏi.',
  );
  requireValue(
    scene.strokes.filter((s) => s.kind === 'plot').length <= 8,
    'Một hình chỉ hỗ trợ tối đa 8 đồ thị.',
  );
  const definitions = new Map(),
    points = new Map(),
    visiting = new Set();
  for (const n of scene.nodes) {
    requireValue(
      n &&
        ids([n.id]) &&
        !definitions.has(n.id) &&
        NODE_OPS.includes(n.op) &&
        ids(n.args) &&
        numbers(n.values) &&
        text(n.label, 24) &&
        text(n.source),
      'Điểm hoặc phép dựng không hợp lệ / bị lặp tên.',
    );
    definitions.set(n.id, n);
  }
  const resolve = (id) => {
    if (points.has(id)) return points.get(id);
    requireValue(definitions.has(id), 'Thiếu điểm ' + id);
    requireValue(!visiting.has(id), 'Các phép dựng phụ thuộc vòng tại ' + id);
    visiting.add(id);
    const n = definitions.get(id),
      p = construct(n, n.args.map(resolve));
    requireValue(
      p.every((x) => Number.isFinite(x) && Math.abs(x) <= 1e6),
      'Tọa độ không hữu hạn hoặc quá lớn tại ' + id,
    );
    if (scene.view === 'plane') planar([p]);
    points.set(id, p);
    visiting.delete(id);
    return p;
  };
  definitions.forEach((_n, id) => resolve(id));
  const checked = scene.constraints.map((r) => checkConstraint(r, points));
  for (const s of scene.strokes) {
    requireValue(
      s &&
        STROKE_KINDS.includes(s.kind) &&
        ids(s.args) &&
        numbers(s.values) &&
        ['main', 'aux', 'hidden'].includes(s.style) &&
        text(s.label, 80) &&
        text(s.expression, 200) &&
        text(s.source),
      'Nét vẽ không hợp lệ.',
    );
    const ps = s.args.map(resolve),
      [a, b, c] = ps;
    const expected = {
      segment: [2, 0],
      line: [2, 0],
      ray: [2, 0],
      circle: [2, 0],
      arc: [2, 2],
      rightAngle: [3, 0],
      angle: [3, 0],
      equalMark: [2, 1],
      axes: [0, 4],
      plot: [0, 4],
    };
    if (s.kind === 'polygon') {
      requireValue(ps.length >= 3 && s.values.length === 0, 'Đa giác cần ít nhất 3 điểm.');
      const area = ps.reduce((u, p, i) => add(u, cross(p, ps[(i + 1) % ps.length])), [0, 0, 0]);
      requireValue(norm(area) > EPS, 'Đa giác suy biến hoặc tự cắt.');
      const planeNormal = unit(area);
      requireValue(
        ps.every((p) => Math.abs(dot(planeNormal, sub(p, a))) < EPS * Math.max(1, distance(p, a))),
        'Các đỉnh đa giác không đồng phẳng.',
      );

      const drop = planeNormal.map(Math.abs).indexOf(Math.max(...planeNormal.map(Math.abs)));
      const flat = (p) => p.filter((_v, i) => i !== drop);
      const orient = (p, q, r) => normal2([q[0] - p[0], q[1] - p[1]], [r[0] - p[0], r[1] - p[1]]);
      for (let i = 0; i < ps.length; i++)
        for (let j = i + 2; j < ps.length; j++) {
          if (i === 0 && j === ps.length - 1) continue;
          const [p, q, r, t] = [ps[i], ps[(i + 1) % ps.length], ps[j], ps[(j + 1) % ps.length]].map(
            flat,
          );
          requireValue(
            !(orient(p, q, r) * orient(p, q, t) < -EPS && orient(r, t, p) * orient(r, t, q) < -EPS),
            'Đa giác tự cắt.',
          );
        }
    } else fixed(s.args, s.values, ...expected[s.kind]);
    if (['segment', 'line', 'ray', 'circle', 'arc', 'equalMark'].includes(s.kind))
      requireValue(distance(a, b) > EPS, 'Nét vẽ có hai điểm trùng nhau.');
    if (['circle', 'arc', 'rightAngle', 'angle', 'plot', 'axes'].includes(s.kind))
      requireValue(
        scene.view === 'plane',
        'Các đường cong và ký hiệu góc hiện chỉ hỗ trợ hình phẳng.',
      );
    if (s.kind === 'arc')
      requireValue(
        Math.abs(s.values[1] - s.values[0]) > EPS && Math.abs(s.values[1] - s.values[0]) <= 360,
        'Góc cung không hợp lệ.',
      );
    if (s.kind === 'rightAngle')
      requireValue(orthogonal(b, a, b, c), 'Không được đánh dấu vuông khi góc chưa vuông.');
    if (s.kind === 'angle')
      requireValue(angle(a, b, c) > EPS && angle(a, b, c) < 180 - EPS, 'Góc suy biến.');
    if (s.kind === 'equalMark')
      requireValue(
        Number.isInteger(s.values[0]) && s.values[0] >= 1 && s.values[0] <= 3,
        'Số vạch bằng nhau phải từ 1 đến 3.',
      );
    if (['plot', 'axes'].includes(s.kind))
      requireValue(
        s.values[1] - s.values[0] > EPS && s.values[3] - s.values[2] > EPS,
        'Cửa sổ đồ thị không hợp lệ.',
      );
    if (s.kind === 'plot') parsePlotExpression(s.expression);
    else requireValue(s.expression === '', 'Chỉ đồ thị được chứa biểu thức.');
  }
  const groups = new Map();
  for (const s of scene.strokes.filter((s) => s.kind === 'equalMark')) {
    const l = distance(...s.args.map((id) => points.get(id)));
    if (groups.has(s.values[0]))
      requireValue(
        near(l, groups.get(s.values[0])),
        'Các đoạn đánh dấu bằng nhau có độ dài khác nhau.',
      );
    else groups.set(s.values[0], l);
  }
  return {
    scene,
    points,
    checked,
    notice:
      (scene.view === 'space'
        ? 'Hình chiếu minh họa: góc và độ dài trên màn hình có thể khác hình không gian. '
        : '') +
      'Đã kiểm tra ' +
      checked.length +
      ' quan hệ được mã hóa. Em đối chiếu thêm dữ kiện và nhãn với đề.',
  };
}

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c],
  );
const num = (x) => {
  requireValue(Number.isFinite(x), 'Không thể xuất tọa độ không hữu hạn.');
  return String(Number(x.toFixed(6)));
};
const project = (p, space) => (space ? [p[0] + 0.43 * p[1], p[2] + 0.28 * p[1]] : [p[0], p[1]]);

export function renderScene(scene) {
  const evaluated = evaluateScene(scene);
  requireValue(scene.status === 'ready', 'Chưa có hình để xuất.');
  const space = scene.view === 'space',
    points = new Map([...evaluated.points].map(([id, p]) => [id, project(p, space)]));
  const curves = new Map(),
    bounds = [...points.values()];
  for (const [i, s] of scene.strokes.entries()) {
    if (s.kind === 'circle' || s.kind === 'arc') {
      const [a, b] = s.args.map((id) => points.get(id)),
        r = Math.hypot(b[0] - a[0], b[1] - a[1]);
      bounds.push([a[0] - r, a[1] - r], [a[0] + r, a[1] + r]);
    }
    if (s.kind === 'plot' || s.kind === 'axes') {
      const [xmin, xmax, ymin, ymax] = s.values;
      bounds.push([xmin, ymin], [xmax, ymax]);
      if (s.kind === 'plot') {
        const fn = parsePlotExpression(s.expression),
          paths = [];
        let current = [];
        for (let j = 0; j <= 800; j++) {
          const x = xmin + ((xmax - xmin) * j) / 800,
            y = fn(x),
            last = current.at(-1);
          const mid = last ? fn((last[0] + x) / 2) : y;
          const valid =
            Number.isFinite(y) &&
            y >= ymin &&
            y <= ymax &&
            Number.isFinite(mid) &&
            Math.abs(mid - (y + (last?.[1] ?? y)) / 2) < (ymax - ymin) * 0.12;
          if (!valid || (last && Math.abs(y - last[1]) > (ymax - ymin) * 0.4)) {
            if (current.length > 1) paths.push(current);
            current = [];
          }
          if (valid) current.push([x, y]);
        }
        if (current.length > 1) paths.push(current);
        requireValue(paths.length > 0, 'Đồ thị không có điểm hữu hạn trong cửa sổ đã chọn.');
        curves.set(i, paths);
      }
    }
  }
  requireValue(bounds.length > 0, 'Hình không có tọa độ.');
  let xmin = Math.min(...bounds.map((p) => p[0])),
    xmax = Math.max(...bounds.map((p) => p[0])),
    ymin = Math.min(...bounds.map((p) => p[1])),
    ymax = Math.max(...bounds.map((p) => p[1]));
  const span = Math.max(xmax - xmin, ymax - ymin, 1),
    pad = span * 0.13;
  xmin -= pad;
  xmax += pad;
  ymin -= pad;
  ymax += pad;
  const scale = Math.min(744 / (xmax - xmin), 472 / (ymax - ymin)),
    cx = (xmax + xmin) / 2,
    cy = (ymax + ymin) / 2;
  const xy = (p) => [420 + (p[0] - cx) * scale, 320 - (p[1] - cy) * scale];
  const pair = (p) => p.map(num).join(',');
  const color = (s) =>
    s.style === 'aux' ? '#287c9b' : s.style === 'hidden' ? '#788598' : '#253e60';
  const attrs = (s) =>
    `fill="none" stroke="${color(s)}" stroke-width="${s.style === 'main' ? 2.5 : 1.6}"${s.style === 'main' ? '' : ' stroke-dasharray="7 5"'} stroke-linecap="round" stroke-linejoin="round"`;
  const elements = [],
    labels = [],
    ink = [],
    tikz = [];
  let completeTexLabels = true;
  const track = (path) => {
    for (let i = 1; i < path.length; i++) ink.push([path[i - 1], path[i]]);
  };
  for (const [id, p] of points) tikz.push(`\\coordinate (${id}) at (${num(p[0])},${num(p[1])});`);
  const line = (a, b, s, arrow = false) => {
    const p = xy(a),
      q = xy(b);
    track([p, q]);
    elements.push(`<path d="M ${pair(p)} L ${pair(q)}" ${attrs(s)}/>`);
    if (arrow) {
      const u = unit([q[0] - p[0], q[1] - p[1], 0]),
        v = [-u[1], u[0]];
      const k = (t) => [q[0] - 9 * u[0] + t * 4 * v[0], q[1] - 9 * u[1] + t * 4 * v[1]];
      elements.push(`<path d="M ${pair(k(-1))} L ${pair(q)} L ${pair(k(1))}" ${attrs(s)}/>`);
    }
  };
  const label = (s, p, axis = '') => {
    if (s) labels.push({ text: s, p: xy(p), axis });
  };
  const clip = (a, b, ray) => {
    const d = [b[0] - a[0], b[1] - a[1]];
    let lo = ray ? 0 : -Infinity,
      hi = Infinity;
    for (let k = 0; k < 2; k++) {
      const min = k ? ymin : xmin,
        max = k ? ymax : xmax;
      if (Math.abs(d[k]) < EPS) {
        requireValue(a[k] >= min && a[k] <= max, 'Đường thẳng nằm ngoài cửa sổ.');
        continue;
      }
      let t = (min - a[k]) / d[k],
        u = (max - a[k]) / d[k];
      if (t > u) [t, u] = [u, t];
      lo = Math.max(lo, t);
      hi = Math.min(hi, u);
    }
    requireValue(
      lo <= hi && Number.isFinite(lo) && Number.isFinite(hi),
      'Không xác định được đoạn hiển thị.',
    );
    return [
      [a[0] + lo * d[0], a[1] + lo * d[1]],
      [a[0] + hi * d[0], a[1] + hi * d[1]],
    ];
  };
  for (const [i, s] of scene.strokes.entries()) {
    const ps = s.args.map((id) => points.get(id)),
      [a, b, c] = ps,
      style = s.style === 'main' ? '' : ',dashed';
    if (['segment', 'line', 'ray'].includes(s.kind)) {
      const [p, q] = s.kind === 'segment' ? [a, b] : clip(a, b, s.kind === 'ray');
      line(p, q, s, s.kind === 'ray');
      label(s.label, s.kind === 'ray' ? q : [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]);
      tikz.push(`\\draw[${s.kind === 'ray' ? '->' : '-'}${style}] (${pair(p)}) -- (${pair(q)});`);
    }
    if (s.kind === 'polygon') {
      track([...ps, ps[0]].map(xy));
      elements.push(`<polygon points="${ps.map((p) => pair(xy(p))).join(' ')}" ${attrs(s)}/>`);
      tikz.push(`\\draw[-${style}] ${s.args.map((id) => '(' + id + ')').join(' -- ')} -- cycle;`);
      label(
        s.label,
        ps.reduce((u, p) => [u[0] + p[0] / ps.length, u[1] + p[1] / ps.length], [0, 0]),
      );
    }
    if (s.kind === 'circle') {
      const r = Math.hypot(b[0] - a[0], b[1] - a[1]),
        p = xy(a);
      elements.push(
        `<circle cx="${num(p[0])}" cy="${num(p[1])}" r="${num(r * scale)}" ${attrs(s)}/>`,
      );
      tikz.push(`\\draw[-${style}] (${s.args[0]}) circle (${num(r)});`);
      track(
        Array.from({ length: 65 }, (_, i) =>
          xy([a[0] + r * Math.cos((i * Math.PI) / 32), a[1] + r * Math.sin((i * Math.PI) / 32)]),
        ),
      );
      label(s.label, [a[0] + r * 0.75, a[1] + r * 0.75]);
    }
    if (s.kind === 'arc') {
      const r = Math.hypot(b[0] - a[0], b[1] - a[1]),
        [start, end] = s.values,
        curve = Array.from({ length: 101 }, (_, j) => {
          const t = ((start + ((end - start) * j) / 100) * Math.PI) / 180;
          return [a[0] + r * Math.cos(t), a[1] + r * Math.sin(t)];
        });
      track(curve.map(xy));
      elements.push(`<polyline points="${curve.map((p) => pair(xy(p))).join(' ')}" ${attrs(s)}/>`);
      tikz.push(`\\draw[-${style}] ${curve.map((p) => '(' + pair(p) + ')').join(' -- ')};`);
      label(s.label, curve[50]);
    }
    if (s.kind === 'rightAngle' || s.kind === 'angle') {
      const p = xy(b),
        ap = xy(a),
        cp = xy(c),
        u = unit([ap[0] - p[0], ap[1] - p[1], 0]),
        v = unit([cp[0] - p[0], cp[1] - p[1], 0]),
        r = Math.min(15, distance(ap, p) * 0.22, distance(cp, p) * 0.22);
      let path;
      if (s.kind === 'rightAngle')
        path = [add(p, mul(u, r)), add(add(p, mul(u, r)), mul(v, r)), add(p, mul(v, r))];
      else {
        const t = Math.atan2(u[1], u[0]),
          raw = Math.atan2(v[1], v[0]) - t,
          delta = ((raw + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
        path = Array.from({ length: 25 }, (_, j) => [
          p[0] + r * Math.cos(t + (delta * j) / 24),
          p[1] + r * Math.sin(t + (delta * j) / 24),
        ]);
      }
      track(path);
      elements.push(`<polyline points="${path.map(pair).join(' ')}" ${attrs(s)}/>`);
      label(s.label, [b[0] + ((u[0] + v[0]) * 25) / scale, b[1] - ((u[1] + v[1]) * 25) / scale]);
      tikz.push(
        '\\draw[-' +
          style +
          '] ' +
          path
            .map((q) => '(' + pair([cx + (q[0] - 420) / scale, cy - (q[1] - 320) / scale]) + ')')
            .join(' -- ') +
          ';',
      );
    }
    if (s.kind === 'equalMark') {
      const p = xy(a),
        q = xy(b),
        u = unit([q[0] - p[0], q[1] - p[1], 0]),
        v = [-u[1], u[0]];
      for (let j = 0; j < s.values[0]; j++) {
        const k = (j - (s.values[0] - 1) / 2) * 5,
          mid = [(p[0] + q[0]) / 2 + k * u[0], (p[1] + q[1]) / 2 + k * u[1]],
          p1 = sub(mid, mul(v, 5)),
          p2 = add(mid, mul(v, 5));
        elements.push(`<path d="M ${pair(p1)} L ${pair(p2)}" ${attrs(s)}/>`);
        tikz.push(
          '\\draw ' +
            [p1, p2]
              .map((z) => '(' + pair([cx + (z[0] - 420) / scale, cy - (z[1] - 320) / scale]) + ')')
              .join(' -- ') +
            ';',
        );
      }
    }
    if (s.kind === 'axes') {
      const [x0, x1, y0, y1] = s.values;
      for (const [p, q, l] of [
        [[x0, 0], [x1, 0], 'x'],
        [[0, y0], [0, y1], 'y'],
      ]) {
        if ((l === 'x' && (y0 > 0 || y1 < 0)) || (l === 'y' && (x0 > 0 || x1 < 0))) continue;
        line(p, q, { ...s, style: 'main' }, true);
        label(l, q);
        tikz.push(`\\draw[->] (${pair(p)}) -- (${pair(q)});`);
      }
      if (x0 <= 0 && x1 >= 0 && y0 <= 0 && y1 >= 0) label('O', [0, 0]);
      const step = 10 ** Math.floor(Math.log10(Math.max(x1 - x0, y1 - y0) / 8));
      const tick = step * (Math.max(x1 - x0, y1 - y0) / step > 16 ? 2 : 1);
      for (let x = Math.ceil(x0 / tick) * tick; x <= x1; x += tick)
        if (Math.abs(x) > EPS && y0 <= 0 && y1 >= 0) {
          line([x, -3 / scale], [x, 3 / scale], { ...s, style: 'main' });
          label(num(x), [x, 0], 'x');
        }
      for (let y = Math.ceil(y0 / tick) * tick; y <= y1; y += tick)
        if (Math.abs(y) > EPS && x0 <= 0 && x1 >= 0) {
          line([-3 / scale, y], [3 / scale, y], { ...s, style: 'main' });
          label(num(y), [0, y], 'y');
        }
    }
    if (s.kind === 'plot') {
      for (const path of curves.get(i)) {
        track(path.filter((_p, j) => j % 4 === 0 || j === path.length - 1).map(xy));
        elements.push(`<polyline points="${path.map((p) => pair(xy(p))).join(' ')}" ${attrs(s)}/>`);
        tikz.push(
          `\\draw[-${style}] ${path
            .filter((_p, j) => j % 4 === 0 || j === path.length - 1)
            .map((p) => '(' + pair(p) + ')')
            .join(' -- ')};`,
        );
      }
      const longest = curves.get(i).reduce((a, b) => (b.length > a.length ? b : a), []);
      label(s.label, longest[Math.floor(longest.length * 0.7)]);
    }
  }
  for (const node of scene.nodes)
    if (node.label) {
      const p = points.get(node.id),
        q = xy(p);
      elements.push(`<circle cx="${num(q[0])}" cy="${num(q[1])}" r="3.3" fill="#172e4f"/>`);
      label(node.label, p);
    }
  const occupied = [];
  for (const item of labels) {
    const width = Math.max(10, item.text.length * 8.2),
      height = 20,
      [x, y] = item.p;
    const candidates = (
      item.axis === 'x'
        ? [[-width / 2, 24]]
        : item.axis === 'y'
          ? [[-width - 10, 5]]
          : [
              [9, -12],
              [-width - 9, -12],
              [9, 23],
              [-width - 9, 23],
              [-width / 2, -21],
              [-width / 2, 31],
              [18, 5],
              [-width - 18, 5],
            ]
    ).map(([dx, dy]) => ({ x: x + dx, y: y + dy, w: width, h: height }));
    const score = (r) =>
      occupied.reduce(
        (s, o) =>
          s +
          (r.x < o.x + o.w && r.x + r.w > o.x && r.y - height < o.y && r.y > o.y - o.h ? 100 : 0),
        0,
      ) +
      [...points.values()].reduce((s, p) => {
        const q = xy(p);
        return (
          s +
          (q[0] > r.x - 3 && q[0] < r.x + r.w + 3 && q[1] > r.y - height - 3 && q[1] < r.y + 3
            ? 20
            : 0)
        );
      }, 0) +
      ink.reduce((sum, [a, b]) => {
        let lo = 0,
          hi = 1;
        for (let k = 0; k < 2; k++) {
          const lower = k ? r.y - r.h - 2 : r.x - 2,
            upper = k ? r.y + 2 : r.x + r.w + 2,
            delta = b[k] - a[k];
          if (Math.abs(delta) < EPS) {
            if (a[k] < lower || a[k] > upper) return sum;
            continue;
          }
          let t = (lower - a[k]) / delta,
            u = (upper - a[k]) / delta;
          if (t > u) [t, u] = [u, t];
          lo = Math.max(lo, t);
          hi = Math.min(hi, u);
        }
        return sum + (lo <= hi ? 30 : 0);
      }, 0) +
      (r.x < 12 || r.x + r.w > 828 || r.y < 66 || r.y > 570 ? 1000 : 0);
    candidates.sort((a, b) => score(a) - score(b));
    const r = candidates[0];
    occupied.push(r);
    elements.push(
      `<text x="${num(r.x)}" y="${num(r.y)}" font-size="16" fill="#122d50" paint-order="stroke" stroke="white" stroke-width="4" stroke-linejoin="round">${esc(item.text)}</text>`,
    );

    let safe = item.text
      .replaceAll('−', '-')
      .replaceAll('′', "'")
      .replaceAll('²', '^2')
      .replaceAll('³', '^3')
      .replaceAll('π', 'pi');
    if (/^[A-Za-z0-9_'., =+()*/^\-]+$/.test(safe)) {
      safe = safe
        .replaceAll('_', '\\_')
        .replace(/\bpi\b/g, '\\pi ')
        .replace(/\b(sin|cos|tan|sqrt|abs|ln|log|exp)\b/g, '\\operatorname{$1}');
      tikz.push(
        `\\node at (${num(cx + (r.x + width / 2 - 420) / scale)},${num(cy - (r.y - 7 - 320) / scale)}) {$${safe}$};`,
      );
    } else completeTexLabels = false;
  }
  const titleLines = scene.title.match(/.{1,78}(?:\s|$)|.{1,78}/gu) || [];
  const titleMarkup = titleLines
    .slice(0, 2)
    .map(
      (line, i) =>
        `<text x="28" y="${30 + i * 22}" font-size="18" font-weight="bold" fill="#172e4f">${esc(line.trim())}</text>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="600" viewBox="0 0 840 600" role="img" aria-label="${esc(scene.title || 'Hình minh họa')}"><title>${esc(scene.title || 'Hình minh họa')}</title><rect width="840" height="600" rx="14" fill="white"/><g font-family="Arial, sans-serif">${titleMarkup}${elements.join('')}<text x="28" y="583" font-size="12" fill="#59677a">${space ? 'Hình chiếu minh họa không gian.' : 'Hình minh họa; cần lập luận để chứng minh.'}</text></g></svg>`;
  const latex =
    '\\documentclass[tikz,border=6pt]{standalone}\n\\begin{document}\n\\begin{tikzpicture}\n' +
    tikz.join('\n') +
    '\n\\end{tikzpicture}\n\\end{document}';
  return {
    svg,
    latex: completeTexLabels && latex.length <= 18000 ? latex : '',
    scene,
    validation: { checked: evaluated.checked, unverified: [], notice: evaluated.notice },
    renderer: 'geometry-v1',
  };
}
