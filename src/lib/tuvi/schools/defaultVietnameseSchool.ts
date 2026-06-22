import { DEFAULT_VIETNAMESE_BRIGHTNESS_RULES } from "./brightnessTable";
import { BASE_STAR_ALIASES, CHINESE_ALIASES, SPECIAL_STAR_ALIASES } from "./starAliases";
import type { TuViSchoolProfile } from "./types";

export const defaultVietnameseSchool: TuViSchoolProfile = {
  id: "default-vietnamese-school",
  name: "Default Vietnamese School",
  brightnessRules: DEFAULT_VIETNAMESE_BRIGHTNESS_RULES,
  starAliases: {
    ...BASE_STAR_ALIASES,
    ...CHINESE_ALIASES,
  },
  specialStarAliases: SPECIAL_STAR_ALIASES,
  palaceOwnerRules: {
    soulByYearBranch: {
      Dần: "Liêm Trinh",
    },
    bodyByBirthHourBranch: {
      Tý: "Văn Xương",
    },
  },
  displayCycleStars: true,
  batBrightnessFallback: "Hãm",
};
