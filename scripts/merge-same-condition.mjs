#!/usr/bin/env node
/**
 * Merge các interpretations có cùng condition thành 1 item
 * Ghép content lại, giữ sources riêng
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = path.join(__dirname, "..", "src", "lib", "tuvi", "knowledge", "cung");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

// Normalize condition for grouping
function normalizeCondition(cond) {
  if (!cond) return "";
  return cond
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Merge items with same condition
function mergeByCondition(items) {
  const groups = new Map();
  
  for (const item of items) {
    const key = normalizeCondition(item.condition);
    if (!key) {
      // Keep items without condition as-is
      if (!groups.has("__no_condition__")) {
        groups.set("__no_condition__", []);
      }
      groups.get("__no_condition__").push(item);
      continue;
    }
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  }
  
  const merged = [];
  
  for (const [key, group] of groups) {
    if (key === "__no_condition__") {
      // Keep items without condition as-is
      merged.push(...group);
      continue;
    }
    
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }
    
    // Merge multiple items with same condition
    const texts = [];
    const sources = [];
    let bestAccuracy = 0;
    
    for (const item of group) {
      const text = (item.text || "").trim();
      if (text && !texts.some(t => t === text)) {
        texts.push(text);
      }
      if (item.source) {
        const sourceStr = typeof item.source === "string" 
          ? item.source 
          : item.source.book || item.source.author || "";
        if (sourceStr && !sources.includes(sourceStr)) {
          sources.push(sourceStr);
        }
      }
      if (item.accuracy > bestAccuracy) {
        bestAccuracy = item.accuracy;
      }
    }
    
    // Create merged item
    merged.push({
      id: group[0].id,
      condition: group[0].condition, // Keep original condition (not normalized)
      text: texts.join("\n\n---\n\n"), // Join with separator
      source: {
        book: sources.slice(0, 3).join("; ") || "tuvi.cohoc.net",
        author: "Multiple sources",
        merged_count: group.length
      },
      accuracy: bestAccuracy || 7
    });
  }
  
  return merged;
}

// Process a single file
function processFile(filePath) {
  const fileName = path.basename(filePath);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    
    if (!data.interpretations || !Array.isArray(data.interpretations)) {
      console.log(`  ⏭️ ${fileName}: No interpretations`);
      return null;
    }
    
    const before = data.interpretations.length;
    const merged = mergeByCondition(data.interpretations);
    const after = merged.length;
    const reduced = before - after;
    
    if (reduced > 0) {
      console.log(`  ✓ ${fileName}: ${before} → ${after} (merged ${reduced})`);
      
      if (!DRY_RUN) {
        data.interpretations = merged;
        data.merged_at = new Date().toISOString();
        data.stats = {
          ...data.stats,
          before_merge: before,
          after_merge: after,
          merged_count: reduced
        };
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      }
      
      return { file: fileName, before, after, reduced };
    } else {
      console.log(`  ○ ${fileName}: ${before} (no duplicates)`);
      return { file: fileName, before, after: before, reduced: 0 };
    }
  } catch (e) {
    console.log(`  ❌ ${fileName}: ${e.message}`);
    return null;
  }
}

// Main
async function main() {
  console.log("═".repeat(60));
  console.log("MERGE SAME CONDITION INTERPRETATIONS");
  console.log("═".repeat(60));
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN" : "LIVE"}\n`);
  
  const files = fs.readdirSync(KNOWLEDGE_DIR)
    .filter(f => f.endsWith("-consolidated.json"));
  
  console.log(`Found ${files.length} consolidated files\n`);
  
  let totalBefore = 0;
  let totalAfter = 0;
  
  for (const file of files) {
    const result = processFile(path.join(KNOWLEDGE_DIR, file));
    if (result) {
      totalBefore += result.before;
      totalAfter += result.after;
    }
  }
  
  console.log("\n" + "═".repeat(60));
  console.log("SUMMARY");
  console.log("═".repeat(60));
  console.log(`Total before: ${totalBefore.toLocaleString()}`);
  console.log(`Total after:  ${totalAfter.toLocaleString()}`);
  console.log(`Merged:       ${(totalBefore - totalAfter).toLocaleString()} (${((totalBefore - totalAfter) / totalBefore * 100).toFixed(1)}%)`);
  
  if (DRY_RUN) {
    console.log("\n⚠️ DRY-RUN - run without --dry-run to apply");
  }
}

main().catch(console.error);
