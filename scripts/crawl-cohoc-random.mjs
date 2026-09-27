#!/usr/bin/env node
/**
 * Crawl tri thức luận giải từ các lá số NGẪU NHIÊN trên tuvi.cohoc.net (Bắc phái).
 * Crawl xong lá số nào thì nạp NGAY lá số đó vào masterdata cung/*-consolidated.json (khử trùng trên master,
 * không lưu bản crawl thô) rồi chạy bước làm sạch (npm run knowledge:normalize) để sinh kho tri thức dùng trên web.
 * Có khoá tuvi_crawler/crawl.lock: không cho 2 crawler cùng ghi master.
 *
 * Cách site hoạt động (kiểm tra 2026-09-27):
 *  - Form https://tuvi.cohoc.net/la-so-tu-vi-bac-phai.html (giới tính, ngày, tháng, năm, giờ) -> submit.
 *  - Site chuyển tới trang chờ /404.html?ref=cache-bp-not-found&id=<lid>...; script trong trang ghi sẵn
 *    link_redirect = '...bac-phai-la-so-tu-vi-co-hoc-lid-' + id + '.html?TokenCSRF=...'. Trong trình duyệt
 *    headless trang chờ không tự chuyển -> script này tự đọc link, chờ đúng thời gian trang yêu cầu rồi mở.
 *  - Site giới hạn tần suất (from=home-ua-limit / from=isVipID) -> script chạy chậm, lùi lại khi bị giới hạn.
 *  - Mỗi khối luận giải: <div class='giaidoan chinhxac-N'><h4 class='nguyennhan'>điều kiện</h4>
 *    <p class='ketqua'>nội dung</p><em class='thamkhao'>sách - tác giả</em></div>
 *
 * Nguồn (sách/tác giả) chỉ lưu trong file consolidated để tra cứu nội bộ; bước normalize không đưa nguồn
 * ra dữ liệu tải về trình duyệt (xem scripts/normalizeKnowledge.ts).
 *
 * Usage:
 *   node scripts/crawl-cohoc-random.mjs                 # 5 lá số ngẫu nhiên, gộp + normalize
 *   node scripts/crawl-cohoc-random.mjs --count 20      # 20 lá số
 *   node scripts/crawl-cohoc-random.mjs --dry-run       # crawl + báo cáo trùng/mới, KHÔNG ghi vào kho
 *   node scripts/crawl-cohoc-random.mjs --no-normalize  # nạp vào master nhưng không chạy normalize
 *   node scripts/crawl-cohoc-random.mjs --delay 120     # giây nghỉ giữa 2 lá số (mặc định 90, có dao động)
 *   node scripts/crawl-cohoc-random.mjs --headed        # mở trình duyệt có giao diện để theo dõi
 *   node scripts/crawl-cohoc-random.mjs --seed 42       # tái lập bộ ngày giờ sinh ngẫu nhiên
 * Biến môi trường: CHROME_PATH (mặc định Chrome cài trên Windows; không có thì dùng Chromium của Playwright).
 */

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const FORM_URL = "https://tuvi.cohoc.net/la-so-tu-vi-bac-phai.html";
const PROGRESS_FILE = path.join(ROOT, "tuvi_crawler", "random_crawl_progress.json");
const KNOWLEDGE_DIR = path.join(ROOT, "src", "lib", "tuvi", "knowledge", "cung");
const LOCK_FILE = path.join(ROOT, "tuvi_crawler", "crawl.lock");
// Số liệu riêng của một lá số (điểm "xí hoa", "Thông tin cung ...", thống kê ...) - không phải tri thức dùng lại;
// cùng tiêu chí "bản trích / thống kê lá số khác" của normalizeKnowledge.ts.
const CHART_SPECIFIC = /^Thông tin|^Phân tích|Điểm "|^Thống kê|^Nguyên thần|^Ngũ hành Hỉ Kị|xí hoa|^Tổng luận chủ đề|^Khảo sát|^Vận tháng|^Mức độ tốt xấu|^Dự đoán chỉ số/i;

// ============ ARGS ============
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const option = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] !== undefined ? Number(argv[i + 1]) : fallback;
};
const COUNT = option("count", 5);
const DELAY_SECONDS = option("delay", 90);
const DRY_RUN = flag("dry-run");
const RUN_NORMALIZE = !flag("no-normalize") && !DRY_RUN;
const HEADED = flag("headed");
let seed = option("seed", Date.now() % 2147483647);
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const randInt = (min, max) => min + Math.floor(random() * (max - min + 1));

const MAX_LIMIT_HITS = 7; // số lần bị giới hạn liên tiếp trước khi dừng hẳn (~3.5 giờ nghỉ dồn)
const COOLDOWN_MINUTES = [5, 10, 20, 30, 60, 60, 60];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (tag, msg) => console.log(`${new Date().toLocaleTimeString("vi-VN")} [${tag}] ${msg}`);

// ============ PALACE MAPPING ============
// Điều kiện -> file consolidated. Thứ tự quan trọng: "Cung Thân" trước khi xét tên cung khác.
const PALACE_FILES = [
  ["menh", /cung mệnh/],
  ["than", /cung thân(?![\p{L}])/u],
  ["phu-mau", /cung phụ mẫu/],
  ["phuc-duc", /cung phúc đức/],
  ["dien-trach", /cung điền trạch/],
  ["quan-loc", /cung quan lộc|cung sự nghiệp/],
  ["no-boc", /cung nô bộc|cung giao hữu/],
  ["thien-di", /cung thiên di/],
  ["tat-ach", /cung tật ách/],
  ["tai-bach", /cung tài bạch/],
  ["tu-tuc", /cung tử tức|cung tử nữ/],
  ["phu-the", /cung phu thê/],
  ["huynh-de", /cung huynh đệ/],
];
const palaceOf = (condition) => {
  const lower = condition.toLowerCase();
  // Điều kiện đại vận / lưu niên vẫn thuộc cung được nêu ĐẦU TIÊN trong câu
  let best = null;
  for (const [id, re] of PALACE_FILES) {
    const m = lower.match(re);
    if (m && (best === null || m.index < best.index)) best = { id, index: m.index };
  }
  if (best) return best.id;
  if (/tổng quan|lá số|xí hoa|mệnh chủ|thân chủ|cục số/.test(lower)) return "tong-quan";
  // "Cung Đại vận tại Dậu có ...", "Cung ĐV. Tật ách phi Hóa lộc ..." - tri thức vận hạn không gắn cung nguyên cục
  if (/đại vận|đại hạn|lưu niên|tiểu vận|nguyệt vận|(?<![\p{L}])đv\./u.test(lower)) return "van-han";
  return null;
};

// ============ PARSE ============
// Dấu của entity chữ có dấu (&uacute; &ocirc; &Agrave; ...) -> ký tự tổ hợp, rồi NFC
const ENTITY_MARKS = { acute: "́", grave: "̀", tilde: "̃", circ: "̂", uml: "̈" };
const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&([a-zA-Z])(acute|grave|tilde|circ|uml);/g, (_m, letter, mark) => (letter + ENTITY_MARKS[mark]).normalize("NFC"))
    .replace(/&#(\d+);/g, (_m, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&");
const htmlToText = (s) => decodeEntities(s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")).replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();

export function parseChartPage(html) {
  const blocks = [];
  const re = /<div[^>]*class=['"]giaidoan(?:\s+chinhxac-(\d+))?[^'"]*['"][^>]*>\s*<h4[^>]*class=['"]nguyennhan['"][^>]*>([\s\S]*?)<\/h4>\s*<p[^>]*class=['"]ketqua['"][^>]*>([\s\S]*?)<\/p>\s*(?:<em[^>]*class=['"]thamkhao['"][^>]*>([\s\S]*?)<\/em>)?/gi;
  let m;
  while ((m = re.exec(html))) {
    const condition = htmlToText(m[2]).replace(/\s+/g, " ");
    const text = htmlToText(m[3]);
    const ref = m[4] ? htmlToText(m[4]).replace(/\s+/g, " ") : "";
    if (!condition || text.length < 10) continue;
    // Số liệu site tự tính cho riêng lá số đó (điểm xí hoa, khảo sát vượng suy...) - không phải tri thức dùng lại được.
    if (/tính toán tự động/i.test(ref)) continue;
    // "Sách - Tác giả" (tách ở dấu gạch cuối cùng); không có gạch thì cả chuỗi là tên sách
    const dash = ref.lastIndexOf(" - ");
    const source = ref ? (dash > 0 ? { book: ref.slice(0, dash).trim(), author: ref.slice(dash + 3).trim() } : { book: ref }) : { book: "tuvi.cohoc.net" };
    blocks.push({ condition, text, source, accuracy: Number(m[1]) || 7 });
  }
  return blocks;
}

// ============ DEDUPE ============
// Cùng cách so với normalizeKnowledge.ts: không phân biệt hoa thường, khoảng trắng, dấu câu.
const textKey = (s) => String(s || "").normalize("NFC").toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, " ").trim();
const entryKey = (condition, text) => `${textKey(condition)}||${textKey(text)}`;

function loadKnowledge() {
  const files = {};
  const keys = new Set();
  const texts = new Set();
  for (const [id] of [...PALACE_FILES, ["tong-quan"], ["van-han"]]) {
    const file = path.join(KNOWLEDGE_DIR, `${id}-consolidated.json`);
    // Master vận hạn: tạo mới khi chưa có (normalize chưa dùng - để dành cho luận giải theo năm xem)
    const data = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, "utf8"))
      : id === "van-han"
        ? { palace: "VAN_HAN", palace_name: "Vận hạn (Đại vận / Lưu niên / Tiểu vận)", source: "tuvi.cohoc.net", interpretations: [] }
        : null;
    if (!data) continue;
    files[id] = { file, data, added: 0 };
    for (const item of data.interpretations ?? []) {
      keys.add(entryKey(item.condition, item.text));
      texts.add(textKey(item.text));
    }
  }
  return { files, keys, texts };
}

// ============ PROGRESS ============
function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
  } catch {
    return { charts: [] };
  }
}
const saveProgress = (progress) => fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

// ============ BROWSER FLOW ============
const GIO = ["Tí", "Sửu", "Dần", "Mão", "Thìn", "Tị", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

function randomBirth(seen) {
  for (let i = 0; i < 1000; i++) {
    const b = { gender: random() < 0.5 ? "nam" : "nu", day: randInt(1, 28), month: randInt(1, 12), year: randInt(1935, 2012), hour: randInt(1, 12) };
    const key = `${b.gender}-${b.day}-${b.month}-${b.year}-${b.hour}`;
    if (!seen.has(key)) return { ...b, key };
  }
  throw new Error("Không tạo được bộ ngày giờ sinh mới");
}

class RateLimited extends Error {}

/** Trang chờ -> đọc link_redirect trong script, chờ đúng thời gian trang yêu cầu, mở link. */
async function passWaitingPage(page) {
  for (let hop = 0; hop < 5 && page.url().includes("/404.html"); hop++) {
    const url = new URL(page.url());
    const ref = url.searchParams.get("ref") || "";
    const from = url.searchParams.get("from") || "";
    const id = Number(url.searchParams.get("id")) || 0;
    if (/limit/i.test(from)) throw new RateLimited(`site giới hạn tần suất (${from})`);
    const html = await page.content();
    const branch = new RegExp(`ref == '${ref.replace(/[-]/g, "\\-")}'\\)[\\s\\S]*?link_redirect = '([^']+)' \\+ id \\+ '([^']+)'`);
    const m = html.match(branch);
    if (!m || !id) throw new Error(`không đọc được link chuyển tiếp (ref=${ref}, id=${id})`);
    // time_redirect trong trang: ~2.9-4.9s + id % 5000 ms (+30s nếu from=isVipID)
    const waitMs = 5000 + (id % 5000) + (from === "isVipID" ? 30000 : 0);
    log("WAIT", `lid=${id} ${from ? `from=${from} ` : ""}chờ ${(waitMs / 1000).toFixed(1)}s`);
    await sleep(waitMs);
    await page.goto(m[1] + id + m[2], { waitUntil: "domcontentloaded", timeout: 120000 });
  }
  if (page.url().includes("/404.html")) {
    const from = new URL(page.url()).searchParams.get("from") || "";
    if (/limit/i.test(from)) throw new RateLimited(`site giới hạn tần suất (${from})`);
    throw new Error("vẫn ở trang chờ sau nhiều lần chuyển tiếp");
  }
}

async function crawlChart(page, birth) {
  await page.goto(FORM_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.check(birth.gender === "nam" ? "#rdNam" : "#rdNu");
  await page.selectOption("#ddlNgay", String(birth.day));
  await page.selectOption("#ddlThang", String(birth.month));
  await page.selectOption("#ddlNam", String(birth.year));
  await page.selectOption("#ddlGio", String(birth.hour));
  await Promise.all([page.waitForNavigation({ timeout: 120000 }).catch(() => {}), page.click("#btGiaiDoan")]);
  await passWaitingPage(page);
  await page.waitForSelector("h4.nguyennhan", { timeout: 120000 });
  await page.waitForLoadState("load", { timeout: 60000 }).catch(() => {});
  const lid = (page.url().match(/lid-(\d+)/) || [])[1];
  if (!lid) throw new Error(`không lấy được lid từ ${page.url()}`);
  return { lid, title: await page.title(), html: await page.content() };
}

// ============ MAIN ============
async function main() {
  log("START", `${COUNT} lá số, nghỉ ~${DELAY_SECONDS}s giữa các lá số${DRY_RUN ? ", DRY-RUN (không ghi kho)" : ""}`);
  if (!DRY_RUN) acquireLock();
  const progress = loadProgress();
  const seenBirths = new Set(progress.charts.map((c) => c.key));
  const seenLids = new Set(progress.charts.map((c) => c.lid).filter(Boolean));
  const kb = loadKnowledge();
  log("KB", `master hiện có ${kb.keys.size} cặp điều kiện-nội dung, ${kb.texts.size} nội dung khác nhau`);

  const executablePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
  const browser = await chromium.launch({ headless: !HEADED, ...(fs.existsSync(executablePath) ? { executablePath } : {}) });
  // Một context cho cả phiên (giữ cookie) - giống một người dùng duyệt nhiều lá số.
  // Chrome headless tự khai "HeadlessChrome" trong User-Agent -> site chặn (from=home-ua-limit). Dùng UA của Chrome thường.
  const userAgent = (await browser.newPage().then(async (p) => { const ua = await p.evaluate(() => navigator.userAgent); await p.close(); return ua; })).replace("HeadlessChrome", "Chrome");
  const context = await browser.newContext({ locale: "vi-VN", viewport: { width: 1280, height: 900 }, userAgent });
  const page = await context.newPage();

  const totals = { charts: 0, blocks: 0, newEntries: 0, newTexts: 0, newConditionsForKnownText: 0, duplicates: 0, skippedNoPalace: 0, perPalace: {} };
  let limitHits = 0;
  let normalizePending = false; // master đã có mục mới nhưng kho web chưa sinh lại thành công

  for (let n = 0; n < COUNT; ) {
    const birth = randomBirth(seenBirths);
    log("CHART", `#${n + 1}/${COUNT} ${birth.gender === "nam" ? "Nam" : "Nữ"} ${birth.day}/${birth.month}/${birth.year} giờ ${GIO[birth.hour - 1]}`);
    let result;
    try {
      result = await crawlChart(page, birth);
      limitHits = 0;
    } catch (error) {
      if (error instanceof RateLimited) {
        limitHits++;
        if (limitHits > MAX_LIMIT_HITS) {
          log("STOP", `bị giới hạn ${limitHits} lần liên tiếp - dừng, chạy lại sau`);
          break;
        }
        const minutes = COOLDOWN_MINUTES[Math.min(limitHits - 1, COOLDOWN_MINUTES.length - 1)];
        log("LIMIT", `${error.message} - nghỉ ${minutes} phút rồi thử lại`);
        await sleep(minutes * 60000);
        continue; // thử lại, không tính vào số lá số
      }
      log("ERROR", error.message);
      seenBirths.add(birth.key);
      if (!DRY_RUN) {
        progress.charts.push({ key: birth.key, error: error.message, time: new Date().toISOString() });
        saveProgress(progress);
      }
      n++;
      await sleep(DELAY_SECONDS * 1000);
      continue;
    }

    seenBirths.add(birth.key);
    n++;
    const fetchedAt = Date.now(); // khoảng nghỉ giữa 2 lần gọi site tính từ đây (nạp kho + normalize nằm trong khoảng nghỉ)
    const { lid, title, html } = result;
    if (seenLids.has(lid)) {
      log("SKIP", `lid=${lid} đã crawl trước đó`);
      if (!DRY_RUN) {
        progress.charts.push({ key: birth.key, lid, skipped: "lid đã có", time: new Date().toISOString() });
        saveProgress(progress);
      }
    } else {
      seenLids.add(lid);
      const blocks = parseChartPage(html);
      // Nạp NGAY vào masterdata (đọc lại từ đĩa, khử trùng, ghi) - không lưu bản crawl thô.
      const stats = mergeIntoMaster(blocks, lid, { write: !DRY_RUN, source: "from_random_crawl" });
      totals.charts++;
      totals.blocks += stats.blocks;
      totals.newEntries += stats.newEntries;
      totals.newTexts += stats.newTexts;
      totals.newConditionsForKnownText += stats.newEntries - stats.newTexts;
      totals.duplicates += stats.duplicates;
      totals.skippedNoPalace += stats.noPalace;
      for (const [id, added] of Object.entries(stats.perPalace)) totals.perPalace[id] = (totals.perPalace[id] || 0) + added;
      log("PARSE", `lid=${lid} "${title.slice(0, 70)}" - ${stats.blocks} khối: mới ${stats.newEntries} (nội dung mới ${stats.newTexts}), trùng ${stats.duplicates}, bỏ số liệu riêng lá số ${stats.chartSpecific}`);

      // DRY-RUN: không ghi kho / tiến độ, để lần chạy thật vẫn crawl và gộp lá số này.
      if (DRY_RUN) {
        if (n < COUNT) await sleep(DELAY_SECONDS * 1000);
        continue;
      }
      progress.charts.push({ key: birth.key, lid, title, blocks: stats.blocks, newEntries: stats.newEntries, newTexts: stats.newTexts, duplicates: stats.duplicates, time: new Date().toISOString() });
      saveProgress(progress);
      if (stats.newEntries) {
        log("KB", `đã nạp ${stats.newEntries} mục vào master (${Object.entries(stats.perPalace).map(([id, a]) => `${id} +${a}`).join(", ")})`);
        if (RUN_NORMALIZE) normalizePending = !runNormalize();
      }
    }

    if (n < COUNT) {
      const pause = DELAY_SECONDS * (0.8 + random() * 0.6);
      const remaining = Math.max(0, pause - (Date.now() - fetchedAt) / 1000);
      log("SLEEP", `nghỉ ${Math.round(remaining)}s (tổng ~${Math.round(pause)}s kể từ lúc lấy lá số)`);
      await sleep(remaining * 1000);
    }
  }
  await browser.close();
  if (normalizePending) runNormalize();

  console.log("\n━━ TỔNG KẾT");
  console.log(`Lá số crawl mới: ${totals.charts}, khối luận giải: ${totals.blocks}`);
  console.log(`Mới: ${totals.newEntries} (nội dung mới ${totals.newTexts}, điều kiện mới cho nội dung đã có ${totals.newConditionsForKnownText}); trùng kho: ${totals.duplicates}; không xác định cung: ${totals.skippedNoPalace}`);
  console.log(`Theo cung: ${Object.entries(totals.perPalace).map(([id, a]) => `${id} +${a}`).join(", ") || "-"}`);
  console.log(DRY_RUN ? "DRY-RUN: không ghi vào kho tri thức." : "Mỗi lá số đã được nạp vào cung/*-consolidated.json ngay sau khi crawl.");
  if (!DRY_RUN && totals.newEntries) console.log("Nên chạy thêm: npm run verify:knowledge && npm run quality:knowledge");
}

// ============ MASTER ============
/**
 * Gộp các khối luận giải vào masterdata cung/*-consolidated.json. Master là chuẩn: chỉ thêm mục chưa có
 * (khử trùng điều kiện + nội dung trên toàn bộ master), không sửa / chuyển cung mục đã có.
 * Đọc lại master từ đĩa ngay trước khi ghi để không đè mất thay đổi của tiến trình khác.
 * blocks: [{ condition, text, source, accuracy, fallbackPalace? }]
 */
function mergeIntoMaster(blocks, idPrefix, { write = true, source = "from_master_merge" } = {}) {
  const kb = loadKnowledge();
  const stats = { blocks: blocks.length, newEntries: 0, newTexts: 0, duplicates: 0, chartSpecific: 0, noPalace: 0, perPalace: {} };
  for (const block of blocks) {
    if (CHART_SPECIFIC.test(block.condition)) {
      stats.chartSpecific++;
      continue;
    }
    const key = entryKey(block.condition, block.text);
    if (kb.keys.has(key)) {
      stats.duplicates++;
      continue;
    }
    const palace = palaceOf(block.condition) ?? block.fallbackPalace;
    const target = palace && kb.files[palace];
    if (!target) {
      stats.noPalace++;
      continue;
    }
    if (!kb.texts.has(textKey(block.text))) stats.newTexts++;
    kb.keys.add(key);
    kb.texts.add(textKey(block.text));
    const chartId = block.source?.chart_id ?? idPrefix;
    target.data.interpretations.push({ id: `cohoc_${chartId}_${target.data.interpretations.length + 1}`, condition: block.condition, text: block.text, source: block.source, accuracy: block.accuracy });
    target.added++;
    stats.newEntries++;
    stats.perPalace[palace] = (stats.perPalace[palace] || 0) + 1;
  }
  if (write) {
    for (const f of Object.values(kb.files)) {
      if (!f.added) continue;
      f.data.total_interpretations = f.data.interpretations.length;
      f.data.consolidated_at = new Date().toISOString();
      f.data.stats = { ...(f.data.stats || {}), [source]: (f.data.stats?.[source] || 0) + f.added };
      // Ghi file tạm rồi đổi tên: dừng giữa chừng không làm hỏng master
      fs.writeFileSync(`${f.file}.tmp`, JSON.stringify(f.data, null, 2));
      fs.renameSync(`${f.file}.tmp`, f.file);
    }
  }
  return stats;
}

function runNormalize() {
  log("NORMALIZE", "sinh lại kho tri thức web (npm run knowledge:normalize)");
  // File normalized có thể đang bị tiến trình khác giữ (dev server, antivirus) -> thử lại vài lần.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = spawnSync("npm", ["run", "knowledge:normalize"], { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"], shell: true });
    if (r.status === 0) return true;
    log("WARN", `knowledge:normalize lỗi (lần ${attempt}/3)${attempt < 3 ? " - thử lại sau 5s" : ""}`);
    if (attempt < 3) spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 5000)"]);
  }
  log("ERROR", "knowledge:normalize lỗi - master đã cập nhật, lá số sau sẽ sinh lại kho web");
  return false;
}

// ============ LOCK ============
// Chỉ một tiến trình được ghi master tại một thời điểm (tránh 2 crawler chạy song song ghi đè nhau).
function acquireLock() {
  try {
    const { pid } = JSON.parse(fs.readFileSync(LOCK_FILE, "utf8"));
    try {
      process.kill(pid, 0);
      throw new Error(`đang có crawler khác chạy (pid ${pid}) - dừng. Xoá ${path.relative(ROOT, LOCK_FILE)} nếu chắc chắn không còn tiến trình nào.`);
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  } catch (error) {
    if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
  }
  fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, started: new Date().toISOString() }));
  const release = () => {
    try {
      if (JSON.parse(fs.readFileSync(LOCK_FILE, "utf8")).pid === process.pid) fs.unlinkSync(LOCK_FILE);
    } catch {}
  };
  process.on("exit", release);
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => process.exit(130));
}

// Chỉ chạy khi gọi trực tiếp (import để kiểm thử parseChartPage / dedupe thì không crawl).
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { palaceOf, entryKey, textKey, loadKnowledge, mergeIntoMaster, acquireLock, runNormalize, decodeEntities, CHART_SPECIFIC };
