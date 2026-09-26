/**
 * Cloudflare Pages Function - AI Chat Tử Vi
 * Trả lời câu hỏi về lá số dựa trên context
 */

interface Env {
  AI: Ai;
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

function buildChartContext(chart: RequestBody["chart"]): string {
  const profile = chart.profile || {};
  const palaces = chart.palaces || [];

  const profileStr = Object.entries(profile)
    .filter(([_, v]) => v != null)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const palaceStr = palaces
    .map((p) => {
      const stars = p.majorStars?.join(", ") || "Không có chính tinh";
      const body = p.isBodyPalace ? " (Thân cư)" : "";
      return `- ${p.name}${body}: ${p.heavenlyStem || ""} ${p.earthlyBranch} | ${stars}`;
    })
    .join("\n");

  return `THÔNG TIN LÁ SỐ:
${profileStr}

CÁC CUNG:
${palaceStr}`;
}

function buildMessages(body: RequestBody): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  // Add chart context
  const chartContext = buildChartContext(body.chart);
  messages.push({
    role: "user",
    content: `DỮ LIỆU LÁ SỐ:\n${chartContext}\n\n---\nHãy ghi nhớ dữ liệu này để trả lời các câu hỏi.`,
  });
  messages.push({
    role: "assistant",
    content: "Tôi đã ghi nhận dữ liệu lá số. Bạn có thể hỏi bất kỳ điều gì về lá số này.",
  });

  // Add history
  if (body.history && body.history.length > 0) {
    for (const msg of body.history) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add current question
  messages.push({ role: "user", content: body.question });

  return messages;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (!env.AI) {
    return new Response(
      JSON.stringify({ success: false, error: "AI binding chưa được cấu hình" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const body: RequestBody = await request.json();

    if (!body.question || typeof body.question !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Thiếu câu hỏi" }),
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

    const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages,
      max_tokens: 800,
      temperature: 0.7,
    });

    const text = (response as any)?.response
      || (response as any)?.choices?.[0]?.message?.content
      || "";

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

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
