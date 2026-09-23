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

const PALACE_CONFIG: Array<{ id: string; name: string; icon: string }> = [
  { id: "menh", name: "Má»‡nh", icon: "ðŸ‘¤" },
  { id: "phu_mau", name: "Phá»¥ Máº«u", icon: "ðŸ‘¨â€ðŸ‘©â€ðŸ‘§" },
  { id: "phuc_duc", name: "PhÃºc Äá»©c", icon: "ðŸ€" },
  { id: "dien_trach", name: "Äiá»n Tráº¡ch", icon: "ðŸ " },
  { id: "quan_loc", name: "Quan Lá»™c", icon: "ðŸ’¼" },
  { id: "no_boc", name: "NÃ´ Bá»™c", icon: "ðŸ¤" },
  { id: "thien_di", name: "ThiÃªn Di", icon: "âœˆï¸" },
  { id: "tat_ach", name: "Táº­t Ãch", icon: "ðŸ’Š" },
  { id: "tai_bach", name: "TÃ i Báº¡ch", icon: "ðŸ’°" },
  { id: "tu_tuc", name: "Tá»­ Tá»©c", icon: "ðŸ‘¶" },
  { id: "phu_the", name: "Phu ThÃª", icon: "ðŸ’‘" },
  { id: "huynh_de", name: "Huynh Äá»‡", icon: "ðŸ‘¥" },
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
        results.push(`${label} â†’ ${flow.targetPalaceName}`);
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

// Sáº¯p xáº¿p knowledge: vá»‹ trÃ­ cung > sao Ä‘á»“ng cung > tá»© hÃ³a > phi hÃ³a
function sortKnowledgeByPriority(matches: KnowledgeMatch[]): KnowledgeMatch[] {
  return [...matches].sort((a, b) => {
    const getTypePriority = (type: string) => {
      // Æ¯u tiÃªn 1: Vá»‹ trÃ­ cung, can cung
      if (type === "position" || type === "heavenly_stem") return 1;
      // Æ¯u tiÃªn 2: Sao trong cung, sao Ä‘á»“ng cung, cÃ¡ch cá»¥c
      if (type === "star_in_palace" || type === "star_combination" || type === "cach_cuc") return 2;
      // Æ¯u tiÃªn 3: Tá»© hÃ³a tá»a thá»§
      if (type === "mutagen_in_palace" || type === "mutagen_combination") return 3;
      // Æ¯u tiÃªn 4: Phi hÃ³a
      if (type.startsWith("phi_")) return 4;
      // Æ¯u tiÃªn 5: KhÃ¡c
      return 5;
    };
    const priorityA = getTypePriority(a.interpretation.type);
    const priorityB = getTypePriority(b.interpretation.type);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return b.matchScore - a.matchScore; // CÃ¹ng loáº¡i thÃ¬ theo score
  });
}

function KnowledgeItem({ match }: { match: KnowledgeMatch }) {
  return (
    <div className="analysis-knowledge-item">
      <p className="analysis-knowledge-text">{match.interpretation.text}</p>
      <div className="analysis-knowledge-meta">
        <span className="analysis-knowledge-reasons">
          {match.matchReasons.join(" Â· ")}
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
  // API key Ä‘Æ°á»£c cáº¥u hÃ¬nh trÃªn Cloudflare server-side
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
                <span className="analysis-knowledge-badge" title={`${knowledgeCount} luáº­n giáº£i`}>
                  {knowledgeCount}
                </span>
              )}
            </strong>
            {analysis.isBodyPalace && <span className="analysis-body-badge">ThÃ¢n</span>}
            <span className="analysis-palace-position">{analysis.branch} Â· {analysis.stem}</span>
          </div>
        </div>
        <div className="analysis-palace-preview">
          {analysis.majorStars.length > 0 && (
            <span className="analysis-star-preview">{analysis.majorStars.join(", ")}</span>
          )}
          <span className={`analysis-toggle-icon ${isExpanded ? "is-open" : ""}`}>â–¼</span>
        </div>
      </button>

      {isExpanded && (
        <div className="analysis-palace-content">
          <p className="analysis-palace-meaning">{analysis.meaning}</p>

          {/* Gemini AI Analysis Section */}
          {hasGeminiKey && sortedMatches.length > 0 && (
            <div className="analysis-gemini">
              <div className="analysis-gemini-header">
                <span className="analysis-star-label">ðŸ¤– AI Luáº­n giáº£i:</span>
                {!analysis.geminiAnalysis && !analysis.geminiLoading && (
                  <button
                    type="button"
                    className="analysis-gemini-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestGemini?.();
                    }}
                  >
                    Luáº­n báº±ng AI
                  </button>
                )}
              </div>
              {analysis.geminiLoading && (
                <div className="analysis-gemini-loading">
                  <span className="analysis-gemini-spinner" />
                  Äang luáº­n giáº£i...
                </div>
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
              <span className="analysis-star-label">ðŸ“š Tri thá»©c cá»• Ä‘iá»ƒn:</span>
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
                  {showAll ? "Thu gá»n" : `Xem thÃªm ${sortedMatches.length - 3} luáº­n giáº£i`}
                </button>
              )}
            </div>
          )}

          {analysis.phiHoa.length > 0 && (
            <div className="analysis-phi-hoa">
              <span className="analysis-star-label">Phi HÃ³a:</span>
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

// API key Ä‘Æ°á»£c cáº¥u hÃ¬nh trÃªn Cloudflare server-side

export default function StreamingAnalysis({ chart, isActive, onComplete, userContext }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["menh"]));
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [geminiStates, setGeminiStates] = useState<Map<string, { loading: boolean; analysis?: string; error?: string }>>(new Map());
  const [tongHopState, setTongHopState] = useState<TongHopState>({ loading: false });

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

  // Build data cho tá»•ng há»£p Báº¯c PhÃ¡i - láº¥y Táº¤T Cáº¢ tri thá»©c
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

  // Request tá»•ng há»£p Báº¯c PhÃ¡i
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
        setTongHopState({ loading: false, error: response.error || "Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh" });
      }
    } catch (error) {
      console.error("[Gemini] Error:", error);
      setTongHopState({ loading: false, error: "KhÃ´ng thá»ƒ káº¿t ná»‘i Gemini" });
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
          next.set(palaceId, { loading: false, error: response.error || "Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh" });
        }
        return next;
      });
    } catch (error) {
      setGeminiStates((prev) => {
        const next = new Map(prev);
        next.set(palaceId, { loading: false, error: "KhÃ´ng thá»ƒ káº¿t ná»‘i Gemini" });
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

  // Auto-trigger Gemini tá»•ng há»£p khi streaming hoÃ n táº¥t
  useEffect(() => {
    const isStreaming = visibleCount < analyses.length;
    // Chá»‰ auto-call khi Ä‘Ã£ deploy (khÃ´ng pháº£i localhost)
    const isProduction = !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1");
    if (isProduction && !isStreaming && visibleCount > 0 && !tongHopState.loading && !tongHopState.analysis && !tongHopState.error) {
      requestTongHopBacPhai();
    }
  }, [visibleCount, analyses.length, tongHopState, requestTongHopBacPhai]);

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
          <p>Äang phÃ¢n tÃ­ch 12 cung trong lÃ¡ sá»‘...</p>
          <span className="analysis-loading-hint">Tra cá»©u tri thá»©c tá»« sÃ¡ch cá»•</span>
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
          <h3>ðŸ“– Luáº­n giáº£i 12 cung</h3>
          <p>PhÃ¢n tÃ­ch chi tiáº¿t tá»«ng cung trong lÃ¡ sá»‘ cá»§a báº¡n</p>
        </div>
        <div className="analysis-header-actions">
          <button type="button" className="analysis-action-btn" onClick={expandAll}>Má»Ÿ táº¥t cáº£</button>
          <button type="button" className="analysis-action-btn" onClick={collapseAll}>Thu gá»n</button>
        </div>
      </div>

      <div className="analysis-section">
        <h4 className="analysis-section-title">
          <span className="analysis-section-icon">â­</span>
          CÃ¡c cung trá»ng tÃ¢m
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
          <span className="analysis-section-icon">ðŸ“‹</span>
          CÃ¡c cung khÃ¡c
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
          <span>Äang phÃ¢n tÃ­ch cung {visibleCount + 1}/12...</span>
        </div>
      )}

      {!isStreaming && (
        <>
          {/* Box Tá»•ng há»£p Báº¯c PhÃ¡i */}
          {hasGeminiKey && (
            <div className="analysis-section analysis-tonghop">
              <h4 className="analysis-section-title">
                <span className="analysis-section-icon">ðŸ”®</span>
                Tá»•ng há»£p Báº¯c PhÃ¡i - Phi HÃ³a Can Cung
              </h4>
              


              {!tongHopState.analysis && !tongHopState.loading && !tongHopState.error && (
                <div className="analysis-tonghop-cta">
                  <p>Gemini sáº½ tá»•ng há»£p toÃ n bá»™ tri thá»©c Ä‘Ã£ match tá»« 12 cung, luáº­n theo <strong>Báº¯c PhÃ¡i</strong> vá»›i trá»ng tÃ¢m <strong>Phi HÃ³a Can Cung</strong>.</p>
                  <button
                    type="button"
                    className="primary-button analysis-tonghop-btn"
                    onClick={requestTongHopBacPhai}
                  >
                    ðŸ”® Luáº­n tá»•ng há»£p Báº¯c PhÃ¡i
                  </button>
                </div>
              )}

              {tongHopState.loading && (
                <div className="analysis-tonghop-loading">
                  <div className="analysis-loading-spinner" />
                  <p>Äang tá»•ng há»£p vÃ  luáº­n giáº£i theo Báº¯c PhÃ¡i...</p>
                  <span className="analysis-loading-hint">PhÃ¢n tÃ­ch Phi HÃ³a Can Cung: Lá»™c/Quyá»n/Khoa/Ká»µ nháº­p</span>
                </div>
              )}

              {tongHopState.error && (
                <div className="analysis-tonghop-error">
                  <p>âŒ {tongHopState.error}</p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setTongHopState({ loading: false });
                      setTimeout(() => requestTongHopBacPhai(), 100);
                    }}
                  >
                    ðŸ”„ Thá»­ láº¡i
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
            <p>ðŸ’¡ Ná»™i dung chá»‰ mang tÃ­nh tham kháº£o. Äá»ƒ Ä‘Æ°á»£c luáº­n giáº£i chuyÃªn sÃ¢u, vui lÃ²ng liÃªn há»‡ tÆ° váº¥n.</p>
          </div>
        </>
      )}
    </div>
  );
}

// API key Ä‘Æ°á»£c cáº¥u hÃ¬nh trÃªn Cloudflare server-side
