import React from "react";

type Plan = {
  name: string;
  price: string;
  badge: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
  examples?: string[];
};

const plans: Plan[] = [
  {
    name: "Lá số cơ bản",
    price: "0đ",
    badge: "Miễn phí",
    description: "Xem nhanh lá số và thông tin tổng quan.",
    features: ["Mệnh và Thân", "12 cung cơ bản", "Tổng quan vận mệnh", "Thông tin sơ bộ"],
    cta: "Xem miễn phí",
  },
  {
    name: "Luận Giải 1 Câu Hỏi Từ Thầy",
    price: "99.000đ",
    badge: "ĐƯỢC LỰA CHỌN NHIỀU NHẤT",
    description: "Gửi 1 câu hỏi bất kỳ về công việc, tài lộc, tình duyên, hôn nhân hoặc vận hạn và nhận phần luận giải riêng từ thầy.",
    features: [
      "01 câu hỏi cá nhân",
      "Trả lời trực tiếp từ thầy",
      "Luận giải theo lá số cá nhân",
      "Nội dung chi tiết, dễ hiểu",
      "Phù hợp cho vấn đề đang cần quyết định",
    ],
    examples: ["Bao giờ nên đổi việc?", "Năm nay có nên đầu tư?", "Khi nào kết hôn?", "Tình duyên sắp tới thế nào?"],
    cta: "Gửi câu hỏi ngay",
    featured: true,
  },
  {
    name: "Luận giải chuyên sâu",
    price: "199.000đ",
    badge: "Báo cáo",
    description: "Nhận báo cáo luận giải chi tiết về các phương diện chính trong lá số.",
    features: ["Tài lộc", "Sự nghiệp", "Tình duyên", "Gia đạo", "Vận hạn năm hiện tại", "Báo cáo PDF"],
    cta: "Xem báo cáo",
  },
  {
    name: "Luận giải toàn diện",
    price: "499.000đ",
    badge: "Cao cấp",
    description: "Phân tích đầy đủ các phương diện quan trọng trong cuộc đời.",
    features: [
      "Tài lộc",
      "Sự nghiệp",
      "Hôn nhân",
      "Gia đạo",
      "Sức khỏe",
      "Vận hạn",
      "Các giai đoạn quan trọng",
      "Ưu tiên hỗ trợ",
    ],
    cta: "Chọn gói toàn diện",
  },
  {
    name: "Tư vấn trực tiếp 1:1",
    price: "999.000đ",
    badge: "Chuyên gia",
    description: "Tư vấn riêng cùng thầy để phân tích sâu và giải đáp trực tiếp.",
    features: [
      "Tư vấn 1:1",
      "Phân tích toàn bộ lá số",
      "Định hướng sự nghiệp",
      "Định hướng tài chính",
      "Định hướng hôn nhân",
      "Giải đáp trực tiếp",
      "Thời lượng 60 phút",
    ],
    cta: "Đặt lịch tư vấn",
  },
];

export default function PremiumPlans() {
  return (
    <section className="content-section" id="premium">
      <div className="section-heading">
        <p className="eyebrow">Dịch vụ cao cấp</p>
        <h2>Luận Giải & Tư Vấn</h2>
        <p>Chọn dịch vụ phù hợp để nhận luận giải cá nhân hóa từ lá số của bạn.</p>
      </div>

      <div className="plan-grid">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`plan-card${plan.featured ? " plan-card--featured plan-card--mobile-first" : ""}`}
          >
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

              {plan.examples?.length ? (
                <div className="plan-examples">
                  <p>Ví dụ câu hỏi</p>
                  <ul className="plan-example-list">
                    {plan.examples.map((example) => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <button type="button" className={plan.featured ? "primary-button plan-button" : "ghost-button plan-button"}>
              {plan.cta}
            </button>
          </article>
        ))}
      </div>

      <div className="pricing-funnel-note">
        <p>
          Gói 99.000đ là lựa chọn khởi đầu phù hợp để hỏi đúng vấn đề đang cần quyết định, sau đó có thể nâng cấp lên báo cáo
          chuyên sâu, gói toàn diện hoặc tư vấn trực tiếp 1:1 nếu cần phân tích sâu hơn.
        </p>
      </div>
    </section>
  );
}
