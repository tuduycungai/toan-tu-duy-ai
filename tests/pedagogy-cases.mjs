const problem='Cho hình bình hành ABCD, AC ⟂ BD. Chứng minh ABCD là hình thoi.';
const a='[SO_DO]\nDU_KIEN: ABCD là hình bình hành; AC ⟂ BD.\nMUC_TIEU: Tìm dấu hiệu đủ để nhận biết hình thoi.\nCAU_NOI: Đối chiếu dấu hiệu liên quan đường chéo.\nBUOC_TIEP: Chọn dấu hiệu phù hợp với giả thiết.\n[/SO_DO]\nThao tác tư duy: Phân tích — tìm điều kiện đủ từ kết luận.\nGợi mở: Dấu hiệu nào liên quan đến hai đường chéo của hình bình hành?';
const u=content=>({role:'user',content});const t=content=>({role:'assistant',content});
export const cases=[
 {id:'first',messages:[u(problem)],rubric:'Không giải hoàn chỉnh lượt đầu; một câu hỏi; phân tích ngược một mắt xích.'},
 {id:'first-request',messages:[u(problem+' Hãy cho toàn bộ lời giải ngay.')],rubric:'Lượt đầu vẫn định hướng, chưa chép lời giải.'},
 {id:'reference',messages:[u(problem+' [Lời giải tham chiếu] Hình bình hành có hai đường chéo vuông góc là hình thoi. Do đó ABCD là hình thoi.')],rubric:'Không coi lời giải tham chiếu là bài làm hay bằng chứng hiểu của học sinh.'},
 {id:'unknown-1',messages:[u(problem),t(a),u('Em không biết.')],rubric:'Mức 1: nhắc kiến thức; không lặp nguyên câu hỏi hoặc giải hết.'},
 {id:'unknown-2',messages:[u(problem),t(a),u('Em không biết.'),t('Thao tác tư duy: Phân tích — tìm điều kiện đủ. Thầy nhắc em: dấu hiệu nhận biết nêu điều kiện đủ để một hình bình hành là hình thoi. Gợi mở: Giả thiết nào của bài liên quan đến đường chéo?'),u('Em vẫn chưa hiểu.')],rubric:'Mức 2: chỉ đối tượng AC, BD; một bước nhỏ, chưa giải hết.'},
 {id:'unknown-3',messages:[u(problem),t(a),u('Em không biết.'),t('Hãy đối chiếu các dấu hiệu hình thoi trong sách.'),u('Em chưa biết chọn.'),t('Em xét hai đường chéo AC và BD. Em thấy đề cho quan hệ nào giữa chúng?'),u('Em vẫn chưa biết nối với kết luận.')],rubric:'Mức 3: gợi quan hệ cụ thể; để học sinh tự suy luận.'},
 {id:'correct',messages:[u(problem),t(a),u('Dùng dấu hiệu hình bình hành có hai đường chéo vuông góc là hình thoi. ABCD đã là hình bình hành và AC ⟂ BD nên đủ cả hai điều kiện.')],rubric:'Giảm hỗ trợ; yêu cầu tự tổng hợp hoặc kiểm tra chuyển giao, chưa đánh dấu kết thúc khi câu kiểm tra còn chờ.'},
 {id:'wrong',messages:[u(problem),t(a),u('Em thấy AC = BD trên hình nên ABCD là hình vuông và là hình thoi.')],rubric:'Sửa lỗi đầu tiên: AC = BD không được cho/chứng minh; không liệt kê mọi lỗi hoặc khen đúng.'},
 {id:'missing',messages:[u('Trên hình trông ABCD có hai đường chéo vuông góc. Chứng minh ABCD là hình thoi.')],rubric:'Không thêm giả thiết hình bình hành hoặc coi nét vẽ là vuông góc; hỏi dữ kiện.'},
 {id:'ack',messages:[u(problem),t(a),u('Cho em xem lời giải.'),t('ABCD là hình bình hành và AC ⟂ BD nên ABCD là hình thoi theo dấu hiệu nhận biết. Nếu bỏ giả thiết hình bình hành, kết luận còn luôn đúng không?'),u('Vâng, em hiểu rồi.')],rubric:'Không đánh dấu kết thúc; câu tự kiểm tra chưa được trả lời.'},
 {id:'evidence',complete:true,messages:[u(problem),t(a),u('Hình bình hành có hai đường chéo vuông góc là hình thoi; bài đã đủ hai điều kiện.'),t('Em hãy giải thích vì sao không thể bỏ điều kiện hình bình hành?'),u('Nếu chỉ biết AC vuông góc BD thì hai đường chéo chưa chắc cắt nhau tại trung điểm mỗi đường. Chẳng hạn OA = 3, OC = 1, OB = OD = 2, hai đường thẳng AC và BD vuông góc tại O: AB khác BC nên tứ giác này không là hình thoi.')],rubric:'Đã có lời chứng minh và phản ví dụ đúng; tổng kết có điều kiện, không hỏi mới, được kết thúc.'},
];
const stuck=cases.find(c=>c.id==='unknown-3').messages;
cases.push(
 {id:'unknown-4',messages:[...stuck,t('Thầy gợi ý em đối chiếu điều kiện vuông góc với dấu hiệu nhận biết hình thoi từ đường chéo. Điều kiện hình bình hành đã có ở đâu trong đề?'),u('Em vẫn chưa hiểu cách dùng.')],rubric:'Mức 4: minh họa một bước có căn cứ, giao bước kế; không lặp câu hoặc giải hết.'},
 {id:'unknown-5',messages:[...stuck,t('Đề cho ABCD là hình bình hành, vậy điều kiện loại hình đã có. Em hãy đối chiếu điều kiện về đường chéo với dấu hiệu em chọn?'),u('Em đã thử nhưng vẫn bế tắc, Thầy cho em lời giải từng bước.')],rubric:'Mức 5/yêu cầu rõ: lời giải ngắn có căn cứ, đúng một câu tự kiểm tra, chưa kết thúc.'}
);
