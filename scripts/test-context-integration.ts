/**
 * Integration Test for Context Expander with Real Charts
 * 
 * Run: npx vite-node scripts/test-context-integration.ts
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
  type ExpandedPalaceContext,
} from "../src/lib/tuvi/context/contextExpander";
import {
  queryPalaceKnowledgeUnified,
  type UnifiedQueryResult,
} from "../src/lib/tuvi/knowledge/unifiedKnowledgeService";
import type { NormalizedBirthInput, DisplayChart } from "../src/lib/tuvi/config/types";

// ============ TEST DATA ============

const TEST_CASES = [
  {
    name: "Mậu Thìn 1988 - Giờ Tỵ",
    input: {
      fullName: "Test User 1988",
      year: 1988,
      month: 8,
      day: 26,
      birthHour: 9,
      birthMinute: 0,
      birthHourIndex: 5,
      gender: "male" as const,
      calendarType: "solar" as const,
    },
  },
  {
    name: "Canh Thìn 2000 - Giờ Mùi",
    input: {
      fullName: "Test User 2000",
      year: 2000,
      month: 3,
      day: 15,
      birthHour: 14,
      birthMinute: 30,
      birthHourIndex: 7,
      gender: "female" as const,
      calendarType: "solar" as const,
    },
  },
];

// ============ HELPER FUNCTIONS ============

function createChart(input: NormalizedBirthInput): DisplayChart {
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

function printHeader(title: string) {
  console.log("\n" + "═".repeat(70));
  console.log(`  ${title}`);
  console.log("═".repeat(70));
}

function printSection(title: string) {
  console.log("\n" + "─".repeat(50));
  console.log(`  ${title}`);
  console.log("─".repeat(50));
}

// ============ TEST FUNCTIONS ============

function testContextExpander(testCase: typeof TEST_CASES[0]) {
  printHeader(`Context Expander: ${testCase.name}`);
  
  const chart = createChart(testCase.input);
  console.log(`\n📅 Birth: ${testCase.input.year}/${testCase.input.month}/${testCase.input.day}`);
  console.log(`👤 Gender: ${testCase.input.gender}`);
  
  // Test cung Mệnh
  const menhPalace = chart.palaces.find(p => p.name === "Mệnh");
  if (!menhPalace) {
    console.log("❌ ERROR: Không tìm thấy cung Mệnh");
    return;
  }
  
  const ctx = expandPalaceContext(chart, menhPalace);
  
  printSection("Cung Mệnh - Basic Info");
  console.log(`  Palace: ${ctx.palaceName}`);
  console.log(`  Branch: ${ctx.earthlyBranch}`);
  console.log(`  Stem: ${ctx.heavenlyStem || "N/A"}`);
  console.log(`  Has Main Star: ${ctx.hasMainStar ? "✓" : "✗"}`);
  console.log(`  Is Vô Chính Diệu: ${ctx.isVoChinhDieu ? "✓" : "✗"}`);
  
  printSection("Stars in Palace");
  console.log(`  Main Stars: ${ctx.mainStarsInPalace.join(", ") || "(none)"}`);
  console.log(`  All Stars: ${ctx.starsInPalace.slice(0, 10).join(", ")}${ctx.starsInPalace.length > 10 ? "..." : ""}`);
  
  printSection("Tam Hợp");
  for (const rp of ctx.tamHopPalaces) {
    const mainStars = rp.palace.majorStars?.map(s => s.name).join(", ") || "(none)";
    console.log(`  ${rp.palace.name} (${rp.palace.earthlyBranch}): ${mainStars}`);
  }
  
  printSection("Xung Chiếu");
  if (ctx.xungChieuPalace) {
    const mainStars = ctx.xungChieuPalace.palace.majorStars?.map(s => s.name).join(", ") || "(none)";
    console.log(`  ${ctx.xungChieuPalace.palace.name} (${ctx.xungChieuPalace.palace.earthlyBranch}): ${mainStars}`);
  } else {
    console.log("  (none)");
  }
  
  printSection("Giáp Cung");
  for (const rp of ctx.giapCungPalaces) {
    const mainStars = rp.palace.majorStars?.map(s => s.name).join(", ") || "(none)";
    console.log(`  ${rp.palace.name} (${rp.palace.earthlyBranch}): ${mainStars}`);
  }
  
  printSection("Phi Hóa Outgoing");
  for (const flow of ctx.phiHoaOutgoing) {
    const status = flow.relation === "missing_star" ? "⚠️" : "→";
    console.log(`  ${flow.typeLabel} ${status} ${flow.targetPalace} (${flow.targetStar})`);
  }
  
  printSection("Phi Hóa Incoming");
  if (ctx.phiHoaIncoming.length === 0) {
    console.log("  (none)");
  } else {
    for (const flow of ctx.phiHoaIncoming) {
      console.log(`  ${flow.typeLabel} ← ${flow.sourcePalace}`);
    }
  }
  
  printSection("Mutagens in Context");
  const mutagensBySource = new Map<string, typeof ctx.mutagensInContext>();
  for (const m of ctx.mutagensInContext) {
    const key = m.source;
    if (!mutagensBySource.has(key)) mutagensBySource.set(key, []);
    mutagensBySource.get(key)!.push(m);
  }
  for (const [source, mutagens] of mutagensBySource) {
    console.log(`  [${source}]:`);
    for (const m of mutagens) {
      console.log(`    ${m.starName} Hóa ${m.type} (${m.sourcePalace})`);
    }
  }
  
  return ctx;
}

function testUnifiedKnowledgeService(testCase: typeof TEST_CASES[0]) {
  printHeader(`Unified Knowledge Service: ${testCase.name}`);
  
  const chart = createChart(testCase.input);
  
  // Test cung Mệnh
  const menhPalace = chart.palaces.find(p => p.name === "Mệnh");
  if (!menhPalace) {
    console.log("❌ ERROR: Không tìm thấy cung Mệnh");
    return;
  }
  
  const result = queryPalaceKnowledgeUnified(chart, menhPalace, {
    includeTamHop: true,
    includeXungChieu: true,
    includeGiapCung: true,
    includePhiHoa: true,
    maxResults: 15,
  });
  
  printSection("Query Summary");
  console.log(`  Total Results: ${result.totalCount}`);
  console.log(`  Self Results: ${result.selfResults.length}`);
  console.log(`  Tam Hợp Results: ${result.tamHopResults.length}`);
  console.log(`  Xung Chiếu Results: ${result.xungChieuResults.length}`);
  console.log(`  Giáp Cung Results: ${result.giapCungResults.length}`);
  console.log(`  Phi Hóa Results: ${result.phiHoaResults.length}`);
  
  printSection("Top 10 Results");
  for (let i = 0; i < Math.min(10, result.results.length); i++) {
    const r = result.results[i];
    const contextLabel = r.context ? `[${r.context}]` : "";
    console.log(`\n  ${i + 1}. [${r.type}] Score: ${r.score} ${contextLabel}`);
    console.log(`     ${r.text.substring(0, 80)}${r.text.length > 80 ? "..." : ""}`);
    console.log(`     Reasons: ${r.matchReasons.join(", ")}`);
  }
  
  return result;
}

function testAllPalaces(testCase: typeof TEST_CASES[0]) {
  printHeader(`All Palaces Summary: ${testCase.name}`);
  
  const chart = createChart(testCase.input);
  const allContexts = expandAllPalaceContexts(chart);
  
  console.log("\n  Palace        | Branch | Main Stars                    | Phi Out | Phi In");
  console.log("  " + "─".repeat(85));
  
  for (const [index, ctx] of allContexts) {
    const mainStars = ctx.mainStarsInPalace.join(", ") || "Vô Chính Diệu";
    const phiOut = ctx.phiHoaOutgoing.filter(f => f.relation !== "missing_star").length;
    const phiIn = ctx.phiHoaIncoming.length;
    
    console.log(
      `  ${ctx.palaceName.padEnd(12)} | ${ctx.earthlyBranch.padEnd(6)} | ` +
      `${mainStars.padEnd(29)} | ${String(phiOut).padStart(7)} | ${String(phiIn).padStart(6)}`
    );
  }
}

// ============ MAIN ============

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║     INTEGRATION TEST: Context Expander & Unified Knowledge Service   ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝");
  
  for (const testCase of TEST_CASES) {
    testContextExpander(testCase);
    testUnifiedKnowledgeService(testCase);
    testAllPalaces(testCase);
  }
  
  console.log("\n" + "═".repeat(70));
  console.log("  ✓ ALL TESTS COMPLETED");
  console.log("═".repeat(70) + "\n");
}

main().catch(console.error);
