/**
 * Kiểm tra tri thức luận giải lấy đúng dữ liệu từ lá số.
 * Chạy: npm run verify:knowledge
 *
 * Với nhiều lá số ngẫu nhiên, mọi mục tri thức được trả về cho từng cung phải thỏa điều kiện
 * gốc (`condition`) khi đối chiếu độc lập với dữ liệu thô của lá số:
 *  - "Cung P an tại B có X": cung P phải ở đúng chi B và có sao gốc X (không tính sao lưu).
 *  - "Cung P phi Hóa H nhập cung Q": phải có phi hóa tương ứng trong phiTuHoa.flows.
 *  - Không trả về nội dung crawl từ lá số của người khác.
 */
import { createChart } from "../src/lib/iztroEngine";
import type { NormalizedBirthInput } from "../src/lib/types";
import { loadKnowledge, queryPalaceKnowledge } from "../src/lib/tuvi/knowledge/lazyKnowledgeService";
import { isChartSpecificText, parseCondition } from "../src/lib/tuvi/knowledge/conditionMatcher";
import { checkConditionIndependently, checkPeriodConditionIndependently, checkTextScopeIndependently } from "./lib/knowledgeIndependentCheck";
import { getActivePalaceIndexes } from "../src/components/VanHanhSelector";

const PALACES = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"];
const LUU_OPTIONS = { showLuuTuHoa: true, showPhiHoaCanCung: true, showLuuTuDuc: true, showLuuDaiVan: true, showLuuOtherStars: true, showLocKyNhap: true, showLuuTuanTriet: true };

const failures: string[] = [];
const fail = (message: string) => {
  if (failures.length < 30) failures.push(message);
};

async function main() {
  await loadKnowledge();

  // 1. Unit checks của parser
  const unit: Array<[string, boolean]> = [
    ["Cung Mệnh an tại Tuất có Phá quân", true],
    ["Cung Mệnh an tại Tị có Kỵ Di", true],
    ["Cung Mệnh an tại Tí có Tả phụ", true],
    ["Cung Mệnh an tại Dần có Thái dương,Cung khí đại cát", false],
    ["Thông tin cung Mệnh địa bàn", false],
    // Vận hạn: dạng chung được hỗ trợ (khớp theo năm xem), bản trích lá số khác thì bỏ
    ["Đại vận ở cung Mệnh phi Hóa Lộc nhập cung Nô bộc và Hóa Kị nhập cung Điền trạch", true],
    ["Cung Điền trạch phi hóa kỵ nhập ĐV. Điền trạch", true],
    ["Đại vận ở cung Điền trạch: Hóa Lộc nhập cung Nô bộc (đại vận Phúc đức) và Hóa Kị nhập cung Điền trạch (đại vận Mệnh)", false],
    ["Lưu niên tới cung Điền trạch, Tiểu vận tới cung Tật ách", false],
    ["Cung Mệnh Địa bàn an tại Thân có Liêm trinh", false],
  ];
  for (const [condition, expected] of unit) {
    if (Boolean(parseCondition(condition)) !== expected) fail(`parseCondition("${condition}") phải ${expected ? "parse được" : "bị bỏ qua"}`);
  }

  // 2. Đối chiếu trên nhiều lá số
  let charts = 0;
  let matches = 0;
  let checked = 0;
  let unchecked = 0;
  let periodMatches = 0;
  const perPalace: Record<string, number> = {};
  for (let year = 1950; year <= 2025; year += 5) {
    for (const month of [2, 6, 11]) {
      for (const hour of [0, 3, 6, 9]) {
        for (const gender of ["male", "female"] as const) {
          const input: NormalizedBirthInput = { fullName: "verify", year, month, day: 3 + hour * 2, birthHour: hour * 2, birthMinute: 0, birthHourIndex: hour, gender, calendarType: "solar" } as NormalizedBirthInput;
          const chart = createChart(input, "tuvichancoCompatible", { luuOptions: LUU_OPTIONS, horoscopeDate: new Date(2026, 5, 15) } as any);
          charts++;
          const menhBranch = chart.palaces.find((p) => p.name === "Mệnh")?.earthlyBranch;
          const active = getActivePalaceIndexes(chart.palaces, 2026 - year, menhBranch, chart.profile.fiveElementsClass, chart.profile.yinYangLabel);
          for (const name of PALACES) {
            const palace = chart.palaces.find((p) => p.name === name);
            if (!palace) {
              fail(`${year}-${month} thiếu cung ${name}`);
              continue;
            }
            const results = queryPalaceKnowledge({ chart, palace: palace as any, starsInPalace: [], branch: palace.earthlyBranch, limit: 100000, yearToView: 2026, birthYear: year });
            perPalace[name] = (perPalace[name] ?? 0) + results.length;
            matches += results.length;
            for (const match of results) {
              if (isChartSpecificText(match.interpretation.text)) fail(`[${name}] trả về nội dung của lá số khác: ${match.interpretation.id}`);
              const condition = match.interpretation.condition ?? "";
              if (/^Cung Thân /.test(condition) && !palace.isBodyPalace) fail(`[${name}] tri thức cung Thân hiển thị ở cung không có Thân: "${condition}"`);
              const isPeriod = match.interpretation.type === "period";
              if (isPeriod) periodMatches++;
              const result = isPeriod ? checkPeriodConditionIndependently(chart, condition, active) : checkConditionIndependently(chart, condition);
              if (result.status === "unchecked") unchecked++;
              else checked++;
              const scope = checkTextScopeIndependently(chart, name, condition, match.interpretation.text);
              if (scope.status === "wrong") fail(`${year}-${month}-${hour} ${gender} [${name}] phạm vi nội dung → ${scope.reason}`);
              if (result.status === "wrong") fail(`${year}-${month}-${hour} ${gender} [${name}] "${condition}" → ${result.reason}`);
            }
          }
        }
      }
    }
  }

  console.log(`Charts: ${charts}, matches: ${matches}, kiểm độc lập: ${checked}, chưa kiểm được: ${unchecked}, trong đó vận hạn năm 2026: ${periodMatches}`);
  console.log("Trung bình mục tri thức / cung:", Object.entries(perPalace).map(([k, v]) => `${k} ${(v / charts).toFixed(1)}`).join(", "));
  if (failures.length) {
    console.error(`\n❌ ${failures.length}+ lỗi:\n- ${failures.join("\n- ")}`);
    process.exit(1);
  }
  console.log("✅ Tri thức luận giải khớp đúng dữ liệu lá số.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
