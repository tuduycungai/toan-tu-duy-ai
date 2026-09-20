/** Formatting of a requested set of problems, never a list of solved steps. */
export function requestedExerciseCount(student){
 const n=student.trim().match(/^(?:hãy\s+)?(?:tạo|sinh)\s+(?:đúng\s+)?([5-9]|10)\s+câu\b/iu)?.[1];
 return n?Number(n):0;
}

export function exerciseSetGuidance(student){
 const count=requestedExerciseCount(student);if(!count)return '';
 return `\nTẠO BỘ ĐỀ CHƯA CÓ LỜI GIẢI
Lượt này tạo đúng ${count} đề độc lập, không phải hướng dẫn giải một đề đã chọn. Giữ mức độ trong hồ sơ, chủ đề và độ khó em yêu cầu.
Một SO_DO chung cho việc chọn bài, một dòng Thao tác tư duy. Sau đó viết từ “Câu 1:” đến “Câu ${count}:”, mỗi đề một đoạn, khoảng 25–45 từ, đủ giả thiết và kết luận. Các câu hỏi nằm trong đề là nhiệm vụ học tập, không phải nhiều câu hỏi gợi mở cùng lúc. Không tạo SO_DO riêng cho từng câu. Không nêu đáp án, cách giải, gợi ý hay điểm số. Với bài tìm lỗi, ghi rõ lập luận đang cần kiểm tra là của một bạn, không khẳng định lập luận đó đúng.
Cuối cùng chỉ viết: “Gợi mở: Em muốn bắt đầu với câu nào trong bộ ${count} câu này?” Không thêm KET_THUC_BUOI_HOC. Lượt sau, khi em chọn câu, chỉ hướng dẫn câu đó theo năm giai đoạn và chờ em tự làm từng bước. Danh sách đề được phép dài hơn giới hạn của một lượt gợi mở thông thường.\n`;
}

export function exercisePlan(count){
 return `[SO_DO]\nDU_KIEN: Bộ ${count} bài tập độc lập; mỗi bài có giả thiết riêng.\nMUC_TIEU: Chọn một bài để bắt đầu.\nCAU_NOI: Phân biệt điều đề cho với điều cần lập luận.\nBUOC_TIEP: Chọn số của một câu trong bộ đề.\n[/SO_DO]\nThao tác tư duy: Phân tích — tập trung vào một nhiệm vụ trước khi giải.`;
}

/** Accept common numbered-list formatting; do not invent missing problems. */
export function normalizeExerciseSet(text,count){
 if(!count||/\[KET_THUC_BUOI_HOC\]|(?:^|\n)\s*(?:#{1,4}\s*)?(?:\*\*)?(?:lời giải|đáp án|bài giải)(?:\s+(?:chi tiết|hoàn chỉnh|đầy đủ))?\s*[:：]|(?:^|\n)\s*(?:\*\*)?Bước\s*[2-9]\s*[:.]/imu.test(text))return null;
 const cleaned=text.replace(/\[SO_DO\][\s\S]*?\[\/SO_DO\]/g,'').replace(/\*\*/g,'');
 const starts=[...cleaned.matchAll(/^[ \t]*(?:#{1,4}\s*)?(?:(?:Câu|Bài)\s+)?(\d{1,2})\s*[:：.)–-]\s*/gimu)];
 if(starts.length!==count||starts.some((m,i)=>Number(m[1])!==i+1))return null;
 const problems=starts.map((m,i)=>cleaned.slice(m.index+m[0].length,starts[i+1]?.index??cleaned.length)
  .replace(/\n\s*(?:Gợi mở\s*:|Thao tác tư duy\s*:|Em muốn|Em chọn|Hãy chọn|Thầy mời)[\s\S]*$/iu,'').trim());
 if(problems.some(p=>p.length<12||p.length>1600||/\[(?:SO_DO|DE_HINH_HOC)/.test(p)))return null;
 return exercisePlan(count)+'\n\n'+problems.map((p,i)=>`Câu ${i+1}: ${p}`).join('\n\n')+`\n\nGợi mở: Em muốn bắt đầu với câu nào trong bộ ${count} câu này?`;
}

export function incompleteExerciseSet(count){
 return `[SO_DO]\nDU_KIEN: Bộ đề vừa nhận chưa đạt yêu cầu ${count} câu chưa có lời giải.\nMUC_TIEU: Nhận đủ bộ đề trước khi chọn bài.\nCAU_NOI: Kiểm tra số câu và tách đề bài khỏi lời giải.\nBUOC_TIEP: Yêu cầu tạo lại bộ đề hoặc chọn bài trong ngân hàng.\n[/SO_DO]\nThao tác tư duy: Kiểm tra và phản biện lập luận — kiểm tra yêu cầu đầu vào.\nThầy chưa nhận được bộ đề hợp lệ nên chưa hiển thị danh sách này.\nGợi mở: Em muốn tạo lại bộ ${count} câu theo chủ đề vừa chọn không?`;
}
