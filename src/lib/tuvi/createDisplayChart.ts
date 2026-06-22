import type {
  AnalysisChart,
  ChartFactoryOptions,
  ChartLayers,
  DisplayChart,
  DisplayPalace,
  DisplayStar,
  NormalizedBirthInput,
  NormalizedStar,
  SchoolConfig,
} from "./config/types";
import { isBadFortuneStar, isGoodFortuneStar } from "./config/starFortune";
import { tuvichancoCompatibleConfig } from "./config/tuvichancoCompatible.config";
import { createAnalysisChart } from "./createAnalysisChart";
import { enrichPlacedStar, groupStarsByColumn } from "./display/starDisplay";
import { applyBrightnessToDisplayPalace } from "./rules/applyBrightness";
import { buildPhiTuHoaDebugTable } from "./rules/phiCungTuHoa";
import { dedupeBy, normalizeLookupKey } from "./utils";

const STEM_ABBREVIATIONS: Record<string, string> = {
  giap: "G",
  at: "Â",
  binh: "B",
  dinh: "Đ",
  mau: "M",
  ky: "K",
  canh: "C",
  tan: "T",
  nham: "N",
  quy: "Q",
};

function toDisplayStar(star: NormalizedStar): DisplayStar {
  return enrichPlacedStar(star);
}

function buildDisplayPalace(palace: AnalysisChart["palaces"][number]): DisplayPalace {
  const visibleStars = dedupeBy(palace.visibleStars.map(toDisplayStar), (star) => `${star.name}:${star.displayColumn ?? ""}:${star.targetStar ?? ""}`);
  const analysisStars = dedupeBy(palace.analysisStars.map(toDisplayStar), (star) => `${star.name}:${star.displayColumn ?? ""}:${star.targetStar ?? ""}`);
  const columns = groupStarsByColumn(visibleStars);
  const stemAbbreviation = palace.heavenlyStem ? STEM_ABBREVIATIONS[normalizeLookupKey(palace.heavenlyStem)] : undefined;
  const decadalStart = palace.decadalRange?.split("-")[0] || palace.decadalRange;

  return applyBrightnessToDisplayPalace({
    index: palace.index,
    name: palace.name,
    heavenlyStem: stemAbbreviation ?? palace.heavenlyStem,
    earthlyBranch: palace.earthlyBranch,
    isBodyPalace: palace.isBodyPalace,
    ages: palace.ages,
    changsheng12: palace.changsheng12,
    boshi12: palace.boshi12,
    suiqian12: palace.suiqian12,
    jiangqian12: palace.jiangqian12,
    majorStars: columns.center,
    minorStars: [...columns.left, ...columns.right],
    adjectiveStars: columns.bottom,
    specialStars: [],
    specialMarkers: palace.specialMarkers,
    centerStars: columns.center,
    leftStars: columns.left,
    rightStars: columns.right,
    bottomStars: columns.bottom,
    goodStars: visibleStars.filter(isGoodFortuneStar),
    badStars: visibleStars.filter(isBadFortuneStar),
    displayStars: visibleStars,
    analysisStars,
    visibleStars,
    decadalRange: decadalStart,
    bottomLeft: palace.earthlyBranch,
    bottomCenter: palace.changsheng12,
    bottomRight: undefined,
    phiTuHoa: (palace as AnalysisChart["palaces"][number] & { phiTuHoa?: unknown }).phiTuHoa,
    corner: (palace as AnalysisChart["palaces"][number] & { corner?: unknown }).corner,
  } as DisplayPalace);
}

function buildDebugReport(analysisChart: AnalysisChart, displayChart: DisplayChart, config: SchoolConfig) {
  const rawStarsCount = analysisChart.palaces.reduce(
    (sum, palace) => sum + palace.majorStars.length + palace.minorStars.length + palace.adjectiveStars.length + palace.cycleStars.length,
    0,
  );
  const analysisStarsCount = analysisChart.analysisStars.length;
  const visibleStarsCount = displayChart.palaces.reduce((sum, palace) => sum + palace.visibleStars.length, 0);
  const mutagens = analysisChart.analysisStars
    .filter((star) => star.source === "mutagen")
    .map((star) => `${star.name}${star.targetStar ? `(${star.targetStar})` : ""}`)
    .join(", ");
  const brightnessOverrides = config.brightnessRules
    .map((rule) => `${rule.star}@${rule.branches.join("/")}:${rule.brightness}`)
    .join(", ");
  const hiddenVisibleStars = analysisChart.analysisStars
    .filter((star) => config.visibleStarPolicy.hiddenFromVisible.includes(star.name))
    .map((star) => star.name)
    .join(", ");

  return [
    "[TuVi Config Check]",
    `profile: ${config.id}`,
    `rawStars count: ${rawStarsCount}`,
    `analysisStars count: ${analysisStarsCount}`,
    `visibleStars count: ${visibleStarsCount}`,
    `mutagens: ${mutagens}`,
    `brightness overrides: ${brightnessOverrides}`,
    `hidden visible stars: ${hiddenVisibleStars}`,
    `unresolved extra star formulas: ${analysisChart.unresolvedExtraStarFormulas.join(", ")}`,
    "",
    "[Phi Cung Tứ Hóa]",
    buildPhiTuHoaDebugTable(analysisChart.palaces),
  ].join("\n");
}

export function createDisplayChart(
  rawChart: unknown,
  input: NormalizedBirthInput,
  config: SchoolConfig = tuvichancoCompatibleConfig,
  options?: ChartFactoryOptions,
): DisplayChart {
  const analysisChart = createAnalysisChart(rawChart, input, config, options);
  const displayChart: DisplayChart = {
    profile: analysisChart.profile,
    palaces: analysisChart.palaces.map(buildDisplayPalace),
    raw: rawChart,
    palaceStemMap: analysisChart.palaceStemMap,
    laiNhanCung: analysisChart.laiNhanCung,
    luuWarnings: analysisChart.unresolvedExtraStarFormulas.filter((item) => item.toLowerCase().includes("lưu") || item.toLowerCase().includes("iztro")),
    luuInspection: options?.horoscopeData,
    normalized: {
      schoolId: config.id,
      patterns: [],
    },
  };
  const normalizedChart = {
    ...analysisChart,
    analysisStars: undefined,
    unresolvedExtraStarFormulas: undefined,
  } as unknown as ChartLayers["normalizedChart"];
  const layers: ChartLayers = {
    rawChart,
    normalizedChart,
    analysisChart,
    displayChart: {
      ...displayChart,
      layers: undefined,
    },
  };

  displayChart.layers = layers;
  displayChart.normalized = {
    schoolId: config.id,
    patterns: displayChart.normalized?.patterns ?? [],
    debugReport: buildDebugReport(analysisChart, displayChart, config),
  };

  return displayChart;
}
