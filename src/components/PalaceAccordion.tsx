import React, { useState } from "react";
import type { ChartView } from "../lib/types";
import { getPalaceMeaning, getTopStars } from "../lib/chartUi";

type Props = {
  chart: ChartView;
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

