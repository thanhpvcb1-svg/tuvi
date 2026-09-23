import starsMasterJson from "../lib/tuvi/data/stars.master.json";
import { BRIGHTNESS_RULES } from "../lib/tuvi/rules/brightnessRules";
import { normalizeBranch } from "../lib/tuvi/normalize/normalizeBranch";
import { normalizeLookupKey } from "../lib/tuvi/utils";

export type Branch =
  | "Tý"
  | "Sửu"
  | "Dần"
  | "Mão"
  | "Thìn"
  | "Tỵ"
  | "Ngọ"
  | "Mùi"
  | "Thân"
  | "Dậu"
  | "Tuất"
  | "Hợi";

export type BrightnessCode = "M" | "V" | "Đ" | "BH" | "H";

type StarMasterRecord = {
  id: string;
  name_vi: string;
  aliases?: string[];
};

const BRANCHES: Branch[] = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const starsMaster = starsMasterJson as StarMasterRecord[];

export const BRIGHTNESS_LABEL: Record<BrightnessCode, string> = {
  M: "Miếu",
  V: "Vượng",
  Đ: "Đắc",
  BH: "Bình Hòa",
  H: "Hãm",
};

export const BRIGHTNESS_DISPLAY_CODE: Record<BrightnessCode, string> = {
  M: "M",
  V: "V",
  Đ: "Đ",
  BH: "BH",
  H: "H",
};

const starIdByName = new Map<string, string>();
const STAR_PREFIX_PATTERNS = [/^L\./i, /^ĐH\./i, /^LM\./i, /^LD\./i, /^LG\./i, /^LN\s+/i, /^Lưu\s+/i, /^Vận\s+/i];

for (const star of starsMaster) {
  starIdByName.set(normalizeLookupKey(star.name_vi), star.id);
  for (const alias of star.aliases ?? []) {
    starIdByName.set(normalizeLookupKey(alias), star.id);
  }
}

function normalizeConfigBrightness(input?: string): BrightnessCode | undefined {
  if (!input) return undefined;
  const normalized = input.trim().toUpperCase();
  if (normalized === "M") return "M";
  if (normalized === "V") return "V";
  if (normalized === "Đ" || normalized === "D") return "Đ";
  if (normalized === "B" || normalized === "BH" || normalized === "L") return "BH";
  if (normalized === "H") return "H";
  return undefined;
}

function buildBrightnessTable() {
  const table: Record<string, Partial<Record<Branch, BrightnessCode>>> = {};

  for (const rule of BRIGHTNESS_RULES) {
    const starId = starIdByName.get(normalizeLookupKey(rule.star));
    const brightness = normalizeConfigBrightness(rule.brightness);
    if (!starId || !brightness) {
      continue;
    }

    table[starId] ??= {};
    for (const branchLike of rule.branches ?? []) {
      const branch = normalizeBranch(branchLike) as Branch;
      if (BRANCHES.includes(branch)) {
        table[starId][branch] = brightness;
      }
    }
  }

  return table;
}

export const STAR_BRIGHTNESS = buildBrightnessTable();

function stripDerivedStarPrefixes(name: string) {
  let current = String(name || "").trim();
  let changed = true;

  while (changed) {
    changed = false;
    for (const pattern of STAR_PREFIX_PATTERNS) {
      const next = current.replace(pattern, "").trim();
      if (next !== current) {
        current = next;
        changed = true;
      }
    }
  }

  return current;
}

export function resolveStarIdFromName(name: string) {
  const trimmed = String(name || "").trim();
  return (
    starIdByName.get(normalizeLookupKey(trimmed)) ??
    starIdByName.get(normalizeLookupKey(stripDerivedStarPrefixes(trimmed)))
  );
}
