/**
 * Knowledge Types for Tử Vi Bắc Phái
 * 
 * Structure:
 * 1 CUNG = 1 FILE
 * 1 FILE = NHIỀU SECTION
 * 1 SECTION = NHIỀU KNOWLEDGE BLOCK
 * 1 KNOWLEDGE BLOCK = 1 LUẬN ĐIỂM ĐỘC LẬP
 */

// ============ ENUMS ============

export type Palace =
  | "MENH"
  | "PHU_MAU"
  | "PHUC_DUC"
  | "DIEN_TRACH"
  | "QUAN_LOC"
  | "NO_BOC"
  | "THIEN_DI"
  | "TAT_ACH"
  | "TAI_BACH"
  | "TU_TUC"
  | "PHU_THE"
  | "HUYNH_DE";

export type EarthlyBranch =
  | "TY"
  | "SUU"
  | "DAN"
  | "MAO"
  | "THIN"
  | "TI"
  | "NGO"
  | "MUI"
  | "THAN"
  | "DAU"
  | "TUAT"
  | "HOI";

export type HeavenlyStem =
  | "GIAP"
  | "AT"
  | "BINH"
  | "DINH"
  | "MAU"
  | "KY"
  | "CANH"
  | "TAN"
  | "NHAM"
  | "QUY";

export type Gender = "MALE" | "FEMALE";

export type Transformation = "LOC" | "QUYEN" | "KHOA" | "KY";

// ============ CONDITIONS ============

export interface BlockConditions {
  palace: Palace | null;
  position: EarthlyBranch | null;
  heavenly_stem: HeavenlyStem | null;
  gender: Gender | null;
  required_stars: string[];
  excluded_stars: string[];
  same_palace_stars: string[];
  meeting_stars: string[];
  opposite_stars: string[];
  trine_stars: string[];
  transformations: Transformation[];
  transformation_target: Palace[];
  additional_conditions: string[];
}

// ============ SOURCE ============

export interface Source {
  book: string;
  author: string;
  translator: string | null;
  url: string;
}

// ============ KNOWLEDGE BLOCK ============

export interface KnowledgeBlock {
  block_id: string;
  raw_text: string;
  conditions: BlockConditions;
}

// ============ SECTION ============

export interface SectionContext {
  palace: Palace | null;
  position: EarthlyBranch | null;
  heavenly_stem: HeavenlyStem | null;
  required_stars: string[];
  transformation: Transformation | null;
  target_palace: Palace | null;
}

export interface Section {
  section_id: string;
  title: string;
  context: SectionContext;
  source: Source;
  blocks: KnowledgeBlock[];
}

// ============ PALACE FILE ============

export interface PalaceKnowledge {
  palace: Palace;
  sections: Section[];
}

// ============ DEFAULTS ============

export function createEmptyConditions(): BlockConditions {
  return {
    palace: null,
    position: null,
    heavenly_stem: null,
    gender: null,
    required_stars: [],
    excluded_stars: [],
    same_palace_stars: [],
    meeting_stars: [],
    opposite_stars: [],
    trine_stars: [],
    transformations: [],
    transformation_target: [],
    additional_conditions: [],
  };
}

export function createEmptyContext(): SectionContext {
  return {
    palace: null,
    position: null,
    heavenly_stem: null,
    required_stars: [],
    transformation: null,
    target_palace: null,
  };
}
