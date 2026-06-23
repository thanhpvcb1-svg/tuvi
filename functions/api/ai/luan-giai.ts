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

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
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

const sanitizeRecord = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const normalizeErrorText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const sanitizeInput = (value: AIAnalysisRequest) => {
  const profile = sanitizeRecord(value.profile);
  const basicChart = sanitizeRecord(value.basicChart);
  const bacPhai = sanitizeRecord(value.bacPhai);
  const periods = sanitizeRecord(value.periods);
  const thaiTueNhapQuai = sanitizeRecord(value.thaiTueNhapQuai);

  return {
    analysisMode: cleanText(value.analysisMode) === "basic" ? ("basic" as AnalysisMode) : ("bac-phai" as AnalysisMode),
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
    tongQuanMenhCuc:
      cleanText(input.tongQuanMenhCuc) || fallbackText || "AI chưa trả về phần tổng quan mệnh cục chi tiết.",
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
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
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
- Diễn giải dữ liệu lá số đã được hệ thống tính sẵn.
- Không tự tính lại lá số.
- Không tự bịa thêm sao, cung, đại vận hoặc tiểu vận nếu dữ liệu không có.
- Không khẳng định chắc chắn 100%.
- Không dùng ngôn ngữ mê tín cực đoan.
- Không đưa lời khuyên y tế, pháp lý, đầu tư tài chính như chỉ dẫn chuyên môn.
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

const buildBacPhaiPrompt = (input: ReturnType<typeof sanitizeInput>) => `Bạn là trợ lý luận giải lá số Tử Vi bằng tiếng Việt, thiên về Bắc Phái và Phi Hóa.

Vai trò:
- Diễn giải dữ liệu lá số đã được hệ thống tính sẵn.
- Ưu tiên xem dòng Phi Hóa giữa các cung, Tứ Hóa, can cung, Đại Vận, Lưu Niên, Thái Tuế Nhập Quái nếu dữ liệu có.
- Không tự an sao, không tự tính can cung, không tự tính Tứ Hóa.
- Nếu dữ liệu thiếu, nói rõ dữ liệu hiện tại chưa đủ để luận sâu phần đó.

Nguyên tắc:
- Dùng ngôn ngữ đời sống, rõ ràng, thực tế.
- Không dùng từ “chắc chắn”, “định mệnh”, “không tránh được”.
- Không hù dọa người dùng về vận hạn.
- Không đưa lời khuyên y tế, pháp lý, đầu tư tài chính như chỉ dẫn chuyên môn.
- Trả về JSON hợp lệ, không markdown, không code fence.

Dữ liệu lá số:
${JSON.stringify(input, null, 2)}

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

const mapGeminiError = (status: number, message: string) => {
  const normalized = normalizeErrorText(message);

  if (normalized.includes("user location is not supported")) {
    return {
      status: 503,
      error: "Gemini hiện chưa hỗ trợ khu vực máy chủ đang chạy. Frontend nên dùng bản luận giải fallback.",
      reason: "unsupported_region",
    };
  }

  if (normalized.includes("api key not valid") || normalized.includes("invalid api key")) {
    return {
      status: 502,
      error: "GEMINI_API_KEY không hợp lệ hoặc đã hết hiệu lực trên Cloudflare Pages.",
      reason: "invalid_api_key",
    };
  }

  if (status === 429 || normalized.includes("quota") || normalized.includes("rate limit")) {
    return {
      status: 429,
      error: "Gemini đang bận hoặc tài khoản đã chạm quota. Vui lòng thử lại sau ít phút.",
      reason: "quota_or_rate_limit",
    };
  }

  if (status === 401 || status === 403) {
    return {
      status: 502,
      error: "Cloudflare Pages chưa được phép gọi Gemini bằng cấu hình hiện tại.",
      reason: "unauthorized_upstream",
    };
  }

  return {
    status: 502,
    error: message || "Chưa thể tạo luận giải. Vui lòng thử lại sau.",
    reason: "unknown_upstream_error",
  };
};

export const onRequest = async ({ request, env }: PagesContext) => {
  try {
    if (request.method !== "POST") {
      return json(405, { ok: false, error: "Chỉ hỗ trợ POST." });
    }

    if (!env.GEMINI_API_KEY) {
      return json(500, {
        ok: false,
        error: "Missing GEMINI_API_KEY trong Cloudflare Pages environment.",
        reason: "missing_api_key",
      });
    }

    let body: AIAnalysisRequest;
    try {
      body = (await request.json()) as AIAnalysisRequest;
    } catch {
      return json(400, { ok: false, error: "Body JSON không hợp lệ.", reason: "invalid_json_body" });
    }

    const sanitized = sanitizeInput(body || {});
    if (!isValidInput(sanitized)) {
      return json(400, {
        ok: false,
        error: "Thiếu dữ liệu cần thiết để luận giải. Cần tối thiểu ngày sinh, giới tính, năm xem và dữ liệu lá số đã tính sẵn.",
        reason: "invalid_input",
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
    } catch (error) {
      console.error("Gemini fetch failed", error);
      return json(502, {
        ok: false,
        error: "Chưa thể tạo luận giải. Vui lòng thử lại sau.",
        reason: "upstream_fetch_failed",
      });
    }

    const geminiText = await geminiResponse.text();
    let geminiPayload: any = {};

    if (geminiText) {
      try {
        geminiPayload = JSON.parse(geminiText);
      } catch {
        geminiPayload = { rawText: geminiText };
      }
    }

    if (!geminiResponse.ok) {
      const upstreamMessage =
        cleanText(geminiPayload?.error?.message) ||
        cleanText(geminiPayload?.message) ||
        cleanText(geminiPayload?.rawText);
      const mapped = mapGeminiError(geminiResponse.status, upstreamMessage);

      console.error("Gemini upstream error", {
        status: geminiResponse.status,
        upstreamMessage,
        mappedReason: mapped.reason,
      });

      return json(mapped.status, {
        ok: false,
        error: mapped.error,
        reason: mapped.reason,
      });
    }

    const rawText = extractText(geminiPayload);
    if (!rawText) {
      return json(502, {
        ok: false,
        error: "AI chưa trả về nội dung luận giải.",
        reason: "empty_ai_content",
      });
    }

    const parsed = tryParseJson(rawText);
    const data = normalizeNewResult(parsed, parsed ? "" : rawText);

    return json(200, {
      ok: true,
      data,
    });
  } catch (error) {
    console.error("AI analysis function crashed", error);
    return json(500, {
      ok: false,
      error: "Function luận giải bị lỗi nội bộ. Vui lòng kiểm tra log Cloudflare Pages.",
      reason: "function_crash",
    });
  }
};
