# Bàn giao AI TUTOR TỨ GIÁC PRO V5

**Ngày:** 16/09/2026  
**Nguồn:** dự án trong `(Hoàn chỉnh)Hoc tứ giác Toán 8 qua các thao tác tư duy.zip` do người dùng cung cấp.  
**Cách thực hiện:** chỉnh sửa kế thừa mã nguồn, không dựng lại website và không thay API Gemini/backend vận chuyển.

## 1. Kết quả chính

Đã sửa lỗi đúng bài trong ảnh: “Cho hình bình hành ABCD tâm O, E và F theo thứ tự là trung điểm OD và OB. Chứng minh AE // CF.” Hệ thống xác định O bằng giao AC và BD, đặt E/F đúng đoạn, vẽ AE/CF và giữ mục tiêu tách khỏi giả thiết. Không yêu cầu nhập lại từng giả thiết của đề này.

Các nâng cấp được tích hợp vào giao diện hiện có:

- Chuẩn hóa tiếng Việt, Unicode/LaTeX và nhiều dòng; đọc thêm “theo thứ tự”, “tâm O”, đoạn nối, đường phụ, đường tròn/bán kính/tiếp tuyến ở các cấu hình được hỗ trợ.
- Mô hình hình học trung gian có đối tượng, quan hệ, giả thiết, mục tiêu, đường phụ, giả định, phần chưa rõ và mức độ xử lý. Có thể tải JSON để kiểm tra.
- Giữ hình cơ sở/hình tạm khi đề chưa đọc hết, hiển thị rõ phần chưa xác nhận; sửa dữ kiện rồi dựng lại.
- Phóng to/thu nhỏ thật, tải PNG/SVG, giữ xuất TikZ; nhãn điểm và dấu quan hệ được dựng từ tọa độ.
- Xem hình và **LÝ THUYẾT DỰ KIẾN DÙNG** ngay cả khi chưa kết nối AI. Thẻ lý thuyết có điều kiện, liên hệ với bài, lỗi cần tránh, thao tác tư duy và ví dụ.
- Hồ sơ học sinh với lớp, mức tự tin, kiến thức nền, bốn câu chẩn đoán thuộc bốn phương diện và chỉnh mức thủ công. Không tự phân loại từ một câu trả lời.
- Cập nhật quan sát/hỗ trợ qua hội thoại, lưu câu hỏi thực tế và siêu dữ liệu tư duy. Giữ nguyên định hướng gợi mở, không phát lời giải hoàn chỉnh.
- Thu gọn lý thuyết chi tiết, giả định, nhật ký và các lượt trao đổi cũ; hình không bị giữ trong vùng chat cuộn nhỏ. Đã kiểm tra màn hình 360, 390 và 768 px.
- Chân trang ghi đúng **Phan Trí Dũng**, **Phạm Nam Hải**, **Giáo viên hướng dẫn: GV. Trần Ngọc Phú Sang**.

## 2. Những phần được bảo toàn

Giữ 87 bài trong ngân hàng, các chế độ học, sơ đồ định hướng, gợi mở, kiểm tra lời giải, tự kiểm tra, sáng/tối và các luồng đánh giá/phản hồi. Không xóa tệp mã nguồn gốc.

Đã đối chiếu SHA-256 với bản ZIP ban đầu: ngân hàng bài, các bài mẫu, mã gọi Gemini (`server/gemini.mjs`), endpoint Netlify, phản hồi, cấu hình Netlify, server khởi chạy và `.env.example` không đổi. Chỉ mở rộng prompt/chính sách học tập; model mặc định vẫn `gemini-2.5-flash` và tiếp tục nhận ghi đè qua `GEMINI_MODEL`.

17 tệp có sẵn được chỉnh sửa; các mô-đun mới bổ sung riêng. `dist` được sinh lại bằng `npm run build`, không sửa thủ công các bundle. Danh sách chi tiết ở `docs/V5_CHANGED_FILES.md`; chứng cứ hash ở `research/v5-checks/source-integrity.json`.

## 3. Kiểm thử thực tế

| Hạng mục | Kết quả |
|---|---|
| `npm run build` | Đạt |
| `npx tsc --noEmit` | Đạt |
| `npm test` | **381 đạt, 0 lỗi, 1 bỏ qua**; tổng 382 ca |
| `npm run test:v5` | **34/34 đạt**; nằm trong tổng trên |
| Trình duyệt V5 | **17 nhóm kiểm tra đạt**, không có lỗi JavaScript |
| Luồng giao diện cũ | Đạt: kết nối, hồ sơ, các chế độ, đánh giá, fallback, lỗi mạng, riêng tư, lưu dữ liệu, sáng/tối, màn hình nhỏ |
| 10 nhóm đề bắt buộc | Đạt kiểm tra theo từng nhóm; bài thiếu dữ kiện dùng hình tạm có cảnh báo |

PNG tải từ giao diện được kiểm tra đúng định dạng, kích thước 1680×1215. SVG chứa tọa độ, nhãn và style nhúng. Kiểm tra zoom xác nhận kích thước hình tăng thật. Đã xem ảnh kết quả để rà soát bố cục, nhãn, hình đường tròn và chân trang.

**Quan trọng:** kiểm thử UI dùng Chromium thật nhưng phản hồi Gemini/Forms giả lập. Ca gọi Gemini thật được bỏ qua do chưa có khóa API cấu hình cho kiểm thử trực tiếp; không có thao tác triển khai lên website Netlify hiện tại. Build còn cảnh báo bundle lớn hơn 500 kB.

## 4. Giới hạn chưa được giải quyết hoàn toàn

Không tuyên bố V5 dựng chính xác **mọi** bài hình học THCS nhập tự do. Bộ đọc/giải ràng buộc chưa bao quát mọi số đo góc, điểm có chỉ số/dấu phẩy, nhiều đường tròn cắt nhau hay mọi tiếp tuyến từ điểm ngoài. Những trường hợp này được đưa về hình tạm, không xác nhận sai là hoàn chỉnh.

Phân loại từ bốn câu chẩn đoán là gợi ý sư phạm ban đầu, chưa phải thang đo năng lực đã được kiểm định. Quan sát văn bản không tự chấm đúng toán học. Lý thuyết được chọn động từ danh mục và mô hình đã đọc; không phải hệ thống sinh/kiểm chứng mọi định lý. Chất lượng và mức tuân thủ prompt của Gemini thật vẫn cần thử với cấu hình triển khai của giáo viên.

Như vậy, lỗi cụ thể và các tính năng nêu trên đã được sửa/tích hợp/kiểm thử; yêu cầu tuyệt đối “bất kỳ đề nào cũng dựng đầy đủ, chính xác” chưa được đáp ứng hoàn toàn.

## 5. Đủ các phần bàn giao trong ZIP

| Yêu cầu | Tệp/thư mục |
|---|---|
| ZIP phiên bản mới và mã nguồn kế thừa | `AI-TUTOR-TU-GIAC-PRO-V5.zip`, chứa toàn bộ dự án V5 |
| Danh sách thay đổi | `docs/V5_CHANGED_FILES.md` |
| Mô tả chức năng mới | Báo cáo này, `README.md` |
| Quy trình đọc đề/dựng hình | `docs/V5_GEOMETRY.md` |
| Phân loại học sinh | `docs/V5_LEARNER.md` |
| Câu hỏi theo thao tác tư duy | `docs/V5_THINKING.md` |
| Cơ chế lý thuyết động | `docs/V5_THEORY.md` |
| Báo cáo kiểm thử | `docs/V5_TEST_REPORT.md`, log và JSON trong `research/v5-checks/` |
| Ảnh hình học | `research/v5-checks/01-hinh-binh-hanh.png`, `03-export.png`, `05-dark-geometry.png`, `07-circle.png` |
| Ảnh chân trang | `research/v5-checks/09-footer-desktop.png`, `11-footer-mobile.png` |
| Nhật ký prompt/model | `docs/V5_PROMPT_MODEL.md`, 12 snapshot cùng manifest tại `research/v5-checks/prompts/` |

Các tài liệu PDF đã được đọc và vận dụng để tổ chức câu hỏi và mức hỗ trợ; không dùng chúng làm bằng chứng đã kiểm định hiệu quả học tập của phần mềm.

## 6. Chạy và triển khai

Giải nén, dùng Node.js từ 22.13.0, chạy `npm ci`, `npm run build`, `npm start`. Muốn kiểm thử giao diện, chạy thêm `npx playwright install chromium` rồi `npm run test:ui` và `npm run test:ui:legacy`.

Giữ các biến môi trường và cấu hình Netlify hiện có; không đưa khóa Gemini vào frontend. Triển khai từ toàn bộ mã nguồn để build và Functions được tạo đúng. Đọc `README.md` và các hướng dẫn gốc vẫn được giữ trong dự án. Phiên bàn giao này chỉ tạo tệp, không thay đổi website đang chạy.
