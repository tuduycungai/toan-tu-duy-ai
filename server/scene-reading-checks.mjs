import { evaluateScene } from '../public/geometry-scene.mjs';
import { checkGeometryCode } from './geometry-checks.mjs';

export function checkReadingScene(scene, reading) {
  const { points } = evaluateScene(scene);
  for (const name of reading.points)
    if (!points.has(name)) throw Error('Thiếu điểm ' + name + ' có tên trong đề đã xác nhận.');
  if (scene.view === 'plane') {
    const n = (x) => x.toFixed(12);
    let code = [...points]
      .map(([id, p]) => `\\coordinate (${id}) at (${n(p[0])},${n(p[1])});`)
      .join('\n');
    for (const s of scene.strokes.filter((s) => s.kind === 'circle')) {
      const [a, b] = s.args.map((id) => points.get(id)),
        r = Math.hypot(...a.map((x, i) => x - b[i]));
      code += `\n\\draw (${s.args[0]}) circle (${n(r)});`;
    }
    return checkGeometryCode(code, reading);
  }
  const mapping = {
    on_line: 'onLine',
    on_segment: 'onSegment',
    midpoint: 'midpoint',
    parallel: 'parallel',
    perpendicular: 'perpendicular',
    equal_length: 'equalLength',
    ratio: 'ratio',
    length: 'length',
    angle: 'angle',
    equal_angle: 'equalAngle',
  };
  const checked = [],
    unverified = [];
  for (const r of reading.relations) {
    const kind = mapping[r.kind];
    if (!kind) {
      unverified.push(r.description);
      continue;
    }
    evaluateScene({
      ...scene,
      constraints: [{ kind, args: r.items, value: r.value, source: r.description }],
    });
    checked.push(r.description);
  }
  for (const o of reading.objects) unverified.push(o.definition);
  return {
    checked,
    unverified,
    notice:
      'Hình chiếu minh họa không gian. Các quan hệ đã mã hóa được kiểm tra bằng tọa độ 3D; em đối chiếu thêm các đối tượng và nhãn.',
  };
}
