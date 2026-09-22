/**
 * CoHoc HTML Capture Script
 * 
 * Run: npx ts-node scripts/capture-cohoc.ts
 * 
 * This script fetches a sample chart from cohoc.net and saves
 * the HTML response for parser development and testing.
 */

import * as fs from "fs";
import * as path from "path";

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
];

async function extractCsrfToken(html: string): Promise<string | null> {
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
  const sampleInput = {
    name: "Test Capture",
    // Lunar date for 26/10/1998 solar
    lunarYear: 1998,
    lunarMonth: 9,
    lunarDay: 7,
    hour: 1, // Tý
    gender: 1, // Nam
    targetYear: 2026,
  };
  
  try {
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
    const fixtureDir = path.join(__dirname, "..", "tests", "fixtures", "cohoc");
    if (!fs.existsSync(fixtureDir)) {
      fs.mkdirSync(fixtureDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(fixtureDir, "form-page.html"),
      formHtml,
      "utf-8"
    );
    console.log("   Saved: tests/fixtures/cohoc/form-page.html");
    
    // Step 2: Extract CSRF token
    console.log("\n2. Extracting CSRF token...");
    const csrfToken = await extractCsrfToken(formHtml);
    
    if (!csrfToken) {
      console.log("   WARNING: CSRF token not found!");
      console.log("   Trying without token...");
    } else {
      console.log(`   Token: ${csrfToken.substring(0, 20)}...`);
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
      ...(csrfToken ? { TokenCSRF: csrfToken } : {}),
    });
    
    const coreUrl = `${COHOC_CORE_URL}?${params.toString()}`;
    console.log(`   URL: ${coreUrl.substring(0, 100)}...`);
    
    // Step 4: Fetch Core.html
    console.log("\n4. Fetching Core.html...");
    const coreResponse = await fetch(coreUrl, {
      method: "GET",
      headers: {
        ...HEADERS,
        "Referer": COHOC_FORM_URL,
      },
    });
    
    if (!coreResponse.ok) {
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
    console.log(`   Contains "Mệnh": ${coreHtml.includes("Mệnh")}`);
    console.log(`   Contains "Tử Vi": ${coreHtml.includes("Tử Vi")}`);
    console.log(`   Contains "table": ${coreHtml.includes("<table")}`);
    console.log(`   Contains "cung": ${coreHtml.toLowerCase().includes("cung")}`);
    
    // Check for error
    if (coreHtml.includes("Lỗi") || coreHtml.includes("Error")) {
      console.log("\n   WARNING: Response may contain error!");
    }
    
    console.log("\n=== Capture Complete ===");
    console.log("\nNext steps:");
    console.log("1. Open tests/fixtures/cohoc/core-response-latest.html in browser");
    console.log("2. Inspect DOM structure");
    console.log("3. Update src/lib/cohoc/parser.ts with correct selectors");
    
  } catch (error) {
    console.error("\nError:", error);
    process.exit(1);
  }
}

// Run
capture();
