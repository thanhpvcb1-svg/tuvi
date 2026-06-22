import type { ColorPolicy, FiveElement, StarColorGroup } from "../config/types";

export const ELEMENT_TO_COLOR = {
  kim: "gray",
  moc: "green",
  thuy: "black",
  hoa: "red",
  tho: "orange",
} satisfies Record<FiveElement, StarColorGroup>;

export const DEFAULT_COLOR_POLICY: ColorPolicy = {
  mode: "byElementThenSemantic",
  elementToColor: ELEMENT_TO_COLOR,
  semanticOverrides: {
    "Địa Không": "red",
    "Địa Kiếp": "red",
    "Thiên Không": "red",
    "Hỏa Tinh": "red",
    "Linh Tinh": "red",
    "Bạch Hổ": "black",
    "Tang Môn": "black",
    "Thiên Hư": "black",
    "Thiên Khốc": "black",
    "Tuần": "badgeBlack",
    "Triệt": "badgeBlack",
  },
  mutagenColors: {
    Lộc: "green",
    Quyền: "red",
    Khoa: "green",
    Kỵ: "thuy",
  },
};
