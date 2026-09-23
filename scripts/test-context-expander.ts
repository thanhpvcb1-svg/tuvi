/**
 * Test Context Expander và Unified Knowledge Service
 * 
 * Chạy: npx ts-node scripts/test-context-expander.ts
 */

import { astro } from "iztro";
import { createDisplayChart } from "../src/lib/tuvi/createDisplayChart";
import { tuvichancoCompatibleConfig } from "../src/lib/tuvi/config/tuvichancoCompatible.config";
import {
  expandPalaceContext,
  expandAllPalaceContexts,
  getTamHopBranches,
  getOppositeBranch,
  getGiapCungBranches,
  getAllTamHopBranches,
} from "../src/lib/tuvi/context/contextExpander";
import {
  queryPalaceKnowledgeUnified,
  unifiedKnowledgeService,
} from "../src/lib/tuvi/knowledge/unifiedKnowledgeService";
import type { NormalizedBirthInput } from "../src/lib/tuvi/config/types";

// ============ TEST DATA ============

const TEST_CASES = [
  {
    name: "Test Case 1988",
    input: {
      fullName: "Test User",
      year: 1988,
      month: 8,
      day: 26,
      birthHour: 9,
      birthMinute: 0,
      birthHourIndex: 5, // Tỵ
      gender: "male" as const,
      calendarType: "solar" as const,
    },
  },
  {
    name: "Test Case 2000",
    input: {
      fullName: "Test User 2",
      year: 2000,
      month: 3,
      day: 15,
      birthHour: 14,
      birthMinute: 30,
      birthHourIndex: 7, // Mùi
      gender: "female" as const,
      calendarType: "solar" as const,
    },
  },
];

// ============ HELPER FUNCTIONS ============

function createChart(input: NormalizedBirthInput) {
  const date = `${input.year}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")}`;
  const apiGender = input.gender === "male" ? "男" : "女";
  
  const raw = (astro as any).astrolabeBySolarDate(
    date,
    input.birthHourIndex,
    apiGender,
    true,
    "vi-VN"
  );
  
  return createDisplayChart(raw, input, tuvichancoCompatibleConfig);
}

function printSeparator(title: string) {
  console.log("\n" + "=".repeat(60));
  console.log(title);
  console.log("=".repeat(60));
}

function printSubSection(title: string) {
  console.log("\n" + "-".repeat(40));
  console.log(title);
  console.log("-".repeat(40));
}

// ============ TEST FUNCTIONS ============

function testTamHopLogic() {
  printSeparator("TEST: Tam Hợp Logic");
  
  const testBranches = ["Tý", "Dần", "Tỵ", "Hợi"];
  
  for (const branch of testBranches) {
    const tamHop = getAllTamHopBranches(branch);
    const others = getTamHopBranches(branch);
    console.log(`\n${branch}:`);
    console.log(`  Tam hợp đầy đủ: ${tamHop.join(", ")}`);
    console.log(`  Tam hợp khác: ${others.join(", ")}`);
  }
}

function testXungChieuLogic() {
  printSeparator("TEST: Xung Chiếu Logic");
  
  const branches = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ"];
  
  for (const branch of branches) {
    const opposite = getOppositeBranch(branch);
    console.log(`${branch} ↔ ${opposite}`);
  }
}

function testGiapCungLogic() {
  printSeparator("TEST: Giáp Cung Logic");
  
  const testBranches = ["Tý", "Dần", "Ngọ", "Tuất"];
  
  for (const branch of testBranches) {
    const [prev, next] = getGiapCungBranches(branch);
    console.log(`${branch}: [${prev}] ← → [${next}]`);
  }
}

function testContextExpander(testCase: typeof TEST_CASES[0]) {
  printSeparator(`TEST: Context Expander - ${testCase.name}`);
  
  const chart = createChart(testCase.input);
  console.log(`\nChart created for: ${testCase.input.fullName}`);
  console.log(`Birth: ${testCase.input.year}/${testCase.input.month}/${testCase.input.day}`);
  
  // Test expand cho cung Mệnh
  const menhPalace = chart.palaces.find(p => p.name === "Mệnh");
  if (!menhPalace) {
    console.log("ERROR: Không tìm thấy cung Mệnh");
    return;
  }
  
  const expandedMenh = expandPalaceContext(chart, menhPalace);
  
  printSubSection("Cung Mệnh - Expanded Context");
  console.log(`Palace: ${expandedMenh.palaceName}`);
  console.log(`Branch: ${expandedMenh.earthlyBranch}`);
  console.log(`Stem: ${expandedMenh.heavenlyStem || "N/A"}`);
  console.log(`Has Main Star: ${expandedMenh.hasMainStar}`);
  console.log(`Is Vô Chính Diệu: ${expandedMenh.isVoChinhDieu}`);
  
  console.log(`\nStars in Palace: ${expandedMenh.starsInPalace.join(", ")}`);
  console.log(`Main Stars: ${expandedMenh.mainStarsInPalace.join(", ") || "None"}`);
  
  console.log(`\nTam Hợp Palaces:`);
  for (const rp of expandedMenh.tamHopPalaces) {
    console.log(`  - ${rp.palace.name} (${rp.relationLabel})`);
  }
  
  console.log(`\nXung Chiếu Palace:`);
  if (expandedMenh.xungChieuPalace) {
    console.log(`  - ${expandedMenh.xungChieuPalace.palace.name} (${expandedMenh.xungChieuPalace.relationLabel})`);
  } else {
    console.log("  - None");
  }
  
  console.log(`\nGiáp Cung Palaces:`);
  for (const rp of expandedMenh.giapCungPalaces) {
    console.log(`  - ${rp.palace.name} (${rp.relationLabel})`);
  }
  
  console.log(`\nStars in Tam Hợp (main only):`);
  const mainInTamHop = expandedMenh.starsInTamHop.filter(s => 
    ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh",
     "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương",
     "Thất Sát", "Phá Quân"].includes(s.name)
  );
  for (const star of mainInTamHop) {
    console.log(`  - ${star.name} từ ${star.sourcePalace}`);
  }
  
  console.log(`\nPhi Hóa Outgoing:`);
  for (const flow of expandedMenh.phiHoaOutgoing) {
    console.log(`  - ${flow.typeLabel} → ${flow.targetPalace} (${flow.targetStar})`);
  }
  
  console.log(`\nPhi Hóa Incoming:`);
  for (const flow of expandedMenh.phiHoaIncoming) {
    console.log(`  - ${flow.typeLabel} ← ${flow.sourcePalace}`);
  }
  
  console.log(`\nMutagens in Context:`);
  for (const m of expandedMenh.mutagensInContext) {
    console.log(`  - ${m.starName} Hóa ${m.type} (${m.source} - ${m.sourcePalace})`);
  }
}

function testUnifiedKnowledgeService(testCase: typeof TEST_CASES[0]) {
  printSeparator(`TEST: Unified Knowledge Service - ${testCase.name}`);
  
  const chart = createChart(testCase.input);
  
  // Test query cho cung Mệnh
  const menhPalace = chart.palaces.find(p => p.name === "Mệnh");
  if (!menhPalace) {
    console.log("ERROR: Không tìm thấy cung Mệnh");
    return;
  }
  
  const result = queryPalaceKnowledgeUnified(chart, menhPalace, {
    includeTamHop: true,
    includeXungChieu: true,
    includeGiapCung: true,
    includePhiHoa: true,
    maxResults: 20,
  });
  
  printSubSection("Query Results for Mệnh");
  console.log(`Total Results: ${result.totalCount}`);
  console.log(`Self Results: ${result.selfResults.length}`);
  console.log(`Tam Hợp Results: ${result.tamHopResults.length}`);
  console.log(`Xung Chiếu Results: ${result.xungChieuResults.length}`);
  console.log(`Giáp Cung Results: ${result.giapCungResults.length}`);
  console.log(`Phi Hóa Results: ${result.phiHoaResults.length}`);
  
  console.log(`\nTop 10 Results:`);
  for (let i = 0; i < Math.min(10, result.results.length); i++) {
    const r = result.results[i];
    console.log(`\n${i + 1}. [${r.type}] Score: ${r.score}`);
    console.log(`   ${r.text.substring(0, 100)}${r.text.length > 100 ? "..." : ""}`);
    console.log(`   Reasons: ${r.matchReasons.join(", ")}`);
    if (r.context) {
      console.log(`   Context: ${r.context}`);
    }
  }
  
  // Test query cho cung Tài Bạch
  const taiBachPalace = chart.palaces.find(p => p.name === "Tài Bạch");
  if (taiBachPalace) {
    printSubSection("Query Results for Tài Bạch");
    const taiBachResult = queryPalaceKnowledgeUnified(chart, taiBachPalace);
    console.log(`Total Results: ${taiBachResult.totalCount}`);
    console.log(`Top 5 Results:`);
    for (let i = 0; i < Math.min(5, taiBachResult.results.length); i++) {
      const r = taiBachResult.results[i];
      console.log(`  ${i + 1}. [${r.type}] ${r.text.substring(0, 80)}...`);
    }
  }
}

function testAllPalacesExpansion(testCase: typeof TEST_CASES[0]) {
  printSeparator(`TEST: All Palaces Expansion - ${testCase.name}`);
  
  const chart = createChart(testCase.input);
  const allContexts = expandAllPalaceContexts(chart);
  
  console.log(`\nExpanded ${allContexts.size} palaces:`);
  
  for (const [index, ctx] of allContexts) {
    const mainStars = ctx.mainStarsInPalace.join(", ") || "Vô Chính Diệu";
    const phiIn = ctx.phiHoaIncoming.length;
    const phiOut = ctx.phiHoaOutgoing.length;
    console.log(`  ${ctx.palaceName.padEnd(12)} | ${ctx.earthlyBranch.padEnd(4)} | ${mainStars.padEnd(30)} | Phi: ${phiOut}→ ${phiIn}←`);
  }
}

// ============ MAIN ============

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     TEST: Context Expander & Unified Knowledge Service     ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  
  // Test logic cơ bản
  testTamHopLogic();
  testXungChieuLogic();
  testGiapCungLogic();
  
  // Test với các lá số thực tế
  for (const testCase of TEST_CASES) {
    testContextExpander(testCase);
    testUnifiedKnowledgeService(testCase);
    testAllPalacesExpansion(testCase);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("TEST COMPLETED");
  console.log("=".repeat(60));
}

main().catch(console.error);
