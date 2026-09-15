# Vận dụng nghiên cứu về thao tác tư duy

Nguồn chính: Nguyễn Thanh Hưng, Ngô Tùng Nhân (2019). **Rèn luyện thao tác tư duy cho học sinh trong dạy học chương “Tứ giác” (Toán 8) ở trường trung học cơ sở**. Tạp chí Giáo dục, số đặc biệt tháng 4/2019, tr.184–187. Đối chiếu trực tiếp bản PDF giáo viên cung cấp, gồm 4 trang.

## Ánh xạ vào gia sư

| Mục trong nghiên cứu | Cách vận dụng | Điều kiện kiểm tra |
|---|---|---|
| 2.2.1, tr.184–185: phân tích, tổng hợp | Đi ngược từ kết luận tới một điều kiện đủ; sau đó học sinh tự ghép các bước có căn cứ | Một mắt xích và một câu hỏi mỗi lượt; không phát toàn bộ hệ thống câu hỏi cùng đáp án trong ngoặc |
| 2.2.2, tr.185–186: tương tự | Đối chiếu cấu trúc và điều kiện với bài đã học | Hỏi điều gì tương ứng và điều gì thay đổi; không coi đổi tên điểm là chuyển giao đầy đủ |
| 2.2.3, tr.186: đặc biệt hóa, khái quát hóa | Dùng trường hợp riêng để thử phỏng đoán; rút kinh nghiệm có điều kiện sau khi học sinh tự chứng minh | Không dùng một hình vẽ để chứng minh chung; không tự đẩy sang đa giác tổng quát ngoài kiến thức học sinh |
| 2.2.4, tr.186–187: so sánh | Chọn một tiêu chí: loại hình, đường chéo hoặc đường trung bình | Phân biệt tính chất và dấu hiệu; tránh bảng đáp án hoặc nhiều câu hỏi trong một lượt |
| Kết luận, tr.187 | Điều chỉnh điểm bắt đầu và độ cụ thể của câu hỏi theo mức học sinh | Hồ sơ tự khai chỉ là điểm khởi đầu; căn cứ thực tế trong câu trả lời mới quyết định tăng/giảm hỗ trợ |

Phản ví dụ được bổ sung để kiểm tra điều kiện chưa đủ. Đây là quyết định thiết kế của ứng dụng, không được trình bày như một mô-đun riêng đã thực nghiệm trong bài báo.

## Điểm hiệu chỉnh khi sử dụng tài liệu

Đoạn so sánh cuối trang 187 diễn đạt hai đường chéo hình thoi “không bằng nhau”. Ứng dụng dùng diễn đạt đúng: **không nhất thiết bằng nhau**; khi hình thoi là hình vuông thì hai đường chéo bằng nhau. Những mệnh đề trong tài liệu vẫn được kiểm tra toán học trước khi đưa vào câu hỏi và thẻ lý thuyết.

Bài báo có các lời giải mẫu để minh họa. Theo yêu cầu hiện tại, gia sư không xuất các lời giải đó; học sinh phải tự đi qua các câu hỏi. Không coi việc đưa tài liệu vào prompt là huấn luyện lại mô hình, hoặc là bằng chứng đã nâng cao kết quả học tập. Hiệu quả trên học sinh thật cần nghiên cứu riêng.

## Điều chỉnh theo học sinh

| Mức tự khai | Điểm bắt đầu | Thao tác ưu tiên và cách hỏi |
|---|---|---|
| Mất gốc | Một đối tượng, một thuật ngữ, một quan hệ | Phân tích và so sánh trực tiếp; câu ngắn, nhắc định nghĩa khi cần |
| Cơ bản | Đối chiếu một điều kiện của dấu hiệu | Phân tích rồi tổng hợp bước học sinh đã tự làm |
| Khá | Học sinh tự chọn dấu hiệu và nêu căn cứ | Phân tích độc lập, tương tự hóa sau khi giải được |
| Giỏi | Học sinh tự lựa chọn đối tượng và kiểm tra điều kiện | So sánh cách tiếp cận, đặc biệt hóa, phản ví dụ |
| Học sinh năng khiếu | Học sinh giải thích tính cần/đủ và phạm vi áp dụng | Khái quát hóa có điều kiện, chuyển giao trong kiến thức đã học |

Không gọi học sinh là yếu/kém trong hội thoại, không xếp hạng từ tên/trường/giới tính. Bộ điều phối xét ba dấu hiệu: đúng đối tượng, đúng quan hệ, đúng căn cứ. Khi có đủ, giảm hỗ trợ; khi thiếu căn cứ, hỏi căn cứ; khi sai, chỉ xử lý lỗi đầu tiên; khi chưa biết, chia nhỏ cùng mắt xích.

## Ba đoạn hội thoại minh họa

Các đoạn sau là kịch bản biên soạn để đánh giá hành vi, **không phải log Gemini đã chạy**. Trong ứng dụng mỗi lượt còn có khối `[SO_DO]` bốn trường.

**Học sinh trả lời đúng, có căn cứ**

Em: “AE ∥ CF vì hai đường thẳng phân biệt này cùng vuông góc với BD.”

Thầy: “Thao tác tư duy: Phân tích — đối chiếu điều kiện còn thiếu của dấu hiệu em chọn. Gợi mở: Với dấu hiệu một cặp cạnh đối vừa song song vừa bằng nhau, em còn cần chứng minh điều kiện nào?”

**Học sinh trả lời sai**

Em: “Mọi tứ giác có hai đường chéo vuông góc đều là hình thoi.”

Thầy: “Thao tác tư duy: So sánh — kiểm tra điều kiện về loại hình trước khi dùng dấu hiệu. Nhận định của em chưa xét điều kiện về tứ giác ban đầu. Gợi mở: Dấu hiệu đường chéo vuông góc em đã học yêu cầu tứ giác ban đầu thuộc loại hình nào?”

**Học sinh chưa biết làm**

Em: “Em chưa hiểu trung điểm cho mình biết gì.”

Thầy: “Thao tác tư duy: Phân tích — trở về định nghĩa để đọc một giả thiết. Trung điểm nằm trên đoạn thẳng và cách đều hai đầu mút. Gợi mở: Nếu E là trung điểm của AB, hai đoạn nào cần được đối chiếu độ dài theo định nghĩa đó?”
