declare const process: any;
declare const require: any;
declare const module: any;

import { createChart } from "../src/lib/iztroEngine";
import type { NormalizedBirthInput } from "../src/lib/types";

type LocalInput = {
  hoten: string;
  isDuong: boolean;
  isNam: boolean;
  gio: number;
  ngay: number;
  thang: number;
  nam: number;
  gioDH: number;
  gioDM: number;
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

function parseArgs(argv: string[]): LocalInput {
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
    gioDH: parseNumber(args.get("gioDH")),
    gioDM: parseNumber(args.get("gioDM")),
  };
}

function toBirthHourIndex(hour: number) {
  if (hour === 23) {
    return 12;
  }

  return Math.floor((hour + 1) / 2);
}

export function generateLocalChart(input: LocalInput) {
  const actualBirthHour = input.gioDH ?? input.gio;
  const actualBirthMinute = input.gioDM;
  const normalizedInput: NormalizedBirthInput = {
    fullName: input.hoten,
    year: input.nam,
    month: input.thang,
    day: input.ngay,
    birthHour: actualBirthHour,
    birthMinute: actualBirthMinute,
    birthHourIndex: toBirthHourIndex(actualBirthHour),
    gender: input.isNam ? "male" : "female",
    calendarType: input.isDuong ? "solar" : "lunar",
  };

  return createChart(normalizedInput, "tuvichancoCompatible");
}

function main() {
  try {
    const input = parseArgs(process.argv.slice(2));
    const chart = generateLocalChart(input);
    console.log(JSON.stringify(chart, null, 2));
  } catch (error) {
    console.error(String(error instanceof Error ? error.message : error));
    process.exitCode = 1;
  }
}

if (typeof require !== "undefined" && require.main === module) {
  main();
}
