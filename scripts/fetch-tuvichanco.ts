declare const process: any;
declare const require: any;
declare const module: any;

import { safeText } from "../src/lib/tuvi/utils";

export type TuvichancoFetchInput = {
  hoten: string;
  isDuong: boolean;
  isNam: boolean;
  gio: number;
  ngay: number;
  thang: number;
  nam: number;
  mau?: number;
  namHan: number;
  gioDH: number;
  gioDM: number;
  anTuHoa: boolean;
  luuthaitue: boolean;
  isNom?: boolean;
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

function parseArgs(argv: string[]): TuvichancoFetchInput {
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
  };
}

export async function fetchTuvichanco(input: TuvichancoFetchInput) {
  const cookie = process.env.TUVI_CHANCO_COOKIE;
  const tokenkey = process.env.TUVI_CHANCO_TOKENKEY;

  if (!cookie || !tokenkey) {
    throw new Error("Missing TUVI_CHANCO_COOKIE or TUVI_CHANCO_TOKENKEY.");
  }

  const body = new URLSearchParams({
    hoten: input.hoten,
    isDuong: input.isDuong ? "1" : "0",
    isNam: input.isNam ? "1" : "0",
    gio: String(input.gio),
    ngay: String(input.ngay),
    thang: String(input.thang),
    nam: String(input.nam),
    mau: String(input.mau ?? 1),
    isNom: input.isNom ? "1" : "0",
    namHan: String(input.namHan),
    gioDH: String(input.gioDH),
    gioDM: String(input.gioDM),
    anTuHoa: input.anTuHoa ? "1" : "0",
    luuthaitue: input.luuthaitue ? "1" : "0",
    tokenkey,
  });

  const response = await fetch("https://tuvichanco.vn/tuvi_ls/core/core.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Cookie: cookie,
    },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Tuvichanco API error ${response.status}: ${text.slice(0, 300)}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Tuvichanco API returned non-JSON body: ${safeText(error)} | ${text.slice(0, 300)}`);
  }
}

async function main() {
  try {
    const input = parseArgs(process.argv.slice(2));
    const data = await fetchTuvichanco(input);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(String(error instanceof Error ? error.message : error));
    process.exitCode = 1;
  }
}

if (typeof require !== "undefined" && require.main === module) {
  void main();
}
