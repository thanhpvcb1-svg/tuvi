/**
 * Gemini AI Service
 * Gọi Gemini thông qua Cloudflare Pages Function
 * API Key được cấu hình trên Cloudflare Dashboard
 */

import type { KnowledgeMatch } from "./tuvi/knowledge/lazyKnowledgeService";

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
    tamPhuong?: string[];
    xungChieu?: string;
    giapCung?: string[];
    daiVan?: string;
    vanNamXem?: string[];
    phiHoaFlows?: string[];
  };
  knowledgeMatches: KnowledgeMatch[];
  userContext?: {
    gender?: string;
    yearToView?: number;
    birthYear?: number;
  };
};

/**
 * Tri thức gửi cho AI kèm nguồn và điều kiện đã khớp để AI trích [NGUỒN] trung thực,
 * không tự gán sách/tác giả.
 */
export function formatKnowledgeForAi(match: KnowledgeMatch): string {
  const { book, author } = match.interpretation.source ?? { book: "", author: "" };
  const source = [book, author && !/^unknown$/i.test(author) ? author : ""].filter(Boolean).join(" – ") || "Không rõ nguồn";
  return `[Nguồn: ${source}] [Khớp: ${match.matchReasons.join("; ")}] ${match.interpretation.text}`;
}

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
  /** Tên các cung tam hợp (không gồm bản cung). */
  tamPhuong?: string[];
  xungChieu?: string;
  /** Hai cung kẹp hai bên. */
  giapCung?: string[];
  /** Khoảng tuổi đại vận của cung, vd "45-54 tuổi". */
  daiVan?: string;
  /** "Đại vận năm xem" / "Tiểu vận năm xem" nếu cung đang được kích hoạt ở năm xem. */
  vanNamXem?: string[];
  knowledgeTexts: string[];
  phiHoaFlows: string[];
};

export type GeminiTongHopRequest = {
  palaces: PalaceSummary[];
  profile: {
    gender?: string;
    yearToView?: number;
    birthYear?: number;
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
      tamPhuong: request.palaceInfo.tamPhuong,
      xungChieu: request.palaceInfo.xungChieu,
      giapCung: request.palaceInfo.giapCung,
      daiVan: request.palaceInfo.daiVan,
      vanNamXem: request.palaceInfo.vanNamXem,
      // Server chỉ dùng 10 mục đầu (đã xếp theo độ khớp) - không gửi thừa.
      knowledgeTexts: request.knowledgeMatches.slice(0, 10).map(formatKnowledgeForAi),
      phiHoaFlows: request.palaceInfo.phiHoaFlows ?? [],
    }],
    profile: {
      gender: request.userContext?.gender,
      yearToView: request.userContext?.yearToView,
      birthYear: request.userContext?.birthYear,
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
