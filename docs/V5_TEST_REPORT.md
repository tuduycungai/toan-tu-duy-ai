# Báo cáo kiểm thử V5 — 16/09/2026

## Kết quả đã chạy

| Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| Bộ gốc trước sửa | 346 đạt, 0 lỗi, 1 bỏ qua | `baseline-test.log` được ghi trước chỉnh sửa; tóm tắt trong báo cáo bàn giao |
| `npm run build` | Đạt | `research/v5-checks/build.log` |
| `npx tsc --noEmit` | Đạt | `research/v5-checks/typecheck.log` |
| `npm test` sau sửa | 382 ca: **381 đạt, 0 lỗi, 1 bỏ qua** | `research/v5-checks/npm-test.log`, `unit-exit.json` (exit 0) |
| `npm run test:v5` | **34/34 đạt** | `research/v5-checks/v5-tests.log` |
| `npm run test:ui` | **17 nhóm kiểm tra đạt** | `research/v5-checks/browser-results.json`, `browser.log` |
| Kiểm tra giao diện cũ | Đạt | `research/v5-checks/legacy-ui.log` |

34 ca V5 là tập con của 382 ca toàn bộ, không cộng hai số để báo tổng. Một ca bỏ qua là bộ đánh giá sư phạm với Gemini thật khi không có cấu hình chạy trực tiếp. Bản phát hành này chưa kiểm thử phản hồi thực của dịch vụ Gemini.

Môi trường: Node.js 24.19.0; TypeScript 5.9.3; Vite 8.0.13; Playwright 1.62.1; Chromium 153.0.8010.0; Linux. Browser chạy thực và ảnh được tải xuống thực. Chỉ endpoint AI/Forms được giả lập. Do môi trường không tải được gói trình duyệt chuẩn, kiểm tra dùng Chromium đóng gói qua npm với các cờ tương thích môi trường; người dùng có thể dùng Chromium chuẩn của Playwright theo README.

Build còn cảnh báo một chunk JavaScript lớn hơn 500 kB (khoảng 722 kB, gzip 222 kB), không làm build thất bại. Không coi đây là kiểm thử hiệu năng mạng hoặc bảo đảm tốc độ trên mọi thiết bị.

## Mười nhóm bài bắt buộc

| # | Nhóm | Nội dung kiểm tra độc lập | Kết quả |
|---:|---|---|---|
| 1 | Hình bình hành ABCD tâm O, E/F trung điểm OD/OB | Giao điểm O; vị trí và khoảng cách hai trung điểm; AC, BD, AE, CF hiện diện; mục tiêu không thành giả thiết | Đạt |
| 2 | Hình chữ nhật có đường vuông góc | H thuộc BD; AH vuông góc BD qua tích vô hướng | Đạt |
| 3 | Hình thoi có đường chéo | PR vuông góc QS; I là trung điểm PR | Đạt |
| 4 | Hình thang có đường trung bình | Trung điểm M/N của hai cạnh bên; song song; độ dài bằng nửa tổng hai đáy | Đạt |
| 5 | Tam giác có trung điểm và song song | Đường qua M song song BC cắt AC tại N; N thực sự là trung điểm AC | Đạt |
| 6 | Đường tròn/bán kính/tiếp tuyến | OA = 3; tâm/bán kính đúng; d qua A vuông góc OA | Đạt |
| 7 | Bài mới ngoài ngân hàng | KLMN tâm P, R/S thuộc PN/PL theo trung điểm; tính từ các tên mới | Đạt |
| 8 | LaTeX/Unicode/nhiều dòng | NFC/NFD, bao công thức, `\overline`, `\parallel`, xuống dòng | Đạt |
| 9 | “Theo thứ tự” | Đảo OD/OB thì E/F cũng đổi đúng theo cặp mới | Đạt |
| 10 | Thiếu/mơ hồ dữ kiện | Thiếu O: vẫn có hình cơ sở; không tự tạo O; có giả định, phần thiếu, câu hỏi và thao tác sửa | Đạt với hình tạm |

Toàn bộ đề và biểu thức kiểm tra nằm trong `tests/v5-geometry.test.mjs`. “Đạt với hình tạm” không có nghĩa đã dựng được toàn bộ một đề còn thiếu.

## Kiểm tra bổ sung

- Kết luận sai “AC vuông góc BD” không ép hình bình hành trở thành hình thoi.
- Dữ kiện trung điểm mâu thuẫn, bán kính bằng 0 và tiếp tuyến không qua tiếp điểm không được đánh dấu đã kiểm chứng.
- Điều kiện chưa hỗ trợ (ví dụ góc 37 độ) vẫn xuất hiện trong mục chưa đối chiếu.
- Điểm tùy ý không bị tự đặt tại trung điểm; tia giữ loại đối tượng; nối thêm đoạn trong hội thoại giữ mục tiêu gốc.
- Lý thuyết cho bài ngoài ngân hàng và bài thiếu dữ kiện có đủ các trường; tiếp tuyến không mặc định đưa kiến thức tổng góc không liên quan.
- Không phân loại từ một đáp án; không tăng bằng chứng bằng lặp một câu; đủ bốn câu mới gợi ý; mức chọn thủ công được giữ; quan sát bài làm tự do không được đánh dấu đúng toán học.
- Nhật ký lấy câu hỏi hiển thị thật; lời chào không tạo câu hỏi giả; dữ liệu hồ sơ không bị lẫn thành yêu cầu xin đáp án.
- Trình duyệt: nhãn không chồng; PNG 1680×1215 thật; SVG có style; zoom tăng kích thước thật; vẽ lại; sửa giả định; thu gọn lý thuyết; lưu hồ sơ khi chọn ghi nhớ; không có lỗi JavaScript; màn hình rộng 360/390/768 px không tràn ngang.
- Luồng cũ: kết nối trước khi nhập hồ sơ; các chế độ; đánh giá thủ công/tự động; fallback Forms; giữ nội dung khi lỗi; đổi bài; lưu chủ đề sáng/tối; không tự gửi tên/email đến Gemini.

## Ảnh minh chứng

Trong `research/v5-checks/`:

- `01-hinh-binh-hanh.png`, `05-dark-geometry.png`: hình bắt buộc và lý thuyết.
- `03-export.png`, `04-export.svg`: tệp tải ra từ giao diện.
- `06-provisional.png`, `07-circle.png`: đề thiếu dữ kiện và tiếp tuyến.
- `08-learner-profile.png`: chẩn đoán và mức học.
- `09-footer-desktop.png`, `11-footer-mobile.png`: chân trang đúng tên.
- `10-mobile-360.png`, `10-mobile-390.png`, `10-mobile-768.png`: bố cục nhỏ.
- `02-desktop-light.png`, `12-desktop-chat.png`: giao diện tổng thể.

Các ảnh hội thoại/hồ sơ dùng dữ liệu kiểm thử và phản hồi giả lập, không phải bằng chứng về chất lượng Gemini thật.

## Giới hạn còn tồn tại

Chưa kiểm chứng toàn bộ mọi câu tiếng Việt hoặc mọi bài hình học THCS; bộ đọc/gộp ràng buộc chưa tổng quát cho mọi góc, đường tròn và điểm có tên phức tạp. Có cơ chế hình tạm rõ ràng. Bộ phân loại bốn câu là heuristic sư phạm; chưa được chuẩn hóa/đánh giá thực nghiệm. Cơ chế chọn lý thuyết từ danh mục chưa bao phủ mọi định lý. Bộ bảo vệ câu hỏi không là trình chứng minh hình thức cho nội dung AI. Không có bản triển khai lên website Netlify đang chạy trong lần bàn giao này.
