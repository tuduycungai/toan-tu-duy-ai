import type {Profile} from './tutor';

export function participantLabel(profile: Pick<Profile, 'className'> | null): string {
  if (!profile) return 'Chưa có thông tin';
  const className = profile.className.trim();
  return className ? `Lớp: ${className}` : 'Giáo viên';
}

export function surveyComment({profile, comment, includeSummary, topic, mode, checkpoints}: {
  profile: Profile;
  comment: string;
  includeSummary: boolean;
  topic: string;
  mode: string;
  checkpoints: string[];
}): string {
  // The existing Google Form has five fields. Participant information belongs
  // in its comment field, even when the optional learning summary is omitted.
  const parts = [comment.trim(), `[Người tham gia]\n${participantLabel(profile)}`].filter(Boolean);
  if (includeSummary) {
    const learning = profile.className.trim()
      ? `Khối 8; mức độ tự khai: ${profile.level}.\nMục tiêu: ${profile.goal}.\nTự kiểm tra: ${checkpoints.join('; ') || 'Chưa đánh dấu'}.`
      : 'Nội dung tham khảo: Hình học tứ giác lớp 8.';
    parts.push(`[Thông tin sử dụng]\nChủ đề: ${topic}; chế độ: ${mode}.\n${learning}`);
  }
  return parts.join('\n\n');
}
