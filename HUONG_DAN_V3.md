# V3 — Hỏi gợi mở bằng thao tác tư duy

Bản nền: chatbot-toan-gia-dinh-TU-GIAC-AI-TUTOR-PRO-V2(2).zip đính kèm. V3 chỉ thay server/policy.mjs, bổ sung kiểm thử và tài liệu. Không sửa frontend, cấu hình, mã lớp HOCGIOITOAN, lời gọi Gemini, model, request/response hoặc Google Forms. dist được build lại từ nguồn.

## Cơ chế

Năm giai đoạn: đọc đề → phân tích ngược về điều kiện đủ → nối giả thiết với mục tiêu nhỏ → tự tổng hợp lời giải → tự kiểm tra/chuyển giao. Không cố định mỗi giai đoạn một lượt: chuyển bước dựa vào câu trả lời có căn cứ trong lịch sử. Mỗi lượt một nhiệm vụ, một câu hỏi chính, một thao tác tư duy phù hợp. Lượt đầu không giải hết; lời giải tham chiếu không được coi là bài học sinh đã làm.

Hỗ trợ tăng qua năm mức: nhắc kiến thức, chỉ đối tượng, gợi quan hệ, minh họa một bước, lời giải có căn cứ + tự kiểm tra. Đúng kèm căn cứ thì giảm hỗ trợ; sai thì xử lý lỗi đầu tiên. Sau định hướng đầu, học sinh chủ động xin lời giải được nhận hỗ trợ trực tiếp. Không yêu cầu hoàn thành cả thang một cách máy móc.

Định dạng SO_DO giữ nguyên bốn nhãn. Sau sơ đồ có Thao tác tư duy và Gợi mở. Lượt tổng kết đã đủ bằng chứng hiểu không đặt câu hỏi mới và mới có dấu kết thúc. Nút kết thúc chủ động giữ nguyên.

Đây là cơ chế bằng system prompt, dựa vào lịch sử API hiện có, không thêm bộ máy trạng thái hoặc bộ lọc viết lại câu trả lời. Vì giữ nguyên API/renderer, quy tắc ngữ nghĩa do mô hình thực hiện; không thể chứng minh sự tuân thủ tuyệt đối bằng kiểm thử chuỗi chỉ dẫn. Khi lịch sử bị cắt, prompt yêu cầu hỏi lại bước gần nhất. Hành vi lời giải và mức gợi ý cần nghiệm thu thực tế.

## Kiểm thử và giới hạn bằng chứng

- npm test: kiểm thử hồi quy API, mã lớp, phản hồi Forms, parser, cá nhân hóa; kiểm tra hợp đồng prompt và prompt thật được gửi vào systemInstruction của cả guide/review/compare bằng provider mô phỏng.
- npx tsc --noEmit: kiểm tra kiểu dữ liệu.
- npm run build: tạo dist từ nguồn; không sửa build thủ công.
- tests/pedagogy-cases.mjs: các hội thoại nghiệm thu cho lượt đầu, xin đáp án ngay, lời giải tham chiếu, năm mức gợi ý, đúng/giảm hỗ trợ, sai/lỗi đầu tiên, thiếu dữ kiện, hiểu giả và bằng chứng hiểu.
- tests/pedagogy-live.test.mjs: mặc định SKIP khi chưa bật hoặc thiếu khóa thật. Khi bật, dùng chính handleChat, model và cấu hình hiện có; kiểm tra tự động sơ đồ, nhãn thao tác, số dấu hỏi, độ dài và kết thúc sớm. Đây chỉ là kiểm tra cấu trúc; giáo viên phải đọc từng phản hồi theo rubric để đánh giá tính đúng và hành vi.

Chạy nghiệm thu thật tùy chọn (có sử dụng hạn mức Gemini), đặt khóa trong .env như bản cũ:

```bash
RUN_PEDAGOGY_LIVE=1 node --env-file-if-exists=.env --test tests/pedagogy-live.test.mjs
```

PowerShell:

```powershell
$env:RUN_PEDAGOGY_LIVE="1"
node --env-file-if-exists=.env --test tests/pedagogy-live.test.mjs
```

Kết quả ghi research/live-results/pedagogy.json, không ghi API key. Các ca dùng học sinh giả lập, không gửi Google Forms. Rubric PENDING phải được giáo viên đánh giá; test xanh không tự xác nhận độ phù hợp ngữ nghĩa. Khi mô hình trả lời sai phải xem ca, sửa prompt trong phạm vi cần thiết và nghiệm thu lại. V3 chưa chạy Gemini thật vì không được cung cấp khóa.

## Ba hội thoại minh họa được soạn trước, không phải đầu ra Gemini đã kiểm chứng

### 1. Học sinh đúng — giảm hỗ trợ

Đề: Hình bình hành ABCD có AC ⟂ BD. Chứng minh ABCD là hình thoi.

Em: Hình bình hành có hai đường chéo vuông góc là hình thoi. Bài đã cho cả hai điều kiện nên áp dụng được.

Thầy:

[SO_DO]
DU_KIEN: ABCD là hình bình hành; AC ⟂ BD; em đã đối chiếu đủ điều kiện.
MUC_TIEU: Tự tổng hợp lời chứng minh.
CAU_NOI: Dấu hiệu hình thoi vừa được em chọn đủ điều kiện áp dụng.
BUOC_TIEP: Viết lời chứng minh ngắn có căn cứ.
[/SO_DO]
Thao tác tư duy: Tổng hợp — ghép dữ kiện với dấu hiệu đã chọn.
Em đã nêu đủ hai điều kiện, Thầy để em tự sắp xếp lời giải.
Gợi mở: Em hãy viết lời chứng minh bằng 2–3 câu, nêu rõ dấu hiệu được dùng?

### 2. Học sinh sai — xử lý lỗi đầu tiên

Em: Nhìn hình em thấy AC = BD, nên ABCD là hình vuông rồi là hình thoi.

Thầy:

[SO_DO]
DU_KIEN: Đề cho ABCD là hình bình hành và AC ⟂ BD, chưa cho AC = BD.
MUC_TIEU: Kiểm tra căn cứ của khẳng định AC = BD.
CAU_NOI: Quan sát trên hình chưa đủ để kết luận hai đoạn bằng nhau.
BUOC_TIEP: Đối chiếu khẳng định đầu tiên với giả thiết.
[/SO_DO]
Thao tác tư duy: So sánh — đối chiếu điều em nhận xét với điều đề cho.
Chỗ cần xem lại trước là AC = BD: hiện em mới dựa vào nét vẽ.
Gợi mở: Khẳng định AC = BD của em có căn cứ nào từ đề bài hoặc kết quả đã chứng minh?

### 3. Học sinh chưa biết — tăng gợi ý

Bối cảnh: bài hình bình hành ABCD, O là giao điểm AC và BD; cần dùng AO = OC trong bước tiếp. Thầy đã nhắc tính chất đường chéo ở mức 1.

Em: Em vẫn chưa biết xét đoạn nào.

Thầy:

[SO_DO]
DU_KIEN: ABCD là hình bình hành; O là giao điểm AC và BD.
MUC_TIEU: Tìm quan hệ giữa AO và OC.
CAU_NOI: Tính chất giao điểm hai đường chéo của hình bình hành.
BUOC_TIEP: Xét vị trí O trên đường chéo AC.
[/SO_DO]
Thao tác tư duy: Phân tích — tập trung vào một đường chéo.
Thầy gợi thêm: em chỉ cần xét hai đoạn AO và OC trên AC.
Gợi mở: Tính chất hai đường chéo của hình bình hành giúp em kết luận gì về AO và OC, với căn cứ nào?

## Triển khai

Giữ cách chạy/deploy theo README.md. Không đổi bất kỳ biến môi trường nào cho V3. Các báo cáo V2 trong gói là hồ sơ lịch sử; xem BAO_CAO_V3.json để đối chiếu tệp của lần nâng cấp này.
