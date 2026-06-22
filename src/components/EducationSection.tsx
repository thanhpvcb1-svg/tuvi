import React from "react";

const palaceDescriptions = [
  ["Mệnh", "Cho biết khí chất, cách bạn phản ứng với cuộc sống và nền tảng tính cách."],
  ["Phụ Mẫu", "Liên quan đến gia đình gốc, mối liên hệ với cha mẹ và sự nâng đỡ ban đầu."],
  ["Phúc Đức", "Phản ánh phúc khí, đời sống tinh thần và hậu thuẫn dài hạn."],
  ["Điền Trạch", "Gợi mở về nhà cửa, tài sản tích lũy và môi trường sống."],
  ["Quan Lộc", "Thể hiện hướng nghề nghiệp, vị thế xã hội và nhịp phát triển công việc."],
  ["Nô Bộc", "Cho thấy mạng lưới cộng sự, bạn bè và người hỗ trợ."],
  ["Thiên Di", "Liên quan đến cơ hội bên ngoài, việc đi xa và cách hòa nhập môi trường xã hội."],
  ["Tật Ách", "Gợi ý về sức khỏe, áp lực tinh thần và điều cần chủ động chăm sóc."],
  ["Tài Bạch", "Nhắc đến dòng tiền, cách kiếm tiền và thói quen quản lý tài chính."],
  ["Tử Tức", "Liên quan đến con cái, thành quả cá nhân và các kế hoạch dài hạn."],
  ["Phu Thê", "Phản ánh xu hướng tình cảm, hôn nhân và cách gắn bó với bạn đời."],
  ["Huynh Đệ", "Cho biết quan hệ anh chị em và những người ngang vai đồng hành cùng bạn."],
];

export default function EducationSection() {
  return (
    <section className="content-section content-section--split" id="kien-thuc">
      <div className="education-card">
        <p className="eyebrow">Kiến thức cơ bản</p>
        <h2>Lá số tử vi là gì?</h2>
        <p>
          Lá số tử vi là bản đồ tham khảo dựa trên ngày, giờ, tháng, năm sinh để xem tổng quan các cung và xu hướng cuộc đời theo quan niệm tử vi phương Đông.
        </p>
        <p className="muted-note">Nội dung chỉ mang tính tham khảo, chiêm nghiệm và giải trí.</p>
      </div>

      <div className="education-card">
        <p className="eyebrow">Lưu ý quan trọng</p>
        <h2>Vì sao giờ sinh quan trọng?</h2>
        <p>
          Giờ sinh ảnh hưởng đến cách an cung, vị trí Mệnh, Thân và nhiều yếu tố khác trong lá số. Nếu bạn không chắc giờ sinh, hãy xem kết quả như một bản tham khảo gần đúng.
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

