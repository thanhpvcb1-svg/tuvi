#!/usr/bin/env node
/**
 * Gộp MỌI nguồn tri thức crawl vào masterdata `src/lib/tuvi/knowledge/cung/*-consolidated.json`.
 * Master là chuẩn: chỉ THÊM mục chưa có (khử trùng theo điều kiện + nội dung, như crawl-cohoc-random.mjs),
 * không sửa / xoá / chuyển cung mục đã có trong master.
 *
 * Nguồn đọc:
 *  - tuvi_crawler/output/<lid>/interpretations.json  (định dạng mới: blocks; định dạng cũ: sections[].interpretations)
 *  - tuvi_crawler/output/<lid>/page.html | bacphai.html  (thư mục chưa có interpretations.json -> parse lại HTML)
 *  - các file cũ trong cung/ (*-cohoc-*.json, *-streaming.json, <cung>.json ...)
 * Cung của mục mới: theo cung nêu đầu tiên trong điều kiện (palaceOf); không xác định được thì theo cung của file nguồn.
 * Bỏ mục số liệu riêng của một lá số (điểm "xí hoa", "Thông tin cung ...", thống kê ...) - normalize cũng bỏ các mục này.
 *
 * Usage:
 *   node scripts/merge-knowledge-master.mjs            # chỉ báo cáo (không ghi)
 *   node scripts/merge-knowledge-master.mjs --apply    # ghi vào master + chạy npm run knowledge:normalize
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseChartPage, mergeIntoMaster, acquireLock, runNormalize, decodeEntities } from "./crawl-cohoc-random.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "tuvi_crawler", "output");
const KNOWLEDGE_DIR = path.join(ROOT, "src", "lib", "tuvi", "knowledge", "cung");
const APPLY = process.argv.includes("--apply");


const PALACE_ALIASES = {
  menh: "menh", than: "than", "phu-mau": "phu-mau", "phuc-duc": "phuc-duc", "dien-trach": "dien-trach",
  "quan-loc": "quan-loc", "no-boc": "no-boc", "thien-di": "thien-di", "tat-ach": "tat-ach", "tai-bach": "tai-bach",
  "tu-tuc": "tu-tuc", "phu-the": "phu-the", "huynh-de": "huynh-de", "tong-quan": "tong-quan", general: "tong-quan",
};
const palaceSlug = (value) => {
  const slug = String(value || "").toLowerCase().replace(/_/g, "-").trim();
  return PALACE_ALIASES[slug] ?? null;
};

// ============ EXTRACT ============
// Trả về [{ condition, text, source, accuracy, fallbackPalace }]
function fromItem(item, fallbackPalace, extraSource) {
  const condition = decodeEntities(String(item.condition ?? item.condition_text ?? "")).replace(/\s+/g, " ").trim();
  const text = decodeEntities(String(item.text ?? item.content ?? item.raw_text ?? "")).trim();
  if (!condition || text.length < 10) return null;
  const source = typeof item.source === "object" && item.source ? { ...item.source, ...extraSource } : { book: "tuvi.cohoc.net", ...extraSource };
  return { condition, text, source, accuracy: Number(item.accuracy) || 7, fallbackPalace };
}

function extractJson(data, fallbackPalace, extraSource) {
  const out = [];
  const push = (item, palace) => {
    const entry = fromItem(item, palace, extraSource);
    if (entry) out.push(entry);
  };
  for (const item of data.blocks ?? []) push(item, fallbackPalace);
  for (const item of data.interpretations ?? []) push(item, fallbackPalace);
  for (const section of data.sections ?? []) {
    const palace = palaceSlug(section.id ?? section.section_id) ?? fallbackPalace;
    for (const item of section.blocks ?? []) push(item, palace);
    for (const item of section.interpretations ?? []) push(item, palace);
  }
  return out;
}

function collectSources() {
  const sources = []; // { name, entries }
  // 1) Bản crawl thô theo lá số
  for (const lid of fs.readdirSync(OUTPUT_DIR)) {
    const dir = path.join(OUTPUT_DIR, lid);
    if (!fs.statSync(dir).isDirectory()) continue;
    const extra = { chart_id: lid };
    const jsonFile = path.join(dir, "interpretations.json");
    if (fs.existsSync(jsonFile)) {
      sources.push({ name: `output/${lid}`, entries: extractJson(JSON.parse(fs.readFileSync(jsonFile, "utf8")), null, extra) });
      continue;
    }
    const htmlFile = ["page.html", "bacphai.html"].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f));
    if (!htmlFile) continue;
    const blocks = parseChartPage(fs.readFileSync(htmlFile, "utf8"));
    sources.push({ name: `output/${lid}/${path.basename(htmlFile)}`, entries: blocks.map((b) => ({ ...b, source: { ...b.source, ...extra }, fallbackPalace: null })) });
  }
  // 2) File tri thức cũ trong cung/ (không phải master, không phải thư mục normalized)
  for (const file of fs.readdirSync(KNOWLEDGE_DIR)) {
    if (!file.endsWith(".json") || file.endsWith("-consolidated.json")) continue;
    const data = JSON.parse(fs.readFileSync(path.join(KNOWLEDGE_DIR, file), "utf8"));
    const fallback = palaceSlug(data.palace) ?? palaceSlug(file.replace(/\.json$/, "").split("-").slice(0, 2).join("-")) ?? palaceSlug(file.split("-")[0]);
    sources.push({ name: `cung/${file}`, entries: extractJson(data, fallback, {}) });
  }
  return sources;
}

// ============ MERGE ============
function main() {
  if (APPLY) acquireLock();
  const all = collectSources().flatMap(({ entries }) => entries);
  const stats = mergeIntoMaster(all, "legacy", { write: APPLY, source: "from_master_merge" });
  console.log(`Đọc ${stats.blocks} mục: trùng master ${stats.duplicates}, bỏ (số liệu riêng lá số) ${stats.chartSpecific}, không xác định cung ${stats.noPalace}`);
  console.log(`MỚI: ${stats.newEntries} (nội dung mới ${stats.newTexts})`);
  console.log(`Theo cung: ${Object.entries(stats.perPalace).map(([id, a]) => `${id} +${a}`).join(", ") || "-"}`);
  if (!APPLY) return console.log("\nChỉ báo cáo. Chạy lại với --apply để ghi vào master.");
  if (stats.newEntries) runNormalize();
}

main();
