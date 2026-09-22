# Bảng kiểm thử V6.2.3

**Phạm vi:** đã chạy kiểm thử mã và trình duyệt thực tế. Các phản hồi Gemini của unit/integration/UI là fixture có kiểm soát; không dùng kết quả này để khẳng định Gemini thật đã hiểu đúng đề hoặc lời học sinh. Pass ở bảng điều khiển dưới đây là pass hợp đồng trạng thái/luồng, không phải đánh giá ngữ nghĩa mô hình.

Môi trường: Node 24.19.0, npm 11.9.0, Chromium 131, Playwright 1.62.1. Tổng unit/integration: 491 ca, 490 pass, 0 fail, 1 skip. Bộ mới có 48 ca. UI mới có 12 mục kiểm tra; bộ biên dịch có sáu fixture chạy thật.

## A. Hội thoại và trạng thái

| Mã ca kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Pass/Fail | Ghi chú hoặc bằng chứng lỗi |
|---|---|---|---|---|---|
| TUT-01 | Đúng đủ; M thuộc AB và AM = MB | Chấp nhận bước đúng, giữ một câu hỏi | Đã giữ kết luận với trích dẫn; không lộ nhãn | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-02 | Đúng một phần: AM = AB/2 | Chưa nâng thành chứng minh đầy đủ | Không thêm kết luận đã chứng minh; lưu trạng thái thiếu | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-03 | Dùng trung điểm nhưng chưa nêu điều kiện | Giữ ý tưởng, không chấp nhận thiếu căn cứ | Ghi thiếu căn cứ; chưa mở tổng hợp | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-04 | Coi trung điểm là giả thiết sẵn có | Nhận nhầm giả thiết/kết luận | Điều khiển trạng thái nhầm giả thiết đúng hợp đồng | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-05 | Hai cạnh bằng nhau suy ra hình bình hành | Không chấp nhận định lý sai | Không lưu kết luận; ghi lỗi cần đối chiếu | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-06 | Dùng kết luận chứng minh chính kết luận | Chặn suy luận vòng | Không lưu kết luận chưa có căn cứ | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-07 | 2AM = AB suy ra AM = AB | Giữ lỗi tính toán để sửa | Phân loại nội bộ được nhận, không lộ nhãn | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-08 | “Chỗ đó bằng nhau” | Hỏi nhỏ, không tự tiến | Giữ giai đoạn, chưa thêm chứng minh | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-09 | Cách khác hợp lệ: cộng đoạn AB = AM + MB | Chấp nhận hướng hợp lệ | Giữ kết luận và hướng, không ép mẫu | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-10 | Xin đáp án ngay | Không mở tổng hợp | Không vào giai đoạn 7 | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-11 | Không liên quan | Giữ mục tiêu, không tự tiến | Giai đoạn không tăng theo phản hồi | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-12 | Câu có nhiều cách hiểu về vị trí M | Chưa suy đoán | Giữ giai đoạn và một câu hỏi | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-13 | Xin đáp án 10 lượt | Gợi ý tăng có trần, không lộ tổng hợp | 10 lượt giữ dưới giai đoạn 7; hintLevel tối đa 4 | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-14 | Hồ sơ mất căn bản và giỏi | Khác mức hỗ trợ, cùng mục tiêu tư duy | Mức gợi ý ban đầu khác; prompt có định nghĩa/cần-đủ theo mức | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-15 | 120 lượt, cắt lịch sử cũ, hỏi lại câu đầu | Giữ chứng minh/hướng, phát hiện lặp | Giữ 1 kết luận, 120 hash, 24 câu gần; câu trùng bị từ chối | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-16 | Đòi giai đoạn 7 sớm; sau đó đủ chứng minh; “hiểu rồi” | Chặn tổng hợp sớm, tự kiểm tra phải có căn cứ | Chặn lần đầu, cho tổng hợp khi đủ; không coi “hiểu rồi” là đạt | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-17 | Mô hình trích câu học sinh chưa nói | Không coi là chứng minh | accepted rỗng, proofComplete false | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-18 | Sửa token/đổi mục đích image–tutor | Từ chối trạng thái giả | Chữ ký/mục đích sai bị chặn | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-19 | Gọi handler với provider có kiểm soát | Dùng schema 12 trạng thái, không trả khóa | Đúng hợp đồng Gemini REST; token có chữ ký, không có khóa | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-20 | Provider luôn trả JSON sai; token sửa | Sửa một lần rồi dừng; token sai không gọi API | 2 lần tối đa; token sai 409, 0 lời gọi | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| TUT-21 | Phát hiện tiền đề sai sau khi đã chấp nhận | Rút kết luận và mục tiêu phụ thuộc | Xóa kết luận chỉ định, reset coverage/proof, lùi giai đoạn 2 | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.3/tests.txt |
| STATE-01 | Khôi phục phiên 70 lượt, giai đoạn 6 | Giữ token/bằng chứng, không lưu mã truy cập | Khôi phục đúng turn/giai đoạn/proof/hash; không có accessCode | Pass | tests/v623-session.test.mjs; qa-results/v6.2.3/tests.txt |

## B. Tệp ảnh, cấu trúc và bảo mật

| Mã ca kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Pass/Fail | Ghi chú hoặc bằng chứng lỗi |
|---|---|---|---|---|---|
| IMG-01 | Ảnh rõ, 2AM = AB — clear-ratio.png | Nhận đúng chữ ký và kích thước tệp | Đọc header ảnh thật thành công; chưa chạy OCR thật | Pass | tests/fixtures/images/clear-ratio.png; tests/v623-image.test.mjs |
| IMG-02 | Ảnh nghiêng — skewed.png | Nhận đúng chữ ký và kích thước tệp | Đọc header ảnh thật thành công; chưa chạy OCR thật | Pass | tests/fixtures/images/skewed.png; tests/v623-image.test.mjs |
| IMG-03 | Ảnh xoay — rotated.png | Nhận đúng chữ ký và kích thước tệp | Đọc header ảnh thật thành công; chưa chạy OCR thật | Pass | tests/fixtures/images/rotated.png; tests/v623-image.test.mjs |
| IMG-04 | Ảnh có chữ và hình JPEG — text-figure.jpg | Nhận đúng chữ ký và kích thước tệp | Đọc header ảnh thật thành công; chưa chạy OCR thật | Pass | tests/fixtures/images/text-figure.jpg; tests/v623-image.test.mjs |
| IMG-05 | Ảnh mờ/cắt góc — blurred-cropped.png | Nhận đúng chữ ký và kích thước tệp | Đọc header ảnh thật thành công; chưa chạy OCR thật | Pass | tests/fixtures/images/blurred-cropped.png; tests/v623-image.test.mjs |
| IMG-06 | Đề trung điểm — midpoint.png | Nhận đúng chữ ký và kích thước tệp | Đọc header ảnh thật thành công; chưa chạy OCR thật | Pass | tests/fixtures/images/midpoint.png; tests/v623-image.test.mjs |
| IMG-07 | Tứ giác song song/vuông góc — parallel-perpendicular.png | Nhận đúng chữ ký và kích thước tệp | Đọc header ảnh thật thành công; chưa chạy OCR thật | Pass | tests/fixtures/images/parallel-perpendicular.png; tests/v623-image.test.mjs |
| IMG-08 | Đường tròn — circle.png | Nhận đúng chữ ký và kích thước tệp | Đọc header ảnh thật thành công; chưa chạy OCR thật | Pass | tests/fixtures/images/circle.png; tests/v623-image.test.mjs |
| IMG-09 | Đồ thị hàm số — graph.png | Nhận đúng chữ ký và kích thước tệp | Đọc header ảnh thật thành công; chưa chạy OCR thật | Pass | tests/fixtures/images/graph.png; tests/v623-image.test.mjs |
| IMG-10 | Ảnh WebP — clear.webp | Nhận đúng chữ ký và kích thước tệp | Đọc header ảnh thật thành công; chưa chạy OCR thật | Pass | tests/fixtures/images/clear.webp; tests/v623-image.test.mjs |
| IMG-11 | SVG/TXT, MIME giả, ảnh 2 px, quá 24 MiB | Chặn đầu vào không hợp lệ | Tất cả bị từ chối trước API | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| IMG-12 | IR 2AM = AB; ratio sai 1; M sai tọa độ | Giữ tỉ lệ 1/2, không vẽ từ IR sai | IR sai chưa ready; kiểm tra tọa độ phát hiện M sai | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| IMG-13 | IR mờ/cắt góc/độ tin cậy thấp/ký hiệu chưa rõ | Chặn vẽ, hỏi bổ sung | ready false cho bốn dạng chưa rõ | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| IMG-14 | Quan hệ thiếu nguồn thật hoặc nhắc điểm Z không có | Từ chối IR không kiểm soát | Phát hiện nguồn/điểm không hợp lệ | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| IMG-15 | Ảnh PNG thật gửi qua handler với provider fixture | Gửi inlineData/schema, chưa xác nhận | Đúng bytes, response JSON; confirmed false, không lộ khóa | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| IMG-16 | Sai mã lớp, token sửa, chưa xác nhận, dữ kiện mờ | Không gọi Gemini vẽ | 0 lời gọi provider ở các trường hợp bị chặn | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| IMG-17 | Bản đọc rõ không sửa; bản đọc đã sửa | Xác nhận bản rõ; đọc lại bản sửa | Không gọi model cho bản giữ nguyên; bản sửa cần xác nhận lại | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| IMG-18 | Báo nhãn M đè lên AB | Truyền lỗi cụ thể và cập nhật IR | Payload có đúng phần sai; chưa tự xác nhận hình | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| IMG-19 | Sinh hình và gửi lỗi biên dịch hai lần | Dùng prompt yêu cầu, tối đa 3 lần sinh | 3 lời gọi; token lần thứ tư bị chặn 409 | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| SEC-01 | Lệnh tệp/shell/macro ẩn/pgfplots; tên biến trùng input/special | Chặn mã ngoài tập cho phép | Tất cả payload nguy hiểm/không hỗ trợ bị chặn | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| SEC-02 | foreach hữu hạn; samples 999999; mã quá dài | Mở rộng hữu hạn, chặn vượt tài nguyên | Vòng điểm được mở rộng; samples/dung lượng bị chặn | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| IMG-20 | Không đặt ACCESS_CODE riêng | Giữ mã HOCGIOITOAN | Handler mới chấp nhận mã mặc định | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| IMG-21 | O(0,0), A(2,0), T(2,3), bán kính 2; biến thể sai | Kiểm tra thuộc tròn, tiếp tuyến, bán kính | Bản đúng qua; bán kính/tiếp tuyến sai bị phát hiện | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| IMG-22 | M trung điểm AB, AB vuông AC, các vectơ cùng phương | Kiểm tra ba quan hệ bằng tọa độ | Ba quan hệ qua; M lệch đoạn bị từ chối | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| IMG-23 | OCR đọc được nhưng IR có nguồn bịa | Giữ phiên âm, chưa dựng hình | Giữ transcription, clear relations, ready false | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |
| IMG-24 | Hình chữ nhật ABCD; D sai; xscale=2 | Không chấp nhận tọa độ/biến đổi mâu thuẫn | Bản đúng qua; D sai và biến đổi không đều bị chặn | Pass | tests/v623-image.test.mjs; qa-results/v6.2.3/tests.txt |

## C. Trình duyệt trên bản build production

| Mã ca kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Pass/Fail | Ghi chú hoặc bằng chứng lỗi |
|---|---|---|---|---|---|
| UI-01 | Ảnh PNG rõ | Nén/gửi ảnh thật, đợi xác nhận | Nén JPEG thật, gửi inline image, hiển thị phiên âm; chưa gọi vẽ trước xác nhận. | Pass | qa-results/v6.2.3/ui-results.json; ui.txt; ảnh chụp cùng thư mục. Gemini fixture. |
| UI-02 | Chờ xác nhận ảnh | Chặn gửi, không khóa ô nhập | Chặn gửi hội thoại; ô nhập vẫn chỉnh sửa được. | Pass | qa-results/v6.2.3/ui-results.json; ui.txt; ảnh chụp cùng thư mục. Gemini fixture. |
| UI-03 | Hai phản hồi TikZ lỗi rồi mã hợp lệ | Tối đa hai lần sửa, có SVG thật | Tự sửa đúng hai lần; biên dịch WASM thật, SVG có font; giải phóng iframe. | Pass | qa-results/v6.2.3/ui-results.json; ui.txt; ảnh chụp cùng thư mục. Gemini fixture. |
| UI-04 | Tải hình | Tệp PNG tải được | Tải PNG thật có đúng chữ ký tệp. | Pass | qa-results/v6.2.3/ui-results.json; ui.txt; ảnh chụp cùng thư mục. Gemini fixture. |
| UI-05 | Bắt đầu sau xác nhận và trả lời tiếp | Giữ trạng thái qua lời học sinh | Có giai đoạn 1–8; gửi trạng thái ký qua lượt tiếp theo dù câu trả lời nêu một loại hình. | Pass | qa-results/v6.2.3/ui-results.json; ui.txt; ảnh chụp cùng thư mục. Gemini fixture. |
| UI-06 | Báo hình sai ở nhãn M | Sửa theo phần sai được nêu | Chuyển về xác nhận; gửi đúng phần sai để cập nhật cấu trúc. | Pass | qa-results/v6.2.3/ui-results.json; ui.txt; ảnh chụp cùng thư mục. Gemini fixture. |
| UI-07 | Tệp TXT | Chặn định dạng sai | Báo sai định dạng, không gọi Gemini. | Pass | qa-results/v6.2.3/ui-results.json; ui.txt; ảnh chụp cùng thư mục. Gemini fixture. |
| UI-08 | Tệp 25 MB | Chặn trước giải mã/gửi | Chặn trước giải mã ảnh và trước API. | Pass | qa-results/v6.2.3/ui-results.json; ui.txt; ảnh chụp cùng thư mục. Gemini fixture. |
| UI-09 | Phản hồi OCR mờ có kiểm soát | Không vẽ khi dữ kiện chưa rõ | Đánh dấu đoạn nghi ngờ; không dựng hình khi chưa bổ sung. | Pass | qa-results/v6.2.3/ui-results.json; ui.txt; ảnh chụp cùng thư mục. Gemini fixture. |
| UI-10 | 390px cảm ứng giả lập; PNG xoay 90 độ | Không tràn màn hình; hỗ trợ phóng to/sáng-tối | Chọn ảnh qua input camera, đọc, vẽ, phóng to không tràn; light/dark hiển thị. Không phải kiểm thử máy thật. | Pass | qa-results/v6.2.3/ui-results.json; ui.txt; ảnh chụp cùng thư mục. Gemini fixture. |
| UI-11 | 412px cảm ứng giả lập; PNG xoay 90 độ | Không tràn màn hình; hỗ trợ phóng to/sáng-tối | Chọn ảnh qua input camera, đọc, vẽ, phóng to không tràn; light/dark hiển thị. Không phải kiểm thử máy thật. | Pass | qa-results/v6.2.3/ui-results.json; ui.txt; ảnh chụp cùng thư mục. Gemini fixture. |
| SEC-UI-01 | SVG chứa script, HTML và URL ngoài | Loại nội dung chủ động/URL ngoài | Bộ làm sạch loại mã chủ động và liên kết ngoài trước hiển thị. | Pass | qa-results/v6.2.3/ui-results.json; ui.txt; ảnh chụp cùng thư mục. Gemini fixture. |

## D. Biên dịch và kiểm tra hình đã có đầu ra

Các SVG ở research/v6-checks là kết quả engine thật từ mã TikZ fixture tự soạn, không phải hình do Gemini live sinh từ các ảnh ở mục B. Gallery đã được mở để kiểm tra trực quan.

| Mã ca kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Pass/Fail | Ghi chú hoặc bằng chứng lỗi |
|---|---|---|---|---|---|
| TEX-01 | right-isosceles.tex | Biên dịch, đúng tam giác/vuông góc, đọc được nhãn | Có SVG/font; quan sát điểm M/P/Q và góc vuông; nhãn đọc được | Pass | right-isosceles.svg; tikz-gallery.png |
| TEX-02 | parallelogram-midpoints.tex | Biên dịch hình bình hành/trung điểm | Có SVG/font; hình hiển thị, nhãn A/B sát cạnh | Pass biên dịch | Xem VIS-02 về bố trí nhãn; parallelogram-midpoints.svg |
| TEX-03 | circle-tangent.tex | Biên dịch đường tròn và tiếp tuyến | Có SVG/font, tiếp tuyến vuông bán kính tại A; O/A đọc được | Pass | circle-tangent.svg; tikz-gallery.png |
| TEX-04 | perpendicular-foot.tex | Biên dịch chân đường vuông góc | Có SVG/font; hình hiển thị, H quá gần dấu vuông | Pass biên dịch | Xem VIS-02 về bố trí nhãn; perpendicular-foot.svg |
| TEX-05 | plot.tex | Đồ thị TikZ plot, trục/nhãn rõ | Có đường parabol và trục x/y; biên dịch được | Pass | plot.svg; chưa kiểm chứng mọi hàm số bất kỳ |
| TEX-06 | solid-projection.tex | Hình không gian dạng chiếu | Có khối chiếu và nét khuất; fixture không có nhãn | Pass | solid-projection.svg |
| VIS-01 | Hình mới trong UI từ IR 2AM = AB | M đúng trung điểm, góc A vuông, nhãn không đè | Đã xem PNG thực: A/B/C/M tách rõ, tick hai nửa và góc vuông hiển thị | Pass | qa-results/v6.2.3/image-export.png; desktop-light.png; iphone-viewport-dark.png |
| VIS-02 | Hai fixture cũ: chân vuông góc/hình bình hành | Nhãn hoàn toàn tách ký hiệu và cạnh | H sát dấu vuông; A/B sát cạnh; chưa đạt tiêu chí bố trí nhãn tuyệt đối | Fail bố trí nhãn | Đầu vào fixture cũ không sửa; không phải lỗi biên dịch. qa-results/v6.2.3/tikz-gallery.png. Luồng sản phẩm cho báo vị trí nhãn cần sửa. |

## E. Các ca Gemini thật và thiết bị thật chưa chạy

Chưa có GEMINI_API_KEY để đánh giá phiên âm/hiểu đề/sinh hình thật. Ảnh QA tự soạn không phải dữ liệu nghiên cứu học sinh. Mọi ca dưới đây cần kiểm tra đủ: phiên âm, IR, TikZ biên dịch, quan hệ hình, nhãn và bố cục; không suy từ header hợp lệ thành OCR chính xác.

| Mã ca kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Pass/Fail | Ghi chú hoặc bằng chứng lỗi |
|---|---|---|---|---|---|
| LIVE-IMG-01 | Ảnh rõ, 2AM = AB — clear-ratio.png | Phiên âm giữ nguyên giả thiết; IR đúng; TikZ biên dịch; quan hệ/nhãn/UI phù hợp | Chưa gọi Gemini; OCR/IR/sinh TikZ/nhãn theo ảnh này chưa được nghiệm thu | Chưa chạy | qa-results/v6.2.3/live-results.json; chạy script live rồi kiểm tra thủ công |
| LIVE-IMG-02 | Ảnh nghiêng — skewed.png | Phiên âm giữ nguyên giả thiết; IR đúng; TikZ biên dịch; quan hệ/nhãn/UI phù hợp | Chưa gọi Gemini; OCR/IR/sinh TikZ/nhãn theo ảnh này chưa được nghiệm thu | Chưa chạy | qa-results/v6.2.3/live-results.json; chạy script live rồi kiểm tra thủ công |
| LIVE-IMG-03 | Ảnh xoay — rotated.png | Phiên âm giữ nguyên giả thiết; IR đúng; TikZ biên dịch; quan hệ/nhãn/UI phù hợp | Chưa gọi Gemini; OCR/IR/sinh TikZ/nhãn theo ảnh này chưa được nghiệm thu | Chưa chạy | qa-results/v6.2.3/live-results.json; chạy script live rồi kiểm tra thủ công |
| LIVE-IMG-04 | Ảnh có chữ và hình JPEG — text-figure.jpg | Phiên âm giữ nguyên giả thiết; IR đúng; TikZ biên dịch; quan hệ/nhãn/UI phù hợp | Chưa gọi Gemini; OCR/IR/sinh TikZ/nhãn theo ảnh này chưa được nghiệm thu | Chưa chạy | qa-results/v6.2.3/live-results.json; chạy script live rồi kiểm tra thủ công |
| LIVE-IMG-05 | Ảnh mờ/cắt góc — blurred-cropped.png | Đánh dấu phần chưa rõ, hỏi bổ sung; chưa vẽ khi thiếu dữ kiện | Chưa gọi Gemini; OCR/IR/sinh TikZ/nhãn theo ảnh này chưa được nghiệm thu | Chưa chạy | qa-results/v6.2.3/live-results.json; chạy script live rồi kiểm tra thủ công |
| LIVE-IMG-06 | Đề trung điểm — midpoint.png | Phiên âm giữ nguyên giả thiết; IR đúng; TikZ biên dịch; quan hệ/nhãn/UI phù hợp | Chưa gọi Gemini; OCR/IR/sinh TikZ/nhãn theo ảnh này chưa được nghiệm thu | Chưa chạy | qa-results/v6.2.3/live-results.json; chạy script live rồi kiểm tra thủ công |
| LIVE-IMG-07 | Tứ giác song song/vuông góc — parallel-perpendicular.png | Phiên âm giữ nguyên giả thiết; IR đúng; TikZ biên dịch; quan hệ/nhãn/UI phù hợp | Chưa gọi Gemini; OCR/IR/sinh TikZ/nhãn theo ảnh này chưa được nghiệm thu | Chưa chạy | qa-results/v6.2.3/live-results.json; chạy script live rồi kiểm tra thủ công |
| LIVE-IMG-08 | Đường tròn — circle.png | Phiên âm giữ nguyên giả thiết; IR đúng; TikZ biên dịch; quan hệ/nhãn/UI phù hợp | Chưa gọi Gemini; OCR/IR/sinh TikZ/nhãn theo ảnh này chưa được nghiệm thu | Chưa chạy | qa-results/v6.2.3/live-results.json; chạy script live rồi kiểm tra thủ công |
| LIVE-IMG-09 | Đồ thị hàm số — graph.png | Phiên âm giữ nguyên giả thiết; IR đúng; TikZ biên dịch; quan hệ/nhãn/UI phù hợp | Chưa gọi Gemini; OCR/IR/sinh TikZ/nhãn theo ảnh này chưa được nghiệm thu | Chưa chạy | qa-results/v6.2.3/live-results.json; chạy script live rồi kiểm tra thủ công |
| LIVE-TUT-01 | 12 loại trả lời, mất căn bản/giỏi, nhiều lời giải, hội thoại dài | Gemini tự phân loại và gợi mở hợp lý | Chỉ chạy điều khiển với phân loại fixture; chưa đánh giá mô hình thật | Chưa chạy | Thiếu khóa; tests/pedagogy-live.test.mjs skip |
| DEVICE-01 | Safari trên iPhone thật, camera, bàn phím, xoay máy | Chọn/chụp/đọc/zoom/tải ổn định | Chỉ có Chromium viewport 390 px; WebKit thiếu thư viện hệ thống | Chưa chạy | Không coi input capture được thiết lập là camera vật lý đã kiểm thử |
| DEVICE-02 | Chrome Android thật, camera và bộ nhớ thấp | Không che nút gửi/tràn/đóng tab | Chỉ có Chromium viewport 412 px | Chưa chạy | Cần giáo viên kiểm tra trên máy sử dụng thực tế |
| DEPLOY-01 | Netlify site hiện có với biến môi trường thật | Frontend/Functions hoạt động sau deploy | Build cục bộ và import entry đạt; chưa deploy site thật | Chưa chạy | Không có yêu cầu xuất bản site trong lần bàn giao |

## F. Kiểm tra chất lượng và đóng gói

| Mã ca kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Pass/Fail | Ghi chú hoặc bằng chứng lỗi |
|---|---|---|---|---|---|
| QA-01 | package-lock.json hiện tại | Cài đúng phụ thuộc khóa | npm ci thành công, 273 package | Pass | qa-results/v6.2.3/install.txt |
| QA-02 | Mã nguồn JS/TS | Lint không lỗi/cảnh báo nghiêm trọng | ESLint exit 0, không warning | Pass | lint.txt |
| QA-03 | TypeScript | Không lỗi kiểu | tsc --noEmit exit 0 | Pass | typecheck.txt |
| QA-04 | Bộ unit/integration hiện có và mới | Không regression | 490 pass, 0 fail, 1 live skip | Pass | tests.txt; skip không tính pass |
| QA-05 | Vite production | Build được, không import hỏng | Build exit 0; cảnh báo chunk 757,79 kB | Pass, có cảnh báo | build.txt; chưa tối ưu chia bundle trong bản sửa này |
| QA-06 | Luồng UI dựng hình cũ trên dist | Giữ dựng hình/export/responsive | 7 mục xác nhận; không JS page error | Pass | research/v6-checks/results.json; legacy-ui.txt |
| QA-07 | Entry Netlify và tài nguyên dist/font/WASM | Import/đường dẫn hợp lệ | GET trả 405; tài nguyên được tham chiếu có đủ | Pass | source-audit.json; chưa thay thế kiểm thử deploy thật |
| QA-08 | Mã lớp, env mẫu, cấu hình, giấy phép, ZIP gốc | Giữ nguyên, không lộ khóa | So byte cấu hình/giấy phép; hash ZIP gốc trùng; không tìm thấy mẫu khóa thật | Pass | source-audit.json; kiểm tra mẫu khóa không phải bảo đảm phát hiện mọi bí mật |
| QA-09 | ZIP đầu ra | Không node_modules/dist/.env thật/cache; CRC và đường dẫn đúng | CRC/đường dẫn/mã nguồn/giấy phép hợp lệ; loại đúng thư mục và tệp không cần | Pass | qa-results/v6.2.3/archive-validation.json; docs/THAY_DOI_TEP_V6_2_3.json |

Các lỗi đã xử lý trong quá trình làm gồm giữ token khi lời học sinh có tên loại hình, giới hạn lịch sử theo byte, hủy tác vụ ảnh đúng lúc, phục hồi phiên âm khi IR sai, kiểm tra hình/biến đổi tọa độ và chặn khai báo biến TikZ lợi dụng tên lệnh. Các kết quả Pass ở trên lấy từ lần chạy sau sửa. Không đưa các log thất bại cũ thành bằng chứng đạt.
