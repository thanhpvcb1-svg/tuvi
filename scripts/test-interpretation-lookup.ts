/**
 * Test script để kiểm tra lookup luận giải
 * Chạy: npx ts-node scripts/test-interpretation-lookup.ts
 */

import {
  getInterpretationForPalace,
  getInterpretationByStarId,
  formatInterpretationContent,
  getAvailableStarsForPalace,
} from "../src/lib/tuvi/interpretations/palaceInterpretation";

console.log("=== TEST INTERPRETATION LOOKUP ===\n");

// Test case: Cung Phu Thê có Thiên Mã tại Thân
console.log("📌 Test case: Cung Phu Thê có Thiên Mã");
console.log("─".repeat(50));

const phuTheResults = getInterpretationForPalace("Phu Thê", ["Thiên Mã"]);
console.log(`Tìm thấy: ${phuTheResults.length} kết quả\n`);

phuTheResults.forEach((item, idx) => {
  console.log(`[${idx + 1}] Star: ${item.star_name} (${item.star_id})`);
  console.log(`    Title: ${item.title}`);
  console.log(`    Content: ${formatInterpretationContent(item).slice(0, 200)}...`);
  console.log(`    Source: ${item.source || "N/A"}`);
  console.log();
});

// Test với star_id trực tiếp
console.log("\n📌 Test lookup bằng star_id 'thien_ma'");
console.log("─".repeat(50));

const byStarId = getInterpretationByStarId("phu_the", "thien_ma");
console.log(`Tìm thấy: ${byStarId.length} kết quả\n`);

byStarId.forEach((item, idx) => {
  console.log(`[${idx + 1}] ${item.star_name}`);
  console.log(`    Branches: ${item.branches?.join(", ") || "all"}`);
  console.log(`    Text: ${item.text?.slice(0, 150) || formatInterpretationContent(item).slice(0, 150)}...`);
  console.log();
});

// Liệt kê các sao có luận giải trong Phu Thê
console.log("\n📌 Các sao có luận giải trong cung Phu Thê:");
console.log("─".repeat(50));
const availableStars = getAvailableStarsForPalace("Phu Thê");
availableStars.forEach((star) => {
  console.log(`  - ${star.name} (${star.id})`);
});

// Test thêm cung Mệnh
console.log("\n\n📌 Test case: Cung Mệnh có Tử Vi");
console.log("─".repeat(50));

const menhResults = getInterpretationForPalace("Mệnh", ["Tử Vi"]);
console.log(`Tìm thấy: ${menhResults.length} kết quả\n`);

menhResults.slice(0, 2).forEach((item, idx) => {
  console.log(`[${idx + 1}] ${item.star_name}: ${item.title}`);
  console.log(`    ${formatInterpretationContent(item).slice(0, 150)}...`);
  console.log();
});

console.log("\n=== DONE ===");
