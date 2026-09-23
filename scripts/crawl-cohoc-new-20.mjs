/**
 * Crawl 20 lá số mới từ tuvi.cohoc.net bằng cách submit form
 * 
 * Usage: node scripts/crawl-cohoc-new-20.mjs
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "../tuvi_crawler/output");

// Config
const COUNT = 20;
const DELAY_MS = 3000;

// Vietnamese data
const CHI_SLUG = ["ti", "suu", "dan", "mao", "thin", "ty", "ngo", "mui", "than", "dau", "tuat", "hoi"];
const CHI_NAME = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

// Generate random birth info
function generateRandomBirth() {
  const year = 1950 + Math.floor(Math.random() * 74); // 1950-2024
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  const hourIndex = Math.floor(Math.random() * 12);
  const gender = Math.random() > 0.5 ? "1" : "0"; // 1=nam, 0=nu
  const calendar = Math.random() > 0.5 ? "1" : "0"; // 1=duong, 0=am
  
  return {
    year,
    month,
    day,
    hour: CHI_SLUG[hourIndex],
    hourName: CHI_NAME[hourIndex],
    gender,
    genderName: gender === "1" ? "Nam" : "Nữ",
    calendar,
    calendarName: calendar === "1" ? "Dương" : "Âm",
  };
}

// Submit form to create chart
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
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
      "Origin": "https://tuvi.cohoc.net",
      "Referer": "https://tuvi.cohoc.net/lap-la-so-tu-vi.html",
    },
    body: formData.toString(),
    redirect: "follow",
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const html = await response.text();
  const finalUrl = response.url;
  
  // Extract lid from URL first
  let lid = null;
  const lidUrlMatch = finalUrl.match(/-lid-(\d+)\.html/);
  if (lidUrlMatch) {
    lid = lidUrlMatch[1];
  }
  
  // If not in URL, try to find in HTML (link to save/share)
  if (!lid) {
    const lidHtmlMatch = html.match(/-lid-(\d+)\.html/);
    if (lidHtmlMatch) {
      lid = lidHtmlMatch[1];
    }
  }
  
  // Generate unique ID from birth info if no lid found
  if (!lid) {
    lid = `gen_${birth.year}${birth.month.toString().padStart(2,'0')}${birth.day.toString().padStart(2,'0')}_${birth.hour}_${birth.gender}${birth.calendar}`;
  }
  
  return { html, url: finalUrl, lid };
}

// Parse chart info from HTML
function parseChartInfo(html) {
  const info = {};
  
  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  info.title = titleMatch ? titleMatch[1].trim() : "";
  
  // Check for chart content
  info.hasCung = html.includes("CUNG MỆNH") || html.includes("Cung Mệnh") || html.includes("cung-menh");
  info.hasStars = html.includes("Tử Vi") || html.includes("Thiên Cơ") || html.includes("tu-vi");
  info.hasInterpretation = html.includes("####") || html.includes("luận giải") || html.includes("luan-giai");
  
  // Count interpretation sections
  const sectionMatches = html.match(/####\s*[^\n]+/g);
  info.interpretationCount = sectionMatches ? sectionMatches.length : 0;
  
  // Check for 12 cung
  const cungNames = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", 
                     "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"];
  info.cungCount = cungNames.filter(c => html.includes(c)).length;
  
  return info;
}

// Save chart data
function saveChart(lid, data, birth) {
  const dir = path.join(OUTPUT_DIR, lid);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Save HTML
  fs.writeFileSync(path.join(dir, "page.html"), data.html);
  
  // Save metadata
  const metadata = {
    lid,
    url: data.url,
    crawledAt: new Date().toISOString(),
    birth: {
      year: birth.year,
      month: birth.month,
      day: birth.day,
      hour: birth.hourName,
      gender: birth.genderName,
      calendar: birth.calendarName,
    },
    info: data.info,
  };
  fs.writeFileSync(path.join(dir, "metadata.json"), JSON.stringify(metadata, null, 2));
  
  return dir;
}

// Update crawl progress
function updateProgress(lid) {
  const progressFile = path.join(__dirname, "../tuvi_crawler/crawl_progress.json");
  let data = { crawled: [], lastIndex: 0 };
  
  if (fs.existsSync(progressFile)) {
    data = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
  }
  
  if (!data.crawled.includes(lid)) {
    data.crawled.push(lid);
    data.lastIndex = data.crawled.length;
  }
  
  fs.writeFileSync(progressFile, JSON.stringify(data, null, 2));
  return data.crawled.length;
}

// Sleep
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Main
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("CRAWL 20 NEW CHARTS FROM TUVICOHOC (FORM SUBMIT)");
  console.log("Time:", new Date().toISOString());
  console.log("=".repeat(60) + "\n");
  
  let success = 0;
  let failed = 0;
  const results = [];
  
  for (let i = 0; i < COUNT; i++) {
    const birth = generateRandomBirth();
    console.log(`\n[${i + 1}/${COUNT}] Creating chart: ${birth.day}/${birth.month}/${birth.year} - Giờ ${birth.hourName} - ${birth.genderName} - ${birth.calendarName}`);
    
    try {
      const data = await submitChartForm(birth);
      
      if (!data.lid) {
        throw new Error("Could not generate chart ID");
      }
      
      // Verify chart has content
      const info = parseChartInfo(data.html);
      if (!info.hasCung) {
        throw new Error("Chart page does not contain valid chart data");
      }
      data.info = info;
      
      const dir = saveChart(data.lid, data, birth);
      const totalCrawled = updateProgress(data.lid);
      
      console.log(`  ✓ LID: ${data.lid}`);
      console.log(`  ✓ Title: ${info.title.substring(0, 60)}...`);
      console.log(`  ✓ Has chart: ${info.hasCung}, Cung count: ${info.cungCount}/12`);
      console.log(`  ✓ Interpretations: ${info.interpretationCount}`);
      console.log(`  ✓ Saved to: ${dir}`);
      console.log(`  ✓ Total crawled: ${totalCrawled}`);
      
      success++;
      results.push({ lid: data.lid, status: "success", birth, info });
      
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      failed++;
      results.push({ status: "failed", birth, error: error.message });
    }
    
    // Delay
    if (i < COUNT - 1) {
      console.log(`  [DELAY] Waiting ${DELAY_MS}ms...`);
      await sleep(DELAY_MS);
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("CRAWL SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total: ${COUNT}`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log("=".repeat(60) + "\n");
  
  // Save summary
  const summaryFile = path.join(OUTPUT_DIR, `crawl-new-summary-${Date.now()}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: COUNT,
    success,
    failed,
    results,
  }, null, 2));
  console.log(`Summary saved to: ${summaryFile}\n`);
}

main().catch(console.error);
