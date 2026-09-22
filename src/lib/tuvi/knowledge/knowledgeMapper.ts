/**
 * Knowledge Mapper
 * Map tri thức từ file cổ học với JSON lá số để tìm ra đúng tri thức cần áp dụng
 */

import type { DisplayChart, DisplayPalace, DisplayStar } from "../config/types";
import type { 
  KnowledgeFile, 
  KnowledgeInterpretation, 
  KnowledgeMatch,
  PhiHoaFlow,
} from "./knowledgeService";

// ============ TYPES ============

export type ChartContext = {
  chart: DisplayChart;
  selectedPalace?: string;
};

export type PalaceMappingContext = {
  palace: DisplayPalace;
  palaceId: string;
  branch: string;
  heavenlyStem: string;
  starsInPalace: string[];
  mutagensInPalace: string[];
  phiHoaFlows: PhiHoaFlow[];
  mCodes: string[];
  cungKhi?: string;
  xiHoa?: number;
};

export type MappingResult = {
  palace: string;
  palaceName: string;
  matches: KnowledgeMatch[];
  totalMatches: number;
};

// ============ NORMALIZATION ============

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "_")
    .trim();
}

function normalizePalaceId(name: string): string {
  const key = normalizeKey(name);
  const mapping: Record<string, string> = {
    menh: "menh",
    phu_mau: "phu_mau", phu_mẫu: "phu_mau",
    phuc_duc: "phuc_duc", phúc_đức: "phuc_duc",
    dien_trach: "dien_trach", điền_trạch: "dien_trach",
    quan_loc: "quan_loc", quan_lộc: "quan_loc",
    no_boc: "no_boc", nô_bộc: "no_boc", giao_huu: "no_boc",
    thien_di: "thien_di", thiên_di: "thien_di",
    tat_ach: "tat_ach", tật_ách: "tat_ach",
    tai_bach: "tai_bach", tài_bạch: "tai_bach",
    tu_tuc: "tu_tuc", tử_tức: "tu_tuc", tu_nu: "tu_tuc",
    phu_the: "phu_the", phu_thê: "phu_the",
    huynh_de: "huynh_de", huynh_đệ: "huynh_de",
    than: "than", thân: "than",
  };
  return mapping[key] || key;
}

function normalizeBranch(branch: string): string {
  const key = normalizeKey(branch);
  const mapping: Record<string, string> = {
    ty: "ty", tí: "ty", tý: "ty",
    suu: "suu", sửu: "suu",
    dan: "dan", dần: "dan",
    mao: "mao", mão: "mao",
    thin: "thin", thìn: "thin",
    ti: "ti", tị: "ti", tỵ: "ti",
    ngo: "ngo", ngọ: "ngo",
    mui: "mui", mùi: "mui",
    than: "than", thân: "than",
    dau: "dau", dậu: "dau",
    tuat: "tuat", tuất: "tuat",
    hoi: "hoi", hợi: "hoi",
  };
  return mapping[key] || key;
}

function normalizeStem(stem: string): string {
  const key = normalizeKey(stem);
  const mapping: Record<string, string> = {
    giap: "giap", giáp: "giap",
    at: "at", ất: "at",
    binh: "binh", bính: "binh",
    dinh: "dinh", đinh: "dinh",
    mau: "mau", mậu: "mau",
    ky: "ky", kỷ: "ky",
    canh: "canh",
    tan: "tan", tân: "tan",
    nham: "nham", nhâm: "nham",
    quy: "quy", quý: "quy",
  };
  return mapping[key] || key;
}

function normalizeStarId(starName: string): string {
  return normalizeKey(starName);
}

// ============ CONTEXT EXTRACTION ============

/**
 * Extract all stars from a palace
 */
function extractStarsFromPalace(palace: DisplayPalace): string[] {
  const stars: string[] = [];
  
  const addStars = (list: DisplayStar[] | undefined) => {
    if (list) {
      for (const star of list) {
        stars.push(normalizeStarId(star.name));
        if (star.originalName) {
          stars.push(normalizeStarId(star.originalName));
        }
      }
    }
  };

  addStars(palace.centerStars);
  addStars(palace.leftStars);
  addStars(palace.rightStars);
  addStars(palace.majorStars);
  addStars(palace.minorStars);

  return [...new Set(stars)];
}

/**
 * Extract mutagens from palace stars
 */
function extractMutagensFromPalace(palace: DisplayPalace): string[] {
  const mutagens: string[] = [];
  
  const checkStars = (list: DisplayStar[] | undefined) => {
    if (list) {
      for (const star of list) {
        if (star.mutagen) {
          const m = normalizeKey(star.mutagen);
          if (m.includes("loc")) mutagens.push("loc");
          if (m.includes("quyen")) mutagens.push("quyen");
          if (m.includes("khoa")) mutagens.push("khoa");
          if (m.includes("ky")) mutagens.push("ky");
        }
      }
    }
  };

  checkStars(palace.centerStars);
  checkStars(palace.leftStars);
  checkStars(palace.rightStars);
  checkStars(palace.majorStars);
  checkStars(palace.minorStars);

  return [...new Set(mutagens)];
}

/**
 * Extract phi hoa flows from palace
 */
function extractPhiHoaFlows(palace: DisplayPalace): PhiHoaFlow[] {
  const phiTuHoa = (palace as any).phiTuHoa;
  if (!phiTuHoa?.flows) return [];

  const flows: PhiHoaFlow[] = [];
  
  for (const flow of phiTuHoa.flows) {
    if (flow.relation === "phi_nhap" && flow.targetPalaceName) {
      flows.push({
        type: flow.type,
        typeLabel: flow.typeLabel,
        sourcePalace: palace.name,
        targetPalace: flow.targetPalaceName,
        targetPalaceName: flow.targetPalaceName,
      });
    }
  }

  return flows;
}

/**
 * Extract M codes from palace
 */
function extractMCodes(palace: DisplayPalace): string[] {
  const mCodes: string[] = [];
  
  // Check for M code markers in palace data
  const markers = (palace as any).markers || [];
  for (const marker of markers) {
    if (marker.startsWith("M ")) {
      mCodes.push(marker);
    }
  }
  
  return mCodes;
}

/**
 * Build mapping context for a palace
 */
export function buildPalaceContext(palace: DisplayPalace): PalaceMappingContext {
  const palaceId = normalizePalaceId(palace.name);
  const branch = normalizeBranch(palace.branch || "");
  const heavenlyStem = normalizeStem(palace.heavenlyStem || "");
  
  return {
    palace,
    palaceId,
    branch,
    heavenlyStem,
    starsInPalace: extractStarsFromPalace(palace),
    mutagensInPalace: extractMutagensFromPalace(palace),
    phiHoaFlows: extractPhiHoaFlows(palace),
    mCodes: extractMCodes(palace),
    xiHoa: (palace as any).xiHoa,
  };
}

// ============ MATCHING FUNCTIONS ============

/**
 * Match interpretation by position (branch)
 */
function matchByPosition(
  interp: KnowledgeInterpretation,
  context: PalaceMappingContext
): { score: number; reason: string } | null {
  const conditions = interp.conditions || {};
  const positions = conditions.position || interp.branches || [];
  
  if (positions.length === 0) return null;
  
  const normalizedPositions = positions.map(normalizeBranch);
  
  if (normalizedPositions.includes(context.branch)) {
    return {
      score: 5,
      reason: `Cung an tại ${context.palace.branch}`,
    };
  }
  
  return null;
}

/**
 * Match interpretation by heavenly stem
 */
function matchByHeavenlyStem(
  interp: KnowledgeInterpretation,
  context: PalaceMappingContext
): { score: number; reason: string } | null {
  const conditions = interp.conditions || {};
  const requiredStem = conditions.heavenly_stem;
  
  if (!requiredStem) return null;
  
  if (normalizeStem(requiredStem) === context.heavenlyStem) {
    return {
      score: 8,
      reason: `Cung có can ${context.palace.heavenlyStem}`,
    };
  }
  
  return null;
}

/**
 * Match interpretation by required stars
 */
function matchByStars(
  interp: KnowledgeInterpretation,
  context: PalaceMappingContext
): { score: number; reason: string } | null {
  const conditions = interp.conditions || {};
  const requiredStars = conditions.required_stars || interp.required_stars || [];
  
  if (requiredStars.length === 0) return null;
  
  const normalizedRequired = requiredStars.map(normalizeStarId);
  const hasAllRequired = normalizedRequired.every(s => context.starsInPalace.includes(s));
  
  if (!hasAllRequired) return null;
  
  // Check excluded stars
  const excludedStars = interp.excluded_stars || [];
  if (excludedStars.length > 0) {
    const normalizedExcluded = excludedStars.map(normalizeStarId);
    const hasExcluded = normalizedExcluded.some(s => context.starsInPalace.includes(s));
    if (hasExcluded) {
      return {
        score: 5,
        reason: `Có ${requiredStars.join(", ")} nhưng có sao kỵ`,
      };
    }
  }
  
  return {
    score: 10 + requiredStars.length * 2,
    reason: `Có ${requiredStars.join(", ")} tại cung`,
  };
}

/**
 * Match interpretation by mutagen in palace
 */
function matchByMutagen(
  interp: KnowledgeInterpretation,
  context: PalaceMappingContext
): { score: number; reason: string } | null {
  const conditions = interp.conditions || {};
  let requiredMutagens = conditions.mutagen_in_palace;
  
  if (!requiredMutagens) return null;
  if (!Array.isArray(requiredMutagens)) {
    requiredMutagens = [requiredMutagens];
  }
  
  if (context.mutagensInPalace.length === 0) return null;
  
  const normalizedRequired = requiredMutagens.map(normalizeKey);
  const matchedCount = normalizedRequired.filter(m => 
    context.mutagensInPalace.includes(m)
  ).length;
  
  if (matchedCount === 0) return null;
  
  const mutagenLabels: Record<string, string> = {
    loc: "Hóa Lộc",
    quyen: "Hóa Quyền",
    khoa: "Hóa Khoa",
    ky: "Hóa Kỵ",
  };
  
  const labels = requiredMutagens.map(m => mutagenLabels[m] || m);
  
  return {
    score: matchedCount === normalizedRequired.length ? 15 : 8,
    reason: `Có ${labels.join(", ")} tọa thủ`,
  };
}

/**
 * Match interpretation by phi hoa
 */
function matchByPhiHoa(
  interp: KnowledgeInterpretation,
  context: PalaceMappingContext
): { score: number; reason: string } | null {
  const conditions = interp.conditions || {};
  const transformation = conditions.transformation;
  const sourcePalace = conditions.source_palace || interp.source_palace;
  const targetPalace = conditions.target_palace || interp.target_palace;
  
  if (!transformation || !sourcePalace || !targetPalace) return null;
  if (context.phiHoaFlows.length === 0) return null;
  
  for (const flow of context.phiHoaFlows) {
    const sourceMatch = normalizePalaceId(flow.sourcePalace) === normalizePalaceId(sourcePalace);
    const targetMatch = normalizePalaceId(flow.targetPalaceName || flow.targetPalace) === normalizePalaceId(targetPalace);
    const typeMatch = normalizeKey(flow.type) === normalizeKey(transformation);
    
    if (sourceMatch && targetMatch && typeMatch) {
      const typeLabels: Record<string, string> = {
        loc: "Lộc", quyen: "Quyền", khoa: "Khoa", ky: "Kỵ",
      };
      return {
        score: 20,
        reason: `${flow.sourcePalace} Hóa ${typeLabels[flow.type] || flow.type} nhập ${flow.targetPalaceName}`,
      };
    }
  }
  
  return null;
}

/**
 * Match interpretation by M code
 */
function matchByMCode(
  interp: KnowledgeInterpretation,
  context: PalaceMappingContext
): { score: number; reason: string } | null {
  const relationCode = interp.relation_code;
  
  if (!relationCode) return null;
  if (context.mCodes.length === 0) return null;
  
  const normalizedCode = normalizeKey(relationCode);
  const hasMatch = context.mCodes.some(m => normalizeKey(m) === normalizedCode);
  
  if (hasMatch) {
    return {
      score: 12,
      reason: `Có ${relationCode}`,
    };
  }
  
  return null;
}

/**
 * Main matching function - try all matchers
 */
function matchInterpretation(
  interp: KnowledgeInterpretation,
  context: PalaceMappingContext
): KnowledgeMatch | null {
  const matchResults: Array<{ score: number; reason: string }> = [];
  
  // Try all matchers
  const matchers = [
    matchByPhiHoa,
    matchByMutagen,
    matchByStars,
    matchByMCode,
    matchByHeavenlyStem,
    matchByPosition,
  ];
  
  for (const matcher of matchers) {
    const result = matcher(interp, context);
    if (result) {
      matchResults.push(result);
    }
  }
  
  if (matchResults.length === 0) return null;
  
  // Combine scores and reasons
  const totalScore = matchResults.reduce((sum, r) => sum + r.score, 0);
  const reasons = matchResults.map(r => r.reason);
  
  return {
    interpretation: interp,
    section: "",
    matchScore: totalScore,
    matchReasons: reasons,
  };
}

// ============ MAIN MAPPER ============

/**
 * Map knowledge to a single palace
 */
export function mapKnowledgeToPalace(
  knowledgeFiles: KnowledgeFile[],
  context: PalaceMappingContext
): KnowledgeMatch[] {
  const matches: KnowledgeMatch[] = [];
  
  // Find knowledge files for this palace
  const relevantFiles = knowledgeFiles.filter(f => 
    normalizePalaceId(f.palace) === context.palaceId
  );
  
  for (const file of relevantFiles) {
    // Process sections
    if (file.sections) {
      for (const section of file.sections) {
        for (const interp of section.interpretations) {
          const match = matchInterpretation(interp, context);
          if (match) {
            match.section = section.title;
            matches.push(match);
          }
        }
      }
    }
    
    // Process direct interpretations
    if (file.interpretations) {
      for (const interp of file.interpretations) {
        const match = matchInterpretation(interp, context);
        if (match) {
          match.section = file.title || "Luận giải";
          matches.push(match);
        }
      }
    }
  }
  
  // Sort by score and dedupe
  const sorted = matches.sort((a, b) => b.matchScore - a.matchScore);
  const seen = new Set<string>();
  const deduped: KnowledgeMatch[] = [];
  
  for (const item of sorted) {
    const textKey = item.interpretation.text.slice(0, 100);
    if (!seen.has(textKey)) {
      seen.add(textKey);
      deduped.push(item);
    }
  }
  
  return deduped;
}

/**
 * Map knowledge to entire chart
 */
export function mapKnowledgeToChart(
  knowledgeFiles: KnowledgeFile[],
  chart: DisplayChart
): MappingResult[] {
  const results: MappingResult[] = [];
  
  for (const palace of chart.palaces) {
    const context = buildPalaceContext(palace);
    const matches = mapKnowledgeToPalace(knowledgeFiles, context);
    
    if (matches.length > 0) {
      results.push({
        palace: context.palaceId,
        palaceName: palace.name,
        matches,
        totalMatches: matches.length,
      });
    }
  }
  
  return results;
}

/**
 * Get top interpretations for a palace
 */
export function getTopInterpretations(
  knowledgeFiles: KnowledgeFile[],
  palace: DisplayPalace,
  limit: number = 10
): KnowledgeMatch[] {
  const context = buildPalaceContext(palace);
  const matches = mapKnowledgeToPalace(knowledgeFiles, context);
  return matches.slice(0, limit);
}

/**
 * Search knowledge by keyword
 */
export function searchKnowledge(
  knowledgeFiles: KnowledgeFile[],
  keyword: string
): KnowledgeInterpretation[] {
  const results: KnowledgeInterpretation[] = [];
  const normalizedKeyword = normalizeKey(keyword);
  
  for (const file of knowledgeFiles) {
    if (file.sections) {
      for (const section of file.sections) {
        for (const interp of section.interpretations) {
          if (normalizeKey(interp.text).includes(normalizedKeyword)) {
            results.push(interp);
          }
        }
      }
    }
    
    if (file.interpretations) {
      for (const interp of file.interpretations) {
        if (normalizeKey(interp.text).includes(normalizedKeyword)) {
          results.push(interp);
        }
      }
    }
  }
  
  return results;
}
