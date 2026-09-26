import React from "react";
import { useNavigate } from "react-router-dom";
import FAQSection from "../components/FAQSection";
import SEOHead from "../components/SEOHead";
import { compatFaqs, compatibilityBriefItems } from "../utils/appUtils";
import { organizationSchema, compatibilityGuideSchema, faqSchema, breadcrumbSchema } from "../schemas/seoSchemas";

type Props = {
  onNavigateChartForm: () => void;
};

export default function CompatPage({ onNavigateChartForm }: Props) {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <SEOHead
        title="Xem Hợp Tuổi Vợ Chồng Theo Lá Số Tử Vi | Tử Vi Phong Lam"
        description="So khớp hợp tuổi tình cảm, hôn nhân, hợp tác theo lá số tử vi. Đối chiếu Mệnh, Thân, cung Phu Thê chính xác."
        canonicalPath="/hop-tuoi"
        schema={[
          organizationSchema,
          compatibilityGuideSchema,
          faqSchema(compatFaqs),
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Hợp tuổi", path: "/hop-tuoi" }]),
        ]}
      />

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Hợp tuổi</p>
          <h1>So khớp quan hệ theo lá số</h1>
          <p>Chuẩn bị dữ liệu cho hai người và xác định câu hỏi chính trước khi đối chiếu: tình cảm, hôn nhân, hợp tác, tài chính hay nhịp sống.</p>
        </div>

        <div className="seo-copy-grid">
          <article className="seo-copy-card">
            <h3>Dữ liệu nên có trước</h3>
            <p>Nên có ngày sinh, giờ sinh và năm muốn xem của từng người. Nếu thiếu giờ sinh, bạn vẫn có thể bắt đầu ở mức tổng quan nhưng phần đối chiếu chi tiết sẽ bị giới hạn.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Nên dùng cho câu hỏi nào?</h3>
            <p>Phù hợp khi bạn muốn xem mức độ hòa hợp trong giao tiếp, nhịp sống, công việc, tài chính hoặc định hướng mối quan hệ dựa trên dữ liệu lá số thay vì chỉ xem tuổi nhanh.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Nên đọc theo hướng nào?</h3>
            <p>Đọc hợp tuổi như một bản đối chiếu xu hướng và điểm cần trao đổi, không nên dùng như một kết luận tuyệt đối về việc nên hay không nên gắn bó.</p>
          </article>
        </div>

        <div className="contact-brief-card">
          <div className="contact-brief-head">
            <div>
              <p className="eyebrow">Brief hợp tuổi</p>
              <h2>Thông tin nên chuẩn bị trước khi so khớp</h2>
              <p className="result-note">Một brief rõ giúp phần đối chiếu bám đúng mối quan hệ thật, thay vì chỉ dừng ở tuổi năm sinh.</p>
            </div>
          </div>
          <div className="seo-copy-card">
            <ul className="plan-feature-list">
              {compatibilityBriefItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="placeholder-card">
          <h2>Bạn có thể chuẩn bị dữ liệu từ bây giờ</h2>
          <p>Lập lá số của mình trước, sau đó ghi rõ trường hợp muốn đối chiếu hoặc copy brief liên hệ. Cách này giúp việc so khớp sau đó đi nhanh hơn và ít mơ hồ hơn.</p>
          <div className="home-hero-actions">
            <button type="button" className="primary-button" onClick={onNavigateChartForm}>Lập lá số miễn phí</button>
            <button type="button" className="ghost-button" onClick={() => navigate("/lien-he")}>Chuẩn bị brief liên hệ</button>
          </div>
        </div>

        <FAQSection
          faqs={compatFaqs}
          eyebrow="FAQ hợp tuổi"
          title="Câu hỏi thường gặp về hợp tuổi theo lá số"
          description="Những điều nên biết trước khi dùng công cụ so khớp khi tính năng được mở đầy đủ."
        />
      </section>
    </div>
  );
}
