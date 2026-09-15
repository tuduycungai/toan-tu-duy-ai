# AI-TUTOR-TU-GIAC-PRO-V5

Ngày sửa: 15/09/2026. Nâng cấp trực tiếp từ ZIP `AI-TUTOR-TU-GIAC-PRO-V4_4-HOAN-THIEN.zip` do người dùng cung cấp. Không tạo ứng dụng thay thế. Bản ZIP đầu vào được giữ nguyên; dấu vân tay và khác biệt nằm trong `SOURCE_INTEGRITY.json`.

## Kết quả đã kiểm chứng

- Sửa ca hình bình hành ABCD tâm O; E, F theo thứ tự là trung điểm OD, OB. O, E, F được tính từ giao điểm/trung điểm, không đặt theo phỏng đoán. Hình có AC, BD, AE, CF và mục tiêu AE ∥ CF.
- Bổ sung mô hình hình học trung gian, kiểm tra độc lập, hệ tọa độ có ràng buộc, đường tròn cơ bản, hình tạm có công khai giả định, sửa dữ kiện và dựng lại.
- Hồ sơ năng lực bốn mức trung tính, bài chẩn đoán năm câu, minh chứng qua nhiều lượt, điều chỉnh thủ công và tải tiến trình.
- Lý thuyết được chọn theo đề/mô hình/mục tiêu, kể cả ngoài 87 bài. Không còn phụ thuộc việc dựng hình thành công mới hiện lý thuyết.
- Chặn lời giải trọn bài trên cả nhánh API V5 và nhánh tương thích cũ: văn bản tự do của nhà cung cấp không được chuyển thẳng cho học sinh. Chỉ phát một nhiệm vụ từ bộ câu hỏi đã kiểm soát; không có ngoại lệ cho giáo viên, học sinh giỏi, yêu cầu lặp lại hay mã hóa.
- Giữ năm chế độ, sáu bài mẫu, 81 bài phiếu, sơ đồ định hướng, tự kiểm tra, phản hồi, sáng/tối và cấu hình Netlify.
- Cuối trang có đúng: Người sáng tạo: HS Phan Trí Dũng; HS Phạm Nam Hải; GV hướng dẫn: Trần Ngọc Phú Sang.

Kết quả cuối: **403 kiểm thử đạt, 0 lỗi, 1 bỏ qua**; `npx tsc --noEmit`, `npm run build`, mười lượt render React/SVG và HTTP smoke đều đạt. Xem báo cáo chi tiết và log, không dùng báo cáo V4 làm minh chứng V5.

## Giới hạn phải biết trước khi sử dụng

Đây chưa phải nghiệm thu đầy đủ toàn bộ yêu cầu “mọi bài hình học THCS”. Bộ đọc hỗ trợ một tập ngữ pháp mở rộng, không phải bộ hiểu ngôn ngữ tùy ý hoặc máy chứng minh định lý tổng quát. Bài ngoài tập ngữ pháp, nhiều đường tròn/giao tuyến phức tạp, nhiều hình lồng nhau, tên điểm có chỉ số và cách diễn đạt không chuẩn có thể chỉ có hình tạm. Hình tạm có thể chỉ thể hiện phần đã xác định, không bảo đảm đồng thời những điều kiện còn ghi là chưa rõ.

Chưa chạy Gemini thật vì chưa có khóa; kiểm thử API dùng phản hồi mô phỏng. Trình duyệt Chromium trong môi trường thực hiện bị dừng với SIGSEGV, nên chưa xác nhận bấm nút tải PNG/SVG, phóng hình, bố cục điện thoại hay luồng tương tác đầu cuối. Các nút có mã xử lý thật và đã render, nhưng điều đó không thay thế thử trên trình duyệt.

Ảnh `research/v5-checks/01-parallelogram.png` được raster hóa từ SVG do chính `DiagramSVG` render. **Không phải ảnh chụp màn hình trình duyệt**. Yêu cầu ảnh chụp giao diện thực tế còn cần nghiệm thu trên máy có trình duyệt hoạt động.

Đánh giá năng lực là gợi ý hỗ trợ, không phải xếp loại chuẩn hóa. Dữ liệu lưu theo hồ sơ hiện tại trên một thiết bị, chưa có tài khoản đa học sinh/đồng bộ đa thiết bị hoặc vai trò giáo viên được xác thực. Phần lý thuyết dùng danh mục kiến thức đã biên tập và liên kết động; chưa tự sáng tác định lý mới từ AI. Bộ câu hỏi được giới hạn để không lộ lời giải nên độ tự do diễn đạt thấp hơn một chatbot hoàn toàn tự do.

## Chạy và nghiệm thu

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm start
```

Tại trang chủ chọn chế độ gợi mở, nhập đề và nhấn **Xem hình và lý thuyết** để dùng bộ dựng hình tại máy, không cần khóa Gemini. Muốn trò chuyện: sao chép `.env.example` thành `.env`, đặt `GEMINI_API_KEY` ở server, khởi động lại, kết nối bằng mã lớp và điền hồ sơ. Không đưa khóa vào biến VITE hoặc trình duyệt. Giữ nguyên quy trình triển khai Netlify trong README lịch sử; chưa triển khai lên tài khoản của người dùng.

Chạy `node scripts/verify-v5.mjs` để tạo lại báo cáo. Render PNG bổ sung dùng biến `V5_SHARP_MODULE` trỏ đến bản cài Sharp của môi trường kiểm thử; Sharp không phải phụ thuộc sản xuất. Khi có Playwright/Chromium, chạy lại UI theo checklist trong báo cáo và `scripts/check-ui.mjs`; script cũ vẫn giữ nguyên và chỉ mô phỏng AI/Forms.

## Tài liệu kèm theo

`THAY_DOI.md`: danh sách tệp; `DOC_DE_VA_DUNG_HINH.md`: pipeline và kiểm tra; `PHAN_LOAI_HOC_SINH.md`: minh chứng và ngưỡng; `GOI_MO_TU_DUY.md`: câu hỏi và nguồn nghiên cứu; `LY_THUYET_DONG.md`: truy hồi kiến thức; `BAO_CAO_KIEM_THU.md`: kết quả/giới hạn; `NHAT_KY_PROMPT_MODEL.md`: thay đổi AI.
