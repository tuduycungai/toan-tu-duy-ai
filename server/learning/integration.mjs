import { studentRequest } from '../strict-tutor.mjs';
import {
  RULE_VERSION,
  cleanText,
  unsafeContent,
  skillFor,
  learningContext,
  ERRORS,
} from './domain.mjs';
import { configured, cookies, learnerAuth, digest, sign, sameOrigin } from './security.mjs';
import { gateway } from './gateway.mjs';
export async function prepareMemory(body, request, env, fetcher = fetch) {
  if (body.memory?.enabled !== true || !request) return { status: 'off', context: '' };
  if (!configured(env))
    return {
      status: 'unavailable',
      context: '',
      message: 'Chưa kết nối Google Sheets; lượt này không được ghi.',
    };
  try {
    sameOrigin(request);
    if (!/^[\w-]{16,80}$/.test(body.memory.sessionId) || !/^[\w-]{16,80}$/.test(body.memory.turnId))
      throw Error('Mã phiên chưa hợp lệ.');
    const auth = learnerAuth(cookies(request).tutor_learner);
    const data = await gateway(env, 'context', auth, fetcher);
    return {
      status: 'ready',
      auth,
      data,
      sessionId: body.memory.sessionId,
      turnId: body.memory.turnId,
      context: learningContext(data.profile, data.version, skillFor(body.problem)),
    };
  } catch (e) {
    return {
      status: e.status === 403 ? 'off' : 'unavailable',
      context: '',
      message: 'Chưa đọc được hồ sơ đã lưu; lượt này học với ngữ cảnh hiện có và không được ghi.',
    };
  }
}
export async function recordMemory(memory, body, previous, result, env, fetcher = fetch) {
  if (memory.status !== 'ready') return { status: memory.status, message: memory.message };
  const student = studentRequest(body.messages),
    state = result.state;
  const excluded =
    unsafeContent(student) || ['off_topic', 'answer_request'].includes(state.classification);
  // The first exchange is the problem statement, not an assessed answer.
  if (previous.turn === 0 || excluded)
    return {
      status: 'skipped',
      message:
        previous.turn === 0
          ? 'Đã đọc hồ sơ; đề mở đầu không được tính là câu trả lời đã hiểu.'
          : 'Không lưu nội dung ngoài phạm vi học hoặc yêu cầu phá quy tắc.',
    };
  const evidence =
    ['correct_complete', 'alternative_path'].includes(state.classification) &&
    state.conclusions.some((c) => c.turn === state.turn);
  const answer = cleanText(student, 1600);
  const question = cleanText(previous.questions.at(-1), 700);
  const event = {
    id:
      't_' +
      digest(memory.auth.studentId + ':' + memory.sessionId + ':' + memory.turnId).slice(0, 48),
    studentId: memory.auth.studentId,
    sessionId: memory.sessionId,
    problemId: 'p_' + digest(previous.problem).slice(0, 24),
    updatedAt: new Date().toISOString(),
    stage: previous.stage,
    nextStage: state.stage,
    skill: previous.stage <= 2 ? 'reading' : skillFor(previous.problem),
    question,
    answer,
    verdict: state.classification.startsWith('wrong_')
      ? 'incorrect'
      : evidence
        ? 'correct'
        : 'uncertain',
    classification: state.classification,
    errorKind: ERRORS.includes(state.classification) ? state.classification : '',
    hintLevel: previous.hintLevel,
    nextHintLevel: state.hintLevel,
    nextAction: state.classification.startsWith('wrong_') ? 'repair_first_error' : 'ask_next_step',
    nextQuestion: cleanText(state.questions.at(-1), 700),
    evidence,
    answerHash: digest(answer),
    ruleVersion: RULE_VERSION,
    exampleVersion: memory.data.version?.id || 'base',
    consentRevision: memory.data.revision,
    redacted: answer !== student.trim().slice(0, 1600),
  };
  const receipt = sign(event, env.LEARNING_SIGNING_KEY, 'turn');
  try {
    const data = await gateway(env, 'ingest', { ...memory.auth, event }, fetcher);
    return {
      status: 'saved',
      eventId: event.id,
      profile: data.profile,
      message: 'Google Sheets đã xác nhận lưu lượt học.',
    };
  } catch (e) {
    if ([401, 403, 409].includes(e.status))
      return { status: 'off', message: 'Lượt học không được lưu vì quyền ghi đã thay đổi.' };
    return {
      status: 'pending',
      eventId: event.id,
      receipt,
      message:
        'Chưa xác nhận lưu. Lượt này được giữ tối đa 24 giờ trên thiết bị để gửi lại khi em vẫn đồng ý.',
    };
  }
}
