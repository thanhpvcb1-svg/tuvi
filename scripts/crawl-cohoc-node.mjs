/**
 * Node.js Crawler - Crawl lá số từ tuvi.cohoc.net
 * 
 * Usage:
 *   node scripts/crawl-cohoc-node.mjs
 *   node scripts/crawl-cohoc-node.mjs --count 5
 *   node scripts/crawl-cohoc-node.mjs --lid 472159
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COHOC_BASE = "https://tuvi.cohoc.net";
const OUTPUT_DIR = path.join(__dirname, "..", "tuvi_crawler", "output");
const KNOWLEDGE_DIR = path.join(__dirname, "..", "src", "lib", "tuvi", "knowledge", "cung");

// Thiên Can và Địa Chi
const THIEN_CAN = ["giap", "at", "binh", "dinh", "mau", "ky", "canh", "tan", "nham", "quy"];
const THIEN_CAN_VN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["ty", "suu", "dan", "mao", "thin", "ti", "ngo", "mui", "than", "dau", "tuat", "hoi"];
const DIA_CHI_VN = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const GIO = ["ti", "suu", "dan", "mao", "thin", "ty", "ngo", "mui", "than", "dau", "tuat", "hoi"];

// Mapping section ID to cung key
const SECTION_TO_CUNG = {
  "tong-quan": "tong-quan",
  "menh": "menh",
  "than": "than",
  "phu-mau": "phu-mau",
  "phuc-duc": "phuc-duc",
  "dien-trach": "dien-trach",
  "quan-loc": "quan-loc",
  "no-boc": "no-boc",
  "thien-di": "thien-di",
  "tat-ach": "tat-ach",
  "tai-bach": "tai-bach",
  "tu-tuc": "tu-tuc",
  "phu-the": "phu-the",
  "huynh-de": "huynh-de",
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
};

function getCanChiYear(year) {
  const canIndex = (year - 4) % 10;
  const chiIndex = (year - 4) % 12;
  return {
    slug: `${THIEN_CAN[canIndex]}-${DIA_CHI[chiIndex]}`,
    name: `${THIEN_CAN_VN[canIndex]} ${DIA_CHI_VN[chiIndex]}`,
  };
}

function generateRandomChart() {
  const year = 1950 + Math.floor(Math.random() * 70);
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  const hourIndex = Math.floor(Math.random() * 12);
  const gender = Math.random() > 0.5 ? "nam" : "nu";
  const calendar = Math.random() > 0.5 ? "duong" : "am";
  
  const canChi = getCanChiYear(year);
  const gio = GIO[hourIndex];
  const lid = 100000 + Math.floor(Math.random() * 900000);
  
  const url = `${COHOC_BASE}/bac-phai-la-so-tu-vi-nam-${canChi.slug}-thang-${month}-ngay-${day}-gio-${gio}-${calendar}-${gender}-lid-${lid}.html`;
  
  return { url, lid: lid.toString(), year, month, day, gio, gender, calendar, canChi: canChi.name };
}

async function fetchPage(url) {
  console.log(`[FETCH] ${url.substring(0, 80)}...`);
  
  try {
    const response = await fetch(url, { headers: HEADERS });
    
    if (!response.ok) {
      console.log(`[FETCH] HTTP ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    console.log(`[FETCH] Got ${html.length} bytes`);
    return html;
  } catch (error) {
    console.error(`[FETCH] Error: ${error.message}`);
    return null;
  }
}

function parseInterpretationsFromHtml(html, chartId) {
  const result = {
    chart_id: chartId,
    source: "tuvi.cohoc.net",
    sections: [],
  };
  
  // Pattern để tìm các section luận giải
  // Mỗi section có format: <h3>CUNG X</h3> ... <div class="ketqua">...</div>
  
  // Tìm tất cả các block luận giải
  // Pattern: <h4 class='nguyennhan'>...</h4><p class='ketqua'>...</p>
  const blockPattern = /<h4[^>]*class=['"]nguyennhan['"][^>]*>([^<]+)<\/h4>\s*<p[^>]*class=['"]ketqua['"][^>]*>([\s\S]*?)<\/p>/gi;
  
  // Tìm section headers
  const sectionPattern = /<h3[^>]*>([^<]*(?:CUNG|TỔNG QUAN)[^<]*)<\/h3>/gi;
  
  let currentSection = null;
  const sections = {};
  
  // First pass: find all sections
  let sectionMatch;
  while ((sectionMatch = sectionPattern.exec(html)) !== null) {
    const title = sectionMatch[1].trim().toUpperCase();
    let sectionId = "general";
    
    if (title.includes("TỔNG QUAN")) sectionId = "tong-quan";
    else if (title.includes("MỆNH")) sectionId = "menh";
    else if (title.includes("THÂN")) sectionId = "than";
    else if (title.includes("PHỤ MẪU")) sectionId = "phu-mau";
    else if (title.includes("PHÚC ĐỨC")) sectionId = "phuc-duc";
    else if (title.includes("ĐIỀN TRẠCH")) sectionId = "dien-trach";
    else if (title.includes("QUAN LỘC")) sectionId = "quan-loc";
    else if (title.includes("NÔ BỘC")) sectionId = "no-boc";
    else if (title.includes("THIÊN DI")) sectionId = "thien-di";
    else if (title.includes("TẬT ÁCH")) sectionId = "tat-ach";
    else if (title.includes("TÀI BẠCH")) sectionId = "tai-bach";
    else if (title.includes("TỬ TỨC")) sectionId = "tu-tuc";
    else if (title.includes("PHU THÊ")) sectionId = "phu-the";
    else if (title.includes("HUYNH ĐỆ")) sectionId = "huynh-de";
    
    if (!sections[sectionId]) {
      sections[sectionId] = {
        id: sectionId,
        title: title,
        interpretations: [],
      };
    }
  }
  
  // Second pass: find all interpretation blocks
  let blockMatch;
  while ((blockMatch = blockPattern.exec(html)) !== null) {
    const condition = blockMatch[1].trim();
    let content = blockMatch[2]
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    
    // Determine which section this belongs to
    let sectionId = "general";
    const condLower = condition.toLowerCase();
    
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
    else if (condLower.includes("tổng quan") || condLower.includes("điểm") || condLower.includes("lá số")) sectionId = "tong-quan";
    
    if (!sections[sectionId]) {
      sections[sectionId] = {
        id: sectionId,
        title: sectionId.toUpperCase(),
        interpretations: [],
      };
    }
    
    // Extract source if present
    let source = "tuvi.cohoc.net";
    let accuracy = 7;
    
    // Pattern: "Book - Author" at end
    const sourceMatch = content.match(/\n([^-\n]+)\s*[-–—]\s*([^-\n]+?)$/);
    if (sourceMatch && sourceMatch[1].length < 50) {
      source = `${sourceMatch[1].trim()} - ${sourceMatch[2].trim()}`;
      content = content.substring(0, content.lastIndexOf(sourceMatch[0])).trim();
    }
    
    // Extract accuracy if present
    const accMatch = condition.match(/accuracy[:\s]*(\d+)/i);
    if (accMatch) {
      accuracy = parseInt(accMatch[1]);
    }
    
    if (content.length > 20) {
      sections[sectionId].interpretations.push({
        condition,
        content,
        source,
        accuracy,
      });
    }
  }
  
  // Convert to array
  result.sections = Object.values(sections).filter(s => s.interpretations.length > 0);
  
  return result;
}

function saveOutput(chartId, data) {
  const outputPath = path.join(OUTPUT_DIR, chartId);
  
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  
  // Save interpretations
  fs.writeFileSync(
    path.join(outputPath, "interpretations.json"),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
  
  // Save metadata
  fs.writeFileSync(
    path.join(outputPath, "metadata.json"),
    JSON.stringify({
      chart_id: chartId,
      source: "tuvi.cohoc.net",
      crawl_time: new Date().toISOString(),
      sections_count: data.sections.length,
      total_interpretations: data.sections.reduce((sum, s) => sum + s.interpretations.length, 0),
    }, null, 2),
    "utf-8"
  );
  
  console.log(`[SAVE] Saved to ${outputPath}`);
}

function importToKnowledge(interpretations, chartId) {
  if (!interpretations || !interpretations.sections) {
    return 0;
  }
  
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
  
  let totalImported = 0;
  
  for (const section of interpretations.sections) {
    const cungKey = SECTION_TO_CUNG[section.id];
    if (!cungKey) continue;
    
    const outputFile = path.join(KNOWLEDGE_DIR, `${cungKey}-cohoc-batch.json`);
    
    // Load existing
    let existing = { palace: cungKey, palace_name: section.title, sections: [] };
    if (fs.existsSync(outputFile)) {
      try {
        existing = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
      } catch (e) { /* ignore */ }
    }
    
    // Find or create batch section
    let targetSection = existing.sections.find(s => s.section_id === "batch_import");
    if (!targetSection) {
      targetSection = {
        section_id: "batch_import",
        title: "Batch Import từ CoHoc",
        interpretations: [],
      };
      existing.sections.push(targetSection);
    }
    
    // Add new interpretations
    for (const interp of section.interpretations) {
      // Check duplicate
      const isDuplicate = targetSection.interpretations.some(
        i => i.text === interp.content || 
             (i.condition === interp.condition && i.text.substring(0, 100) === interp.content.substring(0, 100))
      );
      
      if (!isDuplicate && interp.content) {
        targetSection.interpretations.push({
          id: `batch_${chartId}_${targetSection.interpretations.length}`,
          condition: interp.condition,
          text: interp.content,
          source: { book: interp.source, chart_id: chartId },
          accuracy: interp.accuracy,
        });
        totalImported++;
      }
    }
    
    // Save
    fs.writeFileSync(outputFile, JSON.stringify(existing, null, 2), "utf-8");
  }
  
  return totalImported;
}

async function crawlChart(chart) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Crawling: ${chart.canChi} - ${chart.year}/${chart.month}/${chart.day} ${chart.gio} ${chart.gender}`);
  console.log(`LID: ${chart.lid}`);
  console.log(`${"=".repeat(60)}`);
  
  const html = await fetchPage(chart.url);
  
  if (!html) {
    console.log("[CRAWL] Failed to fetch page");
    return { success: false, imported: 0 };
  }
  
  // Check for anti-bot
  if (html.includes("robot") || html.includes("captcha") || html.length < 5000) {
    console.log("[CRAWL] Possible anti-bot protection detected");
    return { success: false, imported: 0 };
  }
  
  // Parse interpretations
  const interpretations = parseInterpretationsFromHtml(html, chart.lid);
  
  const totalInterps = interpretations.sections.reduce((sum, s) => sum + s.interpretations.length, 0);
  console.log(`[PARSE] Found ${interpretations.sections.length} sections, ${totalInterps} interpretations`);
  
  if (totalInterps === 0) {
    console.log("[PARSE] No interpretations found - page may require JavaScript");
    
    // Save raw HTML for debugging
    const debugPath = path.join(OUTPUT_DIR, chart.lid);
    if (!fs.existsSync(debugPath)) {
      fs.mkdirSync(debugPath, { recursive: true });
    }
    fs.writeFileSync(path.join(debugPath, "page.html"), html, "utf-8");
    console.log(`[DEBUG] Saved raw HTML to ${debugPath}/page.html`);
    
    return { success: false, imported: 0 };
  }
  
  // Save output
  saveOutput(chart.lid, interpretations);
  
  // Import to knowledge
  const imported = importToKnowledge(interpretations, chart.lid);
  console.log(`[IMPORT] Imported ${imported} new interpretations to knowledge`);
  
  return { success: true, imported };
}

async function main() {
  const args = process.argv.slice(2);
  
  let count = 3;
  let specificLid = null;
  let delay = 5000;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--count" && args[i + 1]) {
      count = parseInt(args[i + 1]);
    }
    if (args[i] === "--lid" && args[i + 1]) {
      specificLid = args[i + 1];
    }
    if (args[i] === "--delay" && args[i + 1]) {
      delay = parseInt(args[i + 1]);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("TuVi CoHoc Node.js Crawler");
  console.log("=".repeat(60));
  console.log(`Config: count=${count}, delay=${delay}ms`);
  
  const results = [];
  
  if (specificLid) {
    // Crawl specific chart
    const url = `${COHOC_BASE}/bac-phai-la-so-tu-vi-nam-mau-dan-thang-9-ngay-7-gio-ti-duong-nam-lid-${specificLid}.html`;
    const chart = { url, lid: specificLid, canChi: "Specific", year: 0, month: 0, day: 0, gio: "", gender: "" };
    const result = await crawlChart(chart);
    results.push({ ...chart, ...result });
  } else {
    // Crawl random charts
    for (let i = 0; i < count; i++) {
      const chart = generateRandomChart();
      console.log(`\n[${i + 1}/${count}]`);
      
      const result = await crawlChart(chart);
      results.push({ ...chart, ...result });
      
      if (i < count - 1) {
        console.log(`\n[WAIT] Waiting ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const totalImported = results.reduce((sum, r) => sum + (r.imported || 0), 0);
  
  console.log(`Total crawled: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${results.length - successful}`);
  console.log(`Total imported: ${totalImported} interpretations`);
  
  console.log("\nDetails:");
  for (const r of results) {
    const status = r.success ? "✓" : "✗";
    console.log(`  ${status} lid=${r.lid} - imported ${r.imported || 0}`);
  }
  
  console.log("\nOutput saved to: tuvi_crawler/output/");
  console.log("Knowledge saved to: src/lib/tuvi/knowledge/cung/*-cohoc-batch.json");
}

main().catch(console.error);
