/**
 * Lazy Knowledge Service
 * Phiên bản lazy load của knowledgeService - chỉ query khi knowledge đã được load
 */

import type { ChartView } from "../../types";
import type { DisplayPalace, DisplayStar } from "../config/types";
import {
  buildChartFacts,
  checkTextRequirements,
  computePeriod,
  conditionPalaceKeys,
  conditionPalaceStars,
  conditionSubject,
  isPeriodCondition,
  isSevereClaim,
  refineTextForChart,
  evaluateCondition,
  isAnchoredCondition,
  palaceKey,
  type ChartFacts,
  type Clause,
  type TextRequirements,
} from "./conditionMatcher";
import {
  getKnowledgeCache,
  isKnowledgeReady,
  loadKnowledge,
} from "./lazyKnowledgeLoader";

// ============ TYPES (re-export từ knowledgeService) ============

export type KnowledgeSource = {
  book: string;
  author: string;
  translator?: string | null;
};

export type InterpretationConditions = {
  required_stars?: string[];
  meeting_stars?: string[];
  position?: string[];
  heavenly_stem?: string;
  mutagen_in_palace?: string | string[];
  transformation?: string;
  source_palace?: string;
  target_palace?: string;
};

export type KnowledgeInterpretation = {
  id: string;
  type: string;
  /** Điều kiện gốc dạng chuỗi (file consolidated) - đã được đối chiếu với lá số. */
  condition?: string;
  conditions?: InterpretationConditions;
  required_stars?: string[];
  same_palace?: boolean;
  branches?: string[];
  excluded_stars?: string[];
  source_palace?: string;
  target_palace?: string;
  clash_palace?: string;
  relation_palace?: string;
  relation_code?: string;
  text: string;
  warning?: string;
  source: KnowledgeSource;
};

export type KnowledgeSection = {
  section_id: string;
  title: string;
  interpretations: KnowledgeInterpretation[];
};

export type KnowledgeFile = {
  palace: string;
  palace_name?: string;
  section_id?: string;
  title?: string;
  sections?: KnowledgeSection[];
  interpretations?: KnowledgeInterpretation[];
};

export type KnowledgeMatch = {
  interpretation: KnowledgeInterpretation;
  section: string;
  /** Số điều kiện đã kiểm chứng trên lá số (vị trí, sao, Tứ Hóa, phi hóa, phạm vi nội dung...). */
  matchedConditions: number;
  matchScore: number;
  matchReasons: string[];
  /** Số câu đã lược vì nêu điều kiện riêng không khớp lá số (độ sáng, vị trí, giới tính...). */
  trimmedSentences?: number;
  /** Câu đã lược kèm lý do (kiểm thử / rà soát). */
  trimmedDetails?: Array<{ sentence: string; reason: string }>;
};

export type PhiHoaFlow = {
  type: "loc" | "quyen" | "khoa" | "ky";
  typeLabel?: string;
  sourcePalace: string;
  targetPalace: string;
  targetPalaceName?: string;
  clashPalace?: string;
};

export type PalaceQueryContext = {
  /** Lá số đầy đủ - bắt buộc để đối chiếu điều kiện (vị trí, tam phương, phi hóa...). */
  chart?: ChartView;
  /** Chỉ dùng cho kiểm thử: bỏ lọc theo nhóm, trả về mọi mục khớp (tối đa limit). */
  limit?: number;
  /** Năm xem + năm sinh -> bật tri thức vận hạn (đại vận / tiểu vận của năm xem). */
  yearToView?: number;
  birthYear?: number;
  palace: DisplayPalace;
  starsInPalace: string[];
  branch: string;
  heavenlyStem?: string;
  mutagensInPalace?: string[];
  phiHoaFlows?: PhiHoaFlow[];
};

// ============ HELPERS ============

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/s+/g, "_")
    .trim();
}

// ============ KNOWLEDGE INDEX ============
//
// Knowledge Base đã làm mịn (cung/normalized/*.json, sinh bởi scripts/normalizeKnowledge.ts):
// mỗi entry có sẵn các rule (điều kiện đã parse), runtime chỉ còn đánh giá rule trên lá số.

type NormalizedRule = { condition: string; specificity: number; clauses: Clause[] };
type NormalizedEntry = {
  id: string;
  section?: string;
  text: string;
  source: number;
  accuracy: number;
  rules: NormalizedRule[];
  /** Phạm vi nội dung trích từ câu mở đầu - phải khớp lá số thì mới hiển thị. */
  requires?: TextRequirements;
  /** "pop": đoạn văn phong đại chúng xưng "bạn" (khen chung chung, khẩu hiệu) - tối đa 1 đoạn mỗi cung, xếp cuối. */
  style?: "pop";
};
/**
 * File đã làm mịn. tuvi-knowledge@2: điều kiện lưu một lần trong `conditions`, entry.rules là chỉ số vào bảng đó.
 * (Bản @1 cũ lưu thẳng object rule trong từng entry - vẫn đọc được.)
 */
type NormalizedFile = {
  schema?: string;
  palace: string;
  title: string;
  sources: KnowledgeSource[];
  conditions?: NormalizedRule[];
  entries: Array<Omit<NormalizedEntry, "rules"> & { rules: Array<NormalizedRule | number> }>;
};

type IndexedEntry = { entry: NormalizedEntry; source: KnowledgeSource; section: string };
type KnowledgeIndex = Record<string, IndexedEntry[]>;

// id cung trong UI -> file đã làm mịn
const PALACE_FILES: Record<string, string> = {
  menh: "menh",
  phu_mau: "phu-mau",
  phuc_duc: "phuc-duc",
  dien_trach: "dien-trach",
  quan_loc: "quan-loc",
  no_boc: "no-boc",
  thien_di: "thien-di",
  tat_ach: "tat-ach",
  tai_bach: "tai-bach",
  tu_tuc: "tu-tuc",
  phu_the: "phu-the",
  huynh_de: "huynh-de",
  // Thân: hiển thị ở cung có Thân cư; Tổng quan lá số: hiển thị ở cung Mệnh.
  than: "than",
  tong_quan: "tong-quan",
};

let indexSource: Record<string, unknown> | null = null;
let knowledgeIndex: KnowledgeIndex | null = null;

function buildKnowledgeIndex(cache: Record<string, unknown>): KnowledgeIndex {
  if (knowledgeIndex && indexSource === cache) return knowledgeIndex;

  const index: KnowledgeIndex = {};
  for (const [id, fileName] of Object.entries(PALACE_FILES)) {
    const file = cache[fileName] as NormalizedFile | undefined;
    const conditions = file?.conditions ?? [];
    index[id] = (file?.entries ?? []).map((raw) => {
      // Chỉ số -> object điều kiện dùng chung (cùng tham chiếu cho mọi entry trỏ tới cùng điều kiện).
      const entry: NormalizedEntry = { ...raw, rules: raw.rules.map((r) => (typeof r === "number" ? conditions[r] : r)).filter(Boolean) };
      return {
        entry,
        source: file!.sources?.[entry.source] ?? { book: "", author: "" },
        section: entry.section || file!.title,
      };
    });
  }

  indexSource = cache;
  knowledgeIndex = index;
  return index;
}

const chartFactsCache = new WeakMap<ChartView, ChartFacts>();

function getChartFacts(chart: ChartView): ChartFacts {
  let facts = chartFactsCache.get(chart);
  if (!facts) {
    facts = buildChartFacts(chart);
    chartFactsCache.set(chart, facts);
  }
  return facts;
}

const PALACE_IDS: Record<string, string> = {
  "mệnh": "menh",
  "phụ mẫu": "phu_mau",
  "phúc đức": "phuc_duc",
  "điền trạch": "dien_trach",
  "quan lộc": "quan_loc",
  "nô bộc": "no_boc",
  "thiên di": "thien_di",
  "tật ách": "tat_ach",
  "tài bạch": "tai_bach",
  "tử tức": "tu_tuc",
  "phu thê": "phu_the",
  "huynh đệ": "huynh_de",
};


const MIN_RELATIVE_SCORE = 0.5;
// Số đoạn tối đa mỗi cung (lá số gốc / vận hạn năm xem) - đủ ý mà không ngợp; phần tổng hợp nhận tối đa 10 đoạn đầu.
const MAX_NATAL_ITEMS = 8;
const MAX_PERIOD_ITEMS = 3;
// Câu phán một dòng ("Công danh sớm đạt", "phú quý song toàn") ít thông tin: xếp sau đoạn có nội dung, không đứng đầu.
const SHORT_TEXT = 80;
// Đoạn mở đầu cung nên là đoạn luận đầy đủ, không phải câu phán chung ("Luôn luôn là khuynh hướng hình khắc chia ly").
const LEAD_TEXT = 200;
// Tỉ lệ từ chung (so với đoạn ngắn hơn) từ mức này trở lên coi là cùng một nội dung.
const NEAR_DUPLICATE = 0.8;
// Phần lớn câu của đoạn (tính theo độ dài) đã có nguyên văn trong đoạn xếp trước -> đoạn lặp (nguồn chép lại nhau).
const SENTENCE_CONTAINED = 0.6;
const wordSet = (text: string) => new Set(text.toLowerCase().split(/[^\p{L}\d]+/u).filter((w) => w.length >= 2));
const overlap = (a: Set<string>, b: Set<string>) => {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  if (small.size < 8) return 0; // đoạn quá ngắn: so theo 100 ký tự đầu là đủ
  let shared = 0;
  for (const w of small) if (large.has(w)) shared++;
  return shared / small.size;
};
const sentenceKeys = (text: string) =>
  text
    .split(/(?<=[.!?;])\s+|\n/)
    .map((s) => s.toLowerCase().replace(/[^\p{L}\d]+/gu, " ").trim())
    .filter((s) => s.length >= 25);
// Cùng một chủ đề (cùng chính tinh / sao của điều kiện) chỉ giữ tối đa N đoạn: nhiều nguồn cùng tả một sao thường lặp ý
// nhau ("Có Thiên Tướng", "Thiên Tướng độc tọa", "Thiên Tướng gặp Không Kiếp"...).
const MAX_TEXTS_PER_SUBJECT = 2;
// Lời khen tuyệt đối trong câu phán ngắn - không hiển thị khi chính cung có sát tinh / Hóa Kỵ.
const ABSOLUTE_PRAISE = /phú quý|giàu có|đại phú|đại quý|song toàn|hiển đạt|phát đạt|vinh hiển|sớm đạt|kiêm toàn|lúc nào cũng có tiền|dồi dào|quyền cao chức trọng|làm quan lớn/iu;
const SAT_STARS = ["kình dương", "đà la", "hỏa tinh", "linh tinh", "địa không", "địa kiếp"];

/** Thông tin xếp hạng của một đoạn đã khớp. */
type MatchMeta = {
  /** Lý do khớp thuộc ĐIỀU KIỆN (không gồm phạm vi nội dung) - để xét mục nào bị mục khác bao hàm. */
  reasons: string[];
  /** Chủ đề (sao) của điều kiện - các đoạn cùng chủ đề bị giới hạn số lượng. */
  subject: string;
  pop: boolean;
  /** Còn câu phán nặng (đã kiểm chứng điều kiện) - không xếp đầu cung. */
  alarm: boolean;
  /** Bị lược quá nửa nội dung - phần còn lại thường rời rạc, xếp sau. */
  heavyTrim: boolean;
};

// ============ MAIN QUERY ============

/**
 * Query knowledge cho một cung - LAZY VERSION
 * Trả về mảng rỗng nếu knowledge chưa được load hoặc không có lá số để đối chiếu.
 */
export function queryPalaceKnowledge(context: PalaceQueryContext): KnowledgeMatch[] {
  const cache = getKnowledgeCache();
  if (!cache || !context.chart) return [];

  const key = palaceKey(context.palace.name);
  const palaceId = key ? PALACE_IDS[key] : undefined;
  if (!palaceId) return [];

  const index = buildKnowledgeIndex(cache);
  const baseFacts = getChartFacts(context.chart);
  const period = computePeriod(context.chart, context.yearToView, context.birthYear);
  const facts: ChartFacts = period ? { ...baseFacts, period } : baseFacts;
  const candidates = [...(index[palaceId] ?? [])];
  if (context.palace.isBodyPalace) candidates.push(...(index.than ?? []));
  // Tổng quan lá số (bảng 12 cung, nạp âm...) không phải tri thức của riêng cung nào -> không đưa vào thẻ cung.

  const results: KnowledgeMatch[] = [];
  const meta = new Map<KnowledgeMatch, MatchMeta>();
  const home = facts.palaces.get(key!);
  const homeHasSat = Boolean(home && (SAT_STARS.some((s) => home.stars.has(s)) || home.mutagens.has("ky")));
  for (const { entry, source, section } of candidates) {
    // Một nội dung có thể có nhiều rule (điều kiện gốc khác nhau) -> lấy rule khớp nhiều điều kiện nhất.
    let best: KnowledgeMatch | null = null;
    let bestRule: NormalizedRule | null = null;
    let bestReasons: string[] = [];
    for (const rule of entry.rules) {
      if (!isAnchoredCondition(rule)) continue; // chỉ vị trí / Can Chi / Nạp âm / sao phụ hội chiếu -> chung chung
      const reasons = evaluateCondition(rule, facts);
      if (!reasons) continue;
      const scope = checkTextRequirements(entry.requires, facts, [key!, ...conditionPalaceKeys(rule)]);
      if (!scope) continue; // điều kiện khớp nhưng nội dung nói về vị trí/sao/giới/năm sinh/độ sáng khác
      const matchReasons = [...new Set([...reasons, ...scope])];
      const matchedConditions = matchReasons.length;
      // Điểm khớp có trọng số: chính tinh tọa thủ > sao khác tọa thủ > vị trí/Tứ Hóa/phi hóa > sao hội chiếu;
      // mỗi phạm vi nội dung khớp (giới tính, năm sinh, độ sáng...) +2.
      const conditionScore = rule.specificity + scope.length * 2;
      const matchScore = conditionScore * 10 + entry.accuracy;
      if (!best || matchScore > best.matchScore) {
        best = {
          // type "period": tri thức vận hạn của năm xem - UI hiển thị thành nhóm riêng.
          interpretation: { id: entry.id, type: isPeriodCondition(rule) ? "period" : "condition", condition: rule.condition, text: entry.text, source },
          section,
          matchedConditions,
          matchScore,
          matchReasons,
        };
        bestRule = rule;
        bestReasons = reasons;
      }
    }
    if (!best || !bestRule) continue;
    // Lọc từng câu: bỏ câu có điều kiện riêng không khớp lá số; câu điều kiện đã kiểm chứng đúng
    // được cộng vào lý do khớp. Cả đoạn không còn câu nào áp dụng được -> không hiển thị.
    const refined = refineTextForChart(entry.text, facts, {
      palaceKeys: [key!, ...conditionPalaceKeys(bestRule)],
      conditionStars: conditionPalaceStars(bestRule),
    });
    if (!refined) continue;
    // Câu phán ngắn khen tuyệt đối ("phú quý song toàn") trong khi chính cung có sát tinh / Hóa Kỵ -> dễ gây hiểu sai.
    if (refined.text.length < SHORT_TEXT && homeHasSat && ABSOLUTE_PRAISE.test(refined.text)) continue;
    meta.set(best, {
      reasons: bestReasons,
      subject: conditionSubject(bestRule) ?? `cond:${[...bestReasons].sort().join("|")}`,
      pop: entry.style === "pop",
      alarm: isSevereClaim(refined.text),
      heavyTrim: refined.text.length < entry.text.length * 0.5,
    });
    best.interpretation.text = refined.text;
    if (refined.removed) {
      best.trimmedSentences = refined.removed;
      best.trimmedDetails = refined.dropped;
    }
    if (refined.applied.length) {
      best.matchReasons = [...new Set([...best.matchReasons, ...refined.applied])];
      best.matchedConditions = best.matchReasons.length;
      // Có điều kiện riêng đã kiểm chứng: cụ thể hơn một bậc (không cộng dồn để không đẩy ngưỡng lọc
      // tương đối lên cao, làm rơi các mục khớp đúng khác).
      best.matchScore += 10;
    }
    results.push(best);
  }

  // Khớp nhiều điều kiện nhất lên trước; cùng điểm thì nội dung đầy đủ hơn lên trước.
  results.sort((a, b) => b.matchScore - a.matchScore || b.interpretation.text.length - a.interpretation.text.length);

  // Trùng lặp: cùng 100 ký tự đầu, gần như cùng bộ từ, hoặc phần lớn câu đã có nguyên văn trong đoạn xếp trước
  // (nhiều nguồn chép lại nhau) -> giữ bản xếp trước.
  const seen = new Set<string>();
  const deduped: KnowledgeMatch[] = [];
  const keptWords: Array<Set<string>> = [];
  const keptSentences = new Set<string>();
  for (const item of results) {
    const textKey = item.interpretation.text.slice(0, 100);
    if (seen.has(textKey)) continue;
    const words = wordSet(item.interpretation.text);
    if (keptWords.some((other) => overlap(words, other) >= NEAR_DUPLICATE)) continue;
    const sentences = sentenceKeys(item.interpretation.text);
    const total = sentences.reduce((sum, s) => sum + s.length, 0);
    const repeated = sentences.reduce((sum, s) => sum + (keptSentences.has(s) ? s.length : 0), 0);
    if (total && repeated / total >= SENTENCE_CONTAINED) continue;
    seen.add(textKey);
    keptWords.push(words);
    for (const s of sentences) keptSentences.add(s);
    deduped.push(item);
  }

  if (context.limit) return deduped.slice(0, context.limit);
  // Lá số gốc và vận hạn năm xem được chọn lọc riêng để không chèn ép nhau.
  const natal = deduped.filter((item) => item.interpretation.type !== "period");
  const periodItems = deduped.filter((item) => item.interpretation.type === "period");
  return [
    ...pickDiverse(selectMostSpecific(natal, meta), meta, MAX_NATAL_ITEMS),
    ...pickDiverse(selectMostSpecific(periodItems, meta), meta, MAX_PERIOD_ITEMS),
  ];
}

/**
 * Chọn và xếp thứ tự đoạn hiển thị mỗi cung:
 * - Điểm xếp hạng = điểm khớp, trừ bớt với câu phán ngắn (< SHORT_TEXT ký tự), đoạn bị lược quá nửa, đoạn còn câu phán nặng.
 * - Ưu tiên độ phủ: lượt 1 lấy đoạn tốt nhất của TỪNG chủ đề (sao), lượt 2 mới thêm đoạn thứ hai của cùng chủ đề -
 *   để các đoạn nói về các yếu tố khác nhau của cung thay vì cùng tả một sao.
 * - Đoạn đứng đầu phải là đoạn có nội dung (không phải câu phán ngắn / câu phán nặng).
 * - Đoạn văn phong đại chúng ("bạn...!") chỉ lấp chỗ trống: tối đa 1 đoạn, đứng cuối.
 */
function rankScore(item: KnowledgeMatch, meta: Map<KnowledgeMatch, MatchMeta>): number {
  const m = meta.get(item);
  // Câu phán ngắn chỉ thắng đoạn đầy đủ khi khớp cụ thể hơn hẳn (hơn 2 bậc điều kiện).
  return item.matchScore - (item.interpretation.text.length < SHORT_TEXT ? 20 : 0) - (m?.heavyTrim ? 8 : 0) - (m?.alarm ? 5 : 0);
}
const byRank = (meta: Map<KnowledgeMatch, MatchMeta>) => (a: KnowledgeMatch, b: KnowledgeMatch) =>
  rankScore(b, meta) - rankScore(a, meta) || b.interpretation.text.length - a.interpretation.text.length;

function pickDiverse(items: KnowledgeMatch[], meta: Map<KnowledgeMatch, MatchMeta>, max: number): KnowledgeMatch[] {
  const ranked = [...items].sort(byRank(meta));
  const core = ranked.filter((item) => !meta.get(item)?.pop);
  const pop = ranked.find((item) => meta.get(item)?.pop);

  const seenSubjects = new Set<string>();
  const first: KnowledgeMatch[] = [];
  const second: KnowledgeMatch[] = [];
  for (const item of core) {
    const subject = meta.get(item)?.subject ?? "";
    if (seenSubjects.has(subject)) second.push(item);
    else {
      seenSubjects.add(subject);
      first.push(item);
    }
  }
  const picked = new Set([...first, ...second].slice(0, max));
  const ordered = core.filter((item) => picked.has(item)); // giữ thứ tự xếp hạng
  // Đoạn đứng đầu: ưu tiên đoạn đầy đủ về chính tinh của cung, rồi mới tới đoạn đầy đủ khác, cuối cùng là đoạn không quá ngắn.
  const leadable = (item: KnowledgeMatch, minLength: number) => item.interpretation.text.length >= minLength && !meta.get(item)?.alarm;
  let leadIndex = ordered.findIndex((item) => leadable(item, LEAD_TEXT) && meta.get(item)?.subject.startsWith("main:"));
  if (leadIndex < 0) leadIndex = ordered.findIndex((item) => leadable(item, LEAD_TEXT));
  if (leadIndex < 0) leadIndex = ordered.findIndex((item) => leadable(item, SHORT_TEXT));
  if (leadIndex > 0) ordered.unshift(...ordered.splice(leadIndex, 1));
  if (pop && ordered.length < max) ordered.push(pop);
  return ordered;
}

/**
 * Chỉ giữ tri thức khớp sát nhất - không chốt số lượng:
 * 1. Bỏ mục bị bao hàm: tập điều kiện của nó nằm gọn trong tập điều kiện của một mục khác đã khớp
 *    (vd "Mệnh tại Mão có Thiên Lương" khi đã có "Mệnh tại Mão có Thái Dương, Thiên Lương").
 * 2. Cùng một chủ đề (sao của điều kiện) chỉ giữ MAX_TEXTS_PER_SUBJECT đoạn khớp sát nhất.
 * 3. Chỉ giữ mục đạt >= MIN_RELATIVE_SCORE điểm của mục khớp sát nhất trong cung.
 */
function selectMostSpecific(items: KnowledgeMatch[], meta: Map<KnowledgeMatch, MatchMeta>): KnowledgeMatch[] {
  // "X độc tọa" chỉ là hệ quả của "Có X" khi cung có một chính tinh - không tính là điều kiện riêng khi so bao hàm.
  const keyOf = (item: KnowledgeMatch) => new Set((meta.get(item)?.reasons ?? item.matchReasons).filter((r) => !/ độc tọa$/.test(r)));
  const keys = new Map(items.map((item) => [item, keyOf(item)]));
  const isStrictSubset = (a: Set<string>, b: Set<string>) => a.size < b.size && [...a].every((r) => b.has(r));

  const notSubsumed = items.filter((item) => !items.some((other) => other !== item && isStrictSubset(keys.get(item)!, keys.get(other)!)));

  // Suất của mỗi chủ đề dành cho đoạn xếp hạng cao (câu phán ngắn không chiếm suất của đoạn đầy đủ).
  const perSubject = new Map<string, number>();
  const allowed = new Set<KnowledgeMatch>();
  for (const item of [...notSubsumed].sort(byRank(meta))) {
    const subject = meta.get(item)?.subject ?? "";
    const used = perSubject.get(subject) ?? 0;
    if (used >= MAX_TEXTS_PER_SUBJECT) continue;
    perSubject.set(subject, used + 1);
    allowed.add(item);
  }
  const diverse = notSubsumed.filter((item) => allowed.has(item));

  const top = diverse[0]?.matchScore ?? 0;
  return diverse.filter((item) => item.matchScore >= top * MIN_RELATIVE_SCORE);
}

// ============ HELPERS FOR COMPONENTS ============

export function extractStarsFromPalace(palace: DisplayPalace): string[] {
  const stars: string[] = [];
  
  const addStars = (list: DisplayStar[] | undefined) => {
    if (list) {
      for (const star of list) {
        stars.push(star.name);
        if (star.originalName) stars.push(star.originalName);
      }
    }
  };

  addStars(palace.centerStars);
  addStars(palace.leftStars);
  addStars(palace.rightStars);
  addStars(palace.majorStars);
  addStars(palace.minorStars);

  return [...new Set(stars)];
}

export function extractMutagensFromPalace(palace: DisplayPalace): string[] {
  const mutagens: string[] = [];
  
  const checkStars = (list: DisplayStar[] | undefined) => {
    if (list) {
      for (const star of list) {
        if (star.mutagen) {
          mutagens.push(star.mutagen.toLowerCase());
        }
        const name = normalizeKey(star.name);
        if (name.includes("hoa_loc") || name === "loc") mutagens.push("loc");
        if (name.includes("hoa_quyen") || name === "quyen") mutagens.push("quyen");
        if (name.includes("hoa_khoa") || name === "khoa") mutagens.push("khoa");
        if (name.includes("hoa_ky") || name === "ky") mutagens.push("ky");
      }
    }
  };

  checkStars(palace.centerStars);
  checkStars(palace.leftStars);
  checkStars(palace.rightStars);
  checkStars(palace.majorStars);
  checkStars(palace.minorStars);

  return [...new Set(mutagens)];
}

export function extractPhiHoaFlows(palace: DisplayPalace): PhiHoaFlow[] {
  const phiTuHoa = (palace as any).phiTuHoa;
  if (!phiTuHoa?.flows) return [];

  const flows: PhiHoaFlow[] = [];
  
  for (const flow of phiTuHoa.flows) {
    if (flow.targetPalaceName) {
      flows.push({
        type: flow.type,
        typeLabel: flow.typeLabel,
        sourcePalace: palace.name,
        targetPalace: flow.targetPalaceName,
        targetPalaceName: flow.targetPalaceName,
      });
    }
  }

  return flows;
}

export function formatKnowledgeSource(source: KnowledgeSource): string {
  const parts = [source.book];
  if (source.author) parts.push(source.author);
  if (source.translator) parts.push(`${source.translator} biên dịch`);
  return parts.join(" - ");
}

export function hasPalaceKnowledge(palaceName: string): boolean {
  if (!isKnowledgeReady()) return false;
  const key = palaceKey(palaceName);
  return Boolean(key && PALACE_IDS[key]);
}

export function getAvailablePalaces(): string[] {
  if (!isKnowledgeReady()) return [];
  return Object.values(PALACE_IDS);
}

// Re-export từ loader
export { isKnowledgeReady, loadKnowledge, scheduleKnowledgePreload } from "./lazyKnowledgeLoader";
