/**
 * Fetch CoHoc Full Chart Page (with lid)
 * Run: node scripts/fetch-cohoc-full.mjs
 * 
 * This fetches the full chart page that includes interpretation text
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
};

// Sample URL to test
const SAMPLE_URL = "https://tuvi.cohoc.net/bac-phai-la-so-tu-vi-nam-at-suu-thang-12-ngay-21-gio-suu-am-nam-lid-1.html";

async function fetchFullPage(url) {
  console.log("=== Fetch CoHoc Full Chart Page ===\n");
  console.log(`URL: ${url}\n`);
  
  const fixtureDir = path.join(__dirname, "..", "tests", "fixtures", "cohoc");
  
  if (!fs.existsSync(fixtureDir)) {
    fs.mkdirSync(fixtureDir, { recursive: true });
  }
  
  try {
    // Fetch the page
    console.log("1. Fetching page...");
    const response = await fetch(url, {
      method: "GET",
      headers: HEADERS,
    });
    
    if (!response.ok) {
      throw new Error(`Failed: ${response.status}`);
    }
    
    const html = await response.text();
    console.log(`   Response: ${html.length} bytes`);
    
    // Save HTML
    const filename = "full-chart-page.html";
    fs.writeFileSync(path.join(fixtureDir, filename), html, "utf-8");
    console.log(`   Saved: tests/fixtures/cohoc/${filename}`);
    
    // Quick analysis
    console.log("\n2. Analyzing HTML structure...");
    
    // Check for key sections
    const sections = [
      { name: "Tổng quan", pattern: /tổng quan|tong quan/i },
      { name: "Luận giải", pattern: /luận giải|luan giai/i },
      { name: "Mệnh", pattern: /<[^>]*>Mệnh<\/[^>]*>/i },
      { name: "Cung", pattern: /class="[^"]*cung[^"]*"/i },
      { name: "Sao", pattern: /class="[^"]*sao[^"]*"/i },
      { name: "JSON data", pattern: /var\s+\w+\s*=\s*\{/i },
      { name: "Script data", pattern: /<script[^>]*>.*?(Info|Cac_cung)/is },
    ];
    
    for (const section of sections) {
      const found = section.pattern.test(html);
      console.log(`   ${found ? "✓" : "✗"} ${section.name}`);
    }
    
    // Extract any JSON data embedded in page
    console.log("\n3. Looking for embedded JSON data...");
    
    // Pattern 1: var dataChart = {...}
    const jsonPatterns = [
      /var\s+dataChart\s*=\s*(\{[\s\S]*?\});/,
      /var\s+data\s*=\s*(\{[\s\S]*?\});/,
      /var\s+chartData\s*=\s*(\{[\s\S]*?\});/,
      /"Info"\s*:\s*\{[^}]+\}/,
      /"Cac_cung"\s*:\s*\[/,
    ];
    
    for (const pattern of jsonPatterns) {
      const match = html.match(pattern);
      if (match) {
        console.log(`   Found JSON pattern: ${pattern.toString().substring(0, 50)}...`);
        
        // Try to extract and parse
        if (match[1]) {
          try {
            const jsonStr = match[1];
            // Save raw JSON string
            fs.writeFileSync(
              path.join(fixtureDir, "embedded-json.txt"),
              jsonStr,
              "utf-8"
            );
            console.log("   Saved embedded JSON to embedded-json.txt");
          } catch (e) {
            console.log(`   Could not parse: ${e.message}`);
          }
        }
      }
    }
    
    // Extract text content sections
    console.log("\n4. Extracting text sections...");
    
    // Look for interpretation divs
    const divPatterns = [
      { name: "luan-giai", pattern: /<div[^>]*class="[^"]*luan-giai[^"]*"[^>]*>([\s\S]*?)<\/div>/gi },
      { name: "noi-dung", pattern: /<div[^>]*class="[^"]*noi-dung[^"]*"[^>]*>([\s\S]*?)<\/div>/gi },
      { name: "content", pattern: /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi },
      { name: "giai-doan", pattern: /<div[^>]*class="[^"]*giai-doan[^"]*"[^>]*>([\s\S]*?)<\/div>/gi },
    ];
    
    for (const { name, pattern } of divPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        console.log(`   Found ${matches.length} "${name}" sections`);
      }
    }
    
    // Look for specific interpretation text
    console.log("\n5. Looking for interpretation keywords...");
    const keywords = [
      "tính cách", "sự nghiệp", "tài lộc", "tình duyên", 
      "sức khỏe", "gia đạo", "vận hạn", "đại vận"
    ];
    
    for (const kw of keywords) {
      const count = (html.match(new RegExp(kw, "gi")) || []).length;
      if (count > 0) {
        console.log(`   "${kw}": ${count} occurrences`);
      }
    }
    
    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      console.log(`\n6. Page title: ${titleMatch[1]}`);
    }
    
    // Show first part of body
    console.log("\n7. First 1000 chars of body:");
    const bodyMatch = html.match(/<body[^>]*>([\s\S]{0,1000})/i);
    if (bodyMatch) {
      const cleanText = bodyMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      console.log(`   ${cleanText.substring(0, 500)}...`);
    }
    
    console.log("\n=== Done ===");
    console.log(`\nOpen tests/fixtures/cohoc/${filename} in browser to inspect full HTML`);
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run with sample URL or custom URL from args
const url = process.argv[2] || SAMPLE_URL;
fetchFullPage(url);
