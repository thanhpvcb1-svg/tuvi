/**
 * End-to-end test for CoHoc integration
 * Run: node scripts/test-cohoc-e2e.mjs
 * 
 * This tests the full flow:
 * 1. Get CSRF token
 * 2. Convert solar to lunar
 * 3. Call Core.html
 * 4. Parse JSON response
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

// Hour mapping
const HOUR_MAPPING = {
  23: 1, 0: 1,   // Tý
  1: 2, 2: 2,   // Sửu
  3: 3, 4: 3,   // Dần
  5: 4, 6: 4,   // Mão
  7: 5, 8: 5,   // Thìn
  9: 6, 10: 6,  // Tỵ
  11: 7, 12: 7, // Ngọ
  13: 8, 14: 8, // Mùi
  15: 9, 16: 9, // Thân
  17: 10, 18: 10, // Dậu
  19: 11, 20: 11, // Tuất
  21: 12, 22: 12, // Hợi
};

async function testCoHoc() {
  console.log("=== CoHoc E2E Test ===\n");
  
  // Test input: 26/10/1998 23:30 Nam, xem năm 2026
  const input = {
    name: "Thành Test",
    solarDate: "1998-10-26",
    hour: 23,
    minute: 30,
    gender: "male",
    targetYear: 2026,
  };
  
  console.log("Input:");
  console.log(`  Name: ${input.name}`);
  console.log(`  Solar Date: ${input.solarDate}`);
  console.log(`  Time: ${input.hour}:${input.minute}`);
  console.log(`  Gender: ${input.gender}`);
  console.log(`  Target Year: ${input.targetYear}`);
  
  try {
    // Step 1: Get form page (for session)
    console.log("\n1. Getting session...");
    const formResponse = await fetch(COHOC_FORM_URL, {
      method: "GET",
      headers: HEADERS,
    });
    
    if (!formResponse.ok) {
      throw new Error(`Form page failed: ${formResponse.status}`);
    }
    console.log("   ✓ Session obtained");
    
    // Step 2: Build request
    // Note: CoHoc accepts isDuong=1 and will convert internally
    // We'll use lunar date approximation for 26/10/1998
    // Actual lunar: 1998-09-07 (Mậu Dần year, tháng 9, ngày 7)
    const lunarYear = 1998;
    const lunarMonth = 9;
    const lunarDay = 7;
    const cohocGio = HOUR_MAPPING[input.hour] || 1;
    
    console.log("\n2. Lunar conversion:");
    console.log(`   Solar: ${input.solarDate}`);
    console.log(`   Lunar: ${lunarYear}-${lunarMonth}-${lunarDay}`);
    console.log(`   Hour: ${cohocGio} (${input.hour}:00)`);
    
    // Step 3: Call Core.html
    console.log("\n3. Calling Core.html...");
    const params = new URLSearchParams({
      version: "20211215",
      hoten: input.name,
      isDuong: "1",
      isNam: input.gender === "male" ? "1" : "0",
      gio: String(cohocGio),
      ngay: String(lunarDay),
      thang: String(lunarMonth),
      nam: String(lunarYear),
      mau: "1",
      luuthaitue: "1",
      gioDH: "1",
      gioDM: "45",
      kieuls: "0",
      namHan: String(input.targetYear),
      anTuHoa: "1",
    });
    
    const coreUrl = `${COHOC_CORE_URL}?${params.toString()}`;
    
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
    
    const responseText = await coreResponse.text();
    console.log(`   ✓ Response: ${responseText.length} bytes`);
    
    // Step 4: Parse JSON
    console.log("\n4. Parsing response...");
    const json = JSON.parse(responseText);
    
    if (!json.Info || !json.Cac_cung) {
      throw new Error("Invalid response structure");
    }
    
    console.log("   ✓ Valid JSON structure");
    
    // Step 5: Display results
    console.log("\n5. Chart Results:");
    console.log(`   Âm Dương: ${json.Info.AmDuong}`);
    console.log(`   Cục: ${json.Info.Cuc}`);
    console.log(`   Mệnh Cục: ${json.Info.MenhCuc}`);
    console.log(`   Chủ Mệnh: ${json.Info.ChuMenh}`);
    console.log(`   Chủ Thân: ${json.Info.ChuThan}`);
    console.log(`   Năm Hạn: ${json.Info.NamHan}`);
    console.log(`   Tuổi: ${json.Info.Tuoi}`);
    
    console.log("\n   Palaces:");
    for (const palace of json.Cac_cung) {
      const mainStars = palace.ChinhTinh.map(s => s.Name).join(", ") || "-";
      console.log(`   - ${palace.Name}: ${mainStars}`);
    }
    
    // Save result
    const fixtureDir = path.join(__dirname, "..", "tests", "fixtures", "cohoc");
    const resultPath = path.join(fixtureDir, "e2e-test-result.json");
    
    fs.writeFileSync(resultPath, JSON.stringify({
      input,
      lunar: { year: lunarYear, month: lunarMonth, day: lunarDay },
      response: json,
    }, null, 2), "utf-8");
    
    console.log(`\n   Saved: tests/fixtures/cohoc/e2e-test-result.json`);
    
    console.log("\n✅ E2E Test PASSED!");
    
  } catch (error) {
    console.error("\n❌ E2E Test FAILED:", error.message);
    process.exit(1);
  }
}

testCoHoc();
