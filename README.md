# Tư duy Toán học — PRO V5

Nâng cấp kế thừa trực tiếp V4.4, ngày 15/09/2026. Bắt đầu với [bàn giao V5](docs/v5/BAN_GIAO_V5.md), [thay đổi](docs/v5/THAY_DOI.md) và [báo cáo kiểm thử V5](docs/v5/BAO_CAO_KIEM_THU.md). Không dùng log/ảnh V4 làm minh chứng V5.

Bổ sung mô hình đọc đề và tọa độ có kiểm tra, hình tạm minh bạch, PNG/SVG, hồ sơ năng lực tích lũy và lý thuyết động. Quy tắc không trả lời cả bài được chặn ở đầu ra trên cả API mới/cũ. Cuối trang ghi đúng tên người sáng tạo và giáo viên hướng dẫn theo yêu cầu.

Kiểm thử lõi, TypeScript, build và render SVG đã chạy; **chưa nghiệm thu trình duyệt/Gemini thật và chưa bảo đảm mọi bài THCS**. Chi tiết giới hạn trong bàn giao. Chạy `node scripts/verify-v5.mjs` để tạo lại báo cáo V5. Cách cài đặt và triển khai cũ được giữ dưới đây.

<details>
<summary>Hướng dẫn và lịch sử V4.4 được bảo toàn</summary>

## Tư duy Toán học — PRO V4.4

Gia sư hỗ trợ rèn luyện lập luận hình học tứ giác lớp 8. Mỗi tứ giác là một câu chuyện tư duy — Mỗi lời giải là một hành trình khám phá.

Bản này bổ sung dựng hình có kiểm tra ràng buộc, tỉ lệ như `2AM=AB`, công thức toán trên điện thoại, 81 bài từ phiếu bài tập (93 hình), lý thuyết dưới hình và câu hỏi theo năm mức học sinh. Gia sư chỉ hỏi gợi mở, không cung cấp đáp án hoặc lời giải hoàn chỉnh dù học sinh yêu cầu. Đọc **PHAT_HANH_V4_4.md** để xem phạm vi, minh chứng và giới hạn kiểm tra của bản hiện tại.

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
3. Đặt GEMINI_API_KEY trong biến môi trường dành cho Functions. Giữ GEMINI_MODEL theo cấu hình đang dùng (mặc định gemini-2.5-flash). ACCESS_CODE=HOCGIOITOAN là mã lớp mới. Nếu Netlify hoặc .env đang có ACCESS_CODE cũ, hãy thay giá trị thành HOCGIOITOAN và deploy/khởi động lại. ACCESS_CODE là mã lớp riêng, không phải khóa Gemini; nếu thay, dùng tối thiểu 10 ký tự.
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
- 6 bài mẫu gốc và 81 bài đã biên tập từ phiếu PDF. Lời giải đối chiếu của 6 bài gốc chỉ là tư liệu kiểm tra; gia sư không chép cho học sinh.
- 93 hình của phiếu có kiểm tra điều kiện bằng tính toán; SVG và TikZ dùng chung tọa độ. Ngân hàng xem được trước khi kết nối. Với đề nhập ngoài ngân hàng, bộ đọc chỉ dựng khi xác định được các điều kiện hỗ trợ; không tự thêm giả thiết để ép vẽ.
- Hồ sơ có năm mức học sinh, dùng để chọn điểm bắt đầu. Gia sư tăng/giảm hỗ trợ theo cách em nêu đối tượng, quan hệ và căn cứ; không tự gán nhãn năng lực cố định.
- Lý thuyết dưới hình trình bày kiến thức và điều kiện áp dụng, để học sinh tự chọn bước giải.
- Sơ đồ công khai: giả thiết + mục tiêu → kiến thức kết nối → bước tiếp theo. Đây là định hướng sư phạm, không phải suy nghĩ nội bộ của mô hình.
- Chính sách giới hạn chủ đề tứ giác và kiến thức phụ trợ; độ tuân thủ thực tế vẫn cần kiểm tra với Gemini.
- Giao diện sáng/tối, điện thoại, hiệu ứng gõ, dừng phản hồi, hỗ trợ giảm chuyển động.

```bash
npm test
npx tsc --noEmit
npm run build
```

Chạy `node scripts/verify-release.mjs` để ghi lại kết quả ba lệnh trên và danh sách từng kiểm thử vào `research/release-checks`. Kiểm thử API dùng phản hồi mô phỏng. `node scripts/audit-worksheets.mjs --compile` kiểm tra biên dịch 93 hình, cần cài TeX Live hoặc MiKTeX có TikZ; website không cần cài LaTeX. `node scripts/build-qa.mjs` tạo trang xem thử ngoại tuyến `qa/output/preview.html` và `mobile.html` cho kiểm tra thủ công trên trình duyệt.

Kiểm tra trình duyệt tùy chọn: scripts/check-ui.mjs cần Playwright và Chromium có sẵn; không thêm chúng vào dependencies ứng dụng. Script dùng phản hồi giả lập và chặn gửi Google Forms thật.

## Tài liệu

- PHAT_HANH_V4_4.md: thay đổi và giới hạn của bản phát hành hiện tại.
- research/provenance: ghi nhận đoạn mã do AI tạo/sửa, nhật ký câu lệnh, bản đối chiếu theo dòng và nguồn nghiên cứu. Sổ tay Word đi kèm trình bày các minh chứng này.
- research/release-checks: log thật, danh sách kiểm thử và dấu vân tay mã nguồn của V4.4.
- research/AP_DUNG_NGHIEN_CUU_2019.md: cách vận dụng bài nghiên cứu, phân hóa câu hỏi và ba hội thoại minh họa.
- research/worksheet-checks/DANH_MUC_81_BAI.md: toàn bộ đề đã biên tập, trang nguồn và ghi chú sửa đề.
- Các báo cáo V2/V3/V4.2/V4.3 và thư mục kiểm tra cũ là lịch sử của những bản trước; không phải kết quả nghiệm thu V4.4.
- API_INTEGRITY.json: SHA-256 đối chiếu các tệp cần bảo toàn.
- research/CO_SO_SU_PHAM.md và public/co-so-su-pham.html: cơ sở sư phạm và nguồn trong/ngoài nước.
- research/BAI_MAU_VA_DAP_AN.md: bài mẫu và lời giải tham chiếu.
- research/KICH_BAN_KIEM_THU_SU_PHAM.md: nghiệm thu với Gemini thật.
- research/screenshots: ảnh kiểm thử giao diện bằng dữ liệu giả lập.
- research/legacy-v1 chứa hướng dẫn cũ, được thay thế bởi README này. ZIP gốc được giữ riêng, không chèn bản sao mã nguồn cũ vào bản phát hành.

Chưa có khóa Gemini thật để nghiệm thu đầu cuối. Kiểm thử API dùng phản hồi mô phỏng; không gửi dữ liệu thử vào biểu mẫu thật. Phần mềm áp dụng tài liệu vào thiết kế và prompt, không huấn luyện lại Gemini và chưa có nghiên cứu thực nghiệm chứng minh hiệu quả của bản phát hành.

</details>
