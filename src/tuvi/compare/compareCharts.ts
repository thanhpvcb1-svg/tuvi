import { normalizeLookupKey } from "../../lib/tuvi/utils";
import { countByKey, normalizeStarForDisplay } from "./shared";
import type {
  CompareChartsResult,
  ComparePalace,
  ComparePalaceResult,
  CompareStar,
  DuplicateStarMismatch,
  NormalizedCompareChart,
  WrongBrightnessMismatch,
  WrongPalaceMismatch,
} from "./types";

function buildDuplicateEntries(palace: ComparePalace, chartSource: "tuvichanco" | "local"): DuplicateStarMismatch[] {
  const counts = new Map<string, { count: number; display: string }>();

  for (const star of palace.allStars) {
    const key = normalizeLookupKey(star.normalizedName);
    const current = counts.get(key) ?? { count: 0, display: star.normalizedName };
    current.count += 1;
    counts.set(key, current);
  }

  return Array.from(counts.entries())
    .filter(([, item]) => item.count > 1)
    .map(([star, item]) => ({
      chartSource,
      palaceName: palace.name,
      branch: palace.branch,
      star,
      count: item.count,
    }));
}

function matchReferencePalace(referencePalace: ComparePalace, localPalaces: ComparePalace[]) {
  const byName = localPalaces.find((palace) => normalizeLookupKey(palace.name) === normalizeLookupKey(referencePalace.name));
  if (byName) {
    return { palace: byName, matchedBy: "name" as const };
  }

  const byBranch = localPalaces.find((palace) => normalizeLookupKey(palace.branch) === normalizeLookupKey(referencePalace.branch));
  if (byBranch) {
    return { palace: byBranch, matchedBy: "branch" as const };
  }

  const byIndex = localPalaces[referencePalace ? localPalaces.findIndex((item) => item === byName) : -1] ?? localPalaces[0];
  return { palace: byIndex ?? referencePalace, matchedBy: "index" as const };
}

function expandCountDifference(reference: Map<string, number>, local: Map<string, number>, starsByKey: Map<string, CompareStar>) {
  const differences: string[] = [];

  for (const [key, referenceCount] of reference.entries()) {
    const localCount = local.get(key) ?? 0;
    const missingCount = referenceCount - localCount;
    if (missingCount <= 0) {
      continue;
    }

    const star = starsByKey.get(key);
    const label = star ? normalizeStarForDisplay(star) : key;
    for (let index = 0; index < missingCount; index += 1) {
      differences.push(label);
    }
  }

  return differences;
}

function collectWrongBrightness(referencePalace: ComparePalace, localPalace: ComparePalace): WrongBrightnessMismatch[] {
  const localByName = new Map<string, CompareStar[]>();
  for (const star of localPalace.allStars) {
    const key = normalizeLookupKey(star.normalizedName);
    const list = localByName.get(key) ?? [];
    list.push(star);
    localByName.set(key, list);
  }

  const mismatches: WrongBrightnessMismatch[] = [];
  for (const referenceStar of referencePalace.allStars) {
    const key = normalizeLookupKey(referenceStar.normalizedName);
    const localStars = localByName.get(key) ?? [];
    if (!localStars.some((star) => star.brightness === referenceStar.brightness)) {
      const firstLocal = localStars[0];
      if (firstLocal) {
        mismatches.push({
          palaceName: referencePalace.name,
          branch: referencePalace.branch,
          star: referenceStar.normalizedName,
          referenceBrightness: referenceStar.brightness,
          localBrightness: firstLocal.brightness,
        });
      }
    }
  }

  return mismatches.filter(
    (item, index, collection) =>
      collection.findIndex(
        (candidate) =>
          candidate.palaceName === item.palaceName &&
          candidate.star === item.star &&
          candidate.referenceBrightness === item.referenceBrightness &&
          candidate.localBrightness === item.localBrightness,
      ) === index,
  );
}

function findWrongPalace(reference: NormalizedCompareChart, local: NormalizedCompareChart) {
  const referenceByStar = new Map<string, ComparePalace[]>();

  for (const palace of reference.palaces) {
    for (const star of palace.allStars) {
      const key = normalizeLookupKey(star.normalizedName);
      const list = referenceByStar.get(key) ?? [];
      list.push(palace);
      referenceByStar.set(key, list);
    }
  }

  const mismatches: WrongPalaceMismatch[] = [];
  for (const palace of local.palaces) {
    for (const star of palace.allStars) {
      const key = normalizeLookupKey(star.normalizedName);
      const expectedPalaces = referenceByStar.get(key) ?? [];
      if (!expectedPalaces.length) {
        continue;
      }
      if (expectedPalaces.some((candidate) => normalizeLookupKey(candidate.name) === normalizeLookupKey(palace.name))) {
        continue;
      }

      mismatches.push({
        star: star.normalizedName,
        actualPalaceName: palace.name,
        actualBranch: palace.branch,
        expectedPalaceName: expectedPalaces[0].name,
        expectedBranch: expectedPalaces[0].branch,
      });
    }
  }

  return mismatches.filter(
    (item, index, collection) =>
      collection.findIndex(
        (candidate) =>
          candidate.star === item.star &&
          candidate.actualPalaceName === item.actualPalaceName &&
          candidate.expectedPalaceName === item.expectedPalaceName,
      ) === index,
  );
}

export function compareCharts(reference: NormalizedCompareChart, local: NormalizedCompareChart): CompareChartsResult {
  const palaceResults: ComparePalaceResult[] = [];
  const duplicateStars = [
    ...reference.palaces.flatMap((palace) => buildDuplicateEntries(palace, "tuvichanco")),
    ...local.palaces.flatMap((palace) => buildDuplicateEntries(palace, "local")),
  ];

  let totalReferenceStars = 0;
  let matchedByNameCount = 0;
  let matchedByNameAndBrightnessCount = 0;

  for (const referencePalace of reference.palaces) {
    const matched = matchReferencePalace(referencePalace, local.palaces);
    const localPalace = matched.palace;
    const referenceNameCounts = countByKey(referencePalace.allStars, false);
    const localNameCounts = countByKey(localPalace.allStars, false);
    const referenceExactCounts = countByKey(referencePalace.allStars, true);
    const localExactCounts = countByKey(localPalace.allStars, true);

    totalReferenceStars += referencePalace.allStars.length;

    for (const [key, referenceCount] of referenceNameCounts.entries()) {
      matchedByNameCount += Math.min(referenceCount, localNameCounts.get(key) ?? 0);
    }

    for (const [key, referenceCount] of referenceExactCounts.entries()) {
      matchedByNameAndBrightnessCount += Math.min(referenceCount, localExactCounts.get(key) ?? 0);
    }

    const referenceNameIndex = new Map(referencePalace.allStars.map((star) => [normalizeLookupKey(star.normalizedName), star]));
    const localNameIndex = new Map(localPalace.allStars.map((star) => [normalizeLookupKey(star.normalizedName), star]));
    const referenceExactIndex = new Map(referencePalace.allStars.map((star) => [`${normalizeLookupKey(star.normalizedName)}|${star.brightness}`, star]));
    const localExactIndex = new Map(localPalace.allStars.map((star) => [`${normalizeLookupKey(star.normalizedName)}|${star.brightness}`, star]));

    palaceResults.push({
      palaceName: referencePalace.name,
      branch: referencePalace.branch,
      matchedBy: matched.matchedBy,
      missingStars: expandCountDifference(referenceNameCounts, localNameCounts, referenceNameIndex),
      extraStars: expandCountDifference(localNameCounts, referenceNameCounts, localNameIndex),
      wrongBrightness: collectWrongBrightness(referencePalace, localPalace),
      duplicateStars: [
        ...buildDuplicateEntries(referencePalace, "tuvichanco"),
        ...buildDuplicateEntries(localPalace, "local"),
      ],
    });

    void referenceExactIndex;
    void localExactIndex;
  }

  const wrongPalace = findWrongPalace(reference, local);

  return {
    summary: {
      totalReferenceStars,
      matchedByNameCount,
      matchedByNameAndBrightnessCount,
      matchPercentByName: totalReferenceStars === 0 ? 100 : Number(((matchedByNameCount / totalReferenceStars) * 100).toFixed(2)),
      matchPercentByNameAndBrightness:
        totalReferenceStars === 0 ? 100 : Number(((matchedByNameAndBrightnessCount / totalReferenceStars) * 100).toFixed(2)),
      duplicateStarsCount: duplicateStars.length,
    },
    palaces: palaceResults,
    wrongPalace,
    duplicateStars,
  };
}

export function formatCompareMarkdown(result: CompareChartsResult) {
  const lines: string[] = [
    "## Summary",
    `Name match: ${result.summary.matchedByNameCount}/${result.summary.totalReferenceStars} = ${result.summary.matchPercentByName}%`,
    `Exact match: ${result.summary.matchedByNameAndBrightnessCount}/${result.summary.totalReferenceStars} = ${result.summary.matchPercentByNameAndBrightness}%`,
    `Duplicate stars: ${result.summary.duplicateStarsCount}`,
  ];

  if (result.wrongPalace.length) {
    lines.push("", "## Wrong Palace");
    result.wrongPalace.forEach((item) => {
      lines.push(`- ${item.star}: local ${item.actualPalaceName} (${item.actualBranch}), reference ${item.expectedPalaceName} (${item.expectedBranch})`);
    });
  }

  for (const palace of result.palaces) {
    if (!palace.missingStars.length && !palace.extraStars.length && !palace.wrongBrightness.length && !palace.duplicateStars.length) {
      continue;
    }

    lines.push("", `## Cung ${palace.palaceName.toUpperCase()}`);
    if (palace.missingStars.length) {
      lines.push("Missing:");
      palace.missingStars.forEach((star) => lines.push(`- ${star}`));
    }
    if (palace.extraStars.length) {
      lines.push("Extra:");
      palace.extraStars.forEach((star) => lines.push(`- ${star}`));
    }
    if (palace.wrongBrightness.length) {
      lines.push("Wrong brightness:");
      palace.wrongBrightness.forEach((item) => {
        lines.push(`- ${item.star}: local ${item.localBrightness || "(trống)"}, reference ${item.referenceBrightness || "(trống)"}`);
      });
    }
    if (palace.duplicateStars.length) {
      lines.push("Duplicate:");
      palace.duplicateStars.forEach((item) => {
        lines.push(`- ${item.chartSource} ${item.star}: ${item.count}`);
      });
    }
  }

  return lines.join("\n");
}
