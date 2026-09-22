/**
 * Knowledge Service
 * Load và query tri thức từ các file JSON trong knowledge/cung/
 */

import type { DisplayPalace, DisplayStar } from "../config/types";

// Import all knowledge files
import menhData from "./cung/menh.json";
import menhChinhTinhData from "./cung/menh-chinh-tinh.json";
import menhPhiHoaData from "./cung/menh-phi-hoa.json";
import menhPhuTinhData from "./cung/menh-phu-tinh.json";
import menhMCodeData from "./cung/menh-m-code.json";
import menhCohocData from "./cung/menh-cohoc.json";
import phuTheData from "./cung/phu-the.json";
import phucDucData from "./cung/phuc-duc.json";
import dienTrachData from "./cung/dien-trach.json";
import quanLocCobanData from "./cung/quan-loc-co-ban.json";
import quanLocChinhTinhData from "./cung/quan-loc-chinh-tinh.json";
import quanLocPhiHoaData from "./cung/quan-loc-phi-hoa.json";
import taiBachData from "./cung/tai-bach.json";
import thienDiData from "./cung/thien-di.json";
import tuTucData from "./cung/tu-tuc.json";

// Import star combinations (highest priority)
import starCombinationsData from "./cung/star-combinations.json";

// Import cohoc-full files (crawled data)
import menhCohocFullData from "./cung/menh-cohoc-full.json";
import phuMauCohocFullData from "./cung/phu-mau-cohoc-full.json";
import phucDucCohocFullData from "./cung/phuc-duc-cohoc-full.json";
import dienTrachCohocFullData from "./cung/dien-trach-cohoc-full.json";
import quanLocCohocFullData from "./cung/quan-loc-cohoc-full.json";
import noBocCohocFullData from "./cung/no-boc-cohoc-full.json";
import thienDiCohocFullData from "./cung/thien-di-cohoc-full.json";
import tatAchCohocFullData from "./cung/tat-ach-cohoc-full.json";
import taiBachCohocFullData from "./cung/tai-bach-cohoc-full.json";
import tuTucCohocFullData from "./cung/tu-tuc-cohoc-full.json";
import phuTheCohocFullData from "./cung/phu-the-cohoc-full.json";
import huynhDeCohocFullData from "./cung/huynh-de-cohoc-full.json";

// ============ TYPES ============

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

// ============ DATA REGISTRY ============

// Star combinations - áp dụng cho tất cả các cung
const STAR_COMBINATIONS = starCombinationsData as unknown as KnowledgeFile;

const PALACE_KNOWLEDGE: Record<string, KnowledgeFile[]> = {
  menh: [
    STAR_COMBINATIONS, // Ưu tiên tổ hợp sao trước
    menhData as unknown as KnowledgeFile,
    menhChinhTinhData as unknown as KnowledgeFile,
    menhPhiHoaData as unknown as KnowledgeFile,
    menhPhuTinhData as unknown as KnowledgeFile,
    menhMCodeData as unknown as KnowledgeFile,
    menhCohocData as unknown as KnowledgeFile,
    menhCohocFullData as unknown as KnowledgeFile,
  ],
  phu_mau: [STAR_COMBINATIONS, phuMauCohocFullData as unknown as KnowledgeFile],
  phu_the: [
    STAR_COMBINATIONS,
    phuTheData as unknown as KnowledgeFile,
    phuTheCohocFullData as unknown as KnowledgeFile,
  ],
  phuc_duc: [
    STAR_COMBINATIONS,
    phucDucData as unknown as KnowledgeFile,
    phucDucCohocFullData as unknown as KnowledgeFile,
  ],
  dien_trach: [
    STAR_COMBINATIONS,
    dienTrachData as unknown as KnowledgeFile,
    dienTrachCohocFullData as unknown as KnowledgeFile,
  ],
  quan_loc: [
    STAR_COMBINATIONS,
    quanLocCobanData as unknown as KnowledgeFile,
    quanLocChinhTinhData as unknown as KnowledgeFile,
    quanLocPhiHoaData as unknown as KnowledgeFile,
    quanLocCohocFullData as unknown as KnowledgeFile,
  ],
  no_boc: [STAR_COMBINATIONS, noBocCohocFullData as unknown as KnowledgeFile],
  thien_di: [
    STAR_COMBINATIONS,
    thienDiData as unknown as KnowledgeFile,
    thienDiCohocFullData as unknown as KnowledgeFile,
  ],
  tat_ach: [STAR_COMBINATIONS, tatAchCohocFullData as unknown as KnowledgeFile],
  tai_bach: [
    STAR_COMBINATIONS,
    taiBachData as unknown as KnowledgeFile,
    taiBachCohocFullData as unknown as KnowledgeFile,
  ],
  tu_tuc: [
    STAR_COMBINATIONS,
    tuTucData as unknown as KnowledgeFile,
    tuTucCohocFullData as unknown as KnowledgeFile,
  ],
  huynh_de: [STAR_COMBINATIONS, huynhDeCohocFullData as unknown as KnowledgeFile],
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
  // Key đã được normalize (không dấu, lowercase, underscore)
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
    // Aliases
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

  // Ưu tiên tổ hợp nhiều sao (star combinations)
  const basePriority = (interp as any).priority || 0;
  const starCountBonus = requiredStars.length >= 2 ? requiredStars.length * 10 : 0;
  const isSamePalace = interp.same_palace || (conditions as any).same_palace;
  const samePalaceBonus = isSamePalace ? 15 : 0;
  
  let score = 10 + requiredStars.length * 2 + basePriority + starCountBonus + samePalaceBonus;
  const reasons: string[] = requiredStars.length >= 2
    ? [`Tổ hợp ${requiredStars.join(" - ")} đồng cung`]
    : [`Có ${requiredStars.join(", ")} tại cung`];

  // Check position/branch
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

  // Check excluded stars
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
  
  // Tổ hợp sao có priority cao hơn
  const basePriority = (interp as any).priority || 0;
  const score = matchedCount === normalizedMeeting.length 
    ? 12 + basePriority + (meetingStars.length * 5) // Bonus cho nhiều sao hội
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

  // Normalize cả hai để so sánh (xử lý uppercase/lowercase)
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

  const palaceId = normalizePalaceId(context.palace.name);
  
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

function getAllInterpretations(files: KnowledgeFile[]): Array<{ interp: KnowledgeInterpretation; section: string }> {
  const results: Array<{ interp: KnowledgeInterpretation; section: string }> = [];

  for (const file of files) {
    // File có sections
    if (file.sections) {
      for (const section of file.sections) {
        // Handle both 'interpretations' and 'blocks' format
        const items = section.interpretations || (section as any).blocks || [];
        for (const item of items) {
          // Convert block format to interpretation format if needed
          const interp = convertToInterpretation(item);
          results.push({ interp, section: section.title });
        }
      }
    }
    // File có interpretations trực tiếp
    if (file.interpretations) {
      const sectionTitle = file.title || file.section_id || "Luận giải";
      for (const interp of file.interpretations) {
        results.push({ interp, section: sectionTitle });
      }
    }
    // File có blocks trực tiếp (cohoc-full format)
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
 * Convert cohoc block format to KnowledgeInterpretation format
 */
function convertToInterpretation(item: any): KnowledgeInterpretation {
  // If already in interpretation format
  if (item.id && item.text) {
    return item as KnowledgeInterpretation;
  }
  
  // Convert from block format (cohoc-full)
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

/**
 * Determine interpretation type from block data
 */
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

export function queryPalaceKnowledge(context: PalaceQueryContext): KnowledgeMatch[] {
  const palaceId = normalizePalaceId(context.palace.name);
  const files = PALACE_KNOWLEDGE[palaceId];

  if (!files || files.length === 0) return [];

  const allInterpretations = getAllInterpretations(files);
  const results: KnowledgeMatch[] = [];

  for (const { interp, section } of allInterpretations) {
    let match: { score: number; reasons: string[] } | null = null;

    // Try different matchers based on type
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
      case "general":
      default:
        // Try all matchers
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
    // Không thêm general fallback - chỉ lấy kết quả match chính xác
  }

  // Chỉ lấy kết quả match chính xác, không dùng fallback general
  // Yêu cầu: phải map đúng thì mới lấy lên
  const finalResults = results;

  // Sort by priority: 1. Tổ hợp sao (star_combination) 2. Sao trong cung 3. Phi hóa
  const getTypePriority = (type: string, score: number): number => {
    // Ưu tiên 0: Tổ hợp sao (star_combination) với score cao
    if (type === "star_combination" && score >= 50) return 0;
    // Ưu tiên 1: Sao trong cung với nhiều sao (score cao)
    if ((type === "star_in_palace" || type === "star_combination") && score >= 30) return 1;
    // Ưu tiên 2: Vị trí cung, can cung
    if (type === "position" || type === "heavenly_stem") return 2;
    // Ưu tiên 3: Sao trong cung, sao đồng cung
    if (type === "star_in_palace" || type === "star_combination" || type === "cach_cuc") return 3;
    // Ưu tiên 4: Tứ hóa tọa thủ
    if (type === "mutagen_in_palace" || type === "mutagen_combination") return 4;
    // Ưu tiên 5: Phi hóa
    if (type.startsWith("phi_")) return 5;
    // Ưu tiên 6: Khác
    return 6;
  };

  const sorted = finalResults.sort((a, b) => {
    const priorityA = getTypePriority(a.interpretation.type, a.matchScore);
    const priorityB = getTypePriority(b.interpretation.type, b.matchScore);
    if (priorityA !== priorityB) return priorityA - priorityB;
    // Cùng loại thì theo score cao hơn
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

  // Cho phép xem tối đa 10 luận giải mỗi cung (phải match đúng)
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
        // Check for Hóa Lộc, Hóa Quyền, etc.
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

export function formatKnowledgeSource(source: KnowledgeSource): string {
  const parts = [source.book];
  if (source.author) parts.push(source.author);
  if (source.translator) parts.push(`${source.translator} biên dịch`);
  return parts.join(" - ");
}

export function hasPalaceKnowledge(palaceName: string): boolean {
  return normalizePalaceId(palaceName) in PALACE_KNOWLEDGE;
}

export function getAvailablePalaces(): string[] {
  return Object.keys(PALACE_KNOWLEDGE);
}

/**
 * Query tổ hợp sao (star combinations) - ưu tiên cao nhất
 * Trả về các tổ hợp sao match với các sao trong cung
 */
export function queryStarCombinations(starsInPalace: string[]): KnowledgeMatch[] {
  const normalizedStars = starsInPalace.map(normalizeStarId);
  const results: KnowledgeMatch[] = [];
  
  const allInterpretations = getAllInterpretations([STAR_COMBINATIONS]);
  
  for (const { interp, section } of allInterpretations) {
    const conditions = interp.conditions || {};
    const requiredStars = conditions.required_stars || interp.required_stars || [];
    const meetingStars = conditions.meeting_stars || [];
    
    // Check required_stars (same palace)
    if (requiredStars.length >= 2) {
      const normalizedRequired = requiredStars.map(normalizeStarId);
      const hasAll = normalizedRequired.every((s) => normalizedStars.includes(s));
      
      if (hasAll) {
        const priority = (interp as any).priority || 0;
        results.push({
          interpretation: interp,
          section,
          matchScore: 100 + priority + (requiredStars.length * 10),
          matchReasons: [`Tổ hợp ${requiredStars.join(" - ")} đồng cung`],
        });
      }
    }
    
    // Check meeting_stars (tam hợp, hội chiếu)
    if (meetingStars.length >= 2) {
      const normalizedMeeting = meetingStars.map(normalizeStarId);
      const matchedCount = normalizedMeeting.filter((s) => normalizedStars.includes(s)).length;
      
      if (matchedCount === normalizedMeeting.length) {
        const priority = (interp as any).priority || 0;
        results.push({
          interpretation: interp,
          section,
          matchScore: 80 + priority + (meetingStars.length * 5),
          matchReasons: [`Hội đủ ${meetingStars.join(", ")}`],
        });
      }
    }
  }
  
  // Sort by score descending
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Lấy tất cả tổ hợp sao có sẵn trong knowledge base
 */
export function getAllStarCombinations(): KnowledgeInterpretation[] {
  const allInterpretations = getAllInterpretations([STAR_COMBINATIONS]);
  return allInterpretations
    .filter(({ interp }) => {
      const conditions = interp.conditions || {};
      const requiredStars = conditions.required_stars || interp.required_stars || [];
      const meetingStars = conditions.meeting_stars || [];
      return requiredStars.length >= 2 || meetingStars.length >= 2;
    })
    .map(({ interp }) => interp);
}
