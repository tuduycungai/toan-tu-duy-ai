/** Product guardrails, not a proof that a language model can never make an error. */
const plain=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
export function studentRequest(messages){
 const source=messages.at(-1)?.content||'';
 return source.split(/\[Yêu cầu (?:của em|học sinh)\]/).at(-1).split(/\[CHUAN_HOA_HINH\]|\[HO_SO_TU_DUY_V5\]|\[Lưu ý biên tập/)[0];
}
export function asksForAnswer(messages){
 let s=plain(studentRequest(messages));
 // Negative requests are genuine requests for hints, not attempts to receive an answer.
 s=s.replace(/(?:khong|chua|dung)\s+(?:(?:can|cho|dua|cung cap|kem|xuat|hien|toan bo)\s+)*(?:dap an|loi giai)(?:\s+hoan chinh)?(?:\s+(?:hoac|hay|va)\s+(?:dap an|loi giai)(?:\s+hoan chinh)?)?/g,'');
 if(/(?:dap an|ket qua cuoi)\s*(?:la gi|bao nhieu)|(?:loi giai|dap an)\s*(?:chi tiet|day du|hoan chinh)|giai (?:chi tiet|day du|hoan chinh|giup|dum)|(?:final answer|complete solution)/.test(s))return true;
 return /(?:xin|cho|dua|xuat|gui|hien|muon xem|can|cung cap|tiet lo)\s+(?:(?:em|toi|minh|thay|luon|ngay|toan bo|day du|truc tiep|moi|cac|tat ca|phan|xem)\s+)*(?:dap an|loi giai|ket qua cuoi)|(?:giai ho|giai het|giai ngay|giai toan bo|bo qua (?:cau hoi|goi mo)|chi (?:can|dua|cho) (?:ket qua|dap an))|(?:give|show|provide|tell).{0,35}(?:answer|full solution)/i.test(s);
}
function publicPlan(text){const blocks=[...text.matchAll(/\[SO_DO\]([\s\S]*?)\[\/SO_DO\]/g)];if(blocks.length!==1)return null;
 const lines=blocks[0][1].trim().split('\n');if(lines.length!==4)return null;
 const plan={};for(const [i,name] of ['DU_KIEN','MUC_TIEU','CAU_NOI','BUOC_TIEP'].entries()){const v=lines[i].match(new RegExp('^'+name+':\\s*(.+)$'))?.[1];if(!v)return null;plan[name]=v.replace(/[?？]/g,'.').slice(0,220);}return plan;
}
export function guidedFallback(messages){
 const previous=[...messages].reverse().find(m=>m.role==='assistant');
 const p=previous?publicPlan(previous.content):null;
 const question=previous?.content.match(/Gợi mở:\s*([^\n]+[?？])/u)?.[1];
 const reuse=question&&question.length<=280&&(question.match(/[?？]/g)||[]).length===1&&!/đáp án|lời giải (?:là|đầy đủ)|vậy .* là hình/u.test(question);
 return `[SO_DO]\nDU_KIEN: ${p?.DU_KIEN||'Cần xác định giả thiết em đang sử dụng; không suy thêm từ hình.'}\nMUC_TIEU: ${p?.MUC_TIEU||'Xác định một yêu cầu cần chứng minh của bài.'}\nCAU_NOI: Chọn đúng giả thiết và một định nghĩa hoặc dấu hiệu liên quan.\nBUOC_TIEP: ${reuse?'Tự trả lời nhiệm vụ đang chờ, kèm căn cứ.':'Nêu đúng kết luận cần chứng minh của ý đầu tiên.'}\n[/SO_DO]\nThao tác tư duy: Phân tích — chia bài toán thành một nhiệm vụ nhỏ.\nThầy không cung cấp đáp án hoặc lời giải hoàn chỉnh. Thầy sẽ giúp em tự thực hiện từng bước.\nGợi mở: ${reuse?question:'Kết luận cần chứng minh trong ý đầu tiên của đề là gì?'}`;
}
export function guardTutorOutput(text,messages){
 if(asksForAnswer(messages))return guidedFallback(messages);
 const visible=text.replace(/\[DE_HINH_HOC\][\s\S]*?(?:\[\/DE_HINH_HOC\]|$)/g,'');
 const plan=publicPlan(visible);const mathTurn=/\[SO_DO\]/.test(visible)||messages.some(m=>/hình|tứ giác|tam giác|chứng minh|trung điểm|song song|vuông góc|\b[A-Z]{2}\b/.test(m.content));
 const questions=(visible.match(/[?？]/g)||[]).length;
 const completed=/\[KET_THUC_BUOI_HOC\]\s*$/.test(visible);
 const student=studentRequest(messages);
 const reasoned=student.length>60&&/(?:vì|do|theo|suy ra|nên|bởi|⇒)/iu.test(student)&&messages.some(m=>m.role==='assistant');
 const fullSolution=/(?:^|\n)\s*(?:#{1,4}\s*)?(?:lời giải(?:\s+(?:hoàn chỉnh|chi tiết|đầy đủ))?|đáp án|bài giải)\s*:|(?:^|\n)\s*Bước\s*[2-9]\s*[:.]/imu.test(visible);
 if(fullSolution)return guidedFallback(messages);
 if(!mathTurn)return text;
 // Exercise sets may contain question marks in the statements, but just one final tutor question.
 const exerciseSet=/(?:tạo|sinh)\s+(?:đúng\s+)?(?:[5-9]|10)\s+câu/iu.test(student)&&!/(?:lời giải|đáp án)\s*:/iu.test(visible);
 const prompts=[...visible.matchAll(/^Gợi mở:\s*([^\n]+)$/gmu)];
 if(!plan||!visible.includes('Thao tác tư duy:')||(!exerciseSet&&visible.split(/\s+/).length>250)||(!completed&&(prompts.length!==1||(prompts[0][1].match(/[?？]/g)||[]).length!==1||(!exerciseSet&&questions!==1)))||(completed&&(!reasoned||questions!==0)))return guidedFallback(messages);
 return text;
}
