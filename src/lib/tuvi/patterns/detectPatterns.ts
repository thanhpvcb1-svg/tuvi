import type { PatternResult } from "../schools/types";
import { normalizeLookupKey } from "../utils";

type DetectableChart = {
  palaces: Array<{
    name: string;
    displayStars?: Array<{ name: string }>;
  }>;
};

function getStarSet(stars: Array<{ name: string }> | undefined) {
  return new Set((stars ?? []).map((star) => normalizeLookupKey(star.name)));
}

function getTamPhuongIndexes(index: number) {
  return [index, (index + 4) % 12, (index + 8) % 12];
}

function getPatternConfidence(required: string[], actual: Set<string>) {
  const matched = required.filter((name) => actual.has(normalizeLookupKey(name)));
  return {
    matched,
    confidence: matched.length / required.length,
  };
}

function detectPattern(
  chart: DetectableChart,
  code: string,
  name: string,
  requiredStars: string[],
  level: PatternResult["level"],
): PatternResult {
  const allStars = new Set<string>();
  chart.palaces.forEach((palace) => {
    getStarSet(palace.displayStars).forEach((star) => allStars.add(star));
  });

  const allEvidence = getPatternConfidence(requiredStars, allStars);
  if (allEvidence.confidence === 1) {
    return {
      code,
      name,
      matched: true,
      confidence: 1,
      level,
      evidence: ["whole-chart"],
      stars: allEvidence.matched,
    };
  }

  let best = {
    confidence: allEvidence.confidence,
    palaceName: undefined as string | undefined,
    evidence: ["whole-chart"],
    stars: allEvidence.matched,
  };

  chart.palaces.forEach((palace, index) => {
    const palaceSet = getStarSet(palace.displayStars);
    const samePalace = getPatternConfidence(requiredStars, palaceSet);
    if (samePalace.confidence > best.confidence) {
      best = {
        confidence: samePalace.confidence,
        palaceName: palace.name,
        evidence: ["same-palace"],
        stars: samePalace.matched,
      };
    }

    const tamPhuongSet = new Set<string>();
    getTamPhuongIndexes(index).forEach((targetIndex) => {
      getStarSet(chart.palaces[targetIndex]?.displayStars).forEach((star) => tamPhuongSet.add(star));
    });
    const tamPhuong = getPatternConfidence(requiredStars, tamPhuongSet);
    if (tamPhuong.confidence > best.confidence) {
      best = {
        confidence: tamPhuong.confidence,
        palaceName: palace.name,
        evidence: ["tam-phuong"],
        stars: tamPhuong.matched,
      };
    }
  });

  return {
    code,
    name,
    matched: best.confidence === 1,
    confidence: Number(best.confidence.toFixed(2)),
    level,
    palaceName: best.palaceName,
    evidence: best.evidence,
    stars: best.stars,
  };
}

export function detectPatterns(chart: DetectableChart): PatternResult[] {
  return [
    detectPattern(chart, "TU_LINH", "Tứ Linh", ["Long Trì", "Phượng Các", "Bạch Hổ", "Hoa Cái"], "advanced"),
    detectPattern(chart, "TUE_HO_PHU", "Tuế Hổ Phù", ["Thái Tuế", "Bạch Hổ", "Quan Phù"], "expert_required"),
    detectPattern(chart, "TANG_TUE_DIEU", "Tang Tuế Điếu", ["Tang Môn", "Tuế Phá", "Điếu Khách"], "expert_required"),
  ];
}
