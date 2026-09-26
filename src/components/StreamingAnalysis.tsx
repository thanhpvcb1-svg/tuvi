import React, { useEffect, useState, useMemo, useCallback } from "react";
import type { ChartView, PalaceView } from "../lib/types";
import { findPalace, getPalaceMeaning } from "../lib/chartUi";
import {
  queryPalaceKnowledge,
  extractStarsFromPalace,
  extractMutagensFromPalace,
  extractPhiHoaFlows,
  type KnowledgeMatch,
} from "../lib/tuvi/knowledge/knowledgeService";
import { callGeminiLuanGiai, callGeminiTongHop, type PalaceSummary } from "../lib/geminiService";
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
  geminiAnalysis?: string;
  geminiLoading?: boolean;
  geminiError?: string;
};

type Props = {
  chart: ChartView;
  isActive: boolean;
  onComplete?: () => void;
  userContext?: {
    gender?: string;
    yearToView?: number;
  };
};

type TongHopState = {
  loading: boolean;
  analysis?: string;
  error?: string;
};

// Loading messages xoay vòng tạo hiệu ứng "chuyên gia đang suy nghĩ"
const EXPERT_THINKING_MESSAGES = [
  "Đang phân tích cấu trúc Mệnh - Thân...",
  "Đang xem xét Tứ Hóa Lộc, Quyền, Khoa, Kỵ...",
  "Đang truy vấn tri thức Bắc Phái...",
  "Đang phân tích Phi Hóa Can Cung...",
  "Đang đối chiếu tam hợp, xung chiếu...",
  "Đang tổng hợp các cung trọng yếu...",
  "Đang xem xét Quan Lộc, Tài Bạch, Phu Thê...",
  "Đang phân tích mối quan hệ giữa các cung...",
  "Đang đánh giá cát hung tinh...",
  "Đang hoàn thiện luận giải...",
];

const PALACE_THINKING_MESSAGES = [
  "Đang xem xét chính tinh tọa thủ...",
  "Đang phân tích phụ tinh đồng cung...",
  "Đang tra cứu tri thức cổ điển...",
  "Đang đối chiếu Tứ Hóa...",
  "Đang xem xét tam hợp cung...",
  "Đang tổng hợp luận giải...",
];

// Component hiển thị loading với message xoay vòng
function ExpertThinkingLoader({ messages, variant = "block" }: { messages: string[]; variant?: "block" | "inline" }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500); // Đổi message mỗi 2.5 giây

    return () => clearInterval(interval);
  }, [messages.length]);

  if (variant === "inline") {
    return (
      <div className="analysis-gemini-loading">
        <span className="analysis-gemini-spinner" />
        <span className="analysis-thinking-text">{messages[messageIndex]}</span>
      </div>
    );
  }

  return (
    <div className="analysis-tonghop-loading">
      <div className="analysis-expert-avatar">
        <span className="analysis-expert-icon">🧙‍♂️</span>
        <span className="analysis-expert-pulse" />
      </div>
      <div className="analysis-expert-content">
        <p className="analysis-expert-title">Chuyên gia đang phân tích...</p>
        <p className="analysis-thinking-text">{messages[messageIndex]}</p>
      </div>
      <div className="analysis-thinking-dots">
        <span /><span /><span />
      </div>
    </div>
  );
}

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

function KnowledgeItem({ match }: { match: KnowledgeMatch }) {
  return (
    <div className="analysis-knowledge-item">
      <p className="analysis-knowledge-text">{match.interpretation.text}</p>
      <div className="analysis-knowledge-meta">
        <span className="analysis-knowledge-reasons">
          {match.matchReasons.join(" · ")}
        </span>
      </div>
    </div>
  );
}

function PalaceCard({ analysis, isExpanded, onToggle, onRequestGemini }: { 
  analysis: PalaceAnalysis; 
  isExpanded: boolean;
  onToggle: () => void;
  onRequestGemini?: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const sortedMatches = useMemo(() => sortKnowledgeByPriority(analysis.knowledgeMatches), [analysis.knowledgeMatches]);
  const displayCount = showAll ? sortedMatches.length : 3;
  const hasMore = sortedMatches.length > 3;
  const knowledgeCount = analysis.knowledgeMatches.length;
  // API key được cấu hình trên Cloudflare server-side
  const hasGeminiKey = true;

  return (
    <div className={`analysis-palace-card ${isExpanded ? "is-expanded" : ""}`}>
      <button type="button" className="analysis-palace-header" onClick={onToggle}>
        <div className="analysis-palace-title">
          <span className="analysis-palace-icon">{analysis.icon}</span>
          <div className="analysis-palace-name">
            <strong>
              {analysis.name}
              {knowledgeCount > 0 && (
                <span className="analysis-knowledge-badge" title={`${knowledgeCount} luận giải`}>
                  {knowledgeCount}
                </span>
              )}
            </strong>
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

          {/* Gemini AI Analysis Section */}
          {hasGeminiKey && sortedMatches.length > 0 && (
            <div className="analysis-gemini">
              <div className="analysis-gemini-header">
                <span className="analysis-star-label">🤖 AI Luận giải:</span>
                {!analysis.geminiAnalysis && !analysis.geminiLoading && (
                  <button
                    type="button"
                    className="analysis-gemini-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestGemini?.();
                    }}
                  >
                    Luận bằng AI
                  </button>
                )}
              </div>
              {analysis.geminiLoading && (
                <ExpertThinkingLoader messages={PALACE_THINKING_MESSAGES} variant="inline" />
              )}
              {analysis.geminiError && (
                <div className="analysis-gemini-error">
                  {analysis.geminiError}
                </div>
              )}
              {analysis.geminiAnalysis && (
                <div className="analysis-gemini-content">
                  {analysis.geminiAnalysis}
                </div>
              )}
            </div>
          )}

          {sortedMatches.length > 0 && (
            <div className="analysis-knowledge">
              <span className="analysis-star-label">📚 Tri thức cổ điển:</span>
              <div className="analysis-knowledge-list">
                {sortedMatches.slice(0, displayCount).map((match, i) => (
                  <KnowledgeItem key={match.interpretation.id || i} match={match} />
                ))}
              </div>
              {hasMore && (
                <button
                  type="button"
                  className="analysis-show-more"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "Thu gọn" : `Xem thêm ${sortedMatches.length - 3} luận giải`}
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

export default function StreamingAnalysis({ chart, isActive, onComplete, userContext }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["menh"]));
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [geminiStates, setGeminiStates] = useState<Map<string, { loading: boolean; analysis?: string; error?: string }>>(new Map());
  const [tongHopState, setTongHopState] = useState<TongHopState>({ loading: false });
  const hasGeminiKey = true; // API key được cấu hình trên Cloudflare server-side

  const baseAnalyses = useMemo(() => {
    if (!chart) return [];
    return PALACE_CONFIG
      .map((config) => analyzePalace(chart, config))
      .filter((a): a is PalaceAnalysis => a !== null);
  }, [chart]);

  // Merge gemini states into analyses
  const analyses = useMemo(() => {
    return baseAnalyses.map((a) => {
      const geminiState = geminiStates.get(a.id);
      return {
        ...a,
        geminiLoading: geminiState?.loading,
        geminiAnalysis: geminiState?.analysis,
        geminiError: geminiState?.error,
      };
    });
  }, [baseAnalyses, geminiStates]);

  // Build data cho tổng hợp Bắc Phái - lấy TẤT CẢ tri thức
  const buildTongHopData = useCallback((): PalaceSummary[] => {
    return baseAnalyses.map((a) => ({
      name: a.name,
      branch: a.branch,
      stem: a.stem,
      majorStars: a.majorStars,
      goodStars: a.goodStars,
      badStars: a.badStars,
      isBodyPalace: a.isBodyPalace,
      knowledgeTexts: a.knowledgeMatches.map((m) => m.interpretation.text),
      phiHoaFlows: a.phiHoa,
    }));
  }, [baseAnalyses]);

  // Request tổng hợp Bắc Phái
  const requestTongHopBacPhai = useCallback(async () => {
    if (tongHopState.loading || tongHopState.analysis) return;

    setTongHopState({ loading: true });

    try {
      const palaces = buildTongHopData();
      const profile = {
        gender: userContext?.gender || (chart.profile as any)?.gender,
        yearToView: userContext?.yearToView,
        menhChu: (chart.profile as any)?.menhChu,
        thanChu: (chart.profile as any)?.thanChu,
        cuc: (chart.profile as any)?.cucElement || (chart.profile as any)?.fiveElementsClass,
      };

      console.log("[Gemini] Calling API...", { palacesCount: palaces.length });
      const response = await callGeminiTongHop({ palaces, profile });
      console.log("[Gemini] Response:", response);

      if (response.success) {
        setTongHopState({ loading: false, analysis: response.analysis });
      } else {
        setTongHopState({ loading: false, error: response.error || "Lỗi không xác định" });
      }
    } catch (error) {
      console.error("[Gemini] Error:", error);
      setTongHopState({ loading: false, error: "Không thể kết nối Gemini" });
    }
  }, [tongHopState, buildTongHopData, userContext, chart.profile]);

  // Request Gemini analysis for a palace
  const requestGeminiAnalysis = useCallback(async (palaceId: string) => {
    const analysis = baseAnalyses.find((a) => a.id === palaceId);
    if (!analysis || analysis.knowledgeMatches.length === 0) return;

    // Set loading state
    setGeminiStates((prev) => {
      const next = new Map(prev);
      next.set(palaceId, { loading: true });
      return next;
    });

    try {
      const response = await callGeminiLuanGiai({
        palaceName: analysis.name,
        palaceInfo: {
          branch: analysis.branch,
          stem: analysis.stem,
          majorStars: analysis.majorStars,
          goodStars: analysis.goodStars,
          badStars: analysis.badStars,
          isBodyPalace: analysis.isBodyPalace,
        },
        knowledgeMatches: analysis.knowledgeMatches,
        userContext,
      });

      setGeminiStates((prev) => {
        const next = new Map(prev);
        if (response.success) {
          next.set(palaceId, { loading: false, analysis: response.analysis });
        } else {
          next.set(palaceId, { loading: false, error: response.error || "Lỗi không xác định" });
        }
        return next;
      });
    } catch (error) {
      setGeminiStates((prev) => {
        const next = new Map(prev);
        next.set(palaceId, { loading: false, error: "Không thể kết nối Gemini" });
        return next;
      });
    }
  }, [baseAnalyses, userContext]);

  useEffect(() => {
    if (!isActive) {
      setIsLoading(true);
      setVisibleCount(0);
      setLoadingProgress(0);
      return;
    }
    
    // Loading progress animation (3 seconds)
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 60);

    // After 3s, start showing palaces one by one
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      clearInterval(progressInterval);
      setLoadingProgress(100);
    }, 3000);

    return () => {
      clearTimeout(loadingTimer);
      clearInterval(progressInterval);
    };
  }, [isActive]);

  // Stream palaces one by one after loading
  useEffect(() => {
    if (isLoading || !isActive) return;
    if (visibleCount >= analyses.length) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setVisibleCount((prev) => prev + 1);
    }, 150); // 150ms delay between each palace

    return () => clearTimeout(timer);
  }, [isLoading, visibleCount, analyses.length, isActive, onComplete]);

  // Removed auto-trigger - chỉ luận khi user bấm nút

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
          <p>Đang phân tích 12 cung trong lá số...</p>
          <span className="analysis-loading-hint">Tra cứu tri thức từ sách cổ</span>
          <div className="analysis-progress">
            <div className="analysis-progress-bar" style={{ width: `${loadingProgress}%` }} />
          </div>
          <span className="analysis-progress-text">{loadingProgress}%</span>
        </div>
      </div>
    );
  }

  const visibleAnalyses = analyses.slice(0, visibleCount);
  const keyPalaceIds = ["menh", "quan_loc", "tai_bach", "phu_the"];
  const keyPalaces = visibleAnalyses.filter((a) => keyPalaceIds.includes(a.id));
  const otherPalaces = visibleAnalyses.filter((a) => !keyPalaceIds.includes(a.id));
  const isStreaming = visibleCount < analyses.length;

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
              onRequestGemini={() => requestGeminiAnalysis(analysis.id)}
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
              onRequestGemini={() => requestGeminiAnalysis(analysis.id)}
            />
          ))}
        </div>
      </div>

      {isStreaming && (
        <div className="analysis-streaming-status">
          <div className="analysis-streaming-spinner" />
          <span>Đang phân tích cung {visibleCount + 1}/12...</span>
        </div>
      )}

      {!isStreaming && (
        <>
          {/* Box Tổng hợp Bắc Phái */}
          {hasGeminiKey && (
            <div className="analysis-section analysis-tonghop">
              <h4 className="analysis-section-title">
                <span className="analysis-section-icon">🔮</span>
                Tổng hợp Bắc Phái - Phi Hóa Can Cung
              </h4>
              


              {!tongHopState.analysis && !tongHopState.loading && !tongHopState.error && (
                <div className="analysis-tonghop-cta">
                  <p>Gemini sẽ tổng hợp toàn bộ tri thức đã match từ 12 cung, luận theo <strong>Bắc Phái</strong> với trọng tâm <strong>Phi Hóa Can Cung</strong>.</p>
                  <button
                    type="button"
                    className="primary-button analysis-tonghop-btn"
                    onClick={requestTongHopBacPhai}
                  >
                    🔮 Luận tổng hợp Bắc Phái
                  </button>
                </div>
              )}

              {tongHopState.loading && (
                <ExpertThinkingLoader messages={EXPERT_THINKING_MESSAGES} />
              )}

              {tongHopState.error && (
                <div className="analysis-tonghop-error">
                  <p>❌ {tongHopState.error}</p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setTongHopState({ loading: false });
                      setTimeout(() => requestTongHopBacPhai(), 100);
                    }}
                  >
                    🔄 Thử lại
                  </button>
                </div>
              )}

              {tongHopState.analysis && (
                <div className="analysis-tonghop-content">
                  {tongHopState.analysis.split("\n").map((line, i) => {
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return <h5 key={i} className="analysis-tonghop-heading">{line.replace(/\*\*/g, "")}</h5>;
                    }
                    if (line.startsWith("- ")) {
                      return <li key={i} className="analysis-tonghop-item">{line.slice(2)}</li>;
                    }
                    if (line.trim()) {
                      return <p key={i}>{line}</p>;
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          )}

          <div className="analysis-footer">
            <p>💡 Nội dung chỉ mang tính tham khảo. Để được luận giải chuyên sâu, vui lòng liên hệ tư vấn.</p>
          </div>
        </>
      )}
    </div>
  );
}
