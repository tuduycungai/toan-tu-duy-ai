import test from 'node:test';import assert from 'node:assert/strict';
import {readSession,saveSession} from '../lib/session-recovery.ts';
import {initialTutorState} from '../server/adaptive-tutor.mjs';import {seal,unseal} from '../server/signed-state.mjs';
let raw;globalThis.sessionStorage={getItem:()=>raw,setItem:(_k,v)=>{raw=v;}};
test('STATE-01: reload keeps signed stage, proof and recent questions without access code',()=>{
 const state={...initialTutorState('Đề thử'),stage:6,turn:70,conclusions:[{claim:'AM = MB',reason:'Tính chất',evidence:'Vì ...',turn:4}],questionHashes:['question-one']};
 const token=seal(state,'local-fixture','tutor');saveSession({messages:[],wire:[],input:'Đang làm tiếp',problem:'Đề thử',mode:'guide',tutorToken:token,progress:{stage:6,title:'Tự thực hiện chứng minh',hintLevel:2,proven:['AM = MB'],path:'Trung điểm'}});
 const recovered=readSession();assert.equal(recovered.tutorToken,token);assert.equal(unseal(recovered.tutorToken,'local-fixture','tutor').turn,70);assert.equal(recovered.progress.stage,6);assert(!raw.includes('accessCode'));
});
