# Gợi mở theo thao tác tư duy — không trả lời cả bài

Nguyên tắc: **Dữ kiện → Mục tiêu → Kiến thức kết nối → Học sinh tự làm**. Sơ đồ bốn phần cũ vẫn có mặt. Mỗi lượt trình bày một nhiệm vụ, có mục tiêu học tập và hành động quan sát được; không phát một chuỗi lời giải.

## Cơ chế đầu ra V5.1

Model phân tích minh chứng và đề xuất metadata, server kiểm tra JSON, kiểm tra câu hỏi và trích đoạn; JSON lỗi được sửa cú pháp có giới hạn, gọi lại tối đa một lần và dùng dự phòng không chấm điểm khi vẫn không hợp lệ. Không dùng `eval`.

Sau kiểm tra còn có ranh giới trình bày: **không chuyển nguyên văn nội dung tự do của model đến học sinh**, kể cả ở câu hỏi, lỗi, lý thuyết hoặc trường JSON thừa. Server tự tạo câu hỏi từ mẫu đã kiểm soát, lấy tên điểm/loại hình/mục tiêu phù hợp từ đề, chọn mức hỗ trợ và bước theo lịch sử. Vì vậy một lời giải không có tiêu đề cũng không vượt qua bằng cách né từ khóa “Lời giải”. Nhánh API không có hồ sơ V5 chịu cùng ranh giới.

Yêu cầu xin đáp án/lời giải đầy đủ được chặn trước khi gọi nhà cung cấp. Không có ngoại lệ khi tự nhận là giáo viên, học sinh giỏi, đã thử nhiều lần hay yêu cầu bằng ngôn ngữ/mã hóa khác. Những cách diễn đạt không khớp bộ phát hiện vẫn qua ranh giới trình bày cuối. Các mẫu phản hồi không chép lại toàn bộ bài làm đã đúng của học sinh; chỉ ghi đoạn minh chứng ngắn.

Chế độ luyện tập vẫn ra 5–10 đề từ dữ liệu đề gốc, không kèm đáp án. Chọn “Câu n” liên kết tới đúng bài đang học. “Bài tương tự” xuất một đề. Khi thiếu số lượng cùng chủ đề, có biến thể đổi tên điểm từ đề gốc. Cấu trúc này chưa phân hóa đầy đủ theo mọi tùy chọn độ khó như một bộ sinh đề mới tự do; cần giáo viên kiểm tra độ phù hợp.

## Câu hỏi và điều chỉnh

| Mức khởi đầu | Kiểu nhiệm vụ | Ví dụ câu hỏi mẫu |
| --- | --- | --- |
| Củng cố nền tảng | Nhận hình, tách kết luận, một định nghĩa | Đề bài cho biết hình gì, và cụm từ nào giúp em nhận diện hình đó? |
| Cơ bản | Kết nối một dữ kiện với tính chất | Tính chất đường chéo của hình đã cho giúp em nhận ra quan hệ nào tại O? |
| Khá | Đề xuất một chiến lược có căn cứ | Em có thể đề xuất một chuỗi điều kiện đủ dẫn tới mục tiêu, bắt đầu từ dữ kiện nào? |
| Giỏi | Đưa và kiểm tra một giả thuyết | Quan hệ nào em dự đoán là then chốt để tự xây dựng một hướng chứng minh, và em sẽ kiểm tra nó thế nào? |

Sai/thiếu: hỏi kiểm tra một điều kiện còn thiếu, tăng hỗ trợ theo minh chứng. Đúng: yêu cầu tự giải thích lại hoặc sắp xếp mắt xích tiếp. Học sinh khá/giỏi đã đưa hai hướng có thể được hỏi so sánh; khái quát hóa chỉ khi đến bước chuyển giao. Câu hỏi có trường `question`, `thinkingOperation`, `learningObjective`, `evidence`, `supportLevel`, `expectedStudentAction`, `nextStep`, `hintPolicy`. Các trường được lưu cùng tiến trình.

Danh mục thao tác gồm phân tích, tổng hợp, so sánh, cụ thể hóa, trừu tượng hóa, khái quát hóa, suy luận, phát hiện quan hệ, kiểm tra/phản biện, hình thành giả thuyết, chứng minh/giải thích; bổ sung tương tự hóa và đặc biệt hóa theo tài liệu. Đây là nhãn công khai cho hoạt động học tập, không phải yêu cầu tiết lộ suy nghĩ nội bộ của AI.

## Căn cứ từ hai tài liệu đính kèm

- **Bài giảng vấn đề Tư duy**: PDF trang 6 trình bày trừu tượng hóa/khái quát hóa; trang 7 có sơ đồ quá trình tư duy và kiểm tra giả thuyết; trang 9–11 nói về phân tích/tổng hợp và tiến trình giải; trang 11–14 bàn về so sánh, tương tự, khái quát/đặc biệt hóa và rèn thao tác. Áp dụng thành quy trình hỏi → học sinh nêu căn cứ → kiểm tra → điều chỉnh, không chép lời giải trong bài giảng lên chat. Bản đính kèm chưa xác định rõ tác giả; không tự gán tác giả/năm.
- **Nguyễn Thanh Hưng – Ngô Tùng Nhân (2019)**, “Rèn luyện thao tác tư duy cho học sinh trong dạy học chương ‘Tứ giác’ (Toán 8) ở trường trung học cơ sở”, *Tạp chí Giáo dục*, số đặc biệt tháng 4, trang in **184–187** tương ứng PDF **1–4**. Trang 184–185: phân tích/tổng hợp và hệ câu hỏi; trang 185–186: tương tự; trang 186: khái quát/đặc biệt hóa; trang 187: so sánh. Dùng để thiết kế loại hành động và câu hỏi có căn cứ, không tuyên bố nghiên cứu đã kiểm định phần mềm này.

Lưu ý biên tập: không sao chép phát biểu “đường chéo hình thoi không bằng nhau” thành một mệnh đề tuyệt đối (trang 187 bài báo). Phát biểu đúng là **không nhất thiết bằng nhau**, hình vuông là trường hợp bằng nhau. Ví dụ xác suất trang 11 bài giảng có chỗ lệch giữa điều kiện chia hết cho 6/4; không dùng vào thuật toán hay ngân hàng.

Giới hạn: bộ câu hỏi trình bày được kiểm soát nên có thể lặp lại và còn ít biến thể ngữ cảnh. AI vẫn có thể nhận xét sai minh chứng. Chưa có thí nghiệm sư phạm chứng minh mức tăng năng lực; cần khảo sát với giáo viên trước khi dùng để đánh giá chính thức.
