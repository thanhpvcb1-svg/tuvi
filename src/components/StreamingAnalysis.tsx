import React, { useEffect, useState, useMemo, useCallback } from "react";
import type { ChartView, PalaceView } from "../lib/types";
import TuviChatbot from "./TuviChatbot";
import { findPalace, getPalaceMeaning } from "../lib/chartUi";
import {
  queryPalaceKnowledge,
  extractStarsFromPalace,
  extractMutagensFromPalace,
  extractPhiHoaFlows,
  isKnowledgeReady,
  loadKnowledge,
  type KnowledgeMatch,
} from "../lib/tuvi/knowledge/lazyKnowledgeService";
import { callGeminiLuanGiai, callGeminiTongHop, formatKnowledgeForAi, type PalaceSummary } from "../lib/geminiService";
import { getActivePalaceIndexes } from "./VanHanhSelector";
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
  /** Cấu trúc Bắc phái của cung - gửi kèm cho AI để không phải tự suy ra. */
  tamPhuong: string[];
  xungChieu: string;
  giapCung: string[];
  daiVan: string;
  vanNamXem: string[];
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
    birthYear?: number;
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
  "Đang truy vấn kho tri thức...",
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
  "Đang tra cứu kho tri thức...",
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

// Tên sao kèm độ sáng và Tứ Hóa sinh niên, vd "Thiên Đồng(V) hóa Kỵ".
function getStarDisplay(star: { name: string; display?: string; mutagen?: string }) {
  const label = star.display || star.name;
  return star.mutagen ? `${label} hóa ${star.mutagen}` : label;
}

const BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

// decadalRange là tuổi bắt đầu đại vận dạng chuỗi ("5", "15"...) -> "5-14 tuổi".
function formatDaiVan(decadalRange: unknown): string {
  const start = Number(decadalRange);
  return Number.isFinite(start) && start > 0 ? `${start}-${start + 9} tuổi` : "";
}

// Tam phương tứ chính, xung chiếu, giáp cung theo địa chi - chỉ đọc lá số, không tính lại sao.
function getPalaceStructure(chart: ChartView, palace: PalaceView) {
  const index = BRANCHES.indexOf(palace.earthlyBranch ?? "");
  const at = (offset: number) => chart.palaces.find((p) => p.earthlyBranch === BRANCHES[(index + offset + 12) % 12])?.name ?? "";
  return {
    tamPhuong: [at(4), at(8)].filter(Boolean),
    xungChieu: at(6),
    giapCung: [at(-1), at(1)].filter(Boolean),
  };
}

function getPhiHoaFlows(palace: PalaceView): string[] {
  const results: string[] = [];
  const phiTuHoa = (palace as any).phiTuHoa;

  if (phiTuHoa?.flows) {
    for (const flow of phiTuHoa.flows) {
      if (flow.targetPalaceName) {
        const label = flow.typeLabel || flow.type;
        results.push(flow.relation === "tu_hoa" ? `Tự ${label}` : `${label} → ${flow.targetPalaceName}`);
      }
    }
  }
  return results;
}

// Luận giải nguyên cục: chỉ lấy sao gốc, không lẫn sao lưu niên/đại vận đang bật trên lá số.
const isNatalStar = (star: { scope?: string }) => !star.scope || star.scope === "origin";

function analyzePalace(
  chart: ChartView,
  config: { id: string; name: string; icon: string },
  active: { daiVan?: number; tieuVan?: number },
  years: { yearToView?: number; birthYear?: number },
): PalaceAnalysis | null {
  const palace = findPalace(chart, config.name);
  if (!palace) return null;

  // Build context for knowledge query
  const displayPalace = palace as unknown as DisplayPalace;
  const starsInPalace = extractStarsFromPalace(displayPalace);
  const mutagensInPalace = extractMutagensFromPalace(displayPalace);
  const phiHoaFlows = extractPhiHoaFlows(displayPalace);
  // heavenlyStem của palace là chữ viết tắt ("M", "K"...); palaceStemMap giữ tên Can đầy đủ.
  const stem = (palace.earthlyBranch && (chart as any).palaceStemMap?.[palace.earthlyBranch]) || (palace as any).heavenlyStem || "";

  const knowledgeMatches = queryPalaceKnowledge({
    chart,
    yearToView: years.yearToView,
    birthYear: years.birthYear,
    palace: displayPalace,
    starsInPalace,
    branch: palace.earthlyBranch || "",
    heavenlyStem: stem,
    mutagensInPalace,
    phiHoaFlows,
  });

  return {
    id: config.id,
    name: config.name,
    icon: config.icon,
    branch: palace.earthlyBranch || "",
    stem,
    majorStars: palace.majorStars?.filter(isNatalStar).map(getStarDisplay).filter(Boolean) || [],
    goodStars: palace.goodStars?.filter(isNatalStar).slice(0, 4).map(getStarDisplay).filter(Boolean) || [],
    badStars: palace.badStars?.filter(isNatalStar).slice(0, 3).map(getStarDisplay).filter(Boolean) || [],
    meaning: getPalaceMeaning(config.name),
    phiHoa: getPhiHoaFlows(palace),
    isBodyPalace: palace.isBodyPalace || false,
    ...getPalaceStructure(chart, palace),
    daiVan: formatDaiVan((palace as any).decadalRange),
    vanNamXem: [
      active.daiVan === palace.index ? "Đại vận năm xem" : "",
      active.tieuVan === palace.index ? "Tiểu vận năm xem" : "",
    ].filter(Boolean),
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

function PalaceCard({ analysis, isExpanded, onToggle, onRequestGemini, yearToView }: {
  analysis: PalaceAnalysis;
  isExpanded: boolean;
  onToggle: () => void;
  onRequestGemini?: () => void;
  yearToView?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const [showAiResult, setShowAiResult] = useState(false);
  // Tri thức lá số gốc và tri thức vận hạn năm xem hiển thị thành hai nhóm.
  const sortedMatches = useMemo(
    () => sortKnowledgeByPriority(analysis.knowledgeMatches.filter((m) => m.interpretation.type !== "period")),
    [analysis.knowledgeMatches],
  );
  const periodMatches = useMemo(
    () => analysis.knowledgeMatches.filter((m) => m.interpretation.type === "period"),
    [analysis.knowledgeMatches],
  );
  const displayCount = showAll ? sortedMatches.length : 3;
  const hasMore = sortedMatches.length > 3;
  const knowledgeCount = analysis.knowledgeMatches.length;
  const hasGeminiKey = true;

  // Khi có kết quả AI thì tự động show
  useEffect(() => {
    if (analysis.geminiAnalysis) setShowAiResult(true);
  }, [analysis.geminiAnalysis]);

  const handleRequestAi = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (analysis.geminiAnalysis) {
      // Đã có kết quả -> toggle hiển thị
      setShowAiResult(!showAiResult);
    } else {
      // Chưa có -> gọi API
      setShowAiResult(true);
      onRequestGemini?.();
    }
  };

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

          {/* AI Button - compact (vẫn luận được bằng dữ liệu cung khi không có tri thức khớp) */}
          {hasGeminiKey && (
            <div className="analysis-ai-compact">
              <button
                type="button"
                className={`analysis-ai-btn ${analysis.geminiAnalysis ? "has-result" : ""} ${analysis.geminiLoading ? "is-loading" : ""}`}
                onClick={handleRequestAi}
                disabled={analysis.geminiLoading}
              >
                {analysis.geminiLoading ? (
                  <>⏳ Đang phân tích...</>
                ) : analysis.geminiAnalysis ? (
                  <>{showAiResult ? "📖 Ẩn giải nghĩa" : "📖 Xem giải nghĩa chi tiết"}</>
                ) : (
                  <>📖 Giải nghĩa chi tiết</>
                )}
              </button>
              
              {/* AI Result - chỉ show khi có và được bật */}
              {showAiResult && (
                <>
                  {analysis.geminiLoading && (
                    <ExpertThinkingLoader messages={PALACE_THINKING_MESSAGES} variant="inline" />
                  )}
                  {analysis.geminiError && (
                    <div className="analysis-gemini-error">{analysis.geminiError}</div>
                  )}
                  {analysis.geminiAnalysis && (
                    <div className="analysis-gemini-content">{analysis.geminiAnalysis}</div>
                  )}
                </>
              )}
            </div>
          )}

          {sortedMatches.length > 0 && (
            <div className="analysis-knowledge">
              <span className="analysis-star-label">📚 Tri thức khớp với lá số:</span>
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

          {periodMatches.length > 0 && (
            <div className="analysis-knowledge analysis-knowledge--period">
              <span className="analysis-star-label">
                🗓 Vận hạn năm {yearToView}
                {analysis.vanNamXem.length ? ` (${analysis.vanNamXem.join(", ").toLowerCase()})` : ""}:
              </span>
              <div className="analysis-knowledge-list">
                {periodMatches.map((match, i) => (
                  <KnowledgeItem key={match.interpretation.id || i} match={match} />
                ))}
              </div>
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
  const [knowledgeLoaded, setKnowledgeLoaded] = useState(isKnowledgeReady());
  const hasGeminiKey = true; // API key được cấu hình trên Cloudflare server-side

  // Load knowledge khi component active
  useEffect(() => {
    if (!isActive) return;
    if (isKnowledgeReady()) {
      setKnowledgeLoaded(true);
      return;
    }
    
    loadKnowledge().then(() => {
      setKnowledgeLoaded(true);
    }).catch((err) => {
      console.error("[StreamingAnalysis] Failed to load knowledge:", err);
    });
  }, [isActive]);

  const baseAnalyses = useMemo(() => {
    if (!chart || !knowledgeLoaded) return [];
    // Cung đại vận / tiểu vận của năm xem (cùng hàm với thanh chọn năm trên lá số).
    const age = userContext?.yearToView && userContext?.birthYear ? userContext.yearToView - userContext.birthYear : undefined;
    const menhBranch = chart.palaces.find((p) => p.name === "Mệnh")?.earthlyBranch;
    const active = age !== undefined
      ? getActivePalaceIndexes(chart.palaces, age, menhBranch, chart.profile.fiveElementsClass, chart.profile.yinYangLabel)
      : {};
    return PALACE_CONFIG
      .map((config) => analyzePalace(chart, config, active, { yearToView: userContext?.yearToView, birthYear: userContext?.birthYear }))
      .filter((a): a is PalaceAnalysis => a !== null);
  }, [chart, knowledgeLoaded, userContext?.yearToView, userContext?.birthYear]);

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

  // Build data cho tổng hợp Bắc Phái
  const buildTongHopData = useCallback((): PalaceSummary[] => {
    return baseAnalyses.map((a) => ({
      name: a.name,
      branch: a.branch,
      stem: a.stem,
      majorStars: a.majorStars,
      goodStars: a.goodStars,
      badStars: a.badStars,
      isBodyPalace: a.isBodyPalace,
      tamPhuong: a.tamPhuong,
      xungChieu: a.xungChieu,
      giapCung: a.giapCung,
      daiVan: a.daiVan,
      vanNamXem: a.vanNamXem,
      // Server chỉ dùng 10 mục đầu mỗi cung (đã xếp theo độ khớp) - không gửi thừa.
      knowledgeTexts: a.knowledgeMatches.slice(0, 10).map(formatKnowledgeForAi),
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
        birthYear: userContext?.birthYear,
        // profile.soul / profile.body là Mệnh chủ / Thân chủ (menhChu/thanChu không tồn tại trên profile).
        menhChu: (chart.profile as any)?.soul,
        thanChu: (chart.profile as any)?.body,
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
      setTongHopState({ loading: false, error: "Không thể kết nối dịch vụ AI" });
    }
  }, [tongHopState, buildTongHopData, userContext, chart.profile]);

  // Request Gemini analysis for a palace
  const requestGeminiAnalysis = useCallback(async (palaceId: string) => {
    const analysis = baseAnalyses.find((a) => a.id === palaceId);
    if (!analysis) return;

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
          tamPhuong: analysis.tamPhuong,
          xungChieu: analysis.xungChieu,
          giapCung: analysis.giapCung,
          daiVan: analysis.daiVan,
          vanNamXem: analysis.vanNamXem,
          phiHoaFlows: analysis.phiHoa,
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
        next.set(palaceId, { loading: false, error: "Không thể kết nối dịch vụ AI" });
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
          <span className="analysis-loading-hint">Đối chiếu kho tri thức với lá số</span>
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
              yearToView={userContext?.yearToView}
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
              yearToView={userContext?.yearToView}
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
                  <p>AI sẽ tổng hợp các đoạn tri thức đã khớp ở 12 cung cùng dữ liệu lá số, luận theo <strong>Bắc Phái</strong> với trọng tâm <strong>Phi Hóa Can Cung</strong>, và ghi rõ phần thiếu dữ liệu.</p>
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

          {/* Chatbot hỏi đáp */}
          <TuviChatbot
            chart={chart}
            isVisible={true}
            userContext={userContext}
          />
        </>
      )}
    </div>
  );
}
