/**
 * Test CoHoc Interpretation
 * Run: node scripts/test-cohoc-interpret.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Brightness meanings
const BRIGHTNESS_MEANING = {
  "M": { level: "Miếu", desc: "rất tốt, phát huy tối đa" },
  "V": { level: "Vượng", desc: "tốt, có sức mạnh" },
  "Đ": { level: "Đắc", desc: "khá tốt, được địa" },
  "B": { level: "Bình", desc: "bình thường, trung tính" },
  "H": { level: "Hãm", desc: "yếu, bị hạn chế" },
  "": { level: "Bình", desc: "trung tính" },
};

// Main star meanings
const MAIN_STAR_MEANINGS = {
  "Tử vi": { nature: "Đế tinh, chủ về quyền lực", keywords: ["lãnh đạo", "uy quyền", "cao quý"] },
  "Thiên cơ": { nature: "Mưu sĩ tinh, chủ về trí tuệ", keywords: ["thông minh", "linh hoạt", "mưu lược"] },
  "Thái dương": { nature: "Quý tinh, chủ về quang minh", keywords: ["rộng lượng", "bác ái", "danh tiếng"] },
  "Vũ khúc": { nature: "Tài tinh, chủ về tài lộc", keywords: ["tài chính", "quyết đoán", "thực tế"] },
  "Thiên đồng": { nature: "Phúc tinh, chủ về an nhàn", keywords: ["hiền lành", "an nhàn", "hưởng thụ"] },
  "Liêm trinh": { nature: "Tù tinh, chủ về hình ngục", keywords: ["chính trực", "cứng cỏi", "pháp luật"] },
  "Thiên phủ": { nature: "Tài khố tinh", keywords: ["giàu có", "ổn định", "tích lũy"] },
  "Thái âm": { nature: "Phú tinh, chủ về điền sản", keywords: ["bất động sản", "tình cảm", "nghệ thuật"] },
  "Tham lang": { nature: "Đào hoa tinh", keywords: ["ham muốn", "đa tài", "giao tiếp"] },
  "Cự môn": { nature: "Ám tinh, chủ về thị phi", keywords: ["ăn nói", "tranh cãi", "miệng lưỡi"] },
  "Thiên tướng": { nature: "Ấn tinh, chủ về quý nhân", keywords: ["được giúp đỡ", "ấn tín", "phúc đức"] },
  "Thiên lương": { nature: "Ấm tinh, chủ về thọ", keywords: ["trường thọ", "thanh cao", "y dược"] },
  "Thất sát": { nature: "Tướng tinh, chủ về quyền uy", keywords: ["quyết đoán", "dũng cảm", "biến động"] },
  "Phá quân": { nature: "Hao tinh, chủ về phá hoại", keywords: ["phá cách", "tiên phong", "thay đổi"] },
};

// Palace meanings
const PALACE_MEANINGS = {
  "Mệnh": { area: "Bản thân", governs: ["tính cách", "ngoại hình", "vận mệnh tổng quát"] },
  "Phụ mẫu": { area: "Cha mẹ", governs: ["quan hệ với cha mẹ", "học vấn", "cấp trên"] },
  "Phúc đức": { area: "Phúc đức", governs: ["phúc phần", "tâm linh", "tuổi già"] },
  "Điền trạch": { area: "Nhà cửa", governs: ["bất động sản", "gia đình", "nơi ở"] },
  "Quan lộc": { area: "Sự nghiệp", governs: ["công việc", "sự nghiệp", "địa vị"] },
  "Nô bộc": { area: "Bạn bè", governs: ["bạn bè", "cấp dưới", "đồng nghiệp"] },
  "Thiên di": { area: "Di chuyển", governs: ["xuất ngoại", "quý nhân bên ngoài"] },
  "Tật ách": { area: "Sức khỏe", governs: ["sức khỏe", "bệnh tật", "tai nạn"] },
  "Tài bạch": { area: "Tài chính", governs: ["tiền bạc", "thu nhập", "tài lộc"] },
  "Tử tức": { area: "Con cái", governs: ["con cái", "sáng tạo", "đầu tư"] },
  "Phu thê": { area: "Hôn nhân", governs: ["vợ/chồng", "hôn nhân", "đối tác"] },
  "Huynh đệ": { area: "Anh em", governs: ["anh chị em", "bạn thân", "cạnh tranh"] },
};

// Tứ Hóa meanings
const TU_HOA_MEANINGS = {
  "Hóa lộc": { nature: "Cát", effect: "tăng tài lộc, may mắn" },
  "Hóa quyền": { nature: "Cát", effect: "tăng quyền lực, chủ động" },
  "Hóa khoa": { nature: "Cát", effect: "tăng danh tiếng, học vấn" },
  "Hóa kỵ": { nature: "Hung", effect: "gây trở ngại, lo lắng" },
};

// Trường Sinh meanings
const TRANG_SINH_MEANINGS = {
  "Trường sinh": "khởi đầu tốt, sinh sôi",
  "Mộc dục": "cần che chở, bảo vệ",
  "Quan đới": "bắt đầu có vị trí",
  "Lâm quan": "đỉnh cao, thăng tiến",
  "Đế vượng": "cực thịnh, quyền lực",
  "Suy": "bắt đầu suy giảm",
  "Bệnh": "yếu đuối, trở ngại",
  "Tử": "suy yếu, cần nỗ lực",
  "Mộ": "tiềm ẩn, chờ thời",
  "Tuyệt": "khó khăn, cần đột phá",
  "Thai": "chuẩn bị chu kỳ mới",
  "Dưỡng": "tích lũy năng lượng",
};

function interpretPalace(palace) {
  const meaning = PALACE_MEANINGS[palace.Name] || { area: palace.Name, governs: [] };
  const lines = [];
  
  lines.push(`\n${"=".repeat(60)}`);
  lines.push(`📍 ${palace.Name.toUpperCase()} (${meaning.area})`);
  lines.push(`${"=".repeat(60)}`);
  
  if (meaning.governs.length > 0) {
    lines.push(`Chủ về: ${meaning.governs.join(", ")}`);
  }
  
  // Thân cư
  if (palace.Than === 1) {
    lines.push(`\n⭐ THÂN CƯ TẠI ĐÂY - Ảnh hưởng mạnh sau 30 tuổi`);
  }
  
  // Tuần/Triệt
  if (palace.Tuan === 1) lines.push(`⚠️  Có TUẦN - sự ngăn cách, trì hoãn`);
  if (palace.Triet === 1) lines.push(`⚠️  Có TRIỆT - sự đứt đoạn, khó khăn`);
  
  // Chính tinh
  lines.push(`\n📌 CHÍNH TINH:`);
  if (palace.ChinhTinh.length === 0) {
    lines.push(`   (Cung vô chính diệu - chịu ảnh hưởng từ cung xung chiếu)`);
  } else {
    for (const star of palace.ChinhTinh) {
      const brightness = BRIGHTNESS_MEANING[star.Status || ""] || BRIGHTNESS_MEANING[""];
      const starMeaning = MAIN_STAR_MEANINGS[star.Name];
      lines.push(`   • ${star.Name} [${brightness.level}] - ${brightness.desc}`);
      if (starMeaning) {
        lines.push(`     → ${starMeaning.nature}`);
        lines.push(`     → Từ khóa: ${starMeaning.keywords.join(", ")}`);
      }
    }
  }
  
  // Trường Sinh
  if (palace.TrangSinh) {
    const tsMeaning = TRANG_SINH_MEANINGS[palace.TrangSinh] || "";
    lines.push(`\n🔄 Trường Sinh: ${palace.TrangSinh} - ${tsMeaning}`);
  }
  
  // Sao tốt
  if (palace.Saotot.length > 0) {
    lines.push(`\n✅ SAO TỐT (${palace.Saotot.length}):`);
    
    // Tứ Hóa cát
    const tuHoaCat = palace.Saotot.filter(s => s.Name.includes("Hóa"));
    for (const star of tuHoaCat) {
      const meaning = TU_HOA_MEANINGS[star.Name];
      lines.push(`   🌟 ${star.Name} - ${meaning?.effect || ""}`);
    }
    
    // Sao nổi bật
    const highlighted = palace.Saotot.filter(s => s.Highline === 1 && !s.Name.includes("Hóa"));
    for (const star of highlighted) {
      lines.push(`   ✨ ${star.Name} (nổi bật)`);
    }
    
    // Sao khác
    const others = palace.Saotot.filter(s => s.Highline !== 1 && !s.Name.includes("Hóa"));
    if (others.length > 0) {
      lines.push(`   • ${others.map(s => s.Name).join(", ")}`);
    }
  }
  
  // Sao xấu
  if (palace.Saoxau.length > 0) {
    lines.push(`\n❌ SAO XẤU (${palace.Saoxau.length}):`);
    
    // Hóa Kỵ
    const hoaKy = palace.Saoxau.filter(s => s.Name.includes("Hóa kỵ"));
    for (const star of hoaKy) {
      lines.push(`   ⚠️  ${star.Name} - gây trở ngại, thị phi`);
    }
    
    // Sao nổi bật
    const highlighted = palace.Saoxau.filter(s => s.Highline === 1 && !s.Name.includes("Hóa"));
    for (const star of highlighted) {
      lines.push(`   ⚠️  ${star.Name} (nổi bật)`);
    }
    
    // Sao khác
    const others = palace.Saoxau.filter(s => s.Highline !== 1 && !s.Name.includes("Hóa"));
    if (others.length > 0) {
      lines.push(`   • ${others.map(s => s.Name).join(", ")}`);
    }
  }
  
  // Đánh giá tổng quan
  lines.push(`\n💡 ĐÁNH GIÁ:`);
  lines.push(`   ${generateAssessment(palace)}`);
  
  return lines.join("\n");
}

function generateAssessment(palace) {
  const parts = [];
  
  // Chính tinh
  if (palace.ChinhTinh.length === 0) {
    parts.push("Cung vô chính diệu, cần xem cung xung chiếu.");
  } else {
    const good = palace.ChinhTinh.filter(s => ["M", "V", "Đ"].includes(s.Status || "")).length;
    const bad = palace.ChinhTinh.filter(s => s.Status === "H").length;
    
    if (good > bad) parts.push("Chính tinh sáng sủa, nền tảng tốt.");
    else if (bad > good) parts.push("Chính tinh hãm địa, cần nỗ lực.");
    else parts.push("Chính tinh trung bình.");
  }
  
  // Tứ Hóa
  const hasHoaLoc = palace.Saotot.some(s => s.Name === "Hóa lộc");
  const hasHoaQuyen = palace.Saotot.some(s => s.Name === "Hóa quyền");
  const hasHoaKhoa = palace.Saotot.some(s => s.Name === "Hóa khoa");
  const hasHoaKy = palace.Saoxau.some(s => s.Name === "Hóa kỵ");
  
  if (hasHoaLoc) parts.push("Có Hóa Lộc, tài lộc thuận lợi.");
  if (hasHoaQuyen) parts.push("Có Hóa Quyền, có quyền lực.");
  if (hasHoaKhoa) parts.push("Có Hóa Khoa, danh tiếng tốt.");
  if (hasHoaKy) parts.push("Có Hóa Kỵ, cần cẩn thận thị phi.");
  
  // Cân bằng sao
  const balance = palace.Saotot.length - palace.Saoxau.length;
  if (balance > 2) parts.push("Nhiều sao tốt hỗ trợ.");
  else if (balance < -2) parts.push("Nhiều sao xấu, cần đề phòng.");
  
  return parts.join(" ");
}

// Main
async function main() {
  const fixturePath = path.join(__dirname, "..", "tests", "fixtures", "cohoc", "e2e-test-result.json");
  
  if (!fs.existsSync(fixturePath)) {
    console.error("❌ Fixture not found. Run: node scripts/test-cohoc-e2e.mjs first");
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
  const { Info, Cac_cung } = data.response;
  
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           LUẬN GIẢI LÁ SỐ TỬ VI - COHOC.NET               ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  
  // Input info
  console.log(`\n📋 THÔNG TIN ĐẦU VÀO:`);
  console.log(`   Tên: ${data.input.name}`);
  console.log(`   Ngày sinh (DL): ${data.input.solarDate}`);
  console.log(`   Giờ sinh: ${data.input.hour}:${data.input.minute}`);
  console.log(`   Giới tính: ${data.input.gender === "male" ? "Nam" : "Nữ"}`);
  console.log(`   Năm xem: ${data.input.targetYear}`);
  
  // Chart overview
  console.log(`\n📊 TỔNG QUAN LÁ SỐ:`);
  console.log(`   Âm Dương: ${Info.AmDuong}`);
  console.log(`   Cục: ${Info.Cuc}`);
  console.log(`   Mệnh: ${Info.MenhCuc}`);
  console.log(`   Chủ Mệnh: ${Info.ChuMenh}`);
  console.log(`   Chủ Thân: ${Info.ChuThan}`);
  console.log(`   Lai Nhân Cung: ${Info.LaiNhanCung}`);
  console.log(`   Nguyên Thần: ${Info.NguyenThan}`);
  console.log(`   Năm Hạn: ${Info.NamHan} (${Info.Tuoi} tuổi)`);
  
  // Important palaces
  const importantPalaces = ["Mệnh", "Tài bạch", "Quan lộc", "Phu thê", "Thiên di", "Tật ách"];
  
  console.log(`\n\n${"#".repeat(60)}`);
  console.log(`#           CÁC CUNG TRỌNG YẾU                              #`);
  console.log(`${"#".repeat(60)}`);
  
  for (const name of importantPalaces) {
    const palace = Cac_cung.find(p => p.Name === name);
    if (palace) {
      console.log(interpretPalace(palace));
    }
  }
  
  // Other palaces
  console.log(`\n\n${"#".repeat(60)}`);
  console.log(`#           CÁC CUNG KHÁC                                   #`);
  console.log(`${"#".repeat(60)}`);
  
  const otherPalaces = Cac_cung.filter(p => !importantPalaces.includes(p.Name));
  for (const palace of otherPalaces) {
    console.log(interpretPalace(palace));
  }
  
  // Tứ Hóa summary
  console.log(`\n\n${"#".repeat(60)}`);
  console.log(`#           TỨ HÓA TRONG LÁ SỐ                              #`);
  console.log(`${"#".repeat(60)}`);
  
  const tuHoaMap = { "Hóa lộc": [], "Hóa quyền": [], "Hóa khoa": [], "Hóa kỵ": [] };
  
  for (const palace of Cac_cung) {
    for (const star of [...palace.Saotot, ...palace.Saoxau]) {
      if (tuHoaMap[star.Name]) {
        tuHoaMap[star.Name].push(palace.Name);
      }
    }
  }
  
  console.log("");
  for (const [hoa, palaces] of Object.entries(tuHoaMap)) {
    if (palaces.length > 0) {
      const meaning = TU_HOA_MEANINGS[hoa];
      const icon = meaning?.nature === "Cát" ? "🌟" : "⚠️";
      console.log(`${icon} ${hoa} tại: ${palaces.join(", ")}`);
      console.log(`   → ${meaning?.effect || ""}`);
    }
  }
  
  // Save to file
  const outputPath = path.join(__dirname, "..", "tests", "fixtures", "cohoc", "interpretation.txt");
  // Redirect console output would be complex, so just note it
  console.log(`\n\n${"=".repeat(60)}`);
  console.log("✅ Luận giải hoàn tất!");
}

main();
