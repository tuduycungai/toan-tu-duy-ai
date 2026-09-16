# V5: Đọc đề và dựng hình

Bản V5 mở rộng bộ dựng hình của dự án gốc. Các công thức, ngân hàng bài và bộ kiểm tra cũ vẫn được dùng. Không sử dụng ảnh sinh bởi AI để thay thế hình học.

## Quy trình thực tế

1. `normalizeProblem`: chuẩn Unicode NFC, khoảng trắng/nhiều dòng, các ký hiệu `//`, `∥`, `⊥`, `\parallel`, `\perp`, bao LaTeX và tên đoạn.
2. `problemParts`: tách giả thiết và mục tiêu. Quan hệ trong mục tiêu không được đưa vào bộ giải ràng buộc.
3. `parseProblem`: tạo mô hình trung gian `Recipe` và danh sách `Constraint`; nhận dạng loại hình, điểm, đoạn, giao điểm, trung điểm, tỉ lệ, độ dài, điểm thuộc đoạn, đường qua điểm song song/vuông góc.
4. `construct` / `satisfy`: giải phụ thuộc giữa các điểm rồi tính tọa độ. Tâm hình bình hành/hình chữ nhật/hình thoi/hình vuông được dựng tại giao hai đường chéo.
5. `verifyConstraints` và `validateShape`: kiểm tra tồn tại điểm, tính không suy biến, vị trí, khoảng cách, tích có hướng/tích vô hướng, quan hệ hình và dấu hiệu được cung cấp.
6. `compileGeometry`: bổ sung bộ đọc đường tròn, bán kính, đường kính, tiếp tuyến và tia; xuất `GeometryModel` dùng chung cho giao diện, lý thuyết và tệp JSON.
7. `DiagramSVG`: chiếu tọa độ, bố trí nhãn tránh chồng nhau, vẽ nét chính/nét phụ và các dấu quan hệ đã kiểm tra. PNG được raster hóa từ chính SVG đang xem.

```ts
GeometryModel = {
  version, original, normalized,
  entities, relations, givens, goal, auxiliaryLines,
  assumptions, missingData, questions, confidence,
  status: 'verified' | 'provisional', drawing
}
```

`confidence` là chỉ báo theo nhánh xử lý (1; 0,6; 0,5; 0,15...), không phải xác suất thống kê đã hiệu chuẩn. `verified` xác nhận hình thỏa các giả thiết đã đọc trong cấu hình được hỗ trợ; không có nghĩa đã chứng minh mục tiêu hoặc đã chấm đúng lời giải học sinh.

## Lỗi trong ảnh đã sửa

“E và F theo thứ tự là trung điểm OD và OB” được ghép theo đúng thứ tự E–OD, F–OB. “ABCD tâm O” xác định O bằng giao AC và BD. Với hệ tọa độ minh họa:

| Điểm | x | y |
|---|---:|---:|
| A | 0 | 0 |
| B | 6 | 0 |
| C | 7,4 | 3,5 |
| D | 1,4 | 3,5 |
| O | 3,7 | 1,75 |
| E | 2,55 | 2,625 |
| F | 4,85 | 0,875 |

Các tọa độ trên kiểm tra được O = AC ∩ BD, E = (O + D)/2, F = (O + B)/2. AE và CF được vẽ vì đã có các đầu mút. Kết luận AE ∥ CF không được giả định trong quá trình dựng. Kiểm tra song song bằng số trong ca kiểm thử chỉ xác minh hình minh họa, không thay thế bài chứng minh tổng quát.

## Hình tạm và chỉnh dữ kiện

Khi chưa hiểu hết đề hoặc dữ kiện mâu thuẫn, giao diện giữ một cấu hình cơ sở hợp lệ hoặc bố trí các đối tượng đã nhận ra. Nhãn “Hình tạm” luôn xuất hiện; dữ kiện chưa đối chiếu, giả định và câu hỏi xác nhận nằm trong mục mở rộng. Không tạo tâm hoặc trung điểm không được xác định trong đề.

Học sinh sửa toàn bộ đề/giả định trong ô chỉnh sửa rồi bấm **Áp dụng dữ kiện & vẽ lại**. Đề đã sửa được chuyển về vùng bài đang học và ô gửi để hội thoại tiếp theo dùng đúng dữ kiện. Một điểm tự do được chọn ở vị trí đại diện, kèm thông báo không coi tỉ lệ đo trên hình là giả thiết.

Nếu có AI chuẩn hóa câu chữ, cơ chế cũ `resolveTutorDiagram` chỉ nhận các trích dẫn xuất phát từ đề gốc, giữ số liệu/tên điểm/ngôn ngữ hạn chế và kiểm tra lại toàn bộ quan hệ nhận ra. Không chấp nhận tọa độ do mô hình ngôn ngữ tự sinh.

## Phạm vi và giới hạn

Đã kiểm thử các cấu hình được nêu trong báo cáo, biến thể đổi tên điểm, thứ tự ghép, Unicode/LaTeX, thêm đường phụ, cũng như ngân hàng 87 bài cũ. Bộ dựng chưa là một bộ giải ràng buộc tổng quát cho mọi đề THCS. Một số câu về góc số đo tùy ý, điểm có chỉ số/dấu phẩy, nhiều đường tròn cắt nhau, tiếp tuyến từ điểm ngoài hoặc chuỗi điều kiện phức tạp sẽ chuyển sang hình tạm. Ví dụ “tam giác ABC có góc A = 37 độ” vẫn được đánh dấu chưa đối chiếu, không vẽ một góc tùy ý rồi báo đúng.

Vì vậy yêu cầu tuyệt đối “bất kỳ đề nào cũng dựng chính xác toàn bộ” chưa được đáp ứng. Bản V5 ưu tiên giữ thông tin thiếu/mâu thuẫn hiển thị và cho phép chỉnh sửa, thay vì xác nhận sai hình.
