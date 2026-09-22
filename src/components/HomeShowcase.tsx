import React from "react";

const featureCards = [
  {
    icon: "👤",
    title: "Tổng quan Mệnh - Thân",
    description: "Nhìn nhanh khí chất, thiên hướng cá nhân và những điểm nổi bật trong lá số.",
    color: "#e74c3c",
  },
  {
    icon: "💼",
    title: "Sự nghiệp và Quan Lộc",
    description: "Tập trung vào hướng công việc, nhịp phát triển và giai đoạn cần thận trọng hoặc bứt lên.",
    color: "#3498db",
  },
  {
    icon: "💰",
    title: "Tài lộc và dòng tiền",
    description: "Gợi ý cách nhìn về tài chính, khả năng tích lũy và các điểm nên quản trị kỹ hơn.",
    color: "#f39c12",
  },
  {
    icon: "💑",
    title: "Tình duyên và quan hệ",
    description: "Đọc xu hướng gắn kết, cách đi vào quan hệ và những điều dễ tạo lệch nhịp trong kết nối.",
    color: "#e91e63",
  },
  {
    icon: "📅",
    title: "Vận hạn theo năm",
    description: "Đặt năm đang xem vào đúng bối cảnh lá số để theo dõi công việc, tài chính và các quyết định lớn.",
    color: "#9b59b6",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Nhập ngày giờ sinh",
    description: "Chỉ cần vài thông tin cơ bản",
    icon: "✍️",
  },
  {
    number: "02",
    title: "Tạo lá số cơ bản",
    description: "Hệ thống tự động an sao",
    icon: "✨",
  },
  {
    number: "03",
    title: "Xem tổng quan",
    description: "Rồi quyết định hỏi sâu hơn",
    icon: "🔍",
  },
];

const reasons = [
  {
    icon: "📖",
    text: "Ưu tiên cách diễn giải dễ đọc cho người mới.",
  },
  {
    icon: "🎯",
    text: "Đi từ lá số thật của bạn thay vì nội dung chung chung.",
  },
  {
    icon: "📊",
    text: "Tách rõ phần xem miễn phí và phần hỗ trợ trả phí.",
  },
  {
    icon: "❓",
    text: "Khuyến khích hỏi đúng một vấn đề cụ thể khi cần đọc sâu.",
  },
  {
    icon: "⚖️",
    text: "Giữ giọng điệu tham khảo, tránh kết luận quá mức.",
  },
];

export default function HomeShowcase() {
  return (
    <>
      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">🌟 Bạn có thể xem gì?</p>
          <h2>Những nhóm nội dung cốt lõi của lá số</h2>
          <p>Công cụ tập trung vào các phần người dùng thường cần đầu tiên khi mới bắt đầu đọc lá số.</p>
        </div>

        <div className="feature-overview-grid">
          {featureCards.map((card) => (
            <article key={card.title} className="feature-card feature-card--landing feature-card--with-icon">
              <span className="feature-card__icon" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                {card.icon}
              </span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">📝 Quy trình</p>
          <h2>Bắt đầu gọn, xem đủ rồi mới đi sâu</h2>
        </div>

        <div className="process-grid process-grid--enhanced">
          {processSteps.map((step, index) => (
            <article key={step.title} className="process-card process-card--enhanced">
              <div className="process-card__header">
                <span className="process-card__icon">{step.icon}</span>
                <span className="process-card__number">{step.number}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {index < processSteps.length - 1 && (
                <span className="process-card__arrow" aria-hidden="true">→</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-section--split">
        <div className="section-heading">
          <p className="eyebrow">🏗️ Cách trang này được thiết kế</p>
          <h2>Ưu tiên rõ dữ liệu, rõ giới hạn và rõ bước tiếp theo</h2>
          <p>
            LaSoTuVi không cố thay thế một buổi tư vấn đầy đủ. Mục tiêu là giúp bạn xem phần nền của lá số trước, hiểu mình
            đang cần đọc gì, rồi mới quyết định có nên hỏi sâu hơn hay không.
          </p>
        </div>

        <div className="value-grid value-grid--enhanced">
          {reasons.map((reason) => (
            <article key={reason.text} className="pillar-card pillar-card--enhanced">
              <span className="pillar-card__icon">{reason.icon}</span>
              <p>{reason.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
