# Hướng dẫn nhanh V6.3.0

1. Giải nén ZIP; mở thư mục `AI-TUTOR-TU-GIAC-PRO`.
2. Mở `public/huong-dan-api.html` để đọc hướng dẫn đầy đủ.
3. Muốn dùng OpenAI: tạo khóa ở https://platform.openai.com/api-keys rồi đặt `AI_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-6-luna` trong cấu hình máy chủ/Netlify Functions. Triển khai lại cả mã nguồn và Functions.
4. Trong ứng dụng, học sinh nhập mã lớp (mặc định `HOCGIOITOAN`), không nhập khóa API.
5. Không dùng API: chọn “Xem bài mẫu và hình miễn phí”. Phần này gồm bài mẫu, lý thuyết và những hình bộ dựng cục bộ hỗ trợ; không có hội thoại AI hoặc đọc ảnh tự động miễn phí.
6. Hình đã vẽ được giữ khi trả lời tiếp. Chỉ nhấn “Vẽ lại hình” khi muốn đổi hình; thay bài bằng nút “Bài mới”.

**API OpenAI có tính phí riêng, kể cả khi đã có ChatGPT Plus.** Mặc định tiết kiệm: GPT-6 Luna; cân bằng: GPT-6 Sol; ưu tiên năng lực: GPT-6 Astra. Không có API ChatGPT miễn phí được bảo đảm cho ứng dụng này.

Nếu máy chủ vẫn dùng Gemini, đặt `AI_PROVIDER=gemini` và giữ khóa/mô hình cũ. Xem `README.md` để chạy trên máy và `docs/BAO_CAO_V6_3_0.md` để đọc kết quả kiểm thử.
