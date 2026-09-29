export const point = (id, x, y, z) => ({
  id,
  op: 'free',
  args: [],
  values: z === undefined ? [x, y] : [x, y, z],
  label: id,
  source: '',
});
export const node = (id, op, args, values = [], label = id) => ({
  id,
  op,
  args,
  values,
  label,
  source: '',
});
export const stroke = (kind, args, values = [], label = '', style = 'main', expression = '') => ({
  kind,
  args,
  values,
  label,
  style,
  expression,
  source: '',
});
export const constraint = (kind, args, value = 0, source = '') => ({ kind, args, value, source });
export const scene = (title, nodes, strokes, constraints = [], view = 'plane') => ({
  version: 'geometry-v1',
  status: 'ready',
  question: '',
  title,
  view,
  nodes,
  strokes,
  constraints,
  assumptions: [],
});
export function cases() {
  const samples = [];
  const add = (name, problem, s) => {
    s.constraints.forEach((r) => {
      r.source = problem;
    });
    s.strokes
      .filter((s) => ['rightAngle', 'equalMark'].includes(s.kind))
      .forEach((r) => {
        r.source = problem;
      });
    samples.push({ name, problem, scene: s });
  };
  add(
    'altitudes',
    'Cho tam giác ABC có các đường cao AH và BK.',
    scene(
      'Tam giác và đường cao',
      [
        point('A', 1, 4),
        point('B', -3, 0),
        point('C', 5, 0),
        node('H', 'foot', ['A', 'B', 'C']),
        node('K', 'foot', ['B', 'A', 'C']),
        node('O', 'orthocenter', ['A', 'B', 'C']),
      ],
      [
        stroke('polygon', ['A', 'B', 'C']),
        stroke('segment', ['A', 'H'], [], '', 'aux'),
        stroke('segment', ['B', 'K'], [], '', 'aux'),
        stroke('rightAngle', ['A', 'H', 'B']),
      ],
      [
        constraint('perpendicular', ['A', 'H', 'B', 'C']),
        constraint('perpendicular', ['B', 'K', 'A', 'C']),
        constraint('onLine', ['O', 'A', 'H']),
        constraint('onLine', ['O', 'B', 'K']),
      ],
    ),
  );
  add(
    'external-altitude',
    'Cho tam giác tù ABC, H là chân đường cao từ A xuống BC.',
    scene(
      'Chân đường cao ở ngoài cạnh',
      [point('A', -4, 2), point('B', 0, 0), point('C', 5, 0), node('H', 'foot', ['A', 'B', 'C'])],
      [
        stroke('polygon', ['A', 'B', 'C']),
        stroke('line', ['B', 'C'], [], '', 'aux'),
        stroke('segment', ['A', 'H']),
        stroke('rightAngle', ['A', 'H', 'B']),
      ],
      [constraint('onLine', ['H', 'B', 'C']), constraint('perpendicular', ['A', 'H', 'B', 'C'])],
    ),
  );
  add(
    'medians',
    'Cho tam giác ABC; M, N lần lượt là trung điểm BC, AC; G là trọng tâm.',
    scene(
      'Trung tuyến và trọng tâm',
      [
        point('A', 0, 5),
        point('B', -4, 0),
        point('C', 6, 0),
        node('M', 'midpoint', ['B', 'C']),
        node('N', 'midpoint', ['A', 'C']),
        node('G', 'centroid', ['A', 'B', 'C']),
      ],
      [
        stroke('polygon', ['A', 'B', 'C']),
        stroke('segment', ['A', 'M']),
        stroke('segment', ['B', 'N']),
        stroke('equalMark', ['B', 'M'], [1]),
        stroke('equalMark', ['M', 'C'], [1]),
      ],
      [
        constraint('midpoint', ['M', 'B', 'C']),
        constraint('midpoint', ['N', 'A', 'C']),
        constraint('onLine', ['G', 'A', 'M']),
        constraint('ratio', ['A', 'G', 'G', 'M'], 2),
      ],
    ),
  );
  add(
    'circumcircle',
    'Cho tam giác ABC nội tiếp đường tròn tâm O.',
    scene(
      'Đường tròn ngoại tiếp',
      [
        point('A', 0, 4),
        point('B', -3, 0),
        point('C', 5, 0),
        node('O', 'circumcenter', ['A', 'B', 'C']),
      ],
      [stroke('polygon', ['A', 'B', 'C']), stroke('circle', ['O', 'A'])],
      [constraint('onCircle', ['B', 'O', 'A']), constraint('onCircle', ['C', 'O', 'A'])],
    ),
  );
  add(
    'incircle',
    'Cho tam giác ABC, I là tâm đường tròn nội tiếp; H, K là các tiếp điểm trên BC, AB.',
    scene(
      'Đường tròn nội tiếp',
      [
        point('A', 1, 5),
        point('B', -3, 0),
        point('C', 5, 0),
        node('I', 'incenter', ['A', 'B', 'C']),
        node('H', 'foot', ['I', 'B', 'C']),
        node('K', 'foot', ['I', 'A', 'B']),
        node('J', 'foot', ['I', 'A', 'C'], [], ''),
      ],
      [
        stroke('polygon', ['A', 'B', 'C']),
        stroke('circle', ['I', 'H']),
        stroke('segment', ['I', 'H'], [], '', 'aux'),
        stroke('rightAngle', ['I', 'H', 'B']),
      ],
      [
        constraint('perpendicular', ['I', 'H', 'B', 'C']),
        constraint('equalLength', ['I', 'H', 'I', 'K']),
        constraint('equalLength', ['I', 'H', 'I', 'J']),
      ],
    ),
  );
  add(
    'bisector',
    'Cho tam giác ABC; BD là phân giác góc ABC, D thuộc AC.',
    scene(
      'Phân giác trong tam giác',
      [
        point('A', -2, 4),
        point('B', 0, 0),
        point('C', 6, 0),
        node('X', 'bisectorPoint', ['A', 'B', 'C'], [], ''),
        node('D', 'intersection', ['B', 'X', 'A', 'C']),
      ],
      [
        stroke('polygon', ['A', 'B', 'C']),
        stroke('segment', ['B', 'D']),
        stroke('angle', ['A', 'B', 'D']),
        stroke('angle', ['D', 'B', 'C']),
      ],
      [
        constraint('onSegment', ['D', 'A', 'C']),
        constraint('equalAngle', ['A', 'B', 'D', 'D', 'B', 'C']),
      ],
    ),
  );
  add(
    'rectangle',
    'Cho hình chữ nhật ABCD, hai đường chéo cắt nhau tại O.',
    scene(
      'Hình chữ nhật và đường chéo',
      [
        point('A', 0, 0),
        point('B', 6, 0),
        point('D', 0, 4),
        node('C', 'translate', ['D', 'A', 'B']),
        node('O', 'intersection', ['A', 'C', 'B', 'D']),
      ],
      [
        stroke('polygon', ['A', 'B', 'C', 'D']),
        stroke('segment', ['A', 'C'], [], '', 'aux'),
        stroke('segment', ['B', 'D'], [], '', 'aux'),
        stroke('rightAngle', ['B', 'A', 'D']),
      ],
      [
        constraint('parallel', ['A', 'B', 'D', 'C']),
        constraint('parallel', ['A', 'D', 'B', 'C']),
        constraint('perpendicular', ['A', 'B', 'A', 'D']),
        constraint('midpoint', ['O', 'A', 'C']),
        constraint('midpoint', ['O', 'B', 'D']),
      ],
    ),
  );
  add(
    'rhombus',
    'Cho hình thoi ABCD với hai đường chéo AC, BD.',
    scene(
      'Hình thoi',
      [point('A', 0, 3), point('B', -5, 0), point('C', 0, -3), point('D', 5, 0)],
      [
        stroke('polygon', ['A', 'B', 'C', 'D']),
        stroke('segment', ['A', 'C'], [], '', 'aux'),
        stroke('segment', ['B', 'D'], [], '', 'aux'),
        ...['AB', 'BC', 'CD', 'DA'].map((a) => stroke('equalMark', [...a], [1])),
      ],
      [
        constraint('equalLength', ['A', 'B', 'B', 'C']),
        constraint('equalLength', ['A', 'B', 'C', 'D']),
        constraint('equalLength', ['A', 'B', 'D', 'A']),
      ],
    ),
  );
  add(
    'trapezoid',
    'Cho hình thang ABCD với AB song song CD; M, N là trung điểm AD, BC.',
    scene(
      'Đường trung bình hình thang',
      [
        point('A', 0, 3),
        point('B', 3, 3),
        point('C', 6, 0),
        point('D', -2, 0),
        node('M', 'midpoint', ['A', 'D']),
        node('N', 'midpoint', ['B', 'C']),
      ],
      [stroke('polygon', ['A', 'B', 'C', 'D']), stroke('segment', ['M', 'N'], [], '', 'aux')],
      [
        constraint('parallel', ['A', 'B', 'C', 'D']),
        constraint('midpoint', ['M', 'A', 'D']),
        constraint('midpoint', ['N', 'B', 'C']),
      ],
    ),
  );
  add(
    'tangents',
    'Cho đường tròn tâm O qua R, từ điểm P bên ngoài kẻ các tiếp tuyến PT, PU.',
    scene(
      'Hai tiếp tuyến từ điểm ngoài',
      [
        point('O', 0, 0),
        point('R', 0, 3),
        point('P', 7, 0),
        node('M', 'midpoint', ['O', 'P'], [], ''),
        node('T', 'circleCircle', ['O', 'R', 'M', 'P'], [1]),
        node('U', 'circleCircle', ['O', 'R', 'M', 'P'], [-1]),
      ],
      [
        stroke('circle', ['O', 'R']),
        stroke('segment', ['P', 'T']),
        stroke('segment', ['P', 'U']),
        stroke('segment', ['O', 'T'], [], '', 'aux'),
        stroke('segment', ['O', 'U'], [], '', 'aux'),
        stroke('rightAngle', ['O', 'T', 'P']),
        stroke('rightAngle', ['O', 'U', 'P']),
      ],
      [
        constraint('onCircle', ['T', 'O', 'R']),
        constraint('onCircle', ['U', 'O', 'R']),
        constraint('perpendicular', ['O', 'T', 'P', 'T']),
        constraint('perpendicular', ['O', 'U', 'P', 'U']),
      ],
    ),
  );
  add(
    'secant',
    'Cho đường tròn tâm O qua R, đường thẳng AB cắt đường tròn tại M và N.',
    scene(
      'Cát tuyến và đường tròn',
      [
        point('O', 0, 0),
        point('R', 0, 3),
        point('A', -5, 1),
        point('B', 5, 1),
        node('M', 'lineCircle', ['A', 'B', 'O', 'R'], [-1]),
        node('N', 'lineCircle', ['A', 'B', 'O', 'R'], [1]),
      ],
      [stroke('circle', ['O', 'R']), stroke('line', ['A', 'B'])],
      [
        constraint('onCircle', ['M', 'O', 'R']),
        constraint('onCircle', ['N', 'O', 'R']),
        constraint('onLine', ['M', 'A', 'B']),
        constraint('onLine', ['N', 'A', 'B']),
      ],
    ),
  );
  add(
    'reflection',
    'Cho tam giác ABC, dựng tam giác DEF đối xứng qua đường thẳng XY.',
    scene(
      'Đối xứng qua một đường thẳng',
      [
        point('A', 1, 1),
        point('B', 3, 4),
        point('C', 4, 1),
        point('X', 0, -1),
        point('Y', 0, 5),
        ...['A', 'B', 'C'].map((id, i) => node('DEF'[i], 'reflectLine', [id, 'X', 'Y'])),
      ],
      [
        stroke('polygon', ['A', 'B', 'C']),
        stroke('polygon', ['D', 'E', 'F']),
        stroke('line', ['X', 'Y'], [], '', 'aux'),
      ],
      [
        constraint('equalLength', ['A', 'B', 'D', 'E']),
        constraint('equalLength', ['B', 'C', 'E', 'F']),
      ],
    ),
  );
  add(
    'regular',
    'Cho lục giác đều ABCDEF tâm O.',
    scene(
      'Lục giác đều',
      [
        point('O', 0, 0),
        point('A', 3, 0),
        ...['B', 'C', 'D', 'E', 'F'].map((id, i) =>
          node(id, 'regularVertex', ['O', 'A'], [6, i + 1]),
        ),
      ],
      [stroke('polygon', [...'ABCDEF']), stroke('circle', ['O', 'A'], [], '', 'aux')],
      [...'BCDEF'].map((id) => constraint('onCircle', [id, 'O', 'A'])),
    ),
  );
  add(
    'rays-eight',
    'Cho tam giác ABC có đường cao AI. Từ A kẻ tia Ax vuông góc AC, từ B kẻ tia By song song AC. M là giao điểm hai tia. P là trung điểm AB; MP cắt AC tại Q; BQ cắt AI tại H.',
    scene(
      'Tia, trung điểm và các giao điểm',
      [
        point('A', 0, 0),
        point('C', 6, 0),
        point('B', -2, 4),
        node('I', 'foot', ['A', 'B', 'C']),
        node('X', 'perpendicularPoint', ['A', 'A', 'C'], [], ''),
        node('Y', 'parallelPoint', ['B', 'A', 'C'], [], ''),
        node('M', 'intersection', ['A', 'X', 'B', 'Y']),
        node('P', 'midpoint', ['A', 'B']),
        node('Q', 'intersection', ['M', 'P', 'A', 'C']),
        node('H', 'intersection', ['B', 'Q', 'A', 'I']),
      ],
      [
        stroke('polygon', ['A', 'B', 'C']),
        stroke('line', ['A', 'I'], [], '', 'aux'),
        stroke('ray', ['A', 'X'], [], 'x'),
        stroke('ray', ['B', 'Y'], [], 'y'),
        stroke('segment', ['M', 'Q']),
        stroke('segment', ['B', 'H']),
        stroke('line', ['A', 'C'], [], '', 'aux'),
      ],
      [
        constraint('onRay', ['M', 'A', 'X']),
        constraint('onRay', ['M', 'B', 'Y']),
        constraint('perpendicular', ['A', 'X', 'A', 'C']),
        constraint('parallel', ['B', 'Y', 'A', 'C']),
        constraint('onLine', ['Q', 'A', 'C']),
        constraint('onLine', ['Q', 'M', 'P']),
        constraint('onLine', ['H', 'B', 'Q']),
        constraint('onLine', ['H', 'A', 'I']),
      ],
    ),
  );
  for (const [name, title, formula, bounds] of [
    ['parabola', 'Đồ thị hàm bậc hai', 'x^2-2*x-1', [-3, 5, -4, 8]],
    ['hyperbola', 'Đồ thị có tiệm cận', '1/x', [-5, 5, -5, 5]],
    ['trigonometry', 'Đồ thị lượng giác', 'sin(x)', [-7, 7, -2, 2]],
    ['root', 'Đồ thị căn bậc hai', 'sqrt(x)', [-1, 9, -1, 4]],
  ])
    add(
      name,
      'Vẽ đồ thị ' + formula,
      scene(
        title,
        [],
        [
          stroke('axes', [], bounds, '', 'aux'),
          stroke('plot', [], bounds, 'y = ' + formula, 'main', formula),
        ],
      ),
    );
  add(
    'cuboid',
    'Cho hình hộp chữ nhật ABCD.EFGH có AB = 6, AD = 4, AE = 3.',
    scene(
      'Hình hộp chữ nhật',
      [
        point('A', 0, 0, 0),
        point('B', 6, 0, 0),
        point('D', 0, 4, 0),
        point('E', 0, 0, 3),
        node('C', 'translate', ['D', 'A', 'B']),
        node('F', 'translate', ['E', 'A', 'B']),
        node('G', 'translate', ['C', 'A', 'E']),
        node('H', 'translate', ['D', 'A', 'E']),
      ],
      ['AB', 'BC', 'CD', 'DA', 'EF', 'FG', 'GH', 'HE', 'AE', 'BF', 'CG', 'DH'].map((a) =>
        stroke('segment', [...a], [], '', ['CD', 'DA', 'DH'].includes(a) ? 'hidden' : 'main'),
      ),
      [
        constraint('length', ['A', 'B'], 6),
        constraint('length', ['A', 'D'], 4),
        constraint('length', ['A', 'E'], 3),
        constraint('perpendicular', ['A', 'B', 'A', 'D']),
        constraint('perpendicular', ['A', 'B', 'A', 'E']),
        constraint('perpendicular', ['A', 'D', 'A', 'E']),
      ],
      'space',
    ),
  );
  add(
    'pyramid',
    'Cho hình chóp S.ABCD có đáy ABCD là hình vuông, SO vuông góc mặt đáy tại tâm O.',
    scene(
      'Hình chóp đáy vuông',
      [
        point('A', -3, -3, 0),
        point('B', 3, -3, 0),
        point('C', 3, 3, 0),
        point('D', -3, 3, 0),
        point('O', 0, 0, 0),
        point('S', 0, 0, 5),
      ],
      ['AB', 'BC', 'CD', 'DA', 'SA', 'SB', 'SC', 'SD', 'SO'].map((a) =>
        stroke('segment', [...a], [], '', ['CD', 'DA', 'SD', 'SO'].includes(a) ? 'hidden' : 'main'),
      ),
      [
        constraint('coplanar', ['A', 'B', 'C', 'D']),
        constraint('perpendicular', ['S', 'O', 'A', 'B']),
        constraint('perpendicular', ['S', 'O', 'A', 'D']),
      ],
      'space',
    ),
  );
  return samples;
}
