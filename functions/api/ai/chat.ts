/**
 * Cloudflare Pages Function - AI Chat Tử Vi
 * Trả lời câu hỏi về lá số dựa trên context
 * Hỗ trợ: Cloudflare Workers AI (primary) + Google Gemini (fallback)
 */

import { buildCorsHeaders } from "./_shared/cors";
import { checkRateLimit, rateLimitResponse, type RateLimitEnv } from "./_shared/rateLimit";

interface Env extends RateLimitEnv {
  AI?: Ai;
  GEMINI_API_KEY?: string;
}

interface PalaceInfo {
  name: string;
  earthlyBranch: string;
  heavenlyStem?: string;
  majorStars?: string[];
  isBodyPalace?: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  question: string;
  chart: {
    profile: Record<string, unknown>;
    palaces?: PalaceInfo[];
  };
  userContext?: {
    gender?: string;
    yearToView?: number;
  };
  history?: Message[];
}

const SYSTEM_PROMPT = `Bạn là chuyên gia Tử Vi Đẩu Số, trả lời câu hỏi về lá số của người dùng.

## NGUYÊN TẮC
1. Trả lời ngắn gọn, súc tích (2-4 đoạn).
2. Dựa trên DỮ LIỆU LÁ SỐ được cung cấp.
3. Không bịa thông tin không có trong dữ liệu.
4. Nếu thiếu dữ liệu, nói rõ và gợi ý xem chi tiết.
5. Giọng văn thân thiện, dễ hiểu.

## PHONG CÁCH
- Trả lời trực tiếp câu hỏi.
- Đưa ra nhận định cụ thể dựa trên sao, cung.
- Kết thúc bằng lời khuyên ngắn nếu phù hợp.

## LƯU Ý
- Không chẩn đoán y khoa.
- Không dự đoán chính xác ngày tháng.
- Khuyến khích tham khảo chuyên gia nếu cần tư vấn sâu.`;

// Chỉ những field không định danh cá nhân mới được đưa vào prompt gửi cho AI.
// Loại trừ fullName/birthTime/solarDate/lunarDate để tránh gửi PII ra ngoài (Gemini fallback).
const SAFE_PROFILE_FIELDS = [
  "gender",
  "yearStem",
  "yearBranch",
  "fiveElementsClass",
  "natalElementName",
  "yinYangLabel",
  "zodiac",
  "menhChu",
  "thanChu",
  "soul",
  "body",
  "cucElement",
] as const;

function buildSafeProfile(
  profile: RequestBody["chart"]["profile"],
  userContext?: RequestBody["userContext"],
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const field of SAFE_PROFILE_FIELDS) {
    const value = (profile as Record<string, unknown>)?.[field];
    if (value != null) safe[field] = value;
  }
  if (userContext?.gender) safe.gender = safe.gender ?? userContext.gender;
  if (userContext?.yearToView) safe.yearToView = userContext.yearToView;
  return safe;
}

function buildChartContext(chart: RequestBody["chart"], userContext?: RequestBody["userContext"]): string {
  const profile = buildSafeProfile(chart.profile, userContext);
  const palaces = (chart.palaces || []).slice(0, 20);

  const profileStr = Object.entries(profile)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const palaceStr = palaces
    .map((p) => {
      const stars = p.majorStars?.slice(0, 10).join(", ") || "Không có chính tinh";
      const body = p.isBodyPalace ? " (Thân cư)" : "";
      return `- ${p.name}${body}: ${p.heavenlyStem || ""} ${p.earthlyBranch} | ${stars}`;
    })
    .join("\n");

  return `THÔNG TIN LÁ SỐ:
${profileStr}

CÁC CUNG:
${palaceStr}`;
}

const MAX_HISTORY_MESSAGES = 8;
const MAX_MESSAGE_LENGTH = 2000;

// body.history đến từ client (JSON) nên `role` chỉ là type ở compile-time, không được
// đảm bảo ở runtime - lọc kỹ để một request thủ công không thể chèn role "system" giả
// nhằm ghi đè SYSTEM_PROMPT (prompt injection).
function sanitizeHistory(history: RequestBody["history"]): Array<{ role: "user" | "assistant"; content: string }> {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (msg): msg is Message =>
        !!msg &&
        (msg.role === "user" || msg.role === "assistant") &&
        typeof msg.content === "string" &&
        msg.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((msg) => ({ role: msg.role, content: msg.content.slice(0, MAX_MESSAGE_LENGTH) }));
}

function buildMessages(body: RequestBody): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  // Add chart context
  const chartContext = buildChartContext(body.chart, body.userContext);
  messages.push({
    role: "user",
    content: `DỮ LIỆU LÁ SỐ:\n${chartContext}\n\n---\nHãy ghi nhớ dữ liệu này để trả lời các câu hỏi.`,
  });
  messages.push({
    role: "assistant",
    content: "Tôi đã ghi nhận dữ liệu lá số. Bạn có thể hỏi bất kỳ điều gì về lá số này.",
  });

  // Add history (đã được sanitize để chỉ còn role user/assistant)
  for (const msg of sanitizeHistory(body.history)) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add current question
  messages.push({ role: "user", content: body.question.slice(0, MAX_MESSAGE_LENGTH) });

  return messages;
}

async function callGeminiAPI(apiKey: string, messages: Array<{ role: string; content: string }>): Promise<string> {
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find((m) => m.role === "system")?.content || "";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
      }),
    }
  );

  const data = await response.json() as any;
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  const corsHeaders = buildCorsHeaders(request);

  const hasAI = !!env.AI;
  const hasGemini = !!env.GEMINI_API_KEY;

  if (!hasAI && !hasGemini) {
    return new Response(
      JSON.stringify({ success: false, error: "Chưa cấu hình AI service" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const rateLimit = await checkRateLimit(env, request, { keyPrefix: "chat", limit: 30, windowSeconds: 3600 });
  if (!rateLimit.allowed) {
    return rateLimitResponse(corsHeaders);
  }

  try {
    const body: RequestBody = await request.json();

    if (!body.question || typeof body.question !== "string" || !body.question.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Thiếu câu hỏi" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (body.question.length > 2000) {
      return new Response(
        JSON.stringify({ success: false, error: "Câu hỏi quá dài" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!body.chart) {
      return new Response(
        JSON.stringify({ success: false, error: "Thiếu dữ liệu lá số" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const messages = buildMessages(body);
    let text = "";

    // Try Cloudflare AI first, fallback to Gemini
    if (hasAI) {
      try {
        const response = await env.AI!.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages,
          max_tokens: 800,
          temperature: 0.7,
        });
        text = (response as any)?.response || (response as any)?.choices?.[0]?.message?.content || "";
      } catch (aiError) {
        console.error("Cloudflare AI error, trying Gemini:", aiError);
        if (hasGemini) {
          text = await callGeminiAPI(env.GEMINI_API_KEY!, messages);
        }
      }
    } else if (hasGemini) {
      text = await callGeminiAPI(env.GEMINI_API_KEY!, messages);
    }

    if (!text) {
      return new Response(
        JSON.stringify({ success: false, error: "Không nhận được phản hồi từ AI" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, answer: text }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Chat Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Lỗi không xác định" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

export const onRequestOptions: PagesFunction = async (context) => {
  return new Response(null, { headers: buildCorsHeaders(context.request) });
};
