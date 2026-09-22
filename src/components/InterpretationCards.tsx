import React, { useState } from "react";
import type { QuickReadingCard, KnowledgeItem } from "../lib/chartUi";

type Props = {
  items: QuickReadingCard[];
};

function KnowledgeBlockCard({ item }: { item: KnowledgeItem }) {
  return (
    <div className="knowledge-block">
      <div className="knowledge-block__header">
        <span className="knowledge-block__star">{item.starName}</span>
        <span className="knowledge-block__score" title={item.matchReasons.join(", ")}>
          ★ {item.matchScore}
        </span>
      </div>
      <p className="knowledge-block__text">{item.text}</p>
      <div className="knowledge-block__meta">
        <span className="knowledge-block__source">{item.source}</span>
        {item.matchReasons.length > 0 && (
          <span className="knowledge-block__reasons">
            {item.matchReasons.map((reason, i) => (
              <span key={i} className="knowledge-block__reason-tag">{reason}</span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

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
          const hasKnowledge = item.knowledgeItems && item.knowledgeItems.length > 0;

          return (
            <article key={item.id} className={`quick-reading-card${expanded ? " is-open" : ""}${hasKnowledge ? " has-knowledge" : ""}`}>
              <div className="quick-reading-head">
                <span className="quick-reading-icon" aria-hidden="true">{item.icon}</span>
                <div>
                  <h3>
                    {item.title}
                    {hasKnowledge && (
                      <span className="knowledge-badge" title="Có luận giải từ sách cổ">
                        📚 {item.knowledgeItems!.length}
                      </span>
                    )}
                  </h3>
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
              {expanded && (
                <div className="quick-reading-detail">
                  {/* Original detail */}
                  <div className="quick-reading-detail__text">{item.detail}</div>

                  {/* Knowledge blocks from curated data */}
                  {hasKnowledge && (
                    <div className="knowledge-section">
                      <h4 className="knowledge-section__title">
                        <span className="knowledge-section__icon">📚</span>
                        Luận giải từ sách cổ
                      </h4>
                      <div className="knowledge-blocks">
                        {item.knowledgeItems!.map((knowledge) => (
                          <KnowledgeBlockCard key={knowledge.id} item={knowledge} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

