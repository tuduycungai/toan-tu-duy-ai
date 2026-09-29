export type Profile = {
  name: string;
  email: string;
  className: string;
  school: string;
  grade: string;
  subject: string;
  teacher: string;
  average: string;
  level: string;
  difficulties: string[];
  goal: string;
};
export const emptyProfile: Profile = {
  name: '',
  email: '',
  className: '',
  school: '',
  grade: '8',
  subject: 'Toán',
  teacher: '',
  average: '',
  level: 'Cơ bản',
  difficulties: [],
  goal: 'Cải thiện điểm số',
};
export const levels = ['Mất căn bản', 'Mất gốc', 'Cơ bản', 'Khá', 'Giỏi', 'Học sinh năng khiếu'];
export const topics = ['Đại số', 'Hình học', 'Phương trình', 'Hàm số', 'Xác suất', 'Bất đẳng thức'];
export const modes = [
  {
    id: 'quick',
    api: 'guide',
    title: 'Hỏi bài nhanh',
    desc: 'Hiểu cách giải, nắm ý chính',
    icon: '⚡',
  },
  {
    id: 'personal',
    api: 'guide',
    title: 'Gia sư cá nhân',
    desc: 'Gợi mở từng bước theo sức học',
    icon: '✦',
  },
  {
    id: 'daily',
    api: 'guide',
    title: 'Luyện tập mỗi ngày',
    desc: '5–10 câu để tiến bộ mỗi ngày',
    icon: '✎',
  },
  {
    id: 'test',
    api: 'guide',
    title: 'Kiểm tra kiến thức',
    desc: 'Tự làm trước, kiểm tra sau',
    icon: '✓',
  },
  {
    id: 'errors',
    api: 'review',
    title: 'Phân tích lỗi sai',
    desc: 'Tìm lỗi, hiểu vì sao, biết cách sửa',
    icon: '⌕',
  },
  {
    id: 'compare',
    api: 'compare',
    title: 'So sánh cách giải',
    desc: 'Nhìn bài toán từ nhiều hướng',
    icon: '⇄',
  },
];
export type Message = { role: 'user' | 'assistant'; content: string };
export function context(p: Profile, mode: string) {
  return (
    '[Bối cảnh học tập tự khai] ' +
    JSON.stringify({
      khoi: p.grade || '8',
      mon: 'Hình học THCS, trọng tâm tứ giác lớp 8',
      mucDo: p.level,
      diem: p.average,
      khoKhan: p.difficulties,
      mucTieu: p.goal,
      cheDo: modes.find((m) => m.id === mode)?.title || mode,
    }) +
    '\n[Yêu cầu học sinh]\n'
  );
}
export function requestMessages(
  history: Message[],
  text: string,
  p: Profile,
  mode: string,
): Message[] {
  const content = context(p, mode) + text;
  if (content.length > 12000) throw Error('Nội dung quá dài. Hãy rút gọn bài toán.');
  let kept = history.slice(-36);
  while (kept.length && kept.reduce((n, m) => n + m.content.length, 0) + content.length > 60000)
    kept = kept.slice(2);
  return [...kept, { role: 'user', content }];
}
export function readProfile(): Profile | null {
  try {
    const p = JSON.parse(localStorage.getItem('ai-tutor-profile-v1') || 'null');
    if (!p || !levels.includes(p.level) || !Array.isArray(p.difficulties)) return null;
    return { ...emptyProfile, ...p };
  } catch {
    return null;
  }
}
