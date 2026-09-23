/**
 * Parse CoHoc Full Chart Page - Extract Interpretations
 * Run: node scripts/parse-cohoc-full.mjs
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
    .replace(/\s+/g, " ")
    .trim();
}

function extractSection(html, startPattern, endPattern) {
  const startMatch = html.match(startPattern);
  if (!startMatch) return null;
  
  const startIndex = startMatch.index + startMatch[0].length;
  const remaining = html.substring(startIndex);
  
  const endMatch = remaining.match(endPattern);
  if (!endMatch) return remaining.substring(0, 5000); // Take first 5000 chars if no end
  
  return remaining.substring(0, endMatch.index);
}

async function parseFullPage() {
  console.log("=== Parse CoHoc Full Chart Page ===\n");
  
  const htmlPath = path.join(__dirname, "..", "tests", "fixtures", "cohoc", "full-chart-page.html");
  
  if (!fs.existsSync(htmlPath)) {
    console.error("❌ File not found. Run fetch-cohoc-full.mjs first");
    process.exit(1);
  }
  
  const html = fs.readFileSync(htmlPath, "utf-8");
  console.log(`Loaded: ${html.length} bytes\n`);
  
  const result = {
    title: "",
    overview: {},
    palaceInterpretations: {},
    daiVan: [],
    summary: "",
  };
  
  // 1. Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
    console.log(`📌 Title: ${result.title}\n`);
  }
  
  // 2. Look for main content sections
  console.log("📖 Extracting sections...\n");
  
  // Pattern for section headers (h2, h3, etc.)
  const sectionPatterns = [
    // Tổng quan section
    { 
      name: "tongQuan", 
      label: "Tổng quan",
      pattern: /<h[23][^>]*>.*?Tổng quan.*?<\/h[23]>/i,
      endPattern: /<h[23][^>]*>/i
    },
    // Mệnh section
    { 
      name: "menh", 
      label: "Cung Mệnh",
      pattern: /<h[23][^>]*>.*?(?:Cung\s+)?Mệnh.*?<\/h[23]>/i,
      endPattern: /<h[23][^>]*>/i
    },
    // Tài Bạch
    { 
      name: "taiBach", 
      label: "Cung Tài Bạch",
      pattern: /<h[23][^>]*>.*?Tài\s*Bạch.*?<\/h[23]>/i,
      endPattern: /<h[23][^>]*>/i
    },
    // Quan Lộc
    { 
      name: "quanLoc", 
      label: "Cung Quan Lộc",
      pattern: /<h[23][^>]*>.*?Quan\s*Lộc.*?<\/h[23]>/i,
      endPattern: /<h[23][^>]*>/i
    },
    // Phu Thê
    { 
      name: "phuThe", 
      label: "Cung Phu Thê",
      pattern: /<h[23][^>]*>.*?Phu\s*Thê.*?<\/h[23]>/i,
      endPattern: /<h[23][^>]*>/i
    },
    // Đại Vận
    { 
      name: "daiVan", 
      label: "Đại Vận",
      pattern: /<h[23][^>]*>.*?Đại\s*Vận.*?<\/h[23]>/i,
      endPattern: /<h[23][^>]*>/i
    },
  ];
  
  for (const { name, label, pattern, endPattern } of sectionPatterns) {
    const content = extractSection(html, pattern, endPattern);
    if (content) {
      const text = stripHtml(content).substring(0, 2000);
      result.palaceInterpretations[name] = text;
      console.log(`✓ ${label}: ${text.length} chars`);
      console.log(`  Preview: ${text.substring(0, 150)}...\n`);
    }
  }
  
  // 3. Extract all h2/h3 headers to understand structure
  console.log("\n📋 All section headers found:");
  const headers = html.match(/<h[23][^>]*>([^<]+)<\/h[23]>/gi) || [];
  const uniqueHeaders = [...new Set(headers.map(h => stripHtml(h)))];
  
  for (const header of uniqueHeaders.slice(0, 30)) {
    console.log(`   - ${header}`);
  }
  
  // 4. Look for specific div classes
  console.log("\n📦 Looking for content divs...");
  
  const divClasses = html.match(/class="([^"]+)"/g) || [];
  const uniqueClasses = [...new Set(divClasses)]
    .filter(c => c.includes("luan") || c.includes("giai") || c.includes("noi") || c.includes("content") || c.includes("cung"))
    .slice(0, 20);
  
  for (const cls of uniqueClasses) {
    console.log(`   ${cls}`);
  }
  
  // 5. Extract accordion/tab content if exists
  console.log("\n🔍 Looking for accordion/expandable content...");
  
  const accordionPatterns = [
    /class="[^"]*accordion[^"]*"/gi,
    /class="[^"]*collapse[^"]*"/gi,
    /class="[^"]*tab-content[^"]*"/gi,
    /class="[^"]*panel[^"]*"/gi,
  ];
  
  for (const pattern of accordionPatterns) {
    const matches = html.match(pattern) || [];
    if (matches.length > 0) {
      console.log(`   Found ${matches.length} matches for ${pattern.toString().substring(0, 30)}`);
    }
  }
  
  // 6. Save extracted data
  const outputPath = path.join(__dirname, "..", "tests", "fixtures", "cohoc", "parsed-interpretations.json");
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");
  console.log(`\n✅ Saved to: tests/fixtures/cohoc/parsed-interpretations.json`);
  
  // 7. Also save a text version
  const textOutput = [];
  textOutput.push(`# ${result.title}\n`);
  
  for (const [key, text] of Object.entries(result.palaceInterpretations)) {
    textOutput.push(`\n## ${key}\n`);
    textOutput.push(text);
  }
  
  const textPath = path.join(__dirname, "..", "tests", "fixtures", "cohoc", "interpretations.txt");
  fs.writeFileSync(textPath, textOutput.join("\n"), "utf-8");
  console.log(`✅ Saved text to: tests/fixtures/cohoc/interpretations.txt`);
}

parseFullPage();
