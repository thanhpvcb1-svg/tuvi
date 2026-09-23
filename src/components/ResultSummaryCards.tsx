import React from "react";
import type { SummaryCard } from "../lib/chartUi";

type Props = {
  items: SummaryCard[];
};

export default function ResultSummaryCards({ items }: Props) {
  return (
    <section className="result-block">
      <div className="section-heading section-heading--compact">
        <p className="eyebrow">Tóm tắt nhanh</p>
        <h2>Những điểm chính của lá số</h2>
      </div>
      <div className="summary-grid">
        {items.map((item) => (
          <article key={item.label} className="summary-card">
            <p>{item.label}</p>
            <strong>{item.value}</strong>
            {item.hint ? <span>{item.hint}</span> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

