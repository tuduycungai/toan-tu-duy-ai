# Các nhóm tình huống toán học đã thực hiện

Các kiểm tra dưới đây là cục bộ bằng mã, dữ liệu số, tọa độ/phản ví dụ và handler có nhà cung cấp mô phỏng. Chúng không phải điểm chính xác của mô hình thật.

| Chương | Tình huống độc lập phủ các bài | Số tình huống | Kiểm tra metadata bài mẫu |
|---|---|---:|---:|
| I | B1 cộng đơn thức/khác phần biến; B2 triệt tiêu bậc/không đồng dạng; B3 trừ ngoặc hai trường hợp; B4 nhân đa thức/thiếu hạng tử; B5 chia đúng/chia sai số mũ | 10 | 22 |
| II | B6 bình phương hiệu/hiệu hai bình phương; B7 lập phương hiệu đúng/sai và hệ số 2x; B8 tổng/hiệu lập phương; B9 nhóm nhân tử hai cách và phối hợp hằng đẳng thức | 10 | 20 |
| III | B10 tổng góc/tỉ lệ góc; B11 chéo bằng nhau/cạnh bên bằng nhau chưa đủ; B12 trung điểm chéo/một cặp cạnh bằng nhau chưa đủ; B13 độ dài nửa chéo/chéo bằng nhau chưa đủ; B14 chéo vuông góc chưa đủ/chữ nhật hai cạnh kề bằng nhau | 10 | 9 |
| IV | B15 Thalès thuận, sai tỉ số, thiếu song song, đảo; B16 hai trung điểm, thiếu trung điểm, điểm ngoài đoạn; B17 tỉ số phân giác, đổi thứ tự đoạn, tam giác không tồn tại | 10 | 8 |
| V | B18 nhãn định tính, ô thiếu, nhóm trùng; B19 tổng/góc quạt, % sai/đúng, tổng 0, hai dãy lệch độ dài; B20 mức tăng, phạm vi mẫu, trục cắt gốc | 11 | 4 |

Tổng 51 tình huống độc lập, ngoài 63 kiểm tra metadata. Bổ sung: số âm trong biểu đồ; % ở cả hai dãy; mốc ngang không đều; parser từ chối cú pháp/mũ quá lớn; dấu trừ và lũy thừa; nghiệm x=2 không bị coi là một đồng nhất thức sai; nhận xét phản bác đẳng thức sai không bị chặn nhầm; đáp án ngân hàng không được đưa sớm.

Trong quá trình rà soát đã sửa một tam giác không tồn tại ở bản nháp B17: dữ kiện AB=4, AC=6, BC=15 được thay bằng AB=8, AC=12, BC=15; đáp án BD=6, DC=9. Kiểm thử tam giác không tồn tại vẫn được giữ để ngăn tái diễn.

Các tình huống “dạ/tiếp tục”, xin đáp án, đề mở đầu, bài/chương sai mã, đổi cách giải, trạng thái ký sai phạm vi và dữ liệu cũ chưa phân loại đều có kiểm thử. Bộ cũ tiếp tục kiểm tra điều kiện hình học, ảnh mờ, trung điểm, phần kéo dài, góc và xuất hình.

File thực thi: `tests/v660-curriculum.test.mjs`; các nhóm V6.2.3/V6.4/V6.5 được giữ trong `tests/`. Đáp án và rubric đầy đủ cho giáo viên nằm trong `server/curriculum-content.json`, không nằm trong JSON frontend.
