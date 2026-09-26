import React from "react";
import { useNavigate } from "react-router-dom";
import FAQSection from "../components/FAQSection";
import HomeShowcase from "../components/HomeShowcase";
import LeadCaptureForm from "../components/LeadCaptureForm";
import PremiumPlans, { type PricingPlan } from "../components/PremiumPlans";
import PrivacyNotice from "../components/PrivacyNotice";
import SEOHead from "../components/SEOHead";
import StatsCounter from "../components/StatsCounter";
import Testimonials from "../components/Testimonials";
import TrustBadges from "../components/TrustBadges";
import { homeFaqs } from "../utils/appUtils";
import { websiteSchema, organizationSchema, faqSchema } from "../schemas/seoSchemas";

type Props = {
  onNavigateChartForm: () => void;
  onNavigateSection: (section: string) => void;
};

export default function HomePage({ onNavigateChartForm, onNavigateSection }: Props) {
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
        title="Lập Lá Số Tử Vi Online Miễn Phí - Xem Mệnh Thân 12 Cung | TuViPhongLam"
        description="Lập lá số tử vi miễn phí theo ngày giờ sinh. Xem Mệnh, Thân, 12 cung, đại vận, tiểu vận. Luận giải Bắc Phái từ 50.000đ."
        canonicalPath="/"
        schema={[websiteSchema, organizationSchema, faqSchema(homeFaqs)]}
      />
      
      <section className="home-hero home-hero--focused">
        <div className="home-hero-copy">
          <p className="eyebrow">☆ LaSoTuVi</p>
          <h1>Lập lá số tử vi online theo ngày giờ sinh</h1>
          <p>
            Tạo lá số miễn phí, xem nhanh Mệnh, Thân, 12 cung, đại vận, tiểu vận và biết nên đọc tiếp phần nào theo câu hỏi của bạn.
          </p>
          <div className="home-hero-actions">
            <button type="button" className="primary-button" onClick={onNavigateChartForm}>
              <span className="btn-icon">✨</span> Lập lá số miễn phí
            </button>
            <button type="button" className="ghost-button" onClick={() => onNavigateSection("la-so-mau")}>
              <span className="btn-icon">🔍</span> Xem lá số mẫu
            </button>
          </div>
          <TrustBadges />
        </div>
      </section>

      <HomeShowcase />
      
      <StatsCounter />
      
      <PremiumPlans
        eyebrow="Luận giải theo nhu cầu"
        title="Bắt đầu miễn phí, sau đó chọn đúng mức hỗ trợ bạn cần"
        description="Bạn có thể xem phần nền trước, rồi chỉ chọn hỏi sâu khi đã có một vấn đề đủ rõ để đối chiếu với lá số."
        compact
        onSelectPlan={handleSelectPlan}
      />
      
      <FAQSection
        faqs={homeFaqs}
        eyebrow="FAQ"
        title="Giải đáp nhanh trước khi bạn bắt đầu"
        description="Những câu hỏi phổ biến nhất khi lập lá số hoặc chọn gói luận giải."
      />
      
      <Testimonials />
      
      <section className="content-section">
        <LeadCaptureForm
          eyebrow="Đăng ký tư vấn"
          title="Nhận hỗ trợ từ chuyên gia"
          description="Để lại thông tin, chúng tôi sẽ liên hệ tư vấn gói phù hợp với nhu cầu của bạn."
        />
      </section>
      
      <PrivacyNotice />
    </div>
  );
}
