import data from './curriculum.json';
import legacy from './legacy-curriculum.json';
export function legacyFor(id: string) {
  return legacy.find((e) => e.id === id);
}
export type ChartData = {
  labels: string[];
  values: number[];
  unit: string;
  label: string;
  second?: number[];
  series?: string[];
  percent?: boolean;
  positions?: number[];
};
export type Unit = {
  id: string;
  number?: number;
  chapterId: string;
  title: string;
  kind: string;
  pages: number[];
  objectives: string[];
  prerequisites: string[];
  theory: string[];
  skills: string[];
  errors: string[];
  questions: string[];
  lessonIds?: string[];
};
export type Chapter = {
  id: string;
  roman: string;
  title: string;
  description: string;
  kind: string;
  units: string[];
};
export type Exercise = {
  id: string;
  chapterId: string;
  lessonId: string;
  skillId: string;
  skills: string[];
  level: string;
  objective: string;
  problem: string;
  source: string;
  chart?: ChartData;
};
export const chapters: Chapter[] = data.chapters;
export const units: Unit[] = data.lessons;
export const exercises: Exercise[] = data.exercises;
export const title = 'TƯ DUY TOÁN HỌC 8';
export const tagline = 'Học chủ động cùng AI – Mỗi bài toán là một hành trình khám phá.';
export function unitLabel(unit: Unit) {
  return (unit.number ? `Bài ${unit.number}. ` : '') + unit.title;
}
export function exercisesFor(unit: Unit) {
  return exercises.filter((e) => (unit.lessonIds || [unit.id]).includes(e.lessonId));
}
export function findExercise(problem: string) {
  return exercises.find((e) => problem.includes(e.problem));
}
export function routeContext(search = location.search) {
  const q = new URLSearchParams(search),
    chapter = chapters.find((c) => c.id === q.get('chapter'));
  if (!chapter) return null;
  const unit =
    units.find((u) => u.id === q.get('lesson') && u.chapterId === chapter.id) ||
    units.find((u) => u.id === chapter.units[0])!;
  return { chapter, unit };
}
export function suggestChapter(problem: string): string | null {
  if (/dữ liệu|biểu đồ|thống kê|khảo sát|tần số|số liệu/i.test(problem)) return 'c5';
  if (/thal[eè]s|đường trung bình|phân giác.*tam giác|tam giác.*phân giác/i.test(problem))
    return 'c4';
  if (
    /tứ giác|hình (?:thang|bình hành|chữ nhật|thoi|vuông)/i.test(problem) &&
    !/đa thức|khai triển|đơn thức|biểu thức|hằng đẳng thức/.test(problem)
  )
    return 'c3';
  if (/hằng đẳng thức|phân tích.*nhân tử|lập phương|hiệu hai bình phương/i.test(problem))
    return 'c2';
  if (/đa thức|đơn thức|thu gọn|hệ số|đồng dạng/i.test(problem)) return 'c1';
  return null;
}
