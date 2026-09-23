/**
 * Knowledge Query Service
 * Query knowledge blocks based on chart conditions
 */

import type { DisplayPalace, DisplayStar, Gender } from "../config/types";

// ============ TYPES ============

export type KnowledgeSource = {
  book: string;
  author: string;
  translator: string | null;
};

export type KnowledgeBlock = {
  id: string;
  star_id: string;
  star_name: string;
  text: string;
  branches?: string[];
  branch_names?: string[];
  combination?: string[];
  gender?: "male" | "female";
  source: KnowledgeSource;
};

export type KnowledgeMatch = {
  block: KnowledgeBlock;
  matchScore: number;
  matchReasons: string[];
};

export type QueryContext = {
  palace: DisplayPalace;
  gender: Gender;
  allStarsInPalace: string[];
  allStarsInChart: string[];
};

// ============ DATA ============

type PalaceKnowledgeData = {
  palace: string;
  palace_name: string;
  interpretations: Array<{
    star_id: string;
    star_name: string;
    branches?: string[];
    branch_names?: string[];
    combination?: string[];
    text: string;
    source: KnowledgeSource;
  }>;
};

const KNOWLEDGE_DATA: Record<string, PalaceKnowledgeData> = {
  // Knowledge data removed - using AI streaming instead
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

function normalizePalaceName(name: string): string {
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
  };
  return mapping[key] || key;
}

function normalizeStarId(starName: string): string {
  const key = normalizeKey(starName);
  const mapping: Record<string, string> = {
    tu_vi: "tu_vi",
    thien_co: "thien_co",
    thai_duong: "thai_duong",
    vu_khuc: "vu_khuc",
    thien_dong: "thien_dong",
    liem_trinh: "liem_trinh",
    thien_phu: "thien_phu",
    thai_am: "thai_am",
    tham_lang: "tham_lang",
    cu_mon: "cu_mon",
    thien_tuong: "thien_tuong",
    thien_luong: "thien_luong",
    that_sat: "that_sat",
    pha_quan: "pha_quan",
    thien_ma: "thien_ma",
    loc_ton: "loc_ton",
    van_xuong: "van_xuong",
    van_khuc: "van_khuc",
    ta_phu: "ta_phu",
    huu_bat: "huu_bat",
    thien_khoi: "thien_khoi",
    thien_viet: "thien_viet",
    kinh_duong: "kinh_duong",
    da_la: "da_la",
    hoa_tinh: "hoa_tinh",
    linh_tinh: "linh_tinh",
    dia_khong: "dia_khong",
    dia_kiep: "dia_kiep",
  };
  return mapping[key] || key;
}

function normalizeBranch(branch: string): string {
  const key = normalizeKey(branch);
  const mapping: Record<string, string> = {
    ty: "ty",
    ti: "ty",
    suu: "suu",
    dan: "dan",
    mao: "mao",
    thin: "thin",
    ti_: "ti",
    ty_: "ti",
    ngo: "ngo",
    mui: "mui",
    than: "than",
    dau: "dau",
    tuat: "tuat",
    hoi: "hoi",
  };
  return mapping[key] || key;
}

// ============ QUERY FUNCTIONS ============

/**
 * Query knowledge blocks for a palace based on chart context
 */
export function queryKnowledgeBlocks(context: QueryContext): KnowledgeMatch[] {
  const palaceKey = normalizePalaceName(context.palace.name);
  const knowledgeData = KNOWLEDGE_DATA[palaceKey];

  if (!knowledgeData) {
    return [];
  }

  const results: KnowledgeMatch[] = [];
  const palaceBranch = normalizeBranch(context.palace.earthlyBranch || "");
  const starsInPalace = context.allStarsInPalace.map(normalizeStarId);
  const starsInChart = context.allStarsInChart.map(normalizeStarId);

  for (const item of knowledgeData.interpretations) {
    const matchReasons: string[] = [];
    let matchScore = 0;

    // Check star match
    const starId = normalizeStarId(item.star_id);
    if (starsInPalace.includes(starId)) {
      matchScore += 10;
      matchReasons.push(`Sao ${item.star_name} có trong cung`);
    } else {
      continue; // Skip if main star not in palace
    }

    // Check branch match
    if (item.branches && item.branches.length > 0) {
      const normalizedBranches = item.branches.map(normalizeBranch);
      if (normalizedBranches.includes(palaceBranch)) {
        matchScore += 5;
        matchReasons.push(`Cung an tại ${context.palace.earthlyBranch}`);
      } else {
        // Branch specified but doesn't match - lower priority
        matchScore -= 3;
      }
    }

    // Check combination (hội) match
    if (item.combination && item.combination.length > 0) {
      const normalizedCombination = item.combination.map(normalizeStarId);
      const matchedCombination = normalizedCombination.filter(
        (s) => starsInPalace.includes(s) || starsInChart.includes(s)
      );

      if (matchedCombination.length === normalizedCombination.length) {
        matchScore += 8;
        matchReasons.push(`Hội đủ: ${item.combination.join(", ")}`);
      } else if (matchedCombination.length > 0) {
        matchScore += 3;
        matchReasons.push(`Hội một phần: ${matchedCombination.join(", ")}`);
      } else {
        // Combination required but not met - skip or lower priority
        matchScore -= 5;
      }
    }

    // Only include if score is positive
    if (matchScore > 0) {
      results.push({
        block: {
          id: `${palaceKey}_${item.star_id}_${results.length}`,
          star_id: item.star_id,
          star_name: item.star_name,
          text: item.text,
          branches: item.branches,
          branch_names: item.branch_names,
          combination: item.combination,
          source: item.source,
        },
        matchScore,
        matchReasons,
      });
    }
  }

  // Sort by match score descending
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get all stars in a palace (all columns)
 */
export function getAllStarsInPalace(palace: DisplayPalace): string[] {
  const stars: string[] = [];

  const addStars = (starList: DisplayStar[] | undefined) => {
    if (starList) {
      for (const star of starList) {
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
  addStars(palace.goodStars);
  addStars(palace.badStars);

  return [...new Set(stars)];
}

/**
 * Get all stars in entire chart
 */
export function getAllStarsInChart(palaces: DisplayPalace[]): string[] {
  const stars: string[] = [];
  for (const palace of palaces) {
    stars.push(...getAllStarsInPalace(palace));
  }
  return [...new Set(stars)];
}

/**
 * Format source for display
 */
export function formatKnowledgeSource(source: KnowledgeSource): string {
  const parts = [source.book];
  if (source.author && source.author !== "Unknown") {
    parts.push(source.author);
  }
  if (source.translator) {
    parts.push(`${source.translator} biên dịch`);
  }
  return parts.join(" - ");
}

/**
 * Check if knowledge data exists for a palace
 */
export function hasKnowledgeData(palaceName: string): boolean {
  const palaceKey = normalizePalaceName(palaceName);
  return palaceKey in KNOWLEDGE_DATA;
}

/**
 * Get available palaces with knowledge data
 */
export function getAvailablePalaces(): string[] {
  return Object.keys(KNOWLEDGE_DATA);
}
