import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";

export default function NotFoundPage() {
  return (
    <>
      <SEOHead
        title="Không tìm thấy trang | Tử Vi Phong Lam"
        description="Trang bạn tìm kiếm không tồn tại. Quay lại trang chủ để lập lá số tử vi miễn phí."
        noindex
      />
      <main className="not-found-page">
        <div className="not-found-content">
          <h1>404</h1>
          <h2>Trang không tồn tại</h2>
          <p>Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.</p>
          <div className="not-found-actions">
            <Link to="/" className="primary-button">
              🏠 Về trang chủ
            </Link>
            <Link to="/lap-la-so" className="secondary-button">
              🔮 Lập lá số miễn phí
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
