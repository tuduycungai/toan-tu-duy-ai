const levels={
 'Mất gốc':{focus:'Củng cố nền tảng',hint:2,task:'Bắt đầu từ một đối tượng cụ thể: cạnh, góc hoặc trung điểm. Giải thích một thuật ngữ bằng lời quen thuộc rồi hỏi em áp dụng đúng một định nghĩa. Dùng câu ngắn, không gộp hai điều kiện. Ưu tiên phân tích và so sánh trực tiếp.'},
 'Cơ bản':{focus:'Kết nối giả thiết với dấu hiệu',hint:1,task:'Hỏi em chọn một dấu hiệu đã học, rồi đối chiếu một điều kiện với giả thiết. Nhắc định nghĩa khi cần, để em tự nêu căn cứ. Ưu tiên phân tích, kết nối rồi tổng hợp.'},
 'Khá':{focus:'Tự chọn và giải thích hướng chứng minh',hint:1,task:'Để em tự chọn đối tượng và dấu hiệu đủ trước khi gợi tên định lí. Hỏi căn cứ của mắt xích còn thiếu. Sau khi em giải được, có thể so sánh với một cách đã học hoặc chuyển sang bài tương tự.'},
 'Giỏi':{focus:'Lập luận độc lập và kiểm tra điều kiện',hint:1,task:'Không chỉ sẵn cặp tam giác hay đoạn phụ nếu em chưa cần. Hỏi một quyết định về điều kiện đủ hoặc cách kiểm tra một mệnh đề đảo. Khi bài đã hoàn thành, dùng so sánh, đặc biệt hóa hoặc phản ví dụ trong chương trình lớp 8.'},
 'Học sinh năng khiếu':{focus:'Khái quát có điều kiện và chuyển giao',hint:1,task:'Để em tự đề xuất hướng, kiểm tra tính cần/đủ và phạm vi áp dụng. Sau lời chứng minh do em hoàn thành, đặt một nhiệm vụ khái quát hóa có điều kiện hoặc tìm phản ví dụ. Không đẩy sang tọa độ, vectơ hay kiến thức chưa học.'}
};
levels['Mất căn bản']=levels['Mất gốc'];
export function learnerProfile(messages=[]){
 const latest=[...messages].reverse().find(m=>m.role==='user')?.content||'';
 const raw=latest.match(/^\[Bối cảnh học tập tự khai\]\s*(\{[^\n]{1,6000}\})\s*\n/);let p={};try{p=raw?JSON.parse(raw[1]):{};}catch{}
 const level=Object.hasOwn(levels,p.mucDo)?p.mucDo:'Cơ bản';
 return {level,...levels[level]};
}
export function learnerGuidance(messages=[]){const p=learnerProfile(messages);return `\nĐIỀU CHỈNH THEO HỒ SƠ HỌC TẬP\nMức tự khai: ${p.level}. Mục tiêu hỗ trợ: ${p.focus}. Điểm bắt đầu gợi ý: mức ${p.hint}.\n${p.task}\nMức tự khai và điểm trung bình chỉ là thông tin ban đầu, không phải chẩn đoán hoặc nhãn năng lực cố định. Không suy mức học từ tên, trường, giới tính hay địa chỉ. Phân tích câu trả lời thực tế theo ba dấu hiệu: nêu đúng đối tượng, chọn đúng quan hệ, giải thích đúng căn cứ. Khi đủ ba dấu hiệu, giảm hỗ trợ; nếu thiếu căn cứ thì hỏi căn cứ; nếu sai thì chỉ xử lý lỗi đầu tiên; nếu chưa biết thì tăng một mức cho cùng mắt xích. Không tự sửa hồ sơ hoặc tự chấm điểm năng lực bằng số khi chưa có bài kiểm tra phù hợp. Không gọi em là yếu/kém trong hội thoại. Mọi mức đều hỏi đúng một câu, không cung cấp đáp án.\n`;}
