# Nhật ký câu lệnh hỗ trợ phát triển V4.4

Lập lúc 2026-09-14T09:31:09.263039+00:00. Các ngày gửi gốc chưa có dữ liệu. Nhật ký này ghi lại các yêu cầu liên quan nhìn thấy trong cuộc trò chuyện, không phải bản xuất đầy đủ của nền tảng.

## PR01 Bảo toàn nền tảng

Trích đoạn nguyên văn; thời điểm gửi: chưa xác định.

> Giữ nguyên hệ thống API đang hoạt động. 
> - Giữ nguyên server/backend. 
> - Giữ nguyên cách gọi Gemini API.

Xử lý: Giữ giao thức và cấu hình; chỉ tích hợp cơ chế gia sư ở các điểm đã ghi rõ.

Đối chiếu: tests/preserved.test.mjs; source-diff.json

## PR02 Tên và màu giao diện

Trích đoạn nguyên văn; thời điểm gửi: chưa xác định.

> Tư duy Toán học
> -Mỗi tứ giác là một câu chuyện tư duy\_Mỗi lời giải là một hành trình khám phá

Xử lý: Tên và chủ đề màu đã có trong bản kế thừa V4.3; V4.4 giữ nguyên.

Đối chiếu: app/globals.css; index.html; không suy ra tác giả ban đầu từ việc giữ nguyên

## PR03 Mã lớp

Toàn bộ nội dung tin nhắn văn bản; thời điểm gửi: chưa xác định.

> TÔI MUỐN ĐỔI MÃ LỚP THÀNH "HOCGIOITOAN"

Xử lý: Giữ mã lớp hiện tại; không thay bằng khóa Gemini ở phía học sinh.

Đối chiếu: .env.example; server/gemini.mjs; tests/gemini.test.mjs

## PR04 Gợi mở theo giai đoạn

Trích đoạn nguyên văn; thời điểm gửi: chưa xác định.

> Khi học sinh nhập một bài toán hình học, AI không được đưa ngay toàn bộ lời giải. AI phải tổ chức cuộc trò chuyện thành từng giai đoạn, sử dụng câu hỏi gợi mở để học sinh:

Xử lý: Giữ năm giai đoạn, sơ đồ bốn trường và một câu hỏi mỗi lượt; điều kiện xin lời giải ở yêu cầu này được thay thế bởi PR08.

Đối chiếu: server/policy.mjs; tests/policy.test.mjs; tests/pedagogy-cases.mjs

## PR05 Thêm hình theo bài

Toàn bộ nội dung tin nhắn văn bản; thời điểm gửi: chưa xác định.

> Phát triển trang wed trên thêm tính năng khi học sinh hỏi bài hình tứ giác, Gia sư xuất thêm hình vẽ của bài đó.

Xử lý: Dựng hình từ quan hệ và kiểm tra lại, xuất SVG và TikZ cùng tọa độ.

Đối chiếu: lib/geometry.ts; lib/problem-diagram.ts; components/problem-figure.tsx

## PR06 Hiểu cách diễn đạt đề

Toàn bộ nội dung tin nhắn văn bản; thời điểm gửi: chưa xác định.

> Tinh chỉnh lại làm sao AI hiệu hết các ngữ cạnh của đề vẽ chuẩn xác nhất

Xử lý: Bổ sung đọc ngữ cảnh vị trí điểm, thứ tự lần lượt và giao điểm; không cam kết mọi cách diễn đạt tự do đều được hỗ trợ.

Đối chiếu: lib/point-language.ts; tests/context-diagram.test.mjs; tests/midpoint-language.test.mjs

## PR07 Rà soát toàn bộ phiếu bài tập

Toàn bộ nội dung tin nhắn văn bản; thời điểm gửi: chưa xác định.

> Như vậy mới vẽ được hình. Yêu cầu Xem tất cả các bàn trong file Chatbot còn không hiểu đề để vẽ bài hình nào thì viết lại để đạm bảo mọi hình đều vẽ được. Đồng thời tự kiểm nghiệm giúp tôi chính xác hơn và sửa lại các lỗi để phiên bảntiếp theo là hoàn chỉnh tuyệt vời không một chút sai xót hoặc thiếu

Xử lý: Lập danh mục 81 bài, 93 hình, biên tập đề và kiểm tra điều kiện. Những giới hạn kiểm chứng được ghi trong báo cáo, không đổi thành lời cam kết tuyệt đối.

Đối chiếu: lib/worksheets.ts; tests/worksheets.test.mjs; research/worksheet-checks

## PR08 Điện thoại và tỉ lệ và cấm xin đáp án

Trích đoạn nguyên văn gồm ba yêu cầu; thời điểm gửi: chưa xác định.

> - Cập nhật thêm lỗi dùng trên điện thoại ( Như hình)  
> - Viết 2AM=AB Chatbot không hiểu tỉ lệ đoạn thẳng và tr ảvề kết quả không v ẽhình được
> 
> - Tuyệt đối nghiêm ngặt không cho HS xin đáp án và xuất đáp án, bắt buột phải qua các câu hỏi gởi mở

Xử lý: Bổ sung KaTeX, đọc hệ số đoạn thẳng, loại ngoại lệ cho lời giải hoàn chỉnh và thêm bộ chặn nội dung.

Đối chiếu: components/math-text.tsx; lib/ratio-language.ts; server/strict-tutor.mjs; tests/math.test.mjs; tests/ratios.test.mjs; tests/strict-tutor.test.mjs

## PR09 Excel và cá nhân hóa và nghiên cứu

Trích đoạn nguyên văn; thời điểm gửi: chưa xác định.

> - Yêu cầu thêm khi thu thập thông tin HS có phân loại học sinh, Chatbot ghi nhận và phân tích đưa ra các câu hỏi gởi mở, định hướng thao tác tư duy phù hợp với đối tượng HS đó
> - dưới phần xuất hình ảnh có bản tổng hợp Lý thuyết cần phải dùng ở bài tập đó.

Xử lý: Thêm năm định hướng theo hồ sơ, thẻ lý thuyết, đối chiếu nghiên cứu 2019 và Excel kiểm thử thật. Yêu cầu dọn nhãn công cụ trước đó được cập nhật theo PR10 về ghi nhận đóng góp AI.

Đối chiếu: server/learner-guidance.mjs; server/research-pedagogy.mjs; lib/theory.ts; KIEM_THU_AI_TUTOR_V4_4.xlsx

## PR10 Nhật ký và trích dẫn đóng góp AI

Toàn bộ nội dung tin nhắn văn bản không gồm ảnh đính kèm; thời điểm gửi: chưa xác định.

> Tiếp tục công việc đang gian dở 
> Đồng thời làm thêm: 
> 
> - Cho tôi file minh chứng trích dẫn. Phải lưu lại nhật ký câu lệnh (prompt log) trong sổ tay nghiên cứu.
> - file trích dẫn rõ phần code nào do AI tạo ra và kèm theo nhật ký câu lệnh
> - file minh chứng nghiêm cứu tài liệu về phát triển các thao tác tư duy chỉ ra định hướng phát triển prompt như thế nào hay phải tập huấn cho AI chatbot như thế nào để AI có thể ra được phiên bản hiện tại.

Xử lý: Lập sổ tay, bản diff theo dòng, nhật ký câu lệnh trích xuất và ảnh chụp cấu hình prompt. Phân biệt thiết kế chỉ dẫn với huấn luyện lại mô hình.

Đối chiếu: research/provenance; SO_TAY_MINH_CHUNG_AI_V4_4.docx; IMG_5901.jpeg do giáo viên cung cấp
