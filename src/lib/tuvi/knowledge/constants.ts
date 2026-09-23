/**
 * Constants for Knowledge Crawler
 * Mapping Vietnamese text to normalized IDs
 */

import type { Palace, EarthlyBranch, HeavenlyStem, Transformation, Gender } from "./types";

// ============ PALACE MAPPING ============

export const PALACE_PATTERNS: Record<string, Palace> = {
  "mệnh": "MENH",
  "menh": "MENH",
  "phụ mẫu": "PHU_MAU",
  "phu mau": "PHU_MAU",
  "phúc đức": "PHUC_DUC",
  "phuc duc": "PHUC_DUC",
  "điền trạch": "DIEN_TRACH",
  "dien trach": "DIEN_TRACH",
  "quan lộc": "QUAN_LOC",
  "quan loc": "QUAN_LOC",
  "nô bộc": "NO_BOC",
  "no boc": "NO_BOC",
  "thiên di": "THIEN_DI",
  "thien di": "THIEN_DI",
  "tật ách": "TAT_ACH",
  "tat ach": "TAT_ACH",
  "tài bạch": "TAI_BACH",
  "tai bach": "TAI_BACH",
  "tử tức": "TU_TUC",
  "tu tuc": "TU_TUC",
  "tử nữ": "TU_TUC",
  "tu nu": "TU_TUC",
  "phu thê": "PHU_THE",
  "phu the": "PHU_THE",
  "huynh đệ": "HUYNH_DE",
  "huynh de": "HUYNH_DE",
};

// ============ EARTHLY BRANCH MAPPING ============

export const BRANCH_PATTERNS: Record<string, EarthlyBranch> = {
  "tý": "TY",
  "ty": "TY",
  "tí": "TY",
  "ti": "TY",
  "sửu": "SUU",
  "suu": "SUU",
  "dần": "DAN",
  "dan": "DAN",
  "mão": "MAO",
  "mao": "MAO",
  "thìn": "THIN",
  "thin": "THIN",
  "tỵ": "TI",
  "ty": "TI",
  "tị": "TI",
  "ngọ": "NGO",
  "ngo": "NGO",
  "mùi": "MUI",
  "mui": "MUI",
  "thân": "THAN",
  "than": "THAN",
  "dậu": "DAU",
  "dau": "DAU",
  "tuất": "TUAT",
  "tuat": "TUAT",
  "hợi": "HOI",
  "hoi": "HOI",
};

// ============ HEAVENLY STEM MAPPING ============

export const STEM_PATTERNS: Record<string, HeavenlyStem> = {
  "giáp": "GIAP",
  "giap": "GIAP",
  "ất": "AT",
  "at": "AT",
  "bính": "BINH",
  "binh": "BINH",
  "đinh": "DINH",
  "dinh": "DINH",
  "mậu": "MAU",
  "mau": "MAU",
  "kỷ": "KY",
  "ky": "KY",
  "canh": "CANH",
  "tân": "TAN",
  "tan": "TAN",
  "nhâm": "NHAM",
  "nham": "NHAM",
  "quý": "QUY",
  "quy": "QUY",
};

// ============ TRANSFORMATION MAPPING ============

export const TRANSFORMATION_PATTERNS: Record<string, Transformation> = {
  "lộc": "LOC",
  "loc": "LOC",
  "hóa lộc": "LOC",
  "hoa loc": "LOC",
  "quyền": "QUYEN",
  "quyen": "QUYEN",
  "hóa quyền": "QUYEN",
  "hoa quyen": "QUYEN",
  "khoa": "KHOA",
  "hóa khoa": "KHOA",
  "hoa khoa": "KHOA",
  "kỵ": "KY",
  "ky": "KY",
  "hóa kỵ": "KY",
  "hoa ky": "KY",
  "kị": "KY",
  "ki": "KY",
};

// ============ GENDER MAPPING ============

export const GENDER_PATTERNS: Record<string, Gender> = {
  "nam": "MALE",
  "nam mệnh": "MALE",
  "nam menh": "MALE",
  "nam chủ": "MALE",
  "nam chu": "MALE",
  "nữ": "FEMALE",
  "nữ mệnh": "FEMALE",
  "nu menh": "FEMALE",
  "nữ chủ": "FEMALE",
  "nu chu": "FEMALE",
};

// ============ STAR MAPPING ============

export const STAR_PATTERNS: Record<string, string> = {
  // Chính tinh
  "tử vi": "TU_VI",
  "tu vi": "TU_VI",
  "thiên cơ": "THIEN_CO",
  "thien co": "THIEN_CO",
  "thái dương": "THAI_DUONG",
  "thai duong": "THAI_DUONG",
  "vũ khúc": "VU_KHUC",
  "vu khuc": "VU_KHUC",
  "thiên đồng": "THIEN_DONG",
  "thien dong": "THIEN_DONG",
  "liêm trinh": "LIEM_TRINH",
  "liem trinh": "LIEM_TRINH",
  "thiên phủ": "THIEN_PHU",
  "thien phu": "THIEN_PHU",
  "thái âm": "THAI_AM",
  "thai am": "THAI_AM",
  "tham lang": "THAM_LANG",
  "cự môn": "CU_MON",
  "cu mon": "CU_MON",
  "thiên tướng": "THIEN_TUONG",
  "thien tuong": "THIEN_TUONG",
  "thiên lương": "THIEN_LUONG",
  "thien luong": "THIEN_LUONG",
  "thất sát": "THAT_SAT",
  "that sat": "THAT_SAT",
  "phá quân": "PHA_QUAN",
  "pha quan": "PHA_QUAN",

  // Lục cát
  "văn xương": "VAN_XUONG",
  "van xuong": "VAN_XUONG",
  "văn khúc": "VAN_KHUC",
  "van khuc": "VAN_KHUC",
  "tả phụ": "TA_PHU",
  "ta phu": "TA_PHU",
  "hữu bật": "HUU_BAT",
  "huu bat": "HUU_BAT",
  "thiên khôi": "THIEN_KHOI",
  "thien khoi": "THIEN_KHOI",
  "thiên việt": "THIEN_VIET",
  "thien viet": "THIEN_VIET",

  // Lục sát
  "kình dương": "KINH_DUONG",
  "kinh duong": "KINH_DUONG",
  "đà la": "DA_LA",
  "da la": "DA_LA",
  "hỏa tinh": "HOA_TINH",
  "hoa tinh": "HOA_TINH",
  "linh tinh": "LINH_TINH",
  "địa không": "DIA_KHONG",
  "dia khong": "DIA_KHONG",
  "địa kiếp": "DIA_KIEP",
  "dia kiep": "DIA_KIEP",

  // Tứ hóa
  "lộc tồn": "LOC_TON",
  "loc ton": "LOC_TON",
  "thiên mã": "THIEN_MA",
  "thien ma": "THIEN_MA",

  // Phụ tinh
  "thiên hình": "THIEN_HINH",
  "thien hinh": "THIEN_HINH",
  "thiên riêu": "THIEN_RIEU",
  "thien rieu": "THIEN_RIEU",
  "thiên hỉ": "THIEN_HI",
  "thien hi": "THIEN_HI",
  "hồng loan": "HONG_LOAN",
  "hong loan": "HONG_LOAN",
  "đào hoa": "DAO_HOA",
  "dao hoa": "DAO_HOA",
  "hàm trì": "HAM_TRI",
  "ham tri": "HAM_TRI",
  "cô thần": "CO_THAN",
  "co than": "CO_THAN",
  "quả tú": "QUA_TU",
  "qua tu": "QUA_TU",
  "thiên không": "THIEN_KHONG",
  "thien khong": "THIEN_KHONG",
  "tuần không": "TUAN_KHONG",
  "tuan khong": "TUAN_KHONG",
  "triệt không": "TRIET_KHONG",
  "triet khong": "TRIET_KHONG",

  // Nhóm sao
  "không": "KHONG",
  "kiếp": "KIEP",
  "kiep": "KIEP",
};

// ============ CONDITION KEYWORDS ============

export const MEETING_KEYWORDS = [
  "hội",
  "hoi",
  "gặp",
  "gap",
  "kiến",
  "kien",
  "ngộ",
  "ngo",
];

export const SAME_PALACE_KEYWORDS = [
  "đồng cung",
  "dong cung",
  "đồng độ",
  "dong do",
  "cùng cung",
  "cung cung",
];

export const OPPOSITE_KEYWORDS = [
  "đối cung",
  "doi cung",
  "xung chiếu",
  "xung chieu",
];

export const TRINE_KEYWORDS = [
  "tam hợp",
  "tam hop",
  "tam phương",
  "tam phuong",
];

export const EXCLUDED_KEYWORDS = [
  "không có",
  "khong co",
  "vô",
  "vo",
  "thiếu",
  "thieu",
  "không gặp",
  "khong gap",
];

export const SAT_KY_KEYWORDS = [
  "sát kỵ",
  "sat ky",
  "sát kị",
  "sat ki",
  "hung tinh",
  "ác diệu",
  "ac dieu",
];

export const CAT_TINH_KEYWORDS = [
  "cát tinh",
  "cat tinh",
  "cát diệu",
  "cat dieu",
  "lục cát",
  "luc cat",
];

// ============ PALACE FILE NAMES ============

export const PALACE_FILE_NAMES: Record<Palace, string> = {
  MENH: "menh.json",
  PHU_MAU: "phu_mau.json",
  PHUC_DUC: "phuc_duc.json",
  DIEN_TRACH: "dien_trach.json",
  QUAN_LOC: "quan_loc.json",
  NO_BOC: "no_boc.json",
  THIEN_DI: "thien_di.json",
  TAT_ACH: "tat_ach.json",
  TAI_BACH: "tai_bach.json",
  TU_TUC: "tu_tuc.json",
  PHU_THE: "phu_the.json",
  HUYNH_DE: "huynh_de.json",
};
