import test from 'node:test';import assert from 'node:assert/strict';
import {initialTutorState,applyTutorTurn,adaptiveInstructions,STATES} from '../server/adaptive-tutor.mjs';
import {seal,unseal} from '../server/signed-state.mjs';import {handleChat} from '../server/gemini.mjs';
import {problem,assessment,provider} from './fixtures/v623-data.mjs';
const env={GEMINI_API_KEY:'fixture-only-no-real-key',ACCESS_CODE:'HOCGIOITOAN'};
const req=body=>new Request('https://test.local/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accessCode:env.ACCESS_CODE,mode:'guide',adaptive:true,problem,messages:[{role:'user',content:'Em chưa biết bắt đầu từ đâu.'}],...body})});
const messages=text=>[{role:'user',content:text}];
const examples=[
 ['TUT-01','correct_complete','Vì M thuộc AB và AM = MB nên M là trung điểm AB.'],
 ['TUT-02','correct_partial','Em biết AM bằng nửa AB.'],
 ['TUT-03','idea_missing_reason','Em nghĩ M là trung điểm AB.'],
 ['TUT-04','wrong_given_goal','Đề đã cho M là trung điểm AB.'],
 ['TUT-05','wrong_theorem','Hai cạnh bằng nhau nên là hình bình hành.'],
 ['TUT-06','wrong_logic','Em dùng kết luận để chứng minh chính kết luận.'],
 ['TUT-07','wrong_calculation_notation','2AM = AB nên AM = AB.'],
 ['TUT-08','vague','Chỗ đó bằng nhau.'],
 ['TUT-09','alternative_path','Vì AB = AM + MB và AB = 2AM nên AM = MB.'],
 ['TUT-10','answer_request','Cho em đáp án ngay.'],
 ['TUT-11','off_topic','Kể chuyện khác đi.'],
 ['TUT-12','ambiguous','M ở ngoài hay bên trong đoạn đó.']
];
for(const [id,classification,text] of examples)test(`${id}: controlled assessment routes ${classification}`,()=>{
 const state=initialTutorState(problem),valid=['correct_complete','alternative_path'].includes(classification);
 const a=assessment({classification,accepted:[{claim:'AM = MB',reason:'AB = AM + MB và AB = 2AM',studentQuote:text}],error:valid?'':'Cần kiểm tra căn cứ.'});
 const result=applyTutorTurn(state,a,messages(text));
 assert.equal(result.state.classification,classification);assert.equal((result.text.match(/\?/g)||[]).length,1);assert(!result.text.includes(classification));
 assert.equal(result.state.conclusions.length,valid?1:0);assert(result.state.stage<=6);
});
test('TUT-13: repeated answer requests increase small hints without unlocking a solution',()=>{
 let state=initialTutorState(problem);
 for(let i=0;i<10;i++){const result=applyTutorTurn(state,assessment({classification:'answer_request',stage:7,summary:'Lời giải hoàn chỉnh bị chặn',question:`Ở lần thử ${i+1}, em muốn kiểm tra điều kiện nào của trung điểm?`,proofComplete:true}),messages('Xin đáp án ngay'));state=result.state;assert(!result.text.includes('bị chặn'));assert(state.stage<7);}
 assert.equal(state.hintLevel,4);assert.equal(state.turn,10);
});
test('TUT-14: foundation and advanced profiles keep different support',()=>{
 const low=initialTutorState(problem,'Mất căn bản'),high=initialTutorState(problem,'Giỏi');assert(low.hintLevel>high.hintLevel);
 assert.match(adaptiveInstructions(low,'guide',messages('chưa hiểu')),/mất căn bản: một đối tượng/);assert.match(adaptiveInstructions(high,'compare',messages('cách khác')),/điều kiện cần\/đủ/);
});
test('TUT-15: 120 turns preserve proof, path, ability and question hashes beyond trimmed history',()=>{
 let state=initialTutorState(problem);const quote='Vì AB = AM + MB và AB = 2AM nên AM = MB.';
 for(let i=0;i<120;i++)state=applyTutorTurn(state,assessment({accepted:[{claim:'AM = MB',reason:'Cộng đoạn',studentQuote:quote}],question:`Em kiểm tra căn cứ số ${i+1} như thế nào?`}),messages(quote)).state;
 const restored=unseal(seal(state,env.GEMINI_API_KEY,'tutor'),env.GEMINI_API_KEY,'tutor');assert.equal(restored.turn,120);assert.equal(restored.conclusions.length,1);assert.equal(restored.questionHashes.length,120);assert.equal(restored.questions.length,24);assert.equal(restored.path,'Dùng định nghĩa trung điểm');
 assert.throws(()=>applyTutorTurn(restored,assessment({question:'Em kiểm tra căn cứ số 1 như thế nào?'}),messages(quote)),/trùng/);
});
test('TUT-16: phase seven is gated by prior student proof; phase eight needs actual self-check',()=>{
 const quote='Vì M thuộc AB và AM = MB nên M là trung điểm AB.';
 let state=initialTutorState(problem);
 const a=assessment({stage:7,proofComplete:true,coveredGoals:['Chứng minh M là trung điểm AB'],accepted:[{claim:'M là trung điểm AB',reason:'Định nghĩa',studentQuote:quote}],summary:'M thuộc AB, AM = MB nên M là trung điểm AB.'});
 const premature=applyTutorTurn(state,a,messages(quote));assert(!premature.text.includes('Tổng hợp từ'));state={...premature.state,stage:6};
 const summarized=applyTutorTurn(state,{...a,question:'Nếu bỏ điều kiện M thuộc AB, kết luận còn đúng không?'},messages(quote));assert.equal(summarized.state.stage,7);assert.match(summarized.text,/Tổng hợp từ/);
 const check=applyTutorTurn(summarized.state,{...a,stage:8,question:'Em có thể giải thích vai trò của vị trí M không?',selfCheckPassed:true,accepted:[]},messages('hiểu rồi'));assert.equal(check.state.selfCheckPassed,false);
});
test('TUT-17: missing premise or fabricated quote is not promoted to proven',()=>{
 const state=initialTutorState(problem),a=assessment({accepted:[{claim:'M là trung điểm',reason:'Theo định nghĩa',studentQuote:'Vì đây là lời học sinh chưa hề viết.'}],coveredGoals:['Chứng minh M là trung điểm AB'],proofComplete:true});
 const r=applyTutorTurn(state,a,messages('Em đoán như vậy.'));assert.equal(r.state.conclusions.length,0);assert.equal(r.state.proofComplete,false);
});
test('TUT-18: signed state tampering and purpose substitution fail closed',()=>{
 const token=seal(initialTutorState(problem),env.GEMINI_API_KEY,'tutor');assert.throws(()=>unseal(token+'x',env.GEMINI_API_KEY,'tutor'));assert.throws(()=>unseal(token,env.GEMINI_API_KEY,'image'));
});
test('TUT-19: real handler uses structured API and returns signed state without API key',async()=>{
 const response=await handleChat(req({}),env,async(url,options)=>{assert.match(url,/generateContent$/);assert.equal(options.headers['x-goog-api-key'],env.GEMINI_API_KEY);const p=JSON.parse(options.body);assert.equal(p.generationConfig.responseSchema.properties.classification.enum.length,12);assert(!options.body.includes(env.GEMINI_API_KEY));return provider(assessment());});
 assert.equal(response.status,200);const data=await response.json();assert(data.tutorToken);assert(!JSON.stringify(data).includes(env.GEMINI_API_KEY));assert.equal(unseal(data.tutorToken,env.GEMINI_API_KEY,'tutor').turn,1);
});
test('TUT-20: format repair is bounded to two provider calls and preserves failed state',async()=>{
 let calls=0;const r=await handleChat(req({}),env,async()=>{calls++;return provider({});});assert.equal(r.status,502);assert.equal(calls,2);
 let deniedCalls=0;const denied=await handleChat(req({tutorToken:'tampered'}),env,async()=>{deniedCalls++;return provider(assessment());});assert.equal(denied.status,409);assert.equal(deniedCalls,0);
});
test('TUT-21: finding an invalid premise retracts previous claims and goal coverage',()=>{
 const s={...initialTutorState(problem),stage:6,conclusions:[{claim:'AM = MB',reason:'Căn cứ cũ',evidence:'Câu cũ',turn:1}],goals:['Chứng minh M là trung điểm AB'],coveredGoals:['Chứng minh M là trung điểm AB'],proofComplete:true};
 const r=applyTutorTurn(s,assessment({classification:'wrong_given_goal',stage:2,retractClaims:['AM = MB'],error:'Vị trí M chưa được đề cho.'}),messages('Em đã nhầm giả thiết vị trí M.'));
 assert.equal(r.state.conclusions.length,0);assert.equal(r.state.coveredGoals.length,0);assert.equal(r.state.proofComplete,false);assert.equal(r.state.stage,2);
});
