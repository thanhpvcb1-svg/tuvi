#!/usr/bin/env node
/**
 * Dedupe Knowledge - Làm mịn dữ liệu tri thức, loại bỏ trùng lặp
 * 
 * Usage:
 *   node scripts/dedupe-knowledge.mjs
 *   node scripts/dedupe-knowledge.mjs --dry-run
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = path.join(__dirname, "..", "src", "lib", "tuvi", "knowledge", "cung");

// Similarity threshold (0-1), higher = stricter
const SIMILARITY_THRESHOLD = 0.85;

/**
 * Normalize text for comparison
 */
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

/**
 * Calculate Jaccard similarity between two strings
 */
function jaccardSimilarity(str1, str2) {
  const set1 = new Set(str1.split(/\s+/));
  const set2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * Check if two interpretations are duplicates
 */
function isDuplicate(interp1, interp2) {
  try {
    // Same condition and similar text
    const cond1 = normalizeText(interp1?.condition);
    const cond2 = normalizeText(interp2?.condition);
    
    const text1 = normalizeText(interp1?.text || interp1?.content);
    const text2 = normalizeText(interp2?.text || interp2?.content);
    
    // Skip if both texts are empty or too short
    if (!text1 || !text2 || text1.length < 10 || text2.length < 10) return false;
    
    // Exact match
    if (text1 === text2) return true;
    
    // Very similar text (>85% similar)
    if (text1.length > 50 && text2.length > 50) {
      const similarity = jaccardSimilarity(text1, text2);
      if (similarity > SIMILARITY_THRESHOLD) return true;
    }
    
    // Same condition and text starts the same (first 100 chars)
    if (cond1 && cond2 && cond1 === cond2 && text1.substring(0, 100) === text2.substring(0, 100)) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Dedupe interpretations in a section
 */
function dedupeSection(interpretations) {
  const unique = [];
  const duplicateIds = new Set();
  
  for (let i = 0; i < interpretations.length; i++) {
    const current = interpretations[i];
    let isDup = false;
    
    // Check against already added unique items
    for (const existing of unique) {
      if (isDuplicate(current, existing)) {
        isDup = true;
        duplicateIds.add(current.id);
        break;
      }
    }
    
    if (!isDup) {
      unique.push(current);
    }
  }
  
  return { unique, duplicateCount: duplicateIds.size };
}

/**
 * Convert block to interpretation format for comparison
 */
function blockToInterp(block) {
  if (!block) return null;
  return {
    id: block.block_id || block.id || '',
    condition: block.condition_text || block.condition || '',
    text: block.raw_text || block.text || block.content || '',
    source: block.source,
    accuracy: block.accuracy
  };
}

/**
 * Process a single knowledge file
 */
function processFile(filePath, dryRun = false) {
  const fileName = path.basename(filePath);
  
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    let data;
    try {
      data = JSON.parse(content);
    } catch {
      console.log(`  ⏭️ ${fileName}: Invalid JSON`);
      return { file: fileName, before: 0, after: 0, removed: 0 };
    }
    
    if (!data || typeof data !== 'object') {
      console.log(`  ⏭️ ${fileName}: Not an object`);
      return { file: fileName, before: 0, after: 0, removed: 0 };
    }
    
    let totalBefore = 0;
    let totalAfter = 0;
    let totalRemoved = 0;
    let modified = false;
    
    try {
      // Format 1: sections with interpretations
      if (data.sections && Array.isArray(data.sections)) {
        for (const section of data.sections) {
          if (!section?.interpretations || !Array.isArray(section.interpretations)) continue;
          
          const before = section.interpretations.length;
          totalBefore += before;
          
          const { unique, duplicateCount } = dedupeSection(section.interpretations);
          
          if (duplicateCount > 0) {
            section.interpretations = unique;
            modified = true;
          }
          totalAfter += unique.length;
          totalRemoved += duplicateCount;
        }
      }
      // Format 2: blocks (streaming format)
      else if (data.blocks && Array.isArray(data.blocks)) {
        const before = data.blocks.length;
        totalBefore = before;
        
        const asInterps = data.blocks.map(blockToInterp).filter(Boolean);
        const { unique, duplicateCount } = dedupeSection(asInterps);
        
        if (duplicateCount > 0) {
          const uniqueIds = new Set(unique.map(u => u.id));
          data.blocks = data.blocks.filter(b => uniqueIds.has(b.block_id || b.id));
          data.total_blocks = data.blocks.length;
          modified = true;
        }
        totalAfter = data.blocks.length;
        totalRemoved = duplicateCount;
      }
      // Format 3: interpretations directly (legacy format)
      else if (data.interpretations && Array.isArray(data.interpretations)) {
        const before = data.interpretations.length;
        totalBefore = before;
        
        const { unique, duplicateCount } = dedupeSection(data.interpretations);
        
        if (duplicateCount > 0) {
          data.interpretations = unique;
          modified = true;
        }
        totalAfter = unique.length;
        totalRemoved = duplicateCount;
      }
      else {
        console.log(`  ⏭️ ${fileName}: Unknown format`);
        return { file: fileName, before: 0, after: 0, removed: 0 };
      }
    } catch (innerErr) {
      console.log(`  ⏭️ ${fileName}: Process error - ${innerErr.message}`);
      return { file: fileName, before: 0, after: 0, removed: 0 };
    }
    
    if (totalRemoved > 0) {
      console.log(`  ✓ ${fileName}: ${totalBefore} → ${totalAfter} (removed ${totalRemoved})`);
      
      if (!dryRun && modified) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      }
    } else {
      console.log(`  ○ ${fileName}: ${totalBefore} (no duplicates)`);
    }
    
    return { file: fileName, before: totalBefore, after: totalAfter, removed: totalRemoved };
    
  } catch (e) {
    console.log(`  ⏭️ ${fileName}: ${e.message}`);
    return { file: fileName, before: 0, after: 0, removed: 0 };
  }
}

/**
 * Merge all cohoc files into consolidated files per palace
 */
function mergeAndDedupeAllFiles(dryRun = false) {
  console.log("\n📦 Merging and deduping all cohoc files per palace...\n");
  
  const palaces = [
    "menh", "phu-mau", "phuc-duc", "dien-trach", "quan-loc", "no-boc",
    "thien-di", "tat-ach", "tai-bach", "tu-tuc", "phu-the", "huynh-de",
    "tong-quan", "than"
  ];
  
  const results = [];
  
  for (const palace of palaces) {
    // Find all cohoc files for this palace
    const patterns = [
      `${palace}-cohoc-batch.json`,
      `${palace}-cohoc-full.json`,
      `${palace}-cohoc-incremental.json`,
      `${palace}-cohoc.json`,
      `${palace}-streaming.json`
    ];
    
    const allInterpretations = [];
    let filesProcessed = 0;
    
    for (const pattern of patterns) {
      const filePath = path.join(KNOWLEDGE_DIR, pattern);
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          
          // Extract interpretations from sections
          if (data.sections) {
            for (const section of data.sections) {
              if (section.interpretations) {
                allInterpretations.push(...section.interpretations);
              }
            }
          }
          
          // Extract from blocks (incremental format)
          if (data.blocks) {
            for (const block of data.blocks) {
              allInterpretations.push({
                id: block.block_id,
                condition: block.condition_text,
                text: block.raw_text,
                source: block.source,
                accuracy: block.accuracy || 7
              });
            }
          }
          
          filesProcessed++;
        } catch (e) {
          // Skip invalid files
        }
      }
    }
    
    if (allInterpretations.length === 0) {
      continue;
    }
    
    // Dedupe all interpretations
    const { unique, duplicateCount } = dedupeSection(allInterpretations);
    
    console.log(`  ${palace}: ${allInterpretations.length} → ${unique.length} (removed ${duplicateCount} from ${filesProcessed} files)`);
    
    // Save consolidated file
    if (!dryRun && unique.length > 0) {
      const outputPath = path.join(KNOWLEDGE_DIR, `${palace}-consolidated.json`);
      const consolidated = {
        palace: palace,
        palace_name: palace.toUpperCase().replace(/-/g, "_"),
        source: "tuvi.cohoc.net",
        consolidated_at: new Date().toISOString(),
        total_interpretations: unique.length,
        sections: [{
          section_id: "consolidated",
          title: "Consolidated from all sources",
          interpretations: unique
        }]
      };
      
      fs.writeFileSync(outputPath, JSON.stringify(consolidated, null, 2), "utf-8");
    }
    
    results.push({
      palace,
      before: allInterpretations.length,
      after: unique.length,
      removed: duplicateCount,
      files: filesProcessed
    });
  }
  
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const mergeOnly = args.includes("--merge");
  
  console.log("═".repeat(60));
  console.log("Knowledge Deduplication Tool");
  console.log("═".repeat(60));
  console.log(`Mode: ${dryRun ? "DRY-RUN (no changes)" : "LIVE"}`);
  
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.log("\n❌ Knowledge directory not found");
    return;
  }
  
  // Step 1: Process individual files
  if (!mergeOnly) {
    console.log("\n📁 Processing individual files...\n");
    
    const files = fs.readdirSync(KNOWLEDGE_DIR)
      .filter(f => f.endsWith(".json") && !f.includes("-consolidated"));
    
    let totalBefore = 0;
    let totalAfter = 0;
    let totalRemoved = 0;
    
    for (const file of files) {
      const result = processFile(path.join(KNOWLEDGE_DIR, file), dryRun);
      totalBefore += result.before;
      totalAfter += result.after;
      totalRemoved += result.removed;
    }
    
    console.log("\n" + "─".repeat(60));
    console.log(`Individual files: ${totalBefore} → ${totalAfter} (removed ${totalRemoved})`);
  }
  
  // Step 2: Merge and dedupe across files
  console.log("\n" + "─".repeat(60));
  const mergeResults = mergeAndDedupeAllFiles(dryRun);
  
  // Summary
  const grandTotalBefore = mergeResults.reduce((sum, r) => sum + r.before, 0);
  const grandTotalAfter = mergeResults.reduce((sum, r) => sum + r.after, 0);
  const grandTotalRemoved = mergeResults.reduce((sum, r) => sum + r.removed, 0);
  
  console.log("\n" + "═".repeat(60));
  console.log("SUMMARY");
  console.log("═".repeat(60));
  console.log(`Total interpretations: ${grandTotalBefore}`);
  console.log(`After deduplication: ${grandTotalAfter}`);
  console.log(`Duplicates removed: ${grandTotalRemoved}`);
  console.log(`Reduction: ${((grandTotalRemoved / grandTotalBefore) * 100).toFixed(1)}%`);
  
  if (dryRun) {
    console.log("\n⚠️ DRY-RUN mode - no files were modified");
    console.log("Run without --dry-run to apply changes");
  } else {
    console.log("\n✅ Consolidated files saved to *-consolidated.json");
  }
}

main().catch(console.error);
