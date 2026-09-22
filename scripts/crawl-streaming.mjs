#!/usr/bin/env node
/**
 * Streaming Knowledge Crawler
 * 
 * Crawl tri thức theo kiểu streaming - đọc và xử lý từng phần nhỏ,
 * nạp ngay vào project để tránh quá tải memory/context
 * 
 * Usage:
 *   node scripts/crawl-streaming.mjs <chart_url>
 *   node scripts/crawl-streaming.mjs --from-fixture 472159
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");

// ============ CONFIG ============

const CONFIG = {
  outputDir: path.join(PROJECT_ROOT, "src", "lib", "tuvi", "knowledge", "cung"),
  fixtureDir: path.join(PROJECT_ROOT, "tuvi_crawler", "output"),
  chunkSize: 10, // Số block xử lý mỗi lần trước khi save
  maxBlockLength: 1500, // Giới hạn độ dài mỗi block
};

// Palace mapping
const PALACE_SECTION_MAP = {
  "tong-quan": { id: "tong_quan", name: "Tổng Quan", file: "tong-quan-streaming.json" },
  "menh": { id: "menh", name: "Mệnh", file: "menh-streaming.json" },
  "than": { id: "than", name: "Thân", file: "than-streaming.json" },
  "phu-mau": { id: "phu_mau", name: "Phụ Mẫu", file: "phu-mau-streaming.json" },
  "phuc-duc": { id: "phuc_duc", name: "Phúc Đức", file: "phuc-duc-streaming.json" },
  "dien-trach": { id: "dien_trach", name: "Điền Trạch", file: "dien-trach-streaming.json" },
  "quan-loc": { id: "quan_loc", name: "Quan Lộc", file: "quan-loc-streaming.json" },
  "no-boc": { id: "no_boc", name: "Nô Bộc", file: "no-boc-streaming.json" },
  "thien-di": { id: "thien_di", name: "Thiên Di", file: "thien-di-streaming.json" },
  "tat-ach": { id: "tat_ach", name: "Tật Ách", file: "tat-ach-streaming.json" },
  "tai-bach": { id: "tai_bach", name: "Tài Bạch", file: "tai-bach-streaming.json" },
  "tu-tuc": { id: "tu_tuc", name: "Tử Tức", file: "tu-tuc-streaming.json" },
  "phu-the": { id: "phu_the", name: "Phu Thê", file: "phu-the-streaming.json" },
  "huynh-de": { id: "huynh_de", name: "Huynh Đệ", file: "huynh-de-streaming.json" },
};

// ============ STREAMING PROCESSOR ============

class StreamingKnowledgeProcessor {
  constructor(outputDir) {
    this.outputDir = outputDir;
    this.currentPalace = null;
    this.buffer = [];
    this.stats = { processed: 0, saved: 0, byPalace: {} };
    
    // Ensure output dir exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Process một interpretation và save ngay nếu đủ batch
   */
  processInterpretation(sectionId, interpretation, index) {
    const palaceInfo = PALACE_SECTION_MAP[sectionId];
    if (!palaceInfo) {
      console.log(`  ⚠️ Unknown section: ${sectionId}`);
      return;
    }

    // Nếu đổi palace, flush buffer trước
    if (this.currentPalace && this.currentPalace !== sectionId) {
      this.flush();
    }
    this.currentPalace = sectionId;

    // Convert to knowledge block
    const block = this.convertToBlock(palaceInfo, interpretation, index);
    this.buffer.push(block);
    this.stats.processed++;

    // Flush nếu đủ chunk size
    if (this.buffer.length >= CONFIG.chunkSize) {
      this.flush();
    }
  }

  /**
   * Convert interpretation sang knowledge block format
   */
  convertToBlock(palaceInfo, interp, index) {
    const conditions = this.parseConditions(interp.condition);
    
    return {
      block_id: `${palaceInfo.id}_stream_${index + 1}`,
      condition_text: interp.condition || "",
      raw_text: (interp.content || "").substring(0, CONFIG.maxBlockLength),
      conditions: {
        palace: palaceInfo.id.toUpperCase(),
        ...conditions,
      },
      source: {
        book: interp.source || "tuvi.cohoc.net",
        author: this.extractAuthor(interp.source),
      },
      accuracy: interp.accuracy || 5,
    };
  }

  /**
   * Parse conditions từ condition text
   */
  parseConditions(conditionText) {
    if (!conditionText) return {};
    
    const result = {
      position: null,
      heavenly_stem: null,
      required_stars: [],
      transformations: [],
    };

    // Position
    const posMatch = conditionText.match(/an tại (\S+)/i);
    if (posMatch) {
      const posMap = {
        Tí: "TY", Sửu: "SUU", Dần: "DAN", Mão: "MAO",
        Thìn: "THIN", Tị: "TI", Ngọ: "NGO", Mùi: "MUI",
        Thân: "THAN", Dậu: "DAU", Tuất: "TUAT", Hợi: "HOI",
      };
      result.position = posMap[posMatch[1]] || null;
    }

    // Heavenly stem
    const canMatch = conditionText.match(/can (\S+)/i);
    if (canMatch) {
      const canMap = {
        Giáp: "GIAP", Ất: "AT", Bính: "BINH", Đinh: "DINH",
        Mậu: "MAU", Kỷ: "KY", Canh: "CANH", Tân: "TAN",
        Nhâm: "NHAM", Quý: "QUY",
      };
      result.heavenly_stem = canMap[canMatch[1]] || null;
    }

    // Stars
    const starMatch = conditionText.match(/có\s+([^,]+)/gi);
    if (starMatch) {
      for (const m of starMatch) {
        const stars = m.replace(/có\s+/i, "").split(/[,và]+/).map(s => s.trim()).filter(Boolean);
        result.required_stars.push(...stars);
      }
    }

    return result;
  }

  extractAuthor(source) {
    if (!source) return "Unknown";
    const parts = source.split(" - ");
    return parts.length > 1 ? parts[parts.length - 1] : source;
  }

  /**
   * Flush buffer to file
   */
  flush() {
    if (this.buffer.length === 0 || !this.currentPalace) return;

    const palaceInfo = PALACE_SECTION_MAP[this.currentPalace];
    if (!palaceInfo) return;

    const filePath = path.join(this.outputDir, palaceInfo.file);
    
    // Load existing or create new
    let data;
    try {
      if (fs.existsSync(filePath)) {
        data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
    } catch (e) {
      // Ignore
    }

    if (!data) {
      data = {
        palace: palaceInfo.id,
        palace_name: palaceInfo.name,
        source: "tuvi.cohoc.net",
        crawl_mode: "streaming",
        last_updated: new Date().toISOString(),
        total_blocks: 0,
        blocks: [],
      };
    }

    // Merge blocks (avoid duplicates)
    for (const block of this.buffer) {
      const existingIdx = data.blocks.findIndex(b => b.block_id === block.block_id);
      if (existingIdx >= 0) {
        data.blocks[existingIdx] = block;
      } else {
        data.blocks.push(block);
      }
    }

    data.total_blocks = data.blocks.length;
    data.last_updated = new Date().toISOString();

    // Save
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    
    // Update stats
    this.stats.saved += this.buffer.length;
    this.stats.byPalace[this.currentPalace] = (this.stats.byPalace[this.currentPalace] || 0) + this.buffer.length;
    
    console.log(`  💾 Flushed ${this.buffer.length} blocks to ${palaceInfo.file} (total: ${data.total_blocks})`);
    
    // Clear buffer
    this.buffer = [];
  }

  /**
   * Finalize - flush remaining buffer
   */
  finalize() {
    this.flush();
    return this.stats;
  }
}

// ============ FIXTURE PROCESSOR ============

/**
 * Process từ fixture đã crawl sẵn (interpretations.json)
 */
async function processFromFixture(chartId) {
  const fixturePath = path.join(CONFIG.fixtureDir, chartId, "interpretations.json");
  
  if (!fs.existsSync(fixturePath)) {
    console.error(`❌ Fixture not found: ${fixturePath}`);
    console.log("Run tuvi_crawler first to generate fixture");
    process.exit(1);
  }

  console.log(`📂 Loading fixture: ${fixturePath}`);
  
  const data = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
  const processor = new StreamingKnowledgeProcessor(CONFIG.outputDir);

  console.log(`📊 Found ${data.sections?.length || 0} sections\n`);

  // Process từng section
  for (const section of data.sections || []) {
    const sectionId = section.id;
    console.log(`\n📦 Processing: ${section.title} (${sectionId})`);
    
    // Skip đại vận, vận năm
    if (sectionId.includes("dai-van") || sectionId.includes("van-nam") || sectionId.includes("phu-luc")) {
      console.log("  ⏭️ Skipping (đại vận/vận năm)");
      continue;
    }

    // Process từng interpretation
    const interpretations = section.interpretations || [];
    console.log(`  📝 ${interpretations.length} interpretations`);

    for (let i = 0; i < interpretations.length; i++) {
      processor.processInterpretation(sectionId, interpretations[i], i);
    }
  }

  // Finalize
  const stats = processor.finalize();
  
  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 STREAMING IMPORT SUMMARY");
  console.log("=".repeat(50));
  console.log(`   Processed: ${stats.processed}`);
  console.log(`   Saved: ${stats.saved}`);
  console.log("\n   By Palace:");
  for (const [palace, count] of Object.entries(stats.byPalace)) {
    const info = PALACE_SECTION_MAP[palace];
    console.log(`     ${info?.name || palace}: ${count}`);
  }
  console.log("=".repeat(50));
  console.log(`\n✅ Files saved to: ${CONFIG.outputDir}`);
}

/**
 * Process từ interpretations_by_palace.json (đã group sẵn theo cung)
 */
async function processFromPalaceFixture(chartId) {
  const fixturePath = path.join(CONFIG.fixtureDir, chartId, "interpretations_by_palace.json");
  
  if (!fs.existsSync(fixturePath)) {
    console.log("⚠️ interpretations_by_palace.json not found, falling back to interpretations.json");
    return processFromFixture(chartId);
  }

  console.log(`📂 Loading palace fixture: ${fixturePath}`);
  
  const data = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
  const processor = new StreamingKnowledgeProcessor(CONFIG.outputDir);

  // Process từng palace
  for (const [palaceKey, interpretations] of Object.entries(data)) {
    console.log(`\n📦 Processing palace: ${palaceKey}`);
    console.log(`  📝 ${interpretations.length} interpretations`);

    for (let i = 0; i < interpretations.length; i++) {
      processor.processInterpretation(palaceKey, interpretations[i], i);
    }
  }

  const stats = processor.finalize();
  
  console.log("\n" + "=".repeat(50));
  console.log("📊 IMPORT SUMMARY");
  console.log("=".repeat(50));
  console.log(`   Total: ${stats.saved} blocks`);
  console.log("=".repeat(50));
}

// ============ CLI ============

function printHelp() {
  console.log(`
Streaming Knowledge Crawler

Crawl và import tri thức theo kiểu streaming để tránh quá tải.

Usage:
  node scripts/crawl-streaming.mjs --from-fixture <chart_id>
  node scripts/crawl-streaming.mjs --help

Options:
  --from-fixture <id>   Import từ fixture đã crawl (trong tuvi_crawler/output/)
  --help                Hiển thị help

Example:
  node scripts/crawl-streaming.mjs --from-fixture 472159
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  const fixtureIdx = args.indexOf("--from-fixture");
  if (fixtureIdx >= 0 && args[fixtureIdx + 1]) {
    const chartId = args[fixtureIdx + 1];
    await processFromFixture(chartId);
  } else {
    console.error("❌ Invalid arguments");
    printHelp();
    process.exit(1);
  }
}

main().catch(console.error);
