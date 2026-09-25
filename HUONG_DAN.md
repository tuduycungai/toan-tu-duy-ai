# Hướng dẫn nhanh — V6.4.0

1. Giải nén ZIP và mở thư mục `TU-DUY-TOAN-HOC-V6_4_0`.
2. Cài các thư viện bằng `npm ci`, chạy `npm start`, rồi mở `http://localhost:3000`.
3. Muốn dùng hội thoại AI, sao chép `.env.example` thành `.env` và điền khóa API ở máy chủ. Khi triển khai Netlify, đặt khóa trong cấu hình biến môi trường của Functions.
4. Trong ứng dụng, chọn **Kết nối AI**, nhập mã lớp `HOCGIOITOAN`, kiểm tra kết nối và hoàn tất hồ sơ học sinh/giáo viên.
5. Khi chưa có API, chọn xem bài mẫu để sử dụng lý thuyết và những hình bộ dựng cục bộ hỗ trợ.
6. Hình được giữ khi trả lời tiếp. Chỉ dùng **Vẽ lại hình** khi cần dựng lại; dùng **Bài mới** để đổi đề.
7. Hai chế độ **Kiểm tra lời giải** và **So sánh cách giải** đang phát triển; nhãn được giữ rõ trên giao diện.
8. Khi triển khai, dùng toàn bộ mã nguồn và Functions theo `README.md`; không chỉ tải thư mục `dist`.

Bản 6.4.0 bổ sung bộ dựng chung cho tam giác, tứ giác, đường tròn, phép biến hình, đồ thị và hình không gian cơ bản. Với hình AI dựng, mở **Đối chiếu hình với đề** để xem các quan hệ đã kiểm tra. Đề thiếu hoặc mâu thuẫn dữ kiện cần được sửa/bổ sung trước; hình ngoài các phép dựng hỗ trợ chuyển sang công cụ TikZ mở rộng và được ghi rõ mức kiểm tra.

Xem `docs/V6_4_0_DUNG_HINH_TONG_QUAT.md` để cập nhật toàn bộ mã nguồn và Netlify Functions. Bản bàn giao chưa được đưa lên website đang chạy; cần kiểm tra lại API thật sau triển khai. Không đưa `.env`, khóa API hoặc hồ sơ học sinh vào gói mã nguồn.
