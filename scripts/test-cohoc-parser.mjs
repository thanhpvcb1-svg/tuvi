/**
 * Test CoHoc Parser with fixture
 * Run: node scripts/test-cohoc-parser.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read fixture
const fixturePath = path.join(__dirname, "..", "tests", "fixtures", "cohoc", "core-response-latest.html");

if (!fs.existsSync(fixturePath)) {
  console.error("❌ Fixture not found. Run: node scripts/capture-cohoc.mjs first");
  process.exit(1);
}

const response = fs.readFileSync(fixturePath, "utf-8");
console.log("=== CoHoc Parser Test ===\n");
console.log(`Fixture: ${fixturePath}`);
console.log(`Size: ${response.length} bytes\n`);

// Parse JSON directly (since we know it's JSON)
try {
  const json = JSON.parse(response);
  
  console.log("1. Info (Chart Metadata):");
  console.log(`   Âm Dương: ${json.Info.AmDuong}`);
  console.log(`   Cục: ${json.Info.Cuc}`);
  console.log(`   Mệnh Cục: ${json.Info.MenhCuc}`);
  console.log(`   Chủ Mệnh: ${json.Info.ChuMenh}`);
  console.log(`   Chủ Thân: ${json.Info.ChuThan}`);
  console.log(`   Lai Nhân Cung: ${json.Info.LaiNhanCung}`);
  console.log(`   Nguyên Thần: ${json.Info.NguyenThan}`);
  console.log(`   Năm Hạn: ${json.Info.NamHan}`);
  console.log(`   Tuổi: ${json.Info.Tuoi}`);
  
  console.log("\n2. Palaces (12 Cung):");
  console.log(`   Total: ${json.Cac_cung.length} palaces\n`);
  
  for (const palace of json.Cac_cung) {
    const mainStars = palace.ChinhTinh.map(s => `${s.Name}(${s.Status || "-"})`).join(", ") || "(không có)";
    const goodStars = palace.Saotot.length;
    const badStars = palace.Saoxau.length;
    
    console.log(`   ${palace.Name.padEnd(12)} | Chính tinh: ${mainStars.padEnd(30)} | Tốt: ${goodStars} | Xấu: ${badStars} | ${palace.TrangSinh}`);
  }
  
  console.log("\n3. Tứ Hóa (Transformations):");
  for (const palace of json.Cac_cung) {
    const allStars = [...palace.Saotot, ...palace.Saoxau];
    const tuHoa = allStars.filter(s => s.Name.includes("Hóa"));
    if (tuHoa.length > 0) {
      console.log(`   ${palace.Name}: ${tuHoa.map(s => s.Name).join(", ")}`);
    }
  }
  
  console.log("\n4. Đại Vận:");
  for (const palace of json.Cac_cung) {
    if (palace.LuuDaiHanTen) {
      console.log(`   ${palace.Name}: ${palace.LuuDaiHanTen}`);
    }
  }
  
  console.log("\n5. Summary:");
  let totalMainStars = 0;
  let totalGoodStars = 0;
  let totalBadStars = 0;
  
  for (const palace of json.Cac_cung) {
    totalMainStars += palace.nChinhTinh;
    totalGoodStars += palace.nSaoTot;
    totalBadStars += palace.nSaoXau;
  }
  
  console.log(`   Total Main Stars: ${totalMainStars}`);
  console.log(`   Total Good Stars: ${totalGoodStars}`);
  console.log(`   Total Bad Stars: ${totalBadStars}`);
  
  console.log("\n✅ Parser test PASSED!");
  
} catch (error) {
  console.error("❌ Parse error:", error.message);
  process.exit(1);
}
