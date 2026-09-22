import React, { useState } from "react";
import type { DisplayPalace } from "../lib/tuvi/config/types";
import {
  queryPalaceKnowledge,
  formatSource,
  type KnowledgeItem,
  type PhiHoaItem,
  type PalaceKnowledgeResult,
} from "../lib/tuvi/knowledge/palaceKnowledgeQuery";

type Props = {
  palace: DisplayPalace;
  gender?: "male" | "female";
};

function KnowledgeCard({ item }: { item: KnowledgeItem }) {
  const typeColors: Record<string, string> = {
    position: "#4a90d9",
    main_star: "#d4a84b",
    phi_hoa: "#9b59b6",
    minor_star: "#27ae60",
    general: "#7f8c8d",
  };

  return (
    <div className="knowledge-card">
      <div className="knowledge-card__header">
        <span
          className="knowledge-card__type"
          style={{ backgroundColor: typeColors[item.type] || "#7f8c8d" }}
        >
          {item.typeLabel}
        </span>
        <span className="knowledge-card__title">{item.title}</span>
      </div>

      <div className="knowledge-card__body">
        <p className="knowledge-card__text">{item.text}</p>
        <div className="knowledge-card__footer">
          <span className="knowledge-card__source">{formatSource(item.source)}</span>
        </div>
      </div>
    </div>
  );
}

function PhiHoaSection({ items }: { items: PhiHoaItem[] }) {
  const [showAll, setShowAll] = useState(false);

  if (items.length === 0) return null;

  const displayItems = showAll ? items : items.slice(0, 2);

  return (
    <div className="phi-hoa-section">
      <h4 className="phi-hoa-section__title">
        <span className="phi-hoa-section__icon">⟳</span>
        Phi hóa từ cung này
      </h4>
      <div className="phi-hoa-list">
        {displayItems.map((item) => (
          <div key={item.id} className="phi-hoa-item">
            <span className={`phi-hoa-item__type phi-hoa-item__type--${item.type}`}>
              {item.typeLabel}
            </span>
            <span className="phi-hoa-item__arrow">→</span>
            <span className="phi-hoa-item__target">{item.targetPalace}</span>
          </div>
        ))}
      </div>
      {items.length > 2 && (
        <button
          type="button"
          className="phi-hoa-section__toggle"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Thu gọn" : `Xem thêm ${items.length - 2} phi hóa`}
        </button>
      )}
    </div>
  );
}

export default function PalaceKnowledge({ palace, gender = "male" }: Props) {
  const [showAll, setShowAll] = useState(false);
  const result: PalaceKnowledgeResult = queryPalaceKnowledge({ palace, gender });

  if (result.topKnowledge.length === 0) {
    return (
      <div className="palace-knowledge palace-knowledge--empty">
        <p>Chưa có tri thức cho cung {palace.name}</p>
      </div>
    );
  }

  const displayCount = showAll ? result.topKnowledge.length : 3;
  const hasMore = result.topKnowledge.length > 3;

  return (
    <div className="palace-knowledge">
      <div className="palace-knowledge__header">
        <h3 className="palace-knowledge__title">
          Luận giải cung {palace.name}
        </h3>
        <span className="palace-knowledge__position">
          {result.heavenlyStem} {result.palacePosition}
        </span>
      </div>

      <div className="palace-knowledge__cards">
        {result.topKnowledge.slice(0, displayCount).map((item) => (
          <KnowledgeCard key={item.id} item={item} />
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          className="palace-knowledge__toggle"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Thu gọn" : `Xem thêm ${result.topKnowledge.length - 3} luận giải`}
        </button>
      )}

      <PhiHoaSection items={result.phiHoaList} />
    </div>
  );
}
