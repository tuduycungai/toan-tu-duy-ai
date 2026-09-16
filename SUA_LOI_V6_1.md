# Sửa luồng dựng hình V6.1

Đã truy cập trực tiếp https://tuduyhinhtoan8.netlify.app/, kết nối qua mã lớp bằng ô xác thực bảo mật và thử Gemini thật. Dùng hồ sơ thử nghiệm, không dùng thông tin cá nhân của học sinh.

## Kết quả quan sát trên website hiện tại

- Bài hình bình hành ABCD tâm O, E/F là trung điểm OD/OB: có hình.
- Bài tam giác vuông cân tại C có nêu M thuộc AB: có hình.
- Bài hình thang cân có độ dài hai đáy/cạnh bên, hai chân đường vuông góc và hai trung điểm: có hình.
- Đề tam giác nguyên văn thiếu vị trí M cũng trả hình trong lượt thử; điều này không xác nhận việc suy thêm vị trí M là hợp lệ về toán học.
- Trước khi kết nối AI: nút xem hình mở thẻ yêu cầu kết nối, không dựng hình.

Chưa tái hiện được chính xác một lượt “không ra hình” của người dùng sau khi kết nối. Không kết luận lỗi nằm ở máy người dùng. Các kết quả trên xác nhận dịch vụ đang hoạt động ở những lượt thử, không bảo đảm mọi lượt đều thành công. Ảnh chụp trang thật nằm trong research/v6.1-checks/live-v6-check.jpg.

## Lỗi xác định qua mã nguồn và sửa trong V6.1

1. Nút “Vẽ lại hình” dưới hội thoại trước đây chỉ tạo lại thẻ hình, rồi thẻ lấy mã cũ từ bộ nhớ đệm. Nay cả hai nút vẽ lại đều gọi AI dựng mới. Chỉ lưu kết quả sau khi biên dịch thành công; bộ nhớ đệm lưu SVG đã hoàn tất.
2. Phản hồi HTTP 200 thiếu cả latex/question có thể bị coi là thành công và để trạng thái chờ không kết thúc. Nay kiểm tra cấu trúc phản hồi; tự yêu cầu sửa một lần, sau đó thông báo lỗi rõ ràng.
3. Mã bị máy chủ từ chối vì định dạng hoặc lệnh không hỗ trợ trước đây không đi qua vòng tự sửa. Nay máy chủ trả mã lỗi riêng cùng hướng sửa ngắn; phía giao diện thực hiện tối đa một lượt sửa. Lỗi quyền truy cập/hạn mức không được tự gọi lại liên tục.
4. Khung vẽ trước đây chỉ gửi tín hiệu ready một lần. Nay có cả onLoad và ready, kèm mã công việc để bỏ qua kết quả cũ khi đổi bài hoặc hủy. Kết thúc xong sẽ gỡ khung và giải phóng bộ biên dịch.
5. Máy chủ và khung biên dịch dùng chung bộ tách TikZ. Xử lý dấu kết thúc nằm trong chú thích, khoảng trắng ở tên môi trường, bổ sung thư viện tính tọa độ thông dụng. Các khai báo ở preamble có nguy cơ bị mất sẽ được yêu cầu đưa vào tikzpicture; không âm thầm bỏ đi.
6. Thêm nút “Kết nối & vẽ hình” ngay trong thẻ và nút “Dừng vẽ”. Lỗi triển khai API trả HTML được giải thích rõ thay vì hiện lỗi phân tích JSON khó hiểu.
7. Yêu cầu Gemini trả đủ hai trường latex/question bằng responseSchema, theo tài liệu generateContent của Google: https://ai.google.dev/api/generate-content#v1beta.GenerationConfig.

## Kiểm thử bản sửa

- 14 kiểm tra mới cho bộ đọc mã, hợp đồng API và vòng đời React đã đạt: phản hồi rỗng, HTML thay JSON, lỗi định dạng, giới hạn một lần sửa, mất ready, vẽ lại gọi mới, lỗi biên dịch rồi sửa thành công.
- Bộ kiểm tra React mô phỏng kênh khung vẽ; đây không phải bằng chứng chạy V6.1 trên Netlify.
- TypeScript và bản build production đạt.
- Toàn bộ hồi quy: 401 đạt, 0 lỗi, 1 bỏ qua; tổng cộng 402 kiểm tra.
- Log toàn bộ hồi quy: research/v6.1-checks/tests.txt.
- Chưa chạy V6.1 trên Netlify hoặc gọi Gemini thật bằng chính backend V6.1. Những lần thử trực tiếp nêu trên chạy bản V6 đang có trên website.

## Cập nhật website

Bản sửa đã chuẩn bị đầy đủ mã nguồn, build và Netlify Functions. Chưa thay đổi website đang chạy: quyền dùng mã lớp không phải quyền quản trị Netlify.

Trên Windows đã cài Node.js, giải nén rồi chạy CAP_NHAT_NETLIFY.cmd. Script cài phụ thuộc, mở đăng nhập Netlify, yêu cầu liên kết đúng site tuduyhinhtoan8 và triển khai toàn bộ ứng dụng. Không đổi GEMINI_API_KEY đang lưu trong Netlify. Có thể làm từng lệnh theo README.md nếu không dùng script.

Không chỉ tải riêng dist lên Netlify Drop: bản sửa này có thay đổi phía máy chủ và cần cập nhật cả Functions. Các báo cáo V6/V5 là tài liệu lịch sử; đọc tài liệu này cho những thay đổi mới nhất.
