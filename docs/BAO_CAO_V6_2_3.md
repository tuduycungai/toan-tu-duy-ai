# Báo cáo thay đổi V6.2.3

Bản này phát triển tiếp trên mã nguồn V6.2.2, giữ React/Vite/TypeScript, Netlify Functions, Gemini REST API, giao diện sáng/tối, nhận diện, 87 bài mẫu, hồ sơ, khảo sát và giấy phép thư viện. Không viết lại dự án.

Tệp được cung cấp thực tế có tên TU-DUY-TOAN-HOC-V6_2_2-BAN-TRIEN-KHAI.zip (không có hậu tố “(2)”). Tệp gốc không bị sửa. SHA-256: 99576c396968cb3f0355df397ddeb5956280b7d052837cbc2fad0541bf6543c8.

**Tình trạng bàn giao:** mã nguồn và kiểm thử cục bộ đã hoàn tất; chưa nghiệm thu chất lượng Gemini thật, Safari hoặc điện thoại thật. Không có khóa API thật trong môi trường kiểm thử. Các phản hồi mô hình trong kiểm thử tự động là fixture có kiểm soát, không phải kết quả OCR thật.

## 1. Hội thoại thích ứng

Luồng hiện tại được mở rộng: giao diện → /api/chat → xác thực hiện có → bộ điều khiển thích ứng → Gemini JSON theo schema → kiểm tra kết quả → ký trạng thái → giao diện.

Mỗi lượt có một trong 12 phân loại nội bộ theo yêu cầu: đúng đầy đủ, đúng một phần, ý đúng thiếu căn cứ, nhầm giả thiết/kết luận, sai định lý, sai logic, sai tính toán/ký hiệu, mơ hồ, hướng khác, xin đáp án, không liên quan, nhiều cách hiểu. Nhãn kỹ thuật không đưa vào lời thoại học sinh.

Trạng thái gồm giai đoạn 1–8, kết luận có căn cứ và trích dẫn lời học sinh, lỗi, mức gợi ý, hướng giải, bằng chứng năng lực, mục tiêu đã chứng minh và lịch sử câu hỏi. Bộ điều khiển cho phép tiến/lùi; hướng khác hợp lệ được tiếp tục. Hồ sơ năng lực hiện có được giữ và bổ sung bằng chứng quan sát; không đánh giá năng lực chỉ từ một câu.

Trạng thái có HMAC-SHA256, dùng khóa Gemini hiện có ở máy chủ với miền ký riêng, hết hạn sau 12 giờ. Đây là chữ ký chống sửa, không phải mã hóa dữ liệu. sessionStorage lưu trạng thái hội thoại; không lưu khóa API hoặc mã truy cập trong bản khôi phục. Ảnh chỉ ở bộ nhớ trang, không lưu vào phiên khôi phục.

Bộ điều khiển kiểm tra trích dẫn có thực trong câu học sinh mới nhất; không lấy đáp án mẫu làm bằng chứng. Có thể rút lại kết luận đã chấp nhận nếu phát hiện sai tiền đề. Chỉ mở tổng hợp ở giai đoạn 7 khi trạng thái trước đã có chứng minh đủ mục tiêu, không phải do số lượt hoặc do xin đáp án. Tự nhận là giáo viên không mở quyền bỏ qua điều kiện này; dự án chưa có xác thực quản trị riêng.

Giữ tối đa 60 kết luận, 30 lỗi gần nhất, 12 bằng chứng năng lực, 24 câu hỏi gần nhất và dấu vân tay của tối đa 300 câu hỏi. Trạng thái quá lớn được báo rõ; không âm thầm bỏ kết luận. Lịch sử gửi Gemini được cắt theo số byte, còn bằng chứng được giữ trong trạng thái ký. Câu hỏi trùng nguyên dạng bị chặn; Gemini được sửa định dạng tối đa một lần. Khả năng nhận ra câu hỏi khác chữ nhưng cùng ý vẫn phụ thuộc mô hình.

## 2. Ảnh, cấu trúc hình học và TikZ

Chọn ảnh, input camera, kéo thả, xem trước, xóa/chọn lại, ghi chú và hủy tác vụ đều được nối với luồng xử lý thật.

- PNG/JPEG/WebP được kiểm tra chữ ký tệp, MIME, dung lượng và kích thước trước giải mã.
- Giới hạn đầu vào: 24 MiB, 60 triệu pixel, cạnh tối đa 20.000 px, kích thước tối thiểu 64 × 64 px.
- Trình duyệt xử lý hướng ảnh, chuyển JPEG để bỏ metadata; cạnh dài tối đa 2.400 px, giảm chất lượng có giới hạn. Ảnh gửi tối đa 2,5 MiB. Nếu không thể tối ưu đủ mà vẫn giữ mức kích thước đặt ra, yêu cầu chụp/cắt lại.
- Gemini nhận inlineData qua máy chủ hiện có. Bản đọc tách nội dung đề, chữ trên hình, giả thiết, kết luận, điểm, đối tượng, quan hệ, đường phụ, phần chưa chắc chắn và lý thuyết dự kiến.
- Mỗi quan hệ có nguồn trích từ đề. Cấu trúc sai không được đưa thẳng sang vẽ; giữ phần phiên âm đọc được và hỏi lại. 2AM = AB được kiểm tra riêng để tránh biến thành AM = AB hoặc tự suy ra trung điểm khi chưa biết M thuộc đoạn AB.
- Chỉ dữ kiện đủ rõ mới được xác nhận. Sửa phiên âm hoặc báo hình sai sẽ cập nhật cấu trúc và yêu cầu kiểm tra lại trước khi vẽ.
- Prompt TikZ người dùng cung cấp được giữ nguyên trong server/tikz-image-prompt.mjs. Ràng buộc của engine được đặt trước prompt; cấu trúc hình học đã kiểm tra được nối vào cuối.
- Tái sử dụng @rod2ik/tikzjax 1.6.0 tự lưu trữ: TeX/WebAssembly → SVG thật trong trình duyệt; không cần học sinh cài LaTeX hoặc thêm dịch vụ/khóa bí mật.
- Một lần sinh ban đầu và tối đa hai lần sửa với lỗi cụ thể, có token đếm lượt. Lỗi cuối giữ phiên âm, cho thử dựng lại hoặc sửa dữ kiện.
- Hiển thị đề, hình, lý thuyết dự kiến; học sinh xác nhận hình mới bắt đầu hội thoại. Có phóng to, tải PNG/SVG và vùng mở rộng tải mã TikZ.
- “Hình chưa đúng” yêu cầu chỉ ra phần sai; thông tin này được đưa vào bước cập nhật cấu trúc và lần sinh mã tiếp theo.

Bộ kiểm tra tọa độ hỗ trợ các quan hệ phổ biến: thuộc đoạn/đường, nằm giữa, trung điểm, tỉ lệ, độ dài, góc, song song, vuông góc, giao điểm, trọng tâm, phân giác, một số quan hệ đường tròn/tiếp tuyến và dạng tứ giác. Quan hệ chưa kiểm chứng được hiển thị để đối chiếu, không được gọi là đã xác minh.

## 3. Bảo mật biên dịch

Mã được kiểm tra cả máy chủ lẫn trình duyệt bằng danh sách lệnh, môi trường, gói và thư viện cho phép. Chặn lệnh tệp, shell, macro động, mã chèn và thư viện ngoài danh sách. Biến pgfmath chỉ có tên một chữ cái để không dùng khai báo biến nhằm hợp thức hóa lệnh TeX khác. Vòng foreach chỉ được mở rộng từ danh sách điểm hữu hạn; không thực thi vòng lặp tùy ý.

Giới hạn: 18.000 ký tự đầu vào, 36.000 sau mở rộng, 800 lệnh vẽ, độ sâu ngoặc 60, samples ≤ 200. Worker có WASM memory cố định 2.500 trang (~156,25 MiB); tổng RAM trình duyệt còn gồm ảnh, JS và SVG. Timeout engine 25 giây, frame 30 giây, bên gọi 35 giây. Hủy, lỗi hoặc thành công đều kết thúc worker và dọn iframe.

TeX chạy trong WASM ở trình duyệt, không chạy tiến trình LaTeX máy chủ và không bật shell escape. CSP chỉ cho tài nguyên cùng website và font nhúng; không có dịch vụ biên dịch ngoài. SVG được lọc theo danh sách thẻ/thuộc tính, chặn script, HTML, URL ngoài và CSS không cho phép trước khi trả và trước khi hiển thị. Không đưa HTML do mô hình sinh vào DOM.

Đây là một tập con TikZ được kiểm soát, không phải môi trường chạy mọi chương trình TeX. Bộ lọc và giới hạn không được xem là bằng chứng an toàn tuyệt đối cho TeX bất kỳ.

## 4. Tệp thay đổi

| Nhóm | Tệp |
|---|---|
| Sửa giao diện/trạng thái | app/page.tsx; app/enhancements.css; lib/session-recovery.ts |
| Sửa tích hợp máy chủ | server/gemini.mjs |
| Sửa bộ biên dịch dùng chung | public/tikz-format.mjs; public/tikz-frame.html; public/tikz-frame.js |
| Sửa cấu hình/tài liệu | package.json; package-lock.json; README.md |
| Cập nhật kiểm thử bảo toàn | tests/preserved.test.mjs; tests/survey-component.test.mjs; tests/survey-preserved.test.mjs |
| Thêm điều khiển AI | server/adaptive-tutor.mjs; server/feature-api.mjs; server/signed-state.mjs |
| Thêm đọc ảnh/kiểm tra hình | server/image-policy.mjs; server/geometry-checks.mjs; server/tikz-image-prompt.mjs |
| Thêm UI và thư viện | components/image-problem.tsx; lib/image-input.ts; lib/image-workflow.ts; lib/tikz-compiler.ts |
| Thêm kiểm tra trình duyệt | public/image-format.mjs và .d.mts; public/svg-safety.mjs và .d.mts; public/tikz-init.js |
| Thêm công cụ/kiểm thử | eslint.config.mjs; scripts/check-v623-ui.mjs; scripts/check-v623-live.mjs; scripts/make-image-fixtures.py; tests/v623-adaptive.test.mjs; tests/v623-image.test.mjs; tests/v623-session.test.mjs; tests/fixtures/v623-data.mjs; tests/fixtures/images/* |
| Thêm tài liệu/bằng chứng | docs/*V6_2_3*; qa-results/v6.2.3/*; kết quả mới ở research/v6-checks/* |

Danh sách đầy đủ kèm SHA-256 nằm trong docs/THAY_DOI_TEP_V6_2_3.json. Các kiểm thử bảo toàn cũ chỉ được điều chỉnh tại chỗ tích hợp tính năng mới; không xóa bộ kiểm thử gốc. Giữ nguyên netlify.toml, entry Functions, .env.example, mã lớp HOCGIOITOAN, dữ liệu bài mẫu và THIRD_PARTY.

## 5. Kết quả đã chạy

Môi trường: Node 24.19.0, npm 11.9.0; Chromium 131 với Playwright 1.62.1. Cấu hình triển khai Node 22 hiện có không thay đổi; chưa chạy triển khai Netlify thật.

| Kiểm tra | Kết quả |
|---|---|
| npm ci --ignore-scripts --no-audit --no-fund | Thành công, 273 package; prebuild của ứng dụng chạy riêng khi build |
| npm run lint | Pass, không có lỗi/cảnh báo ESLint |
| npm run typecheck | Pass |
| npm test | 491 ca: 490 pass, 0 fail, 1 skip (Gemini live cần khóa/opt-in); gồm 48 ca mới |
| npm run build | Pass; không lỗi cú pháp/import; có cảnh báo chunk JS 757,79 kB, gzip 233,99 kB |
| npm run test:tikz | 6/6 mẫu biên dịch TeX/WASM thật |
| TEST_PRODUCTION=1 npm run test:ui | Pass luồng cũ; 7 mục kiểm tra được ghi |
| npm run test:ui:v623 | 12/12 mục pass trên build production; Gemini có kiểm soát, canvas/TeX/SVG/PNG thật |
| Kiểm tra entry Functions, tài nguyên, giấy phép và mẫu khóa | Pass; xem source-audit.json |
| Gemini thật / Safari / camera vật lý | Chưa chạy; xem bảng kiểm thử |

Bằng chứng nằm trong qa-results/v6.2.3 và research/v6-checks. Cảnh báo npm về biến http-proxy thuộc môi trường chạy; không phải cấu hình được đóng gói. Cảnh báo kích thước bundle được giữ công khai, không bị tắt để làm đẹp kết quả.

## 6. Giới hạn và nghiệm thu còn lại

1. Chưa chứng minh Gemini thật đọc đúng các ảnh nghiêng/xoay/mờ hoặc phân loại sư phạm đúng. Có bộ ảnh tự soạn và script live để giáo viên chạy khi có khóa; kết quả cần đọc thủ công, không tự coi HTTP 200 là đúng toán.
2. Chưa kiểm tra Safari/iOS, camera vật lý, Android thật hoặc tải nặng nhiều học sinh. Đã kiểm tra Chromium với viewport cảm ứng 390/412 px. WebKit không khởi chạy được do thiếu thư viện hệ thống; không coi đây là kiểm thử Safari đạt.
3. Engine hiện có không hỗ trợ toàn bộ PGFPlots. Đồ thị dùng TikZ plot; hình khó có thể bị từ chối sau các lần sửa giới hạn.
4. Kiểm tra tọa độ không chứng minh mọi đường vẽ đúng, mọi góc/tỉ lệ đều được đánh dấu đúng hay nhãn không chồng. Hình mới vẫn cần xác nhận. Ca ảnh 2AM trong UI có nhãn rõ; trong các fixture hồi quy cũ, nhãn H gần ký hiệu góc vuông và A/B của hình bình hành gần cạnh — đã ghi riêng trong bảng kiểm thử.
5. Điểm tin cậy OCR do mô hình cung cấp là tín hiệu điều khiển, không phải xác suất đã hiệu chuẩn. Nén có thể ảnh hưởng chữ rất nhỏ; luôn cho kiểm tra phiên âm/chụp lại.
6. Token hết hạn hoặc thay khóa máy chủ làm phiên cũ không dùng tiếp được. Ảnh/tiến trình dựng chưa được khôi phục sau tải lại trang.
7. Chưa triển khai lên Netlify đang dùng. Cần kiểm tra bản deploy nháp trước khi cập nhật site thật.

ZIP mới không chứa node_modules, dist, .env thật, cache hoặc log có khóa. Các tài nguyên WASM/font cần thiết và giấy phép vẫn có đầy đủ; build tạo lại dist theo quy trình cũ. Dấu thời gian ZIP của tệp gốc không sửa được giữ từ archive ban đầu.

Tài liệu API tham khảo: https://ai.google.dev/gemini-api/docs/structured-output ; https://ai.google.dev/gemini-api/docs/image-understanding ; https://docs.netlify.com/build/functions/overview/ . Engine/giấy phép: https://github.com/rod2ik/tikzjax .

