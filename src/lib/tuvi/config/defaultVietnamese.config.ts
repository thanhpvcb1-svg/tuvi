import type { SchoolConfig } from "./types";
import { ANNUAL_STAR_RULES } from "../rules/annualStarRules";
import { BRIGHTNESS_RULES } from "../rules/brightnessRules";
import { DEFAULT_COLOR_POLICY } from "../rules/colorRules";
import { EXTRA_STAR_RULES } from "../rules/extraStarRules";
import { MUTAGEN_RULES } from "../rules/mutagenRules";
import { STAR_ALIAS_MAP } from "../rules/starAliases";
import { STAR_ELEMENTS } from "../rules/starElementRules";
import { AITUVI_VISIBLE_STAR_POLICY } from "../rules/visibleStarPolicy";
import { normalizeLookupKey } from "../utils";

export const STAR_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(STAR_ALIAS_MAP).flatMap(([key, value]) => [
    [key, value],
    [normalizeLookupKey(key), value],
  ]),
);

export const PALACE_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries({
    "Tử Nữ": "Tử Tức",
  }).flatMap(([key, value]) => [
    [key, value],
    [normalizeLookupKey(key), value],
  ]),
);

export const defaultVietnameseConfig: SchoolConfig = {
  id: "defaultVietnamese",
  name: "Default Vietnamese",
  starAliases: STAR_ALIASES,
  palaceAliases: PALACE_ALIASES,
  starElements: STAR_ELEMENTS,
  brightnessRules: BRIGHTNESS_RULES,
  mutagenRules: MUTAGEN_RULES,
  extraStarRules: EXTRA_STAR_RULES,
  annualStarRules: ANNUAL_STAR_RULES,
  visibleStarPolicy: AITUVI_VISIBLE_STAR_POLICY,
  colorPolicy: DEFAULT_COLOR_POLICY,
  soulBodyPolicy: {
    mode: "school-derived",
    preserveRaw: true,
    soulByYearBranch: {
      Dần: "Liêm Trinh",
    },
    bodyByBirthHourBranch: {
      Tý: "Văn Xương",
    },
  },
  khoiVietProfile: "default",
  khocHuProfile: "default",
};
