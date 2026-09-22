/**
 * Palace Knowledge Query Service
 * 
 * Lấy 3 tri thức ưu tiên cho mỗi cung theo thứ tự:
 * 1. Vị trí cung (position) - Mệnh tại Tuất, can Nhâm
 * 2. Chính tinh thủ mệnh (main_star) - Phá Quân, Tử Vi...
 * 3. Phi hóa (phi_hoa) - Lộc nhập Tật, Kỵ nhập Phúc...
 */

import type { DisplayPalace, DisplayStar } from "../config/types";

// ============ TYPES ============

export type KnowledgeType = "position" | "main_star" | "phi_hoa" | "minor_star" | "general";

export type KnowledgeSource = {
  book: string;
  author: string;
  translator?: string | null;
  url?: string;
};

export type KnowledgeItem = {
  id: string;
  type: KnowledgeType;
  typeLabel: string;
  title: string;
  text: string;
  matchScore: number;
  matchReasons: string[];
  source: KnowledgeSource;
};

export type PhiHoaItem = {
  id: string;
  type: "loc" | "quyen" | "khoa" | "ky";
  typeLabel: string;
  sourcePalace: string;
  targetPalace: string;
  text: string;
  source: KnowledgeSource;
};

export type PalaceKnowledgeResult = {
  palaceName: string;
  palacePosition: string;
  heavenlyStem: string;
  /** 3 tri thức ưu tiên */
  topKnowledge: KnowledgeItem[];
  /** Danh sách phi hóa để xem thêm */
  phiHoaList: PhiHoaItem[];
  /** Tổng số tri thức có sẵn */
  totalAvailable: number;
};

export type QueryContext = {
  palace: DisplayPalace;
  gender?: "male" | "female";
  allPalaces?: DisplayPalace[];
};

// ============ IMPORTS ============

// Import knowledge files
import menhChinhTinhData from "./cung/menh-chinh-tinh.json";
import menhPhiHoaData from "./cung/menh-phi-hoa.json";
import menhCohocFullData from "./cung/menh-cohoc-full.json";
import phuTheCohocFullData from "./cung/phu-the-cohoc-full.json";
import quanLocCohocFullData from "./cung/quan-loc-cohoc-full.json";
import taiBachCohocFullData from "./cung/tai-bach-cohoc-full.json";
import tatAchCohocFullData from "./cung/tat-ach-cohoc-full.json";
import phucDucCohocFullData from "./cung/phuc-duc-cohoc-full.json";
import thienDiCohocFullData from "./cung/thien-di-cohoc-full.json";
import dienTrachCohocFullData from "./cung/dien-trach-cohoc-full.json";
import phuMauCohocFullData from "./cung/phu-mau-cohoc-full.json";
import huynhDeCohocFullData from "./cung/huynh-de-cohoc-full.json";
import noBocCohocFullData from "./cung/no-boc-cohoc-full.json";
import tuTucCohocFullData from "./cung/tu-tuc-cohoc-full.json";

// ============ CONSTANTS ============

const TYPE_LABELS: Record<KnowledgeType, string> = {
  position: "Vị trí cung",
  main_star: "Chính tinh",
  phi_hoa: "Phi hóa",
  minor_star: "Phụ tinh",
  general: "Tổng quan",
};

const PHI_HOA_LABELS: Record<string, string> = {
  loc: "Hóa Lộc",
  quyen: "Hóa Quyền",
  khoa: "Hóa Khoa",
  ky: "Hóa Kỵ",
};

const MAIN_STARS = [
  "tử vi", "thiên cơ", "thái dương", "vũ khúc", "thiên đồng", "liêm trinh",
  "thiên phủ", "thái âm", "tham lang", "cự môn", "thiên tướng", "thiên lương",
  "thất sát", "phá quân",
];

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
    menh: "menh", phu_mau: "phu_mau", phuc_duc: "phuc_duc",
    dien_trach: "dien_trach", quan_loc: "quan_loc", no_boc: "no_boc",
    thien_di: "thien_di", tat_ach: "tat_ach", tai_bach: "tai_bach",
    tu_tuc: "tu_tuc", phu_the: "phu_the", huynh_de: "huynh_de",
  };
  return mapping[key] || key;
}

function normalizeBranch(branch: string): string {
  const key = normalizeKey(branch);
  const mapping: Record<string, string> = {
    ty: "tý", ti: "tý", suu: "sửu", dan: "dần", mao: "mão",
    thin: "thìn", ngo: "ngọ", mui: "mùi", than: "thân",
    dau: "dậu", tuat: "tuất", hoi: "hợi",
  };
  return mapping[key] || branch;
}

function isMainStar(starName: string): boolean {
  const normalized = normalizeKey(starName);
  return MAIN_STARS.some(s => normalizeKey(s) === normalized);
}

function getAllStarsInPalace(palace: DisplayPalace): string[] {
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

function getMainStarsInPalace(palace: DisplayPalace): string[] {
  return getAllStarsInPalace(palace).filter(isMainStar);
}

// ============ DATA REGISTRY ============

const PALACE_DATA: Record<string, any[]> = {
  menh: [menhChinhTinhData, menhPhiHoaData, menhCohocFullData],
  phu_the: [phuTheCohocFullData],
  quan_loc: [quanLocCohocFullData],
  tai_bach: [taiBachCohocFullData],
  tat_ach: [tatAchCohocFullData],
  phuc_duc: [phucDucCohocFullData],
  thien_di: [thienDiCohocFullData],
  dien_trach: [dienTrachCohocFullData],
  phu_mau: [phuMauCohocFullData],
  huynh_de: [huynhDeCohocFullData],
  no_boc: [noBocCohocFullData],
  tu_tuc: [tuTucCohocFullData],
};

// ============ BLOCK CLASSIFICATION ============

type RawBlock = {
  block_id?: string;
  id?: string;
  condition_text?: string;
  raw_text?: string;
  text?: string;
  conditions?: {
    palace?: string;
    position?: string | null;
    heavenly_stem?: string | null;
    required_stars?: string[];
    transformations?: string[];
    transformation_target?: string[];
  };
  source?: KnowledgeSource;
  accuracy?: number;
};

function classifyBlock(block: RawBlock, palaceBranch: string, heavenlyStem: string, starsInPalace: string[]): {
  type: KnowledgeType;
  score: number;
  reasons: string[];
} | null {
  const conditions = block.conditions || {};
  const conditionText = (block.condition_text || "").toLowerCase();
  const normalizedBranch = normalizeKey(palaceBranch);
  const normalizedStem = normalizeKey(heavenlyStem);
  const normalizedStars = starsInPalace.map(normalizeKey);

  // 1. Check PHI HÓA
  if (conditions.transformations?.length || conditionText.includes("hóa") && (
    conditionText.includes("lộc") || conditionText.includes("quyền") ||
    conditionText.includes("khoa") || conditionText.includes("kỵ")
  )) {
    const transformation = conditions.transformations?.[0]?.toLowerCase();
    const target = conditions.transformation_target?.[0];
    
    // Check if transformation matches current palace's can
    if (transformation && target) {
      return {
        type: "phi_hoa",
        score: 15,
        reasons: [`${PHI_HOA_LABELS[transformation] || transformation} nhập ${target}`],
      };
    }
    
    // Generic phi hoa mention
    if (conditionText.includes("lộc") || conditionText.includes("kỵ")) {
      return {
        type: "phi_hoa",
        score: 10,
        reasons: ["Phi hóa"],
      };
    }
  }

  // 2. Check POSITION (can + chi)
  if (conditions.heavenly_stem || conditionText.includes("can ")) {
    const stemMatch = conditions.heavenly_stem?.toLowerCase() === normalizedStem ||
      conditionText.includes(`can ${normalizedStem}`);
    if (stemMatch) {
      return {
        type: "position",
        score: 20,
        reasons: [`Cung can ${heavenlyStem}`],
      };
    }
  }

  // Check position by branch
  if (conditions.position) {
    const posMatch = normalizeKey(conditions.position) === normalizedBranch;
    if (posMatch) {
      return {
        type: "position",
        score: 18,
        reasons: [`Cung tại ${palaceBranch}`],
      };
    }
  }

  // 3. Check MAIN STAR
  const requiredStars = conditions.required_stars || [];
  if (requiredStars.length > 0) {
    const matchedMainStars = requiredStars.filter(star => {
      const normalizedStar = normalizeKey(star);
      return normalizedStars.includes(normalizedStar) && isMainStar(star);
    });

    if (matchedMainStars.length > 0) {
      return {
        type: "main_star",
        score: 16 + matchedMainStars.length,
        reasons: [`${matchedMainStars.join(", ")} thủ mệnh`],
      };
    }

    // Check minor stars
    const matchedMinorStars = requiredStars.filter(star => {
      const normalizedStar = normalizeKey(star);
      return normalizedStars.includes(normalizedStar) && !isMainStar(star);
    });

    if (matchedMinorStars.length > 0) {
      return {
        type: "minor_star",
        score: 8 + matchedMinorStars.length,
        reasons: [`Có ${matchedMinorStars.join(", ")}`],
      };
    }
  }

  // 4. Check by condition_text for star names
  for (const star of starsInPalace) {
    if (conditionText.includes(normalizeKey(star))) {
      const type = isMainStar(star) ? "main_star" : "minor_star";
      return {
        type,
        score: type === "main_star" ? 14 : 6,
        reasons: [`Có ${star}`],
      };
    }
  }

  return null;
}

// ============ MAIN QUERY ============

export function queryPalaceKnowledge(context: QueryContext): PalaceKnowledgeResult {
  const { palace } = context;
  const palaceId = normalizePalaceId(palace.name);
  const palaceBranch = palace.earthlyBranch || "";
  const heavenlyStem = palace.heavenlyStem || "";
  const starsInPalace = getAllStarsInPalace(palace);
  const mainStars = getMainStarsInPalace(palace);

  const dataFiles = PALACE_DATA[palaceId] || [];

  const positionItems: KnowledgeItem[] = [];
  const mainStarItems: KnowledgeItem[] = [];
  const phiHoaItems: KnowledgeItem[] = [];
  const otherItems: KnowledgeItem[] = [];
  const phiHoaList: PhiHoaItem[] = [];

  let totalBlocks = 0;

  // Process all data files
  for (const file of dataFiles) {
    const blocks: RawBlock[] = [];

    // Extract blocks from different file formats
    if (file.sections) {
      for (const section of file.sections) {
        if (section.blocks) blocks.push(...section.blocks);
        if (section.interpretations) blocks.push(...section.interpretations);
      }
    }
    if (file.interpretations) blocks.push(...file.interpretations);
    if (file.blocks) blocks.push(...file.blocks);

    totalBlocks += blocks.length;

    // Classify and score each block
    for (const block of blocks) {
      const classification = classifyBlock(block, palaceBranch, heavenlyStem, starsInPalace);
      if (!classification) continue;

      const text = block.raw_text || block.text || "";
      if (!text || text.length < 20) continue;

      const item: KnowledgeItem = {
        id: block.block_id || block.id || `${palaceId}_${totalBlocks}`,
        type: classification.type,
        typeLabel: TYPE_LABELS[classification.type],
        title: buildTitle(classification.type, classification.reasons, mainStars, palaceBranch, heavenlyStem),
        text: text.slice(0, 500) + (text.length > 500 ? "..." : ""),
        matchScore: classification.score,
        matchReasons: classification.reasons,
        source: block.source || { book: "Không rõ nguồn", author: "Unknown" },
      };

      // Categorize
      switch (classification.type) {
        case "position":
          positionItems.push(item);
          break;
        case "main_star":
          mainStarItems.push(item);
          break;
        case "phi_hoa":
          phiHoaItems.push(item);
          // Also add to phiHoaList for "xem thêm"
          const conditions = block.conditions || {};
          if (conditions.transformations?.[0] && conditions.transformation_target?.[0]) {
            phiHoaList.push({
              id: item.id,
              type: conditions.transformations[0].toLowerCase() as any,
              typeLabel: PHI_HOA_LABELS[conditions.transformations[0].toLowerCase()] || conditions.transformations[0],
              sourcePalace: palace.name,
              targetPalace: conditions.transformation_target[0],
              text: item.text,
              source: item.source,
            });
          }
          break;
        default:
          otherItems.push(item);
      }
    }
  }

  // Sort each category by score
  const sortByScore = (a: KnowledgeItem, b: KnowledgeItem) => b.matchScore - a.matchScore;
  positionItems.sort(sortByScore);
  mainStarItems.sort(sortByScore);
  phiHoaItems.sort(sortByScore);

  // Build top 3 knowledge (1 from each category if available)
  const topKnowledge: KnowledgeItem[] = [];

  // Priority 1: Position
  if (positionItems.length > 0) {
    topKnowledge.push(positionItems[0]);
  }

  // Priority 2: Main star
  if (mainStarItems.length > 0) {
    topKnowledge.push(mainStarItems[0]);
  }

  // Priority 3: Phi hóa
  if (phiHoaItems.length > 0) {
    topKnowledge.push(phiHoaItems[0]);
  }

  // Fill remaining slots if needed
  const remaining = [...positionItems.slice(1), ...mainStarItems.slice(1), ...phiHoaItems.slice(1), ...otherItems];
  remaining.sort(sortByScore);
  
  while (topKnowledge.length < 3 && remaining.length > 0) {
    const next = remaining.shift();
    if (next && !topKnowledge.some(k => k.id === next.id)) {
      topKnowledge.push(next);
    }
  }

  // Dedupe phiHoaList
  const seenPhiHoa = new Set<string>();
  const uniquePhiHoaList = phiHoaList.filter(item => {
    const key = `${item.type}_${item.targetPalace}`;
    if (seenPhiHoa.has(key)) return false;
    seenPhiHoa.add(key);
    return true;
  });

  return {
    palaceName: palace.name,
    palacePosition: normalizeBranch(palaceBranch),
    heavenlyStem,
    topKnowledge,
    phiHoaList: uniquePhiHoaList,
    totalAvailable: totalBlocks,
  };
}

function buildTitle(
  type: KnowledgeType,
  reasons: string[],
  mainStars: string[],
  branch: string,
  stem: string
): string {
  switch (type) {
    case "position":
      return `Cung ${stem} ${normalizeBranch(branch)}`;
    case "main_star":
      return mainStars.length > 0 ? `${mainStars[0]} thủ mệnh` : reasons[0] || "Chính tinh";
    case "phi_hoa":
      return reasons[0] || "Phi hóa";
    default:
      return reasons[0] || "Luận giải";
  }
}

// ============ EXPORTS ============

export function hasPalaceKnowledge(palaceName: string): boolean {
  return normalizePalaceId(palaceName) in PALACE_DATA;
}

export function getAvailablePalaces(): string[] {
  return Object.keys(PALACE_DATA);
}

export function formatSource(source: KnowledgeSource): string {
  const parts = [source.book];
  if (source.author && source.author !== "Unknown") parts.push(source.author);
  if (source.translator) parts.push(`${source.translator} dịch`);
  return parts.join(" - ");
}
