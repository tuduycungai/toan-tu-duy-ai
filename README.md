# Tư duy Toán học — V6.3.0

Bản nâng cấp từ **TU-DUY-TOAN-HOC-V6_2_4-BAN-TRIEN-KHAI.zip** theo hai yêu cầu: kết nối OpenAI và giữ hình khi trao đổi tiếp.

## Bắt đầu

Mở `public/huong-dan-api.html` để xem hướng dẫn cho giáo viên, hoặc truy cập `/huong-dan-api.html` sau triển khai. Tóm tắt cũng có ở `HUONG_DAN.md`.

- **Không cần API:** xem bài mẫu, lý thuyết và hình thuộc các dạng bộ dựng cục bộ đã đối chiếu được.
- **Dùng OpenAI:** đặt các biến môi trường bên dưới ở máy chủ/Netlify Functions. API có phí riêng, không nằm trong ChatGPT Plus.
- **Giữ Gemini cũ:** đặt `AI_PROVIDER=gemini`; khóa và mô hình Gemini vẫn hoạt động theo cấu hình cũ. Không tự chuyển nhà cung cấp hoặc tăng mức phí khi có lỗi.

```dotenv
AI_PROVIDER=openai
OPENAI_API_KEY=YOUR_SERVER_SIDE_KEY
OPENAI_MODEL=gpt-6-luna
OPENAI_REASONING_EFFORT=medium
ACCESS_CODE=HOCGIOITOAN
```

`gpt-6-luna` là mặc định tiết kiệm; `gpt-6-sol` cân bằng năng lực/chi phí; `gpt-6-astra` ưu tiên năng lực cho bài khó. Cả ba đều tính phí. Mô hình được chọn ở máy chủ, học sinh không tự nâng lên mô hình đắt hơn. Danh mục được kiểm tra theo tài liệu OpenAI ngày 22/9/2026; quyền truy cập tùy tài khoản. Không có tuyên bố mô hình nào đã được kiểm nghiệm là tốt nhất cho mọi bài toán của ứng dụng này.

## Hành vi hình vẽ

1. Hình cục bộ đã đối chiếu giả thiết được ưu tiên; không gọi AI để vẽ các hình này.
2. Đề cần AI có hình dựng lần đầu. Máy tính có thể dựng khi mở đề và kết nối; điện thoại nhấn **Vẽ hình**.
3. Trả lời, xin gợi ý và kiểm tra bước làm giữ nguyên hình. Câu kết luận của học sinh không tự biến thành đề mới.
4. **Vẽ lại hình** chỉ kích hoạt một lượt dựng lại, không kéo theo vẽ lại ở các lượt chat sau. Hình cũ vẫn hiển thị trong lúc chờ; nếu dựng thất bại, hình cũ còn nguyên.
5. Đổi đề hoặc chủ động sửa/bổ sung dữ kiện cập nhật hình. Chọn **Bài mới** hoặc nhập “Cho…”, “Xét…”, “Bài mới…” để bắt đầu đề khác.
6. Tối đa ba hình SVG/TikZ gần nhất được giữ trong bộ nhớ phiên của cùng tab, tối đa 12 giờ theo bản lưu; không lưu khóa API. Dung lượng trình duyệt có thể giới hạn khôi phục. Tải PNG/SVG nếu cần lưu lâu dài.

## Chạy trên máy

Cần Node.js >= 22.13. Sao chép `.env.example` thành `.env` và điền cấu hình máy chủ.

```sh
npm ci
npm start
```

Mở `http://localhost:3000`. `npm run dev` chỉ phục vụ giao diện; `npm start` có thêm API cục bộ.

## Cập nhật Netlify

Dùng toàn bộ thư mục mã nguồn này. Build command: `npm run build`; publish: `dist`; functions: `netlify/functions`. Giữ cấu hình trong `netlify.toml`, đặt biến môi trường phạm vi Functions rồi triển khai lại. Chỉ kéo `dist` lên sẽ không đủ cho hội thoại AI/đọc ảnh/dựng AI. Không đặt khóa trong `VITE_*`, mã giao diện hoặc tệp ZIP chia sẻ.

## Kiểm tra

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run test:ui:v630
```

UI test cần Chromium của Playwright; có thể chỉ định `CHROMIUM_EXECUTABLE`. Các kiểm thử OpenAI/Gemini dùng phản hồi mô phỏng, không phát sinh API trả phí. Xem `docs/BAO_CAO_V6_3_0.md` cho kết quả và giới hạn nghiệm thu.

## Tài liệu

- `public/huong-dan-api.html`: lấy API, chọn mô hình, cấu hình và cách dùng hình.
- `docs/BAO_CAO_V6_3_0.md`: thay đổi và kiểm thử.
- `docs/THAY_DOI_TEP_V6_3_0.json`: đối chiếu tệp với ZIP gốc.
- `docs/HISTORIQUE_AVANT_V6_3.md`: README các bản cũ, chỉ để tham khảo lịch sử.

Bản mới giữ trọng tâm **hình học THCS, nhất là tứ giác lớp 8** và cách học gợi mở. Việc đổi API không biến ứng dụng thành công cụ giải mọi chuyên đề toán. Các văn bản V6.2.x trong `docs/` là hồ sơ lịch sử, không thay thế hướng dẫn V6.3.0.
