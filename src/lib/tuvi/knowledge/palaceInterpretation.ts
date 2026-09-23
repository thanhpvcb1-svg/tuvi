/**
 * Palace Interpretation Query Service
 * Query luận giải theo từng cung dựa trên context của lá số
 */

import type { DisplayPalace, Gender } from "../config/types";
import type {
  Interpretation,
  InterpretationMatch,
  PalaceInterpretationData,
  PhiHoaInterpretation,
  CachCucInterpretation,
  PalaceRelationInterpretation,
} from "./interpretationTypes";

// Import data
import menhData from "./cung/menh.json";

// Data registry
const PALACE_DATA: Record<string, PalaceInterpretationData> = {
  menh: menhData as PalaceInterpretationData,
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
  };
  return mapping[key] || key;
}

function normalizeBranch(branch: string): string {
  const key = normalizeKey(branch);
  const mapping: Record<string, string> = {
    ty: "ty", ti: "ty", suu: "suu", dan: "dan", mao: "mao",
    thin: "thin", ti_: "ti", ngo: "ngo", mui: "mui",
    than: "than", dau: "dau", tuat: "tuat", hoi: "hoi",
  };
  return mapping[key] || key;
}

function normalizeStarId(starName: string): string {
  return normalizeKey(starName);
}

// ============ QUERY CONTEXT ============

export type PalaceQueryContext = {
  palace: DisplayPalace;
  gender: Gender;
  starsInPalace: string[];
  branch: string;
  // Phi Cung context
  phiHoaFlows?: Array<{
    type: "loc" | "quyen" | "khoa" | "ky";
    sourcePalace: string;
    targetPalace: string;
    clashPalace?: string;
  }>;
  // Palace relations (M Di, M Phúc, etc.)
  palaceRelations?: Array<{
    code: string;
    relatedPalace: string;
  }>;
};

// ============ MATCHERS ============

function matchPhiHoa(
  interp: PhiHoaInterpretation,
  context: PalaceQueryContext
): { score: number; reasons: string[] } | null {
  if (!context.phiHoaFlows) return null;

  const palaceId = normalizePalaceId(context.palace.name);
  
  for (const flow of context.phiHoaFlows) {
    const sourceMatch = normalizeKey(flow.sourcePalace) === interp.source_palace;
    const targetMatch = normalizeKey(flow.targetPalace) === interp.target_palace;
    const typeMatch = `phi_${flow.type}` === interp.type;

    if (sourceMatch && targetMatch && typeMatch) {
      return {
        score: 20,
        reasons: [
          `${flow.sourcePalace} Hóa ${flow.type.toUpperCase()} nhập ${flow.targetPalace}`,
        ],
      };
    }
  }

  return null;
}

function matchCachCuc(
  interp: CachCucInterpretation,
  context: PalaceQueryContext
): { score: number; reasons: string[] } | null {
  const starsInPalace = context.starsInPalace.map(normalizeStarId);
  const branch = normalizeBranch(context.branch);

  // Check required stars
  const requiredStars = interp.required_stars.map(normalizeStarId);
  const hasAllRequired = requiredStars.every((s) => starsInPalace.includes(s));
  
  if (!hasAllRequired) return null;

  // Check branch if specified
  if (interp.branches && interp.branches.length > 0) {
    const normalizedBranches = interp.branches.map(normalizeBranch);
    if (!normalizedBranches.includes(branch)) return null;
  }

  // Check excluded stars
  if (interp.excluded_stars) {
    const excludedStars = interp.excluded_stars.map(normalizeStarId);
    const hasExcluded = excludedStars.some((s) => starsInPalace.includes(s));
    if (hasExcluded) {
      return {
        score: 10,
        reasons: [
          `Có ${interp.required_stars.join(", ")} nhưng có sao kỵ`,
          interp.warning || "",
        ].filter(Boolean),
      };
    }
  }

  return {
    score: 15,
    reasons: [`Cách cục: ${interp.required_stars.join(" + ")}`],
  };
}

function matchPalaceRelation(
  interp: PalaceRelationInterpretation,
  context: PalaceQueryContext
): { score: number; reasons: string[] } | null {
  if (!context.palaceRelations) return null;

  for (const rel of context.palaceRelations) {
    if (rel.code === interp.relation_code) {
      return {
        score: 12,
        reasons: [`Mệnh có ${interp.relation_code}`],
      };
    }
  }

  return null;
}

// ============ MAIN QUERY ============

export function queryPalaceInterpretations(
  context: PalaceQueryContext
): InterpretationMatch[] {
  const palaceId = normalizePalaceId(context.palace.name);
  const data = PALACE_DATA[palaceId];

  if (!data) return [];

  const results: InterpretationMatch[] = [];

  for (const section of data.sections) {
    for (const interp of section.interpretations) {
      let match: { score: number; reasons: string[] } | null = null;

      switch (interp.type) {
        case "phi_loc":
        case "phi_quyen":
        case "phi_khoa":
        case "phi_ky":
          match = matchPhiHoa(interp as PhiHoaInterpretation, context);
          break;
        case "cach_cuc":
          match = matchCachCuc(interp as CachCucInterpretation, context);
          break;
        case "palace_relation":
          match = matchPalaceRelation(
            interp as PalaceRelationInterpretation,
            context
          );
          break;
      }

      if (match && match.score > 0) {
        results.push({
          interpretation: interp,
          section: section.title,
          matchScore: match.score,
          matchReasons: match.reasons,
        });
      }
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

// ============ FORMAT OUTPUT ============

export function formatInterpretationForDisplay(
  match: InterpretationMatch
): string {
  const { interpretation, matchReasons } = match;
  const source = interpretation.source;

  const lines: string[] = [];
  
  // Header with match reason
  lines.push(`**${matchReasons[0]}**`);
  lines.push("");
  
  // Main text
  lines.push(interpretation.text);
  lines.push("");
  
  // Warning if exists
  if ("warning" in interpretation && interpretation.warning) {
    lines.push(`⚠️ ${interpretation.warning}`);
    lines.push("");
  }
  
  // Source
  const sourceParts = [source.book, source.author];
  if (source.translator) sourceParts.push(`${source.translator} biên dịch`);
  lines.push(`_${sourceParts.join(" - ")}_`);

  return lines.join("\n");
}

export function hasPalaceData(palaceName: string): boolean {
  return normalizePalaceId(palaceName) in PALACE_DATA;
}

export function getAvailablePalaces(): string[] {
  return Object.keys(PALACE_DATA);
}
