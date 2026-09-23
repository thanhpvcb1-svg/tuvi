import type { BrightnessShort, Gender, KhoiVietProfileName, KhocHuProfileName } from "../config/types";

export const PALACES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;

export type PalaceName = (typeof PALACES)[number];
export type Direction = "forward" | "backward";
export type YinYang = "Dương" | "Âm";
export type NatalRuleGroup = "main" | "minor" | "malefic" | "ring" | "tu_hoa" | "state";
export type NatalRuleSource = "natal" | "annual" | "decade" | "transit";
export type NatalRuleSide = "left" | "right" | "center" | "top" | "bottom";

export type NatalRuleStar = {
  starKey: string;
  displayName: string;
  palace: PalaceName;
  source: NatalRuleSource;
  group: NatalRuleGroup;
  ringName?: string;
  color?: string;
  side?: NatalRuleSide;
  brightness?: BrightnessShort | null;
};

const YIN_YANG_BY_STEM: Record<string, YinYang> = {
  Giáp: "Dương",
  Ất: "Âm",
  Bính: "Dương",
  Đinh: "Âm",
  Mậu: "Dương",
  Kỷ: "Âm",
  Canh: "Dương",
  Tân: "Âm",
  Nhâm: "Dương",
  Quý: "Âm",
};

const STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"] as const;
const BRANCH_GROUP_BY_YEAR_BRANCH: Record<PalaceName, "Thân Tý Thìn" | "Dần Ngọ Tuất" | "Hợi Mão Mùi" | "Tỵ Dậu Sửu"> = {
  Tý: "Thân Tý Thìn",
  Sửu: "Tỵ Dậu Sửu",
  Dần: "Dần Ngọ Tuất",
  Mão: "Hợi Mão Mùi",
  Thìn: "Thân Tý Thìn",
  Tỵ: "Tỵ Dậu Sửu",
  Ngọ: "Dần Ngọ Tuất",
  Mùi: "Hợi Mão Mùi",
  Thân: "Thân Tý Thìn",
  Dậu: "Tỵ Dậu Sửu",
  Tuất: "Dần Ngọ Tuất",
  Hợi: "Hợi Mão Mùi",
};

const TRIET_BY_YEAR_STEM: Record<string, readonly [PalaceName, PalaceName]> = {
  Giáp: ["Thân", "Dậu"],
  Kỷ: ["Thân", "Dậu"],
  Ất: ["Ngọ", "Mùi"],
  Canh: ["Ngọ", "Mùi"],
  Bính: ["Thìn", "Tỵ"],
  Tân: ["Thìn", "Tỵ"],
  Đinh: ["Dần", "Mão"],
  Nhâm: ["Dần", "Mão"],
  Mậu: ["Tý", "Sửu"],
  Quý: ["Tý", "Sửu"],
};

const TUAN_BY_JIA_CYCLE_START_BRANCH: Partial<Record<PalaceName, readonly [PalaceName, PalaceName]>> = {
  Tý: ["Tuất", "Hợi"],
  Tuất: ["Thân", "Dậu"],
  Thân: ["Ngọ", "Mùi"],
  Ngọ: ["Thìn", "Tỵ"],
  Thìn: ["Dần", "Mão"],
  Dần: ["Tý", "Sửu"],
};

const LOC_TON_BY_CAN: Record<string, PalaceName> = {
  Giáp: "Dần",
  Ất: "Mão",
  Bính: "Tỵ",
  Đinh: "Ngọ",
  Mậu: "Tỵ",
  Kỷ: "Ngọ",
  Canh: "Thân",
  Tân: "Dậu",
  Nhâm: "Hợi",
  Quý: "Tý",
};

export const KHOI_VIET_PROFILE = {
  default: {
    Giáp: { "Thiên Khôi": "Sửu", "Thiên Việt": "Mùi" },
    Ất: { "Thiên Khôi": "Tý", "Thiên Việt": "Thân" },
    Bính: { "Thiên Khôi": "Hợi", "Thiên Việt": "Dậu" },
    Đinh: { "Thiên Khôi": "Hợi", "Thiên Việt": "Dậu" },
    Mậu: { "Thiên Khôi": "Sửu", "Thiên Việt": "Mùi" },
    Kỷ: { "Thiên Khôi": "Tý", "Thiên Việt": "Thân" },
    Canh: { "Thiên Khôi": "Sửu", "Thiên Việt": "Mùi" },
    Tân: { "Thiên Khôi": "Ngọ", "Thiên Việt": "Dần" },
    Nhâm: { "Thiên Khôi": "Mão", "Thiên Việt": "Tỵ" },
    Quý: { "Thiên Khôi": "Mão", "Thiên Việt": "Tỵ" },
  },
  tuvichanco: {
    Giáp: { "Thiên Khôi": "Sửu", "Thiên Việt": "Mùi" },
    Ất: { "Thiên Khôi": "Tý", "Thiên Việt": "Thân" },
    Bính: { "Thiên Khôi": "Hợi", "Thiên Việt": "Dậu" },
    Đinh: { "Thiên Khôi": "Hợi", "Thiên Việt": "Dậu" },
    Mậu: { "Thiên Khôi": "Sửu", "Thiên Việt": "Mùi" },
    Kỷ: { "Thiên Khôi": "Tý", "Thiên Việt": "Thân" },
    Canh: { "Thiên Khôi": "Ngọ", "Thiên Việt": "Dần" },
    Tân: { "Thiên Khôi": "Ngọ", "Thiên Việt": "Dần" },
    Nhâm: { "Thiên Khôi": "Mão", "Thiên Việt": "Tỵ" },
    Quý: { "Thiên Khôi": "Mão", "Thiên Việt": "Tỵ" },
  },
} as const;

const BAC_SI_RING: ReadonlyArray<Pick<NatalRuleStar, "starKey" | "displayName">> = [
  { starKey: "bac_si", displayName: "Bác Sĩ" },
  { starKey: "luc_si", displayName: "Lực Sĩ" },
  { starKey: "thanh_long", displayName: "Thanh Long" },
  { starKey: "tieu_hao", displayName: "Tiểu Hao" },
  { starKey: "tuong_quan", displayName: "Tướng Quân" },
  { starKey: "tau_thu", displayName: "Tấu Thư" },
  { starKey: "phi_liem", displayName: "Phi Liêm" },
  { starKey: "hy_than", displayName: "Hỷ Thần" },
  { starKey: "benh_phu", displayName: "Bệnh Phù" },
  { starKey: "dai_hao", displayName: "Đại Hao" },
  { starKey: "phuc_binh", displayName: "Phục Binh" },
  { starKey: "quan_phu_bac_si", displayName: "Quan Phủ" },
];

const THAI_TUE_RING: ReadonlyArray<Pick<NatalRuleStar, "starKey" | "displayName">> = [
  { starKey: "thai_tue", displayName: "Thái Tuế" },
  { starKey: "thieu_duong", displayName: "Thiếu Dương" },
  { starKey: "tang_mon", displayName: "Tang Môn" },
  { starKey: "thieu_am", displayName: "Thiếu Âm" },
  { starKey: "quan_phu_thai_tue", displayName: "Quan Phù" },
  { starKey: "tu_phu", displayName: "Tử Phù" },
  { starKey: "tue_pha", displayName: "Tuế Phá" },
  { starKey: "long_duc", displayName: "Long Đức" },
  { starKey: "bach_ho", displayName: "Bạch Hổ" },
  { starKey: "phuc_duc", displayName: "Phúc Đức" },
  { starKey: "dieu_khach", displayName: "Điếu Khách" },
  { starKey: "truc_phu", displayName: "Trực Phù" },
];

const TRANG_SINH_RING: ReadonlyArray<Pick<NatalRuleStar, "starKey" | "displayName">> = [
  { starKey: "trang_sinh", displayName: "Trường Sinh" },
  { starKey: "moc_duc", displayName: "Mộc Dục" },
  { starKey: "quan_doi", displayName: "Quan Đới" },
  { starKey: "lam_quan", displayName: "Lâm Quan" },
  { starKey: "de_vuong", displayName: "Đế Vượng" },
  { starKey: "suy", displayName: "Suy" },
  { starKey: "benh", displayName: "Bệnh" },
  { starKey: "tu", displayName: "Tử" },
  { starKey: "mo", displayName: "Mộ" },
  { starKey: "tuyet", displayName: "Tuyệt" },
  { starKey: "thai", displayName: "Thai" },
  { starKey: "duong", displayName: "Dưỡng" },
];

const TRANG_SINH_START_BY_CUC: Record<string, PalaceName> = {
  "Thủy Nhị Cục": "Thân",
  "Mộc Tam Cục": "Hợi",
  "Kim Tứ Cục": "Tỵ",
  "Thổ Ngũ Cục": "Thân",
  "Hỏa Lục Cục": "Dần",
};

const THIEN_PHU_FROM_TU_VI: Record<PalaceName, PalaceName> = {
  Tý: "Thìn",
  Sửu: "Mão",
  Dần: "Dần",
  Mão: "Sửu",
  Thìn: "Tý",
  Tỵ: "Hợi",
  Ngọ: "Tuất",
  Mùi: "Dậu",
  Thân: "Thân",
  Dậu: "Mùi",
  Tuất: "Ngọ",
  Hợi: "Tỵ",
};

const DAO_HOA_BY_GROUP: Record<(typeof BRANCH_GROUP_BY_YEAR_BRANCH)[PalaceName], PalaceName> = {
  "Thân Tý Thìn": "Dậu",
  "Dần Ngọ Tuất": "Mão",
  "Hợi Mão Mùi": "Tý",
  "Tỵ Dậu Sửu": "Ngọ",
};

const HOA_CAI_BY_GROUP: Record<(typeof BRANCH_GROUP_BY_YEAR_BRANCH)[PalaceName], PalaceName> = {
  "Thân Tý Thìn": "Thìn",
  "Dần Ngọ Tuất": "Tuất",
  "Hợi Mão Mùi": "Mùi",
  "Tỵ Dậu Sửu": "Sửu",
};

const THIEN_MA_BY_GROUP: Record<(typeof BRANCH_GROUP_BY_YEAR_BRANCH)[PalaceName], PalaceName> = {
  "Thân Tý Thìn": "Dần",
  "Dần Ngọ Tuất": "Thân",
  "Hợi Mão Mùi": "Tỵ",
  "Tỵ Dậu Sửu": "Hợi",
};

const KIEP_SAT_BY_GROUP: Record<(typeof BRANCH_GROUP_BY_YEAR_BRANCH)[PalaceName], PalaceName> = {
  "Thân Tý Thìn": "Tỵ",
  "Dần Ngọ Tuất": "Hợi",
  "Hợi Mão Mùi": "Thân",
  "Tỵ Dậu Sửu": "Dần",
};

const CO_THAN_QUA_TU: Record<PalaceName, { coThan: PalaceName; quaTu: PalaceName }> = {
  Hợi: { coThan: "Dần", quaTu: "Tuất" },
  Tý: { coThan: "Dần", quaTu: "Tuất" },
  Sửu: { coThan: "Dần", quaTu: "Tuất" },
  Dần: { coThan: "Tỵ", quaTu: "Sửu" },
  Mão: { coThan: "Tỵ", quaTu: "Sửu" },
  Thìn: { coThan: "Tỵ", quaTu: "Sửu" },
  Tỵ: { coThan: "Thân", quaTu: "Thìn" },
  Ngọ: { coThan: "Thân", quaTu: "Thìn" },
  Mùi: { coThan: "Thân", quaTu: "Thìn" },
  Thân: { coThan: "Hợi", quaTu: "Mùi" },
  Dậu: { coThan: "Hợi", quaTu: "Mùi" },
  Tuất: { coThan: "Hợi", quaTu: "Mùi" },
};

export const KHOC_HU_PROFILE = {
  default: {
    byYearBranch: {
      Tý: { "Thiên Khốc": "Ngọ", "Thiên Hư": "Tý" },
      Sửu: { "Thiên Khốc": "Tỵ", "Thiên Hư": "Sửu" },
      Dần: { "Thiên Khốc": "Thìn", "Thiên Hư": "Dần" },
      Mão: { "Thiên Khốc": "Mão", "Thiên Hư": "Mão" },
      Thìn: { "Thiên Khốc": "Dần", "Thiên Hư": "Thìn" },
      Tỵ: { "Thiên Khốc": "Sửu", "Thiên Hư": "Tỵ" },
      Ngọ: { "Thiên Khốc": "Tý", "Thiên Hư": "Ngọ" },
      Mùi: { "Thiên Khốc": "Hợi", "Thiên Hư": "Mùi" },
      Thân: { "Thiên Khốc": "Tuất", "Thiên Hư": "Thân" },
      Dậu: { "Thiên Khốc": "Dậu", "Thiên Hư": "Dậu" },
      Tuất: { "Thiên Khốc": "Thân", "Thiên Hư": "Tuất" },
      Hợi: { "Thiên Khốc": "Mùi", "Thiên Hư": "Hợi" },
    },
  },
  tuvichanco: {
    byYearBranch: null,
  },
} as const;

const BRANCHES: PalaceName[] = [
  "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ",
  "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi",
];

function branchMod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function nextBranch(palace: PalaceName, step = 1): PalaceName {
  const index = BRANCHES.indexOf(palace);
  return BRANCHES[branchMod(index + step, BRANCHES.length)];
}

function getYearBranchOffsetFromTy(yearBranch: PalaceName): number {
  return BRANCHES.indexOf(yearBranch);
}

export function anThienKhocThienHu(yearBranch: string): NatalRuleStar[] {
  const branch = asPalace(yearBranch);
  const offset = getYearBranchOffsetFromTy(branch);
  const khocPalace = nextBranch("Ngọ", -offset);  // Khốc nghịch
  const huPalace = nextBranch("Ngọ", offset);     // Hư thuận
  return [
    { starKey: "thien_khoc", displayName: "Thiên Khốc", palace: khocPalace, source: "natal", group: "minor", brightness: null },
    { starKey: "thien_hu", displayName: "Thiên Hư", palace: huPalace, source: "natal", group: "minor", brightness: null },
  ];
}

export const FUNCTIONAL_PALACE_ORDER = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
] as const;

function asPalace(palace: string): PalaceName {
  if ((PALACES as readonly string[]).includes(palace)) {
    return palace as PalaceName;
  }
  throw new Error(`Invalid palace: ${palace}`);
}

export function palaceIndex(palace: string): number {
  const index = PALACES.indexOf(asPalace(palace));
  if (index < 0) {
    throw new Error(`Invalid palace: ${palace}`);
  }
  return index;
}

export function nextPalace(palace: string, step = 1): PalaceName {
  const index = palaceIndex(palace);
  return PALACES[(index + step + 1200) % 12];
}

export function countFrom(startPalace: string, count: number, direction: Direction = "forward"): PalaceName {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`Invalid count: ${count}`);
  }
  const step = direction === "forward" ? count - 1 : -(count - 1);
  return nextPalace(startPalace, step);
}

export function oppositePalace(palace: string): PalaceName {
  return nextPalace(palace, 6);
}

export function branchNumber(branch: string): number {
  return palaceIndex(branch) + 1;
}

export function hourNumber(hourBranch: string): number {
  return branchNumber(hourBranch);
}

export function getYearStemYinYang(yearStem: string): YinYang {
  const yinYang = YIN_YANG_BY_STEM[yearStem];
  if (!yinYang) {
    throw new Error(`Unsupported year stem: ${yearStem}`);
  }
  return yinYang;
}

export function getDirectionByYinYangGender(isMale: boolean, yearStemYinYang: YinYang): Direction {
  if ((isMale && yearStemYinYang === "Dương") || (!isMale && yearStemYinYang === "Âm")) {
    return "forward";
  }
  return "backward";
}

export function getDirectionByGenderAndStem(gender: Gender, yearStem: string): Direction {
  return getDirectionByYinYangGender(gender === "male", getYearStemYinYang(yearStem));
}

export function anMenhThan(lunarMonth: number, hourBranch: string) {
  const hour = hourNumber(hourBranch);
  const monthPalace = countFrom("Dần", lunarMonth, "forward");
  return {
    menh: countFrom(monthPalace, hour, "backward"),
    than: countFrom(monthPalace, hour, "forward"),
  };
}

export function anFunctionalPalaces(menhPalace: string) {
  return Object.fromEntries(FUNCTIONAL_PALACE_ORDER.map((name, index) => [nextPalace(menhPalace, index), name]));
}

export function anTriet(yearStem: string): readonly PalaceName[] {
  const value = TRIET_BY_YEAR_STEM[yearStem];
  if (!value) {
    throw new Error(`Unsupported year stem for Triet: ${yearStem}`);
  }
  return value;
}

export function anTuan(yearStem: string, yearBranch: string): readonly PalaceName[] {
  const stemIndex = STEMS.indexOf(yearStem as (typeof STEMS)[number]);
  const branchIndex = PALACES.indexOf(asPalace(yearBranch));
  if (stemIndex < 0 || branchIndex < 0) {
    throw new Error(`Unsupported stem/branch for Tuan: ${yearStem} ${yearBranch}`);
  }

  const jiaCycleStartBranch = PALACES[(branchIndex - stemIndex + PALACES.length) % PALACES.length];
  const value = TUAN_BY_JIA_CYCLE_START_BRANCH[jiaCycleStartBranch];
  if (!value) {
    throw new Error(`Invalid stem/branch combination for Tuan: ${yearStem} ${yearBranch}`);
  }

  return value;
}

function buildRing(
  ringName: string,
  ring: ReadonlyArray<Pick<NatalRuleStar, "starKey" | "displayName">>,
  startPalace: string,
  direction: Direction,
  source: NatalRuleSource,
  group: NatalRuleGroup,
): NatalRuleStar[] {
  return ring.map((star, index) => ({
    ...star,
    palace: nextPalace(startPalace, direction === "forward" ? index : -index),
    source,
    group,
    ringName,
    brightness: null,
  }));
}

export function anLocTonKinhDa(yearStem: string): NatalRuleStar[] {
  const locTon = LOC_TON_BY_CAN[yearStem];
  if (!locTon) {
    throw new Error(`Unsupported year stem for Loc Ton: ${yearStem}`);
  }
  return [
    { starKey: "loc_ton", displayName: "Lộc Tồn", palace: locTon, source: "natal", group: "minor", brightness: null },
    { starKey: "kinh_duong", displayName: "Kình Dương", palace: nextPalace(locTon, 1), source: "natal", group: "malefic", brightness: null },
    { starKey: "da_la", displayName: "Đà La", palace: nextPalace(locTon, -1), source: "natal", group: "malefic", brightness: null },
  ];
}

export function anKhoiViet(yearStem: string, profileName: KhoiVietProfileName = "default"): NatalRuleStar[] {
  const profile = KHOI_VIET_PROFILE[profileName] ?? KHOI_VIET_PROFILE.default;
  const item = profile[yearStem as keyof typeof profile];
  if (!item) {
    throw new Error(`Unsupported year stem for Khoi Viet: ${yearStem}`);
  }

  return [
    {
      starKey: "thien_khoi",
      displayName: "Thiên Khôi",
      palace: item["Thiên Khôi"] as PalaceName,
      source: "natal",
      group: "minor",
      brightness: null,
    },
    {
      starKey: "thien_viet",
      displayName: "Thiên Việt",
      palace: item["Thiên Việt"] as PalaceName,
      source: "natal",
      group: "minor",
      brightness: null,
    },
  ];
}

export function anVongBacSi(yearStem: string, gender: Gender): NatalRuleStar[] {
  return buildRing("Vòng Bác Sĩ", BAC_SI_RING, LOC_TON_BY_CAN[yearStem], getDirectionByGenderAndStem(gender, yearStem), "natal", "ring");
}

export function anVongThaiTue(yearBranch: string): NatalRuleStar[] {
  return buildRing("Vòng Thái Tuế", THAI_TUE_RING, yearBranch, "forward", "natal", "ring");
}

export function getBranchGroupByYearBranch(yearBranch: string) {
  const group = BRANCH_GROUP_BY_YEAR_BRANCH[asPalace(yearBranch)];
  if (!group) {
    throw new Error(`Unsupported year branch: ${yearBranch}`);
  }
  return group;
}

export function anDaoHoaHoaCaiThienMa(yearBranch: string): NatalRuleStar[] {
  const group = getBranchGroupByYearBranch(yearBranch);
  return [
    { starKey: "dao_hoa", displayName: "Đào Hoa", palace: DAO_HOA_BY_GROUP[group], source: "natal", group: "minor", brightness: null },
    { starKey: "hoa_cai", displayName: "Hoa Cái", palace: HOA_CAI_BY_GROUP[group], source: "natal", group: "minor", brightness: null },
    { starKey: "thien_ma", displayName: "Thiên Mã", palace: THIEN_MA_BY_GROUP[group], source: "natal", group: "minor", brightness: null },
  ];
}

export function anKiepSat(yearBranch: string): PalaceName {
  return KIEP_SAT_BY_GROUP[getBranchGroupByYearBranch(yearBranch)];
}

export function anThienLaDiaVong(): NatalRuleStar[] {
  return [
    { starKey: "thien_la", displayName: "Thiên La", palace: "Thìn", source: "natal", group: "minor", brightness: null },
    { starKey: "dia_vong", displayName: "Địa Võng", palace: "Tuất", source: "natal", group: "minor", brightness: null },
  ];
}

export function anDauQuan(yearBranch: string, lunarMonth: number, hourBranch: string): PalaceName {
  const monthPivot = countFrom(yearBranch, lunarMonth, "backward");
  return countFrom(monthPivot, hourNumber(hourBranch), "forward");
}

export function anHoaLinh(yearBranch: string, hourBranch: string, gender: Gender, yearStem: string): NatalRuleStar[] {
  const group = getBranchGroupByYearBranch(yearBranch);
  const startByGroup: Record<typeof group, { hoaTinhStart: PalaceName; linhTinhStart: PalaceName }> = {
    "Dần Ngọ Tuất": { hoaTinhStart: "Sửu", linhTinhStart: "Mão" },
    "Thân Tý Thìn": { hoaTinhStart: "Dần", linhTinhStart: "Tuất" },
    "Hợi Mão Mùi": { hoaTinhStart: "Dậu", linhTinhStart: "Tuất" },
    "Tỵ Dậu Sửu": { hoaTinhStart: "Mão", linhTinhStart: "Tuất" },
  };
  const direction = getDirectionByGenderAndStem(gender, yearStem);
  const hoaDirection: Direction = direction;
  const linhDirection: Direction = direction === "forward" ? "backward" : "forward";
  const starts = startByGroup[group];
  const count = hourNumber(hourBranch);

  return [
    {
      starKey: "hoa_tinh",
      displayName: "Hỏa Tinh",
      palace: countFrom(starts.hoaTinhStart, count, hoaDirection),
      source: "natal",
      group: "malefic",
      brightness: null,
    },
    {
      starKey: "linh_tinh",
      displayName: "Linh Tinh",
      palace: countFrom(starts.linhTinhStart, count, linhDirection),
      source: "natal",
      group: "malefic",
      brightness: null,
    },
  ];
}

export function anHongLoan(yearBranch: string): PalaceName {
  return nextPalace("Mão", -palaceIndex(yearBranch));
}

export function anThienHy(yearBranch: string): PalaceName {
  return oppositePalace(anHongLoan(yearBranch));
}

export function anCoThanQuaTu(yearBranch: string): NatalRuleStar[] {
  const item = CO_THAN_QUA_TU[asPalace(yearBranch)];
  return [
    { starKey: "co_than", displayName: "Cô Thần", palace: item.coThan, source: "natal", group: "minor", brightness: null },
    { starKey: "qua_tu", displayName: "Quả Tú", palace: item.quaTu, source: "natal", group: "minor", brightness: null },
  ];
}

export function anLongPhuongGiai(yearBranch: string): NatalRuleStar[] {
  const count = branchNumber(yearBranch);
  const longTri = countFrom("Thìn", count, "forward");
  const phuongCac = countFrom("Tuất", count, "backward");
  return [
    { starKey: "long_tri", displayName: "Long Trì", palace: longTri, source: "natal", group: "minor", brightness: null },
    { starKey: "phuong_cac", displayName: "Phượng Các", palace: phuongCac, source: "natal", group: "minor", brightness: null },
    { starKey: "giai_than", displayName: "Giải Thần", palace: phuongCac, source: "natal", group: "minor", brightness: null },
  ];
}

export function anKhocHu(yearBranch: string, profileName: KhocHuProfileName = "default"): NatalRuleStar[] {
  const branch = asPalace(yearBranch);
  const profile =
    profileName === "tuvichanco" && KHOC_HU_PROFILE.tuvichanco.byYearBranch
      ? KHOC_HU_PROFILE.tuvichanco.byYearBranch
      : KHOC_HU_PROFILE.default.byYearBranch;
  const item = profile[branch];
  return [
    { starKey: "thien_khoc", displayName: "Thiên Khốc", palace: item["Thiên Khốc"] as PalaceName, source: "natal", group: "minor", brightness: null },
    { starKey: "thien_hu", displayName: "Thiên Hư", palace: item["Thiên Hư"] as PalaceName, source: "natal", group: "minor", brightness: null },
  ];
}

export function anTaHuu(lunarMonth: number): NatalRuleStar[] {
  return [
    { starKey: "ta_phu", displayName: "Tả Phù", palace: countFrom("Thìn", lunarMonth, "forward"), source: "natal", group: "minor", brightness: null },
    { starKey: "huu_bat", displayName: "Hữu Bật", palace: countFrom("Tuất", lunarMonth, "backward"), source: "natal", group: "minor", brightness: null },
  ];
}

export function anXuongKhuc(hourBranch: string): NatalRuleStar[] {
  const count = hourNumber(hourBranch);
  return [
    { starKey: "van_xuong", displayName: "Văn Xương", palace: countFrom("Tuất", count, "backward"), source: "natal", group: "minor", brightness: null },
    { starKey: "van_khuc", displayName: "Văn Khúc", palace: countFrom("Thìn", count, "forward"), source: "natal", group: "minor", brightness: null },
  ];
}

export function anKhongKiep(hourBranch: string): NatalRuleStar[] {
  const count = hourNumber(hourBranch);
  return [
    { starKey: "dia_khong", displayName: "Địa Không", palace: countFrom("Hợi", count, "backward"), source: "natal", group: "malefic", brightness: null },
    { starKey: "dia_kiep", displayName: "Địa Kiếp", palace: countFrom("Hợi", count, "forward"), source: "natal", group: "malefic", brightness: null },
  ];
}

export function anTamThaiBatToa(taPhuPalace: string, huuBatPalace: string, lunarDay: number): NatalRuleStar[] {
  return [
    { starKey: "tam_thai", displayName: "Tam Thai", palace: countFrom(taPhuPalace, lunarDay, "forward"), source: "natal", group: "minor", brightness: null },
    { starKey: "bat_toa", displayName: "Bát Tọa", palace: countFrom(huuBatPalace, lunarDay, "backward"), source: "natal", group: "minor", brightness: null },
  ];
}

export function anAnQuangThienQuy(vanXuongPalace: string, vanKhucPalace: string, lunarDay: number, variant: "standard" | "offsetMinusOne" = "standard"): NatalRuleStar[] {
  let anQuang = countFrom(vanXuongPalace, lunarDay, "forward");
  let thienQuy = countFrom(vanKhucPalace, lunarDay, "backward");

  if (variant === "standard") {
    anQuang = nextPalace(anQuang, -1);
    thienQuy = nextPalace(thienQuy, 1);
  } else if (variant === "offsetMinusOne") {
    anQuang = nextPalace(anQuang, -1);
    thienQuy = nextPalace(thienQuy, -1);
  }
  return [
    { starKey: "an_quang", displayName: "Ân Quang", palace: anQuang, source: "natal", group: "minor", brightness: null },
    { starKey: "thien_quy", displayName: "Thiên Quý", palace: thienQuy, source: "natal", group: "minor", brightness: null },
  ];
}

export function anVongTrangSinh(cuc: string, gender: Gender, yearStem: string): NatalRuleStar[] {
  const start = TRANG_SINH_START_BY_CUC[cuc];
  if (!start) {
    throw new Error(`Unsupported cuc for Trang Sinh: ${cuc}`);
  }
  return buildRing("Vòng Tràng Sinh", TRANG_SINH_RING, start, getDirectionByGenderAndStem(gender, yearStem), "natal", "state");
}

export function anTuViGroup(tuViPalace: string): NatalRuleStar[] {
  return [
    { starKey: "tu_vi", displayName: "Tử Vi", palace: asPalace(tuViPalace), source: "natal", group: "main", brightness: null },
    { starKey: "thien_co", displayName: "Thiên Cơ", palace: nextPalace(tuViPalace, -1), source: "natal", group: "main", brightness: null },
    { starKey: "thai_duong", displayName: "Thái Dương", palace: nextPalace(tuViPalace, -3), source: "natal", group: "main", brightness: null },
    { starKey: "vu_khuc", displayName: "Vũ Khúc", palace: nextPalace(tuViPalace, -4), source: "natal", group: "main", brightness: null },
    { starKey: "thien_dong", displayName: "Thiên Đồng", palace: nextPalace(tuViPalace, -5), source: "natal", group: "main", brightness: null },
    { starKey: "liem_trinh", displayName: "Liêm Trinh", palace: nextPalace(tuViPalace, -8), source: "natal", group: "main", brightness: null },
  ];
}

export function anThienPhuGroup(tuViPalace: string): NatalRuleStar[] {
  const thienPhu = THIEN_PHU_FROM_TU_VI[asPalace(tuViPalace)];
  return [
    { starKey: "thien_phu", displayName: "Thiên Phủ", palace: thienPhu, source: "natal", group: "main", brightness: null },
    { starKey: "thai_am", displayName: "Thái Âm", palace: nextPalace(thienPhu, 1), source: "natal", group: "main", brightness: null },
    { starKey: "tham_lang", displayName: "Tham Lang", palace: nextPalace(thienPhu, 2), source: "natal", group: "main", brightness: null },
    { starKey: "cu_mon", displayName: "Cự Môn", palace: nextPalace(thienPhu, 3), source: "natal", group: "main", brightness: null },
    { starKey: "thien_tuong", displayName: "Thiên Tướng", palace: nextPalace(thienPhu, 4), source: "natal", group: "main", brightness: null },
    { starKey: "thien_luong", displayName: "Thiên Lương", palace: nextPalace(thienPhu, 5), source: "natal", group: "main", brightness: null },
    { starKey: "that_sat", displayName: "Thất Sát", palace: nextPalace(thienPhu, 6), source: "natal", group: "main", brightness: null },
    { starKey: "pha_quan", displayName: "Phá Quân", palace: nextPalace(thienPhu, 10), source: "natal", group: "main", brightness: null },
  ];
}
