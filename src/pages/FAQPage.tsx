import React from "react";
import { Link } from "react-router-dom";
import FAQSection from "../components/FAQSection";
import SEOHead from "../components/SEOHead";
import { faqPageGroups, faqPageItems } from "../utils/appUtils";
import { faqSchema, breadcrumbSchema } from "../schemas/seoSchemas";

export default function FAQPage() {
  return (
    <div className="home-page">
      <SEOHead
        title="Câu Hỏi Thường Gặp Về Lập Lá Số Tử Vi Online | Tử Vi Phong Lam"
        description="Giải đáp thắc mắc về lập lá số tử vi online, giờ sinh, Tứ Hóa, Phi Hóa, cách tổng hợp luận giải và các gói hỏi theo lá số."
        canonicalPath="/faq"
        schema={[
          faqSchema(faqPageItems),
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "FAQ", path: "/faq" }]),
        ]}
      />
      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">FAQ</p>
          <h1>Câu hỏi thường gặp khi lập lá số tử vi</h1>
          <p>
            Tập hợp các thắc mắc phổ biến trước khi tạo lá số hoặc chọn gói hỗ trợ. Chưa có lá số?{" "}
            <Link to="/lap-la-so">Lập lá số miễn phí</Link> hoặc <Link to="/la-so-mau">xem một lá số mẫu</Link>.
          </p>
        </div>
      </section>
      {faqPageGroups.map((group) => (
        <FAQSection key={group.id} id={group.id} faqs={group.faqs} eyebrow={group.eyebrow} title={group.title} description={group.description} />
      ))}
    </div>
  );
}
