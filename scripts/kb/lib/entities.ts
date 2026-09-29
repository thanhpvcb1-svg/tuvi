/**
 * Nhận diện thực thể Tử Vi trong văn bản -> khóa chuẩn (THAT_SAT, MENH, TY...), khái niệm Tứ Hóa / phi tinh, và trường
 * phái theo lời nguồn TỰ KHAI. Không suy đoán: thiếu bằng chứng thì UNKNOWN, độ tin cậy thấp thì vào hàng đợi duyệt.
 */
import { starDescriptions } from "../../../src/content/starDescriptions";
import { matchForm } from "./text";

export type School = "CLASSICAL" | "BAC_PHAI" | "NAM_PHAI" | "OTHER" | "UNKNOWN";
export type KnowledgeType =
  | "PHU" | "VERSE" | "RULE" | "STAR_INTERPRETATION" | "PALACE_INTERPRETATION" | "CASE_PATTERN"
  | "TU_HOA" | "PHI_HOA" | "THAI_TUE" | "DUNG_THAN" | "COMMENTARY" | "MODERN_INTERPRETATION";

/** "thất sát" -> "THAT_SAT" */
export const entityKey = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRe = (alts: string[], flags = "giu") => new RegExp(`(?<![\\p{L}])(${alts.map(escape).join("|")})(?![\\p{L}])`, flags);

// Tên sao trùng từ thường ("thiên tài", "bác sĩ", "phục binh"...): chỉ tính khi viết hoa đúng tên sao.
const AMBIGUOUS = new Set(["thiên tài", "bác sĩ", "lực sĩ", "tướng quân", "quan phủ", "phục binh", "thiên quan", "thiên phúc", "thiên đức", "nguyệt đức", "long đức", "thanh long", "bệnh phù", "hỷ thần", "tấu thư", "thiên y", "quốc ấn", "đường phù", "thai phụ", "phong cáo", "thiên thọ", "thiên quý", "ân quang", "thiên giải", "địa giải", "giải thần", "thiên trù", "thiên la", "địa võng", "thiên sứ", "thiên thương", "thiên không", "thiên hư", "thiên khốc", "tuế phá", "đại hao", "tiểu hao", "phi liêm", "thiếu dương", "thiếu âm", "bạch hổ", "thái tuế", "tang môn", "điếu khách", "tử phù", "phúc đức", "trực phù"]);
const STAR_ALIASES: Record<string, string> = { "tả phụ": "tả phù", "thiên riêu": "thiên diêu", "phụng các": "phượng các", "dương nhẫn": "kình dương", "thiên hỷ": "thiên hỉ", "hóa kị": "hóa kỵ" };
const STAR_NAMES = [...new Set([...Object.keys(starDescriptions).map((s) => s.normalize("NFC").toLowerCase()), ...Object.keys(STAR_ALIASES)])]
  .filter((s) => !s.startsWith("hóa ") && s.length >= 4)
  .sort((a, b) => b.length - a.length);
const STAR_RE = wordRe(STAR_NAMES);

const PALACES: Record<string, string> = {
  "mệnh": "MENH", "phụ mẫu": "PHU_MAU", "phúc đức": "PHUC_DUC", "điền trạch": "DIEN_TRACH", "quan lộc": "QUAN_LOC", "sự nghiệp": "QUAN_LOC",
  "nô bộc": "NO_BOC", "giao hữu": "NO_BOC", "thiên di": "THIEN_DI", "tật ách": "TAT_ACH", "tài bạch": "TAI_BACH", "tử tức": "TU_TUC",
  "tử nữ": "TU_TUC", "phu thê": "PHU_THE", "phối ngẫu": "PHU_THE", "huynh đệ": "HUYNH_DE", "thân": "THAN",
};
// "cung X" hoặc tên cung hai chữ; "Mệnh"/"Thân" đứng riêng dễ nhầm (thân = cơ thể, chi Thân) nên cần chữ "cung".
const PALACE_RE = new RegExp(`(?<![\\p{L}])(?:cung\\s+(${Object.keys(PALACES).map(escape).join("|")})|(${Object.keys(PALACES).filter((p) => p.includes(" ")).map(escape).join("|")}))(?![\\p{L}])`, "giu");

const BRANCHES: Record<string, string> = { "Tý": "TY", "Tí": "TY", "Sửu": "SUU", "Dần": "DAN", "Mão": "MAO", "Thìn": "THIN", "Tỵ": "TI", "Tị": "TI", "Ngọ": "NGO", "Mùi": "MUI", "Thân": "THAN", "Dậu": "DAU", "Tuất": "TUAT", "Hợi": "HOI" };
// Chi / can phải viết hoa (tránh "thân" = cơ thể, "canh" = món canh); "Thân" chỉ tính khi đi sau giới từ vị trí.
const BRANCH_RE = new RegExp(`(?<![\\p{L}])(${Object.keys(BRANCHES).filter((b) => b !== "Thân").join("|")})(?![\\p{L}])|(?:tại|ở|cư|cung)\\s+(Thân)(?![\\p{L}])`, "gu");
const STEMS: Record<string, string> = { "Giáp": "GIAP", "Ất": "AT", "Bính": "BINH", "Đinh": "DINH", "Mậu": "MAU", "Kỷ": "KY", "Kỉ": "KY", "Canh": "CANH", "Tân": "TAN", "Nhâm": "NHAM", "Quý": "QUY", "Quí": "QUY" };
const STEM_RE = new RegExp(`(?:năm|can|tuổi|sinh)\\s+(${Object.keys(STEMS).join("|")})(?![\\p{L}])`, "gu");
const HOA_RE = /(?<![\p{L}])hóa\s+(lộc|quyền|khoa|kỵ)(?![\p{L}])/gu;
const HOA_KEYS: Record<string, string> = { "lộc": "LOC", "quyền": "QUYEN", "khoa": "KHOA", "kỵ": "KY" };
const BRIGHTNESS: Array<[RegExp, string]> = [[/miếu/, "MIEU"], [/vượng/, "VUONG"], [/đắc địa/, "DAC"], [/bình hòa/, "BINH"], [/hãm/, "HAM"]];
const RELATIONS: Array<[RegExp, string]> = [[/tam phương|tứ chính/, "TAM_PHUONG"], [/xung chiếu|đối cung/, "XUNG_CHIEU"], [/hội chiếu|hội hợp/, "HOI_CHIEU"], [/giáp cung|(?<![\p{L}])giáp(?= [\p{Lu}])/u, "GIAP_CUNG"], [/đồng cung|đồng độ/, "DONG_CUNG"]];
const PERIODS: Array<[RegExp, string]> = [[/đại vận|đại hạn/, "DAI_VAN"], [/tiểu vận|tiểu hạn/, "TIEU_VAN"], [/lưu niên|năm xem/, "LUU_NIEN"]];

/**
 * Khái niệm Tứ Hóa / phi tinh (Bắc phái và các phái Tứ Hóa). `engine`: bộ khớp hiện tại đã kiểm được khái niệm này
 * trên lá số chưa (predicate trong conditionMatcher) - để biết khoảng trống cần bổ sung.
 */
export type Concept = { id: string; name: string; aliases: string[]; type: KnowledgeType; engine: string | null };
export const CONCEPTS: Concept[] = [
  { id: "SINH_NIEN_TU_HOA", name: "Tứ Hóa sinh niên", aliases: ["tứ hóa sinh niên", "sinh niên tứ hóa", "hóa năm sinh", "tứ hóa năm sinh"], type: "TU_HOA", engine: "hoa / starHoa" },
  { id: "PHI_HOA", name: "Phi Hóa (Can cung phi Tứ Hóa)", aliases: ["phi hóa", "phi tinh", "phi cung", "can cung"], type: "PHI_HOA", engine: "flow" },
  { id: "TU_HOA_LY_TAM", name: "Tự Hóa ly tâm", aliases: ["tự hóa ly tâm", "tự hóa li tâm", "ly tâm tự hóa", "li tâm tự hóa"], type: "PHI_HOA", engine: "selfHoa / selfHoaAny" },
  { id: "TU_HOA_HUONG_TAM", name: "Tự Hóa hướng tâm", aliases: ["tự hóa hướng tâm", "hướng tâm tự hóa"], type: "PHI_HOA", engine: null },
  { id: "LOC_TUY_KY_TAU", name: "Lộc tùy Kỵ tẩu", aliases: ["lộc tùy kỵ tẩu", "lộc đi theo kỵ", "lộc chảy theo kỵ", "lộc theo kỵ"], type: "RULE", engine: null },
  { id: "KY_CHUYEN_KY", name: "Kỵ chuyển Kỵ", aliases: ["kỵ chuyển kỵ"], type: "RULE", engine: null },
  { id: "KY_CHUYEN_LOC", name: "Kỵ chuyển Lộc", aliases: ["kỵ chuyển lộc"], type: "RULE", engine: null },
  { id: "LOC_XUAT_NHAP", name: "Lộc xuất / Lộc nhập", aliases: ["lộc xuất", "lộc nhập"], type: "PHI_HOA", engine: "flow" },
  { id: "KY_XUAT_NHAP", name: "Kỵ xuất / Kỵ nhập", aliases: ["kỵ xuất", "kỵ nhập"], type: "PHI_HOA", engine: "flow" },
  { id: "NGA_CUNG_THA_CUNG", name: "Ngã cung / Tha cung", aliases: ["ngã cung", "tha cung"], type: "RULE", engine: null },
  { id: "LAI_NHAN_CUNG", name: "Lai Nhân cung", aliases: ["lai nhân cung", "lai nhân"], type: "RULE", engine: "laiNhan" },
  { id: "THAI_TUE_NHAP_QUAI", name: "Thái Tuế nhập quái", aliases: ["thái tuế nhập quái", "nhập quái"], type: "THAI_TUE", engine: null },
  { id: "THUAN_THUY_KY", name: "Thuận thủy Kỵ", aliases: ["thuận thủy kỵ"], type: "CASE_PATTERN", engine: "flow (vận hạn)" },
  { id: "NGHICH_THUY_KY", name: "Nghịch thủy Kỵ", aliases: ["nghịch thủy kỵ"], type: "CASE_PATTERN", engine: null },
  { id: "KY_TROC_LOC", name: "Kỵ tróc Lộc", aliases: ["kỵ tróc lộc"], type: "CASE_PATTERN", engine: "flow + hoa (vận hạn)" },
  { id: "SONG_KY", name: "Song Kỵ", aliases: ["song kỵ"], type: "CASE_PATTERN", engine: null },
  { id: "CU_TRIEU_KY", name: "Củ triều Kỵ", aliases: ["củ triều kỵ"], type: "CASE_PATTERN", engine: "flow" },
  { id: "DIEP_XUAT_LOC", name: "Điệp xuất Lộc", aliases: ["điệp xuất lộc"], type: "CASE_PATTERN", engine: "flow + selfHoa (vận hạn)" },
  { id: "KHOA_KY_DAY_DUA", name: "Khoa Kỵ dây dưa", aliases: ["khoa kỵ dây dưa"], type: "CASE_PATTERN", engine: null },
  { id: "THE_DUNG", name: "Thể / Dụng", aliases: ["thể nhập dụng", "thể chiếu dụng", "thể và dụng", "thể dụng"], type: "RULE", engine: "flowPeriodRole" },
  { id: "DINH_UNG_KY", name: "Định ứng kỳ", aliases: ["định ứng kỳ", "ứng kỳ"], type: "RULE", engine: null },
  { id: "DAI_VAN_TU_HOA", name: "Tứ Hóa đại vận", aliases: ["tứ hóa đại vận", "đại vận tứ hóa", "đại hạn tứ hóa", "can đại vận"], type: "TU_HOA", engine: "periodRole / flowPeriodRole" },
  { id: "LUU_NIEN_TU_HOA", name: "Tứ Hóa lưu niên", aliases: ["tứ hóa lưu niên", "lưu niên tứ hóa", "can lưu niên"], type: "TU_HOA", engine: null },
  { id: "KHI_SO_VI", name: "Khí số vị (cung vị chuyển)", aliases: ["khí số vị", "cung khí số"], type: "RULE", engine: null },
];
const CONCEPT_RES = CONCEPTS.map((c) => ({ concept: c, re: wordRe(c.aliases.map((a) => matchForm(a)), "u") }));

export function conceptsIn(text: string): string[] {
  const form = matchForm(text);
  return CONCEPT_RES.filter(({ re }) => re.test(form)).map(({ concept }) => concept.id);
}

export type Entities = {
  stars: string[]; palaces: string[]; branches: string[]; stems: string[]; hoa: string[];
  brightness: string[]; relations: string[]; periods: string[]; concepts: string[]; confidence: number;
};

export function extractEntities(text: string): Entities {
  const nfc = text.normalize("NFC");
  const low = nfc.toLowerCase().replace(/(^|[^\p{L}])kị(?![\p{L}])/gu, "$1kỵ").replace(/hoá/g, "hóa");
  const uniq = (xs: string[]) => [...new Set(xs)];
  const stars: string[] = [];
  let ambiguousSkipped = 0;
  for (const m of low.matchAll(STAR_RE)) {
    const name = STAR_ALIASES[m[1]] ?? m[1];
    if (AMBIGUOUS.has(name)) {
      const original = nfc.slice(m.index!, m.index! + m[1].length);
      if (original !== original.replace(/(^|\s)\S/g, (c) => c.toUpperCase())) {
        ambiguousSkipped++;
        continue;
      }
    }
    stars.push(entityKey(name));
  }
  const palaces = [...low.matchAll(PALACE_RE)].map((m) => PALACES[m[1] ?? m[2]]).filter(Boolean);
  const branches = [...nfc.matchAll(BRANCH_RE)].map((m) => BRANCHES[m[1] ?? m[2]]);
  const stems = [...nfc.matchAll(STEM_RE)].map((m) => STEMS[m[1]]);
  const hoa = [...low.matchAll(HOA_RE)].map((m) => HOA_KEYS[m[1]]);
  const tagged = (list: Array<[RegExp, string]>) => list.filter(([re]) => re.test(low)).map(([, key]) => key);
  const concepts = conceptsIn(text);
  const found = uniq(stars).length + uniq(palaces).length + uniq(hoa).length + concepts.length;
  // Độ tin cậy: có thực thể / khái niệm rõ ràng -> cao; chỉ có từ mơ hồ hoặc không có gì -> thấp (vào hàng đợi duyệt).
  const confidence = found === 0 ? 0.2 : Math.max(0.5, Math.min(0.95, 0.6 + found * 0.05 - ambiguousSkipped * 0.05));
  return {
    stars: uniq(stars), palaces: uniq(palaces), branches: uniq(branches), stems: uniq(stems), hoa: uniq(hoa),
    brightness: tagged(BRIGHTNESS), relations: tagged(RELATIONS), periods: tagged(PERIODS), concepts, confidence,
  };
}

/**
 * Trường phái theo lời nguồn: nguồn khai cả site (registry) -> theo registry; nguồn nhiều phái -> chỉ khi TIÊU ĐỀ trang
 * nêu đúng MỘT phái. Nhắc tên phái trong thân bài / đoạn mở đầu (so sánh, dẫn chiếu, giới thiệu) KHÔNG đủ -> UNKNOWN.
 * Đoạn mở đầu chỉ dùng để nhận phương pháp (Khâm Thiên, Tứ Hóa phi tinh).
 */
export function resolveSchool(registrySchool: string, title: string, intro: string): { school: School; evidence: string | null; method: string | null } {
  const method = /khâm thiên/i.test(`${title} ${intro}`) ? "KHAM_THIEN_TU_HOA" : /tứ hóa phi tinh|phi tinh tứ hóa/i.test(`${title} ${intro}`) ? "TU_HOA_PHI_TINH" : null;
  if (registrySchool !== "PER_PAGE") return { school: registrySchool as School, evidence: "registry", method };
  const named = [
    [/bắc phái/i, "BAC_PHAI"],
    [/nam phái/i, "NAM_PHAI"],
    [/tử vân phái|trung châu phái|phái trung châu|hà lạc phái/i, "OTHER"],
  ].filter(([re]) => (re as RegExp).test(title)) as Array<[RegExp, School]>;
  if (named.length === 1) return { school: named[0][1], evidence: `tiêu đề trang: "${title.slice(0, 80)}"`, method };
  return { school: "UNKNOWN", evidence: null, method };
}

/** Loại tri thức theo chủ đề chính của đoạn (khái niệm Tứ Hóa > sao > cung); bài viết hiện đại không rõ chủ đề -> MODERN_INTERPRETATION. */
export function classifyBlock(entities: Entities): KnowledgeType {
  const byConcept = entities.concepts.map((id) => CONCEPTS.find((c) => c.id === id)!.type);
  if (byConcept.length) return byConcept[0];
  if (entities.hoa.length) return "TU_HOA";
  if (entities.stars.length && entities.palaces.length) return "PALACE_INTERPRETATION";
  if (entities.stars.length) return "STAR_INTERPRETATION";
  return "MODERN_INTERPRETATION";
}
