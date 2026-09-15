/** Incremental, inspectable learning evidence. Thresholds are product rules, not a clinical/standardized diagnosis. */
export const abilityLevels=['Củng cố nền tảng','Cơ bản','Khá','Giỏi'] as const;
export type Ability=typeof abilityLevels[number];
export const operations=['Phân tích','Tổng hợp','So sánh','Cụ thể hóa','Trừu tượng hóa','Khái quát hóa','Suy luận','Phát hiện quan hệ','Kiểm tra và phản biện lập luận','Hình thành giả thuyết','Chứng minh và giải thích','Tương tự hóa','Đặc biệt hóa'] as const;
export type Evidence={id:string;taskId:string;question:string;answer:string;thinkingOperation:string;competency:'reading'|'knowledge'|'recognition'|'reasoning'|'critique';score:number|null;error:string;source:'diagnostic'|'ai'|'teacher';at:string};
export type GuidingQuestion={question:string;thinkingOperation:string;learningObjective:string;evidence:string;supportLevel:number;expectedStudentAction:string;nextStep:string;hintPolicy:string};
export type LearnerModel={version:5;level:Ability;provisional:boolean;confidence:number;supportLevel:number;selfConfidence:number;background:string[];evidence:Evidence[];questions:GuidingQuestion[];override:{level:Ability;by:'student'|'teacher';reason:string;at:string}|null;lastClassifiedCount:number;assessedCount:number;diagnosticAnswers:Record<string,{choice:number;explanation:string}>};
export function normalizeAbility(level:string):Ability{return /Mất|nền tảng/i.test(level)?abilityLevels[0]:/năng khiếu|Giỏi/i.test(level)?'Giỏi':level==='Khá'?'Khá':'Cơ bản';}
export function newLearner(level='Cơ bản'):LearnerModel{return {version:5,level:normalizeAbility(level),provisional:true,confidence:0,supportLevel:/Mất|nền tảng/.test(level)?4:1,selfConfidence:3,background:[],evidence:[],questions:[],override:null,lastClassifiedCount:0,assessedCount:0,diagnosticAnswers:{}};}
/** Treat browser storage as untrusted; corrupt progress must not break the application. */
export function restoreLearner(value:unknown,level='Cơ bản'):LearnerModel{
 const fresh=newLearner(level);if(!value||typeof value!=='object')return fresh;const m=value as LearnerModel;
 if(m.version!==5||!abilityLevels.includes(m.level)||!Array.isArray(m.evidence)||!Array.isArray(m.questions)||!Array.isArray(m.background)||!m.background.every(x=>typeof x==='string')||!m.diagnosticAnswers||typeof m.diagnosticAnswers!=='object'||Array.isArray(m.diagnosticAnswers))return fresh;
 if(!['confidence','supportLevel','selfConfidence','lastClassifiedCount'].every(k=>Number.isFinite(m[k as keyof LearnerModel]))||m.supportLevel<1||m.supportLevel>5)return fresh;
 if(m.override&&(!abilityLevels.includes(m.override.level)||!['student','teacher'].includes(m.override.by)))return fresh;
 if(!m.evidence.every(e=>e&&['id','taskId','question','answer','thinkingOperation','error','at'].every(k=>typeof e[k as keyof Evidence]==='string')&&(e.score===null||Number.isFinite(e.score))&&['reading','knowledge','recognition','reasoning','critique'].includes(e.competency)))return fresh;
 if(!m.questions.every(q=>q&&typeof q.question==='string'&&typeof q.thinkingOperation==='string')||!Object.values(m.diagnosticAnswers).every(a=>a&&Number.isInteger(a.choice)&&a.choice>=0&&a.choice<3&&typeof a.explanation==='string'))return fresh;
 return {...m,evidence:m.evidence.slice(-160),questions:m.questions.slice(-80),background:m.background.slice(0,8),assessedCount:Number.isInteger(m.assessedCount)&&m.assessedCount>=0?m.assessedCount:m.evidence.filter(e=>e.score!==null).length};
}
export function effectiveLevel(m:LearnerModel){return m.override?.level||m.level;}
export function recordEvidence(m:LearnerModel,e:Evidence):LearnerModel{
 if(!e.id||m.evidence.some(x=>x.id===e.id)||!e.answer.trim()||!['reading','knowledge','recognition','reasoning','critique'].includes(e.competency))return m;
 const score=e.score===null?null:Math.max(0,Math.min(1,e.score));if(score!==null&&!Number.isFinite(score))return m;
 const next={...m,assessedCount:m.assessedCount+(score===null?0:1),evidence:[...m.evidence,{...e,score}].slice(-160)};
 if(score!==null)next.supportLevel=Math.max(1,Math.min(5,m.supportLevel+(score<.5?1:score>=.85?-1:0)));
 const usable=next.evidence.filter(x=>x.score!==null),recent=usable.slice(-24),domains=new Set(recent.map(x=>x.competency)),tasks=new Set(recent.map(x=>x.taskId));
 if(usable.length>=6&&domains.size>=3&&tasks.size>=2&&next.assessedCount-m.lastClassifiedCount>=3){
  const byDomain=[...domains].map(domain=>{const a=recent.filter(e=>e.competency===domain);return a.reduce((s,x)=>s+x.score!,0)/a.length;});
  const average=byDomain.reduce((a,b)=>a+b,0)/byDomain.length;const index=average<.4?0:average<.7?1:average<.88?2:3;
  const current=abilityLevels.indexOf(m.level);next.level=abilityLevels[m.provisional?index:Math.max(current-1,Math.min(current+1,index))];next.provisional=false;next.lastClassifiedCount=next.assessedCount;next.confidence=Math.min(.9,.35+recent.length*.025);
 }
 return next;
}
export function setAbilityOverride(m:LearnerModel,level:Ability|null,by:'student'|'teacher'='student',reason='Điều chỉnh mức hỗ trợ theo nhu cầu'):LearnerModel{return {...m,override:level?{level,by,reason:reason.slice(0,200),at:new Date().toISOString()}:null,supportLevel:level===abilityLevels[0]?4:level?1:m.supportLevel};}
export function learnerSummary(m:LearnerModel){return {version:5,level:effectiveLevel(m),provisional:m.provisional,supportLevel:m.supportLevel,selfConfidence:m.selfConfidence,background:m.background.slice(0,8),evidenceCount:m.evidence.length,errors:m.evidence.filter(e=>e.error).slice(-5).map(e=>e.error),operations:[...new Set(m.evidence.filter(e=>e.score!==null&&e.score>=.7).map(e=>e.thinkingOperation))].slice(-10),override:m.override?{level:m.override.level,by:m.override.by}:null};}
export const diagnostic=[
 {id:'read',competency:'reading',operation:'Phân tích',question:'Đề yêu cầu chứng minh MN ∥ BC. Đâu là kết luận cần chứng minh?',options:['MN song song BC','M là trung điểm AB','ABC là tam giác'],correct:0,explanation:'Kết luận là điều bài toán yêu cầu chứng minh.'},
 {id:'mid',competency:'knowledge',operation:'Cụ thể hóa',question:'Điều kiện nào đủ để M là trung điểm AB?',options:['MA = MB','M thuộc AB và MA = MB','M nằm gần giữa hình vẽ'],correct:1,explanation:'Cần đồng thời vị trí trên đoạn và hai khoảng cách bằng nhau.'},
 {id:'shape',competency:'recognition',operation:'So sánh',question:'Tính chất nào đúng với mọi hình bình hành?',options:['Hai đường chéo bằng nhau','Hai đường chéo vuông góc','Hai đường chéo cắt nhau tại trung điểm mỗi đường'],correct:2,explanation:'Không phải hình bình hành nào cũng là hình chữ nhật hoặc hình thoi.'},
 {id:'link',competency:'reasoning',operation:'Suy luận',question:'Hai đường thẳng phân biệt a và b cùng vuông góc c trong mặt phẳng. Chọn kết luận có căn cứ.',options:['a song song b','a vuông góc b','a trùng b'],correct:0,explanation:'Áp dụng tính chất hai đường phân biệt cùng vuông góc một đường.'},
 {id:'check',competency:'critique',operation:'Kiểm tra và phản biện lập luận',question:'Bạn nói: “Hai đường chéo bằng nhau nên tứ giác là hình chữ nhật”. Em nhận xét thế nào?',options:['Luôn đúng','Đúng vì hình vẽ cân đối','Thiếu điều kiện; có thể xét hình thang cân'],correct:2,explanation:'Hai đường chéo bằng nhau riêng lẻ chưa đủ; cần thêm điều kiện phù hợp.'}
] as const;
export function submitDiagnostic(m:LearnerModel,id:string,choice:number,explanation:string){const q=diagnostic.find(q=>q.id===id);if(!q||choice<0||choice>2||!explanation.trim()||m.diagnosticAnswers[id])return m;const correct=choice===q.correct;let n=recordEvidence(m,{id:'diagnostic-'+id,taskId:'diagnostic-'+id,question:q.question,answer:q.options[choice]+'; '+explanation,thinkingOperation:q.operation,competency:q.competency,score:correct?.65:0,error:correct?'':q.explanation,source:'diagnostic',at:new Date().toISOString()});n={...n,diagnosticAnswers:{...n.diagnosticAnswers,[id]:{choice,explanation:explanation.slice(0,500)}}};return n;}
export function acceptTurnAssessment(m:LearnerModel,data:unknown,answer:string,taskId:string,id:string):LearnerModel{
 if(!data||typeof data!=='object')return m;const a=data as Record<string,unknown>;let n=m;
 if(a.assessment&&typeof a.assessment==='object'){const e=a.assessment as Record<string,unknown>;
  if(typeof e.quote==='string'&&e.quote.length>0&&answer.includes(e.quote)&&['correct','partial','incorrect','unassessed'].includes(String(e.verdict))&&operations.includes(e.thinkingOperation as typeof operations[number]))n=recordEvidence(m,{id,taskId,question:m.questions.at(-1)?.question||'',answer:e.quote,thinkingOperation:String(e.thinkingOperation),competency:e.competency as Evidence['competency'],score:e.verdict==='unassessed'?null:e.verdict==='correct'?1:e.verdict==='partial'?.5:0,error:typeof e.error==='string'?e.error.slice(0,300):'',source:'ai',at:new Date().toISOString()});
 }
 const q=a.question as GuidingQuestion|undefined;if(q&&typeof q.question==='string'&&q.question.length<=400&&operations.includes(q.thinkingOperation as typeof operations[number])&&Number.isInteger(q.supportLevel)&&q.supportLevel>=1&&q.supportLevel<=5&&['learningObjective','evidence','expectedStudentAction','nextStep','hintPolicy'].every(k=>typeof q[k as keyof GuidingQuestion]==='string'))n={...n,questions:[...n.questions,q].slice(-80)};
 return n;
}
