# V5: Lý thuyết dự kiến dùng

Tiêu đề **LÝ THUYẾT DỰ KIẾN DÙNG** được hiển thị cùng hình cho đề trong ngân hàng, đề tự nhập và đề còn dữ kiện chưa rõ. Có thể xem trước cả hình và lý thuyết khi chưa kết nối AI. Chi tiết mở theo từng mục để giảm nội dung xuất hiện cùng lúc.

`lib/theory.ts` giữ kho kiến thức cũ, bổ sung đường tròn, bán kính, tiếp tuyến và đọc giả thiết. `dynamicTheoryForProblem` kết hợp câu đã chuẩn hóa, mục tiêu, loại hình và quan hệ thực tế trong mô hình để chọn/xếp kiến thức. Bộ chọn không yêu cầu đề trùng một ID bài có sẵn.

Với trung điểm, bộ chọn kiểm tra các đoạn chứa trung điểm có tạo được một tam giác không suy biến trước khi ưu tiên đường trung bình. Với bài hình bình hành tâm O trong ảnh, hai trung điểm thuộc cùng một đường chéo; hệ thống ưu tiên định nghĩa trung điểm, hình bình hành và song song. Với tiếp tuyến, hệ thống đưa điều kiện tiếp điểm thuộc đường tròn và bán kính vuông góc, không mặc định đưa tổng góc tứ giác hoặc tam giác bằng nhau.

Mỗi thẻ có: tiêu đề; định nghĩa/kiến thức nền; tính chất hoặc định lý; điều kiện áp dụng; liên hệ với bài; dấu hiệu tìm hướng; lỗi cần tránh; thao tác tư duy; ví dụ ngắn; nguồn biên soạn/sư phạm. Chỉ 2–3 chủ đề thiết yếu được tóm tắt trước. Các mục định lý, ví dụ và phân tích chi tiết mặc định thu gọn. Học sinh khá/giỏi nhận thêm nhiệm vụ so sánh điều kiện của các hướng giải.

Đây là **chọn lý thuyết động từ danh mục được biên soạn và mô hình bài toán**, không phải mô hình tự phát minh định lý. Nếu ngoài danh mục hoặc chưa đọc rõ đối tượng, thẻ hướng dẫn xác định giả thiết được dùng để tránh đưa kiến thức không có căn cứ. Chưa có bộ kiểm chứng hình thức cho toàn bộ suy luận hoặc khả năng sinh đủ mọi kiến thức THCS bằng AI.
