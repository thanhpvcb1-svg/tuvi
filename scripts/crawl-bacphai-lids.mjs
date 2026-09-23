/**
 * Crawl Bắc Phái từ danh sách LID đã discovered
 * URL format: https://tuvi.cohoc.net/bac-phai-la-so-tu-vi-...-lid-XXXXX.html
 * 
 * Usage: node scripts/crawl-bacphai-lids.mjs [count]
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "../tuvi_crawler/output");
const KNOWLEDGE_DIR = path.join(__dirname, "../src/lib/tuvi/knowledge/cung");
const PROGRESS_FILE = path.join(__dirname, "../tuvi_crawler/bacphai_progress.json");

// Config
const COUNT = parseInt(process.argv[2]) || 20;
const DELAY_MS = 1500;

// ============ PROGRESS ============

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
  }
  return { crawled: [], failed: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ============ DISCOVER LIDS ============

function loadDiscoveredLids() {
  const file = path.join(__dirname, "../tuvi_crawler/discovered_lids.json");
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  }
  return [];
}

function pickLids(count, exclude) {
  const discovered = loadDiscoveredLids();
  const excludeSet = new Set(exclude);
  const available = discovered.filter(lid => !excludeSet.has(lid));
  
  // Shuffle and pick
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ============ FETCH ============

async function fetchBacPhaiPage(lid) {
  // Thử nhiều URL patterns
  const urls = [
    `https://tuvi.cohoc.net/bac-phai-la-so-tu-vi-lid-${lid}.html`,
    `https://tuvi.cohoc.net/bac-phai-la-so-tu-vi-nam-lid-${lid}.html`,
    `https://tuvi.cohoc.net/bac-phai-la-so-tu-vi-nu-lid-${lid}.html`,
  ];
  
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html",
        },
        redirect: "follow",
      });
      
      if (response.ok) {
        const html = await response.text();
        // Check if it's a valid Bắc Phái page
        if (html.length > 100000 && html.includes("Cung Mệnh")) {
          return { html, url: response.url };
        }
      }
    } catch (e) {
      // Try next URL
    }
  }
  
  // Thử fetch trang gốc và tìm link Bắc Phái
  const baseUrl = `https://tuvi.cohoc.net/la-so-tu-vi-lid-${lid}.html`;
  const response = await fetch(baseUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const html = await response.text();
  
  // Tìm link Bắc Phái trong trang
  const bacPhaiMatch = html.match(/href=['"]([^'"]*bac-phai[^'"]*-lid-\d+\.html)['"]/i);
  if (bacPhaiMatch) {
    let bacPhaiUrl = bacPhaiMatch[1];
    if (!bacPhaiUrl.startsWith("http")) {
      bacPhaiUrl = "https://tuvi.cohoc.net/" + bacPhaiUrl.replace(/^\//, "");
    }
    
    const response2 = await fetch(bacPhaiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (response2.ok) {
      return { html: await response2.text(), url: bacPhaiUrl };
    }
  }
  
  throw new Error("Could not find Bắc Phái page");
}

// ============ PARSE FUNCTIONS ============

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function decodeHtmlEntities(html) {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&aacute;/g, "á").replace(/&agrave;/g, "à").replace(/&atilde;/g, "ã")
    .replace(/&acirc;/g, "â")
    .replace(/&eacute;/g, "é").replace(/&egrave;/g, "è").replace(/&ecirc;/g, "ê")
    .replace(/&iacute;/g, "í").replace(/&igrave;/g, "ì")
    .replace(/&oacute;/g, "ó").replace(/&ograve;/g, "ò").replace(/&ocirc;/g, "ô")
    .replace(/&otilde;/g, "õ")
    .replace(/&uacute;/g, "ú").replace(/&ugrave;/g, "ù")
    .replace(/&yacute;/g, "ý")
    .replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"')
    .replace(/&hellip;/g, "...");
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function generateHash(text) {
  const normalized = normalizeText(text).substring(0, 200);
  return crypto.createHash("md5").update(normalized).digest("hex").substring(0, 12);
}

function isPalaceContent(text) {
  const keywords = [
    "cung mệnh", "cung tài", "cung quan", "cung phúc", "cung điền",
    "cung phu", "cung thê", "cung tử", "cung huynh", "cung nô",
    "cung thiên di", "cung tật", "cung phụ",
    "tử vi", "thiên cơ", "thái dương", "vũ khúc", "thiên đồng",
    "liêm trinh", "thiên phủ", "thái âm", "tham lang", "cự môn",
    "thiên tướng", "thiên lương", "thất sát", "phá quân",
    "hóa lộc", "hóa quyền", "hóa khoa", "hóa kỵ",
  ];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function detectPalaceFromText(text) {
  const patterns = [
    [/cung\s*mệnh/i, "menh"],
    [/cung\s*phụ\s*mẫu/i, "phu-mau"],
    [/cung\s*phúc\s*đức/i, "phuc-duc"],
    [/cung\s*điền\s*trạch/i, "dien-trach"],
    [/cung\s*quan\s*lộc/i, "quan-loc"],
    [/cung\s*nô\s*bộc/i, "no-boc"],
    [/cung\s*thiên\s*di/i, "thien-di"],
    [/cung\s*tật\s*ách/i, "tat-ach"],
    [/cung\s*tài\s*bạch/i, "tai-bach"],
    [/cung\s*tử\s*tức/i, "tu-tuc"],
    [/cung\s*phu\s*thê/i, "phu-the"],
    [/cung\s*huynh\s*đệ/i, "huynh-de"],
  ];
  
  for (const [pattern, palace] of patterns) {
    if (pattern.test(text)) return palace;
  }
  return null;
}

function parseConditionsFromText(text) {
  const conditions = {};
  const starPatterns = [
    [/tử\s*vi/i, "tu_vi"], [/thiên\s*cơ/i, "thien_co"],
    [/thái\s*dương/i, "thai_duong"], [/vũ\s*khúc/i, "vu_khuc"],
    [/thiên\s*đồng/i, "thien_dong"], [/liêm\s*trinh/i, "liem_trinh"],
    [/thiên\s*phủ/i, "thien_phu"], [/thái\s*âm/i, "thai_am"],
    [/tham\s*lang/i, "tham_lang"], [/cự\s*môn/i, "cu_mon"],
    [/thiên\s*tướng/i, "thien_tuong"], [/thiên\s*lương/i, "thien_luong"],
    [/thất\s*sát/i, "that_sat"], [/phá\s*quân/i, "pha_quan"],
  ];
  
  const stars = [];
  for (const [pattern, star] of starPatterns) {
    if (pattern.test(text)) stars.push(star);
  }
  if (stars.length > 0) conditions.stars = stars;
  
  return conditions;
}

function extractInterpretations(html) {
  const blocks = [];
  const decoded = decodeHtmlEntities(html);
  
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  
  while ((match = pRegex.exec(decoded)) !== null) {
    const text = stripHtml(match[1]).trim();
    if (text.length < 80 || text.length > 2000) continue;
    if (!isPalaceContent(text)) continue;
    
    const palace = detectPalaceFromText(text);
    if (!palace) continue;
    
    const hash = generateHash(text);
    if (blocks.some(b => b.hash === hash)) continue;
    
    blocks.push({
      palace, text, hash,
      conditions: parseConditionsFromText(text),
      source: { book: "tuvi.cohoc.net", author: "Bắc Phái" },
    });
  }
  
  return blocks;
}

// ============ KNOWLEDGE FUNCTIONS ============

function loadKnowledgeFile(palace) {
  const fileName = `${palace}-cohoc-crawl.json`;
  const filePath = path.join(KNOWLEDGE_DIR, fileName);
  
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {}
  }
  
  return {
    palace: palace.toUpperCase().replace(/-/g, "_"),
    source: "tuvi.cohoc.net",
    import_mode: "crawl",
    last_updated: new Date().toISOString(),
    total_blocks: 0,
    hashes: [],
    sections: [{
      section_id: palace,
      title: `CUNG ${palace.toUpperCase().replace(/-/g, " ")}`,
      interpretations: [],
    }],
  };
}

function saveKnowledgeFile(palace, data) {
  const fileName = `${palace}-cohoc-crawl.json`;
  const filePath = path.join(KNOWLEDGE_DIR, fileName);
  data.last_updated = new Date().toISOString();
  data.total_blocks = data.sections[0].interpretations.length;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function importBlocks(blocks) {
  const stats = { added: 0, duplicate: 0, byPalace: {} };
  
  const byPalace = {};
  for (const block of blocks) {
    if (!byPalace[block.palace]) byPalace[block.palace] = [];
    byPalace[block.palace].push(block);
  }
  
  for (const [palace, palaceBlocks] of Object.entries(byPalace)) {
    const knowledge = loadKnowledgeFile(palace);
    const existingHashes = new Set(knowledge.hashes || []);
    
    let added = 0;
    for (const block of palaceBlocks) {
      if (existingHashes.has(block.hash)) {
        stats.duplicate++;
        continue;
      }
      
      knowledge.sections[0].interpretations.push({
        id: `${palace}_crawl_${Date.now()}_${added}`,
        type: block.conditions.stars?.length ? "star_in_palace" : "general",
        text: block.text,
        source: block.source,
        required_stars: block.conditions.stars,
      });
      
      knowledge.hashes = knowledge.hashes || [];
      knowledge.hashes.push(block.hash);
      existingHashes.add(block.hash);
      added++;
      stats.added++;
    }
    
    if (added > 0) {
      saveKnowledgeFile(palace, knowledge);
      stats.byPalace[palace] = added;
    }
  }
  
  return stats;
}

// ============ MAIN ============

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("CRAWL BẮC PHÁI TỪ DISCOVERED LIDS");
  console.log("=".repeat(60));
  console.log(`Count: ${COUNT}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("=".repeat(60));
  
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
  
  const progress = loadProgress();
  const lids = pickLids(COUNT, [...progress.crawled, ...progress.failed]);
  
  console.log(`\nPicked ${lids.length} lids to crawl`);
  console.log(`Already crawled: ${progress.crawled.length}`);
  
  let totalSuccess = 0;
  let totalAdded = 0;
  let totalDuplicate = 0;
  
  for (let i = 0; i < lids.length; i++) {
    const lid = lids[i];
    console.log(`\n[${i + 1}/${lids.length}] LID: ${lid}`);
    
    try {
      const { html, url } = await fetchBacPhaiPage(lid);
      console.log(`  → URL: ${url}`);
      console.log(`  → HTML: ${html.length} chars`);
      
      const blocks = extractInterpretations(html);
      console.log(`  → Blocks: ${blocks.length}`);
      
      if (blocks.length > 0) {
        const stats = importBlocks(blocks);
        console.log(`  ✓ Added: ${stats.added}, Dup: ${stats.duplicate}`);
        
        totalSuccess++;
        totalAdded += stats.added;
        totalDuplicate += stats.duplicate;
        
        // Save HTML
        const chartDir = path.join(OUTPUT_DIR, lid);
        if (!fs.existsSync(chartDir)) fs.mkdirSync(chartDir, { recursive: true });
        fs.writeFileSync(path.join(chartDir, "bacphai.html"), html);
      }
      
      progress.crawled.push(lid);
      
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      progress.failed.push(lid);
    }
    
    saveProgress(progress);
    
    if (i < lids.length - 1) await sleep(DELAY_MS);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Success: ${totalSuccess}/${lids.length}`);
  console.log(`Added: ${totalAdded}`);
  console.log(`Duplicate: ${totalDuplicate}`);
  console.log(`Total crawled: ${progress.crawled.length}`);
  console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
