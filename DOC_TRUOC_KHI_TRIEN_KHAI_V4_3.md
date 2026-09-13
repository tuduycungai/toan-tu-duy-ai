# AI Tutor — bản V4.3: đọc đề theo ngữ cảnh hình học

Bản này tiếp tục sửa bản V4.2. Dùng tài liệu này cho những thay đổi mới; tài liệu V4.2 và V3 được giữ làm lịch sử của dự án.

## Vì sao hình đơn giản trước đây không dựng được?

Gemini và phần dựng hình là hai thành phần khác nhau. Gemini hiểu câu “K, I lần lượt là trung điểm các cạnh AB và CD”, nhưng bộ đọc hình của V4.2 chỉ nhận một số mẫu câu hẹp như “trung điểm của AB và CD”. Nó từ chối trước khi đến bước tính tọa độ. Chuyển công cụ vẽ sang TikZ không tự giải quyết được lỗi đọc đề này. Bộ kiểm thử trước đây chưa bao phủ đủ cách diễn đạt tự nhiên.

## Các thay đổi chính

- Đọc các cách diễn đạt trung điểm tương đương: “của các cạnh”, “hai đoạn thẳng”, danh sách dùng dấu phẩy hoặc “và”, câu viết đảo thứ tự, câu riêng cho từng điểm. Giữ đúng thứ tự tương ứng, kiểm tra đủ số điểm/đoạn.
- Biểu diễn đường thẳng có tên như d, đi qua một điểm và song song/vuông góc với một đoạn. Mọi giao điểm tiếp theo tham chiếu đúng đường đã định nghĩa.
- Đọc “AC cắt BD tại O”, “AC và BD cắt nhau tại O”, “d cắt AD, BC lần lượt tại M, N”, “d cắt AD tại M và BC tại N”, và các dạng viết xuống dòng trong hai ảnh phản hồi.
- Tính điểm theo quan hệ phụ thuộc. Thứ tự tính có thể khác thứ tự nhắc tên trong đề; không đoán vị trí các điểm bằng mắt.
- Hai tên điểm có tọa độ trùng nhau dùng chung một chấm và hiển thị đủ tên, như “O, I”. Không dịch điểm ra khỏi vị trí đúng để tránh chồng chữ.
- SVG trên web và TikZ xuất ra dùng chung kết quả dựng. Có tên đường d, kí hiệu trung điểm, phóng to và ẩn nét phụ.
- Giữ đề gốc khi học sinh đang giải thích một bước; câu trả lời “Vì hình bình hành ABCD…” không tự thay thế đề đang học.

## Gemini hỗ trợ chuẩn hóa ngôn ngữ

Khi cách diễn đạt chưa được bộ đọc trực tiếp nhận diện, ứng dụng có thể kèm yêu cầu chuẩn hóa vào cùng lượt gọi Gemini đang có. Không mở endpoint mới và không phát sinh một lượt HTTP thứ hai để dựng hình.

Gemini được yêu cầu cung cấp các cặp **trích nguyên văn → giả thiết chuẩn hóa**, gắn với mã định danh của đúng đề. Không yêu cầu hoặc sử dụng tọa độ do Gemini tự viết. Trước khi nhận bản chuẩn hóa, ứng dụng kiểm tra:

1. Mã đề phải khớp, các trích đoạn phải có thật và bao phủ phần giả thiết.
2. Không thêm tên điểm, số liệu hoặc bỏ dấu hiệu hạn chế như “không”, “tia”, “ngoài”, “kéo dài”.
3. Không lấy kết luận hoặc trường hợp giả định làm giả thiết.
4. Bản chuẩn hóa phải dựng được bằng các phép dựng đã hỗ trợ.
5. Hình phải thỏa lại các giả thiết gốc mà bộ đọc trực tiếp nhận diện được, kể cả loại hình và quan hệ bằng nhau, song song, vuông góc.

Với hình dùng chuẩn hóa AI, giao diện ghi **“Giả thiết AI đọc từ đề”**, để học sinh và giáo viên đối chiếu. JSON và thông tin điều khiển không hiện trong lời giảng. Bản diễn giải được giữ cho những lượt tiếp theo của cùng bài, không dùng cho một bài khác.

Đây là cơ chế tăng độ bao phủ và giảm sai sót; không phải bảo đảm hình thức rằng AI hiểu đúng mọi đề tiếng Việt. Phần chuẩn hóa vẫn có thể sai nghĩa dù hợp lệ về định dạng. Đề ngoài tập phép dựng hỗ trợ, nhiều trường hợp điều kiện hoặc thiếu/mâu thuẫn dữ kiện có thể cần làm rõ; không tự thêm giả thiết để buộc dựng một hình.

## Hai bài trong ảnh đã kiểm tra

**Trung điểm và AI = CK:** dựng K ở trung điểm AB, I ở trung điểm CD; vẽ AI và CK. Kiểm tra AK = KB, CI = ID và AI = CK bằng tọa độ dựng. AI = CK chỉ là điều kiểm thử kết quả, không phải giả thiết đưa vào bộ dựng.

**Đường d và đồng quy:** dựng O = AC ∩ BD; dựng d qua O và d ∥ AB; dựng M = d ∩ AD, N = d ∩ BC; lấy P trên AB và xác định Q trên CD theo AP = CQ; dựng I = AC ∩ PQ. Kết quả tính cho O và I cùng vị trí. Khi cố ý đổi AP = CQ thành AP = DQ, ứng dụng không ép I về O để “đúng” kết luận đồng quy.

Ảnh chụp, TikZ và PDF kiểm tra nằm trong `research/context-checks/`. Phản hồi AI trong các ảnh kiểm thử được mô phỏng; hình học được bộ dựng thực tế của ứng dụng tính và hiển thị.

## Tệp thay đổi so với V4.2

- `lib/problem-diagram.ts`: đọc các quan hệ và ngữ cảnh mới; tích hợp các bộ đọc; thêm kiểm tra đường thẳng, trung điểm và giữ nguồn đề.
- `lib/geometry.ts`: đường qua điểm theo phương cho trước; giao điểm; nhóm điểm trùng vị trí; SVG/TikZ dùng cùng dữ liệu.
- `lib/learning.ts`: ẩn metadata chuẩn hóa, vẫn giữ SO_DO và các nội dung dạy học hiện có.
- `components/problem-figure.tsx`: hiển thị đường có tên, tên điểm trùng nhau, nguồn giả thiết AI.
- `app/page.tsx`: yêu cầu chuẩn hóa khi cần và giữ diễn giải theo đúng đề. Không đổi cấu trúc request/response HTTP.
- `server/policy.mjs`: chỉ nhập và nối thêm chính sách chuẩn hóa tùy yêu cầu. Nội dung SYSTEM và các chế độ sư phạm V3 vẫn nguyên vẹn.
- `tests/preserved.test.mjs`, `scripts/check-geometry-ui.mjs`: bổ sung kiểm tra phần mở rộng và các lỗi đã báo.

Tệp thêm: `lib/midpoint-language.ts`, `lib/line-language.ts`, `lib/diagram-interpretation.ts`, `server/diagram-policy.mjs`, các kiểm thử `midpoint-language.test.mjs`, `context-diagram.test.mjs`, cùng tài liệu và kết quả kiểm tra.

## Những phần giữ nguyên

Gemini transport trong `server/gemini.mjs`, model và cấu hình môi trường, các Netlify Functions, mã lớp mặc định HOCGIOITOAN, Google Forms, hồ sơ học sinh, các chế độ học, ngân hàng bài tập, SO_DO, nút kết thúc chủ động và CSS sáng/tối. File cấu hình và cơ chế bảo vệ API key không thay đổi. Bảng SHA-256 đối chiếu nằm trong `research/context-checks/source-integrity.json`.

## Chạy và triển khai

```bash
npm install
npm test
npx tsc --noEmit
npm run build
npm start
```

Dùng Node >=22.13.0 theo package.json. Tiếp tục dùng GEMINI_API_KEY, GEMINI_MODEL và ACCESS_CODE của site theo cấu hình hiện tại; không đưa khóa Gemini vào frontend. Nếu chưa đặt ACCESS_CODE riêng, mã mặc định vẫn là HOCGIOITOAN.

Triển khai toàn bộ source với cấu hình `netlify.toml`: lệnh build `npm run build`, publish `dist`, Functions `netlify/functions`. Bản này có thêm module chính sách trong `server/`, vì vậy không chỉ thay một file JavaScript trong dist hoặc tải dist theo cách bỏ mất Functions. Sau khi triển khai bản mới thành công, tải lại trang để nhận file JavaScript mới. Chưa triển khai thay đổi lên site đang chạy của giáo viên.

## Kết quả và giới hạn kiểm thử

- Ba lệnh bắt buộc và số lượng kiểm thử: `research/context-checks/verification.json` cùng các log tương ứng.
- Kiểm tra trình duyệt: cả hai ảnh lỗi, sáu bài mẫu, lỗi AK = CI trước đây, diễn giải AI mô phỏng và duy trì qua lượt tiếp theo, chuyển bài, phóng to, tải TikZ, giao diện sáng/tối, điện thoại.
- TikZ của hai ảnh lỗi và bài AK = CI biên dịch thành PDF thành công bằng pdfLaTeX với `-no-shell-escape`.
- Các kiểm thử Gemini và Google Forms dùng dữ liệu mô phỏng. Không có khóa Gemini thật để kiểm tra chất lượng chuẩn hóa trên dịch vụ thật; kiểm thử live được bỏ qua, không được tính là đã đạt. Không gửi dữ liệu học sinh thật.

ZIP có source, bản build tạo từ source, tài liệu và cấu hình mẫu; không chứa node_modules hoặc khóa API thật.
