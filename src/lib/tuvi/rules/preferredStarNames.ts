import { normalizeLookupKey } from "../utils";

const RAW_PREFERRED_STAR_NAMES: Record<string, string> = {
  "Tả Phụ": "Tả Phù",
  "Tả Phù": "Tả Phù",
  "Bác Sỹ": "Bác Sĩ",
  "Bác Sĩ": "Bác Sĩ",
  "Lực Sỹ": "Lực Sĩ",
  "Lực Sĩ": "Lực Sĩ",
  "Thiên Hỷ": "Thiên Hỉ",
  "Thiên Hỉ": "Thiên Hỉ",
  "Phụng Các": "Phượng Các",
  "Phượng Các": "Phượng Các",
  "Thiên Riêu": "Thiên Diêu",
  "Thiên Diêu": "Thiên Diêu",
};

const PREFERRED_STAR_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(RAW_PREFERRED_STAR_NAMES).flatMap(([key, value]) => [
    [key, value],
    [normalizeLookupKey(key), value],
  ]),
);

export function toPreferredStarName(name: string) {
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    return "";
  }

  return PREFERRED_STAR_NAMES[trimmed] ?? PREFERRED_STAR_NAMES[normalizeLookupKey(trimmed)] ?? trimmed;
}
