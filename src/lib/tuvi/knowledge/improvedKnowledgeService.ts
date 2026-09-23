/**
 * Improved Knowledge Service
 * Integrate improved matcher với existing knowledge data
 */

import type { DisplayPalace } from "../config/types";
import {
  queryKnowledge,
  getTopKnowledge,
  extractStarsFromPalace,
  extractMutagensFromPalace,
  normalizePalace,
  type MatchContext,
  type MatchResult,
  type RawBlock,
  type PhiHoaFlow,
} from "./improvedMatcher";

// ============ IMPORTS - Knowledge Data ============

// Consolidated files (main source)
import menhConsolidated from "./cung/menh-consolidated.json";
import phuMauConsolidated from "./cung/phu-mau-consolidated.json";
import phucDucConsolidated from "./cung/phuc-duc-consolidated.json";
import dienTrachConsolidated from "./cung/dien-trach-consolidated.json";
import quanLocConsolidated from "./cung/quan-loc-consolidated.json";
import noBocConsolidated from "./cung/no-boc-consolidated.json";
import thienDiConsolidated from "./cung/thien-di-consolidated.json";
import tatAchConsolidated from "./cung/tat-ach-consolidated.json";
import taiBachConsolidated from "./cung/tai-bach-consolidated.json";
import tuTucConsolidated from "./cung/tu-tuc-consolidated.json";
import phuTheConsolidated from "./cung/phu-the-consolidated.json";
import huynhDeConsolidated from "./cung/huynh-de-consolidated.json";

// Cohoc full files (detailed)
import menhCohocFull from "./cung/menh-cohoc-full.json";
import phuTheCohocFull from "./cung/phu-the-cohoc-full.json";
import quanLocCohocFull from "./cung/quan-loc-cohoc-full.json";
import taiBachCohocFull from "./cung/tai-bach-cohoc-full.json";
import tatAchCohocFull from "./cung/tat-ach-cohoc-full.json";
import phucDucCohocFull from "./cung/phuc-duc-cohoc-full.json";
import thienDiCohocFull from "./cung/thien-di-cohoc-full.json";
import dienTrachCohocFull from "./cung/dien-trach-cohoc-full.json";
import phuMauCohocFull from "./cung/phu-mau-cohoc-full.json";
import huynhDeCohocFull from "./cung/huynh-de-cohoc-full.json";
import noBocCohocFull from "./cung/no-boc-cohoc-full.json";
import tuTucCohocFull from "./cung/tu-tuc-cohoc-full.json";

// Star combinations (highest priority)
import starCombinations from "./cung/star-combinations.json";

// Specialized files
import menhChinhTinh from "./cung/menh-chinh-tinh.json";
import menhPhiHoa from "./cung/menh-phi-hoa.json";

// ============ DATA REGISTRY ============

type KnowledgeFile = {
  palace?: string;
  sections?: Array<{
    blocks?: RawBlock[];
    interpretations?: RawBlock[];
  }>;
  blocks?: RawBlock[];
  interpretations?: RawBlock[];
};

const PALACE_DATA: Record<string, KnowledgeFile[]> = {
  menh: [
    starCombinations as unknown as KnowledgeFile,
    menhCohocFull as unknown as KnowledgeFile,
    menhConsolidated as unknown as KnowledgeFile,
    menhChinhTinh as unknown as KnowledgeFile,
    menhPhiHoa as unknown as KnowledgeFile,
  ],
  phu_mau: [
    starCombinations as unknown as KnowledgeFile,
    phuMauCohocFull as unknown as KnowledgeFile,
    phuMauConsolidated as unknown as KnowledgeFile,
  ],
  phuc_duc: [
    starCombinations as unknown as KnowledgeFile,
    phucDucCohocFull as unknown as KnowledgeFile,
    phucDucConsolidated as unknown as KnowledgeFile,
  ],
  dien_trach: [
    starCombinations as unknown as KnowledgeFile,
    dienTrachCohocFull as unknown as KnowledgeFile,
    dienTrachConsolidated as unknown as KnowledgeFile,
  ],
  quan_loc: [
    starCombinations as unknown as KnowledgeFile,
    quanLocCohocFull as unknown as KnowledgeFile,
    quanLocConsolidated as unknown as KnowledgeFile,
  ],
  no_boc: [
    starCombinations as unknown as KnowledgeFile,
    noBocCohocFull as unknown as KnowledgeFile,
    noBocConsolidated as unknown as KnowledgeFile,
  ],
  thien_di: [
    starCombinations as unknown as KnowledgeFile,
    thienDiCohocFull as unknown as KnowledgeFile,
    thienDiConsolidated as unknown as KnowledgeFile,
  ],
  tat_ach: [
    starCombinations as unknown as KnowledgeFile,
    tatAchCohocFull as unknown as KnowledgeFile,
    tatAchConsolidated as unknown as KnowledgeFile,
  ],
  tai_bach: [
    starCombinations as unknown as KnowledgeFile,
    taiBachCohocFull as unknown as KnowledgeFile,
    taiBachConsolidated as unknown as KnowledgeFile,
  ],
  tu_tuc: [
    starCombinations as unknown as KnowledgeFile,
    tuTucCohocFull as unknown as KnowledgeFile,
    tuTucConsolidated as unknown as KnowledgeFile,
  ],
  phu_the: [
    starCombinations as unknown as KnowledgeFile,
    phuTheCohocFull as unknown as KnowledgeFile,
    phuTheConsolidated as unknown as KnowledgeFile,
  ],
  huynh_de: [
    starCombinations as unknown as KnowledgeFile,
    huynhDeCohocFull as unknown as KnowledgeFile,
    huynhDeConsolidated as unknown as KnowledgeFile,
  ],
};

// ============ EXTRACT BLOCKS ============

function extractBlocks(files: KnowledgeFile[]): RawBlock[] {
  const blocks: RawBlock[] = [];

  for (const file of files) {
    // From sections
    if (file.sections) {
      for (const section of file.sections) {
        if (section.blocks) blocks.push(...section.blocks);
        if (section.interpretations) blocks.push(...section.interpretations);
      }
    }
    // Direct blocks
    if (file.blocks) blocks.push(...file.blocks);
    if (file.interpretations) blocks.push(...file.interpretations);
  }

  return blocks;
}

// ============ BUILD CONTEXT ============

export function buildMatchContext(
  palace: DisplayPalace,
  options?: {
    allPalaces?: DisplayPalace[];
    gender?: "male" | "female";
  }
): MatchContext {
  const starsInPalace = extractStarsFromPalace(palace);
  
  // Extract stars from all palaces if provided
  let starsInChart: string[] = [];
  if (options?.allPalaces) {
    for (const p of options.allPalaces) {
      starsInChart.push(...extractStarsFromPalace(p));
    }
    starsInChart = [...new Set(starsInChart)];
  }

  // Extract phi hoa flows
  const phiHoaFlows = extractPhiHoaFlows(palace);

  // Extract M_CODE from palace if available
  const mCode = (palace as any).mCode;

  return {
    palace,
    starsInPalace,
    starsInChart,
    heavenlyStem: palace.heavenlyStem || "",
    earthlyBranch: palace.earthlyBranch || "",
    phiHoaFlows,
    gender: options?.gender,
    mCode,
  };
}

function extractPhiHoaFlows(palace: DisplayPalace): PhiHoaFlow[] {
  const phiTuHoa = (palace as any).phiTuHoa;
  if (!phiTuHoa?.flows) return [];

  const flows: PhiHoaFlow[] = [];
  
  for (const flow of phiTuHoa.flows) {
    if (flow.targetPalaceName) {
      flows.push({
        type: flow.type,
        sourcePalace: palace.name,
        targetPalace: flow.targetPalaceName,
        starName: flow.starName,
      });
    }
  }

  return flows;
}

// ============ PUBLIC API ============

export type KnowledgeQueryResult = {
  palaceName: string;
  totalBlocks: number;
  matches: MatchResult[];
  topKnowledge: MatchResult[];
};

/**
 * Query knowledge cho một cung với improved matching
 */
export function queryPalaceKnowledgeImproved(
  palace: DisplayPalace,
  options?: {
    allPalaces?: DisplayPalace[];
    gender?: "male" | "female";
    limit?: number;
    minScore?: number;
  }
): KnowledgeQueryResult {
  const palaceId = normalizePalace(palace.name);
  const files = PALACE_DATA[palaceId];

  if (!files || files.length === 0) {
    return {
      palaceName: palace.name,
      totalBlocks: 0,
      matches: [],
      topKnowledge: [],
    };
  }

  const blocks = extractBlocks(files);
  const context = buildMatchContext(palace, options);

  const matches = queryKnowledge(blocks, context, {
    limit: options?.limit || 15,
    minScore: options?.minScore || 10,
  });

  const topKnowledge = getTopKnowledge(blocks, context);

  return {
    palaceName: palace.name,
    totalBlocks: blocks.length,
    matches,
    topKnowledge,
  };
}

/**
 * Check if knowledge data exists for a palace
 */
export function hasImprovedKnowledge(palaceName: string): boolean {
  return normalizePalace(palaceName) in PALACE_DATA;
}

/**
 * Get list of available palaces
 */
export function getAvailablePalacesImproved(): string[] {
  return Object.keys(PALACE_DATA);
}

/**
 * Format match result for display
 */
export function formatMatchResult(result: MatchResult): string {
  const typeLabels: Record<string, string> = {
    star_combination: "🌟 Tổ hợp sao",
    position_stem: "📍 Vị trí cung",
    main_star: "⭐ Chính tinh",
    phi_hoa: "🔄 Phi hóa",
    m_code: "📋 M_CODE",
    minor_star: "✨ Phụ tinh",
    general: "📖 Tổng quan",
  };

  const typeLabel = typeLabels[result.matchType] || result.matchType;
  const reasons = result.matchReasons.join(", ");
  
  return `${typeLabel} (${result.score}đ) - ${reasons}`;
}
