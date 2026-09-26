import React from "react";

const currentYear = new Date().getFullYear();

const footerLinks = [
  { label: "Lập lá số", href: "/lap-la-so" },
  { label: "Bảng giá", href: "/bang-gia" },
  { label: "Lá số mẫu", href: "/la-so-mau" },
  { label: "Bài viết", href: "/bai-viet" },
  { label: "Video", href: "/video" },
  { label: "FAQ", href: "/faq" },
];

const legalLinks = [
  { label: "Về chúng tôi", href: "/ve-chung-toi" },
  { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
  { label: "Điều khoản sử dụng", href: "/dieu-khoan-su-dung" },
  { label: "Liên hệ", href: "/lien-he" },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer" id="lien-he">
      <div className="site-footer-inner site-footer-inner--enhanced">
        <div className="site-footer__brand">
          <div className="site-footer__logo">
            <span className="site-footer__logo-mark">☆</span>
            <strong>Tử Vi Phong Lam</strong>
          </div>
          <p className="site-footer__tagline">
            Nền tảng lập lá số tử vi online giúp bạn xem phần nền của lá số trước, rồi mới quyết định có cần hỏi sâu hơn.
          </p>
        </div>

        <div className="site-footer__nav">
          <div className="site-footer__nav-group">
            <h4>Khám phá</h4>
            <ul>
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer__nav-group">
            <h4>Thông tin</h4>
            <ul>
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__copyright">
            © {currentYear} Tử Vi Phong Lam. Tất cả quyền được bảo lưu.
          </p>
          <p className="site-footer__disclaimer">
            Nội dung tử vi trên trang mang tính tham khảo và chiêm nghiệm. Kết quả không thay thế tư vấn chuyên môn về y tế,
            tài chính, pháp lý hoặc các quyết định quan trọng trong đời sống.
          </p>
        </div>
      </div>
    </footer>
  );
}
