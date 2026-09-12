# Tư duy Toán học — AI Tutor cùng Thầy Sang

Bản nâng cấp từ `chatbot-toan-gia-dinh-main.zip` được đính kèm. Không nhận được bản riêng có hậu tố `(2)`; bản tham khảo thực tế là `Tu_duy_Tu_giac_AI_Tutor_V6_GEMINI_3_1_FLASH_LITE_FIXED.zip`.

## Chạy trên máy

Yêu cầu Node.js >=22.13.0, npm. Mở terminal trong thư mục chứa package.json:

```bash
npm install
cp .env.example .env
# Điền GEMINI_API_KEY vào .env; giữ giá trị cấu hình đang dùng của thầy.
npm run build
npm test
npm start
```

Trên Windows, sao chép `.env.example` thành `.env` bằng File Explorer hoặc `Copy-Item .env.example .env` trong PowerShell. Mở http://localhost:3000. `PORT` là tùy chọn cho cổng cục bộ. `npm start` chạy Vite qua adapter phát triển, chuyển `/api/chat` tới chính hàm `handleChat` gốc. Không dùng adapter này làm máy chủ production.

`npm run dev` và `npm run preview` được giữ nguyên, chỉ phục vụ frontend, không có Gemini backend. Dùng `npm start` để kiểm tra đầy đủ cục bộ. Có thể dùng `npx tsc --noEmit` để kiểm tra TypeScript.

## Triển khai Netlify (giữ kiến trúc gốc)

1. Đưa source trong thư mục này lên repository kết nối với Netlify hiện có, giữ các biến môi trường trên site cũ. Không cần tạo site mới.
2. Build command: `npm run build`; publish: `dist`; functions: `netlify/functions`; Node 22 theo `netlify.toml` gốc.
3. Giữ `GEMINI_API_KEY`, `GEMINI_MODEL`, `ACCESS_CODE` đang chạy. Không đặt khóa API vào biến có tiền tố VITE hoặc mã frontend.
4. Nếu thiết lập mới: điền khóa hợp lệ vào `GEMINI_API_KEY`. `GEMINI_MODEL` mặc định `gemini-2.5-flash`; `ACCESS_CODE` mặc định `THPT Gia Định`, mã tự đặt cần ít nhất 12 ký tự.
5. Build và triển khai đầy đủ cả Functions; chỉ kéo thư mục dist lên hosting tĩnh sẽ không cung cấp backend.
6. Mở ứng dụng, nhập hồ sơ, chọn Kết nối AI, nhập mã truy cập. Nút kiểm tra gửi một yêu cầu Gemini thật. Thử câu hỏi ngắn và một bộ 5 câu sau khi kết nối.

Chưa thực hiện deploy vào tài khoản Netlify của thầy. Chưa kiểm chứng khóa/hạn mức Gemini thật trong môi trường này vì file đính kèm chỉ có cấu hình mẫu.

## Tính năng

- Trang chủ chọn lớp 1–12, môn Toán, chế độ học; giao diện điện thoại, sáng/tối, avatar, trạng thái suy nghĩ, hiệu ứng hiện chữ (không phải streaming API).
- Hồ sơ: họ tên, lớp, trường, khối, môn, giáo viên tùy chọn, điểm Toán, mức độ, khó khăn, mục tiêu. Lưu/sửa/xóa ở trình duyệt.
- Hỏi bài nhanh; Gia sư cá nhân; Luyện tập mỗi ngày; Kiểm tra kiến thức; Phân tích lỗi sai; giữ So sánh cách giải của bản gốc.
- Bài tập AI theo lớp/chương/chủ đề/mức độ, 5–10 câu; mở gợi ý, lời giải từng bước, đáp án và bài tương tự qua hội thoại. Khi hỏi về một câu, nên ghi rõ số câu. Kiểm tra không hiện đáp án ngay khi ra đề; chấm bài thông qua hội thoại với AI.
- Cá nhân hóa bằng khối lớp, mức độ tự khai, điểm, khó khăn và mục tiêu. Đây là điều chỉnh prompt, không phải mô hình đã huấn luyện riêng hoặc đánh giá năng lực được kiểm định.
- Phiên học mẫu soạn sẵn, hướng dẫn, dừng yêu cầu và giữ bài để gửi lại khi lỗi.

## API được bảo toàn

```
Frontend → POST /api/chat → Netlify redirect
→ netlify/functions/chat.mjs → server/gemini.mjs
→ Gemini generateContent → {text, model} → Frontend
```

- Request chat: `{accessCode, messages:[{role,content}], mode}`.
- Request kết nối: `{accessCode, check:true}`.
- Mode backend vẫn chỉ `guide`, `review`, `compare`. Chế độ mới ánh xạ trong `lib/tutor.ts`.
- Response chat vẫn `{text, model}`; kiểm tra `{ok:true, model}`; lỗi `{error}` với status gốc.
- REST fetch, header khóa, model mặc định, timeout, token budget, validate, xử lý lỗi, biến môi trường và cấu hình deploy giữ nguyên.
- **Ngoại lệ có chủ đích:** `server/policy.mjs` chỉ thay nội dung chỉ dẫn sư phạm theo Phần 7, mở phạm vi từ tứ giác lớp 8 sang Toán phổ thông. Không thay hàm, exports hoặc ba mã mode. Không sao chép policy/backend từ ZIP tham khảo.
- Bản backup ZIP gốc đầy đủ tại `backup/chatbot-toan-gia-dinh-main-original.zip`. `API_INTEGRITY.json` đối chiếu SHA-256 các file quan trọng.

## Dữ liệu và giới hạn

Hồ sơ lưu trong localStorage trên trình duyệt này. Tên, trường, lớp cụ thể và giáo viên không tự động gửi đến Gemini; chỉ bối cảnh học tập cần thiết được thêm vào chuỗi content của tin nhắn user. Nội dung người học tự gõ vẫn được gửi nguyên văn khi nhấn Gửi. Không gửi hồ sơ sang Google Forms của file tham khảo.

Hồ sơ không đồng bộ thiết bị, không có cơ sở dữ liệu/bảng quản trị giáo viên mới. Mã truy cập và hội thoại chỉ nằm trong bộ nhớ phiên. Xóa hồ sơ trên máy dùng chung sau buổi học. Phiên hội thoại dài được rút bớt các cặp tin cũ để phù hợp giới hạn API, vì vậy AI có thể không còn thấy phần cũ; mở Bài mới khi đổi bài.

Ngân hàng bài tập là sinh theo yêu cầu và làm trong phiên chat, chưa có kho bài được giáo viên duyệt/lưu trên server. AI có thể tạo bài hoặc lời giải sai; cần kiểm tra. Giới hạn output/timeout của backend gốc vẫn giữ nguyên; nếu một bộ đề quá dài, chọn 5 câu hoặc chủ đề hẹp hơn. Chưa hỗ trợ ảnh, file bài làm hoặc LaTeX renderer; vẫn hiển thị văn bản và kí hiệu Unicode như bản gốc.

`HUONG_DAN.md` và ZIP lồng bên trong được giữ nguyên để bảo toàn tư liệu cũ; tài liệu này là hướng dẫn áp dụng cho bản nâng cấp.
