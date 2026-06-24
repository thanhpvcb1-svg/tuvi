import React from "react";

const palaceDescriptions = [
  ["Mệnh", "Cho biết khí chất, cách bạn phản ứng với cuộc sống và phần nền của tính cách."],
  ["Phụ Mẫu", "Liên quan đến gia đình gốc, sự nâng đỡ ban đầu và mối liên hệ với cha mẹ."],
  ["Phúc Đức", "Phản ánh phúc khí, đời sống tinh thần và hậu thuẫn tích lũy theo thời gian."],
  ["Điền Trạch", "Gợi mở về nhà cửa, tài sản tích lũy và môi trường sống."],
  ["Quan Lộc", "Thể hiện hướng nghề nghiệp, vị thế công việc và nhịp phát triển sự nghiệp."],
  ["Nô Bộc", "Cho thấy mạng lưới cộng sự, bạn bè và người hỗ trợ."],
  ["Thiên Di", "Liên quan đến môi trường bên ngoài, việc đi xa và khả năng hòa nhập xã hội."],
  ["Tật Ách", "Gợi ý về sức khỏe, áp lực tinh thần và các điểm cần chủ động chăm sóc."],
  ["Tài Bạch", "Nhắc đến dòng tiền, cách kiếm tiền và thói quen quản lý tài chính."],
  ["Tử Tức", "Liên quan đến con cái, thành quả cá nhân và kế hoạch dài hạn."],
  ["Phu Thê", "Phản ánh xu hướng tình cảm, hôn nhân và cách gắn bó với bạn đời."],
  ["Huynh Đệ", "Cho biết quan hệ anh chị em và những người đồng hành ngang vai."],
];

export default function EducationSection() {
  return (
    <section className="content-section content-section--split" id="kien-thuc">
      <div className="education-card">
        <p className="eyebrow">Kiến thức cơ bản</p>
        <h2>Lá số tử vi là gì?</h2>
        <p>
          Lá số tử vi là một bản đồ tham khảo dựa trên ngày, giờ, tháng, năm sinh để nhìn tổng quan các cung và xu hướng vận
          hành theo hệ quy chiếu của tử vi phương Đông.
        </p>
        <p className="muted-note">Nội dung trên trang mang tính tham khảo và chiêm nghiệm.</p>
      </div>

      <div className="education-card">
        <p className="eyebrow">Lưu ý quan trọng</p>
        <h2>Vì sao giờ sinh quan trọng?</h2>
        <p>
          Giờ sinh ảnh hưởng đến cách an cung, vị trí Mệnh, Thân và nhiều lớp dữ liệu khác. Nếu chưa chắc giờ sinh, bạn vẫn có
          thể xem bản tham khảo, nhưng nên hiểu rõ giới hạn của kết quả đó.
        </p>
      </div>

      <div className="education-card education-card--full">
        <p className="eyebrow">12 cung</p>
        <h2>Cách đọc 12 cung trong lá số tử vi</h2>
        <div className="education-grid">
          {palaceDescriptions.map(([title, description]) => (
            <article key={title} className="education-item">
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
