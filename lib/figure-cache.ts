import {
  renderScene,
  type GeometryScene,
  type SceneValidation,
} from '../public/geometry-scene.mjs';
export type SavedFigure = {
  latex: string;
  svg: string;
  scene?: GeometryScene;
  validation?: SceneValidation;
};
const validValidation = (value: unknown): value is SceneValidation => {
  const v = value as SceneValidation | undefined;
  return (
    !!v &&
    typeof v.notice === 'string' &&
    v.notice.length <= 1200 &&
    [v.checked, v.unverified].every(
      (list) =>
        Array.isArray(list) &&
        list.length <= 256 &&
        list.every((s) => typeof s === 'string' && s.length <= 1200),
    )
  );
};
const KEY = 'ai-tutor-figures-v6.4';
const memory = new Map<string, SavedFigure>();
const identity = (problem: string) => problem.normalize('NFC').trim().replace(/\s+/g, ' ');
export function readFigure(problem: string): SavedFigure | null {
  const key = identity(problem),
    cached = memory.get(key);
  if (cached) return cached;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw || raw.length > 1600000) return null;
    const value = JSON.parse(raw);
    if (
      value.version !== 1 ||
      !Number.isFinite(value.savedAt) ||
      Date.now() - value.savedAt > 12 * 60 * 60 * 1000 ||
      value.savedAt > Date.now() + 60000 ||
      !Array.isArray(value.entries)
    )
      return null;
    for (const entry of value.entries.slice(-3)) {
      if (!Array.isArray(entry) || typeof entry[0] !== 'string' || entry[0].length > 26000)
        continue;
      const saved = entry[1];
      if (
        typeof saved?.latex !== 'string' ||
        saved.latex.length > 26000 ||
        typeof saved.svg !== 'string' ||
        saved.svg.length > 700000 ||
        !saved.svg.includes('<svg')
      )
        continue;
      if (saved.scene) {
        try {
          const rendered = renderScene(saved.scene);
          memory.set(entry[0], {
            latex: rendered.latex,
            svg: rendered.svg,
            scene: rendered.scene,
            validation: validValidation(saved.validation) ? saved.validation : rendered.validation,
          });
        } catch {
          continue;
        }
      } else memory.set(entry[0], { latex: saved.latex, svg: saved.svg });
    }
    while (memory.size > 3) memory.delete(memory.keys().next().value!);
    return memory.get(key) || null;
  } catch {
    return null;
  }
}
export function saveFigure(problem: string, figure: SavedFigure) {
  const key = identity(problem);
  memory.delete(key);
  memory.set(key, figure);
  while (memory.size > 3) memory.delete(memory.keys().next().value!);
  try {
    const entries = [...memory].filter(([, v]) => v.svg.length <= 700000);
    while (entries.length && JSON.stringify(entries).length > 1500000) entries.shift();
    sessionStorage.setItem(KEY, JSON.stringify({ version: 1, savedAt: Date.now(), entries }));
  } catch {
    /* A full or disabled session store must not remove the displayed figure. */
  }
}
