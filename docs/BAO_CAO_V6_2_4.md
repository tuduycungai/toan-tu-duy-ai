# Báo cáo cập nhật V6.2.4

Phát triển tiếp trên V6.2.3 đã có, không viết lại dự án. Giữ React/Vite/TypeScript, Netlify Functions, Gemini API/biến môi trường, HOCGIOITOAN, dữ liệu bài mẫu, hồ sơ, nhận diện sáng/tối và giấy phép. ZIP V6.2.2 và V6.2.3 không bị ghi đè. Báo cáo này cập nhật các giới hạn trong báo cáo V6.2.3.

## Thay đổi chính

**Lỗi trong ảnh chụp:** đề hình thang đã có đủ yêu cầu “Tính độ dài các đoạn MI, IK, KN”, nhưng lỗi kiểm tra JSON hình học bị chuyển thành thông báo thiếu dữ kiện và chặn xác nhận. Bản sửa tách lỗi cấu trúc khỏi dữ kiện ảnh thực sự không rõ; giữ nguyên bản đọc và yêu cầu đã có. Nhấn xác nhận sẽ gọi Gemini kiểm tra lại cấu trúc một lần. Nếu đề không thay đổi và cấu trúc hợp lệ, tiếp tục vẽ ngay. Nếu vẫn lỗi, giữ đề, báo thử lại; không gọi vô hạn.

Chuẩn hóa ký hiệu tương đương (AB // CD và LaTeX parallel), tên điểm, các đoạn AD/MN/BD trong danh sách quan hệ và số ở dạng chuỗi. Chỉ chuẩn hóa cách biểu diễn, không tự thêm giả thiết. Vẫn chặn nguồn trích không khớp, tỉ lệ sai, thiếu vị trí điểm và dữ kiện thật sự nghi ngờ.

**Dựng hình:** giữ prompt người dùng cung cấp. Mở rộng bộ kiểm tra tọa độ để xử lý trung điểm/tỉ lệ bằng calc và giao điểm hai đường xác định; không ép Gemini phải tự viết tọa độ thập phân cho mọi điểm. Bộ phân tích chỉ tính một tập biểu thức số hữu hạn, không dùng eval. Mẫu hình thang đã qua bảy kiểm tra quan hệ và biên dịch thật; nhãn A/B/C/D/M/N/I/K tách rõ, chỉ ghi độ dài đã cho, chưa ghi đáp số cần tìm.

Trang https://hotrohoctap.com/1ai/6tikz/ đã được xem: giao diện tách liên kết tạo mã bằng Gemini và bước biên dịch với lựa chọn LuaLaTeX/XeLaTeX/pdfLaTeX. Không sử dụng backend của trang đó; không lấy việc xem trang làm bằng chứng độ chính xác. Ứng dụng tiếp tục dùng TikZJax tự lưu trữ, tương thích kiến trúc Netlify hiện có.

**Điện thoại:** bộ nạp cũ giữ nhiều bản sao của core TeX giải nén 163.840.000 byte. Bản vá giải nén theo luồng vào chính vùng nhớ WASM cố định, bỏ bản sao core dự phòng; dừng worker ngay khi có SVG, giải phóng iframe, chỉ cho một tác vụ biên dịch hoạt động. Đây là giảm cấp phát theo mã nguồn, chưa phải phép đo RAM trên iPhone thật.

Ảnh được đọc phần header trước khi giải mã; điện thoại giới hạn 16 triệu điểm ảnh, cạnh dài sau xử lý tối đa 2.200 px, ảnh xem trước 720 px bằng object URL. Dữ liệu ảnh lớn được bỏ sau bước đọc, URL/canvas/bitmap được thu hồi; PNG điện thoại rộng 1.280 px. Tác vụ tạm dừng khi chuyển ứng dụng/tab. Bản đề chưa bắt đầu học được giữ cùng token ký để khôi phục sau tải lại, không lưu ảnh gốc hoặc tự nạp TeX. Khi đã bắt đầu học, dùng bộ khôi phục hội thoại hiện có để giữ tiến trình, tránh bắt đầu bài từ đầu. Lưu phiên theo nhịp 400 ms và khi rời trang.

**Khảo sát:** đồng hồ và toàn bộ lời nhắc trên giao diện đổi thành 13 phút (780.000 ms). Giữ điều kiện sau kết nối/hồ sơ, hoãn khi đang bận hoặc ở nền, không tự gửi khảo sát.

## Kiến trúc và trạng thái

Ảnh → kiểm tra/nén ở trình duyệt → Gemini đọc theo schema → chuẩn hóa/kiểm tra có nguồn → học sinh xác nhận → Gemini tạo TikZ → kiểm tra mã và tọa độ → worker TeX/WASM → SVG được làm sạch → đề, hình, lý thuyết → xác nhận hình → gia sư tám giai đoạn.

`structureStatus` phân biệt `validated` và `needs_repair`; `ready` chỉ do máy chủ quyết định. Token ảnh/trạng thái hội thoại có chữ ký HMAC, hết hạn 12 giờ. Khôi phục ảnh dùng endpoint có xác thực hiện có và kiểm chữ ký, không gọi Gemini. Trạng thái trong token có thể đọc, không phải dữ liệu được mã hóa.

Cơ chế gia sư 12 phân loại và tám giai đoạn của V6.2.3 được giữ: giai đoạn, kết luận đã chứng minh có trích dẫn, lỗi, mức gợi ý, hướng giải, bằng chứng năng lực và lịch sử câu hỏi. Không đổi cách giải hợp lệ thành sai chỉ vì khác mẫu; chỉ mở tổng hợp ở giai đoạn 7 khi đủ chứng minh. Đã chạy lại bộ kiểm thử điều khiển; đánh giá ngữ nghĩa Gemini thật vẫn cần nghiệm thu riêng.

## Bảo mật biên dịch

Giữ danh sách lệnh/gói/thư viện cho phép, chặn shell escape, truy cập tệp/mạng và macro tùy ý; giới hạn 18.000 ký tự đầu vào, 36.000 sau mở rộng, 800 lệnh vẽ, độ sâu 60 và samples ≤ 200. Giữ WASM cố định 2.500 trang (156,25 MiB); đây không phải tổng RAM của tab. Timeout engine/frame/bên gọi là 25/30/35 giây. Sinh mã một lần, sửa tối đa hai lần với lỗi cụ thể.

SVG được lọc trước khi hiển thị/tải; CSP và kiểm tra nguồn message giữ nguyên. Không thêm khóa hoặc dịch vụ biên dịch. Dependency TikZJax vẫn khóa 1.6.0; patch dừng build nếu cấu trúc upstream không khớp. Giấy phép cũ giữ nguyên, có ghi chú sửa thư viện và mã nguồn patch trong gói.

## Tệp đã thêm/sửa

| Nhóm | Tệp |
|---|---|
| Sửa máy chủ | server/image-policy.mjs; server/feature-api.mjs; server/geometry-checks.mjs; server/tikz-image-prompt.mjs |
| Thêm chuẩn hóa/tọa độ | server/reading-normalization.mjs; server/tikz-coordinates.mjs |
| Sửa giao diện và phiên | app/page.tsx; components/image-problem.tsx; components/tikz-figure.tsx; lib/image-input.ts; lib/image-workflow.ts; lib/tikz-compiler.ts; lib/diagram-export.ts; lib/use-survey-reminder.ts |
| Thêm tiện ích | lib/device-budget.ts; lib/image-session.ts; lib/use-blob-url.ts |
| Sửa runtime/build | public/tikz-init.js; public/tikz-frame.html; public/tikz-frame.js; public/tikz/run-tex.js; public/tikz/run-tex.min.js; scripts/prepare-tikz.mjs |
| Thêm patch có mã nguồn | scripts/tikz-core-stream.mjs; scripts/patch-tikz-memory.mjs |
| Thêm kiểm thử | tests/v624-recovery.test.mjs; tests/v624-memory.test.mjs; scripts/check-v624-ui.mjs; tests/fixtures/v624-data.mjs; tests/fixtures/trapezoid-v624.tex; hai ảnh fixture v624 |
| Sửa kiểm thử tích hợp | tests/load-ts.mjs; tests/v61-component.test.mjs; tests/survey-preserved.test.mjs; tests/survey-reminder.test.mjs; tests/survey-component.test.mjs; scripts/check-v6-ui.mjs; scripts/check-v623-ui.mjs |
| Phiên bản/tài liệu | package.json; package-lock.json; README.md; THIRD_PARTY/TIKZJAX-V6_2_4-MODIFICATIONS.md; docs/*V6_2_4*; qa-results/v6.2.4/* |

Danh sách đầy đủ và SHA-256: `docs/THAY_DOI_TEP_V6_2_4.json`. Không thêm dependency sản phẩm. Kiểm thử bảo toàn chỉ đổi ngoại lệ cho component dùng chung compiler; các tệp bảo vệ khác vẫn kiểm tra nguyên trạng.

## Kết quả thực tế

Node 24.19.0, npm 11.9.0, Chromium 131, Playwright 1.62.1. Netlify vẫn cấu hình Node 22 như trước.

| Kiểm tra | Kết quả |
|---|---|
| npm ci --ignore-scripts --no-audit --no-fund | Thành công, 273 package; prebuild được chạy trong build |
| Lint / typecheck | Pass, exit 0 |
| npm test | 502 ca: 501 pass, 0 fail, 1 skip Gemini live; gồm 11 ca V6.2.4 mới |
| Production build | Pass; chunk JS 760,80 kB, gzip 234,73 kB, còn cảnh báo vượt 500 kB |
| TeX/WASM | 6/6 fixture cũ biên dịch thật; thêm hình thang qua UI thật |
| UI cũ / ảnh V6.2.3 / V6.2.4 | 7/7, 12/12 và 11/11 mục đạt |
| Khảo sát | Timer/component kiểm tra mốc 13 phút, hoãn và không tự gửi |

Bằng chứng mới: `qa-results/v6.2.4/`. Phản hồi Gemini trong các kiểm thử là fixture có kiểm soát; xử lý ảnh, TeX, SVG, xuất PNG và thao tác trình duyệt chạy thật. Kiểm tra nguồn/đóng gói ở `source-audit.json`, `archive-validation.json`. Cảnh báo npm http-proxy và thông báo đường public khi chạy Vite dev thuộc môi trường kiểm thử, không phải lỗi production.

## Giới hạn còn lại

Chưa có khóa Gemini thật, chưa kiểm tra OCR/nhận định sư phạm/sinh hình của mô hình thật, Safari/iPhone/Android vật lý hoặc triển khai Netlify thực tế. Viewport 390/412 px và user agent iPhone trong Chromium không thay thế máy thật. Không thể khẳng định đã hết mọi tình trạng “out”; WASM vẫn cần 156,25 MiB cộng tài nguyên trang và cần nghiệm thu trên điện thoại đang gặp lỗi.

Không hỗ trợ toàn bộ PGFPlots hoặc mọi chương trình LaTeX; đồ thị đơn giản dùng TikZ plot. Bộ kiểm tra số chưa chứng minh tất cả nét vẽ/nhãn đúng. Hai fixture cũ còn nhãn H hoặc A/B sát dấu/nét như báo cáo V6.2.3; bản hình thang mới đã kiểm tra trực quan riêng. Ảnh mờ/chữ quá nhỏ vẫn cần xác nhận/chụp lại; hết hạn token/đổi khóa/xóa dữ liệu trình duyệt có thể mất khả năng tiếp tục phiên. Khôi phục giữ văn bản/trạng thái, không giữ ảnh gốc hay hình đã biên dịch.

Gói phát hành không chứa node_modules, dist, .env thật, cache hoặc log chứa khóa. Tài nguyên runtime, giấy phép, mã nguồn và bằng chứng QA được giữ. Chưa xuất bản thay website đang chạy.
