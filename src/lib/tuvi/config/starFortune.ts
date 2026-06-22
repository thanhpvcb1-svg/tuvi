import type { DisplayStar } from "./types";

export type StarFortuneType = "good" | "bad" | "neutral";

export const STAR_FORTUNE_CONFIG = {
  goodNatures: ["cat", "loc", "hoa_tot", "hoa_quyen", "quy_nhan", "van_tinh"],
  badNatures: ["sat", "hoa_ky"],
  goodGroups: ["luc_cat", "cat_tinh", "quy_nhan", "loc_tinh", "tu_hoa", "van_tinh"],
  badGroups: ["luc_sat", "sat"],
  goodStarIds: [
    "ta_phu",
    "huu_bat",
    "van_xuong",
    "van_khuc",
    "thien_khoi",
    "thien_viet",
    "loc_ton",
    "hoa_loc",
    "hoa_quyen",
    "hoa_khoa",
    "long_tri",
    "tam_thai",
    "thai_phu",
    "dai_phu",
    "thien_tru",
    "duong_phu",
    "hoa_cai",
    "thieu_duong",
    "thieu_am",
    "an_quang",
    "thien_quan",
    "thien_phuc",
    "dia_giai",
    "dao_hoa",
    "ham_tri",
    "thanh_long",
    "hy_than",
    "long_duc",
    "bat_toa",
    "phuong_cac",
    "nguyet_duc",
    "thien_hy",
    "thien_duc",
    "thien_tai",
    "thien_tho",
    "quoc_an",
    "hong_loan",
    "giai_than",
    "phong_cao",
    "thien_quy",
    "thien_giai",
    "thien_y",
    "phuc_duc",
    "thien_vu",
  ],
  badStarIds: [
    "hoa_ky",
    "kinh_duong",
    "da_la",
    "hoa_tinh",
    "linh_tinh",
    "dia_khong",
    "dia_kiep",
    "quan_phu",
    "tu_phu",
    "dau_quan",
    "bach_ho",
    "dia_vong",
    "am_sat",
    "thien_khong",
    "phuc_binh",
    "thien_thuong",
    "dai_hao",
    "thai_tue",
    "tieu_hao",
    "benh_phu",
    "dieu_khach",
    "thien_hu",
    "thien_hinh",
    "co_than",
    "thien_su",
    "luu_ha",
    "thien_khoc",
    "thien_la",
    "qua_tu",
    "pha_toai",
    "kiep_sat",
    "quan_phu_sat",
    "tang_mon",
    "tue_pha",
    "truc_phu",
    "thien_dieu",
    "khong_vong",
  ],
  neutralStarIds: [
    "tu_vi",
    "thien_co",
    "thai_duong",
    "vu_khuc",
    "thien_dong",
    "liem_trinh",
    "thien_phu",
    "thai_am",
    "tham_lang",
    "cu_mon",
    "thien_tuong",
    "thien_luong",
    "that_sat",
    "pha_quan",
    "luc_si",
    "phi_liem",
    "bac_sy",
    "thien_ma",
  ],
} as const;

const goodNatures = new Set<string>(STAR_FORTUNE_CONFIG.goodNatures);
const badNatures = new Set<string>(STAR_FORTUNE_CONFIG.badNatures);
const goodGroups = new Set<string>(STAR_FORTUNE_CONFIG.goodGroups);
const badGroups = new Set<string>(STAR_FORTUNE_CONFIG.badGroups);
const goodStarIds = new Set<string>(STAR_FORTUNE_CONFIG.goodStarIds);
const badStarIds = new Set<string>(STAR_FORTUNE_CONFIG.badStarIds);
const neutralStarIds = new Set<string>(STAR_FORTUNE_CONFIG.neutralStarIds);

export function getStarFortuneType(star: Pick<DisplayStar, "starId" | "nature" | "groups">): StarFortuneType {
  if (star.starId && neutralStarIds.has(star.starId)) {
    return "neutral";
  }

  if (star.starId && goodStarIds.has(star.starId)) {
    return "good";
  }

  if (star.starId && badStarIds.has(star.starId)) {
    return "bad";
  }

  if (star.nature && goodNatures.has(star.nature)) {
    return "good";
  }

  if (star.nature && badNatures.has(star.nature)) {
    return "bad";
  }

  if (star.groups?.some((group) => goodGroups.has(group))) {
    return "good";
  }

  if (star.groups?.some((group) => badGroups.has(group))) {
    return "bad";
  }

  return "neutral";
}

export function isGoodFortuneStar(star: Pick<DisplayStar, "starId" | "nature" | "groups">) {
  return getStarFortuneType(star) === "good";
}

export function isBadFortuneStar(star: Pick<DisplayStar, "starId" | "nature" | "groups">) {
  return getStarFortuneType(star) === "bad";
}
