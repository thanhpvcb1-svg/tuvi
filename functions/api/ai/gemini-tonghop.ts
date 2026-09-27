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
5. Chỉ dùng dữ liệu trong CHART_DATA, CONTEXT_DATA và KNOWLEDGE. Mỗi mục KNOWLEDGE có dạng "[Khớp: ...] nội dung". Nhãn [NGUỒN] nghĩa là thông tin lấy trực tiếp từ KNOWLEDGE. Không nêu tên website, sách, tác giả hay trích dẫn bất kỳ nguồn bên ngoài nào.
6. Nếu một mục không có dữ liệu (vd không có tri thức, không có Phi Hóa, không rõ tiểu vận) thì ghi "[THIẾU DỮ LIỆU] Không đủ dữ liệu để kết luận." - không suy đoán lấp chỗ trống.
7. Không khẳng định dự đoán chắc chắn về tương lai; dùng ngôn ngữ xu hướng, tham khảo. Không biến suy luận thành sự thật tuyệt đối.
8. Nếu các mục KNOWLEDGE cho cách hiểu khác nhau hoặc trái nhau về cùng một yếu tố, trình bày cả hai cách hiểu và điều kiện của từng cách - không tự loại bỏ, không tự chọn một bên khi dữ liệu lá số không đủ để phân định.
9. Không tự tạo quy tắc an sao hay cách cục mới ngoài dữ liệu được cung cấp.
10. Mục KNOWLEDGE có nhãn [Vận hạn năm xem] chỉ dùng cho phần Đại vận / Tiểu vận / Lưu niên, không dùng để luận tính chất cả đời.
11. KNOWLEDGE đã được lọc theo lá số (câu nói về vị trí, độ sáng, giới tính, năm sinh, sao khác đã được lược). Nếu một câu vẫn còn nêu điều kiện (độ sáng, Tứ Hóa, sao hội chiếu), đối chiếu với CONTEXT_DATA trước khi dùng; không khớp thì bỏ qua câu đó.
12. Lời cổ thư mang tính phán quyết nặng ("khắc cha", "chết yểu", "ly dị", "tàn tật"...) phải diễn đạt lại thành xu hướng hoặc điểm cần lưu ý, có điều kiện kèm theo; không lặp nguyên văn gây hoang mang, không chẩn đoán y khoa.
13. Không tự xưng là AI, trợ lý ảo hay mô hình ngôn ngữ, không nhắc tên công nghệ hay nhà cung cấp; đi thẳng vào luận giải. Không tự nhận là chuyên gia hay người thật.

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

const SINGLE_PALACE_STRUCTURE = `### Kết luận
2-3 câu tóm tắt xu hướng chính của cung, chỉ nêu điều có căn cứ ở các mục dưới.

### Cơ sở lá số
Sao, độ sáng, Tứ Hóa, Phi Hóa, tam phương, xung chiếu, giáp cung và đại vận / tiểu vận của cung (nếu cung đang được kích hoạt ở năm xem).

### Tri thức được truy xuất
Tóm lược các mục KNOWLEDGE đã khớp với cung (ghi [NGUỒN]); nếu có cách hiểu khác nhau thì nêu đủ các cách hiểu.

### Phân tích
Kết hợp cơ sở lá số và tri thức (ghi [PHÂN TÍCH]); không kết luận từ một sao đứng riêng.

### Điểm chưa đủ dữ liệu
Những gì chưa thể kết luận vì thiếu dữ liệu hoặc thiếu tri thức khớp (ghi [THIẾU DỮ LIỆU]).`;

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
const MAX_RELATED_PALACE_LENGTH = 200;

// Cắt ở ranh giới câu gần nhất trước giới hạn - không đưa cho AI nửa câu (dễ bị hiểu sai nghĩa).
function clipAtSentence(text: string, max: number): string {
  const value = String(text);
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"), cut.lastIndexOf("; "), cut.lastIndexOf("\n"));
  return (end > max * 0.5 ? cut.slice(0, end + 1) : cut).trim() + " …";
}

function buildContextData(palaces: PalaceSummary[]): string {
  const palaceContexts = palaces.map((p) => ({
    cung: p.name,
    viTri: `${p.stem} ${p.branch}`,
    isBodyPalace: p.isBodyPalace || undefined,
    // "Tài Bạch (Ngọ): Thiên Cơ (đắc); Thiên Khôi" - tên cung kèm sao để AI luận hội chiếu / xung chiếu / giáp.
    tamPhuong: p.tamPhuong?.slice(0, 2).map((x) => String(x).slice(0, MAX_RELATED_PALACE_LENGTH)),
    xungChieu: p.xungChieu ? String(p.xungChieu).slice(0, MAX_RELATED_PALACE_LENGTH) : undefined,
    giapCung: p.giapCung?.slice(0, 2).map((x) => String(x).slice(0, MAX_RELATED_PALACE_LENGTH)),
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
      triThuc: p.knowledgeTexts.slice(0, MAX_KNOWLEDGE_TEXTS_PER_PALACE).map((text) => clipAtSentence(text, MAX_KNOWLEDGE_TEXT_LENGTH)),
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
      JSON.stringify({ success: false, error: "Dịch vụ luận giải chưa sẵn sàng. Vui lòng thử lại sau." }),
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
        JSON.stringify({ success: false, error: "Thiếu dữ liệu lá số" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (body.palaces.length > 20) {
      return new Response(
        JSON.stringify({ success: false, error: "Dữ liệu lá số không hợp lệ" }),
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
        JSON.stringify({ success: false, error: "Chưa nhận được kết quả luận giải. Vui lòng thử lại." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, analysis: text }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    // Chi tiết lỗi chỉ ghi log phía server; người dùng nhận thông báo chung (không lộ thông tin hệ thống).
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Chưa tạo được phần luận giải lúc này. Vui lòng thử lại sau ít phút." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

export const onRequestOptions: PagesFunction = async (context) => {
  return new Response(null, { headers: buildCorsHeaders(context.request) });
};
