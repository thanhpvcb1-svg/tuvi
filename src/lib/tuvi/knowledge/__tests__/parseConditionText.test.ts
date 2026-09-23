/**
 * Test parseConditionText function
 * Run: npx vitest run src/lib/tuvi/knowledge/__tests__/parseConditionText.test.ts
 */

import { describe, it, expect } from "vitest";
import { parseConditionText } from "../improvedMatcher";

describe("parseConditionText", () => {
  describe("Position extraction", () => {
    it("should extract position from 'an tại Tuất'", () => {
      const result = parseConditionText("Cung Mệnh an tại Tuất có Phá quân");
      expect(result.position).toBe("tuat");
    });

    it("should extract position from 'địa chi là Tuất'", () => {
      const result = parseConditionText("Cung Mệnh địa chi là Tuất");
      expect(result.position).toBe("tuat");
    });

    it("should extract position from 'là NHÂM TUẤT'", () => {
      const result = parseConditionText("Cung Mệnh là NHÂM TUẤT");
      expect(result.position).toBe("tuat");
    });
  });

  describe("Heavenly stem extraction", () => {
    it("should extract stem from 'can Nhâm'", () => {
      const result = parseConditionText("Cung Mệnh can Nhâm");
      expect(result.heavenlyStem).toBe("nham");
    });

    it("should extract stem from 'thiên can là Nhâm'", () => {
      const result = parseConditionText("Cung Mệnh thiên can là Nhâm");
      expect(result.heavenlyStem).toBe("nham");
    });

    it("should extract stem from 'là NHÂM TUẤT'", () => {
      const result = parseConditionText("Cung Mệnh là NHÂM TUẤT");
      expect(result.heavenlyStem).toBe("nham");
    });
  });

  describe("Star extraction", () => {
    it("should extract single star 'Phá quân'", () => {
      const result = parseConditionText("Cung Mệnh an tại Tuất có Phá quân");
      expect(result.requiredStars).toContain("pha_quan");
    });

    it("should extract multiple stars", () => {
      const result = parseConditionText("Cung Mệnh có Phá quân, Văn xương");
      expect(result.requiredStars).toContain("pha_quan");
      expect(result.requiredStars).toContain("van_xuong");
    });

    it("should NOT extract phi hoa patterns as stars", () => {
      const result = parseConditionText("Cung Mệnh an tại Tuất có Lộc Tật");
      // "Lộc Tật" is phi hoa, not a star
      expect(result.requiredStars).not.toContain("loc_tat");
      expect(result.transformationType).toBe("loc");
      expect(result.transformationTarget).toBe("tat_ach");
    });
  });

  describe("Phi hoa extraction - short patterns", () => {
    it("should extract 'có Lộc Tật' as phi hoa", () => {
      const result = parseConditionText("Cung Mệnh an tại Tuất có Lộc Tật");
      expect(result.transformationType).toBe("loc");
      expect(result.transformationTarget).toBe("tat_ach");
    });

    it("should extract 'có Kỵ Phúc' as phi hoa", () => {
      const result = parseConditionText("Cung Mệnh an tại Tuất có Kỵ Phúc");
      expect(result.transformationType).toBe("ky");
      expect(result.transformationTarget).toBe("phuc_duc");
    });

    it("should extract 'có Quyền Di' as phi hoa", () => {
      const result = parseConditionText("Cung Mệnh an tại Tuất có Quyền Di");
      expect(result.transformationType).toBe("quyen");
      expect(result.transformationTarget).toBe("thien_di");
    });

    it("should extract 'có Khoa Phúc' as phi hoa", () => {
      const result = parseConditionText("Cung Mệnh an tại Tuất có Khoa Phúc");
      expect(result.transformationType).toBe("khoa");
      expect(result.transformationTarget).toBe("phuc_duc");
    });
  });

  describe("Phi hoa extraction - full patterns", () => {
    it("should extract 'Lộc nhập Tật Ách'", () => {
      const result = parseConditionText("Mệnh cung hóa Lộc nhập cung Tật Ách");
      expect(result.transformationType).toBe("loc");
      expect(result.transformationTarget).toBe("tat_ach");
    });

    it("should extract 'phi hóa Kỵ tới Phúc Đức'", () => {
      const result = parseConditionText("Mệnh phi hóa Kỵ tới cung Phúc Đức");
      expect(result.transformationType).toBe("ky");
      expect(result.transformationTarget).toBe("phuc_duc");
    });

    it("should extract 'Thuận Thủy Kị'", () => {
      const result = parseConditionText("Thuận Thủy Kị: cung Mệnh phi hóa kỵ tới cung Phúc đức");
      expect(result.transformationType).toBe("ky");
    });
  });

  describe("M_CODE extraction", () => {
    it("should extract M_CODE:TUAT", () => {
      const result = parseConditionText("M_CODE:TUAT");
      expect(result.mCode).toBe("tuat");
    });

    it("should extract 'có M Điền'", () => {
      const result = parseConditionText("Cung Mệnh an tại Tuất có M Điền");
      expect(result.mCode).toBe("điền");
    });

    it("should extract 'có M Phúc'", () => {
      const result = parseConditionText("Cung Mệnh an tại Tuất có M Phúc");
      expect(result.mCode).toBe("phúc");
    });
  });

  describe("Gender extraction", () => {
    it("should extract 'nam mệnh'", () => {
      const result = parseConditionText("Nam mệnh có Phá quân");
      expect(result.gender).toBe("male");
    });

    it("should extract 'nữ mệnh'", () => {
      const result = parseConditionText("Nữ mệnh có Phá quân");
      expect(result.gender).toBe("female");
    });
  });

  describe("Complex conditions", () => {
    it("should parse full condition text correctly", () => {
      const result = parseConditionText(
        "Cung Mệnh an tại Tuất có Phá quân, Văn xương"
      );
      expect(result.position).toBe("tuat");
      expect(result.requiredStars).toContain("pha_quan");
      expect(result.requiredStars).toContain("van_xuong");
    });

    it("should parse phi hoa with position", () => {
      const result = parseConditionText(
        "Cung Mệnh an tại Tuất có Lộc Tật"
      );
      expect(result.position).toBe("tuat");
      expect(result.transformationType).toBe("loc");
      expect(result.transformationTarget).toBe("tat_ach");
    });
  });
});
