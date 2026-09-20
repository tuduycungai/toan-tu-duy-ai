# Cập nhật hồ sơ, khảo sát và chế độ học

Bản nền: `Sản phẩm dự án KHKT 2627.rar`, gói kỹ thuật 6.2.0. Bản bàn giao: 6.2.1. Không hiển thị số phiên bản tại chân trang.

## Nội dung đã cập nhật

| Yêu cầu | Kết quả |
| --- | --- |
| Poster khoa học online | Mở đúng `https://app.netlify.com/projects/poster-online-khkt/overview` ở tab mới; bỏ chữ “Phiên bản 6.2”. |
| Trường | Nhãn “Trường đang học (nơi công tác)”. |
| Lớp | Nhãn “Lớp đang học (Nếu bạn là GV thì để trống)”; không bắt buộc nhập. |
| Nhận diện giáo viên | Lớp trống hoặc chỉ có khoảng trắng → “Giáo viên”. Có lớp → “Lớp: …” theo đúng thông tin nhập. |
| Nút khảo sát | “Khảo sát đánh giá ứng dụng”; mở khảo sát, không ngắt hoặc kết thúc hội thoại. |
| Lịch nhắc | Mỗi 180 giây sau khi kết nối AI và có hồ sơ. |
| Kiểm tra lời giải | Có nhãn “(Đang phát triển)”; kiểm tra từng bước học sinh đã viết và tập trung vào lỗi đầu tiên. |
| So sánh cách giải | Có nhãn “(Đang phát triển)”; đối chiếu hai ý tưởng học sinh đưa ra theo một tiêu chí mỗi lượt. |

Liên kết poster được giữ đúng theo yêu cầu, nhưng đó là trang quản trị Netlify và có thể yêu cầu đăng nhập. Chưa xác minh được địa chỉ công khai của poster; không tự thay bằng một địa chỉ suy đoán.

## Cách nhắc và gửi khảo sát

- Đồng hồ chạy trên trang hiện tại sau khi kết nối và có hồ sơ. Tải lại trang phải kết nối lại, như cơ chế mã lớp hiện có.
- Nếu đang mở khảo sát, không mở thêm hộp thoại. Đóng khảo sát không làm nó mở lại ngay vì một lời nhắc đã quá hạn.
- Nếu đang hỏi AI, gửi khảo sát, mở hồ sơ/cài đặt/hướng dẫn/menu, hoặc tab bị ẩn, một lời nhắc được chờ và gộp lại đến khi trang sẵn sàng. Trình duyệt điện thoại có thể trì hoãn đồng hồ ở nền.
- Bản nháp sao đánh giá, nhận xét và trạng thái đồng ý được giữ khi đóng khảo sát chưa gửi. Câu hỏi đang soạn và hội thoại không bị xóa khi mở hoặc gửi khảo sát.
- Sau lần gửi đã được Google Forms xác nhận, lần nhắc tiếp theo mở một khảo sát mới: mã gửi mới, chưa chọn sao và chưa đồng ý. Không tự gửi lại nhận xét cũ.
- Nếu chưa xác nhận được lần gửi, giữ nguyên mã, nội dung và liên kết Forms đã điền sẵn. Đồng hồ không gửi lại. Người dùng tự kiểm tra trước khi gửi qua Forms để tránh trùng dữ liệu.
- Quy trình đồng ý gửi thông tin vẫn bắt buộc. Đồng hồ chỉ mở giao diện, không phát sinh lệnh gửi Google Forms.

Biểu mẫu hiện có năm trường. Vai trò/lớp được thêm vào **trường nhận xét** (`entry.326585189`), nên không đổi cấu trúc API hoặc các mã trường. Vai trò vẫn được gửi khi bỏ chọn tóm tắt học tập. Ví dụ giáo viên:

```text
[Người tham gia]
Giáo viên
```

Với học sinh nhập `8A1`:

```text
[Người tham gia]
Lớp: 8A1
```

## Hướng dẫn riêng cho hai chế độ

**Kiểm tra lời giải:** Nếu chưa có bài làm, hỏi em gửi một bước cần kiểm tra. Phân biệt kết quả sai với kết quả có thể đúng nhưng thiếu căn cứ; chỉ ra vướng mắc đầu tiên và hỏi để em tự sửa. Khi bước đã hợp lệ, giảm hỗ trợ và chuyển sang mắt xích kế tiếp. Không viết lại cả lời giải hoặc chấm điểm khi chưa đủ bằng chứng.

**So sánh cách giải:** Xác định đúng hai hướng học sinh muốn đối chiếu. Nếu mới có một hướng, hỏi thêm ý tưởng thay vì tự đưa một lời giải thứ hai. Kiểm tra tính hợp lệ trước khi so sánh độ ngắn; mỗi lượt chỉ xét một tiêu chí như điều kiện áp dụng, khả năng tận dụng giả thiết hoặc nhu cầu dựng thêm. Học sinh tự chọn hướng và nêu lí do.

Cả hai giữ sơ đồ `[SO_DO]`, thao tác tư duy phù hợp, một câu hỏi gợi mở chính và quy tắc không cung cấp đáp án hoàn chỉnh. Hướng dẫn tiếp tục điều chỉnh theo hồ sơ và mức hỗ trợ hiện tại. Nhãn trạng thái nằm ở danh mục chế độ và tiêu đề vùng hội thoại; mô tả và ô nhập cũng được điều chỉnh theo từng chế độ.

Đây là cải tiến chỉ dẫn sư phạm. Các kiểm thử kiểm tra cấu trúc, đường truyền chỉ dẫn và ví dụ được biên soạn; chưa phải kết quả đánh giá chất lượng phản hồi của Gemini thực tế.

## Kiểm thử thực tế của đợt cập nhật

| Lệnh | Kết quả |
| --- | --- |
| npm ci --no-audit --no-fund | Cài đặt thành công, giữ nguyên các phiên bản phụ thuộc đã khóa. |
| npm test | 430 kiểm thử: 429 đạt, 0 lỗi, 1 bỏ qua. |
| npx tsc --noEmit | Mã thoát 0. |
| npm run build | Mã thoát 0; tạo lại dist từ mã nguồn. |
| npm start | Khởi động máy chủ thành công; dừng tiến trình kiểm tra sau khi sẵn sàng. |

Có 23 kiểm thử bổ sung về hồ sơ/Forms, lịch 180 giây, giữ bản nháp, tiếp tục hội thoại, chống gửi lại, hai chế độ và chỉ dẫn riêng. 19 tệp lõi được đối chiếu SHA-256 với bản nền, gồm Gemini, xác thực mã lớp, backend đánh giá, TikZ, cá nhân hóa và cấu hình Netlify. Kiểm tra bổ sung xác nhận prompt chế độ “Gợi mở từng bước” và toàn bộ nội dung bài mẫu giữ nguyên; `server/policy.mjs` chỉ nối thêm chỉ dẫn cho review/compare, `lib/learning.ts` chỉ đổi thông tin hiển thị của hai chế độ.

Lần chạy đầu phát hiện kiểm thử thành phần dựng hình cũ chưa mô phỏng `matchMedia` của trình duyệt. Đã thêm mô phỏng desktop vào bài kiểm thử, không sửa bộ dựng hình. Kiểm tra toàn vẹn từ V2 cũng được cập nhật để cho phép thay nhãn và hành vi khảo sát trong script UI theo đúng yêu cầu. Nhật ký lần đầu và lần chạy cuối được lưu riêng.

### Giới hạn kiểm chứng

- Kiểm thử Gemini thực tế được bỏ qua vì không có khóa API và chưa bật `RUN_PEDAGOGY_LIVE`. Không khẳng định đã kiểm chứng phản hồi Gemini thật trong lần cập nhật này.
- Không gửi đánh giá giả vào Google Forms. Các kiểm thử gửi dùng phản hồi mô phỏng và kiểm tra body/mã trường.
- Các kiểm thử React chạy trong Node, không thay thế việc kiểm tra giao diện trên Safari/iPhone thật. Trình duyệt của môi trường làm việc đã chặn truy cập bản chạy cục bộ; không thử đường vòng. Các script Playwright đã cập nhật nhãn, nhưng không được tính là kiểm thử đã chạy trong báo cáo này.
- Build có cảnh báo kích thước gói JavaScript trên 500 kB; đó là cảnh báo, không phải lỗi build. Không thay đổi bộ dựng TikZ hoặc thư viện để xử lý ngoài phạm vi yêu cầu.
- Các báo cáo V4/V5/V6 đã có trong bản nền là tài liệu lịch sử. Kết quả của lần này nằm tại `research/v621-checks/`.

## Chạy và triển khai

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm start
```

Để gọi AI thật, sao chép `.env.example` thành `.env` trên máy chủ và điền khóa hợp lệ. Không đưa `.env` vào kho mã hoặc ZIP. Giữ nguyên các biến môi trường hiện có trên Netlify.

Triển khai toàn bộ dự án qua kết nối Git của Netlify với `netlify.toml` hiện có. Cần cả Netlify Functions; không chỉ tải riêng thư mục dist bằng Netlify Drop. Bản bàn giao chưa được đưa lên website đang hoạt động.

## Tệp thay đổi

- `README.md` (chỉnh sửa).
- `app/enhancements.css` (chỉnh sửa).
- `app/page.tsx` (chỉnh sửa).
- `lib/learning.ts` (chỉnh sửa).
- `lib/survey.ts` (thêm mới).
- `lib/use-survey-reminder.ts` (thêm mới).
- `package-lock.json` (chỉnh sửa).
- `package.json` (chỉnh sửa).
- `scripts/check-ui.mjs` (chỉnh sửa).
- `scripts/check-v5-ui.mjs` (chỉnh sửa).
- `scripts/check-v6-ui.mjs` (chỉnh sửa).
- `scripts/check-v62-mobile.mjs` (chỉnh sửa).
- `server/policy.mjs` (chỉnh sửa).
- `server/review-compare-policy.mjs` (thêm mới).
- `tests/preserved.test.mjs` (chỉnh sửa).
- `tests/review-compare.test.mjs` (thêm mới).
- `tests/survey-component.test.mjs` (thêm mới).
- `tests/survey-preserved.test.mjs` (thêm mới).
- `tests/survey-reminder.test.mjs` (thêm mới).
- `tests/survey.test.mjs` (thêm mới).
- `tests/v61-component.test.mjs` (chỉnh sửa).
- `tests/v62-mode-baseline.json` (thêm mới).
- `tests/v62-protected.json` (thêm mới).

Ngoài danh sách trên, `dist/` được build lại tự động; tài liệu này, minh chứng, nhật ký, bảng thống kê và diff được tạo để bàn giao. Không có `node_modules`, `.env` thật hoặc khóa Gemini thật trong gói ZIP.

Xem `MINH_CHUNG_CAP_NHAT_KHAO_SAT.md` và `research/v621-checks/source-changes.diff` để truy vết phần thay đổi.
