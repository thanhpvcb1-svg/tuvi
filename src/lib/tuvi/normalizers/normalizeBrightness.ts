import type { BrightnessFull, BrightnessShort } from "../schools/types";

export const DIA_KHONG_DIA_KIEP_BRIGHTNESS = {
  "Địa Không": {
    Đ: ["Dần", "Thân", "Tỵ", "Hợi"],
    H: ["Tý", "Sửu", "Mão", "Thìn", "Ngọ", "Mùi", "Dậu", "Tuất"],
  },
  "Địa Kiếp": {
    Đ: ["Dần", "Thân", "Tỵ", "Hợi"],
    H: ["Tý", "Sửu", "Mão", "Thìn", "Ngọ", "Mùi", "Dậu", "Tuất"],
  },
} as const;

export const SAT_TINH_BRIGHTNESS_BY_BRANCH: Record<
  string,
  Partial<Record<BrightnessShort, readonly string[]>>
> = {
  "Kình Dương": {
    Đ: ["Thìn", "Tuất", "Sửu", "Mùi"],
    H: ["Tý", "Ngọ", "Mão", "Dậu", "Dần", "Thân", "Tỵ", "Hợi"],
  },
  "Đà La": {
    Đ: ["Thìn", "Tuất", "Sửu", "Mùi"],
    H: ["Tý", "Ngọ", "Mão", "Dậu", "Dần", "Thân", "Tỵ", "Hợi"],
  },
  "Hỏa Tinh": {
    Đ: ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ"],
    H: ["Tý", "Sửu", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"],
  },
  "Linh Tinh": {
    Đ: ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ"],
    H: ["Tý", "Sửu", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"],
  },
  "Địa Không": DIA_KHONG_DIA_KIEP_BRIGHTNESS["Địa Không"],
  "Địa Kiếp": DIA_KHONG_DIA_KIEP_BRIGHTNESS["Địa Kiếp"],
};

const FULL_BRIGHTNESS_MAP: Record<string, BrightnessFull> = {
  "": "",
  M: "Miếu",
  Miếu: "Miếu",
  廟: "Miếu",
  V: "Vượng",
  Vượng: "Vượng",
  旺: "Vượng",
  Đ: "Đắc",
  Đắc: "Đắc",
  得: "Đắc",
  B: "Bình",
  Bình: "Bình",
  平: "Bình",
  L: "Lợi",
  Lợi: "Lợi",
  H: "Hãm",
  Hãm: "Hãm",
  Hạn: "Hãm",
  陷: "Hãm",
};

export function normalizeBranch(branch: string): string {
  return branch.trim();
}

export function resolveBrightnessByBranch(
  starName: string,
  earthlyBranch: string,
): BrightnessShort | "" {
  const branch = normalizeBranch(earthlyBranch);
  const rule = SAT_TINH_BRIGHTNESS_BY_BRANCH[starName];

  if (!rule) {
    return "";
  }

  for (const [brightness, branches] of Object.entries(rule)) {
    if (branches?.includes(branch)) {
      return brightness as BrightnessShort;
    }
  }

  return "";
}

export function normalizeBrightness(value?: string | null, batFallback: BrightnessFull = "Hãm"): BrightnessFull {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (trimmed === "Bất") {
    return batFallback;
  }

  return FULL_BRIGHTNESS_MAP[trimmed] ?? "";
}

export function toBrightnessShort(input: BrightnessFull): BrightnessShort {
  switch (input) {
    case "Miếu":
      return "M";
    case "Vượng":
      return "V";
    case "Đắc":
      return "Đ";
    case "Bình":
      return "B";
    case "Lợi":
      return "L";
    case "Hãm":
      return "H";
    default:
      return "";
  }
}

function shortToFullBrightness(input: BrightnessShort | ""): BrightnessFull {
  switch (input) {
    case "M":
      return "Miếu";
    case "V":
      return "Vượng";
    case "Đ":
      return "Đắc";
    case "B":
      return "Bình";
    case "L":
      return "Lợi";
    case "H":
      return "Hãm";
    default:
      return "";
  }
}

export function getFinalBrightness(star: {
  name: string;
  brightness?: string;
  earthlyBranch: string;
}, batFallback: BrightnessFull = "Hãm"): BrightnessFull {
  const fromLibrary = normalizeBrightness(star.brightness, batFallback);

  if (fromLibrary) {
    return fromLibrary;
  }

  return shortToFullBrightness(resolveBrightnessByBranch(star.name, star.earthlyBranch));
}
