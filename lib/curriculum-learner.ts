import {
  createLearnerState,
  learnerLevels,
  diagnostics,
  type LearnerState,
  type DiagnosticResult,
} from './adaptive-learning';
export function readCurriculumLearner(level = 'Cơ bản', scope = ''): LearnerState {
  try {
    const s = JSON.parse(
      localStorage.getItem('ai-tutor-learner-v5' + (scope ? ':' + scope : '')) || 'null',
    );
    if (
      s?.version !== 5 ||
      !learnerLevels.includes(s.level) ||
      !Array.isArray(s.diagnostics) ||
      !Array.isArray(s.observations) ||
      !Array.isArray(s.questions)
    )
      return createLearnerState(level);
    return {
      ...createLearnerState(level),
      ...s,
      supportLevel: Math.max(0, Math.min(3, Number(s.supportLevel) || 0)),
      diagnostics: s.diagnostics
        .filter((d: DiagnosticResult) =>
          diagnostics.some(
            (q) => q.id === d.id && q.skill === d.skill && (q.correct === d.answer) === d.correct,
          ),
        )
        .slice(-4),
      observations: s.observations.slice(-40),
      questions: s.questions.slice(-40),
    };
  } catch {
    return createLearnerState(level);
  }
}
