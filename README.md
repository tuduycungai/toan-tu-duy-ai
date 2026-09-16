# AI TUTOR TỨ GIÁC PRO V6.1

Bản sửa 6.1: xem `SUA_LOI_V6_1.md` để biết lỗi đã sửa và kết quả kiểm tra trực tiếp trên website.

V6 thay đường dựng hình của giao diện học sinh bằng **Gemini → TikZ → TeX/WebAssembly → SVG**. Bộ đọc câu theo mẫu của V5 không còn quyết định hình hiển thị. Vẫn giữ ngân hàng 87 bài, hồ sơ học sinh, lý thuyết, sơ đồ định hướng và phản hồi.

Đọc `BAO_CAO_BAN_GIAO_V6.md` trước khi triển khai. Các báo cáo V5/V4 còn trong dự án là tài liệu lịch sử, không mô tả giao diện V6.

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
