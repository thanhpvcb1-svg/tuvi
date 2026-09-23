/**
 * Crawl batch từ discovered LIDs
 * 
 * Usage:
 *   node scripts/crawl-discovered.mjs
 *   node scripts/crawl-discovered.mjs --count 10
 *   node scripts/crawl-discovered.mjs --start 0 --count 20
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COHOC_BASE = "https://tuvi.cohoc.net";
const OUTPUT_DIR = path.join(__dirname, "..", "tuvi_crawler", "output");
const KNOWLEDGE_DIR = path.join(__dirname, "..", "src", "lib", "tuvi", "knowledge", "cung");
const LIDS_FILE = path.join(__dirname, "..", "tuvi_crawler", "discovered_lids.json");
const PROGRESS_FILE = path.join(__dirname, "..", "tuvi_crawler", "crawl_progress.json");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
};

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

async function fetchPage(lid) {
  // Construct URL - we need to find the actual URL pattern
  // Try the sitemap URL format first
  const url = `${COHOC_BASE}/bac-phai-la-so-tu-vi-lid-${lid}.html`;
  
  try {
    const response = await fetch(url, { headers: HEADERS, redirect: "follow" });
    if (!response.ok) {
      // Try alternative URL pattern
      const altUrl = `${COHOC_BASE}/la-so-tu-vi-lid-${lid}.html`;
      const altResponse = await fetch(altUrl, { headers: HEADERS, redirect: "follow" });
      if (altResponse.ok) {
        return await altResponse.text();
      }
      return null;
    }
    return await response.text();
  } catch (e) {
    return null;
  }
}

async function fetchPageDirect(lid) {
  // Fetch from sitemap URL directly
  const sitemapUrls = await getSitemapUrls();
  const url = sitemapUrls.find(u => u.includes(`lid-${lid}`));
  
  if (!url) {
    console.log(`[FETCH] No URL found for lid=${lid}`);
    return null;
  }
  
  try {
    console.log(`[FETCH] ${url.substring(0, 80)}...`);
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) return null;
    return await response.text();
  } catch (e) {
    return null;
  }
}

let cachedSitemapUrls = null;

async function getSitemapUrls() {
  if (cachedSitemapUrls) return cachedSitemapUrls;
  
  try {
    const response = await fetch(`${COHOC_BASE}/sitemap.xml`, { headers: HEADERS });
    const xml = await response.text();
    
    // Extract URLs
    const urlPattern = /<loc>([^<]+)<\/loc>/g;
    const urls = [];
    let match;
    while ((match = urlPattern.exec(xml)) !== null) {
      urls.push(match[1]);
    }
    
    cachedSitemapUrls = urls;
    return urls;
  } catch (e) {
    return [];
  }
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
  
  fs.writeFileSync(path.join(outputPath, "page.html"), html, "utf-8");
  fs.writeFileSync(
    path.join(outputPath, "interpretations.json"),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
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

async function crawlLid(lid) {
  console.log(`\n[CRAWL] lid=${lid}`);
  
  const html = await fetchPageDirect(lid);
  
  if (!html) {
    console.log(`[CRAWL] Failed to fetch`);
    return { success: false, imported: 0 };
  }
  
  if (html.length < 50000) {
    console.log(`[CRAWL] Page too small (${html.length} bytes)`);
    return { success: false, imported: 0 };
  }
  
  console.log(`[CRAWL] Got ${html.length} bytes`);
  
  const interpretations = parseInterpretationsFromHtml(html, lid);
  const totalInterps = interpretations.sections.reduce((sum, s) => sum + s.interpretations.length, 0);
  
  console.log(`[PARSE] ${interpretations.sections.length} sections, ${totalInterps} interpretations`);
  
  if (totalInterps === 0) {
    return { success: false, imported: 0 };
  }
  
  saveOutput(lid, interpretations, html);
  
  const imported = importToKnowledge(interpretations, lid);
  console.log(`[IMPORT] ${imported} new interpretations`);
  
  return { success: true, imported };
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
  }
  return { crawled: [], lastIndex: 0 };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf-8");
}

async function main() {
  const args = process.argv.slice(2);
  
  let count = 5;
  let startIndex = null;
  let delay = 2000;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--count" && args[i + 1]) count = parseInt(args[i + 1]);
    if (args[i] === "--start" && args[i + 1]) startIndex = parseInt(args[i + 1]);
    if (args[i] === "--delay" && args[i + 1]) delay = parseInt(args[i + 1]);
  }
  
  console.log("=".repeat(60));
  console.log("TuVi CoHoc Batch Crawler (from discovered LIDs)");
  console.log("=".repeat(60));
  
  // Load discovered LIDs
  if (!fs.existsSync(LIDS_FILE)) {
    console.log("[ERROR] No discovered LIDs file. Run: node scripts/discover-lids.mjs");
    return;
  }
  
  const allLids = JSON.parse(fs.readFileSync(LIDS_FILE, "utf-8"));
  console.log(`\n[LIDS] Total discovered: ${allLids.length}`);
  
  // Load progress
  const progress = loadProgress();
  console.log(`[PROGRESS] Already crawled: ${progress.crawled.length}`);
  
  // Filter out already crawled
  const remainingLids = allLids.filter(lid => !progress.crawled.includes(lid));
  console.log(`[REMAINING] ${remainingLids.length} LIDs to crawl`);
  
  // Determine start index
  const start = startIndex !== null ? startIndex : 0;
  const lidsToProcess = remainingLids.slice(start, start + count);
  
  console.log(`\n[CONFIG] Processing ${lidsToProcess.length} LIDs (start=${start}, count=${count}, delay=${delay}ms)`);
  
  // Pre-fetch sitemap URLs
  console.log("\n[SITEMAP] Loading sitemap URLs...");
  await getSitemapUrls();
  console.log(`[SITEMAP] Loaded ${cachedSitemapUrls?.length || 0} URLs`);
  
  const results = [];
  
  for (let i = 0; i < lidsToProcess.length; i++) {
    const lid = lidsToProcess[i];
    console.log(`\n[${i + 1}/${lidsToProcess.length}]`);
    
    const result = await crawlLid(lid);
    results.push({ lid, ...result });
    
    // Update progress
    progress.crawled.push(lid);
    progress.lastIndex = start + i + 1;
    saveProgress(progress);
    
    if (i < lidsToProcess.length - 1) {
      console.log(`[WAIT] ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const totalImported = results.reduce((sum, r) => sum + (r.imported || 0), 0);
  
  console.log(`Processed: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${results.length - successful}`);
  console.log(`Total imported: ${totalImported} interpretations`);
  console.log(`\nTotal crawled so far: ${progress.crawled.length}`);
  console.log(`Remaining: ${allLids.length - progress.crawled.length}`);
  
  console.log("\nDetails:");
  for (const r of results) {
    const status = r.success ? "✓" : "✗";
    console.log(`  ${status} lid=${r.lid} - ${r.imported || 0} imported`);
  }
}

main().catch(console.error);
