# Báo cáo nâng cấp PRO V2

## Phạm vi và bảo toàn

Nâng cấp trên ZIP AI-TUTOR-UPGRADE (1) do người dùng cung cấp; ba ảnh là tham khảo giao diện. Không nhận được ba tài liệu tập huấn riêng. Bản ZIP đầu vào có bản sao trong backup trước khi chỉnh sửa.

Luồng giữ nguyên: người dùng → frontend → POST /api/chat → server/gemini.mjs → Gemini REST generateContent → {text, model}. Kiểm tra kết nối dùng {accessCode, check:true}; chat dùng {accessCode, messages:[{role,content}], mode}. Không thay endpoint, tên trường, enum guide/review/compare, response hoặc SDK. GEMINI_MODEL mặc định gemini-2.5-flash, biến môi trường có thể ghi đè như trước.

Các tệp sau giữ nguyên byte, đã đối chiếu SHA-256:

- server/gemini.mjs
- netlify/functions/chat.mjs
- netlify.toml
- .env.example
- vite.config.ts
- package.json
- package-lock.json
- tests/gemini.test.mjs

Không tuyên bố toàn bộ backend bất biến: server/policy.mjs được chỉnh nội dung sư phạm theo yêu cầu. Bổ sung server/feedback.mjs và Netlify function tương ứng để gửi Google Forms, scripts/start.mjs thêm tuyến tương ứng trên máy. Module Gemini vận chuyển dữ liệu hoàn toàn giữ nguyên. Không xóa module dữ liệu cũ.

## Chức năng mới

Giao diện tập trung tứ giác; hình SVG chính xác theo dữ kiện mẫu; sơ đồ định hướng công khai trước hướng dẫn; năm chế độ; sáu bài vận dụng; phân tích lỗi có căn cứ; cá nhân hóa bằng thông tin học tập; hồ sơ sau kết nối; đánh giá bằng nút hoặc khi hoàn tất bài; đồng ý gửi dữ liệu; liên kết dự phòng khi Google chưa xác nhận; light/dark, điện thoại, giảm chuyển động và khôi phục tiêu điểm hộp thoại.

## Kiểm tra

npm install, npm run build, npm test (31/31) và TypeScript đã chạy thành công. npm start được sử dụng trong kiểm thử trình duyệt. Kiểm thử Playwright bao gồm thứ tự kết nối/hồ sơ, chat/sơ đồ, kết thúc thủ công và tự động, sao đánh giá, liên kết dự phòng, lịch sử lỗi, bài luyện mới, mobile, dark mode và ghi nhớ hồ sơ. Xem ảnh trong research/screenshots (dữ liệu giả lập).

Không có khóa Gemini thật; không khẳng định đã kiểm thử phản hồi Gemini thực tế. Google Form đã được đọc để đối chiếu năm entry ID; không gửi phản hồi thử vào biểu mẫu thật. Chưa triển khai lên Netlify của người dùng. Kiểm thử không chứng minh mô hình luôn từ chối mọi câu ngoài lề; bộ ca nghiệm thu sư phạm được đính kèm. Đánh giá hài lòng không đồng nghĩa với kết quả học tập.

## Tệp thay đổi so với ZIP đầu vào

- API_INTEGRITY.json
- BAO_CAO_NANG_CAP.md
- HUONG_DAN.md
- README.md
- app/globals.css
- app/page.tsx
- index.html
- lib/tutor.ts
- scripts/start.mjs
- server/policy.mjs
- tsconfig.json

## Tệp bổ sung

- backup/AI-TUTOR-UPGRADE-before-V2.zip
- components/learning-visuals.tsx
- lib/feedback.ts
- lib/form-config.json
- lib/learning.ts
- netlify/functions/feedback.mjs
- public/co-so-su-pham.html
- research/BAI_MAU_VA_DAP_AN.md
- research/CO_SO_SU_PHAM.md
- research/KICH_BAN_KIEM_THU_SU_PHAM.md
- research/legacy-v1/BAO_CAO_NANG_CAP.md
- research/legacy-v1/HUONG_DAN.md
- research/legacy-v1/README.md
- research/screenshots/01-home-desktop.png
- research/screenshots/02-profile-after-connection.png
- research/screenshots/03-chat-diagram.png
- research/screenshots/04-feedback.png
- research/screenshots/05-home-mobile.png
- research/screenshots/06-dark-mobile.png
- research/screenshots/07-chat-mobile.png
- scripts/check-ui.mjs
- server/feedback.mjs
- tests/feedback.test.mjs
- tests/learning.test.mjs

Ngoài danh sách, dist được tạo lại từ mã nguồn; không chứa node_modules trong ZIP. Cách chạy và deploy: xem README.md. Tài liệu trong research/legacy-v1 chỉ để đối chiếu phiên bản cũ.
