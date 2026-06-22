import React, { useState } from "react";
import type { ChartView } from "../lib/types";

type Props = {
  chart: ChartView;
};

const normalizeVietnameseText = (value: string | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const getStarLabel = (star: { display?: string; name: string }) => star.display || star.name;

const getTopStars = (palace: ChartView["palaces"][number] | undefined, limit = 4) => {
  if (!palace) {
    return [];
  }

  const stars = [...(palace.centerStars ?? palace.majorStars), ...(palace.leftStars ?? palace.goodStars), ...(palace.rightStars ?? palace.badStars)];
  return Array.from(new Set(stars.map(getStarLabel).filter(Boolean))).slice(0, limit);
};

const getPalaceMeaning = (name: string) => {
  const key = normalizeVietnameseText(name);
  const meaningMap: Record<string, string> = {
    menh: "Phản ánh khí chất, cách thể hiện bản thân và nền tảng tính cách.",
    "phu mau": "Gợi ý về gia đình gốc, mối liên hệ với cha mẹ và hậu thuẫn ban đầu.",
    "phuc duc": "Liên quan đến phúc khí, nền tảng tinh thần và sự nâng đỡ lâu dài.",
    "dien trach": "Gợi mở về nhà cửa, tài sản tích lũy và môi trường sống.",
    "quan loc": "Phản ánh xu hướng nghề nghiệp, vai trò xã hội và tham vọng phát triển.",
    "no boc": "Cho thấy mạng lưới cộng sự, bạn bè, người hỗ trợ và cách hợp tác.",
    "thien di": "Liên quan đến cơ hội khi ra ngoài, môi trường xã hội và dịch chuyển.",
    "tat ach": "Nhắc đến sức khỏe, áp lực tinh thần và những điều cần lưu tâm.",
    "tai bach": "Gợi ý về dòng tiền, cách kiếm tiền và khả năng quản lý tài chính.",
    "tu tuc": "Liên quan đến con cái, dự định cá nhân và thành quả gây dựng.",
    "phu the": "Cho biết xu hướng tình cảm, hôn nhân và cách kết nối với bạn đời.",
    "huynh de": "Phản ánh quan hệ anh chị em, bạn đồng hành và người ngang vai.",
  };

  return meaningMap[key] ?? "Đây là một lớp thông tin tham khảo trong lá số tử vi.";
};

export default function PalaceAccordion({ chart }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="result-block">
      <div className="section-heading section-heading--compact">
        <p className="eyebrow">12 cung</p>
        <h2>Chi tiết từng cung</h2>
      </div>

      <div className="palace-accordion">
        {chart.palaces.map((palace, index) => {
          const stars = getTopStars(palace, 4);
          const isOpen = openIndex === index;
          const triggerId = `palace-trigger-${index}`;
          const panelId = `palace-panel-${index}`;

          return (
            <article key={`${palace.name}-${index}`} className={`palace-accordion-item${isOpen ? " is-open" : ""}`}>
              <button
                id={triggerId}
                type="button"
                className="palace-accordion-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex((current) => (current === index ? null : index))}
              >
                <span>{palace.name}</span>
                <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
              <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!isOpen} className="palace-accordion-panel">
                <p><strong>Ý nghĩa cung:</strong> {getPalaceMeaning(palace.name)}</p>
                <p><strong>Sao nổi bật:</strong> {stars.length > 0 ? stars.join(", ") : "Đang cập nhật thêm."}</p>
                <p><strong>Luận giải ngắn:</strong> Hãy đọc cung này cùng các cung liên quan để có góc nhìn cân bằng hơn, tránh kết luận tuyệt đối chỉ từ một vị trí.</p>
                <p><strong>Lưu ý tham khảo:</strong> Nội dung tử vi chỉ mang tính định hướng tham khảo, không thay thế tư vấn chuyên môn.</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
