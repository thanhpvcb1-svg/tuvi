import React from "react";

export default function SiteFooter() {
  return (
    <footer className="site-footer" id="lien-he">
      <div className="site-footer-inner">
        <div>
          <strong>LaSoTuVi</strong>
          <p>
            Nền tảng lập lá số tử vi online giúp bạn xem nhanh Mệnh, Thân, 12 cung và chọn thêm các gói luận giải phù hợp
            khi cần đi sâu vào công việc, tài lộc, tình duyên và vận hạn.
          </p>
          <div className="site-footer-links">
            <a href="/lap-la-so">Lập lá số</a>
            <a href="/bang-gia">Bảng giá</a>
            <a href="/la-so-mau">Lá số mẫu</a>
            <a href="/bai-viet">Bài viết</a>
            <a href="#privacy">Chính sách bảo mật</a>
            <a href="/lien-he">Liên hệ</a>
          </div>
        </div>

        <p className="site-disclaimer">
          Nội dung tử vi chỉ mang tính tham khảo, chiêm nghiệm và giải trí. Kết quả không thay thế tư vấn chuyên môn về y tế,
          tài chính, pháp lý hoặc các quyết định quan trọng trong cuộc sống.
        </p>
      </div>
    </footer>
  );
}
