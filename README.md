# Tư duy Toán học — PRO V2.1

Gia sư AI hỗ trợ rèn luyện lập luận hình học tứ giác lớp 8. Bản nâng cấp từ ZIP AI-TUTOR-UPGRADE được cung cấp, bảo toàn giao thức Gemini và cấu hình triển khai.

## Chạy trên máy

Cài Node.js >=22.13.0, giải nén và mở terminal tại thư mục chứa package.json:

```bash
npm install
cp .env.example .env
# Điền GEMINI_API_KEY trong .env bằng trình soạn thảo
npm run build
npm start
```

Mở địa chỉ được terminal thông báo (mặc định http://localhost:3000). Windows có thể sao chép .env.example và đổi tên bản sao thành .env. Không đưa khóa thật vào frontend hoặc Git. `npm start` phục vụ giao diện cùng API; `npm run dev`/`npm run preview` đơn lẻ không cung cấp đầy đủ backend.

## Triển khai Netlify

1. Đưa mã nguồn vào kho Git và kết nối Netlify; chọn thư mục chứa package.json làm base directory.
2. Giữ netlify.toml: build `npm run build`, publish `dist`, functions `netlify/functions`, Node 22.
3. Đặt GEMINI_API_KEY trong biến môi trường dành cho Functions. Giữ GEMINI_MODEL theo cấu hình đang dùng (mặc định gemini-2.5-flash). ACCESS_CODE là mã lớp riêng, không phải khóa Gemini; nếu thay, dùng tối thiểu 12 ký tự.
4. Deploy và kiểm tra bằng mã lớp. Không chỉ kéo thả thư mục dist: ứng dụng cần Netlify Functions.
5. Thử một câu hỏi tứ giác và một đánh giá thật có sự đồng ý của người dùng, rồi kiểm tra Google Forms. Bản đóng gói chưa được triển khai lên tài khoản Netlify của bạn.

## Trình tự sử dụng

Kết nối bằng **mã truy cập lớp** → điền hồ sơ → chọn bài/chế độ → xem sơ đồ định hướng → trao đổi từng bước → tự giải thích lại → đánh giá.

Đây là cách kết nối của bản gốc: khóa Gemini đặt ở server, học sinh nhập mã truy cập. Hồ sơ chỉ mở sau khi kết nối được xác nhận. Ghi nhớ hồ sơ trên thiết bị là lựa chọn của người dùng. Tên, trường và email không tự động được đưa vào ngữ cảnh Gemini; ngữ cảnh chỉ dùng thông tin học tập. Nội dung học sinh tự gõ trong chat vẫn được chuyển đến Gemini.

Nút **“Em đã biết làm, cảm ơn Thầy”** mở đánh giá bất cứ lúc nào trong buổi học. Gia sư có thể đề nghị đánh giá khi bài học hoàn tất và học sinh đã phản hồi tự kiểm tra. Học sinh chọn 1–5 sao, ghi nhận xét và đồng ý gửi. Không tự chọn sẵn mức hài lòng.

## Google Forms

Tên, trường, email, điểm hài lòng và nhận xét được gửi đến đúng biểu mẫu đã cung cấp. Hồ sơ không gửi ngay khi nhập; được gửi cùng đánh giá sau thao tác xác nhận. Tóm tắt học tập chỉ đính kèm nếu chọn. Không gửi mã truy cập hay khóa Gemini sang Google.

Endpoint mới `/.netlify/functions/feedback` tách biệt với `/api/chat`. Chỉ báo thành công khi nhận nội dung xác nhận của Google Forms. Khi chưa xác nhận được, ứng dụng cung cấp liên kết biểu mẫu điền sẵn để học sinh kiểm tra và gửi trực tiếp. Không tự gửi lại vì có thể trùng phản hồi. Chống trùng trong bộ nhớ một phiên function, không phải bảo đảm duy nhất trên nhiều máy chủ. Nếu chủ biểu mẫu đổi trường, cập nhật lib/form-config.json; không đổi API Gemini.

## Nội dung và kiểm tra

- 5 chế độ: gợi mở, kiểm tra lời giải, so sánh, luyện mỗi ngày, tự kiểm tra.
- 6 bài mẫu có hình SVG, gợi ý, lời giải đối chiếu và câu hỏi chuyển giao.
- Sơ đồ công khai: giả thiết + mục tiêu → kiến thức kết nối → bước tiếp theo. Đây là định hướng sư phạm, không phải suy nghĩ nội bộ của mô hình.
- Chính sách giới hạn chủ đề tứ giác và kiến thức phụ trợ; độ tuân thủ thực tế vẫn cần kiểm tra với Gemini.
- Giao diện sáng/tối, điện thoại, hiệu ứng gõ, dừng phản hồi, hỗ trợ giảm chuyển động.

```bash
npm test
npx tsc --noEmit
```

Kiểm tra trình duyệt tùy chọn: scripts/check-ui.mjs cần Playwright và Chromium có sẵn; không thêm chúng vào dependencies ứng dụng. Script dùng phản hồi giả lập và chặn gửi Google Forms thật.

## Tài liệu

- BAO_CAO_NANG_CAP.md: phạm vi chỉnh sửa và kết quả kiểm tra.
- API_INTEGRITY.json: SHA-256 đối chiếu các tệp cần bảo toàn.
- research/CO_SO_SU_PHAM.md và public/co-so-su-pham.html: cơ sở sư phạm và nguồn trong/ngoài nước.
- research/BAI_MAU_VA_DAP_AN.md: bài mẫu và lời giải tham chiếu.
- research/KICH_BAN_KIEM_THU_SU_PHAM.md: nghiệm thu với Gemini thật.
- research/screenshots: ảnh kiểm thử giao diện bằng dữ liệu giả lập.
- backup: bản sao trước nâng cấp; research/legacy-v1 chứa hướng dẫn cũ, được thay thế bởi README này.

Chưa có khóa Gemini thật để nghiệm thu đầu cuối. Kiểm thử API dùng phản hồi mô phỏng; không gửi dữ liệu thử vào biểu mẫu thật. Phần mềm áp dụng tài liệu vào thiết kế và prompt, không huấn luyện lại Gemini và chưa có nghiên cứu thực nghiệm chứng minh hiệu quả của bản phát hành.
