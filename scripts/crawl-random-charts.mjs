/**
 * Crawl random birth charts from tuvi.cohoc.net
 * 
 * Usage:
 *   node scripts/crawl-random-charts.mjs [count]
 * 
 * Example:
 *   node scripts/crawl-random-charts.mjs 10
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
const COUNT = parseInt(process.argv[2]) || 5;
const DELAY_MS = 3000; // Delay between requests to avoid rate limiting
const OUTPUT_DIR = path.join(__dirname, "../src/lib/tuvi/knowledge/cung");

// Vietnamese data
const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const CHI_SLUG = ["ti", "suu", "dan", "mao", "thin", "ty", "ngo", "mui", "than", "dau", "tuat", "hoi"];
const GENDER = ["nam", "nu"];
const CALENDAR = ["duong", "am"];

// Generate random birth info
function generateRandomBirth() {
  const year = 1950 + Math.floor(Math.random() * 70); // 1950-2020
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28); // Safe for all months
  const hourIndex = Math.floor(Math.random() * 12);
  const hour = CHI_SLUG[hourIndex];
  const hourName = CHI[hourIndex];
  const gender = GENDER[Math.floor(Math.random() * 2)];
  const calendar = CALENDAR[Math.floor(Math.random() * 2)];
  
  // Calculate Can Chi year
  const canIndex = (year - 4) % 10;
  const chiIndex = (year - 4) % 12;
  const canChi = CAN[canIndex].toLowerCase() + "-" + CHI_SLUG[chiIndex];
  
  return {
    year,
    month,
    day,
    hour,
    hourName,
    gender,
    calendar,
    canChi,
    canChiDisplay: `${CAN[canIndex]} ${CHI[chiIndex]}`,
  };
}

// Build URL for cohoc.net
function buildCohocUrl(birth) {
  // Format: bac-phai-la-so-tu-vi-nam-mau-dan-thang-9-ngay-7-gio-ti-duong-nam-lid-XXXXX.html
  // We need to submit form and get the result page
  const baseUrl = "https://tuvi.cohoc.net/lap-la-so-tu-vi.html";
  return baseUrl;
}

// Submit form to get chart
async function submitChartForm(birth) {
  const formData = new URLSearchParams();
  formData.append("nam", birth.year.toString());
  formData.append("thang", birth.month.toString());
  formData.append("ngay", birth.day.toString());
  formData.append("gio", birth.hour);
  formData.append("gioitinh", birth.gender === "nam" ? "1" : "0");
  formData.append("lich", birth.calendar === "duong" ? "1" : "0");
  formData.append("submit", "Lập lá số");
  
  const response = await fetch("https://tuvi.cohoc.net/lap-la-so-tu-vi.html", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: formData.toString(),
    redirect: "follow",
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  // Get the redirect URL which contains the chart
  const html = await response.text();
  
  // Extract chart URL from response
  const urlMatch = html.match(/href="(\/bac-phai-la-so-tu-vi[^"]+\.html)"/);
  if (urlMatch) {
    return `https://tuvi.cohoc.net${urlMatch[1]}`;
  }
  
  // Or check if we're already on the chart page
  if (html.includes("CUNG MỆNH") || html.includes("#### Cung")) {
    return { html, url: response.url };
  }
  
  return null;
}

// Fetch chart page
async function fetchChartPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return response.text();
}

// Parse interpretations from HTML
function parseInterpretations(html, birth) {
  const blocks = [];
  
  // Pattern: "#### Cung X an tại Y có Z"
  const sectionRegex = /####\s*([^\n]+)\n([\s\S]*?)(?=####|$)/g;
  
  let match;
  while ((match = sectionRegex.exec(html)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    
    const parsed = parseTitle(title);
    if (!parsed) continue;
    
    const { text, source } = parseContent(content);
    if (!text || text.length < 20) continue;
    
    const block = {
      block_id: generateBlockId(parsed, blocks.length),
      condition_text: title,
      raw_text: text,
      conditions: buildConditions(parsed),
      source: {
        book: source.book || "tuvi.cohoc.net",
        author: source.author || "Unknown",
        translator: source.translator || null,
        url: "https://tuvi.cohoc.net",
      },
      accuracy: 7,
    };
    
    blocks.push(block);
  }
  
  return blocks;
}

function parseTitle(title) {
  // Pattern: "Cung Mệnh an tại Tuất có Kỵ Phúc"
  const palaceMatch = title.match(/[Cc]ung\s+(\S+)/);
  if (!palaceMatch) return null;
  
  const palaceName = palaceMatch[1];
  const palace = normalizePalace(palaceName);
  
  // Extract branch
  const branchMatch = title.match(/(?:an\s+)?tại\s+(\S+)/i);
  const position = branchMatch ? normalizeBranch(branchMatch[1]) : null;
  
  // Extract heavenly stem if present
  const stemMatch = title.match(/can\s+(\S+)/i);
  const heavenlyStem = stemMatch ? normalizeStem(stemMatch[1]) : null;
  
  // Extract stars or phi hoa
  const hasMatch = title.match(/có\s+(.+)$/i);
  let requiredStars = [];
  let transformations = [];
  let transformationTarget = [];
  
  if (hasMatch) {
    const hasContent = hasMatch[1];
    
    // Check for phi hoa pattern: "Kỵ Phúc" = Hóa Kỵ nhập Phúc Đức
    const phiHoaMatch = hasContent.match(/^(Lộc|Quyền|Khoa|Kỵ)\s+(\S+)/);
    if (phiHoaMatch) {
      transformations.push(normalizeHoa(phiHoaMatch[1]));
      transformationTarget.push(normalizePalace(phiHoaMatch[2]));
    } else {
      // Extract star names
      const starText = hasContent.replace(/^các sao\s+/i, "");
      requiredStars = starText.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    }
  }
  
  return {
    palace,
    palaceName,
    position,
    heavenlyStem,
    requiredStars,
    transformations,
    transformationTarget,
  };
}

function parseContent(content) {
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
  
  let text = "";
  let source = { book: "tuvi.cohoc.net", author: "Unknown", translator: null };
  
  for (const line of lines) {
    // Check for source citation
    const sourceMatch = line.match(/^([^-–—]+)\s*[-–—]\s*([^-–—]+?)(?:\s*[-–—]\s*(.+?))?$/);
    
    if (sourceMatch && line.length < 120) {
      const book = sourceMatch[1].trim();
      const author = sourceMatch[2].trim();
      const translator = sourceMatch[3] ? sourceMatch[3].replace(/biên dịch/i, "").trim() : null;
      
      if (book.length < 60 && author.length < 40) {
        source = { book, author, translator };
        continue;
      }
    }
    
    if (text) text += "\n";
    text += line;
  }
  
  return { text: text.trim(), source };
}

function buildConditions(parsed) {
  return {
    palace: parsed.palace.toUpperCase(),
    position: parsed.position ? parsed.position.toUpperCase() : null,
    heavenly_stem: parsed.heavenlyStem ? parsed.heavenlyStem.toUpperCase() : null,
    gender: null,
    required_stars: parsed.requiredStars || [],
    excluded_stars: [],
    same_palace_stars: [],
    meeting_stars: [],
    opposite_stars: [],
    trine_stars: [],
    transformations: parsed.transformations || [],
    transformation_target: parsed.transformationTarget || [],
    additional_conditions: [],
  };
}

function generateBlockId(parsed, index) {
  const parts = [parsed.palace, "crawl", index];
  if (parsed.position) parts.push(parsed.position);
  if (parsed.requiredStars.length > 0) parts.push(parsed.requiredStars[0]);
  return parts.join("_").toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "_");
}

function normalizePalace(name) {
  const normalized = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
  
  const map = {
    "menh": "MENH",
    "phu": "PHU_MAU", "phu mau": "PHU_MAU",
    "phuc": "PHUC_DUC", "phuc duc": "PHUC_DUC",
    "dien": "DIEN_TRACH", "dien trach": "DIEN_TRACH",
    "quan": "QUAN_LOC", "quan loc": "QUAN_LOC",
    "no": "NO_BOC", "no boc": "NO_BOC",
    "di": "THIEN_DI", "thien di": "THIEN_DI",
    "tat": "TAT_ACH", "tat ach": "TAT_ACH",
    "tai": "TAI_BACH", "tai bach": "TAI_BACH",
    "tu": "TU_TUC", "tu tuc": "TU_TUC",
    "phu the": "PHU_THE", "the": "PHU_THE",
    "huynh": "HUYNH_DE", "huynh de": "HUYNH_DE",
  };
  
  return map[normalized] || normalized.toUpperCase().replace(/\s+/g, "_");
}

function normalizeBranch(name) {
  const normalized = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
  
  const map = {
    "ty": "TY", "ti": "TY",
    "suu": "SUU",
    "dan": "DAN",
    "mao": "MAO",
    "thin": "THIN",
    "ty_": "TI",
    "ngo": "NGO",
    "mui": "MUI",
    "than": "THAN",
    "dau": "DAU",
    "tuat": "TUAT",
    "hoi": "HOI",
  };
  
  return map[normalized] || normalized.toUpperCase();
}

function normalizeStem(name) {
  const normalized = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
  
  const map = {
    "giap": "GIAP",
    "at": "AT",
    "binh": "BINH",
    "dinh": "DINH",
    "mau": "MAU",
    "ky": "KY", "ki": "KY",
    "canh": "CANH",
    "tan": "TAN",
    "nham": "NHAM",
    "quy": "QUY",
  };
  
  return map[normalized] || normalized.toUpperCase();
}

function normalizeHoa(name) {
  const normalized = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
  
  const map = {
    "loc": "LOC",
    "quyen": "QUYEN",
    "khoa": "KHOA",
    "ky": "KY", "ki": "KY",
  };
  
  return map[normalized] || normalized.toUpperCase();
}

// Merge new blocks into existing knowledge files
function mergeBlocks(newBlocks) {
  // Group by palace
  const byPalace = {};
  for (const block of newBlocks) {
    const palace = block.conditions.palace.toLowerCase();
    if (!byPalace[palace]) {
      byPalace[palace] = [];
    }
    byPalace[palace].push(block);
  }
  
  // Merge into each palace file
  for (const [palace, blocks] of Object.entries(byPalace)) {
    const fileName = `${palace.replace(/_/g, "-")}-crawled.json`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    
    let existing = {
      palace: palace.toUpperCase(),
      source: "tuvi.cohoc.net",
      import_mode: "crawled",
      last_updated: new Date().toISOString(),
      total_blocks: 0,
      sections: [{
        section_id: palace,
        title: `CUNG ${palace.toUpperCase().replace(/_/g, " ")}`,
        blocks: [],
      }],
    };
    
    // Load existing if any
    if (fs.existsSync(filePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (e) {
        console.log(`  Warning: Could not parse ${fileName}, creating new`);
      }
    }
    
    // Add new blocks (avoid duplicates by text)
    const existingTexts = new Set(
      existing.sections[0].blocks.map(b => b.raw_text.substring(0, 100))
    );
    
    let added = 0;
    for (const block of blocks) {
      const textKey = block.raw_text.substring(0, 100);
      if (!existingTexts.has(textKey)) {
        existing.sections[0].blocks.push(block);
        existingTexts.add(textKey);
        added++;
      }
    }
    
    existing.total_blocks = existing.sections[0].blocks.length;
    existing.last_updated = new Date().toISOString();
    
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    console.log(`  ${palace}: +${added} blocks (total: ${existing.total_blocks})`);
  }
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main
async function main() {
  console.log(`\n🔮 Crawling ${COUNT} random charts from tuvi.cohoc.net\n`);
  console.log(`Output: ${OUTPUT_DIR}\n`);
  
  let totalBlocks = 0;
  let successCount = 0;
  
  for (let i = 0; i < COUNT; i++) {
    const birth = generateRandomBirth();
    console.log(`\n[${i + 1}/${COUNT}] ${birth.canChiDisplay} - ${birth.day}/${birth.month}/${birth.year} - Giờ ${birth.hourName} - ${birth.gender} - ${birth.calendar}`);
    
    try {
      // Try direct URL format first
      const directUrl = `https://tuvi.cohoc.net/bac-phai-la-so-tu-vi-${birth.gender}-${birth.canChi}-thang-${birth.month}-ngay-${birth.day}-gio-${birth.hour}-${birth.calendar}-${birth.gender}.html`;
      
      console.log(`  Fetching: ${directUrl}`);
      
      let html;
      try {
        html = await fetchChartPage(directUrl);
      } catch (e) {
        // If direct URL fails, try form submission
        console.log(`  Direct URL failed, trying form submission...`);
        const result = await submitChartForm(birth);
        if (result && result.html) {
          html = result.html;
        } else if (result) {
          html = await fetchChartPage(result);
        } else {
          throw new Error("Could not get chart page");
        }
      }
      
      // Parse interpretations
      const blocks = parseInterpretations(html, birth);
      console.log(`  Found ${blocks.length} interpretation blocks`);
      
      if (blocks.length > 0) {
        mergeBlocks(blocks);
        totalBlocks += blocks.length;
        successCount++;
      }
      
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
    
    // Delay between requests
    if (i < COUNT - 1) {
      console.log(`  Waiting ${DELAY_MS}ms...`);
      await sleep(DELAY_MS);
    }
  }
  
  console.log(`\n✅ Done! Crawled ${successCount}/${COUNT} charts, ${totalBlocks} total blocks\n`);
}

main().catch(console.error);
