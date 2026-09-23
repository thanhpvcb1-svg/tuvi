/**
 * Test cases cho Improved Knowledge Matcher
 */

import {
  normalizeStarName,
  normalizeBranch,
  normalizeStem,
  parseConditionText,
  matchBlock,
  queryKnowledge,
  getTopKnowledge,
  type MatchContext,
  type RawBlock,
} from "../improvedMatcher";

// ============ TEST NORMALIZE FUNCTIONS ============

describe("normalizeStarName", () => {
  test("should normalize Vietnamese star names", () => {
    expect(normalizeStarName("Phá Quân")).toBe("pha_quan");
    expect(normalizeStarName("phá quân")).toBe("pha_quan");
    expect(normalizeStarName("Phá quân")).toBe("pha_quan");
    expect(normalizeStarName("pha_quan")).toBe("pha_quan");
  });

  test("should handle aliases", () => {
    expect(normalizeStarName("Tử Vi")).toBe("tu_vi");
    expect(normalizeStarName("Thiên Cơ")).toBe("thien_co");
    expect(normalizeStarName("Thái Dương")).toBe("thai_duong");
  });
});

describe("normalizeBranch", () => {
  test("should normalize earthly branches", () => {
    expect(normalizeBranch("Tuất")).toBe("tuat");
    expect(normalizeBranch("tuất")).toBe("tuat");
    expect(normalizeBranch("TUAT")).toBe("tuat");
  });
});

describe("normalizeStem", () => {
  test("should normalize heavenly stems", () => {
    expect(normalizeStem("Nhâm")).toBe("nham");
    expect(normalizeStem("nhâm")).toBe("nham");
    expect(normalizeStem("NHAM")).toBe("nham");
  });
});

// ============ TEST CONDITION TEXT PARSER ============

describe("parseConditionText", () => {
  test("should parse position from text", () => {
    const result = parseConditionText("Cung Mệnh an tại Tuất có Phá quân");
    expect(result.position).toBe("tuat");
  });

  test("should parse heavenly stem", () => {
    const result = parseConditionText("Cung Mệnh can Nhâm");
    expect(result.heavenlyStem).toBe("nham");
  });

  test("should parse phi hoa", () => {
    const result = parseConditionText("Lộc nhập cung Tật ách");
    expect(result.transformationType).toBe("loc");
    expect(result.transformationTarget).toBe("tat_ach");
  });

  test("should parse required stars", () => {
    const result = parseConditionText("Cung Mệnh có Phá quân thủ mệnh");
    expect(result.requiredStars).toContain("pha_quan");
  });

  test("should parse M_CODE", () => {
    const result = parseConditionText("M_CODE:TUẤT");
    expect(result.mCode).toBe("tuất");
  });
});

// ============ TEST BLOCK MATCHER ============

describe("matchBlock", () => {
  const baseContext: MatchContext = {
    palace: { name: "Mệnh" } as any,
    starsInPalace: ["Phá Quân", "Văn Xương"],
    starsInChart: ["Phá Quân", "Văn Xương", "Thất Sát", "Tham Lang"],
    heavenlyStem: "Nhâm",
    earthlyBranch: "Tuất",
  };

  test("should match single main star", () => {
    const block: RawBlock = {
      block_id: "test_1",
      condition_text: "Cung Mệnh có Phá quân",
      raw_text: "Phá Quân thủ mệnh...",
      conditions: {
        required_stars: ["Phá quân"],
      },
    };

    const result = matchBlock(block, baseContext);
    expect(result).not.toBeNull();
    expect(result?.matchType).toBe("main_star");
    expect(result?.score).toBeGreaterThan(0);
  });

  test("should match position", () => {
    const block: RawBlock = {
      block_id: "test_2",
      condition_text: "Cung Mệnh an tại Tuất",
      raw_text: "Mệnh tại Tuất...",
      conditions: {
        position: "TUAT",
      },
    };

    const result = matchBlock(block, baseContext);
    expect(result).not.toBeNull();
    expect(result?.matchType).toBe("position_stem");
  });

  test("should match heavenly stem", () => {
    const block: RawBlock = {
      block_id: "test_3",
      condition_text: "Cung Mệnh can Nhâm",
      raw_text: "Can Nhâm...",
      conditions: {
        heavenly_stem: "NHAM",
      },
    };

    const result = matchBlock(block, baseContext);
    expect(result).not.toBeNull();
    expect(result?.score).toBeGreaterThan(0);
  });

  test("should match star combination", () => {
    const block: RawBlock = {
      block_id: "test_4",
      condition_text: "Văn Xương Phá Quân đồng cung",
      raw_text: "Văn Xương Phá Quân đồng cung...",
      conditions: {
        required_stars: ["Văn xương", "Phá quân"],
      },
    };

    const result = matchBlock(block, baseContext);
    expect(result).not.toBeNull();
    expect(result?.matchType).toBe("star_combination");
    expect(result?.score).toBeGreaterThan(50);
  });

  test("should not match when star not present", () => {
    const block: RawBlock = {
      block_id: "test_5",
      condition_text: "Cung Mệnh có Tử Vi",
      raw_text: "Tử Vi thủ mệnh...",
      conditions: {
        required_stars: ["Tử Vi"],
      },
    };

    const result = matchBlock(block, baseContext);
    expect(result).toBeNull();
  });

  test("should apply penalty for excluded stars", () => {
    const block: RawBlock = {
      block_id: "test_6",
      raw_text: "Test...",
      conditions: {
        required_stars: ["Phá quân"],
        excluded_stars: ["Văn xương"],
      },
    };

    const result = matchBlock(block, baseContext);
    // Should still match but with lower score due to penalty
    expect(result).not.toBeNull();
    expect(result!.score).toBeLessThan(35); // MAIN_STAR_SINGLE - penalty
  });
});

// ============ TEST QUERY FUNCTIONS ============

describe("queryKnowledge", () => {
  const blocks: RawBlock[] = [
    {
      block_id: "b1",
      raw_text: "Phá Quân thủ mệnh general",
      conditions: { required_stars: ["Phá quân"] },
    },
    {
      block_id: "b2",
      raw_text: "Văn Xương Phá Quân đồng cung",
      conditions: { required_stars: ["Văn xương", "Phá quân"] },
    },
    {
      block_id: "b3",
      raw_text: "Cung Tuất",
      conditions: { position: "TUAT" },
    },
    {
      block_id: "b4",
      raw_text: "Tử Vi thủ mệnh",
      conditions: { required_stars: ["Tử Vi"] },
    },
  ];

  const context: MatchContext = {
    palace: { name: "Mệnh" } as any,
    starsInPalace: ["Phá Quân", "Văn Xương"],
    starsInChart: [],
    heavenlyStem: "Nhâm",
    earthlyBranch: "Tuất",
  };

  test("should return sorted results by score", () => {
    const results = queryKnowledge(blocks, context);
    
    expect(results.length).toBeGreaterThan(0);
    // Star combination should be first (highest score)
    expect(results[0].blockId).toBe("b2");
  });

  test("should filter by minScore", () => {
    const results = queryKnowledge(blocks, context, { minScore: 100 });
    
    // Only star combination should pass high minScore
    expect(results.length).toBe(1);
    expect(results[0].blockId).toBe("b2");
  });

  test("should respect limit", () => {
    const results = queryKnowledge(blocks, context, { limit: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

describe("getTopKnowledge", () => {
  const blocks: RawBlock[] = [
    {
      block_id: "star_combo",
      raw_text: "Tổ hợp sao",
      conditions: { required_stars: ["Văn xương", "Phá quân"] },
    },
    {
      block_id: "position",
      raw_text: "Vị trí cung",
      conditions: { position: "TUAT" },
    },
    {
      block_id: "main_star",
      raw_text: "Chính tinh",
      conditions: { required_stars: ["Phá quân"] },
    },
  ];

  const context: MatchContext = {
    palace: { name: "Mệnh" } as any,
    starsInPalace: ["Phá Quân", "Văn Xương"],
    starsInChart: [],
    heavenlyStem: "Nhâm",
    earthlyBranch: "Tuất",
  };

  test("should return top 3 from different types", () => {
    const top = getTopKnowledge(blocks, context);
    
    expect(top.length).toBeLessThanOrEqual(3);
    // Should have variety of types
    const types = new Set(top.map(t => t.matchType));
    expect(types.size).toBeGreaterThan(1);
  });
});
