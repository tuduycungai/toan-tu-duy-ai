# V5: Câu hỏi gắn với thao tác tư duy

Luồng sư phạm được giữ: **Giả thiết → Mục tiêu → Phân tích ngược → Kiến thức kết nối → Bước học sinh tự làm → Phản hồi → Tổng hợp → Tự kiểm tra → Vận dụng**. Các chế độ gợi mở, kiểm tra lời giải, so sánh, luyện tập và tự kiểm tra vẫn dùng API hiện có.

## Cơ chế

`planThinkingQuestion` tạo nhiệm vụ ứng viên theo đề, mục tiêu, mức hỗ trợ và quan sát gần nhất. `learnerContext` gửi dữ liệu tham khảo kèm yêu cầu đến cùng endpoint `/api/chat`. `server/adaptive-policy.mjs` chỉ đưa giá trị khối lớp và mức hỗ trợ đã kiểm tra vào chỉ dẫn hệ thống; không nội suy tùy tiện văn bản tự khai thành chỉ dẫn có quyền cao.

Gemini được yêu cầu xét câu trả lời thực tế: thao tác đã dùng; lỗi đầu tiên hoặc điều kiện còn thiếu; mức hỗ trợ cần; một câu hỏi tiếp theo và yêu cầu nêu căn cứ. Bộ bảo vệ Socratic cũ tiếp tục kiểm tra cấu trúc, số câu hỏi, yêu cầu xin đáp án và điều kiện kết thúc. V5 sửa bộ tách yêu cầu để khối hồ sơ không bị coi nhầm là bài làm của học sinh.

Mỗi câu hỏi hiển thị được lưu với các trường:

```json
{
  "question": "Câu hỏi thực tế được hiển thị",
  "thinkingOperation": "Phân tích",
  "learningObjective": "Kết nối dữ kiện với điều kiện đủ",
  "evidence": "Bằng chứng của bước đang làm",
  "supportLevel": 1,
  "expectedStudentAction": "Nêu căn cứ cho một quan hệ",
  "nextStep": "Chờ trả lời, kiểm tra một mắt xích",
  "hintPolicy": "Không đưa đáp án trực tiếp"
}
```

`questionFromReply` ghi câu hỏi từ phản hồi thực tế, không ghi câu hỏi dự kiến như thể AI đã hỏi nó. Lời chào không có câu hỏi sẽ không tạo một câu hỏi giả trong nhật ký. Nhãn thao tác được lấy từ câu “Thao tác tư duy:” khi nhận ra; mục tiêu và bước tiếp theo là siêu dữ liệu sư phạm do ứng dụng đề xuất, không phải điểm đánh giá đã xác minh.

## Nguồn tài liệu đã đọc

- **Bài giảng vấn đề tư duy.pdf**: 18 trang. Các trang 9–14 trình bày phân tích/tổng hợp, so sánh/tương tự hóa, khái quát hóa/đặc biệt hóa và vai trò rèn luyện qua nhiệm vụ thực hành.
- **các thao tác tư duy.pdf**: Nguyễn Thanh Hưng – Ngô Tùng Nhân, “Rèn luyện thao tác tư duy cho học sinh trong dạy học chương ‘Tứ giác’ (Toán 8) ở trường trung học cơ sở”, Tạp chí Giáo dục, số đặc biệt tháng 4/2019, tr.184–187. Đây là bài báo trong yêu cầu dù tên tệp được đính kèm khác tên được nêu trong văn bản.

Ứng dụng vận dụng việc chia nhiệm vụ, gắn thao tác với đối tượng và kết nối điều kiện đủ. Không sao chép cả hệ thống câu hỏi kèm lời giải của bài báo vào một lượt. Giữ hiệu chỉnh có sẵn: hai đường chéo hình thoi **không nhất thiết** bằng nhau; hình vuông là trường hợp chúng bằng nhau. Không tuyên bố tài liệu đã chứng minh hiệu quả của chính phần mềm V5.
