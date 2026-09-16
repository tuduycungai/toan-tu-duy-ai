# Danh sách tệp thay đổi V5

So sánh theo byte/SHA-256 với ZIP gốc. Không xóa tệp mã nguồn. Output build được tạo lại tự động.

## 17 tệp có sẵn được sửa

| Tệp | Nội dung |
|---|---|
| `README.md` | Thêm hướng dẫn V5 và giữ toàn bộ tài liệu gốc. |
| `package.json` | Phiên bản 5.0.0, lệnh kiểm thử mới, Playwright cho kiểm thử UI. |
| `package-lock.json` | Khóa phiên bản tương ứng; không thay dependency chạy ứng dụng. |
| `tests/load-ts.mjs` | Loại import chỉ dùng cho kiểu trước khi nạp đồ thị module kiểm thử. |
| `tests/preserved.test.mjs` | Ghi rõ lib/tutor.ts là điểm tích hợp được thay đổi; tiếp tục kiểm tra byte/hash các phần còn lại. |
| `lib/problem-diagram.ts` | Chuẩn hóa LaTeX/Unicode, tâm, đoạn nối/đường phụ và cập nhật đề theo lượt. |
| `lib/geometry.ts` | Bổ sung kiểu đường tròn/tia, vẽ đường qua điểm khi chưa cắt đủ cạnh, xuất đường tròn trong TikZ. |
| `lib/tutor.ts` | Bổ sung mức Mất căn bản và lớp học trong ngữ cảnh; giữ cơ chế tạo lịch sử. |
| `lib/midpoint-language.ts` | Nhận cụm theo thứ tự ở các dạng mô tả trung điểm. |
| `lib/theory.ts` | Kiến thức đường tròn/tiếp tuyến, thẻ có điều kiện và chọn/xếp hạng theo mô hình. |
| `app/enhancements.css` | Mở rộng bố cục gọn, điện thoại, chân trang, hồ sơ và hình; không xóa stylesheet gốc. |
| `app/page.tsx` | Tích hợp xem hình trước API, hồ sơ/hội thoại, lịch sử thu gọn, chân trang. |
| `server/policy.mjs` | Prompt mở rộng hình học THCS và dữ liệu cá nhân hóa. |
| `server/learner-guidance.mjs` | Tương thích nhãn Mất căn bản với hồ sơ cũ. |
| `server/strict-tutor.mjs` | Không coi metadata V5 là câu trả lời học sinh. |
| `components/theory-panel.tsx` | Tiêu đề bắt buộc, thẻ thu gọn và trường sư phạm bổ sung. |
| `components/problem-figure.tsx` | Mô hình mới, hình tạm, nhãn, xuất PNG/SVG/TikZ, zoom, chỉnh dữ kiện. |

## Các tệp nguồn/kiểm thử mới

| Tệp | Vai trò |
|---|---|
| `lib/geometry-model.ts` | Mô hình hình học, bộ đọc đường tròn/tia và hình tạm. |
| `lib/diagram-export.ts` | SVG tự chứa style và PNG từ canvas. |
| `lib/adaptive-learning.ts` | Chẩn đoán, quan sát, cá nhân hóa và nhật ký. |
| `components/learner-panel.tsx` | Hồ sơ, chẩn đoán và chỉnh mức. |
| `server/adaptive-policy.mjs` | Phiên bản prompt và cá nhân hóa an toàn. |
| `tests/v5-geometry.test.mjs` | Ca hình học, lỗi đọc, lý thuyết và tình huống âm. |
| `tests/v5-learning.test.mjs` | Ca phân loại, hỗ trợ, nhật ký và metadata. |
| `scripts/check-v5-ui.mjs` | Kiểm thử trình duyệt, xuất ảnh, màn hình nhỏ và chân trang. |

## Tài liệu và minh chứng mới

`BAO_CAO_BAN_GIAO_V5.md`; các tài liệu `docs/V5_*.md`; toàn bộ log, JSON, ảnh, SVG và snapshot prompt trong `research/v5-checks/`.

## Tệp quan trọng đối chiếu không đổi

| Tệp | Kiểm tra |
|---|---|
| `lib/worksheets.ts` | SHA-256 bằng bản gốc |
| `lib/worksheet-geometry.ts` | SHA-256 bằng bản gốc |
| `lib/learning.ts` | SHA-256 bằng bản gốc |
| `server/gemini.mjs` | SHA-256 bằng bản gốc |
| `server/feedback.mjs` | SHA-256 bằng bản gốc |
| `netlify/functions/chat.mjs` | SHA-256 bằng bản gốc |
| `netlify/functions/feedback.mjs` | SHA-256 bằng bản gốc |
| `netlify.toml` | SHA-256 bằng bản gốc |
| `scripts/start.mjs` | SHA-256 bằng bản gốc |
| `.env.example` | SHA-256 bằng bản gốc |
