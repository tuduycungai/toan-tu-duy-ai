export type MathPart = { type: 'text' | 'inline' | 'display'; value: string };

export function mathParts(text: string): MathPart[] {
  const parts: MathPart[] = [];
  const pattern =
    /\$\$([\s\S]+?)\$\$|(?<!\\)\$([^$\n]+?)(?<!\\)\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    const i = m.index!;
    if (i > last) parts.push({ type: 'text', value: text.slice(last, i) });
    parts.push({ type: m[1] || m[3] ? 'display' : 'inline', value: m[1] ?? m[2] ?? m[3] ?? m[4] });
    last = i + m[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}
export function safeMathSource(tex: string) {
  return (
    tex.length <= 2400 &&
    !/\\(?:href|url|includegraphics|html\w*|def|gdef|edef|xdef|let|newcommand|renewcommand|input|include|write|openout|catcode)\b/i.test(
      tex,
    )
  );
}

export function mathFallback(tex: string) {
  let text = tex;
  for (let i = 0; i < 5; i++)
    text = text.replace(
      /\\(?:dfrac|tfrac|frac)\{([^{}]*)\}\{([^{}]*)\}/g,
      (_m, a, b) => `(${a})/(${b})`,
    );
  const symbols: Record<string, string> = {
    perp: '⟂',
    parallel: '∥',
    angle: '∠',
    triangle: '△',
    Rightarrow: '⇒',
    Leftrightarrow: '⇔',
    rightarrow: '→',
    cap: '∩',
    in: '∈',
    neq: '≠',
    leq: '≤',
    geq: '≥',
    cdot: '·',
    times: '×',
    circ: '°',
  };
  return text
    .replace(
      /\\(perp|parallel|angle|triangle|Rightarrow|Leftrightarrow|rightarrow|cap|in|neq|leq|geq|cdot|times|circ)\b/g,
      (_m, c) => symbols[c],
    )
    .replace(/\^\{?2\}?/g, '²')
    .replace(/\^\{?3\}?/g, '³');
}
