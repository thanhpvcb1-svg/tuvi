/**
 * Test Cohoc Parser
 * 
 * Run: npx vitest run src/lib/tuvi/knowledge/__tests__/cohocParser.test.ts
 */

import { describe, it, expect } from "vitest";
import { parseCohocText, convertToKnowledgeFile } from "../cohocParser";

const SAMPLE_TEXT = `
CUNG MENH
Diem "xi hoa" cung Menh la 1.8
Cung Menh chu ve: ban than duong so.

Cung Menh an tai Tuat co Pha quan
Chu ve nguoi chinh truc, hieu thang, thuong hay thay doi tinh cam, thieu kien nhan.

Tu vi dau so menh van phan tich - Tu Tang Sinh

Cung Menh an tai Tuat co Loc Tat
Menh cung hoa Loc nhap Tat ach cung:
Tat ach cung chu than the, noi cong tac. Ta lam cho co the cua ta khoe manh.

Giao trinh phi tinh Luong Phai - Alex Alpha

Cung Menh an tai Tuat co Ky Phuc
Menh cung hoa Ky nhap phuc duc cung:
Menh cung hoa Ky nhap phuc duc, lam ta de y phuc duc.

Giao trinh tu hoa phi tinh so trung co ban - Huy Ha Phan

CUNG QUAN LOC
Diem "xi hoa" cung Quan loc la 0.86

Cung Quan loc an tai Dan co Hoa loc
Hoa Loc nhap quan loc, ban ron, dac quy nhan, co nang luc lap nghiep.

Giao trinh tu hoa phi tinh so trung co ban - Huy Ha Phan

Cung Quan loc an tai Dan co Tham lang
Tham Lang nhap cung quan loc, phan dau gian kho, truoc 30 tuoi van trinh khong tot.

Ha lac phai - Phuong Ngoai Nhan
`;

describe("cohocParser", () => {
  describe("parseCohocText", () => {
    it("should parse text into palace blocks", () => {
      const result = parseCohocText(SAMPLE_TEXT);
      
      expect(result.size).toBeGreaterThan(0);
      expect(result.has("menh")).toBe(true);
      expect(result.has("quan_loc")).toBe(true);
    });

    it("should extract correct number of blocks per palace", () => {
      const result = parseCohocText(SAMPLE_TEXT);
      
      const menhBlocks = result.get("menh") || [];
      const quanLocBlocks = result.get("quan_loc") || [];
      
      expect(menhBlocks.length).toBeGreaterThanOrEqual(3);
      expect(quanLocBlocks.length).toBeGreaterThanOrEqual(2);
    });

    it("should extract position from title", () => {
      const result = parseCohocText(SAMPLE_TEXT);
      const menhBlocks = result.get("menh") || [];
      
      const blockWithPosition = menhBlocks.find(b => b.conditions.position);
      expect(blockWithPosition).toBeDefined();
      expect(blockWithPosition?.conditions.position).toBe("tuat");
    });

    it("should extract stars from title", () => {
      const result = parseCohocText(SAMPLE_TEXT);
      const menhBlocks = result.get("menh") || [];
      
      const blockWithStar = menhBlocks.find(b => 
        b.conditions.requiredStars?.includes("pha_quan")
      );
      expect(blockWithStar).toBeDefined();
    });

    it("should extract phi hoa from title", () => {
      const result = parseCohocText(SAMPLE_TEXT);
      const menhBlocks = result.get("menh") || [];
      
      const blockWithPhiHoa = menhBlocks.find(b => b.conditions.phiHoa);
      expect(blockWithPhiHoa).toBeDefined();
      expect(blockWithPhiHoa?.conditions.phiHoa?.type).toMatch(/loc|ky/);
    });

    it("should extract source correctly", () => {
      const result = parseCohocText(SAMPLE_TEXT);
      const menhBlocks = result.get("menh") || [];
      
      const blockWithSource = menhBlocks.find(b => 
        b.source.author !== "Unknown"
      );
      expect(blockWithSource).toBeDefined();
      expect(blockWithSource?.source.book).toBeTruthy();
    });
  });

  describe("convertToKnowledgeFile", () => {
    it("should convert blocks to KnowledgeFile format", () => {
      const result = parseCohocText(SAMPLE_TEXT);
      const menhBlocks = result.get("menh") || [];
      
      const knowledgeFile = convertToKnowledgeFile("menh", menhBlocks);
      
      expect(knowledgeFile.palace).toBe("menh");
      expect(knowledgeFile.palace_name).toBe("Mệnh");
      expect(knowledgeFile.sections).toBeDefined();
      expect(knowledgeFile.sections!.length).toBeGreaterThan(0);
    });

    it("should group blocks by type into sections", () => {
      const result = parseCohocText(SAMPLE_TEXT);
      const menhBlocks = result.get("menh") || [];
      
      const knowledgeFile = convertToKnowledgeFile("menh", menhBlocks);
      
      const sectionIds = knowledgeFile.sections!.map(s => s.section_id);
      
      // Should have different section types
      expect(sectionIds.some(id => id.includes("phi_hoa") || id.includes("chinh_tinh"))).toBe(true);
    });

    it("should create valid interpretations", () => {
      const result = parseCohocText(SAMPLE_TEXT);
      const menhBlocks = result.get("menh") || [];
      
      const knowledgeFile = convertToKnowledgeFile("menh", menhBlocks);
      
      for (const section of knowledgeFile.sections!) {
        for (const interp of section.interpretations) {
          expect(interp.id).toBeTruthy();
          expect(interp.type).toBeTruthy();
          expect(interp.text).toBeTruthy();
          expect(interp.source).toBeDefined();
        }
      }
    });
  });
});
