/**
 * Chạy thử tri thức luận giải trên N lá số ngẫu nhiên và báo cáo mức độ match + độ đúng.
 * Chạy: npm run sample:knowledge            (10 lá số)
 *       npm run sample:knowledge -- 25 1234 (25 lá số, seed 1234)
 */
import { createChart } from "../src/lib/iztroEngine";
import type { NormalizedBirthInput } from "../src/lib/types";
import { loadKnowledge, queryPalaceKnowledge } from "../src/lib/tuvi/knowledge/lazyKnowledgeService";
import { checkConditionIndependently, checkTextScopeIndependently } from "./lib/knowledgeIndependentCheck";

const PALACES = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"];
const KEY_PALACES = ["Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê"];
const LUU_OPTIONS = { showLuuTuHoa: true, showPhiHoaCanCung: true, showLuuTuDuc: true, showLuuDaiVan: true, showLuuOtherStars: true, showLocKyNhap: true, showLuuTuanTriet: true };
const count = Number(process.argv[2]) || 10;
let seed = Number(process.argv[3]) || Date.now() % 100000;
const usedSeed = seed;
const random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
const HOURS = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

async function main() {
  await loadKnowledge();
  console.log(`Seed ${usedSeed} - ${count} lá số ngẫu nhiên (bật toàn bộ sao lưu, năm xem 2026)\n`);

  const totals = { shown: 0, all: 0, ok: 0, wrong: 0, unchecked: 0, emptyPalaces: 0, scopeWrong: 0 };
  const wrongs: string[] = [];

  for (let n = 1; n <= count; n++) {
    const year = 1940 + Math.floor(random() * 86);
    const month = 1 + Math.floor(random() * 12);
    const day = 1 + Math.floor(random() * 28);
    const hourIndex = Math.floor(random() * 12);
    const gender = pick(["male", "female"] as const);
    const calendarType = random() < 0.2 ? "lunar" : "solar";
    const input = { fullName: `sample-${n}`, year, month, day, birthHour: hourIndex * 2, birthMinute: 0, birthHourIndex: hourIndex, gender, calendarType } as NormalizedBirthInput;
    const chart = createChart(input, "tuvichancoCompatible", { luuOptions: LUU_OPTIONS, horoscopeDate: new Date(2026, 5, 15) } as any);

    const menh = chart.palaces.find((p) => p.name === "Mệnh")!;
    const body = chart.palaces.find((p) => p.isBodyPalace);
    console.log(
      `━━ #${n} ${day}/${month}/${year} (${calendarType === "lunar" ? "âm" : "dương"}) giờ ${HOURS[hourIndex]}, ${gender === "male" ? "Nam" : "Nữ"} ` +
        `| Mệnh ${menh.earthlyBranch}: ${menh.majorStars.map((s) => s.name + (s.mutagen ? `[${s.mutagen}]` : "")).join("+") || "VCD"} | Thân cư ${body?.name} | ${chart.profile.fiveElementsClass}`,
    );

    const row: string[] = [];
    for (const name of PALACES) {
      const palace = chart.palaces.find((p) => p.name === name)!;
      const all = queryPalaceKnowledge({ chart, palace: palace as any, starsInPalace: [], branch: palace.earthlyBranch, limit: 10000 });
      const shown = queryPalaceKnowledge({ chart, palace: palace as any, starsInPalace: [], branch: palace.earthlyBranch }); // đúng như UI
      totals.all += all.length;
      totals.shown += shown.length;
      if (all.length === 0) totals.emptyPalaces++;
      row.push(`${name} ${shown.length}${all.length > shown.length ? `/${all.length}` : ""}`);

      for (const match of all) {
        const result = checkConditionIndependently(chart, match.interpretation.condition ?? "");
        totals[result.status]++;
        const scope = checkTextScopeIndependently(chart, name, match.interpretation.condition ?? "", match.interpretation.text);
        if (scope.status === "wrong") {
          totals.scopeWrong++;
          wrongs.push(`#${n} [${name}] phạm vi nội dung → ${scope.reason}`);
        }
        if (result.status === "wrong") wrongs.push(`#${n} [${name}] "${match.interpretation.condition}" → ${result.reason}`);
      }

      if (KEY_PALACES.includes(name)) {
        const stars = palace.majorStars.map((s) => s.name).join("+") || "VCD";
        const topScore = Math.floor((shown[0]?.matchScore ?? 0) / 10);
        console.log(`   ${name} (${palace.earthlyBranch}, ${stars}) - khớp ${all.length}, hiển thị ${shown.length} (điểm cao nhất ${topScore}, ngưỡng ${Math.ceil(topScore / 2)}), top 3:`);
        for (const m of shown.slice(0, 3)) {
          console.log(`     • ${Math.floor(m.matchScore / 10)} điểm, ${m.matchedConditions} điều kiện [${m.matchReasons.join(" · ")}] ${m.interpretation.text.replace(/\s+/g, " ").slice(0, 100)}…`);
        }
        if (shown.length === 0) console.log("     (không có tri thức khớp)");
      }
    }
    console.log(`   Số mục hiển thị / khớp: ${row.join(" | ")}\n`);
  }

  const checked = totals.ok + totals.wrong;
  console.log("━━ TỔNG KẾT");
  console.log(`Mục khớp: ${totals.all} (TB ${(totals.all / count / 12).toFixed(1)}/cung) → UI hiển thị ${totals.shown} (TB ${(totals.shown / count / 12).toFixed(1)}/cung, chỉ nhóm khớp nhiều điều kiện nhất); cung không có tri thức: ${totals.emptyPalaces}/${count * 12}`);
  console.log(`Phạm vi nội dung (giới tính / năm sinh / vị trí / chính tinh ở câu mở đầu): sai ${totals.scopeWrong}/${totals.all}`);
  console.log(`Kiểm độc lập: ${checked} mục → đúng ${totals.ok}, SAI ${totals.wrong} (${checked ? ((totals.ok / checked) * 100).toFixed(2) : "0"}% đúng); chưa kiểm được ${totals.unchecked}`);
  if (wrongs.length) console.log(`\n❌ Mục sai:\n- ${wrongs.slice(0, 30).join("\n- ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
