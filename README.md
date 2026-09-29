# V6.5.0 — Bộ nhớ học tập và kho gợi mở do giáo viên duyệt

**Bản sửa lỗi Apps Script ngày 29/09/2026:** đã thay hai phép gán `||=` trong `Domain.gs` để xử lý lỗi `ParseError: Unexpected token =` khi lưu trên Google. Mã nguồn Node và mã Apps Script đã được đồng bộ; có kiểm tra cú pháp ES2020. Xem `docs/v650/SUA_LOI_APPS_SCRIPT.md`.

Bản nâng cấp từ mã V6.4.0 đính kèm; giữ Vite/React, Netlify Functions, OpenAI/Gemini và chức năng dựng hình.

**Bắt đầu:** đọc [hướng dẫn kết nối Google Sheets](docs/v650/HUONG_DAN_GOOGLE_SHEETS.md). Khi chưa điền biến lưu trữ, ứng dụng vẫn học được nhưng không ghi dữ liệu thật vào Google Sheets.

- [Khảo sát mã nguồn và luồng dữ liệu](docs/v650/KHAO_SAT_MA_NGUON.md)
- [Sơ đồ dữ liệu](docs/v650/SO_DO_DU_LIEU.md)
- [Đối chiếu yêu cầu](docs/v650/DOI_CHIEU_YEU_CAU.md)
- [Kết quả kiểm thử](docs/v650/KET_QUA_KIEM_THU.md)

```bash
npm ci
npm start
```

Kiểm tra: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Kiểm tra riêng bộ nhớ: `npm run test:learning`. Kiểm tra trình duyệt sau build: `npm run test:ui:v650` (cần Chromium của Playwright hoặc biến CHROMIUM_EXECUTABLE). Tất cả kiểm tra V6.5 dùng dịch vụ mô phỏng.

Cập nhật mã Google sau khi sửa domain/engine: `npm run build:gateway`, rồi cập nhật Domain.gs và tạo deployment Apps Script phiên bản mới. Không sửa Domain.gs độc lập.

Phần dưới là tài liệu kế thừa V6.4.0. Khi hướng dẫn cũ khác phần thiết lập bộ nhớ V6.5, dùng tài liệu V6.5 ở trên.

---

# Tư duy Toán học — V6.4.0

Ứng dụng học hình học với React, TypeScript và Vite; hỗ trợ API OpenAI/Gemini và triển khai Netlify.

**V6.4.0:** AI diễn giải đề thành các phép dựng; ứng dụng tính tọa độ, kiểm tra quan hệ và xuất SVG trực tiếp. Áp dụng cho đề nhập và đề ảnh đã xác nhận, tiếp tục dùng `gpt-6-luna`. Bộ dựng cục bộ và công cụ TikZ mở rộng vẫn được sử dụng khi phù hợp.

Xem [phạm vi, kiểm thử và cách cập nhật](docs/V6_4_0_DUNG_HINH_TONG_QUAT.md). Chạy `npm run review:figures` để tạo hình mẫu và kết quả đối chiếu của 20 nhóm hình trong `docs/v640-review/`. Bộ kiểm tra dùng API giả lập; cần kiểm tra API thật sau khi triển khai.

## Chạy trên máy

Cài Node.js theo `package.json` và dùng npm. Bản bàn giao được kiểm tra bằng Node.js 24.19.0, npm 11.9.0.

```sh
npm ci
npm start
```

Mở `http://localhost:3000`. Có thể xem bài mẫu, lý thuyết và hình được dựng cục bộ khi chưa cấu hình API. Muốn dùng hội thoại và đọc ảnh, sao chép `.env.example` thành `.env`, điền khóa máy chủ rồi khởi động lại. Trên Windows có thể sao chép tệp bằng File Explorer.

Mã lớp mặc định là `HOCGIOITOAN`. Học sinh nhập mã lớp trong hộp Kết nối AI; không nhập khóa API vào giao diện.

## Cấu hình API

Cấu hình API cho bản 6.4.0:

| Biến                              | Vai trò                                                             |
| --------------------------------- | ------------------------------------------------------------------- |
| `AI_PROVIDER`                     | `openai` hoặc `gemini`                                              |
| `OPENAI_API_KEY`                  | Khóa OpenAI ở máy chủ                                               |
| `OPENAI_MODEL`                    | Mặc định `gpt-6-luna`; danh sách cấu hình trong `server/openai.mjs` |
| `OPENAI_REASONING_EFFORT`         | Mặc định `medium` cho hội thoại                                     |
| `OPENAI_DIAGRAM_REASONING_EFFORT` | Mặc định `low`, dành riêng cho vẽ hình                              |
| `OPENAI_TIMEOUT_MS`               | Mặc định `50000`; hợp lệ từ `5000` đến `52000`                      |
| `GEMINI_API_KEY`                  | Khóa Gemini ở máy chủ                                               |
| `GEMINI_MODEL`                    | Mặc định `gemini-2.5-flash`                                         |
| `ACCESS_CODE`                     | Mã lớp, mặc định `HOCGIOITOAN`                                      |
| `STATE_SIGNING_KEY`               | Khóa ký trạng thái tùy chọn; xem `.env.example`                     |

Giữ khóa ngoài mã nguồn, không đặt trong biến `VITE_*`. Quyền truy cập mô hình và hạn mức cần kiểm tra trên tài khoản API thực tế. Có thể đặt `STATE_SIGNING_KEY` trong biến môi trường máy chủ để giữ khóa ký trạng thái ổn định khi đổi khóa API hoặc nhà cung cấp.

## Triển khai Netlify

1. Đưa toàn bộ thư mục mã nguồn lên kho dự án kết nối với Netlify.
2. Giữ `netlify.toml`: build `npm run build`, publish `dist`, Functions `netlify/functions`, Node `22`.
3. Đặt biến môi trường cho Functions, rồi triển khai lại.
4. Mở ứng dụng, nhập mã lớp và kiểm tra kết nối bằng tài khoản API của giáo viên.

Chỉ tải `dist` lên dịch vụ lưu trữ tĩnh sẽ thiếu API hội thoại và gửi khảo sát. Tệp `.env` không nằm trong gói bàn giao.

## Lệnh kiểm tra và phát triển

```sh
npm run format
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:v640
npm run review:figures
npm run build
npm run preview
```

`npm run preview` phục vụ bản build giao diện; `npm start` chạy cả giao diện phát triển và API cục bộ. Các tệp TikZ ở `public/tikz` được tái tạo từ dependency đã khóa trước khi chạy dev, start, test hoặc build; không cần đóng gói bản sinh sẵn.

Kiểm thử trình duyệt cần cài Chromium của Playwright:

```sh
npx playwright install chromium
npm run test:ui
npm run test:ui:legacy
npm run test:ui:v624
npm run test:start
```

Có thể đặt `CHROMIUM_EXECUTABLE` tới Chromium đã cài. Các kiểm thử UI trên dùng phản hồi API có kiểm soát; không chứng minh chất lượng trả lời của mô hình thật và không gửi khảo sát thật.

## Chức năng và phạm vi

- Hồ sơ học sinh/giáo viên, phân loại mức học và gợi mở theo tám giai đoạn tư duy.
- Ngân hàng 87 bài mẫu, lý thuyết dự kiến dùng, dựng hình cục bộ hoặc qua API.
- Giữ hình qua các lượt trả lời; dựng lại khi người dùng chủ động yêu cầu hoặc đổi đề.
- Kiểm tra lời giải và So sánh cách giải giữ nhãn **Đang phát triển** và luồng hiện có.
- Giao diện sáng/tối, bố cục điện thoại, biểu mẫu khảo sát cuối buổi.

Trọng tâm nội dung là hình học THCS, nhất là tứ giác lớp 8. Giáo viên cần kiểm tra nội dung và hình trước khi sử dụng làm học liệu.

## Cấu trúc

| Thư mục                       | Nội dung                                                     |
| ----------------------------- | ------------------------------------------------------------ |
| `app`, `components`           | Giao diện và thành phần React                                |
| `lib`                         | Dữ liệu bài học, hình học, trạng thái học tập                |
| `server`, `netlify/functions` | Xử lý API và các điểm vào Netlify                            |
| `public`                      | Tài nguyên tĩnh, hướng dẫn và bộ tích hợp TikZ               |
| `scripts`                     | Chuẩn bị tài nguyên, chạy cục bộ, kiểm tra                   |
| `tests`                       | Kiểm thử tự động và dữ liệu kiểm thử tổng hợp cần để tái lập |
| `docs`                        | Ghi chú bảo trì mô-đun                                       |
| `THIRD_PARTY`, `vendor`       | Giấy phép, ghi công và tài nguyên thư viện                   |

Không đóng gói `node_modules`, `dist`, `public/tikz`, các thư mục kết quả `docs/v631-review`, `docs/v640-review`, log, ảnh chụp kiểm thử hoặc dữ liệu phiên người dùng. Giữ dữ liệu mẫu trong `tests/fixtures` để tái lập kiểm thử; giữ giấy phép và ghi công trong `THIRD_PARTY`, `vendor`.
