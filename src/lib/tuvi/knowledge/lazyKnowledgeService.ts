/**
 * Lazy Knowledge Service
 * Phiên bản lazy load của knowledgeService - chỉ query khi knowledge đã được load
 */

import type { DisplayPalace, DisplayStar } from "../config/types";
import {
  getKnowledgeCache,
  isKnowledgeReady,
  loadKnowledge,
} from "./lazyKnowledgeLoader";

// ============ TYPES (re-export từ knowledgeService) ============

export type KnowledgeSource = {
  book: string;
  author: string;
  translator?: string | null;
};

export type InterpretationConditions = {
  required_stars?: string[];
  meeting_stars?: string[];
  position?: string[];
  heavenly_stem?: string;
  mutagen_in_palace?: string | string[];
  transformation?: string;
  source_palace?: string;
  target_palace?: string;
};

export type KnowledgeInterpretation = {
  id: string;
  type: string;
  conditions?: InterpretationConditions;
  required_stars?: string[];
  same_palace?: boolean;
  branches?: string[];
  excluded_stars?: string[];
  source_palace?: string;
  target_palace?: string;
  clash_palace?: string;
  relation_palace?: string;
  relation_code?: string;
  text: string;
  warning?: string;
  source: KnowledgeSource;
};

export type KnowledgeSection = {
  section_id: string;
  title: string;
  interpretations: KnowledgeInterpretation[];
};

export type KnowledgeFile = {
  palace: string;
  palace_name?: string;
  section_id?: string;
  title?: string;
  sections?: KnowledgeSection[];
  interpretations?: KnowledgeInterpretation[];
};

export type KnowledgeMatch = {
  interpretation: KnowledgeInterpretation;
  section: string;
  matchScore: number;
  matchReasons: string[];
};

export type PhiHoaFlow = {
  type: "loc" | "quyen" | "khoa" | "ky";
  typeLabel?: string;
  sourcePalace: string;
  targetPalace: string;
  targetPalaceName?: string;
  clashPalace?: string;
};

export type PalaceQueryContext = {
  palace: DisplayPalace;
  starsInPalace: string[];
  branch: string;
  heavenlyStem?: string;
  mutagensInPalace?: string[];
  phiHoaFlows?: PhiHoaFlow[];
};

// ============ HELPERS ============

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
    phu_mau: "phu_mau",
    phuc_duc: "phuc_duc",
    dien_trach: "dien_trach",
    quan_loc: "quan_loc",
    no_boc: "no_boc",
    thien_di: "thien_di",
    tat_ach: "tat_ach",
    tai_bach: "tai_bach",
    tu_tuc: "tu_tuc",
    tu_nu: "tu_tuc",
    phu_the: "phu_the",
    huynh_de: "huynh_de",
    than: "than",
    giao_huu: "no_boc",
  };
  return mapping[key] || key;
}

function normalizeBranch(branch: string): string {
  const key = normalizeKey(branch);
  const mapping: Record<string, string> = {
    ty: "ty", ti: "ty", suu: "suu", dan: "dan", mao: "mao",
    thin: "thin", ty_: "ti", ngo: "ngo", mui: "mui",
    than: "than", dau: "dau", tuat: "tuat", hoi: "hoi",
  };
  return mapping[key] || key;
}

function normalizeStarId(starName: string): string {
  return normalizeKey(starName);
}

function normalizeStem(stem: string): string {
  const key = normalizeKey(stem);
  const mapping: Record<string, string> = {
    giap: "giap", at: "at", binh: "binh", dinh: "dinh",
    mau: "mau", ky: "ky", canh: "canh", tan: "tan",
    nham: "nham", quy: "quy",
  };
  return mapping[key] || key;
}

// ============ BUILD PALACE KNOWLEDGE (từ cache) ============

function buildPalaceKnowledge(cache: Record<string, unknown>): Record<string, KnowledgeFile[]> {
  const starCombinations = cache.starCombinationsData as unknown as KnowledgeFile;

  return {
    menh: [
      starCombinations,
      cache.menhConsolidated as unknown as KnowledgeFile,
      cache.menhData as unknown as KnowledgeFile,
      cache.menhChinhTinhData as unknown as KnowledgeFile,
      cache.menhPhiHoaData as unknown as KnowledgeFile,
      cache.menhPhuTinhData as unknown as KnowledgeFile,
      cache.menhMCodeData as unknown as KnowledgeFile,
    ],
    phu_mau: [
      starCombinations,
      cache.phuMauConsolidated as unknown as KnowledgeFile,
    ],
    phu_the: [
      starCombinations,
      cache.phuTheConsolidated as unknown as KnowledgeFile,
      cache.phuTheData as unknown as KnowledgeFile,
    ],
    phuc_duc: [
      starCombinations,
      cache.phucDucConsolidated as unknown as KnowledgeFile,
      cache.phucDucData as unknown as KnowledgeFile,
    ],
    dien_trach: [
      starCombinations,
      cache.dienTrachConsolidated as unknown as KnowledgeFile,
      cache.dienTrachData as unknown as KnowledgeFile,
    ],
    quan_loc: [
      starCombinations,
      cache.quanLocConsolidated as unknown as KnowledgeFile,
      cache.quanLocCobanData as unknown as KnowledgeFile,
      cache.quanLocChinhTinhData as unknown as KnowledgeFile,
      cache.quanLocPhiHoaData as unknown as KnowledgeFile,
    ],
    no_boc: [
      starCombinations,
      cache.noBocConsolidated as unknown as KnowledgeFile,
    ],
    thien_di: [
      starCombinations,
      cache.thienDiConsolidated as unknown as KnowledgeFile,
      cache.thienDiData as unknown as KnowledgeFile,
    ],
    tat_ach: [
      starCombinations,
      cache.tatAchConsolidated as unknown as KnowledgeFile,
    ],
    tai_bach: [
      starCombinations,
      cache.taiBachConsolidated as unknown as KnowledgeFile,
      cache.taiBachData as unknown as KnowledgeFile,
    ],
    tu_tuc: [
      starCombinations,
      cache.tuTucConsolidated as unknown as KnowledgeFile,
      cache.tuTucData as unknown as KnowledgeFile,
    ],
    huynh_de: [
      starCombinations,
      cache.huynhDeConsolidated as unknown as KnowledgeFile,
    ],
  };
}

// ============ MATCHERS ============

function matchStarInPalace(
  interp: KnowledgeInterpretation,
  context: PalaceQueryContext
): { score: number; reasons: string[] } | null {
  const conditions = interp.conditions || {};
  const requiredStars = conditions.required_stars || interp.required_stars || [];
  
  if (requiredStars.length === 0) return null;

  const starsInPalace = context.starsInPalace.map(normalizeStarId);
  const normalizedRequired = requiredStars.map(normalizeStarId);
  
  const hasAllRequired = normalizedRequired.every((s) => starsInPalace.includes(s));
  if (!hasAllRequired) return null;

  const basePriority = (interp as any).priority || 0;
  const starCountBonus = requiredStars.length >= 2 ? requiredStars.length * 10 : 0;
  const isSamePalace = interp.same_palace || (conditions as any).same_palace;
  const samePalaceBonus = isSamePalace ? 15 : 0;
  
  let score = 10 + requiredStars.length * 2 + basePriority + starCountBonus + samePalaceBonus;
  const reasons: string[] = requiredStars.length >= 2
    ? [`Tổ hợp ${requiredStars.join(" - ")} đồng cung`]
    : [`Có ${requiredStars.join(", ")} tại cung`];

  const positions = conditions.position || interp.branches || [];
  if (positions.length > 0) {
    const normalizedPositions = positions.map(normalizeBranch);
    const branch = normalizeBranch(context.branch);
    if (normalizedPositions.includes(branch)) {
      score += 5;
      reasons.push(`Cung an tại ${context.branch}`);
    } else {
      score -= 3;
    }
  }

  const excludedStars = interp.excluded_stars || [];
  if (excludedStars.length > 0) {
    const normalizedExcluded = excludedStars.map(normalizeStarId);
    const hasExcluded = normalizedExcluded.some((s) => starsInPalace.includes(s));
    if (hasExcluded) {
      score -= 5;
      if (interp.warning) {
        reasons.push(interp.warning);
      }
    }
  }

  return score > 0 ? { score, reasons } : null;
}

function matchMeetingStars(
  interp: KnowledgeInterpretation,
  context: PalaceQueryContext
): { score: number; reasons: string[] } | null {
  const conditions = interp.conditions || {};
  const meetingStars = conditions.meeting_stars || [];
  
  if (meetingStars.length === 0) return null;

  const starsInPalace = context.starsInPalace.map(normalizeStarId);
  const normalizedMeeting = meetingStars.map(normalizeStarId);
  
  const matchedCount = normalizedMeeting.filter((s) => starsInPalace.includes(s)).length;
  
  if (matchedCount === 0) return null;
  
  const basePriority = (interp as any).priority || 0;
  const score = matchedCount === normalizedMeeting.length 
    ? 12 + basePriority + (meetingStars.length * 5)
    : 6 + Math.floor(basePriority / 2);
  const reasons = matchedCount === normalizedMeeting.length
    ? [`Hội đủ ${meetingStars.join(", ")}`]
    : [`Hội một phần ${meetingStars.join(", ")}`];

  return { score, reasons };
}

function matchHeavenlyStem(
  interp: KnowledgeInterpretation,
  context: PalaceQueryContext
): { score: number; reasons: string[] } | null {
  const conditions = interp.conditions || {};
  const requiredStem = conditions.heavenly_stem;
  
  if (!requiredStem || !context.heavenlyStem) return null;

  const normalizedRequired = normalizeStem(requiredStem.toLowerCase());
  const normalizedContext = normalizeStem(context.heavenlyStem.toLowerCase());
  
  if (normalizedRequired === normalizedContext) {
    return {
      score: 8,
      reasons: [`Cung có can ${context.heavenlyStem}`],
    };
  }

  return null;
}

function matchMutagenInPalace(
  interp: KnowledgeInterpretation,
  context: PalaceQueryContext
): { score: number; reasons: string[] } | null {
  const conditions = interp.conditions || {};
  let requiredMutagens = conditions.mutagen_in_palace;
  
  if (!requiredMutagens || !context.mutagensInPalace?.length) return null;

  if (!Array.isArray(requiredMutagens)) {
    requiredMutagens = [requiredMutagens];
  }

  const normalizedMutagens = context.mutagensInPalace.map(normalizeKey);
  const normalizedRequired = requiredMutagens.map(normalizeKey);
  
  const matchedCount = normalizedRequired.filter((m) => normalizedMutagens.includes(m)).length;
  
  if (matchedCount === 0) return null;

  const mutagenLabels: Record<string, string> = {
    loc: "Hóa Lộc",
    quyen: "Hóa Quyền",
    khoa: "Hóa Khoa",
    ky: "Hóa Kỵ",
  };

  const labels = requiredMutagens.map((m) => mutagenLabels[m] || m);
  
  return {
    score: matchedCount === normalizedRequired.length ? 15 : 8,
    reasons: [`Có ${labels.join(", ")} tọa thủ`],
  };
}

function matchPhiHoa(
  interp: KnowledgeInterpretation,
  context: PalaceQueryContext
): { score: number; reasons: string[] } | null {
  const conditions = interp.conditions || {};
  const transformation = conditions.transformation;
  const sourcePalace = conditions.source_palace || interp.source_palace;
  const targetPalace = conditions.target_palace || interp.target_palace;
  
  if (!transformation || !sourcePalace || !targetPalace) return null;
  if (!context.phiHoaFlows?.length) return null;

  for (const flow of context.phiHoaFlows) {
    const sourceMatch = normalizeKey(flow.sourcePalace) === normalizeKey(sourcePalace);
    const targetMatch = normalizeKey(flow.targetPalaceName || flow.targetPalace) === normalizeKey(targetPalace);
    const typeMatch = normalizeKey(flow.type) === normalizeKey(transformation);

    if (sourceMatch && targetMatch && typeMatch) {
      const typeLabels: Record<string, string> = {
        loc: "Lộc", quyen: "Quyền", khoa: "Khoa", ky: "Kỵ",
      };
      return {
        score: 20,
        reasons: [`${flow.sourcePalace} Hóa ${typeLabels[flow.type] || flow.type} nhập ${flow.targetPalaceName || flow.targetPalace}`],
      };
    }
  }

  return null;
}

// ============ MAIN QUERY ============

function convertToInterpretation(item: any): KnowledgeInterpretation {
  if (item.id && item.text) {
    return item as KnowledgeInterpretation;
  }
  
  const conditions: InterpretationConditions = {};
  
  if (item.conditions) {
    if (item.conditions.position) {
      conditions.position = Array.isArray(item.conditions.position) 
        ? item.conditions.position 
        : [item.conditions.position];
    }
    if (item.conditions.heavenly_stem) {
      conditions.heavenly_stem = item.conditions.heavenly_stem;
    }
    if (item.conditions.required_stars?.length) {
      conditions.required_stars = item.conditions.required_stars;
    }
    if (item.conditions.transformations?.length) {
      conditions.transformation = item.conditions.transformations[0];
    }
    if (item.conditions.transformation_target?.length) {
      conditions.target_palace = item.conditions.transformation_target[0];
      conditions.source_palace = item.conditions.palace?.toLowerCase();
    }
  }
  
  return {
    id: item.block_id || item.id || `cohoc_${Date.now()}`,
    type: determineInterpType(item),
    conditions: Object.keys(conditions).length > 0 ? conditions : undefined,
    required_stars: item.conditions?.required_stars,
    text: item.raw_text || item.text || item.content || "",
    source: item.source || { book: "tuvi.cohoc.net", author: "Unknown" },
  };
}

function determineInterpType(item: any): string {
  if (item.type) return item.type;
  
  const conditions = item.conditions || {};
  
  if (conditions.transformations?.length) {
    const type = conditions.transformations[0]?.toLowerCase();
    if (type === "loc") return "phi_loc";
    if (type === "quyen") return "phi_quyen";
    if (type === "khoa") return "phi_khoa";
    if (type === "ky") return "phi_ky";
    return "phi_hoa";
  }
  if (conditions.required_stars?.length) return "star_in_palace";
  if (conditions.heavenly_stem) return "heavenly_stem";
  if (conditions.position) return "position";
  
  return "general";
}

function getAllInterpretations(files: KnowledgeFile[]): Array<{ interp: KnowledgeInterpretation; section: string }> {
  const results: Array<{ interp: KnowledgeInterpretation; section: string }> = [];

  for (const file of files) {
    if (!file) continue;
    
    if (file.sections) {
      for (const section of file.sections) {
        const items = section.interpretations || (section as any).blocks || [];
        for (const item of items) {
          const interp = convertToInterpretation(item);
          results.push({ interp, section: section.title });
        }
      }
    }
    if (file.interpretations) {
      const sectionTitle = file.title || file.section_id || "Luận giải";
      for (const interp of file.interpretations) {
        results.push({ interp, section: sectionTitle });
      }
    }
    if ((file as any).blocks) {
      const sectionTitle = file.title || (file as any).palace_name || "Luận giải CoHoc";
      for (const block of (file as any).blocks) {
        const interp = convertToInterpretation(block);
        results.push({ interp, section: sectionTitle });
      }
    }
  }

  return results;
}

/**
 * Query knowledge cho một cung - LAZY VERSION
 * Trả về mảng rỗng nếu knowledge chưa được load
 */
export function queryPalaceKnowledge(context: PalaceQueryContext): KnowledgeMatch[] {
  const cache = getKnowledgeCache();
  if (!cache) return []; // Knowledge chưa load

  const palaceKnowledge = buildPalaceKnowledge(cache);
  const palaceId = normalizePalaceId(context.palace.name);
  const files = palaceKnowledge[palaceId];

  if (!files || files.length === 0) return [];

  const allInterpretations = getAllInterpretations(files);
  const results: KnowledgeMatch[] = [];

  for (const { interp, section } of allInterpretations) {
    let match: { score: number; reasons: string[] } | null = null;

    switch (interp.type) {
      case "star_in_palace":
        match = matchStarInPalace(interp, context);
        break;
      case "star_combination":
        match = matchMeetingStars(interp, context);
        break;
      case "heavenly_stem":
        match = matchHeavenlyStem(interp, context);
        break;
      case "mutagen_in_palace":
      case "mutagen_combination":
        match = matchMutagenInPalace(interp, context);
        break;
      case "phi_hoa":
      case "phi_loc":
      case "phi_quyen":
      case "phi_khoa":
      case "phi_ky":
        match = matchPhiHoa(interp, context);
        break;
      default:
        match = matchStarInPalace(interp, context);
        if (!match) match = matchMeetingStars(interp, context);
        if (!match) match = matchHeavenlyStem(interp, context);
        if (!match) match = matchMutagenInPalace(interp, context);
        if (!match) match = matchPhiHoa(interp, context);
    }

    if (match && match.score > 0) {
      results.push({
        interpretation: interp,
        section,
        matchScore: match.score,
        matchReasons: match.reasons,
      });
    }
  }

  // Sort by priority
  const getTypePriority = (type: string, score: number): number => {
    if (type === "star_combination" && score >= 50) return 0;
    if ((type === "star_in_palace" || type === "star_combination") && score >= 30) return 1;
    if (type === "position" || type === "heavenly_stem") return 2;
    if (type === "star_in_palace" || type === "star_combination" || type === "cach_cuc") return 3;
    if (type === "mutagen_in_palace" || type === "mutagen_combination") return 4;
    if (type.startsWith("phi_")) return 5;
    return 6;
  };

  const sorted = results.sort((a, b) => {
    const priorityA = getTypePriority(a.interpretation.type, a.matchScore);
    const priorityB = getTypePriority(b.interpretation.type, b.matchScore);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return b.matchScore - a.matchScore;
  });

  // Dedupe
  const seen = new Set<string>();
  const deduped: KnowledgeMatch[] = [];

  for (const item of sorted) {
    const textKey = item.interpretation.text.slice(0, 100);
    if (!seen.has(textKey)) {
      seen.add(textKey);
      deduped.push(item);
    }
  }

  return deduped.slice(0, 10);
}

// ============ HELPERS FOR COMPONENTS ============

export function extractStarsFromPalace(palace: DisplayPalace): string[] {
  const stars: string[] = [];
  
  const addStars = (list: DisplayStar[] | undefined) => {
    if (list) {
      for (const star of list) {
        stars.push(star.name);
        if (star.originalName) stars.push(star.originalName);
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

export function extractMutagensFromPalace(palace: DisplayPalace): string[] {
  const mutagens: string[] = [];
  
  const checkStars = (list: DisplayStar[] | undefined) => {
    if (list) {
      for (const star of list) {
        if (star.mutagen) {
          mutagens.push(star.mutagen.toLowerCase());
        }
        const name = normalizeKey(star.name);
        if (name.includes("hoa_loc") || name === "loc") mutagens.push("loc");
        if (name.includes("hoa_quyen") || name === "quyen") mutagens.push("quyen");
        if (name.includes("hoa_khoa") || name === "khoa") mutagens.push("khoa");
        if (name.includes("hoa_ky") || name === "ky") mutagens.push("ky");
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

export function extractPhiHoaFlows(palace: DisplayPalace): PhiHoaFlow[] {
  const phiTuHoa = (palace as any).phiTuHoa;
  if (!phiTuHoa?.flows) return [];

  const flows: PhiHoaFlow[] = [];
  
  for (const flow of phiTuHoa.flows) {
    if (flow.targetPalaceName) {
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

export function formatKnowledgeSource(source: KnowledgeSource): string {
  const parts = [source.book];
  if (source.author) parts.push(source.author);
  if (source.translator) parts.push(`${source.translator} biên dịch`);
  return parts.join(" - ");
}

export function hasPalaceKnowledge(palaceName: string): boolean {
  if (!isKnowledgeReady()) return false;
  const cache = getKnowledgeCache();
  if (!cache) return false;
  const palaceKnowledge = buildPalaceKnowledge(cache);
  return normalizePalaceId(palaceName) in palaceKnowledge;
}

export function getAvailablePalaces(): string[] {
  if (!isKnowledgeReady()) return [];
  const cache = getKnowledgeCache();
  if (!cache) return [];
  const palaceKnowledge = buildPalaceKnowledge(cache);
  return Object.keys(palaceKnowledge);
}

// Re-export từ loader
export { isKnowledgeReady, loadKnowledge, scheduleKnowledgePreload } from "./lazyKnowledgeLoader";
