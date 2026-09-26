/**
 * Làm mịn Knowledge Base cho luận giải.
 * Chạy: npm run knowledge:normalize
 *
 * Đọc dữ liệu crawl gốc (cung/*-consolidated.json + star-combinations.json) và sinh
 * cung/normalized/<cung>.json, trong đó:
 *  - Điều kiện chuỗi tiếng Việt đã được parse sẵn thành cấu trúc (tên sao / cung / chi chuẩn hóa),
 *    runtime chỉ còn đánh giá, không phải regex lại ~34k câu mỗi lần luận giải.
 *  - Bỏ mục không dùng được cho lá số gốc: đại vận / lưu niên / tiểu vận, điểm "xí hoa",
 *    tam bàn, bản trích lá số của người khác, nội dung gắn tuổi đại vận cụ thể...
 *  - Nội dung trùng nhau được gộp làm một, giữ mọi điều kiện dưới dạng "khớp một trong các rule".
 *  - Chuẩn hóa khoảng trắng; KHÔNG sửa chữ trong nội dung.
 * File gốc giữ nguyên làm nguồn - chỉ sửa script này rồi chạy lại khi cần.
 */
import {
  conditionMainStars,
  extractTextRequirements,
  isChartSpecificText,
  isPeriodCondition,
  isPeriodText,
  isUnverifiableConditional,
  parseCondition,
  parseStarCombination,
  type Clause,
  type TextRequirements,
} from "../src/lib/tuvi/knowledge/conditionMatcher";

const fs = require("fs");
const path = require("path");

const CUNG_DIR = path.resolve(process.cwd(), "src/lib/tuvi/knowledge/cung");
const OUT_DIR = path.join(CUNG_DIR, "normalized");
const MIN_TEXT_LENGTH = 8;

const FILES: Array<{ id: string; file: string; title: string }> = [
  { id: "menh", file: "menh-consolidated.json", title: "Cung Mệnh" },
  { id: "phu-mau", file: "phu-mau-consolidated.json", title: "Cung Phụ Mẫu" },
  { id: "phuc-duc", file: "phuc-duc-consolidated.json", title: "Cung Phúc Đức" },
  { id: "dien-trach", file: "dien-trach-consolidated.json", title: "Cung Điền Trạch" },
  { id: "quan-loc", file: "quan-loc-consolidated.json", title: "Cung Quan Lộc" },
  { id: "no-boc", file: "no-boc-consolidated.json", title: "Cung Nô Bộc" },
  { id: "thien-di", file: "thien-di-consolidated.json", title: "Cung Thiên Di" },
  { id: "tat-ach", file: "tat-ach-consolidated.json", title: "Cung Tật Ách" },
  { id: "tai-bach", file: "tai-bach-consolidated.json", title: "Cung Tài Bạch" },
  { id: "tu-tuc", file: "tu-tuc-consolidated.json", title: "Cung Tử Tức" },
  { id: "phu-the", file: "phu-the-consolidated.json", title: "Cung Phu Thê" },
  { id: "huynh-de", file: "huynh-de-consolidated.json", title: "Cung Huynh Đệ" },
  { id: "than", file: "than-consolidated.json", title: "Cung Thân" },
  { id: "tong-quan", file: "tong-quan-consolidated.json", title: "Tổng quan lá số" },
];

type Source = { book: string; author?: string; translator?: string | null };
type Rule = { condition: string; specificity: number; clauses: Clause[] };
type Entry = { id: string; section?: string; text: string; source: number; accuracy: number; rules: Rule[]; requires?: TextRequirements };

export type NormalizedKnowledgeFile = {
  schema: "tuvi-knowledge@1";
  palace: string;
  title: string;
  sources: Source[];
  entries: Entry[];
};

// Chuẩn hóa khoảng trắng, giữ xuống dòng giữa các đoạn.
// Nhiều đoạn crawl là song ngữ (nguyên văn tiếng Trung rồi bản dịch): bỏ dòng chủ yếu là chữ Hán
// và cụm chữ Hán chen trong câu, chỉ giữ tiếng Việt.
const CJK = /[　-〿㐀-鿿＀-￯]/g;
const stripChinese = (text: string) =>
  text
    .split("\n")
    .filter((line) => (line.match(CJK) ?? []).length / Math.max(line.replace(/\s/g, "").length, 1) < 0.3)
    .join("\n")
    .replace(/[（(「〈《]?[㐀-鿿][　-〿㐀-鿿＀-￯]*[）)」〉》]?/g, "")
    .replace(/\(\s*\)|（\s*）/g, "");

// "Ứng kỳ này có thể sẽ vào một trong các năm Sửu, Mùi, Tí..." được suy từ lá số gốc của người khác -> bỏ dòng đó.
const stripUngKy = (text: string) => text.split("\n").filter((line) => !/^\s*Ứng kỳ/i.test(line)).join("\n");

const cleanText = (text: string) =>
  stripChinese(stripUngKy(String(text || "").normalize("NFC").replace(/\r\n?/g, "\n")))
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const dedupeKey = (text: string) => text.toLowerCase().replace(/\s+/g, " ");

function classifyDrop(condition: string): string {
  if (!condition.trim()) return "điều kiện rỗng";
  if (/đại vận|ĐV\.|lưu niên|tiểu vận|LN\./i.test(condition)) return "vận hạn (cần năm xem)";
  if (/^Thông tin cung|^Phân tích|Điểm "|^Thống kê|^Nguyên thần|^Ngũ hành Hỉ Kị/.test(condition)) return "bản trích / thống kê lá số khác";
  if (/Địa bàn|Nhân bàn|Thiên bàn|tam bàn/i.test(condition)) return "tam bàn";
  return "điều kiện chưa hỗ trợ";
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const report: string[] = [];
  let totalIn = 0;
  let totalOut = 0;

  for (const { id, file, title } of FILES) {
    const raw = JSON.parse(fs.readFileSync(path.join(CUNG_DIR, file), "utf8"));
    const sources: Source[] = [];
    const sourceIndex = new Map<string, number>();
    const byText = new Map<string, Entry>();
    const dropped: Record<string, number> = {};
    const drop = (reason: string) => (dropped[reason] = (dropped[reason] ?? 0) + 1);

    const addEntry = (item: { id: string; text: string; source?: Source; accuracy?: number; section?: string }, rule: Rule) => {
      const text = cleanText(item.text);
      if (text.length < MIN_TEXT_LENGTH) return drop("nội dung quá ngắn");
      if (isChartSpecificText(text)) return drop("nội dung gắn lá số khác");
      // Nội dung nói về vận hạn chỉ hợp với điều kiện vận hạn (khớp theo năm xem).
      if (!isPeriodCondition(rule) && isPeriodText(text)) return drop("nội dung nói về vận hạn");

      const src: Source = { book: item.source?.book || "tuvi.cohoc.net", author: item.source?.author, translator: item.source?.translator ?? undefined };
      const srcKey = `${src.book}|${src.author ?? ""}|${src.translator ?? ""}`;
      if (!sourceIndex.has(srcKey)) {
        sourceIndex.set(srcKey, sources.length);
        sources.push(src);
      }

      const key = dedupeKey(text);
      const existing = byText.get(key);
      if (existing) {
        if (!existing.rules.some((r) => r.condition === rule.condition)) existing.rules.push(rule);
        existing.accuracy = Math.max(existing.accuracy, Number(item.accuracy) || 0);
        return drop("trùng nội dung (đã gộp rule)");
      }
      // Phạm vi nội dung (vị trí / chính tinh / giới tính / năm sinh ở câu mở đầu). Tổng quan lá số là
      // bảng liệt kê 12 cung nên không trích.
      const requires = id === "tong-quan" ? undefined : extractTextRequirements(text, conditionMainStars(rule));
      if (isUnverifiableConditional(text, requires)) return drop("vế 'Nếu...' không kiểm chứng được");
      byText.set(key, { id: item.id, section: item.section, text, source: sourceIndex.get(srcKey)!, accuracy: Number(item.accuracy) || 0, rules: [rule], ...(requires ? { requires } : {}) });
    };

    for (const item of raw.interpretations ?? []) {
      totalIn++;
      const condition = String(item.condition || "").normalize("NFC").trim();
      const parsed = parseCondition(condition);
      if (!parsed) {
        drop(classifyDrop(condition));
        continue;
      }
      addEntry(item, { condition, specificity: parsed.specificity, clauses: parsed.clauses });
    }

    if (id === "menh") {
      const combos = JSON.parse(fs.readFileSync(path.join(CUNG_DIR, "star-combinations.json"), "utf8"));
      for (const section of combos.sections ?? []) {
        for (const item of section.interpretations ?? []) {
          totalIn++;
          const result = parseStarCombination(item);
          if (!result) {
            drop("điều kiện chưa hỗ trợ");
            continue;
          }
          // priority (80-100) -> cùng thang accuracy của dữ liệu consolidated (~7) để mục chung
          // không lấn át các mục gắn chặt vị trí/sao của lá số.
          const accuracy = Math.round((Number(item.priority) || 70) / 10);
          addEntry({ ...item, accuracy, section: section.title }, { condition: result.condition, specificity: result.parsed.specificity, clauses: result.parsed.clauses });
        }
      }
    }

    const entries = [...byText.values()];
    for (const entry of entries) entry.rules.sort((a, b) => b.specificity - a.specificity);
    totalOut += entries.length;

    const output: NormalizedKnowledgeFile = { schema: "tuvi-knowledge@1", palace: id, title, sources, entries };
    const outFile = path.join(OUT_DIR, `${id}.json`);
    fs.writeFileSync(outFile, JSON.stringify(output));
    const rules = entries.reduce((sum, e) => sum + e.rules.length, 0);
    report.push(
      `${id.padEnd(10)} ${String(raw.interpretations?.length ?? 0).padStart(5)} → ${String(entries.length).padStart(5)} mục (${rules} rule), ` +
        `${(fs.statSync(path.join(CUNG_DIR, file)).size / 1e6).toFixed(1)}MB → ${(fs.statSync(outFile).size / 1e6).toFixed(1)}MB | bỏ: ` +
        Object.entries(dropped).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", "),
    );
  }

  console.log(report.join("\n"));
  console.log(`\nTổng: ${totalIn} mục gốc → ${totalOut} mục đã làm mịn trong ${path.relative(process.cwd(), OUT_DIR)}`);
}

main();
