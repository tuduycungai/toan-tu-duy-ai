import { useEffect, useRef, useState } from 'react';
import { Volume2, Square, LoaderCircle } from 'lucide-react';
const cache = new Map<string, Blob>();
export function stopEnglishAudio() {
  window.dispatchEvent(new Event('stop-english-audio'));
  window.speechSynthesis?.cancel();
}
export function speechText(text: string) {
  return text
    .replace(/<=|≤|\\leq?/g, ' is less than or equal to ')
    .replace(/>=|≥|\\geq?/g, ' is greater than or equal to ')
    .replace(/</g, ' is less than ')
    .replace(/>/g, ' is greater than ')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1 divided by $2')
    .replace(/\\(?:times|cdot)|×/g, ' times ')
    .replace(/\\(?:parallel)|∥/g, ' is parallel to ')
    .replace(/\\perp|⟂/g, ' is perpendicular to ')
    .replace(/\\sqrt\{([^{}]+)\}/g, 'square root of $1')
    .replace(/\^\{?2\}?/g, ' squared ')
    .replace(/\^\{?3\}?/g, ' cubed ')
    .replace(/\\(?:left|right|mathrm|text)|\$|[{}*_#]/g, '')
    .replace(/\\[()[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function chunks(value: string) {
  const result: string[] = [];
  let rest = speechText(value);
  while (rest.length > 1100) {
    const end = rest.lastIndexOf(' ', 1100);
    result.push(rest.slice(0, end > 0 ? end : 1100));
    rest = rest.slice(end > 0 ? end + 1 : 1100);
  }
  if (rest) result.push(rest);
  return result;
}
export function SpeechButton({
  text,
  code,
  compact = false,
}: {
  text: string;
  code: string;
  compact?: boolean;
}) {
  const [state, setState] = useState('idle'),
    [error, setError] = useState(''),
    [rate, setRate] = useState(0.85),
    [device, setDevice] = useState(false);
  const player = useRef<HTMLAudioElement | null>(null),
    request = useRef<AbortController | null>(null),
    objectURL = useRef(''),
    sequence = useRef(0),
    speed = useRef(rate);
  speed.current = rate;
  function stop() {
    sequence.current++;
    request.current?.abort();
    request.current = null;
    player.current?.pause();
    if (player.current) {
      player.current.onended = null;
      player.current.src = '';
    }
    player.current = null;
    if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    objectURL.current = '';
    setState('idle');
  }
  useEffect(() => {
    window.addEventListener('stop-english-audio', stop);
    return () => {
      window.removeEventListener('stop-english-audio', stop);
      stop();
      window.speechSynthesis?.cancel();
    };
  }, [text, code]);
  useEffect(() => {
    if (player.current) player.current.playbackRate = rate;
  }, [rate]);
  async function play() {
    stopEnglishAudio();
    setError('');
    setDevice(false);
    if (!code) {
      setError('Kết nối mã lớp để dùng giọng AI, hoặc chọn giọng thiết bị.');
      return;
    }
    const id = sequence.current,
      parts = chunks(text),
      controller = new AbortController();
    request.current = controller;
    async function next(index: number): Promise<void> {
      if (index >= parts.length || id !== sequence.current) {
        if (id === sequence.current) setState('idle');
        return;
      }
      setState('loading');
      try {
        let blob = cache.get(code + ':' + parts[index]);
        if (!blob) {
          const r = await fetch('/api/language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'speak', accessCode: code, text: parts[index] }),
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(50000)]),
          });
          if (!r.ok || !r.headers.get('content-type')?.startsWith('audio/')) {
            const d = await r.json().catch(() => ({}));
            throw Error(d.error || 'Chưa tải được giọng AI.');
          }
          blob = await r.blob();
          if (blob.size > 10000000) throw Error('Đoạn âm thanh quá dài.');
          cache.set(code + ':' + parts[index], blob);
          if (cache.size > 20) cache.delete(cache.keys().next().value!);
        }
        if (id !== sequence.current) return;
        if (objectURL.current) URL.revokeObjectURL(objectURL.current);
        objectURL.current = URL.createObjectURL(blob);
        const audio = new Audio(objectURL.current);
        player.current = audio;
        audio.playbackRate = speed.current;
        audio.onended = () => {
          void next(index + 1);
        };
        audio.onerror = () => {
          if (id === sequence.current) {
            setState('idle');
            setError('Trình duyệt chưa phát được âm thanh. Em thử lại.');
          }
        };
        try {
          await audio.play();
          if (id === sequence.current) setState('playing');
        } catch {
          if (id === sequence.current) {
            setState('ready');
            setError('Âm thanh đã sẵn sàng. Bấm Phát để nghe.');
          }
        }
      } catch (e) {
        if (id === sequence.current && !controller.signal.aborted) {
          setState('idle');
          setError((e as Error).message);
        }
      }
    }
    await next(0);
  }
  function deviceVoice() {
    stopEnglishAudio();
    setError('');
    if (!window.speechSynthesis) {
      setError('Thiết bị này chưa hỗ trợ đọc văn bản.');
      return;
    }
    const voice = window.speechSynthesis.getVoices().find((v) => /^en[-_]/i.test(v.lang));
    if (!voice) {
      setError(
        'Thiết bị chưa có giọng tiếng Anh. Em có thể thử lại sau khi cài giọng đọc tiếng Anh.',
      );
      return;
    }
    const utterance = new SpeechSynthesisUtterance(speechText(text));
    utterance.lang = 'en-US';
    utterance.voice = voice;
    utterance.rate = rate;
    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');
    setDevice(true);
    setState('playing');
    window.speechSynthesis.speak(utterance);
  }
  return (
    <span className={`speech-tool ${compact ? 'compact' : ''}`}>
      <button
        type="button"
        className="speech-play"
        aria-label={`Nghe tiếng Anh: ${speechText(text).slice(0, 70)}`}
        onClick={() => {
          if (['playing', 'loading'].includes(state)) {
            stopEnglishAudio();
            return;
          }
          if (state === 'ready' && player.current) {
            void player.current
              .play()
              .then(() => {
                setState('playing');
                setError('');
              })
              .catch(() => setError('Em thử phát lại âm thanh.'));
            return;
          }
          void play();
        }}
      >
        {state === 'loading' ? (
          <LoaderCircle size={15} className="spin" />
        ) : state === 'playing' ? (
          <Square size={14} />
        ) : (
          <Volume2 size={16} />
        )}
        <span>
          {state === 'loading'
            ? 'Dừng tải'
            : state === 'playing'
              ? 'Dừng'
              : state === 'ready'
                ? 'Phát'
                : compact
                  ? 'Nghe'
                  : 'Nghe tiếng Anh'}
        </span>
      </button>
      {!compact && (
        <label className="speech-speed">
          <span className="sr-only">Tốc độ đọc tiếng Anh</span>
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
            <option value={0.85}>0.85× · Chậm</option>
            <option value={1}>1×</option>
            <option value={1.15}>1.15×</option>
          </select>
        </label>
      )}
      {device && <small>Giọng thiết bị</small>}
      {error && (
        <span className="speech-error" role="status">
          {error}{' '}
          {state !== 'ready' && (
            <button type="button" onClick={deviceVoice}>
              Dùng giọng thiết bị
            </button>
          )}
        </span>
      )}
    </span>
  );
}
