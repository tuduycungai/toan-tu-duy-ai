export function parsePlotExpression(input) {
  if (typeof input !== 'string' || !input.trim() || input.length > 200)
    throw Error('Biểu thức đồ thị trống hoặc quá dài.');
  const tokens = [];
  const pattern = /\s*(?:(\d+(?:\.\d*)?|\.\d+)(?:[eE]([+-]?\d+))?|([a-z]+)|([+*/^()\-]))/gy;
  let index = 0;
  while (index < input.trimEnd().length) {
    pattern.lastIndex = index;
    const m = pattern.exec(input);
    if (!m) throw Error('Biểu thức chỉ dùng x, số, phép toán và hàm được hỗ trợ.');
    tokens.push(m[1] ? Number(m[1] + (m[2] ? 'e' + m[2] : '')) : m[3] || m[4]);
    index = pattern.lastIndex;
  }
  if (tokens.length > 120) throw Error('Biểu thức quá phức tạp.');
  let cursor = 0,
    depth = 0;
  const functions = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    sqrt: Math.sqrt,
    abs: Math.abs,
    ln: Math.log,
    log: Math.log10,
    exp: Math.exp,
  };
  const take = (s) => tokens[cursor] === s && (++cursor, true);
  const expect = (s) => {
    if (!take(s)) throw Error('Thiếu dấu ' + s + ' trong biểu thức.');
  };
  function atom() {
    if (++depth > 20) throw Error('Biểu thức lồng quá sâu.');
    const t = tokens[cursor++];
    let result;
    if (typeof t === 'number' && Number.isFinite(t)) result = () => t;
    else if (t === 'x') result = (x) => x;
    else if (t === 'pi') result = () => Math.PI;
    else if (t === 'e') result = () => Math.E;
    else if (t === '(') {
      result = sum();
      expect(')');
    } else if (Object.hasOwn(functions, t)) {
      expect('(');
      const a = sum();
      expect(')');
      result = (x) => functions[t](a(x));
    } else throw Error('Ký hiệu chưa hỗ trợ trong biểu thức: ' + String(t));
    depth--;
    return result;
  }
  function power() {
    const a = atom();
    if (take('^')) {
      const b = unary();
      return (x) => a(x) ** b(x);
    }
    return a;
  }
  function unary() {
    if (take('+')) return unary();
    if (take('-')) {
      const a = unary();
      return (x) => -a(x);
    }
    return power();
  }
  function product() {
    let a = unary();
    while (['*', '/'].includes(tokens[cursor])) {
      const op = tokens[cursor++],
        left = a,
        b = unary();
      a = op === '*' ? (x) => left(x) * b(x) : (x) => left(x) / b(x);
    }
    return a;
  }
  function sum() {
    let a = product();
    while (['+', '-'].includes(tokens[cursor])) {
      const op = tokens[cursor++],
        left = a,
        b = product();
      a = op === '+' ? (x) => left(x) + b(x) : (x) => left(x) - b(x);
    }
    return a;
  }
  const evaluate = sum();
  if (cursor !== tokens.length) throw Error('Cần viết phép nhân bằng dấu *.');
  return evaluate;
}
