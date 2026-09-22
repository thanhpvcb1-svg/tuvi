/**
 * Solar to Lunar Calendar Converter
 * Uses iztro library for conversion
 */

import { astro } from "iztro";
import type { LunarDate } from "./types";
import { COHOC_HOUR_MAPPING } from "./constants";

/**
 * Convert hour (0-23) to hour branch index (0-11)
 * Special handling for Tý hour (23:00-00:59)
 */
export function getHourBranchIndex(hour: number): number {
  if (hour === 23 || hour === 0) return 0; // Tý
  return Math.floor((hour + 1) / 2);
}

/**
 * Get hour branch name from hour (0-23)
 */
export function getHourBranch(hour: number): string {
  const mapping = COHOC_HOUR_MAPPING[hour];
  return mapping?.branch || "Tý";
}

/**
 * Get CoHoc gio parameter from hour (0-23)
 */
export function getCohocGio(hour: number): number {
  const mapping = COHOC_HOUR_MAPPING[hour];
  return mapping?.cohocGio || 1;
}

/**
 * Convert solar date to lunar date using iztro
 * 
 * @param solarDate - Date string in YYYY-MM-DD format
 * @param hour - Hour (0-23)
 * @returns LunarDate object
 */
export function solarToLunar(solarDate: string, hour: number): LunarDate {
  const astroApi = astro as any;
  
  // Parse solar date
  const [year, month, day] = solarDate.split("-").map(Number);
  
  // Get hour branch index for iztro (0-11)
  const hourIndex = getHourBranchIndex(hour);
  
  try {
    // Use iztro to create astrolabe - it internally converts to lunar
    // We need to extract lunar date from the result
    const chart = astroApi.astrolabeBySolarDate?.(
      solarDate,
      hourIndex,
      "男", // gender doesn't affect date conversion
      true,
      "vi-VN"
    );
    
    if (chart?.lunarDate) {
      // iztro returns lunar date in format like "1998-9-8" or similar
      const lunarStr = String(chart.lunarDate);
      const parts = lunarStr.split("-").map(Number);
      
      return {
        year: parts[0] || year,
        month: parts[1] || month,
        day: parts[2] || day,
        isLeapMonth: chart.isLeapMonth || false,
        hourBranch: getHourBranch(hour),
        hourIndex,
      };
    }
    
    // Fallback: try to get from chineseDate
    if (chart?.chineseDate) {
      // Parse Chinese date format
      const match = chart.chineseDate.match(/(\d+)年.*?(\d+)月.*?(\d+)/);
      if (match) {
        return {
          year: parseInt(match[1], 10),
          month: parseInt(match[2], 10),
          day: parseInt(match[3], 10),
          isLeapMonth: chart.isLeapMonth || false,
          hourBranch: getHourBranch(hour),
          hourIndex,
        };
      }
    }
  } catch (error) {
    console.error("[CoHoc] Solar to lunar conversion error:", error);
  }
  
  // If iztro fails, use manual calculation (simplified)
  // This is a fallback - should rarely be needed
  return manualSolarToLunar(year, month, day, hour);
}

/**
 * Manual solar to lunar conversion (simplified fallback)
 * Note: This is approximate and should only be used as fallback
 */
function manualSolarToLunar(
  solarYear: number,
  solarMonth: number,
  solarDay: number,
  hour: number
): LunarDate {
  // Simplified conversion - lunar date is roughly 1 month behind solar
  // This is NOT accurate and should be replaced with proper algorithm
  // For now, we'll use the solar date as-is with a warning
  console.warn("[CoHoc] Using fallback lunar conversion - may be inaccurate");
  
  let lunarMonth = solarMonth - 1;
  let lunarYear = solarYear;
  let lunarDay = solarDay;
  
  if (lunarMonth < 1) {
    lunarMonth = 12;
    lunarYear -= 1;
  }
  
  // Adjust day (lunar months are 29-30 days)
  if (lunarDay > 30) {
    lunarDay = 30;
  }
  
  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    isLeapMonth: false,
    hourBranch: getHourBranch(hour),
    hourIndex: getHourBranchIndex(hour),
  };
}

/**
 * Handle special case: Tý hour (23:00-23:59)
 * In some Tu Vi schools, 23:00-23:59 belongs to the NEXT day
 * 
 * @param solarDate - Original solar date YYYY-MM-DD
 * @param hour - Hour (0-23)
 * @param useTyCuoi - If true, 23:00-23:59 uses next day
 * @returns Adjusted solar date
 */
export function adjustForTyHour(
  solarDate: string,
  hour: number,
  useTyCuoi: boolean = false
): string {
  // If hour is 23 and useTyCuoi is true, advance to next day
  if (hour === 23 && useTyCuoi) {
    const date = new Date(solarDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  }
  return solarDate;
}

/**
 * Validate solar date
 */
export function isValidSolarDate(dateStr: string): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  
  if (!year || !month || !day) return false;
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
