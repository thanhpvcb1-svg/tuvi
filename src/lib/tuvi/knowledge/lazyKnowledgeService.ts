/**
 * Lazy Knowledge Service
 * Phiên bản lazy load của knowledgeService - chỉ query khi knowledge đã được load
 */

import type { ChartView } from "../../types";
import type { DisplayPalace, DisplayStar } from "../config/types";
import { buildChartFacts, computePeriod, palaceKey, type ChartFacts } from "./conditionMatcher";
import { PALACE_IDS, queryCandidates, resolveFile, type IndexedEntry, type NormalizedFile } from "./knowledgeQueryCore";
import { KNOWLEDGE_MODE } from "./knowledgeMode";
import { getRemoteMatches, isRemoteReady, prefetchChartKnowledge } from "./remoteKnowledge";
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
  /** Trường phái có bằng chứng (vd "BAC_PHAI") - dùng làm evidence; không có = chưa xác định. */
  school?: string;
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

type KnowledgeIndex = Record<string, IndexedEntry[]>;
export type { IndexedEntry, NormalizedEntry, NormalizedFile, NormalizedRule } from "./knowledgeQueryCore";

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
    index[id] = resolveFile(cache[fileName] as NormalizedFile | undefined);
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

// ============ MAIN QUERY ============

/**
 * Query knowledge cho một cung - LAZY VERSION
 * Trả về mảng rỗng nếu knowledge chưa được load hoặc không có lá số để đối chiếu.
 */
export function queryPalaceKnowledge(context: PalaceQueryContext): KnowledgeMatch[] {
  // Chế độ server: kết quả đã nạp sẵn theo lá số (ensureChartKnowledge) - cùng thuật toán, khớp trên server.
  if (KNOWLEDGE_MODE === "server") {
    if (!context.chart) return [];
    return getRemoteMatches(context.chart, context, context.palace.name);
  }
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

  return queryCandidates(candidates, facts, key!, context.limit);
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

/**
 * Chuẩn bị tri thức cho một lá số trước khi gọi queryPalaceKnowledge (đồng bộ):
 * chế độ trình duyệt -> tải kho; chế độ server -> hỏi /api/knowledge/query một lần cho cả 12 cung.
 */
export function ensureChartKnowledge(chart: ChartView, years: { yearToView?: number; birthYear?: number }): Promise<void> {
  if (KNOWLEDGE_MODE === "server") return prefetchChartKnowledge(chart, years).then(() => undefined);
  return loadKnowledge().then(() => undefined);
}

export function isChartKnowledgeReady(chart: ChartView, years: { yearToView?: number; birthYear?: number }): boolean {
  return KNOWLEDGE_MODE === "server" ? isRemoteReady(chart, years) : isKnowledgeReady();
}
