/**
 * Palace Interpretation Types
 * Luận giải theo từng cung
 */

export type InterpretationSource = {
  book: string;
  author: string;
  translator: string | null;
};

// Phi Cung Tứ Hóa interpretation
export type PhiHoaInterpretation = {
  id: string;
  type: "phi_loc" | "phi_quyen" | "phi_khoa" | "phi_ky";
  source_palace: string;
  target_palace: string;
  clash_palace?: string;
  text: string;
  source: InterpretationSource;
};

// Cách Cục interpretation
export type CachCucInterpretation = {
  id: string;
  type: "cach_cuc";
  required_stars: string[];
  same_palace?: boolean;
  branches?: string[];
  text: string;
  excluded_stars?: string[];
  warning?: string;
  source: InterpretationSource;
};

// Palace Relation interpretation (M Di, M Phúc, etc.)
export type PalaceRelationInterpretation = {
  id: string;
  type: "palace_relation";
  relation_palace: string;
  relation_code: string;
  text: string;
  source: InterpretationSource;
};

// Star at palace interpretation
export type StarInterpretation = {
  id: string;
  type: "star";
  star_id: string;
  star_name: string;
  branches?: string[];
  branch_names?: string[];
  combination?: string[];
  gender?: "male" | "female";
  text: string;
  source: InterpretationSource;
};

export type Interpretation =
  | PhiHoaInterpretation
  | CachCucInterpretation
  | PalaceRelationInterpretation
  | StarInterpretation;

export type InterpretationSection = {
  section_id: string;
  title: string;
  interpretations: Interpretation[];
};

export type PalaceInterpretationData = {
  palace: string;
  palace_name: string;
  sections: InterpretationSection[];
};

// Query result
export type InterpretationMatch = {
  interpretation: Interpretation;
  section: string;
  matchScore: number;
  matchReasons: string[];
};
