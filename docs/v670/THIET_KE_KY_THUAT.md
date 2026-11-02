# V6.7.0 — Thiết kế cập nhật song ngữ

## Hiển thị và luồng học

Ứng dụng gửi `learningLanguage: en-vi` cùng yêu cầu chat/đọc ảnh. API cũ không gửi trường này vẫn giữ hợp đồng V6.6. Phản hồi thích ứng giữ `text` tiếng Việt để dùng với bộ kiểm tra, sơ đồ và lịch sử; bổ sung `bilingual.pairs`, `plan`, `problem` cho hiển thị Anh trước, Việt trong ngoặc dưới. Không sửa khóa API hoặc mô hình chat hiện tại.

Schema bổ sung bản dịch trong cùng lần sinh đáp án. Kiểm tra số có dấu, các đoạn LaTeX, kích thước chuỗi và một câu hỏi tiếng Anh. Bản dịch sai cấu trúc trong lượt thích ứng được sửa tối đa một lần; lỗi còn lại không ghi điểm hay đẩy giai đoạn. Đây là kiểm tra cấu trúc và dữ kiện, không phải bảo đảm tự động mọi sắc thái dịch thuật. Giáo viên cần rà chất lượng ngôn ngữ với nhà cung cấp thật.

Chỉ đưa phần tổng hợp đã qua cổng kiểm tra giai đoạn 7 vào giao diện. Kiểm tra đáp án nội bộ xét thêm các trường tiếng Anh. Bằng chứng học sinh tiếng Anh có “because”, “since”, “therefore”, “by the…” được xét cùng trích dẫn nguyên văn. Gợi mở và hình vẽ vẫn theo đề, chương, bài và token đã ký.

Bộ đề luyện tập song ngữ lấy đề từ ngân hàng đã biên soạn, rồi dịch chỉ danh sách đề; không đưa đáp án/rubric sang phần hiển thị. Không gọi một lượt dịch riêng cho từng đoạn của một câu trả lời thích ứng. Lịch sử cũ chưa có bản dịch vẫn giữ nguyên; các lượt mới dùng Anh–Việt.

Đọc ảnh: giữ `transcription` gốc cho OCR và xác nhận, thêm `transcriptionEn/Vi` vào token ảnh ký. Chỉnh phiên âm sẽ ẩn bản dịch cũ đến khi xác nhận lại; không gắn bản dịch cũ cho đề đã thay. Các chi tiết kỹ thuật/phân tích hình kế thừa trong mục mở rộng vẫn có thể dùng nhãn tiếng Việt; phần đề chính và câu gia sư mới có cặp ngôn ngữ.

`lib/math-english.ts` chứa 49 mục từ (bao gồm hai nghĩa của square), ví dụ và nền tảng cho 20 bài. Bảng chọn tối đa 8 mục dựa vào đề, nội dung trao đổi và bài đang học. Mục không xuất hiện trực tiếp được gắn “Kiến thức nền”. Không dùng bảng này như một bộ dịch vô hạn cho mọi môn học.

## Âm thanh

`/api/language` là Netlify Function mới, đồng thời được nối vào máy chủ phát triển. Yêu cầu POST JSON cùng nguồn, mã truy cập lớp, giới hạn 24 lượt/phút/IP ở Netlify và kiểm tra lớp cục bộ. Không trả chi tiết lỗi chứa khóa nhà cung cấp.

- `speak`: tối đa 1.200 ký tự/yêu cầu. Client chia đoạn dài thành các phần tối đa 1.100 ký tự, chuyển một số ký hiệu toán thông dụng sang cách đọc. Giữ tối đa 20 clip trong RAM của trang, không ghi âm thanh xuống localStorage/Sheets. Không tự phát khi nhận câu trả lời. Nếu trình duyệt chặn phát sau tải, hiển thị nút Phát để bấm lại.
- OpenAI: Chat Completions audio, `gpt-audio-1.5`, giọng alloy, WAV, `store:false`.
- Gemini: `generateContent` với `gemini-2.5-flash-preview-tts`, giọng Kore. PCM mono 24 kHz được bọc WAV; từ chối định dạng không hỗ trợ. Không đổi sang Interactions API bằng cách chỉ thay tên model: adapter này dành cho hợp đồng generateContent.
- `pronounce`: người dùng đồng ý trước; client ghi MediaRecorder, giải mã và chuẩn hóa WAV PCM mono 16 kHz, 16 bit, tối đa 15 giây. Server kiểm tra header, kích thước, thời lượng và mức tín hiệu; đoạn im lặng bị từ chối trước khi gọi AI. Server gửi âm thanh thực đến model nghe, không tự dựng “điểm phát âm” từ tỷ lệ khớp văn bản.
- Kết quả: transcript, trạng thái dễ nghe/cần luyện/chưa đủ căn cứ, nhận xét và mẹo Anh–Việt. Chỉ từ trong câu đích được đưa vào danh sách nhận xét. Không có điểm 0–100, không chẩn đoán giọng nói. Các khác biệt giọng vùng miền không mặc nhiên bị chấm sai.
- Micro và request bị dừng khi hủy, đổi từ hoặc rời bài. Không thêm bản ghi âm hoặc nhận xét phát âm vào tài khoản/lịch sử/Sheets. Nhà cung cấp xử lý theo chính sách dịch vụ của tài khoản API; không khẳng định nhà cung cấp không lưu dữ liệu.

## Sao và 9 bảng hiện có

Sự kiện học được backend ký như trước. `languageMode` và `rewardKey` do backend tạo sau khi kiểm tra câu trả lời song ngữ. Delta điểm từ client không được dùng. Hàm `awardStars` chạy trong thao tác ingest dưới cùng ScriptLock và batch commit của Google Apps Script.

`Profiles.data.gamification` chứa `total`, `bilingualTotal` (sao cộng thêm do tiếng Anh) và các bucket theo ngày UTC+7. Mỗi bucket giữ tổng và dấu vết nội dung đã thưởng. Điểm cộng một lần ở hồ sơ toàn cục, không cộng lại khi cập nhật hồ sơ con theo chương/bài. Không thêm sheet hay cột bắt buộc.

Quy tắc: chỉ lượt sau đề mở đầu, có phân loại nỗ lực toán học và câu trả lời ít nhất 10 ký tự; +1 cả khi còn sai. Thêm +2 nếu có từ chức năng tiếng Anh và thuật ngữ toán học. Không cộng cho vague/answer_request/off_topic, nội dung đã ẩn thông tin cá nhân, cùng dấu vết câu trả lời trong ngày hoặc dữ liệu phiên bản cũ. Dùng từ khóa là cơ chế khuyến khích đơn giản, không chứng nhận năng lực tiếng Anh; giáo viên vẫn cần quan sát tính thực chất.

Tối đa 30/ngày, bucket các ngày gần nhất xử lý receipt đến muộn mà không đặt lại hạn mức hôm nay. Gửi lại cùng event ID trả hồ sơ hiện tại, không thưởng lần nữa. Client không cộng trước khi lưu, nhận hồ sơ khi flush thành công. Hồ sơ vẫn dùng chính sách lưu 90 ngày; khôi phục mã, ngừng ghi, rời hồ sơ, xuất/xóa dữ liệu như cũ.

`RULE_VERSION=6.7.0-r1`; vẫn nhận receipt hợp lệ 6.6/6.5 trong hạn 24 giờ, không thưởng hồi tố. `migrateV670` kiểm tra cấu trúc V6.6, không ghi đè lịch sử JSON. Cần cập nhật cả Code.gs và Domain.gs, triển khai Apps Script mới rồi Functions.

## Tài liệu API chính thức đã đối chiếu ngày 02/11/2026

- https://developers.openai.com/api/docs/guides/audio-chat-completions
- https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-preview-tts
- https://ai.google.dev/gemini-api/docs/speech-generation
- https://ai.google.dev/gemini-api/docs/generate-content/audio
- https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis

Adapter giọng nói cần kiểm tra quyền truy cập/hạn mức thực tế. Tài liệu và mô hình có thể thay đổi; các tên model là cấu hình máy chủ tùy chọn, không phải lời hứa về khả năng truy cập của một khóa cụ thể.
