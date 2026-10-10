import { useEffect, useRef, useState } from 'react';
export type MemoryProfile = {
  scopes?: Record<
    string,
    {
      turns: number;
      supportLevel: number;
      skills: MemoryProfile['skills'];
      errors: Record<string, number>;
      updatedAt: string;
    }
  >;
  supportLevel: number;
  observedTurns: number;
  updatedAt: string;
  skills: Record<string, { predicted: number; corroborated: number }>;
  repeatedErrors: Record<string, number>;
};
export type LearningReply = {
  status: string;
  eventId?: string;
  receipt?: string;
  profile?: MemoryProfile;
  message?: string;
};
type Pending = { id: string; receipt: string; at: number; attempts: number };
const PREF = 'tutor-memory-v650',
  QUEUE = 'tutor-memory-pending-v650';
function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') || fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export async function learningAPI(action: string, fields: Record<string, unknown> = {}) {
  const r = await fetch('/api/learning', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...fields }),
    signal: AbortSignal.timeout(18000),
  });
  if (!r.headers.get('content-type')?.includes('application/json'))
    throw Error('Dịch vụ lưu trữ chưa sẵn sàng.');
  const data = await r.json();
  if (!r.ok)
    throw Object.assign(Error(data.error || 'Chưa xác nhận thao tác.'), { status: r.status });
  return data;
}
export function filteredQueue(items: Pending[], now = Date.now()) {
  return items
    .filter(
      (p) =>
        typeof p.receipt === 'string' && p.at > now - 86400000 && p.at <= now && p.attempts < 8,
    )
    .slice(-20);
}
export function addPending(items: Pending[], item: Pending) {
  return filteredQueue([...items.filter((p) => p.id !== item.id), item]);
}
export function useLearningMemory(scope = '') {
  const [enabled, setEnabled] = useState(false),
    [studentId, setStudentId] = useState(''),
    [profile, setProfile] = useState<MemoryProfile | null>(null);
  const [status, setStatus] = useState('Chưa bật lưu tiến bộ vào Google Sheets.'),
    [pending, setPending] = useState(0),
    [lastEvent, setLastEvent] = useState('');
  const session = useRef(
      (() => {
        try {
          const old = sessionStorage.getItem('memory-session:' + scope);
          if (old && /^[\w-]{16,80}$/.test(old)) return old;
        } catch {}
        return crypto.randomUUID();
      })(),
    ),
    live = useRef(false),
    flushing = useRef(false);
  const epoch = useRef(0);
  function remember(id: string, consent: boolean, stopPending = false) {
    live.current = consent;
    setStudentId(id);
    setEnabled(consent);
    write(PREF, { studentId: id, consent, stopPending });
  }
  async function flush() {
    if (!live.current || flushing.current) return;
    const list = filteredQueue(read<Pending[]>(QUEUE, []));
    write(QUEUE, list);
    setPending(list.length);
    if (!list.length) return;
    flushing.current = true;
    const startEpoch = epoch.current;
    try {
      const batch = list.slice(0, 5);
      write(
        QUEUE,
        list.map((p) =>
          batch.some((b) => b.id === p.id) ? { ...p, attempts: p.attempts + 1 } : p,
        ),
      );
      const data = await learningAPI('retry', { receipts: batch.map((p) => p.receipt) });
      if (epoch.current !== startEpoch || !live.current) return;
      const results: { id?: string; saved: boolean; status?: number }[] = data.results.map(
        (r: { id?: string; saved: boolean; status?: number }, i: number) => ({
          ...r,
          id: r.id || batch[i]?.id,
        }),
      );
      const removed = new Set(
        results.filter((r) => r.saved || [401, 403, 409].includes(r.status || 0)).map((r) => r.id),
      );
      const next = filteredQueue(read<Pending[]>(QUEUE, []).filter((p) => !removed.has(p.id)));
      write(QUEUE, next);
      setPending(next.length);
      setStatus(
        next.length
          ? `Còn ${next.length} lượt chưa được xác nhận lưu.`
          : results.every((r) => r.saved)
            ? 'Google Sheets đã xác nhận các lượt gửi lại.'
            : 'Một số lượt đã hết quyền ghi; không gửi lại các lượt đó.',
      );
    } catch {
      setStatus('Kết nối lưu trữ còn gián đoạn; em vẫn tiếp tục học được.');
    } finally {
      flushing.current = false;
    }
  }
  async function sync() {
    const pref = read<{ studentId?: string; consent?: boolean; stopPending?: boolean }>(PREF, {});
    if (!pref.studentId) return;
    setStudentId(pref.studentId);
    try {
      if (pref.stopPending) {
        await learningAPI('consent', { consent: false });
        remember(pref.studentId, false);
        setStatus('Máy chủ đã xác nhận ngừng ghi.');
        return;
      }
      const data = await learningAPI('status');
      remember(data.studentId, data.consent === true && pref.consent === true);
      setProfile(data.profile || null);
      setStatus(
        live.current
          ? 'Đã đọc hồ sơ tiến bộ; chỉ lưu các lượt học tiếp theo.'
          : 'Đang tắt ghi tiến bộ.',
      );
      if (live.current) await flush();
    } catch {
      live.current = false;
      setEnabled(false);
      setStatus('Chưa xác nhận được hồ sơ. Em có thể học và thử kết nối lại bộ nhớ sau.');
    }
  }
  useEffect(() => {
    try {
      sessionStorage.setItem('memory-session:' + scope, session.current);
    } catch {}
    void sync();
    const online = () => void sync();
    const storage = (event: StorageEvent) => {
      if (event.key === PREF) {
        epoch.current++;
        live.current = false;
        setEnabled(false);
        void sync();
      }
    };
    addEventListener('online', online);
    addEventListener('storage', storage);
    const timer = setInterval(() => {
      if (live.current) void flush();
      else if (read<{ stopPending?: boolean }>(PREF, {}).stopPending) void sync();
    }, 60000);
    return () => {
      clearInterval(timer);
      removeEventListener('online', online);
      removeEventListener('storage', storage);
    };
  }, []);
  async function activate(accessCode: string, guardianConfirmed: boolean) {
    if (!guardianConfirmed) throw Error('Em cần xác nhận lựa chọn đồng ý.');
    let data;
    if (studentId) {
      data = await learningAPI('consent', { consent: true, guardianConfirmed });
    } else {
      data = await learningAPI('enroll', { accessCode, consent: true, guardianConfirmed });
    }
    epoch.current++;
    remember(data.studentId, true);
    setStatus('Đã bật lưu tiến bộ từ thời điểm này.');
    return data.recovery as string | undefined;
  }
  async function stop() {
    epoch.current++;
    remember(studentId, false, true);
    write(QUEUE, []);
    setPending(0);
    setStatus('Đã tắt ghi trên thiết bị; đang xác nhận ngừng ghi với máy chủ.');
    try {
      await learningAPI('consent', { consent: false });
      remember(studentId, false);
      setStatus('Máy chủ đã xác nhận ngừng ghi.');
    } catch {
      setStatus(
        'Đã tắt trên thiết bị và xóa hàng chờ. Chưa xác nhận máy chủ; sẽ gửi yêu cầu ngừng ghi khi có mạng.',
      );
    }
  }
  async function restore(recovery: string) {
    const data = await learningAPI('restore', { recovery: recovery.trim() });
    epoch.current++;
    write(QUEUE, []);
    setPending(0);
    remember(data.studentId, data.consent);
    setProfile(data.profile);
    setStatus('Đã khôi phục hồ sơ theo mã riêng.');
  }
  async function forget() {
    await learningAPI('delete');
    epoch.current++;
    remember('', false);
    write(QUEUE, []);
    setPending(0);
    setProfile(null);
    setStatus('Máy chủ đã xác nhận xóa dữ liệu của mã học sinh này.');
  }
  async function logout() {
    await learningAPI('logout');
    epoch.current++;
    remember('', false);
    write(QUEUE, []);
    setPending(0);
    setProfile(null);
    setStatus('Đã rời hồ sơ trên thiết bị. Muốn học tiếp dùng mã khôi phục riêng.');
  }
  function accept(data: LearningReply | undefined, requestEpoch: number) {
    if (!data || epoch.current !== requestEpoch || !live.current) return;
    if (data.profile) setProfile(data.profile);
    if (data.eventId) setLastEvent(data.eventId);
    if (data.status === 'pending' && data.receipt && data.eventId) {
      const before = read<Pending[]>(QUEUE, []);
      const list = addPending(before, {
        id: data.eventId,
        receipt: data.receipt,
        at: Date.now(),
        attempts: 0,
      });
      if (!write(QUEUE, list)) {
        setStatus('Chưa lưu lên Sheets và không giữ được hàng chờ trên thiết bị.');
        return;
      }
      setPending(list.length);
      if (before.length >= 20) {
        setStatus(
          'Hàng chờ đã đầy; lượt cũ nhất không còn được gửi lại. Còn 20 lượt chưa xác nhận lưu.',
        );
        return;
      }
    }
    setStatus(data.message || (data.status === 'off' ? 'Lượt này không được ghi.' : ''));
  }
  return {
    enabled,
    studentId,
    profile:
      scope && profile
        ? {
            observedTurns: profile.scopes?.[scope]?.turns || 0,
            supportLevel: profile.scopes?.[scope]?.supportLevel ?? 2,
            skills: profile.scopes?.[scope]?.skills || {},
            repeatedErrors: profile.scopes?.[scope]?.errors || {},
            updatedAt: profile.scopes?.[scope]?.updatedAt || '',
          }
        : profile,
    scope,
    status,
    pending,
    lastEvent,
    activate,
    stop,
    restore,
    forget,
    logout,
    sync,
    flush,
    accept,
    sessionId: () => session.current,
    newSession: () => {
      session.current = crypto.randomUUID();
      try {
        sessionStorage.setItem('memory-session:' + scope, session.current);
      } catch {}
    },
    request: () => ({
      epoch: epoch.current,
      memory: live.current
        ? { enabled: true, sessionId: session.current, turnId: crypto.randomUUID() }
        : undefined,
    }),
  };
}
export type LearningMemory = ReturnType<typeof useLearningMemory>;
export function downloadJSON(data: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportStudentData() {
  const first = await learningAPI('export');
  const next: Record<string, number> = first.next || {};
  delete first.next;
  for (const [table, start] of Object.entries(next)) {
    let offset: number | null = start;
    while (offset !== null) {
      const page = await learningAPI('export', { table, offset });
      first[table].push(...page.rows);
      offset = page.nextOffset;
    }
  }
  return first;
}
