#!/usr/bin/env node
/**
 * Incremental Knowledge Crawler
 * 
 * Crawl từng tri thức một và nạp ngay vào project,
 * tránh lỗi "Too much context loaded"
 * 
 * Usage:
 *   node scripts/crawl-incremental.mjs                    # Crawl tất cả cung
 *   node scripts/crawl-incremental.mjs --palace menh      # Chỉ crawl cung Mệnh
 *   node scripts/crawl-incremental.mjs --resume           # Tiếp tục từ checkpoint
 *   node scripts/crawl-incremental.mjs --dry-run          # Chỉ test, không lưu
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");

// ============ CONFIG ============

const CONFIG = {
  baseUrl: "https://tuvi.cohoc.net",
  outputDir: path.join(PROJECT_ROOT, "src", "lib", "tuvi", "knowledge", "cung"),
  checkpointFile: path.join(PROJECT_ROOT, ".crawl-checkpoint.json"),
  delayMs: 1500, // Delay giữa các request
  maxRetries: 3,
  batchSize: 5, // Số block xử lý mỗi batch trước khi save
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
};

// Danh sách các cung cần crawl
const PALACES = [
  { id: "menh", name: "Mệnh", file: "menh-cohoc-incremental.json" },
  { id: "phu_mau", name: "Phụ Mẫu", file: "phu-mau-cohoc-incremental.json" },
  { id: "phuc_duc", name: "Phúc Đức", file: "phuc-duc-cohoc-incremental.json" },
  { id: "dien_trach", name: "Điền Trạch", file: "dien-trach-cohoc-incremental.json" },
  { id: "quan_loc", name: "Quan Lộc", file: "quan-loc-cohoc-incremental.json" },
  { id: "no_boc", name: "Nô Bộc", file: "no-boc-cohoc-incremental.json" },
  { id: "thien_di", name: "Thiên Di", file: "thien-di-cohoc-incremental.json" },
  { id: "tat_ach", name: "Tật Ách", file: "tat-ach-cohoc-incremental.json" },
  { id: "tai_bach", name: "Tài Bạch", file: "tai-bach-cohoc-incremental.json" },
  { id: "tu_tuc", name: "Tử Tức", file: "tu-tuc-cohoc-incremental.json" },
  { id: "phu_the", name: "Phu Thê", file: "phu-the-cohoc-incremental.json" },
  { id: "huynh_de", name: "Huynh Đệ", file: "huynh-de-cohoc-incremental.json" },
];

// ============ CHECKPOINT MANAGEMENT ============

function loadCheckpoint() {
  try {
    if (fs.existsSync(CONFIG.checkpointFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.checkpointFile, "utf-8"));
    }
  } catch (e) {
    console.warn("⚠️ Could not load checkpoint:", e.message);
  }
  return { lastPalace: null, lastBlockIndex: 0, completed: [] };
}

function saveCheckpoint(checkpoint) {
  fs.writeFileSync(CONFIG.checkpointFile, JSON.stringify(checkpoint, null, 2), "utf-8");
}

function clearCheckpoint() {
  if (fs.existsSync(CONFIG.checkpointFile)) {
    fs.unlinkSync(CONFIG.checkpointFile);
  }
}

// ============ KNOWLEDGE FILE MANAGEMENT ============

function loadExistingKnowledge(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (e) {
    console.warn(`⚠️ Could not load ${filePath}:`, e.message);
  }
  return null;
}

function saveKnowledgeBlock(palace, block, filePath) {
  let data = loadExistingKnowledge(filePath);
  
  if (!data) {
    data = {
      palace: palace.id,
      palace_name: palace.name,
      source: "tuvi.cohoc.net",
      crawl_mode: "incremental",
      last_updated: new Date().toISOString(),
      total_blocks: 0,
      blocks: [],
    };
  }
  
  // Check duplicate by block_id
  const existingIndex = data.blocks.findIndex(b => b.block_id === block.block_id);
  if (existingIndex >= 0) {
    // Update existing
    data.blocks[existingIndex] = block;
  } else {
    // Add new
    data.blocks.push(block);
  }
  
  data.total_blocks = data.blocks.length;
  data.last_updated = new Date().toISOString();
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  return data.total_blocks;
}

function saveBatch(palace, blocks, filePath) {
  let data = loadExistingKnowledge(filePath);
  
  if (!data) {
    data = {
      palace: palace.id,
      palace_name: palace.name,
      source: "tuvi.cohoc.net",
      crawl_mode: "incremental",
      last_updated: new Date().toISOString(),
      total_blocks: 0,
      blocks: [],
    };
  }
  
  for (const block of blocks) {
    const existingIndex = data.blocks.findIndex(b => b.block_id === block.block_id);
    if (existingIndex >= 0) {
      data.blocks[existingIndex] = block;
    } else {
      data.blocks.push(block);
    }
  }
  
  data.total_blocks = data.blocks.length;
  data.last_updated = new Date().toISOString();
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  return data.total_blocks;
}

// ============ HTML PARSING ============

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCondition(title) {
  const result = {
    position: null,
    heavenly_stem: null,
    required_stars: [],
    transformations: [],
    transformation_target: [],
    m_code: null,
    additional_conditions: [],
  };

  // Parse vị trí cung
  const posMatch = title.match(/an tại (\S+)/i);
  if (posMatch) {
    const posMap = {
      Tí: "TY", Sửu: "SUU", Dần: "DAN", Mão: "MAO",
      Thìn: "THIN", Tị: "TI", Ngọ: "NGO", Mùi: "MUI",
      Thân: "THAN", Dậu: "DAU", Tuất: "TUAT", Hợi: "HOI",
    };
    result.position = posMap[posMatch[1]] || null;
  }

  // Parse thiên can
  const canMatch = title.match(/can (\S+)/i);
  if (canMatch) {
    const canMap = {
      Giáp: "GIAP", Ất: "AT", Bính: "BINH", Đinh: "DINH",
      Mậu: "MAU", Kỷ: "KY", Canh: "CANH", Tân: "TAN",
      Nhâm: "NHAM", Quý: "QUY",
    };
    result.heavenly_stem = canMap[canMatch[1]] || null;
  }

  // Parse phi hóa
  const phiHoaPatterns = [
    { pattern: /Lộc\s+(\S+)/i, type: "LOC" },
    { pattern: /Quyền\s+(\S+)/i, type: "QUYEN" },
    { pattern: /Khoa\s+(\S+)/i, type: "KHOA" },
    { pattern: /Kỵ\s+(\S+)/i, type: "KY" },
  ];

  const targetMap = {
    Mệnh: "MENH", Phụ: "PHU_MAU", Phúc: "PHUC_DUC", Điền: "DIEN_TRACH",
    Quan: "QUAN_LOC", Nô: "NO_BOC", Di: "THIEN_DI", Tật: "TAT_ACH",
    Tài: "TAI_BACH", Tử: "TU_TUC", Phối: "PHU_THE", Huynh: "HUYNH_DE",
  };

  for (const { pattern, type } of phiHoaPatterns) {
    const match = title.match(pattern);
    if (match) {
      result.transformations.push(type);
      const target = targetMap[match[1]];
      if (target) result.transformation_target.push(target);
    }
  }

  // Parse M code
  const mCodeMatch = title.match(/M\s+(\S+)/);
  if (mCodeMatch) {
    result.m_code = mCodeMatch[1];
    result.additional_conditions.push(`M_CODE:${mCodeMatch[1]}`);
  }

  // Parse sao
  const starMatch = title.match(/có\s+([^,]+)/gi);
  if (starMatch) {
    for (const m of starMatch) {
      const stars = m.replace(/có\s+/i, "").split(/[,và]+/).map(s => s.trim()).filter(s => s);
      result.required_stars.push(...stars);
    }
  }

  // Parse Hóa tinh
  if (title.includes("Hóa lộc")) result.required_stars.push("Hóa lộc");
  if (title.includes("Hóa quyền")) result.required_stars.push("Hóa quyền");
  if (title.includes("Hóa khoa")) result.required_stars.push("Hóa khoa");
  if (title.includes("Hóa kỵ")) result.required_stars.push("Hóa kỵ");

  return result;
}

function extractSource(text) {
  const sourcePatterns = [
    /\*([^*]+)\*/g,
    /Nguồn:\s*(.+)/i,
    /Trích:\s*(.+)/i,
  ];
  
  for (const pattern of sourcePatterns) {
    const match = text.match(pattern);
    if (match) {
      const source = match[1].trim();
      const parts = source.split(" - ");
      return {
        book: parts[0] || "tuvi.cohoc.net",
        author: parts.length > 1 ? parts[parts.length - 1] : "Unknown",
      };
    }
  }
  
  return { book: "tuvi.cohoc.net", author: "Unknown" };
}

/**
 * Parse interpretations từ JSON fixture
 * Xử lý từng block một để tránh quá tải
 */
function* parseInterpretationsFromJson(jsonData, palaceId) {
  // Tìm section phù hợp với palace
  const palaceKeyMap = {
    menh: "menh",
    phu_mau: "phu-mau",
    phuc_duc: "phuc-duc",
    dien_trach: "dien-trach",
    quan_loc: "quan-loc",
    no_boc: "no-boc",
    thien_di: "thien-di",
    tat_ach: "tat-ach",
    tai_bach: "tai-bach",
    tu_tuc: "tu-tuc",
    phu_the: "phu-the",
    huynh_de: "huynh-de",
  };
  
  const sectionKey = palaceKeyMap[palaceId];
  const section = jsonData.sections?.find(s => s.id === sectionKey);
  
  if (!section || !section.interpretations) {
    return;
  }
  
  let index = 0;
  for (const interp of section.interpretations) {
    const title = interp.condition || "";
    const content = interp.content || "";
    
    // Skip nếu content quá ngắn
    if (content.length < 20) continue;
    
    const parsed = parseCondition(title);
    
    const block = {
      block_id: `${palaceId}_inc_${++index}`,
      condition_text: title,
      raw_text: content.substring(0, 2000),
      conditions: {
        palace: palaceId.toUpperCase(),
        position: parsed.position,
        heavenly_stem: parsed.heavenly_stem,
        required_stars: parsed.required_stars,
        transformations: parsed.transformations,
        transformation_target: parsed.transformation_target,
        additional_conditions: parsed.additional_conditions,
      },
      source: {
        book: interp.source || "tuvi.cohoc.net",
        author: extractAuthor(interp.source),
      },
      accuracy: interp.accuracy || 5,
    };
    
    yield block;
  }
}

function extractAuthor(source) {
  if (!source) return "Unknown";
  const parts = source.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1] : source;
}

// ============ FETCH FUNCTIONS ============

async function fetchWithRetry(url, retries = CONFIG.maxRetries) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers: HEADERS });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.warn(`  ⚠️ Retry ${i + 1}/${retries}: ${error.message}`);
      if (i < retries - 1) {
        await sleep(CONFIG.delayMs * (i + 1));
      }
    }
  }
  throw new Error(`Failed after ${retries} retries`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ MAIN CRAWL FUNCTIONS ============

/**
 * Crawl một cung cụ thể theo kiểu incremental
 */
async function crawlPalaceIncremental(palace, options = {}) {
  const { dryRun = false, startIndex = 0 } = options;
  const filePath = path.join(CONFIG.outputDir, palace.file);
  
  console.log(`\n📦 Crawling: ${palace.name} (${palace.id})`);
  
  // Load từ interpretations.json fixture
  const fixturePath = path.join(PROJECT_ROOT, "tuvi_crawler", "output", "472159", "interpretations.json");
  
  if (!fs.existsSync(fixturePath)) {
    console.log("  ⚠️ No fixture found (interpretations.json), skipping");
    return { success: false, count: 0 };
  }
  
  console.log("  📄 Using local fixture");
  const jsonData = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
  
  // Parse và xử lý từng block
  const iterator = parseInterpretationsFromJson(jsonData, palace.id);
  let batch = [];
  let totalCount = 0;
  let skipped = 0;
  
  for (const block of iterator) {
    totalCount++;
    
    // Skip nếu chưa đến startIndex
    if (totalCount <= startIndex) {
      skipped++;
      continue;
    }
    
    batch.push(block);
    
    // Save batch khi đủ số lượng
    if (batch.length >= CONFIG.batchSize) {
      if (!dryRun) {
        const saved = saveBatch(palace, batch, filePath);
        console.log(`  ✓ Saved batch: ${batch.length} blocks (total: ${saved})`);
      } else {
        console.log(`  [DRY-RUN] Would save batch: ${batch.length} blocks`);
      }
      batch = [];
      
      // Delay để tránh quá tải
      await sleep(100);
    }
  }
  
  // Save remaining batch
  if (batch.length > 0) {
    if (!dryRun) {
      const saved = saveBatch(palace, batch, filePath);
      console.log(`  ✓ Saved final batch: ${batch.length} blocks (total: ${saved})`);
    } else {
      console.log(`  [DRY-RUN] Would save final batch: ${batch.length} blocks`);
    }
  }
  
  console.log(`  📊 Total: ${totalCount} blocks, Skipped: ${skipped}`);
  
  return { success: true, count: totalCount - skipped };
}

/**
 * Crawl tất cả các cung với checkpoint
 */
async function crawlAllIncremental(options = {}) {
  const { resume = false, dryRun = false, palaceFilter = null } = options;
  
  console.log("🚀 Starting Incremental Crawl");
  console.log(`   Mode: ${dryRun ? "DRY-RUN" : "LIVE"}`);
  console.log(`   Resume: ${resume}`);
  
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  // Load checkpoint if resuming
  let checkpoint = resume ? loadCheckpoint() : { lastPalace: null, lastBlockIndex: 0, completed: [] };
  
  const palacesToCrawl = palaceFilter 
    ? PALACES.filter(p => p.id === palaceFilter)
    : PALACES;
  
  const stats = { total: 0, success: 0, failed: 0 };
  
  for (const palace of palacesToCrawl) {
    // Skip if already completed
    if (checkpoint.completed.includes(palace.id)) {
      console.log(`\n⏭️ Skipping ${palace.name} (already completed)`);
      continue;
    }
    
    // Determine start index
    const startIndex = checkpoint.lastPalace === palace.id ? checkpoint.lastBlockIndex : 0;
    
    try {
      const result = await crawlPalaceIncremental(palace, { dryRun, startIndex });
      
      if (result.success) {
        stats.success++;
        stats.total += result.count;
        
        // Update checkpoint
        checkpoint.completed.push(palace.id);
        checkpoint.lastPalace = null;
        checkpoint.lastBlockIndex = 0;
        
        if (!dryRun) {
          saveCheckpoint(checkpoint);
        }
      } else {
        stats.failed++;
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      stats.failed++;
      
      // Save checkpoint for resume
      checkpoint.lastPalace = palace.id;
      if (!dryRun) {
        saveCheckpoint(checkpoint);
      }
    }
    
    // Delay between palaces
    await sleep(CONFIG.delayMs);
  }
  
  // Clear checkpoint if all completed
  if (stats.failed === 0 && !dryRun) {
    clearCheckpoint();
  }
  
  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 CRAWL SUMMARY");
  console.log("=".repeat(50));
  console.log(`   Total blocks: ${stats.total}`);
  console.log(`   Palaces success: ${stats.success}`);
  console.log(`   Palaces failed: ${stats.failed}`);
  console.log("=".repeat(50));
  
  return stats;
}

// ============ CLI ============

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    resume: false,
    dryRun: false,
    palace: null,
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--resume":
        options.resume = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--palace":
        options.palace = args[++i];
        break;
      case "--help":
        console.log(`
Incremental Knowledge Crawler

Usage:
  node scripts/crawl-incremental.mjs [options]

Options:
  --palace <id>   Chỉ crawl một cung cụ thể (menh, phu_mau, ...)
  --resume        Tiếp tục từ checkpoint
  --dry-run       Chỉ test, không lưu file
  --help          Hiển thị help

Palaces:
  ${PALACES.map(p => `${p.id} (${p.name})`).join("\n  ")}
`);
        process.exit(0);
    }
  }
  
  return options;
}

// Main
const options = parseArgs();
crawlAllIncremental({
  resume: options.resume,
  dryRun: options.dryRun,
  palaceFilter: options.palace,
}).catch(console.error);
