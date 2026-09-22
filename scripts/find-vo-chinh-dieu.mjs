/**
 * TÌM LÁ SỐ VÔ CHÍNH DIỆU VÀ CRAWL BỔ SUNG TRI THỨC
 * 
 * Mục tiêu: Tìm các lá số có cung vô chính diệu để bổ sung knowledge
 * 
 * Usage:
 *   node scripts/find-vo-chinh-dieu.mjs --find     # Tìm lá số vô chính diệu
 *   node scripts/find-vo-chinh-dieu.mjs --crawl    # Crawl các lá số đã tìm
 *   node scripts/find-vo-chinh-dieu.mjs --all      # Tìm và crawl
 */

import { astro } from "iztro";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COHOC_BASE = "https://tuvi.cohoc.net";
const OUTPUT_DIR = path.join(__dirname, "..", "tuvi_crawler", "output");
const KNOWLEDGE_DIR = path.join(__dirname, "..", "src", "lib", "tuvi", "knowledge", "cung");
const CACHE_FILE = path.join(__dirname, "..", "tuvi_crawler", "vo-chinh-dieu-charts.json");

// Thiên Can và Địa Chi
const THIEN_CAN = ["giap", "at", "binh", "dinh", "mau", "ky", "canh", "tan", "nham", "quy"];
const DIA_CHI = ["ty", "suu", "dan", "mao", "thin", "ti", "ngo", "mui", "than", "dau", "tuat", "hoi"];
const GIO_MAP = { 0: "ti", 1: "suu", 2: "dan", 3: "mao", 4: "thin", 5: "ty", 6: "ngo", 7: "mui", 8: "than", 9: "dau", 10: "tuat", 11: "hoi" };

const PALACE_NAMES = ['Mệnh', 'Huynh Đệ', 'Phu Thê', 'Tử Nữ', 'Tài Bạch', 'Tật Ách', 
                      'Thiên Di', 'Nô Bộc', 'Quan Lộc', 'Điền Trạch', 'Phúc Đức', 'Phụ Mẫu'];

const SECTION_TO_CUNG = {
  "tong-quan": "tong-quan", "menh": "menh", "than": "than", "phu-mau": "phu-mau",
  "phuc-duc": "phuc-duc", "dien-trach": "dien-trach", "quan-loc": "quan-loc",
  "no-boc": "no-boc", "thien-di": "thien-di", "tat-ach": "tat-ach",
  "tai-bach": "tai-bach", "tu-tuc": "tu-tuc", "phu-the": "phu-the", "huynh-de": "huynh-de",
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
};

// ============================================================
// FUNCTIONS
// ============================================================

function getCanChiYear(year) {
  const canIndex = (year - 4) % 10;
  const chiIndex = (year - 4) % 12;
  return `${THIEN_CAN[canIndex]}-${DIA_CHI[chiIndex]}`;
}

function generateChartUrl(year, month, day, hourIndex, gender, lid) {
  const canChi = getCanChiYear(year);
  const gio = GIO_MAP[hourIndex];
  const genderSlug = gender === "male" ? "nam" : "nu";
  return `${COHOC_BASE}/bac-phai-la-so-tu-vi-nam-${canChi}-thang-${month}-ngay-${day}-gio-${gio}-duong-${genderSlug}-lid-${lid}.html`;
}

function analyzeChart(year, month, day, hourIndex, gender) {
  try {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const genderApi = gender === "male" ? "男" : "女";
    const chart = astro.astrolabeBySolarDate(date, hourIndex, genderApi, true, "vi-VN");
    
    const voChinhDieu = [];
    
    for (const palace of chart.palaces) {
      if (!PALACE_NAMES.includes(palace.name)) continue;
      
      const hasMainStar = palace.majorStars && palace.majorStars.length > 0;
      if (!hasMainStar) {
        voChinhDieu.push({
          palace: palace.name,
          branch: palace.earthlyBranch,
          minorStars: (palace.minorStars || []).map(s => s.name).slice(0, 5)
        });
      }
    }
    
    return {
      valid: true,
      menhCuc: chart.fiveElementsClass,
      voChinhDieu
    };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

function findVoChinhDieuCharts(targetCount = 50) {
  console.log(`\n🔍 Tìm ${targetCount} lá số có cung vô chính diệu...\n`);
  
  const results = [];
  const palaceCount = {};
  PALACE_NAMES.forEach(p => palaceCount[p] = 0);
  
  let attempts = 0;
  const maxAttempts = targetCount * 20;
  
  while (results.length < targetCount && attempts < maxAttempts) {
    attempts++;
    
    // Random birth data
    const year = 1950 + Math.floor(Math.random() * 70);
    const month = 1 + Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 28);
    const hourIndex = Math.floor(Math.random() * 12);
    const gender = Math.random() > 0.5 ? "male" : "female";
    
    const analysis = analyzeChart(year, month, day, hourIndex, gender);
    
    if (!analysis.valid || analysis.voChinhDieu.length === 0) continue;
    
    // Ưu tiên các cung còn thiếu
    const hasNeededPalace = analysis.voChinhDieu.some(v => palaceCount[v.palace] < 5);
    if (!hasNeededPalace && results.length > targetCount / 2) continue;
    
    const lid = 100000 + Math.floor(Math.random() * 900000);
    const url = generateChartUrl(year, month, day, hourIndex, gender, lid);
    
    const chartData = {
      lid: lid.toString(),
      year, month, day, hourIndex,
      gender,
      genderVi: gender === "male" ? "Nam" : "Nữ",
      menhCuc: analysis.menhCuc,
      voChinhDieu: analysis.voChinhDieu,
      url
    };
    
    results.push(chartData);
    
    // Update counts
    analysis.voChinhDieu.forEach(v => {
      palaceCount[v.palace]++;
    });
    
    // Progress
    if (results.length % 10 === 0) {
      console.log(`  Found ${results.length}/${targetCount} charts...`);
    }
  }
  
  console.log(`\n✅ Tìm được ${results.length} lá số sau ${attempts} attempts\n`);
  
  // Stats
  console.log("📊 Thống kê cung vô chính diệu:");
  console.log("─".repeat(40));
  Object.entries(palaceCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([palace, count]) => {
      const bar = "█".repeat(Math.min(count, 20));
      console.log(`  ${palace.padEnd(12)} │ ${String(count).padStart(3)} │ ${bar}`);
    });
  
  return results;
}

async function fetchPage(url) {
  try {
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) return null;
    return await response.text();
  } catch (e) {
    return null;
  }
}

function parseInterpretations(html, chartId) {
  const sections = {};
  
  // Pattern: <h4 class='nguyennhan'>...</h4><p class='ketqua'>...</p>
  const blockPattern = /<h4[^>]*class=['\"]nguyennhan['\"][^>]*>([^<]+)<\/h4>\s*<p[^>]*class=['\"]ketqua['\"][^>]*>([\s\S]*?)<\/p>/gi;
  
  let match;
  while ((match = blockPattern.exec(html)) !== null) {
    const condition = match[1].trim();
    let content = match[2].replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
    
    if (content.length < 20) continue;
    
    // Determine section
    const condLower = condition.toLowerCase();
    let sectionId = "general";
    
    if (condLower.includes("cung mệnh")) sectionId = "menh";
    else if (condLower.includes("cung thân")) sectionId = "than";
    else if (condLower.includes("cung phụ mẫu")) sectionId = "phu-mau";
    else if (condLower.includes("cung phúc đức")) sectionId = "phuc-duc";
    else if (condLower.includes("cung điền trạch")) sectionId = "dien-trach";
    else if (condLower.includes("cung quan lộc")) sectionId = "quan-loc";
    else if (condLower.includes("cung nô bộc")) sectionId = "no-boc";
    else if (condLower.includes("cung thiên di")) sectionId = "thien-di";
    else if (condLower.includes("cung tật ách")) sectionId = "tat-ach";
    else if (condLower.includes("cung tài bạch")) sectionId = "tai-bach";
    else if (condLower.includes("cung tử tức")) sectionId = "tu-tuc";
    else if (condLower.includes("cung phu thê")) sectionId = "phu-the";
    else if (condLower.includes("cung huynh đệ")) sectionId = "huynh-de";
    else if (condLower.includes("tổng quan")) sectionId = "tong-quan";
    
    if (!sections[sectionId]) {
      sections[sectionId] = [];
    }
    
    sections[sectionId].push({
      condition,
      content,
      source: "tuvi.cohoc.net",
      accuracy: 7
    });
  }
  
  return sections;
}

function importToKnowledge(sections, chartId) {
  let totalImported = 0;
  
  for (const [sectionId, interpretations] of Object.entries(sections)) {
    const cungKey = SECTION_TO_CUNG[sectionId];
    if (!cungKey) continue;
    
    const outputFile = path.join(KNOWLEDGE_DIR, `${cungKey}-cohoc-batch.json`);
    
    // Load existing
    let existing = { palace: cungKey, sections: [] };
    if (fs.existsSync(outputFile)) {
      try {
        existing = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
      } catch (e) { /* ignore */ }
    }
    
    // Find or create batch section
    let targetSection = existing.sections?.find(s => s.section_id === "vo_chinh_dieu");
    if (!targetSection) {
      if (!existing.sections) existing.sections = [];
      targetSection = {
        section_id: "vo_chinh_dieu",
        title: "Vô Chính Diệu - Batch Import",
        interpretations: []
      };
      existing.sections.push(targetSection);
    }
    
    // Add new interpretations
    for (const interp of interpretations) {
      // Check duplicate
      const isDuplicate = targetSection.interpretations.some(
        i => i.text === interp.content || i.condition === interp.condition
      );
      
      if (!isDuplicate) {
        targetSection.interpretations.push({
          id: `cohoc_${chartId}_${targetSection.interpretations.length}`,
          condition: interp.condition,
          text: interp.content,
          source: { book: interp.source, author: "Unknown", chart_id: chartId },
          accuracy: interp.accuracy
        });
        totalImported++;
      }
    }
    
    // Save
    fs.writeFileSync(outputFile, JSON.stringify(existing, null, 2), "utf-8");
  }
  
  return totalImported;
}

async function crawlCharts(charts, delay = 5000) {
  console.log(`\n🕷️ Bắt đầu crawl ${charts.length} lá số...\n`);
  
  let totalImported = 0;
  let successful = 0;
  
  for (let i = 0; i < charts.length; i++) {
    const chart = charts[i];
    console.log(`[${i + 1}/${charts.length}] Crawling lid=${chart.lid}...`);
    
    const html = await fetchPage(chart.url);
    
    if (!html || html.length < 5000) {
      console.log(`  ❌ Failed to fetch or anti-bot detected`);
      continue;
    }
    
    const sections = parseInterpretations(html, chart.lid);
    const totalInterps = Object.values(sections).reduce((sum, arr) => sum + arr.length, 0);
    
    if (totalInterps === 0) {
      console.log(`  ⚠️ No interpretations found`);
      continue;
    }
    
    const imported = importToKnowledge(sections, chart.lid);
    totalImported += imported;
    successful++;
    
    console.log(`  ✅ Found ${totalInterps} interps, imported ${imported} new`);
    console.log(`     Vô chính diệu: ${chart.voChinhDieu.map(v => v.palace).join(", ")}`);
    
    // Delay
    if (i < charts.length - 1) {
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  console.log(`\n${"═".repeat(50)}`);
  console.log(`📊 KẾT QUẢ CRAWL`);
  console.log(`${"═".repeat(50)}`);
  console.log(`  Tổng số crawl: ${charts.length}`);
  console.log(`  Thành công: ${successful}`);
  console.log(`  Thất bại: ${charts.length - successful}`);
  console.log(`  Tổng imported: ${totalImported} interpretations`);
  
  return { successful, totalImported };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  
  const doFind = args.includes("--find") || args.includes("--all");
  const doCrawl = args.includes("--crawl") || args.includes("--all");
  const count = parseInt(args.find(a => a.startsWith("--count="))?.split("=")[1] || "30");
  const delay = parseInt(args.find(a => a.startsWith("--delay="))?.split("=")[1] || "5000");
  
  console.log("\n" + "═".repeat(60));
  console.log("  TÌM VÀ CRAWL LÁ SỐ VÔ CHÍNH DIỆU");
  console.log("═".repeat(60));
  
  // Ensure directories exist
  if (!fs.existsSync(path.dirname(CACHE_FILE))) {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  }
  
  let charts = [];
  
  if (doFind) {
    charts = findVoChinhDieuCharts(count);
    
    // Save to cache
    fs.writeFileSync(CACHE_FILE, JSON.stringify(charts, null, 2), "utf-8");
    console.log(`\n💾 Đã lưu ${charts.length} lá số vào ${CACHE_FILE}`);
  }
  
  if (doCrawl) {
    // Load from cache if not found
    if (charts.length === 0 && fs.existsSync(CACHE_FILE)) {
      charts = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      console.log(`\n📂 Loaded ${charts.length} charts from cache`);
    }
    
    if (charts.length === 0) {
      console.log("\n⚠️ Không có lá số để crawl. Chạy với --find trước.");
      return;
    }
    
    await crawlCharts(charts, delay);
  }
  
  if (!doFind && !doCrawl) {
    console.log(`
Usage:
  node scripts/find-vo-chinh-dieu.mjs --find              # Tìm lá số vô chính diệu
  node scripts/find-vo-chinh-dieu.mjs --crawl             # Crawl các lá số đã tìm
  node scripts/find-vo-chinh-dieu.mjs --all               # Tìm và crawl
  node scripts/find-vo-chinh-dieu.mjs --all --count=50    # Tìm 50 lá số
  node scripts/find-vo-chinh-dieu.mjs --all --delay=3000  # Delay 3s giữa các request
`);
  }
}

main().catch(console.error);
