/**
 * Test luận giải với 10 lá số ngẫu nhiên
 * Đánh giá chất lượng knowledge đã crawl
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = path.join(__dirname, "../src/lib/tuvi/knowledge/cung");

// Vietnamese data
const CHI_NAME = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const CAN_NAME = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];

const PALACE_NAMES = {
  "menh": "Mệnh",
  "phu-mau": "Phụ Mẫu", 
  "phuc-duc": "Phúc Đức",
  "dien-trach": "Điền Trạch",
  "quan-loc": "Quan Lộc",
  "no-boc": "Nô Bộc",
  "thien-di": "Thiên Di",
  "tat-ach": "Tật Ách",
  "tai-bach": "Tài Bạch",
  "tu-tuc": "Tử Tức",
  "phu-the": "Phu Thê",
  "huynh-de": "Huynh Đệ",
};

const MAIN_STARS = [
  "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng",
  "Liêm Trinh", "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn",
  "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"
];

// ============ GENERATE RANDOM CHART ============

function generateRandomChart() {
  const year = 1960 + Math.floor(Math.random() * 60);
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  const hourIndex = Math.floor(Math.random() * 12);
  const gender = Math.random() > 0.5 ? "Nam" : "Nữ";
  
  const canIndex = (year - 4) % 10;
  const chiIndex = (year - 4) % 12;
  
  // Generate random stars for each palace
  const palaces = {};
  const palaceKeys = Object.keys(PALACE_NAMES);
  
  // Distribute main stars randomly
  const shuffledStars = [...MAIN_STARS].sort(() => Math.random() - 0.5);
  let starIndex = 0;
  
  for (const palace of palaceKeys) {
    const numStars = Math.floor(Math.random() * 3); // 0-2 main stars per palace
    const stars = [];
    
    for (let i = 0; i < numStars && starIndex < shuffledStars.length; i++) {
      stars.push(shuffledStars[starIndex++]);
    }
    
    palaces[palace] = {
      name: PALACE_NAMES[palace],
      branch: CHI_NAME[Math.floor(Math.random() * 12)],
      stars: stars,
    };
  }
  
  return {
    birthInfo: {
      year,
      month,
      day,
      hour: CHI_NAME[hourIndex],
      gender,
      canChi: `${CAN_NAME[canIndex]} ${CHI_NAME[chiIndex]}`,
    },
    palaces,
  };
}

// ============ LOAD KNOWLEDGE ============

function loadAllKnowledge() {
  const knowledge = {};
  
  for (const palace of Object.keys(PALACE_NAMES)) {
    const fileName = `${palace}-cohoc-crawl.json`;
    const filePath = path.join(KNOWLEDGE_DIR, fileName);
    
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        knowledge[palace] = data.sections[0]?.interpretations || [];
      } catch (e) {
        knowledge[palace] = [];
      }
    } else {
      knowledge[palace] = [];
    }
  }
  
  return knowledge;
}

// ============ QUERY KNOWLEDGE ============

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function findRelevantInterpretations(palace, stars, knowledge, limit = 3) {
  const palaceKnowledge = knowledge[palace] || [];
  if (palaceKnowledge.length === 0) return [];
  
  const results = [];
  const normalizedStars = stars.map(s => normalizeText(s));
  
  for (const interp of palaceKnowledge) {
    let score = 0;
    const text = normalizeText(interp.text || "");
    
    // Score based on star matches
    for (const star of normalizedStars) {
      if (text.includes(star)) {
        score += 10;
      }
    }
    
    // Score based on palace mention
    const palaceName = normalizeText(PALACE_NAMES[palace]);
    if (text.includes(palaceName)) {
      score += 5;
    }
    
    if (score > 0) {
      results.push({ ...interp, score });
    }
  }
  
  // Sort by score and return top results
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

// ============ GENERATE INTERPRETATION ============

function generateInterpretation(chart, knowledge) {
  const interpretation = {
    birthInfo: chart.birthInfo,
    palaces: {},
    stats: {
      totalMatches: 0,
      palacesWithMatches: 0,
      avgMatchesPerPalace: 0,
    },
  };
  
  for (const [palace, palaceData] of Object.entries(chart.palaces)) {
    const matches = findRelevantInterpretations(palace, palaceData.stars, knowledge);
    
    interpretation.palaces[palace] = {
      name: palaceData.name,
      branch: palaceData.branch,
      stars: palaceData.stars,
      interpretations: matches.map(m => ({
        text: m.text.substring(0, 200) + (m.text.length > 200 ? "..." : ""),
        score: m.score,
        source: m.source?.book || "Unknown",
      })),
      matchCount: matches.length,
    };
    
    interpretation.stats.totalMatches += matches.length;
    if (matches.length > 0) {
      interpretation.stats.palacesWithMatches++;
    }
  }
  
  interpretation.stats.avgMatchesPerPalace = 
    (interpretation.stats.totalMatches / 12).toFixed(1);
  
  return interpretation;
}

// ============ EVALUATE ============

function evaluateResults(results) {
  const evaluation = {
    totalCharts: results.length,
    avgMatchesPerChart: 0,
    avgPalacesWithMatches: 0,
    chartsWithGoodCoverage: 0, // >50% palaces have matches
    chartsWithExcellentCoverage: 0, // >80% palaces have matches
    palaceStats: {},
  };
  
  let totalMatches = 0;
  let totalPalacesWithMatches = 0;
  
  // Initialize palace stats
  for (const palace of Object.keys(PALACE_NAMES)) {
    evaluation.palaceStats[palace] = {
      name: PALACE_NAMES[palace],
      totalMatches: 0,
      chartsWithMatches: 0,
    };
  }
  
  for (const result of results) {
    totalMatches += result.stats.totalMatches;
    totalPalacesWithMatches += result.stats.palacesWithMatches;
    
    const coverage = result.stats.palacesWithMatches / 12;
    if (coverage > 0.5) evaluation.chartsWithGoodCoverage++;
    if (coverage > 0.8) evaluation.chartsWithExcellentCoverage++;
    
    // Aggregate palace stats
    for (const [palace, data] of Object.entries(result.palaces)) {
      evaluation.palaceStats[palace].totalMatches += data.matchCount;
      if (data.matchCount > 0) {
        evaluation.palaceStats[palace].chartsWithMatches++;
      }
    }
  }
  
  evaluation.avgMatchesPerChart = (totalMatches / results.length).toFixed(1);
  evaluation.avgPalacesWithMatches = (totalPalacesWithMatches / results.length).toFixed(1);
  
  return evaluation;
}

// ============ MAIN ============

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("TEST LUẬN GIẢI VỚI 10 LÁ SỐ NGẪU NHIÊN");
  console.log("=".repeat(70) + "\n");
  
  // Load knowledge
  console.log("→ Loading knowledge...");
  const knowledge = loadAllKnowledge();
  
  let totalBlocks = 0;
  for (const [palace, interps] of Object.entries(knowledge)) {
    console.log(`  ${PALACE_NAMES[palace]}: ${interps.length} blocks`);
    totalBlocks += interps.length;
  }
  console.log(`  TOTAL: ${totalBlocks} blocks\n`);
  
  // Generate and interpret 10 charts
  const results = [];
  
  for (let i = 0; i < 10; i++) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`LÁ SỐ ${i + 1}`);
    console.log("─".repeat(70));
    
    const chart = generateRandomChart();
    const interp = generateInterpretation(chart, knowledge);
    results.push(interp);
    
    // Print birth info
    console.log(`\nSinh: ${chart.birthInfo.day}/${chart.birthInfo.month}/${chart.birthInfo.year}`);
    console.log(`Giờ: ${chart.birthInfo.hour} | Giới tính: ${chart.birthInfo.gender}`);
    console.log(`Năm: ${chart.birthInfo.canChi}`);
    
    // Print palace summary
    console.log(`\nKết quả: ${interp.stats.totalMatches} matches, ${interp.stats.palacesWithMatches}/12 cung có luận giải`);
    
    // Print top 3 palaces with most matches
    const sortedPalaces = Object.entries(interp.palaces)
      .sort((a, b) => b[1].matchCount - a[1].matchCount)
      .slice(0, 3);
    
    console.log("\nTop 3 cung có nhiều luận giải:");
    for (const [palace, data] of sortedPalaces) {
      if (data.matchCount > 0) {
        console.log(`  • ${data.name} (${data.stars.join(", ") || "Vô chính diệu"}): ${data.matchCount} matches`);
        if (data.interpretations[0]) {
          console.log(`    "${data.interpretations[0].text.substring(0, 100)}..."`);
        }
      }
    }
  }
  
  // Evaluation
  console.log("\n" + "=".repeat(70));
  console.log("ĐÁNH GIÁ TỔNG HỢP");
  console.log("=".repeat(70) + "\n");
  
  const evaluation = evaluateResults(results);
  
  console.log("📊 THỐNG KÊ CHUNG:");
  console.log(`  • Tổng số lá số test: ${evaluation.totalCharts}`);
  console.log(`  • Trung bình matches/lá số: ${evaluation.avgMatchesPerChart}`);
  console.log(`  • Trung bình cung có luận giải: ${evaluation.avgPalacesWithMatches}/12`);
  console.log(`  • Lá số có coverage >50%: ${evaluation.chartsWithGoodCoverage}/10`);
  console.log(`  • Lá số có coverage >80%: ${evaluation.chartsWithExcellentCoverage}/10`);
  
  console.log("\n📈 THỐNG KÊ THEO CUNG:");
  const sortedPalaceStats = Object.entries(evaluation.palaceStats)
    .sort((a, b) => b[1].totalMatches - a[1].totalMatches);
  
  for (const [palace, stats] of sortedPalaceStats) {
    const avgMatches = (stats.totalMatches / 10).toFixed(1);
    const coverage = ((stats.chartsWithMatches / 10) * 100).toFixed(0);
    console.log(`  ${stats.name.padEnd(12)}: ${avgMatches} avg matches, ${coverage}% coverage`);
  }
  
  // Quality assessment
  console.log("\n🎯 ĐÁNH GIÁ CHẤT LƯỢNG:");
  
  const avgMatches = parseFloat(evaluation.avgMatchesPerChart);
  const avgCoverage = parseFloat(evaluation.avgPalacesWithMatches) / 12;
  
  if (avgMatches >= 20 && avgCoverage >= 0.7) {
    console.log("  ✅ XUẤT SẮC - Knowledge base đủ phong phú để luận giải chi tiết");
  } else if (avgMatches >= 10 && avgCoverage >= 0.5) {
    console.log("  ✅ TỐT - Knowledge base đủ dùng cho luận giải cơ bản");
  } else if (avgMatches >= 5 && avgCoverage >= 0.3) {
    console.log("  ⚠️ TRUNG BÌNH - Cần crawl thêm data để cải thiện");
  } else {
    console.log("  ❌ CẦN CẢI THIỆN - Knowledge base còn thiếu nhiều");
  }
  
  console.log("\n" + "=".repeat(70) + "\n");
}

main().catch(console.error);
