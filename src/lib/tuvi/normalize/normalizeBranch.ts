import { normalizeLookupKey, safeText } from "../utils";

const BRANCH_ALIASES: Record<string, string> = {
  ty: "Tý",
  ti: "Tỵ",
  suu: "Sửu",
  dan: "Dần",
  mao: "Mão",
  thin: "Thìn",
  ngo: "Ngọ",
  mui: "Mùi",
  than: "Thân",
  dau: "Dậu",
  tuat: "Tuất",
  hoi: "Hợi",
};

export function normalizeBranch(value: unknown): string {
  const text = safeText(value);
  const lowerText = text.toLowerCase();

  // NFD lookup collapses both "Tý" and "Tỵ" into "ty", so keep this
  // distinction from the original Vietnamese vowel before removing marks.
  if (lowerText.includes("ỵ") || lowerText.includes("ị")) {
    return "Tỵ";
  }

  if (lowerText.includes("ý")) {
    return "Tý";
  }

  return BRANCH_ALIASES[normalizeLookupKey(text)] ?? text;
}

export function normalizeStem(value: unknown): string {
  const text = safeText(value);
  const aliases: Record<string, string> = {
    giap: "Giáp",
    at: "Ất",
    binh: "Bính",
    dinh: "Đinh",
    mau: "Mậu",
    ky: "Kỷ",
    canh: "Canh",
    tan: "Tân",
    nham: "Nhâm",
    quy: "Quý",
  };

  return aliases[normalizeLookupKey(text)] ?? text;
}
