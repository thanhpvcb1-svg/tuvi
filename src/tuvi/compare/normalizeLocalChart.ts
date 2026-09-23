import type { ChartView } from "../../lib/types";
import { parseStarToken, buildPalace, shouldKeepCompareStar } from "./shared";
import type { CompareMode, NormalizedCompareChart } from "./types";

function toCompareStars(
  stars: Array<{ name: string; brightness?: string; display?: string }> | undefined,
  type: "main" | "good" | "bad",
) {
  return (stars ?? [])
    .map((star) => parseStarToken(star.display ?? `${star.name}${star.brightness ? `(${star.brightness})` : ""}`, type, "local"))
    .filter((star): star is NonNullable<typeof star> => Boolean(star));
}

export function normalizeLocalChart(mapped: ChartView, mode: CompareMode = "full"): NormalizedCompareChart {
  return {
    source: "local",
    profile: {
      fullName: mapped.profile.fullName,
      gender: mapped.profile.gender,
      solarDate: mapped.profile.solarDate,
      lunarDate: mapped.profile.lunarDate,
      birthTime: mapped.profile.birthTime,
    },
    palaces: mapped.palaces.map((palace) => {
      const mainStars = toCompareStars(palace.majorStars, "main").filter((star) => shouldKeepCompareStar(star, mode));
      const goodStars = toCompareStars(palace.leftStars ?? palace.goodStars ?? palace.visibleStars, "good").filter((star) =>
        shouldKeepCompareStar(star, mode),
      );
      const badStars = toCompareStars(palace.rightStars ?? palace.badStars, "bad").filter((star) => shouldKeepCompareStar(star, mode));

      return buildPalace("local", {
        name: palace.name,
        branch: palace.earthlyBranch,
        mainStars,
        goodStars,
        badStars,
      });
    }),
  };
}
