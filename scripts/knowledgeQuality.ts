/**
 * Đo chất lượng nội dung tri thức hiển thị cho người dùng (khác verify:knowledge - kiểm điều kiện khớp).
 * Chạy: npm run quality:knowledge            (40 lá số)
 *       npm run quality:knowledge -- 80 77   (80 lá số, seed 77)
 *
 * Báo cáo:
 *  - câu bị lược vì nêu điều kiện riêng không khớp lá số (theo lý do) và mục bị bỏ hẳn;
 *  - nội dung còn lọt tên tác giả / sách, xưng "ngươi", dòng ứng kỳ của lá số khác;
 *  - độ dài nội dung hiển thị.
 * Ghi mẫu câu bị lược ra .tmp-verify/quality-dropped.json để rà soát thủ công.
 */
import { createChart } from "../src/lib/iztroEngine";
import type { NormalizedBirthInput } from "../src/lib/types";
import { loadKnowledge, queryPalaceKnowledge } from "../src/lib/tuvi/knowledge/lazyKnowledgeService";
import { isSevereClaim } from "../src/lib/tuvi/knowledge/conditionMatcher";

const fs = require("fs");
const PALACES = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"];
const count = Number(process.argv[2]) || 40;
let seed = Number(process.argv[3]) || 2026;
const random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

// Nội dung không được xuất hiện trong phần hiển thị
export const LEAK_PATTERNS: Array<[string, RegExp]> = [
  ["tên tác giả / sách", /Vương Đ[iìĩ]nh [Cc]h[iì]|Trung Châu|Đẩu [Ss]ố [Tt]oàn [Tt]hư|Đẩu [Ss]ố [Tt]oàn [Tt]ập|Tử Vân|B[âỉ]nh? Triệu|Thái Thứ Lang|Nguyễn Phát Lộc|(?<![\p{L}])Hi Di(?![\p{L}])|Trần Đoàn|cohoc|tuvi\.vn/u],
  ["lời của trang nguồn", /bài viết này|chương này|trang web|website|của chúng tôi|chúng tôi sử dụng|tôi xin trình bày|được phục vụ/iu],
  ["nhắc 'AI'", /(^|[^\p{L}\d_])AI([^\p{L}\d_]|$)/u],
  ["xưng 'ngươi'", /(^|[^\p{L}])[Nn]gươi([^\p{L}]|$)/u],
  ["năm ứng kỳ của lá số khác", /Xảy ra vào một trong các năm|^\s*Ứng kỳ/im],
  ["dẫn chiếu chương / mục của sách", /(?:tham khảo|xem|đọc)(?: thêm)?(?: lại)? (?:ở )?(?:các |những )?(?:mục [^.()\n]{0,40}?(?:trong |ở )?)?(?:chương|quyển|cuốn)(?![\p{L}])/iu],
];

async function main() {
  await loadKnowledge();
  const stats = { shown: 0, trimmedItems: 0, trimmedSentences: 0, chars: 0, severe: 0, leaks: {} as Record<string, number> };
  const reasons: Record<string, number> = {};
  const samples: Array<{ chart: string; palace: string; condition?: string; sentence: string; reason: string; stars: string }> = [];
  const keptSamples: Array<{ chart: string; palace: string; condition?: string; text: string; allPalaces: string }> = [];

  for (let n = 1; n <= count; n++) {
    const year = 1940 + Math.floor(random() * 86);
    const month = 1 + Math.floor(random() * 12);
    const day = 1 + Math.floor(random() * 28);
    const hourIndex = Math.floor(random() * 12);
    const gender = random() < 0.5 ? "male" : "female";
    const input = { fullName: "q", year, month, day, birthHour: hourIndex * 2, birthMinute: 0, birthHourIndex: hourIndex, gender, calendarType: "solar" } as unknown as NormalizedBirthInput;
    const chart = createChart(input, "tuvichancoCompatible", { horoscopeDate: new Date(2026, 5, 15) } as any);
    const chartLabel = `${day}/${month}/${year} giờ#${hourIndex} ${gender} (${chart.profile.yearStem ?? ""})`;

    for (const name of PALACES) {
      const palace = chart.palaces.find((p) => p.name === name)!;
      const shown = queryPalaceKnowledge({ chart, palace: palace as any, starsInPalace: [], branch: palace.earthlyBranch, yearToView: 2026, birthYear: year });
      for (const m of shown) {
        stats.shown++;
        stats.chars += m.interpretation.text.length;
        if (m.trimmedSentences) {
          stats.trimmedItems++;
          stats.trimmedSentences += m.trimmedSentences;
        }
        for (const [label, re] of LEAK_PATTERNS) if (re.test(m.interpretation.text)) stats.leaks[label] = (stats.leaks[label] ?? 0) + 1;
        if (isSevereClaim(m.interpretation.text)) stats.severe++;
      }
      // Mẫu đoạn đang hiển thị (sau khi lọc) để rà soát câu không áp dụng còn sót.
      if (keptSamples.length < 90 && shown.length && random() < 0.2) {
        const m = shown[Math.floor(random() * shown.length)];
        const order = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
        const all = chart.palaces.map(
          (p: any) =>
            `${p.name} (${p.earthlyBranch}): ` +
            [...p.majorStars, ...p.minorStars]
              .filter((st: any) => !st.scope || st.scope === "origin")
              .map((st: any) => `${st.name}${st.brightness ? `[${st.brightness}]` : ""}${st.mutagen ? `{Hóa ${st.mutagen}}` : ""}`)
              .join(", "),
        );
        const at = order.indexOf(palace.earthlyBranch);
        const tptNames = [0, 4, 6, 8].map((o) => chart.palaces.find((p) => p.earthlyBranch === order[(at + o) % 12])?.name).join(", ");
        keptSamples.push({ chart: chartLabel, palace: `${name} (${palace.earthlyBranch}); tam phương tứ chính: ${tptNames}`, condition: m.interpretation.condition, text: m.interpretation.text, allPalaces: all.join(" || ") });
      }
      for (const m of shown) {
        for (const d of m.trimmedDetails ?? []) {
          const key = d.reason.split(' ').slice(0, 3).join(' ');
          reasons[key] = (reasons[key] ?? 0) + 1;
          if (samples.length < 400 && random() < 0.35) {
            const describe = (p: any) =>
              `${p.name} (${p.earthlyBranch}): ` +
              [...p.majorStars, ...p.minorStars]
                .filter((st: any) => !st.scope || st.scope === "origin")
                .map((st: any) => `${st.name}${st.brightness ? `[${st.brightness}]` : ""}${st.mutagen ? `{Hóa ${st.mutagen}}` : ""}`)
                .join(", ");
            // Bối cảnh để rà soát: bản cung + tam phương tứ chính (cách 4, 6, 8 chi)
            const order = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
            const at = order.indexOf(palace.earthlyBranch);
            const tpt = [0, 4, 6, 8].map((o) => chart.palaces.find((p) => p.earthlyBranch === order[(at + o) % 12])).filter(Boolean).map(describe);
            samples.push({ chart: chartLabel, palace: `${name} (${palace.earthlyBranch})`, condition: m.interpretation.condition, sentence: d.sentence, reason: d.reason, stars: tpt.join(" || ") });
          }
        }
      }
    }
  }

  console.log(`${count} lá số, ${count * 12} cung - mục hiển thị: ${stats.shown} (TB ${(stats.shown / count / 12).toFixed(1)}/cung), độ dài TB ${Math.round(stats.chars / Math.max(stats.shown, 1))} ký tự`);
  console.log(`Mục được lược câu không áp dụng: ${stats.trimmedItems} (${((stats.trimmedItems / Math.max(stats.shown, 1)) * 100).toFixed(1)}%), tổng ${stats.trimmedSentences} câu`);
  // Câu phán nặng chỉ còn khi chính câu nêu điều kiện và điều kiện đúng trên lá số - theo dõi để không tăng dần.
  console.log(`Mục còn câu phán nặng (điều kiện đã kiểm chứng): ${stats.severe} (${((stats.severe / Math.max(stats.shown, 1)) * 100).toFixed(1)}%)`);
  console.log(`Lý do lược (mẫu): ${Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(" | ") || "-"}`);
  const leakText = Object.entries(stats.leaks).map(([k, v]) => `${k}: ${v}`).join(", ");
  console.log(leakText ? `❌ Nội dung lọt: ${leakText}` : "✅ Không lọt tên nguồn / 'ngươi' / năm ứng kỳ của lá số khác");
  fs.mkdirSync(".tmp-verify", { recursive: true });
  fs.writeFileSync(".tmp-verify/quality-dropped.json", JSON.stringify(samples, null, 1));
  fs.writeFileSync(".tmp-verify/quality-kept.json", JSON.stringify(keptSamples.map((x, i) => ({ id: `k${i}`, ...x })), null, 1));
  console.log(`Mẫu câu bị lược: .tmp-verify/quality-dropped.json (${samples.length})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
