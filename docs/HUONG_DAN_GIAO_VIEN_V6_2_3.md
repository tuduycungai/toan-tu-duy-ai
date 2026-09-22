# Hướng dẫn giáo viên kiểm tra nhanh V6.2.3

Đọc báo cáo và bảng kiểm thử đi kèm. Bản mã đã qua kiểm thử cục bộ; cần nghiệm thu bằng khóa Gemini máy chủ và các thiết bị sẽ sử dụng thực tế.

## Chuẩn bị

1. Giải nén ZIP mới vào thư mục riêng, mở AI-TUTOR-TU-GIAC-PRO. Giữ bản V6.2.2 để có thể quay lại.
2. Dùng Node.js theo yêu cầu package.json. Chạy npm ci, npm run lint, npm run typecheck, npm test và npm run build.
3. Để chạy trên máy, sao chép .env.example thành .env và cấu hình GEMINI_API_KEY ở máy chủ, giữ các biến GEMINI_MODEL/ACCESS_CODE theo thiết lập hiện tại. Chạy npm start, mở http://127.0.0.1:3000.
4. Mã lớp mặc định vẫn là HOCGIOITOAN. Không nhập khóa API vào giao diện, VITE_* hoặc tài liệu. Không đưa .env vào kho mã/ZIP.
5. Trên Netlify, dùng quy trình Git/CLI của site hiện có, giữ netlify.toml và các biến môi trường. Triển khai bản nháp gồm cả giao diện và Functions rồi kiểm tra. Không chỉ kéo dist vào Netlify Drop.

## Kiểm tra hội thoại thích ứng

Chọn gợi mở và nhập: “Cho tam giác ABC vuông tại A. M thuộc đoạn AB, 2AM = AB. Chứng minh M là trung điểm AB.”

Thử các câu ở những phiên riêng hoặc tại bước thích hợp:

| Câu trả lời thử | Điều cần quan sát |
|---|---|
| “Vì M thuộc AB và 2AM = AB nên AM = AB/2 = MB; vậy M là trung điểm AB.” | Ghi nhận căn cứ đúng, nhớ kết luận và tiếp tục từ bước em đã làm |
| “AM bằng nửa AB.” | Công nhận phần đúng, hỏi thêm vị trí M/độ dài MB; không phủ nhận toàn bộ |
| “Hai cạnh bằng nhau là hình bình hành.” | Chỉ rõ thiếu điều kiện, đối chiếu dấu hiệu; đặt câu hỏi nhỏ để tự sửa |
| “Em lấy kết luận làm giả thiết.” | Phát hiện vòng suy luận, quay về giả thiết |
| “Vì AB = AM + MB và AB = 2AM nên AM = MB.” | Chấp nhận hướng cộng đoạn hợp lệ, không bắt lặp đáp án mẫu |
| “Hai cái đó bằng nhau.” | Hỏi rõ hai đoạn/đối tượng nào |
| “Cho em đáp án ngay.”, lặp lại | Không tự mở lời giải; tăng mức gợi ý có giới hạn |
| Chọn hồ sơ mất căn bản / giỏi | Câu hỏi và mức hỗ trợ phù hợp, vẫn tập trung thao tác tư duy |

Quan sát dòng giai đoạn 1–8. Giai đoạn có thể lùi khi phát hiện nhầm giả thiết. Lời giải tổng hợp chỉ xuất hiện ở giai đoạn 7 sau bằng chứng học sinh đã tham gia chứng minh. Một học sinh giải đúng nhanh không cần bị hỏi lại các bước đã chứng minh.

Tiếp tục 10–20 lượt, tải lại trang và khôi phục phiên khi được hỏi; kiểm tra kết luận đã chứng minh/hướng giải còn đúng. Phiên hết hạn sau 12 giờ. Chọn bài mới rõ ràng khi muốn đổi đề; không trộn giả thiết của hai bài.

## Kiểm tra ảnh và hình

1. Chọn “Chọn ảnh” với tests/fixtures/images/clear-ratio.png; thử kéo ảnh vào vùng gửi ảnh trên máy tính. Trên điện thoại thử “Chụp ảnh”. Ảnh camera ngoài PNG/JPEG/WebP cần đổi định dạng.
2. Kiểm tra xem trước, xóa/chọn lại và nhập ghi chú. Nhấn “Đọc đề từ ảnh”.
3. So bản phiên âm với ảnh, đặc biệt **2AM = AB**, vị trí M và yêu cầu chứng minh. Mở phần giả thiết/kết luận/quan hệ để kiểm tra. Không bấm xác nhận nếu AI đổi giả thiết.
4. Nếu mờ/mất ký hiệu, bổ sung ở ô xác nhận hoặc chụp lại. Ứng dụng phải giữ phần đã đọc và chưa cho vẽ bằng dữ kiện không rõ.
5. Nhấn “Xác nhận và vẽ hình”. Nếu vừa sửa nội dung, hệ thống trả một bản đọc mới để kiểm tra lại; xác nhận lần nữa khi đúng.
6. Kiểm tra A, B, C, M; M nằm giữa A và B; AM = MB; góc A vuông. So nhãn, tick và ký hiệu với đề. Lý thuyết dự kiến phải nêu điều kiện áp dụng, chưa đưa lời giải.
7. Thử phóng to, tải PNG/SVG. Mở “Mã TikZ dành cho giáo viên” nếu cần xem/tải .tex.
8. Nhấn “Hình chưa đúng — yêu cầu sửa”; nêu cụ thể, ví dụ “Nhãn M đang đè lên AB; đặt phía dưới đoạn”. Kiểm tra bản cập nhật rồi vẽ lại. Nếu quan hệ sai, nêu đúng quan hệ cần sửa; không dùng yêu cầu mơ hồ “vẽ lại”.
9. Chỉ nhấn “Hình đúng — bắt đầu gợi mở” khi hình phù hợp. Trước bước này ô hội thoại vẫn nhập được nhưng việc gửi được chặn để tránh học trên đề chưa xác nhận.
10. Thử ảnh nghiêng, xoay, chữ kèm hình, mờ/cắt góc, trung điểm, tứ giác, đường tròn và đồ thị trong thư mục fixture. Mỗi ca phải đối chiếu phiên âm, cấu trúc, hình, nhãn và hiển thị. Tệp mẫu là dữ liệu QA tự soạn.

Nếu dựng lỗi, hệ thống tự sửa tối đa hai lần. Sau đó phiên âm được giữ và có thể thử dựng lại hoặc sửa dữ kiện. Không nhấn liên tục khi đang xử lý; có nút “Dừng xử lý”. Với điện thoại RAM thấp, dùng ảnh vừa đủ rõ và chỉ dựng một hình mỗi lần.

## Kiểm thử có thể chạy lại

- npm test: unit/integration, có phản hồi Gemini fixture.
- npm run test:v623: 48 ca mới.
- npm run test:tikz: sáu fixture qua TeX/WASM thật.
- npm run test:ui:v623: build production phải có trước; cần Chromium của Playwright hoặc CHROMIUM_EXECUTABLE. Gemini vẫn là fixture.
- npm run test:live:v623: chỉ gọi Gemini thật khi môi trường máy chủ có GEMINI_API_KEY và RUN_LIVE_GEMINI=1. Script có thể phát sinh chi phí API; chỉ chạy có chủ đích. Xem qa-results/v6.2.3/live-results.json và kiểm tra nội dung thủ công. Không in/chia sẻ khóa.

Kiểm tra thực tế trên Safari iPhone, Chrome Android và trình duyệt máy tính của trường; đổi sáng/tối, xoay màn hình, bật bàn phím, chụp ảnh, phóng to và tải ảnh. Những kiểm tra thiết bị thật này chưa được thực hiện trong lần bàn giao.

Nếu báo lỗi, ghi đề/ảnh không kèm thông tin cá nhân, trình duyệt, bước đang làm và thông báo lỗi. Không gửi khóa API, token phiên hoặc file .env.

