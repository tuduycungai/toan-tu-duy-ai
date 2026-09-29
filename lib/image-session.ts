const KEY = 'ai-tutor-image-v6.2.4';
type ImageSnapshot = { transcription: string; imageToken: string };
export function readImageSession(): ImageSnapshot | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw || raw.length > 130000) return null;
    const s = JSON.parse(raw);
    if (
      s.version !== 1 ||
      !Number.isFinite(s.savedAt) ||
      Date.now() - s.savedAt > 12 * 3600000 ||
      s.savedAt > Date.now() + 60000 ||
      typeof s.transcription !== 'string' ||
      s.transcription.length > 6000 ||
      typeof s.imageToken !== 'string' ||
      s.imageToken.length > 110000 ||
      !s.imageToken.includes('.')
    )
      return null;
    return { transcription: s.transcription, imageToken: s.imageToken };
  } catch {
    return null;
  }
}
export function saveImageSession(s: ImageSnapshot) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...s, version: 1, savedAt: Date.now() }));
  } catch {}
}
export function clearImageSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
