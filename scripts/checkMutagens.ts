import { astro } from "iztro";
import { createAnalysisChart } from "../src/lib/tuvi/createAnalysisChart";
import { defaultVietnameseConfig } from "../src/lib/tuvi/config/defaultVietnamese.config";
import type { NormalizedBirthInput } from "../src/lib/tuvi/config/types";
import { MUTAGEN_RULES_BY_HEAVENLY_STEM, type HeavenlyStem } from "../src/lib/tuvi/rules/mutagenRules";

function buildRawChart(input: NormalizedBirthInput) {
  const date = `${input.year}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")}`;
  const gender = input.gender === "male" ? "男" : "女";
  return (astro as any).astrolabeBySolarDate(date, input.birthHourIndex, gender, true, "vi-VN");
}

function collectMutagens(chart: ReturnType<typeof createAnalysisChart>, prefix = "") {
  return chart.palaces.flatMap((palace) =>
    palace.analysisStars
      .filter((star) => star.name.startsWith(prefix ? `${prefix}Hóa` : "Hóa"))
      .map((star) => `- ${star.name} -> ${star.targetStar ?? "?"} -> ${palace.name}`),
  );
}

function runCase(label: string, input: NormalizedBirthInput) {
  const raw = buildRawChart(input);
  const horoscope = typeof raw?.horoscope === "function" ? raw.horoscope(new Date("2026-06-10T00:00:00+07:00"), input.birthHourIndex) : undefined;
  const chart = createAnalysisChart(raw, input, defaultVietnameseConfig, { horoscopeData: horoscope });
  const birthStem = chart.profile.yearStem as HeavenlyStem | undefined;
  const yearlyStem = horoscope?.yearly?.heavenlyStem as HeavenlyStem | undefined;
  const decadalStem = horoscope?.decadal?.heavenlyStem as HeavenlyStem | undefined;

  console.log(`[Mutagen Check] ${label}`);
  console.log(`birthStem: ${birthStem ?? "?"}`);
  if (birthStem) {
    console.log(`birthRule: ${JSON.stringify(MUTAGEN_RULES_BY_HEAVENLY_STEM[birthStem])}`);
  }
  console.log("Natal:");
  console.log(collectMutagens(chart).join("\n") || "- none");
  console.log(`yearStem: ${yearlyStem ?? "?"}`);
  console.log("Yearly:");
  console.log(collectMutagens(chart, "L.").join("\n") || "- none");
  console.log(`decadalStem: ${decadalStem ?? "?"}`);
  console.log("Decadal:");
  console.log(collectMutagens(chart, "ĐH.").join("\n") || "- none");
  console.log("");
}

runCase("1994-10-30 00:30", {
  fullName: "mutagen-1994",
  year: 1994,
  month: 10,
  day: 30,
  birthHour: 0,
  birthMinute: 30,
  birthHourIndex: 0,
  gender: "male",
  calendarType: "solar",
});

runCase("1998-10-26 00:30", {
  fullName: "mutagen-1998",
  year: 1998,
  month: 10,
  day: 26,
  birthHour: 0,
  birthMinute: 30,
  birthHourIndex: 0,
  gender: "male",
  calendarType: "solar",
});
