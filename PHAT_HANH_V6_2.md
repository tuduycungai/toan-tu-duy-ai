# Bản cập nhật V6.2 — 18/09/2026

## Thay đổi
- Lưu tối đa 40 lượt hội thoại gần nhất cùng đề bài và câu hỏi nháp trong sessionStorage của tab hiện tại, hết hạn sau 12 giờ. Lưu câu hỏi trước khi gọi AI; khi trang bị tải lại, học sinh có thể gửi lại câu hỏi đang chờ.
- Không lưu mã truy cập. Sau khi tải lại có thể phải kết nối lại và điền thông tin nếu chưa chọn ghi nhớ hồ sơ.
- Điện thoại hoặc thiết bị cảm ứng: chỉ biên dịch TikZ sau khi học sinh nhấn “Vẽ hình”. Tạm ngừng dựng hình trong khi chờ trả lời; hủy tác vụ dựng hình đang chạy. Giới hạn cache hình còn 3 bài.
- Tắt hiệu ứng gõ từng chữ trên thiết bị cảm ứng và khi có công thức để giảm số lần hiển thị lại.
- Thêm poster Phụ lục 3 tại /poster.html và PDF tại /poster-phu-luc-3.pdf.

## Giới hạn
Đây là biện pháp giảm tải và khôi phục dữ liệu, không phải bằng chứng đã loại bỏ mọi lỗi đóng trang trên iPhone/Android. Không tiếp tục được một yêu cầu AI sau khi trình duyệt bị đóng; học sinh cần gửi lại câu hỏi đã khôi phục. SessionStorage không bảo đảm còn dữ liệu sau khi đóng hẳn tab hoặc khi hệ điều hành xóa dữ liệu. Môi trường không cho phép lưu trữ vẫn dùng được nhưng không có khả năng khôi phục. Dựng TikZ trên điện thoại vẫn cần nhiều bộ nhớ khi người dùng chủ động mở.

## Kiểm tra
- npm run typecheck
- npm run build
- node --test tests/v62-mobile.test.mjs
- CHROMIUM_EXECUTABLE=/duong-dan/chromium node scripts/check-v62-mobile.mjs
Bài kiểm tra trình duyệt dùng AI mô phỏng và Chromium giả lập thiết bị cảm ứng; không thay thế kiểm tra thiết bị thật. Kết quả ghi ở research/v62-checks/results.json.

## Đưa lên Netlify
Bản này CHƯA được triển khai lên tuduyhinhtoan8.netlify.app trong phiên làm việc này.
1. Giải nén, dùng toàn bộ mã nguồn làm thư mục dự án. Node >=22.13.
2. Cập nhật kho Git đã liên kết với site Netlify hiện tại, giữ các biến môi trường đang dùng trên Netlify. Không đưa khóa API vào mã nguồn phía trình duyệt.
3. Build command: npm run build; publish directory: dist. Giữ netlify.toml và thư mục netlify/functions để /api/chat hoạt động.
4. Không chỉ thả thư mục dist lên Netlify nếu chưa triển khai các Functions tương ứng: giao diện có thể mở nhưng chatbot không hoạt động.
5. Khi triển khai xong, mở /poster.html; thử gửi câu hỏi, chuyển ứng dụng và quay lại, tải lại khi đang chờ, gửi lại nháp, dừng yêu cầu và chủ động vẽ hình trên iPhone/Android thật.

Poster còn hai trường cần điền theo hồ sơ chính thức: mã dự án và phường/xã. Kết quả khảo sát là lượt phản hồi, không tự quy đổi thành số học sinh hay mức tiến bộ học tập.
