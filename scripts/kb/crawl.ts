/**
 * Crawler V1 - chỉ các nguồn khai báo trong data/kb/sources.json (SOURCE_REGISTRY).
 *
 *   npm run crawl                         tất cả nguồn allowed, mặc định 30 trang / nguồn
 *   npm run crawl -- --source=khamthientuhoa,thayungkhiem
 *   npm run crawl -- --limit=100
 *   npm run crawl -- --dry-run            chỉ tìm URL + kiểm robots.txt, không tải trang, không ghi dữ liệu
 *   npm run crawl -- --resume             tiếp tục từ checkpoint (bỏ qua URL đã tải)
 *
 * Tuân thủ: robots.txt (Disallow / Crawl-delay), giãn cách max(khai báo, robots), User-Agent thật có liên hệ,
 * gặp 401/403/429 / CAPTCHA -> dừng nguồn. Không đăng nhập, không vượt paywall / chống bot.
 *
 * Ra: data/kb/raw/<nguồn>.jsonl (bản chép cục bộ để trích xuất - không commit, không đưa lên web),
 *     data/kb/state/<nguồn>.json (checkpoint), data/kb/logs/crawl-errors.jsonl.
 */
import { parseRobots, isAllowed, type RobotsRules } from "./lib/robots";
import { PoliteFetcher, StopSourceError } from "./lib/politeFetch";
import { normalizeText, parseForumPage, parseHtmlPage, sha256, sitemapUrls } from "./lib/text";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const KB_DIR = path.join(ROOT, "data/kb");
const RAW_DIR = path.join(KB_DIR, "raw");
const STATE_DIR = path.join(KB_DIR, "state");
const LOG_DIR = path.join(KB_DIR, "logs");
const LOCK = path.join(KB_DIR, "crawl.lock");

type Source = {
  id: string; name: string; baseUrl: string; type: string; school: string; school_evidence?: string; method: string | null;
  author: string | null; allowed: boolean; rights: string; reliability: number; crawlDelaySec: number;
  discovery: { sitemaps?: string[]; include?: string; exclude?: string; priority?: string; seeds?: string[] }; contentSelector: string;
};
type State = { visited: Record<string, { at: string; status: number; hash?: string }>; hashes: Record<string, string>; startedAt: string };

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
) as Record<string, string | boolean>;
const DRY = Boolean(args["dry-run"]);
const RESUME = Boolean(args.resume);
const LIMIT = Number(args.limit) || 30;
const ONLY = typeof args.source === "string" ? String(args.source).split(",") : null;

const now = () => new Date().toISOString();
const logError = (entry: Record<string, unknown>) => {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(path.join(LOG_DIR, "crawl-errors.jsonl"), JSON.stringify({ at: now(), ...entry }) + "\n");
};
const writeJson = (file: string, data: unknown) => {
  fs.writeFileSync(file + ".tmp", JSON.stringify(data, null, 1));
  fs.renameSync(file + ".tmp", file); // ghi nguyên tử: checkpoint không bị hỏng khi dừng giữa chừng
};

/** URL chuẩn để phát hiện trùng: bỏ #, tham số theo dõi, "/" cuối. */
export function canonicalize(url: string): string {
  const u = new URL(url);
  u.hash = "";
  for (const key of [...u.searchParams.keys()]) if (/^(utm_|fbclid|gclid|ref$|amp$)/i.test(key)) u.searchParams.delete(key);
  u.hostname = u.hostname.toLowerCase();
  return u.toString().replace(/\/$/, "");
}

async function crawlSource(source: Source, userAgent: string) {
  const statePath = path.join(STATE_DIR, `${source.id}.json`);
  const rawPath = path.join(RAW_DIR, `${source.id}.jsonl`);
  let state: State = { visited: {}, hashes: {}, startedAt: now() };
  if (RESUME && fs.existsSync(statePath)) state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  else if (!DRY && fs.existsSync(rawPath)) {
    // Lần chạy mới không ghi đè dữ liệu cũ: đổi tên bản trước theo thời điểm.
    fs.renameSync(rawPath, rawPath.replace(/\.jsonl$/, `.${Date.now()}.jsonl`));
  }

  // robots.txt trước mọi yêu cầu khác (không giãn cách cho chính robots.txt ngoài mặc định).
  const bootstrap = new PoliteFetcher(userAgent, 1000);
  let robots: RobotsRules = { rules: [], crawlDelaySec: null };
  try {
    const res = await bootstrap.get(new URL("/robots.txt", source.baseUrl).toString());
    if (res.status === 200) robots = parseRobots(res.body, "TuViPhongLamKB");
    else if (res.status >= 500) throw new Error(`robots.txt HTTP ${res.status}`);
  } catch (error) {
    // Không đọc được robots.txt vì lỗi máy chủ -> không crawl (thận trọng).
    logError({ source: source.id, stage: "robots", error: String(error) });
    console.log(`  ✗ ${source.id}: không đọc được robots.txt - bỏ qua nguồn`);
    return { fetched: 0, skipped: 0, stopped: "robots" };
  }
  const delaySec = Math.max(source.crawlDelaySec, robots.crawlDelaySec ?? 0);
  const fetcher = new PoliteFetcher(userAgent, delaySec * 1000);
  console.log(`  robots.txt: ${robots.rules.length} luật, Crawl-delay ${robots.crawlDelaySec ?? "-"}; giãn cách dùng ${delaySec}s`);

  // Tìm URL: sitemap (lọc theo include) + seeds.
  const include = source.discovery.include ? new RegExp(source.discovery.include, "i") : null;
  const found: string[] = [...(source.discovery.seeds ?? [])];
  for (const sitemap of source.discovery.sitemaps ?? []) {
    if (!isAllowed(robots, sitemap)) continue;
    try {
      const res = await fetcher.get(sitemap);
      if (res.status !== 200) {
        logError({ source: source.id, stage: "sitemap", url: sitemap, status: res.status });
        continue;
      }
      for (const url of sitemapUrls(res.body)) if (!include || include.test(new URL(url).pathname)) found.push(url);
    } catch (error) {
      if (error instanceof StopSourceError) throw error;
      logError({ source: source.id, stage: "sitemap", url: sitemap, error: String(error) });
    }
  }
  const baseHost = new URL(source.baseUrl).hostname;
  // Khóa trùng = URL chuẩn hóa; vẫn tải đúng URL gốc (tránh thêm lượt chuyển hướng).
  const original = new Map<string, string>();
  for (const url of found) if (!original.has(canonicalize(url))) original.set(canonicalize(url), url);
  // exclude: trang không phải tri thức (vd "tài liệu PDF miễn phí" - thường là bản sách chưa rõ quyền phát hành).
  // priority: bài định nghĩa khái niệm lên trước (lượt chạy thử lấy ít trang).
  const exclude = source.discovery.exclude ? new RegExp(source.discovery.exclude, "i") : null;
  const priority = source.discovery.priority ? new RegExp(source.discovery.priority, "i") : null;
  const queue = [...original.keys()]
    .filter((url) => new URL(url).hostname.endsWith(baseHost.replace(/^www\./, "")) && !(exclude && exclude.test(new URL(url).pathname)))
    .sort((a, b) => Number(Boolean(priority?.test(b))) - Number(Boolean(priority?.test(a))));
  const blocked = queue.filter((url) => !isAllowed(robots, url));
  const todo = queue.filter((url) => isAllowed(robots, url) && !state.visited[url]).slice(0, LIMIT);
  console.log(`  URL tìm thấy ${queue.length}, robots chặn ${blocked.length}, đã tải trước đó ${Object.keys(state.visited).length}, lượt này ${todo.length}`);
  if (DRY) {
    for (const url of todo.slice(0, 15)) console.log(`    · ${url}`);
    return { fetched: 0, skipped: 0, stopped: null };
  }

  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.mkdirSync(STATE_DIR, { recursive: true });
  let fetched = 0;
  let skipped = 0;
  for (const url of todo) {
    try {
      const res = await fetcher.get(original.get(url) ?? url);
      state.visited[url] = { at: now(), status: res.status };
      if (res.status !== 200 || !/html/i.test(res.contentType)) {
        logError({ source: source.id, stage: "page", url, status: res.status, contentType: res.contentType });
        skipped++;
        continue;
      }
      const page = source.type === "FORUM" ? parseForumPage(res.body, source.contentSelector) : parseHtmlPage(res.body, source.contentSelector);
      const canonical = page.canonicalUrl ? canonicalize(new URL(page.canonicalUrl, url).toString()) : canonicalize(res.finalUrl);
      const pageText = page.blocks.map((b) => b.text).join("\n");
      const hash = sha256(normalizeText(pageText));
      state.visited[url].hash = hash;
      if (canonical !== url && state.visited[canonical]?.hash) {
        skipped++; // trùng URL (canonical đã tải)
      } else if (state.hashes[hash]) {
        skipped++; // trùng nội dung với trang khác
      } else if (!page.blocks.length) {
        logError({ source: source.id, stage: "parse", url, error: "không tìm thấy nội dung chính" });
        skipped++;
      } else {
        state.hashes[hash] = url;
        fs.appendFileSync(
          rawPath,
          JSON.stringify({
            source_id: source.id, url, final_url: res.finalUrl, canonical_url: canonical, fetched_at: now(), status: res.status,
            title: page.title, author: page.author ?? source.author, published_at: page.publishedAt, lang: page.lang,
            intro: page.intro, page_hash: hash, blocks: page.blocks,
          }) + "\n",
        );
        fetched++;
        console.log(`    ✓ ${page.blocks.length} đoạn  ${page.title.slice(0, 70)}`);
      }
    } catch (error) {
      if (error instanceof StopSourceError) {
        logError({ source: source.id, stage: "stop", url, error: error.message });
        console.log(`  ■ ${error.message}`);
        writeJson(statePath, state);
        return { fetched, skipped, stopped: error.message };
      }
      logError({ source: source.id, stage: "page", url, error: String(error) });
      skipped++;
    }
    writeJson(statePath, state); // checkpoint sau mỗi trang -> --resume tiếp tục được
  }
  return { fetched, skipped, stopped: null };
}

async function main() {
  const registry = JSON.parse(fs.readFileSync(path.join(KB_DIR, "sources.json"), "utf8")) as { userAgent: string; sources: Source[] };
  const sources = registry.sources.filter((s) => s.allowed && (!ONLY || ONLY.includes(s.id)));
  if (ONLY) for (const id of ONLY) if (!registry.sources.some((s) => s.id === id)) throw new Error(`Nguồn "${id}" không có trong SOURCE_REGISTRY`);
  if (!DRY) {
    if (fs.existsSync(LOCK)) throw new Error(`Đang có một lượt crawl khác (${LOCK}). Xóa file này nếu lượt trước đã dừng hẳn.`);
    fs.writeFileSync(LOCK, String(process.pid));
  }
  try {
    console.log(`Crawler V1 ${DRY ? "(dry-run) " : ""}- ${sources.length} nguồn, tối đa ${LIMIT} trang / nguồn${RESUME ? ", tiếp tục checkpoint" : ""}`);
    for (const source of sources) {
      console.log(`\n▶ ${source.name}`);
      const result = await crawlSource(source, registry.userAgent);
      console.log(`  → tải ${result.fetched}, bỏ qua ${result.skipped}${result.stopped ? `, DỪNG: ${result.stopped}` : ""}`);
    }
  } finally {
    if (!DRY && fs.existsSync(LOCK)) fs.unlinkSync(LOCK);
  }
}

// Chỉ chạy khi gọi trực tiếp file bundle của lệnh này (không chạy khi được import, vd trong test).
if (/kb-crawl.js$/.test(process.argv[1] ?? "")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
