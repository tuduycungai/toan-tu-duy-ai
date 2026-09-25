# V5: Hồ sơ và phân loại người học

`lib/adaptive-learning.ts` lưu khối lớp, kiến thức nền, mức tự tin, mức học, mức hỗ trợ, kết quả chẩn đoán, quan sát câu trả lời và nhật ký câu hỏi. Giao diện nằm trong mục mở rộng **Hồ sơ học tập** cạnh sơ đồ định hướng. Mặc định lớp 8; có thể chọn lớp 6–9.

## Bằng chứng và cách điều chỉnh

Bốn câu chẩn đoán kiểm tra bốn phương diện: đọc giả thiết/kết luận; nhớ định nghĩa/tính chất; nhận dạng hình; suy luận và điều kiện áp dụng định lý. Mỗi câu cần một lựa chọn và lời giải thích. Chỉ lựa chọn được chấm theo đáp án xác định; lời giải thích được lưu để đối chiếu, không tự coi là lập luận đúng.

Không đề xuất mức mới trước khi đủ bốn câu khác nhau thuộc bốn phương diện. Trả lời lại cùng một câu không tăng số bằng chứng.

| Lựa chọn đúng trong 4 câu | Mức khởi đầu đề xuất | Hỗ trợ mặc định |
| ------------------------: | -------------------- | --------------: |
|                       0–1 | Mất căn bản          |             3/3 |
|                         2 | Cơ bản               |             2/3 |
|                         3 | Khá                  |             1/3 |
|                         4 | Giỏi                 |             0/3 |

Đây là quy tắc sư phạm ban đầu của ứng dụng, chưa phải thang đo năng lực được nghiên cứu thực nghiệm. Bốn câu không đủ kết luận toàn diện về một học sinh. Người học/giáo viên có thể chỉnh mức; khi chỉnh thủ công, đề xuất tự động không ghi đè lựa chọn đó. Hồ sơ cũ có nhãn “Mất gốc” hoặc “Học sinh năng khiếu” được quy về mức tương ứng trong bảng hỗ trợ mới, vẫn giữ tương thích thông tin gốc.

## Qua nhiều lượt hội thoại

Mỗi câu trả lời được lưu dưới dạng quan sát: văn bản bằng chứng, dấu hiệu thao tác tư duy, phần cần làm rõ, nhu cầu hỗ trợ, thời điểm. Các dấu hiệu “vì”, “suy ra”, “chưa hiểu”, “so sánh” giúp điều chỉnh cách hỏi; **không được dùng để chấm đúng/sai nội dung toán học**. Quan sát tự động mang cờ `verified: false`.

Hai lượt liên tiếp có yêu cầu hỗ trợ có thể tăng một mức. Khi có ba lượt liên tiếp trình bày căn cứ bằng lời, ứng dụng có thể giảm độ trực tiếp của gợi ý, nhưng vẫn yêu cầu AI kiểm tra quan hệ và điều kiện định lý. Cơ chế này điều chỉnh hỗ trợ, không tự tăng mức học hoặc xác nhận bài làm đúng. Sang bài mới, câu hỏi đầu không coi bài làm cũ là bước đã thực hiện trong bài mới.

Ở mức mất căn bản, học sinh vẫn thực hiện phân tích/cụ thể hóa và giải thích một quan hệ. Ở mức khá/giỏi, câu hỏi ưu tiên tự chọn chiến lược, điều kiện đủ, so sánh; chỉ khái quát sau khi học sinh đã có lập luận.

## Lưu và xóa

Chỉ lưu hồ sơ mở rộng ở `localStorage` khi chọn ghi nhớ trên thiết bị. Tối đa 40 quan sát và 40 câu hỏi; tối đa bốn kết quả chẩn đoán. Xóa hồ sơ của giao diện cũ cũng xóa dữ liệu học tập V5. Không thêm cơ sở dữ liệu hoặc tài khoản giáo viên. Việc chỉnh mức là thao tác trên thiết bị hiện tại, không phải cổng quản trị giáo viên từ xa.

Tên, email và trường trong biểu mẫu không tự gửi đến Gemini. Nội dung học sinh tự gõ trong hội thoại vẫn đi qua API như trước. Hồ sơ học tập gửi kèm chỉ phục vụ cá nhân hóa theo lớp, mức học, nhu cầu hỗ trợ, chẩn đoán và bằng chứng của bước đang làm.
