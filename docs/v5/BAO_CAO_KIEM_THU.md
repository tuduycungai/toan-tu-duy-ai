# Báo cáo kiểm thử V5 — 15/09/2026

## Kết quả chạy thật

Môi trường Node 24.19.0; giữ lockfile/phụ thuộc và cấu hình triển khai của dự án đầu vào. Bộ chạy: `scripts/verify-v5.mjs`. Thời gian và mã thoát từng lệnh ở `research/v5-checks/summary.json`.

| Kiểm tra | Kết quả |
| --- | --- |
| Bộ kiểm thử V4.4 trước khi sửa | 347 ca: 346 đạt, 1 live bị bỏ qua |
| `npm test` sau nâng cấp | **404 ca: 403 đạt, 0 lỗi, 1 bỏ qua** |
| Reporter riêng của `node:test` | Cùng 404 ca; có tên, tệp, thời gian, trạng thái từng ca trong `tests.jsonl` |
| `npx tsc --noEmit` | Đạt, exit 0 |
| `npm run build` | Đạt, exit 0; còn cảnh báo chunk >500 kB |
| `node scripts/check-v5-render.mjs` | 10/10 render React thật có SVG/lý thuyết/control, không NaN |
| Raster SVG thành PNG | 10/10; lấy SVG do thành phần ứng dụng render |
| `npm start` + HTTP smoke | Trang chủ 200; chat không có khóa 503; GET phản hồi 405 |
| Playwright `scripts/check-ui.mjs` | **Không hoàn thành**: Chromium thoát SIGSEGV khi khởi chạy |
| Gemini/Google Forms thật | **Không chạy**, không gửi dữ liệu thử ra biểu mẫu |

57 ca mới bổ sung so với số lượng ban đầu. Kiểm thử cũ vẫn được chạy; các assertion cố định nguyên văn đầu ra server được cập nhật vì yêu cầu mới bắt buộc đầu ra có kiểm soát. Kiểm tra riêng lịch sử/policy/khóa header không bỏ. Loader của `tutor.test.mjs` đổi sang loader TypeScript có giải import để đọc module hồ sơ mới. Kiểm tra byte-identical chỉ loại trừ đúng tệp có tích hợp được ghi trong danh sách; không đổi SHA kỳ vọng để che sửa đổi.

## Mười ca bắt buộc

Đề nguyên văn, tọa độ, lý thuyết, giả định từng ca ở `research/v5-checks/mandatory-cases.json`.

| Ca | Nội dung | Kết quả và đối chiếu |
| --- | --- | --- |
| 01 | ABCD hình bình hành tâm O, E/F theo thứ tự trung điểm OD/OB, AE ∥ CF | Verified; O là giao AC/BD; E/F đúng đoạn và tỉ số; có AC,BD,AE,CF; không cảnh báo chưa đọc dữ kiện |
| 02 | Hình chữ nhật, M thuộc AB, đường qua M vuông góc AB cắt CD tại N | Verified; M/N thuộc đúng cạnh, MN ⟂ AB |
| 03 | Hình thoi tâm O, hai trung điểm | Verified; hình/đường chéo/trung điểm theo dữ kiện |
| 04 | Hình thang có hai trung điểm cạnh bên | Verified; trung bình song song đáy, độ dài bằng nửa tổng hai đáy |
| 05 | Tam giác, M trung điểm AB, N thuộc AC, MN ∥ BC | Verified; giải giao đường để xác định N, không ép theo mục tiêu |
| 06 | Đường tròn tâm O bán kính 3, dây AB, tiếp tuyến tại A | Verified; A/B trên đường tròn, tiếp tuyến vuông góc OA tại A |
| 07 | Bài mới KLMN, P trung điểm KL, đường qua P cắt MN tại Q | Verified; không phải đề trong ngân hàng, vẫn có hình và lý thuyết |
| 08 | Ca 01 nhập bằng LaTeX | Verified; chuẩn hóa và ghép điểm giữ đúng |
| 09 | “Các điểm E và F theo thứ tự…” | Verified; nhận được cách diễn đạt |
| 10 | Có ABCD, E trung điểm OD nhưng O/F chưa định nghĩa | Provisional; vẫn có hình ABCD và giả định, không bịa E/F; bổ sung đúng O/F chuyển sang verified |

Mọi ca có “LÝ THUYẾT DỰ KIẾN DÙNG”. Với ca 10, chỉ hình tạm được xem là kết quả đúng của kiểm thử, không phải đã giải xong dữ kiện thiếu.

## Các nhóm kiểm tra tăng cường

- Đổi tên điểm, Unicode tổ hợp, đề xuống dòng; không nhầm đơn vị cm với CM.
- Dời trung điểm/tâm/đỉnh hình hoặc đổi bán kính âm: bộ kiểm tra từ chối mô hình sai.
- Đảo F về cùng đoạn OD: hình theo dữ kiện mới, không ép AE ∥ CF chỉ vì kết luận nói vậy.
- Bài kích thước chữ nhật 8×5, hình bình hành góc 60°, đường phụ được thêm và sửa toàn bộ đề có ghi nhận.
- Giả thiết mâu thuẫn, thiếu điểm, đề không có tên điểm, chuỗi HTML: không làm vỡ cây render, có hình tạm và giả định.
- Lý thuyết của toàn bộ 87 bài cũ vẫn có; điều kiện hình thoi/đường chéo không bị phát biểu sai.
- Một câu trả lời không đổi nhãn năng lực; đủ minh chứng nhiều kỹ năng/nhiệm vụ mới cập nhật; có override, giữ lịch sử, tiếp tục thích nghi sau 160 minh chứng; không gửi tên/email/bài làm lưu riêng qua tóm tắt hồ sơ.
- JSON hỏng thử lại/fallback, sai trích dẫn không được dùng làm minh chứng; API key và phần thought không lộ.
- Không phát văn bản lời giải tự do từ nhà cung cấp ở cả nhánh mới/cũ; ba chế độ API và những yêu cầu ép/giả danh/mã hóa; bộ đề 5–10 câu và một bài tương tự không kèm đáp án.
- Footer có đủ bốn dòng tên theo yêu cầu, năm chế độ học vẫn tồn tại.

## Ảnh và giới hạn bằng chứng

`01-parallelogram.png` và chín PNG còn lại là raster của SVG thật từ `DiagramSVG`, đã mở kiểm tra hình chính và đường tròn. Không dùng AI tạo ảnh hình học. Chúng **không phải ảnh chụp giao diện trình duyệt**, không xác nhận nút bấm hay bố cục CSS toàn trang. Mười HTML và SVG gốc cũng kèm theo để xem lại.

Log lỗi trình duyệt: `research/v5-checks/browser-attempt.log`. Không lấy ảnh cũ trong `research/screenshots` để tuyên bố đã chạy giao diện V5.

## Checklist nghiệm thu còn phải thực hiện

1. Trên máy có Chrome/Edge/Safari: nhập mười đề, bấm tải PNG/SVG, mở lại file; xem dấu, tiếng Việt và đường nét cả sáng/tối.
2. Thử màn hình 390×844, thu/phóng, hộp phóng to, nhãn, cuộn hình và vị trí footer.
3. Kiểm tra sửa thiếu O/F và thêm đường phụ, chọn từng hình trong bài nhiều hình của ngân hàng, chọn Câu n của bộ đề vừa tạo.
4. Dùng khóa Gemini thật ở server, thử đủ bốn mức, câu sai/thiếu/đúng, xin lời giải nhiều lần, ngắt mạng, lỗi JSON, hết quota và nhận xét có căn cứ.
5. Kiểm tra từng luồng tự kiểm tra/phản hồi, ghi nhớ/xóa hồ sơ và quay lại bài; chỉ gửi Forms thật khi có đồng ý.
6. Mở rộng tập bài ngoài ngân hàng bằng đề thực tế của giáo viên. Không suy từ 10 ca đạt rằng đã hỗ trợ tất cả hình học THCS.

Kết luận: phần lõi đã được kiểm thử như trên; **chưa nghiệm thu toàn bộ yêu cầu sản phẩm** vì còn giới hạn ngữ pháp/phạm vi, trình duyệt, live AI và đánh giá sư phạm thực nghiệm.
