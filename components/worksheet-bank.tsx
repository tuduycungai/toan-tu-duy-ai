import { useState } from 'react';
import { worksheets, type Worksheet } from '../lib/worksheets';
import { ProblemFigure } from './problem-figure';
export function WorksheetBank({
  onChoose,
  disabled,
}: {
  onChoose: (w: Worksheet) => void;
  disabled: boolean;
}) {
  const [topic, setTopic] = useState('Tất cả'),
    [query, setQuery] = useState(''),
    [preview, setPreview] = useState('');
  const items = worksheets.filter(
    (w) =>
      (topic === 'Tất cả' || w.section === topic) &&
      `${w.label} ${w.title} ${w.problem}`
        .toLocaleLowerCase('vi')
        .includes(query.toLocaleLowerCase('vi')),
  );
  return (
    <section className="worksheet-bank" aria-label="81 bài từ phiếu bài tập">
      <div className="section-heading">
        <div>
          <span className="eyebrow">PHIẾU BÀI TẬP · 46 TRANG</span>
          <h2>81 bài đã chuẩn hóa đề và hình</h2>
        </div>
      </div>
      <p className="caption">
        Chọn bài để xem hình trước khi kết nối AI. Mỗi bài giữ số trang PDF để thầy và em dễ đối
        chiếu; các lỗi bản gốc được ghi riêng.
      </p>
      <div className="worksheet-filters">
        <label>
          Chủ đề trong PDF
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            {['Tất cả', ...new Set(worksheets.map((w) => w.section))].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Tìm bài
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tên bài, điểm, dữ kiện…"
          />
        </label>
      </div>
      <p className="caption" role="status">
        {items.length} bài phù hợp
      </p>
      <div className="worksheet-list">
        {items.map((w) => (
          <article className="worksheet-card" key={w.id}>
            <small>
              {w.section} · {w.label} · PDF trang {w.page}
            </small>
            <h3>{w.title}</h3>
            <p>{w.problem}</p>
            {w.note && (
              <details>
                <summary>Lưu ý khi đối chiếu bản gốc</summary>
                <p>{w.note}</p>
              </details>
            )}
            <div className="worksheet-actions">
              <button disabled={disabled} onClick={() => onChoose(w)}>
                Học bài này
              </button>
              <button
                aria-expanded={preview === w.id}
                onClick={() => setPreview(preview === w.id ? '' : w.id)}
              >
                {preview === w.id ? 'Thu hình' : 'Xem hình đã kiểm tra'}
              </button>
            </div>
            {preview === w.id && <ProblemFigure problem={w.problem} />}
          </article>
        ))}
      </div>
    </section>
  );
}
