# ⚡ LexiLearn – Ứng dụng học từ vựng và luyện câu tiếng Anh

## Tính năng

### 📚 Từ Vựng
- Thêm, sửa, xoá từ vựng (tiếng Anh, nghĩa tiếng Việt, loại từ, câu ví dụ)
- Tìm kiếm từ vựng
- Import/Export file JSON

### ⚡ Luyện Từ
- 4 chế độ: Việt→Anh, Anh→Việt, Loại từ, Hỗn hợp
- Phát âm từ tiếng Anh (Text-to-Speech)
- Theo dõi điểm số, streak, lịch sử luyện tập
- Chọn số câu mỗi phiên

### 💬 Câu
- Thêm câu theo cặp tiếng Anh / tiếng Việt
- Gắn tags và độ khó (Dễ / TB / Khó)
- Import/Export file JSON

### ✍️ Luyện Câu
- Dịch câu Việt→Anh hoặc Anh→Việt
- Lọc theo độ khó
- **Nhận xét ngữ pháp AI** (cần Anthropic API key)

### ⚙️ Cài Đặt
- Lưu Anthropic API key (lưu cục bộ, an toàn)
- Export/Import toàn bộ dữ liệu (backup)
- Xoá dữ liệu

---

## 🚀 Cách deploy

### Option 1: Vercel (Khuyến nghị)
1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → Import repo
3. Nhấn Deploy → Xong!

### Option 2: GitHub Pages
```bash
npm install
npm install --save-dev gh-pages
```

Thêm vào `package.json`:
```json
{
  "homepage": "https://YOUR_USERNAME.github.io/vocab-app",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

Rồi chạy:
```bash
npm run deploy
```

### Option 3: Netlify
1. Push code lên GitHub
2. Vào [netlify.com](https://netlify.com) → New site from Git
3. Build command: `npm run build`, Publish directory: `build`

---

## 💻 Chạy local
```bash
npm install
npm start
```

---

## 📁 Format file JSON

### Từ vựng
```json
{
  "version": "1.0",
  "type": "vocabulary",
  "data": [
    {
      "english": "competition",
      "vietnamese": "cuộc thi, sự cạnh tranh",
      "type": "n",
      "example": "The competition was fierce.",
      "exampleVi": "Cuộc thi diễn ra rất gay gắt."
    }
  ]
}
```

### Câu
```json
{
  "version": "1.0",
  "type": "sentences",
  "data": [
    {
      "english": "I have been studying English for 3 years.",
      "vietnamese": "Tôi đã học tiếng Anh được 3 năm.",
      "difficulty": "medium",
      "tags": ["thì hoàn thành tiếp diễn"]
    }
  ]
}
```

---

## 🤖 API Key
Lấy API key miễn phí tại [console.anthropic.com](https://console.anthropic.com).
Key được lưu trong `localStorage` của trình duyệt, không gửi đi đâu ngoài Anthropic API.
