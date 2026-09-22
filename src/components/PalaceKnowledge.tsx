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

function KnowledgeCard({ item, index }: { item: KnowledgeItem; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  const typeColors: Record<string, string> = {
    position: "#4a90d9",
    main_star: "#d4a84b",
    phi_hoa: "#9b59b6",
    minor_star: "#27ae60",
    general: "#7f8c8d",
  };

  return (
    <div className={`knowledge-card ${expanded ? "is-expanded" : ""}`}>
      <button
        type="button"
        className="knowledge-card__header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span
          className="knowledge-card__type"
          style={{ backgroundColor: typeColors[item.type] || "#7f8c8d" }}
        >
          {item.typeLabel}
        </span>
        <span className="knowledge-card__title">{item.title}</span>
        <span className="knowledge-card__toggle">{expanded ? "−" : "+"}</span>
      </button>

      {expanded && (
        <div className="knowledge-card__body">
          <p className="knowledge-card__text">{item.text}</p>
          <div className="knowledge-card__meta">
            <span className="knowledge-card__source">{formatSource(item.source)}</span>
            {item.matchReasons.length > 0 && (
              <span className="knowledge-card__reasons">
                {item.matchReasons.map((reason, i) => (
                  <span key={i} className="knowledge-card__tag">{reason}</span>
                ))}
              </span>
            )}
          </div>
        </div>
      )}
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
  const result: PalaceKnowledgeResult = queryPalaceKnowledge({ palace, gender });

  if (result.topKnowledge.length === 0) {
    return (
      <div className="palace-knowledge palace-knowledge--empty">
        <p>Chưa có tri thức cho cung {palace.name}</p>
      </div>
    );
  }

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
        {result.topKnowledge.map((item, index) => (
          <KnowledgeCard key={item.id} item={item} index={index} />
        ))}
      </div>

      <PhiHoaSection items={result.phiHoaList} />

      {result.totalAvailable > 3 && (
        <p className="palace-knowledge__more">
          Còn {result.totalAvailable - 3} luận giải khác
        </p>
      )}
    </div>
  );
}
