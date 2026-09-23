import type { BrightnessShort } from "../config/types";
import { BRIGHTNESS_DISPLAY_CODE, BRIGHTNESS_LABEL, type BrightnessCode } from "../../../config/starBrightness";
import { safeText } from "../utils";

const EMPTY_BRIGHTNESS = "";

export function normalizeBrightnessCode(input?: string): BrightnessCode | undefined {
  if (!input) return undefined;

  const value = input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

  if (["M", "MIẾU", "MIEU", "廟"].includes(value)) return "M";
  if (["V", "VƯỢNG", "VUONG", "旺"].includes(value)) return "V";
  if (["Đ", "D", "ĐẮC", "DAC", "得"].includes(value)) return "Đ";

  if (["B", "BH", "BÌNH", "BINH", "BÌNH HÒA", "BÌNH HOÀ", "BINH HOA", "平"].includes(value)) {
    return "BH";
  }

  if (["L", "LỢI", "LOI"].includes(value)) return "BH";
  if (["H", "HÃM", "HAM", "HẠN", "陷"].includes(value)) return "H";

  return undefined;
}

export function normalizeBrightness(input?: string): BrightnessShort {
  return (normalizeBrightnessCode(input) ?? EMPTY_BRIGHTNESS) as BrightnessShort;
}

export function normalizeBrightnessDetail(input?: string | null): { brightness: BrightnessShort; brightnessFull: string } {
  const brightness = normalizeBrightness(safeText(input));
  return {
    brightness,
    brightnessFull: brightnessFullFromShort(brightness),
  };
}

export function brightnessFullFromShort(value: BrightnessShort): string {
  if (!value) return "";
  if (value === "B" || value === "L") {
    return BRIGHTNESS_LABEL.BH;
  }

  return BRIGHTNESS_LABEL[value as BrightnessCode] ?? "";
}

export function brightnessDisplayCode(value?: BrightnessShort) {
  if (!value) return "";
  if (value === "B" || value === "L") {
    return BRIGHTNESS_DISPLAY_CODE.BH;
  }

  return BRIGHTNESS_DISPLAY_CODE[value as BrightnessCode] ?? "";
}
