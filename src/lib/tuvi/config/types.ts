export type FiveElement = "kim" | "moc" | "thuy" | "hoa" | "tho";

export type Gender = "male" | "female";

export type LuuDisplayOptions = {
  showLuuTuHoa: boolean;
  showLuuTuDuc: boolean;
  showLuuDaiVan: boolean;
  showLuuOtherStars: boolean;
  showLocKyNhap: boolean;
  showLuuTuanTriet: boolean;
};

export type LuuStarCategory =
  | "luu-tu-hoa"
  | "luu-tu-duc"
  | "luu-dai-van"
  | "luu-other"
  | "loc-ky-nhap"
  | "luu-tuan-triet";

export type NormalizedBirthInput = {
  fullName: string;
  year: number;
  month: number;
  day: number;
  birthHour: number;
  birthMinute: number;
  birthHourIndex: number;
  gender: Gender;
  calendarType: "solar" | "lunar";
};

export type BrightnessShort = "M" | "V" | "Đ" | "B" | "L" | "H" | "BH" | "";

export type BrightnessSource = "iztro" | "school-rule" | "fallback-rule" | "manual-config" | "none";

export type StarColorGroup =
  | "majorRed"
  | "kim"
  | "moc"
  | "thuy"
  | "hoa"
  | "tho"
  | "green"
  | "orange"
  | "red"
  | "black"
  | "gray"
  | "lightGray"
  | "badgeBlack";

export type StarCategory =
  | "main_star"
  | "phu_dieu"
  | "ta_dieu"
  | "hoa_dieu"
  | "sat_dieu"
  | "tap_dieu"
  | "vong_sao"
  | "luu_tinh";

export type DisplayColumn = "center" | "left" | "right" | "bottom";

export type StarNature =
  | "cat"
  | "sat"
  | "loc"
  | "hoa_tot"
  | "hoa_quyen"
  | "hoa_ky"
  | "neutral"
  | "quy_nhan"
  | "van_tinh";

export type StarScope = "origin" | "cycle" | "annual" | "monthly" | "daily" | "hourly";

export type StarSource = "major" | "minor" | "adjective" | "cycle" | "mutagen" | "extra" | "annual";

export type HoroscopeStar = {
  name: string;
  baseName: string;
  originalName?: string;
  targetStar?: string;
  category: LuuStarCategory;
  scope: "decadal" | "yearly" | "monthly" | "daily" | "hourly";
  source: "iztro-horoscope" | "iztro-mutagen" | "school-rule" | "manual-config" | "unresolved";
  targetPalaceIndex?: number;
  targetPalaceName?: string;
  targetPalaceBranch?: string;
  heavenlyStem?: string;
  earthlyBranch?: string;
  brightness?: BrightnessShort;
  brightnessFull?: string;
  colorGroup?: StarColorGroup;
  isVisible?: boolean;
  warning?: string;
};

export type BrightnessRule = {
  star: string;
  branches: string[];
  branch?: string;
  palaces?: string[];
  scopes?: StarScope[];
  brightness: BrightnessShort;
  brightnessFull: string;
  priority?: number;
  source: "library" | "school" | "override" | "derived";
  note?: string;
};

export type ResolvedBrightness = {
  brightness: BrightnessShort;
  brightnessFull: string;
  source: BrightnessSource;
  matchedRule?: BrightnessRule;
};

export type MutagenRule = {
  yearStem: string;
  mutagens: {
    loc: string;
    quyen: string;
    khoa: string;
    ky: string;
  };
  brightness?: Partial<Record<"Lộc" | "Quyền" | "Khoa" | "Kỵ", BrightnessShort>>;
};

export type ExtraStarRule = {
  star: string;
  starKey?: string;
  source: "vietnamese-extra" | "cycle-derived" | "school-derived";
  group?: "main" | "minor" | "malefic" | "ring" | "tu_hoa" | "state";
  ringName?: string;
  side?: "left" | "right" | "center" | "top" | "bottom";
  placeBy:
    | { type: "yearStem"; map: Record<string, string> }
    | { type: "yearBranch"; map: Record<string, string> }
    | { type: "monthBranch"; map: Record<string, string> }
    | { type: "dayStem"; map: Record<string, string> }
    | { type: "hourBranch"; map: Record<string, string> }
    | { type: "palaceBranch"; map: Record<string, string> }
    | { type: "formula"; formulaId: string };
  visibleByDefault?: boolean;
};

export type AnnualStarRule = {
  star: string;
  source: "annual";
  placeBy:
    | { type: "yearStem"; map: Record<string, string> }
    | { type: "yearBranch"; map: Record<string, string> }
    | { type: "formula"; formulaId: string };
};

export type VisibleStarPolicy = {
  mode?: "standard" | "full";
  showAllRawStars?: boolean;
  showAllMajorStars?: boolean;
  showAllMinorStars?: boolean;
  showAllAdjectiveStars?: boolean;
  showCycleStars?: "none" | "whitelist" | "all";
  cycleStarMode?: "none" | "whitelist" | "all";
  cycleStarWhitelist: string[];
  hiddenFromVisible: string[];
  alwaysVisible: string[];
  showAnnualStars: boolean;
};

export type ColorPolicy = {
  mode: "byElementThenSemantic";
  elementToColor: Record<FiveElement, StarColorGroup>;
  semanticOverrides: Record<string, StarColorGroup>;
  mutagenColors: Record<"Lộc" | "Quyền" | "Khoa" | "Kỵ", StarColorGroup>;
};

export type SoulBodyPolicy = {
  mode: "school-derived";
  preserveRaw: true;
  soulByYearBranch?: Record<string, string>;
  bodyByBirthHourBranch?: Record<string, string>;
};

export type KhoiVietProfileName = "default" | "tuvichanco";
export type KhocHuProfileName = "default" | "tuvichanco";
export type LaiNhanProfileName = "standard" | "khamThienExcludeTySuu";

export type LaiNhanCung = {
  palace: string;
  palaceStem: string;
  palaceBranch: string;
  palaceStemBranch: string;
  functionalPalace?: string;
  profile: LaiNhanProfileName;
};

export type SchoolConfig = {
  id: string;
  name: string;
  starAliases: Record<string, string>;
  palaceAliases?: Record<string, string>;
  starElements: Record<string, FiveElement>;
  brightnessRules: BrightnessRule[];
  mutagenRules: MutagenRule[];
  extraStarRules: ExtraStarRule[];
  annualStarRules: AnnualStarRule[];
  visibleStarPolicy: VisibleStarPolicy;
  colorPolicy: ColorPolicy;
  soulBodyPolicy: SoulBodyPolicy;
  khoiVietProfile?: KhoiVietProfileName;
  khocHuProfile?: KhocHuProfileName;
};

export type NormalizedStar = {
  starKey?: string;
  displayName?: string;
  name: string;
  originalName?: string;
  rawName?: string;
  type?: string;
  source: StarSource;
  ruleGroup?: "main" | "minor" | "malefic" | "ring" | "tu_hoa" | "state";
  ringName?: string;
  side?: "left" | "right" | "center" | "top" | "bottom";
  baseStarKey?: string;
  scope: StarScope;
  horoscopeCategory?: LuuStarCategory;
  horoscopeSource?: HoroscopeStar["source"];
  targetStar?: string;
  mutagen?: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  brightness?: BrightnessShort;
  brightnessFull?: string;
  rawBrightness?: string;
  colorGroup?: StarColorGroup;
  hiddenReason?: string;
  isVisible?: boolean;
  warning?: string;
};

export type SpecialMarker = {
  name: "Tuần" | "Triệt";
  palaceIndex: number;
  betweenPalaceIndexes?: [number, number];
  sourceStarName: string;
};

export type NormalizedPalace = {
  index: number;
  name: string;
  heavenlyStem?: string;
  earthlyBranch?: string;
  palaceStem?: string;
  palaceBranch?: string;
  palaceStemBranch?: string;
  isBodyPalace: boolean;
  decadalRange?: string;
  ages?: number[];
  changsheng12?: string;
  boshi12?: string;
  suiqian12?: string;
  jiangqian12?: string;
  majorStars: NormalizedStar[];
  minorStars: NormalizedStar[];
  adjectiveStars: NormalizedStar[];
  cycleStars: NormalizedStar[];
  mutagenStars: NormalizedStar[];
  extraStars: NormalizedStar[];
  annualStars: NormalizedStar[];
  specialMarkers: SpecialMarker[];
  analysisStars: NormalizedStar[];
  visibleStars: NormalizedStar[];
};

export type ChartProfile = {
  fullName: string;
  gender: string;
  birthTime?: string;
  solarDate?: string;
  lunarDate?: string;
  chineseDate?: string;
  zodiac?: string;
  rawSoul?: string;
  rawBody?: string;
  soul?: string;
  body?: string;
  bodyPalaceBranch?: string;
  soulPalaceBranch?: string;
  yinYangLabel?: string;
  yinYangStatus?: string;
  natalElementName?: string;
  elementalStatus?: string;
  fiveElementsClass?: string;
  yearStem?: string;
  yearBranch?: string;
  laiNhanCung?: LaiNhanCung | null;
};

export type NormalizedChart = {
  profile: ChartProfile;
  palaces: NormalizedPalace[];
  input: NormalizedBirthInput;
  configId: string;
  rawChart: unknown;
  palaceStemMap?: Record<string, string>;
  laiNhanCung?: LaiNhanCung | null;
};

export type AnalysisChart = NormalizedChart & {
  analysisStars: NormalizedStar[];
  unresolvedExtraStarFormulas: string[];
};

export type IztroRawInspectionReport = {
  palaceCount: number;
  starsWithBrightness: string[];
  starsMissingBrightness: string[];
  starsWithMutagen: Array<{ star: string; mutagen: string; palace: string }>;
  specialStarsFound: string[];
  cycleStarsFound: string[];
  warnings: string[];
};

export type BrightnessInspectionReport = {
  star: string;
  palaceName: string;
  branch: string;
  scope: StarScope;
  iztroBrightness: string;
  finalBrightness: BrightnessShort;
  source: BrightnessSource;
  ruleNote?: string;
};

export type SnapshotCompareReport = {
  profile: string;
  palace: string;
  expectedMajorStars: string[];
  actualMajorStars: string[];
  missingVisibleStars: string[];
  extraVisibleStars: string[];
  brightnessMismatch: string[];
  colorMismatch: string[];
  mutagenMismatch: string[];
  annualStarsMissing: string[];
  rawOnlyHiddenStars: string[];
  unresolvedExtraStarFormulas: string[];
};

export type DisplayStar = {
  starId?: string;
  starKey?: string;
  name: string;
  originalName?: string;
  displayName?: string;
  ringName?: string;
  side?: "left" | "right" | "center" | "top" | "bottom";
  scope: StarScope;
  targetStar?: string;
  brightness?: BrightnessShort;
  brightnessFull?: string;
  mutagen?: string;
  colorGroup: StarColorGroup;
  color?: string;
  category?: StarCategory;
  groups?: string[];
  element?: FiveElement;
  nature?: StarNature;
  displayColumn?: DisplayColumn;
  display?: string;
  priority?: number;
  order?: number;
  source: StarSource;
};

export type DisplayPalace = Omit<
  NormalizedPalace,
  | "majorStars"
  | "minorStars"
  | "adjectiveStars"
  | "cycleStars"
  | "mutagenStars"
  | "extraStars"
  | "annualStars"
  | "analysisStars"
  | "visibleStars"
> & {
  majorStars: DisplayStar[];
  minorStars: DisplayStar[];
  adjectiveStars: DisplayStar[];
  specialStars: DisplayStar[];
  centerStars: DisplayStar[];
  leftStars: DisplayStar[];
  rightStars: DisplayStar[];
  bottomStars: DisplayStar[];
  goodStars: DisplayStar[];
  badStars: DisplayStar[];
  displayStars: DisplayStar[];
  analysisStars: DisplayStar[];
  visibleStars: DisplayStar[];
  bottomLeft?: string;
  bottomCenter?: string;
  bottomRight?: string;
};

export type DisplayChart = {
  profile: ChartProfile;
  palaces: DisplayPalace[];
  raw: unknown;
  palaceStemMap?: Record<string, string>;
  laiNhanCung?: LaiNhanCung | null;
  luuWarnings?: string[];
  luuInspection?: unknown;
  layers?: ChartLayers;
  normalized?: {
    schoolId: string;
    patterns: unknown[];
    debugReport?: string;
  };
};

export type ChartLayers = {
  rawChart: unknown;
  normalizedChart: NormalizedChart;
  analysisChart: AnalysisChart;
  displayChart: DisplayChart;
};

export type ExtraResolvedStar = {
  palaceBranch: string;
  star: NormalizedStar;
  unresolved?: boolean;
  formulaId?: string;
};

export type TuViProfileId =
  | "iztroRaw"
  | "tuvichancoCompatible"
  | "aituvicompatible"
  | "fullDebug"
  | "defaultVietnamese";

export type ChartFactoryOptions = {
  config?: SchoolConfig;
  profileId?: TuViProfileId;
  gender?: Gender;
  luuOptions?: LuuDisplayOptions;
  laiNhanProfile?: LaiNhanProfileName;
  horoscopeDate?: Date | string;
  horoscopeData?: unknown;
};
