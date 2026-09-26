import SEOHead from "../components/SEOHead";
import Breadcrumb from "../components/Breadcrumb";
import { organizationSchema, breadcrumbSchema } from "../schemas/seoSchemas";

export default function AboutPage() {
  return (
    <>
      <SEOHead
        title="Về Chúng Tôi - Tử Vi Phong Lam | Nền Tảng Tử Vi Bắc Phái Online"
        description="Tử Vi Phong Lam - Nền tảng lập lá số tử vi online và luận giải theo phương pháp Bắc Phái. Hơn 30,000 luận giải tri thức từ sách cổ."
        canonicalPath="/ve-chung-toi"
        schema={[
          organizationSchema,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Về chúng tôi", path: "/ve-chung-toi" }]),
        ]}
      />
      <main className="about-page content-page">
        <Breadcrumb items={[
          { label: "Trang chủ", path: "/" },
          { label: "Về chúng tôi" },
        ]} />
        
        <article className="about-content">
          <h1>Về Tử Vi Phong Lam</h1>
          
          <section className="about-section">
            <h2>🎯 Sứ mệnh</h2>
            <p>
              Tử Vi Phong Lam ra đời với mục tiêu mang kiến thức Tử Vi Đẩu Số - đặc biệt là 
              <strong> phương pháp Bắc Phái</strong> - đến gần hơn với mọi người. Chúng tôi tin rằng 
              hiểu biết về vận mệnh giúp mỗi người đưa ra quyết định sáng suốt hơn trong cuộc sống.
            </p>
          </section>

          <section className="about-section">
            <h2>📚 Phương pháp Bắc Phái</h2>
            <p>
              Khác với các trường phái khác, <strong>Tử Vi Bắc Phái</strong> chú trọng vào:
            </p>
            <ul>
              <li><strong>Tứ Hóa Phi Tinh</strong> - Phân tích luồng năng lượng giữa các cung</li>
              <li><strong>Phi Hóa Can Cung</strong> - Xác định mối quan hệ nhân quả</li>
              <li><strong>Đại Vận &amp; Lưu Niên</strong> - Dự đoán thời điểm sự kiện</li>
            </ul>
            <p>
              Phương pháp này cho phép luận giải chi tiết và chính xác hơn về các khía cạnh 
              sự nghiệp, tài chính, tình duyên và sức khỏe.
            </p>
          </section>

          <section className="about-section">
            <h2>💡 Công nghệ &amp; Tri thức</h2>
            <p>
              Tử Vi Phong Lam kết hợp <strong>tri thức cổ điển</strong> với <strong>công nghệ hiện đại</strong>:
            </p>
            <ul>
              <li>Cơ sở dữ liệu hơn <strong>30,000+ luận giải</strong> từ các sách cổ</li>
              <li>Thuật toán matching thông minh để tìm luận giải phù hợp</li>
              <li>AI tổng hợp và diễn giải theo ngữ cảnh cá nhân</li>
            </ul>
          </section>

          <section className="about-section">
            <h2>🏆 Cam kết</h2>
            <ul>
              <li>✅ Lập lá số <strong>miễn phí</strong>, không giới hạn</li>
              <li>✅ Luận giải dựa trên <strong>tri thức có nguồn gốc</strong></li>
              <li>✅ Bảo mật thông tin cá nhân tuyệt đối</li>
              <li>✅ Hỗ trợ tư vấn từ chuyên gia thực thụ</li>
            </ul>
          </section>

          <section className="about-section">
            <h2>📞 Liên hệ</h2>
            <p>
              Nếu bạn có câu hỏi hoặc cần hỗ trợ, vui lòng liên hệ qua:
            </p>
            <ul>
              <li><strong>Zalo:</strong> <a href="https://zalo.me/0123456789" target="_blank" rel="noreferrer">0123.456.789</a></li>
              <li><strong>Facebook:</strong> <a href="https://facebook.com/tuviphonglam" target="_blank" rel="noreferrer">facebook.com/tuviphonglam</a></li>
              <li><strong>Email:</strong> <a href="mailto:contact@tuviphonglam.com">contact@tuviphonglam.com</a></li>
            </ul>
          </section>

          <section className="about-section about-cta">
            <h2>🔮 Bắt đầu ngay</h2>
            <p>Lập lá số tử vi miễn phí và khám phá vận mệnh của bạn.</p>
            <a href="/lap-la-so" className="primary-button">
              Lập lá số miễn phí →
            </a>
          </section>
        </article>
      </main>
    </>
  );
}
