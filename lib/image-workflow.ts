import type { GeometryScene } from '../public/geometry-scene.mjs';
export type ImageReading = {
  transcription: string;
  figureLabels: string[];
  givens: string[];
  goals: string[];
  construction: string;
  points: string[];
  objects: { name: string; type: string; points: string[]; definition: string; source: string }[];
  relations: {
    kind: string;
    items: string[];
    value: number;
    description: string;
    source: string;
  }[];
  auxiliary: string[];
  highlights: string[];
  uncertainties: { text: string; question: string; critical: boolean }[];
  confidence: number;
  theory: { name: string; conditions: string }[];
  clarification: string;
  ready: boolean;
  structureStatus?: 'validated' | 'needs_repair';
  structureIssue?: string;
};
export type ImageResponse = { reading: ImageReading; imageToken: string; confirmed: boolean };
export type DiagramResponse = {
  latex: string;
  repairToken: string;
  scene?: GeometryScene;
  fallback?: boolean;
  question?: string;
  reason?: string;
  validation: { checked: string[]; unverified: string[]; notice: string };
};
export class ImageAPIError extends Error {
  constructor(
    message: string,
    public detail = '',
    public repairable = false,
    public repairToken = '',
    public latex = '',
  ) {
    super(message);
  }
}
export async function imageRequest<T>(
  body: Record<string, unknown>,
  accessCode: string,
  signal: AbortSignal,
): Promise<T> {
  const controller = new AbortController(),
    cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) cancel();
  const timer = setTimeout(cancel, 65000);
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, accessCode }),
      signal: controller.signal,
    });
    if (!r.headers.get('content-type')?.includes('application/json'))
      throw Error('Cần triển khai cả Netlify Functions để đọc ảnh.');
    const d = await r.json();
    if (!r.ok)
      throw new ImageAPIError(
        d.error || 'Chưa xử lý được ảnh.',
        d.detail || '',
        d.repairable === true,
        d.repairToken || '',
        d.latex || '',
      );
    return d as T;
  } catch (e) {
    if (controller.signal.aborted)
      throw new DOMException(
        signal.aborted
          ? 'Đã dừng. Dữ kiện được giữ lại.'
          : 'Kết nối quá thời gian. Em thử lại nhé.',
        'AbortError',
      );
    throw e;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
  }
}
