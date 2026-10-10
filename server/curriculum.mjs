import content from './curriculum-content.json' with { type: 'json' };
import { checkEqualities, numerical, checkGeometryAnswer } from './curriculum-checks.mjs';
export const curriculum = content;
export function resolveCurriculum(body) {
  const chapterId = body.chapterId === undefined ? 'c3' : body.chapterId;
  const chapter = content.chapters.find((c) => c.id === chapterId);
  const lessonId = body.lessonId === undefined ? chapter?.units[0] : body.lessonId;
  const lesson = content.lessons.find((l) => l.id === lessonId && l.chapterId === chapterId);
  if (!chapter || !lesson)
    throw Object.assign(Error('Mã chương hoặc bài học không hợp lệ.'), { status: 400 });
  if (
    body.problemId &&
    !content.exercises.some(
      (e) =>
        e.id === body.problemId &&
        e.chapterId === chapterId &&
        (e.lessonId === lesson.id || lesson.lessonIds?.includes(e.lessonId)),
    )
  )
    throw Object.assign(Error('Bài tập không thuộc bài học đã chọn.'), { status: 400 });
  return { chapterId, lessonId, chapter, lesson };
}
export function sampleFor(problem) {
  return content.exercises.find((e) => String(problem || '').includes(e.problem));
}
export const GENERAL_STAGES = [
  'Đọc và hiểu đề',
  'Tách dữ kiện, điều kiện và yêu cầu',
  'Phân tích mục tiêu, tìm hướng giải',
  'Chọn kiến thức, quy tắc hoặc định lí',
  'Kết nối dữ kiện với hướng giải',
  'Tự thực hiện từng bước',
  'Tổng hợp lời giải',
  'Tự kiểm tra và rút kinh nghiệm',
];
export function curriculumInstructions(context, problem, student = '') {
  const { chapter, lesson } = context,
    sample = sampleFor(problem);
  const math = checkEqualities(student);
  const geometryCheck = chapter.id === 'c4' ? checkGeometryAnswer(problem, student) : null;
  return `\nPHẠM VI CHÍNH THỨC: Toán 8 tập 1, Chương ${chapter.roman}: ${chapter.title}; ${lesson.number ? 'Bài ' + lesson.number + '. ' : ''}${lesson.title}.
Mục tiêu: ${lesson.objectives.join('; ')}. Kiến thức trọng tâm: ${lesson.theory.join('\n')}.
Kiến thức tiên quyết: ${lesson.prerequisites.join('; ')}. Lỗi cần kiểm tra: ${lesson.errors.join('; ')}.
Tám giai đoạn cho nội dung này: ${GENERAL_STAGES.join('; ')}. Trong đại số dùng dữ kiện, biểu thức, biến đổi; trong thống kê dùng dữ liệu, đơn vị, nhận xét. Không ép mọi bài thành chứng minh hình học.
Kiểm tra đúng/sai trên toàn bộ giả thiết và cách làm thực tế. Chấp nhận các biểu thức tương đương, thứ tự nhân tử khác nhau và cách giải có căn cứ khác mẫu. Không coi kết quả số đúng là chứng minh học sinh hiểu. Không lấy đề ban đầu làm bằng chứng. Không coi dạ, đúng rồi, tiếp tục là bằng chứng hiểu.
Mỗi lượt chỉ một câu hỏi trọng tâm. Không xuất đáp án hoặc toàn bộ lời giải trong feedback, question, goal, bridge hay givens. Kiến thức thuộc tập 2 hoặc mở rộng phải ghi rõ, không dùng mặc định. Nội dung ngoài chương: báo chương phù hợp nhưng tiếp tục giữ phiên. Bài liên chương: ưu tiên chương hiện tại, nhận diện kỹ năng phụ.
Đại số: kiểm tra hệ số và phần biến, bậc sau thu gọn, các hạng tử đồng dạng, phép chia hết từng hạng tử cho đơn thức khác 0. Hằng đẳng thức: kiểm tra dấu và hệ số bằng khai triển ngược. Không kiểm chứng đồng nhất thức chỉ bằng vài giá trị số.
Thalès: cần điểm trên đúng hai cạnh và song song; cùng đơn vị và đúng các đoạn tương ứng. Trung điểm phải có quan hệ thuộc đoạn. Phân giác cần điều kiện chia góc và tỉ số BD/DC=AB/AC; kiểm tra bất đẳng thức tam giác. Không suy điều kiện từ dáng hình.
Thống kê: phân biệt định tính/định lượng, rời rạc/liên tục; không đoán số liệu thiếu. Kiểm tra tổng, đơn vị, phần trăm và trục; kết luận không vượt phạm vi mẫu. Đề ảnh chỉ dùng văn bản và số liệu người học xác nhận.
${sample ? 'ĐỐI CHIẾU NỘI BỘ, TUYỆT ĐỐI KHÔNG HIỂN THỊ SỚM: ' + JSON.stringify({ id: sample.id, answer: sample.answer, rubric: sample.rubric, hints: sample.hints }) : ''}
${geometryCheck?.facts.supported ? 'Đối chiếu đoạn thẳng nội bộ (không chép kết quả cho học sinh): ' + JSON.stringify(geometryCheck) : ''}
${math.length ? 'Kết quả bộ kiểm tra đa thức (chỉ đúng trong cú pháp được hỗ trợ, không thay đánh giá lập luận): ' + JSON.stringify(math) : ''}\n`;
}
export function validateMathTurn(context, student, value, previous) {
  const meaningful =
    !/^(?:dạ|vâng|đúng rồi|hiểu rồi|tiếp tục|ok|có)[.!\s]*$/iu.test(student.trim()) &&
    student.trim().length >= 4;
  if (!meaningful || previous.turn === 0) {
    value.accepted = [];
    value.coveredGoals = [];
    value.proofComplete = false;
    value.selfCheckPassed = false;
    if (!meaningful) value.classification = 'vague';
  }
  if (['c1', 'c2', 'c4', 'c5'].includes(context.chapterId)) {
    const equations = checkEqualities(student);
    if (
      equations.some((e) => !e.equal) &&
      !/sai|không|nhầm|phản ví dụ/iu.test(student) &&
      ['correct_complete', 'alternative_path'].includes(value.classification)
    )
      throw Error(
        'Có đẳng thức đa thức sai; cần kiểm tra ngữ cảnh và gợi học sinh sửa, không nhận đúng toàn bộ.',
      );
    if (
      checkEqualities(value.feedback).some((e) => !e.equal) &&
      !/sai|không|chưa|nhầm|kiểm tra/iu.test(value.feedback)
    )
      throw Error('Nhận xét chứa đẳng thức chưa đúng.');
  }
  if (
    context.chapterId === 'c4' &&
    ['correct_complete', 'alternative_path'].includes(value.classification) &&
    !/sai|không|nhầm|phản ví dụ/iu.test(student) &&
    checkGeometryAnswer(previous.problem, student).incorrect.length
  )
    throw Error('Kết quả đoạn thẳng chưa đúng theo giả thiết; hỏi học sinh kiểm tra tỉ lệ.');
  const sample = sampleFor(previous.problem);
  if (
    previous.turn > 0 &&
    sample?.verification?.kind === 'number' &&
    ['correct_complete', 'alternative_path'].includes(value.classification)
  ) {
    const bare = student.trim().match(/^(-?[0-9.,+*/() -]+)\s*(?:cm|mm|m|%|quyển|độ)?[.!]?$/u);
    if (bare) {
      let n;
      try {
        n = numerical(bare[1]);
      } catch {}
      if (n !== undefined && Math.abs(n - sample.verification.value) > 1e-8)
        throw Error('Kết quả số chưa khớp dữ kiện; cần hỏi lại cách tính, không ghi nhận đúng.');
    }
  }
  if (sample && !previous.proofComplete) {
    const normalize = (s) =>
      String(s || '')
        .normalize('NFC')
        .toLowerCase()
        .replace(/[\s$.,;:]/g, '');
    const fields = ['feedback', 'question', 'goal', 'bridge', 'givens', 'summary']
      .map((k) => value[k] || '')
      .join(' ');
    const already = normalize(student + ' ' + previous.conclusions.map((c) => c.claim).join(' '));
    const keys = [sample.answer, ...(sample.answer.match(/\$([^$]+)\$/g) || [])]
      .map(normalize)
      .filter((k) => k.length >= 5);
    if (keys.some((k) => normalize(fields).includes(k) && !already.includes(k)))
      throw Error(
        'Đáp án nội bộ xuất hiện trước bằng chứng học sinh; chỉ gợi một bước chưa giải sẵn.',
      );
  }
  return value;
}
export function curriculumExerciseSet(context, count = 5, topic = '') {
  const ids = context.lesson.lessonIds || [context.lessonId];
  const topicLesson = content.lessons.find(
    (l) => l.chapterId === context.chapterId && topic.includes(l.title),
  );
  const subset = content.exercises.filter(
    (e) =>
      e.chapterId === context.chapterId &&
      (topicLesson ? e.lessonId === topicLesson.id : ids.includes(e.lessonId)),
  );
  const extras = content.exercises.filter(
    (e) => e.chapterId === context.chapterId && !subset.includes(e),
  );
  const selected = [...subset, ...extras].slice(0, Math.min(10, Math.max(1, count)));
  return {
    text:
      selected.map((e, i) => `Câu ${i + 1}. ${e.problem}`).join('\n\n') +
      '\n\nEm muốn bắt đầu câu nào?',
    exercises: selected.map((e) => ({ id: e.id, lessonId: e.lessonId })),
  };
}
