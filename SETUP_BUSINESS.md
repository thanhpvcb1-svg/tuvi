# LaSoTuVi - Hướng Dẫn Setup Kinh Doanh

## 🚀 Quick Start

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
```bash
# Copy file mẫu
cp .env.example .env

# Chỉnh sửa .env với thông tin thực
```

### 3. Chạy development
```bash
npm run dev
```

### 4. Build production
```bash
npm run build
```

---

## 📋 Checklist Trước Khi Go-Live

### Bắt buộc
- [ ] Cấu hình thông tin liên hệ trong `.env`
- [ ] Thay `GA_MEASUREMENT_ID` trong `index.html` bằng Google Analytics ID thực
- [ ] Cấu hình `GEMINI_API_KEY` trên Cloudflare Pages
- [ ] Test form liên hệ và các kênh contact

### Khuyến nghị
- [ ] Setup Facebook Pixel
- [ ] Kết nối Google Search Console
- [ ] Test trên mobile
- [ ] Kiểm tra tốc độ load (PageSpeed Insights)

---

## 🔧 Cấu Hình Chi Tiết

### 1. Google Analytics

1. Tạo property mới tại [Google Analytics](https://analytics.google.com)
2. Lấy Measurement ID (dạng `G-XXXXXXXXXX`)
3. Thay thế trong `index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 2. Thông tin liên hệ

Tạo file `.env` với nội dung:
```env
VITE_CONTACT_EMAIL=your-email@domain.com
VITE_CONTACT_SMS_NUMBER=0901234567
VITE_CONTACT_ZALO_URL=https://zalo.me/0901234567
VITE_CONTACT_FACEBOOK_URL=https://fb.com/your-page
```

### 3. Cloudflare Pages (Production)

Vào Dashboard > Settings > Environment Variables, thêm:
- `GEMINI_API_KEY`: API key từ Google AI Studio
- `YOUTUBE_LESSONS_CHANNEL_ID`: (optional) YouTube channel ID

---

## 📊 Tracking Events

Sử dụng `src/lib/analytics.ts` để track events:

```typescript
import { Analytics } from './lib/analytics';

// Khi user tạo lá số
Analytics.chartGenerated({ has_birth_time: true, calendar_type: 'solar' });

// Khi user submit form lead
Analytics.leadFormSubmitted('homepage', 'cong-viec');

// Khi user chọn gói
Analytics.planSelected('Hỏi 1 câu', '50.000đ');
```

---

## 📱 Tính Năng Đã Có

### Core Features
- ✅ Lập lá số tử vi online
- ✅ AI luận giải (Gemini)
- ✅ Export ảnh lá số
- ✅ Copy brief liên hệ

### Sales Features
- ✅ Bảng giá 3 gói
- ✅ Testimonials section
- ✅ Lead capture form
- ✅ Mobile sticky CTA
- ✅ Floating contact buttons
- ✅ Social proof popup
- ✅ FAQ sections

### Legal & Trust
- ✅ Trang Điều khoản sử dụng
- ✅ Trang Chính sách bảo mật
- ✅ Privacy notice

### SEO
- ✅ Schema.org markup
- ✅ Open Graph tags
- ✅ Sitemap
- ✅ Robots.txt

---

## 🔜 Roadmap (Tùy chọn)

### Phase 2 - Thanh toán
- [ ] Tích hợp VNPay/MoMo
- [ ] QR chuyển khoản
- [ ] Trang thanh toán thành công

### Phase 3 - Automation
- [ ] Email marketing (Mailchimp)
- [ ] Auto-email sau khi lập lá số
- [ ] CRM integration

### Phase 4 - Advanced
- [ ] Live chat (Tawk.to)
- [ ] A/B testing
- [ ] Retargeting pixels

---

## 📞 Hỗ Trợ

Nếu cần hỗ trợ kỹ thuật, liên hệ qua các kênh đã cấu hình trong `.env`.
