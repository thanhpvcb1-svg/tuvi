import type { ExtraResolvedStar, ExtraStarRule, NormalizedChart, SchoolConfig } from "../config/types";
import { normalizeBranch, normalizeStem } from "../normalize/normalizeBranch";
import { normalizeStarName } from "../normalize/normalizeStarName";
import { normalizeLookupKey } from "../utils";
import {
  anAnQuangThienQuy,
  anCoThanQuaTu,
  anDaoHoaHoaCaiThienMa,
  anDauQuan,
  anHongLoan,
  anHoaLinh,
  anKiepSat,
  anKhoiViet,
  anLongPhuongGiai,
  anThienHy,
  anThienKhocThienHu,
  anThienLaDiaVong,
  anVongBacSi,
  anVongThaiTue,
  PALACES,
} from "./generalRuleEngine";

export type ExtraStarFormula = (chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) => ExtraResolvedStar[];

const THAI_TUE_RING_OFFSETS: Record<string, number> = {
  "thai-tue-by-school": 0,
  "thieu-duong-by-school": 1,
  "thieu-am-by-thai-tue-cycle": 3,
  "quan-phu-by-school": 4,
  "tu-phu-by-school": 5,
  "tue-pha-by-school": 6,
  "long-duc-by-school": 7,
  "phuc-duc-by-school": 9,
  "dieu-khach-by-school": 10,
  "truc-phu-by-school": 11,
};

const LOC_TON_RING_OFFSETS: Record<string, number> = {
  "bac-si-by-loc-ton-ring": 0,
  "luc-si-by-loc-ton-ring": 1,
  "thanh-long-by-loc-ton-ring": 2,
  "tieu-hao-by-loc-ton-ring": 3,
  "tuong-quan-by-loc-ton-ring": 4,
  "tau-thu-by-loc-ton-ring": 5,
  "phi-liem-by-loc-ton-ring": 6,
  "hy-than-by-loc-ton-ring": 7,
  "benh-phu-by-loc-ton-ring": 8,
  "dai-hao-by-loc-ton-ring": 9,
  "phuc-binh-by-loc-ton-ring": 10,
  "quan-phu-by-loc-ton-ring": 11,
};

function unresolvedFormula(_chart: NormalizedChart, _config: SchoolConfig, _rule: ExtraStarRule): ExtraResolvedStar[] {
  return [];
}

function makeExtraStar(rule: ExtraStarRule, displayName: string, config: SchoolConfig) {
  const { name, originalName } = normalizeStarName(displayName, config.starAliases);
  return {
    starKey: rule.starKey ?? normalizeLookupKey(name).replace(/\s+/g, "_"),
    displayName: name,
    name,
    originalName,
    source: "extra" as const,
    ruleGroup: rule.group,
    ringName: rule.ringName,
    side: rule.side,
    scope: "origin" as const,
    brightness: "" as const,
    brightnessFull: "",
  };
}

function wrapResolved(rule: ExtraStarRule, config: SchoolConfig, palaceBranch: string | undefined, displayName = rule.star): ExtraResolvedStar[] {
  const branch = normalizeBranch(palaceBranch);
  if (!branch) {
    return [];
  }

  return [
    {
      palaceBranch: branch,
      star: makeExtraStar(rule, displayName, config),
    },
  ];
}

function getRawHourBranch(chart: NormalizedChart) {
  return normalizeBranch((chart.rawChart as any)?.rawDates?.chineseDate?.hourly?.[1]);
}

function getRawLunarMonth(chart: NormalizedChart) {
  const value = (chart.rawChart as any)?.rawDates?.lunarDate?.lunarMonth;
  return typeof value === "number" ? value : undefined;
}

function getRawLunarDay(chart: NormalizedChart) {
  const value = (chart.rawChart as any)?.rawDates?.lunarDate?.lunarDay;
  return typeof value === "number" ? value : undefined;
}

function getLunarMonthBranch(chart: NormalizedChart) {
  const lunarMonth = getRawLunarMonth(chart);
  if (!lunarMonth || lunarMonth < 1 || lunarMonth > 12) {
    return undefined;
  }

  return PALACES[(lunarMonth + 1) % 12];
}

function getPlacementKey(chart: NormalizedChart, rule: ExtraStarRule) {
  switch (rule.placeBy.type) {
    case "yearStem":
      return normalizeStem(chart.profile.yearStem);
    case "yearBranch":
      return normalizeBranch(chart.profile.yearBranch);
    case "monthBranch":
      return getLunarMonthBranch(chart);
    case "hourBranch":
      return getRawHourBranch(chart);
    default:
      return undefined;
  }
}

function resolveByMappedValue(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const key = getPlacementKey(chart, rule);
  if (!key || !("map" in rule.placeBy)) {
    return [];
  }

  const palaceBranch = rule.placeBy.map[key] ?? rule.placeBy.map[normalizeLookupKey(key)];
  return wrapResolved(rule, config, palaceBranch);
}

function resolveThaiTueRing(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  if (!yearBranch) {
    return [];
  }
  const formulaId = rule.placeBy.type === "formula" ? rule.placeBy.formulaId : "";
  const offset = THAI_TUE_RING_OFFSETS[formulaId];
  const ringStar = anVongThaiTue(yearBranch)[offset];
  return ringStar ? wrapResolved(rule, config, ringStar.palace, ringStar.displayName) : [];
}

function resolveLocTonRing(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const yearStem = normalizeStem(chart.profile.yearStem);
  if (!yearStem) {
    return [];
  }
  const formulaId = rule.placeBy.type === "formula" ? rule.placeBy.formulaId : "";
  const offset = LOC_TON_RING_OFFSETS[formulaId];
  const ringStar = anVongBacSi(yearStem, chart.input.gender)[offset];
  return ringStar ? wrapResolved(rule, config, ringStar.palace, ringStar.displayName) : [];
}

function resolveKhoiViet(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule, starKey: "thien_khoi" | "thien_viet") {
  const yearStem = normalizeStem(chart.profile.yearStem);
  if (!yearStem) {
    return [];
  }

  const star = anKhoiViet(yearStem, config.khoiVietProfile ?? "default").find((item) => item.starKey === starKey);
  return star ? wrapResolved(rule, config, star.palace, star.displayName) : [];
}

function resolveDaoHoa(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  if (!yearBranch) {
    return [];
  }
  const star = anDaoHoaHoaCaiThienMa(yearBranch).find((item) => item.starKey === "dao_hoa");
  return star ? wrapResolved(rule, config, star.palace, star.displayName) : [];
}

function resolveHoaCai(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  if (!yearBranch) {
    return [];
  }
  const star = anDaoHoaHoaCaiThienMa(yearBranch).find((item) => item.starKey === "hoa_cai");
  return star ? wrapResolved(rule, config, star.palace, star.displayName) : [];
}

function resolveThienMa(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  if (!yearBranch) {
    return [];
  }
  const star = anDaoHoaHoaCaiThienMa(yearBranch).find((item) => item.starKey === "thien_ma");
  return star ? wrapResolved(rule, config, star.palace, star.displayName) : [];
}

function resolveGiaiThan(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  if (!yearBranch) {
    return [];
  }
  const star = anLongPhuongGiai(yearBranch).find((item) => item.starKey === "giai_than");
  return star ? wrapResolved(rule, config, star.palace, star.displayName) : [];
}

function resolveLongTri(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  if (!yearBranch) {
    return [];
  }
  const star = anLongPhuongGiai(yearBranch).find((item) => item.starKey === "long_tri");
  return star ? wrapResolved(rule, config, star.palace, star.displayName) : [];
}

function resolvePhuongCac(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  if (!yearBranch) {
    return [];
  }
  const star = anLongPhuongGiai(yearBranch).find((item) => item.starKey === "phuong_cac");
  return star ? wrapResolved(rule, config, star.palace, star.displayName) : [];
}

function resolveKiepSat(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  return yearBranch ? wrapResolved(rule, config, anKiepSat(yearBranch)) : [];
}

function resolveHoaLinh(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  const hourBranch = getRawHourBranch(chart);
  const yearStem = normalizeStem(chart.profile.yearStem);
  if (!yearBranch || !hourBranch) {
    return [];
  }
  if (!yearStem) {
    return [];
  }
  const formulaId = rule.placeBy.type === "formula" ? rule.placeBy.formulaId : "";
  const starKey = formulaId === "hoa-tinh-by-year-branch-hour" ? "hoa_tinh" : "linh_tinh";
  const star = anHoaLinh(yearBranch, hourBranch, chart.input.gender, yearStem).find((item) => item.starKey === starKey);
  return star ? wrapResolved(rule, config, star.palace, star.displayName) : [];
}

function resolveHongLoan(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  return yearBranch ? wrapResolved(rule, config, anHongLoan(yearBranch)) : [];
}

function resolveThienHy(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  return yearBranch ? wrapResolved(rule, config, anThienHy(yearBranch)) : [];
}

function resolveKhocHu(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule, starKey: "thien_khoc" | "thien_hu") {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  if (!yearBranch) {
    return [];
  }
  const star = anThienKhocThienHu(yearBranch).find((item) => item.starKey === starKey);
  return star ? wrapResolved(rule, config, star.palace, star.displayName) : [];
}

function resolveCoThanQuaTu(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule, starKey: "co_than" | "qua_tu") {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  if (!yearBranch) {
    return [];
  }
  const star = anCoThanQuaTu(yearBranch).find((item) => item.starKey === starKey);
  return star ? wrapResolved(rule, config, star.palace, star.displayName) : [];
}

function resolveTuDuc(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule, starKey: "tu_phu" | "phuc_duc") {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  if (!yearBranch) {
    return [];
  }
  const star = anVongThaiTue(yearBranch).find((item) => item.starKey === starKey);
  return star ? wrapResolved(rule, config, star.palace, rule.star) : [];
}

function resolveAnQuangThienQuy(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule, starKey: "an_quang" | "thien_quy") {
  const lunarDay = getRawLunarDay(chart);
  if (!lunarDay) {
    return [];
  }

  const vanXuongPalace = chart.palaces.find((palace) =>
    palace.majorStars.concat(palace.minorStars, palace.adjectiveStars).some((star) => star.starKey === "van_xuong"),
  );
  const vanKhucPalace = chart.palaces.find((palace) =>
    palace.majorStars.concat(palace.minorStars, palace.adjectiveStars).some((star) => star.starKey === "van_khuc"),
  );

  if (!vanXuongPalace?.earthlyBranch || !vanKhucPalace?.earthlyBranch) {
    return [];
  }

  const star = anAnQuangThienQuy(vanXuongPalace.earthlyBranch, vanKhucPalace.earthlyBranch, lunarDay).find(
    (item) => item.starKey === starKey,
  );
  return star ? wrapResolved(rule, config, star.palace, star.displayName) : [];
}

function resolveLaVong(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule, starKey: "thien_la" | "dia_vong") {
  const star = anThienLaDiaVong().find((item) => item.starKey === starKey);
  return star ? wrapResolved(rule, config, star.palace, star.displayName) : [];
}

function resolveDauQuan(chart: NormalizedChart, config: SchoolConfig, rule: ExtraStarRule) {
  const yearBranch = normalizeBranch(chart.profile.yearBranch);
  const hourBranch = getRawHourBranch(chart);
  const lunarMonth = getRawLunarMonth(chart);
  if (!yearBranch || !hourBranch || !lunarMonth) {
    return [];
  }

  return wrapResolved(rule, config, anDauQuan(yearBranch, lunarMonth, hourBranch), rule.star);
}

export const EXTRA_STAR_FORMULAS: Record<string, ExtraStarFormula> = {
  "thien-khoi-by-year-stem": (chart, config, rule) => resolveKhoiViet(chart, config, rule, "thien_khoi"),
  "thien-viet-by-year-stem": (chart, config, rule) => resolveKhoiViet(chart, config, rule, "thien_viet"),
  "thai-tue-by-school": resolveThaiTueRing,
  "thieu-duong-by-school": resolveThaiTueRing,
  "thieu-am-by-thai-tue-cycle": resolveThaiTueRing,
  "quan-phu-by-school": resolveThaiTueRing,
  "tu-phu-by-school": resolveThaiTueRing,
  "tue-pha-by-school": resolveThaiTueRing,
  "long-duc-by-school": resolveThaiTueRing,
  "phuc-duc-by-school": resolveThaiTueRing,
  "dieu-khach-by-school": resolveThaiTueRing,
  "truc-phu-by-school": resolveThaiTueRing,
  "bac-si-by-loc-ton-ring": resolveLocTonRing,
  "luc-si-by-loc-ton-ring": resolveLocTonRing,
  "thanh-long-by-loc-ton-ring": resolveLocTonRing,
  "tieu-hao-by-loc-ton-ring": resolveLocTonRing,
  "tuong-quan-by-loc-ton-ring": resolveLocTonRing,
  "tau-thu-by-loc-ton-ring": resolveLocTonRing,
  "phi-liem-by-loc-ton-ring": resolveLocTonRing,
  "hy-than-by-loc-ton-ring": resolveLocTonRing,
  "benh-phu-by-loc-ton-ring": resolveLocTonRing,
  "dai-hao-by-loc-ton-ring": resolveLocTonRing,
  "phuc-binh-by-loc-ton-ring": resolveLocTonRing,
  "quan-phu-by-loc-ton-ring": resolveLocTonRing,
  "giai-than-by-school": resolveGiaiThan,
  "dao-hoa-by-school": resolveDaoHoa,
  "hoa-cai-by-year-branch": resolveHoaCai,
  "thien-ma-by-year-branch": resolveThienMa,
  "kiep-sat-by-school": resolveKiepSat,
  "thien-la-fixed": (chart, config, rule) => resolveLaVong(chart, config, rule, "thien_la"),
  "dia-vong-fixed": (chart, config, rule) => resolveLaVong(chart, config, rule, "dia_vong"),
  "dau-quan-by-year-branch-month-hour": resolveDauQuan,
  "hong-loan-by-year-branch": resolveHongLoan,
  "thien-hy-by-year-branch": resolveThienHy,
  "thien-khoc-by-year-branch": (chart, config, rule) => resolveKhocHu(chart, config, rule, "thien_khoc"),
  "thien-hu-by-year-branch": (chart, config, rule) => resolveKhocHu(chart, config, rule, "thien_hu"),
  "co-than-by-year-branch": (chart, config, rule) => resolveCoThanQuaTu(chart, config, rule, "co_than"),
  "qua-tu-by-year-branch": (chart, config, rule) => resolveCoThanQuaTu(chart, config, rule, "qua_tu"),
  "long-tri-by-year-branch": resolveLongTri,
  "an-quang-by-xuong-khuc-day": (chart, config, rule) => resolveAnQuangThienQuy(chart, config, rule, "an_quang"),
  "thien-quy-by-xuong-khuc-day": (chart, config, rule) => resolveAnQuangThienQuy(chart, config, rule, "thien_quy"),
  "phuong-cac-by-year-branch": resolvePhuongCac,
  "thien-duc-by-year-branch": (chart, config, rule) => resolveTuDuc(chart, config, rule, "phuc_duc"),
  "nguyet-duc-by-year-branch": (chart, config, rule) => resolveTuDuc(chart, config, rule, "tu_phu"),
  "hoa-tinh-by-year-branch-hour": resolveHoaLinh,
  "linh-tinh-by-year-branch-hour": resolveHoaLinh,
};

export function resolveExtraStars(chart: NormalizedChart, config: SchoolConfig) {
  const unresolvedExtraStarFormulas: string[] = [];
  const stars: ExtraResolvedStar[] = [];

  for (const rule of config.extraStarRules) {
    if (rule.placeBy.type === "formula") {
      const resolver = EXTRA_STAR_FORMULAS[rule.placeBy.formulaId] ?? unresolvedFormula;
      const resolved = resolver(chart, config, rule);
      if (resolved.length === 0) {
        unresolvedExtraStarFormulas.push(rule.placeBy.formulaId);
      }
      stars.push(...resolved);
      continue;
    }

    stars.push(...resolveByMappedValue(chart, config, rule));
  }

  return { stars, unresolvedExtraStarFormulas };
}
