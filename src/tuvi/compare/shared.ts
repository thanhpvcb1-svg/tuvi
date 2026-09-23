import { normalizeBranch } from "../../lib/tuvi/normalize/normalizeBranch";
import { normalizePalaceName } from "../../lib/tuvi/normalize/normalizePalaceName";
import { normalizeStarName } from "../../lib/tuvi/normalize/normalizeStarName";
import { defaultVietnameseConfig } from "../../lib/tuvi/config/defaultVietnamese.config";
import { toPreferredStarName } from "../../lib/tuvi/rules/preferredStarNames";
import { normalizeLookupKey, safeText } from "../../lib/tuvi/utils";
import { normalizeCompareStarAlias } from "../config/starAliases";
import type { CompareMode, ComparePalace, CompareStar, CompareStarType } from "./types";

const BRIGHTNESS_PATTERN = /\((BH|M|V|Đ|B|L|H)\)\s*$/iu;
const COMPARE_PALACE_ALIASES: Record<string, string> = {
  [normalizeLookupKey("Thê Thiếp")]: "Phu Thê",
};
const DERIVED_STAR_NAME_PATTERNS = [/^L\./i, /^ĐH\./i, /^LM\./i, /^LD\./i, /^LG\./i, /^LN\s+/i, /^Lưu\s+/i, /^Vận\s+/i];

function repairMojibake(value: string) {
  if (!/[ÃÆáºá»Ä]/.test(value)) {
    return value;
  }

  const candidates = [value];

  try {
    candidates.push(decodeURIComponent(escape(value)));
  } catch {
    // ignore decode failure
  }

  try {
    const bytes = Uint8Array.from(value.split("").map((character) => character.charCodeAt(0) & 0xff));
    candidates.push(new TextDecoder("utf-8").decode(bytes));
  } catch {
    // ignore decode failure
  }

  const score = (input: string) => {
    const mojibakeHits = (input.match(/[ÃÆâ€áºá»Å]/g) ?? []).length;
    const vietnameseHits = (input.match(/[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/gi) ?? []).length;
    return vietnameseHits * 2 - mojibakeHits * 3;
  };

  return candidates.sort((left, right) => score(right) - score(left))[0];
}

export function normalizeComparePalaceName(value: unknown) {
  const repaired = repairMojibake(safeText(value));
  const alias = COMPARE_PALACE_ALIASES[normalizeLookupKey(repaired)] ?? repaired;
  return normalizePalaceName(alias, defaultVietnameseConfig);
}

export function normalizeCompareBranch(value: unknown) {
  return normalizeBranch(repairMojibake(safeText(value)));
}

export function parseStarToken(rawValue: unknown, type: CompareStarType, source: CompareStar["source"]): CompareStar | null {
  let rawName = "";

  if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
    const record = rawValue as Record<string, unknown>;
    const objectName = repairMojibake(safeText(record.Name ?? record.name));
    const objectStatus = repairMojibake(safeText(record.Status ?? record.status));
    rawName = objectStatus ? `${objectName}(${objectStatus})` : objectName;
  } else {
    rawName = repairMojibake(safeText(rawValue));
  }

  if (!rawName) {
    return null;
  }

  const brightnessMatch = rawName.match(BRIGHTNESS_PATTERN);
  const brightness = brightnessMatch?.[1] ?? "";
  const nameWithoutBrightness = brightnessMatch ? rawName.slice(0, brightnessMatch.index).trim() : rawName;
  const aliasNormalized = normalizeCompareStarAlias(nameWithoutBrightness);
  const normalizedInternalName = normalizeStarName(aliasNormalized, defaultVietnameseConfig.starAliases).name || aliasNormalized;
  const normalizedName = toPreferredStarName(normalizedInternalName);

  return {
    name: toPreferredStarName(nameWithoutBrightness),
    normalizedName,
    brightness,
    rawName,
    type,
    source,
  };
}

export function parseStarList(values: unknown, type: CompareStarType, source: CompareStar["source"]) {
  const items = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? values
          .split(/[\n,;]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  return items.map((item) => parseStarToken(item, type, source)).filter(Boolean) as CompareStar[];
}

export function dedupeCompareStars(stars: CompareStar[]) {
  return stars.filter((star, index, collection) => {
    const key = `${normalizeLookupKey(star.normalizedName)}|${star.brightness}|${star.type}`;
    return collection.findIndex((candidate) => `${normalizeLookupKey(candidate.normalizedName)}|${candidate.brightness}|${candidate.type}` === key) === index;
  });
}

export function buildPalace(source: CompareStar["source"], palace: {
  name: unknown;
  branch: unknown;
  mainStars?: CompareStar[];
  goodStars?: CompareStar[];
  badStars?: CompareStar[];
}) {
  const mainStars = dedupeCompareStars(palace.mainStars ?? []);
  const goodStars = dedupeCompareStars(palace.goodStars ?? []);
  const badStars = dedupeCompareStars(palace.badStars ?? []);
  const allStars = dedupeCompareStars([...mainStars, ...goodStars, ...badStars]);

  const result: ComparePalace = {
    name: normalizeComparePalaceName(palace.name),
    branch: normalizeCompareBranch(palace.branch),
    mainStars,
    goodStars,
    badStars,
    allStars,
  };

  return {
    ...result,
    allStars: result.allStars.map((star) => ({ ...star, source })),
  };
}

export function normalizeStarForDisplay(star: CompareStar) {
  return `${star.normalizedName}${star.brightness ? `(${star.brightness})` : ""}`;
}

export function isDerivedReferenceStarName(name: string) {
  const trimmed = String(name || "").trim();
  return DERIVED_STAR_NAME_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function shouldKeepCompareStar(star: CompareStar, mode: CompareMode) {
  if (mode === "full") {
    return true;
  }

  return !isDerivedReferenceStarName(star.rawName) && !isDerivedReferenceStarName(star.name);
}

export function countByKey(stars: CompareStar[], includeBrightness: boolean) {
  const counts = new Map<string, number>();

  for (const star of stars) {
    const key = includeBrightness
      ? `${normalizeLookupKey(star.normalizedName)}|${star.brightness}`
      : normalizeLookupKey(star.normalizedName);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}
