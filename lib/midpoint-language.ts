import type { Segment } from './geometry';

export type MidpointDescription = { point: string; segment: Segment };

export function readMidpointDescriptions(text: string): {
  text: string;
  items: MidpointDescription[];
} {
  const items: MidpointDescription[] = [];

  const start = String.raw`(?<![\p{L}\p{N}'′])`;
  const end = String.raw`(?![\p{L}\p{N}'′])`;
  const point = String.raw`[A-Z]${end}`;
  const segment = String.raw`[A-Z]{2}${end}`;
  const separator = String.raw`(?:\s*[,;]\s*(?:và\s+)?|\s+và\s+)`;
  const noun = String.raw`(?:cạnh|đoạn(?:\s+thẳng)?|đường\s+chéo)`;
  const description = String.raw`(?:của\s+)?(?:(?:(?:các|hai|ba|bốn)\s+)?${noun}\s+)?`;
  const pointPrefix = String.raw`(?:(?:(?:các|hai|ba|bốn)\s+)?điểm\s+)?`;
  const pointList = String.raw`${point}(?:${separator}${pointPrefix}${point}){0,7}`;
  const segmentList = String.raw`${segment}(?:${separator}(?:${noun}\s+)?${segment}){0,7}`;
  const relation = String.raw`(?:(?:lần\s+lượt|tương\s+ứng|theo\s+thứ\s+tự)\s+)?(?:là\s+)?(?:(?:lần\s+lượt|theo\s+thứ\s+tự)\s+)?(?:(?:các|hai|ba|bốn)\s+)?trung\s+điểm`;
  function record(namesText: string, segmentsText: string, clause: string) {
    const names = [...namesText.matchAll(new RegExp(start + point, 'giu'))].map((m) =>
      m[0].toUpperCase(),
    );
    const segments = [...segmentsText.matchAll(new RegExp(start + segment, 'giu'))].map((m) =>
      m[0].toUpperCase(),
    );
    if (!names.length || !segments.length || new Set(names).size !== names.length)
      throw Error('Cần xác định rõ tên các trung điểm.');
    if (
      names.length === 1 &&
      segments.length > 1 &&
      !/(?:lần\s+lượt|tương\s+ứng|theo\s+thứ\s+tự)/iu.test(clause)
    ) {
      for (const s of segments) items.push({ point: names[0], segment: [s[0], s[1]] });
      return;
    }
    if (names.length !== segments.length)
      throw Error('Số trung điểm và số đoạn thẳng chưa khớp; em hãy kiểm tra lại từng cặp.');
    names.forEach((n, i) => items.push({ point: n, segment: [segments[i][0], segments[i][1]] }));
  }

  const forward = new RegExp(
    String.raw`${start}${pointPrefix}(${pointList})\s+${relation}\s+${description}(${segmentList})`,
    'giu',
  );
  text = text.replace(forward, (clause, names, segments) => {
    record(names, segments, clause);
    return ' ';
  });

  const reverse = new RegExp(
    String.raw`${start}(?:các\s+)?trung\s+điểm\s+${description}(${segmentList})\s+(?:(?:lần\s+lượt|tương\s+ứng|theo\s+thứ\s+tự)\s+)?là\s+${pointPrefix}(${pointList})`,
    'giu',
  );
  text = text.replace(reverse, (clause, segments, names) => {
    record(names, segments, clause);
    return ' ';
  });

  const have = new RegExp(
    String.raw`${start}(?:${noun}\s+)?(${segmentList})\s+(?:(?:lần\s+lượt|tương\s+ứng|theo\s+thứ\s+tự)\s+)?có\s+(?:các\s+)?trung\s+điểm\s+(?:(?:lần\s+lượt|theo\s+thứ\s+tự)\s+)?(?:là\s+)?${pointPrefix}(${pointList})`,
    'giu',
  );
  text = text.replace(have, (clause, segments, names) => {
    record(names, segments, clause);
    return ' ';
  });
  return { text, items };
}
