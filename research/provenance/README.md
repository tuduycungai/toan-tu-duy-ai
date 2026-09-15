# Minh chứng sử dụng AI trong bản V4.4

Hồ sơ ghi nhận AI đã hỗ trợ tạo và sửa mã nguồn trong phiên làm việc này. Nhật ký được lập lại từ phần hội thoại hiện có, phân biệt tin nhắn đầy đủ và trích đoạn. Không có thời điểm gửi gốc cho từng tin; thời điểm lập hồ sơ không được dùng thay ngày thực hiện yêu cầu. Bản xuất đầy đủ cuộc trò chuyện cần được giữ cùng sổ tay nếu có.

- `prompt-log.json` và `NHAT_KY_CAU_LENH.md`: câu lệnh của người dùng, cách xử lý, kết quả đối chiếu; không chứa chỉ dẫn nội bộ hay suy nghĩ riêng của mô hình.
- `code-attribution.json`, `DANH_MUC_MA_AI.md`, `AI_CODE_CHANGES.patch`: đoạn mã thêm/sửa do AI thực hiện, số dòng ở bản V4.4, hash trước/sau và mã câu lệnh liên quan. Phần kế thừa không tự động được coi là do người viết.
- `prompts`: bản ghi nguyên văn chỉ dẫn của ứng dụng, xuất trực tiếp bằng `instructions()` cho các chế độ và năm hồ sơ. Đây là bản chụp cấu hình, không phải log phản hồi Gemini thật.
- `research-evidence.json`: tài liệu đã xử lý, phạm vi đọc, cách chuyển thành chỉ dẫn và giới hạn bằng chứng.
- `inputs`: bản sao nguyên nội dung của hai PDF và ảnh hướng dẫn do giáo viên cung cấp. `source-inputs.json` nối tên tệp gốc với tên lưu trong hồ sơ và SHA-256 để đối chiếu.
- `SO_TAY_MINH_CHUNG_AI_V4_4.docx`: bản trình bày để đưa vào sổ tay nghiên cứu; có ghi nguồn hỗ trợ AI.

Các log kiểm thử thật ở `research/release-checks`. Sổ tay không xác nhận học sinh đã đọc tài liệu, tự viết phần mã này hoặc tham gia thực nghiệm khi chưa có minh chứng tương ứng. Không có fine-tuning, cập nhật trọng số hoặc huấn luyện lại Gemini trong bản này.
