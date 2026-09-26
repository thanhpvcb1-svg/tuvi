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
  isPeriodCondition,
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
};
type NormalizedFile = { palace: string; title: string; sources: KnowledgeSource[]; entries: NormalizedEntry[] };

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
    index[id] = (file?.entries ?? []).map((entry) => ({
      entry,
      source: file!.sources?.[entry.source] ?? { book: "", author: "" },
      section: entry.section || file!.title,
    }));
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
// Cùng một tập điều kiện chỉ giữ tối đa N nội dung (thường là nhiều bài viết cùng mô tả một sao).
const MAX_TEXTS_PER_CONDITION = 2;

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
  // Lý do khớp thuộc ĐIỀU KIỆN (không gồm phạm vi nội dung) - dùng để xét mục nào bị mục khác bao hàm.
  const conditionReasons = new Map<KnowledgeMatch, string[]>();
  for (const { entry, source, section } of candidates) {
    // Một nội dung có thể có nhiều rule (điều kiện gốc khác nhau) -> lấy rule khớp nhiều điều kiện nhất.
    let best: KnowledgeMatch | null = null;
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
        conditionReasons.set(best, reasons);
      }
    }
    if (best) results.push(best);
  }

  // Khớp nhiều điều kiện nhất lên trước; cùng điểm thì nội dung đầy đủ hơn lên trước.
  results.sort((a, b) => b.matchScore - a.matchScore || b.interpretation.text.length - a.interpretation.text.length);

  const seen = new Set<string>();
  const deduped: KnowledgeMatch[] = [];
  for (const item of results) {
    const textKey = item.interpretation.text.slice(0, 100);
    if (seen.has(textKey)) continue;
    seen.add(textKey);
    deduped.push(item);
  }

  if (context.limit) return deduped.slice(0, context.limit);
  // Lá số gốc và vận hạn năm xem được chọn lọc riêng để không chèn ép nhau.
  const natal = deduped.filter((item) => item.interpretation.type !== "period");
  const periodItems = deduped.filter((item) => item.interpretation.type === "period");
  return [...selectMostSpecific(natal, conditionReasons), ...selectMostSpecific(periodItems, conditionReasons)];
}

/**
 * Chỉ giữ tri thức khớp sát nhất - không chốt số lượng:
 * 1. Bỏ mục bị bao hàm: tập điều kiện của nó nằm gọn trong tập điều kiện của một mục khác đã khớp
 *    (vd "Mệnh tại Mão có Thiên Lương" khi đã có "Mệnh tại Mão có Thái Dương, Thiên Lương").
 * 2. Cùng một tập điều kiện chỉ giữ MAX_TEXTS_PER_CONDITION nội dung đầy đủ nhất.
 * 3. Chỉ giữ mục đạt >= MIN_RELATIVE_SCORE điểm của mục khớp sát nhất trong cung.
 */
function selectMostSpecific(items: KnowledgeMatch[], conditionReasons: Map<KnowledgeMatch, string[]>): KnowledgeMatch[] {
  // "X độc tọa" chỉ là hệ quả của "Có X" khi cung có một chính tinh - không tính là điều kiện riêng khi so bao hàm.
  const keyOf = (item: KnowledgeMatch) => new Set((conditionReasons.get(item) ?? item.matchReasons).filter((r) => !/ độc tọa$/.test(r)));
  const keys = new Map(items.map((item) => [item, keyOf(item)]));
  const isStrictSubset = (a: Set<string>, b: Set<string>) => a.size < b.size && [...a].every((r) => b.has(r));

  const notSubsumed = items.filter((item) => !items.some((other) => other !== item && isStrictSubset(keys.get(item)!, keys.get(other)!)));

  const perCondition = new Map<string, number>();
  const diverse = notSubsumed.filter((item) => {
    const scopeReasons = item.matchReasons.filter((r) => !keys.get(item)!.has(r) && !/ độc tọa$/.test(r));
    const groupKey = [...keys.get(item)!].sort().join("|") + "#" + scopeReasons.sort().join("|");
    const used = perCondition.get(groupKey) ?? 0;
    if (used >= MAX_TEXTS_PER_CONDITION) return false;
    perCondition.set(groupKey, used + 1);
    return true;
  });

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
