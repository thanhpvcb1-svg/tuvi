import React, { useState } from "react";
import type { QuickReadingCard } from "../lib/chartUi";

type Props = {
  items: QuickReadingCard[];
};

export default function InterpretationCards({ items }: Props) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <section className="result-block">
      <div className="section-heading section-heading--compact">
        <p className="eyebrow">Luận giải nhanh</p>
        <h2>5 lớp đọc nhanh cho người mới</h2>
      </div>
      <div className="quick-reading-grid">
        {items.map((item) => {
          const expanded = openId === item.id;
          return (
            <article key={item.id} className={`quick-reading-card${expanded ? " is-open" : ""}`}>
              <div className="quick-reading-head">
                <span className="quick-reading-icon" aria-hidden="true">{item.icon}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </div>
              </div>
              <button
                type="button"
                className="text-button"
                aria-expanded={expanded}
                onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
              >
                {expanded ? "Ẩn chi tiết" : "Xem chi tiết"}
              </button>
              {expanded ? <div className="quick-reading-detail">{item.detail}</div> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

