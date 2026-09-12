# Báo cáo nâng cấp AI Tutor

## Nguồn và bảo toàn
Dùng đúng hai ZIP đính kèm (không có hậu tố (2)/(3)). Sao lưu toàn bộ ZIP gốc trước chỉnh sửa, kèm trong thư mục backup. Không sao chép backend, Gemini config hoặc môi trường từ bản tham khảo. Không có server.js/api folder/backend folder trong bản gốc; backend thực tế là server/*.mjs và netlify/functions/chat.mjs.

Gemini gọi bằng REST fetch tại server/gemini.mjs, model mặc định gemini-2.5-flash hoặc GEMINI_MODEL hiện có. Luồng: frontend → /api/chat → Netlify Function → handleChat → Gemini generateContent → {text,model}. Mã API, cấu trúc request/response, mode backend, auth, timeout và giới hạn token giữ nguyên.

**server/policy.mjs có chỉnh sửa riêng nội dung prompt theo Phần 7**, để bỏ giới hạn tứ giác lớp 8 và bổ sung cá nhân hóa. Đây là file chỉ dẫn trên server, không phải toàn bộ thư mục server giữ nguyên. Không thay hàm/exports hay logic API.

## File đã chỉnh sửa
- `README.md`
- `app/globals.css`
- `app/page.tsx`
- `dist/index.html`
- `package.json`
- `server/policy.mjs`

## File bổ sung
- `API_INTEGRITY.json`
- `backup/chatbot-toan-gia-dinh-main-original.zip`
- `dist/assets/index-D8FPtirC.css`
- `dist/assets/index-DDfVwQ-9.js`
- `lib/tutor.ts`
- `scripts/start.mjs`
- `tests/tutor.test.mjs`
- `tsconfig.json`

## File API/cấu hình giữ nguyên
- server/gemini.mjs
- netlify/functions/chat.mjs
- netlify.toml
- .env.example
- vite.config.ts
- tests/gemini.test.mjs

Đã đối chiếu SHA-256, xem API_INTEGRITY.json. Các UI component, tiện ích gốc, vendor và tư liệu cũ giữ nguyên. Assets dist cũ được thay bằng bản build mới.

## Tính năng mới
Trang chủ chọn lớp/môn/chế độ, giao diện sáng/tối và responsive; avatar AI, animation và typing phía frontend; hồ sơ lưu/sửa/xóa trên trình duyệt; cá nhân hóa bằng thông tin học tập; 5 chế độ được yêu cầu cộng So sánh cách giải; tạo 5–10 câu theo lớp/chương/chủ đề/mức độ; gợi ý, lời giải/đáp án và bài tương tự qua chat; kiểm tra kiến thức và phân tích bài làm; phiên mẫu và hướng dẫn. Bản tham khảo có hàm finishLesson khai báo lặp; không mang lỗi này sang bản nâng cấp. Không mang theo luồng Google Forms gửi dữ liệu cá nhân.

## Kiểm tra thực tế
- npm install: thành công.
- npm run build: thành công, có dist mới.
- npm test: 16/16 đạt (12 test gốc + 4 test cá nhân hóa/giới hạn/ánh xạ mode). Test Gemini dùng fetch giả lập.
- npx tsc --noEmit: đạt.
- npm start: khởi động được; trang chủ HTTP 200; POST /api/chat trả JSON 503 đúng thiết kế khi thiếu GEMINI_API_KEY.
- Chưa xác nhận Gemini trả lời trực tiếp: không có khóa thật trong tệp được cung cấp.
- Chưa xác nhận render/tương tác bằng trình duyệt: môi trường không có Chromium, tải Chromium bị timeout/502. Không khẳng định đã kiểm thử giao diện desktop/mobile bằng trình duyệt.
- Chưa deploy thực tế vào Netlify. Cấu hình deploy gốc giữ nguyên và build đạt.

## Cách chạy và deploy
Xem README.md: Node >=22.13.0, npm install, sao chép .env.example thành .env và điền khóa, npm run build, npm test, npm start. Truy cập http://localhost:3000. npm start là adapter phát triển dùng nguyên handleChat, không thay máy chủ Netlify production. Deploy source qua Netlify với npm run build, dist, netlify/functions; giữ ba biến môi trường gốc.

## Giới hạn cần biết
Hồ sơ chỉ lưu trên thiết bị, chưa có đồng bộ hoặc dashboard giáo viên. Hội thoại và bài tập chỉ giữ trong phiên. Ngân hàng bài là sinh theo yêu cầu, chưa có kho bài được duyệt. Mức độ cá nhân hóa dựa trên tự khai, chưa tự đo năng lực. AI cần được kiểm tra, bộ 10 câu phức tạp có thể vượt giới hạn phản hồi gốc. Không có streaming API, upload ảnh hay renderer LaTeX mới.

## Kiểm tra sau triển khai
1. Kết nối bằng mã lớp thật, xác nhận nút kết nối thành công.
2. Tạo hồ sơ, tải lại để kiểm tra lưu; sửa và xóa trên máy thử.
3. Thử từng chế độ với câu ngắn, sinh 5 câu, hỏi gợi ý câu 1, nộp bài và xin bài tương tự.
4. Thử mã sai, dừng yêu cầu, gửi lại; xem màn hình điện thoại 390px và dark mode.
