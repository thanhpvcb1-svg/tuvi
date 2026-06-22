import type { NormalizedStar } from "../config/types";
import { normalizeLookupKey, safeText } from "../utils";

const STRIP_PREFIX_PATTERN = /^(?:L\.|LN\.|ĐV\.|DV\.|Lưu\s+|Đại\s*Vận\s+)/i;
const DERIVED_PREFIX_PATTERN = /^(?:L\.|LN\.|ĐV\.|DV\.|Lưu\s+|Đại\s*Vận\s+)/i;
const BRIGHTNESS_SUFFIX_PATTERN = /\s*\((?:M|V|Đ|H|B|L|BH)\)\s*/gi;

const STAR_NAME_ALIASES: Record<string, string> = {
  "ta phu": "Tả Phụ",
};

function cleanupStarName(name: string) {
  return safeText(name).replace(STRIP_PREFIX_PATTERN, "").replace(BRIGHTNESS_SUFFIX_PATTERN, "").trim();
}

export function normalizeStarName(name: unknown) {
  const cleaned = cleanupStarName(safeText(name));
  if (!cleaned) {
    return "";
  }

  const normalizedAlias = STAR_NAME_ALIASES[normalizeLookupKey(cleaned)];
  return normalizedAlias ?? cleaned.replace(/\s+/g, " ");
}

export function isOriginalNatalStar(star: Pick<NormalizedStar, "name" | "originalName" | "source" | "scope" | "horoscopeCategory" | "rawName"> & {
  isAnnual?: boolean;
  isDecade?: boolean;
  type?: string;
}) {
  const sourceName = safeText(star.originalName || star.rawName || star.name);
  const sourceType = normalizeLookupKey(star.type);

  if (!sourceName) {
    return false;
  }

  if (DERIVED_PREFIX_PATTERN.test(sourceName)) {
    return false;
  }

  if (star.isAnnual || star.isDecade) {
    return false;
  }

  if (star.scope && star.scope !== "origin") {
    return false;
  }

  if (star.horoscopeCategory || star.source === "annual") {
    return false;
  }

  if (["annual", "year", "yearly", "decade", "decadal", "luu", "dai van"].includes(sourceType)) {
    return false;
  }

  return true;
}
