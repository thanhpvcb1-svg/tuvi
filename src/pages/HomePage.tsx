import React from "react";
import { Link, useNavigate } from "react-router-dom";
import FAQSection from "../components/FAQSection";
import LeadCaptureForm, { isLeadCaptureConfigured } from "../components/LeadCaptureForm";
import PremiumPlans, { type PricingPlan } from "../components/PremiumPlans";
import PrivacyNotice from "../components/PrivacyNotice";
import SEOHead from "../components/SEOHead";
import TrustBadges from "../components/TrustBadges";
import homeContent from "../content/homeContent.json";
import { knowledgeArticles, getKnowledgeArticleHref } from "../content/bacPhaiLibrary";
import { homeFaqs } from "../utils/appUtils";
import { websiteSchema, organizationSchema, faqSchema } from "../schemas/seoSchemas";

/**
 * Trang chủ - nội dung dùng chung với HTML prerender (src/content/homeContent.json,
 * scripts/prerender-pages.mjs) để crawler đọc được khi chưa chạy JS.
 * Không hiển thị số liệu/đánh giá không có nguồn đo thật.
 */

type Props = {
  onNavigateChartForm: () => void;
  onNavigateSection: (section: string) => void;
};

const c = homeContent;

export default function HomePage({ onNavigateChartForm }: Props) {
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
        title="Tử Vi Phong Lam – Luận Giải Tử Vi Bắc Phái Theo Lá Số Của Bạn"
        description="Lập lá số tử vi online miễn phí, xem Mệnh, Thân, 12 cung, Tứ Hóa, Phi Hóa, đại vận. Luận giải theo Tử Vi Bắc phái, đối chiếu kho tri thức có điều kiện."
        canonicalPath="/"
        schema={[websiteSchema, organizationSchema, faqSchema(homeFaqs)]}
      />

      <section className="home-hero home-hero--focused">
        <div className="home-hero-copy">
          <p className="eyebrow">{c.hero.eyebrow}</p>
          <h1>{c.hero.title}</h1>
          <p>{c.hero.subtitle}</p>
          <div className="home-hero-actions">
            <button type="button" className="primary-button" onClick={onNavigateChartForm}>
              Lập lá số miễn phí
            </button>
            <Link to="/la-so-mau" className="ghost-button">
              Xem lá số mẫu
            </Link>
          </div>
          <TrustBadges />
        </div>
      </section>

      <section className="content-section" aria-labelledby="home-difference">
        <div className="section-heading">
          <h2 id="home-difference">{c.difference.heading}</h2>
          <p>{c.difference.intro}</p>
        </div>
        <div className="seo-copy-grid seo-copy-grid--compact">
          {c.difference.items.map((item) => (
            <article key={item.title} className="seo-copy-card seo-copy-card--compact">
              <h3>
                {item.title}
                {item.status === "partial" ? <span className="support-chip">Đang bổ sung</span> : null}
              </h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section bac-phai-ai-section" aria-labelledby="home-ai">
        <div className="section-heading">
          <h2 id="home-ai">{c.aiFlow.heading}</h2>
          <p>{c.aiFlow.intro}</p>
        </div>
        <ol className="bac-phai-ai-flow" aria-label="Quy trình luận giải">
          {c.aiFlow.steps.map((step, index) => (
            <li key={step} className="bac-phai-ai-flow__item">
              <span className={`bac-phai-ai-flow__step${index === c.aiFlow.steps.length - 1 ? " bac-phai-ai-flow__step--highlight" : ""}`}>{step}</span>
              {index < c.aiFlow.steps.length - 1 ? <span className="bac-phai-ai-flow__arrow" aria-hidden="true">↓</span> : null}
            </li>
          ))}
        </ol>
        <p className="bac-phai-ai-note">{c.aiFlow.note}</p>
        <p>
          <Link to={c.aiFlow.link.path}>{c.aiFlow.link.title}</Link>
        </p>
      </section>

      <section className="content-section" aria-labelledby="home-chart-contents">
        <div className="section-heading">
          <h2 id="home-chart-contents">{c.chartContents.heading}</h2>
          <p>{c.chartContents.intro}</p>
        </div>
        <div className="feature-overview-grid feature-overview-grid--six">
          {c.chartContents.items.map((item) => (
            <article key={item.title} className="feature-card feature-card--landing">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <div className="home-hero-actions">
          <button type="button" className="primary-button" onClick={onNavigateChartForm}>
            Lập lá số của tôi
          </button>
        </div>
      </section>

      <section className="content-section" aria-labelledby="home-sample">
        <div className="placeholder-card">
          <h2 id="home-sample">{c.sample.heading}</h2>
          <p>{c.sample.text}</p>
          <div className="home-hero-actions">
            <Link to="/la-so-mau" className="primary-button">
              {c.sample.cta}
            </Link>
          </div>
        </div>
      </section>

      <section className="content-section" aria-labelledby="home-knowledge">
        <div className="section-heading">
          <h2 id="home-knowledge">{c.knowledge.heading}</h2>
          <p>{c.knowledge.intro}</p>
        </div>
        <ul className="knowledge-hub-list">
          {knowledgeArticles.map((article) => (
            <li key={article.slug}>
              <Link to={getKnowledgeArticleHref(article.slug)}>{article.title}</Link>
            </li>
          ))}
        </ul>
      </section>

      <PremiumPlans
        eyebrow="Luận giải theo nhu cầu"
        title="Bắt đầu miễn phí, sau đó chọn đúng mức hỗ trợ bạn cần"
        description="Bạn có thể xem phần nền trước, rồi chỉ chọn hỏi sâu khi đã có một vấn đề đủ rõ để đối chiếu với lá số."
        compact
        onSelectPlan={handleSelectPlan}
      />

      <FAQSection
        faqs={homeFaqs}
        eyebrow="Hỏi đáp"
        title={c.faqHeading}
        description="Những câu hỏi phổ biến khi lập lá số hoặc chọn gói luận giải."
      />

      {isLeadCaptureConfigured ? (
        <section className="content-section">
          <LeadCaptureForm
            eyebrow="Đăng ký tư vấn"
            title="Nhận hỗ trợ từ chuyên gia"
            description="Để lại thông tin, chúng tôi sẽ liên hệ tư vấn gói phù hợp với nhu cầu của bạn."
          />
        </section>
      ) : null}

      <PrivacyNotice />
    </div>
  );
}
