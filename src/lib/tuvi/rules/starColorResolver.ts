import type { NormalizedStar, SchoolConfig, StarColorGroup } from "../config/types";
import { normalizeLookupKey } from "../utils";

const MAIN_STARS = new Set([
  "tu vi",
  "thien co",
  "thai duong",
  "vu khuc",
  "thien dong",
  "liem trinh",
  "thien phu",
  "thai am",
  "tham lang",
  "cu mon",
  "thien tuong",
  "thien luong",
  "that sat",
  "pha quan",
]);

const GREEN_STARS = new Set([
  "ta phu",
  "huu bat",
  "van xuong",
  "van khuc",
  "thien khoi",
  "thien viet",
  "long duc",
  "giai than",
  "thien quy",
  "an quang",
  "thien duc",
  "nguyet duc",
  "duong phu",
]);

const RED_STARS = new Set([
  "hoa tinh",
  "linh tinh",
  "dia khong",
  "dia kiep",
  "thien khong",
  "dieu khach",
  "quan phu",
  "tue pha",
  "dai hao",
  "tieu hao",
  "thien hinh",
  "pha toai",
  "thien giai",
]);

const BLACK_STARS = new Set([
  "kinh duong",
  "da la",
  "tang mon",
  "bach ho",
  "thien khoc",
  "thien hu",
  "am sat",
  "co than",
  "qua tu",
]);

const GRAY_STARS = new Set(["phi liem", "tau thu", "phuc binh", "dia vong"]);
const LIGHT_GRAY_STARS = new Set(["hy than", "benh phu", "thien su", "thien thuong"]);

function mutagenLabel(starName: string): "Lộc" | "Quyền" | "Khoa" | "Kỵ" | undefined {
  const key = normalizeLookupKey(starName);
  if (key === "hoa loc") return "Lộc";
  if (key === "hoa quyen") return "Quyền";
  if (key === "hoa khoa") return "Khoa";
  if (key === "hoa ky") return "Kỵ";
  return undefined;
}

export function resolveStarColor(star: NormalizedStar, config: SchoolConfig): StarColorGroup {
  const label = mutagenLabel(star.name);
  if (label) {
    return config.colorPolicy.mutagenColors[label];
  }

  const semantic = config.colorPolicy.semanticOverrides[star.name];
  if (semantic) {
    return semantic;
  }

  const key = normalizeLookupKey(star.name);

  if (MAIN_STARS.has(key)) return "majorRed";
  if (GREEN_STARS.has(key)) return "green";
  if (RED_STARS.has(key)) return "red";
  if (BLACK_STARS.has(key)) return "black";
  if (GRAY_STARS.has(key)) return "gray";
  if (LIGHT_GRAY_STARS.has(key)) return "lightGray";

  if (star.scope === "annual") {
    return "lightGray";
  }

  return "orange";
}
