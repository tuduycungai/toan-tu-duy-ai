# Nhật ký prompt và model V5

| Mục | Giá trị |
|---|---|
| Ngày sửa | 16/09/2026 |
| Phiên bản prompt | `tugiac-v5.0-2026-09-16` |
| Phiên bản ứng dụng | `5.0.0` |
| Model mặc định | `gemini-2.5-flash` (giữ nguyên từ dự án gốc) |
| Ghi đè model | Tiếp tục dùng biến `GEMINI_MODEL` hiện có |
| Thay API/backend vận chuyển | Không |
| Kiểm thử gọi Gemini thật | Chưa chạy; không có khóa API được cấu hình trong phiên này |

## Nội dung thay đổi

- `server/policy.mjs`: mở phạm vi theo yêu cầu sang hình học THCS, giữ trọng tâm tứ giác lớp 8 và quy tắc hỏi một nhiệm vụ, không đưa lời giải hoàn chỉnh.
- `server/adaptive-policy.mjs`: bổ sung lớp/mức hỗ trợ, ràng buộc kiểm tra điều kiện, cách đọc “theo thứ tự”, “tâm O” và phân biệt hình tạm với chứng minh.
- `server/learner-guidance.mjs`: nhận thêm nhãn “Mất căn bản” tương thích nhãn cũ.
- `server/strict-tutor.mjs`: tách khối hồ sơ V5 ra khỏi bài làm khi xét yêu cầu xin đáp án và điều kiện kết thúc.
- `lib/adaptive-learning.ts`: tạo dữ liệu cá nhân hóa và nhật ký câu hỏi thực tế.

Cấu hình truyền tải, URL Gemini, schema `/api/chat`, giới hạn lịch sử, xác thực mã lớp, timeout, khóa API ở server và endpoint phản hồi được giữ nguyên.

## Bản chụp và kết quả

`research/v5-checks/prompts/` chứa 12 bản chụp: ba chế độ API × bốn mức học. `manifest.json` ghi SHA-256, mức hỗ trợ, chế độ, phiên bản và trạng thái chưa kiểm thử trực tiếp.

Danh sách ca và kết quả thực tế nằm trong `docs/V5_TEST_REPORT.md`, `research/v5-checks/npm-test.log`, `v5-tests.log`, `browser-results.json`. Các kiểm tra backend dùng fetch giả lập để kiểm tra chính xác payload/chỉ dẫn; các kiểm tra trình duyệt dùng phản hồi API giả lập để không gửi dữ liệu đến Gemini hoặc Google Forms. Không dùng chúng làm bằng chứng model thật luôn tuân thủ.

Trước khi đưa vào một lớp thật, giáo viên có thể chạy các ca trong `tests/pedagogy-live.test.mjs` với cấu hình riêng theo hướng dẫn cũ. Không đưa khóa vào frontend hoặc tệp ZIP.
