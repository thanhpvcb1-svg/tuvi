/**
 * Crawl 20 lá số ngẫu nhiên từ tuvi.cohoc.net
 * 
 * Usage: node scripts/crawl-cohoc-20.mjs
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "../tuvi_crawler/output");

// Config
const COUNT = 20;
const DELAY_MS = 2000;

// Load discovered lids
function loadDiscoveredLids() {
  const file = path.join(__dirname, "../tuvi_crawler/discovered_lids.json");
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  }
  return [];
}

// Load đã crawl
function loadCrawled() {
  const progressFile = path.join(__dirname, "../tuvi_crawler/crawl_progress.json");
  if (fs.existsSync(progressFile)) {
    const data = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
    return new Set(data.crawled || []);
  }
  return new Set();
}

// Save progress
function saveCrawled(crawled) {
  const progressFile = path.join(__dirname, "../tuvi_crawler/crawl_progress.json");
  fs.writeFileSync(progressFile, JSON.stringify({
    crawled: Array.from(crawled),
    lastIndex: crawled.size
  }, null, 2));
}

// Pick random lids from discovered list
function pickRandomLids(count, exclude) {
  const discovered = loadDiscoveredLids();
  const available = discovered.filter(lid => !exclude.has(lid));
  
  // Shuffle and pick
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Fetch chart page
async function fetchChart(lid) {
  const url = `https://tuvi.cohoc.net/la-so-tu-vi-lid-${lid}.html`;
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    },
    redirect: "follow",
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const finalUrl = response.url;
  const html = await response.text();
  
  // Check if valid chart page
  if (html.includes("404") || html.includes("không tìm thấy") || html.includes("robot")) {
    throw new Error("Page not found or blocked");
  }
  
  return { html, url: finalUrl };
}

// Parse basic info from HTML
function parseChartInfo(html) {
  const info = {};
  
  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  info.title = titleMatch ? titleMatch[1].trim() : "";
  
  // Extract birth info from title or content
  const birthMatch = info.title.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (birthMatch) {
    info.day = birthMatch[1];
    info.month = birthMatch[2];
    info.year = birthMatch[3];
  }
  
  // Check for chart content
  info.hasCung = html.includes("CUNG MỆNH") || html.includes("Cung Mệnh");
  info.hasStars = html.includes("Tử Vi") || html.includes("Thiên Cơ");
  info.hasInterpretation = html.includes("####") || html.includes("luận giải");
  
  // Count interpretation sections
  const sectionMatches = html.match(/####\s*[^\n]+/g);
  info.interpretationCount = sectionMatches ? sectionMatches.length : 0;
  
  return info;
}

// Save chart data
function saveChart(lid, data) {
  const dir = path.join(OUTPUT_DIR, lid);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Save HTML
  fs.writeFileSync(path.join(dir, "page.html"), data.html);
  
  // Save metadata
  const metadata = {
    lid,
    url: data.url,
    crawledAt: new Date().toISOString(),
    info: data.info,
  };
  fs.writeFileSync(path.join(dir, "metadata.json"), JSON.stringify(metadata, null, 2));
  
  return dir;
}

// Sleep
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Main
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("CRAWL 20 RANDOM CHARTS FROM TUVICOHOC");
  console.log("Time:", new Date().toISOString());
  console.log("=".repeat(60) + "\n");
  
  // Load progress
  const crawled = loadCrawled();
  console.log(`[INFO] Already crawled: ${crawled.size} charts`);
  
  // Pick random lids from discovered list
  const lids = pickRandomLids(COUNT, crawled);
  console.log(`[INFO] Generated ${lids.length} random lids`);
  console.log(`[INFO] LIDs: ${lids.join(", ")}\n`);
  
  let success = 0;
  let failed = 0;
  const results = [];
  
  for (let i = 0; i < lids.length; i++) {
    const lid = lids[i];
    console.log(`\n[${i + 1}/${lids.length}] Crawling lid=${lid}...`);
    
    try {
      const data = await fetchChart(lid);
      const info = parseChartInfo(data.html);
      data.info = info;
      
      const dir = saveChart(lid, data);
      
      console.log(`  ✓ Title: ${info.title.substring(0, 60)}...`);
      console.log(`  ✓ Has chart: ${info.hasCung}, Has stars: ${info.hasStars}`);
      console.log(`  ✓ Interpretations: ${info.interpretationCount}`);
      console.log(`  ✓ Saved to: ${dir}`);
      
      crawled.add(lid);
      saveCrawled(crawled);
      success++;
      
      results.push({ lid, status: "success", info });
      
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      failed++;
      results.push({ lid, status: "failed", error: error.message });
    }
    
    // Delay
    if (i < lids.length - 1) {
      console.log(`  [DELAY] Waiting ${DELAY_MS}ms...`);
      await sleep(DELAY_MS);
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("CRAWL SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total: ${lids.length}`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total crawled: ${crawled.size}`);
  console.log("=".repeat(60) + "\n");
  
  // Save summary
  const summaryFile = path.join(OUTPUT_DIR, `crawl-summary-${Date.now()}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: lids.length,
    success,
    failed,
    results,
  }, null, 2));
  console.log(`Summary saved to: ${summaryFile}\n`);
}

main().catch(console.error);
