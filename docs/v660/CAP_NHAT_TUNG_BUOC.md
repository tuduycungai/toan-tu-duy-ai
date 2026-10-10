# TƯ DUY TOÁN HỌC 8 — cập nhật V6.6.0

Bản nâng cấp trực tiếp từ ZIP V6.5.0 được cung cấp: 5 chương, 20 bài, 14 mục luyện tập/ôn tập và 100 bài tự biên soạn mới. Giữ 87 bài Tứ giác cũ, Vite/React, Netlify Functions và các bộ điều hợp OpenAI/Gemini.

**Nếu website V6.5.0 đang chạy và đã có 9 bảng Google Sheets:** làm phần A → B → C → D. Không tạo bảng tính mới, không xóa dữ liệu và không tạo lại các khóa đã dùng.

## A. Sao lưu trước khi cập nhật

1. Giữ lại ZIP hoặc bản mã nguồn V6.5.0 đang triển khai.
2. Trong Google Sheets hiện có, chọn Tệp → Tạo bản sao. Đặt tên có ngày sao lưu. Giữ bản sao riêng; ứng dụng vẫn dùng bảng tính gốc.
3. Chọn thời điểm lớp không đang ghi dữ liệu. Không sửa hay sắp xếp trực tiếp các hàng trong 9 tab hệ thống khi ứng dụng đang ghi.
4. Giải nén ZIP V6.6.0. Mở thư mục **TU-DUY-TOAN-HOC-V6_6_0**. Đây là thư mục chứa `package.json`, `netlify.toml`, `app`, `server` và `google-apps-script`.

## B. Cập nhật Apps Script đang dùng

Cần cập nhật vì máy chủ gửi thêm chương, bài và kỹ năng; cổng cũ chưa hiểu các kỹ năng mới.

1. Mở **bảng tính gốc** → Tiện ích mở rộng / Extensions → Apps Script.
2. Mở tệp `Code.gs` trong dự án Apps Script hiện tại.
3. Mở `google-apps-script/Code.gs` trong ZIP bằng trình soạn thảo văn bản. Sao chép **nội dung tệp**, thay toàn bộ nội dung của `Code.gs` trên Google.
4. Mở tệp `Domain.gs` trên Google; thay nội dung bằng `google-apps-script/Domain.gs` trong ZIP. Không gộp hai tệp vào một tệp.
5. Bấm Lưu. Bản sinh `Domain.gs` đã được kiểm tra cú pháp ES2020, tránh lỗi `Unexpected token =` đã gặp ở bản cũ.
6. Giữ nguyên `SPREADSHEET_ID` và `GATEWAY_SECRET` trong Project Settings → Script Properties. Giữ Google Sheets API v4 và trigger `purgeExpired` hằng ngày đang có. Manifest không đổi so với V6.5.0.
7. Ở ô chọn hàm cạnh nút Run, chọn **`migrateV660`** rồi bấm **Run**. Nếu Google yêu cầu cấp quyền, kiểm tra đúng dự án của thầy rồi tiếp tục theo tài khoản được phép quản lý bảng tính.
8. Mở tab **Turns** trong bảng tính gốc. Ba cột mới là **T: chapterId**, **U: lessonId**, **V: skillId**. Cột A–S và JSON trong cột F được giữ nguyên. Dữ liệu cũ thiếu nhãn hiển thị `unclassified`.
9. Có thể chạy `migrateV660` lần nữa: không thêm dòng, không tạo trùng, không xóa dữ liệu. Nếu báo thứ tự cột không chuẩn, dừng và đối chiếu với bản sao; không xóa hàng hay tự dịch cột để ép chạy.
10. Chọn **Deploy → Manage deployments → biểu tượng bút chì → Version: New version → Deploy** cho deployment đang dùng. Chỉ bấm Lưu mã chưa cập nhật `/exec`.
11. Nếu sửa đúng deployment hiện tại, URL `/exec` giữ nguyên. Giữ `LEARNING_GATEWAY_URL` trên Netlify. Chỉ sửa biến đó nếu thầy thực sự tạo deployment khác có URL mới.

Nếu chưa từng bật Google Sheets: làm hướng dẫn `docs/v650/HUONG_DAN_GOOGLE_SHEETS.md` với **hai tệp Apps Script của V6.6.0**. Chạy `setup` cho bảng mới; `setup` tạo đủ 22 cột Turns. Không chạy `setup` để thay cho migration bảng cũ. Khi chưa cấu hình bộ nhớ, học sinh vẫn học được và ứng dụng báo chưa ghi dữ liệu.

## C. Thay mã nguồn và build lại Netlify

1. Mở kho mã nguồn đang nối với Netlify trên máy tính. Sao lưu những chỉnh sửa riêng chưa có trong ZIP.
2. Chép nội dung thư mục `TU-DUY-TOAN-HOC-V6_6_0` vào **thư mục gốc kho hiện tại**, nơi đang có `package.json`. Không chép lồng thêm một tầng thư mục. Không xóa thư mục `.git` của kho.
3. Giữ nguyên biến môi trường trên Netlify: nhà cung cấp AI, khóa API, mô hình, mã lớp, khóa ký, URL và các khóa bộ nhớ. V6.6.0 không yêu cầu biến mới. `.env.example` chỉ là mẫu, không chứa khóa thật.
4. Nếu dùng GitHub Desktop: mở Changes, xem danh sách đổi mới, nhập tiêu đề `Nang cap Toan 8 tap 1 V6.6.0`, bấm Commit rồi Push origin. Cách này không bị giới hạn số tệp của thao tác upload từng tệp trên website GitHub.
5. Netlify tiếp tục dùng **Build command: `npm run build`**, **Publish: `dist`**, **Functions: `netlify/functions`**, **Node: 22** theo `netlify.toml`.
6. Chờ deploy xong. Phải có các Functions `chat`, `learning`, `teacher`, `feedback`. Không chỉ kéo `dist` vào Netlify Drop: giao diện tĩnh không thay cho các Functions.
7. Mở lại website. Lượt truy cập mới phải vào trang có **5 thẻ chương** và tên **TƯ DUY TOÁN HỌC 8**.

## D. Kiểm tra sau triển khai bằng tài khoản thật

Các bước dưới đây thầy thực hiện trên hệ thống của mình; gói bàn giao chưa kiểm tra dịch vụ thật.

1. Bấm Chương I → chọn Bài 1 → Kết nối AI → nhập mã lớp đang cấu hình. Tên/trường/email có thể để trống; chọn lớp và mức học phù hợp.
2. Chọn một bài mẫu và bấm Gửi. AI phải hỏi một bước, chưa cung cấp toàn bộ lời giải. Trả lời câu hỏi bằng một bước có căn cứ.
3. Mở Bộ nhớ học tập. Nếu thầy đang dùng mã thử, bật ghi nhớ sau khi đọc và đồng ý thông báo; cất mã khôi phục riêng.
4. Gửi một đề mới, đợi câu hỏi rồi trả lời. **Đề mở đầu không được tính là câu trả lời đã hiểu.** Chỉ coi đã lưu khi giao diện báo Google Sheets xác nhận.
5. Kiểm tra dòng mới trong Turns: `chapterId=c1`, `lessonId=l01`, `skillId=c1:reading` ở giai đoạn đọc hiểu, hoặc `c1:monomial` khi đánh giá kỹ năng bài. JSON cột F chứa đầy đủ `problemId` và `sessionId`.
6. Về trang chủ → Chương V → Bài 19. Xác nhận một bảng dữ liệu rồi thử cột, đoạn thẳng và quạt tròn. Biểu đồ dùng số đã xác nhận; dữ liệu phần trăm sai tổng sẽ bị từ chối.
7. Quay lại Chương I; hội thoại và bản nháp vẫn ở đúng bài. Tải lại trang để kiểm tra phục hồi. Sau tải lại phải nhập lại mã lớp vì mã chỉ giữ trong bộ nhớ của trang.
8. Mở Chương III: kiểm tra 6 bài mẫu cũ, 81 bài trong phiếu, xem hình/xuất hình, nhập ảnh và khảo sát. Chu kỳ khảo sát giữ **13 phút** theo mã nguồn gốc.
9. Mở `?teacher=1` hoặc đường dẫn Khu vực giáo viên. Kiểm tra đăng nhập bằng khóa quản trị, xem trường hợp theo kỹ năng và duyệt một mẫu đã tự kiểm tra toán học.
10. Với mã thử, xuất dữ liệu để đối chiếu; dùng nút xóa dữ liệu của mã thử khi không còn cần. Không xóa dữ liệu học sinh đang sử dụng.

## E. Cách học và khôi phục phiên

- Đường dẫn trực tiếp: `/?chapter=c1&lesson=l01`, `/?chapter=c3&lesson=l12`, `/?chapter=c5&lesson=l19`.
- Mỗi cặp chương/bài có hội thoại, ảnh đã đọc, bản nháp, hồ sơ hỗ trợ và mã phiên riêng. Đổi chương bằng Về trang chủ; không mở Bài mới nếu muốn giữ nội dung hiện tại.
- Phiên cục bộ giữ trong cùng thẻ trình duyệt, tối đa 12 giờ; đây không phải đồng bộ hội thoại đầy đủ qua thiết bị. Bộ nhớ Google giữ hồ sơ tiến bộ theo cơ chế đã có.
- Trang chủ có Tiếp tục học khi tìm thấy phiên hợp lệ. Phiên trước khi nâng cấp cần người học chọn chương; bản cũ được giữ, trạng thái suy luận được khởi động lại để tránh nhầm chương.
- Đề ảnh: chọn/chụp ảnh → đọc → sửa văn bản nếu cần → xác nhận. Đổi văn bản cần xác nhận lại. Đại số/thống kê không ép dựng hình; hình học tiếp tục cần hình đã kiểm tra.
- Lý thuyết ngoài ngân hàng dựa vào bài đang chọn: đối chiếu điều kiện với đề. Gợi ý chuyển chương là đề xuất; người học quyết định mở chương mới.

## F. Nếu cần quay về bản trước

1. Trên Netlify, redeploy bản mã V6.5.0 đã lưu.
2. Nếu cần đồng bộ cổng cũ, triển khai lại phiên bản Apps Script trước trong **cùng** dự án/deployment.
3. Giữ nguyên bảng tính. Ba cột thêm ở cuối không làm thay đổi vị trí A–S; không xóa dữ liệu để rollback.
4. Dữ liệu mới có kỹ năng V6.6.0 vẫn còn trong JSON. Giao diện cũ có thể chưa hiển thị tên kỹ năng mới; dùng lại V6.6.0 để xem đúng.
