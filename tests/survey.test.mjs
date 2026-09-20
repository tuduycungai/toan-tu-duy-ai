import test from 'node:test';
import assert from 'node:assert/strict';
import {participantLabel, surveyComment} from '../lib/survey.ts';
import {emptyProfile} from '../lib/tutor.ts';
import {feedbackPayload} from '../server/feedback.mjs';

const profile = {...emptyProfile, name:'Người kiểm thử', school:'Trường thử nghiệm', email:'test@example.test'};
const build = (patch = {}, includeSummary = true) => surveyComment({
  profile:{...profile, ...patch}, comment:'Góp ý kiểm thử', includeSummary,
  topic:'Hình bình hành', mode:'Gợi mở từng bước', checkpoints:[],
});

test('blank and whitespace class values identify a teacher, with no invented class', () => {
  for (const className of ['', '  ', '\t\n', '\u00a0']) {
    assert.equal(participantLabel({className}), 'Giáo viên');
    assert.match(build({className}), /\[Người tham gia\]\nGiáo viên/);
    assert.doesNotMatch(build({className}), /Lớp:|mức độ tự khai|Mục tiêu:/);
  }
  assert.equal(participantLabel(null), 'Chưa có thông tin');
});

test('student classification keeps the actual trimmed class and optional learning summary', () => {
  assert.equal(participantLabel({className:' 8A1 '}), 'Lớp: 8A1');
  const comment = build({className:' 8A1 ', level:'Giỏi'});
  assert.match(comment, /Lớp: 8A1/);
  assert.match(comment, /mức độ tự khai: Giỏi/);
  assert.match(comment, /Mục tiêu: Cải thiện điểm số/);
});

test('participant identity remains in Google Forms when learning summary is unchecked', () => {
  for (const [className, label] of [['', 'Giáo viên'], ['8A1', 'Lớp: 8A1']]) {
    const comment = build({className}, false);
    assert(comment.includes(label));
    assert.doesNotMatch(comment, /Thông tin sử dụng|Chủ đề:|Mục tiêu:/);
    const body = feedbackPayload({...profile, comment, rating:4, consent:true});
    assert.equal(body.size, 5);
    assert.equal(body.get('entry.326585189'), comment);
    assert.equal(body.get('entry.551915748'), profile.name);
  }
});

test('maximum survey input and profile summary fit the existing server comment limit', () => {
  const comment = surveyComment({profile:{...profile,className:'8'.repeat(40),level:'Học sinh năng khiếu'},
    comment:'x'.repeat(1800),includeSummary:true,topic:'Hình bình hành',mode:'Gợi mở từng bước',
    checkpoints:['Em nêu được giả thiết và kết luận','Em giải thích được bước then chốt','Em có thể tự làm lại']});
  assert(comment.length<=3000);
  assert.doesNotThrow(()=>feedbackPayload({...profile,comment,rating:5,consent:true}));
});
