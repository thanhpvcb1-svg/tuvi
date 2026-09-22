import React, { useEffect, useState, useMemo } from "react";
import type { ChartView, PalaceView } from "../lib/types";
import { findPalace, getPalaceMeaning } from "../lib/chartUi";
import {
  queryPalaceKnowledge,
  extractStarsFromPalace,
  extractMutagensFromPalace,
  extractPhiHoaFlows,
  type KnowledgeMatch,
} from "../lib/tuvi/knowledge/knowledgeService";
import type { DisplayPalace } from "../lib/tuvi/config/types";

type PalaceAnalysis = {
  id: string;
  name: string;
  icon: string;
  branch: string;
  stem: string;
  majorStars: string[];
  goodStars: string[];
  badStars: string[];
  meaning: string;
  phiHoa: string[];
  isBodyPalace: boolean;
  knowledgeMatches: KnowledgeMatch[];
};

type Props = {
  chart: ChartView;
  isActive: boolean;
  onComplete?: () => void;
};

const PALACE_CONFIG: Array<{ id: string; name: string; icon: string }> = [
  { id: "menh", name: "Mệnh", icon: "👤" },
  { id: "phu_mau", name: "Phụ Mẫu", icon: "👨‍👩‍👧" },
  { id: "phuc_duc", name: "Phúc Đức", icon: "🍀" },
  { id: "dien_trach", name: "Điền Trạch", icon: "🏠" },
  { id: "quan_loc", name: "Quan Lộc", icon: "💼" },
  { id: "no_boc", name: "Nô Bộc", icon: "🤝" },
  { id: "thien_di", name: "Thiên Di", icon: "✈️" },
  { id: "tat_ach", name: "Tật Ách", icon: "💊" },
  { id: "tai_bach", name: "Tài Bạch", icon: "💰" },
  { id: "tu_tuc", name: "Tử Tức", icon: "👶" },
  { id: "phu_the", name: "Phu Thê", icon: "💑" },
  { id: "huynh_de", name: "Huynh Đệ", icon: "👥" },
];

function getStarDisplay(star: { name: string; display?: string }) {
  return star.display || star.name;
}

function getPhiHoaFlows(palace: PalaceView): string[] {
  const results: string[] = [];
  const phiTuHoa = (palace as any).phiTuHoa;

  if (phiTuHoa?.flows) {
    for (const flow of phiTuHoa.flows) {
      if (flow.targetPalaceName) {
        const label = flow.typeLabel || flow.type;
        results.push(`${label} → ${flow.targetPalaceName}`);
      }
    }
  }
  return results;
}

function analyzePalace(chart: ChartView, config: { id: string; name: string; icon: string }): PalaceAnalysis | null {
  const palace = findPalace(chart, config.name);
  if (!palace) return null;

  // Build context for knowledge query
  const displayPalace = palace as unknown as DisplayPalace;
  const starsInPalace = extractStarsFromPalace(displayPalace);
  const mutagensInPalace = extractMutagensFromPalace(displayPalace);
  const phiHoaFlows = extractPhiHoaFlows(displayPalace);

  const knowledgeMatches = queryPalaceKnowledge({
    palace: displayPalace,
    starsInPalace,
    branch: palace.earthlyBranch || "",
    heavenlyStem: (palace as any).heavenlyStem,
    mutagensInPalace,
    phiHoaFlows,
  });

  return {
    id: config.id,
    name: config.name,
    icon: config.icon,
    branch: palace.earthlyBranch || "",
    stem: (palace as any).heavenlyStem || "",
    majorStars: palace.majorStars?.map(getStarDisplay).filter(Boolean) || [],
    goodStars: palace.goodStars?.slice(0, 4).map(getStarDisplay).filter(Boolean) || [],
    badStars: palace.badStars?.slice(0, 3).map(getStarDisplay).filter(Boolean) || [],
    meaning: getPalaceMeaning(config.name),
    phiHoa: getPhiHoaFlows(palace),
    isBodyPalace: palace.isBodyPalace || false,
    knowledgeMatches,
  };
}

// Sắp xếp knowledge: vị trí cung > sao đồng cung > tứ hóa > phi hóa
function sortKnowledgeByPriority(matches: KnowledgeMatch[]): KnowledgeMatch[] {
  return [...matches].sort((a, b) => {
    const getTypePriority = (type: string) => {
      // Ưu tiên 1: Vị trí cung, can cung
      if (type === "position" || type === "heavenly_stem") return 1;
      // Ưu tiên 2: Sao trong cung, sao đồng cung, cách cục
      if (type === "star_in_palace" || type === "star_combination" || type === "cach_cuc") return 2;
      // Ưu tiên 3: Tứ hóa tọa thủ
      if (type === "mutagen_in_palace" || type === "mutagen_combination") return 3;
      // Ưu tiên 4: Phi hóa
      if (type.startsWith("phi_")) return 4;
      // Ưu tiên 5: Khác
      return 5;
    };
    const priorityA = getTypePriority(a.interpretation.type);
    const priorityB = getTypePriority(b.interpretation.type);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return b.matchScore - a.matchScore; // Cùng loại thì theo score
  });
}

function PalaceCard({ analysis, isExpanded, onToggle }: { 
  analysis: PalaceAnalysis; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const sortedMatches = useMemo(() => sortKnowledgeByPriority(analysis.knowledgeMatches), [analysis.knowledgeMatches]);
  const displayCount = showAll ? 5 : 3;
  const hasMore = sortedMatches.length > 3 && !showAll;

  return (
    <div className={`analysis-palace-card ${isExpanded ? "is-expanded" : ""}`}>
      <button type="button" className="analysis-palace-header" onClick={onToggle}>
        <div className="analysis-palace-title">
          <span className="analysis-palace-icon">{analysis.icon}</span>
          <div className="analysis-palace-name">
            <strong>{analysis.name}</strong>
            {analysis.isBodyPalace && <span className="analysis-body-badge">Thân</span>}
            <span className="analysis-palace-position">{analysis.branch} · {analysis.stem}</span>
          </div>
        </div>
        <div className="analysis-palace-preview">
          {analysis.majorStars.length > 0 && (
            <span className="analysis-star-preview">{analysis.majorStars.join(", ")}</span>
          )}
          <span className={`analysis-toggle-icon ${isExpanded ? "is-open" : ""}`}>▼</span>
        </div>
      </button>

      {isExpanded && (
        <div className="analysis-palace-content">
          <p className="analysis-palace-meaning">{analysis.meaning}</p>

          {sortedMatches.length > 0 && (
            <div className="analysis-knowledge">
              <span className="analysis-star-label">Luận giải:</span>
              <div className={`analysis-knowledge-list ${showAll ? "analysis-knowledge-list--scrollable" : ""}`}>
                {sortedMatches.slice(0, displayCount).map((match, i) => (
                  <div key={match.interpretation.id || i} className="analysis-knowledge-item">
                    <p className="analysis-knowledge-text">{match.interpretation.text}</p>
                    <div className="analysis-knowledge-meta">
                      <span className="analysis-knowledge-reasons">
                        {match.matchReasons.join(" · ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {hasMore && (
                <button type="button" className="analysis-show-more" onClick={() => setShowAll(true)}>
                  Xem thêm ({Math.min(sortedMatches.length, 5) - 3} luận giải)
                </button>
              )}
            </div>
          )}

          {analysis.phiHoa.length > 0 && (
            <div className="analysis-phi-hoa">
              <span className="analysis-star-label">Phi Hóa:</span>
              <div className="analysis-phi-hoa-tags">
                {analysis.phiHoa.map((flow, i) => (
                  <span key={i} className="analysis-phi-hoa-tag">{flow}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StreamingAnalysis({ chart, isActive, onComplete }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["menh", "quan_loc", "tai_bach"]));
  const [isLoading, setIsLoading] = useState(true);

  const analyses = useMemo(() => {
    if (!chart) return [];
    return PALACE_CONFIG
      .map((config) => analyzePalace(chart, config))
      .filter((a): a is PalaceAnalysis => a !== null);
  }, [chart]);

  useEffect(() => {
    if (!isActive) return;
    
    // Simulate brief loading for smooth UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [isActive]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(analyses.map((a) => a.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  if (!isActive) return null;

  if (isLoading) {
    return (
      <div className="analysis-panel">
        <div className="analysis-loading">
          <div className="analysis-loading-spinner" />
          <p>Đang phân tích lá số...</p>
        </div>
      </div>
    );
  }

  const keyPalaces = analyses.filter((a) => ["menh", "quan_loc", "tai_bach", "phu_the"].includes(a.id));
  const otherPalaces = analyses.filter((a) => !["menh", "quan_loc", "tai_bach", "phu_the"].includes(a.id));

  return (
    <div className="analysis-panel">
      <div className="analysis-header">
        <div className="analysis-header-content">
          <h3>📖 Luận giải 12 cung</h3>
          <p>Phân tích chi tiết từng cung trong lá số của bạn</p>
        </div>
        <div className="analysis-header-actions">
          <button type="button" className="analysis-action-btn" onClick={expandAll}>Mở tất cả</button>
          <button type="button" className="analysis-action-btn" onClick={collapseAll}>Thu gọn</button>
        </div>
      </div>

      <div className="analysis-section">
        <h4 className="analysis-section-title">
          <span className="analysis-section-icon">⭐</span>
          Các cung trọng tâm
        </h4>
        <div className="analysis-palace-grid">
          {keyPalaces.map((analysis) => (
            <PalaceCard
              key={analysis.id}
              analysis={analysis}
              isExpanded={expandedIds.has(analysis.id)}
              onToggle={() => toggleExpand(analysis.id)}
            />
          ))}
        </div>
      </div>

      <div className="analysis-section">
        <h4 className="analysis-section-title">
          <span className="analysis-section-icon">📋</span>
          Các cung khác
        </h4>
        <div className="analysis-palace-grid">
          {otherPalaces.map((analysis) => (
            <PalaceCard
              key={analysis.id}
              analysis={analysis}
              isExpanded={expandedIds.has(analysis.id)}
              onToggle={() => toggleExpand(analysis.id)}
            />
          ))}
        </div>
      </div>

      <div className="analysis-footer">
        <p>💡 Nội dung chỉ mang tính tham khảo. Để được luận giải chuyên sâu, vui lòng liên hệ tư vấn.</p>
      </div>
    </div>
  );
}
