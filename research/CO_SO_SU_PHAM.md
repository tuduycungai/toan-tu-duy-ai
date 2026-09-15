# Cơ sở sư phạm cho gia sư AI rèn luyện tư duy hình học tứ giác

**Cập nhật cho V4.4 ngày 14/09/2026:** Quy tắc hiện tại chỉ hướng dẫn bằng câu hỏi, không có ngoại lệ xin lời giải. Bản này đã đối chiếu toàn văn nghiên cứu 2019 do giáo viên cung cấp. Cách vận dụng cụ thể nằm trong `AP_DUNG_NGHIEN_CUU_2019.md`; nhật ký câu lệnh và đóng góp mã nguồn nằm trong `provenance`. Các ghi nhận phạm vi đọc ở danh mục cũ dưới đây là lịch sử của bản trước, không phải nhật ký đọc mới của V4.4.

## 1. Mục đích và phạm vi

Ứng dụng được thiết kế cho học sinh đang học chương Tứ giác lớp 8, với mục đích hỗ trợ xây dựng lời chứng minh có căn cứ. Kết quả mong đợi là học sinh phân biệt được giả thiết với kết luận, biết chọn dấu hiệu phù hợp, giải thích được bước then chốt và kiểm tra lại một khẳng định. Cụm từ “phản xạ tư duy” trong tài liệu này chỉ thói quen đặt câu hỏi và kiểm chứng; không mang nghĩa học thuộc một chuỗi thao tác để áp dụng máy móc.

Phạm vi nội dung gồm hình thang cân, hình bình hành, hình chữ nhật, hình thoi, hình vuông và các kiến thức tam giác cần thiết. Đường trung bình, góc, song song, vuông góc và đối xứng được sử dụng khi phục vụ bài tứ giác. Ứng dụng không mở rộng sang mọi môn học hoặc mọi chủ đề toán; chính sách gia sư yêu cầu chuyển các câu hỏi ngoài lề về mục tiêu học tập.

Đây là một thiết kế ứng dụng dựa trên tài liệu, chưa phải nghiên cứu thực nghiệm về hiệu quả của chính phần mềm. Không có quá trình huấn luyện lại hoặc tinh chỉnh trọng số Gemini trong bản phát hành. Cơ sở sư phạm được chuyển thành chỉ dẫn, bài mẫu, cách phản hồi và tiêu chí kiểm tra; không được dùng thay cho kết quả đánh giá trên học sinh thật.

## 2. Bằng chứng và mức độ áp dụng

Tài liệu của Bộ GDĐT và Trường ĐHSP Hà Nội mô tả tư duy và lập luận toán học qua các thao tác so sánh, phân tích, tổng hợp, đặc biệt hóa, khái quát hóa, tương tự và sử dụng chứng cứ. Tài liệu cũng trình bày phương pháp và đánh giá năng lực. Đây là căn cứ phù hợp để chọn mục tiêu môn học; không phải bằng chứng thực nghiệm cho một chatbot. Xem các trang in 21–23, 58–61, 82–83.[1]

Hướng dẫn IES về giải quyết vấn đề toán học lớp 4–8 xếp tự giám sát/phản tư và biểu diễn trực quan ở mức bằng chứng mạnh; nhiều chiến lược giải ở mức vừa. Vì vậy, sơ đồ và tự kiểm tra là thành phần có cơ sở để đưa vào thiết kế. Mức bằng chứng này thuộc các khuyến nghị giáo dục của tài liệu, không tự chuyển thành hiệu quả đã được chứng minh của ứng dụng.[2]

Hướng dẫn IES về tổ chức học tập đề xuất xen kẽ bài giải mẫu với tự giải, kết hợp đồ họa với lời mô tả và đặt câu hỏi yêu cầu giải thích sâu. Những khuyến nghị đó gợi ý sử dụng sơ đồ ngắn kèm câu hỏi, rồi cho học sinh thực hiện một bước. Không có hàm ý rằng thêm nhiều hiệu ứng hoặc nhiều hình minh họa luôn giúp học tốt hơn.[3]

Aleven và Koedinger báo cáo hai thí nghiệm lớp học trong đó học sinh được yêu cầu giải thích các bước khi dùng Cognitive Tutor thể hiện mức hiểu và chuyển giao tốt hơn nhóm không giải thích bước. Nghiên cứu có liên quan gần đến hỗ trợ học hình học bằng máy tính, nhưng Cognitive Tutor không phải Gemini. Áp dụng hợp lí là yêu cầu nêu căn cứ thay vì chỉ nhập kết quả.[4]

Chi và cộng sự phân tích cách học sinh tự giải thích khi học ví dụ cơ học. Nhóm học hiểu sâu tạo ra nhiều liên hệ giữa bước giải và nguyên lí, đồng thời theo dõi chỗ mình chưa hiểu tốt hơn. Đây là nguồn bổ trợ cho hoạt động tự giải thích; bối cảnh gốc không phải chương tứ giác ở Việt Nam.[5]

Hattie và Timperley chỉ ra rằng tác động của phản hồi phụ thuộc nội dung và cách phản hồi; có thể tích cực hoặc tiêu cực. Trong thiết kế này, phản hồi hướng vào bước làm và căn cứ cần sửa, tránh chỉ khen con người hoặc nói “sai rồi” mà không giúp tiến tiếp. Đánh giá hài lòng cuối buổi không được xem là bằng chứng đã đạt năng lực toán học.[6]

Koedinger và Aleven bàn về sự cân bằng giữa cung cấp hỗ trợ và giữ lại thông tin để người học tự làm. Không có một mức hỗ trợ tối ưu duy nhất áp dụng cho mọi trường hợp. Quy tắc tăng dần gợi ý và giảm hỗ trợ khi học sinh trả lời có căn cứ là lựa chọn thiết kế cần tiếp tục kiểm nghiệm.[7]

Một bài báo trong nước năm 2025 mô tả thiết kế tình huống về khái niệm và tính chất hình thang cân ở Toán 8. Trang tạp chí có tóm tắt nêu thực nghiệm, nhưng chưa cung cấp đủ thông tin để thẩm định mẫu, công cụ đo và độ lớn hiệu quả. Tài liệu được dùng để đối chiếu tính phù hợp chủ đề, không dùng để tuyên bố hiệu quả phần mềm.[8]

Hướng dẫn UNESCO nhấn mạnh cách tiếp cận lấy con người làm trung tâm, tính phù hợp với người học và việc xem xét công cụ trong bối cảnh giáo dục. Bản thiết kế giữ giáo viên ở vai trò kiểm tra nội dung, hiển thị rõ gia sư AI và giải thích dữ liệu nào được gửi khi đánh giá.[9]

## 3. Chuyển mục tiêu thành hoạt động có thể quan sát

Bảng sau là khung hoạt động đề xuất cho phiên bản này. Các câu hỏi do người phát triển biên soạn để sử dụng trực tiếp trong bài tứ giác, không phải câu trích từ nghiên cứu.

| Thao tác | Hoạt động học sinh cần thực hiện | Câu gợi mở mẫu | Dấu hiệu quan sát được |
|---|---|---|---|
| Phân tích | Tách kết luận thành một điều kiện đủ nhỏ hơn | Muốn kết luận AECF là hình bình hành, em định kiểm tra cặp cạnh nào? | Nêu đúng đối tượng và dấu hiệu |
| Tổng hợp | Ghép các quan hệ đã chứng minh thành chuỗi lập luận | Từ AE = CF và AE ∥ CF, em kết luận được gì? | Mỗi suy ra có căn cứ |
| So sánh | Đối chiếu điều kiện của hai dấu hiệu hoặc hai cách giải | Hai cách này cùng dùng giả thiết nào; cách nào cần ít bước phụ hơn? | Phân biệt điểm giống và khác |
| Phản ví dụ | Tìm một hình thỏa giả thiết nhưng không thỏa kết luận | Hai đường chéo bằng nhau và vuông góc đã bảo đảm trung điểm chưa? | Kiểm tra đủ cả giả thiết và phủ định kết luận |
| Tương tự hóa | Giữ cấu trúc lời giải khi đổi tên điểm hoặc điều kiện | Nếu E, F không là trung điểm nhưng AE = CF thì cách làm nào còn dùng được? | Nêu lí do phần nào được chuyển sang bài mới |
| Đặc biệt hóa | Xét thêm điều kiện để hình bình hành thành hình đặc biệt | Tam giác vuông ban đầu cần thêm gì để tứ giác dựng được là hình vuông? | Nêu điều kiện cùng chiều suy luận |
| Khái quát hóa | Phát biểu quan hệ cho một lớp hình lớn hơn | Với tứ giác lồi bất kì, bốn trung điểm còn tạo được hình bình hành không? | Giữ rõ điều kiện, tránh kết luận từ một hình |

Không suy luận rằng học sinh đã làm chủ một thao tác chỉ từ một lần trả lời đúng. Cần cho học sinh trình bày lại trong một bài có thay đổi cấu trúc bề mặt hoặc điều kiện. Các ô “Em tự kiểm tra” trong giao diện là tự nhận xét của học sinh, không phải điểm đo khách quan.

## 4. Cấu trúc sơ đồ định hướng

Sơ đồ có hai đầu vào song song: **Giả thiết** và **Mục tiêu**. Hai đầu vào dẫn tới **Kết nối kiến thức**, rồi tới **Bước em tự làm**. Cấu trúc này giúp phân biệt điều đã biết với điều cần tìm, đồng thời tránh một chuỗi mũi tên khiến người học nhầm kết luận là giả thiết.

Khi chọn bài mẫu, sơ đồ đã được biên soạn cho bài đó. Khi học sinh nhập bài khác, ứng dụng hiển thị “Khung định hướng chung” cho đến khi có nội dung cụ thể từ gia sư. Sơ đồ được cập nhật theo phản hồi mới và có thể xem lại theo từng lượt. Không trình bày sơ đồ chung như thể AI đã phân tích xong đề bài chưa nhận được.

Một sơ đồ tốt cần chỉ rõ đối tượng hình học. Ví dụ, “Xét tính chất đường chéo” quá rộng; “AD và BC là hai đường chéo của tứ giác ABDC; chúng có chung trung điểm nào?” có thể giúp học sinh bắt đầu. Ở lượt đầu, chỉ mở một mối liên hệ đủ để định hướng, chưa dựng toàn bộ lời giải thay học sinh.

Sơ đồ là bản giải thích phục vụ học tập, không phải bản ghi suy nghĩ nội bộ của mô hình. Việc hiển thị trước phần hướng dẫn giúp học sinh đọc theo thứ tự: xác định nhiệm vụ rồi thực hiện một bước. Các thông tin trong sơ đồ vẫn có thể sai khi do AI tạo, nên không dùng hình vẽ hoặc sơ đồ để thay thế chứng minh.

## 5. Quy trình điều khiển một phiên gợi mở

**Tiếp nhận.** Gia sư xác định bài toán có nằm trong chủ đề hay không; nếu thiếu dữ kiện hoặc thứ tự đỉnh gây nhầm lẫn, hỏi bổ sung. Với bài có nhiều ý, làm từng ý và giữ rõ mục tiêu đang xét. Một câu trả lời ngắn như “vâng” hoặc “em chưa hiểu” được đọc trong ngữ cảnh hiện tại.

**Định hướng.** Trình bày sơ đồ rồi hỏi một câu cụ thể. Chẳng hạn, với bài đối xứng qua trung điểm, chưa cần hỏi ngay “hãy chứng minh hình chữ nhật”; trước hết yêu cầu học sinh nhận diện hai đường chéo và các cặp đoạn bằng nhau.

**Phản hồi.** Nếu học sinh đúng, chỉ rõ căn cứ đã dùng đúng và chuyển sang bước kế. Nếu sai, chỉ lỗi đầu tiên có ý nghĩa; tránh sửa hết mọi dòng khiến người học không biết cần thay đổi gì. Nếu thiếu cơ sở, dùng “chưa đủ để kết luận” thay cho khẳng định bài làm hoàn toàn sai.

**Tăng hỗ trợ.** Khi học sinh chưa biết bắt đầu, lần lượt nhắc dấu hiệu, chỉ cặp đối tượng cần xét và thu nhỏ nhiệm vụ. Không lặp đi lặp lại một câu hỏi để ép học sinh đoán ý gia sư. Theo yêu cầu cập nhật, việc xin đáp án không mở quyền nhận lời giải hoàn chỉnh; gia sư tiếp tục hỏi một bước phù hợp và yêu cầu căn cứ.

**Tự kiểm tra.** Sau khi hoàn thành chứng minh, học sinh giải thích bước then chốt hoặc xét một thay đổi giả thiết. “Đã đọc xong” không tự động đồng nghĩa “đã hiểu”. Nút đánh giá chủ động luôn cho phép kết thúc theo lựa chọn của học sinh, độc lập với đánh giá năng lực.

**Kết thúc.** Lời mời đánh giá tự động chỉ được phát khi gia sư đánh dấu đã hoàn tất các nhiệm vụ và phần tự kiểm tra. Ứng dụng còn yêu cầu đã có lượt trao đổi trước đó để tránh mở đánh giá ngay lượt đầu. Học sinh được đóng biểu mẫu để tiếp tục; hệ thống không ép chọn số sao cao.

## 6. Ba mẫu phản hồi sư phạm

### Mẫu 1: Nối trung điểm với dấu hiệu hình bình hành

Bài: Tam giác ABC vuông tại A; M là trung điểm BC; D đối xứng A qua M. Nhận biết ABDC.

Học sinh: “M là trung điểm BC nên ABDC là hình bình hành.”

Phản hồi đề xuất: “Em đã chỉ ra được một đường chéo bị chia đôi. Để dùng dấu hiệu nhận biết hình bình hành, ta còn cần kiểm tra đường chéo AD. Giả thiết D đối xứng với A qua M cho em điều gì về MA và MD?”

Điểm cần tránh: khen kết luận đúng ngay khi lập luận còn thiếu một điều kiện. Việc kết luận đúng do đoán vẫn khác với một lời giải đủ căn cứ.

### Mẫu 2: Phản ví dụ cho một kết luận quá mạnh

Bài: Hai đường chéo bằng nhau và vuông góc có đủ để là hình vuông không?

Học sinh: “Có, vì đường chéo của hình vuông có hai tính chất ấy.”

Phản hồi đề xuất: “Em đang dùng tính chất của hình vuông theo chiều ngược lại. Ta cần kiểm tra chiều ngược ấy có đúng không. Hãy dựng AC = BD = 4 cm, vuông góc tại O, với OA = 3 cm, OC = 1 cm, OB = OD = 2 cm. Tứ giác này có thể là hình bình hành không? Vì sao?”

Điểm cần tránh: chỉ nói “sai” hoặc đưa ra một hình phản ví dụ mà không kiểm tra nó thỏa giả thiết. Khi học sinh đã nhận ra chỗ thiếu, mới hỏi điều kiện bổ sung.

### Mẫu 3: Giảm hỗ trợ sau khi đã hiểu

Bài: Bốn trung điểm của tứ giác lồi tạo hình bình hành.

Học sinh đã chứng minh EF ∥ HG và EF = HG bằng đường trung bình.

Phản hồi đề xuất: “Em đã đủ căn cứ kết luận EFGH là hình bình hành. Bây giờ, nếu AC ⟂ BD, em hãy tự xác định một góc của EFGH và giải thích vì sao góc ấy vuông. Em cần dùng thêm quan hệ song song nào?”

Điểm cần tránh: lặp nguyên lời giải phần a hoặc tự đưa toàn bộ phần b ngay khi người học đã có khả năng làm tiếp.

## 7. Ngân hàng bài mẫu và kiểm chứng

Sáu bài mẫu nền tảng của ứng dụng được biên soạn theo các cấu trúc cơ bản của chương trong `lib/learning.ts`. V4.4 bổ sung 81 bài từ phiếu giáo viên cung cấp trong `lib/worksheets.ts`, kèm 93 hình; danh mục và các chỗ biên tập được lưu trong `worksheet-checks/DANH_MUC_81_BAI.md`. Lời giải tham chiếu trong tài liệu không được dùng làm ngoại lệ cung cấp đáp án cho học sinh. Nội dung chưa gắn nhãn “đã được hội đồng chuyên môn duyệt”.

| Bài | Cấu trúc toán học | Điểm phải kiểm tra |
|---|---|---|
| Bốn trung điểm | Đường trung bình và dấu hiệu hình bình hành | Tứ giác lồi, đúng cặp đường chéo tương ứng |
| Tam giác vuông và đối xứng | Hai đường chéo cùng trung điểm | Đúng thứ tự đỉnh ABDC, góc BAC là góc của tứ giác |
| Đồng quy trong hình bình hành | Hai hình bình hành chung một đường chéo | Xác định cùng trung điểm AC, không suy luận theo hình |
| Hình thang cân | Hai tam giác vuông bằng nhau | E, F thuộc đáy; sử dụng đúng cạnh huyền và cạnh góc vuông |
| Hai điểm trên hình vuông | Cạnh–góc–cạnh và phân giác | E, F nằm trong cạnh để tránh cấu hình suy biến |
| Phản ví dụ đường chéo | Phân biệt cần và đủ | Đường chéo bằng nhau, vuông góc nhưng không cùng trung điểm |

Hình SVG minh họa được dựng từ các điểm đã xác định. Một số hình không theo tỉ lệ độ dài ghi trong đề; ứng dụng ghi rõ hình không thay cho giả thiết. Thời gian trên thẻ bài là gợi ý sử dụng, không phải thời gian đã đo trên học sinh.

Các bài sinh mới bằng AI vẫn cần kiểm tra. Việc có sáu bài mẫu đúng không bảo đảm mọi bài Gemini tạo đều đúng. Khi triển khai trong lớp, nên bắt đầu từ ngân hàng mẫu, sau đó cho giáo viên rà soát thêm các biến thể có điều kiện phức tạp.

## 8. Hồ sơ, đánh giá và dữ liệu

Trình tự sử dụng là: kết nối bằng mã lớp, điền thông tin, học với gia sư, chọn mức hài lòng và đồng ý gửi. Hồ sơ không tự gửi thành một dòng riêng ngay khi nhập; họ tên, trường, email được ghép cùng số sao và nhận xét ở lần gửi đánh giá. Cách này tránh sinh các dòng chỉ có danh tính nhưng chưa có đánh giá.

Năm trường trong Google Form là họ tên, trường, email, mức độ hài lòng và nhận xét. Nếu học sinh chọn kèm tóm tắt, mục nhận xét có thêm lớp, mức độ tự khai, chủ đề, mục tiêu và các ô tự kiểm tra đã chọn. Toàn bộ hội thoại, mã truy cập và khóa API không được đưa vào Google Form.

Bản ứng dụng ghi rõ đồng ý gửi trước nút gửi. Mức sao ban đầu chưa được chọn, nhằm không mặc định phản hồi tích cực. Việc ghi nhớ hồ sơ trên thiết bị là lựa chọn riêng; không cần lưu lâu dài để thực hiện một buổi học. Học sinh dùng máy chung có thể bỏ ghi nhớ hoặc xóa hồ sơ.

Thông báo gửi thành công cần có xác nhận từ Google Forms, không chỉ HTTP 200. Nếu không xác nhận được, ứng dụng không tự gửi lại; mở lựa chọn biểu mẫu đã điền sẵn để học sinh kiểm tra. Chống trùng trên giao diện và trong một phiên server ấm không phải bảo đảm duy nhất toàn hệ thống, vì serverless có thể chạy nhiều instance.

## 9. Đánh giá hiệu quả sau triển khai

Khung đánh giá dưới đây là đề xuất kiểm nghiệm, chưa phải số liệu đã thu được. Nên phân biệt ba lớp: ứng dụng chạy đúng, học sinh thấy thuận tiện và học sinh thực sự tiến bộ trong lập luận. Số sao chỉ phản ánh lớp thứ hai, không thay thế bài kiểm tra học tập.

Có thể xây dựng hai bài kiểm tra tương đương trước và sau một chuỗi buổi học: một bài chứng minh dùng trung điểm, một bài nhận biết điều kiện đủ và một bài sửa sai. Nên có thêm bài chuyển giao sau một khoảng thời gian và thực hiện không có AI để quan sát khả năng tự làm. Nếu muốn suy luận tác động, cần thiết kế nhóm so sánh và kiểm soát khác biệt ban đầu; chưa nên dùng lời khẳng định nhân quả từ một lớp tự nguyện sử dụng.

Bảng tiêu chí đề xuất cho từng bài dùng các mức 0–2: đọc đúng giả thiết/kết luận; chọn dấu hiệu đủ điều kiện; trình bày liên kết có căn cứ; phát hiện giả thiết thiếu; giải thích được bước then chốt. Điểm phải do người chấm theo đáp án và tiêu chí công khai, không được gán từ số lượt chat hoặc lời tự nhận “em hiểu rồi”.

Nên lưu ví dụ lỗi theo mã ẩn danh để sửa chỉ dẫn, nhưng chỉ triển khai việc thu thập hội thoại nếu có một quy trình dữ liệu riêng. Phiên bản hiện tại không tự thu thập toàn bộ hội thoại. Người phụ trách có thể dùng danh sách ca kiểm tra trong tài liệu kỹ thuật để rà soát sau mỗi lần đổi model hoặc prompt.

## 10. Tài liệu tham khảo và phạm vi đọc

[1] Bộ Giáo dục và Đào tạo, Trường Đại học Sư phạm Hà Nội. **Tài liệu tìm hiểu chương trình môn Toán** (2019). Người biên soạn: Đỗ Đức Thái, Đỗ Tiến Đạt, Nguyễn Hoài Anh, Phạm Xuân Chung, Nguyễn Sơn Hà, Phạm Sỹ Nam. Đã truy cập PDF, tập trung các phần năng lực, phương pháp và đánh giá. [PDF tại HNUE](https://dtbdtx.hnue.edu.vn/Portals/0/Tai%20lieu%20tim%20hieu%20chuong%20trinh%20mon%20Toan.pdf).

[2] Woodward, J. và cộng sự. **Improving Mathematical Problem Solving in Grades 4 Through 8**. IES/What Works Clearinghouse, 2012, bản trang hướng dẫn ghi sửa đổi tháng 10/2018. Đã đọc khuyến nghị và mức bằng chứng trên trang chính thức. [Hướng dẫn IES](https://ies.ed.gov/ncee/WWC/PracticeGuide/16).

[3] Pashler, H. và cộng sự. **Organizing Instruction and Study to Improve Student Learning**. IES, 2007. Đã đọc các khuyến nghị và mô tả trên trang chính thức. [Hướng dẫn IES](https://ies.ed.gov/ncee/wwc/PracticeGuide/1).

[4] Aleven, V. A. W. M. M., & Koedinger, K. R. (2002). **An effective metacognitive strategy: learning by doing and explaining with a computer-based Cognitive Tutor**. Cognitive Science, 26(2), 147–179. Đã đọc tóm tắt, thông tin bài và phần nội dung được cung cấp trên trang nhà xuất bản. DOI: [10.1207/s15516709cog2602_1](https://doi.org/10.1207/s15516709cog2602_1).

[5] Chi, M. T. H., Bassok, M., Lewis, M. W., Reimann, P., & Glaser, R. (1989). **Self-Explanations: How Students Study and Use Examples in Learning to Solve Problems**. Cognitive Science, 13(2), 145–182. Đã đọc tóm tắt trên trang nhà xuất bản. DOI: [10.1207/s15516709cog1302_1](https://doi.org/10.1207/s15516709cog1302_1).

[6] Hattie, J., & Timperley, H. (2007). **The Power of Feedback**. Review of Educational Research, 77(1), 81–112. Đã đọc tóm tắt, mô hình/bảng được hiển thị; không khẳng định đã truy cập toàn bộ bản trả phí. DOI: [10.3102/003465430298487](https://doi.org/10.3102/003465430298487).

[7] Koedinger, K. R., & Aleven, V. (2007). **Exploring the Assistance Dilemma in Experiments with Cognitive Tutors**. Educational Psychology Review, 19, 239–264. Đã đọc tóm tắt và phần công khai của nhà xuất bản. DOI: [10.1007/s10648-007-9049-0](https://link.springer.com/article/10.1007/s10648-007-9049-0).

[8] Trương Ngọc Anh Thư & Lê Minh Cường. **Thiết kế tình huống dạy học chương Tứ giác cho học sinh lớp 8 theo hướng phát triển năng lực tư duy và lập luận toán học**. Tạp chí Thiết bị Giáo dục, số 342, kỳ 2 tháng 11/2025. Đã đọc tóm tắt và thông tin xuất bản; trang chưa có bản toàn văn để thẩm định thực nghiệm. Dữ liệu tác giả trên trang có một hậu tố nhập liệu bất thường; hai tên tác giả được nhận diện từ dòng tên và cơ quan. [Trang bài báo](https://vjol.info.vn/tctbgd/vi/article/view/135220/).

[9] Miao, F., & Holmes, W. **Guidance for generative AI in education and research**. UNESCO, 2023, 44 trang. Đã đọc trang giới thiệu và hồ sơ ấn phẩm; không dùng làm tài liệu chứng minh hiệu quả học tứ giác. DOI: [10.54675/EWZM9535](https://doi.org/10.54675/EWZM9535). [Trang giới thiệu](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research?hub=88737).

**Nguồn trong nước đã cập nhật toàn văn ở V4.4:** Nguyễn Thanh Hưng & Ngô Tùng Nhân (2019), “Rèn luyện thao tác tư duy cho học sinh trong dạy học chương Tứ giác (Toán 8) ở trường trung học cơ sở”, Tạp chí Giáo dục, số đặc biệt tháng 4, trang 184–187. Đã xử lý toàn văn bốn trang trong `40nguyen-thanh-hung-ngo-tung-nhan(2).pdf` do giáo viên cung cấp. Mục 2.2.1–2.2.4 là căn cứ thiết kế câu hỏi; không dùng bài báo để tuyên bố hiệu quả thực nghiệm của phần mềm. Phạm vi áp dụng, hiệu chỉnh toán học và dấu vân tay nguồn nằm trong `AP_DUNG_NGHIEN_CUU_2019.md` và `provenance/research-evidence.json`.
