/**
 * Cloudflare Pages Function - AI Luận Giải Tổng Hợp
 * Sử dụng Cloudflare Workers AI (Llama 3.3)
 */

interface Env {
  AI: Ai;
}

interface PalaceSummary {
  name: string;
  branch: string;
  stem: string;
  majorStars: string[];
  goodStars?: string[];
  badStars?: string[];
  isBodyPalace: boolean;
  knowledgeTexts: string[];
  phiHoaFlows: string[];
}

interface RequestBody {
  palaces: PalaceSummary[];
  profile: {
    gender?: string;
    yearToView?: number;
    menhChu?: string;
    thanChu?: string;
    cuc?: string;
  };
}

// ============ SYSTEM PROMPT ============

const SYSTEM_PROMPT = `Bạn là AI hỗ trợ luận giải Tử Vi.

Hãy luận giải CHỈ dựa trên:

1. CHART_DATA: dữ liệu lá số đã được hệ thống tính toán.
2. CONTEXT_DATA: dữ liệu các cung, sao, Tứ Hóa, Phi Hóa và các quan hệ liên quan đã được hệ thống xác định.
3. KNOWLEDGE: các tri thức đã được hệ thống Retrieval lấy ra.

YÊU CẦU:

* Không tự tính lại lá số.
* Không tự thêm sao.
* Không tự tạo Tứ Hóa.
* Không tự tạo Phi Hóa.
* Không sử dụng kiến thức ngoài KNOWLEDGE.
* Chỉ diễn giải và tổng hợp dữ liệu đã được cung cấp.

KHI LUẬN GIẢI, ƯU TIÊN:

1. Tứ Hóa
2. Phi Hóa
3. Tổ hợp sao
4. Chính tinh
5. Phụ tinh

Trả lời bằng tiếng Việt, tự nhiên, dễ hiểu, tập trung điểm chính, không lan man.`;

// ============ HELPERS ============

function buildChartData(profile: RequestBody["profile"]): string {
  return JSON.stringify({
    gender: profile.gender || "Chưa rõ",
    yearToView: profile.yearToView || new Date().getFullYear(),
    menhChu: profile.menhChu || null,
    thanChu: profile.thanChu || null,
    cuc: profile.cuc || null,
  }, null, 2);
}

function buildContextData(palaces: PalaceSummary[]): string {
  const palaceContexts = palaces.map((p) => ({
    cung: p.name,
    viTri: `${p.stem} ${p.branch}`,
    isBodyPalace: p.isBodyPalace || undefined,
    chinhTinh: p.majorStars.length > 0 ? p.majorStars : undefined,
    catTinh: p.goodStars && p.goodStars.length > 0 ? p.goodStars : undefined,
    hungTinh: p.badStars && p.badStars.length > 0 ? p.badStars : undefined,
    phiHoa: p.phiHoaFlows.length > 0 ? p.phiHoaFlows : undefined,
  }));

  const allPhiHoa = palaces.flatMap((p) => 
    p.phiHoaFlows.map((f) => ({ cungPhat: p.name, chiTiet: f }))
  );

  const phiHoaSummary = {
    hoaLoc: allPhiHoa.filter((f) => f.chiTiet.includes("Lộc")),
    hoaQuyen: allPhiHoa.filter((f) => f.chiTiet.includes("Quyền")),
    hoaKhoa: allPhiHoa.filter((f) => f.chiTiet.includes("Khoa")),
    hoaKy: allPhiHoa.filter((f) => f.chiTiet.includes("Kỵ")),
  };

  const result: Record<string, unknown> = { palaces: palaceContexts };
  if (allPhiHoa.length > 0) {
    result.phiHoaCanCung = phiHoaSummary;
  }

  return JSON.stringify(result, null, 2);
}

function buildKnowledgeData(palaces: PalaceSummary[]): string {
  const knowledgeByPalace = palaces
    .filter((p) => p.knowledgeTexts.length > 0)
    .map((p) => ({
      cung: p.name,
      triThuc: p.knowledgeTexts,
    }));

  if (knowledgeByPalace.length === 0) {
    return "Không có tri thức match cụ thể.";
  }

  return JSON.stringify(knowledgeByPalace, null, 2);
}

function buildUserPrompt(body: RequestBody): string {
  const chartData = buildChartData(body.profile);
  const contextData = buildContextData(body.palaces);
  const knowledge = buildKnowledgeData(body.palaces);

  return `CẤU TRÚC TRẢ LỜI:

### Tổng quan
Tóm tắt các yếu tố nổi bật (2-4 câu).

### Tứ Hóa
Phân tích các Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ có trong dữ liệu.

### Phi Hóa
Phân tích các luồng Phi Hóa quan trọng.

### Các sao và tổ hợp
Phân tích các sao/tổ hợp sao phù hợp với KNOWLEDGE.

### Tổng hợp
Kết hợp Tứ Hóa + Phi Hóa + sao để đưa ra nhận định chung.

DỮ LIỆU:

CHART_DATA:
${chartData}

CONTEXT_DATA:
${contextData}

KNOWLEDGE:
${knowledge}`;
}

// ============ HANDLER ============

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

    if (!body.palaces || !Array.isArray(body.palaces)) {
      return new Response(
        JSON.stringify({ success: false, error: "Thiếu dữ liệu palaces" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userPrompt = buildUserPrompt(body);

    const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    // Extract text from response
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
      JSON.stringify({ success: true, analysis: text }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Error:", error);
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
