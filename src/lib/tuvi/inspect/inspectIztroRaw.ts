import type { BrightnessInspectionReport, IztroRawInspectionReport, NormalizedChart, SchoolConfig } from "../config/types";
import { createBrightnessInspectionReport } from "../rules/starBrightnessResolver";
import { normalizeLookupKey, safeText } from "../utils";

function rawStarName(star: any) {
  return safeText(star?.name ?? star?.title ?? star?.shortName);
}

function pushUnique(list: string[], value: string) {
  if (value && !list.includes(value)) {
    list.push(value);
  }
}

export function inspectIztroRaw(rawAstrolabe: unknown): IztroRawInspectionReport {
  const raw = rawAstrolabe as any;
  const palaces = raw?.palaces ?? raw?.horoscope?.palaces ?? raw?.astrolabe?.palaces ?? [];
  const starsWithBrightness: string[] = [];
  const starsMissingBrightness: string[] = [];
  const starsWithMutagen: Array<{ star: string; mutagen: string; palace: string }> = [];
  const specialStarsFound: string[] = [];
  const cycleStarsFound: string[] = [];
  const warnings: string[] = [];

  for (const palace of palaces) {
    const palaceName = safeText(palace?.name ?? palace?.palaceName ?? palace?.title ?? palace?.branch) || "Unknown";
    const starGroups = [
      ...(Array.isArray(palace?.majorStars) ? palace.majorStars : []),
      ...(Array.isArray(palace?.minorStars) ? palace.minorStars : []),
      ...(Array.isArray(palace?.adjectiveStars) ? palace.adjectiveStars : []),
    ];

    for (const star of starGroups) {
      const starName = rawStarName(star);
      if (!starName) {
        continue;
      }

      const brightness = safeText(star?.brightness ?? star?.rank);
      if (brightness) {
        pushUnique(starsWithBrightness, starName);
      } else {
        pushUnique(starsMissingBrightness, starName);
      }

      const mutagen = safeText(star?.mutagen ?? star?.hua);
      if (mutagen) {
        starsWithMutagen.push({ star: starName, mutagen, palace: palaceName });
      }

      const key = normalizeLookupKey(starName);
      if (key === "tuan khong" || key === "triet lo" || key === "tuan" || key === "triet") {
        pushUnique(specialStarsFound, starName);
      }
    }

    for (const cycleStar of [palace?.suiqian12, palace?.jiangqian12, palace?.boshi12, palace?.changsheng12 ?? palace?.changsheng]) {
      const cycleName = safeText(cycleStar);
      if (cycleName) {
        pushUnique(cycleStarsFound, cycleName);
      }
    }
  }

  const mutagenLabels = new Set(starsWithMutagen.map((entry) => normalizeLookupKey(entry.mutagen)));
  for (const expected of ["hoa loc", "hoa quyen", "hoa khoa", "hoa ky", "loc", "quyen", "khoa", "ky"]) {
    if (mutagenLabels.has(expected)) {
      continue;
    }
  }

  if (specialStarsFound.length === 0) {
    warnings.push("Raw iztro khong thay Tuan/Triet.");
  }

  if (cycleStarsFound.length === 0) {
    warnings.push("Raw iztro khong thay du lieu vong sao.");
  }

  if (starsMissingBrightness.length > 0) {
    warnings.push(`Co ${starsMissingBrightness.length} sao raw khong co brightness.`);
  }

  return {
    palaceCount: Array.isArray(palaces) ? palaces.length : 0,
    starsWithBrightness,
    starsMissingBrightness,
    starsWithMutagen,
    specialStarsFound,
    cycleStarsFound,
    warnings,
  };
}

export function inspectResolvedBrightness(chart: NormalizedChart, config: SchoolConfig): BrightnessInspectionReport[] {
  const reports: BrightnessInspectionReport[] = [];

  for (const palace of chart.palaces) {
    for (const star of [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars, ...palace.cycleStars]) {
      reports.push(
        createBrightnessInspectionReport({
          starName: star.name,
          palaceName: palace.name,
          branch: palace.earthlyBranch ?? "",
          scope: star.scope,
          iztroBrightness: star.rawBrightness,
          config,
        }),
      );
    }
  }

  return reports;
}

export function formatBrightnessInspectionReport(reports: BrightnessInspectionReport[]) {
  const lines = ["[Brightness Check]", "star\tpalace\tbranch\tiztro\tfinal\tsource"];
  for (const report of reports) {
    lines.push(
      `${report.star}\t${report.palaceName}\t${report.branch}\t${report.iztroBrightness}\t${report.finalBrightness}\t${report.source}`,
    );
  }
  return lines.join("\n");
}
