import React from "react";

const stats = [
  { value: "100.000+", label: "Lá số được lập" },
  { value: "20.000+", label: "Người dùng tin tưởng" },
  { value: "4,9/5", label: "Mức độ hài lòng" },
];

const valueProps = [
  {
    eyebrow: "Luận Giải",
    title: "Luận Giải Chuyên Sâu",
    description:
      "Phân tích các phương diện quan trọng trong lá số để giúp bạn hiểu rõ hơn về bản thân và các giai đoạn cuộc đời.",
  },
  {
    eyebrow: "Tương Hợp",
    title: "Hợp Tuổi & Tình Duyên",
    description:
      "Đánh giá mức độ hòa hợp trong tình cảm, hôn nhân và hợp tác làm ăn.",
  },
  {
    eyebrow: "Báo Cáo",
    title: "Báo Cáo Chuyên Nghiệp",
    description:
      "Báo cáo trình bày đẹp, dễ lưu trữ và thuận tiện tra cứu lâu dài.",
  },
  {
    eyebrow: "Chuyên Gia",
    title: "Tư Vấn Chuyên Gia",
    description:
      "Nhận góc nhìn và định hướng trực tiếp từ chuyên gia khi cần giải đáp sâu hơn.",
  },
];

const commonQuestions = [
  "Bao giờ nên đổi việc hoặc mở rộng kinh doanh?",
  "Khi nào là thời điểm thuận lợi để kết hôn?",
  "Có nên đầu tư hay mở rộng tài chính trong năm nay?",
  "Công việc và hướng phát triển nào phù hợp với mình?",
  "Thời điểm nào sự nghiệp sẽ có bước đột phá?",
];

const retentionCards = [
  {
    title: "Tử Vi Mỗi Ngày",
    copy: "Cập nhật góc nhìn tham khảo về tài lộc, công việc và tình cảm.",
  },
  {
    title: "Báo Cáo Định Kỳ",
    copy: "Theo dõi các giai đoạn quan trọng trong năm để chủ động hơn trong cuộc sống.",
  },
  {
    title: "Hồ Sơ Cá Nhân",
    copy: "Lưu lại các lá số và báo cáo đã thực hiện, tra cứu lại bất cứ lúc nào cần.",
  },
];

export default function HomeShowcase() {
  return (
    <>
      <section className="marketing-section">
        <div className="section-heading" style={{ textAlign: "center" }}>
          <p className="eyebrow">Tin Tưởng</p>
          <h2>Được Nhiều Người Tin Tưởng</h2>
        </div>
        <div className="stats-grid">
          {stats.map((stat) => (
            <article key={stat.label} className="stat-card">
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-section--split">
        <div className="section-heading">
          <p className="eyebrow">Vì Sao Nhiều Người Lựa Chọn</p>
          <h2>Luận Giải Chuyên Sâu Cho Từng Lá Số</h2>
          <p>
            Mỗi lá số đều mang những đặc điểm riêng về vận mệnh, tài lộc, sự nghiệp và tình duyên.
          </p>
          <p>
            Các luận giải được trình bày rõ ràng, dễ hiểu và tập trung vào những vấn đề quan trọng trong cuộc sống.
          </p>
        </div>

        <div className="value-grid">
          {valueProps.map((item) => (
            <article key={item.title} className="pillar-card">
              <p className="eyebrow">{item.eyebrow}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">Tư Vấn Trực Tiếp</p>
          <h2>Những Vấn Đề Thường Được Quan Tâm</h2>
          <p>
            Gửi câu hỏi của bạn và nhận phần luận giải riêng từ chuyên gia dựa trên lá số cá nhân.
          </p>
        </div>

        <div className="ai-questions-card">
          {commonQuestions.map((question) => (
            <div key={question} className="ai-question-chip">
              {question}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <a href="#premium" className="primary-button" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            Đặt Câu Hỏi Cho Chuyên Gia — 99.000đ
          </a>
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">Đồng Hành</p>
          <h2>Đồng Hành Cùng Bạn Trong Từng Giai Đoạn</h2>
        </div>

        <div className="product-card-grid">
          {retentionCards.map((card) => (
            <article key={card.title} className="product-card">
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
