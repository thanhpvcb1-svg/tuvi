/**
 * Knowledge Loader - Load và query tri thức từ các file JSON
 */

import type { DisplayPalace, DisplayChart } from "../config/types";

// ============ TYPES ============

export type KnowledgeConditions = {
  position?: string | string[];
  heavenly_stem?: string;
  required_stars?: string[];
  same_palace_stars?: string[];
  meeting_stars?: string[];
  excluded_stars?: string[];
  mutagen_in_palace?: string | string[];
  star_mutagen?: string;
  transformation?: string;
  source_palace?: string;
  target_palace?: string;
  clash_palace?: string;
  self_transformation?: string;
  m_code?: string;
  relation_palace?: string;
  gender?: "male" | "female";
};

export type KnowledgeInterpretation = {
  id: string;
  type: string;
  conditions: KnowledgeConditions;
  text: string;
  source: {
    book: string;
    author: string;
    translator?: string;
  };
};

export type KnowledgeSection = {
  section_id: string;
  title: string;
  interpretations: KnowledgeInterpretation[];
};

export type PalaceKnowledgeFile = {
  palace: string;
  sections?: KnowledgeSection[];
  section_id?: string;
  title?: string;
  interpretations?: KnowledgeInterpretation[];
};

export type KnowledgeMatch = {
  interpretation: KnowledgeInterpretation;
  score: number;
  matchReasons: string[];
};

// ============ NORMALIZE HELPERS ============

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "_")
    .trim();
}

const PALACE_MAP: Record<string, string> = {
  menh: "menh", mệnh: "menh",
  phu_mau: "phu_mau", "phụ mẫu": "phu_mau",
  phuc_duc: "phuc_duc", "phúc đức": "phuc_duc",
  dien_trach: "dien_trach", "điền trạch": "dien_trach",
  quan_loc: "quan_loc", "quan lộc": "quan_loc",
  no_boc: "no_boc", "nô bộc": "no_boc",
  thien_di: "thien_di", "thiên di": "thien_di",
  tat_ach: "tat_ach", "tật ách": "tat_ach",
  tai_bach: "tai_bach", "tài bạch": "tai_bach",
  tu_tuc: "tu_tuc", "tử tức": "tu_tuc", tu_nu: "tu_tuc",
  phu_the: "phu_the", "phu thê": "phu_the",
  huynh_de: "huynh_de", "huynh đệ": "huynh_de",
};

const BRANCH_MAP: Record<string, string> = {
  ty: "ty", tý: "ty", ti: "ty",
  suu: "suu", sửu: "suu",
  dan: "dan", dần: "dan",
  mao: "mao", mão: "mao",
  thin: "thin", thìn: "thin",
  ti: "ti", tị: "ti",
  ngo: "ngo", ngọ: "ngo",
  mui: "mui", mùi: "mui",
  than: "than", thân: "than",
  dau: "dau", dậu: "dau",
  tuat: "tuat", tuất: "tuat",
  hoi: "hoi", hợi: "hoi",
};

const STEM_MAP: Record<string, string> = {
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

export function normalizePalace(name: string): string {
  const key = normalizeKey(name);
  return PALACE_MAP[key] || key;
}

export function normalizeBranch(branch: string): string {
  const key = normalizeKey(branch);
  return BRANCH_MAP[key] || key;
}

export function normalizeStem(stem: string): string {
  const key = normalizeKey(stem);
  return STEM_MAP[key] || key;
}

export function normalizeStar(star: string): string {
  return normalizeKey(star);
}

// ============ QUERY FUNCTIONS ============

export function matchConditions(
  conditions: KnowledgeConditions,
  context: {
    palaceBranch?: string;
    palaceStem?: string;
    starsInPalace: string[];
    starsInChart: string[];
    mutagensInPalace: string[];
    phiHoa?: {
      transformation: string;
      sourcePalace: string;
      targetPalace: string;
    };
    gender?: "male" | "female";
  }
): { matched: boolean; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  let requiredMet = true;

  // Check position (địa chi)
  if (conditions.position) {
    const positions = Array.isArray(conditions.position) 
      ? conditions.position 
      : [conditions.position];
    const normalizedPositions = positions.map(normalizeBranch);
    const palaceBranch = normalizeBranch(context.palaceBranch || "");
    
    if (normalizedPositions.includes(palaceBranch)) {
      score += 5;
      reasons.push(`Cung an tại ${context.palaceBranch}`);
    } else {
      requiredMet = false;
    }
  }

  // Check heavenly stem (thiên can)
  if (conditions.heavenly_stem) {
    const condStem = normalizeStem(conditions.heavenly_stem);
    const palaceStem = normalizeStem(context.palaceStem || "");
    
    if (condStem === palaceStem) {
      score += 5;
      reasons.push(`Can cung ${context.palaceStem}`);
    } else {
      requiredMet = false;
    }
  }

  // Check required stars
  if (conditions.required_stars && conditions.required_stars.length > 0) {
    const normalizedRequired = conditions.required_stars.map(normalizeStar);
    const normalizedInPalace = context.starsInPalace.map(normalizeStar);
    
    const matched = normalizedRequired.filter(s => normalizedInPalace.includes(s));
    if (matched.length === normalizedRequired.length) {
      score += 10;
      reasons.push(`Có sao: ${conditions.required_stars.join(", ")}`);
    } else if (matched.length > 0) {
      score += 3;
      reasons.push(`Có một phần sao: ${matched.join(", ")}`);
    } else {
      requiredMet = false;
    }
  }

  // Check same palace stars
  if (conditions.same_palace_stars && conditions.same_palace_stars.length > 0) {
    const normalizedSame = conditions.same_palace_stars.map(normalizeStar);
    const normalizedInPalace = context.starsInPalace.map(normalizeStar);
    
    const matched = normalizedSame.filter(s => normalizedInPalace.includes(s));
    if (matched.length === normalizedSame.length) {
      score += 8;
      reasons.push(`Đồng cung: ${conditions.same_palace_stars.join(", ")}`);
    } else {
      requiredMet = false;
    }
  }

  // Check meeting stars (hội hợp)
  if (conditions.meeting_stars && conditions.meeting_stars.length > 0) {
    const normalizedMeeting = conditions.meeting_stars.map(normalizeStar);
    const normalizedInChart = context.starsInChart.map(normalizeStar);
    
    const matched = normalizedMeeting.filter(s => normalizedInChart.includes(s));
    if (matched.length === normalizedMeeting.length) {
      score += 6;
      reasons.push(`Hội hợp: ${conditions.meeting_stars.join(", ")}`);
    } else if (matched.length > 0) {
      score += 2;
    }
  }

  // Check mutagen in palace
  if (conditions.mutagen_in_palace) {
    const mutagenList = Array.isArray(conditions.mutagen_in_palace)
      ? conditions.mutagen_in_palace
      : [conditions.mutagen_in_palace];
    const normalizedMutagenCond = mutagenList.map(m => normalizeKey(m));
    const normalizedMutagenInPalace = context.mutagensInPalace.map(m => normalizeKey(m));
    
    const matched = normalizedMutagenCond.filter(m => normalizedMutagenInPalace.includes(m));
    if (matched.length === normalizedMutagenCond.length) {
      score += 8;
      reasons.push(`Hóa tinh: ${mutagenList.join(", ")}`);
    } else {
      requiredMet = false;
    }
  }

  // Check phi hóa
  if (conditions.transformation && conditions.source_palace && conditions.target_palace) {
    if (context.phiHoa) {
      const transMatch = normalizeKey(conditions.transformation) === normalizeKey(context.phiHoa.transformation);
      const sourceMatch = normalizePalace(conditions.source_palace) === normalizePalace(context.phiHoa.sourcePalace);
      const targetMatch = normalizePalace(conditions.target_palace) === normalizePalace(context.phiHoa.targetPalace);
      
      if (transMatch && sourceMatch && targetMatch) {
        score += 15;
        reasons.push(`Phi ${conditions.transformation} từ ${conditions.source_palace} đến ${conditions.target_palace}`);
      } else {
        requiredMet = false;
      }
    } else {
      requiredMet = false;
    }
  }

  // Check gender
  if (conditions.gender && context.gender) {
    if (conditions.gender === context.gender) {
      score += 3;
      reasons.push(`Giới tính: ${conditions.gender}`);
    } else {
      score -= 2;
    }
  }

  return {
    matched: requiredMet && score > 0,
    score,
    reasons,
  };
}

// ============ EXPORTS ============

export function queryPalaceKnowledge(
  knowledgeData: PalaceKnowledgeFile[],
  palace: DisplayPalace,
  chart: DisplayChart
): KnowledgeMatch[] {
  const results: KnowledgeMatch[] = [];
  const palaceKey = normalizePalace(palace.name);

  // Get all stars in palace
  const starsInPalace: string[] = [];
  const addStars = (stars: Array<{ name: string; originalName?: string }> | undefined) => {
    if (stars) {
      for (const s of stars) {
        starsInPalace.push(s.name);
        if (s.originalName) starsInPalace.push(s.originalName);
      }
    }
  };
  addStars(palace.majorStars);
  addStars(palace.minorStars);
  addStars(palace.centerStars);
  addStars(palace.leftStars);
  addStars(palace.rightStars);

  // Get mutagens in palace
  const mutagensInPalace: string[] = [];
  for (const star of [...(palace.majorStars || []), ...(palace.minorStars || [])]) {
    if (star.mutagen) {
      mutagensInPalace.push(star.mutagen);
    }
  }

  // Get all stars in chart
  const starsInChart: string[] = [];
  for (const p of chart.palaces) {
    addStars(p.majorStars);
    addStars(p.minorStars);
  }

  const context = {
    palaceBranch: palace.earthlyBranch,
    palaceStem: palace.heavenlyStem,
    starsInPalace: [...new Set(starsInPalace)],
    starsInChart: [...new Set(starsInChart)],
    mutagensInPalace,
    gender: chart.profile.gender as "male" | "female" | undefined,
  };

  // Query each knowledge file
  for (const file of knowledgeData) {
    if (normalizePalace(file.palace) !== palaceKey) continue;

    const sections = file.sections || (file.section_id ? [file as unknown as KnowledgeSection] : []);
    
    for (const section of sections) {
      for (const interp of section.interpretations || []) {
        const { matched, score, reasons } = matchConditions(interp.conditions, context);
        
        if (matched) {
          results.push({
            interpretation: interp,
            score,
            matchReasons: reasons,
          });
        }
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
