// React integration checks. Rendering-only children are replaced; profile,
// survey, timer and HTTP request code run unchanged. No browser or live writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {create, act} from 'react-test-renderer';
import * as tutor from '../lib/tutor.ts';
import * as learning from '../lib/learning.ts';
import * as session from '../lib/session-recovery.ts';
import * as survey from '../lib/survey.ts';
import * as reminder from '../lib/use-survey-reminder.ts';
import * as adaptive from '../lib/adaptive-learning.ts';
import * as exerciseChoice from '../lib/exercise-choice.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const h=React.createElement, none=()=>null;
function compile(path, mocks={}) {
  const url=new URL('../'+path,import.meta.url), nativeRequire=createRequire(url);
  const js=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,
  }}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',js)(p=>p in mocks?mocks[p]:nativeRequire(p),module,module.exports);
  return module.exports;
}
const feedback=compile('lib/feedback.ts');
const container=({children,...props})=>h('div',props,children);
const App=compile('app/page.tsx',{
  '@/lib/tutor':tutor,'@/lib/learning':learning,'@/lib/session-recovery':session,
  '@/lib/feedback':feedback,'@/lib/survey':survey,'@/lib/use-survey-reminder':reminder,
  'lucide-react':new Proxy({},{get:()=>none}),
  '@/components/learner-panel':{LearnerPanel:none},
  '@/components/ui/dialog':{Dialog:({open,children})=>open?h('section',{},children):null,
    DialogContent:container,DialogHeader:container,DialogTitle:container,DialogDescription:container},
  '@/components/learning-visuals':{GeometryFigure:none,LearningMap:none,TutorAvatar:none},
  '@/components/math-text':{MathText:({text})=>h('span',{},text)},
  '@/components/worksheet-bank':{WorksheetBank:none},'@/lib/worksheets':{worksheets:[],findWorksheet:()=>null},
  '@/components/tikz-figure':{ProblemFigure:none},
  '@/lib/problem-diagram':{problemForTurn:(text,previous)=>previous||text},
  '@/lib/geometry-model':{compileGeometry:()=>({givens:[],goal:''})},
  '@/lib/diagram-interpretation':{diagramPrompt:()=>'',diagramBlock:()=>''},
  '@/lib/adaptive-learning':adaptive,
  '@/lib/exercise-choice':exerciseChoice,
}).default;

function text(node) {return typeof node==='string'?node:(node?.children||[]).map(text).join('');}
function storage() {const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}

async function setup(t,{className='',delivery='confirmed',level='Cơ bản'}={}) {
  const keys=['fetch','document','localStorage','sessionStorage','matchMedia','addEventListener','removeEventListener'];
  const saved=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
  globalThis.document=Object.assign(new EventTarget(),{hidden:false,documentElement:{dataset:{}}});
  globalThis.localStorage=storage();globalThis.sessionStorage=storage();
  globalThis.matchMedia=()=>({matches:true});globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
  const requests=[];
  globalThis.fetch=async(url,options)=>{
    const body=JSON.parse(options.body);requests.push({url,body});
    if(url==='/api/chat')return Response.json(body.check?{ok:true}:{text:'Gợi mở: Em dựa vào dữ kiện nào để chọn dấu hiệu?'});
    assert.equal(url,'/.netlify/functions/feedback');
    return Response.json({ok:delivery==='confirmed',delivery,message:delivery==='confirmed'?'Đã xác nhận khảo sát.':'Chưa xác nhận khảo sát.'});
  };
  t.mock.timers.enable({apis:['setInterval']});
  let tree;await act(async()=>{tree=create(h(App));});
  t.after(async()=>{await act(async()=>tree.unmount());for(const k of keys)globalThis[k]=saved[k];});
  const byClass=c=>tree.root.findByProps({className:c});
  const button=label=>tree.root.findAllByType('button').find(b=>text(b).trim()===label.trim());
  const click=label=>act(async()=>{const b=button(label);assert(b,`button ${label}`);b.props.onClick();});
  const input=label=>tree.root.findAllByType('label').find(n=>text(n).startsWith(label)).findByType('input');
  const change=(node,value)=>act(async()=>node.props.onChange({target:{value,checked:value}}));
  const submit=dialog=>act(async()=>byClass(dialog).findByType('form').props.onSubmit({preventDefault(){}}));
  await click('Kết nối AI');await change(input('Mã truy cập'),'HOCGIOITOAN');await submit('connection-dialog');
  const schoolLabel=tree.root.findAllByType('label').find(n=>text(n).startsWith('Trường đang học'));
  assert(text(schoolLabel).startsWith('Trường đang học (nơi công tác)'));
  assert.equal(input('Lớp đang học (Nếu bạn là GV thì để trống)').props.required,undefined);
  await change(input('Họ và tên'),'Người kiểm thử');await change(input('Trường đang học'),'Trường kiểm thử');
  await change(input('Email'),'test@example.test');await change(input('Lớp đang học'),className);
  await change(tree.root.findAllByType('label').find(n=>text(n).startsWith('Mức độ tự nhận xét')).findByType('select'),level);
  await submit('profile-dialog');await click('Bắt đầu khám phá ');
  return {tree,byClass,button,click,input,change,submit,requests,tick:ms=>act(async()=>t.mock.timers.tick(ms)),
    posts:()=>requests.filter(r=>r.url==='/.netlify/functions/feedback')};
}

test('teacher survey uses the real five-field payload without ending the chat; next reminder starts a new consented survey',async t=>{
  const r=await setup(t,{className:'   '});
  assert(text(r.byClass('side-profile')).includes('Giáo viên'));
  const poster=r.byClass('creators-footer').findByType('a');
  assert.equal(poster.props.href,'https://poster-online-khkt.netlify.app/');
  assert.equal(poster.props.target,'_blank');assert.match(poster.props.rel,/noopener/);
  assert.doesNotMatch(text(r.byClass('creators-footer')),/Phiên bản/);
  await r.change(r.tree.root.findByProps({id:'problem'}),'Câu hỏi đang soạn');
  await r.tick(179999);assert.equal(r.tree.root.findAllByType('div').filter(n=>n.props.className==='feedback-dialog').length,0);
  await r.tick(1);assert.equal(r.tree.root.findAllByType('div').filter(n=>n.props.className==='feedback-dialog').length,1);
  assert.equal(r.posts().length,0);
  await r.change(r.tree.root.findByProps({'aria-label':'4 sao — Hài lòng'}),4);
  await r.change(r.input('Kèm tóm tắt'),false);
  assert.equal(r.button('Gửi khảo sát').props.disabled,true);
  await r.change(r.input('Tôi đồng ý'),true);await r.submit('feedback-dialog');
  assert.equal(r.posts().length,1);
  const first=r.posts()[0].body;
  assert.deepEqual(Object.keys(first).sort(),['accessCode','comment','consent','email','name','rating','school','submissionId'].sort());
  assert.match(first.comment,/\[Người tham gia\]\nGiáo viên/);assert.doesNotMatch(first.comment,/Lớp:|Thông tin sử dụng/);
  await r.click('Tiếp tục sử dụng');
  assert.equal(r.tree.root.findByProps({id:'problem'}).props.value,'Câu hỏi đang soạn');
  assert.equal(r.tree.root.findAllByProps({className:'session-ended'}).length,0);
  await r.tick(180000);
  assert.equal(r.posts().length,1);assert.equal(r.input('Tôi đồng ý').props.checked,false);
  assert.equal(r.button('Gửi khảo sát').props.disabled,true);
  await r.change(r.tree.root.findByProps({'aria-label':'5 sao — Rất hài lòng'}),5);
  await r.change(r.input('Tôi đồng ý'),true);await r.submit('feedback-dialog');
  assert.equal(r.posts().length,2);assert.notEqual(r.posts()[1].body.submissionId,first.submissionId);
});

test('student class is preserved and an unfinished survey keeps its rating and comment across reminders',async t=>{
  const r=await setup(t,{className:' 8A1 '});
  await r.click('Khảo sát đánh giá ứng dụng');
  await r.change(r.tree.root.findByProps({'aria-label':'4 sao — Hài lòng'}),4);
  await r.change(r.byClass('feedback-dialog').findByType('textarea'),'Góp ý đang viết');
  await r.tick(180000);await r.click('Để sau, tiếp tục sử dụng');
  assert.equal(r.tree.root.findAllByType('div').filter(n=>n.props.className==='feedback-dialog').length,0);
  await r.tick(180000);
  assert.equal(r.byClass('feedback-dialog').findByType('textarea').props.value,'Góp ý đang viết');
  assert.equal(r.tree.root.findByProps({'aria-label':'4 sao — Hài lòng'}).props.checked,true);
  assert.equal(r.posts().length,0);
  await r.change(r.input('Tôi đồng ý'),true);await r.submit('feedback-dialog');
  assert.match(r.posts()[0].body.comment,/Lớp: 8A1/);assert.doesNotMatch(r.posts()[0].body.comment,/Giáo viên/);
});

test('unconfirmed delivery retains its original prefilled Form and never retries on a timer',async t=>{
  const r=await setup(t);
  // Force an uncertain delivery without any real network request.
  globalThis.fetch=async(url,options)=>{r.requests.push({url,body:JSON.parse(options.body)});return Response.json({ok:false,delivery:'unconfirmed',message:'Chưa xác nhận khảo sát.'});};
  await r.click('Khảo sát đánh giá ứng dụng');
  await r.change(r.tree.root.findByProps({'aria-label':'3 sao — Bình thường'}),3);
  await r.change(r.input('Tôi đồng ý'),true);await r.submit('feedback-dialog');
  const form=()=>r.byClass('feedback-dialog').findByType('a').props.href, first=form();
  const url=new URL(first);assert.match(url.searchParams.get('entry.326585189'),/Giáo viên/);
  assert.equal(url.searchParams.get('entry.1301171588'),'test@example.test');
  await r.click('Để sau, tiếp tục sử dụng');await r.tick(180000);
  assert.equal(form(),first);assert.equal(r.posts().length,1);
  assert.equal(r.byClass('feedback-dialog').findByType('fieldset').props.disabled,true);
});

test('review and compare show development status in navigation and headings with distinct input guidance',async t=>{
  const r=await setup(t,{className:'8A1'});
  for(const [label,placeholder] of [
    ['Kiểm tra lời giải','Nhập đề bài và từng bước trong lời giải của em…'],
    ['So sánh cách giải','Nhập đề bài và các ý tưởng em muốn đối chiếu…'],
  ]){
    const nav=r.tree.root.findAllByType('button').find(b=>text(b).startsWith(label));
    assert(text(nav).includes('(Đang phát triển)'));
    await act(async()=>nav.props.onClick());
    assert.equal(text(r.byClass('chat-heading').findByType('h1')),label+' (Đang phát triển)');
    assert.equal(r.tree.root.findByProps({id:'problem'}).props.placeholder,placeholder);
  }
  assert.equal(r.requests.filter(r=>!r.body.check).length,0);
});

test('profile regression: changing level updates actual support and the next Gemini context for the same learner',async t=>{
 const r=await setup(t,{className:'8-TEST',level:'Mất căn bản'});
 const sendProblem=async()=>{
  await r.change(r.tree.root.findByProps({id:'problem'}),'Cho hình bình hành ABCD. M là trung điểm AB. Chứng minh AM ∥ CD.');
  await act(async()=>r.byClass('composer').props.onSubmit({preventDefault(){}}));
  const message=r.requests.filter(x=>x.url==='/api/chat'&&!x.body.check).at(-1).body.messages.at(-1).content;
  return JSON.parse(message.match(/\[HO_SO_TU_DUY_V5\]\n(.+)\n/)[1]);
 };
 const low=await sendProblem();assert.equal(low.level,'Mất căn bản');assert.equal(low.supportLevel,3);
 await act(async()=>r.tree.root.findByProps({'aria-label':'Thông tin người học'}).props.onClick());
 const levelSelect=()=>r.tree.root.findAllByType('label').find(n=>text(n).startsWith('Mức độ tự nhận xét')).findByType('select');
 await r.change(levelSelect(),'Giỏi');await r.submit('profile-dialog');await r.click('Bài mới');
 const high=await sendProblem();assert.equal(high.level,'Giỏi');assert.equal(high.supportLevel,0);
 assert.notEqual(high.question.question,low.question.question);
 assert.equal(high.question.hintPolicy,'Không đưa đáp án trực tiếp');
 await act(async()=>r.tree.root.findByProps({'aria-label':'Thông tin người học'}).props.onClick());
 await r.change(levelSelect(),'Mất gốc');await r.submit('profile-dialog');await r.click('Bài mới');
 const lowAgain=await sendProblem();assert.equal(lowAgain.level,'Mất căn bản');assert.equal(lowAgain.supportLevel,3);
});

test('a generated set exposes five selection buttons and sends only the chosen problem as the new task',async t=>{
 const r=await setup(t,{className:'8-TEST'});
 const items=Array.from({length:5},(_,i)=>`Câu ${i+1}: Cho hình bình hành ABCD. M là trung điểm AB. Chứng minh AM ∥ CD. Đề số ${i+1}.`);
 const set=items.join('\n\n')+'\n\nGợi mở: Em muốn bắt đầu với câu nào?';
 globalThis.fetch=async(url,options)=>{
  const body=JSON.parse(options.body);r.requests.push({url,body});
  return Response.json({text:body.messages.at(-1).content.includes('Tạo đúng')?set:'Gợi mở: Em cần kiểm tra điều kiện nào?'});
 };
 const nav=r.tree.root.findAllByType('button').find(b=>text(b).startsWith('Luyện tập mỗi ngày'));
 await act(async()=>nav.props.onClick());
 await act(async()=>r.byClass('practice-card').props.onSubmit({preventDefault(){}}));
 assert.equal(r.tree.root.findByProps({'aria-label':'Chọn câu trong bộ đề'}).findAllByType('button').length,5);
 await r.click('Làm câu 2');
 const content=r.requests.at(-1).body.messages.at(-1).content;
 assert.match(content,/Em chọn câu 2\. Cho hình bình hành/);assert.match(content,/Đề số 2/);assert.doesNotMatch(content,/Đề số [1345]/);
 assert.equal(r.tree.root.findAllByProps({'aria-label':'Chọn câu trong bộ đề'}).length,0);
});
