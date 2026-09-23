import { normalizeBranch, normalizeStem } from "../normalize/normalizeBranch";
import { getPalaceStemMap } from "../rules/laiNhanRules";

export const TU_HOA_LABELS = {
  loc: "Hóa Lộc",
  quyen: "Hóa Quyền",
  khoa: "Hóa Khoa",
  ky: "Hóa Kỵ",
} as const;

export const TU_HOA_TABLE = {
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
    khoa: "Tả Phụ",
    ky: "Vũ Khúc",
  },
  Quý: {
    loc: "Phá Quân",
    quyen: "Cự Môn",
    khoa: "Thái Âm",
    ky: "Tham Lang",
  },
} as const;

export type TuHoaStem = keyof typeof TU_HOA_TABLE;

export function generatePalaceStems(yearStem: string) {
  return getPalaceStemMap(normalizeStem(yearStem));
}

export function getStemByYearStemAndBranch(yearStem: string, branch: string) {
  const palaceStemMap = generatePalaceStems(yearStem);
  const normalizedBranch = normalizeBranch(branch);
  return palaceStemMap[normalizedBranch];
}
