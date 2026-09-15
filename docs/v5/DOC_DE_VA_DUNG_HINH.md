# Đọc đề và dựng hình V5

## Nguyên nhân và tích hợp

V4.4 đã có bộ dựng bằng ràng buộc và kiểm tra riêng, nhưng parser trung điểm chưa nhận một số câu “theo thứ tự”, parser hình chưa biên dịch “tâm O” thành giao điểm hai đường chéo. Phần dư chưa hiểu làm resolver dừng; giao diện cũng đặt lý thuyết sau nhánh dựng thành công. V5 giữ các bộ dựng cũ, thêm lớp biên dịch và hình tạm bên trên thay vì thay cả ứng dụng.

## Pipeline

1. Giữ đề gốc; chuẩn hóa Unicode NFC, dấu toán học, LaTeX đơn giản, xuống dòng và viết tắt HBH/HCN/CM/CMR. Không biến đơn vị `cm` thành lệnh chứng minh.
2. Tách giả thiết và kết luận. Nhận loại hình, tên điểm, đoạn/đường/tia, trung điểm, giao điểm, thuộc đoạn, đường song song/vuông góc và các điều kiện độ dài/góc được hỗ trợ.
3. Biên dịch thành `GeometryModel`: `entities`, `relations`, `givens`, `goal`, `auxiliaries`, `assumptions`, `confidence`, `missingInformation`, `validation`, `drawing`. Mỗi quan hệ có `role: given | goal | auxiliary`, nguồn và dữ liệu ràng buộc khi phù hợp. Tên trường của ví dụ yêu cầu được ánh xạ sang các trường này.
4. Dựng theo đồ thị phụ thuộc: đỉnh hình → giao điểm/tâm → trung điểm → các điểm dựng tiếp theo. Đường qua điểm song song/vuông góc đường đã biết được giải bằng vectơ chỉ phương và giao hai đường, không thêm một điểm có tên tùy tiện để làm đầu đường.
5. Giữ solver cũ khi đủ điều kiện; thêm solver số xác định cho độ dài/góc/tỉ lệ trên các loại hình hỗ trợ. Nó dùng Gauss–Newton có giảm chấn, thử bước và giới hạn 120 vòng; không dùng tọa độ ngẫu nhiên.
6. Kiểm tra lại các kết quả độc lập: tồn tại điểm, hữu hạn tọa độ, loại hình/thứ tự đỉnh/không suy biến, hai đầu đoạn, thuộc đúng đoạn, trung điểm, hai đường chéo cùng nhận tâm, quan hệ song song/vuông góc, độ dài/góc, bán kính/điểm trên đường tròn/tiếp tuyến. Hội tụ số không tự động đồng nghĩa hợp lệ.
7. Render SVG trong thành phần cũ; nhãn được chọn trong nhiều vị trí để hạn chế chồng nhau, nét ngoài/nét phụ khác nhau, vạch trung điểm, góc vuông, góc bằng nhau có dữ kiện và mũi tên tia. Có bộ điều khiển xem nét phụ, thu/phóng, hộp phóng lớn, chỉnh dữ kiện, PNG/SVG và TikZ.

Kết luận được lưu và vẽ các đoạn liên quan khi đã có hai đầu mút, nhưng **không đưa kết luận vào hệ phương trình để ép hình thỏa điều cần chứng minh**. Kiểm tra số của một cấu hình không được đưa ra như lời chứng minh.

## Ca bắt buộc ABCD

“Hình bình hành ABCD tâm O” tạo quan hệ `centerOf` và giao AC với BD. “E và F theo thứ tự là trung điểm của OD và OB” ghép E↔OD, F↔OB.

| Điểm | x | y | Cách xác định |
| --- | ---: | ---: | --- |
| A | 0 | 0 | Gốc tọa độ minh họa |
| B | 6 | 0 | Tham số cạnh tự do |
| C | 7,4 | 3,5 | Đỉnh hình bình hành |
| D | 1,4 | 3,5 | Tham số cạnh tự do |
| O | 3,7 | 1,75 | Giao AC và BD |
| E | 2,55 | 2,625 | (O+D)/2 |
| F | 4,85 | 0,875 | (O+B)/2 |

Các độ dài 6, 1,4, 3,5 chỉ là tham số vẽ, không phải dữ kiện đo đạc được thêm vào đề. Mô hình đầy đủ: `research/v5-checks/primary-model.json`.

## Dữ kiện thiếu, mâu thuẫn và giả định

`verified` nghĩa là tập quan hệ đã nhận được kiểm tra thỏa mãn, không có nghĩa nhận biết được mọi kiểu câu tiếng Việt hoặc bài có một hình duy nhất. `confidence=1` là cờ mức tin cậy quy tắc trong trường hợp này, không phải xác suất thống kê đã hiệu chuẩn.

Nếu chưa hiểu hết, kết quả là `provisional`, có “Giả định đang sử dụng” và dữ kiện cần xác nhận. Với ABCD xác định nhưng O chưa định nghĩa, giữ hình ABCD; **không đặt E dựa vào một O bịa ra**. Nếu không đọc được cả loại hình/tên điểm, hiển thị tam giác ABC minh họa và ghi rõ cả loại hình lẫn tên là giả định. Đây không phải hình chính thức của đề.

Người học thêm quan hệ hoặc chép toàn bộ đề đã chỉnh, nhấn “Áp dụng và vẽ lại”. Thay đổi được ghi trong giả định; đề gốc vẫn giữ. “Nối A với F” thêm đoạn phụ khi các đầu đã xác định. Điều kiện mâu thuẫn không được lờ đi hay ép thành hợp lệ.

## Phạm vi và mở rộng

Hỗ trợ hiện có tập trung tam giác, các tứ giác quen thuộc, quan hệ trung điểm/tỉ lệ/đối xứng/chân đường vuông góc/giao đường; đường tròn đơn với bán kính, đường kính, dây, điểm trên đường tròn, tiếp tuyến tại điểm đã nêu. Có thể dùng tên đỉnh khác ABCD. Parser chủ yếu nhận tên điểm một chữ Latin hoa.

Không bảo đảm mọi bài THCS: giao nhiều đường tròn, tiếp tuyến từ điểm ngoài với hai nghiệm, quỹ tích, quan hệ cung, ngôn ngữ mơ hồ phức tạp, nhiều ý/multiple hình không có quy tắc có thể cần bổ sung và còn ở hình tạm. Bộ số có thể không hội tụ dù bài có nghiệm. Nhãn ở hình rất dày vẫn có thể chạm đường; thuật toán không bảo đảm tránh mọi chồng lấn.

Muốn mở rộng: thêm quy tắc chuẩn hóa/quan hệ vào các module ngôn ngữ; thêm phép dựng vào `geometry`; thêm kiểm tra độc lập; thêm ca đổi tên, đảo thứ tự, dữ kiện sai và thiếu vào test. Giữ nguyên nguyên tắc không dùng mục tiêu làm giả thiết và không tin tọa độ AI chưa kiểm chứng.
