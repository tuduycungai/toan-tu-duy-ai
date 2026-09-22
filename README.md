# Bản cập nhật V6.2.4

Sửa lỗi đề đã đọc rõ nhưng bị chặn ở bước xác nhận cấu trúc; bổ sung kiểm tra tọa độ trung điểm/giao điểm bằng calc; giảm các bản sao bộ nhớ khi nạp TeX và giữ đề trước khi bắt đầu học nếu trang tải lại. Lịch mời khảo sát đổi thành **13 phút**.

Giữ React/Vite/TypeScript, Gemini API, Netlify, mã lớp, bài mẫu và giao diện hiện có. Không cần dịch vụ hay khóa mới. Đọc `docs/BAO_CAO_V6_2_4.md`, `docs/BANG_KIEM_THU_V6_2_4.md`, `docs/HUONG_DAN_GIAO_VIEN_V6_2_4.md` để xem kết quả thực tế và giới hạn thiết bị.

Lệnh kiểm tra bổ sung: `npm run test:v624` và `npm run test:ui:v624`. Trên điện thoại, giới hạn ảnh đầu vào 16 triệu điểm ảnh; nên chụp 12 MP và cắt riêng đề. Chưa nghiệm thu Gemini thật hoặc Safari/iPhone/Android vật lý; kiểm thử UI dùng Chromium và phản hồi Gemini có kiểm soát.

Bản vá bộ nhớ TikZJax được tạo lại trong prebuild từ dependency khóa, với mã nguồn ở `scripts/patch-tikz-memory.mjs` và `scripts/tikz-core-stream.mjs`. Thông tin sửa thư viện: `THIRD_PARTY/TIKZJAX-V6_2_4-MODIFICATIONS.md`.

Phần V6.2.3 bên dưới ghi lại nền tảng tính năng đã có; kết quả kiểm thử và giới hạn mới nhất nằm trong tài liệu V6.2.4.

---

# Bản cập nhật V6.2.3

Hai tính năng mới được triển khai tiếp trên bản V6.2.2:

- Hội thoại thích ứng 12 trạng thái, tám giai đoạn, bộ nhớ có chữ ký máy chủ; chỉ tổng hợp ở giai đoạn 7 sau bằng chứng học sinh đã chứng minh.
- Chọn/chụp/kéo thả ảnh → đọc và xác nhận đề → cấu trúc hình học → TikZ → kiểm tra → biên dịch WASM → xác nhận hình → học gợi mở. Tự sửa mã tối đa hai lần.

Đọc `docs/BAO_CAO_V6_2_3.md`, `docs/BANG_KIEM_THU_V6_2_3.md` và `docs/HUONG_DAN_GIAO_VIEN_V6_2_3.md` trước khi cập nhật Netlify. Các cấu hình triển khai và biến môi trường hiện tại được giữ nguyên. Không cần khóa hoặc dịch vụ biên dịch mới.

Kiểm thử đã chạy và giới hạn chưa kiểm tra được ghi riêng trong báo cáo. Các phản hồi Gemini dùng trong kiểm thử tự động cục bộ là fixture có kiểm soát; không được xem là bằng chứng chất lượng OCR hoặc đánh giá sư phạm của Gemini thật.

Lệnh bổ sung: `npm run lint`, `npm run test:v623`, `npm run test:ui:v623`. Kiểm thử Gemini thật tùy chọn: cấu hình khóa ở môi trường máy chủ, đặt `RUN_LIVE_GEMINI=1`, rồi chạy `npm run test:live:v623`. Không đưa khóa vào giao diện hay ZIP.

---

# Tư duy Toán học — Gia sư hình học tứ giác

Mã nguồn ứng dụng, cấu hình triển khai, tài nguyên giao diện và bộ kiểm thử.

## Tính năng

Hai chế độ **Kiểm tra lời giải** và **So sánh cách giải** có nhãn **(Đang phát triển)** trong danh mục và tiêu đề. Mỗi chế độ có hướng dẫn sư phạm riêng: kiểm tra lỗi đầu tiên và căn cứ, hoặc đối chiếu đúng một tiêu chí giữa các ý tưởng của học sinh. Chưa có bài làm/ý tưởng thì hỏi phần cần bổ sung; không viết hộ lời giải. V6.2.3 mở rộng lượt gợi mở thông thường bằng trạng thái thích ứng; nội dung bài mẫu giữ nguyên. Yêu cầu tạo bộ 5–10 câu có chỉ dẫn và kiểm tra định dạng riêng; chọn một câu để bắt đầu hướng dẫn.

- Liên kết “Poster khoa học online” mở https://poster-online-khkt.netlify.app/ theo địa chỉ mới người quản lý cung cấp.
- Hồ sơ để trống lớp (kể cả chỉ nhập khoảng trắng) được nhận diện là **Giáo viên**. Vai trò hoặc lớp luôn nằm trong nội dung khảo sát gửi Google Forms, kể cả khi không gửi tóm tắt học tập.
- Nút **Khảo sát đánh giá ứng dụng** mở khảo sát và không kết thúc cuộc trò chuyện. Lời mời nhắc mỗi **13 phút (780 giây)**, bắt đầu sau khi kết nối AI và hoàn tất hồ sơ. Nếu đang trả lời, mở hộp thoại khác hoặc ở tab nền, lời mời chờ đến khi sẵn sàng; không chồng hộp thoại.
- Đóng khảo sát chưa gửi vẫn giữ bản nháp. Sau một lần gửi đã được xác nhận, lần khảo sát mới dùng mã gửi mới, yêu cầu chọn sao và đồng ý lại. Kết quả chưa xác nhận được giữ nguyên, không tự gửi lại. Không có yêu cầu gửi Google Forms nào chỉ do đồng hồ kích hoạt.

V6 thay đường dựng hình của giao diện học sinh bằng **Gemini → TikZ → TeX/WebAssembly → SVG**. Bộ đọc câu theo mẫu của V5 không còn quyết định hình hiển thị. Vẫn giữ ngân hàng 87 bài, hồ sơ học sinh, lý thuyết, sơ đồ định hướng và phản hồi.

## Chạy trên máy

Yêu cầu Node.js >= 22.13.0.

```bash
npm ci
```

Sao chép `.env.example` thành `.env`, điền GEMINI_API_KEY ở máy chủ. Sau đó:

```bash
npm start
```

Mở http://127.0.0.1:3000. `npm run dev` chỉ phục vụ giao diện; muốn gọi Gemini dùng `npm start`.

## Cập nhật trang Netlify hiện có

Giữ GEMINI_API_KEY, GEMINI_MODEL và ACCESS_CODE trong biến môi trường Netlify (Functions). Không đưa khóa vào VITE_* hay mã giao diện. Giữ đúng dự án đang dùng tên miền của bạn.

Với Git: thay mã dự án bằng V6, commit/push lên nhánh Netlify theo dõi. `netlify.toml` đã có build `npm run build`, publish `dist`, functions `netlify/functions`.

Với Netlify CLI, chạy tại thư mục chứa package.json:

```bash
npm ci
npx netlify-cli login
npx netlify-cli link
npx netlify-cli deploy
```

Chọn đúng site hiện có trong bước link. Lệnh deploy tạo bản nháp và dựng cả giao diện/functions. Kiểm tra bản nháp rồi xuất bản:

```bash
npx netlify-cli deploy --prod
```

Không chỉ kéo thư mục dist vào Netlify Drop: luồng Gemini cần được triển khai cùng Functions.
Nguồn: https://cli.netlify.com/commands/deploy/ và https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/

## Kiểm tra

```bash
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:tikz
npm run test:ui
```

Có thể đặt CHROMIUM_EXECUTABLE nếu dùng Chromium riêng. TEST_PRODUCTION=1 dùng bản dist trong bài kiểm tra UI. Test UI giả lập phản hồi Gemini, nhưng biên dịch TeX và tải PNG thật.

## Bộ dựng hình

Các mục dưới đây mô tả luồng dựng hình từ đề nhập chữ đã có. Luồng ảnh V6.2.3 dùng cùng bộ biên dịch, thêm xác nhận phiên âm/cấu trúc/hình và cho phép tối đa hai lần tự sửa mã.

- Khi gửi hoặc xem hình: một yêu cầu riêng, có xác thực, gọi Gemini bằng mode diagram trên /api/chat.
- JSON trả mã LaTeX hoàn chỉnh hoặc một câu hỏi về dữ kiện thực sự thiếu. JSON chỉ là vỏ giao tiếp; học sinh không phải đọc mã.
- Trích môi trường tikzpicture và các thư viện để biên dịch trong worker của TikZJax; file .tex tải về vẫn có standalone/document.
- Bộ biên dịch và font đặt tại cùng website, không phụ thuộc CDN khi học.
- Một lượt sửa mã khi biên dịch lỗi; có hủy yêu cầu, giới hạn thời gian và bộ nhớ đệm kết quả theo đề trong phiên.
- Ảnh SVG nhúng font; PNG giữ tỉ lệ và nền trắng. Có phóng to và tải .tex.
- Dựng đúng cú pháp không chứng minh rằng AI hiểu đúng toán. Giáo viên cần kiểm tra các đề mới hoặc khó.
- Hỗ trợ TikZ, hình phẳng, hình không gian dạng chiếu và đồ thị TikZ đơn giản. Chưa hỗ trợ toàn bộ LaTeX/PGFPlots hay mọi bài toán bất kỳ.

Chi tiết thay đổi tệp nén của bộ biên dịch: `scripts/prepare-tikz.mjs`. Script đổi đuôi tài nguyên nén thành .gz.bin để tránh trình duyệt và máy chủ giải nén hai lần. Phiên bản phụ thuộc được khóa trong package-lock.json.

## Bản quyền thư viện

TikZJax @rod2ik/tikzjax 1.6.0: https://github.com/rod2ik/tikzjax (GPL-3.0-or-later), kế thừa TikZJax và Web2JS. Bản giấy phép kèm trong THIRD_PARTY. Mã ứng dụng và script tích hợp được cung cấp trong gói; mã nguồn upstream có tại liên kết dự án. Giữ các thông báo bản quyền khi phân phối thư viện. Xem các giấy phép phụ thuộc trong node_modules sau npm ci.
