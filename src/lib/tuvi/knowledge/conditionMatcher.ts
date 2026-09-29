/**
 * Condition Matcher cho Knowledge Base consolidated (cung/*-consolidated.json).
 *
 * Mỗi mục tri thức có `condition` là chuỗi tiếng Việt crawl từ tuvi.cohoc.net, vd:
 *   "Cung Mệnh an tại Tuất có Phá quân"
 *   "Cung Mệnh an tại Tị có Kỵ Di"                  (Mệnh phi Hóa Kỵ nhập Thiên Di)
 *   "Cung Quan lộc phi Hóa quyền nhập cung Điền trạch"
 *   "Cung Mệnh Vô Chính Diệu tại Mùi, khi mượn sao của đối cung thì có Cự môn"
 *
 * - parseCondition(): chuỗi -> cấu trúc (dùng lúc build bởi scripts/normalizeKnowledge.ts).
 * - evaluateCondition(): cấu trúc + lá số -> lý do khớp (dùng lúc runtime).
 *
 * Nguyên tắc: chỉ trả về tri thức khi MỌI điều kiện được kiểm chứng trên lá số gốc.
 * Điều kiện không hiểu được (đại vận, lưu niên, điểm "xí hoa", tam bàn, bản trích lá số
 * của người khác...) bị coi là "unsupported" và KHÔNG hiển thị - thà thiếu còn hơn sai.
 */

import type { ChartView, PalaceView, StarView } from "../../types";
import { starDescriptions } from "../../../content/starDescriptions";
import { AITUVI_VISIBLE_STAR_POLICY } from "../rules/visibleStarPolicy";
import { nominalAge } from "../nominalAge";

// ============ NORMALIZE ============

const BRANCH_ORDER = ["tý", "sửu", "dần", "mão", "thìn", "tỵ", "ngọ", "mùi", "thân", "dậu", "tuất", "hợi"];
const BRANCH_ALIASES: Record<string, string> = { tí: "tý", tị: "tỵ" };

const lower = (value: string) => String(value || "").normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();

export function branchKey(value: string): string {
  const key = lower(value);
  return BRANCH_ALIASES[key] ?? key;
}

const PALACE_ALIASES: Record<string, string> = {
  "mệnh": "mệnh",
  "phụ mẫu": "phụ mẫu",
  "phúc đức": "phúc đức",
  "điền trạch": "điền trạch",
  "quan lộc": "quan lộc",
  "sự nghiệp": "quan lộc",
  "nô bộc": "nô bộc",
  "giao hữu": "nô bộc",
  "thiên di": "thiên di",
  "tật ách": "tật ách",
  "tài bạch": "tài bạch",
  "tử tức": "tử tức",
  "tử nữ": "tử tức",
  "phu thê": "phu thê",
  "huynh đệ": "huynh đệ",
  "thân": "thân",
};

// Viết tắt tên cung trong token phi hóa của cohoc: "Kỵ Phúc", "Lộc Quan", "Quyền Bào"...
const PALACE_ABBR: Record<string, string> = {
  "mệnh": "mệnh",
  "phụ": "phụ mẫu",
  "phúc": "phúc đức",
  "điền": "điền trạch",
  "quan": "quan lộc",
  "nô": "nô bộc",
  "di": "thiên di",
  "tật": "tật ách",
  "tài": "tài bạch",
  "tử": "tử tức",
  "phối": "phu thê",
  "bào": "huynh đệ",
};

export function palaceKey(value: string): string | null {
  return PALACE_ALIASES[lower(value)] ?? null;
}

const STAR_ALIASES: Record<string, string> = {
  "tả phụ": "tả phù",
  "thiên hỷ": "thiên hỉ",
  "thiên riêu": "thiên diêu",
  "bác sỹ": "bác sĩ",
  "lực sỹ": "lực sĩ",
  "phụng các": "phượng các",
  "đài phụ": "thai phụ",
  "hỉ thần": "hỷ thần",
  "hóa kị": "hóa kỵ",
  "thiên quí": "thiên quý",
};

export function starKey(value: string): string {
  const key = lower(value);
  return STAR_ALIASES[key] ?? key;
}

const MAIN_STARS = new Set(
  ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"].map(starKey),
);

// Tên sao hợp lệ = mọi sao lá số có thể hiển thị (xem content/starDescriptions.ts).
const KNOWN_STARS = new Set(Object.keys(starDescriptions).map(starKey));

// Sao bị ẩn khỏi lá số hiển thị (Chỉ Bối, Quán Tác...): người xem không thấy trên lá số nên không dùng để
// chọn tri thức; câu tri thức đòi các sao này coi như lá số không có.
const HIDDEN_STARS = new Set(AITUVI_VISIBLE_STAR_POLICY.hiddenFromVisible.map(starKey));

type HoaType = "loc" | "quyen" | "khoa" | "ky";
const HOA_TYPES: Record<string, HoaType> = { "lộc": "loc", "quyền": "quyen", "khoa": "khoa", "kỵ": "ky", "kị": "ky" };
const HOA_LABELS: Record<HoaType, string> = { loc: "Hóa Lộc", quyen: "Hóa Quyền", khoa: "Hóa Khoa", ky: "Hóa Kỵ" };
const hoaType = (value: string): HoaType | null => HOA_TYPES[lower(value)] ?? null;

const CHANGSHENG: Record<string, string> = {
  "trường sinh": "trường sinh",
  "tràng sinh": "trường sinh",
  "mộc dục": "mộc dục",
  "mục dục": "mộc dục",
  "quan đới": "quan đới",
  "lâm quan": "lâm quan",
  "đế vượng": "đế vượng",
  "suy": "suy",
  "bệnh": "bệnh",
  "tử": "tử",
  "mộ": "mộ",
  "tuyệt": "tuyệt",
  "thai": "thai",
  "dưỡng": "dưỡng",
};

const BRANCH_GROUPS: Record<string, string[]> = {
  "tứ bại": ["tý", "ngọ", "mão", "dậu"],
  "tứ mộ": ["thìn", "tuất", "sửu", "mùi"],
  "tứ sinh": ["dần", "thân", "tỵ", "hợi"],
  "tứ mã": ["dần", "thân", "tỵ", "hợi"],
};

const ELEMENTS: Record<string, string> = { kim: "kim", "mộc": "mộc", "thủy": "thủy", "thuỷ": "thủy", "hỏa": "hỏa", "hoả": "hỏa", "thổ": "thổ" };
const elementKey = (value: string) => ELEMENTS[lower(value)] ?? null;

const STEMS = ["giáp", "ất", "bính", "đinh", "mậu", "kỷ", "canh", "tân", "nhâm", "quý"];
const STEM_ALIASES: Record<string, string> = { "kỉ": "kỷ", "quí": "quý" };
const stemKey = (value: string) => STEM_ALIASES[lower(value)] ?? lower(value);

const STEM_ABBR: Record<string, string> = {
  g: "giáp", "â": "ất", b: "bính", "đ": "đinh", m: "mậu", k: "kỷ", c: "canh", t: "tân", n: "nhâm", q: "quý",
};

// ============ CHART CONTEXT ============

type PalaceFacts = {
  key: string;
  label: string;
  branch: string;
  stem: string;
  isBody: boolean;
  changsheng: string;
  stars: Set<string>;
  mainStars: Set<string>;
  starMutagen: Map<string, HoaType>;
  /** Độ sáng sao gốc: M (miếu), V (vượng), Đ (đắc), B/BH (bình hòa), H (hãm). */
  brightness: Map<string, string>;
  mutagens: Set<HoaType>;
  markers: Set<string>;
  /** Phi hóa theo Can cung: loại Hóa, cung nhận, sao được hóa ("Thiên Lương Hóa Lộc nhập Điền Trạch"). */
  flowsOut: Array<{ type: HoaType; target: string; star?: string }>;
  selfHoa: Set<HoaType>;
  /** Tự hóa hướng tâm: Can của cung này làm sao ở ĐỐI CUNG hóa (suy từ phi hóa - phi Hóa vào đối cung). */
  inwardHoa: Set<HoaType>;
};

export type ChartFacts = {
  palaces: Map<string, PalaceFacts>;
  byBranch: Map<string, PalaceFacts>;
  body: PalaceFacts | null;
  laiNhan: string | null;
  soulStar: string | null;
  bodyStar: string | null;
  /** Hành của Cục ("Thổ Ngũ Cục" -> "thổ") - chính là nạp âm Can Chi cung Mệnh. */
  cucElement: string | null;
  gender: "male" | "female" | null;
  /** Can năm sinh ("canh") */
  yearStem: string | null;
  /** Chi của cung đại vận / tiểu vận ở năm xem (chỉ có khi truyền năm xem). */
  period?: { daiVan?: string; tieuVan?: string; label?: string };
};

// Thứ tự vai cung tính từ Mệnh (cung kế tiếp theo địa chi) - dùng cho cung vai của đại vận ("ĐV. Tài bạch").
const ROLE_OFFSETS: Record<string, number> = {
  "mệnh": 0, "phụ mẫu": 1, "phúc đức": 2, "điền trạch": 3, "quan lộc": 4, "nô bộc": 5,
  "thiên di": 6, "tật ách": 7, "tài bạch": 8, "tử tức": 9, "phu thê": 10, "huynh đệ": 11,
};

/**
 * Cung đại vận / tiểu vận ở năm xem, đọc thẳng từ lá số:
 * - đại vận: cung có decadalRange (tuổi bắt đầu) <= tuổi <= decadalRange + 9
 * - tiểu vận: cung có tuổi trong danh sách ages
 * Tuổi = tuổi mụ theo năm âm lịch (xem nominalAge) - cùng cách tính với thanh chọn năm trên lá số.
 */
export function computePeriod(chart: ChartView, yearToView?: number, birthYear?: number): ChartFacts["period"] {
  const age = nominalAge(chart, yearToView, birthYear);
  if (age === undefined) return undefined;
  const dv = chart.palaces.find((p) => {
    const start = Number((p as any).decadalRange);
    return Number.isFinite(start) && start > 0 && age >= start && age <= start + 9;
  });
  const tv = chart.palaces.find((p) => Array.isArray((p as any).ages) && (p as any).ages.includes(age));
  const start = dv ? Number((dv as any).decadalRange) : 0;
  return {
    daiVan: dv ? branchKey(dv.earthlyBranch || "") : undefined,
    tieuVan: tv ? branchKey(tv.earthlyBranch || "") : undefined,
    label: dv ? `${start}-${start + 9} tuổi` : undefined,
  };
}

// Chỉ dùng sao gốc (lá số bẩm sinh); sao lưu/đại vận không được tính khi đối chiếu tri thức nguyên cục.
const isNatalStar = (star: StarView) => !star.scope || star.scope === "origin";

function collectStars(palace: PalaceView): StarView[] {
  const lists = [palace.majorStars, palace.minorStars, palace.adjectiveStars, palace.visibleStars, palace.analysisStars, palace.centerStars, palace.leftStars, palace.rightStars] as Array<StarView[] | undefined>;
  return lists.flatMap((list) => list ?? []).filter((star) => isNatalStar(star) && !HIDDEN_STARS.has(starKey(star.name)));
}

export function buildChartFacts(chart: ChartView): ChartFacts {
  const palaces = new Map<string, PalaceFacts>();
  const byBranch = new Map<string, PalaceFacts>();
  const stemMap = ((chart as any).palaceStemMap ?? {}) as Record<string, string>;

  for (const palace of chart.palaces) {
    const key = palaceKey(palace.name);
    if (!key) continue;
    const branch = branchKey(palace.earthlyBranch || "");
    const rawStem = (palace.earthlyBranch ? stemMap[palace.earthlyBranch] : undefined) ?? palace.heavenlyStem ?? "";
    const stem = STEM_ABBR[lower(rawStem)] ?? lower(rawStem);

    const stars = new Set<string>();
    const mainStars = new Set<string>();
    const starMutagen = new Map<string, HoaType>();
    const brightness = new Map<string, string>();
    const mutagens = new Set<HoaType>();
    for (const star of collectStars(palace)) {
      const name = starKey(star.name);
      if (name.startsWith("hóa ")) {
        const type = hoaType(name.slice(4));
        if (type) mutagens.add(type);
        continue;
      }
      stars.add(name);
      if (MAIN_STARS.has(name)) mainStars.add(name);
      if (star.brightness && !brightness.has(name)) brightness.set(name, String(star.brightness).toUpperCase());
      const type = star.mutagen ? hoaType(star.mutagen.replace(/^hóa\s*/i, "")) : null;
      if (type) {
        starMutagen.set(name, type);
        mutagens.add(type);
      }
    }

    const markers = new Set<string>();
    for (const marker of ((palace as any).specialMarkers ?? []) as Array<{ name?: string }>) {
      if (marker?.name) markers.add(lower(marker.name));
    }

    const flowsOut: PalaceFacts["flowsOut"] = [];
    const selfHoa = new Set<HoaType>();
    for (const flow of ((palace as any).phiTuHoa?.flows ?? []) as Array<{ type: string; relation?: string; targetPalaceName?: string; targetStar?: string }>) {
      const type = (["loc", "quyen", "khoa", "ky"] as const).find((t) => t === flow.type);
      if (!type) continue;
      if (flow.relation === "tu_hoa") {
        selfHoa.add(type);
        continue;
      }
      const target = flow.targetPalaceName ? palaceKey(flow.targetPalaceName) : null;
      if (target) flowsOut.push({ type, target, ...(flow.targetStar ? { star: starKey(flow.targetStar) } : {}) });
    }

    const facts: PalaceFacts = {
      key,
      label: palace.name,
      branch,
      stem,
      isBody: Boolean(palace.isBodyPalace),
      changsheng: CHANGSHENG[lower((palace as any).changsheng12 ?? "")] ?? "",
      stars,
      mainStars,
      starMutagen,
      brightness,
      mutagens,
      markers,
      flowsOut,
      selfHoa,
      inwardHoa: new Set(),
    };
    palaces.set(key, facts);
    byBranch.set(branch, facts);
  }
  // Tự hóa hướng tâm (theo Khâm Thiên Tứ Hóa): Can cung làm cho tinh diệu ở đối cung hóa Lộc / Quyền / Khoa / Kỵ.
  for (const facts of palaces.values()) {
    const opposite = byBranch.get(BRANCH_ORDER[(BRANCH_ORDER.indexOf(facts.branch) + 6) % 12]);
    for (const flow of facts.flowsOut) if (opposite && flow.target === opposite.key) facts.inwardHoa.add(flow.type);
  }

  const body = [...palaces.values()].find((p) => p.isBody) ?? null;
  const laiNhanName = (chart as any).laiNhanCung?.functionalPalace;
  const soul = chart.profile?.soul || (chart.profile as any)?.rawSoul;
  const bodyStar = chart.profile?.body || (chart.profile as any)?.rawBody;

  return {
    palaces,
    byBranch,
    body,
    laiNhan: laiNhanName ? palaceKey(laiNhanName) : null,
    soulStar: soul ? starKey(soul) : null,
    bodyStar: bodyStar ? starKey(bodyStar) : null,
    cucElement: elementKey(String(chart.profile?.fiveElementsClass || "").split(" ")[0]),
    gender: /^nữ|female/i.test(String(chart.profile?.gender ?? "")) ? "female" : /^nam|male/i.test(String(chart.profile?.gender ?? "")) ? "male" : null,
    yearStem: (chart.profile as any)?.yearStem ? stemKey((chart.profile as any).yearStem) : null,
  };
}

// ============ SERIALIZE (gửi dữ kiện lá số cho /api/knowledge/query) ============
// Trình duyệt an sao + tính dữ kiện; server chỉ nhận dữ kiện (vài KB, không có họ tên / ngày giờ sinh) để khớp tri thức.

type SerializedPalace = Omit<PalaceFacts, "stars" | "mainStars" | "starMutagen" | "brightness" | "mutagens" | "markers" | "selfHoa" | "inwardHoa"> & {
  stars: string[]; mainStars: string[]; starMutagen: Array<[string, HoaType]>; brightness: Array<[string, string]>;
  mutagens: HoaType[]; markers: string[]; selfHoa: HoaType[]; inwardHoa: HoaType[];
};
export type SerializedChartFacts = Omit<ChartFacts, "palaces" | "byBranch" | "body"> & { palaces: SerializedPalace[] };

export function serializeChartFacts(facts: ChartFacts): SerializedChartFacts {
  const { palaces, byBranch: _byBranch, body: _body, ...rest } = facts;
  return {
    ...rest,
    palaces: [...palaces.values()].map((p) => ({
      ...p,
      stars: [...p.stars], mainStars: [...p.mainStars], starMutagen: [...p.starMutagen], brightness: [...p.brightness],
      mutagens: [...p.mutagens], markers: [...p.markers], selfHoa: [...p.selfHoa], inwardHoa: [...p.inwardHoa],
      flowsOut: p.flowsOut.map((f) => ({ ...f })),
    })),
  };
}

const HOA_SET = new Set<string>(["loc", "quyen", "khoa", "ky"]);
const asHoa = (values: unknown): HoaType[] => (Array.isArray(values) ? values.filter((v): v is HoaType => HOA_SET.has(String(v))) : []);
const asStrings = (values: unknown, max = 200): string[] => (Array.isArray(values) ? values.slice(0, max).map((v) => String(v).slice(0, 60)) : []);

/** Dựng lại ChartFacts từ dữ liệu client gửi lên - kiểm kiểu từng trường, bỏ giá trị lạ (không tin dữ liệu client). */
export function deserializeChartFacts(input: unknown): ChartFacts | null {
  const data = input as Partial<SerializedChartFacts> | null;
  if (!data || !Array.isArray(data.palaces) || data.palaces.length > 12) return null;
  const palaces = new Map<string, PalaceFacts>();
  const byBranch = new Map<string, PalaceFacts>();
  for (const raw of data.palaces as SerializedPalace[]) {
    const key = palaceKey(String(raw?.key ?? ""));
    const branch = branchKey(String(raw?.branch ?? ""));
    if (!key || !BRANCH_ORDER.includes(branch)) return null;
    const facts: PalaceFacts = {
      key,
      label: String(raw.label ?? key).slice(0, 30),
      branch,
      stem: String(raw.stem ?? "").slice(0, 10),
      isBody: Boolean(raw.isBody),
      changsheng: String(raw.changsheng ?? "").slice(0, 20),
      stars: new Set(asStrings(raw.stars)),
      mainStars: new Set(asStrings(raw.mainStars, 4)),
      starMutagen: new Map((Array.isArray(raw.starMutagen) ? raw.starMutagen : []).filter((e) => Array.isArray(e) && HOA_SET.has(String(e[1]))).map((e) => [String(e[0]).slice(0, 60), e[1] as HoaType])),
      brightness: new Map((Array.isArray(raw.brightness) ? raw.brightness : []).filter((e) => Array.isArray(e)).slice(0, 200).map((e) => [String(e[0]).slice(0, 60), String(e[1]).slice(0, 4)])),
      mutagens: new Set(asHoa(raw.mutagens)),
      markers: new Set(asStrings(raw.markers, 10)),
      flowsOut: (Array.isArray(raw.flowsOut) ? raw.flowsOut : [])
        .slice(0, 8)
        .map((f) => ({ type: asHoa([f?.type])[0], target: palaceKey(String(f?.target ?? "")), ...(typeof f?.star === "string" && f.star ? { star: f.star.slice(0, 40) } : {}) }))
        .filter((f): f is { type: HoaType; target: string; star?: string } => Boolean(f.type && f.target)),
      selfHoa: new Set(asHoa(raw.selfHoa)),
      inwardHoa: new Set(asHoa(raw.inwardHoa)),
    };
    palaces.set(key, facts);
    byBranch.set(branch, facts);
  }
  const str = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 40) : null);
  const period = data.period && typeof data.period === "object"
    ? { daiVan: str(data.period.daiVan) ?? undefined, tieuVan: str(data.period.tieuVan) ?? undefined, label: str(data.period.label) ?? undefined }
    : undefined;
  return {
    palaces,
    byBranch,
    body: [...palaces.values()].find((p) => p.isBody) ?? null,
    laiNhan: str(data.laiNhan) ? palaceKey(str(data.laiNhan)!) : null,
    soulStar: str(data.soulStar),
    bodyStar: str(data.bodyStar),
    cucElement: str(data.cucElement),
    gender: data.gender === "male" || data.gender === "female" ? data.gender : null,
    yearStem: str(data.yearStem),
    ...(period ? { period } : {}),
  };
}

function resolvePalace(facts: ChartFacts, key: string): PalaceFacts | null {
  if (key === "thân") return facts.body;
  return facts.palaces.get(key) ?? null;
}

function relatedBranches(branch: string, mode: "opposite" | "tpt"): string[] {
  const index = BRANCH_ORDER.indexOf(branch);
  if (index < 0) return [];
  const at = (offset: number) => BRANCH_ORDER[(index + offset) % 12];
  return mode === "opposite" ? [at(6)] : [branch, at(4), at(6), at(8)];
}

// ============ PREDICATES ============

type FlankItem = { kind: "star"; star: string } | { kind: "hoa"; hoa: HoaType };

export type Predicate =
  | { kind: "star"; star: string; scope: "palace" | "tpt" | "opposite" }
  | { kind: "starHoa"; star: string; hoa: HoaType }
  | { kind: "hoa"; hoa: HoaType; scope: "palace" | "tpt" | "opposite" }
  | { kind: "selfHoa"; hoa: HoaType }
  | { kind: "selfHoaAny" }
  /** Tự hóa hướng tâm (Can cung hóa sao đối cung) - một loại Hóa cụ thể hoặc bất kỳ. */
  | { kind: "inwardHoa"; hoa: HoaType | null }
  | { kind: "noSelfHoa" }
  /** Can cung phi Hóa nhập cung `target` (`star`: sao được hóa, nếu điều kiện nêu). */
  | { kind: "flow"; hoa: HoaType; target: string; star?: string }
  | { kind: "noMain" }
  | { kind: "singleMain"; star: string }
  | { kind: "changsheng"; value: string }
  | { kind: "marker"; value: "tuần" | "triệt" }
  | { kind: "branchGroup"; branches: string[] }
  | { kind: "stemBranch"; stem: string; branch: string }
  | { kind: "cuc"; element: string }
  | { kind: "samePalace"; palace: string }
  | { kind: "flank"; items: FlankItem[] }
  | { kind: "laiNhan" }
  | { kind: "soulStar" }
  | { kind: "bodyStar" }
  /** Cung đang là cung đại vận / tiểu vận của năm xem. */
  | { kind: "period"; which: "daiVan" | "tieuVan" }
  /** Cung giữ vai `role` của đại vận hiện tại ("ĐV. Tài bạch"). */
  | { kind: "periodRole"; role: string }
  /** Cung phi Hóa nhập (hoặc chiếu = nhập đối cung) cung vai `role` của đại vận. */
  | { kind: "flowPeriodRole"; hoa: HoaType; role: string; mode: "nhap" | "chieu" };

// Một mệnh đề = "cung P (tại B) thỏa các predicate".
export type Clause = { palace: string; branch?: string; predicates: Predicate[]; subjectBranch?: string };

export type ParsedCondition = { clauses: Clause[]; specificity: number };

const H = "(lộc|quyền|khoa|kỵ|kị)";
const HOA_ONLY = new RegExp(`^hóa ${H}$`);

function parseStarToken(token: string): string | null {
  const key = starKey(token);
  return KNOWN_STARS.has(key) ? key : null;
}

function parseTail(rawTail: string): Predicate[] | null {
  let tail = rawTail.trim();
  let scope: "palace" | "tpt" = "palace";
  let single = false;

  // "sao Thiên phủ tọa thủ và các sao Địa không,Địa kiếp hội hợp", "Hóa khoa tọa thủ và Hóa quyền hội hợp",
  // "sao Liêm trinh tọa thủ và các sao Phá quân xung chiếu": phần tọa thủ ở cung + phần hội hợp (tam phương) / xung chiếu (đối cung).
  const compound = tail.match(/^(.+?) tọa thủ và (.+?) (hội hợp|xung chiếu)$/i);
  if (compound) {
    const seat = parseTail(compound[1]);
    const meet = lower(compound[3]) === "xung chiếu" ? toOppositeOrNull(parseTail(compound[2])) : parseTail(`${compound[2]} hội hợp`);
    return seat && meet ? [...seat, ...meet] : null;
  }

  if (/^các sao /i.test(tail)) tail = tail.replace(/^các sao /i, "");
  else if (/^sao /i.test(tail)) tail = tail.replace(/^sao /i, "");
  if (/ hội hợp$/i.test(tail)) {
    tail = tail.replace(/ hội hợp$/i, "");
    scope = "tpt";
  }
  if (/ (đơn thủ|độc tọa)$/i.test(tail)) {
    tail = tail.replace(/ (đơn thủ|độc tọa)$/i, "");
    single = true;
  }

  const tokens = tail.split(",").map((t) => t.trim()).filter(Boolean);
  if (tokens.length === 0) return null;

  const predicates: Predicate[] = [];
  for (const token of tokens) {
    const t = lower(token);
    let m: RegExpMatchArray | null;

    if (/ và không tự hóa$/.test(t)) {
      const inner = parseTail(token.replace(/ và không tự hóa$/i, ""));
      if (!inner) return null;
      predicates.push(...inner, { kind: "noSelfHoa" });
    } else if (t === "vô chính diệu" || t === "vcd") {
      predicates.push({ kind: "noMain" });
    } else if ((m = t.match(new RegExp(`^(?:tự hóa )?hướng tâm(?: tự hóa)?(?: (?:hóa )?${H})?$`)))) {
      predicates.push({ kind: "inwardHoa", hoa: m[1] ? hoaType(m[1])! : null });
    } else if (t === "tự hóa li tâm" || t === "tự hóa ly tâm") {
      predicates.push({ kind: "selfHoaAny" });
    } else if ((m = t.match(new RegExp(`^tự ${H}$`)))) {
      predicates.push({ kind: "selfHoa", hoa: hoaType(m[1])! });
    } else if ((m = t.match(HOA_ONLY))) {
      predicates.push({ kind: "hoa", hoa: hoaType(m[1])!, scope });
    } else if ((m = t.match(new RegExp(`^${H} (\\S+)$`))) && PALACE_ABBR[m[2]]) {
      predicates.push({ kind: "flow", hoa: hoaType(m[1])!, target: PALACE_ABBR[m[2]] });
    } else if ((m = t.match(new RegExp(`^(.+?) hóa ${H} (?:nhập|vào) (?:cung )?(.+)$`))) && parseStarToken(m[1]) && palaceKey(m[3])) {
      // "Thiên lương Hóa lộc nhập Điền trạch": Can cung hóa Lộc sao Thiên Lương, sao đó ở cung Điền Trạch.
      predicates.push({ kind: "flow", hoa: hoaType(m[2])!, target: palaceKey(m[3])!, star: parseStarToken(m[1])! });
    } else if ((m = t.match(new RegExp(`^(.+?) phi hóa ${H} (?:nhập|vào) (?:cung )?(.+)$`))) && parseStarToken(m[1]) && palaceKey(m[3])) {
      // "Cung Huynh đệ có sao Thiên mã phi Hóa kỵ nhập cung Mệnh": cung có sao đó VÀ Can cung phi Hóa Kỵ nhập Mệnh.
      predicates.push({ kind: "star", star: parseStarToken(m[1])!, scope }, { kind: "flow", hoa: hoaType(m[2])!, target: palaceKey(m[3])! });
    } else if ((m = t.match(new RegExp(`^(.+?) hóa ${H}$`))) && parseStarToken(m[1])) {
      predicates.push({ kind: "starHoa", star: parseStarToken(m[1])!, hoa: hoaType(m[2])! });
    } else if (CHANGSHENG[t]) {
      predicates.push({ kind: "changsheng", value: CHANGSHENG[t] });
    } else if (t === "tuần" || t === "tuần không") {
      predicates.push({ kind: "marker", value: "tuần" });
    } else if (t === "triệt" || t === "triệt không" || t === "tiệt không") {
      predicates.push({ kind: "marker", value: "triệt" });
    } else if (BRANCH_GROUPS[t]) {
      predicates.push({ kind: "branchGroup", branches: BRANCH_GROUPS[t] });
    } else if ((m = t.match(/^chi (\S+)$/)) && BRANCH_ORDER.includes(branchKey(m[1]))) {
      predicates.push({ kind: "branchGroup", branches: [branchKey(m[1])] });
    } else if ((m = t.match(/^(\S+) (\S+)$/)) && STEMS.includes(stemKey(m[1])) && BRANCH_ORDER.includes(branchKey(m[2]))) {
      predicates.push({ kind: "stemBranch", stem: stemKey(m[1]), branch: branchKey(m[2]) });
    } else if ((m = t.match(/^nạp âm (\S+)$/)) && elementKey(m[1])) {
      predicates.push({ kind: "cuc", element: elementKey(m[1])! });
    } else if ((m = t.match(/^cung (.+)$/)) && palaceKey(m[1])) {
      predicates.push({ kind: "samePalace", palace: palaceKey(m[1])! });
    } else if (t === "lai nhân cung") {
      predicates.push({ kind: "laiNhan" });
    } else if (t === "mệnh chủ") {
      predicates.push({ kind: "soulStar" });
    } else if (t === "thân chủ") {
      predicates.push({ kind: "bodyStar" });
    } else if (parseStarToken(t)) {
      predicates.push({ kind: "star", star: parseStarToken(t)!, scope });
    } else {
      return null; // token lạ (Cung khí đại cát, M chất, Thất nhân...) -> không kiểm chứng được
    }
  }

  if (single) {
    const stars = predicates.filter((p): p is Extract<Predicate, { kind: "star" }> => p.kind === "star");
    if (stars.length !== 1 || !MAIN_STARS.has(stars[0].star)) return null;
    predicates.push({ kind: "singleMain", star: stars[0].star });
  }

  return predicates;
}

// Sao/Hóa mượn từ đối cung khi cung Vô Chính Diệu.
function toOpposite(predicates: Predicate[]): Predicate[] | null {
  if (predicates.some((p) => p.kind !== "star" && p.kind !== "hoa")) return null;
  return predicates.map((p) => ({ ...(p as Extract<Predicate, { kind: "star" | "hoa" }>), scope: "opposite" as const }) as Predicate);
}
function toOppositeOrNull(predicates: Predicate[] | null): Predicate[] | null {
  return predicates ? toOpposite(predicates) : null;
}

// Cung đối diện theo vai cung (vòng 12 cung cố định: Mệnh - Thiên Di, Phụ Mẫu - Tật Ách, Phúc Đức - Tài Bạch...).
function oppositeRole(key: string | null): string | null {
  if (!key || !(key in ROLE_OFFSETS)) return null;
  const offset = (ROLE_OFFSETS[key] + 6) % 12;
  return Object.keys(ROLE_OFFSETS).find((k) => ROLE_OFFSETS[k] === offset) ?? null;
}

/**
 * Các cách Tứ Hóa có tên (phi hóa theo Can cung) - dựng lại thành các mệnh đề phi hóa / Hóa sinh niên / tự hóa kiểm được
 * trên lá số: "Tuần Hoàn Kỵ (循环忌): cung A phi hóa kỵ sang cung B, cung B phi kị sang cung A", "Đối trì Lộc", "Thị phi lộc",
 * "Điệp xuất Lộc", "Dẫn xuất Lộc", "Tiết xuất Lộc", "Lộc Lộc Trao Đổi", "Kị xung nhau", "Nhập Khố Kỵ", "Tứ Mã Kỵ" (bản có
 * Hóa Kỵ sinh niên), "Cung A phi hóa kỵ xung cung B". Cách nào không đủ dữ kiện rõ ràng ("... có Tự hóa" không nói Hóa gì) -> null.
 */
function parseNamedHoaPattern(condition: string): Clause[] | null {
  const body = lower(condition.includes(":") ? condition.slice(condition.indexOf(":") + 1) : condition).replace(/kị/g, "kỵ");
  const P = (v: string) => palaceKey(v);
  const flow = (palace: string, hoa: HoaType, target: string): Clause => ({ palace, predicates: [{ kind: "flow", hoa, target }] });
  let m: RegExpMatchArray | null;

  // "Cung Tử tức phi hóa kỵ xung cung Mệnh" = Kỵ nhập đối cung của Mệnh (Thiên Di)
  if ((m = body.match(/^cung (.+?) phi hóa kỵ xung cung (.+)$/))) {
    const a = P(m[1]), target = oppositeRole(P(m[2]));
    return a && target ? [flow(a, "ky", target)] : null;
  }
  // Kị xung nhau: "cung A phi hóa kỵ sang cung B xung cung C, cung C phi kỵ xung cung A"
  if ((m = body.match(/^cung (.+?) phi hóa kỵ sang cung (.+?) xung cung (.+?), cung (.+?) phi kỵ xung cung (.+)$/))) {
    const [a, b, c, c2, a2] = [m[1], m[2], m[3], m[4], m[5]].map(P);
    if (!a || !b || !c || c2 !== c || a2 !== a || b !== oppositeRole(c)) return null;
    return [flow(a, "ky", b), flow(c, "ky", oppositeRole(a)!)];
  }
  // Tuần Hoàn Kỵ / Lộc Lộc Trao Đổi: "cung A phi hóa kỵ sang cung B, cung B phi kỵ sang cung A"
  if ((m = body.match(/^cung (.+?) phi hóa (kỵ|lộc) sang cung (.+?), cung (.+?) phi (kỵ|lộc) sang cung (.+)$/))) {
    const [a, b, b2, a2] = [m[1], m[3], m[4], m[6]].map(P);
    if (!a || !b || b2 !== b || a2 !== a || m[2] !== m[5]) return null;
    const hoa = hoaType(m[2])!;
    return [flow(a, hoa, b), flow(b, hoa, a)];
  }
  // Tiết xuất Lộc: "cung A phi hóa Lộc đến đối cung là cung B"
  if ((m = body.match(/^cung (.+?) phi hóa lộc đến đối cung là cung (.+)$/))) {
    const a = P(m[1]), b = P(m[2]);
    return a && b && b === oppositeRole(a) ? [flow(a, "loc", b)] : null;
  }
  // Điệp xuất Lộc: "cung A hóa Lộc phi nhập đối cung là cung B, mà cung B có Lộc năm sinh tọa thủ" / "mà thiên can cung B tự hóa Lộc"
  if ((m = body.match(/^cung (.+?) hóa lộc phi nhập đối cung là cung (.+?), mà (?:cung (.+?) có lộc năm sinh tọa thủ|thiên can cung (.+?) tự hóa lộc)$/))) {
    const a = P(m[1]), b = P(m[2]), b2 = P(m[3] ?? m[4] ?? "");
    if (!a || !b || b2 !== b || b !== oppositeRole(a)) return null;
    return [flow(a, "loc", b), { palace: b, predicates: [m[3] ? { kind: "hoa", hoa: "loc", scope: "palace" } : { kind: "selfHoa", hoa: "loc" }] }];
  }
  // Dẫn xuất Lộc: "cung A có Lộc năm sinh tọa thủ, mà thiên can cung A lại hóa Lộc đến đối cung B"
  if ((m = body.match(/^cung (.+?) có lộc năm sinh tọa thủ, mà thiên can cung (.+?) lại hóa lộc đến đối cung (?:cung )?(.+)$/))) {
    const a = P(m[1]), a2 = P(m[2]), b = P(m[3]);
    if (!a || a2 !== a || !b || b !== oppositeRole(a)) return null;
    return [{ palace: a, predicates: [{ kind: "hoa", hoa: "loc", scope: "palace" }, { kind: "flow", hoa: "loc", target: b }] }];
  }
  // Đối trì Lộc: "cung A hóa Lộc phi nhập đối cung của cung B, mà đối cung của cung B có Hóa lộc [năm sinh] ..."
  if ((m = body.match(/^cung (.+?) hóa lộc phi nhập đối cung của cung (.+?), mà đối cung của cung (.+?) có hóa lộc \[năm sinh\]/))) {
    const a = P(m[1]), b = P(m[2]), b2 = P(m[3]), o = oppositeRole(b);
    if (!a || !b || b2 !== b || !o) return null;
    return [flow(a, "loc", o), { palace: o, predicates: [{ kind: "hoa", hoa: "loc", scope: "palace" }] }];
  }
  // Thị phi lộc: "cung A hóa Lộc phi nhập đối cung của cung B, mà cung B có Hóa kỵ [năm sinh] năm sinh"
  if ((m = body.match(/^cung (.+?) hóa lộc phi nhập đối cung của cung (.+?), mà cung (.+?) có hóa kỵ \[năm sinh\]/))) {
    const a = P(m[1]), b = P(m[2]), b2 = P(m[3]), o = oppositeRole(b);
    if (!a || !b || b2 !== b || !o) return null;
    return [flow(a, "loc", o), { palace: b, predicates: [{ kind: "hoa", hoa: "ky", scope: "palace" }] }];
  }
  // Nhập Khố Kỵ: cung ở Tứ Mộ Khố (Thìn Tuất Sửu Mùi) có Hóa Kỵ sinh niên, không tự hóa
  if ((m = body.match(/^cung (.+?) ở "?tứ mộ khố"? có hóa kỵ \[năm sinh\] và không có tự hóa$/))) {
    const a = P(m[1]);
    return a ? [{ palace: a, predicates: [{ kind: "branchGroup", branches: ["thìn", "tuất", "sửu", "mùi"] }, { kind: "hoa", hoa: "ky", scope: "palace" }, { kind: "noSelfHoa" }] }] : null;
  }
  // Tứ Mã Kỵ (bản có Hóa Kỵ sinh niên): cung ở Dần Thân Tỵ Hợi có Hóa Kỵ sinh niên
  if ((m = body.match(/^cung (.+?) rơi vào đất tứ mã có hóa kỵ \[năm sinh\]$/))) {
    const a = P(m[1]);
    return a ? [{ palace: a, predicates: [{ kind: "branchGroup", branches: ["dần", "thân", "tỵ", "hợi"] }, { kind: "hoa", hoa: "ky", scope: "palace" }] }] : null;
  }
  return null;
}

function parseFlowClauses(text: string): Clause[] | null {
  // Bỏ tên cách cục đứng trước dấu ":" (vd "Củ Triều Kỵ (纠缠忌): ...")
  const body = text.includes(":") ? text.slice(text.indexOf(":") + 1).trim() : text;
  if (/ĐV\.|đại vận|lưu niên|tiểu vận|đối cung|năm sinh/i.test(body)) return null;

  const parts = body.split(/,\s*(?:mà\s+)?/).map((p) => p.trim()).filter(Boolean);
  const clauses: Clause[] = [];
  let subject: string | null = null;

  for (const part of parts) {
    const m = lower(part).match(new RegExp(`^(?:cung (.+?) )?(?:phi )?hóa ${H} (?:phi )?(?:nhập|vào|tới)(?: cung)? (.+)$`));
    if (!m) return null;
    const source: string | null = m[1] ? palaceKey(m[1]) : subject;
    const target = palaceKey(m[3]);
    if (!source || !target) return null;
    subject = source;
    clauses.push({ palace: source, predicates: [{ kind: "flow", hoa: hoaType(m[2])!, target }] });
  }
  return clauses.length ? clauses : null;
}

// Vai cung của đại vận: "Sự nghiệp", "Tử nữ", "Giao hữu"... -> khóa vai chuẩn
const roleKey = (value: string) => {
  const key = palaceKey(value);
  return key && key in ROLE_OFFSETS ? key : null;
};

/** Điều kiện vận hạn - chỉ khớp khi biết năm xem. */
function parsePeriodCondition(condition: string): Clause[] | null {
  let m: RegExpMatchArray | null;
  const isBranch = (value: string) => BRANCH_ORDER.includes(branchKey(value));

  // "Đại vận ở cung Điền trạch (tại Tuất) có sao Thiên không tọa thủ" / "Tiểu vận ở cung ... có sao Bệnh"
  if ((m = condition.match(/^(Đại vận|Tiểu vận) ở cung (.+?) \(tại (\S+)\) có sao (.+?)( tọa thủ)?$/))) {
    const palace = palaceKey(m[2]);
    const predicates = parseTail(m[4]);
    if (!palace || !predicates || !isBranch(m[3])) return null;
    const which = m[1] === "Đại vận" ? "daiVan" : "tieuVan";
    return [{ palace, branch: branchKey(m[3]), predicates: [{ kind: "period", which }, ...predicates] }];
  }

  // "ĐV. Sự nghiệp (Cung Điền trạch bản mệnh) Tự Hóa Lộc"
  if ((m = condition.match(new RegExp(`^ĐV\\. ?(.+?) \\(Cung (.+?) bản mệnh\\) Tự Hóa ${H}$`, "i")))) {
    const role = roleKey(m[1]);
    const palace = palaceKey(m[2]);
    if (!role || !palace) return null;
    return [{ palace, predicates: [{ kind: "periodRole", role }, { kind: "selfHoa", hoa: hoaType(m[3])! }] }];
  }

  // "Cung Điền trạch phi hóa kỵ nhập ĐV. Điền trạch" / "... chiếu ĐV. Điền trạch"
  if ((m = condition.match(new RegExp(`^Cung (.+?) phi hóa ${H} (nhập|chiếu) ĐV\\. ?(.+)$`, "i")))) {
    const palace = palaceKey(m[1]);
    const role = roleKey(m[4]);
    if (!palace || !role) return null;
    return [{ palace, predicates: [{ kind: "flowPeriodRole", hoa: hoaType(m[2])!, role, mode: lower(m[3]) === "chiếu" ? "chieu" : "nhap" }] }];
  }

  // "Đại vận ở cung P phi Hóa Lộc nhập cung Q [và Hóa Kị nhập cung S] [gặp Tự Hóa H | gặp Hóa H [năm sinh]]"
  if ((m = condition.match(new RegExp(`^Đại vận ở cung (.+?) phi Hóa ${H} nhập cung (.+?)(?: và Hóa ${H} nhập cung (.+?))?(?: gặp (Tự Hóa|Hóa) ${H}( \\[năm sinh\\])?)?$`, "i")))) {
    const palace = palaceKey(m[1]);
    const target1 = palaceKey(m[3]);
    const target2 = m[5] ? palaceKey(m[5]) : null;
    if (!palace || !target1 || (m[5] && !target2)) return null;
    const clauses: Clause[] = [
      {
        palace,
        predicates: [
          { kind: "period", which: "daiVan" },
          { kind: "flow", hoa: hoaType(m[2])!, target: target1 },
          ...(target2 ? [{ kind: "flow" as const, hoa: hoaType(m[4])!, target: target2 }] : []),
        ],
      },
    ];
    if (m[6]) {
      // "gặp ..." nói về cung nhận hóa (cung đích cuối cùng được nêu)
      const meet = target2 ?? target1;
      const hoa = hoaType(m[7])!;
      if (/^tự/i.test(m[6])) clauses.push({ palace: meet, predicates: [{ kind: "selfHoa", hoa }] });
      else if (m[8]) clauses.push({ palace: meet, predicates: [{ kind: "hoa", hoa, scope: "palace" }] });
      else return null;
    }
    return clauses;
  }

  return null;
}

function parseConditionShape(condition: string): Clause[] | null {
  let m: RegExpMatchArray | null;
  const isBranch = (value: string) => BRANCH_ORDER.includes(branchKey(value));

  if (/^(Đại vận|Tiểu vận) ở cung|^ĐV\.|ĐV\. ?\S/.test(condition)) return parsePeriodCondition(condition);

  // Cách Tứ Hóa có tên (Tuần Hoàn Kỵ, Đối trì Lộc, Thị phi lộc...) và "Cung A phi hóa kỵ xung cung B".
  const named = parseNamedHoaPattern(condition);
  if (named) return named;

  // Tinh hệ theo vị trí Tử Vi + cung Mệnh: "Tử vi ở cung Thìn, cung Mệnh ở Tuất", "Lá số có Tử vi tại Dần,Cung Mệnh tại Mão",
  // "Tinh hệ cung Mệnh ở Mão, sao Tử vi ở cung Dần".
  let layout: [string, string] | null = null;
  if ((m = condition.match(/^Tử vi ở cung (\S+), cung Mệnh ở (\S+)$/i)) || (m = condition.match(/^Lá số có Tử vi tại ([^,\s]+),\s*Cung Mệnh tại (\S+)$/i))) layout = [m[1], m[2]];
  else if ((m = condition.match(/^Tinh hệ cung Mệnh ở (\S+), sao Tử vi ở cung (\S+)$/i))) layout = [m[2], m[1]];
  if (layout) {
    const [tuVi, menh] = layout;
    if (!isBranch(tuVi) || !isBranch(menh)) return null;
    return [
      { palace: `@${branchKey(tuVi)}`, predicates: [{ kind: "star", star: "tử vi", scope: "palace" }] },
      { palace: "mệnh", branch: branchKey(menh), predicates: [] },
    ];
  }

  // Hai cung: "Cung Mệnh an tại Tí có sao Địa không tọa thủ và cung Thân có sao Địa kiếp",
  // "Cung Mệnh an tại Ngọ có sao Hữu bật tọa thủ và cung Phúc đức có sao Tả phù tọa thủ".
  if ((m = condition.match(/^Cung (.+?) an tại (\S+) có (.+?) tọa thủ và cung (.+?) có (.+?)(?: tọa thủ)?$/))) {
    const palace = palaceKey(m[1]);
    const other = palaceKey(m[4]);
    const first = parseTail(m[3]);
    const second = parseTail(m[5]);
    if (palace && other && first && second && isBranch(m[2])) {
      return [{ palace, branch: branchKey(m[2]), predicates: first }, { palace: other, predicates: second }];
    }
  }

  // "Cung Mệnh an tại Dần có sao Vô chính diệu tọa thủ và các sao Thiên đồng,Cự môn xung chiếu"
  if ((m = condition.match(/^Cung (.+?) an tại (\S+) có sao Vô chính diệu tọa thủ và các sao (.+) xung chiếu$/))) {
    const palace = palaceKey(m[1]);
    const tail = parseTail(m[3]);
    const borrowed = tail ? toOpposite(tail) : null;
    if (!palace || !borrowed || !isBranch(m[2])) return null;
    return [{ palace, branch: branchKey(m[2]), predicates: [{ kind: "noMain" }, ...borrowed] }];
  }

  // "Tam hợp cung Mệnh an tại Dần có các sao Phá quân,Tham lang,Thất sát hội hợp"
  if ((m = condition.match(/^Tam hợp cung (.+?) an tại (\S+) có (.+ hội hợp)$/))) {
    const palace = palaceKey(m[1]);
    const predicates = parseTail(m[3]);
    if (!palace || !predicates || !isBranch(m[2])) return null;
    return [{ palace, branch: branchKey(m[2]), predicates }];
  }

  // "Cung Mệnh an tại Mùi giáp Thái dương và Thái âm" (hai cung kẹp hai bên)
  if ((m = condition.match(/^Cung (.+?) an tại (\S+) giáp (.+?) và (.+)$/))) {
    const palace = palaceKey(m[1]);
    const items = [m[3], m[4]].map((token): FlankItem | null => {
      const t = lower(token);
      const hm = t.match(HOA_ONLY);
      if (hm) return { kind: "hoa", hoa: hoaType(hm[1])! };
      const star = parseStarToken(t);
      return star ? { kind: "star", star } : null;
    });
    if (!palace || !isBranch(m[2]) || items.some((i) => !i)) return null;
    return [{ palace, branch: branchKey(m[2]), predicates: [{ kind: "flank", items: items as FlankItem[] }] }];
  }

  // "Lai Nhân Cung ở cung Tài Bạch"
  if ((m = condition.match(/^Lai Nhân Cung ở cung (.+)$/i)) && palaceKey(m[1])) {
    return [{ palace: palaceKey(m[1])!, predicates: [{ kind: "laiNhan" }] }];
  }

  // "Cung Mệnh vô chính diệu"
  if ((m = condition.match(/^Cung (.+?) vô chính diệu$/i)) && palaceKey(m[1])) {
    return [{ palace: palaceKey(m[1])!, predicates: [{ kind: "noMain" }] }];
  }

  // "Cung Mệnh an tại Tuất có Phá quân" (bỏ qua Địa bàn / Nhân bàn / Thiên bàn - hệ tam bàn khác nguyên cục)
  if ((m = condition.match(/^Cung (.+?) an tại (\S+) có (.+)$/))) {
    const palace = palaceKey(m[1]);
    const predicates = parseTail(m[3]);
    if (!palace || !predicates || !isBranch(m[2])) return null;
    return [{ palace, branch: branchKey(m[2]), predicates }];
  }

  // "Cung Mệnh Vô Chính Diệu (VCD) tại Mùi, khi mượn sao của đối cung thì có Cự môn / Hóa lộc"
  // "Cung Mệnh vô chính diệu ở Mão, đối cung là Tử vi,Tham lang"
  // "Cung Mệnh vô chính diệu an tại Mão có các sao Tử vi,Tham lang xung chiếu"
  if (
    (m = condition.match(/^Cung (.+?) (?:Vô Chính Diệu|VCD) tại (\S+), khi mượn sao của đối cung thì có (.+)$/i)) ||
    (m = condition.match(/^Cung (.+?) vô chính diệu ở (\S+), đối cung là (.+)$/i)) ||
    (m = condition.match(/^Cung (.+?) vô chính diệu an tại (\S+) có các sao (.+) xung chiếu$/i))
  ) {
    const palace = palaceKey(m[1]);
    const tail = parseTail(m[3]);
    const borrowed = tail ? toOpposite(tail) : null;
    if (!palace || !borrowed || !isBranch(m[2])) return null;
    return [{ palace, branch: branchKey(m[2]), predicates: [{ kind: "noMain" }, ...borrowed] }];
  }

  // "Cung Mệnh tự Hóa lộc"
  if ((m = condition.match(new RegExp(`^Cung (.+?) tự Hóa ${H}$`, "i")))) {
    const palace = palaceKey(m[1]);
    return palace ? [{ palace, predicates: [{ kind: "selfHoa", hoa: hoaType(m[2])! }] }] : null;
  }

  // "Cung Thân đồng cung với cung Quan lộc", "Thân cư cung Quan Lộc", "Thân cư Phúc Đức"
  if ((m = condition.match(/^Cung Thân đồng cung với cung (.+)$/)) || (m = condition.match(/^Thân cư (?:cung )?(.+)$/i))) {
    const palace = palaceKey(m[1]);
    return palace ? [{ palace: "thân", subjectBranch: palace, predicates: [] }] : null;
  }

  // "Người tọa Mệnh ở cung Thân"
  if ((m = condition.match(/^Người tọa Mệnh ở cung (\S+)$/)) && isBranch(m[1])) {
    return [{ palace: "mệnh", branch: branchKey(m[1]), predicates: [] }];
  }

  // "Lá số có Tử vi tại Dần"
  if ((m = condition.match(/^Lá số có (.+?) tại (\S+)$/))) {
    const star = parseStarToken(m[1]);
    if (!star || !isBranch(m[2])) return null;
    return [{ palace: `@${branchKey(m[2])}`, predicates: [{ kind: "star", star, scope: "palace" }] }];
  }

  // "Hóa Lộc [năm sinh] ở cung Mệnh, mà cung Mệnh có tự Hóa Kỵ"
  if ((m = condition.match(new RegExp(`^Hóa ${H} \\[năm sinh\\] ở cung (.+?), mà cung (.+?) có tự Hóa ${H}$`, "i")))) {
    const p1 = palaceKey(m[2]);
    const p2 = palaceKey(m[3]);
    if (!p1 || !p2) return null;
    return [
      { palace: p1, predicates: [{ kind: "hoa", hoa: hoaType(m[1])!, scope: "palace" }] },
      { palace: p2, predicates: [{ kind: "selfHoa", hoa: hoaType(m[4])! }] },
    ];
  }

  // "Cung Tật ách có sao Thiên tài, cung Tật ách có sao Thiên thọ"
  if (/^Cung .+? có /.test(condition) && !/ an tại /.test(condition)) {
    const clauses: Clause[] = [];
    for (const part of condition.split(/,\s*(?=cung )/i)) {
      const pm = part.match(/^cung (.+?) có (.+)$/i);
      const palace = pm ? palaceKey(pm[1]) : null;
      const predicates = pm ? parseTail(pm[2]) : null;
      if (!palace || !predicates) return null;
      clauses.push({ palace, predicates });
    }
    return clauses;
  }

  // Phi hóa: "Cung Quan lộc phi Hóa quyền nhập cung Điền trạch", "... vào Mệnh", "Củ Triều Kỵ: ..."
  if (/hóa (lộc|quyền|khoa|kỵ|kị)/i.test(condition)) {
    return parseFlowClauses(condition);
  }

  return null;
}

// Độ cụ thể: điều kiện càng gắn chặt với lá số (vị trí + sao tọa thủ) càng được ưu tiên hiển thị.
const PREDICATE_WEIGHT: Record<Predicate["kind"], number> = {
  star: 3, starHoa: 4, singleMain: 2, noMain: 2, hoa: 2, selfHoa: 2, selfHoaAny: 2, noSelfHoa: 1, flow: 2,
  changsheng: 1, marker: 1, branchGroup: 0, stemBranch: 3, cuc: 1, samePalace: 2, flank: 3,
  laiNhan: 2, soulStar: 1, bodyStar: 1, period: 3, periodRole: 3, flowPeriodRole: 3, inwardHoa: 2,
};

function scoreClauses(clauses: Clause[]): number {
  let score = 0;
  for (const clause of clauses) {
    if (clause.branch) score += 2;
    if (clause.subjectBranch) score += 3;
    for (const p of clause.predicates) {
      score += p.kind === "star" && p.scope !== "palace" ? (p.scope === "opposite" ? 2 : 1) : PREDICATE_WEIGHT[p.kind];
      // Chính tinh quyết định tính chất cung -> ưu tiên hơn phụ tinh / tạp diệu.
      if ((p.kind === "star" || p.kind === "starHoa") && MAIN_STARS.has(p.star)) score += 2;
    }
  }
  return score;
}

export function parseCondition(raw: string): ParsedCondition | null {
  const condition = String(raw || "").normalize("NFC").trim();
  if (!condition) return null;
  const clauses = parseConditionShape(condition);
  return clauses ? { clauses, specificity: scoreClauses(clauses) } : null;
}

// Nội dung crawl từ lá số cụ thể của người khác (tuổi đại vận, "phi phục Tam điểm tại <chi>"...)
// không áp dụng được cho lá số hiện tại dù điều kiện khớp.
export function isChartSpecificText(text: string): boolean {
  // "Điểm mạnh nhất / yếu nhất của lá số ..." là nhận xét tổng hợp của site cho riêng lá số đã crawl.
  return /phi phục Tam điểm tại|\d+\s*-\s*\d+\s*tuổi|\(\d+ tuổi\)|Thông tin chung|^\s*(Cung khí số vị )?đại vận|^\s*Điểm (mạnh|yếu) nhất của lá số/i.test(text);
}

/**
 * star-combinations.json dùng điều kiện có cấu trúc (required_stars / meeting_stars) và nội dung
 * viết cho cung Mệnh ("... thủ mệnh") -> dựng lại thành câu điều kiện cho cung Mệnh.
 */
export function parseStarCombination(item: {
  type?: string;
  text?: string;
  conditions?: { required_stars?: string[]; meeting_stars?: string[]; relation?: string };
}): { condition: string; parsed: ParsedCondition } | null {
  const conditions = item.conditions || {};
  const required = conditions.required_stars || [];
  const meeting = conditions.meeting_stars || [];
  let tail = "";

  if (required.length > 0) {
    tail = required.join(",");
    if (conditions.relation === "tam_hop") tail = `các sao ${tail} hội hợp`;
    else if (item.type === "main_star" && /độc tọa/i.test(item.text || "")) tail = `sao ${tail} đơn thủ`;
  } else if (meeting.length > 0) {
    if (new Set(meeting).size !== meeting.length) return null; // "Song Kỵ" cần lưu Kỵ - không có ở lá số gốc
    tail = `các sao ${meeting.join(",")} hội hợp`;
  }
  if (!tail) return null;
  const condition = `Cung Mệnh có ${tail}`;
  const parsed = parseCondition(condition);
  return parsed ? { condition, parsed } : null;
}

// ============ TEXT REQUIREMENTS ============
//
// Điều kiện crawl đôi khi gán nhầm hoặc rộng hơn nội dung: "Điền trạch tại Dần có Cự môn" nhưng
// nội dung lại viết "Cự Môn ở hai cung Thìn hoặc Tuất...". Câu mở đầu của nội dung thường nêu rõ
// phạm vi áp dụng (vị trí, chính tinh, giới tính, năm sinh) -> trích ra lúc build và đối chiếu thêm
// với lá số lúc runtime. Chỉ hiển thị khi cả điều kiện lẫn phạm vi nội dung đều khớp.

export type TextRequirements = {
  /** Chi được nhắc là vị trí trong câu mở đầu - ít nhất một chi phải là chi của cung (hoặc đối cung). */
  branches?: string[];
  /** Chính tinh được nhắc trong câu mở đầu - phải có trong tam phương tứ chính của cung. */
  mainStars?: string[];
  gender?: "male" | "female";
  /** "Người sinh năm Giáp, Kỷ..." - Can năm sinh phải thuộc danh sách. */
  yearStems?: string[];
  /** "Thái Âm nhập miếu..." / "... hãm địa" - độ sáng của chính tinh được nhắc phải khớp. */
  brightness?: { star: string; level: BrightnessLevel };
  /** "Sao Long Trì, Phượng Các ở tại cung..." - mọi sao được nêu phải cùng ở cung đang xét. */
  seatStars?: string[];
};

const BRANCH_WORD = "(?:Tý|Tí|Sửu|Dần|Mão|Thìn|Tỵ|Tị|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)";
const LOCATION_RE = new RegExp(
  `(?:^|[^\\p{L}])(?:ở|tại|cư|thủ|tọa|nhập|đóng|lâm)\\s+(?:(?:hai|các|bốn|2|4)\\s+)?(?:cung\\s+|vị trí\\s+)?(${BRANCH_WORD}(?:\\s*(?:,|hoặc|và|\\/|-|~)\\s*${BRANCH_WORD})*)(?![\\p{L}])`,
  "giu",
);
const MAIN_STAR_NAMES = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"];
const STEM_WORD = "(?:Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Kỉ|Canh|Tân|Nhâm|Quý|Quí)";
const YEAR_RE = new RegExp(`(?:sinh năm|tuổi)\\s+(${STEM_WORD}(?:\\s*(?:,|hoặc|và|\\/)\\s*${STEM_WORD})*)(?![\\p{L}])`, "iu");

/**
 * Câu mở đầu: câu đầu tiên có nội dung (bỏ gạch đầu dòng), tối đa 300 ký tự. Dòng đầu ngắn không có
 * dấu kết câu là tiêu đề ("Cự Môn tinh tại Thìn Tuất nhập Mệnh Cung") -> gộp thêm dòng kế tiếp.
 */
export function leadSentence(text: string): string {
  const lines = String(text || "").split("\n").map((l) => l.replace(/^[\s\-•*\d.)]+/, "").trim()).filter((l) => l.length > 0);
  let lead = lines[0] ?? "";
  if (lines[1] && lead.length < 120 && !/[.!?;]$/.test(lead)) lead = `${lead} ${lines[1]}`;
  return lead.split(/(?<=[.!?;])\s/)[0].slice(0, 300);
}

// Mảnh chỉ trỏ về đoạn đã bị tách / đã lược ("... thì lại càng như vậy.", "Đây là tượng ...", "Có thêm cát tinh thì càng...")
// - không đứng riêng được. Dùng cả lúc build (đoạn gốc) và lúc hiển thị (đoạn còn lại sau khi lược câu).
const DANGLING_FRAGMENT =
  /^(?=[^\n]{0,200}$)[^\n]*(?:(?:lại càng|càng|cũng) như (?:vậy|thế)|như trên)\.?$|^Đây là(?=[^\n]{0,45}$)|^(?:Cũng|Càng|Lại càng)\s(?=[^\n]{0,150}$)|^(?:Nếu có thêm|Lại có thêm|Có thêm|Nếu thêm)\s[^.\n]{0,80}?\s(?:thì\s)?(?:lại\s)?càng\s/u;
export const isDanglingFragment = (text: string) => DANGLING_FRAGMENT.test(String(text || "").trim());

/** Nội dung mở đầu nói về vận hạn -> không dùng khi luận lá số gốc. */
export function isPeriodText(text: string): boolean {
  return /đại hạn|đại vận|lưu niên|tiểu hạn|tiểu vận|vận này|hạn này/i.test(leadSentence(text));
}

/**
 * Mức độ sáng câu nêu: "mieu" / "vuong" / "dac" khi câu nêu đúng MỘT mức cụ thể ("nhập miếu", "vượng địa", "đắc địa"),
 * "good" khi nêu chung / nhiều mức sáng ("miếu vượng", "miếu, vượng, đắc"), "bad" (hãm), "neutral" (bình hòa).
 * Người xem thấy độ sáng trên lá số: câu "nhập miếu" với sao [V] là câu nói sai về lá số -> so đúng mức.
 */
export type BrightnessLevel = "good" | "bad" | "neutral" | "mieu" | "vuong" | "dac";
/** Câu nói độ sáng một chiều; null nếu không nói hoặc nói cả sáng lẫn hãm. */
function brightnessClaim(lead: string): BrightnessLevel | null {
  const good = /nhập miếu|miếu địa|miếu vượng|vượng địa|đắc địa|(^|[^\p{L}])(miếu|vượng)([^\p{L}]|$)/iu.test(lead);
  const bad = /lạc hãm|hãm địa|(^|[^\p{L}])hãm([^\p{L}]|$)/iu.test(lead);
  // Miếu/vượng/hãm quyết định như trước; "bình hòa" chỉ là phạm vi khi câu KHÔNG nêu chiều nào khác.
  if (good !== bad) return good ? specificBright(lead) : "bad";
  if (!good && /bình hòa|bình địa/iu.test(lead)) return "neutral";
  return null;
}
function specificBright(lead: string): BrightnessLevel {
  if (/miếu vượng|vượng miếu/iu.test(lead)) return "good";
  const mieu = /(^|[^\p{L}])miếu([^\p{L}]|$)/iu.test(lead);
  const vuong = /(^|[^\p{L}])vượng([^\p{L}]|$)/iu.test(lead);
  const dac = /đắc địa/iu.test(lead);
  const count = [mieu, vuong, dac].filter(Boolean).length;
  if (count !== 1) return "good";
  return mieu ? "mieu" : vuong ? "vuong" : "dac";
}
// "vượng" chấp nhận cả miếu (mức sáng hơn); "miếu" và "đắc" phải đúng mức.
const brightnessMatches = (level: BrightnessLevel, code: string) =>
  level === "good" ? /^(M|V|Đ)$/.test(code)
  : level === "mieu" ? code === "M"
  : level === "vuong" ? /^(M|V)$/.test(code)
  : level === "dac" ? code === "Đ"
  : level === "bad" ? code === "H"
  : /^(B|BH)$/.test(code);
const BRIGHTNESS_LABEL: Record<BrightnessLevel, string> = { good: "miếu/vượng/đắc", mieu: "miếu", vuong: "vượng", dac: "đắc địa", bad: "hãm", neutral: "bình hòa" };
const brightnessLabel = (level: BrightnessLevel) => BRIGHTNESS_LABEL[level];
/** Từ chỉ mức sáng đứng riêng ("miếu", "vượng", "đắc", "bình", "hãm") -> mức. */
const brightWord = (word: string): BrightnessLevel | null =>
  /^(nhập miếu|miếu)/.test(word) ? "mieu" : /^vượng/.test(word) ? "vuong" : /^đắc/.test(word) ? "dac" : /^(lạc hãm|hãm)/.test(word) ? "bad" : /^bình/.test(word) ? "neutral" : null;

/** Chính tinh mà điều kiện đòi có ở cung (tọa thủ, mượn đối cung, hoặc kèm Hóa). */
export function conditionMainStars(parsed: Pick<ParsedCondition, "clauses">): string[] {
  const stars = new Set<string>();
  for (const clause of parsed.clauses) {
    for (const p of clause.predicates) {
      if ((p.kind === "star" && p.scope !== "tpt") || p.kind === "starHoa" || p.kind === "singleMain") {
        if (MAIN_STARS.has(p.star)) stars.add(p.star);
      }
    }
  }
  return [...stars];
}

/**
 * Vế "Nếu ..." ở đầu nội dung là một điều kiện phụ. Chỉ giữ khi trích được phạm vi để kiểm chứng
 * (vị trí / chính tinh / giới tính / năm sinh / độ sáng); "Nếu có nhà đất của tổ nghiệp..." thì bỏ.
 */
export function isUnverifiableConditional(text: string, requires: TextRequirements | undefined): boolean {
  return /^\s*nếu\b/i.test(text) && !requires;
}

export function extractTextRequirements(text: string, conditionStars?: string[]): TextRequirements | undefined {
  const lead = leadSentence(text);
  const req: TextRequirements = {};

  // Vị trí: "Cự Môn ở hai cung Thìn hoặc Tuất". Bỏ "sinh giờ Mão" và "cung Thân / Thân cư" (Thân là cung Thân).
  const leadForBranch = lead.replace(/giờ\s+\S+(\s*(,|hoặc|và)\s*\S+)*/gi, " ").replace(/cung Thân|Thân cư|Mệnh,?\s*Thân|Thân,?\s*Mệnh/gi, " ");
  const branches = new Set<string>();
  for (const match of leadForBranch.matchAll(LOCATION_RE)) {
    for (const b of match[1].split(/\s*(?:,|hoặc|và|\/|-|~)\s*/)) branches.add(branchKey(b));
  }
  if (branches.size) req.branches = [...branches];

  // "Tử Vi Đẩu Số", "lá số tử vi"... là tên môn học, không phải sao Tử Vi.
  const lowerLead = lower(lead).replace(/tử vi (đẩu số|bắc phái|nam phái|học)|(lá số|môn|khoa|sách) tử vi/g, " ");
  const stars = MAIN_STAR_NAMES.filter((name) => lowerLead.includes(lower(name))).map(starKey);
  if (stars.length) req.mainStars = stars;

  // Chỉ nhãn "nam mệnh / nữ mệnh" mới là phạm vi; "người phụ nữ" trong câu chỉ là đối tượng được nhắc tới.
  const mentionsMale = /nam mệnh|nam nhân/i.test(lead);
  const mentionsFemale = /nữ mệnh|nữ nhân/i.test(lead);
  if (/^(nam mệnh|nam nhân|đàn ông|người nam|con trai)/i.test(lead) && !mentionsFemale) req.gender = "male";
  if (/^(nữ mệnh|nữ nhân|phụ nữ|người nữ|đàn bà|con gái)/i.test(lead) && !mentionsMale) req.gender = "female";

  const year = lead.match(YEAR_RE);
  if (year) req.yearStems = year[1].split(/\s*(?:,|hoặc|và|\/)\s*/).map(stemKey);

  // Độ sáng: chỉ khi câu mở đầu nói về đúng MỘT chính tinh và chỉ một chiều (miếu/vượng/đắc hoặc hãm).
  // Câu không nêu tên sao ("Vào miếu vượng có nhiều bạn tốt") -> gán cho chính tinh duy nhất của điều kiện.
  const level = brightnessClaim(lead);
  const brightnessStar = stars.length === 1 ? stars[0] : stars.length === 0 && conditionStars?.length === 1 ? conditionStars[0] : null;
  if (level && brightnessStar) req.brightness = { star: brightnessStar, level };

  // Tiêu đề nêu một cặp / nhóm sao cùng ở cung: "Sao Long Trì, Phụng Các ở tại cung tài vận",
  // "SAO THIÊN CƠ, THÁI ÂM TỌA TẠI CUNG THÂN", "Người nam có sao Thái Âm và sao Thiên Cơ cùng tọa..." -> cả bài nói về
  // tổ hợp đó, nên mọi sao được nêu phải có ở cung (điều kiện gốc thường chỉ đòi một sao).
  // Xét tiêu đề và dòng đầu nội dung ("SAO LONG TRÌ, PHỤNG CÁC LUẬN TÀI VẬN: ..." rồi "Sao Long Trì, Phụng Các ở tại ...").
  for (const line of String(text || "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 2)) {
    const seat = line.match(/^(?:người (?:nam|nữ)\s+)?(?:có\s+)?(?:sao\s+)?([^:;.]{3,60}?)\s+(?:song tinh\s+)?(?:ở tại|ở|tại|cùng tọa|cùng ở|đồng cung|tọa|nhập|thủ|an|luận)\s/iu);
    if (!seat || !/,|\svà\s/iu.test(seat[1])) continue;
    // Tiêu đề viết hoa toàn bộ ("SAO ĐÀI PHỤ, PHONG CÁO LUẬN ..."): đưa về dạng viết hoa chữ đầu để nhận cả tên sao trùng
    // từ thường (Phong Cáo, Thiên Hư...) - trong ngữ cảnh "Sao X, Y ở cung" đây chắc chắn là tên sao.
    // (dùng dạng đã chuẩn hóa tên - "Đài Phụ" -> "Thai Phụ" - để khớp đúng tên sao chuẩn)
    const original = scanText(seat[0]).replace(/(^|\s)(\p{L})/gu, (_m, s, c) => s + c.toUpperCase());
    const pair = findStarsIn(seat[1], original, true).filter((s) => !s.startsWith("hoa:"));
    if (pair.length >= 2) {
      req.seatStars = pair;
      break;
    }
  }

  return Object.keys(req).length ? req : undefined;
}

/**
 * Đối chiếu phạm vi nội dung với lá số. `palaceKeys`: cung hiển thị + các cung trong điều kiện.
 * Trả về lý do khớp bổ sung (vd giới tính), hoặc null nếu nội dung không áp dụng cho lá số này.
 */
export function checkTextRequirements(req: TextRequirements | undefined, facts: ChartFacts, palaceKeys: string[]): string[] | null {
  if (!req) return [];
  const palaces = palaceKeys.map((key) => resolvePalace(facts, key)).filter((p): p is PalaceFacts => Boolean(p));
  if (!palaces.length) return null;
  const extra: string[] = [];

  if (req.branches) {
    // Nội dung phải nhắc chi của chính cung; chi đối cung chỉ chấp nhận khi cung vô chính diệu (mượn sao đối cung).
    const allowed = new Set(palaces.flatMap((p) => (p.mainStars.size ? [p.branch] : [p.branch, ...relatedBranches(p.branch, "opposite")])));
    if (!req.branches.some((b) => allowed.has(b))) return null;
  }
  if (req.mainStars) {
    const present = new Set(
      palaces.flatMap((p) => relatedBranches(p.branch, "tpt")).flatMap((b) => [...(palaceAt(facts, b)?.mainStars ?? [])]),
    );
    if (!req.mainStars.every((star) => present.has(star))) return null;
  }
  if (req.gender) {
    if (facts.gender && facts.gender !== req.gender) return null;
    extra.push(req.gender === "male" ? "Nam mệnh" : "Nữ mệnh");
  }
  if (req.yearStems) {
    if (facts.yearStem && !req.yearStems.includes(facts.yearStem)) return null;
    if (facts.yearStem) extra.push(`Sinh năm ${label(facts.yearStem)}`);
  }
  if (req.brightness) {
    const { star, level } = req.brightness;
    // Sao nằm ở cung hiển thị / cung điều kiện, hoặc đối cung khi cung vô chính diệu (mượn sao).
    const holder = palaces.map((p) => (p.mainStars.has(star) ? p : palaceAt(facts, relatedBranches(p.branch, "opposite")[0]))).find((p) => p?.mainStars.has(star));
    const code = holder?.brightness.get(star) ?? "";
    if (!brightnessMatches(level, code)) return null;
    extra.push(`${label(star)} ${brightnessLabel(level)}`);
  }
  if (req.seatStars) {
    // Cung vô chính diệu chỉ mượn CHÍNH TINH đối cung; sao phụ phải có thật trong cung.
    const together = palaces.some((p) => {
      const borrowed = p.mainStars.size ? null : palaceAt(facts, relatedBranches(p.branch, "opposite")[0]);
      return req.seatStars!.every((star) => p.stars.has(star) || Boolean(MAIN_STARS.has(star) && borrowed?.stars.has(star)));
    });
    if (!together) return null;
  }
  return extra;
}

/**
 * Điều kiện có "neo" vào nội dung thật của cung: sao tọa thủ / mượn đối cung, Tứ Hóa, phi hóa, tự hóa,
 * cách giáp, Thân cư... Điều kiện chỉ có vị trí / Can Chi / Nạp âm / Tràng Sinh / sao phụ hội chiếu thì
 * đúng với rất nhiều lá số -> coi là chung chung, không hiển thị.
 */
export function isAnchoredCondition(parsed: Pick<ParsedCondition, "clauses">): boolean {
  return parsed.clauses.some(
    (clause) =>
      Boolean(clause.subjectBranch) ||
      clause.predicates.some((p) => {
        switch (p.kind) {
          case "star":
            // Cung vô chính diệu chỉ mượn CHÍNH TINH đối cung; "mượn" sao phụ (Thiên Khốc, Long Trì...) không đủ neo.
            return p.scope === "palace" || MAIN_STARS.has(p.star);
          case "starHoa":
          case "flow":
          case "selfHoa":
          case "selfHoaAny":
          case "singleMain":
          case "flank":
          case "flowPeriodRole":
          case "inwardHoa":
          case "periodRole":
          case "period": // là cung đại vận / tiểu vận của năm xem - đã đủ cụ thể
            return true;
          case "hoa":
            return p.scope !== "tpt";
          default:
            return false;
        }
      }),
  );
}

/** Điều kiện chỉ khớp theo năm xem (đại vận / tiểu vận). */
export function isPeriodCondition(parsed: Pick<ParsedCondition, "clauses">): boolean {
  return parsed.clauses.some((c) => c.predicates.some((p) => p.kind === "period" || p.kind === "periodRole" || p.kind === "flowPeriodRole"));
}

/** Các cung được nhắc trong điều kiện (để đối chiếu phạm vi nội dung). */
export function conditionPalaceKeys(parsed: Pick<ParsedCondition, "clauses">): string[] {
  return parsed.clauses.map((c) => c.palace).filter((key) => !key.startsWith("@"));
}

// ============ EVALUATE ============

function palaceAt(facts: ChartFacts, branch: string) {
  return facts.byBranch.get(branch) ?? null;
}

const label = (key: string) => key.replace(/(^|\s)\S/g, (c) => c.toUpperCase());

function evalPredicate(p: Predicate, palace: PalaceFacts, facts: ChartFacts): string | null {
  switch (p.kind) {
    case "star": {
      const branches = p.scope === "palace" ? [palace.branch] : relatedBranches(palace.branch, p.scope);
      if (!branches.some((b) => palaceAt(facts, b)?.stars.has(p.star))) return null;
      return p.scope === "palace" ? `Có ${label(p.star)}` : p.scope === "tpt" ? `${label(p.star)} hội chiếu` : `Mượn ${label(p.star)} từ đối cung`;
    }
    case "starHoa":
      return palace.starMutagen.get(p.star) === p.hoa ? `${label(p.star)} ${HOA_LABELS[p.hoa]}` : null;
    case "hoa": {
      const branches = p.scope === "palace" ? [palace.branch] : relatedBranches(palace.branch, p.scope);
      if (!branches.some((b) => palaceAt(facts, b)?.mutagens.has(p.hoa))) return null;
      return p.scope === "opposite" ? `Mượn ${HOA_LABELS[p.hoa]} từ đối cung` : `${HOA_LABELS[p.hoa]} sinh niên`;
    }
    case "selfHoa":
      return palace.selfHoa.has(p.hoa) ? `Tự ${HOA_LABELS[p.hoa]}` : null;
    case "selfHoaAny":
      return palace.selfHoa.size > 0 ? "Cung có tự hóa" : null;
    case "inwardHoa":
      if (p.hoa) return palace.inwardHoa.has(p.hoa) ? `Tự hóa hướng tâm ${HOA_LABELS[p.hoa]}` : null;
      return palace.inwardHoa.size ? `Tự hóa hướng tâm ${[...palace.inwardHoa].map((h) => HOA_LABELS[h]).join(", ")}` : null;
    case "noSelfHoa":
      return palace.selfHoa.size === 0 ? "Không tự hóa" : null;
    case "flow": {
      const hit = palace.flowsOut.some((f) => f.type === p.hoa && f.target === p.target && (!p.star || f.star === p.star));
      return hit ? `${palace.label} phi ${p.star ? `${label(p.star)} ` : ""}${HOA_LABELS[p.hoa]} nhập ${label(p.target)}` : null;
    }
    case "noMain":
      return palace.mainStars.size === 0 ? "Vô chính diệu" : null;
    case "singleMain":
      return palace.mainStars.size === 1 && palace.mainStars.has(p.star) ? `${label(p.star)} độc tọa` : null;
    case "changsheng":
      return palace.changsheng === p.value ? `Vòng Tràng Sinh: ${label(p.value)}` : null;
    case "marker":
      return palace.markers.has(p.value) ? `Có ${label(p.value)}` : null;
    case "branchGroup":
      return p.branches.includes(palace.branch) ? `Cung tại ${label(palace.branch)}` : null;
    case "stemBranch":
      return palace.stem === p.stem && palace.branch === p.branch ? `Can Chi ${label(p.stem)} ${label(p.branch)}` : null;
    case "cuc":
      return facts.cucElement === p.element ? `${label(p.element)} Ngũ Cục` : null;
    case "samePalace":
      // "Cung Mệnh ... có Cung Mệnh" (tri thức chung) / "Cung Thân ... có Cung Sự nghiệp" (Thân cư Quan Lộc)
      return p.palace === palace.key ? (palace.isBody ? `Thân cư ${palace.label}` : `Cung ${palace.label}`) : null;
    case "flank": {
      const index = BRANCH_ORDER.indexOf(palace.branch);
      const sides = [palaceAt(facts, BRANCH_ORDER[(index + 11) % 12]), palaceAt(facts, BRANCH_ORDER[(index + 1) % 12])];
      const has = (side: PalaceFacts | null, item: FlankItem) =>
        Boolean(side && (item.kind === "star" ? side.stars.has(item.star) : side.mutagens.has(item.hoa)));
      const [a, b] = p.items;
      const ok = (has(sides[0], a) && has(sides[1], b)) || (has(sides[0], b) && has(sides[1], a));
      const name = (item: FlankItem) => (item.kind === "star" ? label(item.star) : HOA_LABELS[item.hoa]);
      return ok ? `Giáp ${name(a)} và ${name(b)}` : null;
    }
    case "laiNhan":
      return facts.laiNhan === palace.key ? "Lai nhân cung" : null;
    case "soulStar":
      return facts.soulStar && palace.stars.has(facts.soulStar) ? "Có Mệnh chủ" : null;
    case "period": {
      const branch = facts.period?.[p.which];
      if (!branch || palace.branch !== branch) return null;
      return p.which === "daiVan" ? `Đại vận ${facts.period?.label ?? ""} tại ${palace.label}`.replace("  ", " ") : `Tiểu vận năm xem tại ${palace.label}`;
    }
    case "periodRole": {
      const dv = facts.period?.daiVan;
      if (!dv) return null;
      const target = BRANCH_ORDER[(BRANCH_ORDER.indexOf(dv) + ROLE_OFFSETS[p.role]) % 12];
      return palace.branch === target ? `${palace.label} là cung ${label(p.role)} của đại vận` : null;
    }
    case "flowPeriodRole": {
      const dv = facts.period?.daiVan;
      if (!dv) return null;
      const roleBranch = BRANCH_ORDER[(BRANCH_ORDER.indexOf(dv) + ROLE_OFFSETS[p.role] + (p.mode === "chieu" ? 6 : 0)) % 12];
      const target = palaceAt(facts, roleBranch);
      if (!target || !palace.flowsOut.some((f) => f.type === p.hoa && f.target === target.key)) return null;
      return `${palace.label} phi ${HOA_LABELS[p.hoa]} ${p.mode === "chieu" ? "chiếu" : "nhập"} cung ${label(p.role)} của đại vận`;
    }
    case "bodyStar":
      return facts.bodyStar && palace.stars.has(facts.bodyStar) ? "Có Thân chủ" : null;
  }
}

/** Trả về lý do khớp nếu MỌI mệnh đề đúng trên lá số, ngược lại null. */
/**
 * `displayKey`: cung đang hiển thị - sao của mệnh đề thuộc cung KHÁC được ghi kèm tên cung ("Huynh Đệ có Thái Dương"),
 * sao của mệnh đề theo chi ghi kèm chi ("Tử Vi tại Dần") để nhãn khớp dưới đoạn không gây hiểu nhầm là sao ở cung này.
 */
export function evaluateCondition(parsed: Pick<ParsedCondition, "clauses">, facts: ChartFacts, displayKey?: string): string[] | null {
  const reasons: string[] = [];
  for (const clause of parsed.clauses) {
    const byBranch = clause.palace.startsWith("@");
    const palace = byBranch ? palaceAt(facts, clause.palace.slice(1)) : resolvePalace(facts, clause.palace);
    if (!palace) return null;

    if (clause.subjectBranch) {
      // Cung Thân đồng cung với cung X
      if (palace.key !== clause.subjectBranch) return null;
      reasons.push(`Thân cư ${palace.label}`);
    }
    if (clause.branch) {
      if (palace.branch !== clause.branch) return null;
      reasons.push(`${clause.palace === "thân" ? "Thân" : palace.label} tại ${label(clause.branch)}`);
    }
    for (const predicate of clause.predicates) {
      const reason = evalPredicate(predicate, palace, facts);
      if (!reason) return null;
      if (byBranch && predicate.kind === "star") reasons.push(`${label(predicate.star)} tại ${label(palace.branch)}`);
      else if (displayKey && palace.key !== displayKey && /^Có /.test(reason)) reasons.push(`${palace.label} có ${reason.slice(3)}`);
      else reasons.push(reason);
    }
  }
  return reasons;
}



// ============ REFINE TEXT (lọc từng câu theo lá số) ============
//
// Một đoạn tri thức khớp điều kiện vẫn thường chứa các câu có điều kiện RIÊNG:
//   "Ở Vượng địa, lợi về thi cử. Ở hãm địa, dễ mắc bệnh..."        (độ sáng)
//   "Thiên Cơ ở cung Ngọ ...; Thiên Cơ ở cung Tí, cần thận trọng..."  (vị trí)
//   "Nữ mệnh ...", "Người sinh năm Canh ..."                          (giới tính, năm sinh)
//   "Cự Môn Hóa Lộc là tốt ...", "Thêm Kình Đà thì ..."               (Tứ Hóa của sao, sao đi kèm)
// refineTextForChart() bỏ câu có điều kiện riêng mà lá số KHÔNG thỏa, giữ câu không điều kiện
// và câu có điều kiện đã kiểm chứng đúng (trả về thêm lý do áp dụng).
//
// Nguyên tắc: chỉ bỏ khi chắc chắn sai. Giữ nguyên câu phủ định / nhượng bộ ("không gặp...",
// "nhập miếu cũng..."), câu hai vế ("nếu có... , nếu gặp..."; "nếu không thì..."), câu nói cả hai
// chiều, sao không rõ độ sáng, danh sách chỉ cần MỘT phần tử khớp (can năm, Hóa, chi).
// Vị trí được đối chiếu với vị trí THẬT trên lá số của sao / cung được nhắc, không chỉ cung đang đọc.

export type RefineContext = {
  /** Cung hiển thị + các cung trong điều kiện (như checkTextRequirements). */
  palaceKeys: string[];
  /** Sao (chính tinh hoặc sao phụ) mà điều kiện đòi tọa thủ - dùng khi câu không nêu tên sao. */
  conditionStars: string[];
  /** Mục vận hạn (khớp theo năm xem): câu nói về đại hạn / lưu niên là nội dung chính, không lược. */
  period?: boolean;
};

export type RefineResult = {
  text: string;
  /** Số câu bị bỏ vì điều kiện riêng không khớp lá số. */
  removed: number;
  /** Điều kiện riêng trong câu đã kiểm chứng đúng (vd "Thái Âm miếu/vượng/đắc"). */
  applied: string[];
  /** Câu bị bỏ kèm lý do - dùng cho báo cáo kiểm thử. */
  dropped: Array<{ sentence: string; reason: string }>;
};

/** Sao (mọi loại) mà điều kiện đòi có tại cung (tọa thủ / mượn đối cung / kèm Hóa / độc tọa). */
export function conditionPalaceStars(parsed: Pick<ParsedCondition, "clauses">): string[] {
  const stars = new Set<string>();
  for (const clause of parsed.clauses) {
    for (const p of clause.predicates) {
      if ((p.kind === "star" && p.scope !== "tpt") || p.kind === "starHoa" || p.kind === "singleMain") stars.add(p.star);
    }
  }
  return [...stars];
}

/**
 * Chủ đề của điều kiện - để gom các đoạn cùng nói về một sao: chính tinh tọa thủ / mượn đối cung / kèm Hóa (ưu tiên),
 * nếu không có thì các sao khác tại cung, rồi các sao hội chiếu. Điều kiện không nêu sao (Tứ Hóa sinh niên, phi hóa,
 * giáp cung, vận hạn...) -> null.
 */
export function conditionSubject(parsed: Pick<ParsedCondition, "clauses">): string | null {
  const stars = conditionPalaceStars(parsed);
  const main = stars.filter((s) => MAIN_STARS.has(s));
  if (main.length) return `main:${main.sort().join("+")}`;
  if (stars.length) return `star:${[...stars].sort().join("+")}`;
  const meeting = parsed.clauses.flatMap((c) => c.predicates).flatMap((p) => (p.kind === "star" && p.scope === "tpt" ? [p.star] : []));
  return meeting.length ? `tpt:${[...new Set(meeting)].sort().join("+")}` : null;
}

// Dấu thanh kiểu cũ ("Hoả", "hoá", "Thuỷ") -> kiểu mới, để so tên sao / chữ Hóa.
const TONE_OLD: Record<string, string> = { "oà": "òa", "oá": "óa", "oả": "ỏa", "oã": "õa", "oạ": "ọa", "oè": "òe", "oé": "óe", "oẻ": "ỏe", "uỳ": "ùy", "uý": "úy", "uỷ": "ủy", "uỹ": "ũy", "uỵ": "ụy" };
// Tên gọi khác / lỗi chính tả thường gặp trong tri thức -> tên sao chuẩn
const TEXT_STAR_ALIASES: Array<[RegExp, string]> = [
  [/tả phụ/g, "tả phù"],
  [/thiên riêu|thiên dao/g, "thiên diêu"],
  [/dương nhẫn/g, "kình dương"],
  [/tù tinh/g, "liêm trinh"],
  [/hóa tinh/g, "hỏa tinh"],
  [/vẫn khúc/g, "văn khúc"],
  [/đa la/g, "đà la"],
  [/hòa lỉnh|hòa linh/g, "hỏa linh"],
  [/phụng các/g, "phượng các"],
  [/phỉ liêm/g, "phi liêm"],
  [/thiên hỷ/g, "thiên hỉ"],
  [/hỉ thần/g, "hỷ thần"],
  [/bác sỹ/g, "bác sĩ"],
  [/lực sỹ/g, "lực sĩ"],
  [/đài phụ|đài phổ/g, "thai phụ"],
  [/thiên quí/g, "thiên quý"],
  // "tính đào hoa", "duyên đào hoa"... là đặc tính, không phải sao Đào Hoa
  [/(tính|duyên|vận|chuyện|kiểu|mang|nét|vẻ) đào hoa/g, "$1 _"],
];
const scanText = (value: string) => {
  // "qu" là phụ âm đầu: "quý" giữ nguyên (không phải "uý" kiểu cũ như "thuý").
  let text = lower(value).replace(/(o[àáảãạèéẻ]|(?<!q)u[ỳýỷỹỵ])(?![\p{L}])/gu, (m) => TONE_OLD[m] ?? m);
  for (const [re, to] of TEXT_STAR_ALIASES) text = text.replace(re, to);
  return text;
};
const titleCase = (name: string) => name.replace(/(^|\s)\S/g, (c) => c.toUpperCase());

const SAT_STARS = ["kình dương", "đà la", "hỏa tinh", "linh tinh", "địa không", "địa kiếp"];
const CAT_STARS = ["tả phù", "hữu bật", "văn xương", "văn khúc", "thiên khôi", "thiên việt"];
// Cụm gọi tắt / nhóm sao -> danh sách sao. "hoa:" là Tứ Hóa sinh niên.
const STAR_GROUPS: Array<[RegExp, string[]]> = [
  [/hình sát|hình kỵ|hình kị|kỵ sát|kị sát|sát kị|sát kỵ/, ["thiên hình", "hoa:ky", ...SAT_STARS]],
  [/không vong/, ["địa không", "thiên không"]],
  [/tứ sát/, ["kình dương", "đà la", "hỏa tinh", "linh tinh"]],
  [/lục sát|sát tinh|sát diệu|các sao sát/, SAT_STARS],
  // "cát tinh" hiểu rộng: lục cát + Lộc Tồn + ba Hóa cát
  [/lục cát|cát tinh|cát diệu|các sao cát|sao phụ tá|phụ tá cát|cát hóa/, [...CAT_STARS, "lộc tồn", "hoa:loc", "hoa:quyen", "hoa:khoa"]],
  [/kình đà|dương đà/, ["kình dương", "đà la"]],
  [/hỏa linh/, ["hỏa tinh", "linh tinh"]],
  [/không kiếp/, ["địa không", "địa kiếp"]],
  [/xương khúc/, ["văn xương", "văn khúc"]],
  [/tả hữu|phụ bật/, ["tả phù", "hữu bật"]],
  [/khôi việt/, ["thiên khôi", "thiên việt"]],
  [/đào hoa tinh|sao đào hoa|các sao đào hoa|đào hoa/, ["đào hoa", "hồng loan", "thiên hỉ", "thiên diêu", "hàm trì"]],
  [/khoa quyền lộc|lộc quyền khoa|tam hóa/, ["hoa:loc", "hoa:quyen", "hoa:khoa"]],
];
// Tên sao trùng từ thường ("thiên tài" = tài năng, "bác sĩ", "tướng quân", "quan phủ"...): chỉ tính
// là sao khi viết hoa đúng tên sao hoặc có chữ "sao" đứng trước.
const AMBIGUOUS_STARS = new Set([
  "thiên tài", "bác sĩ", "lực sĩ", "tướng quân", "quan phủ", "phục binh", "thiên quan", "thiên phúc", "thiên đức", "nguyệt đức",
  "long đức", "thanh long", "bệnh phù", "hỷ thần", "tấu thư", "thiên y", "quốc ấn", "đường phù", "thai phụ", "phong cáo",
  "thiên thọ", "thiên quý", "ân quang", "thiên giải", "địa giải", "giải thần", "thiên trù", "thiên la", "địa võng", "thiên sứ",
  "thiên thương", "thiên không", "thiên hư", "thiên khốc", "tuế phá", "đại hao", "tiểu hao", "phi liêm", "thiếu dương", "thiếu âm",
]);
// Tên sao đủ dài để tìm trong câu; bỏ tên trùng tên cung ("Phúc Đức") và chữ Hóa.
const STAR_NAMES_DESC = [...KNOWN_STARS].filter((s) => s.length >= 5 && !s.startsWith("hóa ") && s !== "phúc đức").sort((a, b) => b.length - a.length);
const HOA_WORD = "(?:hóa)\\s+(lộc|quyền|khoa|kỵ|kị)";
const HOA_LIST = `${HOA_WORD}((?:\\s*(?:,|hoặc|hay|và)(?:\\s*(?:hoặc|hay|và))?\\s*(?:hóa\\s+)?(?:lộc|quyền|khoa|kỵ|kị)(?![\\p{L}]))*)`;
// Như LOCATION_RE nhưng chấp nhận chi viết liền nhau không dấu phẩy ("Dần, Mão, Tị Ngọ"); chi phải
// viết hoa ("hóa bất lâm thân" không phải chi Thân).
const LOCATION_LIST_RE = new RegExp(
  `(?:^|[^\\p{L}])(?:[Ởở]|[Tt]ại|[Cc]ư|[Tt]hủ|[Tt]ọa|[Nn]hập|[Đđ]óng|[Ll]âm)\\s+(?:(?:hai|các|bốn|2|4)\\s+)?(?:cung\\s+|vị trí\\s+)?(${BRANCH_WORD}(?:\\s*(?:,|hoặc|hay|và|\\/|-|~|\\s)\\s*(?:cung\\s+)?${BRANCH_WORD})*)(?![\\p{L}])`,
  "gu",
);
const PALACE_NAME_RE = /(?:cung\s+)?(mệnh|phụ mẫu|phúc đức|điền trạch|quan lộc|sự nghiệp|nô bộc|giao hữu|thiên di|tật ách|tài bạch|tử tức|tử nữ|phu thê|huynh đệ)(?![\p{L}])/u;

// Số thứ tự viết bằng chữ ("Hai)", "Mười một)") trong phần bình chú cũng là gạch đầu dòng.
const WORD_ORDINAL = "(?:một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười)(?:\\s+(?:một|hai|ba|bốn|lăm|năm|sáu|bảy|tám|chín))?\\)";
const BULLET_RE = new RegExp(`^[\\s\\-•*+>★☆]*(\\(?\\d+[.)]\\s*|[a-zđ][.)]\\s+|${WORD_ORDINAL}\\s*)?`, "iu");
const stripBullet = (s: string) => s.replace(BULLET_RE, "").trim();
/** Dòng mở một mục liệt kê ("1.", "(2)", "a)", "Sáu) ..."). */
const ENUM_ITEM_RE = new RegExp(`^[\\s\\-•*+>★☆]*(\\(?\\d+[.)]|[a-zđ][.)]\\s|${WORD_ORDINAL})`, "iu");
const thiIndex = (u: string) => u.search(/\s(thì|tất|ắt)\s/i);

/** Vế điều kiện: trước " thì " (trong 200 ký tự đầu), nếu không thì trước dấu phẩy / hai chấm đầu tiên. */
function conditionHead(unit: string): string {
  const thi = thiIndex(unit);
  if (thi > 0 && thi < 200) return unit.slice(0, thi);
  const comma = unit.search(/[,:]/);
  return comma > 0 ? unit.slice(0, comma) : unit.slice(0, 200);
}

// Tên viết tắt chỉ dùng trong danh sách sao ("Kình Dương, Hỏa, Linh, Đà La").
const SHORT_STAR_NAMES: Record<string, string> = {
  "hỏa": "hỏa tinh", "linh": "linh tinh", "kình": "kình dương", "đà": "đà la", "kiếp": "địa kiếp", "xương": "văn xương",
  "khúc": "văn khúc", "khôi": "thiên khôi", "việt": "thiên việt", "tả": "tả phù", "hữu": "hữu bật", "mã": "thiên mã", "hình": "thiên hình",
  "lộc": "hoa:loc", "quyền": "hoa:quyen", "khoa": "hoa:khoa", "kỵ": "hoa:ky", "kị": "hoa:ky",
};

function findStarsIn(text: string, original: string = text, listMode = false): string[] {
  let rest = scanText(text);
  const found: string[] = [];
  if (listMode) {
    for (const token of rest.split(/\s*(?:,|và|hoặc|hay|\/)\s*/)) {
      const short = SHORT_STAR_NAMES[token.replace(/^(nếu |khi |gặp |thêm |hội |có |lại |sao )+/, "").trim()];
      if (short) found.push(short);
    }
  }
  for (const [re, stars] of STAR_GROUPS) if (re.test(rest)) { found.push(...stars); rest = rest.replace(re, " "); }
  const lowOriginal = scanText(original);
  for (const name of STAR_NAMES_DESC) {
    if (!rest.includes(name)) continue;
    rest = rest.split(name).join(" ");
    if (AMBIGUOUS_STARS.has(name) && !original.includes(titleCase(name)) && !lowOriginal.includes(`sao ${name}`)) continue;
    found.push(name);
  }
  for (const m of rest.matchAll(new RegExp(HOA_WORD, "giu"))) {
    const type = hoaType(m[1]);
    if (type) found.push(`hoa:${type}`);
  }
  return [...new Set(found)];
}

/** Vế nêu danh sách sao: "Có Kình Dương, Đà La, Hỏa Tinh hội chiếu, sự nghiệp..." -> tới hết danh sách sao. */
function starListHead(unit: string): string {
  const thi = thiIndex(unit);
  const scope = thi > 0 && thi < 200 ? unit.slice(0, thi) : unit;
  const parts = scope.split(/[,:]/);
  let head = parts[0];
  for (let i = 1; i < parts.length; i++) {
    const words = parts[i].trim().split(/\s+/).length;
    if (words > 6 || !findStarsIn(parts[i]).length) break;
    head += "," + parts[i];
  }
  return head;
}

const starBranches = (facts: ChartFacts, star: string) => [...facts.byBranch.values()].filter((p) => p.stars.has(star)).map((p) => p.branch);

const PALACE_WORDS = "mệnh|phụ mẫu|phúc đức|điền trạch|quan lộc|sự nghiệp|nô bộc|giao hữu|thiên di|tật ách|tài bạch|tử tức|tử nữ|phu thê|huynh đệ";
// "<sao> tọa/thủ/cư/nhập [cung] <cung>[/Thân]" - "Thân" đứng riêng là chi Thân nên chỉ nhận khi viết "cung Thân" hoặc "Mệnh/Thân".
const SEAT_RE = new RegExp(
  `(?:sao\\s+)?(${STAR_NAMES_DESC.join("|")}|xương khúc|tả hữu|khôi việt|kình đà|hỏa linh|không kiếp)\\s+(?:độc\\s+)?(?:tọa|thủ|cư|nằm|nhập|đóng|ở|tại)(?:\\s+giữ)?\\s+(?:ở\\s+|tại\\s+)?` +
    `(?:cung\\s+(${PALACE_WORDS}|thân)|(${PALACE_WORDS}))(?:\\s*(?:\\/|,|hoặc|hay|và)\\s*(?:cung\\s+)?(${PALACE_WORDS}|thân)|\\s+cung\\s+(thân))?(?![\\p{L}])`,
  "u",
);
// Viết đảo ở đầu câu: "Người cung mệnh ở sao Thiên Tướng...", "Người có mệnh ở sao Thiên Lương...", "Cung Mệnh có sao X",
// "cung Mệnh có: Thiên Mã". (Chỉ ở đầu câu - giữa câu thường là mệnh của người khác: "vợ là người cung mệnh có sao...".)
const SEAT_REV_RE = new RegExp(
  `^(?:(?:nếu|khi)\\s+)?(?:người\\s+(?:có\\s+)?)?(?:cung\\s+)?(${PALACE_WORDS})\\s+(?:(?:ở|có)\\s+sao\\s+|có\\s*:\\s*(?:sao\\s+)?)(${STAR_NAMES_DESC.join("|")})(?![\\p{L}])`,
  "u",
);
// Bảng liệt kê theo độ sáng / vị trí: "☆ Độ vượng của Thất Sát là miếu, ...", "☆ Vị trí cung Mệnh là “Tỵ, Hợi”, ...".
const DEGREE_RE = new RegExp(`^độ (?:vượng|sáng) của (?:sao\\s+)?(${STAR_NAMES_DESC.join("|")}) là (nhập miếu|miếu|vượng|đắc địa|đắc|bình hòa|hãm địa|lạc hãm|hãm)(?![\\p{L}])`, "u");
const POSITION_RE = new RegExp(`^vị trí (?:của )?cung (${PALACE_WORDS}) là\\s*["“]?\\s*(${BRANCH_WORD}(?:\\s*(?:,|hoặc|và|\\/)\\s*${BRANCH_WORD})*)`, "iu");
const HOA_STAR_ALT = [...MAIN_STAR_NAMES, "Văn Xương", "Văn Khúc", "Tả Phù", "Hữu Bật"].map(lower).join("|");
// Câu MỞ BẰNG cặp sao-Hóa ("Thái Âm Hóa Kị vốn không chủ về..."): cặp đó là điều kiện chính của câu.
const LEAD_HOA_RE = new RegExp(`^(?:sao\\s+)?(${HOA_STAR_ALT})\\s+hóa\\s+(lộc|quyền|khoa|kỵ|kị)((?:\\s*(?:,|hoặc|hay|và)\\s*(?:hoặc\\s+|hay\\s+)?hóa\\s+(?:lộc|quyền|khoa|kỵ|kị))*)`, "u");
const PAREN_HOA_RE = new RegExp(`^(?:sao\\s+)?(${STAR_NAMES_DESC.join("|")})\\s*\\(\\s*hóa\\s+(lộc|quyền|khoa|kỵ|kị)\\s*\\)`, "u");
const SOLO_RE = new RegExp(`^(?:sao\\s+)?(${STAR_NAMES_DESC.join("|")})?\\s*(?:một mình|độc tọa|độc thủ|đơn thủ)(?![\\p{L}])`, "u");

// Cách cục được nêu tên trong câu -> các sao cách đó đòi (trong cung "palace" hoặc tam phương tứ chính "tpt").
// Câu nêu cách mà lá số không đủ sao ("thành cách Dương Lương Xương Lộc" khi không có Văn Xương) là câu của lá số khác.
// "lộc" = Lộc Tồn hoặc Hóa Lộc sinh niên.
const CACH_RULES: Array<{ re: RegExp; scope: "palace" | "tpt"; all: string[]; any?: string[] }> = [
  { re: /dương lương xương lộc/, scope: "tpt", all: ["thái dương", "thiên lương", "văn xương"], any: ["lộc tồn", "hoa:loc"] },
  { re: /văn quế văn hoa/, scope: "palace", all: ["văn xương", "văn khúc"] },
  { re: /(tham hỏa|hỏa tham)(?! linh)/, scope: "palace", all: ["tham lang", "hỏa tinh"] },
  { re: /linh tham|tham linh/, scope: "palace", all: ["tham lang", "linh tinh"] },
  { re: /lộc mã giao trì/, scope: "tpt", all: ["thiên mã"], any: ["lộc tồn", "hoa:loc"] },
  { re: /song lộc/, scope: "tpt", all: ["lộc tồn", "hoa:loc"] },
  { re: /tả hữu đồng cung/, scope: "palace", all: ["tả phù", "hữu bật"] },
  { re: /tử phủ đồng cung/, scope: "palace", all: ["tử vi", "thiên phủ"] },
  { re: /cơ nguyệt đồng lương/, scope: "tpt", all: ["thiên cơ", "thái âm", "thiên đồng", "thiên lương"] },
  { re: /sát phá (liêm )?tham/, scope: "tpt", all: ["thất sát", "phá quân", "tham lang"] },
];

const PERIOD_SENTENCE_RE = /^(?:(?:nếu|khi|vào|đến|tới|gặp|còn|mà)\s+)?(?:đại hạn|đại vận|lưu niên|tiểu hạn|tiểu vận|vận hạn|năm hạn)(?![\p{L}])/u;
// Câu dẫn chiếu phần bài không hiển thị ("Thiên Hỉ thích nhất nhập ba cung này", "hai tinh hệ vừa thuật ở trên") hoặc câu ví dụ.
const UNSEEN_REF_RE = /(?:vừa|đã) (?:thuật|nói|kể|trình bày|đề cập|phân tích|nêu)(?: đến)?(?: ở)? (?:trên|phía trên)|như (?:đã )?(?:nói|kể|phân tích|trình bày) (?:ở )?trên/u;
// "ba cung này", "các cung trên" ở CÂU MỞ ĐOẠN: chỉ về danh sách cung của phần bài không hiển thị (giữa đoạn thì thường chỉ các
// chi / cung vừa nêu ngay trước - vẫn giữ).
const LEAD_PALACE_REF_RE = /(?:hai|ba|bốn|các|những) cung (?:này|trên|kể trên|nói trên)(?![\p{L}])/u;
const EXAMPLE_LEAD_RE = /^(?:ví dụ|thí dụ|chẳng hạn)(?![\p{L}])/u;
// Tên tắt tinh hệ ĐỒNG CUNG ở đầu câu ("Tử Tướng cũng có ứng nghiệm...", "Vũ Phá ...") - hai sao phải cùng ở cung đang đọc
// (hoặc cùng ở đối cung khi cung vô chính diệu). ("Cơ Nguyệt Đồng Lương" là cách tam phương, không phải cặp đồng cung.)
const PAIR_ABBR: Record<string, [string, string]> = {
  "tử phủ": ["tử vi", "thiên phủ"], "tử tướng": ["tử vi", "thiên tướng"], "tử phá": ["tử vi", "phá quân"], "tử sát": ["tử vi", "thất sát"], "tử tham": ["tử vi", "tham lang"],
  "vũ phủ": ["vũ khúc", "thiên phủ"], "vũ tướng": ["vũ khúc", "thiên tướng"], "vũ phá": ["vũ khúc", "phá quân"], "vũ sát": ["vũ khúc", "thất sát"], "vũ tham": ["vũ khúc", "tham lang"],
  "liêm phủ": ["liêm trinh", "thiên phủ"], "liêm tướng": ["liêm trinh", "thiên tướng"], "liêm phá": ["liêm trinh", "phá quân"], "liêm sát": ["liêm trinh", "thất sát"], "liêm tham": ["liêm trinh", "tham lang"],
  "cơ âm": ["thiên cơ", "thái âm"], "cơ lương": ["thiên cơ", "thiên lương"], "cơ cự": ["thiên cơ", "cự môn"],
  "đồng âm": ["thiên đồng", "thái âm"], "đồng lương": ["thiên đồng", "thiên lương"], "đồng cự": ["thiên đồng", "cự môn"],
  "cự nhật": ["cự môn", "thái dương"],
};
const PAIR_ABBR_RE = new RegExp(`^(?:tinh hệ |sao )?(${Object.keys(PAIR_ABBR).join("|")})(?![\\p{L}])`, "u");
// Vế thay thế thật sự ("..., nếu không thì...", "ngược lại...") - khác với vế thêm điều kiện ("..., gặp Văn Xương càng...").
const ALTERNATIVE_RE = /(nếu không|bằng không|trái lại|ngược lại|còn nếu)/;

const NEGATION_RE = /(^|[^\p{L}])(không|chẳng|chưa|trừ khi|dù|bất kể|bất luận|kể cả)([^\p{L}]|$)/u;
const withoutKhongStars = (s: string) => s.replace(/địa không|thiên không|tuần không|triệt không|tiệt không|không kiếp|không vong/g, " ");

// Giới tính ngầm của CHỦ lá số: từ chỉ dùng cho một giới ("cô gái", "hồng nhan", "lấy chồng" / "lấy vợ", "khắc vợ").
// Chỉ xét ở cung nói về bản thân / hôn nhân - ở cung Tử Tức, Phụ Mẫu, Huynh Đệ, Nô Bộc các từ này nói về người khác.
const SELF_PALACES = new Set(["mệnh", "thân", "phu thê", "phúc đức", "tật ách", "quan lộc", "tài bạch", "thiên di", "điền trạch"]);
const FEMALE_CUE = /(^|[^\p{L}])(cô gái|hồng nhan|trinh tiết|mất trinh|nữ trung hào kiệt|vượng phu|ích tử|sát phu|khắc chồng|hình chồng|hại chồng|giúp chồng|phù chồng|lấy chồng|theo chồng|bỏ chồng|chồng con|làm lẽ|làm vợ lẽ|làm vợ bé|bị đàn ông|được đàn ông|đàn ông theo đuổi)([^\p{L}]|$)/u;
const MALE_CUE = /(^|[^\p{L}])(lấy vợ|cưới vợ|khắc vợ|hình vợ|hại vợ|sợ vợ|nhờ vợ|được vợ|bỏ vợ|vợ con|có vợ lẽ|lấy vợ lẽ|năm thê bảy thiếp|thê thiếp|đa thê|song thê|hai vợ|ba vợ|nàng hầu|bị phụ nữ|được phụ nữ|phụ nữ theo đuổi|con gái theo đuổi)([^\p{L}]|$)/u;
// ("vợ" / "chồng" đứng riêng thì không suy ra được: "chồng nên là con trưởng" có thể nói về chính chủ lá số nam.)
// Riêng cung Phu Thê: "vợ ..." / "chồng ..." đứng riêng là NGƯỜI PHỐI NGẪU ("vợ xinh đẹp thanh tú", "hiền thê") -> chủ lá số là
// giới kia. Bỏ "vợ chồng", "làm vợ / làm chồng" (chủ lá số tự nói về mình), "chồng chất / chồng chéo" (không phải người chồng).
function spouseGender(lowU: string): "male" | "female" | null {
  // Câu tự nêu trường hợp theo giới ("trường hợp mệnh nữ ... chồng ...; mệnh nam ... vợ ...") -> không suy thêm.
  if (/nam mệnh|nữ mệnh|mệnh nam|mệnh nữ/.test(lowU)) return null;
  const t = lowU.replace(/vợ chồng|chồng vợ|làm vợ|làm chồng|chồng (?:chất|chéo|lên|đống)|mẹ chồng nàng dâu|nàng dâu mẹ chồng/g, " ");
  const wife = /(^|[^\p{L}])(vợ|hiền thê|thê tử)([^\p{L}]|$)/u.test(t);
  const husband = /(^|[^\p{L}])(chồng|phu quân)([^\p{L}]|$)/u.test(t);
  return wife === husband ? null : wife ? "female" : "male";
}
function impliedGender(lowU: string, palaceKeyName: string | undefined): "male" | "female" | null {
  if (!palaceKeyName || !SELF_PALACES.has(palaceKeyName)) return null;
  const female = FEMALE_CUE.test(lowU);
  const male = MALE_CUE.test(lowU.replace(/làm vợ (lẽ|bé)/g, " "));
  return female === male ? null : female ? "female" : "male";
}

function checkUnit(unit: string, facts: ChartFacts, palaces: PalaceFacts[], ctx: RefineContext): { drop?: string; applied?: string } {
  // Phần trong ngoặc là chú thích phụ - không dùng để quyết định bỏ câu.
  const u = stripBullet(unit).replace(/\([^)]*\)|\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
  if (u.length < 4) return {};
  const lowU = scanText(u);
  const head = conditionHead(u);
  const lowHead = scanText(head);

  // 0e) Câu nói về vận hạn ("Đại hạn, Lưu niên có sao Phá Quân chiếu đến...", "Khi đại vận/tiểu hạn gặp thì...") trong
  //     phần luận lá số gốc: cần cung vận hạn của năm xem mới kiểm được -> bỏ (mục vận hạn có phần hiển thị riêng).
  if (!ctx.period && PERIOD_SENTENCE_RE.test(lowU)) return { drop: "câu nói về vận hạn (luận lá số gốc không kiểm được)" };
  if (EXAMPLE_LEAD_RE.test(lowU)) return { drop: "câu ví dụ (không nói về lá số này)" };
  // "Gia đạo xuyến liên hợp vượng, ..." - điều kiện xuyến liên giữa các cung không có định nghĩa kiểm được trên lá số.
  if (/xuyến liên/.test(lowU)) return { drop: "câu theo điều kiện xuyến liên (không kiểm được trên lá số)" };
  if (UNSEEN_REF_RE.test(lowU)) return { drop: "dẫn chiếu phần bài không hiển thị" };

  // 0f) Chú thích độ sáng trong ngoặc theo bảng của nguồn ("(tại Dần, Thiên Đồng bình, Thiên Lương miếu; tại Thân, Thiên Đồng
  //     vượng, Thiên Lương hãm)"): sao có ở đúng chi đó trên lá số mà độ sáng khác chiều -> câu nói sai về lá số này.
  for (const group of unit.matchAll(/\(([^()]{4,200})\)/g)) {
    for (const part of group[1].split(";")) {
      const at = part.trim().match(new RegExp(`^(?:tại|ở)\\s+(${BRANCH_WORD})\\s*,\\s*(.+)$`, "iu"));
      const holder = at ? palaceAt(facts, branchKey(at[1])) : undefined;
      if (!at || !holder) continue;
      for (const item of scanText(at[2]).split(",").map((s) => s.trim())) {
        const name = STAR_NAMES_DESC.find((s) => item.startsWith(`${s} `));
        if (!name || !holder.stars.has(name)) continue;
        const word = item.slice(name.length).trim();
        const level = brightWord(word);
        const code = holder.brightness.get(name) ?? "";
        if (level && code && !brightnessMatches(level, code)) return { drop: `${label(name)} tại ${label(holder.branch)} không ${brightnessLabel(level)} (chú thích độ sáng trong câu)` };
      }
    }
  }

  // 0) Vận hạn: "phi Hóa Kỵ nhập ĐV Tài bạch (Phụ mẫu bản mệnh)" - cung đang xét phải thật sự phi Hóa đó vào
  //    cung bản mệnh được nêu (Can cung không đổi giữa lá số gốc và đại vận).
  // (đọc câu gốc: cung bản mệnh nằm trong ngoặc)
  const flowClaim = scanText(unit).match(/phi hóa (lộc|quyền|khoa|kỵ|kị) (?:nhập|vào) (?:cung )?đv\.? ?[^()]{2,24}\((?:cung )?([^()]+?) bản mệnh\)/u);
  if (flowClaim && palaces[0]) {
    const type = hoaType(flowClaim[1]);
    const target = palaceKey(flowClaim[2]);
    if (type && target && !palaces[0].flowsOut.some((f) => f.type === type && f.target === target)) {
      return { drop: `${palaces[0].label} không phi ${HOA_LABELS[type]} vào ${label(target)}` };
    }
  }

  // 0c) "Văn khúc (Hóa khoa) - ..." ở đầu câu: Hóa trong ngoặc là điều kiện (sao đó phải mang đúng Hóa sinh niên).
  const parenHoa = scanText(stripBullet(unit)).match(PAREN_HOA_RE);
  if (parenHoa) {
    const actual = [...facts.palaces.values()].map((p) => p.starMutagen.get(parenHoa[1])).find(Boolean);
    const wanted = hoaType(parenHoa[2])!;
    if (actual !== wanted) return { drop: `${label(parenHoa[1])} không ${HOA_LABELS[wanted]}` };
  }

  // 0d) Câu mở bằng cặp sao-Hóa: kiểm trước bước phủ định ("X Hóa Kị vốn không chủ về..." vẫn là câu về X Hóa Kị).
  //     Bỏ qua Hóa bay theo can cung / vận hạn, và khi ngay sau cặp là vế "hoặc / hay" khác (vế thay thế).
  // Sao mang Hóa phải nằm trong tam phương tứ chính của cung đang đọc (kể cả cung trong điều kiện): "Văn Xương Hóa Kỵ ..." ở
  // cung Quan Lộc khi Văn Xương Hóa Kỵ nằm ở cung khác ngoài tam phương là câu của cách bố trí khác.
  const tptBranchSet = new Set(palaces.flatMap((p) => relatedBranches(p.branch, "tpt")));
  const inTpt = (star: string) => [...tptBranchSet].some((b) => palaceAt(facts, b)?.stars.has(star));
  const leadHoa = lowU.match(LEAD_HOA_RE);
  // Luận lá số gốc: câu MỞ BẰNG "X Hóa Kỵ" (kể cả khi vế sau nhắc "... nếu ở cung đại hạn") phải đúng Hóa sinh niên; Hóa bay theo
  // Can cung ("phi hóa", "can cung ... nhập") thì không kiểm ở đây. Mục vận hạn thì Hóa có thể là Hóa của đại vận / lưu niên.
  const periodWords = ctx.period ? /lưu niên|đại vận|đại hạn|tiểu hạn/ : null;
  if (leadHoa && !/phi hóa|can cung|nhập vào|hóa nhập/.test(lowU) && !periodWords?.test(lowU) && !/^\s*,?\s*(hoặc|hay)\s/.test(lowU.slice(leadHoa[0].length))) {
    const wanted = [leadHoa[2], ...(leadHoa[3].match(/lộc|quyền|khoa|kỵ|kị/g) ?? [])].map((h) => hoaType(h)!);
    const actual = [...facts.palaces.values()].map((p) => p.starMutagen.get(leadHoa[1])).find(Boolean);
    if (!actual || !wanted.includes(actual)) return { drop: `${label(leadHoa[1])} không ${wanted.map((w) => HOA_LABELS[w]).join("/")}` };
    if (palaces.length && !inTpt(leadHoa[1])) return { drop: `${label(leadHoa[1])} ${HOA_LABELS[actual]} không ở tam phương tứ chính` };
  }

  // 1) Giới tính: nhãn ở đầu câu; câu nhắc cả nam lẫn nữ mệnh thì giữ.
  // "Con trai / con gái" thường nói về con cái của chủ lá số -> không phải nhãn giới tính.
  const male = /^(nếu là |nếu |còn |với |đối với |riêng |lấy |hễ )?(nam mệnh|mệnh nam|nam giới|nam nhân|người nam|đàn ông)/.test(lowU);
  const female = /^(nếu là |nếu |còn |với |đối với |riêng |lấy |hễ )?(nữ mệnh|mệnh nữ|nữ giới|nữ nhân|người nữ|phụ nữ|đàn bà)/.test(lowU);
  // Câu nói cho cả hai giới ("nam nữ đều...", "cả nam mệnh và nữ mệnh", "nam mệnh lẫn nữ mệnh"). Chỉ nhắc giới kia làm
  // đối tượng ("Đàn ông thì ... hiểu tâm tư nữ giới") KHÔNG phải câu hai giới. Câu khuyên người yêu / đối tượng của người
  // có lá số này thì nhãn giới là của người kia -> không lọc theo giới.
  const both =
    /nam nữ|nữ nam|(nam|nữ) mệnh,? (lẫn|lân|và|với|hay|hoặc) (nữ|nam) mệnh|bất (luận|kể) nam|cả nam/.test(lowU) ||
    /(người yêu|đối tượng|bạn đời|người ấy)[^.]{0,50}(mệnh cách|cách cục|lá số) này/.test(lowU);
  if ((male || female) && !both && facts.gender) {
    if (facts.gender !== (male ? "male" : "female")) return { drop: `nói về ${male ? "nam" : "nữ"} mệnh` };
  }
  if (!male && !female && !both && facts.gender) {
    const implied = impliedGender(lowU, ctx.palaceKeys[0]);
    if (implied && implied !== facts.gender) return { drop: `nói về ${implied === "male" ? "nam" : "nữ"} mệnh (theo cách xưng hô)` };
    // Cung Phu Thê: người phối ngẫu cùng giới với chủ lá số -> câu viết cho giới kia.
    const spouse = ctx.palaceKeys[0] === "phu thê" ? spouseGender(lowU) : null;
    if (spouse && spouse === facts.gender) return { drop: `nói về ${spouse === "female" ? "vợ" : "chồng"} (câu viết cho ${spouse === "female" ? "nam" : "nữ"} mệnh)` };
  }

  // 2) Năm sinh: "Người sinh năm Canh, ..." - lấy mọi can được nêu trong câu, chỉ cần một can khớp.
  if (/^(người |nếu |ai |với người |riêng )?(sinh năm|tuổi)\s/i.test(u) && facts.yearStem) {
    const stems = new Set<string>();
    for (const m of u.matchAll(new RegExp(`(?:sinh năm|tuổi)\\s+((?:${STEM_WORD}(?:\\s*(?:,|hoặc|và|\\/)?\\s*))+)`, "giu"))) {
      for (const s of m[1].match(new RegExp(STEM_WORD, "gu")) ?? []) stems.add(stemKey(s));
    }
    if (stems.size && !stems.has(facts.yearStem)) return { drop: `nói về người sinh năm ${[...stems].map(label).join(", ")}` };
  }

  // Câu phủ định / nhượng bộ ở vế điều kiện: không suy ra được điều kiện rõ ràng -> giữ nguyên.
  // Chỉ xét phần điều kiện (trước "cho thấy / chủ về / thì..."): "Kình Dương hãm địa cho thấy ... không tốt" vẫn là
  // câu có điều kiện. Tên sao có chữ "không" (Địa Không, Thiên Không...) không phải phủ định.
  // Chỉ xét vế đầu (trước dấu phẩy): "Cự Môn hóa Kỵ tọa Mệnh, không thấy Sát tinh thì..." vẫn phải kiểm Hóa ở vế đầu.
  const negationScope = lowHead.split(/[,;]/)[0].split(/\s(?:cho thấy|chủ về|chủ|là|thì|nên|sẽ|dễ|được|bị|có thể|thường)\s/)[0];
  if (NEGATION_RE.test(withoutKhongStars(negationScope))) return {};
  // Câu hai vế / có vế ngược lại: một vế không khớp chưa chắc cả câu không áp dụng.
  const rest = lowU.slice(lowHead.length);
  const multiBranch = /(nếu không|bằng không|trái lại|ngược lại|còn nếu|,\s*nếu|;\s*nếu|,\s*gặp|,\s*còn gặp|,\s*thêm)/.test(rest) || (lowU.match(/\sthì\s/g) ?? []).length >= 2;

  // 0b) "Nếu cung có ly tâm tự hóa Kỵ...", "Hướng tâm Lộc thì..." ở vế điều kiện: đối chiếu tự hóa thật của cung
  //     (ly tâm: Can cung hóa sao trong cung; hướng tâm: Can cung hóa sao đối cung).
  const selfClaim = lowHead.match(/^(?:(?:nếu|khi|còn|mà)\s+)?(?:(?:1|một)\s+)?(?:cung\s+(?:này\s+)?)?(?:có\s+)?(?:tự hóa\s+)?(ly tâm|li tâm|hướng tâm)(?:\s+tự hóa)?\s+(?:hóa\s+)?(lộc|quyền|khoa|kỵ)(?![\p{L}])/u);
  if (selfClaim && palaces[0] && !multiBranch) {
    const type = hoaType(selfClaim[2])!;
    const inward = selfClaim[1] === "hướng tâm";
    const has = (inward ? palaces[0].inwardHoa : palaces[0].selfHoa).has(type);
    const name = `tự hóa ${inward ? "hướng tâm" : "ly tâm"} ${HOA_LABELS[type]}`;
    return has ? { applied: `Có ${name}` } : { drop: `cung không có ${name}` };
  }

  // 2b) Câu mở bằng chính tinh làm chủ ngữ mà chính tinh đó không có trong tam phương tứ chính (kể cả sao mượn):
  //     câu của trường hợp khác trong bài tổng hợp ("Liêm Trinh thì một anh em." ở cung chỉ có Phá Quân).
  // (Vế thêm điều kiện ", gặp X càng..." không đổi chủ ngữ - vẫn kiểm; chỉ vế thay thế thật sự - "nếu không", "ngược lại" - mới bỏ qua.)
  const subjectMain = MAIN_STAR_NAMES.map(lower).find((name) => lowU.startsWith(`${name} `) || lowU.startsWith(`sao ${name} `));
  if (subjectMain && palaces.length && !ALTERNATIVE_RE.test(rest) && !/^(sao )?tử vi (đẩu số|bắc phái|nam phái|học|là môn)/.test(lowU)) {
    const afterName = lowU.slice(lowU.indexOf(subjectMain) + subjectMain.length, lowU.indexOf(subjectMain) + subjectMain.length + 60);
    if (!/^[^,.;]{0,40}(hội|chiếu|đối|giáp|tam phương|tam hợp|xung|nếu)/.test(afterName)) {
      const tptMain = new Set(palaces.flatMap((p) => relatedBranches(p.branch, "tpt")).flatMap((b) => [...(palaceAt(facts, b)?.mainStars ?? [])]));
      if (!tptMain.has(starKey(subjectMain))) return { drop: `${label(subjectMain)} không có trong tam phương tứ chính` };
    }
  }

  // 2e) Tên tắt tinh hệ đồng cung ở đầu câu ("Tử Tướng cũng có ứng nghiệm...") - hai sao phải cùng cung (xem PAIR_ABBR).
  const abbr = lowU.match(PAIR_ABBR_RE);
  if (abbr && palaces.length && !ALTERNATIVE_RE.test(rest) && !/^cơ nguyệt đồng lương/.test(lowU)) {
    const [s1, s2] = PAIR_ABBR[abbr[1]];
    const together = palaces.some((p) =>
      [p, p.mainStars.size ? null : palaceAt(facts, relatedBranches(p.branch, "opposite")[0])].some((h) => Boolean(h?.stars.has(s1) && h.stars.has(s2))),
    );
    if (!together) return { drop: `không có ${label(s1)}, ${label(s2)} đồng cung` };
  }

  // 2c) Cách cục nêu tên trong câu phải đủ sao trên lá số (xem CACH_RULES).
  if (palaces.length && /cách/.test(lowU)) {
    for (const rule of CACH_RULES) {
      if (!rule.re.test(lowU)) continue;
      const branches = new Set(palaces.flatMap((p) => (rule.scope === "palace" ? [p.branch] : relatedBranches(p.branch, "tpt"))));
      const has = (ref: string) =>
        [...branches].some((b) => {
          const p = palaceAt(facts, b);
          return Boolean(p && (ref.startsWith("hoa:") ? p.mutagens.has(ref.slice(4) as HoaType) : p.stars.has(ref)));
        });
      if (!rule.all.every(has) || (rule.any && !rule.any.some(has))) {
        const needs = [...rule.all, ...(rule.any ? [rule.any.join(" hoặc ")] : [])].map((r) => r.replace("hoa:loc", "Hóa Lộc")).map(label);
        return { drop: `lá số không đủ sao cho cách cục được nêu (cần ${needs.join(", ")})` };
      }
    }
  }

  // 2d) Dòng của bảng liệt kê theo vị trí / độ sáng ("☆ Vị trí cung Mệnh là “Tỵ, Hợi”, ...", "☆ Độ vượng của Thất Sát là
  //     hãm, ..."): đối chiếu thẳng với chi của cung và độ sáng của sao trên lá số.
  const position = lowU.match(POSITION_RE);
  if (position) {
    const target = resolvePalace(facts, palaceKey(position[1]) ?? "");
    const branches = (position[2].match(new RegExp(BRANCH_WORD, "giu")) ?? []).map(branchKey);
    if (target && branches.length) {
      if (!branches.includes(target.branch)) return { drop: `cung ${target.label} không ở ${branches.map(label).join(", ")}` };
      // Vế nối tiếp ("..., và Thiên Đồng Hóa Kỵ, chủ...", "..., và cung Mệnh có: Thiên Mã") vẫn phải đúng.
      const rest = lowU.slice((position.index ?? 0) + position[0].length).replace(/^["”\s]*,?\s*(?:và\s+)?/u, "");
      const restResult = rest.length > 3 ? checkUnit(rest, facts, palaces, ctx) : {};
      if (restResult.drop) return restResult;
      return { applied: `${target.label} tại ${label(target.branch)}` };
    }
  }
  const degree = lowU.match(DEGREE_RE);
  if (degree) {
    const star = degree[1];
    const level: BrightnessLevel = brightWord(degree[2]) ?? "good";
    const holder = palaces.map((p) => (p.stars.has(star) ? p : palaceAt(facts, relatedBranches(p.branch, "opposite")[0]))).find((p) => p?.stars.has(star));
    const code = holder?.brightness.get(star) ?? "";
    if (code) {
      if (!brightnessMatches(level, code)) return { drop: `${label(star)} không ${brightnessLabel(level)}` };
      return { applied: `${label(star)} ${brightnessLabel(level)}` };
    }
  }

  // 3) Vị trí: đối chiếu "X ở cung B" với vị trí THẬT của sao / cung X trên lá số. Bỏ vế so sánh
  //    ("... không bằng ở cung Hợi", "so với khi ở Tý") và vị trí của người khác ("người mệnh cư Sửu").
  const thi = thiIndex(u);
  // Bỏ phần nói về người khác ("thích người mệnh cư Sửu", "xung khắc với người Mệnh ở Dần"), giờ sinh, năm.
  const withoutOthers = u
    .replace(/(người|với người)\s+(có\s+)?(mệnh\s+)?(cư|ở|tại|tuổi)\s+[^,.;]*/gi, " ")
    .replace(/giờ\s+\S+(\s*(,|hoặc|và)\s*\S+)*/gi, " ")
    .replace(/cung Thân|Thân cư|Mệnh,?\s*Thân|Thân,?\s*Mệnh|năm\s+\S+/gi, " ");
  // Vế so sánh ("... không bằng ở cung Hợi", "tốt hơn ở Thân") không phải điều kiện.
  const locRegion = withoutOthers.slice(0, thi > 0 ? thi : withoutOthers.length).split(/\s(?:so với|không bằng|hơn so với|khác với|còn hơn|tốt hơn|xấu hơn|kém hơn|giống với|giống như|hơn)\s/i)[0];
  const readingBranches = new Set(palaces.flatMap((p) => (p.mainStars.size ? [p.branch] : [p.branch, ...relatedBranches(p.branch, "opposite")])));
  const ownBranches = new Set(palaces.map((p) => p.branch));
  // Câu có nêu chi của chính cung đang đọc (cặp "Tỵ Hợi", "đặc biệt ở cung Mùi", so sánh "cung Tị tốt hơn cung Hợi")
  // hoặc câu tổng quát / tham chiếu ("chỉ là một ví dụ", "12 cung đều", "tham khảo đoạn...") -> không lọc theo vị trí.
  const mentionsOwnBranch = (withoutOthers.match(new RegExp(BRANCH_WORD, "gu")) ?? []).some((b) => ownBranches.has(branchKey(b)));
  const generalStatement = /chỉ là (một )?ví dụ|12 cung|mười hai cung|tham khảo|trên thực tế|bất kể ở cung|dù ở cung/.test(lowU);
  const locChecks: boolean[] = [];
  let located = mentionsOwnBranch;
  let prevEnd = 0;
  for (const match of generalStatement || mentionsOwnBranch ? [] : locRegion.matchAll(LOCATION_LIST_RE)) {
    const index = match.index ?? 0;
    // Vị trí quyết định câu thường ở vế đầu; vị trí ở vế đuôi ("..., càng tốt nếu ở Sửu Mùi") không lọc cả câu.
    if (index > 90) break;
    const branches = (match[1].match(new RegExp(BRANCH_WORD, "gu")) ?? []).map(branchKey);
    const before = locRegion.slice(Math.max(prevEnd, index - 60), index);
    if (/(không|chẳng|chưa|trừ)\s*$/.test(withoutKhongStars(scanText(before)).slice(-12))) {
      prevEnd = index + match[0].length;
      continue; // "không ở cung Sửu Mùi" - điều kiện phủ định, không kiểm theo nghĩa khẳng định
    }
    const after = locRegion.slice(index + match[0].length, index + match[0].length + 30).split(/[,;.]/)[0];
    prevEnd = index + match[0].length;
    // Chủ ngữ của vị trí = vế ngay trước ("..., Lộc Tồn cư Tý" -> Lộc Tồn), không phải mọi sao trong câu.
    const beforeClause = before.split(/[,;:]/).pop() ?? before;
    const subjectStars = findStarsIn(beforeClause, beforeClause).filter((s) => !s.startsWith("hoa:"));
    const palaceName = (scanText(beforeClause).match(new RegExp(PALACE_NAME_RE.source + "(?:\\s+cung)?\\s*(?:an\\s+)?(?:tọa|ở|tại|cư|đóng)?\\s*$", "u")) ??
      scanText(after).match(/^\s*(?:thủ|tọa|ở)\s+(?:cung\s+)?(mệnh|phụ mẫu|phúc đức|điền trạch|quan lộc|sự nghiệp|nô bộc|giao hữu|thiên di|tật ách|tài bạch|tử tức|tử nữ|phu thê|huynh đệ)/u))?.[1];
    const palace = palaceName ? facts.palaces.get(palaceKey(palaceName) ?? "") : undefined;
    let ok: boolean;
    if (subjectStars.length) ok = branches.some((b) => subjectStars.every((s) => starBranches(facts, s).includes(b)) && (!palace || palace.branch === b));
    else if (palace) ok = branches.includes(palace.branch);
    else ok = branches.some((b) => readingBranches.has(b));
    locChecks.push(ok);
    if (ok) located = true;
  }
  // Chỉ bỏ khi MỌI vị trí được nêu đều không đúng với lá số.
  if (locChecks.length && !located) {
    const named = [...locRegion.matchAll(LOCATION_LIST_RE)].map((m) => m[1]).join("/");
    return { drop: `nói về vị trí ${named}` };
  }

  // 4) Tứ Hóa của chính tinh ở vế điều kiện: "Cự Môn Hóa Lộc là tốt", "Nếu Thiên Cơ hóa Kỵ, hoặc Vũ Khúc hóa Kỵ..."
  const conditional = /^(nếu|khi|trường hợp|gặp|thêm|được|lại|còn|mà|nhưng|có)\s/.test(lowU);
  const lead = lowHead.replace(/^((nếu|khi|trường hợp|gặp|thêm|được|lại|còn|mà|nhưng|và|có|là)\s+)+/, "");
  // "A hoặc B hóa Lộc" (nhiều sao chung một Hóa) và "A Hóa Lộc, Hóa Quyền hay Hóa Khoa" (nhiều Hóa).
  // Sao có thể mang Tứ Hóa sinh niên: 14 chính tinh + Văn Xương, Văn Khúc, Tả Phù, Hữu Bật.
  const MAIN_ALT = HOA_STAR_ALT;
  const pairRe = new RegExp(`((?:${MAIN_ALT})(?:\\s*(?:,|hoặc|hay)\\s*(?:${MAIN_ALT}))*)\\s+${HOA_LIST}`, "gu");
  // Hóa bay theo can cung / đại vận / lưu niên ("phi Hóa", "[can cung] nhập") không phải Tứ Hóa sinh niên.
  const flyingHoa = /phi hóa|can cung|nhập vào|hóa nhập|lưu niên|đại vận|đại hạn|tiểu hạn/.test(lowU);
  // Vế điều kiện của Hóa: tới " thì " (không cắt ở dấu phẩy - "Tử Vi Hóa Quyền, hoặc Phá Quân Hóa Lộc").
  // Phần liệt kê chi tiết sau "cụ thể / phân biệt" là trường hợp con, không quyết định cả câu.
  const hoaRegion = scanText(thi > 0 && thi < 200 ? u.slice(0, thi) : u.slice(0, 160)).split(/cụ thể|phân biệt/)[0];
  const pairs = flyingHoa ? [] : [...hoaRegion.matchAll(pairRe)].filter((m) => m.index! < 120);
  if (pairs.length && (conditional || lead.startsWith(pairs[0][1].split(/\s*(?:,|hoặc|hay)\s*/)[0]))) {
    const results = pairs.map((m) => {
      const stars = m[1].split(/\s*(?:,|hoặc|hay)\s*/).map(starKey);
      const wanted = [m[2], ...(m[3] ?? "").split(/\s*(?:,|hoặc|hay|và)\s*/).map((s) => s.replace(/^(hoặc|hay|và)\s+/, "").replace(/^hóa\s+/, ""))]
        .map(hoaType)
        .filter(Boolean) as HoaType[];
      const hits = stars
        .map((star) => ({ star, actual: [...facts.palaces.values()].map((p) => p.starMutagen.get(star)).find(Boolean) ?? null }))
        .filter((s) => s.actual && wanted.includes(s.actual) && (!palaces.length || inTpt(s.star)));
      return { star: stars[0], stars, wanted, actual: hits[0]?.actual ?? null, hitStar: hits[0]?.star, ok: hits.length > 0 };
    });
    // Nhiều cặp sao-Hóa trong một câu thường là các trường hợp song song -> chỉ cần một cặp đúng,
    // trừ khi nối bằng "và / cùng / đồng thời".
    const andJoined = pairs.length > 1 && /\s(và|cùng|đồng thời)\s/.test(hoaRegion.slice(pairs[0].index! + pairs[0][0].length, pairs[pairs.length - 1].index!));
    let ok = andJoined ? results.every((r) => r.ok) : results.some((r) => r.ok);
    // "Tham Lang Hóa Kỵ hoặc thêm Tứ Sát", "Đà La, Linh Tinh đồng độ, hoặc Thái Dương Hóa Kị":
    // vế Hóa không đúng nhưng vế sao đi kèm (OR) có trong tam phương tứ chính -> vẫn áp dụng.
    // Chỉ khi "hoặc / hay" đứng ngay sau cặp sao-Hóa (vế thay thế), không phải "đồng độ hoặc hội hợp" (cách gặp).
    const orAfterPair = pairs.some((m) => /^\s*,?\s*(hoặc|hay)\s/.test(hoaRegion.slice(m.index! + m[0].length)));
    if (!ok && orAfterPair) {
      const pairStars = new Set(results.flatMap((r) => r.stars));
      const others = findStarsIn(hoaRegion.replace(pairRe, " "), u, true).filter((ref) => !ref.startsWith("hoa:") && !pairStars.has(ref));
      const tptBranches = new Set(palaces.flatMap((p) => relatedBranches(p.branch, "tpt")));
      const present = others.filter((ref) => [...tptBranches].some((b) => palaceAt(facts, b)?.stars.has(ref)));
      if (present.length) return { applied: `Có ${present.map(label).join(", ")}` };
    }
    if (!ok) {
      const failed = results.filter((r) => !r.ok).map((r) => `${r.stars.map(label).join("/")} không ${r.wanted.map((w) => HOA_LABELS[w]).join("/")}`);
      return { drop: failed.join(", ") };
    }
    return { applied: results.filter((r) => r.ok).map((r) => `${label(r.hitStar!)} ${HOA_LABELS[r.actual!]}`).join(", ") };
  }

  // 5) Độ sáng ở đầu câu: "Ở vượng địa, ...", "Hỏa Tinh lạc hãm, ...", "Nhập miếu thêm cát tinh ..."
  //    Bỏ qua khi: câu hai vế / nói cả hai chiều, nhượng bộ ("nhập miếu cũng..."), hoặc câu đang mô tả
  //    đúng vị trí này ("Thiên Cơ lạc hãm ở hai cung Sửu hoặc Mùi" với cung tại Sửu).
  const brightHead = lowHead.replace(/^sao\s+/, "").slice(0, 80); // "Sao Thái Âm lạc hãm..." cũng là câu nêu độ sáng
  // (kể cả "Nếu nhập cung hãm, thì...", "ở đất hãm thì...", "cư cung miếu...")
  const startsBright = /^(ở |nếu |khi |gặp |tại |cư )?((nhập|ở|cư|tại|đóng|vào) (cung|đất|vị trí|chỗ) )?(nhập miếu|miếu địa|miếu vượng|vượng địa|đắc địa|lạc hãm|hãm địa|hãm vị|bình hòa|miếu|vượng|hãm|đắc)([^\p{L}]|$)/u.test(brightHead);
  // "Hỏa Tinh lạc hãm...", "Hỏa Tinh ở hãm địa...", "Thiên Cơ bình hòa..."
  const namedBright = STAR_NAMES_DESC.find((name) => brightHead.startsWith(name) && /^\s*(?:(?:ở|tại|cư|đóng)\s+)?(nhập miếu|miếu|vượng|đắc địa|lạc hãm|hãm|bình hòa)/.test(brightHead.slice(name.length)));
  const concessive = /(miếu|vượng|đắc|hãm)[\p{L}\s]{0,12}\s(cũng|vẫn)\s/u.test(brightHead);
  // "hãm địa hay hội sát tinh", "nhập miếu hóa cát tinh hoặc hội chiếu cát tinh": độ sáng chỉ là một vế của OR.
  const brightOr = /\s(hay|hoặc)\s/.test(lowHead);
  // Sao phụ được nêu độ sáng ở đầu câu ("Kình Dương hãm địa cho thấy...") mà không ở cung này -> câu tả lá số khác.
  if (namedBright && !MAIN_STARS.has(namedBright) && !located && !/hội|chiếu|đối cung|tam phương|tam hợp|giáp/.test(lowU)) {
    const here = palaces.some((p) => p.stars.has(namedBright) || (!p.mainStars.size && palaceAt(facts, relatedBranches(p.branch, "opposite")[0])?.stars.has(namedBright)));
    if (!here && [...facts.palaces.values()].some((p) => p.stars.has(namedBright))) return { drop: `${label(namedBright)} không ở cung này` };
  }
  if ((startsBright || namedBright) && !located && !multiBranch && !concessive && !brightOr && brightnessClaim(lowU) !== null) {
    const level = brightnessClaim(brightHead.replace(/hãm vị/, "hãm địa"));
    const star = namedBright ?? (ctx.conditionStars.length === 1 ? ctx.conditionStars[0] : null);
    if (level && star) {
      const holder = palaces.map((p) => (p.stars.has(star) ? p : palaceAt(facts, relatedBranches(p.branch, "opposite")[0]))).find((p) => p?.stars.has(star));
      const code = holder?.brightness.get(star) ?? "";
      if (code) {
        if (!brightnessMatches(level, code)) return { drop: `${label(star)} không ${brightnessLabel(level)}` };
        return { applied: `${label(star)} ${brightnessLabel(level)}` };
      }
    }
  }
  // 5b) Câu tả ĐÚNG vị trí này kèm độ sáng theo bảng của nguồn ("Vũ Khúc ở Sửu, Mùi, Thìn, Tuất nhập miếu, ...") - người xem
  //     thấy độ sáng trên lá số, nên độ sáng câu nêu (một mức duy nhất) phải khớp độ sáng thật của chính tinh ở cung này.
  if (located && subjectMain && !multiBranch && !concessive && !brightOr) {
    const level = brightnessClaim(lowU);
    const star = starKey(subjectMain);
    const holder = palaces.map((p) => (p.stars.has(star) ? p : palaceAt(facts, relatedBranches(p.branch, "opposite")[0]))).find((p) => p?.stars.has(star));
    const code = holder?.brightness.get(star) ?? "";
    if (level && code && !brightnessMatches(level, code)) return { drop: `${label(star)} không ${brightnessLabel(level)} (câu nêu độ sáng tại vị trí này)` };
  }
  // Câu đúng vị trí vẫn phải qua các kiểm tra sao đi kèm bên dưới ("Thêm Kình Dương, Đà La: tại cung Dần, Ngọ...").

  // 6a) "Người có sao Thái Dương tọa cung Phúc Đức...", "Liêm Trinh thủ Mệnh...", "Xương Khúc tọa Mệnh/Thân" - sao phải
  //     thật sự ở cung được nêu (một trong các cung nếu nêu "Mệnh/Thân"; cung vô chính diệu mượn được sao đối cung).
  const seatMatch = lowU.slice(0, 120).match(SEAT_RE);
  const seatRev = seatMatch ? null : lowU.slice(0, 120).match(SEAT_REV_RE);
  if ((seatMatch || seatRev) && !multiBranch) {
    const subject = seatMatch ? seatMatch[1] : seatRev![2];
    const refs = STAR_GROUPS.find(([re]) => re.test(subject))?.[1].filter((s) => !s.startsWith("hoa:")) ?? [subject];
    // "tọa mệnh cung Thân" = ở Mệnh hoặc Thân (bài Cung Thân chép từ bài Mệnh).
    const seatNames = seatMatch ? [seatMatch[2] ?? seatMatch[3], seatMatch[4] ?? seatMatch[5]] : [seatRev![1]];
    const seats = seatNames.filter(Boolean).map((name) => resolvePalace(facts, palaceKey(name) ?? "")).filter((p): p is PalaceFacts => Boolean(p));
    const holds = (p: PalaceFacts, ref: string) => p.stars.has(ref) || (!p.mainStars.size && Boolean(palaceAt(facts, relatedBranches(p.branch, "opposite")[0])?.stars.has(ref)));
    const onChart = refs.filter((ref) => [...facts.palaces.values()].some((p) => p.stars.has(ref)));
    if (seats.length && onChart.length && !seats.some((p) => onChart.some((ref) => holds(p, ref)))) {
      return { drop: `${label(subject)} không ở cung ${seats.map((p) => p.label).join("/")}` };
    }
  }

  // 6c) "Một mình thủ cung", "X độc tọa", "đơn thủ" ở đầu câu: chính tinh phải là chính tinh duy nhất của cung;
  //     sao phụ "một mình" nghĩa là cung không có chính tinh.
  const solo = lowU.slice(0, 80).match(SOLO_RE);
  if (solo && !multiBranch && palaces[0]) {
    const subject = solo[1] ?? (ctx.conditionStars.length === 1 ? ctx.conditionStars[0] : null);
    const home = palaces[0];
    const seat = subject && !home.stars.has(subject) && !home.mainStars.size ? palaceAt(facts, relatedBranches(home.branch, "opposite")[0]) : home;
    if (subject && seat?.stars.has(subject)) {
      const alone = MAIN_STARS.has(subject) ? seat.mainStars.size === 1 : home.mainStars.size === 0;
      if (!alone) return { drop: `${label(subject)} không độc tọa` };
    }
  }

  // 6d) Cặp sao trong ngoặc kép ở đầu câu ("Liêm Trinh, Thiên Tướng" được..., “Tử Vi, Phá Quân” ...) là tổ hợp đồng cung.
  const quoted = u.match(/^["“]([^"”]{3,60})["”]/);
  if (quoted && !located) {
    const refs = findStarsIn(quoted[1], quoted[1], true).filter((ref) => !ref.startsWith("hoa:"));
    if (refs.length >= 2 && refs.every((ref) => [...facts.palaces.values()].some((p) => p.stars.has(ref)))) {
      const together = palaces.some((p) => {
        const holders = [p, p.mainStars.size ? null : palaceAt(facts, relatedBranches(p.branch, "opposite")[0])].filter((h): h is PalaceFacts => Boolean(h));
        return refs.every((ref) => holders.some((h) => h.stars.has(ref)));
      });
      if (!together) return { drop: `không có ${refs.map(label).join(", ")} đồng cung` };
    }
  }

  // 6b) Câu mở bằng tên sao + "đồng độ / đồng cung với ...": "Phá Quân đồng độ với Hỏa Tinh, Linh Tinh...",
  //     "Lộc Tồn với Tả Phù, Hữu Bật đồng cung...", "Phụ Bật đồng cung..." -> các sao đi kèm phải cùng cung.
  if (!multiBranch && /^[^,;]{0,40}(đồng độ|đồng cung|cùng cung)/.test(lowU) && !/^(nếu |khi |gặp |thêm |có |hội )/.test(lowU) && !located) {
    const clause = starListHead(u);
    const refs = findStarsIn(clause, clause, true).filter((ref) => !ref.startsWith("hoa:") && [...facts.palaces.values()].some((p) => p.stars.has(ref)));
    const conditionSet = new Set(ctx.conditionStars);
    const companions = refs.filter((ref) => !conditionSet.has(ref));
    // Câu còn vế "hội / chiếu / đối nhau / hoặc" (vd "Hỏa Linh hội cũng là quý cách") -> không chỉ xét cùng cung.
    if (companions.length && !/hội|chiếu|tam phương|đối cung|đối nhau|giáp|hoặc|\.\.\.|…/.test(lowU)) {
      const here = new Set(palaces.map((p) => p.branch));
      const present = companions.filter((ref) => [...here].some((b) => palaceAt(facts, b)?.stars.has(ref)));
      if (!present.length) return { drop: `không có ${companions.map(label).join(", ")} đồng cung` };
    }
  }

  // 6) Sao đi kèm ở vế điều kiện: "Thêm Kình Đà thì...", "Nếu gặp Hóa Kỵ, Địa Không...", "Hội Tả Hữu ..."
  if (!multiBranch && /^(nếu |khi |lại |còn |mà |nhưng |và )*(gặp|thêm|hội|gia hội|được|kiêm|thấy|có|đồng cung với|đồng độ với|cùng cung với|kèm)\s/.test(lowU)) {
    const listHead = starListHead(u);
    const lowList = scanText(listHead);
    // "Có thể...", "Được người...": động từ "có / được / thấy" chỉ là điều kiện khi theo sau là tên sao.
    const afterVerb = lowList.replace(/^(nếu |khi |lại |còn |mà |nhưng |và )*(có|được|thấy)\s+/, "");
    const weakVerb = afterVerb !== lowList.replace(/^(nếu |khi |lại |còn |mà |nhưng |và )*/, "");
    const firstWords = afterVerb.split(/[\s,]+/).slice(0, 3).join(" ");
    const startsWithStar = findStarsIn(firstWords, listHead).length > 0 || /^(sao|các sao|hóa)\s/.test(afterVerb);
    // Hóa bay theo can cung không kiểm bằng Tứ Hóa sinh niên -> bỏ khỏi danh sách cần có.
    // Sao lá số không an (không có ở cung nào, vd Thiên Nguyệt) là "không rõ", không phải "không có".
    // Sao ẩn khỏi lá số hiển thị coi như đã an nhưng không có ở cung nào.
    const computed = (ref: string) => ref.startsWith("hoa:") || HIDDEN_STARS.has(ref) || [...facts.palaces.values()].some((p) => p.stars.has(ref));
    // Vế phủ định trong danh sách ("Thêm sát, không có cát tinh, ...") là điều kiện VẮNG MẶT, không phải cần có.
    const listParts = listHead.split(",");
    const negated = (part: string) => /^\s*(không|chẳng|vô)\s/.test(scanText(part));
    const positiveHead = listParts.filter((part) => !negated(part)).join(",");
    const absentRefs = listParts.filter(negated).flatMap((part) => findStarsIn(part, part, true)).filter((ref) => !(flyingHoa && ref.startsWith("hoa:")) && computed(ref));
    const refs = (weakVerb && !startsWithStar ? [] : findStarsIn(positiveHead, positiveHead, true)).filter((ref) => !(flyingHoa && ref.startsWith("hoa:")) && computed(ref));
    // Danh sách mở ("..., v.v.", "…") hoặc có vế "hoặc" chỉ sang cung khác: không đủ chắc để bỏ.
    const openList = /\.\.\.|…|v\.v|vân vân/.test(lowU.slice(0, listHead.length + 12)) || /hoặc\s+(cung\s+)?(mệnh|thân)\s+có/.test(lowU);
    if ((refs.length || absentRefs.length) && !/giáp/.test(lowList) && !openList) {
      const samePalaceOnly = /đồng cung|đồng độ|cùng cung|tọa thủ/.test(lowList) && !/hội|chiếu|tam phương|tam hợp/.test(lowList);
      const scope = new Set(palaces.flatMap((p) => (samePalaceOnly ? [p.branch] : relatedBranches(p.branch, "tpt"))));
      const inScope = (ref: string) =>
        [...scope].some((b) => {
          const p = palaceAt(facts, b);
          if (!p) return false;
          return ref.startsWith("hoa:") ? p.mutagens.has(ref.slice(4) as HoaType) : p.stars.has(ref);
        });
      const name = (ref: string) => (ref.startsWith("hoa:") ? HOA_LABELS[ref.slice(4) as HoaType] : label(ref));
      const presentAbsent = absentRefs.filter(inScope);
      if (presentAbsent.length) return { drop: `có ${presentAbsent.map(name).join(", ")} (câu nói trường hợp không có)` };
      if (refs.length) {
        const present = refs.filter(inScope);
        if (!present.length) return { drop: `không có ${refs.map(name).join(", ")} ${samePalaceOnly ? "đồng cung" : "trong tam phương tứ chính"}` };
        return { applied: `Có ${present.map(name).join(", ")}` };
      }
    }
  }
  return located ? { applied: LOCATED } : {};
}

const LOCATED = "Đúng vị trí trên lá số";

// Câu / dòng nối tiếp ý câu trước ("Đồng thời...", "Nhưng...", bắt đầu bằng chữ thường do crawl ngắt dòng giữa câu):
// câu trước bị lược thì câu này không còn chỗ dựa.
const CONTINUATION_RE = /^(đồng thời|hơn nữa|thêm vào đó|lại còn|ngoài ra|nhưng|tuy nhiên|tuy vậy|song|mà|nên|cho nên|vì vậy|vì thế|do đó|như vậy|cũng|càng|hoặc|tức là|nghĩa là|lúc này|khi đó|người sinh năm này|năm này|nếu lại|nếu thêm|nếu còn|lại gặp|lại thêm)(?![\p{L}])/u;
// Câu mở dòng nêu CHỦ THỂ của cả dòng ("Người có sao Thiên Tướng tọa mệnh...", "“Liêm Trinh, Tham Lang” rất ưa..."):
// câu đó sai với lá số thì các câu sau cùng dòng (vẫn tả chủ thể đó) cũng bỏ.
const LINE_SUBJECT_RE = /^(?:người\s|["“][^"”]{3,60}["”])/u;
const SEVERE_DROP = "câu phán nặng không kèm điều kiện đúng với lá số";
/** Tiêu đề mục viết hoa ("PHÂN TÍCH VẬN SỐ SỰ NGHIỆP", "DUNG MẠO VÀ TÍNH CÁCH"). */
const isUpperTitle = (line: string) => {
  if (line.length > 100 || /[.!?;]$/.test(line)) return false;
  const letters = line.replace(/[^\p{L}]/gu, "");
  return letters.length >= 6 && [...letters].filter((c) => c === c.toUpperCase() && c !== c.toLowerCase()).length / letters.length >= 0.7;
};
/** Lý do lược là cách bố trí sao / vị trí / Hóa / độ sáng không có trên lá số (không phải giới tính, năm sinh, lời văn...). */
const isScopeDrop = (reason: string) =>
  reason !== SEVERE_DROP && !/^(nói về (nam|nữ|vợ|chồng|người sinh)|vế nói về|câu |lời khen|dẫn chiếu|tiếp nối|thuộc |mảnh câu)/u.test(reason);
// Bài liệt kê tính chất chung rồi vế "Thêm Lục Sát thì ... sự nghiệp thấp": khi lá số CÓ sát tinh trong tam phương tứ chính,
// lời khen chung ngắn không điều kiện ("Vinh hoa, phú quý.", "Một đời sự nghiệp thuận lợi.") trái với chính quy tắc của bài.
const SAT_MODIFIER_RE =
  /^[\s\-•*+☆★]*(?:nếu\s+)?(?:thêm|gặp|hội|gia hội|có)\s+(?:các\s+)?(?:lục sát|tứ sát|sát tinh|sao sát|sát diệu|hung tinh|kình đà|dương đà|hỏa linh|không kiếp|kình dương|đà la|hỏa tinh|linh tinh|địa không|địa kiếp)[^.\n]{0,80}(ưu lo|khó khăn|vất vả|trắc trở|phá bại|phá tán|thất bại|thấp|nghèo|hình khắc|tai họa|tai ương|bệnh|cô độc|bất lợi|kém|giảm|hao|long đong|lận đận|không tốt|xấu)/u;
const BASE_PRAISE_RE = /phú quý|giàu có|đại phú|đại quý|song toàn|hiển đạt|phát đạt|vinh hiển|vinh hoa|sớm đạt|kiêm toàn|dồi dào|quyền cao chức trọng|làm quan lớn|thuận lợi|hóa cát|được may/u;
const PRAISE_DROP = "lời khen chung trái với vế gặp sát tinh của bài (lá số có sát tinh)";
const isContinuation = (s: string) => {
  const t = stripBullet(s);
  return /^\p{Ll}/u.test(t) || CONTINUATION_RE.test(scanText(t));
};
// Nhãn phạm vi đầu dòng ("Người sinh năm Giáp: ...", "Nữ mệnh: ...") áp cho cả dòng.
const SCOPE_LABEL = /^(người sinh năm|sinh năm|tuổi|người sinh giờ|sinh giờ|nam mệnh|nữ mệnh|mệnh nam|mệnh nữ)[^:]{0,40}:/u;

// Câu phán nặng (chết, yểu, sảy thai, dâm đãng, tù tội...) chỉ giữ khi chính câu nêu điều kiện riêng và điều kiện
// đó đúng trên lá số - không suy từ một sao đứng riêng.
// Kể cả lời chê bai nhân cách ("gian xảo độc ác", "ăn nói quỷ quyệt") - không phán xét người xem khi không có điều kiện.
const SEVERE_CLAIM = /(^|[^\p{L}])(chết|tử vong|yểu(?! điệu)|đoản thọ|khó sống lâu|sảy thai|hư thai|tuyệt tự|dâm đãng|dâm loạn|dâm tiện|lưu manh|đê tiện|thấp hèn|hạ tiện|trụy lạc|tàn tật|tù tội|lao tù|tù ngục|ngồi tù|tự tử|gian xảo|độc ác|quỷ quyệt|xảo trá|giả dối|lang độc|hèn hạ|bỉ ổi|bất nhân|bất nghĩa)([^\p{L}]|$)/u;
const SEVERE_IDIOM = /sợ chết|mệt chết|chết khiếp|chết mê|chết mệt|chết đi sống lại|không (?:chủ về |phải |đến nỗi |bị |gây )?(?:chết|tù)/u;
// Phán tuyệt đối về điều xấu ("Luôn luôn là khuynh hướng... hình khắc chia ly", "tất ly hôn") - cùng quy tắc câu phán nặng.
const ABSOLUTE_HARM = /(luôn luôn|tất sẽ|ắt sẽ|nhất định|chắc chắn|tuyệt đối|(^|[^\p{L}])tất)[^.;]{0,40}(chia ly|ly hôn|ly dị|hình khắc|phá sản|bại sản|khuynh gia|tai họa|tan vỡ|ở góa|góa bụa)/u;
export function isSevereClaim(text: string): boolean {
  const low = scanText(text);
  return (SEVERE_CLAIM.test(low) && !SEVERE_IDIOM.test(low)) || ABSOLUTE_HARM.test(low) || /(^|[^\p{L}])xu nịnh([^\p{L}]|$)/u.test(low);
}

// Câu có vế riêng cho từng giới: "Nam thì phong lưu, nữ thì ...", "trai lấy vợ ..., gái lấy chồng ..." -> giữ vế đúng giới.
const CLAUSE_GENDER = /^(?:nếu là |nếu |còn |với |đối với |riêng )?(nam mệnh|mệnh nam|nam giới|nam nhân|đàn ông|người nam|nữ mệnh|mệnh nữ|nữ giới|nữ nhân|đàn bà|phụ nữ|người nữ|(?:nam|nữ|trai|gái)(?=\s+(?:thì|lấy|gặp|chủ|nên|dễ|hay|tất|ắt|mà|là|được|bị|có)(?![\p{L}])))(?![\p{L}])/u;
function splitGenderClauses(sentence: string, gender: ChartFacts["gender"], palaceKeyName?: string): { text: string; removed: string[] } {
  if (!gender || !palaceKeyName || !SELF_PALACES.has(palaceKeyName)) return { text: sentence, removed: [] };
  const parts = sentence.split(/(?<=[,;])\s+/);
  if (parts.length < 2) return { text: sentence, removed: [] };
  const labels = parts.map((part) => {
    const m = scanText(stripBullet(part)).match(CLAUSE_GENDER);
    return m ? (/^(nam|mệnh nam|đàn ông|người nam|trai)/.test(m[1]) ? "male" : "female") : null;
  });
  if (!labels.includes("male") || !labels.includes("female")) return { text: sentence, removed: [] };
  let current: ChartFacts["gender"] = null;
  const kept: string[] = [];
  const removed: string[] = [];
  parts.forEach((part, i) => {
    current = labels[i] ?? current;
    (current === null || current === gender ? kept : removed).push(part);
  });
  const text = kept.length ? kept.join(" ").replace(/[,;]\s*$/, ".") : "";
  return { text: text.replace(/^(\p{Ll})/u, (c) => c.toUpperCase()), removed };
}

export function refineTextForChart(text: string, facts: ChartFacts, ctx: RefineContext): RefineResult | null {
  const palaces = ctx.palaceKeys.map((key) => resolvePalace(facts, key)).filter((p): p is PalaceFacts => Boolean(p));
  const applied = new Set<string>();
  const dropped: RefineResult["dropped"] = [];
  const outLines: string[] = [];
  // Câu cuối vừa xét bị lược (để bỏ câu / dòng nối tiếp nó); mục có tiêu đề "...:" bị lược (bỏ các dòng thuộc mục).
  let lastDropped = false;
  let sectionDropped = false;
  // Mục liệt kê ("Sáu) Vũ Khúc Phá Quân đồng cung...") bị lược câu mở -> các dòng không đánh số tiếp theo thuộc mục đó cũng bỏ.
  let itemDropped = false;
  const satCase =
    Boolean(palaces[0]) &&
    String(text || "").split("\n").some((line) => SAT_MODIFIER_RE.test(scanText(line))) &&
    relatedBranches(palaces[0].branch, "tpt").some((b) => SAT_STARS.some((s) => palaceAt(facts, b)?.stars.has(s)));
  // Câu mở của mục (dòng đầu sau tiêu đề "PHÂN TÍCH VẬN SỐ SỰ NGHIỆP" / "...:") nêu cách bố trí sao mà lá số KHÔNG có
  // ("Người có chòm sao Thiên Cơ ở cung Sự Nghiệp...") -> cả mục viết cho cách bố trí đó, bỏ cả mục (kể cả tiêu đề).
  // Không áp khi dòng đầu là gạch đầu dòng (mỗi gạch là một trường hợp riêng) hay lý do là giới tính / năm sinh.
  let headingOut = -1;
  let sectionLead = false;
  for (const line of String(text || "").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      outLines.push(line);
      sectionDropped = false;
      itemDropped = false;
      continue;
    }
    const heading = /:\s*$/.test(trimmed) && trimmed.length <= 120;
    const titleLine = heading || isUpperTitle(trimmed);
    if (sectionDropped && !titleLine) {
      dropped.push({ sentence: trimmed, reason: "thuộc mục đã lược" });
      continue;
    }
    sectionDropped = false;
    const isSectionLead = sectionLead && !titleLine;
    if (!titleLine) sectionLead = false;
    const enumItem = ENUM_ITEM_RE.test(trimmed);
    if (enumItem || heading) itemDropped = false;
    else if (itemDropped) {
      dropped.push({ sentence: trimmed, reason: "thuộc mục liệt kê đã lược" });
      continue;
    }
    if (lastDropped && isContinuation(trimmed)) {
      dropped.push({ sentence: trimmed, reason: "tiếp nối đoạn đã lược" });
      continue;
    }
    // Tách câu ở ". " / "; " nhưng không cắt bên trong ngoặc.
    // Dấu chấm dính liền chữ hoa (".Khoa", ".Nữ" - lỗi crawl) cũng là ranh giới câu.
    // Số thứ tự đầu dòng ("4. Tự cao...") đi liền với câu của nó - không tách thành câu riêng (lược câu thì còn trơ "4.").
    const sentences = line
      .replace(/([\p{Ll}\d)"”])\.(?=\p{Lu})/gu, "$1. ")
      .split(/(?<=[.!?])\s+(?=[\p{Lu}\d"“(*\-•★])|(?<=;)\s+(?![^(]*\))/u)
      .reduce<string[]>((acc, s) => {
        if (acc.length && /^(?:\(?\d{1,2}[.)]|[a-zđ][.)]|[-•*+☆★])$/iu.test(acc[acc.length - 1].trim())) acc[acc.length - 1] += ` ${s}`;
        else acc.push(s);
        return acc;
      }, []);
    const kept: string[] = [];
    let labelDropped = false;
    sentences.forEach((raw, index) => {
      if (sectionDropped) {
        dropped.push({ sentence: raw, reason: "thuộc mục đã lược" });
        return;
      }
      if (labelDropped) {
        // Câu mở chủ thể mới trong cùng dòng ("... . Người nam thì ...", "Người sinh năm Ất: ...") -> xét lại từ câu đó.
        const lead = scanText(stripBullet(raw));
        if (!(LINE_SUBJECT_RE.test(lead) || SCOPE_LABEL.test(lead) || CLAUSE_GENDER.test(lead))) {
          dropped.push({ sentence: raw, reason: "thuộc nhãn đầu dòng đã lược" });
          return;
        }
        labelDropped = false;
      }
      if (index > 0 && lastDropped && isContinuation(raw)) {
        dropped.push({ sentence: raw, reason: "tiếp nối câu đã lược" });
        return;
      }
      const split = splitGenderClauses(raw, facts.gender, ctx.palaceKeys[0]);
      for (const part of split.removed) dropped.push({ sentence: part, reason: `vế nói về ${facts.gender === "male" ? "nữ" : "nam"} mệnh` });
      const sentence = split.text;
      if (!sentence) {
        lastDropped = true;
        return;
      }
      const result = checkUnit(sentence, facts, palaces, ctx);
      const lowSentence = scanText(stripBullet(sentence));
      // Lời khen chung: không điều kiện riêng (không mở bằng "nếu / gặp...", không nêu sao / Hóa), không phủ định ("không thuận lợi").
      const basePraise =
        satCase &&
        !result.applied &&
        sentence.length < 80 &&
        BASE_PRAISE_RE.test(lowSentence) &&
        !/^(nếu|khi|gặp|thêm|hội|được|có|trừ)\s/.test(lowSentence) &&
        !NEGATION_RE.test(withoutKhongStars(lowSentence)) &&
        !/hóa (lộc|quyền|khoa|kỵ)/.test(lowSentence) &&
        !findStarsIn(lowSentence.split(/[,;:]/)[0], sentence).length;
      const drop =
        result.drop ??
        (isSevereClaim(sentence) && !(result.applied && result.applied !== LOCATED) ? SEVERE_DROP : undefined) ??
        (basePraise ? PRAISE_DROP : undefined);
      if (drop) {
        dropped.push({ sentence, reason: drop });
        lastDropped = true;
        const lead = scanText(stripBullet(sentence));
        if (index === 0 && (SCOPE_LABEL.test(lead) || (drop !== SEVERE_DROP && LINE_SUBJECT_RE.test(lead)))) labelDropped = true;
        if (index === 0 && enumItem && drop !== SEVERE_DROP) itemDropped = true;
        if (index === 0 && isSectionLead && !enumItem && !/^[☆★•*+\-]/u.test(trimmed) && isScopeDrop(drop)) {
          sectionDropped = true;
          if (headingOut >= 0) outLines[headingOut] = "";
        }
        return;
      }
      lastDropped = false;
      if (result.applied && result.applied !== LOCATED) applied.add(result.applied);
      kept.push(sentence);
    });
    if (kept.length) outLines.push(kept.join(" ").replace(/;\s*$/, "."));
    else if (heading) sectionDropped = true;
    if (titleLine && kept.length) {
      headingOut = outLines.length - 1;
      sectionLead = true;
    }
  }
  // Dòng tiêu đề (kết thúc bằng ":") không còn nội dung phía sau -> bỏ.
  const cleaned = outLines.filter((line, i) => !(/:\s*$/.test(line) && (i === outLines.length - 1 || !outLines[i + 1]?.trim())));
  let result = cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  // Đã lược câu mở đầu -> câu mở đầu mới cũng phải đạt phạm vi như câu mở đầu gốc (vị trí, chính tinh,
  // giới tính, năm sinh, độ sáng - xem extractTextRequirements), nếu không thì lược tiếp.
  // Câu mở đoạn chỉ về "ba cung này" / "các cung trên" (danh sách không hiển thị) cũng lược - kể cả khi chưa lược câu nào.
  const leadRefersUnseen = (lead: string) => LEAD_PALACE_REF_RE.test(scanText(lead));
  if (dropped.length || leadRefersUnseen(leadSentence(result))) {
    const mainStars = ctx.conditionStars.filter((s) => MAIN_STARS.has(s));
    for (let guard = 0; guard < 8 && result; guard++) {
      const lead = leadSentence(result);
      const unseen = leadRefersUnseen(lead);
      if (!unseen && (!dropped.length || checkTextRequirements(extractTextRequirements(result, mainStars), facts, ctx.palaceKeys))) break;
      dropped.push({ sentence: lead, reason: unseen ? "dẫn chiếu phần bài không hiển thị" : "câu mở đầu mới nói về phạm vi khác" });
      const at = result.indexOf(lead);
      if (at < 0) {
        result = "";
        break;
      }
      result = (result.slice(0, at) + result.slice(at + lead.length)).replace(/^[\s\-•*\d.):;,]+/, "").trim();
    }
  }
  // Sau khi lược, đoạn còn lại mở đầu bằng mảnh câu chữ thường ("nên đổi nghề.") -> bỏ mảnh ngắn đó, còn lại viết hoa đầu.
  if (dropped.length && /^\p{Ll}/u.test(result)) {
    const first = result.split(/(?<=[.!?;])\s+|\n/)[0];
    if (first.length < 40) {
      dropped.push({ sentence: first, reason: "mảnh câu còn sót ở đầu đoạn" });
      result = result.slice(first.length).trim();
    }
    result = result.replace(/^(\p{Ll})/u, (c) => c.toUpperCase());
  }
  if (!result || result.length < 8) return null;
  return { text: result, removed: dropped.length, applied: [...applied], dropped };
}
