export type BrightnessFull = "Miếu" | "Vượng" | "Đắc" | "Bình" | "Lợi" | "Hãm" | "";

export type BrightnessShort = "M" | "V" | "Đ" | "B" | "L" | "H" | "";

export type StarName = string;

export type EarthlyBranch =
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

export type BrightnessRule = {
  star: StarName;
  branch: EarthlyBranch;
  brightness: BrightnessFull;
  source?: string;
};

export type TuViSchoolProfile = {
  id: string;
  name: string;
  brightnessRules: BrightnessRule[];
  starAliases: Record<string, string>;
  specialStarAliases: Record<string, string>;
  palaceOwnerRules?: {
    soulByYearBranch?: Record<string, string>;
    bodyByBirthHourBranch?: Record<string, string>;
  };
  displayCycleStars?: boolean;
  batBrightnessFallback?: BrightnessFull;
};

export type SpecialMarker = {
  name: "Tuần" | "Triệt";
  palaceIndex: number;
  betweenPalaceIndexes?: [number, number];
  sourceStarName: string;
};

export type PatternResult = {
  code: string;
  name: string;
  matched: boolean;
  confidence: number;
  level: "basic" | "advanced" | "expert_required";
  palaceName?: string;
  evidence: string[];
  stars: string[];
};
