# Mã lớp mới: HOCGIOITOAN

Đổi mã mặc định và .env.example thành HOCGIOITOAN. Điều chỉnh độ dài tối thiểu từ 12 xuống 10 ở frontend, API chat và API đánh giá. Giữ nguyên endpoint, cấu trúc request/response, cách gọi Gemini, model và bảng màu.

**Website đang chạy:** Trong Netlify, sửa biến ACCESS_CODE thành HOCGIOITOAN rồi triển khai lại bản này. Biến môi trường cũ sẽ ghi đè mã mặc định nếu chưa sửa. Không đổi GEMINI_API_KEY. Chạy trên máy: sửa ACCESS_CODE trong .env và khởi động lại.

Các báo cáo bảo toàn byte trước đây là kết quả tại thời điểm phát hành V2. Lần này server/gemini.mjs được thay đúng phần mã lớp và độ dài xác thực theo yêu cầu mới; API_INTEGRITY.json ghi nhận khác biệt này.
