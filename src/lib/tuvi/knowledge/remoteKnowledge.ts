/**
 * Chế độ server: trình duyệt gửi dữ kiện lá số (không kèm họ tên / ngày giờ sinh) tới /api/knowledge/query một lần cho
 * cả 12 cung, lưu kết quả theo lá số + năm xem; queryPalaceKnowledge đọc lại đồng bộ như chế độ trình duyệt.
 * Lỗi mạng -> các cung không có tri thức (thẻ cung vẫn hiển thị dữ liệu lá số), lần sau thử lại.
 */
import type { ChartView } from "../../types";
import { buildChartFacts, computePeriod, serializeChartFacts } from "./conditionMatcher";
import type { KnowledgeMatch } from "./lazyKnowledgeService";

type Years = { yearToView?: number; birthYear?: number };
type Results = Map<string, KnowledgeMatch[]>;

const cache = new WeakMap<ChartView, Map<string, { promise: Promise<Results>; results?: Results }>>();
const yearsKey = (years: Years) => `${years.yearToView ?? ""}|${years.birthYear ?? ""}`;

export function prefetchChartKnowledge(chart: ChartView, years: Years): Promise<Results> {
  let byYears = cache.get(chart);
  if (!byYears) cache.set(chart, (byYears = new Map()));
  const key = yearsKey(years);
  const existing = byYears.get(key);
  if (existing) return existing.promise;

  const base = buildChartFacts(chart);
  const period = computePeriod(chart, years.yearToView, years.birthYear);
  const record: { promise: Promise<Results>; results?: Results } = { promise: Promise.resolve(new Map()) };
  record.promise = fetch("/api/knowledge/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      facts: serializeChartFacts(period ? { ...base, period } : base),
      palaces: chart.palaces.map((p) => ({ name: p.name, isBodyPalace: Boolean(p.isBodyPalace) })),
    }),
  })
    .then(async (res) => {
      const data = (await res.json()) as { success?: boolean; results?: Record<string, KnowledgeMatch[]> };
      if (!res.ok || !data.success) throw new Error(`knowledge/query ${res.status}`);
      return new Map(Object.entries(data.results ?? {}));
    })
    .then((results) => {
      record.results = results;
      return results;
    })
    .catch((error) => {
      console.error("[knowledge] Không tải được tri thức từ server:", error);
      byYears!.delete(key); // lần sau thử lại
      const empty: Results = new Map();
      record.results = empty;
      return empty;
    });
  byYears.set(key, record);
  return record.promise;
}

export function isRemoteReady(chart: ChartView, years: Years): boolean {
  return Boolean(cache.get(chart)?.get(yearsKey(years))?.results);
}

export function getRemoteMatches(chart: ChartView, years: Years, palaceName: string): KnowledgeMatch[] {
  return cache.get(chart)?.get(yearsKey(years))?.results?.get(palaceName) ?? [];
}
