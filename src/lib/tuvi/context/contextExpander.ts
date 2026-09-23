/**
 * Context Expander Module
 * 
 * Mở rộng context của một cung để bao gồm:
 * - Tam hợp (3 cung cùng nhóm địa chi)
 * - Xung chiếu (đối cung)
 * - Giáp cung (2 cung kề)
 * - Phi Hóa incoming/outgoing
 * - Tứ Hóa tọa thủ
 */

import type { DisplayChart, DisplayPalace, DisplayStar } from "../config/types";
import { normalizeLookupKey } from "../utils";

// ============ TYPES ============

export type PalaceRelationType = 
  | "self"
  | "tam_hop"
  | "xung_chieu"
  | "giap_cung"
  | "luc_hop";

export type StarInContext = {
  name: string;
  originalName?: string;
  brightness?: string;
  mutagen?: string;
  source: "self" | "tam_hop" | "xung_chieu" | "giap_cung";
  sourcePalace: string;
  sourcePalaceIndex: number;
};

export type PhiHoaFlow = {
  type: "loc" | "quyen" | "khoa" | "ky";
  typeLabel: string;
  direction: "incoming" | "outgoing";
  sourcePalace: string;
  sourcePalaceIndex: number;
  targetPalace: string;
  targetPalaceIndex: number;
  targetStar: string;
  relation: "phi_nhap" | "tu_hoa" | "missing_star";
};

export type MutagenInContext = {
  type: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  starName: string;
  source: "self" | "tam_hop" | "xung_chieu" | "giap_cung";
  sourcePalace: string;
};

export type RelatedPalace = {
  palace: DisplayPalace;
  relation: PalaceRelationType;
  relationLabel: string;
};

export type ExpandedPalaceContext = {
  palace: DisplayPalace;
  palaceIndex: number;
  palaceName: string;
  earthlyBranch: string;
  heavenlyStem?: string;
  
  starsInPalace: string[];
  mainStarsInPalace: string[];
  
  starsInTamHop: StarInContext[];
  starsInXungChieu: StarInContext[];
  starsInGiapCung: StarInContext[];
  allStarsInContext: StarInContext[];
  
  mutagensInPalace: MutagenInContext[];
  mutagensInContext: MutagenInContext[];
  
  phiHoaOutgoing: PhiHoaFlow[];
  phiHoaIncoming: PhiHoaFlow[];
  
  tamHopPalaces: RelatedPalace[];
  xungChieuPalace: RelatedPalace | null;
  giapCungPalaces: RelatedPalace[];
  
  hasMainStar: boolean;
  isVoChinhDieu: boolean;
};

// ============ CONSTANTS ============

const TAM_HOP_GROUPS: Record<string, readonly [string, string, string]> = {
  "Thân": ["Thân", "Tý", "Thìn"],
  "Tý": ["Thân", "Tý", "Thìn"],
  "Thìn": ["Thân", "Tý", "Thìn"],
  "Dần": ["Dần", "Ngọ", "Tuất"],
  "Ngọ": ["Dần", "Ngọ", "Tuất"],
  "Tuất": ["Dần", "Ngọ", "Tuất"],
  "Tỵ": ["Tỵ", "Dậu", "Sửu"],
  "Dậu": ["Tỵ", "Dậu", "Sửu"],
  "Sửu": ["Tỵ", "Dậu", "Sửu"],
  "Hợi": ["Hợi", "Mão", "Mùi"],
  "Mão": ["Hợi", "Mão", "Mùi"],
  "Mùi": ["Hợi", "Mão", "Mùi"],
};

const BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;

const MAIN_STARS = new Set([
  "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh",
  "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương",
  "Thất Sát", "Phá Quân"
]);

// ============ HELPER FUNCTIONS ============

function normalizeBranch(branch: string): string {
  const key = normalizeLookupKey(branch);
  const mapping: Record<string, string> = {
    ty: "Tý", ti: "Tý", suu: "Sửu", dan: "Dần", mao: "Mão",
    thin: "Thìn", ty_: "Tỵ", ngo: "Ngọ", mui: "Mùi",
    than: "Thân", dau: "Dậu", tuat: "Tuất", hoi: "Hợi",
  };
  return mapping[key] || branch;
}

function getBranchIndex(branch: string): number {
  const normalized = normalizeBranch(branch);
  return BRANCHES.indexOf(normalized as typeof BRANCHES[number]);
}

function getBranchByIndex(index: number): string {
  return BRANCHES[((index % 12) + 12) % 12];
}

export function getOppositeBranch(branch: string): string {
  const index = getBranchIndex(branch);
  if (index < 0) return "";
  return getBranchByIndex(index + 6);
}

export function getTamHopBranches(branch: string): string[] {
  const normalized = normalizeBranch(branch);
  const group = TAM_HOP_GROUPS[normalized];
  if (!group) return [];
  return group.filter(b => b !== normalized);
}

export function getAllTamHopBranches(branch: string): string[] {
  const normalized = normalizeBranch(branch);
  const group = TAM_HOP_GROUPS[normalized];
  return group ? [...group] : [normalized];
}

export function getGiapCungBranches(branch: string): [string, string] {
  const index = getBranchIndex(branch);
  if (index < 0) return ["", ""];
  return [getBranchByIndex(index - 1), getBranchByIndex(index + 1)];
}

export function isMainStar(starName: string): boolean {
  return MAIN_STARS.has(starName);
}

function extractStarsFromPalace(palace: DisplayPalace): DisplayStar[] {
  return [
    ...(palace.majorStars || []),
    ...(palace.minorStars || []),
    ...(palace.centerStars || []),
    ...(palace.leftStars || []),
    ...(palace.rightStars || []),
    ...(palace.visibleStars || []),
  ];
}

function getStarNames(palace: DisplayPalace): string[] {
  const stars = extractStarsFromPalace(palace);
  const names = new Set<string>();
  for (const star of stars) {
    if (star.name) names.add(star.name);
  }
  return Array.from(names);
}

function getMainStarNames(palace: DisplayPalace): string[] {
  return getStarNames(palace).filter(isMainStar);
}

function findPalaceByBranch(chart: DisplayChart, branch: string): DisplayPalace | undefined {
  const normalized = normalizeBranch(branch);
  return chart.palaces.find(p => normalizeBranch(p.earthlyBranch || "") === normalized);
}

function toStarInContext(
  star: DisplayStar,
  source: StarInContext["source"],
  sourcePalace: DisplayPalace
): StarInContext {
  return {
    name: star.name,
    originalName: star.originalName,
    brightness: star.brightness,
    mutagen: star.mutagen,
    source,
    sourcePalace: sourcePalace.name,
    sourcePalaceIndex: sourcePalace.index,
  };
}

function getMutagensFromPalace(
  palace: DisplayPalace,
  source: MutagenInContext["source"]
): MutagenInContext[] {
  const mutagens: MutagenInContext[] = [];
  const stars = extractStarsFromPalace(palace);
  for (const star of stars) {
    if (star.mutagen) {
      mutagens.push({
        type: star.mutagen as MutagenInContext["type"],
        starName: star.name,
        source,
        sourcePalace: palace.name,
      });
    }
  }
  return mutagens;
}

// ============ MAIN FUNCTIONS ============

export function getTamHopPalaces(chart: DisplayChart, palace: DisplayPalace): RelatedPalace[] {
  const branch = palace.earthlyBranch;
  if (!branch) return [];
  const tamHopBranches = getTamHopBranches(branch);
  const result: RelatedPalace[] = [];
  for (const b of tamHopBranches) {
    const p = findPalaceByBranch(chart, b);
    if (p) {
      result.push({ palace: p, relation: "tam_hop", relationLabel: `Tam hợp (${b})` });
    }
  }
  return result;
}

export function getXungChieuPalace(chart: DisplayChart, palace: DisplayPalace): RelatedPalace | null {
  const branch = palace.earthlyBranch;
  if (!branch) return null;
  const oppositeBranch = getOppositeBranch(branch);
  const p = findPalaceByBranch(chart, oppositeBranch);
  if (p) {
    return { palace: p, relation: "xung_chieu", relationLabel: `Xung chiếu (${oppositeBranch})` };
  }
  return null;
}

export function getGiapCungPalaces(chart: DisplayChart, palace: DisplayPalace): RelatedPalace[] {
  const branch = palace.earthlyBranch;
  if (!branch) return [];
  const [prev, next] = getGiapCungBranches(branch);
  const result: RelatedPalace[] = [];
  const prevPalace = findPalaceByBranch(chart, prev);
  if (prevPalace) {
    result.push({ palace: prevPalace, relation: "giap_cung", relationLabel: `Giáp trước (${prev})` });
  }
  const nextPalace = findPalaceByBranch(chart, next);
  if (nextPalace) {
    result.push({ palace: nextPalace, relation: "giap_cung", relationLabel: `Giáp sau (${next})` });
  }
  return result;
}

export function getPhiHoaOutgoing(palace: DisplayPalace): PhiHoaFlow[] {
  const phiTuHoa = (palace as any).phiTuHoa;
  if (!phiTuHoa?.flows) return [];
  return phiTuHoa.flows.map((flow: any) => ({
    type: flow.type,
    typeLabel: flow.typeLabel,
    direction: "outgoing" as const,
    sourcePalace: palace.name,
    sourcePalaceIndex: palace.index,
    targetPalace: flow.targetPalaceName || "",
    targetPalaceIndex: -1,
    targetStar: flow.targetStar || "",
    relation: flow.relation,
  }));
}

export function getPhiHoaIncoming(chart: DisplayChart, targetPalace: DisplayPalace): PhiHoaFlow[] {
  const incoming: PhiHoaFlow[] = [];
  for (const palace of chart.palaces) {
    if (palace.index === targetPalace.index) continue;
    const phiTuHoa = (palace as any).phiTuHoa;
    if (!phiTuHoa?.flows) continue;
    for (const flow of phiTuHoa.flows) {
      const targetName = normalizeLookupKey(flow.targetPalaceName || "");
      const ourName = normalizeLookupKey(targetPalace.name);
      if (targetName === ourName && flow.relation !== "missing_star") {
        incoming.push({
          type: flow.type,
          typeLabel: flow.typeLabel,
          direction: "incoming",
          sourcePalace: palace.name,
          sourcePalaceIndex: palace.index,
          targetPalace: targetPalace.name,
          targetPalaceIndex: targetPalace.index,
          targetStar: flow.targetStar || "",
          relation: flow.relation,
        });
      }
    }
  }
  return incoming;
}

export function expandPalaceContext(
  chart: DisplayChart,
  palace: DisplayPalace
): ExpandedPalaceContext {
  const tamHopPalaces = getTamHopPalaces(chart, palace);
  const xungChieuPalace = getXungChieuPalace(chart, palace);
  const giapCungPalaces = getGiapCungPalaces(chart, palace);
  
  const starsInPalace = getStarNames(palace);
  const mainStarsInPalace = getMainStarNames(palace);
  
  const starsInTamHop: StarInContext[] = [];
  for (const rp of tamHopPalaces) {
    for (const star of extractStarsFromPalace(rp.palace)) {
      starsInTamHop.push(toStarInContext(star, "tam_hop", rp.palace));
    }
  }
  
  const starsInXungChieu: StarInContext[] = [];
  if (xungChieuPalace) {
    for (const star of extractStarsFromPalace(xungChieuPalace.palace)) {
      starsInXungChieu.push(toStarInContext(star, "xung_chieu", xungChieuPalace.palace));
    }
  }
  
  const starsInGiapCung: StarInContext[] = [];
  for (const rp of giapCungPalaces) {
    for (const star of extractStarsFromPalace(rp.palace)) {
      starsInGiapCung.push(toStarInContext(star, "giap_cung", rp.palace));
    }
  }
  
  const selfStars = extractStarsFromPalace(palace).map(s => toStarInContext(s, "self", palace));
  const allStarsInContext = [...selfStars, ...starsInTamHop, ...starsInXungChieu, ...starsInGiapCung];
  
  const mutagensInPalace = getMutagensFromPalace(palace, "self");
  const mutagensInContext = [
    ...mutagensInPalace,
    ...tamHopPalaces.flatMap(rp => getMutagensFromPalace(rp.palace, "tam_hop")),
    ...(xungChieuPalace ? getMutagensFromPalace(xungChieuPalace.palace, "xung_chieu") : []),
    ...giapCungPalaces.flatMap(rp => getMutagensFromPalace(rp.palace, "giap_cung")),
  ];
  
  const phiHoaOutgoing = getPhiHoaOutgoing(palace);
  const phiHoaIncoming = getPhiHoaIncoming(chart, palace);
  
  return {
    palace,
    palaceIndex: palace.index,
    palaceName: palace.name,
    earthlyBranch: palace.earthlyBranch || "",
    heavenlyStem: palace.heavenlyStem,
    starsInPalace,
    mainStarsInPalace,
    starsInTamHop,
    starsInXungChieu,
    starsInGiapCung,
    allStarsInContext,
    mutagensInPalace,
    mutagensInContext,
    phiHoaOutgoing,
    phiHoaIncoming,
    tamHopPalaces,
    xungChieuPalace,
    giapCungPalaces,
    hasMainStar: mainStarsInPalace.length > 0,
    isVoChinhDieu: mainStarsInPalace.length === 0,
  };
}

export function expandAllPalaceContexts(chart: DisplayChart): Map<number, ExpandedPalaceContext> {
  const contexts = new Map<number, ExpandedPalaceContext>();
  for (const palace of chart.palaces) {
    contexts.set(palace.index, expandPalaceContext(chart, palace));
  }
  return contexts;
}
