/**
 * Luận Giải Lá Số Tử Vi - Sử dụng tri thức local
 * 
 * Ví dụ: Nam sinh 26/10/1998 00:30 Dương lịch
 * 
 * Run: npx tsx scripts/luan-giai-local.ts
 */

import { astro } from "iztro";
import cungThienCanData from "../src/lib/tuvi/data/cung-thien-can.json";

// Input
const birthInfo = {
  date: "1998-10-26",
  hour: 0, // 00:30 = giờ Tý (index 0)
  gender: "男" as const, // Nam
  isLeapMonth: false,
};

// Thiên Can mapping
const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

const STEM_MAP: Record<string, string> = {
  "giáp": "Giáp", "ất": "Ất", "bính": "Bính", "đinh": "Đinh", "mậu": "Mậu",
  "kỷ": "Kỷ", "canh": "Canh", "tân": "Tân", "nhâm": "Nhâm", "quý": "Quý",
};

const BRANCH_MAP: Record<string, string> = {
  "tý": "Tý", "sửu": "Sửu", "dần": "Dần", "mão": "Mão", "thìn": "Thìn", "tỵ": "Tỵ",
  "ngọ": "Ngọ", "mùi": "Mùi", "thân": "Thân", "dậu": "Dậu", "tuất": "Tuất", "hợi": "Hợi",
};

function normalizeStem(stem: string): string {
  const lower = stem.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, value] of Object.entries(STEM_MAP)) {
    if (key.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === lower || 
        value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === lower) {
      return value;
    }
  }
  return stem;
}

function normalizeBranch(branch: string): string {
  const lower = branch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, value] of Object.entries(BRANCH_MAP)) {
    if (key.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === lower ||
        value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === lower) {
      return value;
    }
  }
  return branch;
}

function getCanChiYear(year: number): { can: string; chi: string; full: string } {
  const canIndex = (year - 4) % 10;
  const chiIndex = (year - 4) % 12;
  return {
    can: THIEN_CAN[canIndex],
    chi: DIA_CHI[chiIndex],
    full: `${THIEN_CAN[canIndex]} ${DIA_CHI[chiIndex]}`,
  };
}

function getThienCanInfo(can: string) {
  return (cungThienCanData.thienCan as any)[can] || null;
}

function getNapAm(canChi: string) {
  return (cungThienCanData.napAmLucThapHoaGiap as any)[canChi] || null;
}

function getCungCanInterpretation(can: string, cungType?: string) {
  const interpretations = cungThienCanData.cungCanInterpretations as any;
  const canInterp = interpretations[can];
  if (!canInterp) return null;
  if (cungType) return canInterp[cungType] || canInterp.general || null;
  return canInterp.general || null;
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("           LUẬN GIẢI LÁ SỐ TỬ VI - TRI THỨC LOCAL");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Lập lá số bằng iztro
  const chart = (astro as any).astrolabeBySolarDate(
    birthInfo.date,
    birthInfo.hour,
    birthInfo.gender,
    true,
    "vi-VN"
  );

  // Thông tin cơ bản
  console.log("📋 THÔNG TIN CƠ BẢN");
  console.log("───────────────────────────────────────────────────────────────");
  console.log(`Ngày sinh: 26/10/1998 (Dương lịch)`);
  console.log(`Giờ sinh: 00:30 (Giờ Tý)`);
  console.log(`Giới tính: Nam`);
  
  // Năm sinh Can Chi
  const yearCanChi = getCanChiYear(1998);
  console.log(`\nNăm sinh: ${yearCanChi.full}`);
  
  const yearNapAm = getNapAm(yearCanChi.full);
  if (yearNapAm) {
    console.log(`Nạp Âm: ${yearNapAm.napAm} (${yearNapAm.nguHanh})`);
  }

  // Thông tin từ chart
  if (chart) {
    console.log(`\nCục: ${chart.fiveElementsClass || "N/A"}`);
    console.log(`Mệnh chủ: ${chart.soul || "N/A"}`);
    console.log(`Thân chủ: ${chart.body || "N/A"}`);
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("           PHÂN TÍCH 12 CUNG THEO THIÊN CAN");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Phân tích từng cung
  const palaces = chart?.palaces || [];
  
  for (const palace of palaces) {
    const palaceName = palace.name || "N/A";
    const stem = palace.heavenlyStem ? normalizeStem(palace.heavenlyStem) : null;
    const branch = palace.earthlyBranch ? normalizeBranch(palace.earthlyBranch) : null;
    
    console.log(`\n🏛️  CUNG ${palaceName.toUpperCase()}`);
    console.log("───────────────────────────────────────────────────────────────");
    
    if (stem && branch) {
      const canChi = `${stem} ${branch}`;
      console.log(`📍 Vị trí: ${canChi}`);
      
      // Lấy Nạp Âm
      const napAm = getNapAm(canChi);
      if (napAm) {
        console.log(`🔮 Nạp Âm: ${napAm.napAm} (${napAm.nguHanh})`);
      }
      
      // Lấy thông tin Thiên Can
      const canInfo = getThienCanInfo(stem);
      if (canInfo) {
        console.log(`\n📖 Thiên Can ${stem}:`);
        console.log(`   - Ngũ Hành: ${canInfo.nguHanh}`);
        console.log(`   - Âm Dương: ${canInfo.amDuong}`);
        console.log(`   - Tứ Hóa: Lộc=${canInfo.tuHoa.loc}, Quyền=${canInfo.tuHoa.quyen}, Khoa=${canInfo.tuHoa.khoa}, Kỵ=${canInfo.tuHoa.ky}`);
      }
      
      // Lấy luận giải theo Cung + Can
      const cungTypeMap: Record<string, string> = {
        "mệnh": "cungMenh",
        "thiên di": "cungThienDi",
        "phúc đức": "cungPhucDuc",
        "điền trạch": "cungDienTrach",
      };
      
      const cungType = cungTypeMap[palaceName.toLowerCase()];
      const interpretation = getCungCanInterpretation(stem, cungType);
      
      if (interpretation) {
        console.log(`\n💡 Luận giải Cung ${palaceName} can ${stem}:`);
        // Wrap text
        const words = interpretation.split(" ");
        let line = "   ";
        for (const word of words) {
          if (line.length + word.length > 70) {
            console.log(line);
            line = "   " + word + " ";
          } else {
            line += word + " ";
          }
        }
        if (line.trim()) console.log(line);
      }
    }
    
    // Liệt kê sao trong cung
    const majorStars = palace.majorStars?.map((s: any) => s.name).filter(Boolean) || [];
    const minorStars = palace.minorStars?.map((s: any) => s.name).filter(Boolean) || [];
    
    if (majorStars.length > 0) {
      console.log(`\n⭐ Chính tinh: ${majorStars.join(", ")}`);
    }
    if (minorStars.length > 0) {
      console.log(`✨ Phụ tinh: ${minorStars.slice(0, 5).join(", ")}${minorStars.length > 5 ? "..." : ""}`);
    }
  }

  // Tổng kết
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("           TỔNG KẾT");
  console.log("═══════════════════════════════════════════════════════════════\n");
  
  // Tìm cung Mệnh
  const menhPalace = palaces.find((p: any) => p.name?.toLowerCase() === "mệnh");
  if (menhPalace) {
    const menhStem = menhPalace.heavenlyStem ? normalizeStem(menhPalace.heavenlyStem) : null;
    const menhBranch = menhPalace.earthlyBranch ? normalizeBranch(menhPalace.earthlyBranch) : null;
    
    if (menhStem && menhBranch) {
      const menhCanChi = `${menhStem} ${menhBranch}`;
      const menhNapAm = getNapAm(menhCanChi);
      
      console.log(`🎯 Cung Mệnh: ${menhCanChi}`);
      if (menhNapAm) {
        console.log(`   Nạp Âm: ${menhNapAm.napAm}`);
      }
      
      const menhCanInfo = getThienCanInfo(menhStem);
      if (menhCanInfo) {
        console.log(`\n📝 Đặc điểm tính cách (theo Thiên Can ${menhStem}):`);
        console.log(`   ${menhCanInfo.description}`);
      }
      
      const menhInterp = getCungCanInterpretation(menhStem, "cungMenh");
      if (menhInterp) {
        console.log(`\n📝 Luận giải chi tiết:`);
        const words = menhInterp.split(" ");
        let line = "   ";
        for (const word of words) {
          if (line.length + word.length > 70) {
            console.log(line);
            line = "   " + word + " ";
          } else {
            line += word + " ";
          }
        }
        if (line.trim()) console.log(line);
      }
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  ✅ Luận giải hoàn tất - Sử dụng 100% tri thức local");
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main().catch(console.error);
