# V4 — Hình vẽ theo bài toán học sinh nhập

## Sử dụng

Kết nối bằng mã HOCGIOITOAN, hoàn tất hồ sơ rồi nhập đề bài hình tứ giác như trước. Gia sư được yêu cầu gửi hình cùng lượt định hướng đầu của bài. Hình xuất hiện trong câu trả lời, sau phần sơ đồ thu gọn và trước câu gợi mở. Mỗi hình có tiêu đề riêng gắn với lượt hội thoại để không nhầm hình cũ với đề mới.

- **Phóng to:** xem rõ hình và tên điểm, đóng để trở về vị trí trong bài.
- **Ẩn/Hiện đường phụ và ký hiệu:** tập trung vào hình ban đầu hoặc các quan hệ đã thêm.
- **Vẽ lại hình:** yêu cầu Gia sư bổ sung/sửa hình của bài đang học. Nếu thấy điểm hoặc dữ kiện chưa khớp, nêu rõ điều cần sửa trong tin nhắn.
- Khi đổi đề hoặc thêm điểm/đường phụ, Gia sư được hướng dẫn gửi một hình cập nhật. Các lượt chỉ hỏi tiếp không bắt buộc lặp lại hình.
- Khi tạo nhiều đề luyện tập, chọn một câu để bắt đầu hướng dẫn và dựng hình cho câu đó.

Không cần API tạo ảnh riêng. Không hỗ trợ tải ảnh đề bài lên ở bản này. Giao diện sáng xanh nhạt, giao diện tối, hồ sơ, học từng bước và đánh giá vẫn giữ cách dùng cũ.

## Nội dung hình

Dựng SVG trực tiếp từ dữ liệu hình học: tứ giác chung, hình bình hành, hình chữ nhật, hình thoi, hình vuông, hình thang, hình thang cân; tam giác chung, vuông, cân phục vụ bài tứ giác. Hỗ trợ trung điểm, điểm chia đoạn, giao hai đường thẳng, đối xứng qua một điểm, chân đường vuông góc. Có tên điểm, đường phụ nét đứt, ký hiệu vuông góc, đoạn bằng nhau và song song.

Bộ dựng tính điểm từ phép dựng thay vì yêu cầu AI đoán vị trí tất cả điểm. Chỉ chấp nhận số hữu hạn, số điểm/đoạn có giới hạn, tên điểm hợp lệ, đa giác lồi không suy biến, tham chiếu đã khai báo. Kiểm tra các ràng buộc loại hình và các ký hiệu bằng nhau/song song/vuông góc trước khi hiển thị. Không chèn SVG/HTML do mô hình viết và không thực thi mã từ phản hồi.

**Giới hạn cần phân biệt:** bộ dựng kiểm tra tính nhất quán của dữ liệu hình học nhận được; không tự chứng minh rằng Gemini đã hiểu đúng toàn bộ đề tiếng Việt. Vì vậy hình vẫn cần đối chiếu giả thiết. Chọn sai loại hình, bỏ sót dữ kiện hoặc số đo có thể xuất phát từ mô hình. Không suy thêm tính chất hoặc dùng tỷ lệ nhìn thấy trên hình thay cho chứng minh. Một số phép dựng phức tạp, tứ giác lõm, đường cong, điểm trùng tên/vị trí hoặc cấu hình quá chênh lệch chưa hỗ trợ; Gia sư được yêu cầu hỏi lại/giải thích giới hạn, không tự thêm giả thiết.

Dữ liệu lỗi hoặc thiếu không làm hỏng chat: hiển thị thông báo cùng nội dung hướng dẫn còn lại. Nếu mô hình không gửi khối hình, ứng dụng không tạo hình ngẫu nhiên; có nút Vẽ lại hình để yêu cầu bổ sung.

## Tương thích kỹ thuật

Giữ nguyên POST /api/chat, body {accessCode,messages,mode}, response {text,model}, model, khóa trên server và Netlify. Dữ liệu hình nằm trong chuỗi text bằng khối [HINH_VE] JSON [/HINH_VE], ngoài khối [SO_DO] cũ. Frontend tách khối hình để dựng SVG và ẩn JSON khỏi phần văn bản. Lịch sử thô tiếp tục giữ nội dung model để Gia sư có ngữ cảnh; bộ cắt lịch sử cũ vẫn hoạt động. Không thêm API, SDK hoặc dependency mới.

Năm giai đoạn gợi mở và quy tắc kết thúc V3 được giữ nguyên; chỉ bổ sung chỉ dẫn dựng hình. Tọa độ, nếu cần, là dữ liệu kỹ thuật của hình minh họa, không đưa vào lời chứng minh cho học sinh lớp 8.

## Kiểm tra

npm test: kiểm tra dựng hình, phép dựng, hình sai/metadata lỗi, parser SO_DO cũ, prompt, API Gemini giả lập, mã lớp, Google Forms giả lập và tệp cần bảo toàn.

npx tsc --noEmit và npm run build: kiểm tra kiểu và build nguồn. scripts/check-diagrams-ui.mjs kiểm tra hình, nhãn, phóng to, khôi phục tiêu điểm, ẩn/hiện, vẽ lại, reset bài, sáng/tối và màn hình điện thoại. scripts/check-ui.mjs kiểm tra lại kết nối, hồ sơ và đánh giá. Kiểm thử trình duyệt dùng dữ liệu giả lập, ảnh tại research/screenshots-v4.

Bộ nghiệm thu Gemini thật vẫn chỉ chạy khi có khóa và bật RUN_PEDAGOGY_LIVE=1. Đã cập nhật để kiểm tra khối hình cho các ca mở đầu, bỏ dữ liệu hình khỏi phép đếm từ của lời hướng dẫn. Không tuyên bố đã nghiệm thu model thật khi thiếu khóa. Không gửi đánh giá thử vào Google Forms thật.

## Chạy và triển khai

Giữ hướng dẫn README.md: npm install, npm run build, npm start; Netlify build từ nguồn với functions. Giữ các biến môi trường hiện có. Không deploy chỉ thư mục dist vì ứng dụng cần backend. Xem BAO_CAO_V4.json cho đối chiếu tệp lần này; các báo cáo V2/V3 là hồ sơ phiên bản trước.
