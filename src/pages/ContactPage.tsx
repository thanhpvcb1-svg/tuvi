import React from "react";
import { useNavigate } from "react-router-dom";
import FAQSection from "../components/FAQSection";
import SEOHead from "../components/SEOHead";
import { useAppContext } from "../context/AppContext";
import { 
  contactFaqs, 
  contactZaloUrl, 
  contactFacebookUrl, 
  contactEmail, 
  contactSmsNumber,
  buildConsultationBrief,
  buildCopyableChartJson,
  getRuntimeProfile,
} from "../utils/appUtils";
import { organizationSchema, contactPageSchema, faqSchema, breadcrumbSchema, pricingServiceSchemas } from "../schemas/seoSchemas";

type Props = {
  onNavigateChartForm: () => void;
};

export default function ContactPage({ onNavigateChartForm }: Props) {
  const navigate = useNavigate();
  const { chart, submittedInput, luuOptions, horoscopeYear, showToast, setShareMessage } = useAppContext();

  const handleCopyConsultationBrief = async () => {
    if (!chart || !submittedInput) return;
    try {
      await navigator.clipboard.writeText(buildConsultationBrief(chart, submittedInput, horoscopeYear));
      showToast("Đã copy brief liên hệ");
    } catch (error) {
      console.error(error);
      setShareMessage("Không thể sao chép brief liên hệ trên trình duyệt hiện tại.");
    }
  };

  const handleCopyChartJson = async () => {
    if (!chart || !submittedInput) return;
    try {
      const payload = buildCopyableChartJson(chart, submittedInput, luuOptions);
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      showToast("Copy thành công");
    } catch (error) {
      console.error(error);
      setShareMessage("Không thể sao chép JSON lá số trên trình duyệt hiện tại.");
    }
  };

  return (
    <div className="home-page">
      <SEOHead
        title="Liên Hệ Tư Vấn Luận Giải Tử Vi | TuViPhongLam"
        description="Liên hệ đặt lịch tư vấn tử vi trực tiếp, hỏi 1 câu theo lá số hoặc nhận hướng dẫn chọn gói phù hợp."
        canonicalPath="/lien-he"
        schema={[
          organizationSchema,
          contactPageSchema,
          faqSchema(contactFaqs),
          ...pricingServiceSchemas,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Liên hệ", path: "/lien-he" }]),
        ]}
      />

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Liên hệ</p>
          <h1>Nhận hướng dẫn chọn gói và gửi câu hỏi theo lá số</h1>
          <p>Trang này dành cho người đã có lá số và muốn được hướng dẫn bước tiếp theo: hỏi 1 câu, đặt lịch tư vấn hoặc chuẩn bị thông tin trước khi trao đổi.</p>
        </div>

        <div className="seo-copy-grid">
          <article className="seo-copy-card">
            <h3>Khi nào nên liên hệ?</h3>
            <p>Khi bạn đã xem lá số cơ bản nhưng cần hỏi sâu hơn về công việc, tài lộc, tình duyên hoặc vận hạn của năm đang xem.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Nên chuẩn bị gì?</h3>
            <p>Chuẩn bị ngày giờ sinh, năm muốn xem và câu hỏi chính bạn đang quan tâm. Càng cụ thể, phần phản hồi sau đó càng dễ đi đúng trọng tâm.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Bắt đầu nhanh</h3>
            <p>Nếu chưa có lá số, hãy lập lá số miễn phí trước. Nếu đã có lá số, bạn có thể đi thẳng sang bảng giá để chọn mức hỗ trợ phù hợp.</p>
          </article>
        </div>

        <div className="contact-brief-card">
          <div className="contact-brief-head">
            <div>
              <p className="eyebrow">Mẫu nội dung</p>
              <h2>Gửi đủ thông tin để được hỗ trợ nhanh hơn</h2>
              <p className="result-note">Bạn có thể dùng cấu trúc này khi nhắn Zalo, Facebook hoặc email.</p>
            </div>
          </div>
          <div className="seo-copy-card">
            <p>
              Họ tên hoặc biệt danh: ...<br />
              Ngày giờ sinh: ...<br />
              Giới tính: ...<br />
              Năm muốn xem: ...<br />
              Câu hỏi chính: ...<br />
              Bối cảnh ngắn: ...
            </p>
          </div>
        </div>

        {chart && submittedInput ? (
          <div className="contact-brief-card">
            <div className="contact-brief-head">
              <div>
                <p className="eyebrow">Đã có lá số</p>
                <h2>Brief liên hệ của bạn đã sẵn sàng</h2>
                <p className="result-note">Hệ thống có thể gom các thông tin nền quan trọng của lá số hiện tại để bạn gửi nhanh qua Zalo, Facebook hoặc email.</p>
              </div>
              <div className="premium-upsell-actions">
                <button type="button" className="primary-button" onClick={handleCopyConsultationBrief}>Copy brief liên hệ</button>
                <button type="button" className="ghost-button" onClick={handleCopyChartJson}>Copy JSON lá số</button>
              </div>
            </div>
            <div className="contact-brief-grid">
              <div className="seo-copy-card">
                <h3>Thông tin hiện tại</h3>
                <div className="inline-pills">
                  <span className="inline-pill">{getRuntimeProfile(chart).fullName || submittedInput.fullName}</span>
                  <span className="inline-pill">{getRuntimeProfile(chart).gender || (submittedInput.gender === "male" ? "Nam" : "Nữ")}</span>
                  <span className="inline-pill">Năm xem {horoscopeYear}</span>
                  <span className="inline-pill">Thân cư {getRuntimeProfile(chart).bodyPalace || "đang cập nhật"}</span>
                </div>
              </div>
              <div className="seo-copy-card">
                <h3>Gợi ý nội dung nên gửi</h3>
                <p>Nêu rõ một vấn đề chính, ví dụ đổi việc, mở rộng kinh doanh, quản lý tài chính, mối quan hệ hoặc vận hạn năm đang xem. Một câu hỏi rõ thường cho phản hồi tốt hơn một yêu cầu quá rộng.</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="seo-copy-grid contact-channel-grid">
          <article className="seo-copy-card contact-channel-card">
            <h3>Xem bảng giá trước</h3>
            <p>Phù hợp nếu bạn muốn so sánh nhanh các mức hỗ trợ trước khi gửi câu hỏi.</p>
            <button type="button" className="ghost-button" onClick={() => navigate("/bang-gia")}>Mở bảng giá</button>
          </article>
          <article className="seo-copy-card contact-channel-card">
            <h3>Nhắn Zalo</h3>
            <p>Kênh nhanh để gửi brief đã copy và nhận hướng dẫn bước tiếp theo.</p>
            <a className="ghost-button contact-channel-link" href={contactZaloUrl} target="_blank" rel="noreferrer">Mở Zalo</a>
          </article>
          <article className="seo-copy-card contact-channel-card">
            <h3>Nhắn Facebook</h3>
            <p>Phù hợp nếu bạn đã quen trao đổi qua fanpage hoặc Messenger.</p>
            <a className="ghost-button contact-channel-link" href={contactFacebookUrl} target="_blank" rel="noreferrer">Mở Facebook</a>
          </article>
          {contactEmail ? (
            <article className="seo-copy-card contact-channel-card">
              <h3>Gửi email</h3>
              <p>Dùng khi bạn muốn mô tả kỹ bối cảnh và lưu lại toàn bộ trao đổi bằng văn bản.</p>
              <a className="ghost-button contact-channel-link" href={`mailto:${contactEmail}`}>Gửi email</a>
            </article>
          ) : null}
          {contactSmsNumber ? (
            <article className="seo-copy-card contact-channel-card">
              <h3>Nhắn SMS</h3>
              <p>Tuỳ chọn tối giản để gửi lời nhắn ngắn hoặc xin hướng dẫn kênh trao đổi phù hợp hơn.</p>
              <a className="ghost-button contact-channel-link" href={`sms:${contactSmsNumber}`}>Mở SMS</a>
            </article>
          ) : null}
        </div>

        <div className="placeholder-card">
          <h2>Bạn muốn đi theo hướng nào?</h2>
          <p>Chọn bước phù hợp với tình huống hiện tại để tiếp tục hành trình một cách rõ ràng hơn.</p>
          <div className="home-hero-actions">
            <button type="button" className="primary-button" onClick={() => navigate("/bang-gia")}>Xem bảng giá</button>
            <button type="button" className="ghost-button" onClick={onNavigateChartForm}>Lập lá số miễn phí</button>
          </div>
        </div>

        <FAQSection
          faqs={contactFaqs}
          eyebrow="FAQ liên hệ"
          title="Cách liên hệ để nhận hỗ trợ nhanh hơn"
          description="Các câu hỏi phổ biến khi gửi lá số và chọn hình thức tư vấn."
        />
      </section>
    </div>
  );
}
