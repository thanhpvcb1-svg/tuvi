/**
 * Test script cho Gemini luận giải
 * Chạy: npx tsx scripts/test-gemini-luan.ts
 */

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

ĐỐI VỚI PHI HÓA:

Nếu dữ liệu có Phi Hóa, hãy xác định:
* cung phát Phi Hóa
* loại Phi Hóa: Lộc/Quyền/Khoa/Kỵ
* cung đích

Sau đó giải thích mối liên hệ giữa cung phát và cung nhận.

Nếu dữ liệu không đủ: "Dữ liệu chưa đủ để kết luận."

Không khẳng định tuyệt đối.

Trả lời bằng tiếng Việt, tự nhiên, dễ hiểu, tập trung điểm chính, không lan man.`;

// ============ SAMPLE DATA ============

const sampleChartData = {
  gender: "Nam",
  yearToView: 2025,
  menhChu: "Tham Lang",
  thanChu: "Thiên Cơ",
  cuc: "Thủy Nhị Cục",
};

const sampleContextData = {
  palaces: [
    {
      cung: "Mệnh",
      viTri: "Nhâm Tuất",
      chinhTinh: ["Phá Quân"],
      catTinh: ["Văn Xương", "Thiên Khôi"],
      phiHoa: ["Lộc → Tài Bạch", "Kỵ → Phu Thê"],
    },
    {
      cung: "Tài Bạch",
      viTri: "Giáp Tý",
      chinhTinh: ["Tử Vi", "Thiên Phủ"],
      catTinh: ["Lộc Tồn"],
      phiHoa: ["Lộc → Quan Lộc"],
    },
    {
      cung: "Quan Lộc",
      viTri: "Bính Dần",
      chinhTinh: ["Liêm Trinh", "Tham Lang"],
      hungTinh: ["Kình Dương"],
      phiHoa: ["Kỵ → Mệnh"],
    },
    {
      cung: "Phu Thê",
      viTri: "Quý Dậu",
      chinhTinh: ["Thái Âm"],
      isBodyPalace: true,
    },
    {
      cung: "Phúc Đức",
      viTri: "Tân Mùi",
      chinhTinh: ["Thiên Đồng", "Cự Môn"],
    },
  ],
  phiHoaCanCung: {
    hoaLoc: [
      { cungPhat: "Mệnh", chiTiet: "Lộc → Tài Bạch" },
      { cungPhat: "Tài Bạch", chiTiet: "Lộc → Quan Lộc" },
    ],
    hoaKy: [
      { cungPhat: "Mệnh", chiTiet: "Kỵ → Phu Thê" },
      { cungPhat: "Quan Lộc", chiTiet: "Kỵ → Mệnh" },
    ],
  },
};

const sampleKnowledge = [
  {
    cung: "Mệnh",
    triThuc: [
      "Phá Quân tọa Mệnh: tính cách mạnh mẽ, quyết đoán, thích thay đổi, không ngại phá vỡ cái cũ để xây dựng cái mới.",
      "Mệnh phi Lộc nhập Tài Bạch: bản thân có khả năng tạo ra tài lộc, tiền bạc đến từ nỗ lực cá nhân.",
      "Mệnh phi Kỵ nhập Phu Thê: tình cảm dễ gặp trắc trở, cần chú ý giao tiếp trong hôn nhân.",
    ],
  },
  {
    cung: "Tài Bạch",
    triThuc: [
      "Tử Vi Thiên Phủ đồng cung Tài Bạch: tài lộc vững chắc, có quý nhân hỗ trợ về tài chính.",
      "Lộc Tồn tại Tài Bạch: có khả năng tích lũy, giữ tiền tốt.",
      "Tài Bạch phi Lộc nhập Quan Lộc: tiền bạc đến từ công việc, sự nghiệp.",
    ],
  },
  {
    cung: "Quan Lộc",
    triThuc: [
      "Liêm Trinh Tham Lang đồng cung Quan Lộc: sự nghiệp có tính cạnh tranh, phù hợp kinh doanh, giao tiếp.",
      "Kình Dương tại Quan Lộc: công việc có áp lực, cần quyết đoán.",
      "Quan Lộc phi Kỵ nhập Mệnh: công việc gây áp lực cho bản thân, cần cân bằng.",
    ],
  },
];

// ============ BUILD PROMPT ============

function buildPrompt(): string {
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
${JSON.stringify(sampleChartData, null, 2)}

CONTEXT_DATA:
${JSON.stringify(sampleContextData, null, 2)}

KNOWLEDGE:
${JSON.stringify(sampleKnowledge, null, 2)}`;
}

// ============ CALL GEMINI ============

async function callGemini() {
  if (!GEMINI_API_KEY) {
    console.error("❌ Chưa có VITE_GEMINI_API_KEY");
    console.log("Hãy set environment variable: export VITE_GEMINI_API_KEY=your_key");
    return;
  }

  console.log("🔮 Đang gọi Gemini...");
  console.log(`📍 Model: ${GEMINI_MODEL}`);
  console.log("");

  const prompt = buildPrompt();
  
  console.log("📝 PROMPT:");
  console.log("=".repeat(60));
  console.log(prompt);
  console.log("=".repeat(60));
  console.log("");

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
      console.error("❌ Lỗi API:", response.status);
      console.error(errorText);
      return;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      console.error("❌ Không nhận được phản hồi từ Gemini");
      return;
    }

    console.log("✅ KẾT QUẢ LUẬN GIẢI:");
    console.log("=".repeat(60));
    console.log(text);
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ Lỗi:", error);
  }
}

// Run
callGemini();
