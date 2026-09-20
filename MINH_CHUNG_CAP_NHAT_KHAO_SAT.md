# Minh chứng sử dụng AI trong bản cập nhật hồ sơ, khảo sát và chế độ học

Ngày lập: 2026-09-19; cập nhật sau lần kiểm thử bắt đầu lúc 21:15:27 UTC. Tài liệu kỹ thuật do ChatGPT/Codex hỗ trợ tạo, ghi nhận phạm vi thực hiện trong đợt này. Không coi đây là công trình nghiên cứu độc lập của học sinh.

## Cách trích dẫn

OpenAI, ChatGPT/Codex. (2026-09-19). *Hỗ trợ cập nhật mã nguồn hồ sơ, khảo sát và hướng dẫn kiểm tra/so sánh lời giải cho ứng dụng Tư duy Toán học*. Nhật ký SURVEY-001 và SURVEY-002; mã nguồn và diff đi kèm trong gói bàn giao 6.2.1.

Không có metadata xác minh số hiệu mô hình cụ thể hoặc thời điểm gửi nguyên thủy của từng tin nhắn. Không tự điền các thông tin đó.

## Mã do AI tạo hoặc chỉnh sửa trong đợt này

| Phần mã | Phần được AI hỗ trợ |
| --- | --- |
| lib/survey.ts | Tạo mới hàm nhận diện người dùng và ghép nhận xét gửi Forms. |
| lib/use-survey-reminder.ts | Tạo mới hook nhắc 180 giây, hoãn khi bị chặn, dọn bộ đếm. |
| app/page.tsx | Chỉnh nhãn, liên kết poster, vai trò, mở/gửi khảo sát và giữ hội thoại tiếp tục. Thêm nhãn trạng thái, mô tả và ô nhập theo hai chế độ. Các phần còn lại được kế thừa. |
| app/enhancements.css | Thêm quy tắc cho liên kết poster, nhãn dài ở điện thoại và nhãn “Đang phát triển”. |
| server/review-compare-policy.mjs | Tạo mới chỉ dẫn riêng cho kiểm tra và so sánh lời giải; được ghép vào system instruction hiện có. |
| server/policy.mjs | Thêm import và nối chỉ dẫn đúng chế độ; không đổi API, model hoặc prompt guide. |
| lib/learning.ts | Thêm trạng thái, đổi mô tả của hai chế độ; không sửa nội dung bài mẫu. |
| tests/review-compare.test.mjs | Tạo kiểm thử cách ghép prompt, API mô phỏng, nhãn và ví dụ phản hồi tự biên soạn; không phải bản ghi Gemini thật. |
| tests/v62-mode-baseline.json | Lưu SHA-256 của prompt guide và nội dung bài mẫu từ bản nền. |
| tests/survey*.test.mjs | Tạo mới kiểm thử dữ liệu, thời gian, thành phần React và toàn vẹn tệp. |
| tests/v62-protected.json | Sinh các mã SHA-256 từ tệp gốc, không phải giả định về kết quả. |
| tests/v61-component.test.mjs | Thêm và khôi phục mô phỏng matchMedia trong môi trường Node. |
| tests/preserved.test.mjs | Ghi nhận script UI thay đổi theo yêu cầu khảo sát; các tệp lõi tiếp tục được kiểm tra. |
| scripts/check-ui.mjs và các script check-v5-ui, check-v6-ui, check-v62-mobile | Cập nhật bộ chọn nhãn mới. Chưa thực thi lại kiểm tra trình duyệt trong lần này. |
| package.json / package-lock.json | Chỉ cập nhật số phiên bản kỹ thuật; không đổi danh sách phụ thuộc. |
| README.md, tài liệu cập nhật và bảng kiểm thử | Tài liệu do AI hỗ trợ biên soạn từ yêu cầu và kết quả công cụ. |
| dist/ | Kết quả của Vite build từ mã nguồn, không chỉnh tay. |

Bản nền do người dùng cung cấp được lưu độc lập. Không tuyên bố toàn bộ mã trong bản nền do AI tạo, cũng không gán phần AI sửa thành mã do con người viết hoàn toàn. `source-changes.json` có SHA-256 trước/sau và vị trí các đoạn thay đổi; `source-changes.diff` có nội dung từng đoạn.

## Nhật ký câu lệnh SURVEY-001

Dưới đây là yêu cầu văn bản của người dùng, giữ nguyên nội dung. Ảnh đối chiếu cho thấy khu vực poster/phiên bản và biểu mẫu hồ sơ.

```text
Điều chỉnh cập nhật phiên bản gồm nhnữg ý sau đây:

- chỗ Poster khoa học online thì gắn thêm đường dẫn Poster online theo link tôi gửi. và xoá đi phần số phiên bản. https://app.netlify.com/projects/poster-online-khkt/overview
- Chỗ " Trường đang học" sửa thành " Trường đang học ( nơi công tác)
- Chỗ " Lớp" đổi thành " Lớp đang học ( Nếu bạn là GV thì để trống ). Lưu ý nếu Gv bỏ trống thì wed tự hiểu là GV và gửi thông tin thu thập biểu mẫu hiện là "Giáo viên" thay vì "Lớp : 8a1"
- Chỗ " Em đã biết làm, cảm ơn thầy" sửa thành " Khảo sát đánh giá ứng dụng"
- Chỉnh thêm bảng khảo sát cài đặt cứ 3 phút lại hiện trên wed 1 lần
```

### Quyết định triển khai và kết quả

1. Dùng đúng URL được cung cấp; ghi rõ đây là trang quản trị Netlify vì chưa xác minh được URL poster công khai.
2. Không đổi backend hay mã trường Google Forms. Thêm vai trò/lớp vào trường nhận xét hiện có, kể cả khi không chọn tóm tắt học tập.
3. Lời nhắc chỉ mở hộp thoại. Mỗi lần gửi cần sao đánh giá và đồng ý; lần gửi chưa xác nhận không tự gửi lại.
4. Gửi khảo sát không kết thúc hội thoại để lời nhắc định kỳ không làm gián đoạn việc sử dụng.
5. Sau năm yêu cầu ban đầu: 422 kiểm thử, 421 đạt và 1 bỏ qua; nhật ký lưu tại `research/v621-checks/survey-only/`. Sau khi bổ sung SURVEY-002: 430 kiểm thử, 429 đạt và 1 bỏ qua do chưa có khóa API thật. TypeScript và build thành công. Không xem kiểm thử mô phỏng là thực nghiệm với người dùng.



## Nhật ký câu lệnh SURVEY-002

Yêu cầu bổ sung của người dùng (không có thời điểm gửi nguyên thủy được xác minh):

```text
Tiếp tục việc gian dở 
Cập nhật chỉnh sửa 
Hai chế độ “ kiểm tra lời giải” và “ so sánh cách giải” cập nhật đưa ra câu trả lời tốt hơn và có ( đang phát triển)
```

### Chuyển yêu cầu thành chỉ dẫn sư phạm

| Mục tiêu | Quy tắc đưa vào prompt | Kiểm chứng trong đợt này |
| --- | --- | --- |
| Kiểm tra có căn cứ | Tách dữ kiện, bài làm và kết luận; dừng ở lỗi đầu tiên; hỏi điều kiện chưa được bảo đảm. | Prompt riêng chỉ được ghép cho review; ví dụ sai dấu hiệu hình chữ nhật kiểm tra được cấu trúc. |
| So sánh có tiêu chí | Dùng ý tưởng học sinh đã nêu; xác minh tính hợp lệ; mỗi lượt chọn một tiêu chí và yêu cầu lí do. | Prompt riêng chỉ được ghép cho compare; ví dụ hai hướng nhận biết hình bình hành. |
| Rèn thao tác tư duy | Review ưu tiên Phân tích; compare ưu tiên So sánh; chuyển thao tác khi nhiệm vụ yêu cầu. | Ví dụ biên soạn có tên thao tác, SO_DO và một câu hỏi chính. |
| Phân hóa hỗ trợ | Em cần củng cố: chỉ rõ đối tượng, giải thích thuật ngữ; em khá/giỏi: tự nhận ra điều kiện hoặc tự chọn tiêu chí. | Kiểm tra bối cảnh mức tự khai tiếp tục có trong system instruction. |
| Giữ vai trò gợi mở | Không viết hộ lời giải, không bịa hướng thứ hai, chờ học sinh sửa/chọn và nêu căn cứ. | Chính sách cấm lời giải hoàn chỉnh vẫn có trong hai chế độ; bộ bảo vệ đầu ra cũ giữ nguyên. |

Đợt SURVEY-001 không thay prompt. SURVEY-002 bổ sung prompt chuyên biệt ở `server/review-compare-policy.mjs`, kế thừa quy tắc phát triển tư duy và cá nhân hóa đã có trong bản nền (`server/research-pedagogy.mjs`, `server/adaptive-policy.mjs`). Không huấn luyện/fine-tune trọng số Gemini và không có nghiên cứu thực nghiệm mới trong đợt này. Prompt guide, tài liệu nghiên cứu có sẵn và quy trình dựng hình được giữ nguyên.

Không tạo số liệu học sinh, hiệu quả giảng dạy hoặc phản hồi khảo sát để làm minh chứng. Muốn kết luận về chất lượng sư phạm thực tế cần chạy Gemini với khóa hợp lệ và có giáo viên đối chiếu hội thoại theo tiêu chí; các ví dụ trong kiểm thử chỉ là mẫu chấp nhận được biên soạn.
