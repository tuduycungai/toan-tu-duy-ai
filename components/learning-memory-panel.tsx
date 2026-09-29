import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import {
  learningAPI,
  downloadJSON,
  exportStudentData,
  type LearningMemory,
} from '../lib/learning-memory';
export function LearningMemoryPanel({
  memory,
  code,
  onReset,
}: {
  memory: LearningMemory;
  code: string;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false),
    [agree, setAgree] = useState(false),
    [guardian, setGuardian] = useState(false);
  const [recovery, setRecovery] = useState(''),
    [issued, setIssued] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [configured, setConfigured] = useState<boolean | null>(null);
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="quiet memory-trigger"
        onClick={() => {
          setOpen(true);
          void run(async () => {
            const c = await learningAPI('config');
            setConfigured(c.configured);
          });
        }}
      >
        Bộ nhớ học tập
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="memory-dialog"
          style={{
            top: 16,
            left: '50%',
            translate: 'none',
            transform: 'translateX(-50%)',
            maxHeight: 'calc(100dvh - 32px)',
            width: 'min(660px, calc(100vw - 32px))',
            boxSizing: 'border-box',
            transition: 'none',
            animation: 'none',
          }}
        >
          <DialogHeader>
            <DialogTitle>Bộ nhớ học tập của em</DialogTitle>
            <DialogDescription>Em có thể học bình thường khi không bật ghi nhớ.</DialogDescription>
          </DialogHeader>
          <p>
            Chỉ lưu mã học sinh, mã phiên, câu trả lời Toán đã rút gọn, câu gợi mở và nhận định tiến
            bộ. Không lưu ảnh đề; không yêu cầu tên, trường hoặc email cho bộ nhớ này. Em hãy bỏ
            thông tin cá nhân trước khi gửi bài.
          </p>
          <p>
            Nhật ký và khảo sát được giữ tối đa 90 ngày; hồ sơ tiến bộ hết hạn sau 90 ngày không
            hoạt động. Phần tóm tắt được gửi tới nhà cung cấp AI của lớp để điều chỉnh câu hỏi. Nhận
            định của AI vẫn có thể sai.
          </p>
          <p>
            Giáo viên xem dữ liệu và duyệt mẫu gợi mở đã bỏ thông tin cá nhân trước khi dùng chung.
            Mẫu đã khái quát hóa được lưu theo phiên bản. Khi mạng lỗi, tối đa 20 lượt chờ trên
            thiết bị trong 24 giờ. Trên máy dùng chung, nhớ rời hồ sơ.
          </p>
          {configured === false && (
            <p role="status">Giáo viên chưa kết nối Google Sheets. Em vẫn tiếp tục học được.</p>
          )}
          {memory.studentId && (
            <p>
              Mã học sinh: <code>{memory.studentId}</code>
            </p>
          )}
          <p role="status">
            {memory.status} {memory.pending > 0 && `(${memory.pending} lượt chờ)`}
          </p>
          {!memory.enabled ? (
            <fieldset disabled={busy || configured !== true}>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                Em đồng ý lưu dữ liệu học tập theo nội dung trên.
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={guardian}
                  onChange={(e) => setGuardian(e.target.checked)}
                />
                Nếu cần sự đồng ý của cha mẹ/người giám hộ, em đã có sự đồng ý và được giáo viên
                hướng dẫn.
              </label>
              <button
                className="primary"
                disabled={!agree || !guardian || !code}
                onClick={() =>
                  void run(async () => {
                    const token = await memory.activate(code, guardian);
                    if (token) setIssued(token);
                  })
                }
              >
                Bật lưu tiến bộ
              </button>
              {!code && <p>Em kết nối bằng mã lớp trước khi bật lưu.</p>}
            </fieldset>
          ) : (
            <button className="quiet" disabled={busy} onClick={() => void run(memory.stop)}>
              Ngừng ghi dữ liệu
            </button>
          )}
          {issued && (
            <div className="memory-code">
              <strong>
                Cất riêng mã khôi phục này. Ai có mã có thể xem, xuất hoặc xóa dữ liệu của em.
              </strong>
              <textarea readOnly value={issued} aria-label="Mã khôi phục mới" />
              <button
                className="quiet"
                onClick={() => downloadJSON({ recovery: issued }, 'ma-khoi-phuc-hoc-tap.json')}
              >
                Tải mã khôi phục
              </button>
            </div>
          )}
          <details>
            <summary>Khôi phục trên thiết bị khác</summary>
            <label>
              Mã khôi phục riêng
              <input
                type="password"
                autoComplete="off"
                value={recovery}
                onChange={(e) => setRecovery(e.target.value)}
              />
            </label>
            <button
              className="quiet"
              disabled={busy || !recovery}
              onClick={() =>
                void run(async () => {
                  await memory.restore(recovery);
                  setRecovery('');
                  onReset();
                })
              }
            >
              Khôi phục hồ sơ
            </button>
          </details>
          {memory.profile && (
            <p>
              Đã quan sát {memory.profile.observedTurns} lượt; mức hỗ trợ{' '}
              {memory.profile.supportLevel}/4. Kỹ năng có bước tiếp theo củng cố:{' '}
              {Object.values(memory.profile.skills || {}).filter((s) => s.corroborated > 0).length}.
              Đây là bằng chứng theo bước, chưa phải xác nhận thành thạo.
            </p>
          )}
          {memory.studentId && (
            <div className="memory-actions">
              <button
                className="quiet"
                disabled={busy}
                onClick={() =>
                  void run(async () =>
                    downloadJSON(await exportStudentData(), 'du-lieu-hoc-tap.json'),
                  )
                }
              >
                Xuất dữ liệu của em
              </button>
              <button className="quiet" disabled={busy} onClick={() => void run(memory.sync)}>
                Đọc lại hồ sơ
              </button>
              <button
                className="quiet"
                disabled={busy || !memory.pending}
                onClick={() => void run(memory.flush)}
              >
                Gửi lại lượt chờ
              </button>
              <button
                className="quiet"
                disabled={busy || !memory.lastEvent || !memory.enabled}
                onClick={() =>
                  void run(async () => {
                    await learningAPI('report', { eventId: memory.lastEvent });
                    setError('Đã gửi lượt gần nhất để giáo viên xem lại.');
                  })
                }
              >
                Báo gợi mở chưa phù hợp
              </button>
              <button
                className="quiet"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await memory.logout();
                    setIssued('');
                    onReset();
                  })
                }
              >
                Rời hồ sơ trên máy này
              </button>
              <button
                className="quiet"
                disabled={busy}
                onClick={() => {
                  if (
                    confirm(
                      'Xóa nhật ký, hồ sơ, khảo sát và các trường hợp riêng của mã học sinh này trên Sheets?',
                    )
                  )
                    void run(async () => {
                      await memory.forget();
                      setIssued('');
                      onReset();
                    });
                }}
              >
                Yêu cầu xóa dữ liệu
              </button>
            </div>
          )}
          {error && <p role="alert">{error}</p>}
          <a href="?teacher=1">Khu vực giáo viên</a>
        </DialogContent>
      </Dialog>
    </>
  );
}
