import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import Breadcrumb from "../components/Breadcrumb";
import { organizationSchema, breadcrumbSchema } from "../schemas/seoSchemas";
import { contactEmail, contactFacebookUrl, contactZaloUrl, hasDirectContactChannel } from "../utils/appUtils";

// Mô tả đúng những gì hệ thống đang làm - không cam kết tuyệt đối, không nêu kênh liên hệ chưa cấu hình.
export default function AboutPage() {
  return (
    <>
      <SEOHead
        title="Về Tử Vi Phong Lam – Lập Lá Số và Luận Giải Tử Vi Bắc Phái"
        description="Tử Vi Phong Lam lập lá số tử vi online và luận giải theo Bắc phái: đối chiếu hơn 20.000 đoạn tri thức có điều kiện, chỉ tổng hợp từ phần khớp với lá số."
        canonicalPath="/ve-chung-toi"
        schema={[
          organizationSchema,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Về chúng tôi", path: "/ve-chung-toi" }]),
        ]}
      />
      <div className="about-page content-page">
        <Breadcrumb items={[
          { label: "Trang chủ", path: "/" },
          { label: "Về chúng tôi" },
        ]} />

        <article className="about-content">
          <h1>Về Tử Vi Phong Lam</h1>

          <section className="about-section">
            <h2>Tử Vi Phong Lam làm gì</h2>
            <p>
              Tử Vi Phong Lam là công cụ lập lá số Tử Vi Đẩu Số online và luận giải theo lối đọc <strong>Bắc phái</strong>.
              Mục tiêu là giúp bạn đọc lá số của chính mình có căn cứ: thấy rõ cung nào, sao nào, Hóa nào dẫn tới một nhận định,
              thay vì nhận một đoạn văn mẫu dùng chung cho mọi người.
            </p>
          </section>

          <section className="about-section">
            <h2>Cách đọc theo Bắc phái</h2>
            <p>Lá số được đọc theo mạch vận động giữa các cung chứ không kết luận từ một sao đứng riêng:</p>
            <ul>
              <li><strong>Mệnh – Thân</strong> và tam phương tứ chính làm khung nền.</li>
              <li><strong>Tứ Hóa sinh niên và Phi Hóa can cung</strong> để thấy cung nào phát lực, cung nào nhận lực.</li>
              <li><strong>Đại vận, tiểu vận</strong> để xem chủ đề nào được kích hoạt theo từng giai đoạn.</li>
            </ul>
            <p>
              Tử Vi là công cụ tham khảo về xu hướng, không phải lời phán định chắc chắn về tương lai.{" "}
              <Link to="/bai-viet/tu-vi-bac-phai-la-gi">Tử Vi Bắc phái là gì?</Link>
            </p>
          </section>

          <section className="about-section">
            <h2>Kho tri thức và cách luận giải</h2>
            <ul>
              <li>Lá số được an ngay trên trình duyệt của bạn; cùng ngày giờ sinh luôn cho cùng một lá số.</li>
              <li>
                Kho hơn <strong>20.000 đoạn tri thức</strong>, mỗi đoạn gắn điều kiện áp dụng (cung, sao, độ sáng, Tứ Hóa…) và chỉ
                hiển thị khi khớp với lá số của bạn, kèm lý do khớp.
              </li>
              <li>Phần tổng hợp được tạo tự động, chỉ từ các đoạn đã khớp, không tự tạo quy tắc và ghi rõ phần chưa đủ dữ liệu - nhưng vẫn có thể sai sót.</li>
            </ul>
            <p>
              Chi tiết và giới hạn hiện tại: <Link to="/bai-viet/phuong-phap-luan-giai">Phương pháp luận giải</Link> ·{" "}
              <Link to="/la-so-mau">Xem một lá số mẫu</Link>
            </p>
          </section>

          <section className="about-section">
            <h2>Điều chúng tôi giữ</h2>
            <ul>
              <li>Lập lá số cơ bản <strong>miễn phí</strong>.</li>
              <li>Không gửi họ tên hay ngày giờ sinh đầy đủ cho dịch vụ tổng hợp luận giải - chỉ gửi bản tóm tắt lá số. <Link to="/chinh-sach-bao-mat">Chính sách bảo mật</Link></li>
              <li>Tính năng nào chưa hoàn thiện được ghi rõ là đang bổ sung.</li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Liên hệ</h2>
            {hasDirectContactChannel ? (
              <ul>
                {contactZaloUrl ? <li><strong>Zalo:</strong> <a href={contactZaloUrl} target="_blank" rel="noreferrer">Nhắn Zalo</a></li> : null}
                {contactFacebookUrl ? <li><strong>Facebook:</strong> <a href={contactFacebookUrl} target="_blank" rel="noreferrer">Trang Facebook</a></li> : null}
                {contactEmail ? <li><strong>Email:</strong> <a href={`mailto:${contactEmail}`}>{contactEmail}</a></li> : null}
              </ul>
            ) : (
              <p>Kênh liên hệ trực tiếp đang được cập nhật. Bạn có thể chuẩn bị thông tin trước tại <Link to="/lien-he">trang Liên hệ</Link>.</p>
            )}
          </section>

          <section className="about-section about-cta">
            <h2>Bắt đầu với lá số của bạn</h2>
            <p>Nhập ngày giờ sinh để xem Mệnh, Thân, 12 cung, Tứ Hóa và đại vận.</p>
            <Link to="/lap-la-so" className="primary-button">
              Lập lá số miễn phí
            </Link>
          </section>
        </article>
      </div>
    </>
  );
}
