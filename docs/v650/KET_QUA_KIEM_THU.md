# Kết quả kiểm thử V6.5.0

## Kết quả thực chạy

| Lệnh / hạng mục | Kết quả |
|---|---|
| `npm ci --ignore-scripts` | Cài thành công 274 gói theo package-lock; các bước prepare được chạy ở build/test/start |
| `npm test` | **668 kiểm thử: 667 đạt, 0 lỗi, 1 bỏ qua** |
| Nhóm `tests/v650-*.test.mjs` nằm trong bộ trên | **33 kiểm thử mới đạt**: domain, HTTP API, gateway, Apps Script, hook trình duyệt và tích hợp AI |
| `npm run typecheck` | Đạt, không có lỗi TypeScript |
| `npm run lint` | Đạt, không có lỗi ESLint |
| `npm run build` | Đạt, tạo dist bằng Vite; có prepare TikZ |
| `npm run test:ui:v650` | **8 nhóm thao tác đạt**, không có pageerror trong Chromium |
| `PORT=3199 npm run test:start` | Đạt: giao diện 200; API AI chưa khóa báo 503; feedback GET báo 405; khởi động/đóng máy chủ cục bộ được |

**Một test bỏ qua** là `live Gemini pedagogical acceptance`: cần khóa và bật kiểm thử thật chủ động. Không có khóa được cung cấp trong yêu cầu này nên không gọi dịch vụ AI thật. Các test mang tên “live regression” khác chỉ là bộ dữ liệu lỗi cũ được mô phỏng, không có nghĩa đã gọi API trực tiếp.

Môi trường thực chạy: Node.js 24.19.0 trên Linux; dự án giữ engines >=22.13 và Netlify Node 22 như bản gốc. Kiểm thử trình duyệt dùng Chromium 153, Playwright 1.62.1; giả lập kích thước máy tính 1440×1000 và điện thoại 390×844. Đây không phải kiểm thử trên iPhone thật hay Safari.

## Bản sửa lỗi trình soạn thảo Apps Script

Ảnh người dùng ngày 29/09/2026 cho thấy Google từ chối cú pháp `||=` trong Domain.gs. Kiểm thử VM trước đó chạy bằng Node mới nên chưa phát hiện giới hạn cú pháp này. Đã thay hai vị trí bằng phép gán và phép OR thông thường, sinh lại Domain.gs, thêm Acorn 8.18.0 làm phụ thuộc kiểm thử trực tiếp và phân tích toàn bộ Code.gs + Domain.gs theo cú pháp ES2020. Mã cũ tái hiện lỗi ở (68:41); mã sửa vượt qua kiểm tra. Điều này không thay thế kiểm thử trực tiếp mọi API trên Google.

Đợt sửa này đã chạy lại toàn bộ 668 test, typecheck, lint và build. Kết quả giao diện tám nhóm và test:start ở trên thuộc lần kiểm tra trước; không chạy lại vì lần sửa này chỉ đổi cú pháp trong mô-đun học tập và cổng Google. Chạy test và build nối tiếp vì cả hai chuẩn bị cùng thư mục public/tikz. Log mới: `*-appsscript-fix.txt`.

## Các tình huống mới đã kiểm tra

- Không gửi/lưu trước khi đồng ý; thiếu xác nhận phù hợp không tạo Students.
- Cookie học sinh HttpOnly; ID đơn lẻ, cookie giả hoặc mã lớp không xuất dữ liệu.
- Năm yêu cầu cùng ID chỉ có một lượt và một lần cộng tiến bộ.
- Mất xác nhận sau khi máy chủ đã ghi → pending có phiếu ký → gửi lại nhận duplicate, không cộng lại.
- Chữ ký HMAC sai, chữ ký phiếu sửa, sai mục đích, URL không thuộc cổng Google, nguồn khác và JSON quá lớn đều bị chặn.
- Tắt consent trong lúc có phiếu chờ và bật lại sau đó vẫn chặn phiếu cũ.
- Ghi event và profile cùng một batch; mô phỏng batch thất bại không để event không có profile.
- Chạy **mã Code.gs/Domain.gs thật trong VM với dịch vụ Google giả lập**, kiểm tra ScriptLock bận, ghi stringValue, khôi phục sau lỗi, chống trùng giữa hai instance script.
- Đúng có căn cứ tăng predicted; bước tiếp theo khác có căn cứ mới tăng corroborated; nhận định chưa chắc không tăng bằng chứng đúng.
- Sự kiện gửi lại muộn không ghi đè trạng thái gần đây hoặc tạo củng cố giả.
- Lỗi lặp tạo hàng đợi; bản nháp/chưa duyệt không xuất hiện trong ngữ cảnh. Giáo viên phải xác nhận trước khi duyệt.
- Duyệt tạo phiên bản, kiểm tra xung đột revision, rollback và dùng lại phiên bản trước.
- Đầu vào hướng dẫn nguy hiểm/thông tin cá nhân mẫu bị chặn tại kiểm duyệt; ngữ cảnh giới hạn 3 ví dụ.
- Khảo sát theo mã riêng tách bảng, chống trùng; xuất dữ liệu có phân trang và loại bí mật xác thực; xóa làm mã khôi phục mất hiệu lực.
- TTL loại dữ liệu cũ khỏi truy xuất ngay cả trước khi dọn; purge giữ kho mẫu khái quát đã được duyệt.
- Giới hạn phút/ngày/phiên; HTML trả HTTP 200 hoặc ACK không đúng không được báo thành công.
- Hai provider OpenAI/Gemini đi qua handler thực với schema, hồ sơ rút gọn và ghi kết quả đã kiểm tra.
- Google lỗi vẫn trả câu gợi mở; yêu cầu phá quy tắc/xin đáp án không đưa vào dữ liệu học chung.
- Hook UI không đính metadata khi tắt; pending hiển thị đúng; ngừng ghi xóa hàng chờ; phản hồi cũ sau khi tắt không ghi đè trạng thái mới.
- Hồ sơ tự khai có thể ghi nhớ mà không cần tên, trường hoặc email.

## Kiểm thử giao diện tám nhóm

1. Mặc định không tạo dữ liệu; nút đồng ý chưa chọn.
2. Kết nối AI mô phỏng và học khi bỏ trống tên, trường, email.
3. Bật ghi, nhận mã khôi phục và cookie; hộp thoại vừa màn hình 390 px, có cuộn nội dung.
4. Chat ba câu trả lời qua handler thực; ghi ba lượt và tạo hàng đợi lỗi lặp.
5. Xuất JSON bằng nút tải xuống; đánh giá gửi Surveys không yêu cầu thông tin cá nhân.
6. Ngừng ghi được máy chủ xác nhận, buổi học vẫn hoạt động.
7. Giáo viên đăng nhập, duyệt mẫu và rollback kho.
8. Xóa dữ liệu cá nhân qua giao diện; bản mẫu đã khái quát hóa vẫn giữ lịch sử phiên bản.

Log và ảnh chụp ở `docs/v650/minh-chung/`. Các mã và nội dung trong ảnh là dữ liệu kiểm thử mô phỏng, không phải học sinh thật. `DOI_CHIEU_TEP_GOC.json` ghi những tệp gốc được thay đổi; không sửa baseline cũ để giả vờ toàn bộ mã không thay đổi.

## Chưa được kiểm chứng trực tiếp

- Quyền Apps Script, Google Sheet thật, quotas của tài khoản thầy; chưa có tệp nào được ghi vào Drive của thầy.
- Deploy Netlify Production, domain, cookie trên thiết bị thật và rate limit của hạ tầng Netlify.
- Quyền mô hình/khóa AI thật; độ đúng sư phạm và toán học của phản hồi trực tiếp trên tập học sinh thật.
- Khả năng tải nhiều lớp đồng thời; tác động tới điểm số hay năng lực học sinh.

Những phần này có quy trình kiểm tra ở hướng dẫn kết nối và cần chủ tài khoản thực hiện. Không lấy kết quả mô phỏng làm số liệu hiệu quả thực nghiệm.
