/**
 * CoHoc.net Constants
 * 
 * Hour mapping based on reverse-engineering cohoc.net
 */

// Earthly Branches (Địa Chi) for hours
export const HOUR_BRANCHES = [
  "Tý",   // 23:00-00:59
  "Sửu",  // 01:00-02:59
  "Dần",  // 03:00-04:59
  "Mão",  // 05:00-06:59
  "Thìn", // 07:00-08:59
  "Tỵ",   // 09:00-10:59
  "Ngọ",  // 11:00-12:59
  "Mùi",  // 13:00-14:59
  "Thân", // 15:00-16:59
  "Dậu",  // 17:00-18:59
  "Tuất", // 19:00-20:59
  "Hợi",  // 21:00-22:59
] as const;

/**
 * CoHoc.net uses 1-based hour index
 * gio=1 → Tý (23:00-00:59)
 * gio=2 → Sửu (01:00-02:59)
 * ...
 * gio=12 → Hợi (21:00-22:59)
 */
export const COHOC_HOUR_MAPPING: Record<number, { branch: string; cohocGio: number }> = {
  23: { branch: "Tý", cohocGio: 1 },
  0: { branch: "Tý", cohocGio: 1 },
  1: { branch: "Sửu", cohocGio: 2 },
  2: { branch: "Sửu", cohocGio: 2 },
  3: { branch: "Dần", cohocGio: 3 },
  4: { branch: "Dần", cohocGio: 3 },
  5: { branch: "Mão", cohocGio: 4 },
  6: { branch: "Mão", cohocGio: 4 },
  7: { branch: "Thìn", cohocGio: 5 },
  8: { branch: "Thìn", cohocGio: 5 },
  9: { branch: "Tỵ", cohocGio: 6 },
  10: { branch: "Tỵ", cohocGio: 6 },
  11: { branch: "Ngọ", cohocGio: 7 },
  12: { branch: "Ngọ", cohocGio: 7 },
  13: { branch: "Mùi", cohocGio: 8 },
  14: { branch: "Mùi", cohocGio: 8 },
  15: { branch: "Thân", cohocGio: 9 },
  16: { branch: "Thân", cohocGio: 9 },
  17: { branch: "Dậu", cohocGio: 10 },
  18: { branch: "Dậu", cohocGio: 10 },
  19: { branch: "Tuất", cohocGio: 11 },
  20: { branch: "Tuất", cohocGio: 11 },
  21: { branch: "Hợi", cohocGio: 12 },
  22: { branch: "Hợi", cohocGio: 12 },
};

// CoHoc.net endpoints
export const COHOC_BASE_URL = "https://tuvi.cohoc.net";
export const COHOC_FORM_URL = `${COHOC_BASE_URL}/lap-la-so-tu-vi.html`;
export const COHOC_CORE_URL = `${COHOC_BASE_URL}/Core.html`;

// Default parameters
export const COHOC_DEFAULT_PARAMS = {
  version: "20211215",
  mau: 1,
  luuthaitue: 1,
  gioDH: 1,
  gioDM: 45,
  kieuls: 0,
  anTuHoa: 1,
};

// Request headers
export const COHOC_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
};

// Palace key mapping (Vietnamese to key)
export const PALACE_KEY_MAP: Record<string, string> = {
  "Mệnh": "menh",
  "Phụ Mẫu": "phu_mau",
  "Phúc Đức": "phuc_duc",
  "Điền Trạch": "dien_trach",
  "Quan Lộc": "quan_loc",
  "Nô Bộc": "no_boc",
  "Thiên Di": "thien_di",
  "Tật Ách": "tat_ach",
  "Tài Bạch": "tai_bach",
  "Tử Tức": "tu_tuc",
  "Phu Thê": "phu_the",
  "Huynh Đệ": "huynh_de",
};
