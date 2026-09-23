/**
 * Parse CoHoc Full Chart Page - Extract ALL Interpretations
 * Run: node scripts/parse-cohoc-detailed.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function parseDetailed() {
  console.log("=== Parse CoHoc Detailed Interpretations ===\n");
  
  const htmlPath = path.join(__dirname, "..", "tests", "fixtures", "cohoc", "full-chart-page.html");
  
  if (!fs.existsSync(htmlPath)) {
    console.error("❌ File not found. Run fetch-cohoc-full.mjs first");
    process.exit(1);
  }
  
  const html = fs.readFileSync(htmlPath, "utf-8");
  console.log(`Loaded: ${html.length} bytes\n`);
  
  const result = {
    title: "",
    basicInfo: {},
    xiHoa: "",
    menhChu: "",
    cuc: "",
    palaces: {},
    phiHoa: [],
    daiVan: [],
    luuNien: [],
  };
  
  // 1. Title
  const titleMatch = html.match(/<h2[^>]*>([^<]*Lá số tử vi[^<]*)<\/h2>/i);
  if (titleMatch) {
    result.title = stripHtml(titleMatch[1]);
    console.log(`📌 Title: ${result.title}\n`);
  }
  
  // 2. Xí Hoa score
  const xiHoaMatch = html.match(/Điểm\s*"xí hoa"\s*của lá số là:\s*([\d.]+)/i);
  if (xiHoaMatch) {
    result.xiHoa = xiHoaMatch[1];
    console.log(`⭐ Xí Hoa Score: ${result.xiHoa}`);
  }
  
  // 3. Mệnh Chủ, Cục
  const menhChuMatch = html.match(/Mệnh chủ\s+([^,]+),\s*cục số\s+([^,]+)/i);
  if (menhChuMatch) {
    result.menhChu = menhChuMatch[1].trim();
    result.cuc = menhChuMatch[2].trim();
    console.log(`👤 Mệnh Chủ: ${result.menhChu}`);
    console.log(`🔢 Cục: ${result.cuc}`);
  }
  
  // 4. Extract all h3/h4 sections with content
  console.log("\n📖 Extracting interpretation sections...\n");
  
  // Find all headers and their positions
  const headerRegex = /<h[34][^>]*>([^<]+)<\/h[34]>/gi;
  const headers = [];
  let match;
  
  while ((match = headerRegex.exec(html)) !== null) {
    headers.push({
      text: stripHtml(match[1]),
      index: match.index,
      fullMatch: match[0],
    });
  }
  
  // Group by unique header text
  const uniqueHeaders = new Map();
  for (const h of headers) {
    if (!uniqueHeaders.has(h.text) && h.text.length > 5 && h.text.length < 100) {
      uniqueHeaders.set(h.text, h);
    }
  }
  
  console.log(`Found ${uniqueHeaders.size} unique sections\n`);
  
  // Key sections to extract
  const keySections = [
    "Phân tích thông tin lá số",
    "Khảo sát vượng suy theo ngũ hành cung",
    "Khảo sát vượng suy theo tinh đẩu",
    "Ngũ hành Hỉ Kị của lá số",
    "Lai Nhân Cung",
  ];
  
  // Extract content for key sections
  const sortedHeaders = [...uniqueHeaders.values()].sort((a, b) => a.index - b.index);
  
  for (let i = 0; i < sortedHeaders.length; i++) {
    const current = sortedHeaders[i];
    const next = sortedHeaders[i + 1];
    
    // Check if this is a key section
    const isKey = keySections.some(k => current.text.includes(k));
    
    if (isKey || current.text.includes("Cung") || current.text.includes("Đại vận")) {
      const startIdx = current.index + current.fullMatch.length;
      const endIdx = next ? next.index : startIdx + 5000;
      const content = html.substring(startIdx, endIdx);
      const text = stripHtml(content).substring(0, 3000);
      
      if (text.length > 50) {
        result.palaces[current.text] = text;
        console.log(`✓ ${current.text.substring(0, 50)}...`);
        console.log(`  ${text.substring(0, 100)}...\n`);
      }
    }
  }
  
  // 5. Extract Phi Hóa interpretations
  console.log("\n🔄 Extracting Phi Hóa...");
  const phiHoaRegex = /phi hóa[^<]*<\/h[34]>([^<]*(?:<(?!h[234])[^>]*>[^<]*)*)/gi;
  let phiMatch;
  while ((phiMatch = phiHoaRegex.exec(html)) !== null) {
    const text = stripHtml(phiMatch[1]).substring(0, 500);
    if (text.length > 20) {
      result.phiHoa.push(text);
    }
  }
  console.log(`  Found ${result.phiHoa.length} Phi Hóa entries`);
  
  // 6. Extract Đại Vận sections
  console.log("\n📅 Extracting Đại Vận...");
  const daiVanRegex = /Đại vận[^<]*(\d+)[^<]*tuổi[^<]*<\/h[34]>([^<]*(?:<(?!h[234])[^>]*>[^<]*)*)/gi;
  let dvMatch;
  while ((dvMatch = daiVanRegex.exec(html)) !== null) {
    const age = dvMatch[1];
    const text = stripHtml(dvMatch[2]).substring(0, 1000);
    if (text.length > 20) {
      result.daiVan.push({ age, interpretation: text });
    }
  }
  console.log(`  Found ${result.daiVan.length} Đại Vận periods`);
  
  // 7. Save results
  const outputPath = path.join(__dirname, "..", "tests", "fixtures", "cohoc", "detailed-interpretations.json");
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");
  console.log(`\n✅ Saved to: ${outputPath}`);
  
  // 8. Create readable text output
  const textLines = [];
  textLines.push(`# ${result.title}`);
  textLines.push(`\n## Thông tin cơ bản`);
  textLines.push(`- Điểm Xí Hoa: ${result.xiHoa}`);
  textLines.push(`- Mệnh Chủ: ${result.menhChu}`);
  textLines.push(`- Cục: ${result.cuc}`);
  
  textLines.push(`\n## Luận giải các cung`);
  for (const [section, content] of Object.entries(result.palaces)) {
    textLines.push(`\n### ${section}`);
    textLines.push(content);
  }
  
  if (result.daiVan.length > 0) {
    textLines.push(`\n## Đại Vận`);
    for (const dv of result.daiVan) {
      textLines.push(`\n### ${dv.age} tuổi`);
      textLines.push(dv.interpretation);
    }
  }
  
  const textPath = path.join(__dirname, "..", "tests", "fixtures", "cohoc", "detailed-interpretations.txt");
  fs.writeFileSync(textPath, textLines.join("\n"), "utf-8");
  console.log(`✅ Saved text to: ${textPath}`);
  
  // 9. Summary
  console.log("\n=== Summary ===");
  console.log(`Sections extracted: ${Object.keys(result.palaces).length}`);
  console.log(`Phi Hóa entries: ${result.phiHoa.length}`);
  console.log(`Đại Vận periods: ${result.daiVan.length}`);
}

parseDetailed();
