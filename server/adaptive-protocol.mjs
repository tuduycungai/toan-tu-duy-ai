/** Public pedagogical metadata, never private chain of thought. */
export const PROMPT_VERSION='5.1.0-2026-09-15';
export const DEFAULT_MODEL='gemini-2.5-flash';
export const OPS=['Phân tích','Tổng hợp','So sánh','Cụ thể hóa','Trừu tượng hóa','Khái quát hóa','Suy luận','Phát hiện quan hệ','Kiểm tra và phản biện lập luận','Hình thành giả thuyết','Chứng minh và giải thích','Tương tự hóa','Đặc biệt hóa'];
export function adaptiveContext(messages){try{const raw=messages.at(-1)?.content.match(/^\[Bối cảnh học tập tự khai\]\s*(\{[^\n]+\})/)?.[1];const p=raw?JSON.parse(raw).thichNghi:null;return p?.version===5?p:null;}catch{return null;}}
export const adaptiveRequested=messages=>!!adaptiveContext(messages);
export function adaptiveInstruction(messages){if(!adaptiveRequested(messages))return '';return `
PHỤ LỤC V5 — PHIÊN BẢN ${PROMPT_VERSION}
Sau nội dung sư phạm, thêm một khối [TU_DUY_V5] JSON [/TU_DUY_V5]. Đây là thông tin đánh giá công khai, không phải suy nghĩ nội bộ. Không có thông tin tên, email, trường hoặc mã truy cập.
Schema:
{"version":5,"assessment":{"quote":"trích đúng phần học sinh vừa trả lời","verdict":"unassessed|correct|partial|incorrect","competency":"reading|knowledge|recognition|reasoning|critique","thinkingOperation":"Phân tích","error":"một lỗi đầu tiên hoặc chuỗi rỗng"},"question":{"question":"chép đúng câu sau Gợi mở","thinkingOperation":"Phân tích","learningObjective":"một mục tiêu quan sát được","evidence":"minh chứng công khai ngắn từ câu trả lời, hoặc chưa đủ minh chứng","supportLevel":1,"expectedStudentAction":"một hành động","nextStep":"điều kiện chuyển bước","hintPolicy":"không đưa đáp án trực tiếp"},"theory":[{"title":"định nghĩa hoặc định lí có thể dùng","definition":"phát biểu đúng, không giải bài","conditions":["điều kiện áp dụng"],"connectionToProblem":"đối tượng trong đề cần đối chiếu","thinkingOperation":"Phân tích","commonMistake":"lỗi cần tránh"}]}
Chỉ đánh giá lời học sinh vừa tự viết. Đề mới, lời cảm ơn, xin gợi ý, yêu cầu vẽ hoặc chọn đáp án không có căn cứ: unassessed; không lấy lời giải tham chiếu hay lời AI làm minh chứng. Không suy ra năng lực chỉ từ một lượt, không tự gán nhãn. Nếu có lý do đúng nhưng còn thiếu điều kiện: partial. Quote phải là đoạn liên tục trong yêu cầu thật của học sinh. Sai: nêu một lỗi; đúng: yêu cầu em tự giải thích lại kết luận hoặc tự chọn mắt xích tiếp theo.
Dùng mức hỗ trợ đã gửi cùng hồ sơ tích lũy. Củng cố nền tảng: một định nghĩa ngắn, một đối tượng, một hành động. Khá/Giỏi: một quyết định chiến lược, so sánh hướng, phát hiện bất biến, điều kiện khái quát hoặc phản biện. Mỗi mức vẫn phát triển thao tác tư duy. Không giao nhiều nhiệm vụ qua metadata.
Lý thuyết: tối đa 3 đơn vị đúng đề hiện tại; luôn có ít nhất 1, kể cả đề ngoài ngân hàng. Giữ điều kiện, không bịa nguồn hay số trang. Không đưa tọa độ/vectơ cho THCS như phương pháp bắt buộc; chỉ mở rộng nếu người học đã học. Không kèm lời giải hoàn chỉnh trong lý thuyết hoặc câu hỏi. Nếu kết thúc buổi học, question.question có thể rỗng, các trường khác vẫn ngắn.
Cơ sở thiết kế: Bài giảng vấn đề Tư duy, trang PDF 6–8 (trừu tượng hóa và tiến trình kiểm tra giả thuyết), 9–14 (thao tác và rèn luyện); Nguyễn Thanh Hưng – Ngô Tùng Nhân (2019), tr.184–187 (PDF 1–4). Ngưỡng phân loại và cách lưu minh chứng là thiết kế của ứng dụng, không gán cho tác giả.
`;}
const bounded=(s,max=500)=>typeof s==='string'&&s.length<=max;
export function parseAdaptiveBlock(text,answer){
 const blocks=[...text.matchAll(/\[TU_DUY_V5\]([\s\S]*?)\[\/TU_DUY_V5\]/g)];if(blocks.length!==1)return null;
 let source=blocks[0][1].trim().replace(/^```(?:json)?\s*|\s*```$/g,'');if(source.length>14000)return null;
 let data;try{data=JSON.parse(source);}catch{try{data=JSON.parse(source.replace(/,\s*([}\]])/g,'$1'));}catch{return null;}}
 if(data?.version!==5||!data.assessment||!data.question||!Array.isArray(data.theory)||data.theory.length<1||data.theory.length>4)return null;
 const e=data.assessment,q=data.question;
 if(!bounded(e.quote,1500)||!answer.includes(e.quote)||!['correct','partial','incorrect','unassessed'].includes(e.verdict)||!['reading','knowledge','recognition','reasoning','critique'].includes(e.competency)||!OPS.includes(e.thinkingOperation)||!bounded(e.error,300))return null;
 if(e.verdict!=='unassessed'&&(!e.quote.trim()||/^(?:cho |vẽ |kẻ |thầy |em cần |cảm ơn|vâng|hiểu rồi)/iu.test(answer.trim())))e.verdict='unassessed';
 if(!['question','learningObjective','evidence','expectedStudentAction','nextStep','hintPolicy'].every(k=>bounded(q[k],500))||!OPS.includes(q.thinkingOperation)||!Number.isInteger(q.supportLevel)||q.supportLevel<1||q.supportLevel>5)return null;
 const visible=text.replace(/\[TU_DUY_V5\][\s\S]*?\[\/TU_DUY_V5\]/g,'');const actual=visible.match(/^Gợi mở:\s*([^\n]+)$/mu)?.[1]?.trim();if(actual&&q.question.trim()!==actual)return null;if(!actual&&!visible.includes('[KET_THUC_BUOI_HOC]'))return null;
 q.hintPolicy='không đưa đáp án trực tiếp';
 if(!data.theory.every(t=>t&&['title','definition','connectionToProblem','thinkingOperation','commonMistake'].every(k=>bounded(t[k],500)&&t[k].trim())&&OPS.includes(t.thinkingOperation)&&Array.isArray(t.conditions)&&t.conditions.length>0&&t.conditions.length<8&&t.conditions.every(s=>bounded(s,300)&&s.trim())))return null;
 return {version:5,assessment:e,question:q,theory:data.theory};
}
