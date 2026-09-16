# Bàn giao V6 — 16/09/2026

## Kết quả thực hiện

Đã tạo bản mã nguồn V6 kế thừa V5. Chưa triển khai lên tuduyhinhtoan8.netlify.app vì phiên làm việc không có quyền Netlify; chưa kiểm thử Gemini thật vì không có GEMINI_API_KEY. Gói này sẵn sàng để triển khai và chạy nghiệm thu với khóa của dự án.

### Thay cơ chế vẽ

Đường dựng hình mới là Gemini phiên dịch đề thành TikZ, sau đó TeX/WebAssembly biên dịch trực tiếp thành SVG. Giao diện học sinh không còn dùng bộ phân tích câu regex để chọn tọa độ/hình cơ sở. Mã cũ được giữ cho lý thuyết, tài liệu và kiểm tra hồi quy.

Prompt lấy các yêu cầu toán học và thẩm mỹ của người dùng: tọa độ chính xác, calc/intersections, đủ điểm, góc vuông, nét phụ, nhãn toán học, không dùng kết luận làm giả thiết. Định dạng vận chuyển đổi thành JSON để ứng dụng nhận mã hoặc một câu hỏi rõ ràng. Mã tải xuống vẫn là tài liệu LaTeX standalone. Đồ thị hiện dùng TikZ plot; không tuyên bố hỗ trợ PGFPlots hay toàn bộ LaTeX.

Dùng @rod2ik/tikzjax 1.6.0, tự phục vụ bộ biên dịch/font trên website. Không cần cài LaTeX trên Netlify. Phát hiện và sửa lỗi máy chủ giải nén .gz trước khi bộ biên dịch giải nén; dùng tài nguyên .gz.bin. Header X-Frame-Options đổi từ DENY sang SAMEORIGIN để khung biên dịch cùng website hoạt động.

Một lần sửa mã tự động khi biên dịch lỗi. Giới hạn thời gian, hủy yêu cầu khi đổi đề, không hiển thị hình cũ cho đề mới. Bộ nhớ đệm chỉ trong phiên. Mã truy cập vẫn được kiểm tra ở máy chủ, khóa Gemini không gửi ra trình duyệt. SVG hiển thị dưới dạng ảnh; font được nhúng để tải SVG/PNG không mất nhãn. PNG không kéo méo hình.

### Gợi ý tự nhiên hơn

Prompt yêu cầu Thầy–em, cảm thán vừa phải, không khen sai. Xin gợi ý thêm phải thu nhỏ nhiệm vụ từ bước trước, không quay về hỏi kết luận đề bài. Bộ kiểm tra phản hồi chấp nhận một câu gợi ý hữu ích dù thiếu nhãn sơ đồ/thao tác cứng nhắc; vẫn chặn yêu cầu đáp án hoàn chỉnh theo định hướng sư phạm có sẵn. Fallback đổi theo mức xin gợi ý thay vì chép nguyên câu hỏi trước.

### Giao diện

Bỏ bảng “Giả định và dữ kiện cần làm rõ”, bảng xác minh và phần JSON giáo viên khỏi thẻ hình mới. Khi thật sự thiếu dữ kiện, hỏi ngắn ngay trong thẻ và cho nhập bổ sung. Đây không phải yêu cầu viết lại toàn bộ đề.

Trong ảnh người dùng, câu “Từ điểm P vẽ PM song song BC” thiếu vị trí M. Không thể suy M thuộc AB chỉ từ điều kiện song song. Bài kiểm tra hình đầy đủ ghi rõ M thuộc AB. Với đề thiếu, thử nghiệm kiểm tra rằng ứng dụng hiển thị câu hỏi về M và không dựng tam giác giả. Việc Gemini nhận ra dữ kiện thiếu trong câu cụ thể còn cần nghiệm thu trực tiếp bằng khóa thật.

## Kiểm thử và giới hạn của bằng chứng

| Kiểm tra | Kết quả |
|---|---|
| npm test | 387 đạt, 0 lỗi, 1 bỏ qua (Gemini trực tiếp) |
| TypeScript | Đạt |
| Build production | Đạt |
| TeX/WebAssembly trên Chromium | 6/6 cấu hình biên dịch thật |
| UI Chromium | 7 nhóm kiểm tra đạt; Gemini giả lập |
| Gemini trực tiếp | Chưa chạy — thiếu khóa |
| Netlify đang chạy | Chưa cập nhật — thiếu quyền triển khai |

6 cấu hình: tam giác vuông cân có P/Q/M; hình bình hành có O/E/F; đường tròn–tiếp tuyến; chân đường vuông góc; parabol; hình hộp dạng chiếu. Đây là mã TikZ thử nghiệm được biên soạn, không phải bằng chứng mô hình luôn phiên dịch đúng 6 đề. Tổng 387 kiểm tra còn bao gồm nhiều kiểm tra hồi quy của chức năng cũ, không phải 387 đề vẽ qua Gemini.

UI kiểm tra: luồng API giả lập tới biên dịch thật, font nhúng, bỏ bảng giả định, xuất PNG, màn hình 390/768 px, lỗi biên dịch thật dẫn đến một lượt sửa rồi hiện hình, thiếu dữ kiện không hiện hình sai, không lỗi JavaScript. Có ảnh và kết quả JSON trong research/v6-checks.

Bộ biên dịch xác nhận cú pháp, không chứng nhận toán học. Gemini vẫn có thể chọn tọa độ sai dù mã chạy được; chưa có bộ kiểm chứng độc lập tất cả quan hệ cho TikZ tùy ý. Không cam kết vẽ đúng mọi đề. Lần tải đầu cần tải WASM/core và bộ nhớ của worker; điện thoại yếu cần nghiệm thu thực tế. Mỗi đề mới dùng thêm một lượt Gemini bên cạnh lượt gia sư; sửa lỗi có thể thêm một lượt.

## Nghiệm thu sau triển khai

1. Kết nối bằng mã lớp, gửi đề mới đầy đủ, kiểm tra hình xuất hiện và tải PNG.
2. Thử bài hình bình hành ABCD tâm O, E/F là trung điểm OD/OB, chứng minh AE // CF.
3. Thử bài vuông cân tại C có M thuộc AB, rồi thử bản bỏ “M thuộc AB”.
4. Xin “Gợi ý thêm” hai lần, đối chiếu mức hỗ trợ có tiến thêm một bước.
5. Thử trên điện thoại thật và kiểm tra hạn mức/độ trễ Gemini của tài khoản.

Xem README.md để triển khai cả giao diện và Functions lên site hiện có. Không cần thêm dịch vụ biên dịch LaTeX trả phí.

## Nguồn nghiên cứu

- TikZJax gốc: https://github.com/kisonecat/tikzjax — mô hình TeX/WASM → SVG.
- Bộ dùng trong V6: https://github.com/rod2ik/tikzjax ; README và bộ tài nguyên của npm @rod2ik/tikzjax 1.6.0 đã được đọc và chạy thực tế.
- Netlify CLI: https://cli.netlify.com/commands/deploy/ — deploy dựng và tải cả static/functions, mặc định bản nháp.
- Trang người dùng gửi https://hotrohoctap.com/1ai/6tikz/ không đọc được trực tiếp trong phiên này. Không khẳng định đã sao chép hay xác minh cách triển khai của trang đó.
