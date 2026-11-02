import { useEffect, useState } from 'react';
import { Languages, Star } from 'lucide-react';
import { MathText } from './math-text';
import { SpeechButton } from './speech-button';
import { PronunciationPractice } from './pronunciation-practice';
import { wordsFor, lessonKnowledge, type BilingualReply, type Pair } from '../lib/math-english';
export function PairedText({ pair }: { pair: Pair }) {
  return (
    <div className="bilingual-pair">
      <div lang="en">
        <MathText text={pair.en} />
      </div>
      <div lang="vi" className="vietsub">
        (<MathText text={pair.vi} />)
      </div>
    </div>
  );
}
export function BilingualMessage({ value, code }: { value: BilingualReply; code: string }) {
  return (
    <div className="bilingual-message">
      {value.pairs.map((p, i) => (
        <PairedText pair={p} key={i} />
      ))}
      <SpeechButton text={value.pairs.map((p) => p.en).join('\n')} code={code} />
    </div>
  );
}
export function LanguagePanel({
  problem,
  lessonIds,
  question,
  code,
}: {
  problem: string;
  lessonIds: string[];
  question?: string;
  code: string;
}) {
  const words = wordsFor(problem, lessonIds),
    [target, setTarget] = useState(''),
    [open, setOpen] = useState(false),
    [vocabOpen, setVocabOpen] = useState(
      () => typeof window === 'undefined' || window.innerWidth >= 1100,
    );
  useEffect(() => {
    const show = () => setVocabOpen(true);
    window.addEventListener('open-math-english', show);
    return () => window.removeEventListener('open-math-english', show);
  }, []);
  const practice = (text: string) => {
    setTarget(text);
    setOpen(true);
  };
  return (
    <section className="language-panel" aria-label="Tiếng Anh trong bài">
      <div className="language-panel-heading">
        <Languages size={20} />
        <div>
          <h3>Tiếng Anh trong bài</h3>
          <p>Nghe · Hiểu · Thử nói</p>
        </div>
      </div>
      <details
        className="vocabulary-section"
        open={vocabOpen}
        onToggle={(e) => setVocabOpen(e.currentTarget.open)}
      >
        <summary>
          Từ vựng liên quan <span>{words.length} từ</span>
        </summary>
        <div className="vocabulary-table-wrap">
          <table className="vocabulary-table">
            <thead>
              <tr>
                <th>English / Tiếng Việt</th>
                <th>Nghe & luyện</th>
              </tr>
            </thead>
            <tbody>
              {words.map(({ word, direct }, i) => (
                <tr key={i}>
                  <td>
                    <b lang="en">{word.en}</b>
                    <span lang="vi">({word.vi})</span>
                    <small>{direct ? 'Có trong bài' : 'Kiến thức nền'}</small>
                    <details>
                      <summary>Câu ví dụ</summary>
                      <PairedText pair={word.example} />
                      <SpeechButton text={word.example.en} code={code} compact />
                    </details>
                  </td>
                  <td>
                    <SpeechButton text={word.en} code={code} compact />
                    <button
                      type="button"
                      className="practice-word"
                      onClick={() => practice(word.en)}
                      aria-label={'Luyện phát âm ' + word.en}
                    >
                      Luyện nói
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <details className="language-knowledge">
        <summary>Kiến thức cần dùng</summary>
        {lessonKnowledge(lessonIds).map((p, i) => (
          <div key={i}>
            <PairedText pair={p} />
            <SpeechButton text={p.en} code={code} compact />
          </div>
        ))}
      </details>
      <details
        className="language-speaking"
        open={open}
        onToggle={(e) => setOpen(e.currentTarget.open)}
      >
        <summary>Luyện phát âm tự chọn</summary>
        <p className="caption">Chọn “Luyện nói” cạnh một từ, hoặc luyện câu hỏi gần nhất.</p>
        {question && (
          <button
            type="button"
            onClick={() =>
              practice(
                question.length <= 240
                  ? question
                  : question.slice(0, question.lastIndexOf(' ', 240)),
              )
            }
          >
            Luyện câu hỏi của gia sư
          </button>
        )}
        {open && (
          <PronunciationPractice
            key={target || words[0]?.word.en}
            target={target || words[0]?.word.en || 'I can explain my reasoning.'}
            code={code}
          />
        )}
      </details>
    </section>
  );
}
export function StarsBadge({
  enabled,
  total,
  pending,
}: {
  enabled: boolean;
  total: number;
  pending: number;
}) {
  return (
    <details className="stars-badge">
      <summary>
        <Star size={17} />
        {enabled ? `${total} sao` : 'Lưu sao học tập'}
      </summary>
      <div>
        <strong>Sao cho nỗ lực học tập</strong>
        <p>
          +1 sao cho câu trả lời có nội dung toán học; thêm +2 khi em dùng tiếng Anh liên quan đến
          bài. Tối đa 30 sao/ngày theo giờ Việt Nam.
        </p>
        <p>
          Không cộng lặp cùng nội dung trong ngày. Nghe lại, xin đáp án và tin nhắn ngắn chưa có lập
          luận không cộng sao. Sao không phải điểm số.
        </p>
        <p>
          {enabled
            ? 'Sao hiển thị sau khi máy chủ xác nhận lưu vào mã người học.'
            : 'Mở Bộ nhớ học tập để bật lưu hoặc khôi phục mã người học.'}
          {pending > 0 ? ` Có ${pending} lượt chờ lưu.` : ''}
        </p>
        <button
          type="button"
          onClick={() => document.querySelector<HTMLButtonElement>('.memory-trigger')?.click()}
        >
          Mở Bộ nhớ học tập
        </button>
      </div>
    </details>
  );
}
