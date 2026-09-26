import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <p className="eyebrow">Pháp lý</p>
        <h1>Chính sách bảo mật</h1>
        <p>Cập nhật lần cuối: Tháng 12, 2024</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Giới thiệu</h2>
          <p>
            LaSoTuVi cam kết bảo vệ quyền riêng tư của bạn. Chính sách bảo mật này giải thích 
            cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn khi sử dụng dịch vụ.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Thông tin chúng tôi thu thập</h2>
          
          <h3>2.1. Thông tin bạn cung cấp trực tiếp</h3>
          <ul>
            <li><strong>Thông tin sinh:</strong> Ngày, tháng, năm, giờ sinh, giới tính (để lập lá số)</li>
            <li><strong>Tên hiển thị:</strong> Có thể là tên thật hoặc biệt danh</li>
            <li><strong>Thông tin liên hệ:</strong> Email, số điện thoại (khi đăng ký tư vấn)</li>
          </ul>

          <h3>2.2. Thông tin thu thập tự động</h3>
          <ul>
            <li>Địa chỉ IP</li>
            <li>Loại trình duyệt và thiết bị</li>
            <li>Trang đã truy cập và thời gian truy cập</li>
            <li>Nguồn truy cập (referrer)</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Cách chúng tôi sử dụng thông tin</h2>
          <p>Thông tin được sử dụng để:</p>
          <ul>
            <li>Lập lá số tử vi theo yêu cầu</li>
            <li>Cung cấp dịch vụ luận giải và tư vấn</li>
            <li>Liên hệ khi bạn đăng ký nhận tư vấn</li>
            <li>Cải thiện chất lượng dịch vụ</li>
            <li>Phân tích xu hướng sử dụng (ẩn danh)</li>
            <li>Gửi thông tin khuyến mãi (nếu bạn đồng ý)</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Lưu trữ dữ liệu</h2>
          
          <h3>4.1. Dữ liệu lập lá số miễn phí</h3>
          <p>
            Việc <strong>lập lá số</strong> (tính toán Mệnh, Thân, các cung và vị trí sao) được
            xử lý hoàn toàn trên trình duyệt (client-side) và <strong>không được gửi lên hoặc
            lưu trữ trên máy chủ của chúng tôi</strong>.
          </p>
          <p>
            Dữ liệu có thể được lưu tạm trong localStorage của trình duyệt để tiện sử dụng lại,
            và bạn có thể xóa bất cứ lúc nào bằng cách xóa dữ liệu trình duyệt.
          </p>
          <p>
            <strong>Khi bạn sử dụng tính năng luận giải AI hoặc chatbot hỏi đáp</strong>, một
            bản tóm tắt lá số (cung, sao, Ngũ Hành, giới tính - <strong>không bao gồm họ tên hoặc
            ngày giờ sinh cụ thể</strong>) cùng câu hỏi của bạn được gửi tới máy chủ của chúng tôi
            để xử lý bởi dịch vụ AI (Cloudflare Workers AI, hoặc Google Gemini khi cần dự phòng)
            và tạo nội dung luận giải. Dữ liệu này chỉ dùng để tạo phản hồi cho yêu cầu đó, không
            được lưu trữ lâu dài trên máy chủ của chúng tôi.
          </p>

          <h3>4.2. Dữ liệu dịch vụ có phí</h3>
          <p>
            Khi sử dụng dịch vụ có phí, thông tin liên hệ và nội dung trao đổi được lưu trữ 
            để phục vụ việc cung cấp dịch vụ. Dữ liệu được bảo mật và chỉ những người có 
            thẩm quyền mới được truy cập.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Chia sẻ thông tin</h2>
          <p>Chúng tôi <strong>không bán, cho thuê hoặc chia sẻ</strong> thông tin cá nhân của bạn với bên thứ ba, ngoại trừ:</p>
          <ul>
            <li>Khi có sự đồng ý của bạn</li>
            <li>Khi được yêu cầu bởi pháp luật</li>
            <li>Để bảo vệ quyền lợi hợp pháp của chúng tôi</li>
            <li>Với các nhà cung cấp dịch vụ hỗ trợ (hosting, analytics) theo hợp đồng bảo mật</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Cookies và công nghệ theo dõi</h2>
          <p>Chúng tôi sử dụng:</p>
          <ul>
            <li><strong>Cookies cần thiết:</strong> Để website hoạt động bình thường</li>
            <li><strong>Cookies phân tích:</strong> Google Analytics để hiểu cách người dùng sử dụng website</li>
            <li><strong>LocalStorage:</strong> Lưu tạm dữ liệu lá số và cài đặt người dùng</li>
          </ul>
          <p>
            Bạn có thể tắt cookies trong cài đặt trình duyệt, tuy nhiên một số tính năng 
            có thể không hoạt động đúng.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Bảo mật dữ liệu</h2>
          <p>Chúng tôi áp dụng các biện pháp bảo mật:</p>
          <ul>
            <li>Mã hóa HTTPS cho tất cả kết nối</li>
            <li>Không lưu trữ dữ liệu nhạy cảm trên server (với dịch vụ miễn phí)</li>
            <li>Giới hạn quyền truy cập dữ liệu</li>
            <li>Cập nhật bảo mật thường xuyên</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>8. Quyền của bạn</h2>
          <p>Bạn có quyền:</p>
          <ul>
            <li><strong>Truy cập:</strong> Yêu cầu xem thông tin chúng tôi có về bạn</li>
            <li><strong>Chỉnh sửa:</strong> Yêu cầu sửa thông tin không chính xác</li>
            <li><strong>Xóa:</strong> Yêu cầu xóa dữ liệu cá nhân</li>
            <li><strong>Từ chối:</strong> Từ chối nhận email marketing</li>
            <li><strong>Rút lại đồng ý:</strong> Rút lại sự đồng ý đã cho trước đó</li>
          </ul>
          <p>Để thực hiện các quyền này, vui lòng liên hệ qua trang Liên hệ.</p>
        </section>

        <section className="legal-section">
          <h2>9. Dữ liệu trẻ em</h2>
          <p>
            Dịch vụ của chúng tôi không dành cho người dưới 16 tuổi. Chúng tôi không cố ý 
            thu thập thông tin từ trẻ em. Nếu phát hiện đã thu thập dữ liệu của trẻ em, 
            chúng tôi sẽ xóa ngay lập tức.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Thay đổi chính sách</h2>
          <p>
            Chúng tôi có thể cập nhật Chính sách bảo mật này. Các thay đổi quan trọng sẽ 
            được thông báo trên website. Ngày cập nhật cuối cùng được ghi ở đầu trang.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Liên hệ</h2>
          <p>
            Nếu bạn có câu hỏi về Chính sách bảo mật hoặc muốn thực hiện quyền của mình, 
            vui lòng liên hệ qua trang Liên hệ hoặc các kênh hỗ trợ trên website.
          </p>
        </section>
      </div>
    </div>
  );
}
