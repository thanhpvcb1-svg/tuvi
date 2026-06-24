import React from "react";

const featureCards = [
  {
    title: "Tổng quan Mệnh - Thân",
    description: "Nhìn nhanh khí chất, thiên hướng cá nhân và những điểm nổi bật trong lá số.",
  },
  {
    title: "Sự nghiệp và Quan Lộc",
    description: "Tập trung vào hướng công việc, nhịp phát triển và giai đoạn cần thận trọng hoặc bứt lên.",
  },
  {
    title: "Tài lộc và dòng tiền",
    description: "Gợi ý cách nhìn về tài chính, khả năng tích lũy và các điểm nên quản trị kỹ hơn.",
  },
  {
    title: "Tình duyên và quan hệ",
    description: "Đọc xu hướng gắn kết, cách đi vào quan hệ và những điều dễ tạo lệch nhịp trong kết nối.",
  },
  {
    title: "Vận hạn theo năm",
    description: "Đặt năm đang xem vào đúng bối cảnh lá số để theo dõi công việc, tài chính và các quyết định lớn.",
  },
];

const processSteps = [
  "Nhập ngày giờ sinh",
  "Tạo lá số cơ bản",
  "Xem tổng quan rồi mới quyết định có cần hỏi sâu hơn",
];

const reasons = [
  "Ưu tiên cách diễn giải dễ đọc cho người mới.",
  "Đi từ lá số thật của bạn thay vì nội dung chung chung.",
  "Tách rõ phần xem miễn phí và phần hỗ trợ trả phí.",
  "Khuyến khích hỏi đúng một vấn đề cụ thể khi cần đọc sâu.",
  "Giữ giọng điệu tham khảo, tránh kết luận quá mức.",
];

export default function HomeShowcase() {
  return (
    <>
      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">Bạn có thể xem gì?</p>
          <h2>Những nhóm nội dung cốt lõi của lá số</h2>
          <p>Công cụ tập trung vào các phần người dùng thường cần đầu tiên khi mới bắt đầu đọc lá số.</p>
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
          <p className="eyebrow">Quy trình</p>
          <h2>Bắt đầu gọn, xem đủ rồi mới đi sâu</h2>
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
          <p className="eyebrow">Cách trang này được thiết kế</p>
          <h2>Ưu tiên rõ dữ liệu, rõ giới hạn và rõ bước tiếp theo</h2>
          <p>
            LaSoTuVi không cố thay thế một buổi tư vấn đầy đủ. Mục tiêu là giúp bạn xem phần nền của lá số trước, hiểu mình
            đang cần đọc gì, rồi mới quyết định có nên hỏi sâu hơn hay không.
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
