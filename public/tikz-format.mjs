/** Shared allowlist parser. TikZ runs only in the fixed-memory browser WASM engine. */
export const ALLOWED_LIBRARIES = [
  'calc',
  'angles',
  'quotes',
  'intersections',
  'through',
  'positioning',
  '3d',
  'arrows.meta',
  'decorations.markings',
  'decorations.pathreplacing',
  'patterns',
  'shapes.geometric',
];
const COMMANDS = new Set(
  'documentclass usepackage usetikzlibrary begin end coordinate draw path fill filldraw node clip pic pgfmathsetmacro pgfmathtruncatemacro definecolor tikzset frac dfrac tfrac sqrt sin cos tan cot pi theta alpha beta gamma delta Delta angle triangle perp parallel cdot times div pm le ge neq in notin cap cup circ degree overline vec mathrm mathbf mathit text scriptsize footnotesize small normalsize large tiny displaystyle left right operatorname x y'.split(
    ' ',
  ),
);
export function stripComments(source) {
  return source.replace(/(?<!\\)%[^\r\n]*/g, '');
}
export function prepareTikz(source) {
  if (typeof source !== 'string' || !source.trim() || source.length > 18000)
    throw Error('Mã hình thiếu hoặc quá dài.');
  let clean = stripComments(source).replace(
    /\\(begin|end)\s*\{\s*tikzpicture\s*\}/g,
    '\\$1{tikzpicture}',
  );
  if (
    clean.includes('^^') ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(clean) ||
    /\.\s*(?:code|initial|estore|store|expanded)|execute\s+at|shell|https?:|file:|javascript:|data:/i.test(
      clean,
    )
  )
    throw Error('Mã hình chứa cú pháp không được phép.');
  // Expand only finite, literal point lists. Never execute TeX loop control.
  let loopCount = 0;
  while (clean.includes('\\foreach')) {
    if (++loopCount > 6) throw Error('Quá nhiều vòng lặp điểm.');
    const m = /\\foreach\s+\\([a-zA-Z]{1,10})\s+in\s*\{([A-Za-z0-9,\s]+)\}\s*\{/.exec(clean);
    if (!m)
      throw Error('foreach chỉ hỗ trợ danh sách điểm hữu hạn, không hỗ trợ khoảng hoặc biểu thức.');
    const names = m[2].split(',').map((x) => x.trim());
    if (names.length > 60 || names.some((x) => !/^([A-Z][0-9]{0,2}|[0-9]{1,2})$/.test(x)))
      throw Error('Danh sách vòng lặp không hợp lệ.');
    let end = m.index + m[0].length,
      depth = 1;
    for (; end < clean.length && depth; end++) {
      if (clean[end - 1] === '\\') continue;
      if (clean[end] === '{') depth++;
      if (clean[end] === '}') depth--;
    }
    if (depth) throw Error('Vòng lặp thiếu ngoặc đóng.');
    const body = clean.slice(m.index + m[0].length, end - 1);
    if (body.includes('\\foreach')) throw Error('Không hỗ trợ vòng lặp lồng nhau.');
    const expanded = names
      .map((n) => body.replace(new RegExp('\\\\' + m[1] + '(?![a-zA-Z])', 'g'), n))
      .join('\n');
    clean = clean.slice(0, m.index) + expanded + clean.slice(end);
    if (clean.length > 36000) throw Error('Hình sau mở rộng vượt giới hạn.');
  }
  const variables = new Set(
    [...clean.matchAll(/\\pgfmath(?:setmacro|truncatemacro)\s*\{\\([a-zA-Z]+)\}/g)].map(
      (m) => m[1],
    ),
  );
  // Never let a declaration whitelist an existing TeX primitive before it is redefined.
  // Single-letter scalar names support calculations without widening the command allowlist.
  if ([...variables].some((name) => !/^[a-zA-Z]$/.test(name)))
    throw Error('Biến pgfmath chỉ dùng tên một chữ cái, ví dụ \\R hoặc \\h.');
  for (const m of clean.matchAll(/\\([a-zA-Z]+|[^a-zA-Z])/g))
    if (!COMMANDS.has(m[1]) && !variables.has(m[1]) && !/^[{}%_$,;! :|]$/.test(m[1]))
      throw Error(
        'Lệnh không hỗ trợ: \\' +
          m[1] +
          '. Dùng tọa độ hoặc pgfmathsetmacro bên trong tikzpicture.',
      );
  if ((clean.match(/\\(?:draw|path|node|coordinate|fill|filldraw|pic)\b/g) || []).length > 800)
    throw Error('Hình vượt giới hạn đối tượng.');
  for (const m of clean.matchAll(/samples\s*=\s*([^,\]]+)/g))
    if (!/^\d+$/.test(m[1]) || Number(m[1]) > 200)
      throw Error('Đồ thị chỉ cho phép samples <= 200.');
  let depth = 0;
  for (let i = 0; i < clean.length; i++) {
    if (clean[i - 1] === '\\') continue;
    if (clean[i] === '{') depth++;
    if (clean[i] === '}') depth--;
    if (depth < 0 || depth > 60) throw Error('Ngoặc mã hình không hợp lệ.');
  }
  if (depth !== 0) throw Error('Mã hình thiếu ngoặc đóng.');
  for (const m of clean.matchAll(/\\(?:begin|end)\s*\{([^}]+)\}/g))
    if (!['document', 'tikzpicture', 'scope'].includes(m[1]))
      throw Error('Môi trường không được hỗ trợ: ' + m[1]);
  for (const m of clean.matchAll(/\\usepackage(?:\[[^\]]*\])?\s*\{([^}]+)\}/g))
    if (m[1].trim() !== 'tikz') throw Error('Chỉ hỗ trợ gói tikz; dùng TikZ plot cho đồ thị.');
  for (const m of clean.matchAll(/\\documentclass(?:\[[^\]]*\])?\s*\{([^}]+)\}/g))
    if (m[1].trim() !== 'standalone') throw Error('Chỉ hỗ trợ lớp standalone.');
  const bodies = [...clean.matchAll(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g)];
  if (bodies.length !== 1) throw Error('Cần đúng một môi trường tikzpicture hoàn chỉnh.');
  const body = bodies[0][0];
  const libraries = [...clean.matchAll(/\\usetikzlibrary\s*\{([^}]+)\}/g)].flatMap((m) =>
    m[1].split(',').map((s) => s.trim()),
  );
  if (libraries.some((s) => !ALLOWED_LIBRARIES.includes(s)))
    throw Error('Thư viện TikZ ngoài danh sách được hỗ trợ.');
  const before = clean
    .slice(0, bodies[0].index)
    .replace(
      /\\documentclass(?:\[[^\]]*\])?\s*\{[^}]+\}|\\usepackage(?:\[[^\]]*\])?\s*\{[^}]+\}|\\usetikzlibrary\s*\{[^}]+\}|\\begin\{document\}/g,
      '',
    )
    .trim();
  const after = clean
    .slice(bodies[0].index + body.length)
    .replace(/\\end\{document\}/g, '')
    .trim();
  if (before || after) throw Error('Đặt khai báo tọa độ, màu và kiểu nét bên trong tikzpicture.');
  return {
    body,
    libraries: [...new Set([...ALLOWED_LIBRARIES.slice(0, 8), ...libraries])].join(','),
  };
}
export function parseDiagramValue(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Phản hồi hình không phải đối tượng JSON.');
  if (typeof value.question === 'string' && value.question.trim() && !value.latex)
    return { latex: '', question: value.question.trim().slice(0, 500) };
  prepareTikz(value.latex);
  return { latex: value.latex, question: '' };
}
export function parseDiagramText(text) {
  if (typeof text !== 'string') throw Error('Thiếu phản hồi hình.');
  let value;
  try {
    value = JSON.parse(text.trim().replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch {
    throw Error('Phản hồi hình chưa đúng định dạng JSON.');
  }
  return parseDiagramValue(value);
}
