/**
 * Test script để kiểm tra luận giải cung Tật Ách
 * Lá số: Nam 26/10/1998 sinh 00:30 dương lịch
 * Chạy: npx ts-node scripts/test-tat-ach-lookup.ts
 */

import { createChart } from "../src/lib/iztroEngine.js";
import { queryPalaceKnowledge, type QueryContext } from "../src/lib/tuvi/knowledge/palaceKnowledgeQuery.js";
import type { NormalizedBirthInput } from "../src/lib/tuvi/config/types.js";

console.log("=== TEST LUẬN GIẢI CUNG TẬT ÁCH ===\n");
console.log("Lá số: Nam 26/10/1998 sinh 00:30 dương lịch\n");

// Tạo lá số - giờ Tý (0) cho 00:30
const input: NormalizedBirthInput = {
  fullName: "Test User",
  year: 1998,
  month: 10,
  day: 26,
  birthHour: 0,
  birthMinute: 30,
  birthHourIndex: 0, // Giờ Tý
  gender: "male",
  calendarType: "solar",
};

const displayChart = createChart(input, "defaultVietnamese");

// Tìm cung Tật Ách
const tatAchPalace = displayChart.palaces.find(p => 
  p.name.toLowerCase().includes("tật") || p.name.toLowerCase().includes("tat")
);

if (!tatAchPalace) {
  console.log("❌ Không tìm thấy cung Tật Ách!");
  console.log("Các cung có:", displayChart.palaces.map(p => p.name).join(", "));
  throw new Error("Không tìm thấy cung Tật Ách");
}

const palace = tatAchPalace;

console.log("📌 THÔNG TIN CUNG TẬT ÁCH:");
console.log("─".repeat(60));
console.log(`Tên cung: ${palace.name}`);
console.log(`Vị trí: ${palace.earthlyBranch}`);
console.log(`Thiên can: ${palace.heavenlyStem}`);

// Liệt kê các sao trong cung
console.log("\n📌 CÁC SAO TRONG CUNG:");
console.log("─".repeat(60));

const allStars: string[] = [];
const addStars = (list: any[] | undefined, label: string) => {
  if (list && list.length > 0) {
    console.log(`${label}:`);
    list.forEach(s => {
      console.log(`  - ${s.name}${s.brightness ? ` (${s.brightness})` : ""}`);
      allStars.push(s.name);
    });
  }
};

addStars(palace.centerStars, "Chính tinh");
addStars(palace.majorStars, "Sao lớn");
addStars(palace.minorStars, "Sao nhỏ");
addStars(palace.leftStars, "Sao trái");
addStars(palace.rightStars, "Sao phải");

console.log(`\nTổng số sao: ${allStars.length}`);
console.log(`Danh sách: ${allStars.join(", ")}`);

// Query tri thức
console.log("\n\n📌 KẾT QUẢ LUẬN GIẢI:");
console.log("═".repeat(60));

const context: QueryContext = {
  palace: palace,
  gender: "male",
  allPalaces: displayChart.palaces,
};

const knowledgeResult = queryPalaceKnowledge(context);

console.log(`\nCung: ${knowledgeResult.palaceName}`);
console.log(`Vị trí: ${knowledgeResult.palacePosition}`);
console.log(`Thiên can: ${knowledgeResult.heavenlyStem}`);
console.log(`Tổng tri thức có sẵn: ${knowledgeResult.totalAvailable}`);

console.log("\n📖 TOP 3 TRI THỨC ƯU TIÊN:");
console.log("─".repeat(60));

if (knowledgeResult.topKnowledge.length === 0) {
  console.log("❌ Không tìm thấy tri thức phù hợp!");
} else {
  knowledgeResult.topKnowledge.forEach((item, idx) => {
    console.log(`\n[${idx + 1}] ${item.typeLabel}: ${item.title}`);
    console.log(`    Score: ${item.matchScore}`);
    console.log(`    Lý do: ${item.matchReasons.join(", ")}`);
    console.log(`    Nguồn: ${item.source.book} - ${item.source.author}`);
    console.log(`    Nội dung:`);
    console.log(`    ${item.text.slice(0, 300)}...`);
  });
}

console.log("\n\n📋 DANH SÁCH PHI HÓA:");
console.log("─".repeat(60));

if (knowledgeResult.phiHoaList.length === 0) {
  console.log("Không có phi hóa");
} else {
  knowledgeResult.phiHoaList.forEach((item, idx) => {
    console.log(`[${idx + 1}] ${item.typeLabel}: ${item.sourcePalace} → ${item.targetPalace}`);
  });
}

console.log("\n\n=== DONE ===");
