/**
 * Puppeteer Crawler - Crawl lá số từ tuvi.cohoc.net với JavaScript rendering
 * 
 * Cần cài: npm install puppeteer
 * 
 * Usage:
 *   node scripts/crawl-puppeteer.mjs
 *   node scripts/crawl-puppeteer.mjs --count 3
 *   node scripts/crawl-puppeteer.mjs --lid 472159
 *   node scripts/crawl-puppeteer.mjs --headed
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import puppeteer
let puppeteer;
try {
  puppeteer = await import("puppeteer");
} catch (e) {
  console.error("Puppeteer not installed. Run: npm install puppeteer");
  process.exit(1);
}

const COHOC_BASE = "https://tuvi.cohoc.net";
const OUTPUT_DIR = path.join(__dirname, "..", "tuvi_crawler", "output");
const KNOWLEDGE_DIR = path.join(__dirname, "..", "src", "lib", "tuvi", "knowledge", "cung");

// Thiên Can và Địa Chi
const THIEN_CAN = ["giap", "at", "binh", "dinh", "mau", "ky", "canh", "tan", "nham", "quy"];
const THIEN_CAN_VN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["ty", "suu", "dan", "mao", "thin", "ti", "ngo", "mui", "than", "dau", "tuat", "hoi"];
const DIA_CHI_VN = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const GIO = ["ti", "suu", "dan", "mao", "thin", "ty", "ngo", "mui", "than", "dau", "tuat", "hoi"];

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

function parseInterpretationsFromHtml(html, chartId) {
  const result = {
    chart_id: chartId,
    source: "tuvi.cohoc.net",
    sections: [],
  };
  
  const sections = {};
  
  // Pattern: <h4 class='nguyennhan'>...</h4><p class='ketqua'>...</p>
  const blockPattern = /<h4[^>]*class=['"]nguyennhan['"][^>]*>([^<]+)<\/h4>\s*<p[^>]*class=['"]ketqua['"][^>]*>([\s\S]*?)<\/p>/gi;
  
  let blockMatch;
  while ((blockMatch = blockPattern.exec(html)) !== null) {
    const condition = blockMatch[1].trim();
    let content = blockMatch[2]
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    
    // Determine section
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
    
    // Extract source
    let source = "tuvi.cohoc.net";
    const sourceMatch = content.match(/\n([^-\n]+)\s*[-–—]\s*([^-\n]+?)$/);
    if (sourceMatch && sourceMatch[1].length < 50) {
      source = `${sourceMatch[1].trim()} - ${sourceMatch[2].trim()}`;
      content = content.substring(0, content.lastIndexOf(sourceMatch[0])).trim();
    }
    
    if (content.length > 20) {
      sections[sectionId].interpretations.push({
        condition,
        content,
        source,
        accuracy: 7,
      });
    }
  }
  
  result.sections = Object.values(sections).filter(s => s.interpretations.length > 0);
  return result;
}

function saveOutput(chartId, data, html) {
  const outputPath = path.join(OUTPUT_DIR, chartId);
  
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  
  // Save HTML
  fs.writeFileSync(path.join(outputPath, "page.html"), html, "utf-8");
  
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
  if (!interpretations || !interpretations.sections) return 0;
  
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
  
  let totalImported = 0;
  
  for (const section of interpretations.sections) {
    const cungKey = SECTION_TO_CUNG[section.id];
    if (!cungKey) continue;
    
    const outputFile = path.join(KNOWLEDGE_DIR, `${cungKey}-cohoc-batch.json`);
    
    let existing = { palace: cungKey, palace_name: section.title, sections: [] };
    if (fs.existsSync(outputFile)) {
      try {
        existing = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
      } catch (e) { /* ignore */ }
    }
    
    let targetSection = existing.sections.find(s => s.section_id === "batch_import");
    if (!targetSection) {
      targetSection = {
        section_id: "batch_import",
        title: "Batch Import từ CoHoc",
        interpretations: [],
      };
      existing.sections.push(targetSection);
    }
    
    for (const interp of section.interpretations) {
      const isDuplicate = targetSection.interpretations.some(
        i => i.text === interp.content || 
             (i.condition === interp.condition && i.text?.substring(0, 100) === interp.content?.substring(0, 100))
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
    
    fs.writeFileSync(outputFile, JSON.stringify(existing, null, 2), "utf-8");
  }
  
  return totalImported;
}

async function crawlWithPuppeteer(chart, headed = false) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Crawling: ${chart.canChi} - ${chart.year}/${chart.month}/${chart.day} ${chart.gio} ${chart.gender}`);
  console.log(`LID: ${chart.lid}`);
  console.log(`URL: ${chart.url}`);
  console.log(`${"=".repeat(60)}`);
  
  const browser = await puppeteer.default.launch({
    headless: headed ? false : "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    
    // Set extra headers
    await page.setExtraHTTPHeaders({
      "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    });
    
    console.log("[BROWSER] Navigating...");
    
    // Navigate with timeout
    await page.goto(chart.url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    
    // Wait for content to load
    console.log("[BROWSER] Waiting for content...");
    await new Promise(r => setTimeout(r, 5000));
    
    // Try to wait for specific element
    try {
      await page.waitForSelector(".ketqua", { timeout: 10000 });
      console.log("[BROWSER] Found .ketqua elements");
    } catch (e) {
      console.log("[BROWSER] No .ketqua elements found, continuing...");
    }
    
    // Get HTML
    const html = await page.content();
    console.log(`[BROWSER] Got ${html.length} bytes`);
    
    // Check for anti-bot
    if (html.includes("robot") || html.includes("captcha")) {
      console.log("[BROWSER] Anti-bot detected!");
      if (headed) {
        console.log("[BROWSER] Please solve captcha manually, then press Enter...");
        await new Promise(r => setTimeout(r, 30000));
        const newHtml = await page.content();
        return { html: newHtml, success: newHtml.length > 50000 };
      }
      return { html, success: false };
    }
    
    return { html, success: html.length > 50000 };
    
  } finally {
    await browser.close();
  }
}

async function crawlChart(chart, headed = false) {
  const { html, success } = await crawlWithPuppeteer(chart, headed);
  
  if (!success) {
    console.log("[CRAWL] Failed - page too small or blocked");
    
    // Save for debugging
    const debugPath = path.join(OUTPUT_DIR, chart.lid);
    if (!fs.existsSync(debugPath)) {
      fs.mkdirSync(debugPath, { recursive: true });
    }
    fs.writeFileSync(path.join(debugPath, "page.html"), html, "utf-8");
    
    return { success: false, imported: 0 };
  }
  
  // Parse
  const interpretations = parseInterpretationsFromHtml(html, chart.lid);
  const totalInterps = interpretations.sections.reduce((sum, s) => sum + s.interpretations.length, 0);
  console.log(`[PARSE] Found ${interpretations.sections.length} sections, ${totalInterps} interpretations`);
  
  if (totalInterps === 0) {
    console.log("[PARSE] No interpretations found");
    return { success: false, imported: 0 };
  }
  
  // Save
  saveOutput(chart.lid, interpretations, html);
  
  // Import
  const imported = importToKnowledge(interpretations, chart.lid);
  console.log(`[IMPORT] Imported ${imported} new interpretations`);
  
  return { success: true, imported };
}

async function main() {
  const args = process.argv.slice(2);
  
  let count = 3;
  let specificLid = null;
  let delay = 5000;
  let headed = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--count" && args[i + 1]) count = parseInt(args[i + 1]);
    if (args[i] === "--lid" && args[i + 1]) specificLid = args[i + 1];
    if (args[i] === "--delay" && args[i + 1]) delay = parseInt(args[i + 1]);
    if (args[i] === "--headed") headed = true;
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("TuVi CoHoc Puppeteer Crawler");
  console.log("=".repeat(60));
  console.log(`Config: count=${count}, delay=${delay}ms, headed=${headed}`);
  
  const results = [];
  
  if (specificLid) {
    const url = `${COHOC_BASE}/bac-phai-la-so-tu-vi-nam-mau-dan-thang-9-ngay-7-gio-ti-duong-nam-lid-${specificLid}.html`;
    const chart = { url, lid: specificLid, canChi: "Specific", year: 0, month: 0, day: 0, gio: "", gender: "" };
    const result = await crawlChart(chart, headed);
    results.push({ ...chart, ...result });
  } else {
    for (let i = 0; i < count; i++) {
      const chart = generateRandomChart();
      console.log(`\n[${i + 1}/${count}]`);
      
      const result = await crawlChart(chart, headed);
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
  
  console.log(`Total: ${results.length}, Success: ${successful}, Failed: ${results.length - successful}`);
  console.log(`Total imported: ${totalImported} interpretations`);
  
  for (const r of results) {
    const status = r.success ? "✓" : "✗";
    console.log(`  ${status} lid=${r.lid} - imported ${r.imported || 0}`);
  }
}

main().catch(console.error);
