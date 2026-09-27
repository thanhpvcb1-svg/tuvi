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

// "Xảy ra vào một trong các năm Tuất, Thìn, Dậu." - năm ứng kỳ tính từ lá số mẫu lúc crawl, không phải lá số hiện tại.
const stripOtherChartYears = (text: string) => text.replace(/\s*Xảy ra vào (một trong )?các năm [^.\n]*\.?/g, "");

// Không công khai nguồn lấy tri thức: bỏ tên tác giả / sách / trường phái gắn với nguồn trong nội dung,
// giữ nguyên ý. Câu kể chuyện riêng của tác giả ("X kể, ông từng gặp...") thì bỏ hẳn.
const AUTHOR = "(?:(?:[Cc]ụ |[Ôô]ng |[Tt]hầy )?(?:Vương Đ[iìĩ]nh [Cc]h[iì]|Trình Tử Vân|Tử Vân|(?:Lục )?B[âỉ]nh? Triệu|Lục Bân Triệu))";
const SCHOOL = "(?:[Pp]hái Trung Châu|Trung Châu phái|Tứ Hóa phái)";
const BOOK = "(?:Tử [Vv]i Đẩu [Ss]ố [Tt]oàn [Tt]hư|Đẩu [Ss]ố [Tt]oàn [Tt]hư|Tử [Vv]i Đẩu [Ss]ố [Tt]oàn [Tt]ập)";
// Lời của trang / sách nguồn nói về chính nó ("trong bài viết này", "luận giải này của chúng tôi",
// "tìm đến trang web này để được phục vụ") - không phải tri thức, còn lộ nguồn.
const SELF_REFERENCE_SENTENCE = /[^.!?\n]*(?:bài viết này|chương này|trang web|website|của chúng tôi|chúng tôi sử dụng|tôi xin trình bày|được phục vụ)[^.!?\n]*[.!?]?/giu;
const SOURCE_SENTENCE_DROP = new RegExp(
  `[^.!?\\n]*(?:${AUTHOR}\\s+(?:kể|là người nêu ra|sau khi so sánh|phân tích cách cục này như sau|không biết lí do|trong bài này)|Khái niệm này ${AUTHOR}|Trình Tử Vân:)[^.!?\\n]*[.!?]?`,
  "g",
);
// Ví dụ lá số của người thật (diễn viên, doanh nhân...) - không phải tri thức áp dụng cho người xem.
const CELEBRITY_SENTENCE = /[^.!?\n]*(?:(?:Diễn viên|Ca sĩ|Ông|Bà|Nhà văn|Tổng thống)\s+[A-ZĐ]\p{L}+(?:\s+[A-ZĐ]\p{L}+){1,3}(?:\s*\([^)]*\))?\s+là người có|Lưu Đức Hoa|Tôn Trung Sơn)[^.!?\n]*[.!?]?/gu;
// Viết hoa đúng vị trí: đầu câu thì "Có ý kiến", giữa câu thì "có ý kiến".
const casedAt = (whole: string, offset: number, phrase: string) =>
  offset === 0 || /[.!?\n]\s*$/.test(whole.slice(Math.max(0, offset - 3), offset)) ? phrase[0].toUpperCase() + phrase.slice(1) : phrase;
const scrubSources = (text: string) =>
  text
    .replace(SOURCE_SENTENCE_DROP, "")
    .replace(CELEBRITY_SENTENCE, "")
    .replace(SELF_REFERENCE_SENTENCE, "")
    .replace(/Theo sự truyền dạy của sư phụ,\s*/g, "")
    .replace(/truyền thừa (?:phái Trung Châu|Trung Châu phái)/g, "truyền thống")
    // "(Vương Đình Chi chú: ...)" -> "(chú: ...)"; "(theo Vương Đình Chi, ...)" -> "(...)"
    .replace(new RegExp(`\\(\\s*${AUTHOR}\\s+chú:\\s*`, "g"), "(chú: ")
    .replace(new RegExp(`\\(\\s*theo ${AUTHOR},\\s*`, "gi"), "(")
    .replace(new RegExp(`\\(\\s*${AUTHOR}\\s*\\):?\\s*`, "g"), "")
    // "Theo (kinh nghiệm|lí giải|ý kiến|bí truyền...) (của) (phái Trung Châu) Vương Đình Chi, X" -> "X"
    .replace(new RegExp(`(^|[.!?;]\\s+|\\n)Theo (?:(?:kinh nghiệm|lí giải|lý giải|ý kiến|bí truyền|sự truyền dạy của sư phụ)\\s+(?:của\\s+)?)?(?:${SCHOOL}\\s+)?(?:${AUTHOR}|${SCHOOL}|${BOOK})\\s*[,:]\\s*(\\p{L})`, "gu"), (_m, pre, first) => `${pre}${first.toUpperCase()}`)
    .replace(new RegExp(`,?\\s*theo (?:kinh nghiệm |lí giải |ý kiến |bí truyền )?(?:của\\s+)?(?:${SCHOOL}\\s+)?${AUTHOR}\\s*,`, "gi"), ",")
    // Chủ ngữ là tác giả: "Vương Đình Chi cho rằng, X" -> "Có ý kiến cho rằng, X"
    .replace(new RegExp(`${AUTHOR}\\s+(cho rằng|đề nghị|nói|xem trọng)`, "g"), (_m, verb, offset, whole) =>
      casedAt(whole, offset, verb === "đề nghị" ? "nên" : `có ý kiến ${verb}`),
    )
    .replace(new RegExp(`(?:của\\s+)?${SCHOOL}\\s+${AUTHOR}`, "g"), "một số trường phái")
    .replace(new RegExp(`kiến giải của ${AUTHOR}`, "g"), "kiến giải này")
    .replace(new RegExp(`${BOOK}`, "g"), "cổ thư")
    .replace(/"cổ thư" của phái Bắc, hay "cổ thư" của phái Nam,\s*/g, "")
    .replace(/,\s*dù là\s*đều/g, " đều")
    .replace(new RegExp(SCHOOL, "g"), (_m, offset, whole) => casedAt(whole, offset, "một số trường phái"))
    .replace(new RegExp(AUTHOR, "g"), (_m, offset, whole) => casedAt(whole, offset, "người nghiên cứu"));

// Lỗi chính tả tên sao chắc chắn (không trùng từ có nghĩa khác) - sửa để người đọc và bộ lọc câu nhận đúng sao.
const STAR_TYPOS: Array<[RegExp, string]> = [
  [/Hửu Bật/g, "Hữu Bật"],
  [/Vẫn Khúc/g, "Văn Khúc"],
  [/Liêm Trình/g, "Liêm Trinh"],
  [/Phá Quần/g, "Phá Quân"],
  [/Kinh Dương/g, "Kình Dương"],
  [/Linh Tính/g, "Linh Tinh"],
  [/Cư Môn/g, "Cự Môn"],
  [/Thiên Lượng/g, "Thiên Lương"],
  [/Thiên Đông(?![\p{L}])/gu, "Thiên Đồng"],
  [/Đa La(?![\p{L}])/gu, "Đà La"],
  [/Hòa Tinh/g, "Hỏa Tinh"],
];
const fixStarTypos = (text: string) => STAR_TYPOS.reduce((acc, [re, to]) => acc.replace(re, to), text);

// Một nhóm tri thức xưng "ngươi" (văn phong trò chơi) -> "bạn".
const modernizePronoun = (text: string) => text.replace(/(^|[^\p{L}])(N|n)gươi(?![\p{L}])/gu, (_m, pre, n) => `${pre}${n === "N" ? "Bạn" : "bạn"}`);

const cleanText = (text: string) =>
  fixStarTypos(modernizePronoun(scrubSources(stripOtherChartYears(stripChinese(stripUngKy(String(text || "").normalize("NFC").replace(/\r\n?/g, "\n")))))))
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// Một số mục crawl bị lệch cột: trường "book" chứa nguyên một câu nội dung ("* Chớ có đánh bạc...").
// Tên nguồn như vậy không được đưa cho AI trích dẫn -> ghi "Không rõ nguồn". Tác giả trùng tên sách thì bỏ.
const looksLikeSentence = (value: string) => value.length > 80 || /^[\d*•\-]/.test(value) || /[.!?;:]$/.test(value) || /\(.*\)/.test(value);
function cleanSource(source: Source | undefined): Source {
  const book = String(source?.book || "tuvi.cohoc.net").trim();
  if (looksLikeSentence(book)) return { book: "Không rõ nguồn" };
  const author = String(source?.author || "").trim();
  const keepAuthor = author && !/^unknown$/i.test(author) && !book.toLowerCase().includes(author.toLowerCase()) && !looksLikeSentence(author);
  return { book, author: keepAuthor ? author : undefined, translator: source?.translator ?? undefined };
}

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

      const src = cleanSource(item.source);
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

    // Dữ liệu tải về trình duyệt không kèm bảng nguồn (không công khai nguồn lấy tri thức).
    // Nguồn vẫn còn trong file crawl gốc (cung/*-consolidated.json) nếu cần tra cứu nội bộ.
    const output: NormalizedKnowledgeFile = { schema: "tuvi-knowledge@1", palace: id, title, sources: [], entries: entries.map(({ source: _source, ...entry }, index) => ({ ...entry, id: `${id}-${index + 1}` }) as Entry) }; // id trung tính, không mang dấu vết nguồn crawl
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
