# Hồ sơ năng lực và mức hỗ trợ

Bốn mức nội bộ: **Củng cố nền tảng, Cơ bản, Khá, Giỏi**. “Củng cố nền tảng” tương ứng nhu cầu ôn lại căn bản, thay cách gọi gây mặc cảm. Lựa chọn cũ “Học sinh năng khiếu” được quy về Giỏi; “Mất gốc” được chuyển tên khi đọc hồ sơ.

## Thông tin và minh chứng

Thu khối lớp 6–9, tự tin 1–5, kiến thức nền tự khai, mục tiêu/khó khăn cũ và năm câu chẩn đoán. Các lượt học tiếp tục ghi nhận `Evidence`: mã lượt, mã bài, câu hỏi, trích đoạn trả lời, thao tác tư duy, năng lực thành phần, điểm hoặc chưa đánh giá, lỗi, nguồn, thời điểm. Năm năng lực thành phần: đọc giả thiết/kết luận, kiến thức, nhận diện hình, suy luận, phản biện.

AI chỉ được đánh giá câu tự viết của học sinh; trích dẫn phải xuất hiện trong lượt đó. Đề mới, yêu cầu xin gợi ý và lời cảm ơn không được biến thành câu trả lời đúng. Giao diện còn chặn đánh giá ở lượt đầu của một bài. “Đã làm được thao tác” chỉ ghi nhận từ minh chứng có đánh giá, không dựa vào việc chatbot đã hỏi thao tác ấy.

Năm câu chẩn đoán hỏi lần lượt một câu, phải chọn và giải thích. Lựa chọn đúng chỉ nhận 0,65 vì lời giải thích chưa được bộ chẩn đoán tự động chứng minh đúng; lựa chọn sai nhận 0. Không dùng năm câu này để chốt năng lực.

## Quy tắc tích lũy

- Ít nhất 6 minh chứng có đánh giá, phủ ít nhất 3 năng lực thành phần và 2 mã bài/nhiệm vụ; có ít nhất 3 minh chứng mới sau lần phân loại trước.
- Lấy tối đa 24 minh chứng có đánh giá gần nhất. Tính trung bình từng năng lực rồi trung bình các năng lực, để một năng lực có nhiều lượt không áp đảo toàn bộ.
- Ngưỡng `<0,40`, `<0,70`, `<0,88`, còn lại lần lượt gợi ý bốn mức. Sau lần phân loại đầu, mỗi lần chỉ thay đổi nhiều nhất một mức.
- Điểm dưới 0,5 tăng hỗ trợ một nấc; điểm từ 0,85 giảm một nấc, trong khoảng 1–5. Điểm 0,5 của một câu còn thiếu căn cứ không tự hạ nhãn năng lực.
- Bộ đếm đánh giá tăng đơn điệu; giới hạn lưu 160 minh chứng không khiến phân loại ngừng cập nhật. Lưu tối đa 80 câu hỏi.

Các ngưỡng này là **quy tắc sản phẩm do bản nâng cấp thiết kế**, không được gán cho hai tài liệu nghiên cứu và không phải công cụ đo năng lực đã chuẩn hóa. `confidence` trong hồ sơ là chỉ báo số minh chứng nội bộ, không phải độ chính xác dự đoán đã được thực nghiệm.

## Quyền điều chỉnh và riêng tư

Học sinh hoặc giáo viên cùng trao đổi có thể chọn mức, bỏ điều chỉnh để quay lại tự thích nghi. Việc ghi ai điều chỉnh là khai báo tại thiết bị, **không phải xác thực quyền giáo viên**. Điều chỉnh thủ công không bị ghi đè bởi lần AI đánh giá sau.

Ghi nhớ trên thiết bị là lựa chọn; không chọn thì hồ sơ chỉ ở phiên. Hồ sơ cũ được đọc tương thích; dữ liệu tiến trình hỏng được đưa về trạng thái khởi tạo an toàn thay vì làm vỡ giao diện. Có tải JSON tiến trình, và nút xóa hồ sơ vốn có.

Tên, trường, email không tự động đưa vào ngữ cảnh Gemini. Ngữ cảnh gồm tóm tắt học tập và chính nội dung chat do người học gõ; nếu người học tự nhập thông tin cá nhân vào chat, nội dung đó vẫn được gửi. Tiến trình có thể chứa trích đoạn bài làm nên cần bảo quản khi tải xuống. Forms vẫn chỉ gửi sau đồng ý, giữ nguyên cơ chế cũ.

Chưa có cơ sở dữ liệu đa tài khoản/đồng bộ thiết bị, chưa kiểm thử thực nghiệm với học sinh thật; AI có thể chấm sai lập luận. Giáo viên cần xem minh chứng và điều chỉnh, không dùng nhãn hỗ trợ này thay điểm chính thức.
