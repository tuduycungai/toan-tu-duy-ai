# Cập nhật sau kiểm tra website

Ngày kiểm tra: 20/09/2026 (UTC). Bản nền: 6.2.1. Bản bàn giao: 6.2.2. Bản sửa chưa được triển khai lên Netlify trong đợt này.

## Những lỗi đã xử lý

| Vấn đề | Thay đổi |
| --- | --- |
| Poster dẫn tới trang quản trị | Đổi sang https://poster-online-khkt.netlify.app/ theo URL mới người dùng cung cấp. Không hiển thị số phiên bản ở chân trang. |
| Một phần chữ in đậm còn hiện `**` | Render nhấn mạnh bằng phần tử strong và giữ KaTeX cho công thức. Nội dung HTML do mô hình trả về vẫn được escape. |
| Nhận xét sai về dấu hiệu hình chữ nhật | Bổ sung chỉ dẫn đúng cho kiểm tra/so sánh lời giải; đối chiếu tiền đề của từng dấu hiệu. Bộ kiểm tra sửa có giới hạn phát biểu sai đã quan sát trong trường CAU_NOI, không coi đó là bộ chứng minh tổng quát. |
| Đổi mức học nhưng giữ mức hỗ trợ cũ | Dùng setLearnerLevel hiện có để cập nhật đồng thời mức học và hỗ trợ, giữ lịch sử quan sát. Kiểm thử thực thi biểu mẫu cho cùng hồ sơ: Mất căn bản → Giỏi → Mất gốc, mức hỗ trợ tương ứng 3 → 0 → 3. |
| Bộ 5 câu bị thay bằng câu gợi mở chung | Bổ sung chỉ dẫn dành riêng cho bộ đề, chuẩn hóa đánh số và kiểm tra đủ 5–10 câu. Không áp quy tắc một dấu hỏi cho cả danh sách đề. Nếu chưa đủ hoặc có dạng lời giải, báo bộ đề chưa hợp lệ thay vì giả vờ đã tạo đủ. |
| Chọn một câu cần có đúng đề để vẽ | Thêm nút Làm câu 1…; khi chọn, gắn đúng đề đó vào lượt học và hình vẽ. Cũng nhận “câu 2”, “em chọn câu 2”, “2”. Không lấy đề từ bộ cũ khi đã sang hướng dẫn bài khác. |

Quy tắc không cung cấp đáp án hoàn chỉnh vẫn áp dụng. Tạo bộ đề chỉ cho đề chưa giải; học sinh chọn một bài rồi tự làm từng bước. Không tự tạo dữ kiện thiếu hoặc cam kết mọi đề đều có thể dựng đúng.

## Kết quả chạy bản sửa

| Lệnh | Kết quả |
| --- | --- |
| npm test | 443 kiểm thử: 442 đạt, 0 lỗi, 1 bỏ qua. |
| npx tsc --noEmit | Mã thoát 0. |
| npm run build | Mã thoát 0; dist được tạo lại từ mã nguồn. |
| npm start | Máy chủ sẵn sàng trên cổng kiểm thử 3184; đã dừng sau kiểm tra. |

Thời điểm, thời gian chạy và nhật ký gốc nằm trong `research/v622-checks/`. Có 13 kiểm thử bổ sung so với bản 6.2.1. Bảng Excel liệt kê toàn bộ 443 ca, tệp nguồn, dòng nhật ký và kết quả quan sát website.

Kiểm thử bị bỏ qua là kiểm thử sư phạm dùng khóa Gemini trực tiếp tại máy chạy test. Phần kiểm tra website trước đó đã kết nối thành công bằng mã lớp và nhận phản hồi Gemini thật từ Netlify. Hai loại bằng chứng được ghi riêng. Không có khóa Gemini thật trong gói mã.

## Kiểm tra trên website đang hoạt động

Trên bản website 6.2.1 đã xác nhận kết nối, hồ sơ giáo viên, hình của bài `2AM = AB`, hình nhiều đường đồng quy, sơ đồ/lý thuyết, chặn xin đáp án, gợi mở so sánh, mở/đóng khảo sát và lọc/xem trước bài trong ngân hàng. Nhật ký cũng giữ lỗi chữ `**`, lỗi định lí và lỗi sinh bộ đề đã quan sát để đối chiếu bản sửa.

- Hình đúng trong các ca được quan sát không chứng minh mọi đề hình học đều đúng.
- Chưa chạy phản hồi Gemini trên Netlify với các thay đổi 6.2.2; cần triển khai bản này để kiểm tra tiếp cùng các ca trong bảng Excel.
- Chưa xác nhận tải SVG/TikZ bằng công cụ trình duyệt: hết thời gian chờ sự kiện tải, không kết luận chức năng tải bị lỗi.
- Chưa kiểm tra trên Safari/iPhone thật trong đợt này. Các kiểm thử thành phần không thay thế kiểm tra thiết bị.
- Chưa gửi bản ghi khảo sát thật vào Google Forms. Kiểm thử payload, đồng ý và chống gửi trùng dùng phản hồi mô phỏng.
- Build vẫn có cảnh báo kích thước JavaScript lớn hơn 500 kB. Không đổi thư viện/model để xử lý ngoài phạm vi bản sửa.

## Bảo toàn và triển khai

18 tệp lõi tiếp tục được kiểm tra SHA-256 theo `tests/v62-protected.json`, gồm vận chuyển Gemini, xác thực, biến môi trường mẫu, Netlify Functions, đánh giá và bộ dựng TikZ. `server/strict-tutor.mjs` được phép thay đổi có kiểm thử hồi quy để xử lý các lỗi quan sát. Các bài mẫu và prompt guide không có yêu cầu tạo bộ đề vẫn khớp bản nền. Prompt tạo bộ đề có phần nối thêm có điều kiện.

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm start
```

Giữ các biến GEMINI_API_KEY, GEMINI_MODEL, ACCESS_CODE đang có ở Netlify. Cập nhật toàn bộ mã qua nhánh Git Netlify đang theo dõi; cấu hình build/publish/functions đã có trong `netlify.toml`. Cần triển khai cả Functions, không chỉ tải riêng dist bằng Netlify Drop. Hướng dẫn chi tiết tiếp tục có trong README.

Mã thay đổi và nguồn hỗ trợ AI: `MINH_CHUNG_V6_2_2.md`, `research/v622-checks/source-changes.diff`, `source-changes.json`. Báo cáo các bản trước là tài liệu lịch sử, không phải kết quả lần chạy mới.
