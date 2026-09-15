# Nhật ký prompt/model

| Mục | Giá trị |
| --- | --- |
| Ngày chỉnh sửa | 15/09/2026 |
| Prompt hiện tại | `5.1.0-2026-09-15` |
| Mô hình mặc định | `gemini-2.5-flash` — giữ nguyên cấu hình cũ |
| Có đổi model/huấn luyện lại không | Không |
| Ranh giới trình bày | `one-reviewed-task-v5.1`; bộ đề: `reviewed-exercises-no-solutions-v5.1` |
| Khóa | `GEMINI_API_KEY`, server-only; không đổi thành khóa frontend |
| Gemini thật | Chưa chạy; không có khóa nghiệm thu |

## Thay đổi

1. Mở ngữ cảnh từ tứ giác lớp 8 sang hình học phẳng THCS, giữ trọng tâm tứ giác.
2. Nhận tóm tắt hồ sơ tích lũy, không gán năng lực chỉ qua một lượt; chỉ đánh giá trích đoạn đúng của học sinh.
3. Thêm schema công khai `TU_DUY_V5`, đầy đủ thông tin câu hỏi, đánh giá và lý thuyết dự kiến; không yêu cầu suy nghĩ nội bộ.
4. Thêm hướng dẫn thao tác tư duy và phạm vi nguồn PDF đúng trang; phân biệt nghiên cứu với ngưỡng sản phẩm.
5. Tăng token đầu ra nhánh V5 lên 4.400 để đủ schema; tối đa hai lần gọi trong 25 giây. Model mặc định vẫn có thinkingBudget 512; phần `thought` không chuyển cho học sinh. Nhánh kiểm tra kết nối và nhánh tương thích giữ cấu hình gọi cũ.
6. Bản 5.1 bổ sung ranh giới trình bày không chuyển nội dung tự do, để thực thi yêu cầu mới cấm lời giải toàn bài. Nhánh cũ cũng được bảo vệ. Footer thêm đúng tên tác giả/hướng dẫn.

## Kiểm thử gắn với thay đổi

`tests/v5-api.test.mjs`: JSON đúng/sai, trích dẫn giả, sửa dấu phẩy cuối, thử lại một lần, fallback không chấm điểm, tránh phần thought/API key, giới hạn 429.

`tests/v5-boundary.test.mjs`: bốn mức câu hỏi, bỏ văn bản/metadata lời giải, nhánh cũ không vượt bảo vệ, yêu cầu mã hóa/giả danh/ép trả lời, bộ đề 5–10 câu, chọn bài, bài tương tự, tên tác giả, tâm đường tròn không gọi nhầm tính chất đường chéo.

Các kiểm thử này dùng phản hồi API mô phỏng, không được hiểu là đã đo độ chính xác của `gemini-2.5-flash` thực tế. Danh sách và kết quả từng ca ở `research/v5-checks/tests.jsonl`; ba lệnh bắt buộc và mười ca dựng hình ở `BAO_CAO_KIEM_THU.md`.

Lỗi/giới hạn còn lại: câu hỏi có thể lặp; độ khó bộ đề chưa phân hóa đầy đủ; đánh giá AI chưa hiệu chuẩn; lý thuyết mới cần biên tập; chưa nghiệm thu live/model trên Netlify và trình duyệt. Không có log nội dung chat học sinh thật, không ghi khóa API vào báo cáo.
