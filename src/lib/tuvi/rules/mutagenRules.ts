import type { BrightnessShort, MutagenRule } from "../config/types";

export type HeavenlyStem =
  | "Giáp"
  | "Ất"
  | "Bính"
  | "Đinh"
  | "Mậu"
  | "Kỷ"
  | "Canh"
  | "Tân"
  | "Nhâm"
  | "Quý";

export type MutagenType = "loc" | "quyen" | "khoa" | "ky";

export type MutagenRuleSet = {
  loc: string;
  quyen: string;
  khoa: string;
  ky: string;
};

const BIRTH_MUTAGEN_BRIGHTNESS: Partial<Record<"Lộc" | "Quyền" | "Khoa" | "Kỵ", BrightnessShort>> = {
  Kỵ: "H",
};

export const MUTAGEN_RULES_BY_HEAVENLY_STEM: Record<HeavenlyStem, MutagenRuleSet> = {
  Giáp: {
    loc: "Liêm Trinh",
    quyen: "Phá Quân",
    khoa: "Vũ Khúc",
    ky: "Thái Dương",
  },
  Ất: {
    loc: "Thiên Cơ",
    quyen: "Thiên Lương",
    khoa: "Tử Vi",
    ky: "Thái Âm",
  },
  Bính: {
    loc: "Thiên Đồng",
    quyen: "Thiên Cơ",
    khoa: "Văn Xương",
    ky: "Liêm Trinh",
  },
  Đinh: {
    loc: "Thái Âm",
    quyen: "Thiên Đồng",
    khoa: "Thiên Cơ",
    ky: "Cự Môn",
  },
  Mậu: {
    loc: "Tham Lang",
    quyen: "Thái Âm",
    khoa: "Hữu Bật",
    ky: "Thiên Cơ",
  },
  Kỷ: {
    loc: "Vũ Khúc",
    quyen: "Tham Lang",
    khoa: "Thiên Lương",
    ky: "Văn Khúc",
  },
  Canh: {
    loc: "Thái Dương",
    quyen: "Vũ Khúc",
    khoa: "Thái Âm",
    ky: "Thiên Đồng",
  },
  Tân: {
    loc: "Cự Môn",
    quyen: "Thái Dương",
    khoa: "Văn Khúc",
    ky: "Văn Xương",
  },
  Nhâm: {
    loc: "Thiên Lương",
    quyen: "Tử Vi",
    khoa: "Tả Phù",
    ky: "Vũ Khúc",
  },
  Quý: {
    loc: "Phá Quân",
    quyen: "Cự Môn",
    khoa: "Thái Âm",
    ky: "Tham Lang",
  },
};

export const MUTAGEN_RULES: MutagenRule[] = Object.entries(MUTAGEN_RULES_BY_HEAVENLY_STEM).map(
  ([yearStem, mutagens]) => ({
    yearStem,
    mutagens,
    brightness: BIRTH_MUTAGEN_BRIGHTNESS,
  }),
);

export const MUTAGEN_STAR_NAMES: Record<"Lộc" | "Quyền" | "Khoa" | "Kỵ", string> = {
  Lộc: "Hóa Lộc",
  Quyền: "Hóa Quyền",
  Khoa: "Hóa Khoa",
  Kỵ: "Hóa Kỵ",
};

export const LUU_MUTAGEN_PREFIX_BY_SCOPE = {
  yearly: "L.",
  decadal: "ĐH.",
  monthly: "LM.",
  daily: "LD.",
  hourly: "LG.",
} as const;

