import { star as iztroStar } from "iztro";
import type {
  HoroscopeStar,
  LuuStarCategory,
  NormalizedChart,
  NormalizedStar,
  SchoolConfig,
  SpecialMarker,
  StarScope,
} from "../config/types";
import { inspectIztroLuuData } from "../inspect/inspectIztroLuuData";
import { normalizeStarName } from "../normalize/normalizeStarName";
import { normalizeBranch, normalizeStem } from "../normalize/normalizeBranch";
import { LUU_MUTAGEN_PREFIX_BY_SCOPE, MUTAGEN_RULES_BY_HEAVENLY_STEM, type HeavenlyStem, type MutagenType } from "./mutagenRules";
import { resolveStarColor } from "./starColorResolver";
import { normalizeLookupKey, safeText } from "../utils";
import { anDaoHoaHoaCaiThienMa, anKiepSat, anVongThaiTue } from "./generalRuleEngine";

const TU_DUC_STARS = new Set(["Long Đức", "Nguyệt Đức", "Thiên Đức", "Phúc Đức"]);
const MUTAGEN_ORDER: Array<{ baseName: string; key: MutagenType }> = [
  { baseName: "Hóa Lộc", key: "loc" },
  { baseName: "Hóa Quyền", key: "quyen" },
  { baseName: "Hóa Khoa", key: "khoa" },
  { baseName: "Hóa Kỵ", key: "ky" },
] as const;

const YEARLY_STAR_ALIAS_MAP: Record<string, { name: string; baseName: string }> = {
  "Lưu Lộc": { name: "L.Lộc Tồn", baseName: "Lộc Tồn" },
  "Lưu Dương": { name: "L.Kình Dương", baseName: "Kình Dương" },
  "Lưu Đà": { name: "L.Đà La", baseName: "Đà La" },
  "Lưu Mã": { name: "L.Thiên Mã", baseName: "Thiên Mã" },
  "Lưu Khốc": { name: "L.Thiên Khốc", baseName: "Thiên Khốc" },
  "Lưu Hư": { name: "L.Thiên Hư", baseName: "Thiên Hư" },
};

type LuuResolved = {
  stars: HoroscopeStar[];
  warnings: string[];
  specialMarkers?: SpecialMarker[];
  inspection?: unknown;
};

type ResolveParams = {
  chart: NormalizedChart;
  config: SchoolConfig;
  horoscopeData?: any;
};

const BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;
const ANNUAL_THAI_TUE_FORMULA_MAP: Record<string, string> = {
  "annual-thai-tue-by-year-branch": "thai_tue",
  "annual-thieu-duong-by-year-branch": "thieu_duong",
  "annual-tang-mon-by-year-branch": "tang_mon",
  "annual-thieu-am-by-year-branch": "thieu_am",
  "annual-quan-phu-by-year-branch": "quan_phu_thai_tue",
  "annual-tu-phu-by-year-branch": "tu_phu",
  "annual-tue-pha-by-year-branch": "tue_pha",
  "annual-long-duc-by-year-branch": "long_duc",
  "annual-bach-ho-by-year-branch": "bach_ho",
  "annual-phuc-duc-by-year-branch": "phuc_duc",
  "annual-dieu-khach-by-year-branch": "dieu_khach",
  "annual-truc-phu-by-year-branch": "truc_phu",
};

function toSolarDateString(chart: NormalizedChart) {
  const rawSolarDate = safeText((chart.rawChart as any)?.solarDate ?? chart.profile.solarDate);
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawSolarDate)) {
    return rawSolarDate;
  }

  return `${String(chart.input.year).padStart(4, "0")}-${String(chart.input.month).padStart(2, "0")}-${String(chart.input.day).padStart(2, "0")}`;
}

function branchFromIndex(index: number | undefined) {
  if (typeof index !== "number") {
    return undefined;
  }

  return BRANCHES[((index % 12) + 12) % 12];
}

function findPalaceByIndex(chart: NormalizedChart, palaceIndex: number) {
  return chart.palaces[palaceIndex];
}

function toNormalizedLuuStar(star: HoroscopeStar, config: SchoolConfig): NormalizedStar {
  const normalizedName = normalizeStarName(star.name, config.starAliases).name || star.name;
  const starScope = (star.scope === "decadal" ? "annual" : star.scope) as StarScope;
  const normalized: NormalizedStar = {
    name: normalizedName,
    originalName: star.originalName ?? star.name,
    rawName: star.name,
    targetStar: star.targetStar,
    source: star.category === "loc-ky-nhap" ? "extra" : star.category === "luu-dai-van" ? "annual" : "annual",
    scope: starScope,
    horoscopeCategory: star.category,
    horoscopeSource: star.source,
    brightness: star.brightness,
    brightnessFull: star.brightnessFull,
    isVisible: star.isVisible,
    warning: star.warning,
  };
  normalized.colorGroup = star.colorGroup ?? resolveStarColor(normalized, config);
  return normalized;
}

function buildBaseHoroscopeStar(params: {
  name: string;
  baseName: string;
  category: LuuStarCategory;
  scope: HoroscopeStar["scope"];
  source: HoroscopeStar["source"];
  palaceIndex: number;
  chart: NormalizedChart;
  warning?: string;
}): HoroscopeStar {
  const palace = findPalaceByIndex(params.chart, params.palaceIndex);
  return {
    name: params.name,
    baseName: params.baseName,
    category: params.category,
    scope: params.scope,
    source: params.source,
    targetPalaceIndex: params.palaceIndex,
    targetPalaceName: palace?.name,
    targetPalaceBranch: palace?.earthlyBranch,
    heavenlyStem: palace?.heavenlyStem,
    earthlyBranch: palace?.earthlyBranch,
    warning: params.warning,
  };
}

function stripLuuPrefix(name: string) {
  return name.replace(/^(Lưu|Vận)\s+/i, "").trim();
}

function normalizeHoroscopeStarLabel(rawName: string) {
  const mapped = YEARLY_STAR_ALIAS_MAP[rawName];
  if (mapped) {
    return mapped;
  }

  if (/^L\./.test(rawName)) {
    return {
      name: rawName,
      baseName: rawName.replace(/^L\./, "").trim(),
    };
  }

  return {
    name: rawName,
    baseName: stripLuuPrefix(rawName),
  };
}

function getMutagenLabel(baseName: string, scope: HoroscopeStar["scope"]) {
  const prefix = LUU_MUTAGEN_PREFIX_BY_SCOPE[scope];
  return prefix ? `${prefix}${baseName}` : baseName;
}

function resolveMutagenTargets(chart: NormalizedChart, targets: string[], scope: HoroscopeStar["scope"], source: HoroscopeStar["source"]): HoroscopeStar[] {
  return targets.flatMap((targetName, index) => {
    const found = chart.palaces.find((palace) =>
      [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars].some(
        (star) => normalizeLookupKey(star.name) === normalizeLookupKey(targetName),
      ),
    );
    if (!found) {
      return [];
    }

    const descriptor = MUTAGEN_ORDER[index];
    if (!descriptor) {
      return [];
    }

    return [
      {
        name: getMutagenLabel(descriptor.baseName, scope),
        baseName: descriptor.baseName,
        targetStar: targetName,
        category: "luu-tu-hoa",
        scope,
        source,
        targetPalaceIndex: found.index,
        targetPalaceName: found.name,
        targetPalaceBranch: found.earthlyBranch,
        heavenlyStem: found.heavenlyStem,
        earthlyBranch: found.earthlyBranch,
      },
    ];
  });
}

function resolveMutagenTargetsByStem(
  chart: NormalizedChart,
  heavenlyStem: string | undefined,
  scope: HoroscopeStar["scope"],
  source: HoroscopeStar["source"],
): HoroscopeStar[] {
  const stem = normalizeStem(heavenlyStem) as HeavenlyStem;
  const rule = MUTAGEN_RULES_BY_HEAVENLY_STEM[stem];
  if (!rule) {
    return [];
  }

  const targets = MUTAGEN_ORDER.map(({ key }) => rule[key]);
  return resolveMutagenTargets(chart, targets, scope, source);
}

function resolveIztroHoroscopeStars({ chart, horoscopeData }: ResolveParams): LuuResolved {
  const warnings: string[] = [];
  const stars: HoroscopeStar[] = [];

  if (!horoscopeData) {
    warnings.push("Không có horoscope data từ iztro.");
    return { stars, warnings };
  }

  const yearlyStars = Array.isArray(horoscopeData?.yearly?.stars) ? horoscopeData.yearly.stars : [];
  const decadalStars = Array.isArray(horoscopeData?.decadal?.stars) ? horoscopeData.decadal.stars : [];
  const yearlyDecStar = horoscopeData?.yearly?.yearlyDecStar ?? {};

  yearlyStars.forEach((palaceStars: any[], palaceIndex: number) => {
    if (!Array.isArray(palaceStars)) return;
    palaceStars.forEach((star) => {
      const rawName = safeText(star?.name);
      const normalized = normalizeHoroscopeStarLabel(rawName);
      const baseName = normalized.baseName;
      const category: LuuStarCategory = TU_DUC_STARS.has(baseName) ? "luu-tu-duc" : "luu-other";
      stars.push(
        buildBaseHoroscopeStar({
          name: normalized.name,
          baseName,
          category,
          scope: "yearly",
          source: "iztro-horoscope",
          palaceIndex,
          chart,
        }),
      );
    });
  });

  decadalStars.forEach((palaceStars: any[], palaceIndex: number) => {
    if (!Array.isArray(palaceStars)) return;
    palaceStars.forEach((star) => {
      const rawName = safeText(star?.name);
      const normalized = normalizeHoroscopeStarLabel(rawName);
      stars.push(
        buildBaseHoroscopeStar({
          name: normalized.name,
          baseName: normalized.baseName,
          category: "luu-dai-van",
          scope: "decadal",
          source: "iztro-horoscope",
          palaceIndex,
          chart,
        }),
      );
    });
  });

  ["suiqian12", "jiangqian12"].forEach((key) => {
    const items = Array.isArray(yearlyDecStar?.[key]) ? yearlyDecStar[key] : [];
    items.forEach((rawName: string, palaceIndex: number) => {
      const baseName = safeText(rawName);
      const category: LuuStarCategory = TU_DUC_STARS.has(baseName) ? "luu-tu-duc" : "luu-other";
      stars.push(
        buildBaseHoroscopeStar({
          name: `L.${baseName}`,
          baseName,
          category,
          scope: "yearly",
          source: "iztro-horoscope",
          palaceIndex,
          chart,
        }),
      );
    });
  });

  return { stars, warnings };
}

function addConfiguredAnnualStar(
  stars: HoroscopeStar[],
  chart: NormalizedChart,
  name: string,
  targetPalaceIndex: number | undefined,
  source: HoroscopeStar["source"] = "school-rule",
) {
  if (targetPalaceIndex === undefined || targetPalaceIndex < 0) {
    return;
  }

  const label = normalizeHoroscopeStarLabel(name);
  if (stars.some((star) => star.name === label.name && star.targetPalaceIndex === targetPalaceIndex)) {
    return;
  }

  stars.push(
    buildBaseHoroscopeStar({
      name: label.name,
      baseName: label.baseName,
      category: "luu-other",
      scope: "yearly",
      source,
      palaceIndex: targetPalaceIndex,
      chart,
    }),
  );
}

function findPalaceIndexByBranch(chart: NormalizedChart, branch: string | undefined) {
  if (!branch) {
    return undefined;
  }
  return chart.palaces.find((palace) => normalizeLookupKey(palace.earthlyBranch) === normalizeLookupKey(branch))?.index;
}

function findPalaceIndexByThaiTueStar(chart: NormalizedChart, yearlyBranch: string, starKey: string) {
  const star = anVongThaiTue(yearlyBranch).find((item) => item.starKey === starKey);
  return findPalaceIndexByBranch(chart, star?.palace);
}

function findPalaceIndexByDaoHoaGroup(chart: NormalizedChart, yearlyBranch: string, starKey: "dao_hoa" | "hoa_cai" | "thien_ma") {
  const star = anDaoHoaHoaCaiThienMa(yearlyBranch).find((item) => item.starKey === starKey);
  return findPalaceIndexByBranch(chart, star?.palace);
}

function resolveConfiguredAnnualStars({ chart, config, horoscopeData }: ResolveParams): LuuResolved {
  const stars: HoroscopeStar[] = [];
  const warnings: string[] = [];
  const yearlyBranch = safeText(horoscopeData?.yearly?.earthlyBranch);
  const solarDate = toSolarDateString(chart);
  const yearlyIndexes =
    typeof iztroStar?.getYearlyStarIndex === "function"
      ? iztroStar.getYearlyStarIndex(solarDate, chart.input.birthHourIndex, true)
      : undefined;
  const luYangTuoMaIndexes =
    chart.profile.yearStem && yearlyBranch && typeof iztroStar?.getLuYangTuoMaIndex === "function"
      ? iztroStar.getLuYangTuoMaIndex(chart.profile.yearStem as any, yearlyBranch as any)
      : undefined;

  if (!yearlyBranch) {
    return { stars, warnings };
  }

  for (const rule of config.annualStarRules ?? []) {
    let targetPalaceIndex: number | undefined;

    switch (rule.placeBy.type) {
      case "formula": {
        switch (rule.placeBy.formulaId) {
          case "annual-thai-tue-by-year-branch":
          case "annual-thieu-duong-by-year-branch":
          case "annual-tang-mon-by-year-branch":
          case "annual-thieu-am-by-year-branch":
          case "annual-quan-phu-by-year-branch":
          case "annual-tu-phu-by-year-branch":
          case "annual-tue-pha-by-year-branch":
          case "annual-long-duc-by-year-branch":
          case "annual-bach-ho-by-year-branch":
          case "annual-phuc-duc-by-year-branch":
          case "annual-dieu-khach-by-year-branch":
          case "annual-truc-phu-by-year-branch":
            targetPalaceIndex = findPalaceIndexByThaiTueStar(
              chart,
              yearlyBranch,
              ANNUAL_THAI_TUE_FORMULA_MAP[rule.placeBy.formulaId],
            );
            break;
          case "annual-kinh-duong-by-year-stem":
            targetPalaceIndex = findPalaceIndexByBranch(chart, branchFromIndex(luYangTuoMaIndexes?.yangIndex));
            break;
          case "annual-da-la-by-year-stem":
            targetPalaceIndex = findPalaceIndexByBranch(chart, branchFromIndex(luYangTuoMaIndexes?.tuoIndex));
            break;
          case "annual-loc-ton-by-year-stem":
            targetPalaceIndex = findPalaceIndexByBranch(chart, branchFromIndex(luYangTuoMaIndexes?.luIndex));
            break;
          case "annual-thien-ma-by-year-branch":
            targetPalaceIndex =
              findPalaceIndexByBranch(chart, branchFromIndex(luYangTuoMaIndexes?.maIndex)) ??
              findPalaceIndexByDaoHoaGroup(chart, yearlyBranch, "thien_ma");
            break;
          case "annual-thien-khoc-by-year-branch":
            targetPalaceIndex = typeof yearlyIndexes?.tiankuIndex === "number" ? yearlyIndexes.tiankuIndex : undefined;
            break;
          case "annual-thien-hu-by-year-branch":
            targetPalaceIndex = typeof yearlyIndexes?.tianxuIndex === "number" ? yearlyIndexes.tianxuIndex : undefined;
            break;
          case "annual-dao-hoa-by-year-branch":
            targetPalaceIndex = findPalaceIndexByDaoHoaGroup(chart, yearlyBranch, "dao_hoa");
            break;
          case "annual-hoa-cai-by-year-branch":
            targetPalaceIndex = findPalaceIndexByDaoHoaGroup(chart, yearlyBranch, "hoa_cai");
            break;
          case "annual-kiep-sat-by-year-branch":
            targetPalaceIndex = findPalaceIndexByBranch(chart, anKiepSat(yearlyBranch));
            break;
          default:
            break;
        }
        break;
      }
      default:
        break;
    }

    if (targetPalaceIndex === undefined) {
      continue;
    }

    addConfiguredAnnualStar(stars, chart, rule.star, targetPalaceIndex);
  }
  return { stars, warnings };
}

function resolveLuuTuHoa({ chart, config, horoscopeData }: ResolveParams): LuuResolved {
  const warnings: string[] = [];
  const yearlyTargets = Array.isArray(horoscopeData?.yearly?.mutagen) ? horoscopeData.yearly.mutagen : [];
  const decadalTargets = Array.isArray(horoscopeData?.decadal?.mutagen) ? horoscopeData.decadal.mutagen : [];
  let stars = [
    ...resolveMutagenTargets(chart, yearlyTargets, "yearly", "iztro-mutagen"),
    ...resolveMutagenTargets(chart, decadalTargets, "decadal", "iztro-mutagen"),
  ];

  if (!yearlyTargets.length) {
    const yearlyFallback = resolveMutagenTargetsByStem(chart, horoscopeData?.yearly?.heavenlyStem, "yearly", "school-rule");
    if (yearlyFallback.length) {
      stars = [...stars, ...yearlyFallback];
      warnings.push("Lưu Tứ Hóa năm được suy từ can năm xem vì iztro không trả mutagen yearly.");
    }
  }

  if (!decadalTargets.length) {
    const decadalFallback = resolveMutagenTargetsByStem(chart, horoscopeData?.decadal?.heavenlyStem, "decadal", "school-rule");
    if (decadalFallback.length) {
      stars = [...stars, ...decadalFallback];
      warnings.push("Đại hạn Tứ Hóa được suy từ can đại hạn vì iztro không trả mutagen decadal.");
    }
  }

  if (!yearlyTargets.length && !decadalTargets.length && !stars.length) {
    warnings.push("iztro không trả mutagen lưu/hạn, fallback schoolConfig chưa được áp dụng.");
  }

  return { stars, warnings };
}

function resolveLuuTuDuc({ horoscopeData }: ResolveParams): LuuResolved {
  const warnings: string[] = [];
  const allYearly = [
    ...(Array.isArray(horoscopeData?.yearly?.yearlyDecStar?.suiqian12) ? horoscopeData.yearly.yearlyDecStar.suiqian12 : []),
    ...(Array.isArray(horoscopeData?.yearly?.yearlyDecStar?.jiangqian12) ? horoscopeData.yearly.yearlyDecStar.jiangqian12 : []),
  ].map((item) => safeText(item));

  const missing = [...TU_DUC_STARS].filter((name) => !allYearly.includes(name));
  if (missing.length) {
    warnings.push(`Lưu tứ đức chưa đủ từ iztro: ${missing.join(", ")}`);
  }

  return { stars: [], warnings };
}

function resolveLocKyNhap({ chart, horoscopeData }: ResolveParams): LuuResolved {
  const warnings: string[] = [];
  const stars: HoroscopeStar[] = [];
  const targets = Array.isArray(horoscopeData?.yearly?.mutagen) ? horoscopeData.yearly.mutagen : [];

  if (targets.length >= 4) {
    const locStar = resolveMutagenTargets(chart, [targets[0]], "yearly", "iztro-mutagen")[0];
    const kyStar = resolveMutagenTargets(chart, [targets[3]], "yearly", "iztro-mutagen")[0];

    if (locStar) {
      stars.push({
        ...locStar,
        name: "Lộc nhập",
        baseName: "Lộc nhập",
        category: "loc-ky-nhap",
      });
    }

    if (kyStar) {
      stars.push({
        ...kyStar,
        name: "Kỵ nhập",
        baseName: "Kỵ nhập",
        category: "loc-ky-nhap",
      });
    }
  } else {
    warnings.push("Không đủ dữ liệu để suy ra Lộc/Kỵ nhập.");
  }

  return { stars, warnings };
}

function resolveLuuTuanTriet(): LuuResolved {
  return {
    stars: [],
    warnings: ["Lưu Tuần/Triệt chưa có raw API từ iztro và chưa cấu hình school rule."],
    specialMarkers: [],
  };
}

export function resolveLuuStars(params: ResolveParams): {
  stars: HoroscopeStar[];
  warnings: string[];
  inspection: unknown;
  specialMarkers: SpecialMarker[];
} {
  const inspection = inspectIztroLuuData({
    natalChart: params.chart.rawChart,
    yearStem: params.chart.profile.yearStem,
    yearBranch: params.chart.profile.yearBranch,
    decadalStem: safeText(params.horoscopeData?.decadal?.heavenlyStem) || undefined,
    decadalBranch: safeText(params.horoscopeData?.decadal?.earthlyBranch) || undefined,
  });

  const fromIztro = resolveIztroHoroscopeStars(params);
  const configuredAnnual = resolveConfiguredAnnualStars(params);
  const luuTuHoa = resolveLuuTuHoa(params);
  const luuTuDuc = resolveLuuTuDuc(params);
  const locKyNhap = resolveLocKyNhap(params);
  const luuTuanTriet = resolveLuuTuanTriet();

  return {
    stars: [...fromIztro.stars, ...configuredAnnual.stars, ...luuTuHoa.stars, ...locKyNhap.stars],
    warnings: [
      ...((inspection as any)?.warnings ?? []),
      ...fromIztro.warnings,
      ...configuredAnnual.warnings,
      ...luuTuHoa.warnings,
      ...luuTuDuc.warnings,
      ...locKyNhap.warnings,
      ...luuTuanTriet.warnings,
    ],
    inspection,
    specialMarkers: [...(luuTuanTriet.specialMarkers ?? [])],
  };
}

export function shouldShowLuuStar(star: NormalizedStar, options: { showLuuTuHoa: boolean; showLuuTuDuc: boolean; showLuuDaiVan: boolean; showLuuOtherStars: boolean; showLocKyNhap: boolean; showLuuTuanTriet: boolean; }) {
  if (!star.horoscopeCategory) {
    return true;
  }
  if (star.horoscopeCategory === "luu-tu-hoa") return options.showLuuTuHoa;
  if (star.horoscopeCategory === "luu-tu-duc") return options.showLuuTuDuc;
  if (star.horoscopeCategory === "luu-dai-van") return options.showLuuDaiVan;
  if (star.horoscopeCategory === "luu-other") return options.showLuuOtherStars;
  if (star.horoscopeCategory === "loc-ky-nhap") return options.showLocKyNhap;
  if (star.horoscopeCategory === "luu-tuan-triet") return options.showLuuTuanTriet;
  return false;
}

export function toNormalizedLuuStars(stars: HoroscopeStar[], config: SchoolConfig) {
  return stars.map((star) => toNormalizedLuuStar(star, config));
}
