/**
 * Improved Knowledge Matcher
 * Cải thiện logic matching cho tính năng luận giải
 */

import type { DisplayPalace, DisplayStar } from "../config/types";

// ============ TYPES ============

export type MatchResult = {
  blockId: string;
  score: number;
  matchType: MatchType;
  matchReasons: string[];
  text: string;
  source: KnowledgeSource;
};

export type MatchType =
  | "star_combination"    // Tổ hợp sao (ưu tiên cao nhất)
  | "position_stem"       // Vị trí + Can cung
  | "main_star"          // Chính tinh thủ mệnh
  | "phi_hoa"            // Phi hóa
  | "minor_star"         // Phụ tinh
  | "m_code"             // M_CODE matching
  | "general";           // Tổng quan

export type KnowledgeSource = {
  book: string;
  author: string;
  translator?: string | null;
  url?: string;
};

export type MatchContext = {
  palace: DisplayPalace;
  starsInPalace: string[];
  starsInChart: string[];
  heavenlyStem: string;
  earthlyBranch: string;
  phiHoaFlows?: PhiHoaFlow[];
  gender?: "male" | "female";
  mCode?: string;
};

export type PhiHoaFlow = {
  type: "loc" | "quyen" | "khoa" | "ky";
  sourcePalace: string;
  targetPalace: string;
  starName?: string;
};

// ============ STAR ALIASES ============

const STAR_ALIASES: Record<string, string[]> = {
  tu_vi: ["tử vi", "tử-vi", "tu vi"],
  thien_co: ["thiên cơ", "thien co", "thiên-cơ"],
  thai_duong: ["thái dương", "thai duong", "thái-dương", "nhật"],
  vu_khuc: ["vũ khúc", "vu khuc", "vũ-khúc"],
  thien_dong: ["thiên đồng", "thien dong", "thiên-đồng"],
  liem_trinh: ["liêm trinh", "liem trinh", "liêm-trinh"],
  thien_phu: ["thiên phủ", "thien phu", "thiên-phủ"],
  thai_am: ["thái âm", "thai am", "thái-âm", "nguyệt"],
  tham_lang: ["tham lang", "tham-lang"],
  cu_mon: ["cự môn", "cu mon", "cự-môn"],
  thien_tuong: ["thiên tướng", "thien tuong", "thiên-tướng"],
  thien_luong: ["thiên lương", "thien luong", "thiên-lương"],
  that_sat: ["thất sát", "that sat", "thất-sát"],
  pha_quan: ["phá quân", "pha quan", "phá-quân"],
  // Phụ tinh
  van_xuong: ["văn xương", "van xuong", "văn-xương"],
  van_khuc: ["văn khúc", "van khuc", "văn-khúc"],
  ta_phu: ["tả phụ", "ta phu", "tả-phụ"],
  huu_bat: ["hữu bật", "huu bat", "hữu-bật"],
  thien_khoi: ["thiên khôi", "thien khoi", "thiên-khôi"],
  thien_viet: ["thiên việt", "thien viet", "thiên-việt"],
  loc_ton: ["lộc tồn", "loc ton", "lộc-tồn"],
  thien_ma: ["thiên mã", "thien ma", "thiên-mã"],
  // Sát tinh
  kinh_duong: ["kình dương", "kinh duong", "kình-dương"],
  da_la: ["đà la", "da la", "đà-la"],
  hoa_tinh: ["hỏa tinh", "hoa tinh", "hỏa-tinh"],
  linh_tinh: ["linh tinh", "linh-tinh"],
  dia_khong: ["địa không", "dia khong", "địa-không"],
  dia_kiep: ["địa kiếp", "dia kiep", "địa-kiếp"],
  // Tứ hóa
  hoa_loc: ["hóa lộc", "hoa loc", "hóa-lộc"],
  hoa_quyen: ["hóa quyền", "hoa quyen", "hóa-quyền"],
  hoa_khoa: ["hóa khoa", "hoa khoa", "hóa-khoa"],
  hoa_ky: ["hóa kỵ", "hoa ky", "hóa-kỵ"],
  // Đào hoa
  dao_hoa: ["đào hoa", "dao hoa", "đào-hoa"],
  hong_loan: ["hồng loan", "hong loan", "hồng-loan"],
  // Khác
  am_sat: ["âm sát", "am sat", "âm-sát"],
};

// ============ NORMALIZE FUNCTIONS ============

export function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[-\s]+/g, "_")
    .trim();
}

export function normalizeStarName(starName: string): string {
  const key = normalizeKey(starName);
  
  // Tìm trong aliases
  for (const [normalized, aliases] of Object.entries(STAR_ALIASES)) {
    if (normalized === key) return normalized;
    for (const alias of aliases) {
      if (normalizeKey(alias) === key) return normalized;
    }
  }
  
  return key;
}

export function normalizeBranch(branch: string): string {
  const key = normalizeKey(branch);
  const mapping: Record<string, string> = {
    ty: "ty", ti: "ty", tý: "ty",
    suu: "suu", sửu: "suu",
    dan: "dan", dần: "dan",
    mao: "mao", mão: "mao",
    thin: "thin", thìn: "thin",
    ti: "ti", tị: "ti", ty_: "ti",
    ngo: "ngo", ngọ: "ngo",
    mui: "mui", mùi: "mui",
    than: "than", thân: "than",
    dau: "dau", dậu: "dau",
    tuat: "tuat", tuất: "tuat",
    hoi: "hoi", hợi: "hoi",
  };
  return mapping[key] || key;
}

export function normalizeStem(stem: string): string {
  const key = normalizeKey(stem);
  const mapping: Record<string, string> = {
    giap: "giap", giáp: "giap",
    at: "at", ất: "at",
    binh: "binh", bính: "binh",
    dinh: "dinh", đinh: "dinh",
    mau: "mau", mậu: "mau",
    ky: "ky", kỷ: "ky",
    canh: "canh", canh: "canh",
    tan: "tan", tân: "tan",
    nham: "nham", nhâm: "nham",
    quy: "quy", quý: "quy",
  };
  return mapping[key] || key;
}

export function normalizePalace(palace: string): string {
  const key = normalizeKey(palace);
  const mapping: Record<string, string> = {
    menh: "menh", mệnh: "menh",
    phu_mau: "phu_mau", phụ_mẫu: "phu_mau",
    phuc_duc: "phuc_duc", phúc_đức: "phuc_duc",
    dien_trach: "dien_trach", điền_trạch: "dien_trach",
    quan_loc: "quan_loc", quan_lộc: "quan_loc",
    no_boc: "no_boc", nô_bộc: "no_boc",
    thien_di: "thien_di", thiên_di: "thien_di",
    tat_ach: "tat_ach", tật_ách: "tat_ach",
    tai_bach: "tai_bach", tài_bạch: "tai_bach",
    tu_tuc: "tu_tuc", tử_tức: "tu_tuc",
    phu_the: "phu_the", phu_thê: "phu_the",
    huynh_de: "huynh_de", huynh_đệ: "huynh_de",
  };
  return mapping[key] || key;
}

// ============ MAIN STARS LIST ============

const MAIN_STARS = new Set([
  "tu_vi", "thien_co", "thai_duong", "vu_khuc", "thien_dong", "liem_trinh",
  "thien_phu", "thai_am", "tham_lang", "cu_mon", "thien_tuong", "thien_luong",
  "that_sat", "pha_quan"
]);

export function isMainStar(starName: string): boolean {
  return MAIN_STARS.has(normalizeStarName(starName));
}

// ============ EXTRACT HELPERS ============

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
          mutagens.push(normalizeKey(star.mutagen));
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


// ============ CONDITION TEXT PARSER ============

export type ParsedCondition = {
  position?: string;
  heavenlyStem?: string;
  requiredStars: string[];
  transformationType?: string;
  transformationTarget?: string;
  mCode?: string;
  gender?: "male" | "female";
};

/**
 * Parse condition_text để extract thông tin matching
 * Ví dụ: "Cung Mệnh an tại Tuất có Phá quân" -> { position: "tuat", requiredStars: ["pha_quan"] }
 */
export function parseConditionText(conditionText: string): ParsedCondition {
  const result: ParsedCondition = { requiredStars: [] };
  const text = conditionText.toLowerCase();

  // Parse position (địa chi)
  const branchPatterns = [
    /an tại\s+(tý|sửu|dần|mão|thìn|tị|ngọ|mùi|thân|dậu|tuất|hợi)/i,
    /tại\s+(tý|sửu|dần|mão|thìn|tị|ngọ|mùi|thân|dậu|tuất|hợi)/i,
    /cung\s+(tý|sửu|dần|mão|thìn|tị|ngọ|mùi|thân|dậu|tuất|hợi)/i,
    /địa chi(?:\s+là)?\s+(tý|sửu|dần|mão|thìn|tị|ngọ|mùi|thân|dậu|tuất|hợi)/i,
  ];
  
  for (const pattern of branchPatterns) {
    const match = conditionText.match(pattern);
    if (match) {
      result.position = normalizeBranch(match[1]);
      break;
    }
  }

  // Parse heavenly stem (thiên can)
  const stemPatterns = [
    /can\s+(giáp|ất|bính|đinh|mậu|kỷ|canh|tân|nhâm|quý)/i,
    /thiên can(?:\s+là)?\s+(giáp|ất|bính|đinh|mậu|kỷ|canh|tân|nhâm|quý)/i,
    /(giáp|ất|bính|đinh|mậu|kỷ|canh|tân|nhâm|quý)\s+(tý|sửu|dần|mão|thìn|tị|ngọ|mùi|thân|dậu|tuất|hợi)/i,
  ];
  
  for (const pattern of stemPatterns) {
    const match = conditionText.match(pattern);
    if (match) {
      result.heavenlyStem = normalizeStem(match[1]);
      break;
    }
  }

  // Parse phi hóa
  const phiHoaPatterns = [
    /(lộc|quyền|khoa|kỵ)\s+(?:nhập|tới|đến)\s+(?:cung\s+)?(mệnh|phụ mẫu|phúc đức|điền trạch|quan lộc|nô bộc|thiên di|tật ách|tài bạch|tử tức|phu thê|huynh đệ)/i,
    /hóa\s+(lộc|quyền|khoa|kỵ)\s+nhập\s+(?:cung\s+)?(mệnh|phụ mẫu|phúc đức|điền trạch|quan lộc|nô bộc|thiên di|tật ách|tài bạch|tử tức|phu thê|huynh đệ)/i,
    /phi\s+hóa\s+(lộc|quyền|khoa|kỵ)\s+(?:tới|đến)\s+(?:cung\s+)?(mệnh|phụ mẫu|phúc đức|điền trạch|quan lộc|nô bộc|thiên di|tật ách|tài bạch|tử tức|phu thê|huynh đệ)/i,
  ];
  
  for (const pattern of phiHoaPatterns) {
    const match = conditionText.match(pattern);
    if (match) {
      result.transformationType = normalizeKey(match[1]);
      result.transformationTarget = normalizePalace(match[2]);
      break;
    }
  }

  // Parse required stars từ condition text
  const starPatterns = [
    /có\s+([^,]+?)(?:\s+thủ|\s+tọa|\s+đồng cung|,|$)/gi,
    /có\s+các sao\s+([^,]+)/gi,
    /([^,]+?)\s+thủ\s+mệnh/gi,
    /([^,]+?)\s+đồng cung/gi,
  ];
  
  for (const pattern of starPatterns) {
    let match;
    while ((match = pattern.exec(conditionText)) !== null) {
      const starText = match[1].trim();
      // Tách nhiều sao nếu có dấu phẩy hoặc "và"
      const stars = starText.split(/[,và]+/).map(s => s.trim()).filter(Boolean);
      for (const star of stars) {
        const normalized = normalizeStarName(star);
        if (normalized && !result.requiredStars.includes(normalized)) {
          result.requiredStars.push(normalized);
        }
      }
    }
  }

  // Parse M_CODE
  const mCodeMatch = conditionText.match(/M_CODE:(\w+)/i);
  if (mCodeMatch) {
    result.mCode = mCodeMatch[1].toLowerCase();
  }

  // Parse gender
  if (text.includes("nam mệnh") || text.includes("nam giới")) {
    result.gender = "male";
  } else if (text.includes("nữ mệnh") || text.includes("nữ giới")) {
    result.gender = "female";
  }

  return result;
}


// ============ SCORING WEIGHTS ============

const SCORE_WEIGHTS = {
  // Tổ hợp sao - ưu tiên cao nhất
  STAR_COMBINATION_EXACT: 100,      // Tất cả sao trong tổ hợp đều có
  STAR_COMBINATION_PARTIAL: 40,     // Một phần sao trong tổ hợp
  
  // Vị trí cung
  POSITION_EXACT: 50,               // Đúng địa chi
  STEM_EXACT: 45,                   // Đúng thiên can
  POSITION_AND_STEM: 70,            // Đúng cả địa chi và thiên can
  
  // Chính tinh
  MAIN_STAR_SINGLE: 35,             // 1 chính tinh match
  MAIN_STAR_MULTIPLE: 60,           // 2+ chính tinh match
  
  // Phi hóa
  PHI_HOA_EXACT: 80,                // Đúng loại hóa + target palace
  PHI_HOA_TYPE_ONLY: 30,            // Chỉ đúng loại hóa
  
  // Phụ tinh
  MINOR_STAR: 20,                   // Phụ tinh match
  
  // M_CODE
  M_CODE_EXACT: 55,                 // Đúng M_CODE
  
  // Bonus/Penalty
  SAME_PALACE_BONUS: 15,            // Bonus khi sao đồng cung
  GENDER_MATCH_BONUS: 10,           // Bonus khi đúng giới tính
  EXCLUDED_STAR_PENALTY: -30,       // Penalty khi có sao bị loại trừ
};

// ============ BLOCK MATCHER ============

export type RawBlock = {
  block_id?: string;
  id?: string;
  condition_text?: string;
  raw_text?: string;
  text?: string;
  conditions?: {
    palace?: string;
    position?: string | null;
    heavenly_stem?: string | null;
    gender?: string | null;
    required_stars?: string[];
    excluded_stars?: string[];
    same_palace_stars?: string[];
    meeting_stars?: string[];
    transformations?: string[];
    transformation_target?: string[];
    additional_conditions?: string[];
  };
  source?: KnowledgeSource;
  accuracy?: number;
  priority?: number;
};

/**
 * Match một block với context hiện tại
 * Trả về null nếu không match, hoặc MatchResult nếu match
 */
export function matchBlock(block: RawBlock, context: MatchContext): MatchResult | null {
  const conditions = block.conditions || {};
  const conditionText = block.condition_text || "";
  const parsedCondition = parseConditionText(conditionText);
  
  // Merge conditions từ JSON và parsed từ text
  const mergedConditions = mergeConditions(conditions, parsedCondition);
  
  let score = 0;
  const matchReasons: string[] = [];
  let matchType: MatchType = "general";

  const contextStars = context.starsInPalace.map(normalizeStarName);
  const contextBranch = normalizeBranch(context.earthlyBranch);
  const contextStem = normalizeStem(context.heavenlyStem);

  // 1. Check STAR COMBINATION (ưu tiên cao nhất)
  const starComboResult = matchStarCombination(mergedConditions, contextStars);
  if (starComboResult) {
    score += starComboResult.score;
    matchReasons.push(...starComboResult.reasons);
    matchType = "star_combination";
  }

  // 2. Check POSITION + STEM
  const positionResult = matchPosition(mergedConditions, contextBranch, contextStem);
  if (positionResult) {
    score += positionResult.score;
    matchReasons.push(...positionResult.reasons);
    if (matchType === "general") matchType = "position_stem";
  }

  // 3. Check MAIN STAR
  const mainStarResult = matchMainStars(mergedConditions, contextStars);
  if (mainStarResult) {
    score += mainStarResult.score;
    matchReasons.push(...mainStarResult.reasons);
    if (matchType === "general") matchType = "main_star";
  }

  // 4. Check PHI HÓA
  const phiHoaResult = matchPhiHoa(mergedConditions, context);
  if (phiHoaResult) {
    score += phiHoaResult.score;
    matchReasons.push(...phiHoaResult.reasons);
    if (matchType === "general") matchType = "phi_hoa";
  }

  // 5. Check MINOR STARS
  const minorStarResult = matchMinorStars(mergedConditions, contextStars);
  if (minorStarResult) {
    score += minorStarResult.score;
    matchReasons.push(...minorStarResult.reasons);
    if (matchType === "general") matchType = "minor_star";
  }

  // 6. Check M_CODE
  const mCodeResult = matchMCode(mergedConditions, context);
  if (mCodeResult) {
    score += mCodeResult.score;
    matchReasons.push(...mCodeResult.reasons);
    if (matchType === "general") matchType = "m_code";
  }

  // 7. Check EXCLUDED STARS (penalty)
  const excludedResult = checkExcludedStars(mergedConditions, contextStars);
  if (excludedResult) {
    score += excludedResult.score;
    matchReasons.push(...excludedResult.reasons);
  }

  // 8. Check GENDER bonus
  if (mergedConditions.gender && context.gender) {
    if (mergedConditions.gender === context.gender) {
      score += SCORE_WEIGHTS.GENDER_MATCH_BONUS;
      matchReasons.push(`Đúng giới tính ${context.gender === "male" ? "nam" : "nữ"}`);
    }
  }

  // Chỉ trả về nếu có match thực sự (score > 0 và có reason)
  if (score <= 0 || matchReasons.length === 0) {
    return null;
  }

  // Apply accuracy bonus nếu có
  if (block.accuracy) {
    score += block.accuracy;
  }

  return {
    blockId: block.block_id || block.id || "unknown",
    score,
    matchType,
    matchReasons,
    text: block.raw_text || block.text || "",
    source: block.source || { book: "Unknown", author: "Unknown" },
  };
}

// ============ MERGE CONDITIONS ============

type MergedConditions = {
  position?: string;
  heavenlyStem?: string;
  requiredStars: string[];
  excludedStars: string[];
  samePalaceStars: string[];
  meetingStars: string[];
  transformationType?: string;
  transformationTarget?: string;
  mCode?: string;
  gender?: "male" | "female";
};

function mergeConditions(
  jsonConditions: RawBlock["conditions"],
  parsedCondition: ParsedCondition
): MergedConditions {
  const cond = jsonConditions || {};
  
  return {
    position: cond.position ? normalizeBranch(cond.position) : parsedCondition.position,
    heavenlyStem: cond.heavenly_stem ? normalizeStem(cond.heavenly_stem) : parsedCondition.heavenlyStem,
    requiredStars: [
      ...(cond.required_stars || []).map(normalizeStarName),
      ...parsedCondition.requiredStars,
    ].filter((v, i, a) => a.indexOf(v) === i), // unique
    excludedStars: (cond.excluded_stars || []).map(normalizeStarName),
    samePalaceStars: (cond.same_palace_stars || []).map(normalizeStarName),
    meetingStars: (cond.meeting_stars || []).map(normalizeStarName),
    transformationType: cond.transformations?.[0]?.toLowerCase() || parsedCondition.transformationType,
    transformationTarget: cond.transformation_target?.[0] 
      ? normalizePalace(cond.transformation_target[0]) 
      : parsedCondition.transformationTarget,
    mCode: extractMCode(cond.additional_conditions) || parsedCondition.mCode,
    gender: parseGender(cond.gender) || parsedCondition.gender,
  };
}

function extractMCode(additionalConditions?: string[]): string | undefined {
  if (!additionalConditions) return undefined;
  for (const cond of additionalConditions) {
    const match = cond.match(/M_CODE:(\w+)/i);
    if (match) return match[1].toLowerCase();
  }
  return undefined;
}

function parseGender(gender?: string | null): "male" | "female" | undefined {
  if (!gender) return undefined;
  const g = gender.toLowerCase();
  if (g === "male" || g === "nam") return "male";
  if (g === "female" || g === "nữ" || g === "nu") return "female";
  return undefined;
}


// ============ SPECIFIC MATCHERS ============

type MatcherResult = { score: number; reasons: string[] } | null;

function matchStarCombination(
  conditions: MergedConditions,
  contextStars: string[]
): MatcherResult {
  const required = conditions.requiredStars;
  const samePalace = conditions.samePalaceStars;
  
  // Check same_palace_stars (tổ hợp sao đồng cung)
  if (samePalace.length >= 2) {
    const matched = samePalace.filter(s => contextStars.includes(s));
    if (matched.length === samePalace.length) {
      return {
        score: SCORE_WEIGHTS.STAR_COMBINATION_EXACT + (samePalace.length * 10),
        reasons: [`Tổ hợp ${samePalace.length} sao đồng cung: ${matched.join(", ")}`],
      };
    }
    if (matched.length >= 2) {
      return {
        score: SCORE_WEIGHTS.STAR_COMBINATION_PARTIAL + (matched.length * 5),
        reasons: [`Có ${matched.length}/${samePalace.length} sao trong tổ hợp`],
      };
    }
  }
  
  // Check required_stars với >= 2 sao
  if (required.length >= 2) {
    const matched = required.filter(s => contextStars.includes(s));
    if (matched.length === required.length) {
      return {
        score: SCORE_WEIGHTS.STAR_COMBINATION_EXACT + (required.length * 10),
        reasons: [`Đủ ${required.length} sao: ${matched.join(", ")}`],
      };
    }
    if (matched.length >= 2) {
      return {
        score: SCORE_WEIGHTS.STAR_COMBINATION_PARTIAL + (matched.length * 5),
        reasons: [`Có ${matched.length}/${required.length} sao yêu cầu`],
      };
    }
  }
  
  // Check meeting_stars (hội chiếu)
  const meeting = conditions.meetingStars;
  if (meeting.length >= 2) {
    const matched = meeting.filter(s => contextStars.includes(s));
    if (matched.length === meeting.length) {
      return {
        score: SCORE_WEIGHTS.STAR_COMBINATION_EXACT - 10,
        reasons: [`Hội đủ: ${matched.join(", ")}`],
      };
    }
    if (matched.length >= 2) {
      return {
        score: SCORE_WEIGHTS.STAR_COMBINATION_PARTIAL,
        reasons: [`Hội ${matched.length}/${meeting.length} sao`],
      };
    }
  }
  
  return null;
}

function matchPosition(
  conditions: MergedConditions,
  contextBranch: string,
  contextStem: string
): MatcherResult {
  const hasPosition = conditions.position && conditions.position === contextBranch;
  const hasStem = conditions.heavenlyStem && conditions.heavenlyStem === contextStem;
  
  if (hasPosition && hasStem) {
    return {
      score: SCORE_WEIGHTS.POSITION_AND_STEM,
      reasons: [`Cung ${contextStem.toUpperCase()} ${contextBranch.toUpperCase()}`],
    };
  }
  
  if (hasPosition) {
    return {
      score: SCORE_WEIGHTS.POSITION_EXACT,
      reasons: [`Cung tại ${contextBranch.toUpperCase()}`],
    };
  }
  
  if (hasStem) {
    return {
      score: SCORE_WEIGHTS.STEM_EXACT,
      reasons: [`Cung can ${contextStem.toUpperCase()}`],
    };
  }
  
  return null;
}

function matchMainStars(
  conditions: MergedConditions,
  contextStars: string[]
): MatcherResult {
  const required = conditions.requiredStars;
  if (required.length === 0) return null;
  
  // Chỉ xét khi có 1 sao (tổ hợp đã xử lý ở trên)
  if (required.length !== 1) return null;
  
  const star = required[0];
  if (!contextStars.includes(star)) return null;
  
  if (isMainStar(star)) {
    return {
      score: SCORE_WEIGHTS.MAIN_STAR_SINGLE,
      reasons: [`${star} thủ mệnh`],
    };
  }
  
  return null;
}

function matchMinorStars(
  conditions: MergedConditions,
  contextStars: string[]
): MatcherResult {
  const required = conditions.requiredStars;
  if (required.length !== 1) return null;
  
  const star = required[0];
  if (!contextStars.includes(star)) return null;
  
  if (!isMainStar(star)) {
    return {
      score: SCORE_WEIGHTS.MINOR_STAR,
      reasons: [`Có ${star}`],
    };
  }
  
  return null;
}

function matchPhiHoa(
  conditions: MergedConditions,
  context: MatchContext
): MatcherResult {
  const { transformationType, transformationTarget } = conditions;
  
  if (!transformationType) return null;
  
  // Nếu có phi hóa flows trong context
  if (context.phiHoaFlows && context.phiHoaFlows.length > 0) {
    for (const flow of context.phiHoaFlows) {
      const typeMatch = normalizeKey(flow.type) === normalizeKey(transformationType);
      const targetMatch = transformationTarget 
        ? normalizePalace(flow.targetPalace) === transformationTarget
        : true;
      
      if (typeMatch && targetMatch) {
        const typeLabel = getPhiHoaLabel(transformationType);
        return {
          score: SCORE_WEIGHTS.PHI_HOA_EXACT,
          reasons: [`${typeLabel} nhập ${flow.targetPalace}`],
        };
      }
      
      if (typeMatch) {
        const typeLabel = getPhiHoaLabel(transformationType);
        return {
          score: SCORE_WEIGHTS.PHI_HOA_TYPE_ONLY,
          reasons: [`Có ${typeLabel}`],
        };
      }
    }
  }
  
  return null;
}

function matchMCode(
  conditions: MergedConditions,
  context: MatchContext
): MatcherResult {
  if (!conditions.mCode || !context.mCode) return null;
  
  if (normalizeKey(conditions.mCode) === normalizeKey(context.mCode)) {
    return {
      score: SCORE_WEIGHTS.M_CODE_EXACT,
      reasons: [`M_CODE: ${conditions.mCode}`],
    };
  }
  
  return null;
}

function checkExcludedStars(
  conditions: MergedConditions,
  contextStars: string[]
): MatcherResult {
  const excluded = conditions.excludedStars;
  if (excluded.length === 0) return null;
  
  const hasExcluded = excluded.some(s => contextStars.includes(s));
  if (hasExcluded) {
    return {
      score: SCORE_WEIGHTS.EXCLUDED_STAR_PENALTY,
      reasons: ["Có sao bị loại trừ"],
    };
  }
  
  return null;
}

function getPhiHoaLabel(type: string): string {
  const labels: Record<string, string> = {
    loc: "Hóa Lộc",
    quyen: "Hóa Quyền",
    khoa: "Hóa Khoa",
    ky: "Hóa Kỵ",
  };
  return labels[normalizeKey(type)] || type;
}


// ============ MAIN QUERY FUNCTION ============

/**
 * Query tất cả blocks và trả về kết quả match, sắp xếp theo score
 */
export function queryKnowledge(
  blocks: RawBlock[],
  context: MatchContext,
  options?: { limit?: number; minScore?: number }
): MatchResult[] {
  const { limit = 10, minScore = 10 } = options || {};
  
  const results: MatchResult[] = [];
  
  for (const block of blocks) {
    const match = matchBlock(block, context);
    if (match && match.score >= minScore) {
      results.push(match);
    }
  }
  
  // Sort by score descending, then by matchType priority
  const typePriority: Record<MatchType, number> = {
    star_combination: 0,
    position_stem: 1,
    phi_hoa: 2,
    main_star: 3,
    m_code: 4,
    minor_star: 5,
    general: 6,
  };
  
  results.sort((a, b) => {
    // Ưu tiên score cao
    if (b.score !== a.score) return b.score - a.score;
    // Cùng score thì ưu tiên theo type
    return typePriority[a.matchType] - typePriority[b.matchType];
  });
  
  // Dedupe by text similarity
  const seen = new Set<string>();
  const deduped: MatchResult[] = [];
  
  for (const result of results) {
    const textKey = result.text.slice(0, 100);
    if (!seen.has(textKey)) {
      seen.add(textKey);
      deduped.push(result);
    }
  }
  
  return deduped.slice(0, limit);
}

/**
 * Query với phân loại theo type
 */
export function queryKnowledgeByType(
  blocks: RawBlock[],
  context: MatchContext
): Record<MatchType, MatchResult[]> {
  const allResults = queryKnowledge(blocks, context, { limit: 50, minScore: 5 });
  
  const byType: Record<MatchType, MatchResult[]> = {
    star_combination: [],
    position_stem: [],
    phi_hoa: [],
    main_star: [],
    m_code: [],
    minor_star: [],
    general: [],
  };
  
  for (const result of allResults) {
    byType[result.matchType].push(result);
  }
  
  return byType;
}

/**
 * Lấy top 3 tri thức ưu tiên (1 từ mỗi loại quan trọng)
 */
export function getTopKnowledge(
  blocks: RawBlock[],
  context: MatchContext
): MatchResult[] {
  const byType = queryKnowledgeByType(blocks, context);
  const top: MatchResult[] = [];
  
  // Priority order
  const priorities: MatchType[] = [
    "star_combination",
    "position_stem",
    "main_star",
    "phi_hoa",
    "m_code",
    "minor_star",
  ];
  
  for (const type of priorities) {
    if (byType[type].length > 0 && top.length < 3) {
      top.push(byType[type][0]);
    }
  }
  
  // Fill remaining slots
  const allSorted = Object.values(byType)
    .flat()
    .sort((a, b) => b.score - a.score);
  
  for (const result of allSorted) {
    if (top.length >= 3) break;
    if (!top.some(t => t.blockId === result.blockId)) {
      top.push(result);
    }
  }
  
  return top;
}

// ============ UTILITY EXPORTS ============

export {
  SCORE_WEIGHTS,
  STAR_ALIASES,
  MAIN_STARS,
};
