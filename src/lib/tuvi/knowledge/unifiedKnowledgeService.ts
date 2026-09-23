/**
 * Unified Knowledge Service
 * 
 * Gom tất cả knowledge query services thành 1 interface thống nhất.
 * Giữ compatibility với code hiện tại.
 */

import type { DisplayChart, DisplayPalace, DisplayStar, Gender } from "../config/types";
import type { ExpandedPalaceContext, PhiHoaFlow, StarInContext, MutagenInContext } from "../context/contextExpander";
import { expandPalaceContext } from "../context/contextExpander";
import { normalizeLookupKey } from "../utils";

// Import existing services for backward compatibility
import {
  queryPalaceKnowledge as legacyQueryPalaceKnowledge,
  extractStarsFromPalace as legacyExtractStars,
  extractMutagensFromPalace as legacyExtractMutagens,
  extractPhiHoaFlows as legacyExtractPhiHoa,
  hasPalaceKnowledge,
  getAvailablePalaces,
  type KnowledgeMatch,
  type PalaceQueryContext as LegacyPalaceQueryContext,
} from "./knowledgeService";

// ============ TYPES ============

export type KnowledgeType =
  | "star_in_palace"
  | "star_combination"
  | "position_stem"
  | "phi_hoa"
  | "mutagen"
  | "tam_hop"
  | "xung_chieu"
  | "giap_cung"
  | "general";

export type KnowledgeSource = {
  book: string;
  author: string;
  translator?: string | null;
  url?: string;
};

export type KnowledgeResult = {
  id: string;
  type: KnowledgeType;
  text: string;
  score: number;
  matchReasons: string[];
  source: KnowledgeSource;
  relatedStars?: string[];
  relatedPalaces?: string[];
  context?: "self" | "tam_hop" | "xung_chieu" | "giap_cung";
};

export type UnifiedQueryContext = {
  palace: DisplayPalace;
  chart: DisplayChart;
  gender?: Gender;
  expandedContext?: ExpandedPalaceContext;
  options?: QueryOptions;
};

export type QueryOptions = {
  includeTamHop?: boolean;
  includeXungChieu?: boolean;
  includeGiapCung?: boolean;
  includePhiHoa?: boolean;
  maxResults?: number;
  minScore?: number;
};

export type UnifiedQueryResult = {
  palaceName: string;
  palaceIndex: number;
  earthlyBranch: string;
  heavenlyStem?: string;
  
  // Kết quả chính
  results: KnowledgeResult[];
  
  // Kết quả theo nguồn
  selfResults: KnowledgeResult[];
  tamHopResults: KnowledgeResult[];
  xungChieuResults: KnowledgeResult[];
  giapCungResults: KnowledgeResult[];
  phiHoaResults: KnowledgeResult[];
  
  // Metadata
  totalCount: number;
  hasMainStar: boolean;
  isVoChinhDieu: boolean;
  expandedContext: ExpandedPalaceContext;
};

// ============ UNIFIED KNOWLEDGE SERVICE ============

export class UnifiedKnowledgeService {
  private defaultOptions: QueryOptions = {
    includeTamHop: true,
    includeXungChieu: true,
    includeGiapCung: true,
    includePhiHoa: true,
    maxResults: 15,
    minScore: 5,
  };

  /**
   * Query tri thức cho một cung với context mở rộng
   */
  queryPalace(context: UnifiedQueryContext): UnifiedQueryResult {
    const { palace, chart, gender, options } = context;
    const opts = { ...this.defaultOptions, ...options };
    
    // Expand context nếu chưa có
    const expandedContext = context.expandedContext || expandPalaceContext(chart, palace);
    
    // Query từ cung hiện tại (self)
    const selfResults = this.querySelfPalace(palace, expandedContext, gender);
    
    // Query từ tam hợp
    const tamHopResults = opts.includeTamHop
      ? this.queryTamHop(expandedContext, gender)
      : [];
    
    // Query từ xung chiếu
    const xungChieuResults = opts.includeXungChieu
      ? this.queryXungChieu(expandedContext, gender)
      : [];
    
    // Query từ giáp cung
    const giapCungResults = opts.includeGiapCung
      ? this.queryGiapCung(expandedContext, gender)
      : [];
    
    // Query phi hóa
    const phiHoaResults = opts.includePhiHoa
      ? this.queryPhiHoa(expandedContext)
      : [];
    
    // Gộp và sắp xếp kết quả
    const allResults = [
      ...selfResults,
      ...tamHopResults,
      ...xungChieuResults,
      ...giapCungResults,
      ...phiHoaResults,
    ];
    
    // Filter by minScore và sort
    const filteredResults = allResults
      .filter(r => r.score >= (opts.minScore || 0))
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.maxResults);
    
    return {
      palaceName: palace.name,
      palaceIndex: palace.index,
      earthlyBranch: expandedContext.earthlyBranch,
      heavenlyStem: expandedContext.heavenlyStem,
      results: filteredResults,
      selfResults,
      tamHopResults,
      xungChieuResults,
      giapCungResults,
      phiHoaResults,
      totalCount: filteredResults.length,
      hasMainStar: expandedContext.hasMainStar,
      isVoChinhDieu: expandedContext.isVoChinhDieu,
      expandedContext,
    };
  }

  /**
   * Query tri thức từ cung hiện tại
   */
  private querySelfPalace(
    palace: DisplayPalace,
    expandedContext: ExpandedPalaceContext,
    gender?: Gender
  ): KnowledgeResult[] {
    // Sử dụng legacy service để giữ compatibility
    const legacyContext: LegacyPalaceQueryContext = {
      palace,
      starsInPalace: expandedContext.starsInPalace,
      branch: expandedContext.earthlyBranch,
      heavenlyStem: expandedContext.heavenlyStem,
      mutagensInPalace: expandedContext.mutagensInPalace.map(m => m.type.toLowerCase()),
      phiHoaFlows: expandedContext.phiHoaOutgoing.map(f => ({
        type: f.type,
        typeLabel: f.typeLabel,
        sourcePalace: f.sourcePalace,
        targetPalace: f.targetPalace,
        targetPalaceName: f.targetPalace,
      })),
    };
    
    const legacyResults = legacyQueryPalaceKnowledge(legacyContext);
    
    return legacyResults.map(r => this.convertLegacyResult(r, "self"));
  }

  /**
   * Query tri thức từ tam hợp
   */
  private queryTamHop(
    expandedContext: ExpandedPalaceContext,
    gender?: Gender
  ): KnowledgeResult[] {
    const results: KnowledgeResult[] = [];
    
    // Tạo kết quả cho các sao tam hợp quan trọng
    const mainStarsInTamHop = expandedContext.starsInTamHop.filter(s => 
      this.isMainStar(s.name)
    );
    
    for (const star of mainStarsInTamHop) {
      results.push({
        id: `tam_hop_${star.name}_${star.sourcePalace}`,
        type: "tam_hop",
        text: `${star.name} tại ${star.sourcePalace} (tam hợp) hội chiếu cung ${expandedContext.palaceName}.`,
        score: 25,
        matchReasons: [`${star.name} tam hợp từ ${star.sourcePalace}`],
        source: { book: "Tam hợp analysis", author: "System" },
        relatedStars: [star.name],
        relatedPalaces: [star.sourcePalace],
        context: "tam_hop",
      });
    }
    
    // Tứ Hóa từ tam hợp
    const mutagensInTamHop = expandedContext.mutagensInContext.filter(m => m.source === "tam_hop");
    for (const mutagen of mutagensInTamHop) {
      results.push({
        id: `tam_hop_mutagen_${mutagen.type}_${mutagen.sourcePalace}`,
        type: "mutagen",
        text: `${mutagen.starName} Hóa ${mutagen.type} tại ${mutagen.sourcePalace} (tam hợp) ảnh hưởng cung ${expandedContext.palaceName}.`,
        score: 30,
        matchReasons: [`Hóa ${mutagen.type} tam hợp từ ${mutagen.sourcePalace}`],
        source: { book: "Tứ Hóa tam hợp", author: "System" },
        relatedStars: [mutagen.starName],
        relatedPalaces: [mutagen.sourcePalace],
        context: "tam_hop",
      });
    }
    
    return results;
  }

  /**
   * Query tri thức từ xung chiếu
   */
  private queryXungChieu(
    expandedContext: ExpandedPalaceContext,
    gender?: Gender
  ): KnowledgeResult[] {
    const results: KnowledgeResult[] = [];
    
    if (!expandedContext.xungChieuPalace) return results;
    
    const xungPalace = expandedContext.xungChieuPalace.palace;
    
    // Chính tinh xung chiếu
    const mainStarsInXung = expandedContext.starsInXungChieu.filter(s =>
      this.isMainStar(s.name)
    );
    
    for (const star of mainStarsInXung) {
      results.push({
        id: `xung_chieu_${star.name}`,
        type: "xung_chieu",
        text: `${star.name} tại ${xungPalace.name} xung chiếu cung ${expandedContext.palaceName}.`,
        score: 20,
        matchReasons: [`${star.name} xung chiếu từ ${xungPalace.name}`],
        source: { book: "Xung chiếu analysis", author: "System" },
        relatedStars: [star.name],
        relatedPalaces: [xungPalace.name],
        context: "xung_chieu",
      });
    }
    
    // Tứ Hóa xung chiếu
    const mutagensInXung = expandedContext.mutagensInContext.filter(m => m.source === "xung_chieu");
    for (const mutagen of mutagensInXung) {
      results.push({
        id: `xung_chieu_mutagen_${mutagen.type}`,
        type: "mutagen",
        text: `${mutagen.starName} Hóa ${mutagen.type} tại ${xungPalace.name} xung chiếu cung ${expandedContext.palaceName}.`,
        score: 28,
        matchReasons: [`Hóa ${mutagen.type} xung chiếu từ ${xungPalace.name}`],
        source: { book: "Tứ Hóa xung chiếu", author: "System" },
        relatedStars: [mutagen.starName],
        relatedPalaces: [xungPalace.name],
        context: "xung_chieu",
      });
    }
    
    return results;
  }

  /**
   * Query tri thức từ giáp cung
   */
  private queryGiapCung(
    expandedContext: ExpandedPalaceContext,
    gender?: Gender
  ): KnowledgeResult[] {
    const results: KnowledgeResult[] = [];
    
    // Sao giáp cung quan trọng
    const importantGiapStars = expandedContext.starsInGiapCung.filter(s =>
      this.isImportantGiapStar(s.name)
    );
    
    for (const star of importantGiapStars) {
      results.push({
        id: `giap_cung_${star.name}_${star.sourcePalace}`,
        type: "giap_cung",
        text: `${star.name} tại ${star.sourcePalace} giáp cung ${expandedContext.palaceName}.`,
        score: 15,
        matchReasons: [`${star.name} giáp từ ${star.sourcePalace}`],
        source: { book: "Giáp cung analysis", author: "System" },
        relatedStars: [star.name],
        relatedPalaces: [star.sourcePalace],
        context: "giap_cung",
      });
    }
    
    return results;
  }

  /**
   * Query tri thức phi hóa
   */
  private queryPhiHoa(expandedContext: ExpandedPalaceContext): KnowledgeResult[] {
    const results: KnowledgeResult[] = [];
    
    // Phi Hóa outgoing
    for (const flow of expandedContext.phiHoaOutgoing) {
      if (flow.relation === "missing_star") continue;
      
      results.push({
        id: `phi_hoa_out_${flow.type}_${flow.targetPalace}`,
        type: "phi_hoa",
        text: `${expandedContext.palaceName} phi ${flow.typeLabel} nhập ${flow.targetPalace} (tại ${flow.targetStar}).`,
        score: flow.relation === "tu_hoa" ? 35 : 40,
        matchReasons: [
          flow.relation === "tu_hoa"
            ? `Tự ${flow.typeLabel}`
            : `Phi ${flow.typeLabel} nhập ${flow.targetPalace}`
        ],
        source: { book: "Phi Hóa analysis", author: "System" },
        relatedStars: [flow.targetStar],
        relatedPalaces: [flow.targetPalace],
      });
    }
    
    // Phi Hóa incoming
    for (const flow of expandedContext.phiHoaIncoming) {
      results.push({
        id: `phi_hoa_in_${flow.type}_${flow.sourcePalace}`,
        type: "phi_hoa",
        text: `${flow.sourcePalace} phi ${flow.typeLabel} nhập ${expandedContext.palaceName} (tại ${flow.targetStar}).`,
        score: 45,
        matchReasons: [`Nhận ${flow.typeLabel} từ ${flow.sourcePalace}`],
        source: { book: "Phi Hóa analysis", author: "System" },
        relatedStars: [flow.targetStar],
        relatedPalaces: [flow.sourcePalace],
      });
    }
    
    return results;
  }

  /**
   * Convert legacy KnowledgeMatch to KnowledgeResult
   */
  private convertLegacyResult(
    match: KnowledgeMatch,
    context: KnowledgeResult["context"]
  ): KnowledgeResult {
    return {
      id: match.interpretation.id,
      type: this.mapLegacyType(match.interpretation.type),
      text: match.interpretation.text,
      score: match.matchScore,
      matchReasons: match.matchReasons,
      source: match.interpretation.source,
      context,
    };
  }

  private mapLegacyType(type: string): KnowledgeType {
    const mapping: Record<string, KnowledgeType> = {
      star_in_palace: "star_in_palace",
      star_combination: "star_combination",
      heavenly_stem: "position_stem",
      position: "position_stem",
      mutagen_in_palace: "mutagen",
      mutagen_combination: "mutagen",
      phi_hoa: "phi_hoa",
      phi_loc: "phi_hoa",
      phi_quyen: "phi_hoa",
      phi_khoa: "phi_hoa",
      phi_ky: "phi_hoa",
    };
    return mapping[type] || "general";
  }

  private isMainStar(name: string): boolean {
    const mainStars = new Set([
      "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh",
      "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương",
      "Thất Sát", "Phá Quân"
    ]);
    return mainStars.has(name);
  }

  private isImportantGiapStar(name: string): boolean {
    const importantStars = new Set([
      // Lục cát
      "Tả Phù", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt",
      // Lục sát
      "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp",
      // Lộc Mã
      "Lộc Tồn", "Thiên Mã",
    ]);
    return importantStars.has(name);
  }

  // ============ BACKWARD COMPATIBILITY ============

  /**
   * Legacy API - giữ compatibility với code cũ
   */
  queryPalaceKnowledgeLegacy(context: LegacyPalaceQueryContext): KnowledgeMatch[] {
    return legacyQueryPalaceKnowledge(context);
  }

  hasPalaceKnowledge(palaceName: string): boolean {
    return hasPalaceKnowledge(palaceName);
  }

  getAvailablePalaces(): string[] {
    return getAvailablePalaces();
  }
}

// ============ SINGLETON INSTANCE ============

export const unifiedKnowledgeService = new UnifiedKnowledgeService();

// ============ CONVENIENCE FUNCTIONS ============

/**
 * Query tri thức cho một cung (convenience function)
 */
export function queryPalaceKnowledgeUnified(
  chart: DisplayChart,
  palace: DisplayPalace,
  options?: QueryOptions
): UnifiedQueryResult {
  return unifiedKnowledgeService.queryPalace({
    palace,
    chart,
    options,
  });
}

/**
 * Query tri thức cho tất cả 12 cung
 */
export function queryAllPalacesKnowledge(
  chart: DisplayChart,
  options?: QueryOptions
): Map<number, UnifiedQueryResult> {
  const results = new Map<number, UnifiedQueryResult>();
  
  for (const palace of chart.palaces) {
    results.set(palace.index, queryPalaceKnowledgeUnified(chart, palace, options));
  }
  
  return results;
}
