import {
  normalizeProblem,
  parseProblem,
  problemParts,
  resolveProblemDiagram,
  verifyConstraints,
} from './problem-diagram';
import { validateShape, type DiagramResult } from './geometry';
/** An ID ties normalization to one original problem; it is not an authentication token. */
export function diagramId(problem: string) {
  let h = 2166136261;
  for (const c of normalizeProblem(problem)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return 'g' + (h >>> 0).toString(16).padStart(8, '0');
}
export function diagramBlock(raw: string): string {
  return raw.match(/\[DE_HINH_HOC\]([\s\S]{1,12000}?)\[\/DE_HINH_HOC\]/)?.[0] || '';
}
export function diagramPrompt(problem: string): string {
  if (!problem) return '';
  const result = resolveProblemDiagram(problem),
    parts = problemParts(problem);
  if (
    result.status === 'ready' ||
    result.status === 'invalid' ||
    parts.extraConditions ||
    parts.given.length > 2200 ||
    !/(?:hình|tứ giác|tam giác)/iu.test(parts.given)
  )
    return '';
  return (
    '\n[CHUAN_HOA_HINH]\nID: ' +
    diagramId(problem) +
    '\nGIẢ THIẾT GỐC: ' +
    normalizeProblem(parts.given) +
    '\n[/CHUAN_HOA_HINH]'
  );
}
const connectorOnly = (s: string) =>
  s
    .replace(/(?<![\p{L}\p{N}])(?:cho|gọi|có|và|sao cho|lấy|kẻ|biết|điểm)(?![\p{L}\p{N}])/giu, '')
    .replace(/[\s.,;:()]+/g, '') === '';
const numbers = (s: string) =>
  [...s.matchAll(/\d+(?:[.,]\d+)?/g)]
    .map((m) => Number(m[0].replace(',', '.')))
    .sort((a, b) => a - b)
    .join('|');
const geometryNames = (s: string) =>
  new Set(
    [...s.matchAll(/(?<![\p{L}\p{N}'′])[A-Z]{1,4}(?![\p{L}\p{N}'′])/gu)]
      .filter((m) => !['CHO', 'SAO', 'TA', 'CO', 'VA', 'AI'].includes(m[0]))
      .flatMap((m) => m[0].split('')),
  );
/** AI can normalize language; it cannot supply unchecked coordinates or change the original known facts. */
export function resolveTutorDiagram(problem: string, reply = ''): DiagramResult {
  const original = resolveProblemDiagram(problem);
  if (original.status === 'ready' || !reply) return original;
  const block = diagramBlock(reply);
  if (!block || !diagramPrompt(problem)) return original;
  try {
    const data = JSON.parse(block.slice('[DE_HINH_HOC]'.length, -'[/DE_HINH_HOC]'.length).trim());
    if (
      data.v !== 1 ||
      data.id !== diagramId(problem) ||
      !Array.isArray(data.facts) ||
      !data.facts.length ||
      data.facts.length > 20
    )
      return original;
    const parts = problemParts(problem),
      given = normalizeProblem(parts.given);
    let remaining = given;
    const normalized: string[] = [];
    for (const f of data.facts) {
      if (
        !f ||
        Object.keys(f).some((k) => !['quote', 'text'].includes(k)) ||
        typeof f.quote !== 'string' ||
        typeof f.text !== 'string' ||
        !f.quote.trim() ||
        !f.text.trim() ||
        f.text.length > 800
      )
        return original;
      const quote = normalizeProblem(f.quote),
        text = normalizeProblem(f.text);
      if (
        !given.includes(quote) ||
        !remaining.includes(quote) ||
        /[<>\[\]{}]|chứng minh|cmr|nếu|giả sử/iu.test(text)
      )
        return original;
      // All numeric data must survive normalization unchanged; no invented lengths/ratios.
      if (numbers(quote) !== numbers(text)) return original;
      // Preserve limiting language even when a model proposes a fluent paraphrase.
      for (const marker of [
        /không/iu,
        /ngoài/iu,
        /tia/iu,
        /kéo dài/iu,
        /phân giác/iu,
        /đường tròn/iu,
        /(?:°|độ)/iu,
        /(?:vuông góc|⟂)/iu,
        /(?:song song|∥)/iu,
        /trung điểm/iu,
      ])
        if (marker.test(quote) && !marker.test(text)) return original;
      // A normalized clause cannot silently specialize a free point or add a right angle.
      for (const [out, source] of [
        [/trung điểm/iu, /trung điểm|chính giữa|chia.{0,50}(?:bằng nhau|đều)/iu],
        [
          /(?:vuông góc|⟂)/iu,
          /vuông góc|⟂|góc vuông|đường cao|hình chiếu|chân.{0,20}(?:cao|vuông góc)/iu,
        ],
        [/(?:song song|∥)/iu, /song song|∥|cùng phương/iu],
        [/đối xứng/iu, /đối xứng|phản chiếu/iu],
      ] as [RegExp, RegExp][])
        if (out.test(text) && !source.test(quote)) return original;
      const names = geometryNames(quote),
        newNames = geometryNames(text);
      if ([...newNames].some((n) => !names.has(n))) return original;
      remaining = remaining.replace(quote, ' ');
      normalized.push(text);
    }
    if (!connectorOnly(remaining)) return original;
    const canonical = normalized.join('. '),
      candidate = resolveProblemDiagram(canonical);
    if (candidate.status !== 'ready') return original;
    // Recheck every relation and the base shape that the deterministic reader could already identify.
    const known = parseProblem(problem);
    if (known) {
      const kinds = {
        rectangle: /hình chữ nhật/iu,
        rhombus: /hình thoi/iu,
        square: /hình vuông/iu,
        parallelogram: /hình bình hành/iu,
        'isosceles-trapezoid': /hình thang cân/iu,
      };
      const proposed = parseProblem(canonical);
      if (proposed && proposed.recipe.kind !== known.recipe.kind) {
        const evidence = kinds[proposed.recipe.kind as keyof typeof kinds];
        if (!evidence || !evidence.test(given)) return original;
      }
      validateShape(
        known.recipe.kind,
        known.recipe.vertices.map((n) => {
          const p = candidate.drawing.points[n];
          if (!p) throw Error('Mất điểm đã cho.');
          return p;
        }),
      );
      verifyConstraints(candidate.drawing, known.constraints);
    }
    // Goals may name useful segments, but are never passed into the constraint solver as givens.
    const goalStart = parts.full.search(/chứng minh|cmr|tính/iu);
    const goalPart = goalStart < 0 ? '' : parts.full.slice(goalStart);
    for (const m of goalPart.matchAll(/(?<![A-Z])[A-Z]{2}(?![A-Z])/g)) {
      const s: [string, string] = [m[0][0], m[0][1]];
      if (
        s.every((n) => candidate.drawing.points[n]) &&
        !candidate.drawing.segments.some((x) => x.includes(s[0]) && x.includes(s[1]))
      )
        candidate.drawing.segments.push(s);
    }
    return { status: 'ready', drawing: { ...candidate.drawing, interpretation: 'ai' } };
  } catch {
    return original;
  }
}
