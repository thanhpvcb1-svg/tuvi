/**
 * CoHoc.net Integration Module
 * 
 * Fetches and parses Tử Vi charts from tuvi.cohoc.net
 * 
 * Usage:
 * ```typescript
 * import { fetchCoHocChart } from "./lib/cohoc";
 * 
 * const result = await fetchCoHocChart({
 *   name: "Thành",
 *   birthDate: "1998-10-26",
 *   birthHour: 23,
 *   birthMinute: 30,
 *   gender: "male",
 *   targetYear: 2026,
 * });
 * 
 * if ("error" in result) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.palaces);
 * }
 * ```
 */

// Types
export type {
  CoHocInput,
  CoHocChartResult,
  CoHocError,
  CoHocResponse,
  CoHocPalace,
  CoHocStar,
  CoHocChartMeta,
  LunarDate,
} from "./types";

// Client
export { CoHocClient, fetchCoHocChart } from "./client";

// Parser (for testing with fixtures)
export { parseCoHocHtml, parseCoHocFixture } from "./parser";

// Calendar utilities
export { 
  solarToLunar, 
  getHourBranch, 
  getCohocGio,
  isValidSolarDate,
  adjustForTyHour,
} from "./calendar";

// Constants
export { 
  HOUR_BRANCHES,
  COHOC_HOUR_MAPPING,
  PALACE_KEY_MAP,
} from "./constants";
