import { parseDiagramValue } from '../public/tikz-format.mjs';
import {
  renderScene,
  type GeometryScene,
  type SceneValidation,
} from '../public/geometry-scene.mjs';
export type DiagramResult = {
  latex: string;
  question: string;
  svg?: string;
  scene?: GeometryScene;
  validation?: SceneValidation;
  renderer?: string;
};
export function resolveSceneDiagram(data: {
  scene?: GeometryScene;
  validation?: SceneValidation;
}): DiagramResult | null {
  if (!data.scene) return null;
  const rendered = renderScene(data.scene);
  return { ...rendered, question: '', validation: data.validation || rendered.validation };
}
export class DiagramRequestError extends Error {
  constructor(
    message: string,
    public repairable = false,
    public detail = '',
  ) {
    super(message);
  }
}
export async function requestDiagram(
  problem: string,
  accessCode: string,
  signal: AbortSignal,
  previous = '',
  failure = '',
  fetcher: typeof fetch = fetch,
): Promise<DiagramResult> {
  const c = new AbortController();
  const cancel = () => c.abort();
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) c.abort();
  const timeout = setTimeout(() => c.abort(new Error('timeout')), 65000);
  try {
    const content =
      problem +
      (failure
        ? '\nYêu cầu sửa hình: ' +
          failure.slice(0, 1500) +
          (previous ? '\nMã cần sửa:\n' + previous : '')
        : '');
    const send = (format: string) =>
      fetcher('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: c.signal,
        body: JSON.stringify({
          accessCode,
          mode: 'diagram',
          diagramFormat: format,
          problem,
          previous: previous.slice(0, 18000),
          failure: failure.slice(0, 1500),
          messages: [
            {
              role: 'user',
              content: (format === 'geometry-v1' ? problem : content).slice(0, 26000),
            },
          ],
        }),
      });
    let response = await send('geometry-v1');
    let fallback = false;
    // Unsupported operations may use the existing broad TikZ renderer. An invalid
    // construction is repaired, never silently converted to an unchecked image.
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const candidate = await response
        .clone()
        .json()
        .catch(() => {
          throw new DiagramRequestError(
            'AI trả dữ liệu hình chưa hoàn chỉnh.',
            true,
            'Phản hồi JSON bị thiếu hoặc hỏng.',
          );
        });
      if (candidate?.fallback === true) {
        fallback = true;
        response = await send('tikz');
      }
    }
    if (
      [502, 503, 504].includes(response.status) &&
      !response.headers.get('content-type')?.includes('application/json')
    )
      throw new DiagramRequestError(
        'Máy chủ vẽ hình đang bận hoặc hết thời gian. Đề bài được giữ lại; em thử lại nhé.',
      );
    if (!response.headers.get('content-type')?.includes('application/json'))
      throw new DiagramRequestError(
        'Dịch vụ hình chưa được triển khai đúng. Giáo viên cần cập nhật cả Netlify Functions.',
      );
    const data = await response.json().catch(() => {
      throw new DiagramRequestError(
        'Dữ liệu hình chưa hoàn chỉnh.',
        response.ok,
        'Phản hồi JSON bị thiếu hoặc hỏng.',
      );
    });
    if (!response.ok)
      throw new DiagramRequestError(
        data.error || 'Chưa dựng được hình. Em thử lại nhé.',
        data.repairable === true,
        typeof data.detail === 'string' ? data.detail : '',
      );
    try {
      const sceneResult = resolveSceneDiagram(data);
      if (sceneResult) return sceneResult;
      const legacy = parseDiagramValue(data);
      return fallback
        ? {
            ...legacy,
            renderer: 'tikz',
            validation: {
              checked: [],
              unverified: ['Cần đối chiếu hình mở rộng với các giả thiết.'],
              notice:
                'Hình được dựng bằng công cụ mở rộng. Các quan hệ chưa được bộ dựng số kiểm tra.',
            },
          }
        : legacy;
    } catch (e) {
      throw new DiagramRequestError('AI chưa trả mã hình hợp lệ.', true, (e as Error).message);
    }
  } catch (e) {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (c.signal.aborted)
      throw new DiagramRequestError('Dịch vụ vẽ phản hồi quá lâu. Em thử lại nhé.');
    throw e;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
  }
}
