# Tư duy Toán học V6.5.0 — Kết nối bộ nhớ học tập

**Bản sửa lỗi Apps Script ngày 29/09/2026:** đã thay hai phép gán `||=` trong `Domain.gs` để xử lý lỗi `ParseError: Unexpected token =` khi lưu trên Google. Mã nguồn Node và mã Apps Script đã được đồng bộ; có kiểm tra cú pháp ES2020. Xem `docs/v650/SUA_LOI_APPS_SCRIPT.md`.

Bản này nâng cấp trực tiếp dự án V6.4.0 trong `TU-DUY-TOAN-HOC-V6_4_0-LAM-SACH(2).zip` được đính kèm. Hậu tố của tệp thực tế là (2), khác với (1) trong phần mô tả yêu cầu. Đây vẫn là ứng dụng Vite/React và Netlify Functions; không chuyển sang nền tảng triển khai khác.

**Trạng thái bàn giao:** mã nguồn, trang giáo viên, cổng Google Apps Script và kiểm thử mô phỏng đã được hoàn thiện. Chưa kết nối Google/Netlify của thầy và chưa ghi dữ liệu thật. Phải hoàn tất các bước 1–6 dưới đây để ghi thật.

## 1. Chuẩn bị bảng tính do thầy sở hữu

1. Đăng nhập Google Drive bằng tài khoản thầy muốn dùng để quản lý dữ liệu.
2. Tạo thư mục riêng, chẳng hạn **AI Tutor — Dữ liệu học tập**. Tạo Google Sheets trống bên trong, đặt tên **Tư duy Toán học — Tiến bộ học sinh**.
3. Giữ chế độ chia sẻ **Restricted / Bị hạn chế**. Chỉ thêm những giáo viên thực sự được phép xem dữ liệu. Không cấp quyền cho học sinh và không chọn “bất kỳ ai có liên kết” cho bảng tính.
4. Sao chép ID nằm giữa `/d/` và `/edit` trong địa chỉ bảng tính. Không dùng toàn bộ URL làm ID.
5. Các trang tính dữ liệu sẽ được tạo tự động ở bước 3; thầy không cần tự gõ cột.

Cấu hình được chọn **không dùng tài khoản dịch vụ để tạo tệp**. Bảng tính do chính thầy tạo, nên nằm trong Drive của thầy, và thầy có quyền sở hữu, xem, chia sẻ, tải xuống Excel hoặc xuất dữ liệu. Chưa cần Drive API hay thư mục lưu ảnh: bản này không lưu ảnh đề hay tệp minh chứng; câu trả lời chỉ giữ bản rút gọn. Vì vậy không yêu cầu quyền Drive rộng.

## 2. Chuẩn bị ba khóa bí mật khác nhau

Cần ba chuỗi ngẫu nhiên độc lập, mỗi chuỗi tối thiểu 32 ký tự:

| Khóa | Nơi đặt | Công dụng |
|---|---|---|
| `GATEWAY_SECRET` / `LEARNING_GATEWAY_SECRET` | Cùng một giá trị ở Apps Script và Netlify | Ký HMAC các yêu cầu giữa hai máy chủ |
| `LEARNING_SIGNING_KEY` | Chỉ Netlify | Ký phiếu gửi lại lượt học, hiệu lực tối đa 24 giờ |
| `TEACHER_ADMIN_KEY` | Chỉ Netlify; thầy giữ riêng để đăng nhập | Quyền giáo viên, hoàn toàn khác mã lớp |

Có thể tạo mỗi chuỗi bằng trình quản lý mật khẩu. Nếu máy có Node.js, chạy lệnh dưới đây **ba lần** và cất kết quả riêng:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Không dùng HOCGIOITOAN làm bất cứ khóa bí mật nào. Không dán khóa vào `app/`, `lib/`, GitHub hoặc tệp ZIP bàn giao. Không đặt tiền tố `VITE_` cho các khóa máy chủ.

`STATE_SIGNING_KEY` là biến sẵn có của dự án để bảo vệ trạng thái gia sư/dựng hình; có thể đặt một khóa riêng thứ tư. Đổi khóa này sẽ làm các trạng thái gia sư cũ hết hiệu lực. V6.5 đã sửa lỗi nhầm khóa ký trạng thái với khóa API khi dùng Gemini: Gemini vẫn nhận `GEMINI_API_KEY` riêng.

## 3. Cài cổng ghi Google Sheets

1. Trong bảng tính, chọn **Extensions → Apps Script**.
2. Mở `google-apps-script/Code.gs` trong ZIP bằng trình soạn thảo. Chép **toàn bộ nội dung** vào `Code.gs` trong Apps Script.
3. Tạo tệp script mới tên `Domain` và chép toàn bộ `google-apps-script/Domain.gs` vào đó. Cần **cả hai tệp**, không chỉ Code.gs.
4. Mở **Project Settings**, bật hiển thị tệp manifest `appsscript.json`. Thay nội dung bằng tệp `google-apps-script/appsscript.json` trong ZIP.
5. Kiểm tra mục **Services** có **Google Sheets API v4**, tên dùng trong mã là `Sheets`. Nếu chưa có, bấm dấu **+**, chọn Google Sheets API và thêm. Với dự án Google Cloud tiêu chuẩn tự liên kết, cần bật Sheets API trong dự án đó.
6. Trong **Project Settings → Script Properties**, thêm:
   - `SPREADSHEET_ID`: ID bảng tính ở bước 1.
   - `GATEWAY_SECRET`: khóa đã tạo ở bước 2.
7. Chọn hàm `setup`, bấm **Run**, cấp quyền bằng đúng tài khoản sở hữu bảng tính. Chỉ cấp quyền sau khi đối chiếu đúng dự án do thầy vừa tạo; nếu chính sách tài khoản trường chặn, cần quản trị viên trường cho phép.
8. Quay lại Sheets, xác nhận có các tab: `Students`, `Sessions`, `Turns`, `Profiles`, `Surveys`, `ReviewQueue`, `Versions`, `Settings`, `Audit`.
9. Trong Apps Script, mở **Triggers** (biểu tượng đồng hồ) → **Add trigger** → chọn `purgeExpired` → **Time-driven → Day timer**, một lần mỗi ngày. Giữ thông báo khi trigger lỗi. Không cần thêm quyền quản lý trigger vào mã: thầy thiết lập bằng giao diện.

Manifest chỉ yêu cầu phạm vi `https://www.googleapis.com/auth/spreadsheets`. Google mô tả quyền này áp dụng cho bảng tính mà danh tính được cấp quyền có thể truy cập; nó **không phải** quyền giới hạn từng tab hay chỉ một bảng tính. Cấu hình này cần Sheets API và `openById`; mã cố định đích bằng `SPREADSHEET_ID` phía máy chủ, không nhận ID bảng tính do học sinh gửi. Không yêu cầu Gmail, danh bạ, Drive API hay ủy quyền toàn miền. Không tuyên bố OAuth được giới hạn vào một tệp nếu màn hình Google cấp phạm vi rộng hơn.

## 4. Triển khai Apps Script

1. Chọn **Deploy → New deployment → Web app**.
2. **Execute as:** chọn **Me / Tôi** (tài khoản của thầy).
3. **Who has access:** chọn **Anyone / Bất kỳ ai**, để Netlify gọi máy chủ mà không yêu cầu học sinh đăng nhập Google. Đây là quyền gọi cổng Apps Script, **không phải** công khai bảng tính. Cổng chỉ xử lý POST có HMAC hợp lệ; gọi không có chữ ký không đọc/ghi được dữ liệu.
4. Bấm Deploy và sao chép URL kết thúc bằng **`/exec`**.
5. Cất URL này trong biến Netlify ở bước 5. Không đưa URL vào trình duyệt hay gửi cho học sinh. Mở URL bằng trình duyệt thường không phải phép thử ghi hợp lệ vì cổng không có `doGet` công khai.
6. Khi sửa `Code.gs` hoặc `Domain.gs`, chọn **Manage deployments → Edit → New version → Deploy**. Chỉ lưu tệp trong trình soạn thảo chưa cập nhật phiên bản `/exec` đang chạy.

Nếu tài khoản Workspace không có lựa chọn Anyone, cấu hình này đang bị chính sách tổ chức chặn. Cần quản trị viên cho phép triển khai phù hợp hoặc dùng một tài khoản được tổ chức cho phép để sở hữu bảng dữ liệu. Không đổi sang “User accessing the web app”, vì cách đó yêu cầu xác thực Google ở người gọi.

Chỉ dùng **một dự án Apps Script** cho một bảng dữ liệu. Nhiều bản triển khai thuộc cùng dự án dùng chung ScriptLock; nhiều dự án khác nhau ghi chung một Sheet không dùng chung khóa này. Không sửa/xóa hàng hoặc sắp xếp trực tiếp các tab hệ thống trong lúc lớp đang học. Khi cần xem theo tiêu chí, dùng filter view hoặc một bản sao chỉ dành cho báo cáo.

## 5. Thiết lập Netlify và triển khai V6.5.0

Giải nén ZIP. Thư mục gốc triển khai là thư mục chứa `package.json` và `netlify.toml`, không phải thư mục cha bên ngoài.

1. Sao lưu bản V6.4.0 thầy đang dùng. Cập nhật kho mã nguồn đã nối với Netlify bằng nội dung V6.5.0, giữ cấu hình bí mật hiện tại trên Netlify.
2. Trong Netlify, mở dự án → **Project configuration / Site configuration → Environment variables**.
3. Giữ các biến AI hiện đang hoạt động. Có thể dùng **một trong hai nhà cung cấp**:

| Biến | Giá trị |
|---|---|
| `AI_PROVIDER` | `openai` hoặc `gemini`, giữ lựa chọn đang chạy của thầy |
| `OPENAI_API_KEY` | Khóa thật của thầy nếu dùng OpenAI |
| `OPENAI_MODEL` | Giữ mô hình đang chạy; mã gốc dùng mặc định `gpt-6-luna` |
| `OPENAI_REASONING_EFFORT` | Mã gốc mặc định `medium` |
| `OPENAI_DIAGRAM_REASONING_EFFORT` | Mã gốc mặc định `low` |
| `OPENAI_TIMEOUT_MS` | Mã gốc mặc định `50000` |
| `GEMINI_API_KEY` | Khóa thật của thầy nếu dùng Gemini |
| `GEMINI_MODEL` | Giữ mô hình đang chạy; cấu hình mẫu gốc là `gemini-2.5-flash` |
| `ACCESS_CODE` | `HOCGIOITOAN` |
| `STATE_SIGNING_KEY` | Khóa ký trạng thái riêng nếu sử dụng |

Không khẳng định tài khoản của thầy có quyền dùng mọi mô hình ghi trong mã. V6.5 giữ danh sách và bộ điều hợp hiện có, chưa kiểm tra quyền tài khoản thật.

4. Thêm bốn biến của bộ nhớ:

| Biến | Giá trị cần điền |
|---|---|
| `LEARNING_GATEWAY_URL` | URL Apps Script `https://script.google.com/macros/s/…/exec` |
| `LEARNING_GATEWAY_SECRET` | Trùng **chính xác** `GATEWAY_SECRET` ở Apps Script |
| `LEARNING_SIGNING_KEY` | Khóa ký phiếu gửi lại riêng |
| `TEACHER_ADMIN_KEY` | Khóa quản trị riêng |

Nếu Netlify có lựa chọn phạm vi, cho các biến này dùng trong **Functions** và đúng môi trường Production. Tệp `.env.example` chỉ là mẫu rỗng, không thay thế biến Netlify.

5. Giữ build command **`npm run build`**, publish directory **`dist`**, functions directory **`netlify/functions`**, Node **22**. Các đường dẫn `/api/chat`, `/api/learning`, `/api/teacher` được khai báo trong config của Functions; khảo sát cũ vẫn ở `/.netlify/functions/feedback`.
6. Trigger deploy mới. Xem build log và danh sách Functions. Phải có `chat`, `feedback`, `learning`, `teacher`.
7. **Không chỉ kéo thư mục dist vào Netlify Drop**: gói giao diện tĩnh không tự triển khai các Functions máy chủ. Dùng kho mã nguồn đã liên kết với Netlify và build dự án đầy đủ.

Chạy trên máy cá nhân (Node 22.13 trở lên):

```bash
npm ci
npm start
```

Nếu muốn thử với cấu hình thật trên máy, chép `.env.example` thành `.env` và tự điền. `npm start` có cả API máy chủ. `npm run dev` chỉ là Vite; không tự cấp API. Không đưa `.env` vào Git hoặc ZIP.

## 6. Kiểm tra một bản ghi thật

1. Vào website đã triển khai, bấm **Kết nối AI**, nhập HOCGIOITOAN. Kiểm tra kết nối này dùng API AI thật theo cấu hình của thầy.
2. Ở hồ sơ học tập, có thể để trống tên, trường và email. Chọn mức độ học phù hợp.
3. Mở **Bộ nhớ học tập**, đọc thông báo, tích hai xác nhận khi thực sự phù hợp rồi bấm **Bật lưu tiến bộ**. Cất mã khôi phục riêng. Không gửi mã này vào nhóm lớp.
4. Trong Sheet, tab Students phải xuất hiện mã `s_…` cùng phiên bản đồng ý. Không có cột tên hay email dùng để ghép học sinh.
5. Gửi một đề: “Cho tam giác ABC vuông tại A. M thuộc đoạn AB và 2AM = AB. Chứng minh M là trung điểm AB.” Đợi câu hỏi của AI. **Đề mở đầu không tính là bằng chứng học sinh đã hiểu.**
6. Trả lời câu gợi mở bằng một bước toán học. Khi giao diện báo **Google Sheets đã xác nhận lưu lượt học**, kiểm tra tab Turns có một dòng, Profiles có hồ sơ mã tương ứng, Sessions có phiên tương ứng.
7. Xem các cột `question`, `answer`, `verdict`, `errorKind`, `hintLevel`, `nextAction`, `ruleVersion`, `exampleVersion`. Cột `data` giữ bản JSON đầy đủ; những cột còn lại là cột xem nhanh, không sửa trực tiếp để thay đổi quy tắc.
8. Mở Bộ nhớ học tập → **Xuất dữ liệu của em**. Tệp JSON phải chỉ chứa dữ liệu của mã này, không chứa khóa khôi phục hay khóa máy chủ.
9. Bấm **Ngừng ghi dữ liệu**, chờ xác nhận máy chủ, trả lời thêm một lượt: Turns không được tăng. Phiên học vẫn tiếp tục.
10. Khi kiểm tra xong, dùng **Yêu cầu xóa dữ liệu** cho mã thử để không lẫn với dữ liệu lớp.

Nếu thấy “Chưa xác nhận lưu”, **không kết luận đã lưu** chỉ vì AI vẫn trả lời. Mở lại Bộ nhớ học tập → Gửi lại lượt chờ. Phiếu gửi lại được ký ở máy chủ; cùng một phiếu không tạo thêm bản ghi. Nếu ngay bước đọc hồ sơ thất bại, lượt đó vẫn học được nhưng không tạo phiếu lưu: ứng dụng thông báo rõ lượt đó không được ghi.

## 7. Giáo viên xem, sửa, duyệt và quay lại phiên bản

- Mở **Bộ nhớ học tập → Khu vực giáo viên** (hoặc thêm `?teacher=1` sau địa chỉ website).
- Đăng nhập bằng **TEACHER_ADMIN_KEY**, không dùng mã lớp. Khóa chỉ nhập lúc đăng nhập, không được lưu trong localStorage. Phiên quản trị dùng cookie HttpOnly, SameSite=Strict, Secure trên HTTPS và hết hạn sau 8 giờ.
- Các trường hợp được đưa vào hàng đợi: lỗi lặp lại; một gợi mở dẫn tới bước tự sửa; học sinh bấm “Báo gợi mở chưa phù hợp”. Hàng đợi phân trang 100 trường hợp.
- Đọc câu hỏi/câu trả lời, tự viết lại **mẫu gợi mở khái quát** và **câu kiểm tra bước tiếp theo**. Có thể lưu bản sửa nhưng chưa xuất bản.
- Chỉ bấm duyệt khi đã kiểm tra toán học và loại thông tin cá nhân. Mẫu đã duyệt không chứa mã học sinh hoặc trích dẫn bài làm tự động. Bác bỏ sẽ giữ trường hợp khỏi kho dùng chung.
- Mỗi lần duyệt hoặc sửa/xuất bản kho tạo một phiên bản. Chọn bản trước rồi bấm **Dùng lại phiên bản đã chọn** để rollback. Lượt yêu cầu tiếp theo đọc phiên bản đang có; một lượt đã bắt đầu trước rollback có thể hoàn tất theo bản đã đọc, và log vẫn ghi đúng phiên bản đó.
- Không tự chỉnh tên tab, ID hay cột JSON để “duyệt”. Dùng trang giáo viên để giữ kiểm tra và lịch sử Audit nhất quán.

## 8. Cách hệ thống điều chỉnh gợi mở

Không huấn luyện lại trọng số. Sau khi người học đồng ý, mỗi lượt gia sư đọc hồ sơ rút gọn và tối đa 3 mẫu cùng kỹ năng. Phần dữ liệu bổ sung có giới hạn 5.200 ký tự, cộng đoạn hướng dẫn cố định. Không nạp toàn bộ Drive và không thêm một lần gọi AI riêng để chấm.

Đánh giá có cấu trúc từ API hiện tại đi qua các kiểm tra sẵn có: câu trích phải thuộc câu trả lời mới nhất, có căn cứ; yêu cầu xin đáp án không được mở khóa lời giải. Kết quả đúng có bằng chứng mới được tăng `predicted`. Chỉ tăng `corroborated` khi một câu trả lời khác, trong cùng phiên, cùng kỹ năng, trả lời đúng câu gợi mở tiếp theo và có bằng chứng. Đây vẫn là **AI nhận định về các bước quan sát được**, không phải xác nhận thành thạo của giáo viên hay kiểm chứng toán học tuyệt đối.

Sai làm tăng hỗ trợ; bước được củng cố làm giảm hỗ trợ trong khoảng 0–4. Hồ sơ lưu sai lầm lặp lại, các bước đã thể hiện, thống kê tám giai đoạn và 20 phiên gần đây. Các lượt gửi lại đến muộn không ghi đè trạng thái mới hơn hay tạo củng cố giả theo thứ tự đến mạng.

Ba chỉ số xem trên trang giáo viên:

1. Tỷ lệ hoàn thành bước có bằng chứng khi mức gợi mở 0–1 trên tổng bước được quan sát; đây là chỉ số gần đúng về tự làm, cần giáo viên kiểm tra mẫu.
2. Mức gợi mở trung bình trên một bước và số lần lỗi xuất hiện lại.
3. So sánh số bước tự làm, hỗ trợ và lỗi giữa các buổi gần nhau, trên bài có kỹ năng và độ khó tương đương.

Để đánh giá hiệu quả giáo dục, nên có bài kiểm tra trước/sau cùng ma trận, chấm độc lập một mẫu câu trả lời, và so sánh nhóm/buổi tương đương. Chưa có kết quả thực nghiệm thật trong gói này.

## 9. Lưu trữ, quyền riêng tư và giới hạn vận hành

| Thành phần | Chính sách trong mã |
|---|---|
| Nhật ký, khảo sát, trường hợp chờ duyệt | Hết thời hạn 90 ngày thì không truy xuất; trigger hằng ngày xóa các ô dữ liệu hết hạn |
| Hồ sơ tiến bộ | Hết hạn sau 90 ngày từ lần cập nhật tiến bộ gần nhất; không xem là trí nhớ vĩnh viễn |
| Mã khôi phục | Dùng mã học sinh + bí mật ngẫu nhiên; phía Google chỉ lưu băm bí mật; ID học sinh đơn lẻ không đủ quyền |
| Mẫu khái quát do giáo viên duyệt | Không chứa liên kết trực tiếp tới học sinh; giữ các phiên bản để rollback |
| Hàng chờ trên thiết bị | Tối đa 20 lượt, 24 giờ, tối đa 8 lần thử; ngừng ghi xóa ngay hàng chờ |
| Giới hạn lưu | 150 lượt/phiên; 300 lượt/ngày UTC/học sinh; 30 thao tác/phút/học sinh ở cổng Google |
| Dung lượng an toàn chủ động | 500 hồ sơ; 20.000 dòng/tab dữ liệu thông thường; 300 phiên bản; 40 mẫu/phiên bản |
| Đầu vào máy chủ | JSON giới hạn kích thước; kiểm tra nguồn yêu cầu, chữ ký, quyền, mã phiên và kiểu dữ liệu |
| Ghi Sheets | ScriptLock dùng chung + một `spreadsheets.batchUpdate` nguyên tử; chuỗi ghi bằng `stringValue`, không thực thi công thức |

Các giới hạn số dòng là hàng rào của bản triển khai, **không phải** số đo tải thực tế hay hạn mức tối đa Google. Apps Script/Sheets có hạn mức và độ trễ riêng; nhiều lượt đồng thời có thể vào hàng chờ. Không được khẳng định đã kiểm thử tải toàn trường bằng các test mô phỏng. Khi vượt giới hạn, xuất dữ liệu, dọn dữ liệu hết hạn hoặc cân nhắc thay lớp lưu trữ bằng cơ sở dữ liệu có giao dịch; không bỏ cơ chế chống trùng.

Bộ lọc ẩn các mẫu email, số điện thoại, liên kết và một số cách khai tên. Không có bộ lọc nào ở đây bảo đảm nhận ra mọi thông tin cá nhân tự do; học sinh được nhắc chỉ gửi nội dung Toán, giáo viên phải kiểm tra trước khi dùng chung. Ảnh không được ghi vào Sheets; tính năng đọc/dựng hình gốc vẫn gửi ảnh tới nhà cung cấp AI theo luồng đã có.

“Xóa” nghĩa là xóa dữ liệu đang dùng trong các tab hoạt động, hàng chờ và giao diện theo mã học sinh. Google có thể giữ lịch sử phiên bản, bản sao và chính sách lưu nội bộ riêng; ứng dụng không thể bảo đảm xóa mọi lịch sử Google. Chủ sở hữu cần quản lý bản sao/xuất dữ liệu và chính sách nhà trường. Trigger phải được tạo và theo dõi để việc dọn dữ liệu vật lý thực sự chạy.

Khảo sát Google Form cũ vẫn tồn tại độc lập khi chưa bật bộ nhớ: có yêu cầu tên/trường/email và đồng ý gửi riêng. Khảo sát khi bộ nhớ đang bật được gửi vào Surveys theo mã học sinh, không tự gửi thêm sang Form. Dữ liệu Form cũ không được tự nhập vào hồ sơ mới và không thuộc phạm vi xóa theo mã học sinh mới.

## 10. Xử lý lỗi thường gặp

| Thông báo/triệu chứng | Kiểm tra |
|---|---|
| Chưa kết nối Google Sheets | Đủ bốn biến Netlify chưa; biến dùng cho Functions; đã deploy lại chưa |
| Google chưa xác nhận / cổng trả trang đăng nhập | Dùng `/exec`, deploy Execute as Me, quyền gọi Anyone; kiểm tra chính sách Workspace |
| Chưa sẵn sàng ngay sau setup | Có cả Domain.gs, Code.gs, manifest và dịch vụ Sheets v4; SPREADSHEET_ID đúng; đã chạy setup |
| AI chạy nhưng không có Turns | Đã đồng ý chưa; đây có phải đề mở đầu/xin đáp án/nội dung ngoài phạm vi không; xem trạng thái ghi cụ thể |
| Lượt chờ không gửi lại sau ngừng ghi | Đúng thiết kế: phiên bản đồng ý đã đổi, phiếu cũ không còn quyền ghi |
| Nhận 429 | Giới hạn thao tác hoặc số lượt; chờ rồi thử, xem dung lượng tab và Google quotas |
| Đăng nhập giáo viên thất bại | Khóa quản trị đủ dài, khác mã lớp; không dùng tên/vai trò tự khai làm quyền |
| Không thấy bộ nhớ trên máy khác | Cần mã khôi phục riêng; tên/email không tự ghép hồ sơ; không chia sẻ mã của học sinh khác |
| Phiên bản kho vừa thay đổi | Tải lại trước khi duyệt; đây là kiểm tra tránh ghi đè thay đổi của giáo viên khác |

## 11. Việc thầy cần tự làm trước khi dùng thật

- [ ] Tạo Sheet riêng trong Drive bằng đúng tài khoản muốn sở hữu.
- [ ] Cài ba tệp Apps Script, bật Sheets v4, đặt SPREADSHEET_ID và GATEWAY_SECRET, chạy setup.
- [ ] Tạo trigger purgeExpired mỗi ngày và theo dõi lỗi.
- [ ] Deploy Apps Script đúng chế độ; lấy URL /exec.
- [ ] Tạo và đặt khóa riêng cùng URL vào Netlify; giữ cấu hình nhà cung cấp AI đang chạy.
- [ ] Deploy toàn bộ dự án qua kho mã nguồn; xác nhận đủ bốn Functions.
- [ ] Thực hiện phép thử ở mục 6 bằng một mã thử, kiểm tra trực tiếp bản ghi trong Sheet rồi xóa mã thử.
- [ ] Thống nhất thông báo và việc đồng ý với nhà trường/phụ huynh phù hợp; hạn chế người có quyền Sheet và khóa quản trị.

## Tài liệu kỹ thuật chính thức đã đối chiếu

- [Google Apps Script — Web apps](https://developers.google.com/apps-script/guides/web): thực thi theo người triển khai, quyền truy cập, URL /exec.
- [Google — Container-bound scripts](https://developers.google.com/apps-script/guides/bound): khác biệt khi mã chạy dạng web app.
- [Google — OAuth scopes cho Sheets](https://developers.google.com/workspace/sheets/api/scopes): phạm vi cấp quyền ở cấp bảng tính, không giới hạn từng tab.
- [Google — LockService](https://developers.google.com/apps-script/reference/lock/lock-service): đồng bộ truy cập tài nguyên chung.
- [Google — spreadsheets.batchUpdate](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate): các yêu cầu trong một batch được áp dụng nguyên tử.
- [Google — Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas): giới hạn theo dịch vụ/tài khoản, có thể thay đổi.
- [Netlify — Rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/): config theo đường dẫn và giới hạn theo IP/domain, thực thi có độ trễ.

Đối chiếu tài liệu ngày 29/09/2026. Hướng dẫn quyền/vận hành là mô tả cấu hình phần mềm; không phải kết luận tuân thủ pháp lý hay cam kết dịch vụ Google/Netlify.
