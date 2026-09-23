/**
 * Crawl 1 URL cụ thể và import vào knowledge
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = path.join(__dirname, "../src/lib/tuvi/knowledge/cung");

const URL = process.argv[2] || "https://tuvi.cohoc.net/bac-phai-la-so-tu-vi-nam-ky-mao-thang-9-ngay-18-gio-ti-am-nam-lid-76684.html";

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
    .replace(/&acirc;/g, "â").replace(/&aring;/g, "å")
    .replace(/&eacute;/g, "é").replace(/&egrave;/g, "è").replace(/&ecirc;/g, "ê")
    .replace(/&iacute;/g, "í").replace(/&igrave;/g, "ì")
    .replace(/&oacute;/g, "ó").replace(/&ograve;/g, "ò").replace(/&ocirc;/g, "ô")
    .replace(/&otilde;/g, "õ")
    .replace(/&uacute;/g, "ú").replace(/&ugrave;/g, "ù")
    .replace(/&yacute;/g, "ý")
    .replace(/&Aacute;/g, "Á").replace(/&Agrave;/g, "À")
    .replace(/&Eacute;/g, "É").replace(/&Egrave;/g, "È")
    .replace(/&Iacute;/g, "Í").replace(/&Igrave;/g, "Ì")
    .replace(/&Oacute;/g, "Ó").replace(/&Ograve;/g, "Ò")
    .replace(/&Uacute;/g, "Ú").replace(/&Ugrave;/g, "Ù")
    .replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"')
    .replace(/&hellip;/g, "...");
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    if (pattern.test(text)) {
      return palace;
    }
  }
  return null;
}

function parseConditionsFromText(text) {
  const conditions = {};
  
  const starPatterns = [
    [/tử\s*vi/i, "tu_vi"],
    [/thiên\s*cơ/i, "thien_co"],
    [/thái\s*dương/i, "thai_duong"],
    [/vũ\s*khúc/i, "vu_khuc"],
    [/thiên\s*đồng/i, "thien_dong"],
    [/liêm\s*trinh/i, "liem_trinh"],
    [/thiên\s*phủ/i, "thien_phu"],
    [/thái\s*âm/i, "thai_am"],
    [/tham\s*lang/i, "tham_lang"],
    [/cự\s*môn/i, "cu_mon"],
    [/thiên\s*tướng/i, "thien_tuong"],
    [/thiên\s*lương/i, "thien_luong"],
    [/thất\s*sát/i, "that_sat"],
    [/phá\s*quân/i, "pha_quan"],
  ];
  
  const stars = [];
  for (const [pattern, star] of starPatterns) {
    if (pattern.test(text)) {
      stars.push(star);
    }
  }
  if (stars.length > 0) {
    conditions.stars = stars;
  }
  
  if (/hóa\s*lộc/i.test(text)) conditions.hasHoaLoc = true;
  if (/hóa\s*quyền/i.test(text)) conditions.hasHoaQuyen = true;
  if (/hóa\s*khoa/i.test(text)) conditions.hasHoaKhoa = true;
  if (/hóa\s*kỵ/i.test(text)) conditions.hasHoaKy = true;
  
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
      palace,
      text,
      hash,
      conditions: parseConditionsFromText(text),
      source: { book: "tuvi.cohoc.net", author: "Cổ Học" },
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
    } catch (e) {
      console.log(`  Warning: Could not parse ${fileName}`);
    }
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
  return filePath;
}

function importBlocks(blocks) {
  const stats = { added: 0, duplicate: 0, byPalace: {} };
  
  const byPalace = {};
  for (const block of blocks) {
    if (!byPalace[block.palace]) {
      byPalace[block.palace] = [];
    }
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
      
      const interp = {
        id: `${palace}_crawl_${Date.now()}_${added}`,
        type: block.conditions.stars?.length ? "star_in_palace" : "general",
        text: block.text,
        source: block.source,
      };
      
      if (block.conditions.stars?.length) {
        interp.required_stars = block.conditions.stars;
      }
      
      knowledge.sections[0].interpretations.push(interp);
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

// Main
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("CRAWL & IMPORT TO KNOWLEDGE");
  console.log("=".repeat(60));
  console.log("URL:", URL);
  console.log("");
  
  // Fetch
  console.log("→ Fetching...");
  const response = await fetch(URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  
  if (!response.ok) {
    console.log("✗ HTTP Error:", response.status);
    return;
  }
  
  const html = await response.text();
  console.log("→ HTML length:", html.length);
  
  // Parse
  console.log("→ Parsing...");
  const blocks = extractInterpretations(html);
  console.log(`→ Found ${blocks.length} blocks`);
  
  // Import
  console.log("→ Importing...");
  const stats = importBlocks(blocks);
  
  console.log("\n" + "=".repeat(60));
  console.log("RESULT");
  console.log("=".repeat(60));
  console.log(`✓ Added: ${stats.added}`);
  console.log(`✗ Duplicate: ${stats.duplicate}`);
  
  if (Object.keys(stats.byPalace).length > 0) {
    console.log("\nBy palace:");
    for (const [palace, count] of Object.entries(stats.byPalace)) {
      console.log(`  ${palace}: +${count}`);
    }
  }
  
  console.log("\n" + "=".repeat(60) + "\n");
}

main().catch(console.error);
