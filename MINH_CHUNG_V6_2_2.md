# Sổ tay cập nhật và khai báo hỗ trợ AI

Ngày lập: 20/09/2026 (UTC). Đây là nhật ký kỹ thuật của bản 6.2.2, không phải dữ liệu thực nghiệm học sinh hay báo cáo nghiên cứu do học sinh tự viết.

## Trích dẫn phần hỗ trợ AI

OpenAI, ChatGPT/Codex. (2026-09-20). *Hỗ trợ kiểm tra website, sửa cơ chế bộ đề và cá nhân hóa, cập nhật liên kết poster cho Tư duy Toán học*. Nhật ký LIVE-001 đến LIVE-003; mã nguồn, diff và kết quả công cụ trong bản 6.2.2.

Không có metadata xác minh mã model trợ lý cụ thể hoặc giờ gửi nguyên thủy của từng yêu cầu. Không tự bổ sung thông tin đó. Các thời điểm trong nhật ký kiểm thử là giờ chạy công cụ được ghi thực tế.

## Phần mã do AI tạo hoặc chỉnh sửa trong đợt này

| Tệp / phần | Đóng góp trong bản 6.2.2 |
| --- | --- |
| app/page.tsx | Sửa liên kết poster, Typed, saveProfile, chọn đề trong send; thêm nút chọn câu. Phần còn lại kế thừa. |
| components/math-text.tsx | Sửa render phần văn bản để hiểu cặp ** mà không đưa HTML mô hình vào DOM. |
| lib/exercise-choice.ts | Tạo mới bộ đọc số bài và chọn đúng đề để giữ ngữ cảnh/hình. |
| server/exercise-set.mjs | Tạo mới chỉ dẫn, chuẩn hóa bộ đề và báo bộ đề chưa hợp lệ. Không chứa lời giải hoặc thay lời giải bằng dữ liệu bịa. |
| server/theorem-checks.mjs | Tạo mới phép sửa có giới hạn phát biểu sai về tiền đề dấu hiệu hình chữ nhật trong CAU_NOI. |
| server/strict-tutor.mjs | Ghép kiểm tra định lí và bộ đề; vẫn chặn yêu cầu xin đáp án trước các nhánh xử lý. |
| server/policy.mjs | Nối chỉ dẫn tạo bộ đề khi yêu cầu thực sự là tạo 5–10 câu. |
| server/review-compare-policy.mjs | Bổ sung điều kiện đúng của các dấu hiệu hình chữ nhật, tránh khái quát sai. |
| tests/live-regressions.test.mjs | Tạo mới ca hồi quy phát biểu đã quan sát, nhấn mạnh/công thức và escape HTML. |
| tests/exercise-set.test.mjs | Tạo mới ca 5/10 câu, thiếu/trùng số/có lời giải, chọn câu và payload Gemini mô phỏng. |
| tests/survey-component.test.mjs | Sửa kỳ vọng URL; dùng module cá nhân hóa thật; thêm kiểm thử đổi mức hỗ trợ và chọn đề. |
| tests/strict-tutor.test.mjs | Điều chỉnh ca bộ đề cho định dạng chuẩn hóa mới, giữ tiêu chí đủ câu và không kèm lời giải. |
| tests/v62-protected.json | Bỏ strict-tutor khỏi nhóm tệp phải nguyên byte do có sửa được yêu cầu; 18 tệp còn lại giữ mã băm cũ. |
| package.json, package-lock.json | Chỉ đổi phiên bản 6.2.1 thành 6.2.2; không đổi phụ thuộc. |
| research/v622-checks/build-workbook.mjs, collect-results.mjs | AI tạo script thống kê nhật ký và xuất bảng Excel; không dùng làm dữ liệu học sinh. |
| README và tài liệu đợt này | Biên soạn từ yêu cầu, mã nguồn và các quan sát được ghi. |
| dist | Build tự động bằng Vite từ mã nguồn; không chỉnh tay. |

`source-changes.json` lưu SHA-256 trước/sau và đoạn thay đổi so với bản 6.2.1; `source-changes.diff` lưu nội dung khác biệt. Không gán tác giả cho phần kế thừa khi không có bằng chứng lịch sử. Giữ thông báo giấy phép và các khai báo hỗ trợ AI trước đây.

## Nhật ký câu lệnh

### LIVE-001 — yêu cầu kiểm tra thật

```text
Kiểm tra thật bằng khóa tôi gửi. Còn lỗi gì của các tính năng nào thì sửa cho hoàn chỉnh
```

Thực hiện: kết nối website bằng quy trình nhập mã lớp, dùng hồ sơ ghi rõ là dữ liệu kiểm thử, gửi bài hình học và đọc phản hồi. Không lưu giá trị thông tin xác thực trong nhật ký. Các tệp WEB-*.json là bản ghi kết quả công cụ; kết quả có timeout hoặc không tìm thấy phần tử được giữ để phân biệt lỗi thao tác kiểm thử với lỗi phần mềm. Không dùng các bản ghi đó như dữ liệu của học sinh thật.

### LIVE-002 — website đã cập nhật và URL poster mới

```text
Tôi đã đăng cập nhật lại wed, bạn hãy kiểm tra lại
và đồng thời chỉ lại link poster online là link này
https://poster-online-khkt.netlify.app/
```

Thực hiện: xác nhận nhãn/bố cục bản 6.2.1 trên trang đã cập nhật; thay URL trong mã 6.2.2 và kiểm thử giá trị href. Việc thay href không phải xác minh nội dung website poster.

### LIVE-003 — tiếp tục hoàn thiện

```text
Tiếp tục
```

Thực hiện: sửa mức hỗ trợ khi đổi phân loại, chuẩn hóa bộ câu luyện tập, kiểm thử chọn câu, chạy toàn bộ test/TypeScript/build, khởi động kiểm tra và lập bảng Excel. Không triển khai bản sửa 6.2.2 lên website trong đợt này.

## Từ cơ sở sư phạm đến thay đổi prompt

Đợt này kế thừa cơ sở đã ghi ở `docs/V5_THINKING.md`, `docs/V5_PROMPT_MODEL.md` và `server/research-pedagogy.mjs`: bài Nguyễn Thanh Hưng và Ngô Tùng Nhân, Tạp chí Giáo dục, số đặc biệt tháng 4/2019, trang 184–187, về rèn luyện thao tác tư duy trong chương Tứ giác. Đây là khai báo nguồn thiết kế kế thừa; không khẳng định đã thực hiện nghiên cứu hoặc thực nghiệm giáo dục mới trong đợt cập nhật kỹ thuật này.

| Định hướng | Vận dụng vào bản sửa | Bằng chứng kiểm tra |
| --- | --- | --- |
| Phân tích, đối chiếu điều kiện đủ | Khi xét dấu hiệu đường chéo bằng nhau, kiểm tra loại tứ giác, không nói mọi dấu hiệu đều có cùng tiền đề. | Phản hồi live sai được lưu; tests/live-regressions kiểm tra phép sửa cụ thể và không sửa mệnh đề đúng/phủ định. |
| Phân hóa điểm tựa, không đổi mục tiêu tư duy | Mất căn bản: điểm tựa định nghĩa/đối tượng. Giỏi: tự chọn điều kiện đủ và nêu căn cứ. Cùng giữ quy tắc chờ học sinh tự lập luận. | Biểu mẫu thật cập nhật supportLevel; kiểm tra nội dung hồ sơ và câu hỏi dự kiến gửi vào request. Đây chưa phải kiểm chứng hiệu quả cá nhân hóa của model. |
| Một nhiệm vụ nhỏ mỗi lượt hướng dẫn | Bộ đề là danh sách nhiệm vụ chưa làm; khi chọn câu, gắn đúng đề rồi trở về một câu gợi mở. | Kiểm thử số câu, không đáp án, số câu hỏi gợi mở và chọn đúng bài. |
| Kiểm tra, phản biện kết quả | Không hiển thị danh sách thiếu câu hoặc có dạng lời giải như một bộ đề hợp lệ. | Các ca thiếu câu, trùng số, lẫn lời giải đều bị từ chối có thông báo rõ. |

Không huấn luyện lại, fine-tune trọng số hoặc đổi model Gemini. Thay đổi là chỉ dẫn hệ thống có điều kiện, dữ liệu hồ sơ và kiểm soát định dạng đầu ra. Các ví dụ trong tests được biên soạn để kiểm tra phần mềm; chỉ WEB-*.json ghi lại tương tác website thật. Không suy ra chất lượng giảng dạy hoặc mức tiến bộ của học sinh từ tỷ lệ kiểm thử kỹ thuật đạt.

## Tài liệu để tái lập

Trong `research/v622-checks/`: `commands.json`, ba nhật ký lệnh, `start-result.json`, `test-results.json`, bảng Excel, các bản ghi WEB-*.json, hai ảnh chụp hình, `live-observations.json`, diff và mã băm. Nhật ký prompt của bản trước ở `research/v621-checks/prompt-log.json` và `MINH_CHUNG_CAP_NHAT_KHAO_SAT.md` được giữ nguyên.
