import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {instructions} from '../server/policy.mjs';
import {reviewCompareGuidance,REVIEW_GUIDANCE,COMPARE_GUIDANCE} from '../server/review-compare-policy.mjs';
import {handleChat} from '../server/gemini.mjs';
import {guardTutorOutput} from '../server/strict-tutor.mjs';
import {learningModes,lessons,parseTutorResponse} from '../lib/learning.ts';

// Authored acceptance examples, not responses recorded from a live model.
export const examples={
 review:{
  input:'Cho tứ giác ABCD có AC = BD. Em viết: AC = BD nên ABCD là hình chữ nhật. Nhờ Thầy kiểm tra bước này.',
  reply:`[SO_DO]
DU_KIEN: ABCD là tứ giác; AC = BD.
MUC_TIEU: Kiểm tra điều kiện của dấu hiệu vừa dùng.
CAU_NOI: Đối chiếu loại tứ giác trong điều kiện áp dụng dấu hiệu.
BUOC_TIEP: Xác định một điều kiện chưa có căn cứ.
[/SO_DO]
Thao tác tư duy: Phân tích — tách điều kiện cần kiểm tra trong một suy luận.
Nhận xét: Ở bước “AC = BD nên ABCD là hình chữ nhật”, em chưa bảo đảm đủ điều kiện của dấu hiệu.
Gợi mở: Trong dấu hiệu em đang dùng, tứ giác cần có điều kiện nào trước khi xét hai đường chéo?`,
 },
 compare:{
  input:'Cho tứ giác ABCD có AB song song CD và AB = CD. Để nhận biết hình bình hành, em muốn đối chiếu hướng dùng một cặp cạnh đối với hướng dùng hai đường chéo.',
  reply:`[SO_DO]
DU_KIEN: AB ∥ CD; AB = CD; em đã nêu hai hướng dự kiến.
MUC_TIEU: So sánh điều kiện đã có của mỗi hướng.
CAU_NOI: Đối chiếu điều kiện của dấu hiệu với giả thiết, chưa bổ sung kết quả.
BUOC_TIEP: Tìm một điều kiện còn thiếu căn cứ trong hướng đường chéo.
[/SO_DO]
Thao tác tư duy: So sánh — đối chiếu hai ý tưởng theo điều kiện áp dụng.
Đối chiếu: Hướng thứ nhất xét cạnh đối; hướng thứ hai xét hai đường chéo. Mình đang so sánh ý tưởng, chưa kết luận cả hai đã hoàn chỉnh.
Gợi mở: Trong hướng dùng hai đường chéo, điều kiện nào em chưa có căn cứ từ đề bài?`,
 },
};

test('only review and compare carry the development status; original API mode IDs remain unchanged',()=>{
  assert.deepEqual(learningModes.filter(m=>m.status).map(m=>[m.id,m.api,m.status]),[
    ['review','review','Đang phát triển'],['compare','compare','Đang phát triển'],
  ]);
  assert.deepEqual(learningModes.map(m=>m.api),['guide','review','compare','guide','guide']);
});

test('the guide-mode prompt and all original lesson contents are unchanged from v6.2',()=>{
  const baseline=JSON.parse(readFileSync(new URL('./v62-mode-baseline.json',import.meta.url),'utf8'));
  const hash=s=>createHash('sha256').update(s).digest('hex');
  assert.equal(hash(instructions('guide',[])),baseline.guidePromptSha256);
  assert.equal(hash(JSON.stringify(lessons)),baseline.lessonsSha256);
});

test('mode-specific instructions are isolated and retain the strict one-question teaching policy',()=>{
  assert.equal(reviewCompareGuidance('guide'),'');assert.equal(reviewCompareGuidance('diagram'),'');
  assert(instructions('review').includes(REVIEW_GUIDANCE));assert(!instructions('review').includes(COMPARE_GUIDANCE));
  assert(instructions('compare').includes(COMPARE_GUIDANCE));assert(!instructions('compare').includes(REVIEW_GUIDANCE));
  for(const mode of ['review','compare']){
    assert.match(instructions(mode),/KHÔNG CUNG CẤP ĐÁP ÁN HOẶC LỜI GIẢI HOÀN CHỈNH/);
    assert.match(instructions(mode),/đúng một câu hỏi chính sau “Gợi mở:”/);
    assert.match(instructions(mode),/Chưa đủ bài làm|chưa có bài làm/);
  }
});

for(const mode of ['review','compare'])test('specialized '+mode+' instructions reach Gemini with the same history and response schema',async()=>{
  const example=examples[mode],messages=[{role:'user',content:'[Bối cảnh học tập tự khai] '+JSON.stringify({mucDo:'Mất gốc'})+'\n[Yêu cầu học sinh]\n'+example.input}];
  let calls=0;
  const r=await handleChat(new Request('http://test/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accessCode:'HOCGIOITOAN',mode,messages})}),{GEMINI_API_KEY:'test-placeholder'},async(url,options)=>{
    calls++;assert.equal(options.headers['x-goog-api-key'],'test-placeholder');
    const payload=JSON.parse(options.body);
    assert.equal(payload.systemInstruction.parts[0].text,instructions(mode,messages));
    assert.match(payload.systemInstruction.parts[0].text,/Mức tự khai: Mất gốc/);
    assert.deepEqual(payload.contents,[{role:'user',parts:[{text:messages[0].content}]}]);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:example.reply}]}}]});
  });
  assert.equal(calls,1);assert.equal(r.status,200);
  const body=await r.json();assert.deepEqual(Object.keys(body).sort(),['model','text']);assert.equal(body.text,example.reply);
});

for(const mode of ['review','compare'])test('authored '+mode+' example keeps one diagram, one question, a thinking operation and no completion marker',()=>{
  const {reply,input}=examples[mode],parsed=parseTutorResponse(reply);
  assert(parsed.plan);assert.equal(parsed.complete,false);
  assert.equal((reply.match(/\[SO_DO\]/g)||[]).length,1);
  assert.equal((reply.match(/\?/g)||[]).length,1);assert.match(reply,/Thao tác tư duy:/);
  assert(reply.split(/\s+/).length<=180);
  assert.equal(guardTutorOutput(reply,[{role:'user',content:input}]),reply);
});
