import { normalizeStarName } from "../normalizers/normalizeStarName";
import {
  COMMON_SUPPORT_STARS,
  LUC_CAT_STARS,
  LUC_SAT_STARS,
  MAIN_STARS,
  THAI_TUE_RING_STARS,
  TU_HOA_STARS,
} from "./starGroups";

export type StarColorGroup =
  | "majorRed"
  | "green"
  | "orange"
  | "red"
  | "black"
  | "gray"
  | "lightGray";

type StarForColor = {
  name: string;
  type?: string;
  brightness?: string;
  mutagen?: string;
  palaceName?: string;
  earthlyBranch?: string;
};

const GREEN_STARS = new Set([
  ...LUC_CAT_STARS,
  "Long Đức",
  "Giải Thần",
  "Thiên Quý",
  "Ân Quang",
  "Thiên Đức",
  "Nguyệt Đức",
]);

const RED_BAD_STARS = new Set([
  ...LUC_SAT_STARS,
  "Thiên Không",
  "Điếu Khách",
  "Quan Phù",
  "Tuế Phá",
  "Đại Hao",
  "Tiểu Hao",
  "Thiên Hình",
]);

const BLACK_BAD_STARS = new Set([
  "Kình Dương",
  "Đà La",
  "Hóa Kỵ",
  "Tang Môn",
  "Bạch Hổ",
  "Thiên Khốc",
  "Thiên Hư",
  "Âm Sát",
  "Cô Thần",
  "Quả Tú",
]);

const GRAY_STARS = new Set(["Phi Liêm", "Tấu Thư", "Phục Binh"]);

const LIGHT_GRAY_STARS = new Set(["Hỷ Thần", "Bệnh Phù", "Thiên Sứ", "Thiên Thương"]);

const ORANGE_STARS = new Set([
  ...COMMON_SUPPORT_STARS,
  "Tam Thai",
  "Bát Tọa",
  "Long Trì",
  "Phượng Các",
  "Đài Phụ",
  "Phong Cáo",
  "Thiên Trù",
  "Thiên Tài",
  "Thiên Thọ",
  "Thiên Mã",
  "Hoa Cái",
  "Thiên Nguyệt",
  "Thiên Quan",
  "Thiên Phúc",
]);

export function resolveStarColor(
  star: StarForColor,
  aliases: Record<string, string>,
): StarColorGroup {
  const name = normalizeStarName(star.name, aliases).name;

  if (star.mutagen === "Lộc") return "green";
  if (star.mutagen === "Quyền") return "green";
  if (star.mutagen === "Khoa") return "green";
  if (star.mutagen === "Kỵ") return "black";

  if (TU_HOA_STARS.has(name)) {
    return name === "Hóa Kỵ" ? "black" : "green";
  }

  if (MAIN_STARS.has(name)) return "majorRed";
  if (THAI_TUE_RING_STARS.has(name) && name === "Bạch Hổ") return "black";
  if (RED_BAD_STARS.has(name)) return "red";
  if (BLACK_BAD_STARS.has(name)) return "black";
  if (GRAY_STARS.has(name)) return "gray";
  if (GREEN_STARS.has(name)) return "green";
  if (LIGHT_GRAY_STARS.has(name)) return "lightGray";
  if (ORANGE_STARS.has(name)) return "orange";

  return "orange";
}
