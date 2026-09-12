# Toán tư duy – bản Gemini dành cho Netlify

## 1. Gói này có gì?
- Giao diện tiếng Việt, giữ ba chế độ: gợi mở từng bước, kiểm tra lời giải, so sánh cách giải.
- Bài gợi ý tứ giác lớp 8 và phiên hội thoại minh họa có ghi nhãn.
- Mã nguồn React/Vite chỉnh sửa được; thư mục dist là giao diện đã biên dịch.
- Netlify Function gọi Gemini từ máy chủ; không đưa API key vào trình duyệt.
- Tệp netlify.toml cấu hình build, thư mục xuất bản và đường dẫn API.
- 10 kiểm thử tự động dùng phản hồi giả lập để kiểm tra tích hợp.

Đây là gói triển khai riêng cho Netlify. Địa chỉ Sites trước đó chưa được cập nhật bởi gói ZIP này. Bản thử nghiệm dùng chỉ dẫn sư phạm, chưa fine-tune, chưa nạp các PDF làm kho tra cứu, chưa chứng minh hiệu quả bằng thực nghiệm.

## 2. Chuẩn bị
1. Tài khoản Netlify; tài khoản GitHub nếu dùng cách A.
2. Lấy khóa Gemini trong Google AI Studio: https://aistudio.google.com/apikey
3. Mã truy cập lớp đã đặt sẵn: THPT Gia Định. Nhập đúng dấu và chữ hoa; không nhập dấu ngoặc kép. Đây là mã dùng chung, không phải tài khoản học sinh hay khóa API.
4. Tải ZIP và giải nén trên máy tính. Thư mục chính có package.json và netlify.toml.

## 3. Cách A – triển khai qua GitHub (khuyến nghị)
1. Tạo repository mới trên GitHub, nên chọn Private.
2. Chọn Add file → Upload files. Tải các tệp và thư mục BÊN TRONG thư mục đã giải nén lên repository. Không tải nguyên ZIP lên GitHub. package.json, netlify.toml và index.html phải ở thư mục gốc repository. Không tải node_modules hay file .env chứa khóa thật.
3. Trong Netlify chọn Add new project / Import an existing project, rồi chọn GitHub và repository vừa tạo. Tên mục có thể thay đổi theo giao diện.
4. Kiểm tra: Base directory để trống; Build command: npm run build; Publish directory: dist. Thư mục Functions: netlify/functions đã có trong netlify.toml.
5. Thêm các biến môi trường ở bước thiết lập hoặc mục Project configuration → Environment variables sau khi tạo project:

| Tên biến | Giá trị |
|---|---|
| GEMINI_API_KEY | Khóa Gemini thật của thầy |
| GEMINI_MODEL | gemini-2.5-flash |
| ACCESS_CODE | THPT Gia Định (đã là mặc định trong mã nguồn; có thể đặt biến này để ghi đè) |

Nếu tài khoản có lựa chọn phạm vi, chọn Functions (hoặc phạm vi bao gồm Functions). Chọn ngữ cảnh Production; thêm Deploy Previews nếu cần thử bản xem trước. Không thêm tiền tố VITE_ vào khóa. Không ghi khóa vào netlify.toml. Nếu Netlify có AI Gateway, gói này vẫn dùng khóa Gemini riêng nói trên, không dựa vào Gateway.
6. Nhấn Deploy. Nếu vừa thêm hoặc thay biến sau lần triển khai, vào Deploys → Trigger deploy để tạo bản triển khai mới.
7. Chờ thành công. Mở địa chỉ Netlify. Trong danh sách Functions phải có hàm chat.
8. Trên website: Kết nối AI → nhập ACCESS_CODE → Kiểm tra & kết nối. Sau đó chọn bài mẫu hoặc nhập đề bài và nhấn Gửi. Việc kiểm tra kết nối gọi Gemini thật và tính vào hạn mức API.

## 4. Cách B – triển khai từ máy tính bằng Netlify CLI
Cài Node.js 22.13 trở lên thuộc nhánh 22 trên máy tính. Mở Terminal/PowerShell trong thư mục có package.json. Chạy từng dòng:

```sh
npm ci
npm run build
npx netlify-cli login
npx netlify-cli deploy --prod --dir=dist --functions=netlify/functions
```

Lần đầu CLI có thể hỏi cài công cụ, đăng nhập, chọn hoặc tạo project Netlify. Chọn project của thầy. Sau đó cấu hình ba biến trong Netlify UI như cách A, rồi chạy lại lệnh deploy để áp dụng. Không dán khóa vào lệnh chia sẻ hoặc ảnh chụp. Có thể triển khai nháp bằng cách bỏ --prod.

Không chỉ kéo thư mục dist vào Netlify Drop để sử dụng chatbot: dist chỉ có giao diện. Cần triển khai cả Function chat theo cách A hoặc B. Mở index.html bằng cách nhấp đúp trên máy cũng không chạy được API.

## 5. Sửa nội dung và chạy kiểm tra
- app/page.tsx: giao diện, bài mẫu, phiên minh họa.
- app/globals.css: màu sắc, bố cục và giao diện điện thoại.
- server/policy.mjs: chỉ dẫn gia sư, phạm vi kiến thức, ba chế độ.
- server/gemini.mjs: gọi API, giới hạn dữ liệu, kiểm tra mã truy cập, xử lý lỗi.
- netlify/functions/chat.mjs: điểm vào của Netlify Function.
- netlify.toml: cấu hình triển khai.

```sh
npm test
npm run build
```

npm run dev chỉ chạy giao diện Vite, không khởi động Netlify Function. Để kiểm thử trọn luồng dùng bản Netlify đã cấu hình. Muốn đổi mô hình: đổi GEMINI_MODEL trong Netlify rồi triển khai lại; dùng mã mô hình hỗ trợ generateContent theo tài liệu Google, không dùng tên hiển thị tùy ý.

## 6. Khắc phục lỗi
| Hiện tượng | Cách xử lý |
|---|---|
| “Chưa có máy chủ chatbot” | Kiểm tra Function chat đã được triển khai; không chỉ tải dist; netlify.toml phải ở gốc |
| “Cần kiểm tra GEMINI_API_KEY” | Bổ sung khóa Gemini trên Netlify, kiểm tra phạm vi Functions, triển khai lại |
| “Mã truy cập chưa đúng” | Nhập mã ACCESS_CODE, không nhập API key; kiểm tra khoảng trắng |
| Lỗi khóa/quyền/mô hình | Kiểm tra khóa Gemini, quyền project, hạn mức và mã GEMINI_MODEL |
| Không tìm thấy mô hình | Đổi GEMINI_MODEL theo danh mục Google rồi triển khai lại |
| Lỗi 429 / hết hạn mức | Kiểm tra hạn mức Google AI Studio, đợi hoặc điều chỉnh kế hoạch sử dụng |
| Quá thời gian chờ | Gửi bài ngắn hơn, thử lại; yêu cầu bị ngắt sau khoảng 22 giây |
| Tải lại trang bị ngắt kết nối | Bình thường: mã lớp và hội thoại chỉ giữ trong phiên mở trang |

## 7. Dữ liệu và phạm vi sử dụng
API key nằm ở máy chủ Netlify; mã lớp và hội thoại giữ trong bộ nhớ phiên trình duyệt. Mỗi lượt gửi chuyển hội thoại qua Netlify đến Google. Ứng dụng không tạo cơ sở dữ liệu và không chủ động ghi log nội dung; chính sách vận hành/lưu dữ liệu của Netlify và Google vẫn áp dụng. Không nhập thông tin nhận dạng học sinh.

Trang Netlify có thể được xem bằng liên kết tùy cấu hình của tài khoản; chức năng AI yêu cầu mã lớp. Mã dùng chung không phải hệ thống tài khoản cá nhân. Chỉ cấp cho nhóm thử nghiệm; đặt hạn mức tại Google và theo dõi chi phí Netlify/Gemini. Chi phí và quyền sử dụng phụ thuộc tài khoản, không có cam kết miễn phí.

Đã kiểm tra build và 10 kiểm thử hợp đồng bằng dữ liệu mô phỏng. Chưa triển khai lên tài khoản Netlify của thầy, chưa có khóa thật để xác nhận Gemini trả lời. Cần thầy kiểm tra trên bản triển khai và giáo viên thẩm định phản hồi trước khi cho học sinh sử dụng.

## 8. Ghi nhận hỗ trợ AI
Mã nguồn, chỉ dẫn, phiên minh họa và các kiểm thử được AI hỗ trợ tạo/chuyển đổi. Đây không phải minh chứng học sinh tự viết hoặc đã thực nghiệm. Giữ bản này trong hồ sơ hỗ trợ AI; học sinh cần trực tiếp đọc, sửa, hiểu và kiểm thử phần mình sử dụng.

Nguồn kĩ thuật đã tra cứu ngày 10/9/2026:
- Gemini generateContent: https://ai.google.dev/api/generate-content
- Danh mục mô hình: https://ai.google.dev/gemini-api/docs/models
- Netlify Functions: https://docs.netlify.com/build/functions/get-started/
- Biến môi trường Netlify: https://docs.netlify.com/build/functions/environment-variables/
- Netlify CLI: https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/
