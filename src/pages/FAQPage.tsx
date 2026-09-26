import React from "react";
import FAQSection from "../components/FAQSection";
import SEOHead from "../components/SEOHead";
import { homeFaqs } from "../utils/appUtils";
import { faqSchema, breadcrumbSchema } from "../schemas/seoSchemas";

export default function FAQPage() {
  return (
    <div className="home-page">
      <SEOHead
        title="Câu Hỏi Thường Gặp Về Lập Lá Số Tử Vi Online | TuViPhongLam"
        description="Giải đáp thắc mắc về lập lá số tử vi online, giờ sinh, chọn gói luận giải tử vi Bắc Phái chuẩn xác."
        canonicalPath="/faq"
        schema={[
          faqSchema(homeFaqs),
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "FAQ", path: "/faq" }]),
        ]}
      />
      <FAQSection
        faqs={homeFaqs}
        eyebrow="FAQ"
        title="Câu hỏi thường gặp khi lập lá số"
        description="Tập hợp các thắc mắc phổ biến nhất trước khi tạo lá số hoặc chọn gói hỗ trợ."
      />
    </div>
  );
}
