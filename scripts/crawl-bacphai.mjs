/**
 * Crawl đúng quy trình:
 * 1. Submit form tạo lá số
 * 2. Tìm link "Luận giải theo Bắc Phái"
 * 3. Crawl trang Bắc Phái để lấy data chuẩn
 * 4. Import vào knowledge
 * 
 * Usage: node scripts/crawl-bacphai.mjs [count]
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "../tuvi_crawler/output");
const KNOWLEDGE_DIR = path.join(__dirname, "../src/lib/tuvi/knowledge/cung");

// Config
const COUNT = parseInt(process.argv[2]) || 20;
const DELAY_MS = 2000;

// Vietnamese data
const CHI_SLUG = ["ti", "suu", "dan", "mao", "thin", "ty", "ngo", "mui", "than", "dau", "tuat", "hoi"];
const CHI_NAME = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

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
  
  return await response.text();
}

function findBacPhaiLink(html) {
  // Tìm link "Bắc Phái" - có thể là relative hoặc absolute
  const patterns = [
    /href=['"]([^'"]*bac-phai[^'"]*\.html)['"]/i,
    /href=['"](\/bac-phai-la-so-tu-vi[^'"]+\.html)['"]/i,
    /href=['"](https:\/\/tuvi\.cohoc\.net\/bac-phai[^'"]+\.html)['"]/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      let url = match[1];
      if (!url.startsWith("http")) {
        url = "https://tuvi.cohoc.net/" + url.replace(/^\//, "");
      }
      return url;
    }
  }
  
  return null;
}

async function fetchBacPhaiPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html",
      "Referer": "https://tuvi.cohoc.net/lap-la-so-tu-vi.html",
    },
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  return await response.text();
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
    } catch (e) {
      // ignore
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

// ============ MAIN ============

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function crawlOne(birth, index) {
  console.log(`\n[${index}] ${birth.day}/${birth.month}/${birth.year} - Giờ ${birth.hourName} - ${birth.genderName} - ${birth.calendarName}`);
  
  // Step 1: Submit form
  console.log("  1. Submit form...");
  const formHtml = await submitChartForm(birth);
  
  // Step 2: Find Bắc Phái link
  console.log("  2. Finding Bắc Phái link...");
  const bacPhaiUrl = findBacPhaiLink(formHtml);
  
  if (!bacPhaiUrl) {
    console.log("  ✗ Không tìm thấy link Bắc Phái");
    return { success: false, reason: "no_link" };
  }
  
  console.log(`  → ${bacPhaiUrl}`);
  
  // Extract lid
  const lidMatch = bacPhaiUrl.match(/-lid-(\d+)\.html/);
  const lid = lidMatch ? lidMatch[1] : `gen_${Date.now()}`;
  
  // Step 3: Fetch Bắc Phái page
  console.log("  3. Fetching Bắc Phái page...");
  const bacPhaiHtml = await fetchBacPhaiPage(bacPhaiUrl);
  console.log(`  → HTML: ${bacPhaiHtml.length} chars`);
  
  // Step 4: Parse
  console.log("  4. Parsing...");
  const blocks = extractInterpretations(bacPhaiHtml);
  console.log(`  → Found ${blocks.length} blocks`);
  
  if (blocks.length === 0) {
    return { success: false, reason: "no_blocks", lid };
  }
  
  // Step 5: Import
  console.log("  5. Importing...");
  const stats = importBlocks(blocks);
  console.log(`  ✓ Added: ${stats.added}, Duplicate: ${stats.duplicate}`);
  
  if (Object.keys(stats.byPalace).length > 0) {
    const summary = Object.entries(stats.byPalace).map(([p, c]) => `${p}:${c}`).join(", ");
    console.log(`  → ${summary}`);
  }
  
  // Save raw HTML
  const chartDir = path.join(OUTPUT_DIR, lid);
  if (!fs.existsSync(chartDir)) {
    fs.mkdirSync(chartDir, { recursive: true });
  }
  fs.writeFileSync(path.join(chartDir, "bacphai.html"), bacPhaiHtml);
  fs.writeFileSync(path.join(chartDir, "metadata.json"), JSON.stringify({
    lid, birth, url: bacPhaiUrl, crawledAt: new Date().toISOString(),
    blocksFound: blocks.length, blocksAdded: stats.added,
  }, null, 2));
  
  return { success: true, lid, stats };
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("CRAWL BẮC PHÁI - ĐÚNG QUY TRÌNH");
  console.log("=".repeat(60));
  console.log(`Count: ${COUNT}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("=".repeat(60));
  
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
  
  let totalSuccess = 0;
  let totalBlocks = 0;
  let totalAdded = 0;
  let totalDuplicate = 0;
  
  for (let i = 0; i < COUNT; i++) {
    const birth = generateRandomBirth();
    
    try {
      const result = await crawlOne(birth, i + 1);
      
      if (result.success) {
        totalSuccess++;
        totalBlocks += result.stats.added + result.stats.duplicate;
        totalAdded += result.stats.added;
        totalDuplicate += result.stats.duplicate;
      }
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
  console.log(`Total blocks: ${totalBlocks}`);
  console.log(`New added: ${totalAdded}`);
  console.log(`Duplicates: ${totalDuplicate}`);
  console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
