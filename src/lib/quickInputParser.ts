/**
 * Quick Input Parser
 * Parse text ngắn thành structured birth data
 */

export type ParsedBirthData = {
  fullName?: string;
  day?: string;
  month?: string;
  year?: string;
  birthHour?: string;
  birthMinute?: string;
  gender?: "male" | "female";
  calendarType?: "solar" | "lunar";
};

export type ParseResult = {
  success: boolean;
  partial: boolean;
  data: ParsedBirthData;
  missing: string[];
  errors: string[];
};

// Gender patterns - support with/without diacritics
const MALE_PATTERNS = /(?:^|[\s,])+(nam|male)(?:[\s,]+|$)/i;
const FEMALE_PATTERNS = /(?:^|[\s,])+(nữ|nu|nụ|female)(?:[\s,]+|$)/i;

// Calendar type patterns
const SOLAR_PATTERNS = /\b(dương|duong|dương\s*lịch|duong\s*lich|solar|dl)\b/i;
const LUNAR_PATTERNS = /\b(âm|am|âm\s*lịch|am\s*lich|lunar|al)\b/i;

// Date patterns - order matters, more specific first
const DATE_PATTERNS = [
  // "sinh ngày DD tháng MM năm YYYY"
  /sinh\s*ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i,
  // "ngày DD tháng MM năm YYYY"
  /ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i,
  // "DD tháng MM năm YYYY" (natural Vietnamese)
  /(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i,
  // DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  /(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/,
  // DD MM YYYY (space separated)
  /(\d{1,2})\s+(\d{1,2})\s+(\d{4})/,
];

// Time patterns
const TIME_PATTERNS = [
  // HH:MM or HH:mm
  /(\d{1,2}):(\d{2})/,
  // HHhMM or HH h MM
  /(\d{1,2})\s*h\s*(\d{1,2})?/i,
  // HH giờ MM phút
  /(\d{1,2})\s*giờ\s*(\d{1,2})?\s*(?:phút)?/i,
];

/**
 * Validate date
 */
const isValidDate = (day: number, month: number, year: number): boolean => {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

/**
 * Validate time
 */
const isValidTime = (hour: number, minute: number): boolean => {
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

/**
 * Extract name from text
 * Name is what remains after removing all recognized patterns
 */
const extractName = (text: string): string | undefined => {
  // Remove all recognized patterns: date, time, gender, calendar
  let cleaned = text
    // Date patterns
    .replace(/\d{1,2}[-\/.\s]\d{1,2}[-\/.\s]\d{4}/g, " ")
    .replace(/\d{1,2}\s*tháng\s*\d{1,2}\s*năm\s*\d{4}/gi, " ")
    .replace(/ngày\s*\d+\s*tháng\s*\d+\s*năm\s*\d+/gi, " ")
    .replace(/sinh\s*ngày/gi, " ")
    // Time patterns
    .replace(/\d{1,2}:\d{2}/g, " ")
    .replace(/\d{1,2}\s*h\s*\d{1,2}/gi, " ")
    .replace(/\d{1,2}\s*giờ\s*\d{0,2}\s*(?:phút)?/gi, " ")
    // Gender patterns
    .replace(/(?:^|\s)(nam|male|nữ|nu|nụ|female)(?:\s|$)/gi, " ")
    // Calendar patterns  
    .replace(/(?:^|\s)(dương\s*lịch|duong\s*lich|dương|duong|solar|dl|âm\s*lịch|am\s*lich|âm|am|lunar|al)(?:\s|$)/gi, " ")
    // Separators
    .replace(/[,\-\/\.]/g, " ")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    .trim();

  // Filter out any remaining standalone numbers
  const parts = cleaned.split(/\s+/).filter(p => p.length > 0 && !/^\d+$/.test(p));
  
  if (parts.length > 0) {
    // Take up to 3 words as name (Vietnamese names)
    const nameParts = parts.slice(0, Math.min(3, parts.length));
    const name = nameParts.join(" ").trim();
    
    // Validate: name should have at least 1 letter
    if (/[a-zA-ZÀ-ỹ]/.test(name)) {
      return name;
    }
  }
  
  return undefined;
};

/**
 * Extract date from text
 */
const extractDate = (text: string): { day: string; month: string; year: string } | undefined => {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      
      if (isValidDate(day, month, year)) {
        return {
          day: String(day),
          month: String(month),
          year: String(year),
        };
      }
    }
  }
  return undefined;
};

/**
 * Extract time from text
 */
const extractTime = (text: string): { hour: string; minute: string } | undefined => {
  for (const pattern of TIME_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const hour = parseInt(match[1], 10);
      const minute = match[2] ? parseInt(match[2], 10) : 0;
      
      if (isValidTime(hour, minute)) {
        return {
          hour: String(hour),
          minute: String(minute),
        };
      }
    }
  }
  return undefined;
};

/**
 * Extract gender from text
 */
const extractGender = (text: string): "male" | "female" | undefined => {
  // Normalize text for better matching
  const normalized = " " + text.toLowerCase() + " ";
  
  // Check female first (nữ/nu/nụ)
  if (/[\s,](nữ|nu|nụ|female)[\s,]/i.test(normalized)) return "female";
  // Check male (nam)
  if (/[\s,](nam|male)[\s,]/i.test(normalized)) return "male";
  
  return undefined;
};

/**
 * Extract calendar type from text
 */
const extractCalendarType = (text: string): "solar" | "lunar" | undefined => {
  if (LUNAR_PATTERNS.test(text)) return "lunar";
  if (SOLAR_PATTERNS.test(text)) return "solar";
  return undefined;
};

/**
 * Main parse function
 */
export function parseQuickInput(text: string): ParseResult {
  const trimmed = text.trim();
  
  if (!trimmed) {
    return {
      success: false,
      partial: false,
      data: {},
      missing: ["Vui lòng nhập thông tin"],
      errors: [],
    };
  }

  const data: ParsedBirthData = {};
  const missing: string[] = [];
  const errors: string[] = [];

  // Extract name
  const name = extractName(trimmed);
  if (name) {
    data.fullName = name;
  } else {
    missing.push("Họ tên");
  }

  // Extract date
  const date = extractDate(trimmed);
  if (date) {
    data.day = date.day;
    data.month = date.month;
    data.year = date.year;
  } else {
    // Check if there's an invalid date pattern
    if (/\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/.test(trimmed)) {
      errors.push("Ngày sinh không hợp lệ");
    } else {
      missing.push("Ngày sinh");
    }
  }

  // Extract time (optional)
  const time = extractTime(trimmed);
  if (time) {
    data.birthHour = time.hour;
    data.birthMinute = time.minute;
  }

  // Extract gender
  const gender = extractGender(trimmed);
  if (gender) {
    data.gender = gender;
  } else {
    missing.push("Giới tính");
  }

  // Extract calendar type (optional, defaults to solar in component)
  const calendarType = extractCalendarType(trimmed);
  if (calendarType) {
    data.calendarType = calendarType;
  }

  // Determine result status
  const hasRequiredFields = data.fullName && data.day && data.month && data.year && data.gender;
  const hasAnyData = Object.keys(data).length > 0;

  if (errors.length > 0) {
    return {
      success: false,
      partial: hasAnyData,
      data,
      missing,
      errors,
    };
  }

  if (hasRequiredFields) {
    // Check if time is missing (partial success)
    if (!time) {
      return {
        success: true,
        partial: true,
        data,
        missing: ["Giờ sinh"],
        errors: [],
      };
    }
    
    return {
      success: true,
      partial: false,
      data,
      missing: [],
      errors: [],
    };
  }

  return {
    success: false,
    partial: hasAnyData,
    data,
    missing,
    errors: missing.length > 0 ? ["Không nhận diện được đầy đủ thông tin"] : [],
  };
}

/**
 * Format parsed data for display
 */
export function formatParsedData(data: ParsedBirthData): string {
  const parts: string[] = [];
  
  if (data.fullName) parts.push(data.fullName);
  if (data.day && data.month && data.year) {
    parts.push(`${data.day}/${data.month}/${data.year}`);
  }
  if (data.gender) {
    parts.push(data.gender === "male" ? "Nam" : "Nữ");
  }
  if (data.birthHour) {
    const minute = data.birthMinute || "00";
    parts.push(`${data.birthHour}:${minute.padStart(2, "0")}`);
  }
  
  return parts.join(" · ");
}
