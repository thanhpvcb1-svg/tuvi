/**
 * Cổ Học Parser
 * Parse tri thức từ file text (format tuvicohoc) thành JSON có cấu trúc
 */

import type { KnowledgeInterpretation, KnowledgeSection, KnowledgeFile, KnowledgeSource } from "./knowledgeService";

// ============ TYPES ============

export type ParsedBlock = {
  palace: string;
  title: string;
  conditions: ParsedConditions;
  text: string;
  source: KnowledgeSource;
};

export type ParsedConditions = {
  position?: string;           // Địa chi: Tí, Sửu, Dần...
  heavenlyStem?: string;       // Thiên can: Giáp, Ất...
  requiredStars?: string[];    // Sao tọa thủ
  meetingStars?: string[];     // Sao hội hợp
  mutagenInPalace?: string[];  // Hóa Lộc, Quyền, Khoa, Kỵ tọa thủ
  phiHoa?: {                   // Phi Hóa
    type: string;              // loc, quyen, khoa, ky
    sourcePalace: string;
    targetPalace: string;
  };
  mCode?: string;              // M Điền, M Phúc, M Quan...
  cungKhi?: string;            // đại cát, đại hung, hữu cát...
  laiNhanCung?: string;        // Lai nhân cung tại cung nào
};

// ============ CONSTANTS ============

const PALACE_PATTERNS: Record<string, RegExp> = {
  menh: /CUNG MỆNH|Cung Mệnh an tại/i,
  than: /CUNG THÂN|Cung Thân/i,
  phu_mau: /CUNG PHỤ MẪU|Cung Phụ mẫu/i,
  phuc_duc: /CUNG PHÚC ĐỨC|Cung Phúc đức/i,
  dien_trach: /CUNG ĐIỀN TRẠCH|Cung Điền trạch/i,
  quan_loc: /CUNG QUAN LỘC|Cung Quan lộc/i,
  no_boc: /CUNG NÔ BỘC|Cung Nô bộc/i,
  thien_di: /CUNG THIÊN DI|Cung Thiên di/i,
  tat_ach: /CUNG TẬT ÁCH|Cung Tật ách/i,
  tai_bach: /CUNG TÀI BẠCH|Cung Tài bạch/i,
  tu_tuc: /CUNG TỬ TỨC|Cung Tử tức|Cung Tử nữ/i,
  phu_the: /CUNG PHU THÊ|Cung Phu thê/i,
  huynh_de: /CUNG HUYNH ĐỆ|Cung Huynh đệ/i,
};

const BRANCH_MAP: Record<string, string> = {
  "tí": "ty", "tý": "ty", "ty": "ty",
  "sửu": "suu", "suu": "suu",
  "dần": "dan", "dan": "dan",
  "mão": "mao", "mao": "mao",
  "thìn": "thin", "thin": "thin",
  "tị": "ti", "ti": "ti", "tỵ": "ti",
  "ngọ": "ngo", "ngo": "ngo",
  "mùi": "mui", "mui": "mui",
  "thân": "than", "than": "than",
  "dậu": "dau", "dau": "dau",
  "tuất": "tuat", "tuat": "tuat",
  "hợi": "hoi", "hoi": "hoi",
};

const STEM_MAP: Record<string, string> = {
  "giáp": "giap", "giap": "giap",
  "ất": "at", "at": "at",
  "bính": "binh", "binh": "binh",
  "đinh": "dinh", "dinh": "dinh",
  "mậu": "mau", "mau": "mau",
  "kỷ": "ky", "ky": "ky",
  "canh": "canh",
  "tân": "tan", "tan": "tan",
  "nhâm": "nham", "nham": "nham",
  "quý": "quy", "quy": "quy",
};

const PALACE_NAME_MAP: Record<string, string> = {
  "mệnh": "menh", "menh": "menh",
  "phụ mẫu": "phu_mau", "phu mau": "phu_mau",
  "phúc đức": "phuc_duc", "phuc duc": "phuc_duc",
  "điền trạch": "dien_trach", "dien trach": "dien_trach",
  "quan lộc": "quan_loc", "quan loc": "quan_loc",
  "nô bộc": "no_boc", "no boc": "no_boc", "giao hữu": "no_boc",
  "thiên di": "thien_di", "thien di": "thien_di",
  "tật ách": "tat_ach", "tat ach": "tat_ach",
  "tài bạch": "tai_bach", "tai bach": "tai_bach",
  "tử tức": "tu_tuc", "tu tuc": "tu_tuc", "tử nữ": "tu_tuc",
  "phu thê": "phu_the", "phu the": "phu_the",
  "huynh đệ": "huynh_de", "huynh de": "huynh_de",
};

const STAR_ALIASES: Record<string, string> = {
  "tử vi": "tu_vi",
  "thiên cơ": "thien_co",
  "thái dương": "thai_duong",
  "vũ khúc": "vu_khuc",
  "thiên đồng": "thien_dong",
  "liêm trinh": "liem_trinh",
  "thiên phủ": "thien_phu",
  "thái âm": "thai_am",
  "tham lang": "tham_lang",
  "cự môn": "cu_mon",
  "thiên tướng": "thien_tuong",
  "thiên lương": "thien_luong",
  "thất sát": "that_sat",
  "phá quân": "pha_quan",
  "văn xương": "van_xuong",
  "văn khúc": "van_khuc",
  "tả phù": "ta_phu",
  "hữu bật": "huu_bat",
  "thiên khôi": "thien_khoi",
  "thiên việt": "thien_viet",
  "lộc tồn": "loc_ton",
  "kình dương": "kinh_duong",
  "đà la": "da_la",
  "hỏa tinh": "hoa_tinh",
  "linh tinh": "linh_tinh",
  "địa không": "dia_khong",
  "địa kiếp": "dia_kiep",
  "thiên mã": "thien_ma",
  "hồng loan": "hong_loan",
  "thiên hỉ": "thien_hi",
  "âm sát": "am_sat",
  "thiên khốc": "thien_khoc",
  "thiên hư": "thien_hu",
  "thiên hình": "thien_hinh",
  "thiên riêu": "thien_rieu",
  "hàm trì": "ham_tri",
  "hóa lộc": "hoa_loc",
  "hóa quyền": "hoa_quyen",
  "hóa khoa": "hoa_khoa",
  "hóa kỵ": "hoa_ky",
};

// ============ PARSER FUNCTIONS ============

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract position (branch) from title
 * Example: "Cung Mệnh an tại Tuất" -> "tuat"
 */
function extractPosition(title: string): string | undefined {
  const match = title.match(/an tại\s+(\w+)/i);
  if (match) {
    const branch = normalizeText(match[1]);
    return BRANCH_MAP[branch];
  }
  return undefined;
}

/**
 * Extract heavenly stem from title or text
 * Example: "can Nhâm" -> "nham"
 */
function extractHeavenlyStem(text: string): string | undefined {
  const match = text.match(/can\s+(\w+)/i);
  if (match) {
    const stem = normalizeText(match[1]);
    return STEM_MAP[stem];
  }
  return undefined;
}

/**
 * Extract stars from title
 * Example: "có Phá quân" -> ["pha_quan"]
 */
function extractStars(title: string): string[] {
  const stars: string[] = [];
  const normalized = normalizeText(title);
  
  for (const [alias, id] of Object.entries(STAR_ALIASES)) {
    const normalizedAlias = normalizeText(alias);
    if (normalized.includes(normalizedAlias)) {
      stars.push(id);
    }
  }
  
  return stars;
}

/**
 * Extract phi hoa information from title
 * Example: "có Lộc Tật" -> { type: "loc", sourcePalace: current, targetPalace: "tat_ach" }
 */
function extractPhiHoa(title: string, currentPalace: string): ParsedConditions["phiHoa"] | undefined {
  // Pattern: "có Lộc Tật", "có Kỵ Phúc", "có Quyền Di"
  const phiHoaMatch = title.match(/có\s+(Lộc|Quyền|Khoa|Kỵ)\s+(\w+)/i);
  if (phiHoaMatch) {
    const typeMap: Record<string, string> = {
      "lộc": "loc", "loc": "loc",
      "quyền": "quyen", "quyen": "quyen",
      "khoa": "khoa",
      "kỵ": "ky", "ky": "ky",
    };
    
    const palaceShortMap: Record<string, string> = {
      "mệnh": "menh", "menh": "menh",
      "phụ": "phu_mau", "phu": "phu_mau",
      "phúc": "phuc_duc", "phuc": "phuc_duc",
      "điền": "dien_trach", "dien": "dien_trach",
      "quan": "quan_loc",
      "nô": "no_boc", "no": "no_boc",
      "di": "thien_di",
      "tật": "tat_ach", "tat": "tat_ach",
      "tài": "tai_bach", "tai": "tai_bach",
      "tử": "tu_tuc", "tu": "tu_tuc",
      "phối": "phu_the", "phoi": "phu_the",
      "huynh": "huynh_de",
    };
    
    const type = typeMap[normalizeText(phiHoaMatch[1])];
    const targetShort = normalizeText(phiHoaMatch[2]);
    const targetPalace = palaceShortMap[targetShort];
    
    if (type && targetPalace) {
      return {
        type,
        sourcePalace: currentPalace,
        targetPalace,
      };
    }
  }
  
  return undefined;
}

/**
 * Extract M code from title
 * Example: "có M Điền" -> "M Điền"
 */
function extractMCode(title: string): string | undefined {
  const match = title.match(/M\s+(\w+)/i);
  if (match) {
    return `M ${match[1]}`;
  }
  return undefined;
}

/**
 * Extract mutagen in palace
 * Example: "có Hóa lộc" -> ["loc"]
 */
function extractMutagenInPalace(title: string): string[] | undefined {
  const mutagens: string[] = [];
  
  if (/Hóa\s*lộc|hoa_loc/i.test(title)) mutagens.push("loc");
  if (/Hóa\s*quyền|hoa_quyen/i.test(title)) mutagens.push("quyen");
  if (/Hóa\s*khoa|hoa_khoa/i.test(title)) mutagens.push("khoa");
  if (/Hóa\s*kỵ|hoa_ky/i.test(title)) mutagens.push("ky");
  
  return mutagens.length > 0 ? mutagens : undefined;
}

/**
 * Extract cung khi from title
 * Example: "Cung khí đại cát" -> "dai_cat"
 */
function extractCungKhi(title: string): string | undefined {
  if (/đại cát|dai cat/i.test(title)) return "dai_cat";
  if (/đại hung|dai hung/i.test(title)) return "dai_hung";
  if (/hữu cát|huu cat/i.test(title)) return "huu_cat";
  if (/tiểu hung|tieu hung/i.test(title)) return "tieu_hung";
  return undefined;
}

/**
 * Parse source citation
 * Example: "Tử vi đẩu số tinh hoa tập thành - Đại Đức Sơn Nhân"
 */
function parseSource(line: string): KnowledgeSource {
  // Pattern: Book - Author or Book - Author - Translator
  const parts = line.split(" - ").map(p => p.trim());
  
  return {
    book: parts[0] || "Unknown",
    author: parts[1] || "Unknown",
    translator: parts[2] || null,
  };
}

/**
 * Detect current palace from section header
 */
function detectPalace(line: string): string | null {
  for (const [palace, pattern] of Object.entries(PALACE_PATTERNS)) {
    if (pattern.test(line)) {
      return palace;
    }
  }
  return null;
}

/**
 * Parse a single block of knowledge
 */
function parseBlock(
  title: string,
  text: string,
  source: KnowledgeSource,
  currentPalace: string
): ParsedBlock {
  const conditions: ParsedConditions = {};
  
  // Extract position
  const position = extractPosition(title);
  if (position) conditions.position = position;
  
  // Extract heavenly stem
  const stem = extractHeavenlyStem(title);
  if (stem) conditions.heavenlyStem = stem;
  
  // Extract stars
  const stars = extractStars(title);
  if (stars.length > 0) conditions.requiredStars = stars;
  
  // Extract phi hoa
  const phiHoa = extractPhiHoa(title, currentPalace);
  if (phiHoa) conditions.phiHoa = phiHoa;
  
  // Extract M code
  const mCode = extractMCode(title);
  if (mCode) conditions.mCode = mCode;
  
  // Extract mutagen in palace
  const mutagens = extractMutagenInPalace(title);
  if (mutagens) conditions.mutagenInPalace = mutagens;
  
  // Extract cung khi
  const cungKhi = extractCungKhi(title);
  if (cungKhi) conditions.cungKhi = cungKhi;
  
  return {
    palace: currentPalace,
    title,
    conditions,
    text,
    source,
  };
}

/**
 * Main parser function
 * Parse the entire cohoc text file into structured knowledge
 */
export function parseCohocText(content: string): Map<string, ParsedBlock[]> {
  const result = new Map<string, ParsedBlock[]>();
  const lines = content.split(/\r?\n/);
  
  let currentPalace = "menh";
  let currentTitle = "";
  let currentText: string[] = [];
  let currentSource: KnowledgeSource = { book: "Unknown", author: "Unknown", translator: null };
  
  const saveCurrentBlock = () => {
    if (currentTitle && currentText.length > 0) {
      const block = parseBlock(currentTitle, currentText.join("\n"), currentSource, currentPalace);
      if (!result.has(currentPalace)) {
        result.set(currentPalace, []);
      }
      result.get(currentPalace)!.push(block);
    }
    currentTitle = "";
    currentText = [];
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check for palace header (uppercase CUNG)
    const detectedPalace = detectPalace(line);
    if (detectedPalace) {
      saveCurrentBlock();
      currentPalace = detectedPalace;
      continue;
    }
    
    // Check for section title patterns
    // Pattern 1: "Cung Menh an tai Tuat co Pha quan" (không dấu)
    // Pattern 2: "Cung Mệnh an tại Tuất có Phá quân" (có dấu)
    const isSectionTitle = 
      /^Cung\s+\S+\s+an\s+t[aạ]i/i.test(line) ||
      /^Cung\s+\S+\s+c[oó]\s+/i.test(line) ||
      /^Cung\s+\S+\s+thi[eê]n\s+can/i.test(line) ||
      /^Cung\s+\S+\s+[đd][iị]a\s+chi/i.test(line) ||
      /^Cung\s+\S+\s+phi\s+h[oó]a/i.test(line);
    
    if (isSectionTitle) {
      saveCurrentBlock();
      currentTitle = line;
      // Also detect palace from title if not set
      const palaceFromTitle = detectPalaceFromTitle(line);
      if (palaceFromTitle) {
        currentPalace = palaceFromTitle;
      }
      continue;
    }
    
    // Check for source citation (usually at end of block)
    if (isSourceLine(line)) {
      currentSource = parseSource(line);
      saveCurrentBlock();
      continue;
    }
    
    // Regular content line - add to current block
    if (currentTitle) {
      currentText.push(line);
    } else if (line.length > 20 && !line.startsWith("Điểm") && !line.startsWith("Tọa thủ")) {
      // Start a new block with this line as content if it looks like content
      // This handles cases where title might be missing
      currentText.push(line);
    }
  }
  
  // Don't forget the last block
  saveCurrentBlock();
  
  return result;
}

/**
 * Detect palace from section title
 */
function detectPalaceFromTitle(title: string): string | null {
  const normalized = normalizeText(title);
  
  const palacePatterns: Array<[string, RegExp]> = [
    ["menh", /cung\s+menh/],
    ["phu_mau", /cung\s+phu\s*mau/],
    ["phuc_duc", /cung\s+phuc\s*duc/],
    ["dien_trach", /cung\s+dien\s*trach/],
    ["quan_loc", /cung\s+quan\s*loc/],
    ["no_boc", /cung\s+no\s*boc/],
    ["thien_di", /cung\s+thien\s*di/],
    ["tat_ach", /cung\s+tat\s*ach/],
    ["tai_bach", /cung\s+tai\s*bach/],
    ["tu_tuc", /cung\s+(tu\s*tuc|tu\s*nu)/],
    ["phu_the", /cung\s+phu\s*the/],
    ["huynh_de", /cung\s+huynh\s*de/],
    ["than", /cung\s+than/],
  ];
  
  for (const [palace, pattern] of palacePatterns) {
    if (pattern.test(normalized)) {
      return palace;
    }
  }
  
  return null;
}

/**
 * Check if line is a source citation
 */
function isSourceLine(line: string): boolean {
  const sourcePatterns = [
    /^Tử vi đẩu số/i,
    /^Giáo trình/i,
    /^Đẩu số/i,
    /^Phi tinh/i,
    /^Trung Châu/i,
    /^Lai Nhân Cung/i,
    /^Khai quán nhân/i,
    /^Cửu Thiên Phi Tinh/i,
    /^Đoán vận/i,
    /^Hà lạc phái/i,
    /^Ứng dụng thuyết/i,
    /^Hỉ kị tinh đẩu/i,
    /^Tượng số tâm học/i,
    /^Cửu cửu bí nghi/i,
    /^Đồng bộ đoạn quyết/i,
    /^Tiên thiên tứ hóa/i,
    /^Kinh nghiệm của/i,
    /^Cổ thư bắc phái/i,
    /^Thiên cơ phái/i,
    /^Cao đoạn tử vi/i,
  ];
  
  return sourcePatterns.some(p => p.test(line));
}

/**
 * Convert parsed blocks to KnowledgeFile format
 */
export function convertToKnowledgeFile(palace: string, blocks: ParsedBlock[]): KnowledgeFile {
  const sections: KnowledgeSection[] = [];
  
  // Group blocks by type
  const groupedBlocks = new Map<string, ParsedBlock[]>();
  
  for (const block of blocks) {
    let sectionType = "general";
    
    if (block.conditions.phiHoa) {
      sectionType = "phi_hoa";
    } else if (block.conditions.mCode) {
      sectionType = "m_code";
    } else if (block.conditions.requiredStars?.length) {
      sectionType = "chinh_tinh";
    } else if (block.conditions.mutagenInPalace?.length) {
      sectionType = "hoa_tinh";
    } else if (block.conditions.heavenlyStem) {
      sectionType = "thien_can";
    } else if (block.conditions.position) {
      sectionType = "dia_chi";
    } else if (block.conditions.cungKhi) {
      sectionType = "cung_khi";
    }
    
    if (!groupedBlocks.has(sectionType)) {
      groupedBlocks.set(sectionType, []);
    }
    groupedBlocks.get(sectionType)!.push(block);
  }
  
  // Convert groups to sections
  const sectionTitles: Record<string, string> = {
    phi_hoa: "Phi Cung Tứ Hóa",
    m_code: "M Code - Quan hệ cung",
    chinh_tinh: "Chính tinh tọa thủ",
    hoa_tinh: "Hóa tinh tọa thủ",
    thien_can: "Thiên can cung",
    dia_chi: "Địa chi cung",
    cung_khi: "Cung khí",
    general: "Luận giải tổng quát",
  };
  
  for (const [sectionType, sectionBlocks] of groupedBlocks) {
    const interpretations: KnowledgeInterpretation[] = sectionBlocks.map((block, idx) => {
      const interp: KnowledgeInterpretation = {
        id: `${palace}_${sectionType}_${idx + 1}`,
        type: determineInterpType(block),
        text: block.text,
        source: block.source,
      };
      
      // Add conditions
      if (block.conditions.requiredStars?.length) {
        interp.required_stars = block.conditions.requiredStars;
      }
      if (block.conditions.position) {
        interp.conditions = interp.conditions || {};
        interp.conditions.position = [block.conditions.position];
      }
      if (block.conditions.heavenlyStem) {
        interp.conditions = interp.conditions || {};
        interp.conditions.heavenly_stem = block.conditions.heavenlyStem;
      }
      if (block.conditions.mutagenInPalace) {
        interp.conditions = interp.conditions || {};
        interp.conditions.mutagen_in_palace = block.conditions.mutagenInPalace;
      }
      if (block.conditions.phiHoa) {
        interp.source_palace = block.conditions.phiHoa.sourcePalace;
        interp.target_palace = block.conditions.phiHoa.targetPalace;
        interp.conditions = interp.conditions || {};
        interp.conditions.transformation = block.conditions.phiHoa.type;
      }
      if (block.conditions.mCode) {
        interp.relation_code = block.conditions.mCode;
      }
      
      return interp;
    });
    
    sections.push({
      section_id: `${palace}_${sectionType}`,
      title: sectionTitles[sectionType] || sectionType,
      interpretations,
    });
  }
  
  return {
    palace,
    palace_name: getPalaceDisplayName(palace),
    sections,
  };
}

/**
 * Determine interpretation type from block
 */
function determineInterpType(block: ParsedBlock): string {
  if (block.conditions.phiHoa) {
    return `phi_${block.conditions.phiHoa.type}`;
  }
  if (block.conditions.mCode) {
    return "palace_relation";
  }
  if (block.conditions.mutagenInPalace?.length) {
    return "mutagen_in_palace";
  }
  if (block.conditions.requiredStars?.length) {
    return "star_in_palace";
  }
  if (block.conditions.heavenlyStem) {
    return "heavenly_stem";
  }
  if (block.conditions.cungKhi) {
    return "cung_khi";
  }
  return "general";
}

/**
 * Get display name for palace
 */
function getPalaceDisplayName(palace: string): string {
  const names: Record<string, string> = {
    menh: "Mệnh",
    than: "Thân",
    phu_mau: "Phụ Mẫu",
    phuc_duc: "Phúc Đức",
    dien_trach: "Điền Trạch",
    quan_loc: "Quan Lộc",
    no_boc: "Nô Bộc",
    thien_di: "Thiên Di",
    tat_ach: "Tật Ách",
    tai_bach: "Tài Bạch",
    tu_tuc: "Tử Tức",
    phu_the: "Phu Thê",
    huynh_de: "Huynh Đệ",
  };
  return names[palace] || palace;
}

/**
 * Main export function - parse file and return all knowledge files
 */
export function parseAndConvert(content: string): KnowledgeFile[] {
  const parsed = parseCohocText(content);
  const files: KnowledgeFile[] = [];
  
  for (const [palace, blocks] of parsed) {
    if (blocks.length > 0) {
      files.push(convertToKnowledgeFile(palace, blocks));
    }
  }
  
  return files;
}
