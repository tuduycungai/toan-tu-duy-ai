# Giáo viên kiểm tra nhanh V6.2.4

## Chuẩn bị

Giải nén ZIP mới vào thư mục riêng. Giữ site Netlify, biến GEMINI_API_KEY/GEMINI_MODEL/ACCESS_CODE ở máy chủ và mã lớp HOCGIOITOAN. Theo quy trình triển khai hiện có trong README; triển khai cả frontend và Functions. Bản bàn giao chưa được đưa lên website đang chạy. Sau cập nhật, tải lại trang để dùng bộ biên dịch mới.

## 1. Kiểm tra lỗi hình thang

1. Chọn/chụp ảnh đề: “Cho hình thang ABCD (AB // CD), M là trung điểm của AD, N là trung điểm của BC. Gọi I, K theo thứ tự là giao của MN với BD, AC. Biết AB = 8 cm, CD = 16 cm. Tính độ dài các đoạn MI, IK, KN.” Có ảnh tự soạn cùng nội dung ở `tests/fixtures/images/trapezoid-v624.png`.
2. Nhấn **Đọc đề từ ảnh**. Đối chiếu nguyên văn, đặc biệt thứ tự I/K và BD/AC, 8/16. Nếu chỉ có thông báo kiểm tra lại quan hệ hình học, không cần thay đổi câu chữ đúng.
3. Nhấn **Xác nhận và vẽ hình**. Nếu chỉ lỗi cấu trúc, hệ thống thử sửa cấu trúc rồi vẽ. Nếu AI nêu đúng một chỗ ảnh mờ/thật sự thiếu, bổ sung ký hiệu hoặc chụp lại; không bỏ qua cảnh báo.
4. Kiểm tra A–B–C–D theo chu vi, AB song song CD, M/N ở trung điểm hai cạnh bên, I thuộc MN và BD, K thuộc MN và AC. Trên hình minh họa đã kiểm thử, thứ tự trên MN là M–I–K–N. Kiểm tra nhãn, số 8 cm/16 cm và dấu trung điểm; không hiện trước đáp số cần tính.
5. Thử **Phóng to hình**, **Tải PNG**, **Tải SVG**. Vùng mã TikZ nằm dưới mục mở rộng dành cho giáo viên. Xem hình QA ở `qa-results/v6.2.4/trapezoid.png`; đó là kết quả compiler từ fixture, không phải chứng nhận OCR thật.
6. Chọn **Hình chưa đúng — yêu cầu sửa**, mô tả cụ thể, ví dụ “I phải là giao MN với BD; nhãn K chạm MN”. Kiểm tra bản dữ kiện cập nhật trước khi vẽ lại.

## 2. Kiểm tra gia sư thích ứng

Sau **Hình đúng — bắt đầu gợi mở**, lần lượt thử ở các phiên bài riêng: câu đúng đầy đủ; đúng một phần; dùng định lý nhưng thiếu điều kiện; suy luận sai; hướng khác hợp lệ; câu mơ hồ; xin đáp án nhiều lần. Gia sư phải giữ phần hợp lý, hỏi một bước vừa sức và chưa xuất lời giải hoàn chỉnh sớm.

Thử “Em chưa nhớ đường trung bình là gì” để kiểm tra hỗ trợ mất căn bản; thử đề xuất một hướng dùng tam giác thay vì công thức hình thang để kiểm tra tiếp nhận hướng khác. Đối chiếu chỉ báo giai đoạn 1–8 và tính liên tục qua nhiều lượt. Kiểm thử tự động chỉ xác minh bộ điều khiển; giáo viên cần đánh giá nội dung Gemini thật.

## 3. Điện thoại và khảo sát

- Dùng ảnh JPEG/PNG/WebP rõ, ưu tiên chế độ 12 MP, chụp/cắt riêng phần đề. Ảnh trên 16 MP sẽ được yêu cầu giảm trước khi giải mã trên điện thoại; HEIC cần xuất JPEG.
- Khi đang dựng, chuyển ứng dụng rồi quay lại: tác vụ được dừng để giảm tải, bản đề đã đọc vẫn còn. Chọn **Thử dựng lại** khi sẵn sàng.
- Tải lại khi chưa bắt đầu học: nếu có bản lưu, nhấn **Khôi phục đề đã đọc**, kết nối AI nếu được hỏi, rồi xác nhận/vẽ khi cần. Không tự nạp bộ TeX khi vừa mở lại trang.
- Tải lại sau khi đã bắt đầu học: tiến trình hội thoại được giữ, không bị bắt xác nhận ảnh để làm lại bài. Kết nối lại nếu phiên truy cập đã mất. Xóa tab/dữ liệu duyệt web có thể xóa bản lưu.
- Sau kết nối và hoàn tất hồ sơ, đợi **13 phút** ở trang đang hoạt động, không có tác vụ/hộp thoại khác. Lời mời khảo sát xuất hiện khi rảnh; không tự gửi. Nút mở khảo sát thủ công vẫn dùng bất kỳ lúc nào. Kiểm tra cả chế độ sáng/tối và bàn phím dọc/ngang.

Chưa nghiệm thu trên máy thật. Nếu còn bị “out”, ghi lại loại máy, phiên bản iOS/Android/trình duyệt, dung lượng/kích thước ảnh và bước vừa thực hiện; giữ ảnh đề riêng để tái hiện. Không gửi khóa API hoặc thông tin đăng nhập trong ảnh/log lỗi.
