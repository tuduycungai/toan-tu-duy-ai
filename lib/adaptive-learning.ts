export const learnerLevels = ['Mất căn bản', 'Cơ bản', 'Khá', 'Giỏi'] as const;
export type LearnerLevel = (typeof learnerLevels)[number];
export type Skill =
  | 'Đọc giả thiết và kết luận'
  | 'Nhận dạng hình'
  | 'Nhớ định nghĩa, tính chất'
  | 'Suy luận và trình bày';
export const thinkingOperations = [
  'Phân tích',
  'Tổng hợp',
  'So sánh',
  'Cụ thể hóa',
  'Trừu tượng hóa',
  'Khái quát hóa',
  'Suy luận',
  'Phát hiện quan hệ',
  'Hình thành giả thuyết',
  'Kiểm tra và phản biện lập luận',
  'Chứng minh và giải thích',
  'Tương tự hóa',
] as const;
export type ThinkingQuestion = {
  question: string;
  thinkingOperation: string;
  learningObjective: string;
  evidence: string;
  supportLevel: number;
  expectedStudentAction: string;
  nextStep: string;
  hintPolicy: 'Không đưa đáp án trực tiếp';
};
export type DiagnosticResult = {
  id: string;
  skill: Skill;
  correct: boolean;
  answer: number;
  explanation: string;
  at: string;
};
export type Observation = {
  id: string;
  operation: string;
  evidence: string;
  missing: string;
  needsSupport: boolean;
  verified: false;
  at: string;
};
export type LearnerState = {
  version: 5;
  grade: string;
  confidence: number;
  foundation: string;
  level: LearnerLevel;
  manualLevel: boolean;
  supportLevel: number;
  diagnostics: DiagnosticResult[];
  observations: Observation[];
  questions: ThinkingQuestion[];
};
export const diagnostics: {
  id: string;
  skill: Skill;
  question: string;
  options: string[];
  correct: number;
  reason: string;
}[] = [
  {
    id: 'givens',
    skill: 'Đọc giả thiết và kết luận',
    question: 'Cho M là trung điểm AB. Cần chứng minh CM = DM. Dòng nào là giả thiết?',
    options: ['M là trung điểm AB', 'CM = DM', 'C là trung điểm DM'],
    correct: 0,
    reason: 'Giả thiết là điều được cho; CM = DM là kết luận cần lập luận.',
  },
  {
    id: 'midpoint',
    skill: 'Nhớ định nghĩa, tính chất',
    question: 'Muốn khẳng định M là trung điểm AB, cần điều kiện nào?',
    options: ['Chỉ cần MA = MB', 'M thuộc đoạn AB và MA = MB', 'M thuộc đường thẳng AB'],
    correct: 1,
    reason: 'Cần đồng thời vị trí trên đoạn và hai khoảng cách bằng nhau.',
  },
  {
    id: 'shape',
    skill: 'Nhận dạng hình',
    question: 'Hình bình hành có thêm một góc vuông thì nhận biết được hình gì?',
    options: ['Luôn là hình vuông', 'Luôn là hình thoi', 'Hình chữ nhật'],
    correct: 2,
    reason:
      'Một góc vuông trong hình bình hành đủ nhận biết hình chữ nhật; chưa đủ để có bốn cạnh bằng nhau.',
  },
  {
    id: 'reasoning',
    skill: 'Suy luận và trình bày',
    question: 'Tứ giác có hai đường chéo vuông góc. Có đủ để kết luận hình thoi không?',
    options: [
      'Đủ, vì hình trông như hình thoi',
      'Chưa đủ; cần thêm điều kiện, chẳng hạn tứ giác là hình bình hành',
      'Đủ nếu vẽ hai đường chéo cùng màu',
    ],
    correct: 1,
    reason: 'Dấu hiệu đường chéo vuông góc dùng cho hình bình hành, không dùng cho tứ giác bất kỳ.',
  },
];
export function normalizeLevel(level: string): LearnerLevel {
  return level === 'Mất gốc'
    ? 'Mất căn bản'
    : level === 'Học sinh năng khiếu'
      ? 'Giỏi'
      : learnerLevels.includes(level as LearnerLevel)
        ? (level as LearnerLevel)
        : 'Cơ bản';
}
export function createLearnerState(level = 'Cơ bản'): LearnerState {
  return {
    version: 5,
    grade: '8',
    confidence: 3,
    foundation: 'Cần ôn một số định nghĩa',
    level: normalizeLevel(level),
    manualLevel: false,
    supportLevel: /Mất/.test(level) ? 3 : /Giỏi|năng khiếu/.test(level) ? 0 : 1,
    diagnostics: [],
    observations: [],
    questions: [],
  };
}
export function suggestedLevel(state: LearnerState): LearnerLevel | null {
  const unique = [...new Map(state.diagnostics.map((d) => [d.id, d])).values()];
  if (unique.length < 4 || new Set(unique.map((d) => d.skill)).size < 4) return null;
  const correct = unique.filter((d) => d.correct).length;
  return correct <= 1 ? 'Mất căn bản' : correct === 2 ? 'Cơ bản' : correct === 3 ? 'Khá' : 'Giỏi';
}
export function recordDiagnostic(
  state: LearnerState,
  id: string,
  answer: number,
  explanation: string,
): LearnerState {
  const q = diagnostics.find((d) => d.id === id);
  if (!q || !Number.isInteger(answer) || !q.options[answer] || explanation.trim().length < 3)
    return state;
  const next = {
    ...state,
    diagnostics: [
      ...state.diagnostics.filter((d) => d.id !== id),
      {
        id,
        skill: q.skill,
        correct: q.correct === answer,
        answer,
        explanation: explanation.trim().slice(0, 700),
        at: new Date().toISOString(),
      },
    ],
  };
  const suggested = suggestedLevel(next);
  if (suggested && !state.manualLevel) {
    next.level = suggested;
    next.supportLevel =
      suggested === 'Mất căn bản' ? 3 : suggested === 'Cơ bản' ? 2 : suggested === 'Khá' ? 1 : 0;
  }
  return next;
}
export function setLearnerLevel(state: LearnerState, level: string): LearnerState {
  const value = normalizeLevel(level);
  return {
    ...state,
    level: value,
    manualLevel: true,
    supportLevel: value === 'Mất căn bản' ? 3 : value === 'Cơ bản' ? 2 : value === 'Khá' ? 1 : 0,
  };
}
export function observeAnswer(
  state: LearnerState,
  text: string,
  isNewProblem = false,
): LearnerState {
  if (isNewProblem || !text.trim()) return state;
  const t = text.normalize('NFC'),
    needsSupport = /chưa (?:biết|hiểu)|không (?:biết|hiểu)|gợi ý|giúp em|bế tắc/iu.test(t),
    explains = /vì|bởi|theo (?:định|tính|giả)|do đó|suy ra/iu.test(t);
  const operation = /nếu|tổng quát|mọi|tỉ số/iu.test(t)
    ? 'Khái quát hóa'
    : /so sánh|giống|khác/iu.test(t)
      ? 'So sánh'
      : /phản ví dụ|không đủ|điều kiện/iu.test(t)
        ? 'Kiểm tra và phản biện lập luận'
        : /suy ra|do đó/iu.test(t)
          ? 'Tổng hợp'
          : 'Phân tích';
  const observation: Observation = {
    id: crypto.randomUUID(),
    operation,
    evidence: t.slice(0, 500),
    missing: needsSupport
      ? 'Học sinh đang yêu cầu hỗ trợ.'
      : explains
        ? 'Có nêu căn cứ bằng lời; cần kiểm tra tính đúng của quan hệ và định lý.'
        : 'Chưa thấy căn cứ được viết rõ; cần hỏi lời giải thích.',
    needsSupport,
    verified: false,
    at: new Date().toISOString(),
  };
  const recent = state.observations.slice(-2),
    repeatedNeed = needsSupport && recent.some((o) => o.needsSupport);
  const sustainedExplanation =
    explains &&
    !needsSupport &&
    recent.length === 2 &&
    recent.every((o) => !o.needsSupport && /căn cứ bằng lời/.test(o.missing));
  return {
    ...state,
    supportLevel: Math.max(
      0,
      Math.min(3, state.supportLevel + (repeatedNeed ? 1 : sustainedExplanation ? -1 : 0)),
    ),
    observations: [...state.observations, observation].slice(-40),
  };
}
export function planThinkingQuestion(
  problem: string,
  state: LearnerState,
  fresh = false,
): ThinkingQuestion {
  const goal =
      problem.match(/(?:chứng minh(?: rằng)?|cmr|tính)\s*:?\s*(.+)/iu)?.[1]?.slice(0, 240) ||
      'mục tiêu của bài',
    mid = problem.match(/([A-Z])\s+(?:là\s+)?trung điểm(?: của)?\s+([A-Z]{2})/u);
  const last = fresh ? undefined : state.observations.at(-1);
  let operation = 'Phân tích',
    question = 'Đề bài cho những dữ kiện nào và yêu cầu em tìm điều gì?',
    expected = 'Tách đúng giả thiết và kết luận.';
  if (state.supportLevel >= 2) {
    question = mid
      ? `Để giải thích ${mid[1]} là trung điểm ${mid[2]}, em cần nêu những điều kiện nào?`
      : 'Đề bài cho hình gì, và dấu hiệu nào giúp em nhận ra hình đó?';
    expected = 'Nêu một định nghĩa và đối chiếu với một dữ kiện.';
  } else if (state.level === 'Giỏi' || state.level === 'Khá') {
    question = `Với mục tiêu ${goal.replace(/[.?!]+$/, '')}, em chọn điều kiện đủ nào và vì sao?`;
    expected = 'Tự chọn chiến lược, giải thích điều kiện đủ.';
  } else {
    question = `Muốn đạt mục tiêu ${goal.replace(/[.?!]+$/, '')}, em có thể bắt đầu từ dữ kiện nào và vì sao?`;
    expected = 'Liên hệ một dữ kiện với mục tiêu.';
  }
  if (last && !last.needsSupport) {
    operation =
      last.operation === 'Tổng hợp' ? 'Kiểm tra và phản biện lập luận' : 'Phát hiện quan hệ';
    question = 'Trong bước em vừa viết, điều kiện nào của định lý đã được bảo đảm bởi giả thiết?';
    expected = 'Nêu định lý, điều kiện và căn cứ của bước vừa làm.';
  }
  return {
    question,
    thinkingOperation: operation,
    learningObjective: 'Kết nối dữ kiện với điều kiện đủ; tự giải thích thay vì đoán theo hình.',
    evidence:
      last?.evidence || 'Hồ sơ ban đầu và giả thiết của bài; chưa có bài làm để xác nhận năng lực.',
    supportLevel: state.supportLevel,
    expectedStudentAction: expected,
    nextStep: 'Chờ học sinh trả lời, kiểm tra một mắt xích rồi điều chỉnh hỗ trợ.',
    hintPolicy: 'Không đưa đáp án trực tiếp',
  };
}
export function questionFromReply(text: string, planned: ThinkingQuestion): ThinkingQuestion {
  const lines = text
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean),
    question = lines.filter((s) => s.includes('?')).at(-1);
  const operation = thinkingOperations.find(
    (op) => text.includes('Thao tác tư duy: ' + op) || text.includes('Thao tác tư duy: **' + op),
  );
  return {
    ...planned,
    question: question?.slice(0, 1600) || '',
    thinkingOperation: operation || planned.thinkingOperation,
  };
}
export function learnerContext(state: LearnerState, question: ThinkingQuestion) {
  return (
    '\n[HO_SO_TU_DUY_V5]\n' +
    JSON.stringify({
      version: 5,
      grade: state.grade,
      level: state.level,
      confidence: state.confidence,
      foundation: state.foundation,
      supportLevel: state.supportLevel,
      diagnostics: state.diagnostics.map((d) => ({ skill: d.skill, correct: d.correct })),
      lastObservation: state.observations.at(-1),
      question,
    }) +
    '\n[/HO_SO_TU_DUY_V5]'
  );
}
export function readLearnerState(level = 'Cơ bản'): LearnerState {
  try {
    const s = JSON.parse(localStorage.getItem('ai-tutor-learner-v5') || 'null');
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
