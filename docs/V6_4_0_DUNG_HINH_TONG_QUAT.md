# V6.4.0 — Dựng hình tổng quát

Ngày bàn giao: 24/09/2026. Phiên bản này mở rộng cơ chế dựng hình cho nhiều họ đề, phát triển tiếp từ V6.3.1. Mô hình mặc định vẫn là `gpt-6-luna`.

## Nguyên nhân và cách khắc phục

Website gốc đã kết nối được với GPT-6 Luna nhưng yêu cầu vẽ trong ảnh gặp gián đoạn/hết thời gian. Trước đây, đề ngoài bộ mẫu phụ thuộc AI sinh toàn bộ TikZ rồi trình duyệt biên dịch. Vì vậy, lỗi có thể xuất hiện ở cả mạng/API, định dạng mã và biên dịch; sửa một mẫu đề không khắc phục được toàn bộ chuỗi này.

V6.3.1 đã bổ sung các phép dựng cục bộ cho đường cao, tia có tên và các giao điểm, đồng thời sửa thời gian chờ và thông báo lỗi. V6.4.0 bổ sung một đường xử lý chung:

1. Bộ dựng cục bộ tiếp tục xử lý những đề đã nhận diện và kiểm chứng được.
2. Với đề mới, OpenAI trả cấu trúc `geometry-v1` theo JSON Schema: điểm độc lập, phép dựng, nét vẽ và các quan hệ phải kiểm tra.
3. Máy chủ tự tính tọa độ và từ chối quan hệ sai, giao điểm không tồn tại, vòng phụ thuộc hoặc hình suy biến. Nguồn của quan hệ/ký hiệu phải trích giả thiết, không được trích phần kết luận đã nhận diện.
4. Trình duyệt kiểm tra lại cấu trúc rồi tự xuất SVG. Hình thuộc bộ dựng này không cần biên dịch TikZ trong trình duyệt.
5. Dạng vượt ngôn ngữ phép dựng có thể chuyển sang TikZ mở rộng. Giao diện ghi rõ các quan hệ chưa được bộ dựng số kiểm tra. Cấu trúc sai phải được sửa; không dùng chuyển công cụ để bỏ qua lỗi toán học.

Hai lớp kiểm tra ở máy chủ và trình duyệt dùng cùng một bộ tính toán; chúng không phải hai bộ chứng minh độc lập. Riêng đề ảnh có thêm đối chiếu với các điểm/quan hệ trong cấu trúc đọc ảnh mà người dùng đã xác nhận.

## Phạm vi đã triển khai

| Nhóm         | Các phép dựng và hình đã kiểm chứng                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Tam giác     | Đường cao trong/ngoài cạnh, trung điểm, trung tuyến, trọng tâm, trực tâm, phân giác trong, tâm nội/ngoại tiếp                              |
| Tứ giác      | Hình chữ nhật, thoi, thang, đường chéo và đường trung bình; kiểm tra song song, vuông góc, bằng nhau                                       |
| Đường tròn   | Tâm và điểm thuộc đường tròn, cung, giao đường–tròn, giao hai đường tròn, cát tuyến và hai tiếp tuyến từ điểm ngoài                        |
| Đường và tia | Đoạn, đường thẳng, tia có hướng, giao điểm ngoài cạnh; kiểm tra riêng thuộc đoạn/thuộc tia                                                 |
| Biến hình    | Tịnh tiến, quay, đối xứng tâm/trục, nội suy và đa giác đều                                                                                 |
| Đồ thị       | Biểu thức theo x: số, pi, e, phép toán, sin/cos/tan, sqrt/abs/ln/log/exp; kiểm tra miền hữu hạn và tách nhánh qua gián đoạn được phát hiện |
| Không gian   | Điểm có tọa độ 3D, hình hộp, hình chóp và đa giác đồng phẳng; nét khuất, kiểm tra quan hệ trong tọa độ thật rồi chiếu để minh họa          |

Bộ dựng có **20 phép dựng điểm**, 11 loại nét và 15 loại quan hệ. Các phép dựng được kết hợp theo đồ thị phụ thuộc, không có nhánh mã riêng theo tên từng bài trong bộ mẫu kiểm thử mới.

Giới hạn mỗi hình: 64 điểm, 128 nét, 128 quan hệ, tối đa 8 đồ thị. Các phép dựng giao đường/tròn và cung/góc hiện chỉ hỗ trợ mặt phẳng; đường cong trên mặt 3D chưa được dựng trực tiếp. SVG và PNG giữ nguyên nhãn. Chỉ cung cấp TikZ khi có thể xuất đầy đủ nhãn bằng tập ký tự hỗ trợ và mã nằm trong giới hạn.

## Độ tin cậy và giới hạn

- Kiểm tra tọa độ bảo đảm **các quan hệ đã mã hóa** thỏa sai số số học quy định. Việc AI diễn giải tiếng Việt, nhận dạng ảnh hoặc chọn đủ giả thiết vẫn có thể sai hay thiếu.
- Không có cơ sở cam kết vẽ đúng mọi đề toán bất kỳ hoặc mọi ảnh. Đề thiếu, mâu thuẫn hoặc không có hình thỏa dữ kiện cần được hỏi lại, không được tự bịa một hình rồi báo đúng.
- Khi đề xác định một họ hình, AI được chọn kích thước đại diện và phải nêu lựa chọn. Những kích thước đã cho trong đề phải được kiểm tra.
- Hình không gian là hình chiếu: góc và độ dài trên màn hình khác tọa độ thật. Những quan hệ từ ảnh chưa có bộ kiểm tra được liệt kê để đối chiếu.
- Đồ thị là đường lấy mẫu số trong cửa sổ cho trước. Hàm dao động rất nhanh, gián đoạn khó phát hiện hoặc miền cực hẹp cần kiểm tra thêm; không phải công cụ chứng minh giải tích.
- TikZ mở rộng vẫn có thể gặp lỗi biên dịch hoặc thời gian chờ. Lỗi mạng, khóa, quyền mô hình và hạn mức API không thể được loại bỏ chỉ bằng mã phía giao diện.

## Trải nghiệm khi có lỗi

Đề nhập tự sửa tối đa một lần với lỗi cấu trúc/biên dịch. Đề ảnh tự sửa tối đa hai lần bằng token có chữ ký. Lỗi mạng/hạn mức không tự lặp để tránh thêm yêu cầu không cần thiết. Thời gian chờ có giới hạn và được hiển thị; người dùng có thể dừng.

Hình đã hoàn tất và phần đối chiếu của nó được giữ khi vẽ lại thất bại. Khi sửa cách dựng cho cùng bản chép đề ảnh, hình trước cũng được giữ trong lúc chờ. Đổi sang đề khác sẽ bỏ hình của đề cũ. Bộ nhớ hình mới không tự dùng lại bộ nhớ của phiên bản trước.

## Kiểm thử và tái tạo hình mẫu

Bộ mẫu ở `tests/fixtures/scene-cases.mjs` gồm **20 nhóm**: đường cao, chân đường cao ngoài cạnh, trung tuyến, ngoại tiếp, nội tiếp, phân giác, chữ nhật, thoi, thang, tiếp tuyến, cát tuyến, đối xứng, đa giác đều, tia và nhiều giao điểm, parabol, hyperbol, lượng giác, căn bậc hai, hình hộp và hình chóp.

Các kiểm thử còn đổi tên điểm, xoay, tịnh tiến, thay kích thước; kiểm tra độc lập tiếp tuyến/trọng tâm; từ chối hình sai/suy biến, vòng phụ thuộc, biểu thức không an toàn; kiểm tra xác nhận ảnh, truyền token sửa và giữ hình cũ khi mạng lỗi. Lệnh `npm run review:figures` tạo SVG bằng chính bộ dựng dùng trong ứng dụng và danh sách quan hệ được kiểm tra trong `docs/v640-review`.

Kết quả rà soát và hình xuất có thể tạo lại, không nằm trong gói mã nguồn. Lệnh kiểm tra:

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run review:figures
```

Kiểm thử API dùng phản hồi OpenAI giả lập để kiểm tra hợp đồng dữ liệu và xử lý lỗi, không đo tỉ lệ mô hình đọc đúng đề thật. Kiểm tra thành phần giao diện dùng React; kiểm thử trình duyệt dùng các lệnh Playwright trong `README.md`. Cần kiểm tra API thật trên môi trường triển khai.

## Cập nhật Netlify

1. Sao lưu phiên bản đang chạy hoặc giữ deploy hiện tại để có thể quay lại.
2. Đưa toàn bộ gói mã nguồn V6.4.0 lên đúng kho dự án đang liên kết với `tuduyhinhtoan8.netlify.app`.
3. Giữ cấu hình `netlify.toml`: build `npm run build`, publish `dist`, Functions `netlify/functions`. Không chỉ kéo thả `dist` vì như vậy thiếu API mới.
4. Giữ khóa và mã lớp thật trong biến môi trường Functions. Không chép khóa vào mã nguồn/gói ZIP. Cấu hình đề nghị: `AI_PROVIDER=openai`, `OPENAI_MODEL=gpt-6-luna`, `OPENAI_REASONING_EFFORT=medium`, `OPENAI_DIAGRAM_REASONING_EFFORT=low`, `OPENAI_TIMEOUT_MS=50000`.
5. Triển khai lại, mở trang hướng dẫn API để xác nhận phiên bản 6.4.0, kết nối bằng mã lớp hiện có.
6. Kiểm tra đề gốc, ít nhất một đề đường tròn mới và một ảnh đề chưa nằm trong bộ mẫu. Kiểm tra hình, nhãn, giao điểm và chức năng vẽ lại khi mất mạng. Đối chiếu log Functions nếu API thật báo lỗi.

Tài liệu nền: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna), [Netlify Functions configuration](https://docs.netlify.com/build/functions/configuration/).
