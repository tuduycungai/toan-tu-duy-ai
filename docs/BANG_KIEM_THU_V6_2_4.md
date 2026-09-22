# Bảng kiểm thử V6.2.4

502 ca unit/integration: 501 pass, 0 fail, 1 skip Gemini live. UI mới 11 mục, UI ảnh hồi quy 12 mục, UI cũ 7 mục; sáu fixture biên dịch TeX/WASM thật. Các số đếm này là nhóm riêng, không phải 502 lần kiểm tra OCR.

Phản hồi Gemini dùng trong unit/integration/UI là dữ liệu kiểm thử có kiểm soát. Không trình bày như kết quả Gemini thật hoặc nghiên cứu học sinh. Các đường dẫn bằng chứng ngắn bên dưới thuộc `qa-results/v6.2.4/`.

## A. Lỗi mới, bộ nhớ và khảo sát

| Mã ca kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Pass/Fail | Ghi chú hoặc bằng chứng lỗi |
|---|---|---|---|---|---|
| FIX-01 | Bản đọc hình thang rõ nhưng nguồn quan hệ sai | Giữ đề và mục tiêu, tách lỗi cấu trúc | Giữ nguyên đề và yêu cầu Tính MI/IK/KN; không thêm nghi ngờ giả | Pass | tests/v624-recovery.test.mjs; tests.txt |
| FIX-02 | Xác nhận cùng bản đề, không sửa ký tự | Sửa IR một lần rồi cho vẽ | Một lần gọi provider sửa IR; kiểm tra đủ 7 quan hệ | Pass | tests.txt; UI624-02 biên dịch thật |
| FIX-03 | Provider vẫn trả IR lỗi sau xác nhận | Dừng, không tự lặp gọi API | Một lần gọi; giữ phiên âm và nút thử lại | Pass | tests.txt |
| FIX-04 | Giá trị AB thật sự chưa rõ | Hỏi bổ sung, chưa sinh hình | Trả 400, không gọi provider | Pass | tests.txt |
| FIX-05 | Nguồn LaTeX parallel, các đoạn AD/MN/BD, số chuỗi | Chuẩn hóa biểu diễn, không đổi giả thiết | IR hợp lệ; nguồn AB // AC không có trong đề bị từ chối | Pass | tests.txt |
| FIX-06 | Calc trung điểm, giao MN với BD/AC; thêm biến thể sai | Đúng thì nhận, sai thì chặn | M=(1.5,2.5), I=(5.5,2.5), K=(9.5,2.5); chặn hai biến thể sai | Pass | tests.txt; trapezoid.svg/png |
| FIX-07 | Dấu âm/lũy thừa/sqrt/sin; mã thực thi và tham chiếu vòng | Chỉ tính số an toàn, chặn biểu thức ngoài tập hỗ trợ | Đúng giá trị số; chặn chia 0, mã thực thi, vòng tọa độ | Pass | tests.txt |
| FIX-08 | Khôi phục token đúng và token bị sửa | Xác thực, không gọi Gemini | Token đúng trả đề; token sửa trả 409 | Pass | tests.txt |
| MEM-01 | Luồng byte vừa đủ/thiếu/vượt vùng nhớ | Ghi vào một vùng cố định, chặn sai kích thước | Trả đúng vùng nhớ; chặn thiếu/vượt | Pass | tests/v624-memory.test.mjs; producer có kiểm soát, gzip thật ở UI |
| MEM-02 | Nguồn TikZJax 1.6.0 và nguồn không khớp | Patch tái lập, không nới bộ nhớ/giấy phép | Khớp runtime đóng gói, 2.500 trang; nguồn khác bị chặn | Pass | tests.txt |
| MEM-03 | Lưu/đọc/xóa phiên và lỗi quota | Giữ văn bản/token, không ảnh/key; lỗi lưu không làm sập bài | Đọc/xóa đúng, quota được xử lý | Pass | tests.txt |
| SUR-01 | 779.999 ms rồi thêm 1 ms từ lúc đủ điều kiện | Chưa nhắc trước 13 phút; đúng mốc thì nhắc | Hook/component dùng 780.000 ms và qua các mốc kiểm tra | Pass | tests/survey-reminder.test.mjs; tests/survey-component.test.mjs |
| SUR-02 | Đang bận, tab nền, khảo sát đang mở, không đồng ý gửi | Hoãn/không chồng dialog/không tự gửi | Bộ timer và component đạt, không phát sinh gửi bởi đồng hồ | Pass | tests.txt; UI624-01 kiểm tra lời nhắc 13 phút |

## B. Trình duyệt mới

Chromium 131 với viewport cảm ứng và user agent iPhone; không phải Safari/thiết bị thật.

| Mã ca kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Pass/Fail | Ghi chú hoặc bằng chứng lỗi |
|---|---|---|---|---|---|
| UI624-01 | Bài hình thang trong ảnh; provider trả IR lỗi | Giữ mục tiêu đã có, không báo thiếu dữ kiện giả; lời nhắc 13 phút | Giữ nguyên đề/yêu cầu Tính; thông báo kiểm tra lại cấu trúc, không báo đề thiếu. | Pass | ui-results.json; ui.txt; phone-light.png/phone-dark.png/desktop.png/trapezoid.png |
| UI624-02 | Nhấn xác nhận một lần, không sửa một ký tự | Một lần xác nhận sửa IR rồi vẽ thật, worker có phiên bản mới | IR được sửa; calc trung điểm/giao điểm biên dịch TeX thật; worker phiên bản mới, không còn iframe. | Pass | ui-results.json; ui.txt; phone-light.png/phone-dark.png/desktop.png/trapezoid.png |
| UI624-03 | 390 px, light/dark, zoom | Light/dark và phóng to không tràn 390 px | Không tràn ngang; hình/nhãn và nút sử dụng được trên viewport cảm ứng mô phỏng. | Pass | ui-results.json; ui.txt; phone-light.png/phone-dark.png/desktop.png/trapezoid.png |
| UI624-04 | Tải PNG trên viewport điện thoại | PNG thật rộng 1.280 px | Tệp PNG thật, canvas 1280 px được thu hồi sau xuất. | Pass | ui-results.json; ui.txt; phone-light.png/phone-dark.png/desktop.png/trapezoid.png |
| UI624-05 | Tải lại trang sau dựng hình | Khôi phục đề mà không tự nạp TeX | Khôi phục bản đề và token qua máy chủ; không tự nạp TeX khi tải lại. | Pass | ui-results.json; ui.txt; phone-light.png/phone-dark.png/desktop.png/trapezoid.png |
| UI624-06 | Dựng liên tiếp ba lần | Ba lần có hình, dọn iframe cũ | Cả ba lần có SVG; không giữ iframe cũ, không vòng sửa vô hạn. | Pass | ui-results.json; ui.txt; phone-light.png/phone-dark.png/desktop.png/trapezoid.png |
| UI624-07 | Xác nhận hình đúng | Mở gia sư tám giai đoạn sau xác nhận hình | Bắt đầu hội thoại tám giai đoạn và mở lại các nút sau khi trả lời xong. | Pass | ui-results.json; ui.txt; phone-light.png/phone-dark.png/desktop.png/trapezoid.png |
| UI624-08 | PNG 8000 × 6000 thật | Chặn ảnh 48 MP trước giải mã/gọi API trên chế độ điện thoại | Chặn trước giải mã ảnh trên điện thoại; hướng dẫn dùng 12 MP/cắt đề. | Pass | ui-results.json; ui.txt; phone-light.png/phone-dark.png/desktop.png/trapezoid.png |
| UI624-09 | Dừng khi đang nạp core TeX | Hủy tác vụ nạp core, giữ đề | Hủy worker/iframe; đề được giữ và có thể dựng lại. | Pass | ui-results.json; ui.txt; phone-light.png/phone-dark.png/desktop.png/trapezoid.png |
| UI624-10 | Dựng lại sau hủy, desktop 1280 px | Dựng lại thành công sau hủy | Biên dịch thành công, không lỗi JS của trang. | Pass | ui-results.json; ui.txt; phone-light.png/phone-dark.png/desktop.png/trapezoid.png |
| UI624-11 | Tải lại sau khi đã bắt đầu học | Giữ tiến trình bài đã học sau tải lại, không bắt xác nhận ảnh lại | Giữ tiến trình hội thoại; không buộc xác nhận ảnh và bắt đầu bài từ đầu. | Pass | ui-results.json; ui.txt; phone-light.png/phone-dark.png/desktop.png/trapezoid.png |

## C. Gia sư và tính năng ảnh hồi quy

Các ca điều khiển đã có được chạy lại trong npm test. Phân loại đầu vào do fixture cung cấp; không phải đánh giá khả năng tự phân loại của mô hình thật.

| Mã ca kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Pass/Fail | Ghi chú hoặc bằng chứng lỗi |
|---|---|---|---|---|---|
| TUT-01 | Đúng đủ; M thuộc AB và AM = MB | Chấp nhận bước đúng, giữ một câu hỏi | Đã giữ kết luận với trích dẫn; không lộ nhãn | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-02 | Đúng một phần: AM = AB/2 | Chưa nâng thành chứng minh đầy đủ | Không thêm kết luận đã chứng minh; lưu trạng thái thiếu | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-03 | Dùng trung điểm nhưng chưa nêu điều kiện | Giữ ý tưởng, không chấp nhận thiếu căn cứ | Ghi thiếu căn cứ; chưa mở tổng hợp | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-04 | Coi trung điểm là giả thiết sẵn có | Nhận nhầm giả thiết/kết luận | Điều khiển trạng thái nhầm giả thiết đúng hợp đồng | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-05 | Hai cạnh bằng nhau suy ra hình bình hành | Không chấp nhận định lý sai | Không lưu kết luận; ghi lỗi cần đối chiếu | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-06 | Dùng kết luận chứng minh chính kết luận | Chặn suy luận vòng | Không lưu kết luận chưa có căn cứ | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-07 | 2AM = AB suy ra AM = AB | Giữ lỗi tính toán để sửa | Phân loại nội bộ được nhận, không lộ nhãn | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-08 | “Chỗ đó bằng nhau” | Hỏi nhỏ, không tự tiến | Giữ giai đoạn, chưa thêm chứng minh | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-09 | Cách khác hợp lệ: cộng đoạn AB = AM + MB | Chấp nhận hướng hợp lệ | Giữ kết luận và hướng, không ép mẫu | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-10 | Xin đáp án ngay | Không mở tổng hợp | Không vào giai đoạn 7 | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-11 | Không liên quan | Giữ mục tiêu, không tự tiến | Giai đoạn không tăng theo phản hồi | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-12 | Câu có nhiều cách hiểu về vị trí M | Chưa suy đoán | Giữ giai đoạn và một câu hỏi | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-13 | Xin đáp án 10 lượt | Gợi ý tăng có trần, không lộ tổng hợp | 10 lượt giữ dưới giai đoạn 7; hintLevel tối đa 4 | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-14 | Hồ sơ mất căn bản và giỏi | Khác mức hỗ trợ, cùng mục tiêu tư duy | Mức gợi ý ban đầu khác; prompt có định nghĩa/cần-đủ theo mức | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-15 | 120 lượt, cắt lịch sử cũ, hỏi lại câu đầu | Giữ chứng minh/hướng, phát hiện lặp | Giữ 1 kết luận, 120 hash, 24 câu gần; câu trùng bị từ chối | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-16 | Đòi giai đoạn 7 sớm; sau đó đủ chứng minh; “hiểu rồi” | Chặn tổng hợp sớm, tự kiểm tra phải có căn cứ | Chặn lần đầu, cho tổng hợp khi đủ; không coi “hiểu rồi” là đạt | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-17 | Mô hình trích câu học sinh chưa nói | Không coi là chứng minh | accepted rỗng, proofComplete false | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-18 | Sửa token/đổi mục đích image–tutor | Từ chối trạng thái giả | Chữ ký/mục đích sai bị chặn | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-19 | Gọi handler với provider có kiểm soát | Dùng schema 12 trạng thái, không trả khóa | Đúng hợp đồng Gemini REST; token có chữ ký, không có khóa | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-20 | Provider luôn trả JSON sai; token sửa | Sửa một lần rồi dừng; token sai không gọi API | 2 lần tối đa; token sai 409, 0 lời gọi | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |
| TUT-21 | Phát hiện tiền đề sai sau khi đã chấp nhận | Rút kết luận và mục tiêu phụ thuộc | Xóa kết luận chỉ định, reset coverage/proof, lùi giai đoạn 2 | Pass | tests/v623-adaptive.test.mjs; qa-results/v6.2.4/tests.txt |

| Mã ca kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Pass/Fail | Ghi chú hoặc bằng chứng lỗi |
|---|---|---|---|---|---|
| UI-01 | Ảnh PNG rõ | Giữ luồng và điều kiện an toàn của V6.2.3 | Nén JPEG thật, gửi inline image, hiển thị phiên âm; chưa gọi vẽ trước xác nhận. | Pass | image-regression/ui-results.json; ui-regression.txt |
| UI-02 | Chờ xác nhận ảnh | Giữ luồng và điều kiện an toàn của V6.2.3 | Chặn gửi hội thoại; ô nhập vẫn chỉnh sửa được. | Pass | image-regression/ui-results.json; ui-regression.txt |
| UI-03 | Hai phản hồi TikZ lỗi rồi mã hợp lệ | Giữ luồng và điều kiện an toàn của V6.2.3 | Tự sửa đúng hai lần; biên dịch WASM thật, SVG có font; giải phóng iframe. | Pass | image-regression/ui-results.json; ui-regression.txt |
| UI-04 | Tải hình | Giữ luồng và điều kiện an toàn của V6.2.3 | Tải PNG thật có đúng chữ ký tệp. | Pass | image-regression/ui-results.json; ui-regression.txt |
| UI-05 | Bắt đầu sau xác nhận và trả lời tiếp | Giữ luồng và điều kiện an toàn của V6.2.3 | Có giai đoạn 1–8; gửi trạng thái ký qua lượt tiếp theo dù câu trả lời nêu một loại hình. | Pass | image-regression/ui-results.json; ui-regression.txt |
| UI-06 | Báo hình sai ở nhãn M | Giữ luồng và điều kiện an toàn của V6.2.3 | Chuyển về xác nhận; gửi đúng phần sai để cập nhật cấu trúc. | Pass | image-regression/ui-results.json; ui-regression.txt |
| UI-07 | Tệp TXT | Giữ luồng và điều kiện an toàn của V6.2.3 | Báo sai định dạng, không gọi Gemini. | Pass | image-regression/ui-results.json; ui-regression.txt |
| UI-08 | Tệp 25 MB | Giữ luồng và điều kiện an toàn của V6.2.3 | Chặn trước giải mã ảnh và trước API. | Pass | image-regression/ui-results.json; ui-regression.txt |
| UI-09 | Phản hồi OCR mờ có kiểm soát | Giữ luồng và điều kiện an toàn của V6.2.3 | Đánh dấu đoạn nghi ngờ; không dựng hình khi chưa bổ sung. | Pass | image-regression/ui-results.json; ui-regression.txt |
| UI-10 | 390px cảm ứng giả lập; PNG xoay 90 độ | Giữ luồng và điều kiện an toàn của V6.2.3 | Chọn ảnh qua input camera, đọc, vẽ, phóng to không tràn; light/dark hiển thị. Không phải kiểm thử máy thật. | Pass | image-regression/ui-results.json; ui-regression.txt |
| UI-11 | 412px cảm ứng giả lập; PNG xoay 90 độ | Giữ luồng và điều kiện an toàn của V6.2.3 | Chọn ảnh qua input camera, đọc, vẽ, phóng to không tràn; light/dark hiển thị. Không phải kiểm thử máy thật. | Pass | image-regression/ui-results.json; ui-regression.txt |
| SEC-UI-01 | SVG chứa script, HTML và URL ngoài | Giữ luồng và điều kiện an toàn của V6.2.3 | Bộ làm sạch loại mã chủ động và liên kết ngoài trước hiển thị. | Pass | image-regression/ui-results.json; ui-regression.txt |

## D. Biên dịch và quan sát hình

| Mã ca kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Pass/Fail | Ghi chú hoặc bằng chứng lỗi |
|---|---|---|---|---|---|
| TEX-01–06 | Tam giác vuông cân, hình bình hành/trung điểm, tiếp tuyến, chân vuông góc, đồ thị, khối chiếu | Biên dịch tất cả fixture cũ | 6/6 có SVG thật và font | Pass biên dịch | compiler.txt; legacy/compiler-results.json |
| VIS-624 | Hình thang của phản hồi mới | Điểm/giao điểm/tỉ lệ 8:16 đúng, nhãn tách rõ | Đã xem PNG xuất và screenshot; M–I–K–N đúng thứ tự; nhãn đọc được | Pass | trapezoid.png; phone-dark.png; quan sát thủ công |
| VIS-OLD | Hai fixture cũ chân vuông góc/hình bình hành | Nhãn tách hoàn toàn ký hiệu/nét | Vẫn là dữ liệu fixture cũ: H gần dấu vuông, A/B gần cạnh | Fail bố trí nhãn cũ | Hạn chế đã ghi trong V6.2.3; không coi biên dịch thành công là bố trí nhãn đạt |
| LEGACY-UI | Luồng nhập chữ/vẽ/sửa lỗi/tải PNG/responsive | Không mất chức năng cũ | 7 mục đạt, không lỗi JS của trang | Pass | legacy-ui.txt; legacy/results.json |

## E. Chưa nghiệm thu bằng Gemini hoặc thiết bị thật

Mỗi ảnh cần kiểm tra riêng phiên âm, cấu trúc, mã biên dịch, quan hệ hình, nhãn và giao diện. Chưa có khóa Gemini thật trong môi trường kiểm thử.

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
| LIVE-IMG-10 | Ảnh hình thang phản ánh lỗi mới | Gemini đọc đúng toàn bộ, tạo IR và hình đúng | Đã kiểm tra đường lỗi/IR/TeX bằng fixture; chưa kiểm tra Gemini thật với ảnh này | Chưa chạy | tests/fixtures/images/trapezoid-v624.png |

## F. Chất lượng và đóng gói

| Mã ca kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Pass/Fail | Ghi chú hoặc bằng chứng lỗi |
|---|---|---|---|---|---|
| QA-01 | package-lock.json | Cài đúng dependency khóa | npm ci hoàn tất, 273 package | Pass | install.txt |
| QA-02 | Mã JS/TS | Lint và typecheck sạch | Cả hai exit 0 | Pass | lint.txt; typecheck.txt |
| QA-03 | Bộ unit/integration | Không lỗi | 501 pass, 0 fail, 1 skip live | Pass; skip không tính đạt | tests.txt; summary.json |
| QA-04 | Build production | Không lỗi build/import | Build thành công; chunk JS 760,80 kB, gzip 234,73 kB | Pass, có cảnh báo | build.txt |
| QA-05 | Netlify entry, tài nguyên, cấu hình, giấy phép | Giữ cấu hình/auth và đủ asset | Kiểm tra nguồn và so byte với V6.2.3 | Pass | source-audit.json |
| QA-06 | ZIP phát hành | CRC hợp lệ, đường dẫn an toàn, loại thư mục/tệp không cần | Kiểm tra archive sau đóng gói; ZIP cũ giữ nguyên SHA-256 | Pass | archive-validation.json |
