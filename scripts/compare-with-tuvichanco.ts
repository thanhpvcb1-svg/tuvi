declare const process: any;
declare const require: any;
declare const module: any;

import { compareCharts, formatCompareMarkdown } from "../src/tuvi/compare/compareCharts";
import { normalizeLocalChart } from "../src/tuvi/compare/normalizeLocalChart";
import { normalizeTuvichanco } from "../src/tuvi/compare/normalizeTuvichanco";
import type { CompareMode } from "../src/tuvi/compare/types";
import { fetchTuvichanco, type TuvichancoFetchInput } from "./fetch-tuvichanco";
import { generateLocalChart } from "./generate-local-chart";

const { mkdirSync, readFileSync, writeFileSync } = require("fs");
const { join, resolve } = require("path");

type CompareCliOptions = TuvichancoFetchInput & {
  referenceFile?: string;
  localFile?: string;
  outputDir: string;
  assertThresholds: boolean;
  mode: CompareMode;
};

function parseBoolean(value: string | undefined, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "y"].includes(String(value).toLowerCase());
}

function parseNumber(value: string | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseArgs(argv: string[]): CompareCliOptions {
  const args = new Map<string, string>();
  argv.forEach((entry) => {
    const match = entry.match(/^--([^=]+)=(.*)$/);
    if (match) {
      args.set(match[1], match[2]);
    }
  });

  return {
    hoten: args.get("hoten") ?? "",
    isDuong: parseBoolean(args.get("isDuong"), true),
    isNam: parseBoolean(args.get("isNam"), true),
    gio: parseNumber(args.get("gio")),
    ngay: parseNumber(args.get("ngay")),
    thang: parseNumber(args.get("thang")),
    nam: parseNumber(args.get("nam")),
    mau: parseNumber(args.get("mau"), 1),
    namHan: parseNumber(args.get("namHan"), new Date().getFullYear()),
    gioDH: parseNumber(args.get("gioDH")),
    gioDM: parseNumber(args.get("gioDM")),
    anTuHoa: parseBoolean(args.get("anTuHoa")),
    luuthaitue: parseBoolean(args.get("luuthaitue")),
    isNom: parseBoolean(args.get("isNom")),
    referenceFile: args.get("reference-file"),
    localFile: args.get("local-file"),
    outputDir: args.get("output-dir") ?? "reports",
    assertThresholds: parseBoolean(args.get("assert-thresholds")),
    mode: (args.get("mode") === "natal" ? "natal" : "full"),
  };
}

function readJsonFile(path: string) {
  return JSON.parse(readFileSync(resolve(path), "utf8"));
}

function timestampString(date: Date) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

function assertThresholds(result: ReturnType<typeof compareCharts>) {
  const brightnessMismatchExists = result.palaces.some((palace) =>
    palace.wrongBrightness.some((item) => item.localBrightness !== "" && item.referenceBrightness !== ""),
  );

  if (result.summary.matchPercentByName < 95) {
    throw new Error(`matchPercentByName ${result.summary.matchPercentByName}% < 95%`);
  }
  if (result.summary.matchPercentByNameAndBrightness < 90) {
    throw new Error(`matchPercentByNameAndBrightness ${result.summary.matchPercentByNameAndBrightness}% < 90%`);
  }
  if (result.duplicateStars.length > 0) {
    throw new Error(`duplicateStars still exist: ${result.duplicateStars.length}`);
  }
  if (brightnessMismatchExists) {
    throw new Error("display brightness still differs from reference brightness.");
  }
}

export async function runCompare(options: CompareCliOptions) {
  const referenceRaw = options.referenceFile ? readJsonFile(options.referenceFile) : await fetchTuvichanco(options);
  const localRaw = options.localFile ? readJsonFile(options.localFile) : generateLocalChart(options);
  if (referenceRaw?._placeholder) {
    throw new Error(
      `Reference fixture ${options.referenceFile ?? ""} is a placeholder. Replace it with a real Tuvichanco response or run with API credentials.`,
    );
  }
  const reference = normalizeTuvichanco(referenceRaw, options.mode);
  const local = normalizeLocalChart(localRaw, options.mode);
  const result = compareCharts(reference, local);
  const markdown = formatCompareMarkdown(result);

  mkdirSync(resolve(options.outputDir), { recursive: true });
  const stamp = timestampString(new Date());
  const jsonPath = join(resolve(options.outputDir), `tuvi-diff-${stamp}.json`);
  const mdPath = join(resolve(options.outputDir), `tuvi-diff-${stamp}.md`);
  const reportPayload = {
    input: {
      hoten: options.hoten,
      isDuong: options.isDuong,
      isNam: options.isNam,
      gio: options.gio,
      ngay: options.ngay,
      thang: options.thang,
      nam: options.nam,
      mau: options.mau,
      namHan: options.namHan,
      gioDH: options.gioDH,
      gioDM: options.gioDM,
      anTuHoa: options.anTuHoa,
      luuthaitue: options.luuthaitue,
      isNom: options.isNom,
      mode: options.mode,
    },
    reference,
    local,
    result,
  };

  writeFileSync(jsonPath, `${JSON.stringify(reportPayload, null, 2)}\n`, "utf8");
  writeFileSync(mdPath, `${markdown}\n`, "utf8");

  if (options.assertThresholds) {
    assertThresholds(result);
  }

  return {
    jsonPath,
    mdPath,
    result,
    markdown,
  };
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const outcome = await runCompare(options);
    console.log(outcome.markdown);
    console.log(`\nJSON report: ${outcome.jsonPath}`);
    console.log(`Markdown report: ${outcome.mdPath}`);
  } catch (error) {
    console.error(String(error instanceof Error ? error.message : error));
    process.exitCode = 1;
  }
}

if (typeof require !== "undefined" && require.main === module) {
  void main();
}
