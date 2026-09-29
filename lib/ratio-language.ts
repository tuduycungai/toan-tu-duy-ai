import type { Segment } from './geometry';
export type Ratio = { type: 'ratio'; a: Segment; b: Segment; factor: number };
const N = String.raw`(?:\d+(?:[.,]\d+)?)`;
const segment = (s: string) => s.toUpperCase().split('') as Segment;
export function readRatios(text: string) {
  const ratios: Ratio[] = [];
  const num = (v: string | undefined) => (v ? Number(v.replace(',', '.')) : 1);
  const save = (a: string, b: string, factor: number) => {
    if (!(factor > 0 && factor <= 10000 && Number.isFinite(factor)))
      throw Error('Tỉ lệ đoạn thẳng phải hữu hạn và dương.');
    ratios.push({ type: 'ratio', a: segment(a), b: segment(b), factor });
    return ' ';
  };
  const edge = String.raw`([A-Z]{2})(?![\p{L}\p{N}'′])`,
    start = String.raw`(?<![\p{L}\p{N}'′./])`;
  text = text.replace(
    new RegExp(`${start}${edge}\\s*[:/]\\s*${edge}\\s*=\\s*(${N})\\s*[:/]\\s*(${N})`, 'giu'),
    (_m, a, b, n, d) => save(a, b, num(n) / num(d)),
  );
  text = text.replace(
    new RegExp(`${start}${edge}\\s*=\\s*${edge}\\s*/\\s*(${N})(?![\\p{L}\\p{N}])`, 'giu'),
    (_m, a, b, d) => save(a, b, 1 / num(d)),
  );
  text = text.replace(
    new RegExp(`${start}${edge}\\s*=\\s*\\(?(${N})\\s*/\\s*(${N})\\)?\\s*[*×·]?\\s*${edge}`, 'giu'),
    (_m, a, n, d, b) => save(a, b, num(n) / num(d)),
  );

  text = text.replace(
    new RegExp(
      `${start}(?:(${N})\\s*[*×·]?\\s*)?${edge}\\s*=\\s*(?:(${N})\\s*[*×·]?\\s*)?${edge}`,
      'giu',
    ),
    (m, n, a, d, b) => (b === 'cm' || a === 'cm' ? m : n || d ? save(a, b, num(d) / num(n)) : m),
  );
  return { text, ratios };
}
