/**
 * CoHoc.net Integration Types
 */

// Input from user (solar calendar)
export type CoHocInput = {
  name: string;
  birthDate: string; // YYYY-MM-DD (solar)
  birthHour: number; // 0-23
  birthMinute: number; // 0-59
  gender: "male" | "female";
  targetYear: number;
};

// Lunar date after conversion
export type LunarDate = {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  hourBranch: string; // Tý, Sửu, etc.
  hourIndex: number; // 0-11
};

// Parameters for Core.html
export type CoHocCoreParams = {
  version: string;
  hoten: string;
  isDuong: number; // 1 = dương lịch input
  isNam: number; // 1 = nam, 0 = nữ
  gio: number; // hour index for cohoc
  ngay: number; // lunar day
  thang: number; // lunar month
  nam: number; // lunar year
  mau: number;
  luuthaitue: number;
  gioDH: number;
  gioDM: number;
  kieuls: number;
  namHan: number;
  anTuHoa: number;
  TokenCSRF: string;
};

// Star in a palace
export type CoHocStar = {
  name: string;
  brightness?: string;
  transformation?: string; // Lộc, Quyền, Khoa, Kỵ
};

// Palace data
export type CoHocPalace = {
  name: string;
  position: number; // 1-12
  branch: string; // Tý, Sửu, etc.
  stem: string; // Giáp, Ất, etc.
  mainStars: CoHocStar[];
  secondaryStars: CoHocStar[];
  miscStars: CoHocStar[];
  changSheng?: string; // Trường Sinh 12 cung
  greatLimit?: string; // Đại vận range
  smallLimit?: number; // Tiểu hạn year
};

// Chart metadata
export type CoHocChartMeta = {
  menh: string;
  than: string;
  cuc: string;
  menhChu: string;
  thanChu: string;
  amDuong: string;
  nguHanh: string;
};

// Full parsed result
export type CoHocChartResult = {
  source: {
    provider: "cohoc.net";
    engine: "Core.html";
    version: string;
    fetchedAt: string;
  };
  input: CoHocInput;
  lunar: LunarDate;
  chart: CoHocChartMeta;
  palaces: Record<string, CoHocPalace>;
  greatLimits: Array<{ range: string; palace: string }>;
  smallLimits: Array<{ year: number; palace: string }>;
  rawHtml?: string; // For debugging
};

// Error types
export type CoHocErrorCode =
  | "CSRF_ERROR"
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
  | "INVALID_INPUT"
  | "UNSUPPORTED_DATE"
  | "SESSION_ERROR";

export type CoHocError = {
  success: false;
  error: {
    code: CoHocErrorCode;
    message: string;
    details?: unknown;
  };
};

export type CoHocResponse = CoHocChartResult | CoHocError;

// Palace name mapping
export const PALACE_NAMES = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
] as const;

export type PalaceName = (typeof PALACE_NAMES)[number];
