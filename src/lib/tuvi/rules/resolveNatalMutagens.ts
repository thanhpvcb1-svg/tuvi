import type { MutagenRule, NormalizedChart, NormalizedStar } from "../config/types";
import { normalizeBrightnessDetail } from "../normalize/normalizeBrightness";
import { normalizeRuleStarName } from "./starAliases";
import { MUTAGEN_STAR_NAMES } from "./mutagenRules";

function findPalaceContainingStar(chart: NormalizedChart, targetStar: string) {
  return chart.palaces.find((palace) =>
    [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars].some(
      (star) => normalizeRuleStarName(star.name) === normalizeRuleStarName(targetStar),
    ),
  );
}

function createNatalMutagenStar(
  label: "Lộc" | "Quyền" | "Khoa" | "Kỵ",
  targetStar: string,
  rule: MutagenRule,
): NormalizedStar {
  const name = MUTAGEN_STAR_NAMES[label];
  const brightness = rule.brightness?.[label] ?? "";
  const rawBrightness = normalizeBrightnessDetail(brightness);

  return {
    name,
    originalName: name,
    targetStar,
    source: "mutagen",
    scope: "origin",
    brightness,
    brightnessFull: rawBrightness.brightnessFull,
    colorGroup: label === "Kỵ" ? "thuy" : label === "Quyền" ? "red" : "green",
  };
}

export function resolveNatalMutagens(chart: NormalizedChart, rule?: MutagenRule) {
  const starsByPalace = new Map<number, NormalizedStar[]>();
  const warnings: string[] = [];

  if (!rule) {
    return { starsByPalace, warnings };
  }

  const entries: Array<["Lộc" | "Quyền" | "Khoa" | "Kỵ", string]> = [
    ["Lộc", rule.mutagens.loc],
    ["Quyền", rule.mutagens.quyen],
    ["Khoa", rule.mutagens.khoa],
    ["Kỵ", rule.mutagens.ky],
  ];

  for (const [label, rawTargetStar] of entries) {
    const targetStar = normalizeRuleStarName(rawTargetStar);
    const palace = findPalaceContainingStar(chart, targetStar);

    if (!palace) {
      warnings.push(`Không tìm thấy sao đích ${targetStar} cho ${MUTAGEN_STAR_NAMES[label]}.`);
      continue;
    }

    const resolvedStar = createNatalMutagenStar(label, targetStar, rule);
    const existing = starsByPalace.get(palace.index) ?? [];
    if (!existing.some((star) => star.name === resolvedStar.name && star.targetStar === resolvedStar.targetStar)) {
      existing.push(resolvedStar);
      starsByPalace.set(palace.index, existing);
    }
  }

  return { starsByPalace, warnings };
}
