/**
 * Cloudflare Pages Function - Gemini Luận Giải Tổng Hợp
 * 
 * API Key được cấu hình trong Cloudflare Dashboard:
 * Settings > Environment Variables > GEMINI_API_KEY
 */

interface Env {
  GEMINI_API_KEY: string;
  GEMINI_API_KEY_2?: string;
  GEMINI_MODEL?: string;
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
6. Các quan hệ Tam hợp/Xung chiếu/Giáp cung nếu CONTEXT_DATA có cung cấp.

ĐỐI VỚI TỨ HÓA:

Nếu dữ liệu có Tứ Hóa, hãy xác định:

* Hóa Lộc
* Hóa Quyền
* Hóa Khoa
* Hóa Kỵ
* sao nào nhận Hóa
* cung nào liên quan

Sau đó diễn giải tác động của Tứ Hóa đối với cung đang luận.

ĐỐI VỚI PHI HÓA:

Nếu dữ liệu có Phi Hóa, hãy xác định:

* cung phát Phi Hóa
* loại Phi Hóa: Lộc/Quyền/Khoa/Kỵ
* sao nhận Phi Hóa
* cung đích
* chiều Phi Hóa: nhập/xuất nếu dữ liệu có

Sau đó giải thích mối liên hệ giữa cung phát và cung nhận.

Đặc biệt chú ý các dạng:

Mệnh → Tài Bạch
Mệnh → Quan Lộc
Mệnh → Phu Thê
Tài Bạch → Mệnh
Quan Lộc → Mệnh
Phu Thê → Mệnh

Không tự tạo các quan hệ trên nếu CONTEXT_DATA không có.

KHI CÓ NHIỀU YẾU TỐ:

Không chỉ liệt kê ý nghĩa từng sao.

Hãy tổng hợp theo:

DỮ KIỆN → TỨ HÓA / PHI HÓA → TRI THỨC PHÙ HỢP → TÁC ĐỘNG → TỔNG HỢP

Nếu có Phi Kỵ hoặc nhiều Phi Hóa cùng tác động, phải phân tích từng dòng Phi Hóa trước rồi mới tổng hợp.

Nếu có mâu thuẫn giữa các yếu tố:

* nêu các yếu tố đó
* phân tích riêng
* sau đó đưa ra nhận định tổng hợp
* không tự bịa quy tắc giải quyết mâu thuẫn.

Nếu dữ liệu không đủ:
"Dữ liệu chưa đủ để kết luận."

Không khẳng định tuyệt đối.

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

function buildPrompt(body: RequestBody): string {
  const chartData = buildChartData(body.profile);
  const contextData = buildContextData(body.palaces);
  const knowledge = buildKnowledgeData(body.palaces);

  return `${SYSTEM_PROMPT}

CẤU TRÚC TRẢ LỜI:

### Tổng quan
Tóm tắt các yếu tố nổi bật (2-4 câu).

### Tứ Hóa
Phân tích các Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ có trong dữ liệu.

### Phi Hóa
Phân tích các luồng Phi Hóa quan trọng, đặc biệt là cung phát → cung nhận.

### Các sao và tổ hợp
Phân tích các sao/tổ hợp sao phù hợp với KNOWLEDGE.

### Tổng hợp
Kết hợp Tứ Hóa + Phi Hóa + sao + các quan hệ cung để đưa ra nhận định chung.

### Lưu ý
Nêu những dữ liệu còn thiếu hoặc cần xem thêm.

DỮ LIỆU:

CHART_DATA:
${chartData}

CONTEXT_DATA:
${contextData}

KNOWLEDGE:
${knowledge}`;
}

// ============ GEMINI API CALL ============

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

async function callGeminiWithKey(
  apiKey: string,
  model: string,
  prompt: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1800,
        topP: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, error: `API ${response.status}: ${errorText}` };
  }

  const data = await response.json() as GeminiResponse;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!text) {
    return { success: false, error: "Không nhận được phản hồi" };
  }

  return { success: true, text: text.trim() };
}

// ============ HANDLER ============

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Debug: log env keys
  const hasKey1 = Boolean(env.GEMINI_API_KEY);
  const hasKey2 = Boolean(env.GEMINI_API_KEY_2);
  const keyPreview = env.GEMINI_API_KEY ? `${env.GEMINI_API_KEY.substring(0, 8)}...` : "EMPTY";
  console.log(`[DEBUG] GEMINI_API_KEY exists: ${hasKey1}, preview: ${keyPreview}`);
  console.log(`[DEBUG] GEMINI_API_KEY_2 exists: ${hasKey2}`);
  console.log(`[DEBUG] All env keys:`, Object.keys(env));

  // Check API keys
  const apiKeys = [env.GEMINI_API_KEY, env.GEMINI_API_KEY_2].filter(Boolean) as string[];
  
  if (apiKeys.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "GEMINI_API_KEY chưa được cấu hình",
        debug: { hasKey1, hasKey2, keyPreview, envKeys: Object.keys(env) }
      }),
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

    const prompt = buildPrompt(body);
    const model = env.GEMINI_MODEL || "gemini-2.5-flash";

    // Try each key, fallback to next if error
    let lastError = "";
    for (let i = 0; i < apiKeys.length; i++) {
      const key = apiKeys[i];
      console.log(`Trying GEMINI_API_KEY${i === 0 ? "" : "_2"}...`);

      const result = await callGeminiWithKey(key, model, prompt);

      if (result.success && result.text) {
        return new Response(
          JSON.stringify({ success: true, analysis: result.text }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      lastError = result.error || "Lỗi không xác định";
      console.error(`Key ${i + 1} failed:`, lastError);
    }

    // All keys failed
    return new Response(
      JSON.stringify({ success: false, error: `Tất cả API key đều lỗi: ${lastError}` }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
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
