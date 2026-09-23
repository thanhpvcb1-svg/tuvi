/**
 * CoHoc.net Client
 * Handles session, CSRF token, and API calls
 */

import type { CoHocInput, CoHocCoreParams, CoHocChartResult, CoHocError, LunarDate } from "./types";
import { 
  COHOC_BASE_URL, 
  COHOC_FORM_URL, 
  COHOC_CORE_URL, 
  COHOC_DEFAULT_PARAMS,
  COHOC_HEADERS,
} from "./constants";
import { solarToLunar, getCohocGio, isValidSolarDate } from "./calendar";
import { parseCoHocHtml } from "./parser";

// CSRF token patterns to search in HTML
const CSRF_PATTERNS = [
  /TokenCSRF['"]\s*:\s*['"]([^'"]+)['"]/i,
  /name=['"]TokenCSRF['"][^>]*value=['"]([^'"]+)['"]/i,
  /value=['"]([^'"]+)['"][^>]*name=['"]TokenCSRF['"]/i,
  /TokenCSRF=([a-zA-Z0-9_-]+)/i,
  /"TokenCSRF"\s*:\s*"([^"]+)"/i,
];

/**
 * Extract CSRF token from HTML
 */
function extractCsrfToken(html: string): string | null {
  for (const pattern of CSRF_PATTERNS) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract cookies from response headers
 */
function extractCookies(headers: Headers): string {
  const cookies: string[] = [];
  const setCookie = headers.get("set-cookie");
  
  if (setCookie) {
    // Parse set-cookie header
    const parts = setCookie.split(",");
    for (const part of parts) {
      const cookiePart = part.split(";")[0].trim();
      if (cookiePart) {
        cookies.push(cookiePart);
      }
    }
  }
  
  return cookies.join("; ");
}

/**
 * Create error response
 */
function createError(
  code: CoHocError["error"]["code"],
  message: string,
  details?: unknown
): CoHocError {
  return {
    success: false,
    error: { code, message, details },
  };
}

/**
 * Validate input
 */
function validateInput(input: CoHocInput): CoHocError | null {
  if (!input.name?.trim()) {
    return createError("INVALID_INPUT", "Họ tên không được để trống");
  }
  
  if (!isValidSolarDate(input.birthDate)) {
    return createError("INVALID_INPUT", "Ngày sinh không hợp lệ (YYYY-MM-DD)");
  }
  
  if (input.birthHour < 0 || input.birthHour > 23) {
    return createError("INVALID_INPUT", "Giờ sinh phải từ 0-23");
  }
  
  if (input.birthMinute < 0 || input.birthMinute > 59) {
    return createError("INVALID_INPUT", "Phút sinh phải từ 0-59");
  }
  
  if (input.gender !== "male" && input.gender !== "female") {
    return createError("INVALID_INPUT", "Giới tính phải là male hoặc female");
  }
  
  if (input.targetYear < 1900 || input.targetYear > 2100) {
    return createError("INVALID_INPUT", "Năm xem hạn không hợp lệ");
  }
  
  return null;
}

/**
 * Build Core.html URL with parameters
 */
function buildCoreUrl(params: CoHocCoreParams): string {
  const url = new URL(COHOC_CORE_URL);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  
  return url.toString();
}

/**
 * CoHoc Client class
 */
export class CoHocClient {
  private sessionCookie: string = "";
  private csrfToken: string = "";
  private timeout: number;
  private maxRetries: number;
  
  constructor(options?: { timeout?: number; maxRetries?: number }) {
    this.timeout = options?.timeout || 30000;
    this.maxRetries = options?.maxRetries || 2;
  }
  
  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Get CSRF token from form page
   */
  async getCsrfToken(): Promise<string> {
    console.log("[CoHoc] Getting CSRF token...");
    
    const response = await this.fetchWithTimeout(COHOC_FORM_URL, {
      method: "GET",
      headers: {
        ...COHOC_HEADERS,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch form page: ${response.status}`);
    }
    
    // Extract session cookie
    this.sessionCookie = extractCookies(response.headers);
    
    const html = await response.text();
    const token = extractCsrfToken(html);
    
    if (!token) {
      throw new Error("CSRF token not found in HTML");
    }
    
    this.csrfToken = token;
    console.log("[CoHoc] CSRF token obtained");
    
    return token;
  }
  
  /**
   * Call Core.html endpoint
   */
  async getCore(
    input: CoHocInput,
    lunar: LunarDate,
    csrfToken: string
  ): Promise<string> {
    console.log("[CoHoc] Calling Core.html...");
    
    const params: CoHocCoreParams = {
      ...COHOC_DEFAULT_PARAMS,
      hoten: input.name,
      isDuong: 1, // We're providing solar date
      isNam: input.gender === "male" ? 1 : 0,
      gio: getCohocGio(input.birthHour),
      ngay: lunar.day,
      thang: lunar.month,
      nam: lunar.year,
      namHan: input.targetYear,
      TokenCSRF: csrfToken,
    };
    
    const url = buildCoreUrl(params);
    
    const response = await this.fetchWithTimeout(url, {
      method: "GET",
      headers: {
        ...COHOC_HEADERS,
        "Referer": COHOC_FORM_URL,
        ...(this.sessionCookie ? { "Cookie": this.sessionCookie } : {}),
      },
    });
    
    if (!response.ok) {
      throw new Error(`Core.html request failed: ${response.status}`);
    }
    
    const html = await response.text();
    console.log("[CoHoc] Core.html response received");
    
    return html;
  }
  
  /**
   * Main method: Get lá số from CoHoc
   */
  async getLaSo(input: CoHocInput): Promise<CoHocChartResult | CoHocError> {
    // Validate input
    const validationError = validateInput(input);
    if (validationError) {
      return validationError;
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[CoHoc] Retry attempt ${attempt}...`);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
        
        // Step 1: Get CSRF token
        await this.getCsrfToken();
        
        // Step 2: Convert solar to lunar
        console.log("[CoHoc] Converting solar to lunar date...");
        const lunar = solarToLunar(input.birthDate, input.birthHour);
        console.log(`[CoHoc] Lunar date: ${lunar.year}-${lunar.month}-${lunar.day} (${lunar.hourBranch})`);
        
        // Step 3: Call Core.html
        const html = await this.getCore(input, lunar, this.csrfToken);
        
        // Step 4: Parse HTML
        console.log("[CoHoc] Parsing chart...");
        const result = parseCoHocHtml(html, input, lunar);
        
        console.log("[CoHoc] Chart parsed successfully");
        return result;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`[CoHoc] Error on attempt ${attempt + 1}:`, error);
        
        // Don't retry on certain errors
        if (error instanceof Error) {
          if (error.message.includes("CSRF")) {
            return createError("CSRF_ERROR", error.message);
          }
          if (error.message.includes("Invalid input")) {
            return createError("INVALID_INPUT", error.message);
          }
        }
      }
    }
    
    return createError(
      "NETWORK_ERROR",
      `Failed after ${this.maxRetries + 1} attempts: ${lastError?.message || "Unknown error"}`
    );
  }
}

/**
 * Convenience function to get lá số
 */
export async function fetchCoHocChart(input: CoHocInput): Promise<CoHocChartResult | CoHocError> {
  const client = new CoHocClient();
  return client.getLaSo(input);
}
