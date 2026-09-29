# Đối chiếu yêu cầu — V6.5.0

“Đạt” trong bảng là kết quả kiểm thử cục bộ và mô phỏng dịch vụ, không phải xác nhận đã triển khai vào tài khoản Google/Netlify thật.

| Yêu cầu | Tệp thực hiện / khảo sát | Kiểm chứng |
|---|---|---|
| Nâng cấp tiếp V6.4.0; xác định đúng nền tảng | package.json, netlify.toml; KHAO_SAT_MA_NGUON.md | Vite build; kiểm thử bảo toàn dữ liệu/lý thuyết/dựng hình gốc |
| Dùng cả OpenAI và Gemini theo cấu hình hiện có | server/openai.mjs, server/gemini.mjs, server/feature-api.mjs | v650-integration: chạy handler thật của cả hai với phản hồi AI mô phỏng |
| Giữ 8 giai đoạn, chống xin lời giải và kiểm tra căn cứ | server/adaptive-tutor.mjs được tái sử dụng, không thay bộ quy tắc | Bộ kiểm thử gốc v623-adaptive, strict-tutor, pedagogy; kiểm thử nội dung phá quy tắc |
| Phân biệt dữ liệu trình duyệt và Google Form | KHAO_SAT_MA_NGUON.md; khảo sát lib/adaptive-learning.ts, feedback.ts, survey.ts | Các test khảo sát gốc vẫn đạt; Form không gửi tự động |
| Mã học sinh và phiên không dựa vào tên/email | server/learning/security.mjs, api.mjs; lib/learning-memory.ts | Tạo mã ngẫu nhiên, khôi phục bằng bí mật; ID đơn lẻ không xuất dữ liệu được |
| Lưu đủ trường lượt học | server/learning/integration.mjs; google-apps-script/Code.gs | Handler tạo event từ trạng thái đã kiểm tra; Turns có các cột xem nhanh và JSON |
| Hồ sơ liên buổi | server/learning/domain.mjs, engine.mjs | Phân biệt predicted/corroborated; cập nhật sai lầm, mức hỗ trợ, 8 giai đoạn và phiên |
| Không tăng hồ sơ hai lần khi mạng chập chờn | engine.mjs, Code.gs, gateway.mjs | Năm lần gửi đồng thời một event chỉ có một lượt; mất ACK rồi gửi lại không tăng điểm |
| Ghi lượt và hồ sơ nhất quán | google-apps-script/Code.gs | Kiểm thử chính adapter: một batch; batch lỗi không có lượt mồ côi; khóa bận không ghi |
| Dữ liệu khảo sát riêng | engine.mjs: survey, app/page.tsx | Surveys riêng; consent riêng; mã gửi trùng không thêm dòng |
| Ghi/đọc Google chỉ phía máy chủ | netlify/functions/learning.mjs, teacher.mjs; gateway.mjs | HMAC; URL đích allowlist; payload/chữ ký sai bị chặn; không có khóa thật trong source |
| Sheet hiện trong Drive của thầy | HUONG_DAN_GOOGLE_SHEETS.md mục 1–4 | Cấu hình do thầy tạo/sở hữu; cần tự hoàn tất bằng tài khoản Google |
| Cấu hình mẫu không chứa bí mật | .env.example, google-apps-script/appsscript.json | Mẫu giá trị trống; không đưa tệp .env vào ZIP |
| Hồ sơ rút gọn và ví dụ liên quan, giới hạn chi phí | domain.mjs: learningContext; integration.mjs | Tối đa 3 ví dụ và 5.200 ký tự dữ liệu; tái dùng cùng một đánh giá AI |
| Không tự coi câu trả lời học sinh là kiến thức đúng | integration.mjs; domain.mjs: updateProgress | Cần accepted có căn cứ; sai/chưa chắc không tăng bằng chứng đúng; xin đáp án không lưu |
| Phân biệt dự đoán với bước củng cố | domain.mjs, learning-memory-panel.tsx, teacher-console.tsx | Hai câu khác nhau, liên tiếp đúng câu gợi mở, cùng phiên/kỹ năng; không gán thành thạo |
| Hàng đợi các trường hợp đáng xem | engine.mjs: ingest/report | Lỗi lặp, bước tự sửa sau gợi mở, báo gợi mở chưa tốt; chưa duyệt không vào prompt |
| Giáo viên xem, sửa nháp, duyệt hoặc bác bỏ | components/teacher-console.tsx; api.mjs; engine.mjs | Kiểm thử draft/approve/reject; giao diện duyệt trong Chromium |
| Phiên bản, sửa kho và rollback | engine.mjs: teacher:review/publish/rollback | Kiểm tra expectedRevision, lịch sử Audit; rollback và kích hoạt lại bản trước |
| Chỉ số thực chất | domain.mjs: metrics; teacher-console.tsx | Tỷ lệ tự làm theo ngưỡng gợi mở, hỗ trợ trung bình, lỗi lặp và phiên gần đây; có giới hạn diễn giải |
| Thông báo và đồng ý lưu | components/learning-memory-panel.tsx; api.mjs | Mặc định tắt; không tạo hồ sơ khi chưa tích đồng ý phù hợp; có cờ guardianConfirmed |
| Ngừng ghi và hủy hàng chờ | lib/learning-memory.ts; engine.mjs: consent | Tắt ngay tại thiết bị; server tăng revision; bật lại không phục hồi quyền của phiếu cũ |
| Xuất/xóa theo mã riêng có xác thực | api.mjs, engine.mjs, learning-memory-panel.tsx | Xuất phân trang; không có hash bí mật; xóa 6 bảng cá nhân; mã đã xóa không khôi phục được |
| Tối thiểu dữ liệu, không bắt buộc tên/email | app/page.tsx, lib/tutor.ts, domain.mjs: cleanText | UI học khi bỏ trống thông tin cá nhân; profile local không cần trường/tên; kiểm thử lọc mẫu PII |
| Không lưu ảnh đề vào bộ nhớ | integration.mjs | Event chỉ nhận văn bản học đã giới hạn; không có ảnh, data URL hoặc tệp Drive |
| Quyền toàn lớp chỉ giáo viên | security.mjs, api.mjs, teacher.mjs | HOCGIOITOAN và teacher:true tự khai không đăng nhập được; cookie riêng HttpOnly |
| Giới hạn đầu vào, tần suất và lượng ghi | security.mjs, engine.mjs, Code.gs; config Netlify Functions | 413/403/429, hạn mức theo học sinh, cap dòng; HTML/nonce sai không báo đã lưu |
| Buổi học vẫn chạy nếu Google lỗi | integration.mjs, lib/learning-memory.ts | Lỗi context/ghi không thay phản hồi gia sư thành thành công lưu giả |
| Giữ thứ tự tiến bộ khi gửi lại muộn | domain.mjs | Lượt cũ không thay last/updateAt mới hơn và không tạo củng cố sai |
| Hết hạn dữ liệu và dọn hằng ngày | engine.mjs; Code.gs: purgeExpired | TTL khi đọc; purge xóa dữ liệu hết hạn, giữ kho khái quát; thầy tạo trigger |
| Giữ khảo sát Form hiện có | lib/feedback.ts, lib/survey.ts, server/feedback.mjs giữ nguyên | Bộ test Form gốc: consent, xác nhận HTML, lỗi mạng và ID entry |
| Chạy build và kiểm thử | package.json; tests/v650-*.test.mjs; scripts/check-v650-ui.mjs | Xem KET_QUA_KIEM_THU.md và log kèm theo |
| ZIP, hướng dẫn, sơ đồ, bảng đối chiếu, bước tự làm | docs/v650/ và HUONG_DAN_V6_5_0.html | Đã chuẩn bị trong gói; phần kết nối thật còn do chủ tài khoản thực hiện |

## Tệp nâng cấp chính

- Giao diện: app/page.tsx, app/learning-memory.css, components/learning-memory-panel.tsx, components/teacher-console.tsx, main.tsx.
- Phía trình duyệt: lib/learning-memory.ts, lib/tutor.ts (hồ sơ tự khai không bắt buộc thông tin cá nhân).
- Máy chủ: server/learning/{api,security,gateway,integration,domain,engine}.mjs; chỗ nối trong server/{gemini,openai,feature-api}.mjs.
- Triển khai: netlify/functions/{learning,teacher,chat}.mjs, netlify.toml, scripts/start.mjs, .env.example.
- Google: google-apps-script/Code.gs, Domain.gs, appsscript.json; Domain.gs sinh từ domain.mjs/engine.mjs bằng scripts/build-learning-gateway.mjs.
- Kiểm thử: tests/v650-{learning,integration,apps-script,client}.test.mjs, v650-fixture.mjs; scripts/check-v650-ui.mjs. Hai kiểm thử bảo toàn hash và mock thành phần được cập nhật để nhận diện những thay đổi có chủ đích.
