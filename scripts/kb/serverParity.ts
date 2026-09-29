/**
 * Kiểm tra chế độ server cho kết quả GIỐNG HỆT chế độ trình duyệt: npm run test-knowledge-server
 * (cần chạy npm run build trước để có dist/_kb). Gọi thẳng Pages Function /api/knowledge/query với env.ASSETS giả
 * đọc dist/_kb, so từng cung với queryPalaceKnowledge tại chỗ trên nhiều lá số; đo thời gian xử lý mỗi lá số.
 */
import { createChart } from "../../src/lib/iztroEngine";
import type { NormalizedBirthInput } from "../../src/lib/types";
import { loadKnowledge, queryPalaceKnowledge } from "../../src/lib/tuvi/knowledge/lazyKnowledgeService";
import { buildChartFacts, computePeriod, serializeChartFacts } from "../../src/lib/tuvi/knowledge/conditionMatcher";
import { onRequestPost } from "../../functions/api/knowledge/query";

const fs = require("fs");
const path = require("path");
const DIST = path.join(process.cwd(), "dist");

const env = {
  ASSETS: {
    fetch: async (request: Request | string) => {
      const url = new URL(typeof request === "string" ? request : request.url);
      const file = path.join(DIST, decodeURIComponent(url.pathname));
      return fs.existsSync(file) ? new Response(fs.readFileSync(file, "utf8"), { status: 200 }) : new Response("missing", { status: 404 });
    },
  },
};

async function main() {
  if (!fs.existsSync(path.join(DIST, "_kb"))) throw new Error("Chưa có dist/_kb - chạy npm run build trước.");
  console.warn = () => {}; // rate limit chưa bind KV -> cảnh báo mỗi request, bỏ qua trong kiểm thử
  await loadKnowledge();
  const count = Number(process.argv[2]) || 12;
  let palaces = 0;
  let mismatches = 0;
  const times: number[] = [];
  for (let n = 0; n < count; n++) {
    const year = 1948 + n * 5, h = (n * 5) % 12;
    const input = { fullName: "p", year, month: 1 + ((n * 7) % 12), day: 1 + ((n * 11) % 28), birthHour: h * 2, birthMinute: 0, birthHourIndex: h, gender: n % 2 ? "male" : "female", calendarType: "solar" } as unknown as NormalizedBirthInput;
    const chart = createChart(input, "tuvichancoCompatible", { horoscopeDate: new Date(2026, 5, 15) } as any);
    const years = { yearToView: 2026, birthYear: year };
    const base = buildChartFacts(chart);
    const period = computePeriod(chart, years.yearToView, years.birthYear);
    const body = JSON.stringify({
      facts: serializeChartFacts(period ? { ...base, period } : base),
      palaces: chart.palaces.map((p) => ({ name: p.name, isBodyPalace: Boolean(p.isBodyPalace) })),
    });
    const started = process.hrtime.bigint();
    const res = await onRequestPost({ request: new Request("https://tuviphonglam.com/api/knowledge/query", { method: "POST", body }), env });
    times.push(Number(process.hrtime.bigint() - started) / 1e6);
    const data = (await res.json()) as { success: boolean; results: Record<string, Array<{ interpretation: { id: string; text: string } }>> };
    if (!data.success) throw new Error(`Function lỗi: ${JSON.stringify(data)}`);
    for (const palace of chart.palaces) {
      palaces++;
      const local = queryPalaceKnowledge({ chart, palace: palace as any, starsInPalace: [], branch: palace.earthlyBranch, ...years });
      const remote = data.results[palace.name] ?? [];
      const sig = (list: Array<{ interpretation: { id: string; text: string } }>) => list.map((m) => `${m.interpretation.id}:${m.interpretation.text.length}`).join(",");
      if (sig(local) !== sig(remote)) {
        mismatches++;
        if (mismatches <= 5) console.log(`✗ ${year} ${palace.name}: trình duyệt ${local.length} đoạn, server ${remote.length} đoạn`);
      }
    }
  }
  const sorted = [...times].sort((a, b) => a - b);
  console.log(`${count} lá số, ${palaces} cung: lệch ${mismatches}. Thời gian xử lý / lá số: lần đầu ${times[0].toFixed(0)} ms, trung vị ${sorted[Math.floor(sorted.length / 2)].toFixed(0)} ms, lớn nhất ${sorted[sorted.length - 1].toFixed(0)} ms`);
  if (mismatches) process.exit(1);
  console.log("✅ Chế độ server cho kết quả giống hệt chế độ trình duyệt.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
