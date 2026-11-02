# TƯ DUY TOÁN HỌC 8 — V6.7.0

Gia sư song ngữ Anh–Việt cho 5 chương Toán 8 tập 1. Bản cập nhật dựa trên V6.6.0.

**Mở [HUONG_DAN_V6_7_0.html](HUONG_DAN_V6_7_0.html) để cập nhật và dùng các tính năng mới.**

- Đề ảnh và phản hồi mới: tiếng Anh trước, Vietsub trong ngoặc ngay dưới; giữ công thức và dữ kiện khi dịch.
- Nút nghe tiếng Anh bằng giọng AI, dừng và chỉnh tốc độ. Giọng thiết bị là lựa chọn dự phòng có nhãn riêng.
- Bảng từ vựng theo đề/bài học, câu ví dụ song ngữ, nghe từng từ; 49 mục từ và kiến thức cho đủ 20 bài.
- Luyện phát âm tự chọn: đồng ý → ghi tối đa 15 giây → nghe lại → gửi AI nhận xét. Không chấm điểm âm vị giả định.
- Sao lưu theo mã người học trên 9 bảng Google Sheets hiện có: +1 cho nỗ lực có nội dung, +2 cho tiếng Anh toán học; tối đa 30/ngày giờ Việt Nam, chống lặp và gửi lại.
- Giữ quy trình gợi mở 8 giai đoạn, chống xin lời giải sớm, 5 chương/34 mục, 100 bài mới + 87 bài hình học kế thừa, khảo sát 13 phút.

## Chạy và kiểm tra

```bash
npm ci
npm start
```

Node >=22.13.0; mở http://localhost:3000. Các khóa chỉ đặt ở máy chủ / file .env riêng, không đưa lên Git hoặc ZIP.

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:ui:v670
```

Kiểm tra trình duyệt cần Chromium tương thích Playwright hoặc biến CHROMIUM_EXECUTABLE. Tài liệu kiểm thử tại [docs/v670/BAO_CAO_KIEM_THU.md](docs/v670/BAO_CAO_KIEM_THU.md). API AI, giọng nói và Sheets được mô phỏng trong kiểm thử; chưa chạy khóa thật của thầy.

## Cập nhật hệ thống đang dùng

1. Thay mã nguồn ứng dụng, giữ nguyên biến môi trường và mã lớp hiện có. Netlify: npm run build / dist / netlify/functions / Node 22. Cần triển khai cả Functions, không chỉ kéo thư mục dist tĩnh.
2. Trong Apps Script hiện có, thay **cả Code.gs và Domain.gs** bằng hai file trong google-apps-script. Chạy migrateV670 rồi triển khai phiên bản mới của Web App. Giữ URL, Spreadsheet và các khóa ký đang dùng; không tạo lại hay xóa 9 bảng.
3. Âm thanh tự dùng khóa của AI_PROVIDER hiện tại. Các biến âm thanh mới trong .env.example là tùy chọn; mô hình giọng nói cần quyền truy cập và hạn mức của tài khoản API. Nếu đổi nhà cung cấp, dùng SPEECH_PROVIDER và khóa tương ứng ở máy chủ.
4. Làm bài, nghe một từ, thử ghi âm và xác nhận sao trên hệ thống thật trước khi giao lớp sử dụng. Phần ghi âm cần HTTPS và quyền micro.

Nguồn cập nhật: [docs/v670/THIET_KE_KY_THUAT.md](docs/v670/THIET_KE_KY_THUAT.md). Hướng dẫn V6.4–V6.6 đi kèm là lịch sử; khi khác nhau, dùng hướng dẫn V6.7.0. Giữ giấy phép tại THIRD_PARTY và vendor.
