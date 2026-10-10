const vars = 'abcdefghijklmnopqrstuvwxyz';
const zeroKey = '';
function tidy(p) {
  for (const [k, v] of p) {
    if (!Number.isFinite(v) || Math.abs(v) > 1e15) throw Error('Hệ số vượt giới hạn.');
    if (Math.abs(v) < 1e-10) p.delete(k);
  }
  if (p.size > 256) throw Error('Biểu thức quá phức tạp.');
  return p;
}
const number = (n) => new Map([[zeroKey, n]]);
function add(a, b, sign = 1) {
  const p = new Map(a);
  for (const [k, v] of b) p.set(k, (p.get(k) || 0) + sign * v);
  return tidy(p);
}
function mult(a, b) {
  const p = new Map();
  for (const [k, v] of a)
    for (const [l, w] of b) {
      const key = (k + l).split('').sort().join('');
      if (key.length > 30) throw Error('Bậc quá lớn.');
      p.set(key, (p.get(key) || 0) + v * w);
    }
  return tidy(p);
}
function divide(a, b) {
  if (b.size !== 1) throw Error('Chỉ kiểm tra chia hết cho đơn thức khác 0.');
  const [[key, val]] = b;
  const p = new Map();
  for (const [k, v] of a) {
    let rest = k;
    for (const c of key) {
      if (!rest.includes(c)) throw Error('Phép chia không hết.');
      rest = rest.replace(c, '');
    }
    p.set(rest, v / val);
  }
  return tidy(p);
}
export function polynomial(source) {
  let s = String(source)
    .replace(/\s+/g, '')
    .replace(/[−–]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/,/g, '.');
  if (s.length > 600 || !/^[0-9a-z+*/^().-]+$/.test(s)) throw Error('Chưa hỗ trợ cú pháp này.');
  const tokens = s.match(/\d+(?:\.\d+)?|[a-z+*/^()-]/g) || [];
  if (tokens.join('') !== s) throw Error('Ký hiệu không hợp lệ.');
  let i = 0,
    depth = 0;
  const peek = () => tokens[i];
  function atom() {
    if (++depth > 40) throw Error('Biểu thức lồng quá sâu.');
    let p;
    const t = tokens[i++];
    if (t === '(') {
      p = sum();
      if (tokens[i++] !== ')') throw Error('Thiếu ngoặc.');
    } else if (/^\d/.test(t || '')) p = number(Number(t));
    else if (t?.length === 1 && vars.includes(t)) p = new Map([[t, 1]]);
    else throw Error('Thiếu toán hạng.');
    depth--;
    return p;
  }
  function power() {
    let p = atom();
    if (peek() === '^') {
      i++;
      const n = Number(tokens[i++]);
      if (!Number.isInteger(n) || n < 0 || n > 12) throw Error('Số mũ cần nguyên từ 0 đến 12.');
      const base = p;
      p = number(1);
      for (let j = 0; j < n; j++) p = mult(p, base);
    }
    return p;
  }
  function unary() {
    if (peek() === '+') {
      i++;
      return unary();
    }
    if (peek() === '-') {
      i++;
      return mult(number(-1), unary());
    }
    return power();
  }
  function term() {
    let p = unary();
    while (i < tokens.length) {
      const t = peek();
      if (t === '*' || t === '/') {
        i++;
        p = t === '*' ? mult(p, unary()) : divide(p, unary());
      } else if (t === '(' || /^[a-z0-9]/.test(t)) {
        p = mult(p, unary());
      } else break;
    }
    return p;
  }
  function sum() {
    let p = term();
    while (peek() === '+' || peek() === '-') {
      const t = tokens[i++];
      p = add(p, term(), t === '+' ? 1 : -1);
    }
    return p;
  }
  const p = tidy(sum());
  if (i !== tokens.length) throw Error('Ký hiệu thừa.');
  return p;
}
export function equivalent(a, b) {
  try {
    const d = add(polynomial(a), polynomial(b), -1);
    return { supported: true, equal: d.size === 0 };
  } catch (e) {
    return { supported: false, equal: null, reason: e.message };
  }
}
export function numerical(source) {
  const p = polynomial(source);
  if ([...p.keys()].some((k) => k !== '')) throw Error('Còn biến.');
  return p.get('') || 0;
}
export function checkEqualities(text) {
  const parts = String(text).match(/\$([^$]+)\$/g) || [];
  const plain = String(text).trim();
  if (!parts.length && /^[a-z0-9\s+*/^().=²³−,-]+$/i.test(plain)) parts.push(plain);
  const result = [];
  for (const part of parts) {
    const eq = part.replace(/\$/g, '').split('=');
    if (eq.length < 2 || eq.length > 6) continue;
    for (let i = 1; i < eq.length; i++) {
      const checked = equivalent(eq[i - 1], eq[i]);
      if (checked.supported && !(/^\s*[a-z]\s*$/.test(eq[i - 1]) && !/[a-z]/i.test(eq[i])))
        result.push({ ...checked, left: eq[i - 1], right: eq[i] });
    }
  }
  return result;
}
export function thalesCheck({ ab, ac, am, an, parallel }) {
  if (
    ![ab, ac, am, an].every(Number.isFinite) ||
    Math.min(ab, ac, am, an) <= 0 ||
    am >= ab ||
    an >= ac
  )
    return { valid: false, reason: 'Điểm phải nằm trong hai cạnh, độ dài dương.' };
  const proportional = Math.abs(am / ab - an / ac) < 1e-9;
  return {
    valid: parallel === true ? proportional : true,
    proportional,
    canUseForward: parallel === true,
    canUseConverse: proportional,
  };
}
export function bisectorParts(ab, ac, bc) {
  if (
    ![ab, ac, bc].every((v) => Number.isFinite(v) && v > 0) ||
    ab + ac <= bc ||
    ab + bc <= ac ||
    ac + bc <= ab
  )
    throw Error('Tam giác suy biến hoặc độ dài không hợp lệ.');
  return { bd: (bc * ab) / (ab + ac), dc: (bc * ac) / (ab + ac) };
}
export function geometryNumericFacts(problem) {
  const p = String(problem),
    lengths = {},
    units = new Set();
  for (const m of p.matchAll(
    /\b(AB|AC|AM|AN|MB|NC|BC|BD|DC|MN)\s*=\s*(\d+(?:[.,]\d+)?)\s*(cm|mm|m)?\b/g,
  )) {
    lengths[m[1]] = Number(m[2].replace(',', '.'));
    if (m[3]) units.add(m[3]);
  }
  if (units.size > 1)
    return { supported: false, reason: 'Cần quy đổi đơn vị trước khi đối chiếu.' };
  const derived = {},
    unit = [...units][0] || '';
  if (/M thuộc AB/.test(p) && /N thuộc AC/.test(p) && /MN (?:song song|∥) BC/.test(p)) {
    const ab = lengths.AB ?? lengths.AM + lengths.MB,
      ac = lengths.AC ?? lengths.AN + lengths.NC,
      am = lengths.AM,
      an = lengths.AN;
    if (ab > 0 && am > 0 && am < ab) {
      if (ac > 0) derived.AN = (am * ac) / ab;
      if (an > 0) {
        derived.AC = (an * ab) / am;
        derived.NC = (an * (ab - am)) / am;
      }
    }
    if (
      [ab, ac, am, an].every(Number.isFinite) &&
      !thalesCheck({ ab, ac, am, an, parallel: true }).valid
    )
      return { supported: true, contradiction: true, derived: {}, unit };
  }
  if (/AD.{0,20}phân giác/.test(p) && /D thuộc BC/.test(p) && lengths.AB > 0 && lengths.AC > 0) {
    if (lengths.BC > 0) {
      try {
        const x = bisectorParts(lengths.AB, lengths.AC, lengths.BC);
        derived.BD = x.bd;
        derived.DC = x.dc;
      } catch {
        return { supported: true, contradiction: true, derived: {}, unit };
      }
    } else if (lengths.BD > 0) derived.DC = (lengths.BD * lengths.AC) / lengths.AB;
  }
  return { supported: Object.keys(derived).length > 0, derived, unit };
}
export function checkGeometryAnswer(problem, student) {
  const facts = geometryNumericFacts(problem);
  if (!facts.supported || facts.contradiction) return { facts, incorrect: [] };
  const incorrect = [];
  for (const m of String(student).matchAll(
    /\b(AN|AC|NC|BD|DC)\s*=\s*(\d+(?:[.,]\d+)?)(?:\s*(cm|mm|m))?(?![\d.,/*+\-])/g,
  )) {
    if (m[3] && facts.unit && m[3] !== facts.unit) continue;
    if (
      facts.derived[m[1]] !== undefined &&
      Math.abs(Number(m[2].replace(',', '.')) - facts.derived[m[1]]) > 1e-8
    )
      incorrect.push(m[0]);
  }
  return { facts, incorrect };
}
