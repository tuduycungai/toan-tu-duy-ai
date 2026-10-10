# Đối chiếu V6.5.0 → V6.6.0

Đã đọc mã thực tế trong ZIP, đối chiếu bằng các bộ kiểm thử kế thừa và kiểm thử bổ sung. Không coi tên tính năng trong tài liệu là bằng chứng đã hoạt động.

| Thành phần | Mã V6.5.0 | V6.6.0 và căn cứ |
|---|---|---|
| Nền tảng/triển khai | React 19, TypeScript, Vite 8, Netlify Functions | Giữ nguyên; build/typecheck/lint đạt |
| Trang đầu | Không gian Tứ giác | Trang chung 5 thẻ; Chương III mở trực tiếp không gian kế thừa |
| Branding | Tư duy Toán học, trọng tâm Tứ giác | TƯ DUY TOÁN HỌC 8; tiêu đề, header, metadata, trang chào, footer đồng bộ |
| Chế độ hiện trong app/page.tsx | Gợi mở từng bước; Luyện tập mỗi ngày; Tự kiểm tra; Kiểm tra lời giải và So sánh cách giải đang phát triển | Giữ đủ 5, giữ nhãn đang phát triển. “Hỏi nhanh/Gia sư cá nhân” trong lib/tutor.ts là danh sách phụ, không tạo thêm chế độ giả |
| API, mã lớp | Hai bộ điều hợp OpenAI/Gemini, khóa và mô hình qua máy chủ | Giữ; thêm kiểm tra chương/bài ở cả hai đường; không đổi nhà cung cấp/mô hình |
| Hồ sơ người học | Hồ sơ, mức học, chẩn đoán Tứ giác | Giữ; hồ sơ hỗ trợ cục bộ tách bài; chẩn đoán hình học chỉ hiện Chương III |
| Gia sư | 8 giai đoạn, trạng thái ký, bằng chứng trích từ học sinh | Giữ và điều chỉnh nhãn đại số/thống kê; ràng buộc chương/bài/đề trong chữ ký |
| Xin đáp án | Chặn nhảy đến tổng hợp | Giữ; thêm kiểm tra đáp án ngân hàng mới và phép tính có thể đối chiếu |
| Ngân hàng cũ | 6 bài mẫu + 81 bài từ phiếu | Giữ nguyên hai tệp học liệu cũ; bổ sung bảng phân loại 87 bài, tự chọn bài học tương ứng khi mở |
| Ngân hàng mới | Chưa có | 100 bài tự biên soạn, 5/bài; đáp án/rubric/gợi ý riêng ở server, loại khỏi JSON frontend |
| Luyện tập/sinh đề | 5–10 câu, chủ đề và mức độ | C3 giữ đường cũ; chương mới lấy bộ bài đã biên soạn, 5–10 câu, có thể bổ sung bài khác cùng chương khi đủ số lượng |
| Đề văn bản/ảnh | Chọn, chụp, kéo thả, tối ưu ảnh, sửa/xác nhận | Giữ; ảnh có nhãn chương/bài, đại số/thống kê dùng xác nhận văn bản, không gọi dựng hình bắt buộc |
| Dựng và xuất hình | Cục bộ, scene SVG, TikZ, kiểm tra ngữ nghĩa | Giữ ở C3/C4; không coi hình là bằng chứng; không dùng ảnh tạo sinh |
| Lý thuyết | Theo hình/bài Tứ giác | Giữ C3, thêm kiến thức mỗi bài; C4 dưới hình, C1/C2 cạnh đề, C5 cùng bảng/biểu đồ |
| Biểu đồ | Chưa có phòng dữ liệu | Bảng + cột/cột kép/đoạn thẳng/quạt; tổng %, số âm, mốc ngang, xuất SVG |
| Phiên/hội thoại | sessionStorage, thời hạn 12 giờ | Giữ và tách chương:bài; Back/reload; hủy yêu cầu khi rời; không nhận phản hồi vào bài khác |
| Bộ nhớ Google | Đồng ý, mã khôi phục, cookie, hàng chờ, chống trùng | Giữ; thêm chapterId/lessonId/skillId/problemId/sessionId; hồ sơ theo bài riêng |
| Giáo viên | Hàng đợi, sửa/duyệt, phiên bản, rollback | Giữ; thêm tên kỹ năng đa chương; không tự duyệt nội dung AI |
| Dữ liệu cũ | 9 bảng, Turns 19 cột | Vẫn 9 bảng; Turns 22 cột; migration không sửa JSON cũ, thiếu căn cứ để `unclassified` |
| Khảo sát | Biểu mẫu, gửi theo mã hoặc luồng cũ, nhắc 13 phút | Giữ chu kỳ **13 phút** và toàn bộ luồng gửi/nhắc |
| Sáng/tối/điện thoại | Có | Giữ; kiểm thử Chromium ở 1440 px và 375/390 px |
| Bằng chứng dịch vụ thật | Không có khóa trong ZIP đầu vào | Không tuyên bố đã dùng AI thật/Google Sheets thật trong lần bàn giao này |

Nguồn thay đổi chính: `components/curriculum-shell.tsx`, `components/curriculum-content.tsx`, `components/statistics-lab.tsx`, `lib/curriculum*`, `server/curriculum*`, `server/feature-api.mjs`, `server/adaptive-tutor.mjs`, `server/learning/*`, `google-apps-script/*`, `app/page.tsx`.

Bộ nhớ là lưu hồ sơ và truy xuất gợi mở đã duyệt; không huấn luyện lại trọng số mô hình. Các nhận định đúng/sai vẫn cần giáo viên kiểm tra khi dùng để đánh giá học sinh.
