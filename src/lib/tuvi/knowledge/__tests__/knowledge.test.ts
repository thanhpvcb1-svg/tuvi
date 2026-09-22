/**
 * Unit Tests for Knowledge Crawler
 */

import { describe, it, expect } from "vitest";
import {
  extractSectionContext,
  extractBlockConditions,
  detectPalaceFromUrl,
} from "../extractor";
import { splitIntoBlocks, parse } from "../parser";
import { generateBlockId, parseSourceCitation, normalizeVietnamese } from "../utils";
import { createEmptyContext } from "../types";

describe("Palace Detection", () => {
  it("should detect palace from section title", () => {
    const context = extractSectionContext("Cung Phu thê an tại Thân có Thiên mã");
    expect(context.palace).toBe("PHU_THE");
  });

  it("should detect palace from URL", () => {
    const palace = detectPalaceFromUrl("https://tuvi.cohoc.net/cung-phu-the-123.html");
    expect(palace).toBe("PHU_THE");
  });

  it("should detect Tử tức palace", () => {
    const context = extractSectionContext("Cung Tử tức an tại Mùi có Lộc Phúc");
    expect(context.palace).toBe("TU_TUC");
  });

  it("should detect Điền trạch palace", () => {
    const context = extractSectionContext("Cung Điền trạch an tại Dần");
    expect(context.palace).toBe("DIEN_TRACH");
  });
});

describe("Section Context Extraction", () => {
  it("should extract position from title", () => {
    const context = extractSectionContext("Cung Phu thê an tại Thân có Thiên mã");
    expect(context.position).toBe("THAN");
  });

  it("should extract required stars from title", () => {
    const context = extractSectionContext("Cung Phu thê an tại Thân có Thiên mã");
    expect(context.required_stars).toContain("THIEN_MA");
  });

  it("should extract heavenly stem from title", () => {
    const context = extractSectionContext("Cung Tử tức thiên can là Kỷ");
    expect(context.heavenly_stem).toBe("KY");
  });

  it("should extract transformation from title", () => {
    const context = extractSectionContext("Thuận Thủy Kị: cung Tử tức phi hóa kỵ tới cung Thiên di");
    expect(context.transformation).toBe("KY");
    expect(context.target_palace).toBe("THIEN_DI");
  });

  it("should extract multiple stars", () => {
    const context = extractSectionContext("Cung Mệnh có Tử Vi Thiên Phủ");
    expect(context.required_stars).toContain("TU_VI");
    expect(context.required_stars).toContain("THIEN_PHU");
  });
});

describe("Block Splitting", () => {
  it("should split content into multiple blocks", () => {
    const content = `Nam chủ lấy được vợ hiền, hội cát tinh, chủ được sự giúp đỡ từ nhà vợ.

Nữ mệnh Thiên Mã nhập cung phu thê hội cát tinh, chủ vượng phu.

Hội nhiều cát tinh thì nam nữ đều quý mỹ.

Hội lộc tinh tốt nhất.

Hội sát kỵ Không Kiếp, nam nữ cô quả, sinh ly.`;

    const blocks = splitIntoBlocks(content);
    expect(blocks.length).toBeGreaterThan(1);
  });

  it("should not merge independent论点", () => {
    const content = `Nam chủ lấy được vợ hiền.

Nữ mệnh chủ vượng phu.`;

    const blocks = splitIntoBlocks(content);
    expect(blocks.length).toBe(2);
  });

  it("should keep related sentences in same block", () => {
    const content = `Thiên Mã nhập cung phu thê, hội Lộc Tồn biểu thị sẽ được gả đi, gia cát vui sướng, gả cho người nơi xa hoặc đi làm ăn xa, kết hôn sẽ mang đến may mắn.`;

    const blocks = splitIntoBlocks(content);
    expect(blocks.length).toBe(1);
  });

  it("should split numbered list items", () => {
    const content = `1. Nam chủ lấy được vợ hiền.
2. Nữ mệnh chủ vượng phu.
3. Hội cát tinh thì tốt.`;

    const blocks = splitIntoBlocks(content);
    expect(blocks.length).toBe(3);
  });

  it("should split gender-specific statements", () => {
    const content = `Nam chủ lấy được vợ hiền, hội cát tinh.
Nữ mệnh Thiên Mã nhập cung phu thê hội cát tinh, chủ vượng phu.`;

    const blocks = splitIntoBlocks(content);
    expect(blocks.length).toBe(2);
  });
});

describe("Block Conditions Extraction", () => {
  it("should inherit context from section", () => {
    const sectionContext = extractSectionContext("Cung Phu thê an tại Thân có Thiên mã");
    const conditions = extractBlockConditions("Nam chủ lấy được vợ hiền.", sectionContext);

    expect(conditions.palace).toBe("PHU_THE");
    expect(conditions.position).toBe("THAN");
    expect(conditions.required_stars).toContain("THIEN_MA");
  });

  it("should extract gender from block text", () => {
    const sectionContext = createEmptyContext();
    const conditions = extractBlockConditions("Nam chủ lấy được vợ hiền.", sectionContext);

    expect(conditions.gender).toBe("MALE");
  });

  it("should extract meeting stars", () => {
    const sectionContext = createEmptyContext();
    const conditions = extractBlockConditions("Hội Lộc Tồn biểu thị sẽ được gả đi.", sectionContext);

    expect(conditions.meeting_stars).toContain("LOC_TON");
  });

  it("should extract sát kỵ condition", () => {
    const sectionContext = createEmptyContext();
    const conditions = extractBlockConditions("Hội sát kỵ Không Kiếp, nam nữ cô quả.", sectionContext);

    expect(conditions.additional_conditions).toContain("SAT_KY");
  });

  it("should extract transformations from text", () => {
    const sectionContext = createEmptyContext();
    const conditions = extractBlockConditions("Thiên Mã Hóa Lộc thì tốt.", sectionContext);

    expect(conditions.transformations).toContain("LOC");
  });
});

describe("Source Extraction", () => {
  it("should parse source with translator", () => {
    const source = parseSourceCitation("*Khai quán nhân tử vi đẩu số - Phương Ngoại Nhân - Linh Chi biên dịch*");

    expect(source).not.toBeNull();
    expect(source!.book).toBe("Khai quán nhân tử vi đẩu số");
    expect(source!.author).toBe("Phương Ngoại Nhân");
    expect(source!.translator).toBe("Linh Chi");
  });

  it("should parse source without translator", () => {
    const source = parseSourceCitation("*Đẩu số cung vị - Trần Bỉnh Húc*");

    expect(source).not.toBeNull();
    expect(source!.book).toBe("Đẩu số cung vị");
    expect(source!.author).toBe("Trần Bỉnh Húc");
    expect(source!.translator).toBeNull();
  });

  it("should parse source with Theo prefix", () => {
    const source = parseSourceCitation("Theo Trung Châu Tam Hợp Phái - Nguyễn Anh Vũ biên dịch");

    expect(source).not.toBeNull();
    expect(source!.book).toBe("Trung Châu Tam Hợp Phái");
    expect(source!.translator).toBe("Nguyễn Anh Vũ");
  });
});

describe("Block ID Generation", () => {
  it("should generate deterministic ID", () => {
    const id1 = generateBlockId(
      "https://example.com/page1",
      "PHU_THE",
      "Cung Phu thê an tại Thân",
      "Nam chủ lấy được vợ hiền."
    );

    const id2 = generateBlockId(
      "https://example.com/page1",
      "PHU_THE",
      "Cung Phu thê an tại Thân",
      "Nam chủ lấy được vợ hiền."
    );

    expect(id1).toBe(id2);
  });

  it("should generate different ID for different content", () => {
    const id1 = generateBlockId(
      "https://example.com/page1",
      "PHU_THE",
      "Cung Phu thê an tại Thân",
      "Nam chủ lấy được vợ hiền."
    );

    const id2 = generateBlockId(
      "https://example.com/page1",
      "PHU_THE",
      "Cung Phu thê an tại Thân",
      "Nữ mệnh chủ vượng phu."
    );

    expect(id1).not.toBe(id2);
  });

  it("should generate different ID for different source", () => {
    const id1 = generateBlockId(
      "https://example.com/page1",
      "PHU_THE",
      "Cung Phu thê an tại Thân",
      "Nam chủ lấy được vợ hiền."
    );

    const id2 = generateBlockId(
      "https://example.com/page2",
      "PHU_THE",
      "Cung Phu thê an tại Thân",
      "Nam chủ lấy được vợ hiền."
    );

    expect(id1).not.toBe(id2);
  });
});

describe("Raw Text Preservation", () => {
  it("should preserve raw text exactly", () => {
    const html = `
      <h4>Cung Phu thê an tại Thân có Thiên mã</h4>
      <p>Nam chủ lấy được vợ hiền, hội cát tinh.</p>
      <p>*Đẩu số cung vị - Trần Bỉnh Húc*</p>
    `;

    const sections = parse(html, "https://example.com");

    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0].blocks.length).toBeGreaterThan(0);
    expect(sections[0].blocks[0].raw_text).toContain("Nam chủ lấy được vợ hiền");
  });
});

describe("Full Parse Integration", () => {
  it("should parse complete HTML section", () => {
    const html = `
      <h4>Cung Phu thê an tại Thân có Thiên mã</h4>
      <p>Nam chủ lấy được vợ hiền, hội cát tinh, chủ được sự giúp đỡ từ nhà vợ hoặc lấy được vợ có tiền hoặc nhờ có sự giúp đỡ của vợ mà phát tài.</p>
      <p>Nữ mệnh Thiên Mã nhập cung phu thê hội cát tinh, chủ vượng phu, có thể hưởng phú quý từ chồng, là số quý phu nhân.</p>
      <p>Hội nhiều cát tinh thì nam nữ đều quý mỹ. Hội lộc tinh tốt nhất.</p>
      <p>Hội sát kỵ Không Kiếp, nam nữ cô quả, sinh ly.</p>
      <p>Thiên Mã nhập cung phu thê, chủ phối ngẫu ở nhà chịu khó, ở ngoài bôn ba, có dấu hiệu sống riêng khá lâu.</p>
      <p>*Khai quán nhân tử vi đẩu số - Phương Ngoại Nhân - Linh Chi biên dịch*</p>
    `;

    const sections = parse(html, "https://tuvi.cohoc.net/phu-the.html");

    expect(sections.length).toBe(1);

    const section = sections[0];
    expect(section.context.palace).toBe("PHU_THE");
    expect(section.context.position).toBe("THAN");
    expect(section.context.required_stars).toContain("THIEN_MA");

    expect(section.source.book).toBe("Khai quán nhân tử vi đẩu số");
    expect(section.source.author).toBe("Phương Ngoại Nhân");
    expect(section.source.translator).toBe("Linh Chi");

    // Should have multiple blocks
    expect(section.blocks.length).toBeGreaterThan(1);

    // Check first block has male gender
    const maleBlock = section.blocks.find((b) => b.conditions.gender === "MALE");
    expect(maleBlock).toBeDefined();

    // Check female block exists
    const femaleBlock = section.blocks.find((b) => b.conditions.gender === "FEMALE");
    expect(femaleBlock).toBeDefined();

    // Check sát kỵ block
    const satKyBlock = section.blocks.find((b) =>
      b.conditions.additional_conditions.includes("SAT_KY")
    );
    expect(satKyBlock).toBeDefined();
  });

  it("should not create duplicate blocks on re-parse", () => {
    const html = `
      <h4>Cung Phu thê an tại Thân có Thiên mã</h4>
      <p>Nam chủ lấy được vợ hiền.</p>
    `;

    const sections1 = parse(html, "https://example.com");
    const sections2 = parse(html, "https://example.com");

    expect(sections1[0].blocks[0].block_id).toBe(sections2[0].blocks[0].block_id);
  });
});

describe("Vietnamese Normalization", () => {
  it("should normalize Vietnamese text", () => {
    expect(normalizeVietnamese("Phu thê")).toBe("phu the");
    expect(normalizeVietnamese("Thiên Mã")).toBe("thien ma");
    expect(normalizeVietnamese("Đẩu số")).toBe("dau so");
  });
});
