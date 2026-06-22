import React from "react";

export type PricingPlan = {
  name: string;
  price: string;
  badge: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

export const primaryPlans: PricingPlan[] = [
  {
    name: "Lập lá số cơ bản",
    price: "0đ",
    badge: "Miễn phí",
    description: "Phù hợp để bắt đầu và xem nhanh các thông tin cốt lõi trong lá số.",
    features: [
      "Lập lá số cơ bản",
      "Xem Mệnh, Thân, 12 cung",
      "Xem tổng quan ngắn",
      "Phù hợp để bắt đầu",
    ],
    cta: "Lập miễn phí",
  },
  {
    name: "Hỏi 1 câu theo lá số",
    price: "50.000đ",
    badge: "Nổi bật nhất",
    description: "Hỏi một vấn đề cụ thể về công việc, tài lộc, tình duyên hoặc vận hạn dựa trên chính lá số của bạn.",
    features: [
      "Hỏi 1 vấn đề cụ thể theo lá số",
      "Có thể hỏi về công việc, tài lộc, tình duyên, vận hạn",
      "Câu trả lời dễ hiểu, đi thẳng vào vấn đề",
      "Phù hợp khi đang phân vân một quyết định",
    ],
    cta: "Hỏi ngay 1 câu",
    featured: true,
  },
  {
    name: "Tư vấn trực tiếp với thầy",
    price: "999.000đ",
    badge: "Chuyên gia",
    description: "Lựa chọn dành cho người cần định hướng nghiêm túc và muốn được phân tích sâu toàn bộ lá số.",
    features: [
      "Luận giải chuyên sâu toàn bộ lá số",
      "Tư vấn trực tiếp với thầy",
      "Phân tích định hướng theo từng giai đoạn",
      "Phù hợp với người cần định hướng nghiêm túc",
    ],
    cta: "Đặt lịch tư vấn",
  },
];

type Props = {
  eyebrow?: string;
  title?: string;
  description?: string;
  compact?: boolean;
  onSelectPlan?: (plan: PricingPlan) => void;
};

export default function PremiumPlans({
  eyebrow = "Bảng giá",
  title = "Chọn dịch vụ phù hợp với nhu cầu hiện tại",
  description = "Bạn có thể bắt đầu miễn phí, sau đó chọn hỏi 1 câu theo lá số hoặc đặt lịch tư vấn trực tiếp khi cần phân tích sâu hơn.",
  compact = false,
  onSelectPlan,
}: Props) {
  return (
    <section className="content-section" id="premium">
      <div className="section-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className={`plan-grid${compact ? " plan-grid--compact" : ""}`}>
        {primaryPlans.map((plan) => (
          <article key={plan.name} className={`plan-card${plan.featured ? " plan-card--featured plan-card--mobile-first" : ""}`}>
            <div className="plan-card-top">
              <span className={`plan-badge${plan.featured ? " plan-badge--featured" : ""}`}>{plan.badge}</span>
              <h3>{plan.name}</h3>
              <strong>{plan.price}</strong>
              <p className="plan-description">{plan.description}</p>
            </div>

            <div className="plan-card-body">
              <ul className="plan-feature-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className={plan.featured ? "primary-button plan-button" : "ghost-button plan-button"}
              onClick={() => onSelectPlan?.(plan)}
            >
              {plan.cta}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
