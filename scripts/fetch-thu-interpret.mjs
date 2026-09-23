/**
 * Fetch chart + luận tổng quan cho: Thủ - 26/10/1998 dương lịch 00:30 - Nam
 * Run: node scripts/fetch-thu-interpret.mjs
 */

const COHOC_CORE_URL = "https://tuvi.cohoc.net/Core.html";
const COHOC_FORM_URL = "https://tuvi.cohoc.net/lap-la-so-tu-vi.html";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
};

// Main star meanings
const MAIN_STAR_MEANINGS = {
  "Tử vi": { nature: "Đế tinh", keywords: ["lãnh đạo", "uy quyền", "cao quý"] },
  "Thiên cơ": { nature: "Mưu sĩ tinh", keywords: ["thông minh", "linh hoạt", "mưu lược"] },
  "Thái dương": { nature: "Quý tinh", keywords: ["rộng lượng", "bác ái", "danh tiếng"] },
  "Vũ khúc": { nature: "Tài tinh", keywords: ["tài chính", "quyết đoán", "thực tế"] },
  "Thiên đồng": { nature: "Phúc tinh", keywords: ["hiền lành", "an nhàn", "hưởng thụ"] },
  "Liêm trinh": { nature: "Tù tinh", keywords: ["chính trực", "cứng cỏi", "pháp luật"] },
  "Thiên phủ": { nature: "Tài khố tinh", keywords: ["giàu có", "ổn định", "tích lũy"] },
  "Thái âm": { nature: "Phú tinh", keywords: ["bất động sản", "tình cảm", "nghệ thuật"] },
  "Tham lang": { nature: "Đào hoa tinh", keywords: ["ham muốn", "đa tài", "giao tiếp"] },
  "Cự môn": { nature: "Ám tinh", keywords: ["ăn nói", "tranh cãi", "miệng lưỡi"] },
  "Thiên tướng": { nature: "Ấn tinh", keywords: ["được giúp đỡ", "ấn tín", "phúc đức"] },
  "Thiên lương": { nature: "Ấm tinh", keywords: ["trường thọ", "thanh cao", "y dược"] },
  "Thất sát": { nature: "Tướng tinh", keywords: ["quyết đoán", "dũng cảm", "biến động"] },
  "Phá quân": { nature: "Hao tinh", keywords: ["phá cách", "tiên phong", "thay đổi"] },
};

const BRIGHTNESS_MAP = { "M": "Miếu", "V": "Vượng", "Đ": "Đắc", "B": "Bình", "H": "Hãm" };

async function fetchAndInterpret() {
  console.log("=== LÁ SỐ TỬ VI: THỦ ===\n");
  console.log("Ngày sinh: 26/10/1998 (dương lịch)");
  console.log("Giờ sinh: 00:30 (giờ Tý)");
  console.log("Giới tính: Nam\n");
  
  try {
    // Fetch data
    const params = new URLSearchParams({
      version: "20211215",
      hoten: "Thủ",
      isDuong: "1",
      isNam: "1",
      gio: "1", // Tý
      ngay: "7",
      thang: "9",
      nam: "1998",
      mau: "1",
      luuthaitue: "1",
      gioDH: "0",
      gioDM: "30",
      kieuls: "0",
      namHan: "2025",
      anTuHoa: "1",
    });
    
    const response = await fetch(`${COHOC_CORE_URL}?${params}`, {
      method: "GET",
      headers: { ...HEADERS, "Referer": COHOC_FORM_URL },
    });
    
    const json = await response.json();
    const info = json.Info;
    const palaces = json.Cac_cung;
    
    // === LUẬN TỔNG QUAN ===
    console.log("═".repeat(60));
    console.log("                    LUẬN TỔNG QUAN");
    console.log("═".repeat(60));
    
    // 1. Thông tin cơ bản
    console.log("\n【1. THÔNG TIN CƠ BẢN】\n");
    console.log(`• Âm Dương: ${info.AmDuong}`);
    console.log(`• Cục: ${info.Cuc}`);
    console.log(`• Mệnh: ${info.MenhCuc}`);
    console.log(`• Chủ Mệnh: ${info.ChuMenh}`);
    console.log(`• Chủ Thân: ${info.ChuThan}`);
    console.log(`• Lai Nhân Cung: ${info.LaiNhanCung || "N/A"}`);
    console.log(`• Nguyên Thần: ${info.NguyenThan || "N/A"}`);
    
    // 2. Cung Mệnh
    const menhPalace = palaces.find(p => p.Name === "Mệnh");
    console.log("\n【2. CUNG MỆNH】\n");
    if (menhPalace) {
      const mainStars = menhPalace.ChinhTinh;
      if (mainStars.length > 0) {
        for (const star of mainStars) {
          const meaning = MAIN_STAR_MEANINGS[star.Name];
          const brightness = BRIGHTNESS_MAP[star.Status] || "Bình";
          console.log(`• ${star.Name} (${brightness})`);
          if (meaning) {
            console.log(`  → ${meaning.nature}: ${meaning.keywords.join(", ")}`);
          }
        }
      }
      console.log(`• Trường Sinh: ${menhPalace.TrangSinh}`);
      if (menhPalace.Tuan) console.log(`• ⚠️ Có TUẦN`);
      if (menhPalace.Triet) console.log(`• ⚠️ Có TRIỆT`);
    }
    
    // 3. Tứ Hóa
    console.log("\n【3. TỨ HÓA】\n");
    const tuHoa = { loc: [], quyen: [], khoa: [], ky: [] };
    for (const palace of palaces) {
      for (const star of [...palace.Saotot, ...palace.Saoxau]) {
        if (star.Name === "Hóa lộc") tuHoa.loc.push(palace.Name);
        if (star.Name === "Hóa quyền") tuHoa.quyen.push(palace.Name);
        if (star.Name === "Hóa khoa") tuHoa.khoa.push(palace.Name);
        if (star.Name === "Hóa kỵ") tuHoa.ky.push(palace.Name);
      }
    }
    console.log(`• Hóa Lộc: ${tuHoa.loc.join(", ") || "N/A"} → Tài lộc, may mắn`);
    console.log(`• Hóa Quyền: ${tuHoa.quyen.join(", ") || "N/A"} → Quyền lực, chủ động`);
    console.log(`• Hóa Khoa: ${tuHoa.khoa.join(", ") || "N/A"} → Danh tiếng, học vấn`);
    console.log(`• Hóa Kỵ: ${tuHoa.ky.join(", ") || "N/A"} → Trở ngại, thị phi`);
    
    // 4. Các cung trọng yếu
    console.log("\n【4. CÁC CUNG TRỌNG YẾU】\n");
    const importantPalaces = ["Tài bạch", "Quan lộc", "Phu thê", "Thiên di"];
    for (const name of importantPalaces) {
      const palace = palaces.find(p => p.Name === name);
      if (palace) {
        const stars = palace.ChinhTinh.map(s => {
          const b = BRIGHTNESS_MAP[s.Status] || "";
          return b ? `${s.Name}(${b})` : s.Name;
        }).join(", ") || "Vô chính diệu";
        console.log(`• ${name}: ${stars}`);
      }
    }
    
    // 5. Đánh giá tổng quan
    console.log("\n【5. ĐÁNH GIÁ TỔNG QUAN】\n");
    
    // Đếm sao sáng/hãm
    let brightCount = 0, dimCount = 0;
    for (const palace of palaces) {
      for (const star of palace.ChinhTinh) {
        if (["M", "V", "Đ"].includes(star.Status)) brightCount++;
        if (star.Status === "H") dimCount++;
      }
    }
    
    console.log(`• Chính tinh sáng sủa: ${brightCount}`);
    console.log(`• Chính tinh hãm địa: ${dimCount}`);
    
    // Tứ Hóa cát/hung
    const catCount = tuHoa.loc.length + tuHoa.quyen.length + tuHoa.khoa.length;
    const hungCount = tuHoa.ky.length;
    console.log(`• Tứ Hóa cát: ${catCount} | Tứ Hóa hung: ${hungCount}`);
    
    // Nhận xét
    console.log("\n【6. NHẬN XÉT SƠ BỘ】\n");
    
    // Mệnh
    if (menhPalace?.ChinhTinh[0]?.Name === "Phá quân") {
      console.log("• Mệnh có Phá Quân: Tính cách tiên phong, thích thay đổi, phá cách.");
      console.log("  Cuộc đời nhiều biến động, cần học cách kiên định.");
      if (menhPalace.ChinhTinh[0].Status === "H") {
        console.log("  ⚠️ Phá Quân hãm địa: Cần cẩn thận hơn trong quyết định.");
      }
    }
    
    // Tứ Hóa
    if (tuHoa.loc.includes("Quan lộc")) {
      console.log("• Hóa Lộc tại Quan Lộc: Sự nghiệp thuận lợi, có cơ hội phát triển.");
    }
    if (tuHoa.ky.includes("Tử tức")) {
      console.log("• Hóa Kỵ tại Tử Tức: Cần lưu ý về con cái, đầu tư.");
    }
    
    // Thiên Di
    const diPalace = palaces.find(p => p.Name === "Thiên di");
    if (diPalace?.ChinhTinh.some(s => ["M", "V"].includes(s.Status))) {
      console.log("• Thiên Di sáng sủa: Thuận lợi khi ra ngoài, xuất ngoại.");
    }
    
    console.log("\n" + "═".repeat(60));
    console.log("Lưu ý: Đây là luận giải tổng quát. Cần xem thêm đại vận,");
    console.log("lưu niên và các yếu tố khác để có phân tích chi tiết hơn.");
    console.log("═".repeat(60));
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

fetchAndInterpret();
