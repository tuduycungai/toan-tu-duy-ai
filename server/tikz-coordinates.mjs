export function scalar(source) {
  const text = String(source).replaceAll('{', '(').replaceAll('}', ')').replace(/\s+/g, '');
  if (!text || text.length > 200) throw Error('Biểu thức tọa độ quá dài hoặc trống.');
  const tokens =
    text.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|sqrt|sin|cos|pi|[()+*/^\-]/g) || [];
  if (tokens.join('') !== text || tokens.length > 100)
    throw Error('Biểu thức tọa độ không được hỗ trợ.');
  let i = 0,
    depth = 0;
  const take = () => tokens[i++];
  function atom() {
    if (++depth > 24) throw Error('Biểu thức tọa độ lồng quá sâu.');
    const token = take();
    let value;
    if (token === '(') {
      value = expr();
      if (take() !== ')') throw Error('Thiếu ngoặc tọa độ.');
    } else if (['sqrt', 'sin', 'cos'].includes(token)) {
      if (take() !== '(') throw Error('Hàm tọa độ cần ngoặc.');
      const x = expr();
      if (take() !== ')') throw Error('Thiếu ngoặc hàm.');
      value =
        token === 'sqrt'
          ? Math.sqrt(x)
          : token === 'sin'
            ? Math.sin((x * Math.PI) / 180)
            : Math.cos((x * Math.PI) / 180);
    } else if (token === 'pi') value = Math.PI;
    else if (token && /^(?:\d|\.)/.test(token)) value = Number(token);
    else throw Error('Biểu thức tọa độ không hợp lệ.');
    depth--;
    return value;
  }
  function power() {
    const a = atom();
    return tokens[i] === '^' ? (take(), Math.pow(a, unary())) : a;
  }
  function unary() {
    if (tokens[i] === '+' || tokens[i] === '-') {
      const sign = take();
      return (sign === '-' ? -1 : 1) * unary();
    }
    return power();
  }
  function product() {
    let a = unary();
    while (['*', '/'].includes(tokens[i])) {
      const op = take(),
        b = unary();
      a = op === '*' ? a * b : a / b;
    }
    return a;
  }
  function expr() {
    let a = product();
    while (['+', '-'].includes(tokens[i])) {
      const op = take(),
        b = product();
      a = op === '+' ? a + b : a - b;
    }
    return a;
  }
  const value = expr();
  if (i !== tokens.length || !Number.isFinite(value) || Math.abs(value) > 1000000)
    throw Error('Tọa độ không hữu hạn hoặc vượt giới hạn.');
  return value;
}
const pointName = "[A-Z](?:[0-9]{1,2}|['′]{1,2})?";
export function coordinateMap(clean) {
  const definitions = new Map(),
    points = new Map(),
    pending = new Set();

  const pattern = new RegExp(
    '\\\\coordinate\\s*\\((' + pointName + ')\\)\\s+at\\s*([\\s\\S]*?);',
    'g',
  );
  for (const m of clean.matchAll(pattern)) {
    if (definitions.has(m[1])) throw Error('Không định nghĩa lại điểm sau khi đã kiểm tra.');
    definitions.set(m[1], m[2].trim());
  }
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]],
    cross = (a, b) => a[0] * b[1] - a[1] * b[0];
  const pair = (text) => {
    if (text[0] !== '(' || text.at(-1) !== ')') throw Error('Tọa độ cần cặp ngoặc.');
    const parts = text.slice(1, -1).split(',');
    if (parts.length !== 2) throw Error('Cần tọa độ phẳng (x,y).');
    return parts.map(scalar);
  };
  function get(name) {
    if (points.has(name)) return points.get(name);
    if (!definitions.has(name) || pending.has(name) || pending.size > 40)
      throw Error('Điểm ' + name + ' chưa có phép dựng xác định hoặc có tham chiếu vòng.');
    pending.add(name);
    const expression = definitions.get(name);
    let p, m;
    if (
      (m = /^\(\$\s*\(([A-Z0-9'′]+)\)\s*!\s*([^!]+)\s*!\s*\(([A-Z0-9'′]+)\)\s*\$\)$/.exec(
        expression,
      ))
    ) {
      const a = get(m[1]),
        b = get(m[3]),
        t = scalar(m[2]);
      p = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    } else if (
      (m =
        /^\(intersection\s+of\s+([A-Z0-9'′]+)--([A-Z0-9'′]+)\s+and\s+([A-Z0-9'′]+)--([A-Z0-9'′]+)\)$/.exec(
          expression,
        ))
    ) {
      const a = get(m[1]),
        b = get(m[2]),
        c = get(m[3]),
        d = get(m[4]),
        u = sub(b, a),
        v = sub(d, c),
        den = cross(u, v);
      if (Math.abs(den) < 1e-10) throw Error('Hai đường không có giao điểm duy nhất.');
      const t = cross(sub(c, a), v) / den;
      p = [a[0] + t * u[0], a[1] + t * u[1]];
    } else if ((m = /^\(\$\s*\(([A-Z0-9'′]+)\)\s*([+-])\s*(\([^]+\))\s*\$\)$/.exec(expression))) {
      const a = get(m[1]),
        b = pair(m[3]),
        sign = m[2] === '+' ? 1 : -1;
      p = [a[0] + sign * b[0], a[1] + sign * b[1]];
    } else if ((m = /^\(([A-Z0-9'′]+)\)$/.exec(expression))) p = [...get(m[1])];
    else p = pair(expression);
    if (p.some((n) => !Number.isFinite(n) || Math.abs(n) > 1000))
      throw Error('Tọa độ điểm ' + name + ' vượt giới hạn.');
    pending.delete(name);
    points.set(name, p);
    return p;
  }
  for (const name of definitions.keys()) get(name);
  return points;
}
