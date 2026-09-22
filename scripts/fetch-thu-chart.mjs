/**
 * Fetch chart for: Thủ - 26/10/1998 dương lịch 00:30 - Nam
 * Run: node scripts/fetch-thu-chart.mjs
 */

const COHOC_BASE_URL = "https://tuvi.cohoc.net";
const COHOC_FORM_URL = `${COHOC_BASE_URL}/lap-la-so-tu-vi.html`;
const COHOC_CORE_URL = `${COHOC_BASE_URL}/Core.html`;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
};

// Hour mapping: 00:30 = giờ Tý (gio=1)
const HOUR_MAPPING = {
  23: 1, 0: 1,   // Tý
  1: 2, 2: 2,   // Sửu
  3: 3, 4: 3,   // Dần
  5: 4, 6: 4,   // Mão
  7: 5, 8: 5,   // Thìn
  9: 6, 10: 6,  // Tỵ
  11: 7, 12: 7, // Ngọ
  13: 8, 14: 8, // Mùi
  15: 9, 16: 9, // Thân
  17: 10, 18: 10, // Dậu
  19: 11, 20: 11, // Tuất
  21: 12, 22: 12, // Hợi
};

async function fetchThuChart() {
  console.log("=== Fetch Chart: Thủ ===\n");
  
  const input = {
    name: "Thủ",
    solarDate: "1998-10-26",
    hour: 0,
    minute: 30,
    gender: "male",
    targetYear: 2025,
  };
  
  console.log("Input:");
  console.log(`  Tên: ${input.name}`);
  console.log(`  Ngày sinh: ${input.solarDate} (dương lịch)`);
  console.log(`  Giờ: ${input.hour}:${input.minute}`);
  console.log(`  Giới tính: Nam`);
  console.log(`  Năm xem: ${input.targetYear}`);
  
  try {
    // 26/10/1998 dương lịch = 07/09/1998 âm lịch (Mậu Dần)
    const lunarYear = 1998;
    const lunarMonth = 9;
    const lunarDay = 7;
    const cohocGio = HOUR_MAPPING[input.hour];
    
    console.log("\nLunar conversion:");
    console.log(`  Âm lịch: ${lunarDay}/${lunarMonth}/${lunarYear}`);
    console.log(`  Giờ Tý (gio=${cohocGio})`);
    
    console.log("\nCalling Core.html...");
    const params = new URLSearchParams({
      version: "20211215",
      hoten: input.name,
      isDuong: "1",
      isNam: "1",
      gio: String(cohocGio),
      ngay: String(lunarDay),
      thang: String(lunarMonth),
      nam: String(lunarYear),
      mau: "1",
      luuthaitue: "1",
      gioDH: "0",
      gioDM: "30",
      kieuls: "0",
      namHan: String(input.targetYear),
      anTuHoa: "1",
    });
    
    const coreUrl = `${COHOC_CORE_URL}?${params.toString()}`;
    
    const response = await fetch(coreUrl, {
      method: "GET",
      headers: {
        ...HEADERS,
        "Referer": COHOC_FORM_URL,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const json = await response.json();
    
    console.log("\n=== KẾT QUẢ LÁ SỐ ===\n");
    console.log(`Âm Dương: ${json.Info?.AmDuong}`);
    console.log(`Cục: ${json.Info?.Cuc}`);
    console.log(`Mệnh Cục: ${json.Info?.MenhCuc}`);
    console.log(`Chủ Mệnh: ${json.Info?.ChuMenh}`);
    console.log(`Chủ Thân: ${json.Info?.ChuThan}`);
    
    console.log("\n--- 12 CUNG ---\n");
    for (const palace of json.Cac_cung || []) {
      const mainStars = palace.ChinhTinh?.map(s => {
        let str = s.Name;
        if (s.DoSang) str += ` (${s.DoSang})`;
        if (s.TuHoa) str += ` ${s.TuHoa}`;
        return str;
      }).join(", ") || "-";
      
      console.log(`${palace.Name} (${palace.DiaChi}):`);
      console.log(`  Chính tinh: ${mainStars}`);
      if (palace.PhuTinh?.length) {
        console.log(`  Phụ tinh: ${palace.PhuTinh.map(s => s.Name).join(", ")}`);
      }
      console.log();
    }
    
    // Output full JSON
    console.log("\n=== FULL JSON ===\n");
    console.log(JSON.stringify(json, null, 2));
    
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

fetchThuChart();
