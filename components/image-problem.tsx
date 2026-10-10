import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { prepareImage, releaseImage, type PreparedImage } from '../lib/image-input';
import {
  imageRequest,
  ImageAPIError,
  type ImageReading,
  type ImageResponse,
  type DiagramResponse,
} from '../lib/image-workflow';
import { compileTikz } from '../lib/tikz-compiler';
import { resolveSceneDiagram } from '../lib/diagram-request';
import { downloadBlob, exportPNG } from '../lib/diagram-export';
import { readImageSession, saveImageSession, clearImageSession } from '../lib/image-session';
import { saveFigure } from '../lib/figure-cache';
import { useBlobURL } from '../lib/use-blob-url';
import { MathText } from './math-text';

type Props = {
  scope?: string;
  chapterId?: string;
  lessonId?: string;
  accessCode: string;
  disabled: boolean;
  onConnect: () => void;
  onReady: (problem: string) => void;
  onStateChange: (state: 'none' | 'pending' | 'accepted') => void;
};
export function ImageProblem({
  accessCode,
  disabled,
  onConnect,
  onReady,
  onStateChange,
  scope = '',
  chapterId,
  lessonId,
}: Props) {
  const [recovery, setRecovery] = useState(() => readImageSession(scope));
  const [image, setImage] = useState<PreparedImage | null>(null),
    [note, setNote] = useState(''),
    [reading, setReading] = useState<ImageReading | null>(null),
    [token, setToken] = useState('');
  const [transcript, setTranscript] = useState(''),
    [correction, setCorrection] = useState(''),
    [revising, setRevising] = useState(false),
    [accepted, setAccepted] = useState(false);
  const [svg, setSVG] = useState(''),
    [latex, setLatex] = useState(''),
    [validation, setValidation] = useState<DiagramResponse['validation'] | null>(null),
    [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState(''),
    [error, setError] = useState(''),
    [zoom, setZoom] = useState(false),
    [drag, setDrag] = useState(false);
  const library = useRef<HTMLInputElement>(null),
    camera = useRef<HTMLInputElement>(null),
    controller = useRef<AbortController | null>(null),
    lock = useRef(false),
    generation = useRef(0);
  const imageResource = useRef<PreparedImage | null>(null);
  useEffect(() => {
    imageResource.current = image;
  }, [image]);
  useEffect(
    () => () => {
      generation.current++;
      controller.current?.abort();
      releaseImage(imageResource.current);
    },
    [],
  );
  useEffect(() => {
    const pause = () => {
      if (document.hidden && controller.current) {
        controller.current.abort();
        setError('Đã tạm dừng khi rời trang để giảm tải. Em có thể tiếp tục với đề đã giữ.');
      }
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  useEffect(() => {
    if (recovery) onStateChange('pending');
  }, []);
  useEffect(() => {
    if (accepted) {
      clearImageSession(scope);
      return;
    }
    if (!reading || !token) return;
    const save = () => saveImageSession({ transcription: transcript, imageToken: token }, scope);
    const timer = setTimeout(save, 400);
    addEventListener('pagehide', save);
    return () => {
      clearTimeout(timer);
      removeEventListener('pagehide', save);
    };
  }, [reading, token, transcript, accepted]);
  const svgURL = useBlobURL(svg);
  const pending = () => {
    setAccepted(false);
    onStateChange('pending');
  };
  function remove() {
    clearImageSession(scope);
    setRecovery(null);
    releaseImage(imageResource.current);
    imageResource.current = null;
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    lock.current = false;
    setBusy(false);
    setImage(null);
    setNote('');
    setReading(null);
    setToken('');
    setSVG('');
    setLatex('');
    setConfirmed(false);
    setAccepted(false);
    setRevising(false);
    setCorrection('');
    setStatus('');
    setError('');
    onStateChange('none');
  }
  async function select(file?: File) {
    if (!file || disabled || lock.current) return;
    remove();
    const id = generation.current;
    lock.current = true;
    setBusy(true);
    setStatus('Đang chuẩn bị ảnh…');
    onStateChange('pending');
    try {
      const value = await prepareImage(file);
      if (id === generation.current) {
        imageResource.current = value;
        setImage(value);
      } else releaseImage(value);
    } catch (e) {
      if (id === generation.current) {
        setError((e as Error).message);
        onStateChange('none');
      }
    } finally {
      if (id === generation.current) {
        lock.current = false;
        setBusy(false);
        setStatus('');
      }
    }
  }
  async function job(task: (signal: AbortSignal) => Promise<void>) {
    if (disabled || lock.current) return;
    if (!accessCode) {
      onConnect();
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    const c = new AbortController();
    controller.current = c;
    try {
      await task(c.signal);
    } catch (e) {
      if (!c.signal.aborted) setError((e as Error).message);
    } finally {
      if (controller.current === c) {
        lock.current = false;
        setBusy(false);
        setStatus('');
        controller.current = null;
      }
    }
  }
  function applyReading(d: ImageResponse, preserveDrawing = false) {
    setRecovery(null);
    saveImageSession({ transcription: d.reading.transcription, imageToken: d.imageToken }, scope);
    setImage((current) => (current ? { ...current, data: '' } : null));
    setReading(d.reading);
    setTranscript(d.reading.transcription);
    setToken(d.imageToken);
    setConfirmed(d.confirmed);
    setCorrection('');
    if (!preserveDrawing) {
      setSVG('');
      setLatex('');
      setValidation(null);
    }
    pending();
  }
  const geometry = !chapterId || ['c3', 'c4'].includes(chapterId);
  const scopedRequest = <T,>(body: Record<string, unknown>, code: string, signal: AbortSignal) =>
    imageRequest<T>({ ...body, chapterId, lessonId }, code, signal);
  const read = () =>
    void job(async (signal) => {
      if (!image) return;
      setStatus('AI đang đọc đề và kiểm tra ký hiệu…');
      const d = await scopedRequest<ImageResponse>(
        { mode: 'image-read', image: { data: image.data, mimeType: image.mimeType }, note },
        accessCode,
        signal,
      );
      if (!signal.aborted) applyReading(d);
    });
  async function draw(imageToken: string, signal: AbortSignal, problemText = transcript) {
    let repairToken = imageToken,
      previous = '',
      failure = '';
    let format = 'geometry-v1';
    pending();
    for (let attempt = 0; attempt < 3; attempt++) {
      setStatus(attempt ? `Đang sửa hình (${attempt}/2)…` : 'Đang sinh và kiểm tra mã hình…');
      let received: DiagramResponse | undefined;
      try {
        received = await scopedRequest<DiagramResponse>(
          {
            mode: 'image-diagram',
            diagramFormat: format,
            imageToken: repairToken,
            previous,
            failure,
          },
          accessCode,
          signal,
        );
        if (signal.aborted) return;
        repairToken = received.repairToken;
        if (received.question) {
          setError(received.question);
          return;
        }
        if (received.fallback) {
          if (attempt === 2)
            throw new ImageAPIError(
              'Dạng hình này cần công cụ mở rộng. Em chọn Thử dựng lại để tiếp tục.',
            );
          format = 'tikz';
          failure = received.reason || 'Phép dựng cần công cụ mở rộng.';
          continue;
        }
        const direct = resolveSceneDiagram(received);
        previous = direct?.latex || received.latex;
        setStatus('Đang vẽ hình…');
        const output = direct?.svg || (await compileTikz(previous, signal));
        if (signal.aborted) return;
        saveFigure(problemText, {
          latex: previous,
          svg: output,
          scene: direct?.scene,
          validation: received.validation,
        });
        setLatex(previous);
        setSVG(output);
        setValidation(received.validation);
        return;
      } catch (e) {
        if (signal.aborted || (e as Error).name === 'AbortError') throw e;
        if (e instanceof ImageAPIError) {
          if (!e.repairable || attempt === 2) throw e;
          repairToken = e.repairToken;
          previous = e.latex;
          failure = e.detail || e.message;
        } else if (received && attempt < 2) failure = (e as Error).message.slice(0, 900);
        else
          throw Error(
            'Chưa dựng được hình sau tối đa hai lần sửa. Đề đã đọc vẫn được giữ; em có thể sửa dữ kiện hoặc thử dựng lại.',
          );
      }
    }
  }
  const confirm = () =>
    void job(async (signal) => {
      setStatus('Đang đối chiếu đề em xác nhận…');
      const d = await scopedRequest<ImageResponse>(
        {
          mode: revising ? 'image-revise' : 'image-confirm',
          imageToken: token,
          transcription: transcript,
          correction,
        },
        accessCode,
        signal,
      );
      if (signal.aborted) return;
      applyReading(d, d.reading.transcription === reading?.transcription);
      setRevising(false);
      if (d.confirmed) {
        if (geometry) await draw(d.imageToken, signal, d.reading.transcription);
        else {
          setAccepted(true);
          onStateChange('accepted');
          onReady(d.reading.transcription);
        }
      } else
        setError(
          d.reading.structureStatus === 'needs_repair'
            ? 'Chưa kiểm tra được cấu trúc hình. Đề vẫn được giữ; em có thể thử xác nhận lại.'
            : 'Đã cập nhật bản đọc. Em kiểm tra lại rồi nhấn Xác nhận và vẽ hình.',
        );
    });
  async function download(kind: 'png' | 'svg') {
    try {
      downloadBlob(
        kind === 'svg' ? new Blob([svg], { type: 'image/svg+xml' }) : await exportPNG(svg),
        'de-toan-v6.4.' + kind,
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section
      className={`image-problem ${drag ? 'drag-active' : ''}`}
      aria-label="Gửi ảnh đề toán"
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy && !disabled) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        void select(e.dataTransfer.files[0]);
      }}
    >
      <div className="image-input-tools">
        <strong>Gửi ảnh đề toán</strong>
        <button type="button" disabled={busy || disabled} onClick={() => library.current?.click()}>
          <ImagePlus size={17} />
          Chọn ảnh
        </button>
        <button type="button" disabled={busy || disabled} onClick={() => camera.current?.click()}>
          <Camera size={17} />
          Chụp ảnh
        </button>
      </div>
      <input
        ref={library}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        aria-label="Chọn ảnh đề toán"
        onChange={(e) => {
          void select(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="Chụp ảnh đề toán"
        onChange={(e) => {
          void select(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {recovery && !reading && (
        <div className="image-recovery">
          <p>Đề từ ảnh đã được giữ sau lần tải lại trang.</p>
          <p>
            <MathText text={recovery.transcription} />
          </p>
          <button
            type="button"
            disabled={busy || disabled}
            onClick={() =>
              void job(async (signal) => {
                const d = await scopedRequest<ImageResponse>(
                  { mode: 'image-restore', imageToken: recovery.imageToken },
                  accessCode,
                  signal,
                );
                if (!signal.aborted) {
                  applyReading(d);
                  setTranscript(recovery.transcription);
                  if (recovery.transcription !== d.reading.transcription) setConfirmed(false);
                }
              })
            }
          >
            Khôi phục đề đã đọc
          </button>
          <button type="button" onClick={remove}>
            Bỏ đề đã lưu
          </button>
        </div>
      )}
      {!recovery && !image && !reading && (
        <p className="caption">
          PNG, JPG/JPEG, WebP · tối đa 24 MB. Có thể kéo ảnh vào đây. Chụp rõ toàn bộ đề và ký hiệu;
          tránh kèm thông tin cá nhân.
        </p>
      )}
      {image && (
        <div className="image-preview">
          <img src={image.preview} alt="Ảnh đề đã chọn" />
          <div>
            <span>{image.name}</span>
            <small>
              {image.width} × {image.height}
              {image.compressed ? ' · đã tối ưu dung lượng' : ''}
            </small>
            <button type="button" onClick={remove} disabled={disabled}>
              <X size={15} />
              Xóa ảnh / chọn lại
            </button>
          </div>
        </div>
      )}
      {image && !reading && (
        <>
          <label>
            Câu hỏi bổ sung (không bắt buộc)
            <textarea
              value={note}
              maxLength={1200}
              rows={2}
              disabled={busy}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button type="button" className="primary" onClick={read} disabled={busy || disabled}>
            Đọc đề từ ảnh
          </button>
        </>
      )}
      {reading && (
        <div className="image-reading">
          <h3>1. Đề bài AI đã đọc</h3>
          <label>
            Kiểm tra và sửa bản phiên âm
            <textarea
              aria-label="Bản phiên âm đề"
              value={transcript}
              maxLength={6000}
              rows={5}
              disabled={busy || disabled}
              onChange={(e) => {
                setTranscript(e.target.value);
                setConfirmed(false);
                setSVG('');
                pending();
              }}
            />
          </label>
          {reading.structureStatus === 'needs_repair' && (
            <p className="image-structure-note" role="status">
              Đề đã được đọc. Em kiểm tra bản phiên âm rồi nhấn xác nhận để hệ thống kiểm tra lại
              các quan hệ hình học.
            </p>
          )}
          {(reading.uncertainties.length > 0 ||
            (!reading.ready && reading.structureStatus !== 'needs_repair')) && (
            <div className="image-uncertain" role="status">
              <strong>Cần làm rõ trước khi vẽ</strong>
              {reading.uncertainties.map((u, i) => (
                <p key={i}>
                  <mark>{u.text}</mark> — {u.question}
                </p>
              ))}
              {reading.clarification && <p>{reading.clarification}</p>}
              {!reading.uncertainties.length && !reading.clarification && (
                <p>Độ rõ của ảnh chưa đủ. Em hãy xác nhận các dữ kiện hoặc chụp lại.</p>
              )}
            </div>
          )}
          <details>
            <summary>Giả thiết, kết luận và quan hệ đã đọc</summary>
            <p>
              <strong>Giả thiết:</strong> {reading.givens.join('; ')}
            </p>
            <p>
              <strong>Yêu cầu:</strong> {reading.goals.join('; ') || reading.construction}
            </p>
            {reading.relations.map((r, i) => (
              <p key={i}>
                <MathText text={r.description} />
              </p>
            ))}
          </details>
          {(!svg || revising) && (
            <>
              <label>
                {revising
                  ? 'Hình sai ở điểm, quan hệ hoặc nhãn nào?'
                  : reading.structureStatus === 'needs_repair'
                    ? 'Ghi chú khi xác nhận đề (không bắt buộc)'
                    : 'Bổ sung / xác nhận ký hiệu còn nghi ngờ'}
                <textarea
                  value={correction}
                  onChange={(e) => {
                    setCorrection(e.target.value);
                    setConfirmed(false);
                  }}
                  maxLength={1200}
                  rows={2}
                  disabled={busy || disabled}
                />
              </label>
              <button
                type="button"
                className="primary"
                disabled={
                  busy || disabled || !transcript.trim() || (revising && !correction.trim())
                }
                onClick={confirm}
              >
                {revising
                  ? geometry
                    ? 'Cập nhật dữ kiện hình'
                    : 'Cập nhật dữ kiện'
                  : geometry
                    ? 'Xác nhận và vẽ hình'
                    : 'Xác nhận đề và bắt đầu học'}
              </button>
            </>
          )}
          {confirmed && !svg && !busy && (
            <button
              type="button"
              onClick={() => void job((s) => draw(token, s))}
              disabled={disabled}
            >
              Thử dựng lại
            </button>
          )}
          {svg && (
            <>
              <h3>2. Hình minh họa</h3>
              <div className={`image-drawing ${zoom ? 'zoomed' : ''}`} tabIndex={0}>
                <img src={svgURL || undefined} alt={'Hình minh họa: ' + reading.transcription} />
              </div>
              <div className="image-input-tools">
                <button type="button" onClick={() => setZoom(!zoom)}>
                  {zoom ? 'Thu gọn' : 'Phóng to hình'}
                </button>
                <button type="button" onClick={() => void download('png')}>
                  Tải PNG
                </button>
                <button type="button" onClick={() => void download('svg')}>
                  Tải SVG
                </button>
              </div>
              {validation && (
                <p className="caption">
                  {validation.notice}
                  {validation.unverified.length > 0 &&
                    ' Cần đối chiếu: ' + validation.unverified.join('; ')}
                </p>
              )}
              <h3>3. Lý thuyết dự kiến dùng</h3>
              {reading.theory.length ? (
                reading.theory.map((t, i) => (
                  <p key={i}>
                    <strong>{t.name}</strong> — {t.conditions}
                  </p>
                ))
              ) : (
                <p>Đối chiếu giả thiết, kết luận và định nghĩa của các đối tượng trong đề.</p>
              )}
              <p className="caption">
                Hình chỉ minh họa. Em kiểm tra vị trí điểm, ký hiệu và các quan hệ trước khi học.
              </p>
              {!accepted && !revising && (
                <button
                  type="button"
                  className="primary"
                  disabled={busy || disabled}
                  onClick={() => {
                    clearImageSession(scope);
                    setAccepted(true);
                    onStateChange('accepted');
                    onReady(reading.transcription);
                  }}
                >
                  Hình đúng — bắt đầu gợi mở
                </button>
              )}
              {accepted && (
                <p role="status" className="success-note">
                  Đã xác nhận hình. Tiếp tục trả lời trong ô hội thoại bên dưới.
                </p>
              )}
              <button
                type="button"
                disabled={busy || disabled}
                onClick={() => {
                  setRevising(true);
                  setConfirmed(false);
                  pending();
                }}
              >
                Hình chưa đúng — yêu cầu sửa
              </button>
            </>
          )}
          {latex && (
            <details className="teacher-tikz">
              <summary>Mã TikZ dành cho giáo viên</summary>
              <pre>{latex}</pre>
              <button
                type="button"
                onClick={() =>
                  downloadBlob(
                    new Blob([latex], { type: 'text/x-tex;charset=utf-8' }),
                    'de-toan-v6.4.tex',
                  )
                }
              >
                Tải mã TikZ
              </button>
            </details>
          )}
        </div>
      )}
      {status && <p role="status">{status}</p>}
      {busy && (
        <button
          type="button"
          onClick={() => {
            if (controller.current) controller.current.abort();
            else {
              generation.current++;
              lock.current = false;
              setBusy(false);
              setStatus('');
              onStateChange(image ? 'pending' : 'none');
            }
            setError('Đã dừng. Em có thể thử lại với dữ kiện đã giữ.');
          }}
        >
          Dừng xử lý
        </button>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
