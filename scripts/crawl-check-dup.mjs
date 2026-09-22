/**
 * Crawl 1 URL cụ thể và check trùng với knowledge hiện có
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
      text: text.substring(0, 150) + "...",
      hash,
      fullText: text,
    });
  }
  
  return blocks;
}

// Load existing hashes from knowledge files
function loadExistingHashes() {
  const allHashes = new Set();
  
  if (!fs.existsSync(KNOWLEDGE_DIR)) return allHashes;
  
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf-8'));
      if (data.hashes) {
        data.hashes.forEach(h => allHashes.add(h));
      }
    } catch (e) {
      // ignore
    }
  }
  
  return allHashes;
}

// Main
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("CRAWL & CHECK DUPLICATE");
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
  
  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    console.log("→ Title:", titleMatch[1].substring(0, 80));
  }
  
  // Parse
  console.log("\n→ Parsing interpretations...");
  const blocks = extractInterpretations(html);
  console.log(`→ Found ${blocks.length} interpretation blocks`);
  
  // Load existing
  console.log("\n→ Loading existing knowledge hashes...");
  const existingHashes = loadExistingHashes();
  console.log(`→ Existing hashes: ${existingHashes.size}`);
  
  // Check duplicates
  console.log("\n" + "=".repeat(60));
  console.log("DUPLICATE CHECK");
  console.log("=".repeat(60));
  
  let newCount = 0;
  let dupCount = 0;
  const newBlocks = [];
  const dupBlocks = [];
  
  for (const block of blocks) {
    if (existingHashes.has(block.hash)) {
      dupCount++;
      dupBlocks.push(block);
    } else {
      newCount++;
      newBlocks.push(block);
    }
  }
  
  console.log(`\n✓ NEW (chưa có): ${newCount}`);
  console.log(`✗ DUPLICATE (đã có): ${dupCount}`);
  
  if (newBlocks.length > 0) {
    console.log("\n--- NEW BLOCKS ---");
    for (const b of newBlocks.slice(0, 5)) {
      console.log(`[${b.palace}] ${b.text}`);
      console.log(`  Hash: ${b.hash}`);
      console.log("");
    }
    if (newBlocks.length > 5) {
      console.log(`... và ${newBlocks.length - 5} blocks mới khác`);
    }
  }
  
  if (dupBlocks.length > 0 && newBlocks.length === 0) {
    console.log("\n--- SAMPLE DUPLICATE BLOCKS ---");
    for (const b of dupBlocks.slice(0, 3)) {
      console.log(`[${b.palace}] ${b.text}`);
      console.log(`  Hash: ${b.hash}`);
      console.log("");
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total blocks: ${blocks.length}`);
  console.log(`New: ${newCount}`);
  console.log(`Duplicate: ${dupCount}`);
  console.log(`Duplicate rate: ${((dupCount / blocks.length) * 100).toFixed(1)}%`);
  console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
