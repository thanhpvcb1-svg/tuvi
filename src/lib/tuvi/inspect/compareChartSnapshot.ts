import type { DisplayChart, SnapshotCompareReport } from "../config/types";

function toDisplayList(stars: Array<{ display?: string; name: string; brightness?: string }> = []) {
  return stars.map((star) => star.display ?? `${star.name}${star.brightness ? `(${star.brightness})` : ""}`);
}

export function compareChartSnapshot(
  expected: { profile: string; palace: string; center?: string[]; left?: string[]; right?: string[]; bottom?: string[] },
  actual: DisplayChart,
): SnapshotCompareReport {
  const palace = actual.palaces.find((item) => item.name === expected.palace);
  const actualMajorStars = toDisplayList(palace?.centerStars ?? palace?.majorStars);
  const actualVisible = [
    ...toDisplayList(palace?.centerStars),
    ...toDisplayList(palace?.leftStars),
    ...toDisplayList(palace?.rightStars),
    ...toDisplayList(palace?.bottomStars),
  ];
  const expectedVisible = [...(expected.center ?? []), ...(expected.left ?? []), ...(expected.right ?? []), ...(expected.bottom ?? [])];

  return {
    profile: expected.profile,
    palace: expected.palace,
    expectedMajorStars: expected.center ?? [],
    actualMajorStars,
    missingVisibleStars: expectedVisible.filter((star) => !actualVisible.includes(star)),
    extraVisibleStars: actualVisible.filter((star) => !expectedVisible.includes(star)),
    brightnessMismatch: [],
    colorMismatch: [],
    mutagenMismatch: [],
    annualStarsMissing: [],
    rawOnlyHiddenStars: (palace?.analysisStars ?? [])
      .map((star) => star.display ?? star.name)
      .filter((star) => !actualVisible.includes(star)),
    unresolvedExtraStarFormulas: actual.layers?.analysisChart.unresolvedExtraStarFormulas ?? [],
  };
}

export function formatSnapshotCompareReport(report: SnapshotCompareReport) {
  return [
    "[TuVi Snapshot Compare]",
    `profile: ${report.profile}`,
    `palace: ${report.palace}`,
    `expected major stars: ${report.expectedMajorStars.join(", ")}`,
    `actual major stars: ${report.actualMajorStars.join(", ")}`,
    `missing visible stars: ${report.missingVisibleStars.join(", ")}`,
    `extra visible stars: ${report.extraVisibleStars.join(", ")}`,
    `brightness mismatch: ${report.brightnessMismatch.join(", ")}`,
    `color mismatch: ${report.colorMismatch.join(", ")}`,
    `mutagen mismatch: ${report.mutagenMismatch.join(", ")}`,
    `annual stars missing: ${report.annualStarsMissing.join(", ")}`,
    `raw-only hidden stars: ${report.rawOnlyHiddenStars.join(", ")}`,
    `unresolved extra star formulas: ${report.unresolvedExtraStarFormulas.join(", ")}`,
  ].join("\n");
}
