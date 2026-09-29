/**
 * POST /api/knowledge/query - khớp tri thức luận giải trên server (chế độ VITE_KNOWLEDGE_MODE=server).
 *
 * Body: { facts: SerializedChartFacts, palaces: [{ name, isBodyPalace }] }
 *   facts do trình duyệt tính từ lá số (buildChartFacts + computePeriod) - không gửi họ tên / ngày giờ sinh.
 * Trả: { success, results: { [tên cung]: KnowledgeMatch[] } } - cùng thuật toán với chế độ trình duyệt
 *   (knowledgeQueryCore), chỉ đọc mảnh kho theo địa chi của cung (dist/_kb, sinh bởi scripts/buildKnowledgeShards.mjs).
 *
 * Cần gói Workers Paid: giới hạn 10ms CPU của gói Free không đủ để đọc + khớp kho (đo: 17-78ms mỗi cung).
 */
import { buildCorsHeaders } from "../ai/_shared/cors";
import { checkRateLimit, rateLimitResponse, type RateLimitEnv } from "../ai/_shared/rateLimit";
import { deserializeChartFacts, palaceKey } from "../../../src/lib/tuvi/knowledge/conditionMatcher";
import { PALACE_IDS, queryCandidates, resolveFile, type IndexedEntry, type NormalizedFile } from "../../../src/lib/tuvi/knowledge/knowledgeQueryCore";

interface Env extends RateLimitEnv {
  ASSETS: { fetch: (request: Request | string) => Promise<Response> };
}

const BRANCH_SHARD: Record<string, string> = { "tý": "ty", "sửu": "suu", "dần": "dan", "mão": "mao", "thìn": "thin", "tỵ": "ti", "ngọ": "ngo", "mùi": "mui", "thân": "than", "dậu": "dau", "tuất": "tuat", "hợi": "hoi" };
const MAX_BODY_BYTES = 64 * 1024;

// Mảnh kho đã parse, giữ trong isolate giữa các request (giới hạn số mảnh để không vượt bộ nhớ Worker).
const shardCache = new Map<string, Promise<IndexedEntry[]>>();
const MAX_CACHED_SHARDS = 30; // ~35 MB heap (đo: 39 mảnh ≈ 43 MB) - dư xa giới hạn 128 MB của Worker

function loadShard(env: Env, origin: string, file: string, shard: string): Promise<IndexedEntry[]> {
  const path = `/_kb/${file}/${shard}.json`;
  let cached = shardCache.get(path);
  if (!cached) {
    cached = env.ASSETS.fetch(new Request(new URL(path, origin).toString())).then(async (res) => {
      if (!res.ok) throw new Error(`Thiếu mảnh kho ${path} (${res.status})`);
      return resolveFile((await res.json()) as NormalizedFile);
    });
    cached.catch(() => shardCache.delete(path));
    shardCache.set(path, cached);
    while (shardCache.size > MAX_CACHED_SHARDS) shardCache.delete(shardCache.keys().next().value!);
  } else {
    // LRU: mảnh vừa dùng lên cuối hàng
    shardCache.delete(path);
    shardCache.set(path, cached);
  }
  return cached;
}

const json = (data: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...headers } });

// Kiểu tối thiểu của context Pages Function (không phụ thuộc gói @cloudflare/workers-types).
type FunctionContext<E> = { request: Request; env: E };

export const onRequestPost = async (context: FunctionContext<Env>): Promise<Response> => {
  const { env, request } = context;
  const cors = buildCorsHeaders(request);
  const rateLimit = await checkRateLimit(env, request, { keyPrefix: "knowledge", limit: 240, windowSeconds: 3600 });
  if (!rateLimit.allowed) return rateLimitResponse(cors);

  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return json({ success: false, error: "Dữ liệu quá lớn" }, 413, cors);
    const body = JSON.parse(raw) as { facts?: unknown; palaces?: Array<{ name?: unknown; isBodyPalace?: unknown }> };
    const facts = deserializeChartFacts(body.facts);
    if (!facts || !Array.isArray(body.palaces) || body.palaces.length > 12) return json({ success: false, error: "Dữ liệu lá số không hợp lệ" }, 400, cors);

    const origin = new URL(request.url).origin;
    const results: Record<string, unknown> = {};
    for (const requested of body.palaces) {
      const name = String(requested?.name ?? "");
      const key = palaceKey(name);
      const id = key ? PALACE_IDS[key] : undefined;
      const palace = key ? facts.palaces.get(key) : undefined;
      if (!key || !id || !palace) continue;
      const shard = BRANCH_SHARD[palace.branch];
      const file = id.replace(/_/g, "-");
      const lists = await Promise.all([
        loadShard(env, origin, file, "any"),
        loadShard(env, origin, file, shard),
        ...(requested.isBodyPalace || palace.isBody ? [loadShard(env, origin, "than", "any"), loadShard(env, origin, "than", shard)] : []),
      ]);
      // Cùng thứ tự ứng viên như chế độ trình duyệt: đoạn của cung theo vị trí gốc trong file, rồi đoạn Cung Thân.
      const byPosition = (a: IndexedEntry, b: IndexedEntry) => ((a.entry as { o?: number }).o ?? 0) - ((b.entry as { o?: number }).o ?? 0);
      const own = [...lists[0], ...lists[1]].sort(byPosition);
      const thanEntries = lists.length > 2 ? [...lists[2], ...lists[3]].sort(byPosition) : [];
      results[name] = queryCandidates([...own, ...thanEntries], facts, key).map(({ trimmedDetails: _details, ...match }) => match);
    }
    return json({ success: true, results }, 200, { ...cors, "Cache-Control": "no-store" });
  } catch (error) {
    console.error("[knowledge/query]", error);
    return json({ success: false, error: "Chưa tải được tri thức luận giải. Vui lòng thử lại." }, 500, cors);
  }
};

export const onRequestOptions = async (context: { request: Request }): Promise<Response> => new Response(null, { headers: buildCorsHeaders(context.request) });
