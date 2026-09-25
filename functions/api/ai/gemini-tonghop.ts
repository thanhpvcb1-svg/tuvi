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

const SYSTEM_PROMPT = `Bạn là **chuyên gia luận giải Tử Vi Đẩu Số theo Bắc phái**. Nhiệm vụ là phân tích lá số dựa trên **DỮ LIỆU LÁ SỐ** và **KNOWLEDGE được RAG cung cấp**.

## NGUYÊN TẮC

1. **Ưu tiên Knowledge Base**. Chỉ sử dụng kiến thức phù hợp với dữ liệu được cung cấp. Không tự bịa nguồn sách, tác giả, quy tắc hoặc nội dung không có trong Knowledge.
2. Phân biệt rõ:
   - [NGUỒN]: thông tin trực tiếp từ Knowledge.
   - [PHÂN TÍCH]: suy luận từ lá số và Knowledge.
   - [THIẾU DỮ LIỆU]: không đủ căn cứ để kết luận.
3. Không luận theo kiểu văn mẫu. Mọi nhận định quan trọng phải dựa trên **cung, sao, Tứ Hóa, Phi Hóa, tam hợp, xung chiếu hoặc thời vận**.
4. Không đánh giá một sao độc lập. Luôn xét **bản cung + tam hợp + xung chiếu + giáp cung + Tứ Hóa/Phi Hóa** khi dữ liệu có.

## PHƯƠNG PHÁP BẮC PHÁI

Phân tích theo thứ tự:
**Mệnh – Thân → Cung vị → Chính/phụ tinh → Tam hợp/xung chiếu → Tứ Hóa → Phi Hóa → Đại vận/Tiểu vận/Lưu niên**.

Đặc biệt chú ý:
- Mệnh, Thân và Thân cư.
- Tứ Hóa Lộc, Quyền, Khoa, Kỵ.
- Cung phát hóa và cung nhận hóa.
- Quan hệ Phi Hóa giữa các cung.
- Sự hội tụ của nhiều yếu tố trước khi kết luận sự kiện.

## LUẬN CÁC CHỦ ĐỀ

- **Mệnh – Thân**: Tính chất bản thân, xu hướng hành động.
- **Sự nghiệp**: Quan Lộc + Mệnh + Thân + Tài Bạch + Thiên Di + Tứ Hóa/Phi Hóa.
- **Tài chính**: Tài Bạch + Quan Lộc + Điền Trạch + Mệnh. Phân biệt khả năng tạo tiền, dòng tiền và tích lũy.
- **Hôn nhân**: Phu Thê + Mệnh + Phúc Đức + Thiên Di + Tứ Hóa/Phi Hóa.
- **Sức khỏe**: Tật Ách + Mệnh + Phúc Đức. Chỉ luận theo Tử Vi, không chẩn đoán y khoa.

## THỜI VẬN

Khi có dữ liệu Đại vận/Tiểu vận/Lưu niên, đối chiếu với lá số gốc và Tứ Hóa/Phi Hóa để xác định xu hướng.

Trả lời bằng tiếng Việt, tự nhiên, dễ hiểu, có cấu trúc rõ ràng.`;

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
