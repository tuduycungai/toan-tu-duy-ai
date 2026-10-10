import curriculumSkills from '../lib/skill-labels.json';
import { useEffect, useState } from 'react';
import { downloadJSON } from '../lib/learning-memory';
import '../app/learning-memory.css';
type Example = { skill: string; errorKind: string; hint: string; check: string };
type Candidate = {
  id: string;
  studentId: string;
  kind: string;
  status: string;
  question: string;
  answer: string;
  nextQuestion: string;
  skill: string;
  errorKind: string;
  draft?: Example;
};
type Profile = {
  studentId: string;
  observedTurns: number;
  supportLevel: number;
  updatedAt: string;
  recentSessions: {
    id: string;
    attempts: number;
    independent: number;
    hints: number;
    errors: number;
  }[];
};
type Dashboard = {
  offset: number;
  queueCount: number;
  active: { versionId: string; revision: number };
  queue: Candidate[];
  versions: { id: string; count: number }[];
  metrics: {
    learners: number;
    attempts: number;
    independentRate: number | null;
    hintsPerStep: number | null;
    repeatedErrors: number;
    corroborated: number;
  };
  profiles: Profile[];
};
const skills: Record<string, string> = {
  ...curriculumSkills,
  reading: 'Đọc và tách đề',
  midpoint: 'Trung điểm',
  parallel: 'Song song',
  quadrilateral: 'Tứ giác',
  proof: 'Suy luận chứng minh',
};
const errors: Record<string, string> = {
  '': 'Chưa xác định',
  wrong_given_goal: 'Nhầm giả thiết/kết luận',
  wrong_theorem: 'Sai định lý',
  wrong_logic: 'Sai suy luận',
  wrong_calculation_notation: 'Sai tính toán/ký hiệu',
  idea_missing_reason: 'Thiếu căn cứ',
};
async function api(action: string, fields: Record<string, unknown> = {}) {
  const r = await fetch('/api/teacher', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...fields }),
    signal: AbortSignal.timeout(18000),
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || 'Chưa xử lý được yêu cầu.');
  return data;
}
function Fields({ value, change }: { value: Example; change: (v: Example) => void }) {
  return (
    <>
      <label>
        Kỹ năng
        <select value={value.skill} onChange={(e) => change({ ...value, skill: e.target.value })}>
          {Object.entries(skills).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Dạng lỗi
        <select
          value={value.errorKind}
          onChange={(e) => change({ ...value, errorKind: e.target.value })}
        >
          {Object.entries(errors).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Mẫu gợi mở khái quát, không kèm thông tin học sinh
        <textarea
          rows={3}
          maxLength={450}
          value={value.hint}
          onChange={(e) => change({ ...value, hint: e.target.value })}
        />
      </label>
      <label>
        Câu kiểm tra bước tiếp theo
        <textarea
          rows={2}
          maxLength={240}
          value={value.check}
          onChange={(e) => change({ ...value, check: e.target.value })}
        />
      </label>
    </>
  );
}
function Review({
  item,
  act,
  busy,
}: {
  item: Candidate;
  act: (i: Candidate, d: string, e: Example, verified: boolean) => void;
  busy: boolean;
}) {
  const [example, setExample] = useState<Example>(
      item.draft || { skill: item.skill, errorKind: item.errorKind, hint: '', check: '' },
    ),
    [verified, setVerified] = useState(false);
  return (
    <article className="teacher-card">
      <strong>
        {
          (
            {
              repeated_error: 'Lỗi lặp lại',
              successful_hint: 'Gợi mở dẫn tới bước tự sửa',
              guidance_concern: 'Học sinh báo gợi mở chưa phù hợp',
            } as Record<string, string>
          )[item.kind]
        }
      </strong>
      <p>Mã học sinh: {item.studentId}</p>
      <p>Câu trước: {item.question}</p>
      <p>Học sinh: {item.answer}</p>
      <p>Câu gợi mở tiếp: {item.nextQuestion}</p>
      <Fields value={example} change={setExample} />
      <label>
        <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />{' '}
        Tôi đã kiểm tra toán học, loại thông tin cá nhân và xác nhận mẫu phù hợp nguyên tắc gợi mở.
      </label>
      <div className="memory-actions">
        <button
          className="quiet"
          disabled={busy}
          onClick={() => act(item, 'draft', example, verified)}
        >
          Lưu bản sửa
        </button>
        <button
          className="primary"
          disabled={busy || !verified}
          onClick={() => act(item, 'approve', example, verified)}
        >
          Duyệt vào kho chung
        </button>
        <button
          className="quiet"
          disabled={busy}
          onClick={() => act(item, 'reject', example, false)}
        >
          Bác bỏ
        </button>
      </div>
    </article>
  );
}
export function TeacherConsole() {
  const [key, setKey] = useState(''),
    [data, setData] = useState<Dashboard | null>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const [version, setVersion] = useState('base'),
    [examples, setExamples] = useState<Example[] | null>(null),
    [verified, setVerified] = useState(false);
  async function refresh(offset = 0) {
    const d = await api('list', { offset });
    setData(d);
    setVersion(d.active.versionId);
  }
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setMessage('');
    try {
      await fn();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void api('list')
      .then(setData)
      .catch(() => {});
  }, []);
  const pct = (n: number | null) => (n === null ? 'Chưa đủ dữ liệu' : `${(n * 100).toFixed(1)}%`);
  return (
    <main className="teacher-shell">
      <a href="/">← Trở về buổi học</a>
      <h1>Giáo viên · Bộ nhớ học tập</h1>
      <p>
        Kho này giúp truy xuất kinh nghiệm đã kiểm duyệt khi trả lời. Việc lưu hội thoại không huấn
        luyện lại trọng số mô hình AI.
      </p>
      {message && <p role="status">{message}</p>}
      {!data ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await api('login', { key });
              setKey('');
              await refresh();
            });
          }}
        >
          <label>
            Khóa quản trị riêng
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <p>Mã lớp HOCGIOITOAN không cấp quyền xem dữ liệu.</p>
          <button className="primary" disabled={busy || key.length < 32}>
            Đăng nhập giáo viên
          </button>
        </form>
      ) : (
        <>
          <div className="memory-actions">
            <button className="quiet" disabled={busy} onClick={() => void run(() => refresh())}>
              Tải lại
            </button>
            <button className="quiet" onClick={() => downloadJSON(data, 'tong-hop-lop.json')}>
              Xuất tổng hợp
            </button>
            <button
              className="quiet"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const r = await api('purge');
                  await refresh();
                  setMessage(`Đã dọn ${r.removed} bản ghi hết hạn.`);
                })
              }
            >
              Dọn dữ liệu hết hạn
            </button>
            <button
              className="quiet"
              onClick={() =>
                void run(async () => {
                  await api('logout');
                  setData(null);
                  setExamples(null);
                })
              }
            >
              Đăng xuất
            </button>
          </div>
          <h2>Chỉ số từ các lượt được phép lưu</h2>
          <p>
            {data.metrics.learners} hồ sơ · {data.metrics.attempts} bước được quan sát. Tự hoàn
            thành bước với mức gợi mở 0–1: {pct(data.metrics.independentRate)}. Mức gợi mở trung
            bình: {data.metrics.hintsPerStep?.toFixed(2) ?? 'Chưa có'}/4. Lỗi xuất hiện lại:{' '}
            {data.metrics.repeatedErrors}. Bước được củng cố bằng câu trả lời tiếp:{' '}
            {data.metrics.corroborated}.
          </p>
          <p>
            Đây là chỉ số từ đánh giá AI, cần lấy mẫu kiểm tra thủ công. So sánh các buổi cùng kỹ
            năng và độ khó; số lượt trò chuyện tự nó không chứng minh hiệu quả.
          </p>
          <details>
            <summary>Tiến bộ theo mã học sinh và buổi gần đây</summary>
            <div className="teacher-table">
              <table>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Hỗ trợ</th>
                    <th>Các buổi: tự làm/bước · gợi mở · lỗi</th>
                    <th>Cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {data.profiles.map((p) => (
                    <tr key={p.studentId}>
                      <td>{p.studentId}</td>
                      <td>{p.supportLevel}/4</td>
                      <td>
                        {p.recentSessions.map((s) => (
                          <div key={s.id}>
                            {s.id.slice(0, 8)}: {s.independent}/{s.attempts} ·{' '}
                            {(s.hints / s.attempts).toFixed(1)} · {s.errors}
                          </div>
                        ))}
                      </td>
                      <td>{new Date(p.updatedAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <h2>Kho dùng chung · {data.active.versionId}</h2>
          <label>
            Phiên bản
            <select value={version} onChange={(e) => setVersion(e.target.value)}>
              <option value="base">base · không dùng mẫu</option>
              {data.versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} · {v.count} mẫu
                </option>
              ))}
            </select>
          </label>
          <div className="memory-actions">
            <button
              className="quiet"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const v = await api('version', { versionId: version });
                  setExamples(v.examples);
                  setVerified(false);
                })
              }
            >
              Xem và sửa bản sao của kho
            </button>
            <button
              className="quiet"
              disabled={busy || version === data.active.versionId}
              onClick={() =>
                void run(async () => {
                  await api('rollback', {
                    versionId: version,
                    expectedRevision: data.active.revision,
                  });
                  await refresh();
                  setExamples(null);
                  setMessage('Đã chuyển kho đang dùng. Lượt học tiếp theo sẽ dùng phiên bản này.');
                })
              }
            >
              Dùng lại phiên bản đã chọn
            </button>
          </div>
          {examples && (
            <section>
              {examples.map((example, i) => (
                <div className="teacher-card" key={i}>
                  <Fields
                    value={example}
                    change={(v) => setExamples(examples.map((e, j) => (i === j ? v : e)))}
                  />
                  <button
                    className="quiet"
                    onClick={() => setExamples(examples.filter((_, j) => i !== j))}
                  >
                    Bỏ mẫu này khỏi bản mới
                  </button>
                </div>
              ))}
              <label>
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                />{' '}
                Tôi đã kiểm tra toàn bộ các mẫu trong bản mới.
              </label>
              <button
                className="primary"
                disabled={busy || !verified}
                onClick={() =>
                  void run(async () => {
                    await api('publish', {
                      examples,
                      verified,
                      expectedRevision: data.active.revision,
                    });
                    await refresh();
                    setExamples(null);
                  })
                }
              >
                Xuất bản phiên bản mới
              </button>
            </section>
          )}
          <h2>Hàng đợi cần kiểm duyệt · {data.queueCount} trường hợp</h2>
          <div className="memory-actions">
            <button
              className="quiet"
              disabled={busy || !data.offset}
              onClick={() => void run(() => refresh(Math.max(0, data.offset - 100)))}
            >
              Trang trước
            </button>
            <button
              className="quiet"
              disabled={busy || data.offset + 100 >= data.queueCount}
              onClick={() => void run(() => refresh(data.offset + 100))}
            >
              Trang sau
            </button>
          </div>
          <p>
            Hiển thị tối đa 100 trường hợp mới nhất. Bản chưa duyệt và bản nháp không được đưa vào
            ngữ cảnh AI.
          </p>
          {data.queue
            .filter((i) => i.status === 'pending')
            .map((item) => (
              <Review
                key={item.id}
                item={item}
                busy={busy}
                act={(i, decision, example, checked) =>
                  void run(async () => {
                    await api('review', {
                      id: i.id,
                      decision,
                      example,
                      verified: checked,
                      expectedRevision: data.active.revision,
                    });
                    await refresh();
                    setMessage(
                      decision === 'draft'
                        ? 'Đã lưu bản sửa, chưa đưa vào kho.'
                        : 'Đã ghi nhận quyết định.',
                    );
                  })
                }
              />
            ))}
          {!data.queue.some((i) => i.status === 'pending') && <p>Chưa có trường hợp chờ duyệt.</p>}
        </>
      )}
    </main>
  );
}
