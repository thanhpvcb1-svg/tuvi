import type { BrightnessRule } from "../config/types";

const ALL_BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

export const MAIN_STAR_BRIGHTNESS_RULES: BrightnessRule[] = [
  { star: "Tử Vi", branches: ["Tỵ", "Ngọ", "Dần", "Thân", "Thìn", "Tuất"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Tử Vi", branches: ["Sửu", "Mùi", "Hợi", "Tý"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Tử Vi", branches: ["Mão", "Dậu"], brightness: "BH", brightnessFull: "Bình hòa", priority: 100, source: "school" },

  { star: "Thiên Phủ", branches: ["Dần", "Thân", "Tý", "Ngọ", "Thìn", "Tuất"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Thiên Phủ", branches: ["Mùi", "Hợi"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Thiên Phủ", branches: ["Sửu", "Mão", "Dậu", "Tỵ"], brightness: "BH", brightnessFull: "Bình hòa", priority: 100, source: "school" },

  { star: "Vũ Khúc", branches: ["Thìn", "Tuất", "Sửu", "Mùi", "Dần", "Thân", "Tý", "Ngọ"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Vũ Khúc", branches: ["Mão", "Dậu"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Vũ Khúc", branches: ["Tỵ", "Hợi"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },

  { star: "Thiên Tướng", branches: ["Tý", "Dần", "Thìn", "Ngọ", "Thân", "Tuất"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Thiên Tướng", branches: ["Sửu", "Tỵ", "Mùi", "Hợi"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Thiên Tướng", branches: ["Mão", "Dậu"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },

  { star: "Thất Sát", branches: ["Tý", "Dần", "Tỵ", "Ngọ", "Thân", "Hợi"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Thất Sát", branches: ["Sửu", "Mùi"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Thất Sát", branches: ["Mão", "Thìn", "Dậu", "Tuất"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },

  { star: "Phá Quân", branches: ["Tý", "Sửu", "Ngọ", "Mùi"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Phá Quân", branches: ["Thìn", "Tuất"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Phá Quân", branches: ["Dần", "Mão", "Tỵ", "Thân", "Dậu", "Hợi"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },

  { star: "Liêm Trinh", branches: ["Tý", "Dần", "Thìn", "Ngọ", "Thân", "Tuất"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Liêm Trinh", branches: ["Sửu", "Mùi"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Liêm Trinh", branches: ["Mão", "Dậu", "Tỵ", "Hợi"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },

  { star: "Tham Lang", branches: ["Sửu", "Thìn", "Mùi", "Tuất"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Tham Lang", branches: ["Dần", "Thân"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Tham Lang", branches: ["Tý", "Mão", "Tỵ", "Ngọ", "Dậu", "Hợi"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },

  { star: "Thiên Cơ", branches: ["Mão", "Thìn", "Tỵ", "Mùi", "Thân", "Dậu", "Tuất"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Thiên Cơ", branches: ["Tý", "Sửu", "Ngọ"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Thiên Cơ", branches: ["Dần", "Hợi"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },

  { star: "Thái Âm", branches: ["Thân", "Dậu", "Tuất", "Hợi", "Tý"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Thái Âm", branches: ["Sửu", "Mùi"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Thái Âm", branches: ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },

  { star: "Thiên Đồng", branches: ["Tý", "Dần", "Thân"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Thiên Đồng", branches: ["Mão", "Tỵ", "Hợi"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Thiên Đồng", branches: ["Sửu", "Thìn", "Ngọ", "Mùi", "Dậu", "Tuất"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },

  { star: "Thiên Lương", branches: ["Tý", "Dần", "Mão", "Thìn", "Ngọ", "Thân", "Tuất"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Thiên Lương", branches: ["Sửu", "Mùi"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Thiên Lương", branches: ["Tỵ", "Dậu", "Hợi"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },

  { star: "Cự Môn", branches: ["Tý", "Dần", "Mão", "Ngọ", "Dậu"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Cự Môn", branches: ["Thân", "Hợi"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Cự Môn", branches: ["Sửu", "Thìn", "Tỵ", "Mùi", "Tuất"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },

  { star: "Thái Dương", branches: ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ"], brightness: "V", brightnessFull: "Miếu/Vượng", priority: 100, source: "school" },
  { star: "Thái Dương", branches: ["Sửu", "Mùi"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Thái Dương", branches: ["Tý", "Thân", "Dậu", "Tuất", "Hợi"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },
];

export const AUXILIARY_BRIGHTNESS_RULES: BrightnessRule[] = [
  { star: "Địa Không", branches: ["Dần", "Thân", "Tỵ", "Hợi"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Địa Không", branches: ["Tý", "Sửu", "Mão", "Thìn", "Ngọ", "Mùi", "Dậu", "Tuất"], brightness: "H", brightnessFull: "Hãm", priority: 90, source: "school" },
  { star: "Địa Kiếp", branches: ["Dần", "Thân", "Tỵ", "Hợi"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Địa Kiếp", branches: ["Tý", "Sửu", "Mão", "Thìn", "Ngọ", "Mùi", "Dậu", "Tuất"], brightness: "H", brightnessFull: "Hãm", priority: 90, source: "school" },
  { star: "Đà La", branches: ["Thìn"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Kình Dương", branches: ["Ngọ"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },
  { star: "Thiên Khốc", branches: ["Thìn"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },
  { star: "Thiên Lương", branches: ["Tỵ"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },
  { star: "Thiên Hình", branches: ["Tỵ"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },
  { star: "Bạch Hổ", branches: ["Dần", "Mão", "Thân", "Dậu"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Bạch Hổ", branches: ["Tý", "Sửu", "Thìn", "Tỵ", "Ngọ", "Mùi", "Tuất", "Hợi"], brightness: "H", brightnessFull: "Hãm", priority: 90, source: "school" },
  { star: "Thiên Mã", branches: ["Dần"], brightness: "V", brightnessFull: "Vượng", priority: 100, source: "school" },
  { star: "Thiên Mã", branches: ["Tỵ"], brightness: "M", brightnessFull: "Miếu", priority: 100, source: "school" },
  { star: "Thiên Mã", branches: ["Thân"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Thiên Mã", branches: ["Tý", "Sửu", "Mão", "Thìn", "Ngọ", "Mùi", "Dậu", "Tuất", "Hợi"], brightness: "H", brightnessFull: "Hãm", priority: 90, source: "school" },
  { star: "Thiên Hư", branches: ["Ngọ"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Thiên Hư", branches: ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"], brightness: "H", brightnessFull: "Hãm", priority: 90, source: "school" },
  { star: "Thiên Hình", branches: ["Dần", "Mão", "Dậu", "Tuất"], brightness: "V", brightnessFull: "Vượng", priority: 100, source: "school" },
  { star: "Thiên Hình", branches: ["Tý", "Sửu", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Hợi"], brightness: "H", brightnessFull: "Hãm", priority: 90, source: "school" },
  { star: "Thiên Diêu", branches: ["Thìn"], brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },
  { star: "Văn Xương", branches: ["Mão"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Tiểu Hao", branches: ["Thân"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Hỏa Tinh", branches: ALL_BRANCHES, brightness: "H", brightnessFull: "Hãm", priority: 100, source: "school" },
  { star: "Đại Hao", branches: ["Dần"], brightness: "Đ", brightnessFull: "Đắc", priority: 100, source: "school" },
  { star: "Linh Tinh", branches: ALL_BRANCHES, brightness: "H", brightnessFull: "Hãm", priority: 80, source: "school" },
  { star: "Hóa Lộc", branches: ALL_BRANCHES, brightness: "H", brightnessFull: "Hãm", priority: 50, source: "school" },
  { star: "Hóa Quyền", branches: ALL_BRANCHES, brightness: "H", brightnessFull: "Hãm", priority: 50, source: "school" },
  { star: "Hóa Khoa", branches: ALL_BRANCHES, brightness: "H", brightnessFull: "Hãm", priority: 50, source: "school" },
  { star: "Hóa Kỵ", branches: ALL_BRANCHES, brightness: "H", brightnessFull: "Hãm", priority: 50, source: "school" },
];

export const BRIGHTNESS_RULES: BrightnessRule[] = [...MAIN_STAR_BRIGHTNESS_RULES, ...AUXILIARY_BRIGHTNESS_RULES];

export const AITUVI_BRIGHTNESS_RULES: BrightnessRule[] = [...BRIGHTNESS_RULES];

export const TUVICHANCO_BRIGHTNESS_RULES: BrightnessRule[] = [...BRIGHTNESS_RULES];
