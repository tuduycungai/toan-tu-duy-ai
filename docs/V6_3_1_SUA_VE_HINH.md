# Sửa lỗi vẽ hình — phiên bản 6.3.1

Ngày kiểm tra: 24/09/2026. Website: https://tuduyhinhtoan8.netlify.app/

## Đã xác minh

- Đăng nhập bằng mã lớp thành công, dùng một hồ sơ kiểm thử tổng hợp. Giao diện báo mô hình đang dùng là `gpt-6-luna`.
- Nhập đúng đề trong ảnh và bấm **Xem hình & lý thuyết** tái hiện thông báo “Kết nối OpenAI gián đoạn hoặc quá thời gian”.
- Mã nguồn 6.3.0 dùng `AbortSignal.timeout(25000)` cho OpenAI; trình duyệt chờ vẽ 35 giây và đọc ảnh 30 giây. Mức suy luận `medium` dùng chung cho mọi tác vụ.
- Thông báo cũ gộp lỗi mạng và hết thời gian. Không có log phía Netlify/OpenAI nên chưa thể khẳng định mọi lần lỗi đều do hết 25 giây, hay đo chính xác thời gian suy luận phía OpenAI.
- Bộ đọc hình cục bộ chưa hiểu đường cao AI, các tia Ax/By, cách viết “Nối M với trung điểm P của AB” và tiền tố “đường MP”. Tia Ax còn bị hiểu thành đoạn AX. Do đó bài này phụ thuộc vào lượt AI vốn đang lỗi.

## Thay đổi trong bản này

1. Dựng đường cao bằng hình chiếu; nhận diện tia có tên và giao điểm; nối đến trung điểm; kéo đoạn dựng tới giao điểm thực tế. Không sinh thêm điểm X/Y từ tên tia.
2. Kiểm tra đủ AI ⟂ BC, AM ⟂ AC, BM ∥ AC, P là trung điểm AB, M thuộc hai tia, Q thuộc MP và AC, H thuộc BQ và AI. Dữ kiện thiếu, mâu thuẫn hoặc chưa hỗ trợ vẫn không được đánh dấu đã xác minh. Không lấy kết luận AMBQ làm giả thiết.
3. Ưu tiên hình dựng trong ứng dụng dù từng có hình AI lưu. Có nút trở về hình dựng sẵn sau khi chọn thử AI.
4. Giữ mô hình `gpt-6-luna` và Responses API. Hội thoại mặc định `medium`; vẽ hình mặc định `low` qua biến riêng. Kiểm tra kết nối dùng `none` với Luna/Sol, `low` với Astra.
5. Timeout một lượt OpenAI mặc định 50 giây. Tổng ngân sách mỗi yêu cầu, kể cả sửa JSON, tối đa 52 giây. Trình duyệt chờ 65 giây. Không tự thử lại khi lỗi mạng hoặc quota; giữ giới hạn sửa lỗi định dạng hiện có.
6. Phân biệt `OPENAI_TIMEOUT`, `OPENAI_NETWORK`, `OPENAI_INVALID_JSON`. Không đưa khóa API hoặc nội dung lỗi thô của nhà cung cấp ra giao diện.
7. Hiển thị thời gian đã chờ; báo khi chuyển tab khiến lượt dựng bị dừng; giữ đề và hình đã có.

## Cấu hình Netlify

Giữ nguyên khóa API, mã lớp và khóa ký trạng thái đang sử dụng. Không thay bằng giá trị mẫu.

```dotenv
AI_PROVIDER=openai
OPENAI_MODEL=gpt-6-luna
OPENAI_REASONING_EFFORT=medium
OPENAI_DIAGRAM_REASONING_EFFORT=low
OPENAI_TIMEOUT_MS=50000
```

Các biến mới có mặc định trên máy chủ, nên website vẫn dùng được khi chưa thêm chúng. Khóa `OPENAI_API_KEY` phải nằm ở Functions, không dùng biến `VITE_*`.

1. Giải nén và cập nhật mã nguồn của dự án Netlify hiện tại, bảo đảm các tệp mới trong `tests`, `lib`, `server` được đưa lên kho dự án.
2. Giữ build command `npm run build`, publish directory `dist`, Functions directory `netlify/functions`, Node 22 như `netlify.toml`.
3. Triển khai lại toàn bộ dự án. Chỉ kéo thư mục `dist` lên Netlify Drop sẽ không cập nhật các Functions.
4. Nếu triển khai bằng Netlify CLI trên máy đã đăng nhập, chạy từ thư mục dự án: `npm ci`, rồi `npx netlify-cli deploy --build --prod`. Kiểm tra chọn đúng dự án `tuduyhinhtoan8` trước khi triển khai; không tạo site mới.
5. Mở website, mở trang hướng dẫn `/huong-dan-api.html` để kiểm tra **Phiên bản 6.3.1**; nhập bài dưới đây và bấm **Xem hình & lý thuyết**. Hình này phải hiện ngay khi chưa kết nối AI.
6. Kết nối bằng mã lớp, kiểm tra một lượt gợi mở và một bài cần AI vẽ; đọc log Functions nếu còn lỗi. Bản sửa không bảo đảm mọi bài toán sẽ luôn hoàn tất trong giới hạn serverless.

## Bài kiểm tra

> Cho tam giác ABC có đường cao AI. Từ A kẻ tia Ax vuông góc với AC, từ B kẻ tia By song song với AC. Gọi M là giao điểm của tia Ax và tia By. Nối M với trung điểm P của AB, đường MP cắt AC tại Q và BQ cắt AI tại H. a) Tứ giác AMBQ là hình gì?

Hình xuất trực tiếp từ thành phần `DiagramSVG`: [SVG](v631-review/hinh-bai-toan.svg). Số liệu và danh sách điều kiện: [JSON](v631-review/kiem-tra-hinh.json). Đây là hình dựng bằng mã của bản sửa, không phải ảnh chụp website đã triển khai.

## Kiểm thử

`tests/v631-drawing.test.mjs` kiểm tra tọa độ và quan hệ bằng phép tính độc lập; đề đổi tên điểm, Unicode NFD, đề thiếu/mâu thuẫn và kết luận sai; cấu hình reasoning riêng; phân biệt lỗi mạng/timeout; deadline chung và timeout khi đọc response body. Kiểm thử API bản sửa dùng dữ liệu giả lập, không khẳng định đã gọi mô hình thật với mã mới.

Các kiểm tra hash của lần làm sạch 6.3.0 tiếp tục bảo vệ các tệp không sửa. Ba tệp được sửa có chủ đích (`server/openai.mjs`, `server/feature-api.mjs`, `.env.example`) được kiểm tra hành vi; hash gốc giữ trong lịch sử. Xem kết quả kiểm thử bàn giao trong thư mục `v631-review`.

## Tài liệu đối chiếu

- OpenAI, GPT-6 Luna: https://developers.openai.com/api/docs/models/gpt-6-luna
- OpenAI, hướng dẫn GPT-6: https://developers.openai.com/api/docs/guides/latest-model
- Netlify Functions, giới hạn thực thi đồng bộ 60 giây: https://docs.netlify.com/build/functions/configuration/

Không thay đổi mô hình thu thập khảo sát, thông tin tác giả hoặc chủ đích gợi mở sư phạm của dự án.
