/**
 * Lazy Knowledge Loader
 * Load tri thức sau 15 giây khi UI đã render xong
 * Dùng bản đã làm mịn (~18MB, điều kiện parse sẵn) thay cho dữ liệu crawl gốc (~34MB).
 */

type KnowledgeData = Record<string, unknown>;
type LoadStatus = "idle" | "loading" | "loaded" | "error";

let knowledgeCache: KnowledgeData | null = null;
let loadStatus: LoadStatus = "idle";
let loadPromise: Promise<KnowledgeData> | null = null;
const listeners: Array<() => void> = [];

const LAZY_LOAD_DELAY = 15000; // 15 giây

/**
 * Dynamic import Knowledge Base đã làm mịn (cung/normalized/*.json - sinh bởi `npm run knowledge:normalize`).
 * Mỗi file: điều kiện đã parse sẵn, đã bỏ mục không dùng được và gộp nội dung trùng.
 */
const NORMALIZED_FILES = [
  "menh", "phu-mau", "phuc-duc", "dien-trach", "quan-loc", "no-boc", "thien-di",
  "tat-ach", "tai-bach", "tu-tuc", "phu-the", "huynh-de", "than", "tong-quan",
] as const;

async function loadAllKnowledge(): Promise<KnowledgeData> {
  const modules = await Promise.all([
    import("./cung/normalized/menh.json"),
    import("./cung/normalized/phu-mau.json"),
    import("./cung/normalized/phuc-duc.json"),
    import("./cung/normalized/dien-trach.json"),
    import("./cung/normalized/quan-loc.json"),
    import("./cung/normalized/no-boc.json"),
    import("./cung/normalized/thien-di.json"),
    import("./cung/normalized/tat-ach.json"),
    import("./cung/normalized/tai-bach.json"),
    import("./cung/normalized/tu-tuc.json"),
    import("./cung/normalized/phu-the.json"),
    import("./cung/normalized/huynh-de.json"),
    import("./cung/normalized/than.json"),
    import("./cung/normalized/tong-quan.json"),
  ]);
  return Object.fromEntries(NORMALIZED_FILES.map((name, i) => [name, modules[i].default]));
}

/**
 * Bắt đầu preload sau delay
 */
export function scheduleKnowledgePreload(delayMs = LAZY_LOAD_DELAY): void {
  if (loadStatus !== "idle") return;

  setTimeout(() => {
    if (loadStatus === "idle") {
      loadKnowledge();
    }
  }, delayMs);
}

/**
 * Load knowledge ngay lập tức (khi user cần)
 */
export async function loadKnowledge(): Promise<KnowledgeData> {
  if (knowledgeCache) return knowledgeCache;
  if (loadPromise) return loadPromise;

  loadStatus = "loading";
  loadPromise = loadAllKnowledge()
    .then((data) => {
      knowledgeCache = data;
      loadStatus = "loaded";
      listeners.forEach((fn) => fn());
      return data;
    })
    .catch((err) => {
      loadStatus = "error";
      console.error("[LazyKnowledge] Load failed:", err);
      throw err;
    });

  return loadPromise;
}

/**
 * Lấy knowledge đã load (sync)
 */
export function getKnowledgeCache(): KnowledgeData | null {
  return knowledgeCache;
}

/**
 * Kiểm tra trạng thái load
 */
export function getLoadStatus(): LoadStatus {
  return loadStatus;
}

/**
 * Đăng ký listener khi knowledge loaded
 */
export function onKnowledgeLoaded(callback: () => void): () => void {
  if (loadStatus === "loaded") {
    callback();
    return () => {};
  }
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

/**
 * Check if knowledge is ready
 */
export function isKnowledgeReady(): boolean {
  return loadStatus === "loaded" && knowledgeCache !== null;
}
