import React from "react";

export default function SiteFooter() {
  return (
    <footer className="site-footer" id="lien-he">
      <div className="site-footer-inner">
        <div>
          <strong>LaSoTuVi</strong>
          <p>Trung tâm luận giải tử vi và tư vấn vận mệnh. Phân tích lá số chuyên sâu về tài lộc, sự nghiệp, tình duyên và gia đạo.</p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "14px" }}>
            <a href="#" style={{ color: "#5f6f89", fontSize: "13px", textDecoration: "none" }}>Chính sách bảo mật</a>
            <a href="#" style={{ color: "#5f6f89", fontSize: "13px", textDecoration: "none" }}>Điều khoản sử dụng</a>
            <a href="#" style={{ color: "#5f6f89", fontSize: "13px", textDecoration: "none" }}>Chính sách hoàn tiền</a>
          </div>
        </div>
        <p className="site-disclaimer">
          Nội dung tử vi chỉ mang tính tham khảo, chiêm nghiệm và giải trí. Kết quả không thay thế tư vấn chuyên môn về y tế, tài chính, pháp lý hoặc các quyết định quan trọng trong cuộc sống.
        </p>
      </div>
    </footer>
  );
}
