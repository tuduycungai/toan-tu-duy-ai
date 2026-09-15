import {controlledTutorOutput} from './output-boundary.mjs';
import {instructions} from './policy.mjs';
import {guardTutorOutput,studentRequest,guidedFallback} from './strict-tutor.mjs';
import {parseAdaptiveBlock,adaptiveContext,PROMPT_VERSION} from './adaptive-protocol.mjs';
export function adaptiveFallback(messages){
 const answer=studentRequest(messages),p=adaptiveContext(messages),basic=/nền tảng|Mất/.test(p?.level||''),mid=messages.map(m=>m.content).join(' ').match(/([A-Z])\s+(?:là\s+)?trung điểm\s+(?:của\s+)?([A-Z]{2})/u);
 const last=messages.filter(m=>m.role==='assistant').at(-1)?.content.match(/MUC_TIEU:\s*([^\n]+)/)?.[1];
 const q=basic?(mid?`Theo định nghĩa trung điểm, điểm ${mid[1]} phải thỏa điều kiện gì trên đoạn ${mid[2]}?`:'Em hãy xác định một giả thiết của bài toán và giải thích kí hiệu trong giả thiết đó?'):'Em chọn điều kiện đủ nào để chứng minh mục tiêu hiện tại, và căn cứ nào trong đề giúp em chọn điều kiện đó?';
 const text=`[SO_DO]\nDU_KIEN: Đối chiếu các dữ kiện được ghi trong đề và hình.\nMUC_TIEU: ${last||'Xác định kết luận cần chứng minh.'}\nCAU_NOI: Chọn định nghĩa hoặc tính chất có đủ điều kiện.\nBUOC_TIEP: Tự giải thích một lựa chọn có căn cứ.\n[/SO_DO]\nThao tác tư duy: Phân tích — xác định một mắt xích có căn cứ.\nGợi mở: ${q}`;
 return {text,learning:{version:5,assessment:{quote:answer.slice(0,500),verdict:'unassessed',competency:'reasoning',thinkingOperation:'Phân tích',error:''},question:{question:q,thinkingOperation:'Phân tích',learningObjective:'Chọn một điều kiện đủ',evidence:'Chưa đủ minh chứng để đánh giá',supportLevel:Math.max(1,Math.min(5,Number(p?.supportLevel)||1)),expectedStudentAction:'Giải thích lựa chọn bằng giả thiết',nextStep:'Kiểm tra điều kiện học sinh nêu',hintPolicy:'không đưa đáp án trực tiếp'},theory:[]}};
}
export async function handleAdaptiveChat(body,model,apiKey,fetcher,reply){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);let attempts=0;
 try{
  for(attempts=1;attempts<=2;attempts++){
   const retry=attempts===2?'\nLượt trước thiếu metadata hợp lệ. Hãy tạo lại đúng schema TU_DUY_V5; câu hỏi trong JSON phải khớp Gợi mở. Không thêm lời giải.':'';
   const generationConfig={maxOutputTokens:4400,...(model==='gemini-2.5-flash'?{thinkingConfig:{thinkingBudget:512}}:{})};
   const response=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({systemInstruction:{parts:[{text:instructions(body.mode,body.messages)+retry}]},contents:body.messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),generationConfig}),signal:controller.signal});
   if(!response.ok){const status=response.status;await response.body?.cancel();return reply({error:status===429?'Gemini đã đạt giới hạn lượt gọi. Em có thể thử lại sau.':'Dịch vụ AI chưa phản hồi. Em vẫn có thể đọc hình và lý thuyết tại chỗ.'},status===429?429:502);}
   const data=await response.json(),candidate=data?.candidates?.[0];if(data.promptFeedback?.blockReason||candidate?.finishReason==='SAFETY')return reply({error:'AI chưa thể phản hồi nội dung này. Em kiểm tra lại đề bài nhé.'},422);
   if(candidate?.finishReason!=='STOP')continue;
   const raw=(candidate.content?.parts||[]).filter(p=>typeof p.text==='string'&&!p.thought).map(p=>p.text).join('\n');
   const learning=parseAdaptiveBlock(raw,studentRequest(body.messages));if(!learning)continue;
   const visible=raw.replace(/\[TU_DUY_V5\][\s\S]*?\[\/TU_DUY_V5\]/g,'').trim();const guarded=guardTutorOutput(visible,body.messages);
   if(guarded!==visible)continue;
   return reply({...controlledTutorOutput(body.messages,learning),model,promptVersion:PROMPT_VERSION,metadataStatus:attempts===1?'validated':'retried',attempts});
  }
  const fallback=adaptiveFallback(body.messages);return reply({...controlledTutorOutput(body.messages,fallback.learning),model,promptVersion:PROMPT_VERSION,metadataStatus:'fallback',attempts:2});
 }catch{const fallback=adaptiveFallback(body.messages);return reply({...controlledTutorOutput(body.messages,fallback.learning),model,promptVersion:PROMPT_VERSION,metadataStatus:'fallback',attempts:Math.min(attempts,2),notice:'Phản hồi AI chưa hợp lệ hoặc bị gián đoạn; đang dùng câu hỏi dự phòng.'});}
 finally{clearTimeout(timer);}
}
