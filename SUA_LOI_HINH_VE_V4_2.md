# Bản sửa hình vẽ V4.2

Bản này sửa phần dựng hình và bổ sung xuất TikZ. Cơ chế gia sư năm giai đoạn V3, mã lớp HOCGIOITOAN, API Gemini, Google Forms và cấu hình Netlify được giữ nguyên.

## Lỗi đã xử lý

Trong bài của Thầy, K thuộc AB, I thuộc CD và AK = CI. Hình cũ đặt I theo chiều D → C nên thực tế thỏa AK = DI. Đường KI vì thế không đi qua O. Bản sửa tính khoảng cách AK, rồi đặt I trên đoạn C → D với đúng khoảng cách đó. Sau khi dựng, ứng dụng kiểm tra lại AK = CI và vị trí các điểm từ chính đề bài. Bài kiểm thử kiểm tra thêm K, O, I thẳng hàng; ứng dụng không dùng kết luận cần chứng minh làm giả thiết để ép hình đúng.

Một lỗi khác là từ chối kí hiệu trên đoạn con: AE thuộc cạnh AB, CF thuộc cạnh CD. Bộ kiểm tra mới xác nhận đoạn con nằm trên cạnh đã vẽ, nên các hình trung điểm không bị loại nhầm.

## Cách hoạt động

1. Gắn mỗi phản hồi với nguyên văn bài toán của lượt tương ứng. Chuyển bài hoặc sửa đề không lấy hình của bài trước.
2. Sáu bài mẫu dùng sáu cấu hình đã kiểm tra. Chỉ chọn cấu hình khi toàn bộ đề khớp; đổi dữ kiện sẽ không dùng nhầm hình mẫu.
3. Với đề nhập trực tiếp, đọc những quan hệ được hỗ trợ: loại hình, trung điểm, giao điểm, điểm trên cạnh, đối xứng tâm, hình chiếu, đoạn bằng nhau, song song, vuông góc và một số độ dài.
4. Tính các điểm bằng phép dựng xác định, sau đó đối chiếu lại các quan hệ. Không sử dụng tọa độ do Gemini tự đoán, kể cả khi phản hồi chứa khối HINH_VE.
5. Vẽ SVG để xem trên web; nút **Tải TikZ (.tex)** xuất cùng tọa độ đã kiểm tra. Phóng to và ẩn/hiện nét phụ đều hoạt động trên máy tính và điện thoại.

Sơ đồ SO_DO vẫn là định hướng sư phạm. Hình không hiển thị lời giải hoặc tự đánh dấu các kết luận cần chứng minh là giả thiết.

## Phạm vi chính xác và trường hợp chưa hỗ trợ

Đây là bộ dựng và kiểm tra hình cho các cấu trúc đã hỗ trợ, không phải hệ chứng minh tự động hiểu mọi đề tiếng Việt. Bản này không cam kết giải mã chính xác mọi cách diễn đạt tự nhiên. Khi còn điều kiện chưa phân tích được, ràng buộc mâu thuẫn hoặc chưa dựng được cấu hình thỏa đề, ứng dụng **không hiển thị hình đó** và đề nghị làm rõ.

Các dạng như phân giác tổng quát, đường tròn, tỉ số phức tạp, nhiều trường hợp điều kiện hoặc tên điểm có chỉ số/dấu phẩy trong đề nhập tự do có thể cần giáo viên viết lại từng giả thiết. Đề phải được nhập bằng văn bản; không bổ sung nhận dạng ảnh trong lần sửa này. Không tự chọn một hình “gần giống” chỉ vì trùng từ khóa.

Ví dụ được hỗ trợ:

> Cho hình bình hành ABCD, gọi O là giao điểm của hai đường chéo. Trên AB lấy điểm K, trên CD lấy điểm I sao cho AK bằng CI. Chứng minh K, O, I thẳng hàng.

> Cho hình vuông ABCD. E nằm trong cạnh AB, F nằm trong cạnh AD sao cho AE = AF. Chứng minh CE = CF.

## Tệp thay đổi

- `app/page.tsx`: gắn nguồn đề vào từng tin nhắn hiển thị; thêm hình và nút vẽ lại. Không thêm trường vào request API.
- `app/globals.css`: chỉ nối thêm CSS cho hình, giữ nguyên toàn bộ CSS sáng/tối ban đầu.
- `lib/learning.ts`: ẩn dữ liệu HINH_VE khỏi nội dung trò chuyện; giữ nguyên SO_DO, bài tập và các chế độ.
- `tests/preserved.test.mjs`: chỉ loại ba tệp tích hợp giao diện trên khỏi kiểm tra byte nguyên vẹn; thêm kiểm tra CSS gốc và prompt V3.

Tệp thêm: `lib/geometry.ts`, `lib/problem-diagram.ts`, `components/problem-figure.tsx`, `tests/geometry.test.mjs`, `tests/load-ts.mjs`, `tests/v3-policy-integrity.json`, `scripts/check-geometry-ui.mjs`, tài liệu và kết quả kiểm thử trong `research/geometry-checks`, `research/tikz-checks`.

## Các thành phần giữ nguyên

`server/gemini.mjs`, `server/policy.mjs`, `server/feedback.mjs`, cả hai Netlify Functions, `lib/tutor.ts`, `lib/feedback.ts`, `lib/form-config.json`, `netlify.toml`, `.env.example`, `package.json`, `package-lock.json`, các tệp cấu hình build, hồ sơ, nút kết thúc và quy trình đánh giá. Kiểm tra SHA-256 tự động xác nhận các tệp được bảo toàn.

Không thay model, SDK, endpoint, cấu trúc request/response hoặc biến môi trường. Mã truy cập mặc định vẫn là HOCGIOITOAN. Nếu Netlify đang đặt ACCESS_CODE riêng thì giữ cấu hình đã được giáo viên sử dụng.

## Chạy và deploy

```bash
npm install
npm test
npx tsc --noEmit
npm run build
npm start
```

Dùng Node theo `package.json` (>=22.13.0). Đặt khóa Gemini của giáo viên trong môi trường server theo `.env.example`/hướng dẫn hiện có; không đưa khóa vào frontend. ZIP không chứa khóa thật, `.env` hoặc `node_modules`.

Deploy từ toàn bộ dự án lên Netlify với `netlify.toml` hiện có: build `npm run build`, publish `dist`, Functions `netlify/functions`. Giữ nguyên biến môi trường của site. Không chỉ tải riêng `dist` theo cách bỏ mất Functions. Chưa thực hiện deploy thay site đang chạy.

## TikZ

File tải về là tài liệu LaTeX độc lập, có thể biên dịch bằng pdfLaTeX với gói TikZ. Trên web không cần cài LaTeX. Không gửi mã của mô hình đến bộ biên dịch server; TikZ được tạo từ tên điểm hợp lệ và tọa độ đã kiểm tra.

```bash
pdflatex -no-shell-escape -halt-on-error hinh-hoc-tikz.tex
```

Đã biên dịch thành công cả sáu bài mẫu và bài AK = CI. File `.tex`, PDF và kết quả có trong `research/tikz-checks`. Cú pháp tọa độ tham chiếu tài liệu chính thức [TikZ — Specifying Coordinates](https://tikz.dev/tikz-coordinates).

## Xác minh

Kết quả chi tiết ba lệnh bắt buộc nằm trong `research/geometry-checks/verification.json` và các log cùng thư mục. Kiểm tra trình duyệt bao gồm sáu bài mẫu, dữ liệu hình sai từ mô hình, bài trong ảnh, đổi tên điểm, đổi bài, phóng to, ẩn nét phụ, tải TikZ, giao diện sáng/tối và điện thoại. Kiểm tra giao diện cũ cũng xác nhận kết nối → hồ sơ, nút kết thúc, đánh giá, trường hợp Google Forms chưa xác nhận và khôi phục khi API lỗi.

Các bài kiểm tra API/trình duyệt dùng Gemini và Google Forms mô phỏng, không gửi thông tin học sinh thật. Kiểm tra gọi Gemini thật được bỏ qua vì phiên làm việc không có khóa thật; truy cập thử site Netlify gặp lớp đăng nhập bảo vệ nên không xác nhận được phản hồi Gemini trên site đó. Không đồng nhất kiểm thử mô phỏng với kiểm thử dịch vụ thật.
