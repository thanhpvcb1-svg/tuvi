#!/usr/bin/env node
/**
 * Import ALL crawled data và dedupe
 * 
 * Usage:
 *   node scripts/import-all-and-dedupe.mjs --dry-run    # Chỉ xem, không ghi
 *   node scripts/import-all-and-dedupe.mjs              # Thực hiện import + dedupe
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CRAWLER_OUTPUT = path.join(ROOT, "tuvi_crawler", "output");
const KNOWLEDGE_DIR = path.join(ROOT, "src", "lib", "tuvi", "knowledge", "cung");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

// Palace mapping
const PALACE_MAP = {
  "tong-quan": { id: null, name: "Tổng Quan" },
  "menh": { id: "MENH", name: "Mệnh" },
  "than": { id: "THAN", name: "Thân" },
  "phu-mau": { id: "PHU_MAU", name: "Phụ Mẫu" },
  "phuc-duc": { id: "PHUC_DUC", name: "Phúc Đức" },
  "dien-trach": { id: "DIEN_TRACH", name: "Điền Trạch" },
  "quan-loc": { id: "QUAN_LOC", name: "Quan Lộc" },
  "no-boc": { id: "NO_BOC", name: "Nô Bộc" },
  "thien-di": { id: "THIEN_DI", name: "Thiên Di" },
  "tat-ach": { id: "TAT_ACH", name: "Tật Ách" },
  "tai-bach": { id: "TAI_BACH", name: "Tài Bạch" },
  "tu-tuc": { id: "TU_TUC", name: "Tử Tức" },
  "phu-the": { id: "PHU_THE", name: "Phu Thê" },
  "huynh-de": { id: "HUYNH_DE", name: "Huynh Đệ" }
};

// Normalize text for comparison
function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""'']/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\n/g, " ")
    .trim();
}

// Create hash key for fast dedupe
function createHashKey(item) {
  const text = normalizeText(item.content || item.text || item.raw_text);
  if (!text || text.length < 20) return null;
  
  // Use first 150 chars as hash key (covers most duplicates)
  return text.substring(0, 150);
}

// Fast dedupe using hash map
function dedupeItems(items) {
  const seen = new Map(); // hash -> item
  const unique = [];
  
  for (const item of items) {
    const hash = createHashKey(item);
    
    // Skip items with no valid text
    if (!hash) {
      unique.push(item);
      continue;
    }
    
    // Check exact match on hash
    if (!seen.has(hash)) {
      seen.set(hash, item);
      unique.push(item);
    }
    // If hash exists, it's a duplicate - skip
  }
  
  return unique;
}

// Convert to unified format
function toUnifiedFormat(item, chartId, index) {
  // Get condition from various formats
  let condition = item.condition || item.condition_text || "";
  
  // If conditions object exists, try to build condition string
  if (!condition && item.conditions) {
    const parts = [];
    if (item.conditions.position) {
      parts.push(`Cung an tại ${Array.isArray(item.conditions.position) ? item.conditions.position.join('/') : item.conditions.position}`);
    }
    if (item.conditions.required_stars?.length) {
      parts.push(`có ${item.conditions.required_stars.join(', ')}`);
    }
    if (item.conditions.heavenly_stem) {
      parts.push(`can ${item.conditions.heavenly_stem}`);
    }
    if (item.conditions.transformation) {
      const target = item.conditions.target_palace || '';
      parts.push(`Hóa ${item.conditions.transformation} nhập ${target}`);
    }
    condition = parts.join(', ');
  }
  
  return {
    id: item.id || item.block_id || `cohoc_${chartId}_${index}`,
    condition,
    text: item.content || item.text || item.raw_text || "",
    source: {
      book: item.source?.book || "tuvi.cohoc.net",
      author: item.source?.author || "Unknown",
      chart_id: chartId
    },
    accuracy: item.accuracy || 7
  };
}

// ============ MAIN ============

async function main() {
  console.log("═".repeat(70));
  console.log("IMPORT ALL CRAWLED DATA & DEDUPE");
  console.log("═".repeat(70));
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN" : "LIVE"}`);
  console.log("");

  // Step 1: Collect all crawled data by palace
  console.log("📥 Step 1: Collecting crawled data...\n");
  
  const crawledDirs = fs.readdirSync(CRAWLER_OUTPUT).filter(d => 
    fs.statSync(path.join(CRAWLER_OUTPUT, d)).isDirectory()
  );
  
  console.log(`Found ${crawledDirs.length} crawled charts\n`);
  
  const byPalace = {};
  let totalCrawled = 0;
  let processedCharts = 0;
  
  for (const chartId of crawledDirs) {
    const interpFile = path.join(CRAWLER_OUTPUT, chartId, "interpretations.json");
    if (!fs.existsSync(interpFile)) continue;
    
    try {
      const data = JSON.parse(fs.readFileSync(interpFile, "utf-8"));
      if (!data.sections) continue;
      
      for (const section of data.sections) {
        const palaceKey = section.id;
        
        // Skip dai-van, van-nam, phu-luc
        if (palaceKey.includes("dai-van") || palaceKey.includes("van-nam") || palaceKey.includes("phu-luc")) {
          continue;
        }
        
        if (!PALACE_MAP[palaceKey]) continue;
        
        if (!byPalace[palaceKey]) byPalace[palaceKey] = [];
        
        for (let i = 0; i < section.interpretations.length; i++) {
          const item = toUnifiedFormat(section.interpretations[i], chartId, i);
          byPalace[palaceKey].push(item);
          totalCrawled++;
        }
      }
      
      processedCharts++;
      if (processedCharts % 50 === 0) {
        console.log(`  Processed ${processedCharts}/${crawledDirs.length} charts...`);
      }
    } catch (e) {
      console.log(`  ⚠️ Error reading ${chartId}: ${e.message}`);
    }
  }
  
  console.log(`\n✓ Collected ${totalCrawled} interpretations from ${processedCharts} charts\n`);
  
  // Step 2: Load existing knowledge
  console.log("📚 Step 2: Loading existing knowledge...\n");
  
  const existingByPalace = {};
  let totalExisting = 0;
  
  const knowledgeFiles = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith(".json"));
  
  for (const file of knowledgeFiles) {
    try {
      const filePath = path.join(KNOWLEDGE_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      
      // Determine palace from filename
      let palaceKey = null;
      for (const key of Object.keys(PALACE_MAP)) {
        if (file.startsWith(key)) {
          palaceKey = key;
          break;
        }
      }
      if (!palaceKey) continue;
      
      if (!existingByPalace[palaceKey]) existingByPalace[palaceKey] = [];
      
      // Extract items from various formats
      const items = [];
      
      if (data.sections) {
        for (const section of data.sections) {
          if (section.interpretations) items.push(...section.interpretations);
          if (section.blocks) items.push(...section.blocks);
        }
      }
      if (data.blocks) items.push(...data.blocks);
      if (data.interpretations) items.push(...data.interpretations);
      
      for (let i = 0; i < items.length; i++) {
        const item = toUnifiedFormat(items[i], items[i].source?.chart_id || "existing", i);
        existingByPalace[palaceKey].push(item);
        totalExisting++;
      }
    } catch (e) {
      // Skip invalid files
    }
  }
  
  console.log(`✓ Loaded ${totalExisting} existing interpretations\n`);
  
  // Step 3: Merge and dedupe
  console.log("🔄 Step 3: Merging and deduplicating...\n");
  
  const results = {};
  let grandTotalBefore = 0;
  let grandTotalAfter = 0;
  
  for (const palaceKey of Object.keys(PALACE_MAP)) {
    const crawled = byPalace[palaceKey] || [];
    const existing = existingByPalace[palaceKey] || [];
    const merged = [...existing, ...crawled];
    
    grandTotalBefore += merged.length;
    
    if (merged.length === 0) continue;
    
    const unique = dedupeItems(merged);
    grandTotalAfter += unique.length;
    
    const removed = merged.length - unique.length;
    const pct = merged.length > 0 ? ((removed / merged.length) * 100).toFixed(1) : 0;
    
    results[palaceKey] = {
      existing: existing.length,
      crawled: crawled.length,
      merged: merged.length,
      unique: unique.length,
      removed,
      items: unique
    };
    
    console.log(`  ${palaceKey.padEnd(12)} : ${existing.length.toString().padStart(5)} existing + ${crawled.length.toString().padStart(6)} crawled = ${merged.length.toString().padStart(6)} → ${unique.length.toString().padStart(6)} (removed ${removed}, ${pct}%)`);
  }
  
  // Step 4: Save consolidated files
  console.log("\n💾 Step 4: Saving consolidated files...\n");
  
  if (!DRY_RUN) {
    for (const [palaceKey, data] of Object.entries(results)) {
      if (data.items.length === 0) continue;
      
      const palace = PALACE_MAP[palaceKey];
      const outputFile = path.join(KNOWLEDGE_DIR, `${palaceKey}-consolidated.json`);
      
      const output = {
        palace: palace.id,
        palace_name: palace.name,
        source: "tuvi.cohoc.net + existing",
        consolidated_at: new Date().toISOString(),
        total_interpretations: data.items.length,
        stats: {
          from_existing: data.existing,
          from_crawled: data.crawled,
          duplicates_removed: data.removed
        },
        interpretations: data.items
      };
      
      fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), "utf-8");
      console.log(`  ✓ ${palaceKey}-consolidated.json (${data.items.length} items)`);
    }
  } else {
    console.log("  [DRY-RUN] No files written");
  }
  
  // Summary
  console.log("\n" + "═".repeat(70));
  console.log("SUMMARY");
  console.log("═".repeat(70));
  console.log(`Total before dedupe: ${grandTotalBefore.toLocaleString()}`);
  console.log(`Total after dedupe:  ${grandTotalAfter.toLocaleString()}`);
  console.log(`Duplicates removed:  ${(grandTotalBefore - grandTotalAfter).toLocaleString()} (${((grandTotalBefore - grandTotalAfter) / grandTotalBefore * 100).toFixed(1)}%)`);
  console.log("═".repeat(70));
  
  if (DRY_RUN) {
    console.log("\n⚠️ DRY-RUN mode - run without --dry-run to save files");
  } else {
    console.log("\n✅ Consolidated files saved to src/lib/tuvi/knowledge/cung/*-consolidated.json");
  }
}

main().catch(console.error);
