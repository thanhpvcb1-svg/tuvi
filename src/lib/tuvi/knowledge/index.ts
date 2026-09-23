/**
 * Knowledge Crawler Module
 * 
 * Crawl and parse Tử Vi knowledge from tuvi.cohoc.net
 * 
 * Structure:
 * - 1 CUNG = 1 FILE
 * - 1 FILE = NHIỀU SECTION
 * - 1 SECTION = NHIỀU KNOWLEDGE BLOCK
 * - 1 KNOWLEDGE BLOCK = 1 LUẬN ĐIỂM ĐỘC LẬP
 */

// Types
export * from "./types";

// Constants
export * from "./constants";

// Utils
export * from "./utils";

// Extractor
export {
  extractSectionContext,
  extractBlockConditions,
  detectPalaceFromUrl,
  detectPalaceFromContent,
} from "./extractor";

// Parser
export {
  parseHtml,
  splitIntoBlocks,
  processRawSections,
  parse,
} from "./parser";

// Storage
export {
  getPalaceFilePath,
  getUnclassifiedFilePath,
  loadPalaceKnowledge,
  savePalaceKnowledge,
  mergeSections,
  saveSections,
  getPalaceStats,
  listPalaceFiles,
} from "./storage";

// Palace Interpretation
export * from "./interpretationTypes";
export {
  queryPalaceInterpretations,
  formatInterpretationForDisplay,
  hasPalaceData,
  getAvailablePalaces,
  type PalaceQueryContext,
} from "./palaceInterpretation";

// Cohoc Parser
export {
  parseCohocText,
  convertToKnowledgeFile,
  parseAndConvert,
  type ParsedBlock,
  type ParsedConditions,
} from "./cohocParser";

// Knowledge Mapper
export {
  buildPalaceContext,
  mapKnowledgeToPalace,
  mapKnowledgeToChart,
  getTopInterpretations,
  searchKnowledge,
  type ChartContext,
  type PalaceMappingContext,
  type MappingResult,
} from "./knowledgeMapper";

// Palace Knowledge Query (3 tri thức ưu tiên)
export {
  queryPalaceKnowledge,
  hasPalaceKnowledge,
  getAvailablePalaces as getKnowledgePalaces,
  formatSource,
  type KnowledgeType,
  type KnowledgeItem,
  type PhiHoaItem,
  type PalaceKnowledgeResult,
  type QueryContext as PalaceQueryCtx,
} from "./palaceKnowledgeQuery";

// Improved Knowledge Matcher (NEW - Better matching logic)
export {
  normalizeStarName,
  normalizeBranch,
  normalizeStem,
  normalizePalace,
  parseConditionText,
  matchBlock,
  queryKnowledge,
  getTopKnowledge,
  extractStarsFromPalace,
  extractMutagensFromPalace,
  isMainStar,
  SCORE_WEIGHTS,
  STAR_ALIASES,
  type MatchResult,
  type MatchType,
  type MatchContext,
  type RawBlock,
  type PhiHoaFlow,
} from "./improvedMatcher";

// Improved Knowledge Service (NEW - Integration layer)
export {
  queryPalaceKnowledgeImproved,
  hasImprovedKnowledge,
  getAvailablePalacesImproved,
  buildMatchContext,
  formatMatchResult,
  type KnowledgeQueryResult,
} from "./improvedKnowledgeService";
