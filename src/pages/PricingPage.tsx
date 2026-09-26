import React from "react";
import { useNavigate } from "react-router-dom";
import FAQSection from "../components/FAQSection";
import PremiumPlans, { type PricingPlan } from "../components/PremiumPlans";
import SEOHead from "../components/SEOHead";
import { pricingFaqs, pricingGuides, goodQuestionExamples, weakQuestionExamples } from "../utils/appUtils";
import { organizationSchema, faqSchema, breadcrumbSchema, productSchemas } from "../schemas/seoSchemas";

type Props = {
  onNavigateChartForm: () => void;
};

export default function PricingPage({ onNavigateChartForm }: Props) {
  const navigate = useNavigate();

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.price === "0đ") {
      onNavigateChartForm();
      return;
    }
    navigate("/lien-he");
  };

  return (
    <div className="home-page">
      <SEOHead
        title="Bảng Giá Luận Giải Tử Vi 2024 | Hỏi 1 Câu 50K | Tử Vi Phong Lam"
        description="Lập lá số miễn phí, hỏi 1 câu 50.000đ, tư vấn trực tiếp 999.000đ. Luận giải tử vi Bắc Phái chuyên sâu."
        canonicalPath="/bang-gia"
        schema={[
          organizationSchema,
          faqSchema(pricingFaqs),
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Bảng giá", path: "/bang-gia" }]),
          ...productSchemas,
        ]}
      />

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Bảng giá</p>
          <h1>Bảng giá luận giải tử vi</h1>
          <p>
            Bạn có thể lập lá số miễn phí trước, sau đó chọn hỏi 1 câu theo lá số hoặc tư vấn trực tiếp khi cần phân tích sâu hơn.
          </p>
        </div>
      </section>

      <PremiumPlans
        eyebrow="Luận giải & tư vấn"
        title="Bảng giá dịch vụ theo lá số"
        description="Mỗi gói đi theo một mức nhu cầu khác nhau: xem nền, hỏi một vấn đề cụ thể, hoặc trao đổi sâu theo giai đoạn."
        onSelectPlan={handleSelectPlan}
      />

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Chọn đúng gói</p>
          <h2>Chọn theo tình huống hiện tại của bạn</h2>
        </div>
        <div className="seo-copy-grid">
          {pricingGuides.map((guide) => (
            <article key={guide.title} className="seo-copy-card">
              <h3>{guide.title}</h3>
              <p>{guide.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Đặt câu hỏi</p>
          <h2>Một câu hỏi rõ giúp phần luận giải đi đúng trọng tâm</h2>
          <p>Gói 1 câu hiệu quả nhất khi bạn mô tả vấn đề cụ thể, có thời gian hoặc bối cảnh đi kèm.</p>
        </div>
        <div className="seo-copy-grid">
          <article className="seo-copy-card">
            <h3>Câu hỏi nên gửi</h3>
            <ul className="plan-feature-list">
              {goodQuestionExamples.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </article>
          <article className="seo-copy-card">
            <h3>Câu hỏi nên tránh</h3>
            <ul className="plan-feature-list">
              {weakQuestionExamples.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </article>
          <article className="seo-copy-card">
            <h3>Sau khi thanh toán</h3>
            <p>Bạn gửi lá số hoặc brief liên hệ, nêu câu hỏi chính và nhận hướng dẫn theo đúng gói đã chọn. Nếu thiếu giờ sinh, phần phản hồi sẽ nói rõ giới hạn cần đọc dè dặt.</p>
          </article>
        </div>
      </section>

      <FAQSection
        id="pricing-faq"
        eyebrow="FAQ bảng giá"
        title="Những điều người dùng thường hỏi trước khi chọn gói"
        description="Các câu hỏi thực tế về cách nhận luận giải và phạm vi từng dịch vụ."
        faqs={pricingFaqs}
      />
    </div>
  );
}
