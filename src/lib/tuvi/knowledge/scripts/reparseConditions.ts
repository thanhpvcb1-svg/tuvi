/**
 * Re-parse condition_text trong các file cohoc-full.json
 * Extract đầy đủ conditions để matching chính xác hơn
 * 
 * Usage: npx ts-node src/lib/tuvi/knowledge/scripts/reparseConditions.ts
 */

// ============ CONSTANTS ============

const BRANCH_PATTERNS = [
  /an tại\s+(Tý|Sửu|Dần|Mão|Thìn|Tị|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)/i,
  /tại\s+(Tý|Sửu|Dần|Mão|Thìn|Tị|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)/i,
  /cung\s+(Tý|Sửu|Dần|Mão|Thìn|Tị|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)/i,
  /địa chi(?:\s+là)?\s+(Tý|Sửu|Dần|Mão|Thìn|Tị|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)/i,
  /là\s+(NHÂM|GIÁP|ẤT|BÍNH|ĐINH|MẬU|KỶ|CANH|TÂN|QUÝ)\s+(TÝ|SỬU|DẦN|MÃO|THÌN|TỊ|NGỌ|MÙI|THÂN|DẬU|TUẤT|HỢI)/i,
];

const STEM_PATTERNS = [
  /can\s+(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)/i,
  /thiên can(?:\s+là)?\s+(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)/i,
  /là\s+(NHÂM|GIÁP|ẤT|BÍNH|ĐINH|MẬU|KỶ|CANH|TÂN|QUÝ)\s+(TÝ|SỬU|DẦN|MÃO|THÌN|TỊ|NGỌ|MÙI|THÂN|DẬU|TUẤT|HỢI)/i,
];

const BRANCH_MAP: Record<string, string> = {
  "tý": "TY", "ty": "TY", "tí": "TY",
  "sửu": "SUU", "suu": "SUU",
  "dần": "DAN", "dan": "DAN",
  "mão": "MAO", "mao": "MAO",
  "thìn": "THIN", "thin": "THIN",
  "tị": "TI", "ti": "TI", "tỵ": "TI",
  "ngọ": "NGO", "ngo": "NGO",
  "mùi": "MUI", "mui": "MUI",
  "thân": "THAN", "than": "THAN",
  "dậu": "DAU", "dau": "DAU",
  "tuất": "TUAT", "tuat": "TUAT",
  "hợi": "HOI", "hoi": "HOI",
};

const STEM_MAP: Record<string, string> = {
  "giáp": "GIAP", "giap": "GIAP",
  "ất": "AT", "at": "AT",
  "bính": "BINH", "binh": "BINH",
  "đinh": "DINH", "dinh": "DINH",
  "mậu": "MAU", "mau": "MAU",
  "kỷ": "KY", "ky": "KY",
  "canh": "CANH",
  "tân": "TAN", "tan": "TAN",
  "nhâm": "NHAM", "nham": "NHAM",
  "quý": "QUY", "quy": "QUY",
};

const PALACE_SHORT_MAP: Record<string, string> = {
  "mệnh": "MENH", "menh": "MENH",
  "phụ": "PHU_MAU", "phu": "PHU_MAU", "phụ mẫu": "PHU_MAU",
  "phúc": "PHUC_DUC", "phuc": "PHUC_DUC", "phúc đức": "PHUC_DUC",
  "điền": "DIEN_TRACH", "dien": "DIEN_TRACH", "điền trạch": "DIEN_TRACH",
  "quan": "QUAN_LOC", "quan lộc": "QUAN_LOC",
  "nô": "NO_BOC", "no": "NO_BOC", "nô bộc": "NO_BOC",
  "di": "THIEN_DI", "thiên di": "THIEN_DI",
  "tật": "TAT_ACH", "tat": "TAT_ACH", "tật ách": "TAT_ACH",
  "tài": "TAI_BACH", "tai": "TAI_BACH", "tài bạch": "TAI_BACH",
  "tử": "TU_TUC", "tu": "TU_TUC", "tử tức": "TU_TUC",
  "thê": "PHU_THE", "the": "PHU_THE", "phu thê": "PHU_THE",
  "huynh": "HUYNH_DE", "huynh đệ": "HUYNH_DE",
};

// Danh sách 14 chính tinh
const MAIN_STARS = [
  "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh",
  "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương",
  "Thất Sát", "Phá Quân"
];

// Danh sách phụ tinh quan trọng
const MINOR_STARS = [
  "Văn Xương", "Văn Khúc", "Tả Phụ", "Hữu Bật", "Thiên Khôi", "Thiên Việt",
  "Lộc Tồn", "Thiên Mã", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh",
  "Địa Không", "Địa Kiếp", "Hồng Loan", "Thiên Hỉ", "Đào Hoa", "Âm Sát",
  "Thiên Khốc", "Thiên Hư", "Thiên Hình", "Thiên Riêu", "Hàm Trì",
  "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"
];

const ALL_STARS = [...MAIN_STARS, ...MINOR_STARS];

// ============ TYPES ============

type BlockConditions = {
  palace: string | null;
  position: string | null;
  heavenly_stem: string | null;
  gender: string | null;
  required_stars: string[];
  excluded_stars: string[];
  same_palace_stars: string[];
  meeting_stars: string[];
  opposite_stars: string[];
  trine_stars: string[];
  transformations: string[];
  transformation_target: string[];
  additional_conditions: string[];
};

type Block = {
  block_id: string;
  condition_text: string;
  raw_text: string;
  conditions: BlockConditions;
  source: any;
  accuracy?: number;
};

type KnowledgeFile = {
  palace: string;
  source?: string;
  sections: Array<{
    section_id: string;
    title: string;
    blocks: Block[];
  }>;
};

// ============ PARSER FUNCTIONS ============

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

function extractPosition(conditionText: string): string | null {
  for (const pattern of BRANCH_PATTERNS) {
    const match = conditionText.match(pattern);
    if (match) {
      const branch = normalizeText(match[1]);
      return BRANCH_MAP[branch] || null;
    }
  }
  return null;
}

function extractHeavenlyStem(conditionText: string): string | null {
  for (const pattern of STEM_PATTERNS) {
    const match = conditionText.match(pattern);
    if (match) {
      const stem = normalizeText(match[1]);
      return STEM_MAP[stem] || null;
    }
  }
  return null;
}

function extractStars(conditionText: string): string[] {
  const stars: string[] = [];
  const text = conditionText;
  
  for (const star of ALL_STARS) {
    // Tìm tên sao trong text (case insensitive)
    const regex = new RegExp(star.replace(/\s+/g, "\\s*"), "i");
    if (regex.test(text)) {
      stars.push(star);
    }
  }
  
  return [...new Set(stars)];
}

function extractPhiHoa(conditionText: string, currentPalace: string): {
  transformations: string[];
  transformation_target: string[];
} | null {
  // Pattern 1: "có Lộc Tật", "có Kỵ Phúc", "có Quyền Di"
  const shortPattern = /có\s+(Lộc|Quyền|Khoa|Kỵ)\s+(Mệnh|Phụ|Phúc|Điền|Quan|Nô|Di|Tật|Tài|Tử|Thê|Huynh)/i;
  const shortMatch = conditionText.match(shortPattern);
  
  if (shortMatch) {
    const typeMap: Record<string, string> = {
      "lộc": "LOC", "quyền": "QUYEN", "khoa": "KHOA", "kỵ": "KY"
    };
    const type = typeMap[normalizeText(shortMatch[1])];
    const targetShort = normalizeText(shortMatch[2]);
    const target = PALACE_SHORT_MAP[targetShort];
    
    if (type && target) {
      return {
        transformations: [type],
        transformation_target: [target]
      };
    }
  }
  
  // Pattern 2: "phi hóa Lộc tới cung Tật Ách"
  const fullPattern = /(?:phi\s+)?(?:hóa\s+)?(Lộc|Quyền|Khoa|Kỵ)\s+(?:nhập|tới|đến)\s+(?:cung\s+)?(Mệnh|Phụ Mẫu|Phúc Đức|Điền Trạch|Quan Lộc|Nô Bộc|Thiên Di|Tật Ách|Tài Bạch|Tử Tức|Phu Thê|Huynh Đệ)/i;
  const fullMatch = conditionText.match(fullPattern);
  
  if (fullMatch) {
    const typeMap: Record<string, string> = {
      "lộc": "LOC", "quyền": "QUYEN", "khoa": "KHOA", "kỵ": "KY"
    };
    const type = typeMap[normalizeText(fullMatch[1])];
    const targetFull = normalizeText(fullMatch[2]);
    const target = PALACE_SHORT_MAP[targetFull];
    
    if (type && target) {
      return {
        transformations: [type],
        transformation_target: [target]
      };
    }
  }
  
  // Pattern 3: "Thuận Thủy Kị" - phi Kỵ
  if (/Thuận\s+Thủy\s+Kị|Lưu\s+Thủy\s+Kị/i.test(conditionText)) {
    return {
      transformations: ["KY"],
      transformation_target: []
    };
  }
  
  return null;
}

function extractMCode(conditionText: string): string | null {
  // Pattern: "có M Điền", "có M Phúc", "M_CODE:Tuất"
  const patterns = [
    /có\s+M\s+(\w+)/i,
    /M_CODE:(\w+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = conditionText.match(pattern);
    if (match) {
      return `M_CODE:${match[1]}`;
    }
  }
  
  return null;
}

function extractGender(conditionText: string): string | null {
  if (/nam\s+mệnh|nam\s+giới/i.test(conditionText)) return "MALE";
  if (/nữ\s+mệnh|nữ\s+giới/i.test(conditionText)) return "FEMALE";
  return null;
}

/**
 * Re-parse condition_text và cập nhật conditions object
 */
export function reparseConditions(block: Block, currentPalace: string): BlockConditions {
  const conditionText = block.condition_text || "";
  const existingConditions = block.conditions || {};
  
  // Start with existing conditions
  const conditions: BlockConditions = {
    palace: existingConditions.palace || currentPalace,
    position: existingConditions.position || null,
    heavenly_stem: existingConditions.heavenly_stem || null,
    gender: existingConditions.gender || null,
    required_stars: existingConditions.required_stars || [],
    excluded_stars: existingConditions.excluded_stars || [],
    same_palace_stars: existingConditions.same_palace_stars || [],
    meeting_stars: existingConditions.meeting_stars || [],
    opposite_stars: existingConditions.opposite_stars || [],
    trine_stars: existingConditions.trine_stars || [],
    transformations: existingConditions.transformations || [],
    transformation_target: existingConditions.transformation_target || [],
    additional_conditions: existingConditions.additional_conditions || [],
  };
  
  // Extract position if not set
  if (!conditions.position) {
    const position = extractPosition(conditionText);
    if (position) conditions.position = position;
  }
  
  // Extract heavenly stem if not set
  if (!conditions.heavenly_stem) {
    const stem = extractHeavenlyStem(conditionText);
    if (stem) conditions.heavenly_stem = stem;
  }
  
  // Extract stars - merge with existing
  const extractedStars = extractStars(conditionText);
  if (extractedStars.length > 0) {
    // Filter out phi hoa patterns like "Lộc Tật", "Kỵ Phúc"
    const phiHoaPattern = /^(Lộc|Quyền|Khoa|Kỵ)\s+(Mệnh|Phụ|Phúc|Điền|Quan|Nô|Di|Tật|Tài|Tử|Thê|Huynh)$/i;
    const realStars = extractedStars.filter(star => {
      // Check if this "star" is actually a phi hoa reference
      const isPhiHoa = conditions.required_stars?.some(s => phiHoaPattern.test(s));
      return !isPhiHoa && ALL_STARS.includes(star);
    });
    
    if (realStars.length > 0) {
      conditions.required_stars = [...new Set([...conditions.required_stars, ...realStars])];
    }
  }
  
  // Extract phi hoa
  if (conditions.transformations.length === 0) {
    const phiHoa = extractPhiHoa(conditionText, currentPalace);
    if (phiHoa) {
      conditions.transformations = phiHoa.transformations;
      conditions.transformation_target = phiHoa.transformation_target;
      
      // Remove fake stars that are actually phi hoa references
      // e.g., "Lộc Tật" is not a star, it's "Hóa Lộc nhập Tật Ách"
      const phiHoaFakeStars = ["Lộc Tật", "Lộc Phúc", "Lộc Di", "Lộc Quan", "Lộc Tài",
        "Quyền Tật", "Quyền Phúc", "Quyền Di", "Quyền Quan", "Quyền Tài",
        "Khoa Tật", "Khoa Phúc", "Khoa Di", "Khoa Quan", "Khoa Tài",
        "Kỵ Tật", "Kỵ Phúc", "Kỵ Di", "Kỵ Quan", "Kỵ Tài",
        "M Điền", "M Phúc", "M Quan", "M Tật", "M Di"];
      conditions.required_stars = conditions.required_stars.filter(
        s => !phiHoaFakeStars.some(fake => s.toLowerCase().includes(fake.toLowerCase()))
      );
    }
  }
  
  // Extract M_CODE
  const mCode = extractMCode(conditionText);
  if (mCode && !conditions.additional_conditions.includes(mCode)) {
    conditions.additional_conditions.push(mCode);
  }
  
  // Extract gender
  if (!conditions.gender) {
    const gender = extractGender(conditionText);
    if (gender) conditions.gender = gender;
  }
  
  // Clean up required_stars - remove non-star entries
  conditions.required_stars = conditions.required_stars.filter(star => {
    const normalized = star.toLowerCase();
    // Remove entries that are clearly not stars
    const nonStars = ["lộc tật", "lộc phúc", "lộc di", "quyền tật", "quyền di", 
      "khoa tật", "khoa phúc", "kỵ tật", "kỵ phúc", "m điền", "m phúc", "m quan",
      "các sao", "cung mệnh"];
    return !nonStars.some(ns => normalized.includes(ns));
  });
  
  return conditions;
}

/**
 * Process entire knowledge file
 */
export function processKnowledgeFile(data: KnowledgeFile): KnowledgeFile {
  const palace = data.palace;
  
  for (const section of data.sections) {
    for (const block of section.blocks) {
      block.conditions = reparseConditions(block, palace);
    }
  }
  
  return data;
}

/**
 * Main function - process all cohoc-full files
 */
export async function main() {
  // This would be run as a Node.js script
  // For now, export the functions for use in browser
  console.log("Re-parse conditions module loaded");
  console.log("Use processKnowledgeFile(data) to process a knowledge file");
}

// Export for use
export { extractPosition, extractHeavenlyStem, extractStars, extractPhiHoa, extractMCode };
