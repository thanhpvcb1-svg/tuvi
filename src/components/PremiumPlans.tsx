import React from "react";
import { hasDirectContactChannel } from "../utils/appUtils";

export type PricingPlan = {
  name: string;
  price: string;
  badge: string;
  description: string;
  features: string[];
  cta: string;
  /** Trang đích của CTA (link thật để crawl được; onSelectPlan vẫn xử lý điều hướng trong app) */
  href: string;
  featured?: boolean;
};

export const primaryPlans: PricingPlan[] = [
  {
    name: "Lập lá số cơ bản",
    price: "0đ",
    badge: "Miễn phí",
    description: "Phù hợp để bắt đầu và xem phần nền của lá số trước khi quyết định có cần đọc sâu hơn hay không.",
    features: [
      "Lập lá số cơ bản",
      "Xem Mệnh, Thân và 12 cung",
      "Có phần diễn giải tổng quan ngắn",
      "Phù hợp để kiểm tra bố cục lá số",
    ],
    cta: "Lập lá số miễn phí",
    href: "/lap-la-so/",
  },
  {
    name: "Hỏi 1 câu theo lá số",
    price: "50.000đ",
    badge: "Hỏi nhanh",
    description: "Dành cho trường hợp bạn đang cần làm rõ một vấn đề cụ thể thay vì đọc toàn bộ lá số cùng lúc.",
    features: [
      "Tập trung vào một câu hỏi chính",
      "Có thể hỏi về công việc, tài lộc, tình cảm hoặc vận năm",
      "Phản hồi đi thẳng vào vấn đề đang quan tâm",
      "Phù hợp khi cần thêm một góc nhìn để ra quyết định",
    ],
    cta: "Chọn gói 1 câu",
    href: "/lien-he/",
    featured: true,
  },
  {
    name: "Tư vấn trực tiếp",
    price: "999.000đ",
    badge: "Chuyên sâu",
    description: "Phù hợp khi bạn muốn trao đổi toàn diện hơn về lá số và cần đi theo từng giai đoạn cụ thể.",
    features: [
      "Đi qua toàn bộ cấu trúc lá số",
      "Trao đổi trực tiếp theo câu hỏi thực tế",
      "Nhìn theo từng giai đoạn vận hành",
      "Phù hợp với nhu cầu định hướng nghiêm túc",
    ],
    cta: "Đặt lịch tư vấn",
    href: "/lien-he/",
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
  title = "Chọn mức hỗ trợ phù hợp với nhu cầu hiện tại",
  description = "Bạn có thể bắt đầu miễn phí, rồi chỉ nâng mức hỗ trợ khi đã biết mình cần hỏi sâu ở đâu.",
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
                  <li key={feature}>
                    <span aria-hidden="true">✓ </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={plan.href}
              className={plan.featured ? "primary-button plan-button" : "ghost-button plan-button"}
              onClick={(event) => {
                if (!onSelectPlan) return;
                event.preventDefault();
                onSelectPlan(plan);
              }}
            >
              {plan.price !== "0đ" && !hasDirectContactChannel ? "Chuẩn bị câu hỏi" : plan.cta}
            </a>
            {plan.price !== "0đ" && !hasDirectContactChannel ? (
              <p className="plan-note">Kênh đặt gói đang được cập nhật - bạn có thể chuẩn bị câu hỏi trước.</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
