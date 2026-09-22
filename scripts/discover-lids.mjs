/**
 * Discover valid LIDs from tuvi.cohoc.net
 * 
 * Usage:
 *   node scripts/discover-lids.mjs
 *   node scripts/discover-lids.mjs --crawl
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COHOC_BASE = "https://tuvi.cohoc.net";
const OUTPUT_DIR = path.join(__dirname, "..", "tuvi_crawler", "output");
const LIDS_FILE = path.join(__dirname, "..", "tuvi_crawler", "discovered_lids.json");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

async function fetchSitemap() {
  console.log("[SITEMAP] Fetching sitemap...");
  
  const urls = [
    `${COHOC_BASE}/sitemap.xml`,
    `${COHOC_BASE}/sitemap_index.xml`,
    `${COHOC_BASE}/robots.txt`,
  ];
  
  for (const url of urls) {
    try {
      console.log(`[FETCH] ${url}`);
      const response = await fetch(url, { headers: HEADERS });
      if (response.ok) {
        const text = await response.text();
        console.log(`[FETCH] Got ${text.length} bytes`);
        
        // Extract LIDs from sitemap
        const lidPattern = /lid-(\d+)\.html/g;
        const lids = new Set();
        let match;
        while ((match = lidPattern.exec(text)) !== null) {
          lids.add(match[1]);
        }
        
        if (lids.size > 0) {
          console.log(`[SITEMAP] Found ${lids.size} LIDs`);
          return Array.from(lids);
        }
      }
    } catch (e) {
      console.log(`[FETCH] Error: ${e.message}`);
    }
  }
  
  return [];
}

async function searchForCharts() {
  console.log("\n[SEARCH] Searching for chart pages...");
  
  // Try to find charts from main page or category pages
  const searchUrls = [
    `${COHOC_BASE}/`,
    `${COHOC_BASE}/la-so-tu-vi/`,
    `${COHOC_BASE}/xem-tu-vi/`,
  ];
  
  const lids = new Set();
  
  for (const url of searchUrls) {
    try {
      console.log(`[FETCH] ${url}`);
      const response = await fetch(url, { headers: HEADERS });
      if (response.ok) {
        const html = await response.text();
        
        // Extract LIDs
        const lidPattern = /lid-(\d+)\.html/g;
        let match;
        while ((match = lidPattern.exec(html)) !== null) {
          lids.add(match[1]);
        }
      }
    } catch (e) {
      console.log(`[FETCH] Error: ${e.message}`);
    }
  }
  
  console.log(`[SEARCH] Found ${lids.size} LIDs from search`);
  return Array.from(lids);
}

async function validateLid(lid) {
  const url = `${COHOC_BASE}/bac-phai-la-so-tu-vi-nam-mau-dan-thang-9-ngay-7-gio-ti-duong-nam-lid-${lid}.html`;
  
  try {
    const response = await fetch(url, { headers: HEADERS, redirect: "follow" });
    const html = await response.text();
    
    // Check if it's a valid chart page (has interpretations)
    const hasContent = html.length > 100000 && html.includes("ketqua");
    return { lid, valid: hasContent, size: html.length };
  } catch (e) {
    return { lid, valid: false, error: e.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldCrawl = args.includes("--crawl");
  
  console.log("=".repeat(60));
  console.log("TuVi CoHoc LID Discovery");
  console.log("=".repeat(60));
  
  // Load existing LIDs
  let existingLids = [];
  if (fs.existsSync(LIDS_FILE)) {
    existingLids = JSON.parse(fs.readFileSync(LIDS_FILE, "utf-8"));
    console.log(`\n[EXISTING] Found ${existingLids.length} previously discovered LIDs`);
  }
  
  // Check already crawled
  const crawledLids = [];
  if (fs.existsSync(OUTPUT_DIR)) {
    const dirs = fs.readdirSync(OUTPUT_DIR).filter(f => /^\d+$/.test(f));
    crawledLids.push(...dirs);
    console.log(`[CRAWLED] Found ${crawledLids.length} already crawled LIDs`);
  }
  
  // Discover new LIDs
  const sitemapLids = await fetchSitemap();
  const searchLids = await searchForCharts();
  
  // Combine all LIDs
  const allLids = new Set([...existingLids, ...sitemapLids, ...searchLids]);
  
  // Add known working LID
  allLids.add("472159");
  
  console.log(`\n[TOTAL] ${allLids.size} unique LIDs discovered`);
  
  // Save discovered LIDs
  const lidsArray = Array.from(allLids);
  fs.writeFileSync(LIDS_FILE, JSON.stringify(lidsArray, null, 2), "utf-8");
  console.log(`[SAVE] Saved to ${LIDS_FILE}`);
  
  // Validate a few LIDs
  console.log("\n[VALIDATE] Checking validity of discovered LIDs...");
  
  const toValidate = lidsArray.filter(lid => !crawledLids.includes(lid)).slice(0, 5);
  
  for (const lid of toValidate) {
    const result = await validateLid(lid);
    const status = result.valid ? "✓" : "✗";
    console.log(`  ${status} lid=${lid} (${result.size || 0} bytes)`);
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total discovered: ${allLids.size}`);
  console.log(`Already crawled: ${crawledLids.length}`);
  console.log(`Remaining: ${allLids.size - crawledLids.length}`);
  
  if (shouldCrawl) {
    console.log("\n[CRAWL] Starting crawl of valid LIDs...");
    // Import crawl function from crawl-cohoc-node.mjs
    console.log("Run: node scripts/crawl-cohoc-node.mjs --lid <LID>");
  }
  
  console.log("\nValid LIDs to crawl:");
  for (const lid of lidsArray.filter(l => !crawledLids.includes(l)).slice(0, 10)) {
    console.log(`  node scripts/crawl-cohoc-node.mjs --lid ${lid}`);
  }
}

main().catch(console.error);
