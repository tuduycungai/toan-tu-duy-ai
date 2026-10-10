# TƯ DUY TOÁN HỌC 8 — V6.6.0

Học chủ động cùng AI – Mỗi bài toán là một hành trình khám phá.

Nâng cấp V6.5.0 thành 5 chương Toán 8 tập 1 Kết nối tri thức: 20 bài, 14 mục luyện tập/ôn tập, 100 bài mẫu mới và 87 bài Tứ giác kế thừa.

**Bắt đầu bằng [HUONG_DAN_V6_6_0.html](HUONG_DAN_V6_6_0.html)** hoặc [cập nhật từng bước](docs/v660/CAP_NHAT_TUNG_BUOC.md). Nếu đã có Google Sheets, cập nhật cả Code.gs và Domain.gs, chạy migrateV660 rồi triển khai phiên bản Apps Script mới. Không tạo bảng mới và không xóa dữ liệu cũ.

- [Đối chiếu chức năng cũ–mới](docs/v660/DOI_CHIEU_CHUC_NANG.md)
- [Phủ 5 chương, 20 bài](docs/v660/PHU_CHUONG_TRINH.md)
- [Báo cáo kiểm thử và giới hạn](docs/v660/BAO_CAO_KIEM_THU.md)
- [Migration dữ liệu](docs/v660/MIGRATION_V660.md)
- [Phân loại 87 bài cũ](docs/v660/PHAN_LOAI_87_BAI_CU.md)

```bash
npm ci
npm start
```

Node >=22.13.0. Mở http://localhost:3000. Điền khóa thật vào biến máy chủ hoặc .env riêng nếu cần AI; không đưa .env lên Git/ZIP. Trên Netlify giữ npm run build / dist / netlify/functions / Node 22. Không cần biến môi trường mới.

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:ui:v660
npm run test:ui:regression:v660
```

Hai lệnh trình duyệt cần Chromium của Playwright (`npx playwright install chromium`) hoặc `CHROMIUM_EXECUTABLE` trỏ tới Chromium tương thích. Phản hồi AI/Google trong các kiểm thử này được mô phỏng. Chưa xác nhận OpenAI/Gemini hoặc Sheets thật trên hệ thống của thầy.

Nguồn học liệu: server/curriculum-content.json; bản frontend được tạo bằng scripts/build-curriculum.mjs và không chứa đáp án/rubric/gợi ý nội bộ. Domain.gs được tạo bằng npm run build:gateway. Giữ nguyên giấy phép tại THIRD_PARTY và vendor.

Tài liệu V6.4/V6.5 đi kèm để tham khảo lịch sử; khi khác hướng dẫn, dùng docs/v660. Chu kỳ khảo sát giữ 13 phút theo mã nguồn gốc.
