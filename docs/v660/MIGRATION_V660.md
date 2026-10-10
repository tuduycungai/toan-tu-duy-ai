# Migration Google Sheets/Apps Script V6.6.0

## Hợp đồng dữ liệu

- 9 bảng cũ giữ tên: Students, Sessions, Turns, Profiles, Surveys, ReviewQueue, Versions, Settings, Audit.
- Turns A–S giữ vị trí; thêm T `chapterId`, U `lessonId`, V `skillId`. `problemId` và `sessionId` đã có, được dùng nhất quán với ngữ cảnh mới.
- JSON trong cột `data` là nguồn dữ liệu chính. `migrateV660()` chỉ bổ sung tiêu đề và ba cột xem nhanh; không viết lại JSON lịch sử.
- Nếu JSON cũ có nhãn thật, giữ nhãn; nếu thiếu, hiển thị `unclassified`. Không suy tất cả bản ghi cũ là Chương III.
- Hồ sơ mới có `scopes[chapterId+':'+lessonId]`, mỗi bài giữ riêng lượt quan sát, kỹ năng, lỗi và mức hỗ trợ. Hồ sơ tổng hợp vẫn tồn tại cho thống kê chung; gia sư đọc đúng phạm vi bài.
- Phiên không nhận sự kiện khác chương/bài; chữ ký, danh tính, đồng ý, phiên bản quyền ghi và chống ghi trùng vẫn kiểm tra.
- Rule mới `6.6.0-r1`, vẫn nhận phiếu hợp lệ phiên bản `6.5.0-r1` trong thời hạn/quyền đã có. Phiếu cũ không có nhãn tiếp tục giữ ở phần chưa phân loại.
- Duyệt gợi mở vẫn cần giáo viên xác nhận toán học; có thêm kỹ năng c1…c5. Mẫu cũ không tự chuyển thành mẫu đa chương hay tự xuất bản.

## An toàn khi chạy lại

`migrateV660` giữ ScriptLock, kiểm tra tiền tố cột trước khi ghi, bổ sung số cột nếu cần, không append bản ghi. Hai lần chạy được kiểm tra trên mô hình bảng tính trong VM: số dòng và JSON cũ không đổi. Đây là kiểm thử mô phỏng Apps Script, chưa chạy trên bảng thật.

Nếu bảng đã bị đổi thứ tự cột, migration dừng. Nếu JSON cũ lỗi cú pháp, migration dừng thay vì đoán/xóa; tiêu đề có thể đã bổ sung nhưng dữ liệu gốc vẫn còn. Sao lưu trước, sửa căn cứ trên bản sao và chạy lại; không xóa dữ liệu để vượt kiểm tra.

Hướng dẫn thao tác giao diện nằm tại `CAP_NHAT_TUNG_BUOC.md`, phần B.

## Đồng bộ nguồn sinh

`server/learning/domain.mjs` + `server/learning/engine.mjs` → `npm run build:gateway` → `google-apps-script/Domain.gs`.

Không sửa Domain.gs riêng rồi bỏ qua nguồn Node. `prebuild` tự tạo lại Domain.gs và `lib/curriculum.json`. Bộ kiểm thử kiểm tra bản sinh khớp nguồn và cú pháp ES2020.
