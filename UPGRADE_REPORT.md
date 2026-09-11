# Báo cáo nâng cấp AI Tutor V6

## Nguyên tắc bảo toàn
- Giữ nguyên Netlify Function `netlify/functions/chat.mjs`.
- Giữ nguyên module `server/gemini.mjs` và biến môi trường Gemini.
- Không đưa API key vào client.

## Đã bổ sung nền tảng
- Bộ mô tả chế độ học tập AI Tutor.
- Ngân hàng cấu hình lớp và mức độ bài tập.
- System prompt định hướng trợ lý giáo viên Toán Việt Nam.

## Cần kiểm thử trước khi phát hành
npm ci
npm run build
npm test

Kiểm tra Netlify Environment Variables:
- GEMINI_API_KEY
- GEMINI_MODEL
- ACCESS_CODE
