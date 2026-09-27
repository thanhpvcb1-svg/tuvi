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
  flowsOut: Array<{ type: HoaType; target: string }>;
  selfHoa: Set<HoaType>;
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
 * Tuổi = năm xem - năm sinh (cùng cách tính với thanh chọn năm trên lá số).
 */
export function computePeriod(chart: ChartView, yearToView?: number, birthYear?: number): ChartFacts["period"] {
  if (!yearToView || !birthYear) return undefined;
  const age = yearToView - birthYear;
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
  return lists.flatMap((list) => list ?? []).filter(isNatalStar);
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
    for (const flow of ((palace as any).phiTuHoa?.flows ?? []) as Array<{ type: string; relation?: string; targetPalaceName?: string }>) {
      const type = (["loc", "quyen", "khoa", "ky"] as const).find((t) => t === flow.type);
      if (!type) continue;
      if (flow.relation === "tu_hoa") {
        selfHoa.add(type);
        continue;
      }
      const target = flow.targetPalaceName ? palaceKey(flow.targetPalaceName) : null;
      if (target) flowsOut.push({ type, target });
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
    };
    palaces.set(key, facts);
    byBranch.set(branch, facts);
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
  | { kind: "noSelfHoa" }
  | { kind: "flow"; hoa: HoaType; target: string }
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
    } else if (t === "tự hóa li tâm" || t === "tự hóa ly tâm") {
      predicates.push({ kind: "selfHoaAny" });
    } else if ((m = t.match(new RegExp(`^tự ${H}$`)))) {
      predicates.push({ kind: "selfHoa", hoa: hoaType(m[1])! });
    } else if ((m = t.match(HOA_ONLY))) {
      predicates.push({ kind: "hoa", hoa: hoaType(m[1])!, scope });
    } else if ((m = t.match(new RegExp(`^${H} (\\S+)$`))) && PALACE_ABBR[m[2]]) {
      predicates.push({ kind: "flow", hoa: hoaType(m[1])!, target: PALACE_ABBR[m[2]] });
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

  // "Cung Thân đồng cung với cung Quan lộc"
  if ((m = condition.match(/^Cung Thân đồng cung với cung (.+)$/))) {
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
  laiNhan: 2, soulStar: 1, bodyStar: 1, period: 3, periodRole: 3, flowPeriodRole: 3,
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
  return /phi phục Tam điểm tại|\d+\s*-\s*\d+\s*tuổi|\(\d+ tuổi\)|Thông tin chung|^\s*(Cung khí số vị )?đại vận/i.test(text);
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
  brightness?: { star: string; level: "good" | "bad" };
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

/** Nội dung mở đầu nói về vận hạn -> không dùng khi luận lá số gốc. */
export function isPeriodText(text: string): boolean {
  return /đại hạn|đại vận|lưu niên|tiểu hạn|tiểu vận|vận này|hạn này/i.test(leadSentence(text));
}

/** Câu nói độ sáng một chiều: "good" (miếu/vượng/đắc), "bad" (hãm), null nếu không nói hoặc nói cả hai. */
function brightnessClaim(lead: string): "good" | "bad" | null {
  const good = /nhập miếu|miếu địa|miếu vượng|vượng địa|đắc địa|(^|[^\p{L}])(miếu|vượng)([^\p{L}]|$)/iu.test(lead);
  const bad = /lạc hãm|hãm địa|(^|[^\p{L}])hãm([^\p{L}]|$)/iu.test(lead);
  return good === bad ? null : good ? "good" : "bad";
}

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
    const ok = level === "good" ? /^(M|V|Đ)$/.test(code) : code === "H";
    if (!ok) return null;
    extra.push(`${label(star)} ${level === "good" ? "miếu/vượng/đắc" : "hãm"}`);
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
            return p.scope !== "tpt" || MAIN_STARS.has(p.star);
          case "starHoa":
          case "flow":
          case "selfHoa":
          case "selfHoaAny":
          case "singleMain":
          case "flank":
          case "flowPeriodRole":
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
    case "noSelfHoa":
      return palace.selfHoa.size === 0 ? "Không tự hóa" : null;
    case "flow": {
      const hit = palace.flowsOut.some((f) => f.type === p.hoa && f.target === p.target);
      return hit ? `${palace.label} phi ${HOA_LABELS[p.hoa]} nhập ${label(p.target)}` : null;
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
export function evaluateCondition(parsed: Pick<ParsedCondition, "clauses">, facts: ChartFacts): string[] | null {
  const reasons: string[] = [];
  for (const clause of parsed.clauses) {
    const palace = clause.palace.startsWith("@") ? palaceAt(facts, clause.palace.slice(1)) : resolvePalace(facts, clause.palace);
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
      reasons.push(reason);
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
  // "tính đào hoa", "duyên đào hoa"... là đặc tính, không phải sao Đào Hoa
  [/(tính|duyên|vận|chuyện|kiểu|mang|nét|vẻ) đào hoa/g, "$1 _"],
];
const scanText = (value: string) => {
  let text = lower(value).replace(/(o[àáảãạèéẻ]|u[ỳýỷỹỵ])(?![\p{L}])/gu, (m) => TONE_OLD[m] ?? m);
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

const stripBullet = (s: string) => s.replace(/^[\s\-•*+>★☆]*(\(?\d+[.)]\s*|[a-zđ][.)]\s+)?/i, "").trim();
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

function checkUnit(unit: string, facts: ChartFacts, palaces: PalaceFacts[], ctx: RefineContext): { drop?: string; applied?: string } {
  // Phần trong ngoặc là chú thích phụ - không dùng để quyết định bỏ câu.
  const u = stripBullet(unit).replace(/\([^)]*\)|\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
  if (u.length < 4) return {};
  const lowU = scanText(u);
  const head = conditionHead(u);
  const lowHead = scanText(head);
  // Câu phủ định / nhượng bộ ở vế điều kiện: không suy ra được điều kiện rõ ràng -> giữ nguyên.
  if (/(^|[^\p{L}])(không|chẳng|chưa|trừ khi|dù|bất kể|bất luận|kể cả)([^\p{L}]|$)/u.test(lowHead)) return {};
  // Câu hai vế / có vế ngược lại: một vế không khớp chưa chắc cả câu không áp dụng.
  const rest = lowU.slice(lowHead.length);
  const multiBranch = /(nếu không|bằng không|trái lại|ngược lại|còn nếu|,\s*nếu|;\s*nếu|,\s*gặp|,\s*còn gặp|,\s*thêm)/.test(rest) || (lowU.match(/\sthì\s/g) ?? []).length >= 2;

  // 1) Giới tính: nhãn ở đầu câu; câu nhắc cả nam lẫn nữ mệnh thì giữ.
  // "Con trai / con gái" thường nói về con cái của chủ lá số -> không phải nhãn giới tính.
  const male = /^(nếu là |nếu |còn |với |đối với |riêng )?(nam mệnh|mệnh nam|nam giới|nam nhân|người nam|đàn ông)/.test(lowU);
  const female = /^(nếu là |nếu |còn |với |đối với |riêng )?(nữ mệnh|mệnh nữ|nữ giới|nữ nhân|người nữ|phụ nữ|đàn bà)/.test(lowU);
  const both = /nam nữ|nữ nam/.test(lowU) || (/(nam mệnh|mệnh nam|nam giới|nam nhân|đàn ông)/.test(lowU) && /(nữ mệnh|mệnh nữ|nữ giới|nữ nhân|phụ nữ|đàn bà)/.test(lowU));
  if ((male || female) && !both && facts.gender) {
    if (facts.gender !== (male ? "male" : "female")) return { drop: `nói về ${male ? "nam" : "nữ"} mệnh` };
  }

  // 2) Năm sinh: "Người sinh năm Canh, ..." - lấy mọi can được nêu trong câu, chỉ cần một can khớp.
  if (/^(người |nếu |ai |với người |riêng )?(sinh năm|tuổi)\s/i.test(u) && facts.yearStem) {
    const stems = new Set<string>();
    for (const m of u.matchAll(new RegExp(`(?:sinh năm|tuổi)\\s+((?:${STEM_WORD}(?:\\s*(?:,|hoặc|và|\\/)?\\s*))+)`, "giu"))) {
      for (const s of m[1].match(new RegExp(STEM_WORD, "gu")) ?? []) stems.add(stemKey(s));
    }
    if (stems.size && !stems.has(facts.yearStem)) return { drop: `nói về người sinh năm ${[...stems].map(label).join(", ")}` };
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
    if (/(không|chẳng|chưa|trừ)\s*$/.test(scanText(before).slice(-12))) {
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
  const MAIN_ALT = MAIN_STAR_NAMES.map(lower).join("|");
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
        .filter((s) => s.actual && wanted.includes(s.actual));
      return { star: stars[0], stars, wanted, actual: hits[0]?.actual ?? null, hitStar: hits[0]?.star, ok: hits.length > 0 };
    });
    // Nhiều cặp sao-Hóa trong một câu thường là các trường hợp song song -> chỉ cần một cặp đúng,
    // trừ khi nối bằng "và / cùng / đồng thời".
    const andJoined = pairs.length > 1 && /\s(và|cùng|đồng thời)\s/.test(hoaRegion.slice(pairs[0].index! + pairs[0][0].length, pairs[pairs.length - 1].index!));
    let ok = andJoined ? results.every((r) => r.ok) : results.some((r) => r.ok);
    // "Tham Lang Hóa Kỵ hoặc thêm Tứ Sát", "Đà La, Linh Tinh đồng độ, hoặc Thái Dương Hóa Kị":
    // vế Hóa không đúng nhưng vế sao đi kèm (OR) có trong tam phương tứ chính -> vẫn áp dụng.
    if (!ok && /\s(hoặc|hay)\s/.test(hoaRegion)) {
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
  const brightHead = lowHead.slice(0, 80);
  const startsBright = /^(ở |nếu |khi |gặp |tại |cư )?(nhập miếu|miếu địa|miếu vượng|vượng địa|đắc địa|lạc hãm|hãm địa|hãm vị|miếu|vượng|hãm|đắc)([^\p{L}]|$)/u.test(brightHead);
  const namedBright = STAR_NAMES_DESC.find((name) => brightHead.startsWith(name) && /^\s*(nhập miếu|miếu|vượng|đắc địa|lạc hãm|hãm)/.test(brightHead.slice(name.length)));
  const concessive = /(miếu|vượng|đắc|hãm)[\p{L}\s]{0,12}\s(cũng|vẫn)\s/u.test(brightHead);
  // "hãm địa hay hội sát tinh", "nhập miếu hóa cát tinh hoặc hội chiếu cát tinh": độ sáng chỉ là một vế của OR.
  const brightOr = /\s(hay|hoặc)\s/.test(lowHead);
  if ((startsBright || namedBright) && !located && !multiBranch && !concessive && !brightOr && brightnessClaim(lowU) !== null) {
    const level = brightnessClaim(brightHead.replace(/hãm vị/, "hãm địa"));
    const star = namedBright ?? (ctx.conditionStars.length === 1 ? ctx.conditionStars[0] : null);
    if (level && star) {
      const holder = palaces.map((p) => (p.stars.has(star) ? p : palaceAt(facts, relatedBranches(p.branch, "opposite")[0]))).find((p) => p?.stars.has(star));
      const code = holder?.brightness.get(star) ?? "";
      if (code) {
        const ok = level === "good" ? /^(M|V|Đ)$/.test(code) : code === "H";
        if (!ok) return { drop: `${label(star)} không ${level === "good" ? "miếu/vượng/đắc" : "hãm"}` };
        return { applied: `${label(star)} ${level === "good" ? "miếu/vượng/đắc" : "hãm"}` };
      }
    }
  }
  if (located) return { applied: "Đúng vị trí trên lá số" };

  // 6a) "Người có sao Thái Dương tọa cung Phúc Đức..." - sao phải thật sự ở cung được nêu.
  const seatMatch = lowU.slice(0, 120).match(new RegExp(`(?:sao\\s+)?(${STAR_NAMES_DESC.join("|")})\\s+(?:độc\\s+)?(?:tọa|thủ|cư|nằm)\\s+(?:ở\\s+|tại\\s+)?cung\\s+(mệnh|phụ mẫu|phúc đức|điền trạch|quan lộc|sự nghiệp|nô bộc|giao hữu|thiên di|tật ách|tài bạch|tử tức|tử nữ|phu thê|huynh đệ)(?![\\p{L}])`, "u"));
  if (seatMatch && !multiBranch) {
    const seatPalace = facts.palaces.get(palaceKey(seatMatch[2]) ?? "");
    if (seatPalace && [...facts.palaces.values()].some((p) => p.stars.has(seatMatch[1])) && !seatPalace.stars.has(seatMatch[1])) {
      return { drop: `${label(seatMatch[1])} không ở cung ${seatPalace.label}` };
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
    const computed = (ref: string) => ref.startsWith("hoa:") || [...facts.palaces.values()].some((p) => p.stars.has(ref));
    const refs = (weakVerb && !startsWithStar ? [] : findStarsIn(listHead, listHead, true)).filter((ref) => !(flyingHoa && ref.startsWith("hoa:")) && computed(ref));
    // Danh sách mở ("..., v.v.", "…") hoặc có vế "hoặc" chỉ sang cung khác: không đủ chắc để bỏ.
    const openList = /\.\.\.|…|v\.v|vân vân/.test(lowU.slice(0, listHead.length + 12)) || /hoặc\s+(cung\s+)?(mệnh|thân)\s+có/.test(lowU);
    if (refs.length && !/giáp/.test(lowList) && !openList) {
      const samePalaceOnly = /đồng cung|đồng độ|cùng cung|tọa thủ/.test(lowList) && !/hội|chiếu|tam phương|tam hợp/.test(lowList);
      const scope = new Set(palaces.flatMap((p) => (samePalaceOnly ? [p.branch] : relatedBranches(p.branch, "tpt"))));
      const inScope = (ref: string) =>
        [...scope].some((b) => {
          const p = palaceAt(facts, b);
          if (!p) return false;
          return ref.startsWith("hoa:") ? p.mutagens.has(ref.slice(4) as HoaType) : p.stars.has(ref);
        });
      const present = refs.filter(inScope);
      const name = (ref: string) => (ref.startsWith("hoa:") ? HOA_LABELS[ref.slice(4) as HoaType] : label(ref));
      if (!present.length) return { drop: `không có ${refs.map(name).join(", ")} ${samePalaceOnly ? "đồng cung" : "trong tam phương tứ chính"}` };
      return { applied: `Có ${present.map(name).join(", ")}` };
    }
  }
  return {};
}

export function refineTextForChart(text: string, facts: ChartFacts, ctx: RefineContext): RefineResult | null {
  const palaces = ctx.palaceKeys.map((key) => resolvePalace(facts, key)).filter((p): p is PalaceFacts => Boolean(p));
  const applied = new Set<string>();
  const dropped: RefineResult["dropped"] = [];
  const outLines: string[] = [];
  for (const line of String(text || "").split("\n")) {
    if (!line.trim()) {
      outLines.push(line);
      continue;
    }
    // Tách câu ở ". " / "; " nhưng không cắt bên trong ngoặc.
    // Dấu chấm dính liền chữ hoa (".Khoa", ".Nữ" - lỗi crawl) cũng là ranh giới câu.
    const sentences = line
      .replace(/([\p{Ll}\d)"”])\.(?=\p{Lu})/gu, "$1. ")
      .split(/(?<=[.!?])\s+(?=[\p{Lu}\d"“(*\-•★])|(?<=;)\s+(?![^(]*\))/u);
    const kept: string[] = [];
    for (const sentence of sentences) {
      const result = checkUnit(sentence, facts, palaces, ctx);
      if (result.drop) {
        dropped.push({ sentence, reason: result.drop });
        continue;
      }
      if (result.applied && result.applied !== "Đúng vị trí trên lá số") applied.add(result.applied);
      kept.push(sentence);
    }
    if (kept.length) outLines.push(kept.join(" ").replace(/;\s*$/, "."));
  }
  // Dòng tiêu đề (kết thúc bằng ":") không còn nội dung phía sau -> bỏ.
  const cleaned = outLines.filter((line, i) => !(/:\s*$/.test(line) && (i === outLines.length - 1 || !outLines[i + 1]?.trim())));
  let result = cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  // Đã lược câu mở đầu -> câu mở đầu mới cũng phải đạt phạm vi như câu mở đầu gốc (vị trí, chính tinh,
  // giới tính, năm sinh, độ sáng - xem extractTextRequirements), nếu không thì lược tiếp.
  if (dropped.length) {
    const mainStars = ctx.conditionStars.filter((s) => MAIN_STARS.has(s));
    for (let guard = 0; guard < 8 && result; guard++) {
      const lead = leadSentence(result);
      if (checkTextRequirements(extractTextRequirements(result, mainStars), facts, ctx.palaceKeys)) break;
      dropped.push({ sentence: lead, reason: "câu mở đầu mới nói về phạm vi khác" });
      const at = result.indexOf(lead);
      if (at < 0) {
        result = "";
        break;
      }
      result = (result.slice(0, at) + result.slice(at + lead.length)).replace(/^[\s\-•*\d.):;,]+/, "").trim();
    }
  }
  if (!result || result.length < 8) return null;
  return { text: result, removed: dropped.length, applied: [...applied], dropped };
}
