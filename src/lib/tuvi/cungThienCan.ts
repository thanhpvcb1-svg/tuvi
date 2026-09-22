/**
 * Cung Thiên Can Utilities
 * 
 * Utility functions để làm việc với data Cung + Thiên Can
 */

import cungThienCanData from "./data/cung-thien-can.json";

// Types
export interface ThienCanInfo {
  nguHanh: string;
  amDuong: string;
  combinations: string[];
  tuHoa: {
    loc: string;
    quyen: string;
    khoa: string;
    ky: string;
  };
  description: string;
}

export interface DiaChiInfo {
  nguHanh: string;
  amDuong: string;
  tuChính: boolean;
}

export interface NapAmInfo {
  napAm: string;
  nguHanh: string;
}

// Constants
export const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"] as const;
export const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;

export type ThienCan = typeof THIEN_CAN[number];
export type DiaChi = typeof DIA_CHI[number];

/**
 * Lấy thông tin Thiên Can
 */
export function getThienCanInfo(can: ThienCan): ThienCanInfo | null {
  return (cungThienCanData.thienCan as Record<string, ThienCanInfo>)[can] || null;
}

/**
 * Lấy thông tin Địa Chi
 */
export function getDiaChiInfo(chi: DiaChi): DiaChiInfo | null {
  return (cungThienCanData.diaChi as Record<string, DiaChiInfo>)[chi] || null;
}

/**
 * Lấy Tứ Hóa theo Thiên Can
 */
export function getTuHoa(can: ThienCan) {
  const info = getThienCanInfo(can);
  return info?.tuHoa || null;
}

/**
 * Lấy Nạp Âm theo Can Chi
 */
export function getNapAm(canChi: string): NapAmInfo | null {
  return (cungThienCanData.napAmLucThapHoaGiap as Record<string, NapAmInfo>)[canChi] || null;
}

/**
 * Parse Can Chi từ dạng viết tắt (e.g., "M. Tý" -> { can: "Mậu", chi: "Tý" })
 */
export function parseCanChiShort(shortForm: string): { can: ThienCan; chi: DiaChi; full: string } | null {
  const canMap: Record<string, ThienCan> = {
    "G": "Giáp", "Ấ": "Ất", "B": "Bính", "Đ": "Đinh", "M": "Mậu",
    "K": "Kỷ", "C": "Canh", "T": "Tân", "N": "Nhâm", "Q": "Quý"
  };
  
  const match = shortForm.match(/^([GẤBĐMKCTQN])[\.\s]+(\S+)$/i);
  if (!match) return null;
  
  const canLetter = match[1].toUpperCase();
  const chiPart = match[2];
  
  // Find Can
  let can: ThienCan | null = null;
  for (const [letter, canName] of Object.entries(canMap)) {
    if (canLetter === letter) {
      can = canName;
      break;
    }
  }
  if (!can) return null;
  
  // Find Chi
  const chi = DIA_CHI.find(c => 
    c.toLowerCase() === chiPart.toLowerCase() || 
    c.toLowerCase().startsWith(chiPart.toLowerCase())
  );
  if (!chi) return null;
  
  return { can, chi, full: `${can} ${chi}` };
}

/**
 * Tính Can Chi của năm
 */
export function getCanChiYear(year: number): { can: ThienCan; chi: DiaChi; full: string } {
  const canIndex = (year - 4) % 10;
  const chiIndex = (year - 4) % 12;
  const can = THIEN_CAN[canIndex];
  const chi = DIA_CHI[chiIndex];
  return { can, chi, full: `${can} ${chi}` };
}

/**
 * Lấy các cung có cùng Thiên Can
 * Ví dụ: getCungsByThienCan("Mậu") -> ["Mậu Tý", "Mậu Dần", "Mậu Thìn", "Mậu Ngọ", "Mậu Thân", "Mậu Tuất"]
 */
export function getCungsByThienCan(can: ThienCan): string[] {
  const info = getThienCanInfo(can);
  return info?.combinations || [];
}

/**
 * Lấy luận giải theo Cung + Thiên Can
 */
export function getCungCanInterpretation(can: ThienCan, cungType?: string): string | null {
  const interpretations = cungThienCanData.cungCanInterpretations as Record<string, Record<string, string>>;
  const canInterp = interpretations[can];
  
  if (!canInterp) return null;
  
  if (cungType) {
    return canInterp[cungType] || canInterp.general || null;
  }
  
  return canInterp.general || null;
}

/**
 * Kiểm tra quan hệ sinh khắc giữa hai ngũ hành
 */
export function getNguHanhRelation(hanh1: string, hanh2: string): "sinh" | "khắc" | "bình" {
  const sinhMap: Record<string, string> = {
    "Mộc": "Hỏa",
    "Hỏa": "Thổ",
    "Thổ": "Kim",
    "Kim": "Thủy",
    "Thủy": "Mộc",
  };
  
  const khacMap: Record<string, string> = {
    "Mộc": "Thổ",
    "Thổ": "Thủy",
    "Thủy": "Hỏa",
    "Hỏa": "Kim",
    "Kim": "Mộc",
  };
  
  if (sinhMap[hanh1] === hanh2) return "sinh";
  if (khacMap[hanh1] === hanh2) return "khắc";
  return "bình";
}

/**
 * Lấy tất cả 60 Hoa Giáp
 */
export function getAllHoaGiap(): string[] {
  const result: string[] = [];
  for (let i = 0; i < 60; i++) {
    const canIndex = i % 10;
    const chiIndex = i % 12;
    result.push(`${THIEN_CAN[canIndex]} ${DIA_CHI[chiIndex]}`);
  }
  return result;
}

// Export data for direct access
export const cungThienCan = cungThienCanData;
