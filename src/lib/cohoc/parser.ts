/**
 * CoHoc.net JSON Parser
 * 
 * Core.html returns JSON, not HTML!
 * Structure:
 * - Info: Chart metadata (Mệnh, Cục, etc.)
 * - Cac_cung: Array of 12 palaces with stars
 */

import type { 
  CoHocInput, 
  CoHocChartResult, 
  CoHocPalace, 
  CoHocStar,
  CoHocChartMeta,
  LunarDate,
} from "./types";
import { COHOC_DEFAULT_PARAMS, PALACE_KEY_MAP } from "./constants";

// CoHoc JSON response types
type CoHocJsonStar = {
  Name: string;
  NguHanh: number;
  Type?: number;
  Highline?: number;
  Status?: string;
};

type CoHocJsonPalace = {
  Name: string;
  Than: number;
  SoCuc: number;
  Tuan: number;
  Triet: number;
  LuuTuan: number;
  LuuTriet: number;
  nChinhTinh: number;
  ChinhTinh: CoHocJsonStar[];
  nSaoTot: number;
  Saotot: CoHocJsonStar[];
  nSaoXau: number;
  Saoxau: CoHocJsonStar[];
  TrangSinh: string;
  TrangSinhNH: number;
  ThangHan: number;
  LuuDaiHan: number;
  LuuDaiHanTen: string;
  LuuTieuHanTen: string;
  LocNhap: string | null;
  KyNhap: string | null;
  QuyenNhap: string | null;
  KhoaNhap: string | null;
  TieuHan: string;
  CanCung: number;
  ChiCung: number;
  NguHanhCung: number;
};

type CoHocJsonInfo = {
  AmDuong: string;
  VTMenh: number;
  CanNam: number;
  ChiNam: number;
  SoCuc: number;
  GioCC: string;
  Gio: string;
  Ngay: number;
  Thang: number;
  Nam: string;
  Cuc: string;
  CucNH: number;
  MenhCuc: string;
  MenhCuc2: number;
  ChuMenh: string;
  ChuThan: string;
  SaoChuCuc: string;
  LaiNhanCung: string;
  NguyenThan: string;
  NamHan: string;
  Tuoi: number;
  Tuoi2: number;
};

type CoHocJsonResponse = {
  Info: CoHocJsonInfo;
  Cac_cung: CoHocJsonPalace[];
};

// Ngũ Hành mapping
const NGU_HANH_MAP: Record<number, string> = {
  1: "Kim",
  2: "Thủy",
  3: "Mộc",
  4: "Hỏa",
  5: "Thổ",
  6: "Kim", // Sometimes used as alternative
};

// Brightness status mapping
const BRIGHTNESS_MAP: Record<string, string> = {
  "M": "Miếu",
  "V": "Vượng", 
  "Đ": "Đắc",
  "B": "Bình",
  "H": "Hãm",
  "": "",
};

/**
 * Convert CoHoc star to our format
 */
function convertStar(star: CoHocJsonStar): CoHocStar {
  const result: CoHocStar = {
    name: star.Name,
  };
  
  if (star.Status) {
    result.brightness = BRIGHTNESS_MAP[star.Status] || star.Status;
  }
  
  // Check for transformation (Tứ Hóa)
  if (star.Name.includes("Hóa lộc")) {
    result.transformation = "Lộc";
  } else if (star.Name.includes("Hóa quyền")) {
    result.transformation = "Quyền";
  } else if (star.Name.includes("Hóa khoa")) {
    result.transformation = "Khoa";
  } else if (star.Name.includes("Hóa kỵ")) {
    result.transformation = "Kỵ";
  }
  
  return result;
}

/**
 * Convert palace name to key
 */
function getPalaceKey(name: string): string {
  return PALACE_KEY_MAP[name] || name.toLowerCase().replace(/\s+/g, "_");
}

/**
 * Convert CoHoc palace to our format
 */
function convertPalace(palace: CoHocJsonPalace, position: number): CoHocPalace {
  // Chi (Earthly Branch) mapping
  const CHI_MAP = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
  const CAN_MAP = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
  
  return {
    name: palace.Name,
    position,
    branch: CHI_MAP[palace.ChiCung] || "",
    stem: CAN_MAP[palace.CanCung] || "",
    mainStars: palace.ChinhTinh.map(convertStar),
    secondaryStars: palace.Saotot.map(convertStar),
    miscStars: palace.Saoxau.map(convertStar),
    changSheng: palace.TrangSinh,
    greatLimit: palace.LuuDaiHanTen,
    smallLimit: palace.ThangHan,
  };
}

/**
 * Parse CoHoc JSON response
 */
export function parseCoHocJson(json: CoHocJsonResponse, input: CoHocInput, lunar: LunarDate): CoHocChartResult {
  const info = json.Info;
  const palaces: Record<string, CoHocPalace> = {};
  
  // Convert all palaces
  json.Cac_cung.forEach((palace, index) => {
    const key = getPalaceKey(palace.Name);
    palaces[key] = convertPalace(palace, index + 1);
  });
  
  // Build chart metadata
  const chartMeta: CoHocChartMeta = {
    menh: info.MenhCuc || "",
    than: info.ChuThan || "",
    cuc: info.Cuc || "",
    menhChu: info.ChuMenh || "",
    thanChu: info.ChuThan || "",
    amDuong: info.AmDuong || "",
    nguHanh: NGU_HANH_MAP[info.MenhCuc2] || "",
  };
  
  // Extract great limits
  const greatLimits = json.Cac_cung
    .filter(p => p.LuuDaiHanTen)
    .map(p => ({
      range: p.LuuDaiHanTen,
      palace: p.Name,
    }));
  
  // Extract small limits
  const smallLimits = json.Cac_cung
    .filter(p => p.TieuHan)
    .map(p => ({
      year: p.ThangHan,
      palace: p.Name,
    }));
  
  return {
    source: {
      provider: "cohoc.net",
      engine: "Core.html",
      version: COHOC_DEFAULT_PARAMS.version,
      fetchedAt: new Date().toISOString(),
    },
    input,
    lunar,
    chart: chartMeta,
    palaces,
    greatLimits,
    smallLimits,
  };
}

/**
 * Main parser function - handles both JSON and HTML
 */
export function parseCoHocHtml(
  response: string,
  input: CoHocInput,
  lunar: LunarDate
): CoHocChartResult {
  // Check if response is JSON
  const trimmed = response.trim();
  
  if (trimmed.startsWith("{")) {
    try {
      const json = JSON.parse(trimmed) as CoHocJsonResponse;
      
      if (!json.Info || !json.Cac_cung) {
        throw new Error("Invalid JSON structure - missing Info or Cac_cung");
      }
      
      console.log(`[CoHoc] Parsed JSON response with ${json.Cac_cung.length} palaces`);
      return parseCoHocJson(json, input, lunar);
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON response: ${error.message}`);
      }
      throw error;
    }
  }
  
  // If not JSON, it might be an error page
  if (trimmed.includes("Lỗi") || trimmed.includes("Error")) {
    const errorMatch = trimmed.match(/(?:Lỗi|Error)[:\s]*([^<\n]+)/i);
    throw new Error(`CoHoc error: ${errorMatch?.[1] || "Unknown error"}`);
  }
  
  throw new Error("Unexpected response format - expected JSON");
}

/**
 * Parse from fixture file (for testing)
 */
export function parseCoHocFixture(
  response: string,
  input?: Partial<CoHocInput>
): CoHocChartResult {
  const defaultInput: CoHocInput = {
    name: "Test",
    birthDate: "1998-10-26",
    birthHour: 23,
    birthMinute: 30,
    gender: "male",
    targetYear: 2026,
    ...input,
  };
  
  const defaultLunar: LunarDate = {
    year: 1998,
    month: 9,
    day: 7,
    isLeapMonth: false,
    hourBranch: "Tý",
    hourIndex: 0,
  };
  
  return parseCoHocHtml(response, defaultInput, defaultLunar);
}
