/**
 * CoHoc Chart Interpretation Module
 * Luận giải lá số từ data CoHoc.net
 */

// Brightness interpretation
const BRIGHTNESS_MEANING: Record<string, { level: string; desc: string }> = {
  "M": { level: "Miếu", desc: "rất tốt, phát huy tối đa" },
  "V": { level: "Vượng", desc: "tốt, có sức mạnh" },
  "Đ": { level: "Đắc", desc: "khá tốt, được địa" },
  "B": { level: "Bình", desc: "bình thường, trung tính" },
  "H": { level: "Hãm", desc: "yếu, bị hạn chế" },
  "": { level: "Bình", desc: "trung tính" },
};

// Main star meanings
const MAIN_STAR_MEANINGS: Record<string, { nature: string; keywords: string[] }> = {
  "Tử vi": { nature: "Đế tinh, chủ về quyền lực", keywords: ["lãnh đạo", "uy quyền", "cao quý", "tự trọng"] },
  "Thiên cơ": { nature: "Mưu sĩ tinh, chủ về trí tuệ", keywords: ["thông minh", "linh hoạt", "mưu lược", "hay thay đổi"] },
  "Thái dương": { nature: "Quý tinh, chủ về quang minh", keywords: ["rộng lượng", "bác ái", "nam giới", "danh tiếng"] },
  "Vũ khúc": { nature: "Tài tinh, chủ về tài lộc", keywords: ["tài chính", "quyết đoán", "cứng rắn", "thực tế"] },
  "Thiên đồng": { nature: "Phúc tinh, chủ về an nhàn", keywords: ["hiền lành", "an nhàn", "hưởng thụ", "lười biếng"] },
  "Liêm trinh": { nature: "Tù tinh, chủ về hình ngục", keywords: ["chính trực", "cứng cỏi", "pháp luật", "thị phi"] },
  "Thiên phủ": { nature: "Tài khố tinh", keywords: ["giàu có", "ổn định", "bảo thủ", "tích lũy"] },
  "Thái âm": { nature: "Phú tinh, chủ về điền sản", keywords: ["nữ giới", "bất động sản", "tình cảm", "nghệ thuật"] },
  "Tham lang": { nature: "Đào hoa tinh", keywords: ["ham muốn", "đa tài", "giao tiếp", "tửu sắc"] },
  "Cự môn": { nature: "Ám tinh, chủ về thị phi", keywords: ["ăn nói", "tranh cãi", "nghi ngờ", "miệng lưỡi"] },
  "Thiên tướng": { nature: "Ấn tinh, chủ về quý nhân", keywords: ["được giúp đỡ", "ấn tín", "phúc đức", "y phục"] },
  "Thiên lương": { nature: "Ấm tinh, chủ về thọ", keywords: ["trường thọ", "thanh cao", "bảo vệ", "y dược"] },
  "Thất sát": { nature: "Tướng tinh, chủ về quyền uy", keywords: ["quyết đoán", "dũng cảm", "cô độc", "biến động"] },
  "Phá quân": { nature: "Hao tinh, chủ về phá hoại", keywords: ["phá cách", "tiên phong", "thay đổi", "hao tán"] },
};

// Palace meanings
const PALACE_MEANINGS: Record<string, { area: string; governs: string[] }> = {
  "Mệnh": { area: "Bản thân", governs: ["tính cách", "ngoại hình", "vận mệnh tổng quát", "cách sống"] },
  "Phụ mẫu": { area: "Cha mẹ", governs: ["quan hệ với cha mẹ", "di truyền", "học vấn", "cấp trên"] },
  "Phúc đức": { area: "Phúc đức", governs: ["phúc phần", "tâm linh", "hưởng thụ", "tuổi già"] },
  "Điền trạch": { area: "Nhà cửa", governs: ["bất động sản", "gia đình", "nơi ở", "tài sản cố định"] },
  "Quan lộc": { area: "Sự nghiệp", governs: ["công việc", "sự nghiệp", "thành tựu", "địa vị xã hội"] },
  "Nô bộc": { area: "Bạn bè", governs: ["bạn bè", "cấp dưới", "đồng nghiệp", "người giúp việc"] },
  "Thiên di": { area: "Di chuyển", governs: ["xuất ngoại", "di chuyển", "quan hệ bên ngoài", "quý nhân"] },
  "Tật ách": { area: "Sức khỏe", governs: ["sức khỏe", "bệnh tật", "tai nạn", "thể chất"] },
  "Tài bạch": { area: "Tài chính", governs: ["tiền bạc", "thu nhập", "cách kiếm tiền", "tài lộc"] },
  "Tử tức": { area: "Con cái", governs: ["con cái", "hậu duệ", "sáng tạo", "đầu tư"] },
  "Phu thê": { area: "Hôn nhân", governs: ["vợ/chồng", "hôn nhân", "đối tác", "tình duyên"] },
  "Huynh đệ": { area: "Anh em", governs: ["anh chị em", "bạn thân", "đối thủ", "cạnh tranh"] },
};

// Tứ Hóa meanings
const TU_HOA_MEANINGS: Record<string, { name: string; nature: string; effect: string }> = {
  "Hóa lộc": { name: "Hóa Lộc", nature: "Cát", effect: "tăng tài lộc, may mắn, thuận lợi" },
  "Hóa quyền": { name: "Hóa Quyền", nature: "Cát", effect: "tăng quyền lực, chủ động, kiểm soát" },
  "Hóa khoa": { name: "Hóa Khoa", nature: "Cát", effect: "tăng danh tiếng, học vấn, quý nhân" },
  "Hóa kỵ": { name: "Hóa Kỵ", nature: "Hung", effect: "gây trở ngại, lo lắng, thị phi" },
};

// Trường Sinh meanings
const TRANG_SINH_MEANINGS: Record<string, { level: number; meaning: string }> = {
  "Trường sinh": { level: 1, meaning: "khởi đầu tốt, sinh sôi phát triển" },
  "Mộc dục": { level: 2, meaning: "giai đoạn tắm gội, cần che chở" },
  "Quan đới": { level: 3, meaning: "trưởng thành, bắt đầu có vị trí" },
  "Lâm quan": { level: 4, meaning: "đỉnh cao sự nghiệp, thăng tiến" },
  "Đế vượng": { level: 5, meaning: "cực thịnh, quyền lực tối đa" },
  "Suy": { level: 6, meaning: "bắt đầu suy giảm, cần cẩn thận" },
  "Bệnh": { level: 7, meaning: "yếu đuối, dễ gặp trở ngại" },
  "Tử": { level: 8, meaning: "suy yếu nhiều, cần nỗ lực gấp đôi" },
  "Mộ": { level: 9, meaning: "tiềm ẩn, cất giữ, chờ thời" },
  "Tuyệt": { level: 10, meaning: "khó khăn nhất, cần đột phá" },
  "Thai": { level: 11, meaning: "thai nghén, chuẩn bị chu kỳ mới" },
  "Dưỡng": { level: 12, meaning: "nuôi dưỡng, tích lũy năng lượng" },
};

type CoHocStar = {
  Name: string;
  Status?: string;
  NguHanh?: number;
  Highline?: number;
};

type CoHocPalace = {
  Name: string;
  ChinhTinh: CoHocStar[];
  Saotot: CoHocStar[];
  Saoxau: CoHocStar[];
  TrangSinh: string;
  Than?: number;
  Tuan?: number;
  Triet?: number;
};

type CoHocInfo = {
  AmDuong: string;
  Cuc: string;
  MenhCuc: string;
  ChuMenh: string;
  ChuThan: string;
  LaiNhanCung: string;
  NguyenThan: string;
  NamHan: string;
  Tuoi: number;
};

/**
 * Interpret a single star
 */
function interpretStar(star: CoHocStar): string {
  const meaning = MAIN_STAR_MEANINGS[star.Name];
  const brightness = BRIGHTNESS_MEANING[star.Status || ""] || BRIGHTNESS_MEANING[""];
  
  if (meaning) {
    return `**${star.Name}** (${brightness.level}): ${meaning.nature}. ${brightness.desc}. Từ khóa: ${meaning.keywords.join(", ")}.`;
  }
  
  return `**${star.Name}** (${brightness.level}): ${brightness.desc}.`;
}

/**
 * Interpret a palace
 */
function interpretPalace(palace: CoHocPalace): string {
  const palaceMeaning = PALACE_MEANINGS[palace.Name];
  const lines: string[] = [];
  
  // Header
  lines.push(`## ${palace.Name} (${palaceMeaning?.area || ""})`);
  lines.push("");
  
  // Governs
  if (palaceMeaning) {
    lines.push(`**Chủ về:** ${palaceMeaning.governs.join(", ")}`);
    lines.push("");
  }
  
  // Thân cư
  if (palace.Than === 1) {
    lines.push(`⭐ **Thân cư tại đây** - Cung này ảnh hưởng mạnh đến cuộc sống sau 30 tuổi.`);
    lines.push("");
  }
  
  // Tuần/Triệt
  if (palace.Tuan === 1) {
    lines.push(`⚠️ **Tuần** - Có sự ngăn cách, trì hoãn trong lĩnh vực này.`);
  }
  if (palace.Triet === 1) {
    lines.push(`⚠️ **Triệt** - Có sự đứt đoạn, khó khăn cần vượt qua.`);
  }
  
  // Main stars
  if (palace.ChinhTinh.length > 0) {
    lines.push("### Chính tinh:");
    for (const star of palace.ChinhTinh) {
      lines.push(`- ${interpretStar(star)}`);
    }
    lines.push("");
  } else {
    lines.push("### Chính tinh: Không có (Cung vô chính diệu)");
    lines.push("- Cung này chịu ảnh hưởng từ các cung xung chiếu và tam hợp.");
    lines.push("");
  }
  
  // Trường Sinh
  const trangSinh = TRANG_SINH_MEANINGS[palace.TrangSinh];
  if (trangSinh) {
    lines.push(`### Trường Sinh: ${palace.TrangSinh}`);
    lines.push(`- ${trangSinh.meaning}`);
    lines.push("");
  }
  
  // Good stars
  if (palace.Saotot.length > 0) {
    lines.push("### Sao tốt hỗ trợ:");
    const tuHoa = palace.Saotot.filter(s => s.Name.includes("Hóa"));
    const others = palace.Saotot.filter(s => !s.Name.includes("Hóa"));
    
    // Tứ Hóa first
    for (const star of tuHoa) {
      const meaning = TU_HOA_MEANINGS[star.Name];
      if (meaning) {
        lines.push(`- 🌟 **${star.Name}**: ${meaning.effect}`);
      }
    }
    
    // Other good stars
    const highlighted = others.filter(s => s.Highline === 1);
    const normal = others.filter(s => s.Highline !== 1);
    
    for (const star of highlighted) {
      lines.push(`- ✨ **${star.Name}** (nổi bật)`);
    }
    for (const star of normal.slice(0, 3)) {
      lines.push(`- ${star.Name}`);
    }
    if (normal.length > 3) {
      lines.push(`- ... và ${normal.length - 3} sao khác`);
    }
    lines.push("");
  }
  
  // Bad stars
  if (palace.Saoxau.length > 0) {
    lines.push("### Sao xấu cần lưu ý:");
    const tuHoa = palace.Saoxau.filter(s => s.Name.includes("Hóa"));
    const others = palace.Saoxau.filter(s => !s.Name.includes("Hóa"));
    
    // Hóa Kỵ first
    for (const star of tuHoa) {
      const meaning = TU_HOA_MEANINGS[star.Name];
      if (meaning) {
        lines.push(`- ⚠️ **${star.Name}**: ${meaning.effect}`);
      }
    }
    
    // Other bad stars
    const highlighted = others.filter(s => s.Highline === 1);
    for (const star of highlighted) {
      lines.push(`- ⚠️ **${star.Name}** (nổi bật)`);
    }
    const normal = others.filter(s => s.Highline !== 1);
    for (const star of normal.slice(0, 3)) {
      lines.push(`- ${star.Name}`);
    }
    lines.push("");
  }
  
  // Summary
  lines.push("### Tổng kết:");
  lines.push(generatePalaceSummary(palace));
  lines.push("");
  
  return lines.join("\n");
}

/**
 * Generate summary for a palace
 */
function generatePalaceSummary(palace: CoHocPalace): string {
  const mainStars = palace.ChinhTinh;
  const goodCount = palace.Saotot.length;
  const badCount = palace.Saoxau.length;
  const hasTuHoaGood = palace.Saotot.some(s => s.Name.includes("Hóa lộc") || s.Name.includes("Hóa quyền") || s.Name.includes("Hóa khoa"));
  const hasTuHoaBad = palace.Saoxau.some(s => s.Name.includes("Hóa kỵ"));
  
  let assessment = "";
  
  // Assess main stars
  if (mainStars.length === 0) {
    assessment = "Cung vô chính diệu, cần xem xét cung xung chiếu. ";
  } else {
    const goodBrightness = mainStars.filter(s => ["M", "V", "Đ"].includes(s.Status || "")).length;
    const badBrightness = mainStars.filter(s => s.Status === "H").length;
    
    if (goodBrightness > badBrightness) {
      assessment = "Chính tinh sáng sủa, nền tảng tốt. ";
    } else if (badBrightness > goodBrightness) {
      assessment = "Chính tinh hãm địa, cần nỗ lực nhiều hơn. ";
    } else {
      assessment = "Chính tinh trung bình. ";
    }
  }
  
  // Assess support
  if (hasTuHoaGood) {
    assessment += "Có Tứ Hóa cát hỗ trợ, thuận lợi. ";
  }
  if (hasTuHoaBad) {
    assessment += "Có Hóa Kỵ, cần cẩn thận thị phi, trở ngại. ";
  }
  
  // Overall balance
  if (goodCount > badCount + 2) {
    assessment += "Tổng thể cung này khá tốt.";
  } else if (badCount > goodCount + 2) {
    assessment += "Tổng thể cung này nhiều thử thách.";
  } else {
    assessment += "Tổng thể cung này cân bằng, có cả thuận lợi và khó khăn.";
  }
  
  return assessment;
}

/**
 * Generate full chart interpretation
 */
export function interpretCoHocChart(data: { Info: CoHocInfo; Cac_cung: CoHocPalace[] }): string {
  const lines: string[] = [];
  const info = data.Info;
  
  // Header
  lines.push("# LUẬN GIẢI LÁ SỐ TỬ VI");
  lines.push("");
  lines.push("---");
  lines.push("");
  
  // Overview
  lines.push("## Tổng quan");
  lines.push("");
  lines.push(`- **Âm Dương:** ${info.AmDuong}`);
  lines.push(`- **Cục:** ${info.Cuc}`);
  lines.push(`- **Mệnh:** ${info.MenhCuc}`);
  lines.push(`- **Chủ Mệnh:** ${info.ChuMenh}`);
  lines.push(`- **Chủ Thân:** ${info.ChuThan}`);
  lines.push(`- **Lai Nhân Cung:** ${info.LaiNhanCung}`);
  lines.push(`- **Nguyên Thần:** ${info.NguyenThan}`);
  lines.push(`- **Năm xem:** ${info.NamHan} (${info.Tuoi} tuổi)`);
  lines.push("");
  lines.push("---");
  lines.push("");
  
  // Important palaces first
  const importantOrder = ["Mệnh", "Tài bạch", "Quan lộc", "Phu thê", "Thiên di", "Phúc đức"];
  const otherPalaces = data.Cac_cung.filter(p => !importantOrder.includes(p.Name));
  
  // Interpret important palaces
  lines.push("# CÁC CUNG TRỌNG YẾU");
  lines.push("");
  
  for (const palaceName of importantOrder) {
    const palace = data.Cac_cung.find(p => p.Name === palaceName);
    if (palace) {
      lines.push(interpretPalace(palace));
      lines.push("---");
      lines.push("");
    }
  }
  
  // Other palaces
  lines.push("# CÁC CUNG KHÁC");
  lines.push("");
  
  for (const palace of otherPalaces) {
    lines.push(interpretPalace(palace));
    lines.push("---");
    lines.push("");
  }
  
  // Tứ Hóa summary
  lines.push("# TỨ HÓA TRONG LÁ SỐ");
  lines.push("");
  
  const tuHoaLocations: Record<string, string[]> = {
    "Hóa lộc": [],
    "Hóa quyền": [],
    "Hóa khoa": [],
    "Hóa kỵ": [],
  };
  
  for (const palace of data.Cac_cung) {
    for (const star of [...palace.Saotot, ...palace.Saoxau]) {
      if (tuHoaLocations[star.Name]) {
        tuHoaLocations[star.Name].push(palace.Name);
      }
    }
  }
  
  for (const [hoa, palaces] of Object.entries(tuHoaLocations)) {
    if (palaces.length > 0) {
      const meaning = TU_HOA_MEANINGS[hoa];
      lines.push(`- **${hoa}** tại ${palaces.join(", ")}: ${meaning?.effect || ""}`);
    }
  }
  lines.push("");
  
  // Footer
  lines.push("---");
  lines.push("");
  lines.push("*Lưu ý: Đây là luận giải tổng quát dựa trên vị trí sao. Để có phân tích chi tiết và chính xác hơn, cần xem xét thêm các yếu tố như xung chiếu, tam hợp, đại vận, lưu niên.*");
  
  return lines.join("\n");
}

/**
 * Quick interpretation for a specific palace
 */
export function interpretSinglePalace(palace: CoHocPalace): string {
  return interpretPalace(palace);
}
