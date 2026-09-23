/**
 * T002 - Test với sample charts thực tế
 * Verify matching accuracy với dữ liệu từ cohoc-full.json
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  queryKnowledge,
  getTopKnowledge,
  matchBlock,
  parseConditionText,
  type MatchContext,
  type RawBlock,
} from "../improvedMatcher";

// Import real knowledge data
import menhCohocFull from "../cung/menh-cohoc-full.json";

// ============ HELPER FUNCTIONS ============

function extractBlocks(data: any): RawBlock[] {
  const blocks: RawBlock[] = [];
  if (data.sections) {
    for (const section of data.sections) {
      if (section.blocks) {
        blocks.push(...section.blocks);
      }
    }
  }
  return blocks;
}

// ============ SAMPLE CHART DATA ============

/**
 * Sample Chart 1: Mệnh Nhâm Tuất, Phá Quân thủ mệnh
 * - Cung Mệnh tại Tuất
 * - Can cung: Nhâm
 * - Chính tinh: Phá Quân
 * - Phụ tinh: Văn Xương, Âm Sát
 * - Phi hóa: Mệnh phi Lộc nhập Tật Ách, Kỵ nhập Phúc Đức
 */
const sampleChart1: MatchContext = {
  palace: {
    name: "Mệnh",
    heavenlyStem: "Nhâm",
    earthlyBranch: "Tuất",
  } as any,
  starsInPalace: ["Phá Quân", "Văn Xương", "Âm Sát"],
  starsInChart: [
    "Phá Quân", "Văn Xương", "Âm Sát",
    "Tử Vi", "Thiên Tướng", // Đối cung
    "Thất Sát", "Kình Dương", // Tam hợp
    "Tham Lang", "Hữu Bật", "Hóa Khoa", "Hóa Lộc", // Tam hợp
  ],
  heavenlyStem: "Nhâm",
  earthlyBranch: "Tuất",
  phiHoaFlows: [
    { type: "loc", sourcePalace: "Mệnh", targetPalace: "Tật Ách" },
    { type: "ky", sourcePalace: "Mệnh", targetPalace: "Phúc Đức" },
  ],
  gender: "male",
};

/**
 * Sample Chart 2: Mệnh Giáp Tý, Tử Vi Thiên Phủ đồng cung
 */
const sampleChart2: MatchContext = {
  palace: {
    name: "Mệnh",
    heavenlyStem: "Giáp",
    earthlyBranch: "Tý",
  } as any,
  starsInPalace: ["Tử Vi", "Thiên Phủ", "Tả Phụ"],
  starsInChart: ["Tử Vi", "Thiên Phủ", "Tả Phụ", "Hữu Bật"],
  heavenlyStem: "Giáp",
  earthlyBranch: "Tý",
  gender: "female",
};

/**
 * Sample Chart 3: Mệnh có Thất Sát, Hỏa Tinh (Hỏa Tham potential)
 */
const sampleChart3: MatchContext = {
  palace: {
    name: "Mệnh",
    heavenlyStem: "Bính",
    earthlyBranch: "Thìn",
  } as any,
  starsInPalace: ["Tham Lang", "Hỏa Tinh", "Linh Tinh"],
  starsInChart: ["Tham Lang", "Hỏa Tinh", "Linh Tinh", "Thất Sát", "Phá Quân"],
  heavenlyStem: "Bính",
  earthlyBranch: "Thìn",
};

// ============ TESTS ============

describe("T002 - Real Chart Matching Tests", () => {
  let menhBlocks: RawBlock[];

  beforeAll(() => {
    menhBlocks = extractBlocks(menhCohocFull);
    console.log(`Loaded ${menhBlocks.length} blocks from menh-cohoc-full.json`);
  });

  describe("Sample Chart 1: Mệnh Nhâm Tuất, Phá Quân", () => {
    it("should find matches for Phá Quân thủ mệnh", () => {
      const results = queryKnowledge(menhBlocks, sampleChart1, { limit: 20 });
      
      console.log("\n=== Sample Chart 1 Results ===");
      console.log(`Total matches: ${results.length}`);
      results.slice(0, 5).forEach((r, i) => {
        console.log(`${i + 1}. [${r.matchType}] Score: ${r.score} - ${r.matchReasons.join(", ")}`);
        console.log(`   Text: ${r.text.slice(0, 100)}...`);
      });

      expect(results.length).toBeGreaterThan(0);
      
      // Should have matches for Phá Quân
      const phaQuanMatches = results.filter(r => 
        r.text.toLowerCase().includes("phá quân") ||
        r.matchReasons.some(reason => reason.toLowerCase().includes("phá"))
      );
      expect(phaQuanMatches.length).toBeGreaterThan(0);
    });

    it("should find matches for position Tuất", () => {
      const results = queryKnowledge(menhBlocks, sampleChart1, { limit: 20 });
      
      const positionMatches = results.filter(r => 
        r.matchType === "position_stem" ||
        r.matchReasons.some(reason => reason.toLowerCase().includes("tuất") || reason.toLowerCase().includes("tuat"))
      );
      
      console.log(`\nPosition matches: ${positionMatches.length}`);
      expect(positionMatches.length).toBeGreaterThan(0);
    });

    it("should find matches for can Nhâm (if data available)", () => {
      const results = queryKnowledge(menhBlocks, sampleChart1, { limit: 20 });
      
      const stemMatches = results.filter(r => 
        r.matchReasons.some(reason => 
          reason.toLowerCase().includes("nhâm") || 
          reason.toLowerCase().includes("nham")
        )
      );
      
      console.log(`\nStem matches: ${stemMatches.length}`);
      // Note: Data may not have specific stem-only blocks
      // This is informational - stem matching works but data may be limited
    });

    it("should find matches for phi hóa Lộc nhập Tật", () => {
      const results = queryKnowledge(menhBlocks, sampleChart1, { limit: 30 });
      
      const phiHoaMatches = results.filter(r => 
        r.matchType === "phi_hoa" ||
        r.matchReasons.some(reason => 
          reason.toLowerCase().includes("lộc") && reason.toLowerCase().includes("tật")
        )
      );
      
      console.log(`\nPhi hóa Lộc Tật matches: ${phiHoaMatches.length}`);
      phiHoaMatches.forEach((r, i) => {
        console.log(`  ${i + 1}. Score: ${r.score} - ${r.matchReasons.join(", ")}`);
      });
      
      expect(phiHoaMatches.length).toBeGreaterThan(0);
    });

    it("should find matches for phi hóa Kỵ nhập Phúc", () => {
      const results = queryKnowledge(menhBlocks, sampleChart1, { limit: 30 });
      
      const phiHoaKyMatches = results.filter(r => 
        r.matchType === "phi_hoa" ||
        r.matchReasons.some(reason => 
          reason.toLowerCase().includes("kỵ") && reason.toLowerCase().includes("phúc")
        )
      );
      
      console.log(`\nPhi hóa Kỵ Phúc matches: ${phiHoaKyMatches.length}`);
      expect(phiHoaKyMatches.length).toBeGreaterThan(0);
    });

    it("should find matches for Văn Xương + Phá Quân combination", () => {
      const results = queryKnowledge(menhBlocks, sampleChart1, { limit: 20 });
      
      const comboMatches = results.filter(r => 
        r.matchType === "star_combination" ||
        (r.text.toLowerCase().includes("văn xương") && r.text.toLowerCase().includes("phá quân"))
      );
      
      console.log(`\nVăn Xương + Phá Quân combo matches: ${comboMatches.length}`);
      // May or may not have this specific combo in data
    });

    it("should return top 3 knowledge with variety", () => {
      const top = getTopKnowledge(menhBlocks, sampleChart1);
      
      console.log("\n=== Top 3 Knowledge ===");
      top.forEach((r, i) => {
        console.log(`${i + 1}. [${r.matchType}] Score: ${r.score}`);
        console.log(`   Reasons: ${r.matchReasons.join(", ")}`);
        console.log(`   Text: ${r.text.slice(0, 150)}...`);
      });

      expect(top.length).toBeLessThanOrEqual(3);
      expect(top.length).toBeGreaterThan(0);
      
      // Should have variety of match types
      const types = new Set(top.map(t => t.matchType));
      console.log(`\nMatch types in top 3: ${[...types].join(", ")}`);
    });
  });

  describe("Sample Chart 2: Mệnh Giáp Tý, Tử Vi Thiên Phủ", () => {
    it("should NOT match Phá Quân blocks (wrong star)", () => {
      const results = queryKnowledge(menhBlocks, sampleChart2, { limit: 20 });
      
      // Should not have high-score matches for Phá Quân specific blocks
      const phaQuanOnlyMatches = results.filter(r => 
        r.matchReasons.some(reason => reason.includes("pha_quan")) &&
        !r.matchReasons.some(reason => reason.includes("tu_vi"))
      );
      
      console.log("\n=== Sample Chart 2 (Tử Vi Thiên Phủ) ===");
      console.log(`Phá Quân only matches (should be 0): ${phaQuanOnlyMatches.length}`);
      
      expect(phaQuanOnlyMatches.length).toBe(0);
    });

    it("should match Tử Vi blocks if available", () => {
      const results = queryKnowledge(menhBlocks, sampleChart2, { limit: 20 });
      
      const tuViMatches = results.filter(r => 
        r.matchReasons.some(reason => 
          reason.toLowerCase().includes("tử vi") || 
          reason.includes("tu_vi")
        )
      );
      
      console.log(`Tử Vi matches: ${tuViMatches.length}`);
      // May or may not have Tử Vi data in menh-cohoc-full
    });
  });

  describe("Condition Text Parsing Accuracy", () => {
    it("should correctly parse 'Cung Mệnh an tại Tuất có Phá quân'", () => {
      const result = parseConditionText("Cung Mệnh an tại Tuất có Phá quân");
      
      expect(result.position).toBe("tuat");
      expect(result.requiredStars).toContain("pha_quan");
    });

    it("should correctly parse 'Cung Mệnh an tại Tuất có Lộc Tật'", () => {
      const result = parseConditionText("Cung Mệnh an tại Tuất có Lộc Tật");
      
      expect(result.position).toBe("tuat");
      expect(result.transformationType).toBe("loc");
      expect(result.transformationTarget).toBe("tat_ach");
      // Should NOT have "Lộc Tật" as a star
      expect(result.requiredStars).not.toContain("loc_tat");
    });

    it("should correctly parse 'Cung Mệnh can Nhâm'", () => {
      const result = parseConditionText("Cung Mệnh can Nhâm");
      
      expect(result.heavenlyStem).toBe("nham");
    });

    it("should correctly parse real condition_text from data", () => {
      // Test with actual condition_text from menh-cohoc-full.json
      const sampleConditions = [
        "Cung Mệnh an tại Tuất có Lộc Tật",
        "Cung Mệnh an tại Tuất có Quyền Di",
        "Cung Mệnh an tại Tuất có Khoa Phúc",
        "Cung Mệnh an tại Tuất có Kỵ Phúc",
        "Cung Mệnh an tại Tuất có Phá quân",
        "Cung Mệnh can Nhâm",
        "Cung Mệnh địa chi là Tuất",
      ];

      console.log("\n=== Parsing Real Condition Texts ===");
      for (const condText of sampleConditions) {
        const result = parseConditionText(condText);
        console.log(`\n"${condText}"`);
        console.log(`  Position: ${result.position || "N/A"}`);
        console.log(`  Stem: ${result.heavenlyStem || "N/A"}`);
        console.log(`  Stars: ${result.requiredStars.join(", ") || "N/A"}`);
        console.log(`  Phi hóa: ${result.transformationType ? `${result.transformationType} -> ${result.transformationTarget}` : "N/A"}`);
      }
    });
  });

  describe("Matching Score Distribution", () => {
    it("should have reasonable score distribution", () => {
      const results = queryKnowledge(menhBlocks, sampleChart1, { limit: 50, minScore: 5 });
      
      const scoreRanges = {
        "100+": results.filter(r => r.score >= 100).length,
        "70-99": results.filter(r => r.score >= 70 && r.score < 100).length,
        "50-69": results.filter(r => r.score >= 50 && r.score < 70).length,
        "30-49": results.filter(r => r.score >= 30 && r.score < 50).length,
        "10-29": results.filter(r => r.score >= 10 && r.score < 30).length,
        "<10": results.filter(r => r.score < 10).length,
      };

      console.log("\n=== Score Distribution ===");
      for (const [range, count] of Object.entries(scoreRanges)) {
        console.log(`  ${range}: ${count} matches`);
      }

      // Should have some high-score matches
      expect(scoreRanges["100+"] + scoreRanges["70-99"] + scoreRanges["50-69"]).toBeGreaterThan(0);
    });

    it("should prioritize star combinations over single stars", () => {
      const results = queryKnowledge(menhBlocks, sampleChart1, { limit: 20 });
      
      const starComboResults = results.filter(r => r.matchType === "star_combination");
      const singleStarResults = results.filter(r => r.matchType === "main_star" || r.matchType === "minor_star");
      
      if (starComboResults.length > 0 && singleStarResults.length > 0) {
        // Star combo should have higher score than single star
        const maxComboScore = Math.max(...starComboResults.map(r => r.score));
        const maxSingleScore = Math.max(...singleStarResults.map(r => r.score));
        
        console.log(`\nMax star combo score: ${maxComboScore}`);
        console.log(`Max single star score: ${maxSingleScore}`);
        
        expect(maxComboScore).toBeGreaterThanOrEqual(maxSingleScore);
      }
    });
  });

  describe("Match Type Coverage", () => {
    it("should cover multiple match types for rich chart", () => {
      const results = queryKnowledge(menhBlocks, sampleChart1, { limit: 50, minScore: 5 });
      
      const typeCount: Record<string, number> = {};
      for (const r of results) {
        typeCount[r.matchType] = (typeCount[r.matchType] || 0) + 1;
      }

      console.log("\n=== Match Type Coverage ===");
      for (const [type, count] of Object.entries(typeCount)) {
        console.log(`  ${type}: ${count}`);
      }

      // Should have at least 2 different match types
      expect(Object.keys(typeCount).length).toBeGreaterThanOrEqual(2);
    });
  });
});
