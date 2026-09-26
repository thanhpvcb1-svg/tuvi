/**
 * Cloudflare Pages Function - AI Luận Giải Tổng Hợp
 * Sử dụng Cloudflare Workers AI (Llama 3.3)
 */

import { buildCorsHeaders } from "./_shared/cors";
import { checkRateLimit, rateLimitResponse, type RateLimitEnv } from "./_shared/rateLimit";

interface Env extends RateLimitEnv {
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
  tamPhuong?: string[];
  xungChieu?: string;
  giapCung?: string[];
  daiVan?: string;
  vanNamXem?: string[];
  knowledgeTexts: string[];
  phiHoaFlows: string[];
}

interface RequestBody {
  palaces: PalaceSummary[];
  profile: {
    gender?: string;
    yearToView?: number;
    birthYear?: number;
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
4. Không đánh giá một sao độc lập ("một sao = một kết luận"). Luôn xét **sao + cung + miếu/vượng/hãm + tam phương + xung chiếu + giáp cung + Tứ Hóa + Phi Hóa + đại vận** khi dữ liệu có, rồi mới tổng hợp.
5. Chỉ dùng dữ liệu trong CHART_DATA, CONTEXT_DATA và KNOWLEDGE. Mỗi mục KNOWLEDGE có dạng "[Nguồn: ...] [Khớp: ...] nội dung": khi dùng phải ghi đúng nguồn đó sau nhãn [NGUỒN], không đổi tên sách/tác giả, không thêm nguồn khác.
6. Nếu một mục không có dữ liệu (vd không có tri thức, không có Phi Hóa, không rõ tiểu vận) thì ghi "[THIẾU DỮ LIỆU] Không đủ dữ liệu để kết luận." - không suy đoán lấp chỗ trống.
7. Không khẳng định dự đoán chắc chắn về tương lai; dùng ngôn ngữ xu hướng, tham khảo.

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

const FULL_STRUCTURE = `### 1. Dữ liệu sử dụng
Liệt kê ngắn các dữ liệu có trong CHART_DATA / CONTEXT_DATA / KNOWLEDGE được dùng.

### 2. Cấu trúc lá số
Mệnh, Thân cư cung nào, Cục, Mệnh chủ / Thân chủ nếu có.

### 3. Mệnh – Thân
Bản cung + tam phương + xung chiếu + giáp cung của Mệnh và cung Thân cư.

### 4. Mệnh – Tài – Quan
Tam phương Mệnh, Tài Bạch, Quan Lộc.

### 5. Tứ Hóa
Hóa Lộc, Quyền, Khoa, Kỵ sinh niên nằm ở sao nào, cung nào.

### 6. Phi Hóa
Các luồng Phi Hóa can cung quan trọng (cung phát → cung nhận).

### 7. Các cung trọng điểm
Chỉ các cung có dữ liệu và tri thức khớp nổi bật.

### 8. Đại vận
Theo daiVan / vanNamXem trong CONTEXT_DATA.

### 9. Tiểu vận / Lưu niên
Theo vanNamXem của năm xem; nếu không có thì [THIẾU DỮ LIỆU].

### 10. Tổng hợp
Kết hợp các yếu tố trên; nêu rõ đâu là xu hướng, đâu là điểm cần lưu ý.`;

const SINGLE_PALACE_STRUCTURE = `### Dữ liệu sử dụng
Sao, độ sáng, Tứ Hóa, tam phương, xung chiếu, giáp cung, đại vận của cung và các mục KNOWLEDGE đã khớp.

### Cấu trúc cung
Bản cung + tam phương + xung chiếu + giáp cung.

### Tứ Hóa và Phi Hóa
Tứ Hóa sinh niên và Phi Hóa liên quan tới cung.

### Thời vận
Đại vận / tiểu vận nếu cung đang được kích hoạt ở năm xem.

### Tổng hợp
Nhận định có căn cứ; phần thiếu căn cứ ghi [THIẾU DỮ LIỆU].`;

// ============ HELPERS ============

function buildChartData(profile: RequestBody["profile"]): string {
  return JSON.stringify({
    gender: profile.gender || "Chưa rõ",
    yearToView: profile.yearToView || new Date().getFullYear(),
    birthYear: profile.birthYear || null,
    menhChu: profile.menhChu || null,
    thanChu: profile.thanChu || null,
    cuc: profile.cuc || null,
  }, null, 2);
}

// Giới hạn số lượng phần tử trong các mảng lồng nhau để tránh 1 request cố ý gửi
// mảng khổng lồ (chinhTinh/catTinh/hungTinh/knowledgeTexts) làm phình prompt/token cost.
const MAX_STARS_PER_PALACE = 15;
const MAX_KNOWLEDGE_TEXTS_PER_PALACE = 10;
const MAX_KNOWLEDGE_TEXT_LENGTH = 1200;

function buildContextData(palaces: PalaceSummary[]): string {
  const palaceContexts = palaces.map((p) => ({
    cung: p.name,
    viTri: `${p.stem} ${p.branch}`,
    isBodyPalace: p.isBodyPalace || undefined,
    tamPhuong: p.tamPhuong?.slice(0, 2).map((x) => String(x).slice(0, 20)),
    xungChieu: p.xungChieu ? String(p.xungChieu).slice(0, 20) : undefined,
    giapCung: p.giapCung?.slice(0, 2).map((x) => String(x).slice(0, 20)),
    daiVan: p.daiVan ? String(p.daiVan).slice(0, 20) : undefined,
    vanNamXem: p.vanNamXem?.slice(0, 2).map((x) => String(x).slice(0, 30)),
    chinhTinh: p.majorStars.length > 0 ? p.majorStars.slice(0, MAX_STARS_PER_PALACE) : undefined,
    catTinh: p.goodStars && p.goodStars.length > 0 ? p.goodStars.slice(0, MAX_STARS_PER_PALACE) : undefined,
    hungTinh: p.badStars && p.badStars.length > 0 ? p.badStars.slice(0, MAX_STARS_PER_PALACE) : undefined,
    phiHoa: p.phiHoaFlows.length > 0 ? p.phiHoaFlows.slice(0, MAX_STARS_PER_PALACE) : undefined,
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
      triThuc: p.knowledgeTexts.slice(0, MAX_KNOWLEDGE_TEXTS_PER_PALACE).map((text) => String(text).slice(0, MAX_KNOWLEDGE_TEXT_LENGTH)),
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

  // Luận một cung (nút "Giải nghĩa chi tiết") dùng cấu trúc gọn; luận tổng hợp dùng đủ 10 mục.
  const structure = body.palaces.length === 1 ? SINGLE_PALACE_STRUCTURE : FULL_STRUCTURE;

  return `CẤU TRÚC TRẢ LỜI (gắn nhãn [NGUỒN] / [PHÂN TÍCH] / [THIẾU DỮ LIỆU] cho từng nhận định):

${structure}

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

  const corsHeaders = buildCorsHeaders(request);

  if (!env.AI) {
    return new Response(
      JSON.stringify({ success: false, error: "AI binding chưa được cấu hình" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const rateLimit = await checkRateLimit(env, request, { keyPrefix: "tonghop", limit: 10, windowSeconds: 3600 });
  if (!rateLimit.allowed) {
    return rateLimitResponse(corsHeaders);
  }

  try {
    const body: RequestBody = await request.json();

    if (!body.palaces || !Array.isArray(body.palaces)) {
      return new Response(
        JSON.stringify({ success: false, error: "Thiếu dữ liệu palaces" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (body.palaces.length > 20) {
      return new Response(
        JSON.stringify({ success: false, error: "Dữ liệu palaces không hợp lệ" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userPrompt = buildUserPrompt(body);

    const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 2500,
      // Thấp để bám dữ liệu/tri thức được cung cấp, hạn chế tự sáng tác.
      temperature: 0.4,
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

export const onRequestOptions: PagesFunction = async (context) => {
  return new Response(null, { headers: buildCorsHeaders(context.request) });
};
