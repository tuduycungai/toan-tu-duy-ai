# Bản phát hành PRO V4.4

## Thay đổi phục vụ học sinh

- Đọc thêm cách diễn đạt vị trí điểm, danh sách “lần lượt”, giao điểm hai đường và tỉ lệ đoạn thẳng. Chấp nhận `2AM=AB`, `AM=AB/2`, `AM:MB=1:2`, hệ số thập phân và một số dạng phân số LaTeX. Điều kiện M thuộc đoạn AB vẫn phải có trong đề; đẳng thức độ dài không tự thay thế điều kiện vị trí.
- Dựng từ quan hệ hình học rồi kiểm tra lại độ dài, vị trí, trung điểm, song song, vuông góc và giao điểm. SVG và TikZ dùng chung dữ liệu đã kiểm tra, không lấy tọa độ do mô hình tự đoán.
- Tích hợp toàn bộ 81 bài đã đánh chỉ mục từ phiếu bài tập 46 trang, với 93 hình; giữ 6 bài mẫu cũ. Đề chỉ khớp bản dựng đã kiểm chứng khi toàn bộ nội dung chuẩn hóa trùng khớp, không dùng hình cũ cho đề có dữ kiện bị thay đổi.
- Công thức được hiển thị bằng KaTeX với phông cục bộ, gồm dấu `$…$`, `$$…$$`, `\(…\)`, `\[…\]`. Điều chỉnh ngắt dòng, vùng cuộn công thức, kích thước ô nhập và nút trên màn hình nhỏ; giữ màu xanh nhạt và giao diện tối.
- Dưới hình có các kiến thức liên quan và điều kiện áp dụng. Không điền lời giải của bài vào bảng lý thuyết.
- Gia sư hỏi một nhiệm vụ mỗi lượt qua năm giai đoạn; không có ngoại lệ xin đáp án. Chặn cục bộ những yêu cầu xin lời giải được nhận diện và kiểm tra cấu trúc đầu ra trước khi hiển thị. Những tình huống chưa biết được tăng gợi ý, không chuyển sang giải hộ.
- Cá nhân hóa cho năm mức trong hồ sơ. Mức tự khai chỉ là điểm bắt đầu; hỗ trợ thay đổi theo bằng chứng trong câu trả lời. Không gửi tên, trường, email qua phần ngữ cảnh cá nhân hóa.
- Áp dụng bài nghiên cứu của Nguyễn Thanh Hưng và Ngô Tùng Nhân (2019), tr.184–187, vào cách chọn thao tác và đặt câu hỏi. Không sao chép đáp án mẫu của bài báo cho học sinh. Đã làm rõ: hình thoi **không nhất thiết** có hai đường chéo bằng nhau; trường hợp hình vuông vẫn có.

## Phạm vi mã nguồn

Các nhóm thay đổi chính:

| Nhóm | Tệp |
|---|---|
| Hỏi gợi mở và cá nhân hóa | server/policy.mjs, strict-tutor.mjs, learner-guidance.mjs, research-pedagogy.mjs |
| Tích hợp kiểm soát nội dung | server/gemini.mjs: chỉ thêm chặn xin đáp án, kiểm tra đầu ra và chuyển lịch sử vào hàm tạo chỉ dẫn |
| Dựng hình và tỉ lệ | lib/problem-diagram.ts, geometry.ts, point-language.ts, ratio-language.ts, worksheet-geometry.ts, worksheets.ts |
| Hiển thị | app/page.tsx, app/enhancements.css, main.tsx, components/problem-figure.tsx, math-text.tsx, learning-visuals.tsx, theory-panel.tsx, worksheet-bank.tsx |
| Toán và lý thuyết | lib/math-parts.ts, katex.d.ts, theory.ts |
| Phụ thuộc | package.json, package-lock.json: thêm KaTeX; không đổi SDK Gemini |
| Kiểm chứng và tài liệu | tests, scripts, qa, README.md, research/AP_DUNG_NGHIEN_CUU_2019.md và các kết quả V4.4 |

Danh sách chính xác và SHA-256 so với bản V4.3 nằm trong `research/release-checks/source-diff.json`. `source-manifest.json` ghi dấu vân tay nguồn V4.4 dùng kiểm thử.

Giao thức Gemini giữ endpoint, HTTP method, header khóa server, model mặc định `gemini-2.5-flash`, cấu trúc request/response, các giới hạn và xử lý lỗi gốc. Tệp `server/gemini.mjs` có thay đổi kiểm soát nội dung nêu trên nên **không được coi là nguyên byte**. Kiểm thử đối chiếu xác nhận phần vận chuyển còn lại giữ nguyên. Netlify functions, cấu hình Netlify, `.env.example`, mã HOCGIOITOAN, module hồ sơ và module Google Forms giữ nguyên. Giao diện chỉ bổ sung phần cần thiết cho yêu cầu mới.

## Đọc minh chứng đúng phạm vi

`research/release-checks/summary.json` và Excel đi kèm chứa số lượng, thời điểm UTC, thời gian chạy và kết quả lấy từ lần chạy thực tế. `tests.jsonl` chứa từng kiểm thử; các tệp `.log` lưu kết quả các lệnh. Đối chiếu 93 hình tại `research/worksheet-checks/audit.json`, các tệp TikZ và ảnh tổng quan.

- Kiểm thử API xác minh mã lớp, bảo mật khóa, cấu trúc dữ liệu, timeout và bộ chặn bằng phản hồi mô phỏng. Không đồng nghĩa đã xác nhận Gemini thật trả lời đúng mọi tình huống.
- 81 bài được dựng và kiểm tra tại năm giá trị tham số. Các đẳng thức số ở những hình cụ thể không thay thế chứng minh hình học tổng quát.
- 18 tình huống sư phạm trong Excel là kịch bản nghiệm thu để giáo viên dùng tiếp; cột trạng thái ghi rõ chưa chạy Gemini thật. Ba hội thoại trong tài liệu nghiên cứu là minh họa biên soạn.
- Không có khóa Gemini thật để nghiệm thu đầu cuối. Trang Netlify đang giới hạn truy cập; chưa xác nhận triển khai trên tài khoản của giáo viên. Không gửi đánh giá thử vào Google Forms.
- Công thức và mã đáp ứng điện thoại đã được kiểm tra ở cấp mã/hiển thị toán; chưa nghiệm thu trực tiếp trên Safari/iPhone trong lần phát hành này. Trang xem thử ngoại tuyến được kèm để kiểm tra thủ công.
- Bộ đọc đề có phạm vi hữu hạn. Đề thiếu dữ kiện, mâu thuẫn hoặc dùng cấu hình chưa hỗ trợ sẽ được yêu cầu làm rõ. Không hứa mọi đề tự do đều dựng được hoặc mô hình không thể mắc lỗi.

## Vận hành

Làm theo README.md để chạy và triển khai. Không đưa `.env` có khóa thật vào ZIP hoặc kho mã nguồn. Website dựng SVG ngay trên trình duyệt; TikZ là bản xuất để kiểm tra/chia sẻ, không phải một dịch vụ LaTeX cần thêm vào backend.

Đã loại tệp tạm không phục vụ sản phẩm. Theo yêu cầu bổ sung về minh chứng, giữ thông tin đóng góp AI trong `research/provenance`, kèm nhật ký câu lệnh và bản đối chiếu mã nguồn. Giữ giấy phép thư viện, nguồn học thuật và lịch sử kiểm thử để kiểm tra được nguồn gốc.
