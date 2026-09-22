/**
 * Batch Crawl - Crawl nhiều lá số từ tuvi.cohoc.net
 * 
 * Usage:
 *   node scripts/crawl-batch.mjs --count 5
 *   node scripts/crawl-batch.mjs --count 10 --delay 5000
 *   node scripts/crawl-batch.mjs --import-only
 */

import { spawn } from "child_process";
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
const DIA_CHI = ["ty", "suu", "dan", "mao", "thin", "ti", "ngo", "mui", "than", "dau", "tuat", "hoi"];
const GIO = ["ti", "suu", "dan", "mao", "thin", "ty", "ngo", "mui", "than", "dau", "tuat", "hoi"];

// Mapping cung ID
const CUNG_MAP = {
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
  return `${THIEN_CAN[canIndex]}-${DIA_CHI[chiIndex]}`;
}

function generateRandomChart() {
  const year = 1950 + Math.floor(Math.random() * 70); // 1950-2020
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  const hourIndex = Math.floor(Math.random() * 12);
  const gender = Math.random() > 0.5 ? "nam" : "nu";
  const calendar = Math.random() > 0.5 ? "duong" : "am";
  
  const canChi = getCanChiYear(year);
  const gio = GIO[hourIndex];
  const lid = 100000 + Math.floor(Math.random() * 900000);
  
  // URL format: bac-phai-la-so-tu-vi-nam-{can-chi}-thang-{month}-ngay-{day}-gio-{gio}-{calendar}-{gender}-lid-{lid}.html
  const url = `${COHOC_BASE}/bac-phai-la-so-tu-vi-nam-${canChi}-thang-${month}-ngay-${day}-gio-${gio}-${calendar}-${gender}-lid-${lid}.html`;
  
  return { url, lid: lid.toString(), year, month, day, gio, gender, calendar };
}

async function runPythonCrawler(url, lid) {
  return new Promise((resolve, reject) => {
    console.log(`\n[CRAWL] Starting crawler for lid=${lid}`);
    console.log(`[CRAWL] URL: ${url}`);
    
    const crawlerPath = path.join(__dirname, "..", "tuvi_crawler", "crawler.py");
    const proc = spawn("python", [crawlerPath, url, "--wait", "15"], {
      cwd: path.join(__dirname, "..", "tuvi_crawler"),
      stdio: "inherit",
    });
    
    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`[CRAWL] Completed lid=${lid}`);
        resolve(true);
      } else {
        console.log(`[CRAWL] Failed lid=${lid} with code ${code}`);
        resolve(false);
      }
    });
    
    proc.on("error", (err) => {
      console.error(`[CRAWL] Error: ${err.message}`);
      resolve(false);
    });
  });
}

function parseInterpretations(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.error(`[PARSE] Error parsing ${filePath}: ${e.message}`);
    return null;
  }
}

function importToKnowledge(interpretations, lid) {
  if (!interpretations || !interpretations.sections) {
    console.log(`[IMPORT] No sections found for lid=${lid}`);
    return 0;
  }
  
  let totalImported = 0;
  
  for (const section of interpretations.sections) {
    const sectionId = section.id;
    const cungKey = CUNG_MAP[sectionId];
    
    if (!cungKey) {
      console.log(`[IMPORT] Unknown section: ${sectionId}`);
      continue;
    }
    
    const outputFile = path.join(KNOWLEDGE_DIR, `${cungKey}-cohoc-batch.json`);
    
    // Load existing or create new
    let existing = { palace: cungKey, sections: [] };
    if (fs.existsSync(outputFile)) {
      try {
        existing = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
      } catch (e) {
        // ignore
      }
    }
    
    // Find or create section
    let targetSection = existing.sections.find(s => s.section_id === "cohoc_batch");
    if (!targetSection) {
      targetSection = {
        section_id: "cohoc_batch",
        title: "CoHoc Batch Import",
        interpretations: [],
      };
      existing.sections.push(targetSection);
    }
    
    // Add interpretations
    for (const interp of section.interpretations || []) {
      // Check duplicate by text
      const isDuplicate = targetSection.interpretations.some(
        i => i.text === interp.content || i.condition === interp.condition
      );
      
      if (!isDuplicate && interp.content) {
        targetSection.interpretations.push({
          id: `${lid}_${targetSection.interpretations.length}`,
          condition: interp.condition || "",
          text: interp.content,
          source: interp.source || "tuvi.cohoc.net",
          accuracy: interp.accuracy || 7,
          chart_id: lid,
        });
        totalImported++;
      }
    }
    
    // Save
    fs.writeFileSync(outputFile, JSON.stringify(existing, null, 2), "utf-8");
  }
  
  return totalImported;
}

function importExistingFixtures() {
  console.log("\n[IMPORT] Importing from existing fixtures...\n");
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log("[IMPORT] No output directory found");
    return;
  }
  
  const fixtures = fs.readdirSync(OUTPUT_DIR).filter(f => {
    const stat = fs.statSync(path.join(OUTPUT_DIR, f));
    return stat.isDirectory() && /^\d+$/.test(f);
  });
  
  console.log(`[IMPORT] Found ${fixtures.length} fixtures`);
  
  let totalImported = 0;
  
  for (const lid of fixtures) {
    const interpFile = path.join(OUTPUT_DIR, lid, "interpretations.json");
    const interpretations = parseInterpretations(interpFile);
    
    if (interpretations) {
      const count = importToKnowledge(interpretations, lid);
      console.log(`[IMPORT] lid=${lid}: imported ${count} interpretations`);
      totalImported += count;
    }
  }
  
  console.log(`\n[IMPORT] Total imported: ${totalImported} interpretations`);
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse args
  let count = 3;
  let delay = 3000;
  let importOnly = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--count" && args[i + 1]) {
      count = parseInt(args[i + 1]);
    }
    if (args[i] === "--delay" && args[i + 1]) {
      delay = parseInt(args[i + 1]);
    }
    if (args[i] === "--import-only") {
      importOnly = true;
    }
  }
  
  console.log("=".repeat(60));
  console.log("TuVi CoHoc Batch Crawler");
  console.log("=".repeat(60));
  
  if (importOnly) {
    importExistingFixtures();
    return;
  }
  
  console.log(`\nConfig: count=${count}, delay=${delay}ms`);
  console.log("\nNote: This requires Python + Playwright installed in tuvi_crawler/");
  console.log("Run: cd tuvi_crawler && pip install -r requirements.txt && playwright install chromium\n");
  
  const results = [];
  
  for (let i = 0; i < count; i++) {
    const chart = generateRandomChart();
    console.log(`\n[${ i + 1}/${count}] Crawling chart: ${chart.year}/${chart.month}/${chart.day} ${chart.gio} ${chart.gender}`);
    
    const success = await runPythonCrawler(chart.url, chart.lid);
    results.push({ ...chart, success });
    
    if (success) {
      // Try to import immediately
      const interpFile = path.join(OUTPUT_DIR, chart.lid, "interpretations.json");
      
      // Wait a bit for file to be written
      await new Promise(r => setTimeout(r, 1000));
      
      if (fs.existsSync(interpFile)) {
        const interpretations = parseInterpretations(interpFile);
        if (interpretations) {
          const imported = importToKnowledge(interpretations, chart.lid);
          console.log(`[IMPORT] Imported ${imported} interpretations from lid=${chart.lid}`);
        }
      }
    }
    
    // Delay between requests
    if (i < count - 1) {
      console.log(`[WAIT] Waiting ${delay}ms before next request...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  
  const successful = results.filter(r => r.success).length;
  console.log(`Total: ${count}, Success: ${successful}, Failed: ${count - successful}`);
  
  for (const r of results) {
    const status = r.success ? "✓" : "✗";
    console.log(`  ${status} lid=${r.lid} (${r.year}/${r.month}/${r.day} ${r.gio} ${r.gender})`);
  }
}

main().catch(console.error);
