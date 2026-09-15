# Danh sách thay đổi từ ZIP V4.4 sang V5

Đối chiếu trực tiếp với 492 tệp trong ZIP đầu vào. Sau build: **467 tệp giữ nguyên từng byte**, 20 tệp thay đổi (19 tệp nguồn/test/tài liệu dưới đây và `dist/index.html`), 5 tài sản build mang tên hash cũ được Vite thay bằng tài sản build mới. **Không xóa tệp mã nguồn nào.** Tài sản build cũ vẫn khôi phục được từ ZIP gốc; không chỉnh ZIP gốc.

## Tệp cũ đã chỉnh

| Tệp | Thay đổi |
| --- | --- |
| `app/page.tsx` | Ghép tiến trình vào hồ sơ/chat; xem hình/lý thuyết cục bộ; giữ đề hiện tại khi chọn câu trong bộ đề; thêm footer tên tác giả/hướng dẫn; giữ các màn/chế độ/chức năng cũ |
| `app/globals.css` | Chỉ thêm style cho hình tạm, thu/phóng, hồ sơ, lý thuyết và footer; giữ nguyên tiền tố CSS cũ |
| `components/problem-figure.tsx` | Dùng mô hình V5, nhãn/bounding/circle/ray/mark; hình tạm/sửa dữ kiện; redraw/zoom; logic tải PNG/SVG; giữ TikZ và chọn hình phiếu |
| `components/theory-panel.tsx` | Mục lý thuyết luôn có, điều kiện/liên hệ/lỗi/thao tác/ví dụ và phân hóa mức hỗ trợ |
| `lib/geometry.ts` | Thêm dữ liệu đường tròn/tia/góc; đường kéo dài có phạm vi vẽ; xuất TikZ tương thích |
| `lib/problem-diagram.ts` | Unicode/LaTeX/viết tắt; tâm tứ giác; nối điểm; solver/kiểm tra và bám đúng đề của lượt |
| `lib/midpoint-language.ts` | Ghép trung điểm theo thứ tự, không hoán đổi E/F |
| `lib/point-language.ts` | Nhận mẫu điểm theo thứ tự không bắt buộc từ “lấy” |
| `lib/learning.ts` | Loại metadata TU_DUY khỏi phần văn bản hiển thị; giữ bài mẫu và các chế độ |
| `lib/theory.ts` | Chọn động theo đề chuẩn hóa, thêm kiến thức đường tròn/đồng dạng/fallback; cấu trúc TheoryUnit; không phát thẻ tự do của AI |
| `lib/tutor.ts` | Tóm tắt tiến trình không gồm trường định danh; khối lớp và dữ liệu nền; tương thích hồ sơ cũ, khôi phục tiến trình hỏng |
| `server/gemini.mjs` | Ghép nhánh V5 và ranh giới không trả lời cả bài; giữ xác thực/giới hạn/yêu cầu nhà cung cấp |
| `server/learner-guidance.mjs` | Mức gọi trung tính, yêu cầu minh chứng tích lũy |
| `server/policy.mjs` | Mở phạm vi hình học THCS, ghép prompt metadata/nguồn nghiên cứu; giữ cấm đáp án |
| `tests/gemini.test.mjs` | Assertion đầu ra theo hợp đồng trình bày mới; giữ các kiểm tra vận chuyển/API key/lỗi |
| `tests/policy.test.mjs` | Giữ kiểm tra lịch sử/prompt nhưng không còn yêu cầu chuyển nguyên văn phản hồi model |
| `tests/tutor.test.mjs` | Loader hỗ trợ import module hồ sơ mới; giữ bốn kiểm tra cũ |
| `tests/preserved.test.mjs` | Ghi rõ ngoại lệ tích hợp được phép và đảo các tích hợp server để tiếp tục kiểm tra hash phần bất biến |
| `README.md` | Thêm cửa vào V5 và giới hạn; bảo toàn hướng dẫn V4.4 trong phần lịch sử |

Không cần sửa `lib/line-language.ts` và `lib/diagram-interpretation.ts`; chức năng của chúng được tái sử dụng. Không sửa `lib/worksheets.ts`, `lib/worksheet-geometry.ts`, `components/learning-visuals.tsx`, cấu hình Forms, Netlify, package/lockfile so với ZIP V4.4.

## Tệp nguồn mới

| Tệp | Vai trò |
| --- | --- |
| `lib/geometry-model.ts` | Mô hình trung gian, biên dịch, kiểm tra độc lập và hình tạm |
| `lib/geometry-constraints.ts` | Solver tọa độ số có ràng buộc và kiểm tra sau giải |
| `lib/learner-model.ts` | Minh chứng, chẩn đoán, phân loại tích lũy, override, khôi phục hồ sơ |
| `components/learner-panel.tsx` | Tiến trình, chẩn đoán từng câu, điều chỉnh, tải JSON |
| `server/adaptive-protocol.mjs` | Prompt version, schema và sửa/kiểm tra JSON |
| `server/adaptive-api.mjs` | Gọi API có thử lại/hạn thời gian/fallback không chấm điểm |
| `server/output-boundary.mjs` | Chỉ cho phép nhiệm vụ gợi mở/đề bài đã kiểm soát, không phát lời giải tự do |
| `server/practice-bank.json` | Bản chiếu chỉ gồm đề từ 87 bài hiện có, không phải ngân hàng giả |
| `scripts/export-practice-bank.mjs` | Tái tạo bản chiếu từ nguồn bài cũ |
| `scripts/check-v5-render.mjs` | Render React/SVG mười ca, xuất mô hình/ảnh/tổng hợp |
| `scripts/verify-v5.mjs` | Test, report từng ca, tsc, build, render, HTTP smoke |
| `scripts/source-integrity-v5.mjs` | So sánh SHA-256 với cây gốc (cần cây gốc ở đường dẫn ghi trong script) |
| `tests/v5-geometry.test.mjs` | Ca hình học, lý thuyết, Unicode/LaTeX, mô hình sai/thiếu |
| `tests/v5-learner.test.mjs` | Năng lực nhiều minh chứng, override, riêng tư, tiến trình dài/hỏng |
| `tests/v5-api.test.mjs` | Schema, retry, fallback, lỗi, khóa/metadata |
| `tests/v5-boundary.test.mjs` | Không phát cả bài, bốn mức, bộ đề/chọn bài/tên tác giả |

## Tài liệu và kết quả sinh ra

Tài liệu mới trong `docs/v5/`: `BAN_GIAO_V5.md`, `THAY_DOI.md`, `DOC_DE_VA_DUNG_HINH.md`, `PHAN_LOAI_HOC_SINH.md`, `GOI_MO_TU_DUY.md`, `LY_THUYET_DONG.md`, `NHAT_KY_PROMPT_MODEL.md`, `BAO_CAO_KIEM_THU.md`.

`research/v5-checks/` chứa log test/tsc/build/render, JSONL từng ca, JSON tổng hợp và mười HTML/SVG/PNG, mô hình ca chính, log khởi chạy trình duyệt thất bại. `SOURCE_INTEGRITY.json` liệt kê chính xác tệp/hash trước–sau, tệp mới và tài sản build được thay. Những báo cáo/ảnh cũ giữ nguyên để bảo toàn lịch sử, không gán nhãn thành kết quả V5.

Không đóng gói `node_modules`, trình duyệt tải thử, dữ liệu tạm hoặc khóa API thật. Không thay đổi nền tảng triển khai và chưa phát hành lên website công khai.
