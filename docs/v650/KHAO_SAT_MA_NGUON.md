# Khảo sát và quyết định nâng cấp V6.5.0

## Mã thực tế trong tệp đính kèm

- `package.json`: V6.4.0, React 19, Vite 8; build ra `dist`, Node >=22.13.
- `app/page.tsx`: giao diện, hồ sơ tự khai, gửi bài, gợi mở, dựng hình, đánh giá, tám giai đoạn. Mã lớp giữ trong trạng thái React; kiểm tra qua `/api/chat`.
- `server/chat.mjs`: định tuyến theo AI_PROVIDER; ưu tiên OpenAI nếu có khóa, có Gemini dự phòng theo cấu hình. Không mặc định chỉ có Gemini.
- `server/openai.mjs`: OpenAI Responses; mô hình/mức suy luận do máy chủ kiểm tra; giữ store:false, schema và bộ xử lý dựng hình.
- `server/gemini.mjs`: Google generateContent; cùng chuyển sang `feature-api.mjs` cho gia sư thích ứng/ảnh.
- `server/adaptive-tutor.mjs`: phân loại 12 dạng câu trả lời, 8 giai đoạn, chặn xin đáp án, kiểm tra căn cứ trích từ câu học sinh; ký tutorToken. Đây là phần đánh giá có cấu trúc được tái sử dụng.
- `lib/adaptive-learning.ts`: bốn câu chẩn đoán, quan sát bằng quy tắc chữ, mức hỗ trợ tự điều chỉnh cục bộ; observation có verified:false. Không phải kho liên buổi trên máy chủ.
- `lib/feedback.ts` và `server/feedback.mjs`: POST tới Netlify rồi gửi Form với 5 trường tên/trường/email/rating/comment. Có consent; chỉ báo confirmed khi Google trả trang xác nhận. Chống trùng cũ chỉ là Map trong một instance nóng, không phải khóa bền vững phân tán.
- `lib/survey.ts`: thêm nhãn lớp/vai trò, thông tin sử dụng tùy chọn vào comment. `lib/form-config.json`: đường dẫn Form và mã entry. Không có endpoint Google Sheets quản trị hoặc thông tin xác thực Google trong nguồn.
- `netlify.toml`: triển khai Functions, API chat và SPA fallback. `scripts/start.mjs`: máy chủ HTTP cục bộ với API chat/feedback.

## Dữ liệu trước nâng cấp

| Dữ liệu | Nơi nằm trong V6.4.0 | Điều kiện gửi ra ngoài |
|---|---|---|
| Tên, trường, email, lớp, mức độ, mục tiêu | React; localStorage ai-tutor-profile-v1 khi chọn ghi nhớ | Thông tin cá nhân chỉ gửi lúc đồng ý khảo sát Form; mức độ/mục tiêu/khó khăn đi trong ngữ cảnh AI |
| Hồ sơ chẩn đoán, quan sát, câu gợi mở | React; localStorage ai-tutor-learner-v5 nếu chọn ghi nhớ | Phần hồ sơ được ghép vào yêu cầu AI, chưa lưu hồ sơ Google liên buổi |
| Hội thoại, bản nháp, đề, tutorToken, tiến độ | sessionStorage theo lib/session-recovery.ts | Hội thoại rút gọn gửi API AI; dữ liệu khôi phục nằm ở trình duyệt |
| Trạng thái ảnh | sessionStorage theo lib/image-session.ts và bộ nhớ thành phần | Ảnh đề gửi nhà cung cấp AI khi dùng đọc ảnh, chưa có kho ảnh Drive |
| Rating và nhận xét khảo sát | React trong phiên | Khi tích đồng ý và Gửi: Netlify feedback → Google Form |
| Mã truy cập lớp | React | Gửi máy chủ để xác thực lớp; không phải quyền quản trị |

## Phần giữ và phần thêm

Giữ dữ liệu bài mẫu, lý thuyết, các bộ dựng hình, UI nền xanh/dark mode, điều kiện tám giai đoạn, nhà cung cấp AI, Google Form cũ và phương thức Netlify. Không thay toàn bộ ứng dụng.

Thêm tầng bộ nhớ riêng `server/learning/`, sử dụng đánh giá đã qua `applyTutorTurn` thay vì tin mức độ/điểm học sinh tự gửi. Hai bộ điều hợp AI truyền Request thật đến tầng feature để xác thực cookie; dữ liệu bộ nhớ tin cậy không lấy từ một trường prompt do trình duyệt tự khai.

Google Sheets không có thao tác append kèm khóa duy nhất và giao dịch đọc-sửa hồ sơ theo cách cần dùng ở đây. Bản này thêm cổng Apps Script ký HMAC, ScriptLock và một batch Sheets để ghi đồng thời Turns/Profiles/Sessions/Students/ReviewQueue. Không dùng Map trong một Netlify instance làm cơ chế chống trùng chính. Không dùng service account tạo tệp vì yêu cầu thầy sở hữu trực tiếp trong Drive cá nhân.

Mẫu dùng chung có hai bước: sự kiện cần xem → giáo viên biên tập/duyệt → phiên bản kho bất biến → active pointer. Dữ liệu học sinh chưa duyệt không được đưa vào kho mẫu; rollback không xóa lịch sử phiên bản. Chỉ số giáo viên lấy từ hồ sơ tóm tắt, không phải tổng số hội thoại đơn thuần.

Thông tin cá nhân trong biểu mẫu hồ sơ chuyển thành tùy chọn. Khi bật bộ nhớ, khảo sát dùng Sheets theo mã nội bộ; khi chưa bật vẫn có thể tự chọn gửi Form cũ với sự đồng ý riêng. Không dùng tên/email để nhận dạng học sinh liên buổi.

## Điểm kỹ thuật cần biết

- Khi chưa đặt khóa lưu trữ, AI/dựng hình vẫn chạy theo cấu hình gốc. Nút bộ nhớ thông báo chưa cấu hình.
- Nếu đọc hồ sơ thất bại trước lượt AI, không dùng hồ sơ cũ không xác nhận, không ghi lượt đó. Nếu ghi sau khi AI trả lời thất bại/không rõ đã ghi hay chưa, có phiếu ký gửi lại 24 giờ.
- Phiếu cùng ID nhưng khác nội dung bị từ chối. Tắt/bật consent tăng revision; phiếu cũ không được ghi trở lại.
- TTL có kiểm tra khi đọc; purgeExpired dọn dữ liệu hết hạn bằng batch dưới cùng khóa.
- Không tự tạo/tải tệp Drive dài; đây là quyết định thu thập tối thiểu. Chỉ triển khai thêm lưu minh chứng khi có nhu cầu và quyền cụ thể.
- Sửa lỗi sẵn có ở feature-api: khi có STATE_SIGNING_KEY, header gọi Gemini nay dùng GEMINI_API_KEY, không dùng khóa ký trạng thái.
- Kiểm thử bảo toàn bằng hash cũ có danh sách các tệp cố ý thay đổi; giữ nguyên baseline lịch sử, thêm kiểm thử hành vi cho các phần nâng cấp.
