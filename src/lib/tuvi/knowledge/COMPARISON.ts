/**
 * Comparison: Old vs New Knowledge Matching Logic
 * 
 * File này demo sự khác biệt giữa logic matching cũ và mới
 */

// ============ VẤN ĐỀ CỦA LOGIC CŨ ============

/**
 * 1. STAR NAME MATCHING KHÔNG CHÍNH XÁC
 * 
 * Logic cũ:
 * - Chỉ normalize cơ bản (lowercase, remove diacritics)
 * - Không xử lý aliases
 * 
 * Ví dụ: "Phá Quân" vs "phá quân" vs "Phá quân" có thể không match
 * 
 * Logic mới:
 * - Có STAR_ALIASES map đầy đủ
 * - normalizeStarName() xử lý tất cả variants
 */

/**
 * 2. CONDITION TEXT KHÔNG ĐƯỢC PARSE
 * 
 * Logic cũ:
 * - Chỉ dựa vào conditions JSON
 * - Nhiều block có conditions rỗng nhưng condition_text chứa thông tin
 * 
 * Ví dụ block:
 * {
 *   "condition_text": "Cung Mệnh an tại Tuất có Phá quân",
 *   "conditions": { "required_stars": [] }  // RỖNG!
 * }
 * 
 * Logic mới:
 * - parseConditionText() extract thông tin từ text
 * - Merge với conditions JSON
 */

/**
 * 3. SCORING KHÔNG HỢP LÝ
 * 
 * Logic cũ:
 * - Tổ hợp sao: 10 + 2*n điểm
 * - Single star: 10 điểm
 * - Position: 5 điểm
 * 
 * Vấn đề: Tổ hợp 2 sao (14đ) không cao hơn nhiều so với single star (10đ)
 * 
 * Logic mới:
 * - STAR_COMBINATION_EXACT: 100 + 10*n điểm
 * - MAIN_STAR_SINGLE: 35 điểm
 * - POSITION_EXACT: 50 điểm
 * - PHI_HOA_EXACT: 80 điểm
 */

/**
 * 4. PHI HÓA MATCHING PHỨC TẠP
 * 
 * Logic cũ:
 * - Chỉ check transformation type
 * - Không verify source/target palace
 * 
 * Logic mới:
 * - Check cả type + source + target
 * - Có fallback nếu chỉ match type
 */

/**
 * 5. M_CODE KHÔNG ĐƯỢC XỬ LÝ
 * 
 * Logic cũ:
 * - Bỏ qua additional_conditions
 * 
 * Ví dụ: "M_CODE:TUẤT" trong additional_conditions không được match
 * 
 * Logic mới:
 * - Extract và match M_CODE
 */

// ============ SO SÁNH KẾT QUẢ ============

/**
 * Test case: Cung Mệnh tại Tuất, can Nhâm, có Phá Quân + Văn Xương
 * 
 * LOGIC CŨ có thể trả về:
 * 1. "Phá Quân thủ mệnh" (10đ) - match single star
 * 2. "Cung tại Tuất" (5đ) - match position
 * 3. "Văn Xương thủ mệnh" (10đ) - match single star
 * 
 * LOGIC MỚI trả về:
 * 1. "Văn Xương Phá Quân đồng cung" (120đ) - star combination
 * 2. "Cung Nhâm Tuất" (70đ) - position + stem
 * 3. "Phá Quân thủ mệnh" (35đ) - main star
 * 
 * => Logic mới ưu tiên tổ hợp sao và vị trí cung chính xác hơn
 */

// ============ MIGRATION GUIDE ============

/**
 * Để sử dụng logic mới:
 * 
 * TRƯỚC:
 * import { queryPalaceKnowledge } from "./knowledgeService";
 * const results = queryPalaceKnowledge(context);
 * 
 * SAU:
 * import { queryPalaceKnowledgeImproved } from "./improvedKnowledgeService";
 * const results = queryPalaceKnowledgeImproved(palace, { gender: "male" });
 * 
 * Hoặc sử dụng trực tiếp matcher:
 * import { queryKnowledge, buildMatchContext } from "./improvedMatcher";
 * const context = buildMatchContext(palace);
 * const results = queryKnowledge(blocks, context);
 */

export const COMPARISON_NOTES = {
  oldLogic: {
    starMatching: "Basic normalize only",
    conditionParsing: "JSON conditions only",
    scoring: "Low differentiation (10-20 points)",
    phiHoa: "Type only",
    mCode: "Not supported",
  },
  newLogic: {
    starMatching: "Full aliases + normalize",
    conditionParsing: "JSON + text parsing",
    scoring: "High differentiation (20-120 points)",
    phiHoa: "Type + source + target",
    mCode: "Fully supported",
  },
};
