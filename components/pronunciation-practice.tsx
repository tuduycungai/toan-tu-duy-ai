import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { recordingWav } from '../lib/recording';
import { SpeechButton, stopEnglishAudio } from './speech-button';
type Review = {
  transcript: string;
  clarity: string;
  feedbackEn: string;
  feedbackVi: string;
  words: { word: string; status: string; tipEn: string; tipVi: string }[];
};
export function PronunciationPractice({ target, code }: { target: string; code: string }) {
  const [consent, setConsent] = useState(false),
    [phase, setPhase] = useState('idle'),
    [seconds, setSeconds] = useState(0),
    [error, setError] = useState(''),
    [blob, setBlob] = useState<Blob | null>(null),
    [url, setUrl] = useState(''),
    [review, setReview] = useState<Review | null>(null);
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    epoch = useRef(0),
    timer = useRef<ReturnType<typeof setInterval> | null>(null),
    controller = useRef<AbortController | null>(null),
    busy = useRef(false);
  function release() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }
  function cancel() {
    epoch.current++;
    controller.current?.abort();
    if (recorder.current?.state === 'recording') recorder.current.stop();
    recorder.current = null;
    release();
    busy.current = false;
  }
  useEffect(() => {
    setBlob(null);
    setReview(null);
    setPhase('idle');
    setError('');
    return cancel;
  }, [target, code]);
  useEffect(() => {
    if (!blob) {
      setUrl('');
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  async function start() {
    if (!consent || busy.current) return;
    if (!code) {
      setError('Em kết nối mã lớp trước khi luyện phát âm.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError(
        'Trình duyệt này chưa hỗ trợ ghi âm. Hãy mở trang bằng HTTPS trên trình duyệt có quyền micro.',
      );
      return;
    }
    cancel();
    stopEnglishAudio();
    busy.current = true;
    const id = epoch.current;
    setError('');
    setReview(null);
    setBlob(null);
    setSeconds(0);
    setPhase('requesting');
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (id !== epoch.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((t) =>
        MediaRecorder.isTypeSupported(t),
      );
      const r = new MediaRecorder(media, mime ? { mimeType: mime } : undefined);
      recorder.current = r;
      const parts: Blob[] = [];
      r.ondataavailable = (e) => {
        if (e.data.size) parts.push(e.data);
      };
      r.onerror = () => {
        if (id === epoch.current) {
          cancel();
          setPhase('idle');
          setError('Micro gặp lỗi. Em kiểm tra quyền truy cập rồi thử lại.');
        }
      };
      r.onstop = () => {
        if (id !== epoch.current) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        release();
        if (id === epoch.current) {
          busy.current = false;
          setBlob(new Blob(parts, { type: r.mimeType }));
          setPhase('recorded');
        }
      };
      r.start();
      setPhase('recording');
      let elapsed = 0;
      timer.current = setInterval(() => {
        elapsed++;
        setSeconds(elapsed);
        if (elapsed >= 15 && r.state === 'recording') r.stop();
      }, 1000);
    } catch (e) {
      if (id === epoch.current) {
        release();
        busy.current = false;
        setPhase('idle');
        setError(
          (e as Error).name === 'NotAllowedError'
            ? 'Chưa được cấp quyền micro. Em có thể cho phép micro rồi thử lại, hoặc tiếp tục học bằng văn bản.'
            : 'Không mở được micro. Em kiểm tra thiết bị rồi thử lại.',
        );
      }
    }
  }
  async function assess() {
    if (!blob || !consent || busy.current) return;
    busy.current = true;
    const id = epoch.current,
      abort = new AbortController();
    controller.current = abort;
    setPhase('assessing');
    setError('');
    setReview(null);
    try {
      const audio = await recordingWav(blob);
      if (id !== epoch.current) return;
      const r = await fetch('/api/language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pronounce',
          accessCode: code,
          target,
          audio,
          consent: true,
        }),
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(50000)]),
      });
      const d = await r.json();
      if (id !== epoch.current) return;
      if (!r.ok) throw Error(d.error || 'Chưa nhận được nhận xét.');
      setReview(d.review);
      setPhase('recorded');
    } catch (e) {
      if (id === epoch.current && !abort.signal.aborted) {
        setError((e as Error).message);
        setPhase('recorded');
      }
    } finally {
      if (id === epoch.current) busy.current = false;
    }
  }
  return (
    <section className="pronunciation-box" aria-label="Luyện phát âm tự chọn">
      <h4>Luyện phát âm · Tự chọn</h4>
      <p lang="en" className="pronunciation-target">
        {target}
      </p>
      <SpeechButton text={target} code={code} />
      <label className="recording-consent">
        <input
          type="checkbox"
          checked={consent}
          disabled={phase === 'recording' || phase === 'assessing' || phase === 'requesting'}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          Em đồng ý gửi đoạn ghi âm cho dịch vụ AI khi bấm kiểm tra. Ứng dụng không lưu bản ghi vào
          tài khoản hay lịch sử.
        </span>
      </label>
      <div className="recording-actions">
        {phase === 'recording' ? (
          <button type="button" onClick={() => recorder.current?.stop()}>
            <Square size={14} />
            Dừng ghi · {seconds}/15 giây
          </button>
        ) : (
          <button
            type="button"
            disabled={!consent || phase === 'requesting' || phase === 'assessing'}
            onClick={() => void start()}
          >
            <Mic size={16} />
            {phase === 'requesting' ? 'Đang mở micro…' : blob ? 'Ghi lại' : 'Bắt đầu ghi âm'}
          </button>
        )}
        {blob && (
          <button
            type="button"
            className="primary"
            disabled={!consent || phase === 'assessing'}
            onClick={() => void assess()}
          >
            {phase === 'assessing' ? 'AI đang nghe…' : 'Kiểm tra phát âm'}
          </button>
        )}
        {['requesting', 'assessing'].includes(phase) && (
          <button
            type="button"
            onClick={() => {
              cancel();
              setPhase(blob ? 'recorded' : 'idle');
            }}
          >
            Hủy
          </button>
        )}
      </div>
      {url && (
        <audio controls src={url} aria-label="Nghe lại giọng của em" onPlay={stopEnglishAudio} />
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {review && (
        <div className="pronunciation-result" aria-live="polite">
          <strong>
            {review.clarity === 'clear'
              ? 'Dễ nghe'
              : review.clarity === 'practice'
                ? 'Cùng luyện thêm'
                : 'Chưa đủ âm thanh để nhận xét'}
          </strong>
          <p>
            <span lang="en">{review.feedbackEn}</span>
            <small lang="vi">({review.feedbackVi})</small>
          </p>
          <SpeechButton text={review.feedbackEn} code={code} />
          <p className="caption">
            AI nghe được: <span lang="en">{review.transcript || '—'}</span>
          </p>
          {review.words.map((w, i) => (
            <p key={i}>
              <b lang="en">{w.word}</b> · <span lang="en">{w.tipEn}</span>
              <small lang="vi">({w.tipVi})</small>
            </p>
          ))}
        </div>
      )}
      <p className="caption">
        Ghi tối đa 15 giây. Nhận xét AI mang tính tham khảo, không phải điểm thi. Em vẫn nhận sao
        khi học bằng văn bản.
      </p>
    </section>
  );
}
