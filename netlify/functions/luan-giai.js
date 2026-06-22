const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

function buildPrompt(chartData) {
  return `Bạn là trợ lý luận giải lá số tử vi bằng tiếng Việt.
Chỉ luận giải dựa trên dữ liệu lá số được cung cấp, không bịa thêm dữ liệu không có.
Văn phong dễ hiểu, mềm mại, thực tế, không hù dọa.
Không khẳng định tuyệt đối về số mệnh.
Nội dung chỉ mang tính tham khảo/giải trí, không thay thế tư vấn chuyên môn.

Hãy trình bày theo cấu trúc:

1. Tổng quan lá số
2. Tính cách và nội tâm
3. Công việc và sự nghiệp
4. Tài chính
5. Tình cảm và gia đạo
6. Sức khỏe và năng lượng cá nhân
7. Điểm mạnh nên phát huy
8. Điểm cần lưu ý
9. Lời khuyên tổng kết

Yêu cầu chất lượng:
- Viết bằng tiếng Việt.
- Có tiêu đề rõ ràng.
- Không quá ngắn.
- Không dùng lời lẽ mê tín cực đoan.
- Không đưa lời khuyên y tế, tài chính, pháp lý như kết luận chắc chắn.
- Luôn có disclaimer cuối bài:
"Nội dung luận giải chỉ mang tính tham khảo/giải trí, không thay thế cho tư vấn chuyên môn."

Dữ liệu lá số:
${JSON.stringify(chartData, null, 2)}`;
}

async function callGemini(apiKey, model, chartData) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(chartData) }],
          },
        ],
        generationConfig: {
          temperature: 0.65,
          topP: 0.9,
          maxOutputTokens: 4096,
        },
      }),
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || `Gemini API error: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const result = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n\n");
  if (!result) {
    throw new Error("Gemini không trả về nội dung luận giải.");
  }

  return result;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Chỉ hỗ trợ POST." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return json(500, { error: "Server chưa cấu hình GEMINI_API_KEY." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Request JSON không hợp lệ." });
  }

  const chartData = payload?.chart;
  if (!chartData || typeof chartData !== "object" || !chartData.profile || !Array.isArray(chartData.palaces)) {
    return json(400, { error: "Thiếu dữ liệu lá số hợp lệ." });
  }

  let lastError;
  for (const model of GEMINI_MODELS) {
    try {
      const result = await callGemini(process.env.GEMINI_API_KEY, model, chartData);
      return json(200, { result });
    } catch (error) {
      lastError = error;
      if (error.status && error.status !== 404 && error.status !== 400) {
        break;
      }
    }
  }

  console.error("Gemini luận giải failed:", lastError);
  return json(502, {
    error: lastError?.message || "Không gọi được Gemini API. Vui lòng thử lại sau.",
  });
};
