# Kiểm thử bản V6.7.0

Ngày kiểm tra: 02/11/2026. Nền mã nguồn: bản V6.6.0 đã bàn giao, nâng cấp song ngữ, âm thanh, luyện nói và sao lưu theo mã người học.

| Hạng mục | Kết quả |
| --- | --- |
| Kiểm thử Node | 847 trường hợp: **846 đạt**, **0 lỗi**, **1 bỏ qua** |
| TypeScript | Đạt `tsc --noEmit` |
| Kiểm tra mã | Đạt `eslint . --max-warnings=0` |
| Bản dựng triển khai | Đạt `npm run build`; Domain.gs sinh lại từ nguồn đã kiểm tra |
| Luồng trình duyệt | 10 nhóm kịch bản đạt; không có lỗi JavaScript trang |
| Bố cục | Đã kiểm tra 375, 768, 1280 và 1440 px; không tràn ngang trong các luồng kiểm tra |

Chi tiết lệnh và kết quả ở thư mục `kiem-thu/`. Lệnh chạy lại toàn bộ: `node scripts/check-v670-release.mjs` với Chromium đã cài hoặc biến `CHROMIUM_EXECUTABLE`. Kịch bản không gọi API sản xuất.

## Phạm vi kiểm tra mới

- Hai adapter OpenAI/Gemini: schema Anh–Việt, bản dịch có số/công thức khớp, từ chối bản dịch thiếu, giới hạn thử lại, không lộ phần tổng hợp trước giai đoạn được phép.
- Chấp nhận trích dẫn lập luận tiếng Anh và giữ token học thích ứng đã ký. Không xuất đáp án nội bộ sang bản Anh. Bộ đề luyện tập của cả 5 chương dùng đề biên soạn, bản dịch riêng, không trả đáp án/rubric.
- Đọc ảnh, giữ bản gốc, cặp bản dịch trong token, xác nhận và khôi phục; trên UI bản dịch cũ bị ẩn khi học sinh sửa phiên âm rồi cập nhật trước khi xác nhận.
- Giọng mẫu: handler thật trả WAV với nhà cung cấp mô phỏng; phát, dừng, đổi tốc độ, lỗi hạn mức/dịch vụ và fallback giọng thiết bị có nhãn. Rời bài hủy yêu cầu âm thanh đang chờ.
- Phát âm: mở công cụ hoặc đánh dấu đồng ý chưa gọi micro; phải bấm ghi. MediaRecorder thực trong Chromium nhận nguồn âm thử, tạo Blob, giải mã và chuẩn hóa WAV, gửi đến handler rồi nhận phản hồi AI mô phỏng. Track micro dừng sau ghi; quyền bị từ chối có thông báo rõ. Kiểm tra đoạn im lặng, âm thanh không hợp lệ, quá ngắn/quá dài và thiếu đồng ý.
- Sao: +3 cho một nỗ lực tiếng Anh đủ điều kiện, +1 cho nỗ lực tiếng Việt/còn sai, không cộng từ yêu cầu đáp án/chào hỏi/mở bài. Chống event trùng, cùng nội dung ở phiên khác, delta giả từ client. Giới hạn 30 sao/ngày UTC+7, receipt đến muộn và ngày mới.
- Lưu cùng tài khoản qua nhiều chương, không cộng lặp trong hồ sơ con. Mất xác nhận mạng rồi gửi lại vẫn đúng tổng; khôi phục/tải lại lấy tổng đã lưu. Các bộ kiểm thử Google Apps Script trước đó vẫn kiểm tra lock, batch commit, lỗi batch và nguồn Domain.gs khớp.
- Toàn bộ 20 bài có từ vựng và kiến thức nền. Hội thoại mới khôi phục được cả cặp Anh–Việt; không trộn hội thoại giữa chương/bài.

## Giới hạn của kết quả

1. AI chat, TTS, nhận xét phát âm và Google Sheets trong kiểm thử dùng phản hồi mô phỏng. Kết quả này chứng minh luồng tích hợp và kiểm tra dữ liệu, **không chứng minh độ tự nhiên của giọng AI, chất lượng nhận xét phát âm hoặc chất lượng dịch với khóa thật**.
2. Một trường hợp kế thừa cần truy cập dịch vụ thật được bỏ qua theo điều kiện môi trường. Chưa chạy hệ thống sản xuất, chưa cập nhật Netlify hay Google Apps Script của thầy.
3. Có kiểm tra responsive trong Chromium; chưa kiểm tra trực tiếp Safari trên iPhone, micro vật lý hay Android. Có thông báo và fallback khi thiếu quyền/khả năng ghi âm hoặc thiếu giọng đọc.
4. Kiểm tra bản dịch giữ số có dấu và đoạn LaTeX, đồng thời dùng ràng buộc gợi mở; chưa phải chứng minh tự động tương đương ngữ nghĩa mọi câu. Các lượt lịch sử V6.6 chưa có bản dịch vẫn được giữ nguyên.
5. Nhận xét phát âm là phản hồi tham khảo dựa trên âm thanh gửi lên, không phải chứng chỉ năng lực, điểm thi hay đo âm vị chuyên biệt. Sao là công cụ khuyến khích, không phải điểm học tập.

Hướng dẫn kiểm tra với tài khoản API và Sheets thật nằm ở `HUONG_DAN_V6_7_0.html`. Giữ chính sách hồ sơ 90 ngày và khảo sát 13 phút theo bản nguồn đã kiểm tra.
