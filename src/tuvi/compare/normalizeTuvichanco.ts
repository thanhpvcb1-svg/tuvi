import { safeText } from "../../lib/tuvi/utils";
import { buildPalace, parseStarList, shouldKeepCompareStar } from "./shared";
import type { CompareMode, NormalizedCompareChart } from "./types";

type TuvichancoPalace = {
  Name?: string;
  ChinhTinh?: unknown;
  Saotot?: unknown;
  Saoxau?: unknown;
  TrangSinh?: string;
  Tuan?: string;
  Triet?: string;
  CanCung?: string;
  ChiCung?: string;
};

type TuvichancoResponse = {
  Info?: Record<string, unknown>;
  Cung?: TuvichancoPalace[];
};

export function normalizeTuvichanco(raw: TuvichancoResponse, mode: CompareMode = "full"): NormalizedCompareChart {
  const info = raw?.Info ?? {};
  const palaces = Array.isArray(raw?.Cung) ? raw.Cung : [];

  return {
    source: "tuvichanco",
    profile: {
      fullName: safeText(info.HoTen ?? info.hoten ?? info.Name),
      gender: safeText(info.GioiTinh ?? info.gender),
      solarDate: safeText(info.NgayDuongLich ?? info.solarDate),
      lunarDate: safeText(info.NgayAmLich ?? info.lunarDate),
      birthTime: safeText(info.GioSinh ?? info.birthTime),
      annualYear: Number(info.NamHan ?? info.namHan) || undefined,
    },
    palaces: palaces.map((palace) => {
      const mainStars = parseStarList(palace.ChinhTinh, "main", "tuvichanco").filter((star) => shouldKeepCompareStar(star, mode));
      const goodStars = parseStarList(palace.Saotot, "good", "tuvichanco").filter((star) => shouldKeepCompareStar(star, mode));
      const badStars = parseStarList(palace.Saoxau, "bad", "tuvichanco").filter((star) => shouldKeepCompareStar(star, mode));

      return buildPalace("tuvichanco", {
        name: palace.Name,
        branch: palace.ChiCung,
        mainStars,
        goodStars,
        badStars,
      });
    }),
  };
}
