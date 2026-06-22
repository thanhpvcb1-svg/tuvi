import { normalizeLookupKey } from "../../lib/tuvi/utils";

const RAW_COMPARE_STAR_ALIASES: Record<string, string> = {
  "Thiên Riêu": "Thiên Diêu",
  "Phụng Các": "Phượng Các",
  "Bác Sỹ": "Bác Sĩ",
  "Lực Sỹ": "Lực Sĩ",
  "Tả Phụ": "Tả Phù",
  "Tả Phù": "Tả Phù",
  "Thiên Hỷ": "Thiên Hỉ",
  "Thiên Hỉ": "Thiên Hỉ",
  "K Dương": "Kình Dương",
  "L.K Dương": "L.Kình Dương",
  "L.T Khốc": "L.Thiên Khốc",
  "L.T Hư": "L.Thiên Hư",
};

export const COMPARE_STAR_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(RAW_COMPARE_STAR_ALIASES).flatMap(([key, value]) => [
    [key, value],
    [normalizeLookupKey(key), value],
  ]),
);

export function normalizeCompareStarAlias(name: string) {
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    return "";
  }

  return (
    COMPARE_STAR_ALIASES[trimmed] ??
    COMPARE_STAR_ALIASES[normalizeLookupKey(trimmed)] ??
    trimmed
  );
}
