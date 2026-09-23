import { astro } from "iztro";
import { inspectIztroLuuData } from "../src/lib/tuvi/inspect/inspectIztroLuuData";

const raw = (astro as any).astrolabeBySolarDate("1998-10-26", 0, "男", true, "vi-VN");
const horoscope = typeof raw?.horoscope === "function" ? raw.horoscope(new Date("2026-06-10T00:00:00+07:00"), 0) : null;
const report = inspectIztroLuuData({
  natalChart: raw,
  yearStem: horoscope?.yearly?.heavenlyStem,
  yearBranch: horoscope?.yearly?.earthlyBranch,
  decadalStem: horoscope?.decadal?.heavenlyStem,
  decadalBranch: horoscope?.decadal?.earthlyBranch,
});

console.log("[Luu Star Check]");
console.log(`year: ${horoscope?.yearly?.heavenlyStem ?? "?"} ${horoscope?.yearly?.earthlyBranch ?? "?"}`);
console.log(`decadal: ${horoscope?.decadal?.heavenlyStem ?? "?"} ${horoscope?.decadal?.earthlyBranch ?? "?"}`);
console.log("raw iztro yearly:", JSON.stringify(horoscope?.yearly?.stars ?? null, null, 2));
console.log("raw iztro decadal:", JSON.stringify(horoscope?.decadal?.stars ?? null, null, 2));
console.log("raw iztro mutagens:", JSON.stringify({ yearly: horoscope?.yearly?.mutagen, decadal: horoscope?.decadal?.mutagen }, null, 2));
console.log("raw iztro yearlyDecStar:", JSON.stringify(horoscope?.yearly?.yearlyDecStar ?? null, null, 2));
console.log("inspection:", JSON.stringify(report, null, 2));
