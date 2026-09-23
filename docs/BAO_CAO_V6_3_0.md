# Báo cáo nâng cấp V6.3.0

Ngày hoàn tất: 23/9/2026. Nguồn: `TU-DUY-TOAN-HOC-V6_2_4-BAN-TRIEN-KHAI.zip`.

## Kết quả

- Bổ sung OpenAI Responses API cho hội thoại thông thường, học gợi mở có trạng thái, đọc ảnh và sinh mã hình. Bộ kiểm tra dữ kiện/hình, cách hướng dẫn từng bước và cấu hình Gemini cũ được giữ.
- Mặc định OpenAI là GPT-6 Luna để tiết kiệm. Giáo viên có thể cấu hình GPT-6 Sol để cân bằng hoặc GPT-6 Astra để ưu tiên năng lực. Học sinh không được chọn mô hình qua yêu cầu gửi từ trình duyệt.
- OpenAI API có phí riêng, không bao gồm trong ChatGPT Plus; hướng dẫn không gắn nhãn “miễn phí” cho API. Hình cục bộ thuộc các dạng đã đối chiếu được, bài mẫu và lý thuyết dùng không cần API. Đây không phải chế độ AI giải mọi bài miễn phí.
- Không xóa/khởi động lại công việc dựng hình theo trạng thái gửi tin. Hình đã hoàn thành giữ nguyên qua các lượt trả lời, xin gợi ý và kiểm tra bước làm.
- Lệnh “Vẽ lại hình” chỉ được thực hiện một lần; vẫn hiển thị hình trước trong lúc chờ và khi vẽ lại thất bại. Hình cùng đề được dùng lại khi quay về màn hình học hoặc kết nối lại.
- Kết luận của học sinh không tự động thay thế đề bài. Đề mới và thao tác thêm dữ kiện rõ ràng mới cập nhật nguồn hình.
- Lưu tối đa ba hình gần nhất trong phiên cùng tab để phục hồi; lưu trữ bị chặn/hết dung lượng không làm lỗi buổi học. Ảnh đã được xác nhận và biên dịch cũng đưa hình vào bộ nhớ này.
- Phân biệt sai mã lớp với khóa API lỗi/hết hạn mức: lỗi nhà cung cấp không tự xóa mã lớp; không tự đổi nhà cung cấp hoặc nâng mô hình đắt hơn.

## Kiểm thử đã thực hiện

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Bộ kiểm thử tự động | 516 trường hợp: 515 đạt, 0 lỗi, 1 bỏ qua (thử dịch vụ thật) | `qa-results/v6.3.0/unit-tests.log` |
| TypeScript | Đạt `npm run typecheck` | Kiểm tra tĩnh mã nguồn |
| ESLint | Đạt `npm run lint` | Không lỗi hoặc cảnh báo ESLint |
| Bản sản xuất | Đạt `npm run build` | `qa-results/v6.3.0/production-build.log` |
| Giao diện | 9 kịch bản đạt | `qa-results/v6.3.0/summary.json` |
| Dựng hình | Biên dịch TikZ/TeX thật, trả SVG hiển thị được | Ảnh chụp trong cùng thư mục QA |

Giao diện chạy bằng Playwright với Chromium 153 trong môi trường kiểm thử. Bộ tải trình duyệt đi kèm Playwright không tải được gói mặc định; dùng một binary Chromium khác cho chính bài kiểm tra, không thêm dependency vào ứng dụng. Đã xem trực tiếp ảnh chụp hộp kết nối, hình desktop và hình 390 px.

Các ca giao diện xác nhận: hình cục bộ gọi API bằng 0; một hình AI đầu tiên; hai lượt trả lời không thay SVG/không tăng số lần dựng; một lượt chủ động vẽ lại; lượt hỏi tiếp không vẽ lặp; quota lỗi không đăng xuất/không mất hình; tải lại trang dùng hình đã lưu không gọi API; giao diện 390 px sáng/tối và trang hướng dẫn không tràn ngang; không lỗi JavaScript/không lộ khóa API trong yêu cầu trình duyệt.

Các ca OpenAI kiểm tra trực tiếp router/mã adapter với phản hồi mô phỏng: gửi Bearer token phía máy chủ; chọn mô hình; schema JSON lồng nhau; lịch sử vai trò; ảnh base64; chữ ký trạng thái; xác nhận ảnh; kiểm tra tọa độ TikZ; từ chối kết quả thiếu/trống; phân biệt 429 quota/rate limit, 401 của nhà cung cấp và 401 mã lớp; lỗi mạng.

## Phạm vi chưa nghiệm thu

- Chưa gọi OpenAI hoặc Gemini bằng khóa thật; chưa đo chất lượng toán/OCR, độ trễ và chi phí thực tế trên tài khoản của thầy. Không đưa khóa thật vào gói ZIP.
- Chưa triển khai lên website Netlify đang dùng của thầy. Cần cấu hình khóa ở máy chủ và triển khai bản mới.
- Màn hình 390 px được kiểm thử trên Chromium; chưa kiểm tra Safari/iPhone hoặc Android vật lý.
- Bộ dựng cục bộ chỉ dùng khi mô hình tọa độ đã được đối chiếu. Các đề chưa hỗ trợ vẫn cần AI, hoặc giáo viên bổ sung dữ kiện. Hình và phản hồi AI cần được kiểm tra trước khi dùng làm học liệu.
- Build có cảnh báo kích thước một JavaScript chunk trên 500 kB; build vẫn thành công. Không thay cấu trúc chia bundle trong lần sửa này.

## Tệp thay đổi và tương thích

Xem `docs/THAY_DOI_TEP_V6_3_0.json` để đối chiếu SHA-256 với từng tệp trong ZIP đầu vào. Các kiểm tra bảo toàn byte của bản cũ được cập nhật đúng các tệp đã được yêu cầu thay đổi: mẫu môi trường, tuyến API, local server, hướng dẫn; chức năng xác thực và kết nối có kiểm thử hành vi riêng. Bộ kiểm thử khảo sát vẫn chạy, chỉ cập nhật tên component được mô phỏng.

`API_INTEGRITY.json` và các báo cáo V6.2.x là hồ sơ lịch sử trước lần nâng cấp này; danh sách thay đổi hiện hành là tệp V6.3.0 nêu trên.

## Tài liệu chính thức đã đối chiếu ngày 22/9/2026

- https://developers.openai.com/api/docs/models
- https://developers.openai.com/api/docs/models/gpt-6-luna
- https://developers.openai.com/api/docs/models/gpt-6-sol
- https://developers.openai.com/api/docs/models/gpt-6-astra
- https://developers.openai.com/api/docs/guides/text
- https://developers.openai.com/api/docs/guides/images-vision
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus

Các tên mô hình là lựa chọn theo danh mục OpenAI tại thời điểm đối chiếu, không phải bảo đảm quyền truy cập cho mọi tài khoản hoặc kết quả so sánh toán học của ứng dụng.
