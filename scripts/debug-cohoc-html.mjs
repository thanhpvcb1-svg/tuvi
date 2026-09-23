/**
 * Debug: Xem cấu trúc HTML từ cohoc để tìm pattern luận giải
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function debug() {
  const formData = new URLSearchParams();
  formData.append("nam", "1988");
  formData.append("thang", "9");
  formData.append("ngay", "7");
  formData.append("gio", "ti");
  formData.append("gioitinh", "1");
  formData.append("lich", "1");
  formData.append("submit", "Lập lá số");
  
  console.log("Fetching chart...");
  
  const response = await fetch("https://tuvi.cohoc.net/lap-la-so-tu-vi.html", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: formData.toString(),
  });
  
  const html = await response.text();
  
  // Save full HTML
  fs.writeFileSync(path.join(__dirname, "../temp_cohoc_debug.html"), html);
  console.log("Saved full HTML to temp_cohoc_debug.html");
  console.log("HTML length:", html.length);
  
  // Look for interpretation patterns
  console.log("\n=== SEARCHING FOR PATTERNS ===\n");
  
  // Pattern 1: ####
  const hashMatches = html.match(/####[^\n]+/g);
  console.log("#### patterns found:", hashMatches?.length || 0);
  if (hashMatches?.length) {
    console.log("First 3:", hashMatches.slice(0, 3));
  }
  
  // Pattern 2: luan-giai class
  const luanGiaiMatches = html.match(/class="[^"]*luan-giai[^"]*"/g);
  console.log("\nluan-giai class found:", luanGiaiMatches?.length || 0);
  
  // Pattern 3: Cung Mệnh
  const cungMenhMatches = html.match(/Cung Mệnh[^<]{0,100}/g);
  console.log("\nCung Mệnh patterns:", cungMenhMatches?.length || 0);
  if (cungMenhMatches?.length) {
    console.log("First 3:", cungMenhMatches.slice(0, 3));
  }
  
  // Pattern 4: Look for interpretation divs
  const divPatterns = [
    /class="[^"]*interpret[^"]*"/gi,
    /class="[^"]*noi-dung[^"]*"/gi,
    /class="[^"]*content[^"]*"/gi,
    /class="[^"]*giai-doan[^"]*"/gi,
    /class="[^"]*luan[^"]*"/gi,
  ];
  
  for (const pattern of divPatterns) {
    const matches = html.match(pattern);
    if (matches?.length) {
      console.log(`\n${pattern}: ${matches.length} matches`);
      console.log("First:", matches[0]);
    }
  }
  
  // Pattern 5: Look for text blocks with palace names
  const palacePatterns = [
    /CUNG MỆNH[\s\S]{0,500}/i,
    /CUNG TÀI BẠCH[\s\S]{0,500}/i,
    /CUNG QUAN LỘC[\s\S]{0,500}/i,
  ];
  
  console.log("\n=== PALACE CONTENT SAMPLES ===\n");
  for (const pattern of palacePatterns) {
    const match = html.match(pattern);
    if (match) {
      console.log(match[0].substring(0, 200) + "...\n");
    }
  }
  
  // Pattern 6: Look for JSON data
  const jsonMatches = html.match(/\{[^{}]*"Cac_cung"[^{}]*\}/);
  console.log("\nJSON with Cac_cung:", jsonMatches ? "FOUND" : "NOT FOUND");
  
  // Pattern 7: Script tags with data
  const scriptMatches = html.match(/<script[^>]*>[\s\S]*?var\s+\w+\s*=\s*\{[\s\S]*?\}<\/script>/gi);
  console.log("\nScript tags with var = {}:", scriptMatches?.length || 0);
  
  // Pattern 8: Look for specific interpretation markers
  const markers = [
    "luận giải",
    "giải đoán", 
    "nhận xét",
    "phân tích",
    "đánh giá",
    "tổng quan",
  ];
  
  console.log("\n=== INTERPRETATION MARKERS ===\n");
  for (const marker of markers) {
    const regex = new RegExp(marker, "gi");
    const count = (html.match(regex) || []).length;
    console.log(`"${marker}": ${count} occurrences`);
  }
  
  // Extract a sample section
  console.log("\n=== SAMPLE SECTION (chars 50000-55000) ===\n");
  console.log(html.substring(50000, 55000));
}

debug().catch(console.error);
