import type { Message } from './tutor';
export const SESSION_KEY = 'ai-tutor-session-v6.2';
export type TutorProgress = {
  stage: number;
  title: string;
  hintLevel: number;
  proven: string[];
  path: string;
};
type Snapshot = {
  tutorToken?: string;
  progress?: TutorProgress;
  messages: Message[];
  wire: Message[];
  input: string;
  problem: string;
  mode: string;
};
const empty = (): Snapshot => ({ messages: [], wire: [], input: '', problem: '', mode: 'guide' });
export function readSession(): Snapshot {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw || raw.length > 500000) return empty();
    const s = JSON.parse(raw);
    if (
      s.version !== 1 ||
      !Number.isFinite(s.savedAt) ||
      s.savedAt > Date.now() + 60000 ||
      Date.now() - s.savedAt > 12 * 60 * 60 * 1000
    )
      return empty();
    const valid = (a: unknown): a is Message[] =>
      Array.isArray(a) &&
      a.length <= 40 &&
      a.every(
        (m) =>
          m &&
          ['user', 'assistant'].includes(m.role) &&
          typeof m.content === 'string' &&
          m.content.length <= 16000,
      );
    if (!valid(s.messages) || !valid(s.wire)) return empty();
    const adaptive =
      typeof s.tutorToken === 'string' && s.tutorToken.length <= 110000
        ? {
            tutorToken: s.tutorToken,
            ...(s.progress &&
            Number.isInteger(s.progress.stage) &&
            s.progress.stage >= 1 &&
            s.progress.stage <= 8 &&
            typeof s.progress.title === 'string' &&
            Array.isArray(s.progress.proven)
              ? { progress: s.progress }
              : {}),
          }
        : {};
    return {
      ...adaptive,
      messages: s.messages,
      wire: s.wire,
      input: typeof s.input === 'string' ? s.input.slice(0, 6000) : '',
      problem: typeof s.problem === 'string' ? s.problem.slice(0, 6000) : '',
      mode: ['guide', 'review', 'compare', 'practice', 'test'].includes(s.mode) ? s.mode : 'guide',
    };
  } catch {
    return empty();
  }
}
export function saveSession(s: Snapshot) {
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        ...s,
        messages: s.messages.slice(-40),
        wire: s.wire.slice(-40),
        version: 1,
        savedAt: Date.now(),
      }),
    );
  } catch {}
}
