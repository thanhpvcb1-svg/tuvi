export type CompareStarType = "main" | "good" | "bad";
export type CompareMode = "full" | "natal";

export type CompareStar = {
  name: string;
  normalizedName: string;
  brightness: string;
  rawName: string;
  type: CompareStarType;
  source: "tuvichanco" | "local";
};

export type ComparePalace = {
  name: string;
  branch: string;
  mainStars: CompareStar[];
  goodStars: CompareStar[];
  badStars: CompareStar[];
  allStars: CompareStar[];
};

export type CompareProfile = {
  fullName?: string;
  gender?: string;
  solarDate?: string;
  lunarDate?: string;
  birthTime?: string;
  year?: number;
  month?: number;
  day?: number;
  annualYear?: number;
};

export type NormalizedCompareChart = {
  source: "tuvichanco" | "local";
  profile: CompareProfile;
  palaces: ComparePalace[];
};

export type PalaceStarMismatch = {
  palaceName: string;
  branch: string;
  stars: string[];
};

export type WrongBrightnessMismatch = {
  palaceName: string;
  branch: string;
  star: string;
  referenceBrightness: string;
  localBrightness: string;
};

export type WrongPalaceMismatch = {
  star: string;
  actualPalaceName: string;
  actualBranch: string;
  expectedPalaceName: string;
  expectedBranch: string;
};

export type DuplicateStarMismatch = {
  chartSource: "tuvichanco" | "local";
  palaceName: string;
  branch: string;
  star: string;
  count: number;
};

export type ComparePalaceResult = {
  palaceName: string;
  branch: string;
  matchedBy: "name" | "branch" | "index";
  missingStars: string[];
  extraStars: string[];
  wrongBrightness: WrongBrightnessMismatch[];
  duplicateStars: DuplicateStarMismatch[];
};

export type CompareChartsResult = {
  summary: {
    totalReferenceStars: number;
    matchedByNameCount: number;
    matchedByNameAndBrightnessCount: number;
    matchPercentByName: number;
    matchPercentByNameAndBrightness: number;
    duplicateStarsCount: number;
  };
  palaces: ComparePalaceResult[];
  wrongPalace: WrongPalaceMismatch[];
  duplicateStars: DuplicateStarMismatch[];
};
