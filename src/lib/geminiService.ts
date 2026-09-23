/**
 * Gemini AI Service
 * Gọi Gemini thông qua Cloudflare Pages Function
 * API Key được cấu hình trên Cloudflare Dashboard
 */

import type { KnowledgeMatch } from "./tuvi/knowledge/knowledgeService";

// ============ TYPES ============

export type GeminiLuanGiaiRequest = {
  palaceName: string;
  palaceInfo: {
    branch: string;
    stem: string;
    majorStars: string[];
    goodStars: string[];
    badStars: string[];
    isBodyPalace: boolean;
  };
  knowledgeMatches: KnowledgeMatch[];
  userContext?: {
    gender?: string;
    yearToView?: number;
  };
};

export type GeminiLuanGiaiResponse = {
  success: boolean;
  analysis: string;
  error?: string;
};

export type PalaceSummary = {
  name: string;
  branch: string;
  stem: string;
  majorStars: string[];
  goodStars?: string[];
  badStars?: string[];
  isBodyPalace: boolean;
  knowledgeTexts: string[];
  phiHoaFlows: string[];
};

export type GeminiTongHopRequest = {
  palaces: PalaceSummary[];
  profile: {
    gender?: string;
    yearToView?: number;
    menhChu?: string;
    thanChu?: string;
    cuc?: string;
  };
};

// ============ API ENDPOINT ============

const API_ENDPOINT = "/api/ai/gemini-tonghop";

// ============ API CALLS ============

/**
 * Gọi API để luận giải tổng hợp Bắc Phái
 */
export async function callGeminiTongHop(
  request: GeminiTongHopRequest
): Promise<GeminiLuanGiaiResponse> {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    // Đọc response text trước để tránh lỗi parse JSON rỗng
    const text = await response.text();
    
    if (!text || text.trim() === "") {
      return {
        success: false,
        analysis: "",
        error: "API trả về response rỗng",
      };
    }

    let data: GeminiLuanGiaiResponse;
    try {
      data = JSON.parse(text) as GeminiLuanGiaiResponse;
    } catch {
      console.error("Invalid JSON response:", text.slice(0, 200));
      return {
        success: false,
        analysis: "",
        error: "API trả về dữ liệu không hợp lệ",
      };
    }

    if (!response.ok || !data.success) {
      return {
        success: false,
        analysis: "",
        error: data.error || `Lỗi API: ${response.status}`,
      };
    }

    return {
      success: true,
      analysis: data.analysis || "",
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      success: false,
      analysis: "",
      error: error instanceof Error ? error.message : "Lỗi kết nối",
    };
  }
}

/**
 * Gọi API để luận giải từng cung (sử dụng cùng endpoint)
 */
export async function callGeminiLuanGiai(
  request: GeminiLuanGiaiRequest
): Promise<GeminiLuanGiaiResponse> {
  // Convert single palace request to tonghop format
  const tonghopRequest: GeminiTongHopRequest = {
    palaces: [{
      name: request.palaceName,
      branch: request.palaceInfo.branch,
      stem: request.palaceInfo.stem,
      majorStars: request.palaceInfo.majorStars,
      goodStars: request.palaceInfo.goodStars,
      badStars: request.palaceInfo.badStars,
      isBodyPalace: request.palaceInfo.isBodyPalace,
      knowledgeTexts: request.knowledgeMatches.map((m) => m.interpretation.text),
      phiHoaFlows: [],
    }],
    profile: {
      gender: request.userContext?.gender,
      yearToView: request.userContext?.yearToView,
    },
  };

  return callGeminiTongHop(tonghopRequest);
}

/**
 * Luận giải nhiều cung cùng lúc (batch)
 */
export async function batchGeminiLuanGiai(
  requests: GeminiLuanGiaiRequest[]
): Promise<Map<string, GeminiLuanGiaiResponse>> {
  const results = new Map<string, GeminiLuanGiaiResponse>();

  for (const request of requests) {
    const response = await callGeminiLuanGiai(request);
    results.set(request.palaceName, response);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return results;
}
