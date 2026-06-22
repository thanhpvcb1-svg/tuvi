import React from "react";

const featureCards = [
  {
    title: "Tổng quan Mệnh - Thân",
    description: "Nhìn nhanh khí chất, thiên hướng cá nhân và những điểm nổi bật trong lá số.",
  },
  {
    title: "Sự nghiệp và Quan Lộc",
    description: "Tập trung vào con đường công việc, cơ hội phát triển và giai đoạn cần bứt phá.",
  },
  {
    title: "Tài lộc và dòng tiền",
    description: "Xem xu hướng tài chính, khả năng tích lũy và những điểm cần thận trọng.",
  },
  {
    title: "Tình duyên và hôn nhân",
    description: "Đọc xu hướng gắn kết, cách xây dựng mối quan hệ và thời điểm thuận lợi.",
  },
  {
    title: "Vận hạn theo năm",
    description: "Theo dõi năm đang xem để chủ động hơn với công việc, tài chính và các quyết định lớn.",
  },
];

const processSteps = [
  "Nhập ngày giờ sinh",
  "Nhận lá số miễn phí",
  "Hỏi thêm hoặc mở khóa luận giải sâu",
];

const reasons = [
  "Luận giải dễ hiểu cho người mới.",
  "Cá nhân hóa theo lá số riêng của bạn.",
  "Không dùng nội dung chung chung.",
  "Có thể hỏi đúng vấn đề đang quan tâm.",
  "Có lựa chọn tư vấn trực tiếp với thầy.",
];

export default function HomeShowcase() {
  return (
    <>
      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">LaSoTuVi giúp bạn xem gì?</p>
          <h2>Những góc nhìn quan trọng từ lá số của bạn</h2>
          <p>Công cụ tập trung vào các nhóm nội dung người dùng quan tâm nhiều nhất khi bắt đầu xem lá số.</p>
        </div>

        <div className="feature-overview-grid">
          {featureCards.map((card) => (
            <article key={card.title} className="feature-card feature-card--landing">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">Quy trình 3 bước</p>
          <h2>Bắt đầu nhanh, rõ ràng và dễ theo dõi</h2>
        </div>

        <div className="process-grid">
          {processSteps.map((step, index) => (
            <article key={step} className="process-card">
              <span>{`0${index + 1}`}</span>
              <h3>{step}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-section--split">
        <div className="section-heading">
          <p className="eyebrow">Vì sao nên dùng LaSoTuVi?</p>
          <h2>Thiết kế để dễ dùng, dễ hiểu và đủ tin cậy để quay lại</h2>
          <p>
            LaSoTuVi hướng tới trải nghiệm gọn gàng, dễ đọc và tập trung vào điều người dùng thật sự cần: hiểu lá số của
            mình và biết khi nào nên hỏi sâu hơn.
          </p>
        </div>

        <div className="value-grid">
          {reasons.map((reason) => (
            <article key={reason} className="pillar-card">
              <p>{reason}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
