# Toán tư duy – Gemini / Netlify
Đọc HUONG_DAN.md trước khi triển khai.

Build: npm ci rồi npm run build
Test: npm test
Publish: dist
Functions: netlify/functions
Biến máy chủ: GEMINI_API_KEY, GEMINI_MODEL, ACCESS_CODE

Đã kèm giao diện biên dịch sẵn trong dist, nhưng phải triển khai cả Function để gọi AI.
Không chứa khóa API thật. Không dùng Netlify Drop chỉ với dist để chạy chatbot.

Mã truy cập lớp mặc định: THPT Gia Định. Khóa Gemini thật vẫn phải đặt ở Netlify.


## V6 Upgrade
Có thêm cấu hình AI Tutor tại `ai_tutor_features.json`.
