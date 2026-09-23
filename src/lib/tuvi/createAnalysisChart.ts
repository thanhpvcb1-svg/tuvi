import type {
  AnalysisChart,
  ChartFactoryOptions,
  BrightnessShort,
  ChartProfile,
  NormalizedBirthInput,
  NormalizedChart,
  NormalizedPalace,
  NormalizedStar,
  SchoolConfig,
  SpecialMarker,
  StarSource,
} from "./config/types";
import { lunar2solar, solar2lunar } from "iztro/lib/calendar/convertor";
import { normalizeBranch, normalizeStem } from "./normalize/normalizeBranch";
import { normalizePalaceName } from "./normalize/normalizePalaceName";
import { normalizeStarName } from "./normalize/normalizeStarName";
import { resolveExtraStars } from "./rules/extraStarResolver";
import { enrichPalacesWithStem, findLaiNhanCung, getPalaceStemMap } from "./rules/laiNhanRules";
import { applyBrightnessToChart } from "./rules/applyBrightness";
import { resolveNatalMutagens } from "./rules/resolveNatalMutagens";
import { resolveBrightness } from "./rules/starBrightnessResolver";
import { resolveStarColor } from "./rules/starColorResolver";
import { resolveLuuStars, shouldShowLuuStar, toNormalizedLuuStars } from "./rules/luuStarResolver";
import { anTuan, anTriet } from "./rules/generalRuleEngine";
import { generatePhiTuHoaForChart } from "./rules/phiCungTuHoa";
import { buildNguHanhBanMenh } from "../nguHanhBanMenh";
import { dedupeBy, normalizeLookupKey, safeText } from "./utils";

type RawStarLike = {
  name?: string;
  title?: string;
  shortName?: string;
  type?: string;
  brightness?: string;
  rank?: string;
  mutagen?: string;
  hua?: string;
};

const MUTAGEN_LABEL_BY_RAW: Record<string, "Lộc" | "Quyền" | "Khoa" | "Kỵ"> = {
  loc: "Lộc",
  "hoa loc": "Lộc",
  quyen: "Quyền",
  "hoa quyen": "Quyền",
  khoa: "Khoa",
  "hoa khoa": "Khoa",
  ky: "Kỵ",
  "hoa ky": "Kỵ",
};

const YIN_YANG_BY_STEM: Record<string, "Dương" | "Âm"> = {
  giap: "Dương",
  at: "Âm",
  binh: "Dương",
  dinh: "Âm",
  mau: "Dương",
  ky: "Âm",
  canh: "Dương",
  tan: "Âm",
  nham: "Dương",
  quy: "Âm",
};

const ELEMENT_BY_TEXT: Record<string, string> = {
  kim: "Kim",
  moc: "Mộc",
  thuy: "Thủy",
  hoa: "Hỏa",
  tho: "Thổ",
};

const NAYIN_BY_YEAR: Record<string, { name: string; element: string }> = {
  "mau dan": { name: "Thành Đầu Thổ", element: "Thổ" },
  "ky mao": { name: "Thành Đầu Thổ", element: "Thổ" },
};

const ELEMENT_OVERCOMES: Record<string, string> = {
  Kim: "Mộc",
  Mộc: "Thổ",
  Thổ: "Thủy",
  Thủy: "Hỏa",
  Hỏa: "Kim",
};

const ELEMENT_GENERATES: Record<string, string> = {
  Kim: "Thủy",
  Thủy: "Mộc",
  Mộc: "Hỏa",
  Hỏa: "Thổ",
  Thổ: "Kim",
};

const ZODIAC_TO_BRANCH: Record<string, string> = {
  ty: "Tý",
  suu: "Sửu",
  dan: "Dần",
  mao: "Mão",
  thin: "Thìn",
  ti: "Tỵ",
  ngo: "Ngọ",
  mui: "Mùi",
  than: "Thân",
  dau: "Dậu",
  tuat: "Tuất",
  hoi: "Hợi",
  chuot: "Tý",
  trau: "Sửu",
  bo: "Sửu",
  cop: "Dần",
  ho: "Dần",
  meo: "Mão",
  tho: "Mão",
  rong: "Thìn",
  ran: "Tỵ",
  ngua: "Ngọ",
  de: "Mùi",
  khi: "Thân",
  ga: "Dậu",
  cho: "Tuất",
  lon: "Hợi",
  heo: "Hợi",
  rat: "Tý",
  ox: "Sửu",
  tiger: "Dần",
  rabbit: "Mão",
  cat: "Mão",
  dragon: "Thìn",
  snake: "Tỵ",
  horse: "Ngọ",
  goat: "Mùi",
  monkey: "Thân",
  rooster: "Dậu",
  dog: "Tuất",
  pig: "Hợi",
};

function rawStarName(star: RawStarLike) {
  return star.name ?? star.title ?? star.shortName;
}

function normalizeMutagenLabel(value: unknown): "Lộc" | "Quyền" | "Khoa" | "Kỵ" | undefined {
  const key = normalizeLookupKey(value);
  return MUTAGEN_LABEL_BY_RAW[key];
}

function isSpecialMarkerStar(name: string) {
  const key = normalizeLookupKey(name);
  return key === "tuan" || key === "tuan khong" || key === "triet" || key === "triet lo";
}

function cleanBrightnessSourceStarName(name: string) {
  return name.replace(/^(Lưu|L\.|ĐH\.|LM\.|LD\.|LG\.)\s*/i, "").trim();
}

function isInheritedTuHoaStar(name: string) {
  const cleanName = cleanBrightnessSourceStarName(name);
  return ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"].includes(cleanName);
}

function createSpecialMarker(value: unknown, palaceIndex: number, config: SchoolConfig): SpecialMarker | null {
  const { name, originalName } = normalizeStarName(value, config.starAliases);
  if (name !== "Tuần" && name !== "Triệt") {
    return null;
  }

  return {
    name,
    palaceIndex,
    sourceStarName: originalName || name,
  };
}

function createStar(
  rawStar: RawStarLike,
  palaceName: string,
  palaceBranch: string | undefined,
  source: StarSource,
  config: SchoolConfig,
): NormalizedStar {
  const { name, originalName } = normalizeStarName(rawStarName(rawStar), config.starAliases);
  const brightness = resolveBrightness(
    {
      starName: name,
      palaceName,
      branch: palaceBranch ?? "",
      scope: "origin",
      iztroBrightness: safeText(rawStar.brightness ?? rawStar.rank),
      config,
    },
  );
  const star: NormalizedStar = {
    starKey: normalizeLookupKey(name).replace(/\s+/g, "_"),
    displayName: name,
    name,
    originalName,
    rawName: safeText(rawStarName(rawStar)) || undefined,
    type: safeText(rawStar.type) || undefined,
    source,
    ruleGroup: source === "major" ? "main" : source === "minor" ? "minor" : "minor",
    scope: "origin",
    rawBrightness: safeText(rawStar.brightness ?? rawStar.rank) || undefined,
    brightness: brightness.brightness,
    brightnessFull: brightness.brightnessFull,
    mutagen: normalizeMutagenLabel(rawStar.mutagen ?? rawStar.hua),
  };

  star.colorGroup = resolveStarColor(star, config);
  return star;
}

function createCycleStar(
  value: unknown,
  palaceName: string,
  palaceBranch: string | undefined,
  config: SchoolConfig,
): NormalizedStar | null {
  const { name, originalName } = normalizeStarName(value, config.starAliases);
  if (!name) {
    return null;
  }
  const brightness = resolveBrightness({
    starName: name,
    palaceName,
    branch: palaceBranch ?? "",
    scope: "cycle",
    iztroBrightness: "",
    config,
  });

  const star: NormalizedStar = {
    starKey: normalizeLookupKey(name).replace(/\s+/g, "_"),
    displayName: name,
    name,
    originalName,
    source: "cycle",
    ruleGroup: "ring",
    scope: "origin",
    brightness: brightness.brightness,
    brightnessFull: brightness.brightnessFull,
  };
  star.colorGroup = resolveStarColor(star, config);
  return star;
}

function normalizePalace(palace: any, index: number, raw: any, config: SchoolConfig): NormalizedPalace {
  const palaceName = normalizePalaceName(palace?.name ?? palace?.palaceName ?? palace?.title ?? palace?.branch, config) || `Cung ${index + 1}`;
  const earthlyBranch = normalizeBranch(palace?.earthlyBranch ?? palace?.dizhi ?? palace?.branch) || undefined;
  const majorRaw = Array.isArray(palace?.majorStars) ? palace.majorStars : [];
  const minorRaw = Array.isArray(palace?.minorStars) ? palace.minorStars : [];
  const adjectiveRaw = Array.isArray(palace?.adjectiveStars) ? palace.adjectiveStars : [];
  const rawStars = [...majorRaw, ...minorRaw, ...adjectiveRaw];
  const specialMarkers = dedupeBy(
    rawStars.map((star) => createSpecialMarker(rawStarName(star), index, config)).filter(Boolean) as SpecialMarker[],
    (marker) => marker.name,
  );

  const majorStars = majorRaw
    .filter((star: RawStarLike) => normalizeLookupKey(star.type) === "major")
    .map((star: RawStarLike) => createStar(star, palaceName, earthlyBranch, "major", config));
  const promotedMinor = majorRaw
    .filter((star: RawStarLike) => normalizeLookupKey(star.type) !== "major")
    .map((star: RawStarLike) => createStar(star, palaceName, earthlyBranch, "minor", config));
  const minorStars = minorRaw.map((star: RawStarLike) => createStar(star, palaceName, earthlyBranch, "minor", config));
  const adjectiveStars = adjectiveRaw.map((star: RawStarLike) => createStar(star, palaceName, earthlyBranch, "adjective", config));
  const cycleStars = [
    createCycleStar(palace?.suiqian12, palaceName, earthlyBranch, config),
    createCycleStar(palace?.jiangqian12, palaceName, earthlyBranch, config),
    createCycleStar(palace?.boshi12, palaceName, earthlyBranch, config),
  ].filter(Boolean) as NormalizedStar[];
  const ages = Array.isArray(palace?.ages) ? palace.ages.filter((age: unknown) => typeof age === "number") : undefined;
  const decadalRange = Array.isArray(palace?.decadal?.range)
    ? `${safeText(palace.decadal.range[0])}-${safeText(palace.decadal.range[1])}`
    : safeText(palace?.decadalRange ?? palace?.daYun ?? palace?.ageRange) || undefined;

  return {
    index,
    name: palaceName,
    heavenlyStem: normalizeStem(palace?.heavenlyStem ?? palace?.tiangan) || undefined,
    earthlyBranch,
    isBodyPalace: earthlyBranch === normalizeBranch(raw?.earthlyBranchOfBodyPalace),
    decadalRange,
    ages,
    changsheng12: normalizeStarName(palace?.changsheng12 ?? palace?.changsheng, config.starAliases).name || undefined,
    boshi12: normalizeStarName(palace?.boshi12, config.starAliases).name || undefined,
    suiqian12: normalizeStarName(palace?.suiqian12, config.starAliases).name || undefined,
    jiangqian12: normalizeStarName(palace?.jiangqian12, config.starAliases).name || undefined,
    majorStars,
    minorStars: [...minorStars, ...promotedMinor],
    adjectiveStars,
    cycleStars,
    mutagenStars: [],
    extraStars: [],
    annualStars: [],
    specialMarkers,
    analysisStars: [],
    visibleStars: [],
  };
}

function findPalaceIndexByBranch(palaces: NormalizedPalace[], branch: string) {
  return palaces.find((palace) => palace.earthlyBranch === branch)?.index;
}

function createRuleSpecialMarkers(
  name: "Tuần" | "Triệt",
  branches: readonly string[],
  palaces: NormalizedPalace[],
): SpecialMarker[] {
  const firstIndex = findPalaceIndexByBranch(palaces, branches[0]);
  const secondIndex = findPalaceIndexByBranch(palaces, branches[1]);

  if (firstIndex === undefined || secondIndex === undefined) {
    return [];
  }

  return [firstIndex, secondIndex].map((palaceIndex) => ({
    name,
    palaceIndex,
    betweenPalaceIndexes: [firstIndex, secondIndex],
    sourceStarName: name,
  }));
}

function applyRuleTuanTrietMarkers(chart: NormalizedChart) {
  const { yearStem, yearBranch } = chart.profile;

  for (const palace of chart.palaces) {
    palace.specialMarkers = [];
  }

  if (!yearStem || !yearBranch) {
    return;
  }

  const markers = [
    ...createRuleSpecialMarkers("Tuần", anTuan(yearStem, yearBranch), chart.palaces),
    ...createRuleSpecialMarkers("Triệt", anTriet(yearStem), chart.palaces),
  ];

  for (const marker of markers) {
    const palace = chart.palaces.find((candidate) => candidate.index === marker.palaceIndex);
    if (!palace) {
      continue;
    }

    palace.specialMarkers = dedupeBy([...palace.specialMarkers, marker], (item) => item.name);
  }
}

function findStarPalace(chart: NormalizedChart, targetName: string) {
  for (const palace of chart.palaces) {
    const star = [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars].find(
      (candidate) => normalizeLookupKey(candidate.name) === normalizeLookupKey(targetName),
    );
    if (star) {
      return { palace, star };
    }
  }
  return undefined;
}

function applyInheritedTuHoaBrightness(chart: NormalizedChart) {
  for (const palace of chart.palaces) {
    const stars = [...palace.mutagenStars, ...palace.annualStars];
    for (const star of stars) {
      if (!star.targetStar || !isInheritedTuHoaStar(star.name)) {
        continue;
      }

      const located = findStarPalace(chart, star.targetStar);
      if (!located?.star.brightness) {
        continue;
      }

      star.brightness = located.star.brightness;
      star.brightnessFull = located.star.brightnessFull;
    }
  }
}

function applyGeneratedExtraBrightness(chart: NormalizedChart, config: SchoolConfig) {
  for (const palace of chart.palaces) {
    for (const star of palace.extraStars) {
      const brightness = resolveBrightness({
        starName: star.name,
        palaceName: palace.name,
        branch: palace.earthlyBranch ?? "",
        scope: star.scope,
        iztroBrightness: star.rawBrightness,
        config,
      });
      star.brightness = brightness.brightness;
      star.brightnessFull = brightness.brightnessFull;
    }
  }
}

function removeRawOverlapsWithFormulaStars(chart: NormalizedChart) {
  const formulaManagedNames = new Set(
    chart.palaces.flatMap((palace) => palace.extraStars.map((star) => normalizeLookupKey(star.name))),
  );

  if (!formulaManagedNames.size) {
    return;
  }

  for (const palace of chart.palaces) {
    palace.minorStars = palace.minorStars.filter((star) => !formulaManagedNames.has(normalizeLookupKey(star.name)));
    palace.adjectiveStars = palace.adjectiveStars.filter((star) => !formulaManagedNames.has(normalizeLookupKey(star.name)));
    palace.cycleStars = palace.cycleStars.filter((star) => !formulaManagedNames.has(normalizeLookupKey(star.name)));
  }
}

function resolveMutagens(chart: NormalizedChart, config: SchoolConfig) {
  const rule = config.mutagenRules.find((candidate) => candidate.yearStem === chart.profile.yearStem);
  if (!rule) {
    return [];
  }

  const { starsByPalace, warnings } = resolveNatalMutagens(chart, rule);

  for (const palace of chart.palaces) {
    const natalMutagens = starsByPalace.get(palace.index) ?? [];
    for (const mutagenStar of natalMutagens) {
      const located = findStarPalace(chart, mutagenStar.targetStar ?? "");
      if (located) {
        located.star.mutagen ??= mutagenStar.name.replace(/^Hóa\s+/, "") as NormalizedStar["mutagen"];
      }

      const hasMutagenInLayer = palace.mutagenStars.some(
        (star) => star.name === mutagenStar.name && star.targetStar === mutagenStar.targetStar,
      );

      if (!hasMutagenInLayer) {
        palace.mutagenStars.push(mutagenStar);
      }
    }
  }

  return warnings;
}

function isVisibleStar(star: NormalizedStar, config: SchoolConfig, options?: ChartFactoryOptions) {
  const policy = config.visibleStarPolicy;
  const normalizedAlwaysVisible = policy.alwaysVisible.map((item) => normalizeLookupKey(item));
  const normalizedHidden = policy.hiddenFromVisible.map((item) => normalizeLookupKey(item));
  const normalizedCycleWhitelist = policy.cycleStarWhitelist.map((item) => normalizeLookupKey(item));
  if (star.horoscopeCategory && options?.luuOptions) {
    return shouldShowLuuStar(star, options.luuOptions);
  }
  if (normalizedAlwaysVisible.includes(normalizeLookupKey(star.name))) {
    return true;
  }
  if (normalizedHidden.includes(normalizeLookupKey(star.name))) {
    return false;
  }
  if (policy.showAllRawStars) {
    return true;
  }
  if (star.scope === "annual") {
    return policy.showAnnualStars;
  }
  if (star.source === "major") {
    return policy.showAllMajorStars !== false;
  }
  if (star.source === "minor") {
    return policy.showAllMinorStars !== false;
  }
  if (star.source === "adjective" || star.source === "extra" || star.source === "mutagen") {
    return policy.showAllAdjectiveStars !== false;
  }
  if (star.source === "cycle") {
    const mode = policy.cycleStarMode ?? policy.showCycleStars ?? "none";
    return mode === "all" || (mode === "whitelist" && normalizedCycleWhitelist.includes(normalizeLookupKey(star.name)));
  }
  return true;
}

function sourcePriority(star: NormalizedStar) {
  if (star.horoscopeCategory) return 5;
  switch (star.source) {
    case "major":
      return 100;
    case "minor":
      return 90;
    case "extra":
      return 85;
    case "adjective":
      return 80;
    case "mutagen":
      return 60;
    case "cycle":
      return 50;
    case "annual":
      return 40;
    default:
      return 0;
  }
}

function starDedupKey(star: NormalizedStar) {
  return [
    normalizeLookupKey(star.name),
    normalizeLookupKey(star.targetStar ?? ""),
    star.horoscopeCategory ?? "",
    star.scope,
  ].join(":");
}

function dedupePalaceStars(stars: NormalizedStar[]) {
  const sorted = [...stars].sort((left, right) => sourcePriority(right) - sourcePriority(left));
  return dedupeBy(sorted, starDedupKey);
}

function buildPalaceStars(chart: NormalizedChart, config: SchoolConfig, options?: ChartFactoryOptions) {
  for (const palace of chart.palaces) {
    const baseStars = [
      ...palace.majorStars,
      ...palace.minorStars,
      ...palace.adjectiveStars,
      ...palace.extraStars,
      ...palace.mutagenStars,
      ...palace.cycleStars,
      ...palace.annualStars,
    ].filter((star) => !isSpecialMarkerStar(star.name));
    palace.analysisStars = dedupePalaceStars(baseStars);
    palace.visibleStars = palace.analysisStars.filter((star) => isVisibleStar(star, config, options));
  }
}

function padDatePart(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed).padStart(2, "0") : safeText(value);
}

function formatDateParts(day: unknown, month: unknown, year: unknown) {
  const dayText = padDatePart(day);
  const monthText = padDatePart(month);
  const yearText = safeText(year);

  return dayText && monthText && yearText ? `${dayText}/${monthText}/${yearText}` : "";
}

function formatDateString(value: unknown) {
  const text = safeText(value);
  const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);

  if (!match) {
    return text;
  }

  return formatDateParts(match[3], match[2], match[1]);
}

function formatSolarDate(raw: any, input: NormalizedBirthInput): string {
  return formatDateString(raw?.solarDate ?? raw?.date ?? raw?.solar ?? `${input.year}-${input.month}-${input.day}`);
}

function toNextDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate;
}

function getDisplayLunarDate(raw: any, input?: NormalizedBirthInput) {
  const rawLunarDate = raw?.rawDates?.lunarDate;
  if (!rawLunarDate || !input || input.birthHour !== 23) {
    return rawLunarDate;
  }

  try {
    if (input.calendarType === "solar") {
      return solar2lunar(new Date(input.year, input.month - 1, input.day + 1));
    }

    const solarDate = lunar2solar(
      `${rawLunarDate.lunarYear}-${rawLunarDate.lunarMonth}-${rawLunarDate.lunarDay}`,
      Boolean(rawLunarDate.isLeap),
    );

    return solar2lunar(toNextDay(new Date(solarDate.solarYear, solarDate.solarMonth - 1, solarDate.solarDay)));
  } catch (error) {
    console.warn("Unable to adjust displayed lunar date for late Tý hour:", error);
    return rawLunarDate;
  }
}

function formatLunarDate(raw: any, input?: NormalizedBirthInput): string {
  const lunarDate = getDisplayLunarDate(raw, input);
  if (lunarDate) {
    const date = formatDateParts(lunarDate.lunarDay, lunarDate.lunarMonth, lunarDate.lunarYear);
    const suffix = lunarDate.isLeap ? " (nhuận âm lịch)" : " (âm lịch)";
    return date ? `${date}${suffix}` : "";
  }

  if (!lunarDate) {
    return formatDateString(raw?.lunarDate ?? raw?.lunar ?? raw?.lunarBirthday);
  }

  return "";
}

function getNatalElement(raw: any): { name?: string; element?: string } {
  const yearly = raw?.rawDates?.chineseDate?.yearly;
  if (!Array.isArray(yearly) || yearly.length < 2) {
    return {};
  }
  const yearStem = normalizeStem(yearly[0]);
  const yearBranch = normalizeBranch(yearly[1]);
  const nguHanhBanMenh = buildNguHanhBanMenh({ yearStem, yearBranch });
  return nguHanhBanMenh ? { name: nguHanhBanMenh.napAm, element: nguHanhBanMenh.hanh } : {};
}

function extractCucElement(value: unknown): string | undefined {
  const normalized = normalizeLookupKey(value);
  for (const [key, element] of Object.entries(ELEMENT_BY_TEXT)) {
    if (normalized.includes(key)) {
      return element;
    }
  }
  return undefined;
}

function getElementalAssessment(natalElement?: string, cucElement?: string) {
  if (!natalElement || !cucElement) return undefined;
  if (natalElement === cucElement) return "Bản Mệnh hòa Cục";
  if (ELEMENT_OVERCOMES[natalElement] === cucElement) return "Mệnh khắc Cục";
  if (ELEMENT_OVERCOMES[cucElement] === natalElement) return "Cục khắc Mệnh";
  if (ELEMENT_GENERATES[natalElement] === cucElement) return "Mệnh sinh Cục";
  if (ELEMENT_GENERATES[cucElement] === natalElement) return "Cục sinh Mệnh";
  return undefined;
}

function getYinYangAssessment(raw: any, gender: NormalizedBirthInput["gender"]) {
  const yearlyStem = normalizeStem(raw?.rawDates?.chineseDate?.yearly?.[0]);
  const stemPolarity = YIN_YANG_BY_STEM[normalizeLookupKey(yearlyStem)];
  const label = gender === "male" ? "Dương Nam" : "Âm Nữ";
  if (!stemPolarity) {
    return { label, status: undefined };
  }
  const favorable = (gender === "male" && stemPolarity === "Dương") || (gender === "female" && stemPolarity === "Âm");
  return { label, status: favorable ? "Âm Dương thuận lý" : "Âm Dương nghịch lý" };
}

function normalizeZodiac(value: unknown, fallbackYearBranch?: string) {
  const text = safeText(value);
  const normalizedBranch = normalizeBranch(text);
  if (normalizedBranch) {
    return normalizedBranch;
  }

  const mapped = ZODIAC_TO_BRANCH[normalizeLookupKey(text)];
  if (mapped) {
    return mapped;
  }

  return fallbackYearBranch;
}

function buildProfile(raw: any, input: NormalizedBirthInput, config: SchoolConfig): ChartProfile {
  const yearly = raw?.rawDates?.chineseDate?.yearly;
  const hourly = raw?.rawDates?.chineseDate?.hourly;
  const yearStem = normalizeStem(Array.isArray(yearly) ? yearly[0] : undefined);
  const yearBranch = normalizeBranch(Array.isArray(yearly) ? yearly[1] : undefined);
  const hourBranch = normalizeBranch(Array.isArray(hourly) ? hourly[1] : undefined);
  const rawSoul = normalizeStarName(raw?.soul ?? raw?.mingZhu, config.starAliases).name || undefined;
  const rawBody = normalizeStarName(raw?.body ?? raw?.shenZhu, config.starAliases).name || undefined;
  const yinYangAssessment = getYinYangAssessment(raw, input.gender);
  const natalElement = getNatalElement(raw);
  const fiveElementsClass = safeText(raw?.fiveElementsClass ?? raw?.wuXingJu ?? raw?.wuXing) || undefined;
  const cucElement = extractCucElement(raw?.fiveElementsClass ?? raw?.wuXingJu ?? raw?.wuXing);
  const nguHanhBanMenh = buildNguHanhBanMenh({
    yearStem,
    yearBranch,
    cuc: fiveElementsClass,
  });

  return {
    fullName: input.fullName,
    gender: input.gender === "male" ? "Nam" : "Nữ",
    birthTime: `${String(input.birthHour).padStart(2, "0")}:${String(input.birthMinute).padStart(2, "0")}`,
    solarDate: formatSolarDate(raw, input) || undefined,
    lunarDate: formatLunarDate(raw, input) || undefined,
    chineseDate: safeText(raw?.chineseDate ?? raw?.eightChar ?? raw?.baZi) || undefined,
    zodiac: normalizeZodiac(raw?.zodiac ?? raw?.sign ?? raw?.ming, yearBranch),
    rawSoul,
    rawBody,
    soul: config.soulBodyPolicy.soulByYearBranch?.[yearBranch] ?? rawSoul,
    body: config.soulBodyPolicy.bodyByBirthHourBranch?.[hourBranch] ?? rawBody,
    bodyPalaceBranch: normalizeBranch(raw?.earthlyBranchOfBodyPalace) || undefined,
    soulPalaceBranch: normalizeBranch(raw?.earthlyBranchOfSoulPalace) || undefined,
    yinYangLabel: yinYangAssessment.label,
    yinYangStatus: yinYangAssessment.status,
    natalElementName: natalElement.name,
    natalElement: natalElement.element,
    elementalStatus: getElementalAssessment(natalElement.element, cucElement),
    fiveElementsClass,
    yearStem,
    yearBranch,
    nguHanhBanMenh,
  };
}

export function normalizeChart(rawChart: unknown, input: NormalizedBirthInput, config: SchoolConfig, options?: ChartFactoryOptions): NormalizedChart {
  const raw = rawChart as any;
  const palacesSource = raw?.palaces ?? raw?.horoscope?.palaces ?? raw?.astrolabe?.palaces ?? [];
  const profile = buildProfile(raw, input, config);
  const basePalaces = Array.isArray(palacesSource)
    ? palacesSource.map((palace: any, index: number) => normalizePalace(palace, index, raw, config))
    : [];
  const yearStem = profile.yearStem;
  const palaces = yearStem ? enrichPalacesWithStem(basePalaces, yearStem) : basePalaces;
  const palaceStemMap = yearStem ? getPalaceStemMap(yearStem) : undefined;
  const laiNhanCung = yearStem ? findLaiNhanCung(yearStem, palaces, { profile: options?.laiNhanProfile }) : null;
  const normalizedChart = {
    profile: {
      ...profile,
      laiNhanCung,
    },
    palaces,
    input,
    configId: config.id,
    rawChart,
    palaceStemMap,
    laiNhanCung,
  };

  applyRuleTuanTrietMarkers(normalizedChart);
  return normalizedChart;
}

export function createAnalysisChart(rawChart: unknown, input: NormalizedBirthInput, config: SchoolConfig, options?: ChartFactoryOptions): AnalysisChart {
  let normalizedChart = normalizeChart(rawChart, input, config, options);
  const mutagenWarnings = resolveMutagens(normalizedChart, config);
  const { stars: extraStars, unresolvedExtraStarFormulas } = resolveExtraStars(normalizedChart, config);
  for (const extraStar of extraStars) {
    const palace = normalizedChart.palaces.find((candidate) => candidate.earthlyBranch === extraStar.palaceBranch);
    palace?.extraStars.push(extraStar.star);
  }
  const luuResolved = resolveLuuStars({
    chart: normalizedChart,
    config,
    horoscopeData: options?.horoscopeData,
  });

  const normalizedLuuStars = toNormalizedLuuStars(luuResolved.stars, config);
  normalizedLuuStars.forEach((luuStar, index) => {
    const sourceStar = luuResolved.stars[index];
    const palace = normalizedChart.palaces.find((candidate) => candidate.index === sourceStar?.targetPalaceIndex);
    if (palace) {
      palace.annualStars.push(luuStar);
    }
  });

  applyGeneratedExtraBrightness(normalizedChart, config);
  normalizedChart = applyBrightnessToChart(normalizedChart);
  applyInheritedTuHoaBrightness(normalizedChart);
  removeRawOverlapsWithFormulaStars(normalizedChart);
  normalizedChart.palaces = generatePhiTuHoaForChart(normalizedChart.palaces, normalizedChart.profile.yearStem) as NormalizedPalace[];
  buildPalaceStars(normalizedChart, config, options);
  return {
    ...normalizedChart,
    analysisStars: normalizedChart.palaces.flatMap((palace) => palace.analysisStars),
    unresolvedExtraStarFormulas: [...(mutagenWarnings ?? []), ...unresolvedExtraStarFormulas, ...luuResolved.warnings],
  };
}
