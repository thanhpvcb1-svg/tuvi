import * as iztro from "iztro";
import { safeText } from "../utils";

export function inspectIztroLuuData(params: {
  natalChart: unknown;
  yearStem?: string;
  yearBranch?: string;
  decadalStem?: string;
  decadalBranch?: string;
}) {
  const anyIztro = iztro as any;
  const natalChart = params.natalChart as any;
  const report: any = {
    exports: Object.keys(anyIztro),
    starExports: anyIztro.star ? Object.keys(anyIztro.star) : [],
    yearlyHoroscopeStars: null,
    decadalHoroscopeStars: null,
    yearlyMutagens: null,
    decadalMutagens: null,
    yearlyDecStar: null,
    horoscopeMethod: typeof natalChart?.horoscope,
    warnings: [] as string[],
  };

  try {
    if (typeof natalChart?.horoscope === "function") {
      const horoscope = natalChart.horoscope(new Date(), 0);
      report.yearlyHoroscopeStars = horoscope?.yearly?.stars ?? null;
      report.decadalHoroscopeStars = horoscope?.decadal?.stars ?? null;
      report.yearlyMutagens = horoscope?.yearly?.mutagen ?? null;
      report.decadalMutagens = horoscope?.decadal?.mutagen ?? null;
      report.yearlyDecStar = horoscope?.yearly?.yearlyDecStar ?? null;
    } else if (anyIztro.star?.getHoroscopeStar && params.yearStem && params.yearBranch) {
      try {
        report.yearlyHoroscopeStars = anyIztro.star.getHoroscopeStar(params.yearStem, params.yearBranch, "yearly");
      } catch (error) {
        report.warnings.push(`getHoroscopeStar(yearly) failed: ${safeText(error)}`);
      }

      if (params.decadalStem && params.decadalBranch) {
        try {
          report.decadalHoroscopeStars = anyIztro.star.getHoroscopeStar(params.decadalStem, params.decadalBranch, "decadal");
        } catch (error) {
          report.warnings.push(`getHoroscopeStar(decadal) failed: ${safeText(error)}`);
        }
      }
    } else {
      report.warnings.push("iztro horoscope source not found");
    }
  } catch (error) {
    report.warnings.push(`inspect horoscope failed: ${safeText(error)}`);
  }

  if (!report.yearlyHoroscopeStars) {
    report.warnings.push("yearly horoscope stars unavailable");
  }

  if (!report.decadalHoroscopeStars) {
    report.warnings.push("decadal horoscope stars unavailable");
  }

  return report;
}
