/**
 * Lazy Knowledge Loader
 * Load tri thức sau 15 giây khi UI đã render xong
 * OPTIMIZED: Chỉ load consolidated files (~40MB → giảm từ ~95MB)
 */

type KnowledgeData = Record<string, unknown>;
type LoadStatus = "idle" | "loading" | "loaded" | "error";

let knowledgeCache: KnowledgeData | null = null;
let loadStatus: LoadStatus = "idle";
let loadPromise: Promise<KnowledgeData> | null = null;
const listeners: Array<() => void> = [];

const LAZY_LOAD_DELAY = 15000; // 15 giây

/**
 * Dynamic import consolidated knowledge files only
 */
async function loadAllKnowledge(): Promise<KnowledgeData> {
  const [
    // 12 Consolidated files (main data source)
    menhConsolidated,
    phuMauConsolidated,
    phucDucConsolidated,
    dienTrachConsolidated,
    quanLocConsolidated,
    noBocConsolidated,
    thienDiConsolidated,
    tatAchConsolidated,
    taiBachConsolidated,
    tuTucConsolidated,
    phuTheConsolidated,
    huynhDeConsolidated,
    // Thân + Tổng quan
    thanConsolidated,
    tongQuanConsolidated,
    // Star combinations (essential)
    starCombinationsData,
  ] = await Promise.all([
    // Consolidated files
    import("./cung/menh-consolidated.json"),
    import("./cung/phu-mau-consolidated.json"),
    import("./cung/phuc-duc-consolidated.json"),
    import("./cung/dien-trach-consolidated.json"),
    import("./cung/quan-loc-consolidated.json"),
    import("./cung/no-boc-consolidated.json"),
    import("./cung/thien-di-consolidated.json"),
    import("./cung/tat-ach-consolidated.json"),
    import("./cung/tai-bach-consolidated.json"),
    import("./cung/tu-tuc-consolidated.json"),
    import("./cung/phu-the-consolidated.json"),
    import("./cung/huynh-de-consolidated.json"),
    // Thân + Tổng quan
    import("./cung/than-consolidated.json"),
    import("./cung/tong-quan-consolidated.json"),
    // Star combinations
    import("./cung/star-combinations.json"),
  ]);

  return {
    // Consolidated (main data)
    menhConsolidated: menhConsolidated.default,
    phuMauConsolidated: phuMauConsolidated.default,
    phucDucConsolidated: phucDucConsolidated.default,
    dienTrachConsolidated: dienTrachConsolidated.default,
    quanLocConsolidated: quanLocConsolidated.default,
    noBocConsolidated: noBocConsolidated.default,
    thienDiConsolidated: thienDiConsolidated.default,
    tatAchConsolidated: tatAchConsolidated.default,
    taiBachConsolidated: taiBachConsolidated.default,
    tuTucConsolidated: tuTucConsolidated.default,
    phuTheConsolidated: phuTheConsolidated.default,
    huynhDeConsolidated: huynhDeConsolidated.default,
    thanConsolidated: thanConsolidated.default,
    tongQuanConsolidated: tongQuanConsolidated.default,
    // Star combinations
    starCombinationsData: starCombinationsData.default,
  };
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
