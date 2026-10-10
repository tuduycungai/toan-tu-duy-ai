# Báo cáo kiểm thử V6.6.0

Ngày kiểm tra và đóng gói: 08/10/2026. Nền: ZIP V6.5.0 người dùng cung cấp. Môi trường: Node.js 24.19.0; dự án vẫn yêu cầu Node >=22.13 và cấu hình Netlify Node 22. Trình duyệt cục bộ: Chromium Headless Shell 134.0.6998.35, Playwright; khung 1440×1000 và 375×812/390×844.

## Kết quả đã thực hiện

| Kiểm tra | Kết quả | Phạm vi |
|---|---|---|
| `npm test` | **806 test: 805 đạt, 0 lỗi, 1 bỏ qua** | Toàn bộ kiểm thử cũ + 138 test mới |
| Bộ kế thừa V6.5.0 và trước | **667 đạt, 1 bỏ qua** | Không xóa test và không cập nhật hash để che hồi quy |
| Bộ V6.6.0 | **138/138 đạt** | Học liệu, kiểm tra toán, scope, handler, token, ảnh, memory, migration |
| `npm run typecheck` | Đạt | TypeScript |
| `npm run lint` | Đạt, 0 cảnh báo | ESLint |
| `npm run build` | Đạt | 5 chương, 34 mục, 100 mẫu; tạo frontend và Domain.gs đồng bộ |
| `test:ui:v660` | **8 nhóm đạt**, không lỗi JavaScript | Giao diện thật + backend thật, dịch vụ AI/Google mô phỏng |
| `test:ui:regression:v660` | **8 nhóm đạt**, không lỗi JavaScript | Luồng V6.5.0 sau khi vào Chương III; Google/AI mô phỏng |
| Rà ảnh giao diện | Đã xem | Trang chủ sáng/tối, 5 chương, bảng/biểu đồ, điện thoại |
| Phạm vi toán | **51 tình huống độc lập**, ≥10/chương; thêm 63 phép kiểm tra metadata | Phủ đủ 20 bài; chi tiết tại KIEM_THU_TOAN.md |
| Migration | Đạt kiểm thử VM | Chạy lại hai lần không đổi JSON cũ, không thêm dòng, giữ nhãn chưa phân loại |
| Tệp học liệu/bộ nhắc cũ | Khớp byte | learning.ts, worksheets.ts, adaptive-learning.ts, use-survey-reminder.ts giữ nguyên |

Một test bị bỏ qua là `tests/pedagogy-live.test.mjs`: cần bật RUN_PEDAGOGY_LIVE và khóa Gemini thật. Không có khóa thật trong đầu vào/môi trường làm việc đã dùng; không gọi AI thật, không ghi Google Sheets thật, không triển khai thay website đang hoạt động.

## 8 nhóm giao diện mới

1. 5 thẻ vào đúng không gian; danh mục đầy đủ 34 mục đúng thứ tự SGK.
2. Gửi bài mẫu qua trình duyệt ở cả 5 chương; chapterId, lessonId, problemId đúng ở handler; câu hỏi gợi mở xuất hiện.
3. Đổi chương → quay lại → nút Back → tải lại: giữ hội thoại/bản nháp và không trộn bài.
4. Rời khi đang chờ AI: hủy yêu cầu, giữ câu chưa hoàn tất, phản hồi muộn không xuất hiện ở chương khác.
5. Bảng chưa xác nhận không vẽ; sau xác nhận có cột, đoạn thẳng, quạt tròn; mốc 2020–2022–2025 có tỉ lệ khoảng cách 2:3; tải SVG thành công.
6. Chọn ảnh, nhận OCR mô phỏng, sửa bản phiên âm, xác nhận lại, bắt đầu học đại số; không gọi image-diagram.
7. Điện thoại 375 px không làm tràn trang ở cả 5 chương; bảng/biểu đồ cuộn trong vùng riêng; chuyển sáng/tối.
8. Không phát sinh pageerror của JavaScript.

## 8 nhóm hồi quy bộ nhớ/giáo viên

Không tự ghi khi chưa đồng ý; hồ sơ được để trống thông tin nhận diện; bật ghi và cookie HttpOnly; hội thoại lưu ba lượt đánh giá và tạo hàng đợi lỗi lặp; xuất dữ liệu/khảo sát; ngừng ghi; giáo viên duyệt và rollback phiên bản; xóa dữ liệu đúng mã thử. Các dữ liệu này sinh trong bộ mô phỏng, không phải dữ liệu lớp.

Script hồi quy là bản giữ nguyên các assertion của check-v650-ui, chỉ đổi điểm vào sang `?chapter=c3` theo trang chủ mới và nơi lưu minh chứng. Kiểm thử survey-component thêm mock import cho các thành phần mới; giữ nguyên các assertion khảo sát. Hash kiểm kê học liệu/hình cũ không bị sửa.

## Giới hạn còn lại

- Chưa kiểm tra quyền mô hình, hạn mức, độ trễ, OCR và phản hồi toán học của OpenAI/Gemini thật. Chưa xác nhận triển khai `/exec`, quyền Google, hạn mức Sheets hoặc Netlify Production của thầy. Làm phần D trong CAP_NHAT_TUNG_BUOC.md sau cập nhật.
- Kiểm thử trình duyệt là Chromium trên máy tính với kích thước điện thoại; chưa chạy Safari iPhone hay camera thiết bị thật.
- Bộ kiểm tra đa thức hỗ trợ cú pháp số/biến một chữ, dấu cộng trừ nhân chia đơn thức và lũy thừa nguyên có giới hạn. Không tự nhận là CAS đầy đủ. Ký hiệu LaTeX phức tạp, lời giải tự do, bài mới ngoài ngân hàng vẫn dựa vào mô hình và căn cứ gợi mở; không bảo đảm AI không bao giờ nhận định sai.
- Đối chiếu Thalès/phân giác tự động dùng các dạng dữ kiện/nhãn đoạn nhận diện được và đơn vị nhất quán. Dạng khác cần mô hình kiểm tra điều kiện; không suy quan hệ từ hình vẽ. Tổng hợp lời giải chỉ dựa trên bằng chứng học sinh đã được nhận.
- Ngăn đáp án sớm gồm quy tắc gia sư, schema, trạng thái/bằng chứng và kiểm tra chuỗi đáp án mẫu; không coi đó là bảo đảm tuyệt đối trước mọi cách diễn đạt của mô hình. Giáo viên cần quan sát giai đoạn đầu sử dụng thật.
- 100 bài mới là ngân hàng khởi đầu. Sinh bộ 5–10 câu ở C1/C2/C4/C5 chọn các bài đã biên soạn, có thể lặp giữa những lần tạo; không tuyên bố ngân hàng vô hạn hay đề tùy biến ở mọi mức khó.
- Lý thuyết của đề tự nhập dựa vào bài đang chọn; đề liên chương hoặc chưa đủ dữ kiện có thể cần người học chọn lại bài. C3 giữ engine cũ và các giới hạn dựng hình vốn có.
- Hội thoại cục bộ tối đa 12 giờ trong cùng thẻ, không đồng bộ toàn bộ hội thoại qua máy khác. Hồ sơ tiến bộ trong Sheets tách theo bài, còn các thống kê chung của giáo viên vẫn là tổng hợp toàn bộ kỹ năng.
- Hai chế độ Kiểm tra lời giải/So sánh cách giải giữ nhãn **Đang phát triển**. Chu kỳ khảo sát **13 phút** giữ đúng mã nguồn gốc.

## Minh chứng đi kèm

- `minh-chung/ui-results.json`: 8 nhóm giao diện mới và môi trường mô phỏng.
- `minh-chung-hoi-quy/ui-results.json`: 8 nhóm bộ nhớ/giáo viên.
- Ảnh PNG trong hai thư mục trên là ảnh giao diện chạy cục bộ; không phải chứng cứ API/Sheets thật.
- `ket-qua-tu-dong.txt`: log npm test của bản cuối.
- `BAN_GIAO_KIEM_KE.json`: số tệp, kiểm tra đóng gói và thống kê đổi mã.

Bản build được kiểm tra nhưng không đóng gói dist/node_modules/public/tikz; chúng được tạo lại từ npm ci và các lệnh dự án. Không kèm PDF SGK hoặc ảnh trang sách. Giấy phép/thư viện bên thứ ba giữ nguyên.
