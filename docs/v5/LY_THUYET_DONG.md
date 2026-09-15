# Lý thuyết dự kiến dùng cho đề mới

`theoryForProblem` không tra theo mã bài. Nó phân tích văn bản chuẩn hóa của mô hình (hoặc đề gốc nếu chưa có mô hình), đối tượng, quan hệ và mục tiêu, truy hồi các đơn vị kiến thức phù hợp rồi tạo liên hệ với bài hiện tại. Do đó đề mới tên KLMN, LaTeX, đường tròn hoặc đề thiếu dữ kiện vẫn có mục **LÝ THUYẾT DỰ KIẾN DÙNG**. Không nhận biết được chủ đề cụ thể thì có kiến thức đọc giả thiết/chọn điều kiện đủ, không khẳng định một định lý tùy tiện là lời giải.

Đơn vị `TheoryUnit` giữ trường cũ và bổ sung: `definition`, `conditions`, `connectionToProblem`, `thinkingOperation`, `commonMistake`, `source`, `example`, `signal`. Giao diện trình bày kiến thức/định nghĩa, điều kiện, liên hệ đề, dấu hiệu chọn hướng, lỗi thường gặp, thao tác, ví dụ mở khi cần và nguồn. Hình minh họa bài nằm ngay trước phần này; sơ đồ định hướng cũ vẫn ở vị trí cũ.

Ví dụ ABCD: nhận được hình bình hành, tâm, hai trung điểm, mục tiêu song song. Các thẻ đưa định nghĩa trung điểm, tính chất hình bình hành, điều kiện về song song, có thể xét đường trung bình hoặc tam giác bằng nhau nếu học sinh tìm được đủ điều kiện. Thẻ đường trung bình ghi rõ phải tìm một tam giác có hai trung điểm, không khẳng định bài đã có sẵn điều đó. Không đưa chuỗi áp dụng để hoàn thành chứng minh.

Mức củng cố nền tảng ưu tiên định nghĩa ngắn và hình cơ sở, mở hai thẻ đầu; phần còn lại có thể mở thêm. Mức khá/giỏi thấy nhiều hướng kèm điều kiện để tự so sánh. Tất cả đều là kiến thức **dự kiến**, không phải một lời giải đã được xác nhận.

Danh mục có các kiến thức THCS được biên tập: góc, trung điểm, đường trung bình, song song/vuông góc, tam giác bằng nhau, các tứ giác, đối xứng, phân giác, Pythagore, diện tích, bất đẳng thức tam giác; thêm đường tròn/dây/bán kính, tiếp tuyến, nội tiếp, Thalès/đồng dạng và đọc giả thiết.

Đây là **truy hồi và liên kết động trên danh mục mở rộng**, không phải hệ tự tạo định lý mới không giới hạn. Để đáp ứng yêu cầu không trả lời cả bài trong bất kỳ trường hợp nào, V5.1 không hiển thị lý thuyết tự do của AI: một trường `definition` không kiểm soát có thể chứa cả lời giải. Metadata AI vẫn được kiểm tra nhưng nội dung học sinh thấy lấy từ danh mục đã biên tập. Muốn bổ sung kiến thức, thêm đơn vị và quy tắc chọn vào `lib/theory.ts`, thêm test đề mới/đề thiếu/sai điều kiện; không phải bổ sung từng đề vào ngân hàng.

Nguồn “Thư viện kiến thức hình học THCS của ứng dụng” là mô tả nguồn biên tập nội bộ, không phải trích dẫn SGK/tài liệu nghiên cứu giả. Hai PDF được dùng cho thiết kế cách gợi mở (xem `GOI_MO_TU_DUY.md`), không được gán làm nguồn cho mọi định lý hình học.
