/**
 * Lõi khớp tri thức với lá số - dùng chung cho trình duyệt (lazyKnowledgeService) và Pages Function
 * (/api/knowledge/query). KHÔNG import bộ tải kho: nơi gọi tự đưa danh sách ứng viên (các đoạn của cung + Cung Thân).
 */
import {
  checkTextRequirements,
  conditionPalaceKeys,
  conditionPalaceStars,
  conditionSubject,
  evaluateCondition,
  isAnchoredCondition,
  isDanglingFragment,
  isPeriodCondition,
  isSevereClaim,
  refineTextForChart,
  type ChartFacts,
  type Clause,
  type TextRequirements,
} from "./conditionMatcher";
import type { KnowledgeMatch, KnowledgeSource } from "./lazyKnowledgeService";

export type NormalizedRule = { condition: string; specificity: number; clauses: Clause[] };
export type NormalizedEntry = {
  id: string;
  section?: string;
  text: string;
  source: number;
  accuracy: number;
  rules: NormalizedRule[];
  /** Phạm vi nội dung trích từ câu mở đầu - phải khớp lá số thì mới hiển thị. */
  requires?: TextRequirements;
  /** "pop": đoạn văn phong đại chúng xưng "bạn" (khen chung chung, khẩu hiệu) - tối đa 1 đoạn mỗi cung, xếp cuối. */
  style?: "pop" | "layout";
  /** Trường phái có bằng chứng (vd BAC_PHAI); không có = chưa xác định. */
  school?: string;
  method?: string;
};
/**
 * File đã làm mịn. tuvi-knowledge@2: điều kiện lưu một lần trong `conditions`, entry.rules là chỉ số vào bảng đó.
 * (Bản @1 cũ lưu thẳng object rule trong từng entry - vẫn đọc được.)
 */
export type NormalizedFile = {
  schema?: string;
  palace: string;
  title: string;
  sources: KnowledgeSource[];
  conditions?: NormalizedRule[];
  entries: Array<Omit<NormalizedEntry, "rules"> & { rules: Array<NormalizedRule | number> }>;
};

export type IndexedEntry = { entry: NormalizedEntry; source: KnowledgeSource; section: string };

/** File (hoặc mảnh file) đã làm mịn -> danh sách ứng viên, chỉ số rule đổi thành object điều kiện dùng chung. */
export function resolveFile(file: NormalizedFile | undefined): IndexedEntry[] {
  const conditions = file?.conditions ?? [];
  return (file?.entries ?? []).map((raw) => {
    const entry: NormalizedEntry = { ...raw, rules: raw.rules.map((r) => (typeof r === "number" ? conditions[r] : r)).filter(Boolean) };
    return { entry, source: file!.sources?.[entry.source] ?? { book: "", author: "" }, section: entry.section || file!.title };
  });
}

export const PALACE_IDS: Record<string, string> = {
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
// Dưới mức này là câu khẩu hiệu một dòng - chỉ hiện khi cung thiếu đoạn đầy đủ.
const SLOGAN_TEXT = 60;
// Đoạn mở đầu cung nên là đoạn luận đầy đủ, không phải câu phán chung ("Luôn luôn là khuynh hướng hình khắc chia ly").
const LEAD_TEXT = 200;
// Tỉ lệ từ chung (so với đoạn ngắn hơn) từ mức này trở lên coi là cùng một nội dung.
const NEAR_DUPLICATE = 0.7;
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
// Phụ tinh quan trọng (lục cát, lục sát, Lộc Tồn, Thiên Mã); sao khác là tạp tinh - đoạn tả riêng một tạp tinh thường chung chung
// (khen / chê không điều kiện) nên xếp sau cùng và mỗi cung tối đa MAX_MINOR_STAR_ITEMS đoạn.
const MAJOR_MINOR_STARS = new Set(["tả phù", "hữu bật", "văn xương", "văn khúc", "thiên khôi", "thiên việt", "lộc tồn", "thiên mã", ...SAT_STARS]);
const MAX_MINOR_STAR_ITEMS = 1;
const MIN_ITEMS_BEFORE_LAYOUT = 3;
/** 0: chính tinh / Tứ Hóa / phi hóa / cách cục; 1: phụ tinh quan trọng; 2: tạp tinh. */
function subjectTier(subject: string): 0 | 1 | 2 {
  if (!subject.startsWith("star:")) return 0;
  return subject.slice(5).split("+").some((star) => MAJOR_MINOR_STARS.has(star)) ? 1 : 2;
}

/** Thông tin xếp hạng của một đoạn đã khớp. */
type MatchMeta = {
  /** Lý do khớp thuộc ĐIỀU KIỆN (không gồm phạm vi nội dung) - để xét mục nào bị mục khác bao hàm. */
  reasons: string[];
  /** Chủ đề (sao) của điều kiện - các đoạn cùng chủ đề bị giới hạn số lượng. */
  subject: string;
  pop: boolean;
  /** Khối tóm tắt từng cung của bài bố cục cả lá số - chỉ lấp chỗ khi cung ít đoạn (xem MIN_ITEMS_BEFORE_LAYOUT). */
  layout: boolean;
  /** Còn câu phán nặng (đã kiểm chứng điều kiện) - không xếp đầu cung. */
  alarm: boolean;
  /** Bị lược quá nửa nội dung - phần còn lại thường rời rạc, xếp sau. */
  heavyTrim: boolean;
  /** Đoạn có bằng chứng thuộc Bắc phái - ưu tiên nhẹ khi xếp hạng (chỉ để xếp hạng, không phải "chân lý"). */
  bacPhai: boolean;
  /** Đoạn của Cung Thân hiển thị ở cung Thân cư khác Mệnh (Quan Lộc, Tài Bạch...): thường là bài tả tính cách chung - xếp sau. */
  than: boolean;
  /** Đoạn của file Cung Thân (kể cả khi Thân đồng cung Mệnh): mỗi cung tối đa 1 đoạn - bài Thân chép lại ý bài Mệnh. */
  thanFile: boolean;
  /** Bậc chủ đề (xem subjectTier) - quyết định thứ tự hiển thị. */
  tier: 0 | 1 | 2;
};

/**
 * Khớp các ứng viên với dữ kiện lá số cho cung `key` (khóa cung, vd "mệnh"). `limit`: chỉ dùng cho kiểm thử -
 * bỏ bước chọn lọc, trả về mọi mục khớp (tối đa limit).
 */
export function queryCandidates(candidates: IndexedEntry[], facts: ChartFacts, key: string, limit?: number): KnowledgeMatch[] {
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
      const reasons = evaluateCondition(rule, facts, key ?? undefined);
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
          interpretation: { id: entry.id, type: isPeriodCondition(rule) ? "period" : "condition", condition: rule.condition, text: entry.text, source, ...(entry.school ? { school: entry.school } : {}) },
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
      period: isPeriodCondition(bestRule),
    });
    if (!refined) continue;
    // Lược câu xong mà phần còn lại chỉ là mảnh nối tiếp ("... thì lại càng như vậy.") -> không đứng riêng được.
    if (refined.removed && isDanglingFragment(refined.text)) continue;
    // Câu phán ngắn khen tuyệt đối ("phú quý song toàn") trong khi chính cung có sát tinh / Hóa Kỵ -> dễ gây hiểu sai.
    if (refined.text.length < SHORT_TEXT && homeHasSat && ABSOLUTE_PRAISE.test(refined.text)) continue;
    const subject = conditionSubject(bestRule) ?? `cond:${[...bestReasons].sort().join("|")}`;
    meta.set(best, {
      reasons: bestReasons,
      subject,
      tier: subjectTier(subject),
      pop: entry.style === "pop",
      layout: entry.style === "layout",
      alarm: isSevereClaim(refined.text),
      heavyTrim: refined.text.length < entry.text.length * 0.5,
      bacPhai: entry.school === "BAC_PHAI",
      than: entry.id.startsWith("than-") && key !== "mệnh",
      thanFile: entry.id.startsWith("than-"),
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

  if (limit) return deduped.slice(0, limit);
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
  return item.matchScore - (item.interpretation.text.length < SHORT_TEXT ? 20 : 0) - (m?.heavyTrim ? 8 : 0) - (m?.alarm ? 5 : 0) - (m?.than ? 15 : 0) + (m?.bacPhai ? 5 : 0);
}
const byRank = (meta: Map<KnowledgeMatch, MatchMeta>) => (a: KnowledgeMatch, b: KnowledgeMatch) =>
  rankScore(b, meta) - rankScore(a, meta) || b.interpretation.text.length - a.interpretation.text.length;

function pickDiverse(items: KnowledgeMatch[], meta: Map<KnowledgeMatch, MatchMeta>, max: number): KnowledgeMatch[] {
  const ranked = [...items].sort(byRank(meta));
  const core = ranked.filter((item) => !meta.get(item)?.pop && !meta.get(item)?.layout);
  const pop = ranked.find((item) => meta.get(item)?.pop);
  const layout = ranked.find((item) => meta.get(item)?.layout);

  const seenSubjects = new Set<string>();
  const first: KnowledgeMatch[] = [];
  const second: KnowledgeMatch[] = [];
  let minorStarItems = 0;
  for (const item of core) {
    const m = meta.get(item);
    if (m?.tier === 2) {
      if (minorStarItems >= MAX_MINOR_STAR_ITEMS) continue;
      minorStarItems++;
    }
    const subject = m?.subject ?? "";
    if (seenSubjects.has(subject)) second.push(item);
    else {
      seenSubjects.add(subject);
      first.push(item);
    }
  }
  // Thứ tự hiển thị: mỗi chủ đề một đoạn trước (chính tinh / Hóa / cách cục -> phụ tinh quan trọng -> tạp tinh, trong cùng bậc
  // giữ thứ tự xếp hạng), đoạn thứ hai của cùng chủ đề xếp sau (thường lặp ý đoạn đầu).
  const tier = (item: KnowledgeMatch) => meta.get(item)?.tier ?? 0;
  let thanShown = false;
  const ordered = [...[...first].sort((a, b) => tier(a) - tier(b)), ...second].slice(0, max).filter((item) => {
    if (!meta.get(item)?.thanFile) return true;
    if (thanShown) return false;
    thanShown = true;
    return true;
  });
  // Đoạn đứng đầu: ưu tiên đoạn đầy đủ về chính tinh của cung, rồi mới tới đoạn đầy đủ khác, cuối cùng là đoạn không quá ngắn.
  const leadable = (item: KnowledgeMatch, minLength: number) => item.interpretation.text.length >= minLength && !meta.get(item)?.alarm;
  let leadIndex = ordered.findIndex((item) => leadable(item, LEAD_TEXT) && meta.get(item)?.subject.startsWith("main:"));
  if (leadIndex < 0) leadIndex = ordered.findIndex((item) => leadable(item, LEAD_TEXT));
  if (leadIndex < 0) leadIndex = ordered.findIndex((item) => leadable(item, SHORT_TEXT));
  if (leadIndex > 0) ordered.unshift(...ordered.splice(leadIndex, 1));
  // Câu khẩu hiệu một dòng ("Nguồn tiền tài ổn định") chỉ giữ khi cung chưa có đủ 2 đoạn đầy đủ.
  const substantial = ordered.filter((item) => item.interpretation.text.length >= SLOGAN_TEXT).length;
  const kept = substantial >= 2 ? ordered.filter((item) => item.interpretation.text.length >= SLOGAN_TEXT) : ordered;
  // Khối tóm tắt của bài bố cục (thường nhắc lại đoạn chính của cung) chỉ thêm khi cung còn ít đoạn.
  if (layout && kept.length < MIN_ITEMS_BEFORE_LAYOUT) kept.push(layout);
  // Văn phong đại chúng chỉ lấp chỗ khi cung gần như không có đoạn nào khác.
  if (pop && kept.length < 2) kept.push(pop);
  return kept;
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
    // Chính tinh: tối đa 2 đoạn (nhiều khía cạnh); sao phụ / Tứ Hóa / phi hóa: 1 đoạn (hai nguồn thường chép cùng ý).
    if (used >= (subject.startsWith("main:") ? MAX_TEXTS_PER_SUBJECT : 1)) continue;
    perSubject.set(subject, used + 1);
    allowed.add(item);
  }
  const diverse = notSubsumed.filter((item) => allowed.has(item));

  const top = diverse[0]?.matchScore ?? 0;
  return diverse.filter((item) => item.matchScore >= top * MIN_RELATIVE_SCORE);
}
