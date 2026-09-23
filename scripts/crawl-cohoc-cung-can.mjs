/**
 * Crawl CoHoc - Extract Cung + Thiên Can Data
 * 
 * Lấy data về các Cung theo Thiên Can từ tuvicohoc.net
 * Ví dụ: Cung Mệnh MẬU TÍ, Cung Mệnh can Mậu
 * 
 * Run: node scripts/crawl-cohoc-cung-can.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COHOC_BASE_URL = "https://tuvi.cohoc.net";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
};

// 10 Thiên Can
const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
// 12 Địa Chi  
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
// 12 Cung
const CUNG_NAMES = [
  "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc",
  "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"
];

// Tứ Hóa theo Thiên Can
const TU_HOA = {
  "Giáp": { loc: "Liêm Trinh", quyen: "Phá Quân", khoa: "Vũ Khúc", ky: "Thái Dương" },
  "Ất": { loc: "Thiên Cơ", quyen: "Thiên Lương", khoa: "Tử Vi", ky: "Thái Âm" },
  "Bính": { loc: "Thiên Đồng", quyen: "Thiên Cơ", khoa: "Văn Xương", ky: "Liêm Trinh" },
  "Đinh": { loc: "Thái Âm", quyen: "Thiên Đồng", khoa: "Thiên Cơ", ky: "Cự Môn" },
  "Mậu": { loc: "Tham Lang", quyen: "Thái Âm", khoa: "Hữu Bật", ky: "Thiên Cơ" },
  "Kỷ": { loc: "Vũ Khúc", quyen: "Tham Lang", khoa: "Thiên Lương", ky: "Văn Khúc" },
  "Canh": { loc: "Thái Dương", quyen: "Vũ Khúc", khoa: "Thái Âm", ky: "Thiên Đồng" },
  "Tân": { loc: "Cự Môn", quyen: "Thái Dương", khoa: "Văn Khúc", ky: "Văn Xương" },
  "Nhâm": { loc: "Thiên Lương", quyen: "Tử Vi", khoa: "Tả Phụ", ky: "Vũ Khúc" },
  "Quý": { loc: "Phá Quân", quyen: "Cự Môn", khoa: "Thái Âm", ky: "Tham Lang" },
};

// Generate random birth data for crawling
function generateRandomBirthData() {
  const year = 1950 + Math.floor(Math.random() * 60); // 1950-2010
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  const hour = Math.floor(Math.random() * 12); // 0-11 (12 giờ)
  const gender = Math.random() > 0.5 ? 1 : 0; // 1=Nam, 0=Nữ
  
  return { year, month, day, hour, gender };
}

// Build URL for a chart
function buildChartUrl(birthData) {
  const canChiYear = getCanChiYear(birthData.year);
  const gioName = DIA_CHI[birthData.hour].toLowerCase();
  const genderText = birthData.gender === 1 ? "nam" : "nu";
  
  // URL pattern: bac-phai-la-so-tu-vi-nam-{can-chi}-thang-{month}-ngay-{day}-gio-{gio}-am-{gender}-lid-{random}.html
  const lid = Math.floor(Math.random() * 1000) + 1;
  return `${COHOC_BASE_URL}/bac-phai-la-so-tu-vi-nam-${canChiYear.toLowerCase().replace(" ", "-")}-thang-${birthData.month}-ngay-${birthData.day}-gio-${gioName}-am-${genderText}-lid-${lid}.html`;
}

function getCanChiYear(year) {
  const canIndex = (year - 4) % 10;
  const chiIndex = (year - 4) % 12;
  return `${THIEN_CAN[canIndex]} ${DIA_CHI[chiIndex]}`;
}

// Parse HTML to extract Cung + Can data
function parseChartHtml(html) {
  const result = {
    cungData: [],
    interpretations: {},
  };
  
  // Extract cung data from table
  // Pattern: <span class='cung-diachi nguhanh-X'>CAN. CHI</span>
  // Example: <span class='cung-diachi nguhanh-4'>M. Tí</span> = Mậu Tí
  const cungPattern = /<td class='cung'[^>]*>[\s\S]*?<span class='cung-diachi[^']*'>([^<]+)<\/span>[\s\S]*?<p class='cung-tencung'>([^<]+)<\/p>/gi;
  
  let match;
  while ((match = cungPattern.exec(html)) !== null) {
    const canChiShort = match[1].trim(); // e.g., "M. Tí"
    let cungName = match[2].trim(); // e.g., "MỆNH" or "MỆNH <span class='cung-than'>Thân</span>"
    
    // Clean cung name
    cungName = cungName.replace(/<[^>]+>/g, "").trim();
    
    // Parse Can Chi
    const canChi = parseCanChiShort(canChiShort);
    if (canChi) {
      result.cungData.push({
        cung: cungName,
        canChi: canChi.full,
        can: canChi.can,
        chi: canChi.chi,
      });
    }
  }
  
  // Extract interpretations by Cung + Can
  // Pattern: <h4 class='nguyennhan'>Cung Mệnh can Mậu</h4><p class='ketqua'>...</p>
  const interpretPattern = /<h4 class='nguyennhan'>([^<]+)<\/h4>\s*<p class='ketqua'>([^<]+(?:<br\s*\/?>)?[^<]*)<\/p>/gi;
  
  while ((match = interpretPattern.exec(html)) !== null) {
    const title = match[1].trim();
    const content = match[2].replace(/<br\s*\/?>/gi, "\n").trim();
    
    // Check if this is a Cung + Can interpretation
    const cungCanMatch = title.match(/Cung\s+(\S+)\s+(?:an tại\s+)?(\S+)\s+(?:có\s+)?(?:can\s+)?(\S+)?/i);
    if (cungCanMatch) {
      const cungName = cungCanMatch[1];
      const key = title;
      
      if (!result.interpretations[key]) {
        result.interpretations[key] = [];
      }
      result.interpretations[key].push(content);
    }
    
    // Check for "Cung X thiên can là Y" pattern
    const thienCanMatch = title.match(/Cung\s+(\S+)\s+thiên can là\s+(\S+)/i);
    if (thienCanMatch) {
      const key = title;
      if (!result.interpretations[key]) {
        result.interpretations[key] = [];
      }
      result.interpretations[key].push(content);
    }
  }
  
  return result;
}

// Parse short Can Chi format (e.g., "M. Tí" -> { can: "Mậu", chi: "Tí", full: "Mậu Tí" })
function parseCanChiShort(shortForm) {
  const canMap = {
    "G": "Giáp", "Ấ": "Ất", "B": "Bính", "Đ": "Đinh", "M": "Mậu",
    "K": "Kỷ", "C": "Canh", "T": "Tân", "N": "Nhâm", "Q": "Quý"
  };
  
  // Pattern: "X. Chi" where X is first letter of Can
  const match = shortForm.match(/^([GẤBĐMKCTQN])[\.\s]+(\S+)$/i);
  if (!match) return null;
  
  const canLetter = match[1].toUpperCase();
  const chi = match[2];
  
  // Find matching Can
  let can = null;
  for (const [letter, canName] of Object.entries(canMap)) {
    if (canLetter === letter || canLetter === canName[0].toUpperCase()) {
      can = canName;
      break;
    }
  }
  
  if (!can) return null;
  
  // Normalize chi
  const normalizedChi = DIA_CHI.find(c => 
    c.toLowerCase() === chi.toLowerCase() || 
    c.toLowerCase().startsWith(chi.toLowerCase())
  );
  
  if (!normalizedChi) return null;
  
  return {
    can,
    chi: normalizedChi,
    full: `${can} ${normalizedChi}`,
  };
}

// Fetch a chart page
async function fetchChartPage(url) {
  console.log(`  Fetching: ${url.substring(url.lastIndexOf("/") + 1)}`);
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: HEADERS,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.log(`    Error: ${error.message}`);
    return null;
  }
}

// Main crawl function
async function crawlCungCanData(numCharts = 10) {
  console.log("=== Crawl CoHoc Cung + Can Data ===\n");
  
  const outputDir = path.join(__dirname, "..", "src", "lib", "tuvi", "data");
  const outputFile = path.join(outputDir, "cung-thien-can.json");
  
  // Initialize fresh database (don't overwrite the main JSON file)
  let database = {
    thienCan: {},
    cungCanInterpretations: {},
    tuHoa: TU_HOA,
    metadata: {
      lastUpdated: new Date().toISOString(),
      totalChartsCrawled: 0,
    },
  };
  
  console.log("Starting fresh crawl database\n");
  
  // Initialize thienCan structure
  for (const can of THIEN_CAN) {
    if (!database.thienCan[can]) {
      database.thienCan[can] = {
        combinations: [],
        tuHoa: TU_HOA[can],
        cungExamples: {},
      };
    }
  }
  
  // Generate Can-Chi combinations
  for (let i = 0; i < 60; i++) {
    const canIndex = i % 10;
    const chiIndex = i % 12;
    const can = THIEN_CAN[canIndex];
    const chi = DIA_CHI[chiIndex];
    const combo = `${can} ${chi}`;
    
    if (!database.thienCan[can].combinations.includes(combo)) {
      database.thienCan[can].combinations.push(combo);
    }
  }
  
  // Crawl charts
  console.log(`Crawling ${numCharts} random charts...\n`);
  
  for (let i = 0; i < numCharts; i++) {
    const birthData = generateRandomBirthData();
    const url = buildChartUrl(birthData);
    
    const html = await fetchChartPage(url);
    if (!html) {
      continue;
    }
    
    const parsed = parseChartHtml(html);
    
    // Store cung data
    for (const cung of parsed.cungData) {
      const can = cung.can;
      if (can && database.thienCan[can]) {
        const cungKey = cung.cung.toUpperCase();
        if (!database.thienCan[can].cungExamples[cungKey]) {
          database.thienCan[can].cungExamples[cungKey] = [];
        }
        
        const example = {
          canChi: cung.canChi,
          cung: cung.cung,
        };
        
        // Avoid duplicates
        const exists = database.thienCan[can].cungExamples[cungKey].some(
          e => e.canChi === example.canChi
        );
        if (!exists) {
          database.thienCan[can].cungExamples[cungKey].push(example);
        }
      }
    }
    
    // Store interpretations
    for (const [key, contents] of Object.entries(parsed.interpretations)) {
      if (!database.cungCanInterpretations[key]) {
        database.cungCanInterpretations[key] = [];
      }
      for (const content of contents) {
        if (!database.cungCanInterpretations[key].includes(content)) {
          database.cungCanInterpretations[key].push(content);
        }
      }
    }
    
    database.metadata.totalChartsCrawled++;
    
    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }
  
  // Update metadata
  database.metadata.lastUpdated = new Date().toISOString();
  
  // Save database
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputFile, JSON.stringify(database, null, 2), "utf-8");
  console.log(`\n✓ Saved to ${outputFile}`);
  
  // Print summary
  console.log("\n=== Summary ===");
  console.log(`Total charts crawled: ${database.metadata.totalChartsCrawled}`);
  console.log(`Interpretations collected: ${Object.keys(database.cungCanInterpretations).length}`);
  
  for (const can of THIEN_CAN) {
    if (database.thienCan[can]?.cungExamples) {
      const examples = Object.values(database.thienCan[can].cungExamples).flat().length;
      console.log(`  ${can}: ${examples} cung examples`);
    }
  }
}

// Parse existing fixture file
async function parseExistingFixture() {
  console.log("=== Parse Existing Fixture ===\n");
  
  const fixturePath = path.join(__dirname, "..", "tests", "fixtures", "cohoc", "full-chart-page.html");
  
  if (!fs.existsSync(fixturePath)) {
    console.log("Fixture not found, run crawl instead");
    return;
  }
  
  const html = fs.readFileSync(fixturePath, "utf-8");
  const parsed = parseChartHtml(html);
  
  console.log("Cung Data:");
  for (const cung of parsed.cungData) {
    console.log(`  ${cung.cung}: ${cung.canChi} (can ${cung.can})`);
  }
  
  console.log("\nInterpretations:");
  for (const [key, contents] of Object.entries(parsed.interpretations)) {
    console.log(`  ${key}: ${contents.length} entries`);
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || "parse";
const numCharts = parseInt(args[1]) || 5;

if (command === "crawl") {
  crawlCungCanData(numCharts);
} else {
  parseExistingFixture();
}
