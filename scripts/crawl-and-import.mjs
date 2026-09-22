/**
 * Crawl 20 lá số từ tuvicohoc + Parse + Dedupe + Import vào Knowledge
 * 
 * Usage: node scripts/crawl-and-import.mjs
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "../tuvi_crawler/output");
const KNOWLEDGE_DIR = path.join(__dirname, "../src/lib/tuvi/knowledge/cung");

// Config
const COUNT = parseInt(process.argv[2]) || 500;
const DELAY_MS = 1500; // Giảm delay để chạy nhanh hơn

// Vietnamese data
const CHI_SLUG = ["ti", "suu", "dan", "mao", "thin", "ty", "ngo", "mui", "than", "dau", "tuat", "hoi"];
const CHI_NAME = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

// Palace mapping
const PALACE_MAP = {
  "mệnh": "menh", "menh": "menh",
  "phụ mẫu": "phu-mau", "phu mau": "phu-mau", "phụ": "phu-mau",
  "phúc đức": "phuc-duc", "phuc duc": "phuc-duc", "phúc": "phuc-duc",
  "điền trạch": "dien-trach", "dien trach": "dien-trach", "điền": "dien-trach",
  "quan lộc": "quan-loc", "quan loc": "quan-loc", "quan": "quan-loc",
  "nô bộc": "no-boc", "no boc": "no-boc", "nô": "no-boc",
  "thiên di": "thien-di", "thien di": "thien-di", "di": "thien-di",
  "tật ách": "tat-ach", "tat ach": "tat-ach", "tật": "tat-ach",
  "tài bạch": "tai-bach", "tai bach": "tai-bach", "tài": "tai-bach",
  "tử tức": "tu-tuc", "tu tuc": "tu-tuc", "tử": "tu-tuc",
  "phu thê": "phu-the", "phu the": "phu-the", "thê": "phu-the",
  "huynh đệ": "huynh-de", "huynh de": "huynh-de", "huynh": "huynh-de",
};

// ============ CRAWL FUNCTIONS ============

function generateRandomBirth() {
  const year = 1950 + Math.floor(Math.random() * 74);
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  const hourIndex = Math.floor(Math.random() * 12);
  const gender = Math.random() > 0.5 ? "1" : "0";
  const calendar = Math.random() > 0.5 ? "1" : "0";
  
  return {
    year, month, day,
    hour: CHI_SLUG[hourIndex],
    hourName: CHI_NAME[hourIndex],
    gender,
    genderName: gender === "1" ? "Nam" : "Nữ",
    calendar,
    calendarName: calendar === "1" ? "Dương" : "Âm",
  };
}

async function submitChartForm(birth) {
  const formData = new URLSearchParams();
  formData.append("nam", birth.year.toString());
  formData.append("thang", birth.month.toString());
  formData.append("ngay", birth.day.toString());
  formData.append("gio", birth.hour);
  formData.append("gioitinh", birth.gender);
  formData.append("lich", birth.calendar);
  formData.append("submit", "Lập lá số");
  
  const response = await fetch("https://tuvi.cohoc.net/lap-la-so-tu-vi.html", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html",
      "Origin": "https://tuvi.cohoc.net",
      "Referer": "https://tuvi.cohoc.net/lap-la-so-tu-vi.html",
    },
    body: formData.toString(),
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const html = await response.text();
  const lidMatch = html.match(/-lid-(\d+)\.html/);
  const lid = lidMatch ? lidMatch[1] : `gen_${birth.year}${birth.month.toString().padStart(2,'0')}${birth.day.toString().padStart(2,'0')}_${birth.hour}`;
  
  return { html, lid };
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

function detectPalace(title) {
  const normalized = normalizeText(title);
  for (const [key, value] of Object.entries(PALACE_MAP)) {
    if (normalized.includes(normalizeText(key))) {
      return value;
    }
  }
  return null;
}

function extractInterpretations(html) {
  const blocks = [];
  
  // Decode HTML entities first
  const decoded = decodeHtmlEntities(html);
  
  // Pattern 1: Look for noi-dung divs (main content areas)
  const noiDungRegex = /<div[^>]*class="[^"]*noi-dung[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  
  while ((match = noiDungRegex.exec(decoded)) !== null) {
    const content = match[1];
    // Extract paragraphs
    const paragraphs = content.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    
    for (const p of paragraphs) {
      const text = stripHtml(p).trim();
      if (text.length < 50) continue;
      
      // Detect palace from content
      const palace = detectPalaceFromText(text);
      if (!palace) continue;
      
      blocks.push({
        palace,
        title: "",
        conditions: parseConditionsFromText(text),
        text: text,
        source: { book: "tuvi.cohoc.net", author: "Cổ Học" },
        hash: generateHash(text),
      });
    }
  }
  
  // Pattern 2: Look for paragraphs with palace keywords
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  while ((match = pRegex.exec(decoded)) !== null) {
    const text = stripHtml(match[1]).trim();
    if (text.length < 80 || text.length > 2000) continue;
    
    // Must contain palace-related content
    if (!isPalaceContent(text)) continue;
    
    const palace = detectPalaceFromText(text);
    if (!palace) continue;
    
    // Check if already added (by hash)
    const hash = generateHash(text);
    if (blocks.some(b => b.hash === hash)) continue;
    
    blocks.push({
      palace,
      title: "",
      conditions: parseConditionsFromText(text),
      text: text,
      source: { book: "tuvi.cohoc.net", author: "Cổ Học" },
      hash,
    });
  }
  
  return blocks;
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

function isPalaceContent(text) {
  const keywords = [
    "cung mệnh", "cung tài", "cung quan", "cung phúc", "cung điền",
    "cung phu", "cung thê", "cung tử", "cung huynh", "cung nô",
    "cung thiên di", "cung tật", "cung phụ",
    "tử vi", "thiên cơ", "thái dương", "vũ khúc", "thiên đồng",
    "liêm trinh", "thiên phủ", "thái âm", "tham lang", "cự môn",
    "thiên tướng", "thiên lương", "thất sát", "phá quân",
    "hóa lộc", "hóa quyền", "hóa khoa", "hóa kỵ",
    "miếu", "vượng", "đắc", "hãm",
  ];
  
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function detectPalaceFromText(text) {
  const lower = text.toLowerCase();
  
  // Priority order - more specific first
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
    // Short forms
    [/cung\s*tài(?!\s*bạch)/i, "tai-bach"],
    [/cung\s*quan(?!\s*lộc)/i, "quan-loc"],
    [/cung\s*phúc(?!\s*đức)/i, "phuc-duc"],
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
  
  // Stars mentioned
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
  
  // Transformations
  if (/hóa\s*lộc/i.test(text)) conditions.hasHoaLoc = true;
  if (/hóa\s*quyền/i.test(text)) conditions.hasHoaQuyen = true;
  if (/hóa\s*khoa/i.test(text)) conditions.hasHoaKhoa = true;
  if (/hóa\s*kỵ/i.test(text)) conditions.hasHoaKy = true;
  
  return conditions;
}

function parseConditions(title) {
  const conditions = {};
  
  // Position: "an tại Tuất"
  const posMatch = title.match(/an tại\s+(\S+)/i);
  if (posMatch) {
    conditions.position = normalizeText(posMatch[1]);
  }
  
  // Stars: "có Tử Vi, Thiên Cơ"
  const starMatch = title.match(/có\s+(.+)$/i);
  if (starMatch) {
    const starText = starMatch[1];
    // Check if it's phi hoa pattern
    const phiHoaMatch = starText.match(/^(Lộc|Quyền|Khoa|Kỵ)\s+(\S+)/i);
    if (phiHoaMatch) {
      conditions.phiHoa = {
        type: normalizeText(phiHoaMatch[1]),
        target: normalizeText(phiHoaMatch[2]),
      };
    } else {
      conditions.stars = starText.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    }
  }
  
  // Heavenly stem: "can Giáp"
  const stemMatch = title.match(/can\s+(\S+)/i);
  if (stemMatch) {
    conditions.heavenlyStem = normalizeText(stemMatch[1]);
  }
  
  return conditions;
}

function cleanText(text) {
  // Remove HTML tags
  let clean = stripHtml(text);
  
  // Remove source citations (usually at end)
  const sourcePatterns = [
    /Tử vi đẩu số.+$/im,
    /Giáo trình.+$/im,
    /Đẩu số.+$/im,
    /Phi tinh.+$/im,
    /Trung Châu.+$/im,
    /—\s*[^—]+$/,
  ];
  
  for (const pattern of sourcePatterns) {
    clean = clean.replace(pattern, "");
  }
  
  return clean.trim();
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSource(content) {
  const sourcePatterns = [
    /(?:—|–|-)\s*(.+?)\s*(?:—|–|-)\s*(.+?)(?:\s*(?:—|–|-)\s*(.+?))?$/,
    /(Tử vi đẩu số[^—–-]+)/i,
  ];
  
  for (const pattern of sourcePatterns) {
    const match = content.match(pattern);
    if (match) {
      return {
        book: match[1]?.trim() || "tuvi.cohoc.net",
        author: match[2]?.trim() || "Unknown",
        translator: match[3]?.trim() || null,
      };
    }
  }
  
  return { book: "tuvi.cohoc.net", author: "Unknown" };
}

function detectPalaceFromContext(html, position) {
  // Look backwards for palace header
  const before = html.substring(Math.max(0, position - 500), position);
  
  const palaceHeaders = [
    [/CUNG MỆNH/i, "menh"],
    [/CUNG PHỤ MẪU/i, "phu-mau"],
    [/CUNG PHÚC ĐỨC/i, "phuc-duc"],
    [/CUNG ĐIỀN TRẠCH/i, "dien-trach"],
    [/CUNG QUAN LỘC/i, "quan-loc"],
    [/CUNG NÔ BỘC/i, "no-boc"],
    [/CUNG THIÊN DI/i, "thien-di"],
    [/CUNG TẬT ÁCH/i, "tat-ach"],
    [/CUNG TÀI BẠCH/i, "tai-bach"],
    [/CUNG TỬ TỨC/i, "tu-tuc"],
    [/CUNG PHU THÊ/i, "phu-the"],
    [/CUNG HUYNH ĐỆ/i, "huynh-de"],
  ];
  
  let lastMatch = null;
  let lastIndex = -1;
  
  for (const [pattern, palace] of palaceHeaders) {
    const match = before.match(pattern);
    if (match && match.index > lastIndex) {
      lastMatch = palace;
      lastIndex = match.index;
    }
  }
  
  return lastMatch;
}

function generateHash(text) {
  const normalized = normalizeText(text).substring(0, 200);
  return crypto.createHash("md5").update(normalized).digest("hex").substring(0, 12);
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
  
  // Group by palace
  const byPalace = {};
  for (const block of blocks) {
    if (!byPalace[block.palace]) {
      byPalace[block.palace] = [];
    }
    byPalace[block.palace].push(block);
  }
  
  // Import each palace
  for (const [palace, palaceBlocks] of Object.entries(byPalace)) {
    const knowledge = loadKnowledgeFile(palace);
    const existingHashes = new Set(knowledge.hashes || []);
    
    let added = 0;
    for (const block of palaceBlocks) {
      if (existingHashes.has(block.hash)) {
        stats.duplicate++;
        continue;
      }
      
      // Add new interpretation
      const interp = {
        id: `${palace}_crawl_${Date.now()}_${added}`,
        type: block.conditions.phiHoa ? "phi_hoa" : 
              block.conditions.stars?.length ? "star_in_palace" : "general",
        text: block.text,
        source: block.source,
      };
      
      if (block.conditions.position) {
        interp.conditions = { position: [block.conditions.position] };
      }
      if (block.conditions.stars?.length) {
        interp.required_stars = block.conditions.stars;
      }
      if (block.conditions.phiHoa) {
        interp.conditions = interp.conditions || {};
        interp.conditions.transformation = block.conditions.phiHoa.type;
        interp.target_palace = block.conditions.phiHoa.target;
      }
      if (block.conditions.heavenlyStem) {
        interp.conditions = interp.conditions || {};
        interp.conditions.heavenly_stem = block.conditions.heavenlyStem;
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

// ============ MAIN ============

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("CRAWL + PARSE + IMPORT KNOWLEDGE");
  console.log("Time:", new Date().toISOString());
  console.log("=".repeat(60) + "\n");
  
  // Ensure knowledge dir exists
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
  
  let totalSuccess = 0;
  let totalBlocks = 0;
  let totalAdded = 0;
  let totalDuplicate = 0;
  
  for (let i = 0; i < COUNT; i++) {
    const birth = generateRandomBirth();
    console.log(`\n[${i + 1}/${COUNT}] ${birth.day}/${birth.month}/${birth.year} - Giờ ${birth.hourName} - ${birth.genderName} - ${birth.calendarName}`);
    
    try {
      // 1. Crawl
      console.log("  → Crawling...");
      const { html, lid } = await submitChartForm(birth);
      
      // 2. Parse
      console.log("  → Parsing...");
      const blocks = extractInterpretations(html);
      console.log(`  → Found ${blocks.length} interpretation blocks`);
      
      if (blocks.length === 0) {
        console.log("  ⚠ No interpretations found, skipping");
        continue;
      }
      
      // 3. Import with dedupe
      console.log("  → Importing to knowledge...");
      const stats = importBlocks(blocks);
      
      console.log(`  ✓ Added: ${stats.added}, Duplicate: ${stats.duplicate}`);
      if (Object.keys(stats.byPalace).length > 0) {
        console.log(`  ✓ By palace: ${JSON.stringify(stats.byPalace)}`);
      }
      
      // 4. Save raw HTML for reference
      const chartDir = path.join(OUTPUT_DIR, lid);
      if (!fs.existsSync(chartDir)) {
        fs.mkdirSync(chartDir, { recursive: true });
      }
      fs.writeFileSync(path.join(chartDir, "page.html"), html);
      fs.writeFileSync(path.join(chartDir, "metadata.json"), JSON.stringify({
        lid, birth, crawledAt: new Date().toISOString(),
        blocksFound: blocks.length, blocksAdded: stats.added,
      }, null, 2));
      
      totalSuccess++;
      totalBlocks += blocks.length;
      totalAdded += stats.added;
      totalDuplicate += stats.duplicate;
      
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
    
    if (i < COUNT - 1) {
      await sleep(DELAY_MS);
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Charts crawled: ${totalSuccess}/${COUNT}`);
  console.log(`Total blocks found: ${totalBlocks}`);
  console.log(`New blocks added: ${totalAdded}`);
  console.log(`Duplicates skipped: ${totalDuplicate}`);
  console.log(`Knowledge dir: ${KNOWLEDGE_DIR}`);
  console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
