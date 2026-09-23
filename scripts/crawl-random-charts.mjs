/**
 * Crawl random birth charts from tuvi.cohoc.net
 * 
 * Usage:
 *   node scripts/crawl-random-charts.mjs [count]
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COUNT = parseInt(process.argv[2]) || 5;
const DELAY_MS = 3000;
const OUTPUT_DIR = path.join(__dirname, "../src/lib/tuvi/knowledge/cung");
const BASE_URL = "https://tuvi.cohoc.net/lap-la-so-tu-vi.html";

const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const CHI_SLUG = ["ti", "suu", "dan", "mao", "thin", "ty", "ngo", "mui", "than", "dau", "tuat", "hoi"];
const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];

function generateRandomBirth() {
  const year = 1950 + Math.floor(Math.random() * 70);
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  const hourIndex = Math.floor(Math.random() * 12);
  const gender = Math.random() > 0.5 ? "nam" : "nu";
  const calendar = Math.random() > 0.5 ? "duong" : "am";
  
  const canIndex = (year - 4) % 10;
  const chiIndex = (year - 4) % 12;
  
  return {
    year, month, day,
    hourSlug: CHI_SLUG[hourIndex],
    hourName: CHI[hourIndex],
    gender,
    calendar,
    canChiDisplay: `${CAN[canIndex]} ${CHI[chiIndex]}`,
  };
}

async function submitChartForm(birth) {
  const formData = new URLSearchParams();
  formData.append("nam", birth.year.toString());
  formData.append("thang", birth.month.toString());
  formData.append("ngay", birth.day.toString());
  formData.append("gio", birth.hourSlug);
  formData.append("gioitinh", birth.gender === "nam" ? "1" : "0");
  formData.append("lich", birth.calendar === "duong" ? "1" : "0");
  formData.append("submit", "Lập lá số");
  
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Origin": "https://tuvi.cohoc.net",
      "Referer": BASE_URL,
    },
    body: formData.toString(),
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function parseInterpretations(html) {
  const blocks = [];
  
  // Find interpretation sections
  // Pattern: <h4>CUNG MỆNH</h4> or numbered sections like "1. LUẬN GIẢI MỆNH"
  const palaceRegex = /<h[34][^>]*>([^<]*(?:CUNG|LUẬN GIẢI|GIẢI ĐOÁN)[^<]*)<\/h[34]>/gi;
  const contentParts = html.split(palaceRegex);
  
  for (let i = 1; i < contentParts.length; i += 2) {
    const palaceTitle = contentParts[i]?.trim();
    const content = contentParts[i + 1] || "";
    
    if (!palaceTitle) continue;
    
    const palace = normalizePalace(palaceTitle.replace(/CUNG\s*/i, ""));
    
    // Extract text content, removing HTML tags and decoding entities
    const textContent = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&aacute;/gi, "á").replace(/&agrave;/gi, "à").replace(/&atilde;/gi, "ã").replace(/&acirc;/gi, "â")
      .replace(/&eacute;/gi, "é").replace(/&egrave;/gi, "è").replace(/&ecirc;/gi, "ê")
      .replace(/&iacute;/gi, "í").replace(/&igrave;/gi, "ì")
      .replace(/&oacute;/gi, "ó").replace(/&ograve;/gi, "ò").replace(/&ocirc;/gi, "ô").replace(/&otilde;/gi, "õ")
      .replace(/&uacute;/gi, "ú").replace(/&ugrave;/gi, "ù").replace(/&ucirc;/gi, "û")
      .replace(/&yacute;/gi, "ý")
      .replace(/&ldquo;/gi, "\"").replace(/&rdquo;/gi, "\"")
      .replace(/&lsquo;/gi, "'").replace(/&rsquo;/gi, "'")
      .replace(/&ndash;/gi, "-").replace(/&mdash;/gi, "—")
      .replace(/&#\d+;/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    
    if (textContent.length < 50) continue;
    
    // Split into paragraphs/blocks
    const paragraphs = textContent.split(/\n\n+/).filter(p => p.trim().length > 30);
    
    for (const para of paragraphs.slice(0, 5)) { // Limit to 5 blocks per palace
      blocks.push({
        block_id: `${palace}_crawl_${blocks.length}_${Date.now()}`.toLowerCase(),
        condition_text: palaceTitle,
        raw_text: para.trim(),
        conditions: { palace: palace.toUpperCase() },
        source: { book: "tuvi.cohoc.net", url: "https://tuvi.cohoc.net" },
        accuracy: 7,
      });
    }
  }
  
  return blocks;
}

function normalizePalace(name) {
  // Decode HTML entities first
  const decoded = name
    .replace(/&aacute;/gi, "á").replace(/&agrave;/gi, "à").replace(/&atilde;/gi, "ã")
    .replace(/&eacute;/gi, "é").replace(/&egrave;/gi, "è").replace(/&ecirc;/gi, "ê")
    .replace(/&iacute;/gi, "í").replace(/&igrave;/gi, "ì")
    .replace(/&oacute;/gi, "ó").replace(/&ograve;/gi, "ò").replace(/&ocirc;/gi, "ô")
    .replace(/&uacute;/gi, "ú").replace(/&ugrave;/gi, "ù")
    .replace(/&amp;/gi, "&").replace(/&#\d+;/g, "");
  const n = decoded.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
  const map = {
    "menh": "MENH", "phu mau": "PHU_MAU", "phuc duc": "PHUC_DUC", 
    "dien trach": "DIEN_TRACH", "quan loc": "QUAN_LOC", "no boc": "NO_BOC",
    "thien di": "THIEN_DI", "tat ach": "TAT_ACH", "tai bach": "TAI_BACH",
    "tu tuc": "TU_TUC", "phu the": "PHU_THE", "huynh de": "HUYNH_DE",
  };
  for (const [key, val] of Object.entries(map)) {
    if (n.includes(key)) return val;
  }
  return n.toUpperCase().replace(/\s+/g, "_");
}

// Find existing knowledge file for a palace (prioritize -cohoc-full.json)
function findExistingFile(palace) {
  const palaceSlug = palace.toLowerCase().replace(/_/g, "-");
  const candidates = [
    `${palaceSlug}-cohoc-full.json`,
    `${palaceSlug}-consolidated.json`,
    `${palaceSlug}.json`,
  ];
  
  for (const candidate of candidates) {
    const filePath = path.join(OUTPUT_DIR, candidate);
    if (fs.existsSync(filePath)) return { filePath, fileName: candidate };
  }
  
  // Fallback: create new file
  return { filePath: path.join(OUTPUT_DIR, `${palaceSlug}-cohoc-full.json`), fileName: `${palaceSlug}-cohoc-full.json`, isNew: true };
}

// Get all existing texts from a knowledge file for dedup
function getExistingTexts(data) {
  const texts = new Set();
  const sections = data.sections || [];
  for (const section of sections) {
    for (const block of section.blocks || []) {
      if (block.raw_text) texts.add(block.raw_text.substring(0, 100));
    }
  }
  return texts;
}

function mergeBlocks(newBlocks) {
  const byPalace = {};
  for (const block of newBlocks) {
    const palace = block.conditions.palace.toLowerCase();
    if (!byPalace[palace]) byPalace[palace] = [];
    byPalace[palace].push(block);
  }
  
  for (const [palace, blocks] of Object.entries(byPalace)) {
    const { filePath, fileName, isNew } = findExistingFile(palace);
    
    let existing;
    if (isNew) {
      existing = {
        palace: palace.toUpperCase(),
        source: "tuvi.cohoc.net",
        last_updated: new Date().toISOString(),
        total_blocks: 0,
        sections: [{ section_id: "crawled", title: "Crawled from cohoc.net", blocks: [] }],
      };
    } else {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (e) {
        console.log(`  Warning: Could not parse ${fileName}`);
        continue;
      }
    }
    
    // Get all existing texts for dedup
    const existingTexts = getExistingTexts(existing);
    
    // Find or create "crawled" section
    let crawledSection = existing.sections.find(s => s.section_id === "crawled");
    if (!crawledSection) {
      crawledSection = { section_id: "crawled", title: "Crawled from cohoc.net", blocks: [] };
      existing.sections.push(crawledSection);
    }
    
    let added = 0, skipped = 0;
    for (const block of blocks) {
      const textKey = block.raw_text.substring(0, 100);
      if (existingTexts.has(textKey)) {
        skipped++;
      } else {
        crawledSection.blocks.push(block);
        existingTexts.add(textKey);
        added++;
      }
    }
    
    // Update total_blocks
    existing.total_blocks = existing.sections.reduce((sum, s) => sum + (s.blocks?.length || 0), 0);
    existing.last_updated = new Date().toISOString();
    
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    if (added > 0 || skipped > 0) {
      console.log(`  ${fileName}: +${added} new, ${skipped} dup (total: ${existing.total_blocks})`);
    }
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`\n🔮 Crawling ${COUNT} random charts from tuvi.cohoc.net\n`);
  
  let totalBlocks = 0, successCount = 0;
  
  for (let i = 0; i < COUNT; i++) {
    const birth = generateRandomBirth();
    console.log(`[${i + 1}/${COUNT}] ${birth.canChiDisplay} - ${birth.day}/${birth.month}/${birth.year} - Giờ ${birth.hourName} - ${birth.gender} - ${birth.calendar}`);
    
    try {
      const html = await submitChartForm(birth);
      
      if (!html.includes("CUNG MỆNH") && !html.includes("CUNG MỆ")) {
        console.log("  No chart content found");
        continue;
      }
      
      const blocks = parseInterpretations(html);
      console.log(`  Found ${blocks.length} blocks`);
      
      if (blocks.length > 0) {
        mergeBlocks(blocks);
        totalBlocks += blocks.length;
        successCount++;
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
    
    if (i < COUNT - 1) await sleep(DELAY_MS);
  }
  
  console.log(`\n✅ Done! ${successCount}/${COUNT} charts, ${totalBlocks} blocks\n`);
}

main().catch(console.error);
