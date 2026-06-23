type Env = {
  GEMINI_API_KEY?: string;
};

type PagesContext = {
  request: Request;
  env: Env;
};

type AnalysisMode = "basic" | "bac-phai";

type AIAnalysisRequest = {
  analysisMode?: unknown;
  profile?: unknown;
  basicChart?: unknown;
  palaces?: unknown;
  bacPhai?: unknown;
  thaiTueNhapQuai?: unknown;
  periods?: unknown;
  userQuestion?: unknown;
};

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
const DEFAULT_DISCLAIMER =
  "Nội dung chỉ mang tính tham khảo, không thay thế tư vấn chuyên môn về tài chính, y tế, pháp lý hoặc các quyết định quan trọng.";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const cleanText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const cleanList = (value: unknown, limit = 20) =>
  Array.isArray(value)
    ? value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .slice(0, limit)
    : [];

const sanitizeRecord = (value: unknown) => (value && typeof value === "object" ? (value as Record<string, unknown>) : {});

const sanitizeInput = (value: AIAnalysisRequest) => {
  const profile = sanitizeRecord(value.profile);
  const basicChart = sanitizeRecord(value.basicChart);
  const bacPhai = sanitizeRecord(value.bacPhai);
  const periods = sanitizeRecord(value.periods);
  const thaiTueNhapQuai = sanitizeRecord(value.thaiTueNhapQuai);

  return {
    analysisMode: cleanText(value.analysisMode) === "basic" ? "basic" : "bac-phai" as AnalysisMode,
    profile: {
      gender: cleanText(profile.gender),
      birthDate: cleanText(profile.birthDate),
      birthTime: cleanText(profile.birthTime),
      calendarType: cleanText(profile.calendarType),
      yearToView: typeof profile.yearToView === "number" ? profile.yearToView : Number(profile.yearToView),
    },
    basicChart,
    palaces: Array.isArray(value.palaces) ? value.palaces : [],
    bacPhai,
    thaiTueNhapQuai,
    periods,
    userQuestion: cleanText(value.userQuestion),
  };
};

const isValidInput = (value: ReturnType<typeof sanitizeInput>) => {
  const hasCoreFields = Boolean(value.profile.gender && value.profile.birthDate && value.profile.yearToView);
  const hasChartData = Boolean(
    Object.keys(value.basicChart).length > 0 ||
    value.palaces.length > 0 ||
    Object.keys(value.bacPhai).length > 0 ||
    Object.keys(value.periods).length > 0,
  );

  return hasCoreFields && hasChartData;
};

const normalizeNewResult = (value: unknown, fallbackText = "") => {
  const input = sanitizeRecord(value);
  const tuHoaNamSinh = sanitizeRecord(input.tuHoaNamSinh);

  return {
    tongQuanMenhCuc: cleanText(input.tongQuanMenhCuc) || fallbackText || "AI chưa trả về phần tổng quan mệnh cục chi tiết.",
    luanMenhThan: cleanText(input.luanMenhThan),
    trongTamBacPhai: cleanText(input.trongTamBacPhai),
    tuHoaNamSinh: {
      hoaLoc: cleanText(tuHoaNamSinh.hoaLoc),
      hoaQuyen: cleanText(tuHoaNamSinh.hoaQuyen),
      hoaKhoa: cleanText(tuHoaNamSinh.hoaKhoa),
      hoaKy: cleanText(tuHoaNamSinh.hoaKy),
    },
    phiHoaCanCung: Array.isArray(input.phiHoaCanCung) ? input.phiHoaCanCung : [],
    tuHoa: Array.isArray(input.tuHoa) ? input.tuHoa : [],
    thaiTueNhapQuai: cleanText(input.thaiTueNhapQuai),
    daiVan: cleanText(input.daiVan),
    luuNien: cleanText(input.luuNien),
    suNghiepTaiLoc: cleanText(input.suNghiepTaiLoc),
    tinhDuyenGiaDao: cleanText(input.tinhDuyenGiaDao),
    diemManh: cleanList(input.diemManh, 3),
    diemCanLuuY: cleanList(input.diemCanLuuY, 3),
    goiYHanhDong: cleanList(input.goiYHanhDong, 3),
    disclaimer: cleanText(input.disclaimer) || DEFAULT_DISCLAIMER,
  };
};

const extractText = (payload: any) =>
  payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part?.text || "")
    .filter(Boolean)
    .join("\n")
    .trim() || "";

const tryParseJson = (rawText: string) => {
  const trimmed = rawText.trim();
  const withoutFence = trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const candidates = [trimmed, withoutFence];
  const objectStart = withoutFence.indexOf("{");
  const objectEnd = withoutFence.lastIndexOf("}");

  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    candidates.push(withoutFence.slice(objectStart, objectEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  return null;
};

const buildBasicPrompt = (input: ReturnType<typeof sanitizeInput>) => `Bạn là trợ lý luận giải lá số tử vi bằng tiếng Việt.

Nhiệm vụ:
- Diễn giải dữ liệu lá số đã được hệ thống tính toán sẵn.
- Không tự tính lại lá số.
- Không tự bịa thêm sao, cung, đại vận hoặc tiểu vận nếu dữ liệu không có.
- Không khẳng định chắc chắn 100%.
- Không hù dọa người dùng về vận hạn.
- Không đưa lời khuyên y tế, pháp lý, đầu tư tài chính như chỉ dẫn chuyên môn.
- Không dùng ngôn ngữ mê tín cực đoan.
- Văn phong rõ ràng, dễ hiểu, tích cực, thực tế.
- Nội dung chỉ mang tính tham khảo.
- Trả về JSON hợp lệ, không markdown, không code fence.

Dữ liệu lá số:
${JSON.stringify(input, null, 2)}

Trả về đúng schema:
{
  "tongQuanMenhCuc": "string",
  "luanMenhThan": "string",
  "trongTamBacPhai": "",
  "tuHoaNamSinh": { "hoaLoc": "", "hoaQuyen": "", "hoaKhoa": "", "hoaKy": "" },
  "phiHoaCanCung": [],
  "tuHoa": [],
  "thaiTueNhapQuai": "",
  "daiVan": "string",
  "luuNien": "string",
  "suNghiepTaiLoc": "string",
  "tinhDuyenGiaDao": "string",
  "diemManh": ["string", "string", "string"],
  "diemCanLuuY": ["string", "string", "string"],
  "goiYHanhDong": ["string", "string", "string"],
  "disclaimer": "${DEFAULT_DISCLAIMER}"
}`;

const buildBacPhaiPrompt = (input: ReturnType<typeof sanitizeInput>) => `Bạn là trợ lý luận giải lá số Tử Vi bằng tiếng Việt, thiên về trường phái Bắc Phái và Phi Hóa.

Vai trò:
- Diễn giải dữ liệu lá số đã được hệ thống tính toán sẵn.
- Phân tích theo các lớp: tổng quan mệnh cục, 12 cung, Tứ Hóa, Phi Hóa Can Cung, tự hóa, hóa nhập/hóa xuất, Đại Vận, Lưu Niên, Thái Tuế Nhập Quái nếu dữ liệu có.
- Không tự an sao.
- Không tự tính can cung.
- Không tự tính Tứ Hóa.
- Không tự suy diễn Thái Tuế Nhập Quái nếu dữ liệu chưa được cung cấp.
- Không bịa sao, cung, hóa khí, cung nhập, cung xuất.
- Nếu dữ liệu thiếu, ghi rõ: “Dữ liệu hiện tại chưa đủ để luận phần này.”

Nguyên tắc luận giải:
1. Bắc Phái ưu tiên xem dòng khí Phi Hóa giữa các cung, không chỉ liệt kê sao.
2. Khi luận Hóa Lộc, cần diễn giải về duyên, cơ hội, nguồn lợi, điểm hấp dẫn, nơi sinh tài hoặc nơi phát sinh mong muốn.
3. Khi luận Hóa Quyền, cần diễn giải về quyền chủ động, áp lực hành động, năng lực kiểm soát, trách nhiệm hoặc cạnh tranh.
4. Khi luận Hóa Khoa, cần diễn giải về danh tiếng, sự bảo hộ, học hỏi, giải ách, quý nhân, khả năng làm mềm vấn đề.
5. Khi luận Hóa Kỵ, cần diễn giải về điểm nghẽn, chấp niệm, hao tổn, vướng mắc, bài học cần xử lý. Không được hù dọa.
6. Khi có phi hóa từ cung A sang cung B, phải giải thích:
   - Cung A là nguồn phát động.
   - Cung B là nơi nhận tác động.
   - Hóa khí là tính chất của dòng tác động.
   - Quan hệ này ảnh hưởng đến chủ đề gì trong đời sống.
7. Khi có tự hóa, phải giải thích như một cơ chế nội tại của cung đó: tự sinh, tự tiêu, tự tạo áp lực, tự hóa giải hoặc tự mâu thuẫn tùy loại hóa.
8. Khi có hóa nhập/hóa xuất, phải phân biệt:
   - Hóa nhập: năng lượng đi vào cung nhận, tạo duyên hoặc vấn đề ở cung nhận.
   - Hóa xuất: năng lượng bị đưa ra ngoài, dễ hao tán hoặc phải xử lý qua ngoại cảnh.
9. Khi có xung chiếu, đối cung, tam hợp hoặc hội chiếu, chỉ luận nếu dữ liệu cung cấp quan hệ đó.
10. Khi luận Đại Vận, phải xem đây là bối cảnh 10 năm, không kết luận như sự kiện chắc chắn.
11. Khi luận Lưu Niên, phải xem đây là xu hướng của năm được hỏi, cần liên hệ Đại Vận nếu dữ liệu có.
12. Khi luận Thái Tuế Nhập Quái, chỉ diễn giải các cung/sao/điểm kích hoạt được cung cấp trong payload.
13. Luôn diễn giải bằng ngôn ngữ đời sống: công việc, tài chính, quan hệ, tình cảm, gia đình, sức khỏe tinh thần, định hướng hành động.
14. Không đưa lời khuyên y tế, pháp lý, đầu tư tài chính như chỉ dẫn chuyên môn.
15. Không dùng ngôn ngữ mê tín cực đoan.
16. Không khẳng định “chắc chắn xảy ra”.
17. Ưu tiên các cách diễn đạt như “có xu hướng”, “dễ phát sinh”, “nên thận trọng”, “phù hợp để xem xét”, “cần quản trị kỳ vọng”, “đây là điểm cần quan sát”.
18. Nội dung chỉ mang tính tham khảo.

Dữ liệu lá số:
${JSON.stringify(input, null, 2)}

Yêu cầu output:
- Trả về JSON hợp lệ.
- Không markdown.
- Không code fence.
- Mỗi mục viết bằng tiếng Việt tự nhiên.
- Nếu thiếu dữ liệu của mục nào, ghi ngắn gọn rằng dữ liệu chưa đủ để luận mục đó.
- Không được thêm trường ngoài schema.

Schema output:
{
  "tongQuanMenhCuc": "string",
  "luanMenhThan": "string",
  "trongTamBacPhai": "string",
  "tuHoaNamSinh": {
    "hoaLoc": "string",
    "hoaQuyen": "string",
    "hoaKhoa": "string",
    "hoaKy": "string"
  },
  "phiHoaCanCung": [
    {
      "fromPalace": "string",
      "toPalace": "string",
      "transformation": "Lộc | Quyền | Khoa | Kỵ",
      "analysis": "string"
    }
  ],
  "tuHoa": [
    {
      "palace": "string",
      "transformation": "Lộc | Quyền | Khoa | Kỵ",
      "analysis": "string"
    }
  ],
  "thaiTueNhapQuai": "string",
  "daiVan": "string",
  "luuNien": "string",
  "suNghiepTaiLoc": "string",
  "tinhDuyenGiaDao": "string",
  "diemManh": ["string", "string", "string"],
  "diemCanLuuY": ["string", "string", "string"],
  "goiYHanhDong": ["string", "string", "string"],
  "disclaimer": "${DEFAULT_DISCLAIMER}"
}`;

const buildPrompt = (input: ReturnType<typeof sanitizeInput>) =>
  input.analysisMode === "basic" ? buildBasicPrompt(input) : buildBacPhaiPrompt(input);

export const onRequest = async ({ request, env }: PagesContext) => {
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Chỉ hỗ trợ POST." });
  }

  if (!env.GEMINI_API_KEY) {
    return json(500, { ok: false, error: "Missing GEMINI_API_KEY trong Cloudflare Pages environment." });
  }

  let body: AIAnalysisRequest;
  try {
    body = (await request.json()) as AIAnalysisRequest;
  } catch {
    return json(400, { ok: false, error: "Body JSON không hợp lệ." });
  }

  const sanitized = sanitizeInput(body || {});
  if (!isValidInput(sanitized)) {
    return json(400, {
      ok: false,
      error: "Thiếu dữ liệu cần thiết để luận giải. Cần tối thiểu ngày sinh, giới tính, năm xem và dữ liệu lá số đã tính sẵn.",
    });
  }

  let geminiResponse: Response;
  try {
    geminiResponse = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(sanitized) }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1700,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch {
    return json(502, { ok: false, error: "Chưa thể tạo luận giải. Vui lòng thử lại sau." });
  }

  let geminiPayload: any = {};
  try {
    geminiPayload = await geminiResponse.json();
  } catch {
    return json(502, { ok: false, error: "Dịch vụ AI trả về dữ liệu không hợp lệ." });
  }

  if (!geminiResponse.ok) {
    const upstreamMessage = cleanText(geminiPayload?.error?.message);
    if (geminiResponse.status === 429) {
      return json(429, { ok: false, error: "Dịch vụ AI đang bận, vui lòng thử lại sau ít phút." });
    }

    return json(502, {
      ok: false,
      error: upstreamMessage || "Chưa thể tạo luận giải. Vui lòng thử lại sau.",
    });
  }

  const rawText = extractText(geminiPayload);
  if (!rawText) {
    return json(502, { ok: false, error: "AI chưa trả về nội dung luận giải." });
  }

  const parsed = tryParseJson(rawText);
  const data = normalizeNewResult(parsed, parsed ? "" : rawText);

  return json(200, {
    ok: true,
    data,
  });
};
