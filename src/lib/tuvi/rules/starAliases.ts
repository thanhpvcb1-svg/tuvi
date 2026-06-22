import { normalizeLookupKey } from "../utils";

const RAW_STAR_ALIAS_MAP: Record<string, string> = {
  Liêm: "Liêm Trinh",
  "Liêm Trinh": "Liêm Trinh",
  Phá: "Phá Quân",
  "Phá Quân": "Phá Quân",
  Vũ: "Vũ Khúc",
  "Vũ Khúc": "Vũ Khúc",
  Dương: "Thái Dương",
  Nhật: "Thái Dương",
  "Thái Dương": "Thái Dương",
  Cơ: "Thiên Cơ",
  "Thiên Cơ": "Thiên Cơ",
  Lương: "Thiên Lương",
  "Thiên Lương": "Thiên Lương",
  Vi: "Tử Vi",
  "Tử Vi": "Tử Vi",
  Nguyệt: "Thái Âm",
  Âm: "Thái Âm",
  "Thái Âm": "Thái Âm",
  Đồng: "Thiên Đồng",
  "Thiên Đồng": "Thiên Đồng",
  Xương: "Văn Xương",
  "Văn Xương": "Văn Xương",
  Cự: "Cự Môn",
  "Cự Môn": "Cự Môn",
  Tham: "Tham Lang",
  "Tham Lang": "Tham Lang",
  Bật: "Hữu Bật",
  "Hữu Bật": "Hữu Bật",
  Khúc: "Văn Khúc",
  "Văn Khúc": "Văn Khúc",
  Phụ: "Tả Phụ",
  "Tả Phù": "Tả Phụ",
  "Tả Phụ": "Tả Phụ",
  "Bác Sĩ": "Bác Sỹ",
  "Bác Sỹ": "Bác Sỹ",
  "Lực Sĩ": "Lực Sĩ",
  "Hỉ Thần": "Hỷ Thần",
  "Hỷ Thần": "Hỷ Thần",
  "Thiên Diêu": "Thiên Diêu",
  "Thiên Riêu": "Thiên Diêu",
  "Phụng Các": "Phượng Các",
  "Tuần Không": "Tuần",
  "Triệt Lộ": "Triệt",
  Hạn: "Hãm",
  "Đài Phụ": "Thai Phụ",
  "Đại Phụ": "Thai Phụ",
};

export const STAR_ALIAS_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(RAW_STAR_ALIAS_MAP).flatMap(([key, value]) => [
    [key, value],
    [normalizeLookupKey(key), value],
  ]),
);

export function normalizeRuleStarName(name: string): string {
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    return "";
  }

  return STAR_ALIAS_MAP[trimmed] ?? STAR_ALIAS_MAP[trimmed.toLowerCase()] ?? STAR_ALIAS_MAP[normalizeLookupKey(trimmed)] ?? trimmed;
}
