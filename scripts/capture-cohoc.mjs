/**
 * CoHoc HTML Capture Script
 * 
 * Run: node scripts/capture-cohoc.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COHOC_BASE_URL = "https://tuvi.cohoc.net";
const COHOC_FORM_URL = `${COHOC_BASE_URL}/lap-la-so-tu-vi.html`;
const COHOC_CORE_URL = `${COHOC_BASE_URL}/Core.html`;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
};

// CSRF patterns
const CSRF_PATTERNS = [
  /TokenCSRF['"]\s*:\s*['"]([^'"]+)['"]/i,
  /name=['"]TokenCSRF['"][^>]*value=['"]([^'"]+)['"]/i,
  /value=['"]([^'"]+)['"][^>]*name=['"]TokenCSRF['"]/i,
  /"TokenCSRF"\s*:\s*"([^"]+)"/i,
  /TokenCSRF=([a-zA-Z0-9_-]+)/i,
];

function extractCsrfToken(html) {
  for (const pattern of CSRF_PATTERNS) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

async function capture() {
  console.log("=== CoHoc HTML Capture ===\n");
  
  // Sample input (26/10/1998 23:30 Nam)
  // Lunar date approximation for 26/10/1998 solar
  const sampleInput = {
    name: "Test Capture",
    lunarYear: 1998,
    lunarMonth: 9,
    lunarDay: 7,
    hour: 1, // Tý (gio=1)
    gender: 1, // Nam
    targetYear: 2026,
  };
  
  const fixtureDir = path.join(__dirname, "..", "tests", "fixtures", "cohoc");
  
  try {
    // Ensure fixture directory exists
    if (!fs.existsSync(fixtureDir)) {
      fs.mkdirSync(fixtureDir, { recursive: true });
    }
    
    // Step 1: Get form page for CSRF
    console.log("1. Fetching form page...");
    const formResponse = await fetch(COHOC_FORM_URL, {
      method: "GET",
      headers: HEADERS,
    });
    
    if (!formResponse.ok) {
      throw new Error(`Form page failed: ${formResponse.status}`);
    }
    
    const formHtml = await formResponse.text();
    console.log(`   Form page: ${formHtml.length} bytes`);
    
    // Save form HTML
    fs.writeFileSync(
      path.join(fixtureDir, "form-page.html"),
      formHtml,
      "utf-8"
    );
    console.log("   Saved: tests/fixtures/cohoc/form-page.html");
    
    // Step 2: Extract CSRF token
    console.log("\n2. Extracting CSRF token...");
    const csrfToken = extractCsrfToken(formHtml);
    
    if (!csrfToken) {
      console.log("   WARNING: CSRF token not found!");
      console.log("   Searching for potential token patterns...");
      
      // Try to find any token-like strings
      const tokenMatches = formHtml.match(/[a-zA-Z0-9_-]{20,}/g);
      if (tokenMatches) {
        console.log(`   Found ${tokenMatches.length} potential tokens`);
      }
    } else {
      console.log(`   Token found: ${csrfToken.substring(0, 30)}...`);
    }
    
    // Step 3: Build Core.html URL
    console.log("\n3. Building Core.html request...");
    const params = new URLSearchParams({
      version: "20211215",
      hoten: sampleInput.name,
      isDuong: "1",
      isNam: String(sampleInput.gender),
      gio: String(sampleInput.hour),
      ngay: String(sampleInput.lunarDay),
      thang: String(sampleInput.lunarMonth),
      nam: String(sampleInput.lunarYear),
      mau: "1",
      luuthaitue: "1",
      gioDH: "1",
      gioDM: "45",
      kieuls: "0",
      namHan: String(sampleInput.targetYear),
      anTuHoa: "1",
    });
    
    if (csrfToken) {
      params.set("TokenCSRF", csrfToken);
    }
    
    const coreUrl = `${COHOC_CORE_URL}?${params.toString()}`;
    console.log(`   URL length: ${coreUrl.length} chars`);
    
    // Step 4: Fetch Core.html
    console.log("\n4. Fetching Core.html...");
    
    // Get cookies from form response
    const cookies = formResponse.headers.get("set-cookie") || "";
    
    const coreResponse = await fetch(coreUrl, {
      method: "GET",
      headers: {
        ...HEADERS,
        "Referer": COHOC_FORM_URL,
        ...(cookies ? { "Cookie": cookies.split(";")[0] } : {}),
      },
    });
    
    console.log(`   Status: ${coreResponse.status}`);
    
    if (!coreResponse.ok) {
      console.log(`   Response headers:`, Object.fromEntries(coreResponse.headers));
      throw new Error(`Core.html failed: ${coreResponse.status}`);
    }
    
    const coreHtml = await coreResponse.text();
    console.log(`   Response: ${coreHtml.length} bytes`);
    
    // Save Core HTML
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    const filename = `core-response-${timestamp}.html`;
    
    fs.writeFileSync(
      path.join(fixtureDir, filename),
      coreHtml,
      "utf-8"
    );
    console.log(`   Saved: tests/fixtures/cohoc/${filename}`);
    
    // Also save as latest
    fs.writeFileSync(
      path.join(fixtureDir, "core-response-latest.html"),
      coreHtml,
      "utf-8"
    );
    console.log("   Saved: tests/fixtures/cohoc/core-response-latest.html");
    
    // Step 5: Quick analysis
    console.log("\n5. Quick HTML analysis...");
    console.log(`   Length: ${coreHtml.length} bytes`);
    console.log(`   Contains "Mệnh": ${coreHtml.includes("Mệnh")}`);
    console.log(`   Contains "Tử Vi": ${coreHtml.includes("Tử Vi")}`);
    console.log(`   Contains "<table": ${coreHtml.includes("<table")}`);
    console.log(`   Contains "cung": ${coreHtml.toLowerCase().includes("cung")}`);
    console.log(`   Contains "sao": ${coreHtml.toLowerCase().includes("sao")}`);
    
    // Check for common palace names
    const palaces = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Tài Bạch", "Quan Lộc", "Phu Thê"];
    const foundPalaces = palaces.filter(p => coreHtml.includes(p));
    console.log(`   Found palaces: ${foundPalaces.length}/6 (${foundPalaces.join(", ")})`);
    
    // Check for error
    if (coreHtml.includes("Lỗi") || coreHtml.length < 500) {
      console.log("\n   ⚠️  WARNING: Response may contain error or be too short!");
    }
    
    // Show first 500 chars
    console.log("\n6. First 500 characters of response:");
    console.log("   " + coreHtml.substring(0, 500).replace(/\n/g, "\n   "));
    
    console.log("\n=== Capture Complete ===");
    console.log("\nNext steps:");
    console.log("1. Open tests/fixtures/cohoc/core-response-latest.html in browser");
    console.log("2. Inspect DOM structure");
    console.log("3. Update src/lib/cohoc/parser.ts with correct selectors");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    
    // Save error info
    fs.writeFileSync(
      path.join(fixtureDir, "capture-error.txt"),
      `Error: ${error.message}\nTime: ${new Date().toISOString()}\n`,
      "utf-8"
    );
    
    process.exit(1);
  }
}

// Run
capture();
