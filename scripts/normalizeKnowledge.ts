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
  isDanglingFragment,
  isPeriodCondition,
  isPeriodText,
  isUnverifiableConditional,
  palaceKey,
  parseCondition,
  parseStarCombination,
  type Clause,
  type TextRequirements,
} from "../src/lib/tuvi/knowledge/conditionMatcher";
import { kbKey } from "./kb/lib/normalize";

const fs = require("fs");
const path = require("path");

const CUNG_DIR = path.resolve(process.cwd(), "src/lib/tuvi/knowledge/cung");
// Metadata có bằng chứng (trường phái...) từ pipeline crawl / đối chiếu - khóa theo nội dung đoạn (kbKey).
const METADATA_FILE = path.resolve(process.cwd(), "data/kb/kb-metadata.jsonl");
const kbMetadata = new Map<string, { school: string; method: string | null }>(
  fs.existsSync(METADATA_FILE)
    ? fs.readFileSync(METADATA_FILE, "utf8").split("\n").filter(Boolean).map((line: string) => {
        const row = JSON.parse(line);
        return [row.kb_key, { school: row.school, method: row.method }];
      })
    : [],
);
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
type Entry = { id: string; section?: string; text: string; source: number; accuracy: number; rules: Rule[]; requires?: TextRequirements; style?: "pop" | "layout" };

/**
 * tuvi-knowledge@2: mỗi điều kiện chỉ lưu MỘT lần trong `conditions` (111 nghìn rule nhưng chỉ ~33 nghìn điều kiện
 * khác nhau), mục tri thức trỏ tới điều kiện bằng chỉ số -> file tải về trình duyệt nhỏ hơn nhiều, không phải
 * parse lại điều kiện lúc chạy.
 */
export type NormalizedKnowledgeFile = {
  schema: "tuvi-knowledge@2";
  palace: string;
  title: string;
  sources: Source[];
  conditions: Rule[];
  /** school / method chỉ có khi có bằng chứng (kb-metadata); không có = chưa xác định (UNKNOWN). */
  entries: Array<Omit<Entry, "rules" | "source"> & { rules: number[]; school?: string; method?: string }>;
};

// ============ GỘP MỤC GẦN TRÙNG ============
// Nhiều nguồn chép lại cùng một đoạn với khác biệt nhỏ (dấu câu, vài chữ, thêm/bớt một câu). Gộp khi đoạn ngắn
// nằm gần trọn trong đoạn dài (≥90% cụm 3 từ) VÀ hai đoạn nhắc cùng một tập "từ khóa luận giải" (sao, Hóa, cung,
// chi, giới tính) - để không gộp nhầm các đoạn mẫu chỉ khác nhau đúng một chữ quan trọng ("Lộc Thể nhập Dụng" /
// "Quyền Thể nhập Dụng"). Giữ đoạn dài nhất, gom mọi điều kiện của cả cụm.
const NEAR_DUP_CONTAINMENT = 0.9;
const KEY_TERMS = new RegExp(
  [
    "tử vi", "thiên cơ", "thái dương", "vũ khúc", "thiên đồng", "liêm trinh", "thiên phủ", "thái âm", "tham lang", "cự môn", "thiên tướng",
    "thiên lương", "thất sát", "phá quân", "văn xương", "văn khúc", "tả phù", "tả phụ", "hữu bật", "thiên khôi", "thiên việt", "lộc tồn",
    "thiên mã", "kình dương", "đà la", "hỏa tinh", "linh tinh", "địa không", "địa kiếp", "hóa lộc", "hóa quyền", "hóa khoa", "hóa kỵ", "hóa kị",
    "lộc", "quyền", "khoa", "kỵ", "kị", "mệnh", "thân", "phụ mẫu", "phúc đức", "điền trạch", "quan lộc", "nô bộc", "thiên di", "tật ách",
    "tài bạch", "tử tức", "tử nữ", "phu thê", "huynh đệ", "sự nghiệp", "giao hữu", "phối ngẫu", "tý", "tí", "sửu", "dần", "mão", "thìn", "tỵ", "tị", "ngọ", "mùi", "dậu", "tuất",
    "hợi", "nam", "nữ", "miếu", "vượng", "đắc", "hãm",
  ].join("|"),
  "gu",
);
const wordsOf = (text: string) => text.toLowerCase().normalize("NFC").split(/[^\p{L}\d]+/u).filter(Boolean);
const shinglesOf = (text: string) => {
  const w = wordsOf(text);
  const set = new Set<string>();
  for (let i = 0; i + 2 < w.length; i++) set.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
  return set;
};
// Từ khóa theo THỨ TỰ xuất hiện: "Linh Tinh thủ Mệnh ... có Thất Sát" khác "Thất Sát thủ Mệnh ... có Linh Tinh".
const keyTermsOf = (text: string) => text.toLowerCase().normalize("NFC").match(KEY_TERMS) ?? [];
/** a là dãy con (giữ thứ tự) của b. */
const isSubsequence = (a: string[], b: string[]) => {
  let j = 0;
  for (const x of a) {
    while (j < b.length && b[j] !== x) j++;
    if (j === b.length) return false;
    j++;
  }
  return true;
};
// Mẫu các cặp đã gộp (để rà soát): chạy với KNOWLEDGE_MERGE_LOG=<file>
const mergeLog: Array<{ kept: string; merged: string }> = [];
const fnv = (s: string, seed: number) => {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

function mergeNearDuplicates(entries: Entry[]): { entries: Entry[]; merged: number } {
  const HASHES = 24, BANDS = 8, ROWS = 3;
  const shingles = entries.map((e) => shinglesOf(e.text));
  const terms = entries.map((e) => keyTermsOf(e.text));
  const signatures = shingles.map((set) =>
    Array.from({ length: HASHES }, (_, k) => {
      let min = 0xffffffff;
      for (const s of set) {
        const h = fnv(s, k * 7919 + 1);
        if (h < min) min = h;
      }
      return min;
    }),
  );
  const parent = entries.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  /** Đoạn `small` nằm gần trọn trong `large` (≥90% cụm 3 từ) và từ khóa của nó là dãy con của từ khóa `large`. */
  const isNearDuplicateOf = (small: number, large: number) => {
    const s = shingles[small], l = shingles[large];
    if (s.size > l.size || s.size < 5) return false;
    if (!isSubsequence(terms[small], terms[large])) return false; // không gộp "Lộc ..." với "Quyền ...", không đảo vai sao
    let shared = 0;
    for (const x of s) if (l.has(x)) shared++;
    return shared / s.size >= NEAR_DUP_CONTAINMENT;
  };
  for (let b = 0; b < BANDS; b++) {
    const buckets = new Map<string, number[]>();
    signatures.forEach((sig, i) => {
      if (shingles[i].size < 5) return; // đoạn quá ngắn: chỉ khử trùng nguyên văn
      const key = sig.slice(b * ROWS, (b + 1) * ROWS).join(",");
      const list = buckets.get(key);
      if (list) list.push(i);
      else buckets.set(key, [i]);
    });
    for (const list of buckets.values()) {
      if (list.length < 2 || list.length > 200) continue;
      for (let x = 0; x < list.length; x++) {
        for (let y = x + 1; y < list.length; y++) {
          const i = list[x], j = list[y];
          if (find(i) === find(j)) continue;
          if (isNearDuplicateOf(i, j) || isNearDuplicateOf(j, i)) parent[find(i)] = find(j);
        }
      }
    }
  }
  const groups = new Map<number, number[]>();
  entries.forEach((_, i) => {
    const root = find(i);
    const g = groups.get(root);
    if (g) g.push(i);
    else groups.set(root, [i]);
  });
  const out: Entry[] = [];
  let merged = 0;
  for (const members of groups.values()) {
    // Giữ đoạn đầy đủ nhất; cùng độ dài thì đoạn có độ chính xác (accuracy) cao hơn.
    members.sort((a, b) => entries[b].text.length - entries[a].text.length || entries[b].accuracy - entries[a].accuracy);
    const keepIndex = members[0];
    const keep = { ...entries[keepIndex], rules: [...entries[keepIndex].rules] };
    // Chỉ gộp mục TỰ nó gần trùng với đoạn giữ lại (không gộp theo chuỗi A~C~B); mục còn lại giữ riêng.
    for (const other of members.slice(1)) {
      // Phạm vi khác nhau (mục tách kế thừa phạm vi bài khác nhau) -> giữ riêng để mỗi rule đi đúng phạm vi của nó.
      if (!isNearDuplicateOf(other, keepIndex) || JSON.stringify(entries[other].requires ?? null) !== JSON.stringify(keep.requires ?? null)) {
        out.push(entries[other]);
        continue;
      }
      merged++;
      if (mergeLog.length < 400) mergeLog.push({ kept: keep.text, merged: entries[other].text });
      keep.accuracy = Math.max(keep.accuracy, entries[other].accuracy);
      for (const rule of entries[other].rules) if (!keep.rules.some((r) => r.condition === rule.condition)) keep.rules.push(rule);
    }
    out.push(keep);
  }
  return { entries: out, merged };
}

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
// Dẫn chiếu cấu trúc sách / bài gốc ("Xin xem thêm mục liên quan trong chương 6", "xin tham khảo chương 'Luận về sáu mươi
// tinh hệ'") - lộ nguồn và người xem không có chương đó để đọc -> bỏ (ngoặc chứa dẫn chiếu, hoặc cả câu dẫn chiếu).
const BOOK_REF = "(?:xin |hãy |có thể )?(?:tham khảo|xem|đọc)(?: thêm)?(?: lại)? (?:ở )?(?:các |những )?(?:mục [^.()\\n]{0,40}?(?:trong |ở )?)?(?:chương|phần|mục|tiết|quyển|cuốn)(?![\\p{L}])";
const BOOK_REF_PAREN = new RegExp(`\\s*\\([^()]*${BOOK_REF}[^()]*\\)`, "giu");
const BOOK_REF_SENTENCE = new RegExp(`[^.!?\\n]*${BOOK_REF}[^.!?\\n]*[.!?]?`, "giu");
const scrubSources = (text: string) =>
  text
    .replace(BOOK_REF_PAREN, "")
    .replace(BOOK_REF_SENTENCE, "")
    .replace(SOURCE_SENTENCE_DROP, "")
    .replace(CELEBRITY_SENTENCE, "")
    .replace(SELF_REFERENCE_SENTENCE, "")
    // Lời của trang nguồn về công cụ giải đoán tự động của họ ("nhưng AI giải đoán không thể xem xét...").
    .replace(/(^|[^\p{L}])AI giải đoán/gu, "$1phần giải đoán này")
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
  [/Conc ái/g, "Con cái"],
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
  // "chất" gõ nhầm thành "chết" - khiến câu bình thường bị coi là câu phán về cái chết.
  [/thể chết(?=, cơ thể)/g, "thể chất"],
  [/Tính chết cô lập/g, "Tính chất cô lập"],
];
const fixStarTypos = (text: string) => STAR_TYPOS.reduce((acc, [re, to]) => acc.replace(re, to), text);

// Một nhóm tri thức xưng "ngươi" (văn phong trò chơi) -> "bạn".
const modernizePronoun = (text: string) => text.replace(/(^|[^\p{L}])(N|n)gươi(?![\p{L}])/gu, (_m, pre, n) => `${pre}${n === "N" ? "Bạn" : "bạn"}`);

// Lời dẫn của bài gốc, không phải tri thức:
// - câu ví dụ tả cấu hình của cung khác ("Ví dụ như cung tài bạch phi Hóa Lộc nhập cung mệnh...") - đọc như nhận định
//   về lá số của người xem;
// - chú thích dẫn chiếu phần khác của bài ("như đã thuật nhiều lần ở trước");
// - chữ nối đầu đoạn trỏ về đoạn trước đã bị tách ("Như vậy ...", "Hoặc ...") -> bỏ chữ nối, giữ nội dung.
const PALACE_WORD = "mệnh|phụ mẫu|phúc đức|điền trạch|quan lộc|sự nghiệp|nô bộc|giao hữu|thiên di|tật ách|tài bạch|tử tức|tử nữ|phu thê|huynh đệ";
const EXAMPLE_SENTENCE = new RegExp(`(^|[.!?;]\\s+|\\n)(?:Ví dụ|Thí dụ|Chẳng hạn)(?: như)?:?\\s+(?=[^\\n.!?]*?(?:phi hóa|cung (?:${PALACE_WORD})))[^\\n]*?(?:[.!?](?=\\s)|(?=\\n)|$)`, "giu");
const stripArticleGlue = (text: string) =>
  text
    .replace(EXAMPLE_SENTENCE, "$1")
    .replace(/,?\s*như (?:đã thuật|đã nói|đã trình bày|đã đề cập|trên đã nói)(?: nhiều lần)?(?: ở (?:trên|trước|phần trước))?\s*,/gu, ",")
    .replace(/^(?:Như vậy|Do đó|Vì vậy|Vì thế|Cho nên|Hoặc|Tức là|Nói cách khác)[\s,]+(\p{L})/u, (_m, first) => first.toUpperCase());

// Crawl ngắt dòng giữa "Người sinh năm" và can năm -> nối lại để lọc được theo năm sinh.
const joinBrokenLabels = (text: string) => text.replace(/(sinh năm)\s*\n\s*(?=(?:Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)(?![\p{L}]))/gu, "$1 ");

// Khối "BỐ CỤC CÁC SAO" tả vị trí các sao cho trường hợp của bài gốc; nhiều bài chép nhầm khối của sao khác
// ("Sao Thiên Đồng độc tọa..." trong bài về Thiên Tướng) -> bỏ khối khi chính tinh nó tả không thuộc điều kiện.
const LAYOUT_HEADING = /^BỐ CỤC CÁC SAO\s*$/u;
const UPPER_HEADING = /^[\p{Lu}\d][\p{Lu}\d ,:]{5,}$/u;
const MAIN_STAR_WORDS = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"];
function stripForeignLayout(text: string, conditionStars: string[]): string {
  const lines = text.split("\n");
  const at = lines.findIndex((l) => LAYOUT_HEADING.test(l.trim()));
  if (at < 0) return text;
  let end = at + 1;
  while (end < lines.length && !UPPER_HEADING.test(lines[end].trim())) end++;
  const block = lines.slice(at + 1, end).join(" ").trim();
  const subject = MAIN_STAR_WORDS.find((name) => new RegExp(`^(?:Sao\\s+)?${name}`, "iu").test(block));
  if (!subject || conditionStars.includes(subject.toLowerCase())) return text;
  return [...lines.slice(0, at), ...lines.slice(end)].join("\n");
}

// Văn phong đại chúng (khen chung chung, khẩu hiệu: xưng "bạn", không thuật ngữ Tử Vi hoặc có câu cảm thán) - vẫn
// giữ nhưng runtime chỉ dùng lấp chỗ trống (tối đa 1 đoạn mỗi cung, đứng cuối).
// "bạn" là đại từ ngôi thứ hai (không phải "bạn bè", "kết bạn", "người bạn", "các bạn" - lời bài viết gửi độc giả).
const SECOND_PERSON = /(^|[^\p{L}])(?<!(?:kết|các|người|những|nhiều|lầm|nhờ|chọn|giao|làm|mấy|vài|với|và) )[Bb]ạn(?! (?:bè|đời|hữu|học|tình|thân|đồng|trai|gái|làm ăn|cùng|đọc|tốt|xấu|cũ|mới|nhậu|chí cốt))(?![\p{L}])/u;
const TUVI_TERMS = new RegExp(
  `(^|[^\\p{L}])(cung|sao|hóa|miếu|hãm|vượng|đắc địa|chính tinh|tam hợp|xung chiếu|tọa|đồng độ|lộc tồn|kình dương|đà la|không kiếp|địa không|địa kiếp|${MAIN_STAR_WORDS.join("|")})([^\\p{L}]|$)`,
  "iu",
);
const isPopStyle = (text: string) => text.length < 700 && SECOND_PERSON.test(text) && (!TUVI_TERMS.test(text) || text.includes("!"));

// Mẫu vận hạn chỉ nêu thuật ngữ ("Lộc Thể nhập Dụng, là cát tượng, cần nghiệm lý thêm...") - không có nội dung luận.
// + "Tự Hóa là không tốt, phi Hóa Kỵ nhập ĐV..." và mẫu "Từ ngã cung / tha cung phi Hóa..." (ví dụ cung khác, không luận lá số).
// (kể cả "Lộc Thể chiếu Dụng là cát tượng về Mệnh", "Cung Phu thê là cung khí số vị cung Thiên di...", lời dặn người luận
// "Cần khảo sát kỹ tinh hệ ... khi luận giải lá số" - không phải nội dung luận cho người xem)
const JARGON_TEMPLATE =
  /^(Lộc|Quyền|Khoa|K[ỵị]) Thể (nhập|chiếu) Dụng|^Tự Hóa là không tốt|^Từ "(ngã|tha) cung"|^Đây là trường hợp "Thuận thủy K[ỵị]"|^Đây là cách Củ triều k[ỵị]|^Cung \S+(?: \S+)? là cung khí số vị|^Cần khảo sát kỹ tinh hệ/u;

const cleanText = (text: string) =>
  stripArticleGlue(fixStarTypos(modernizePronoun(scrubSources(stripOtherChartYears(stripChinese(stripUngKy(joinBrokenLabels(String(text || "").normalize("NFC").replace(/\r\n?/g, "\n")))))))))
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    // Mục liệt kê rỗng ("4." không có nội dung) của mẫu nguồn bị hỏng.
    .replace(/^(?:\d{1,2}[.)]|[a-zđ][.)])\s*$/gmu, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    // Đoạn mở bằng số thứ tự mục của bài gốc ("2. Môi trường làm việc ngoại tại:") -> bỏ số thứ tự.
    .replace(/^(?:[2-9]|1\d)[.)]\s+(?=\S)/u, "");

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

// ============ TÁCH BÀI TỔNG HỢP THÀNH TỪNG MỤC ============
// Bài dài gom nhiều trường hợp (tiêu đề viết hoa, "...:" , "★ ...", "Người sinh năm Giáp: ...") -> mỗi mục là một đoạn riêng,
// kế thừa điều kiện của bài và có phạm vi riêng (trích từ tiêu đề / câu đầu của mục). Mục chỉ đúng với dữ liệu lá số KHÔNG
// có (tháng sinh, giờ sinh, sinh ngày / đêm, phương sinh) -> bỏ. Mục của bài cung Mệnh nói về khía cạnh cung khác
// ("NĂNG LỰC SỰ NGHIỆP", "hôn nhân"...) -> chuyển sang cung đó (vẫn giữ điều kiện của cung Mệnh).
const SPLIT_MIN_LENGTH = 900;
const SECTION_MIN_LENGTH = 80;
const isUpperHeading = (line: string) => {
  const letters = line.replace(/[^\p{L}]/gu, "");
  return letters.length >= 6 && [...letters].filter((c) => c === c.toUpperCase() && c !== c.toLowerCase()).length / letters.length >= 0.7;
};
const LABEL_LINE = /^(?:người sinh năm|sinh năm|người sinh giờ|sinh giờ|nam mệnh|nữ mệnh|mệnh nam|mệnh nữ)[^:\n]{0,40}:/iu;
const isSectionStart = (line: string) =>
  (line.length <= 100 && (/:\s*$/.test(line) || isUpperHeading(line) || /^[★■●◆▪❖]/u.test(line))) || LABEL_LINE.test(line) || /^["“][^"”]{3,40}["”]/u.test(line);
// Phạm vi lá số không có dữ liệu để kiểm.
const UNVERIFIABLE_SCOPE = /(sinh|người sinh)\s+(vào\s+)?(tháng|mùa|giờ|ban ngày|ban đêm|ngày|đêm)|giờ sinh|tháng (giêng|chạp|\d+|một|hai|ba|tư|năm|sáu|bảy|tám|chín|mười)|phương (đông|tây|nam|bắc)/iu;
const ROUTE_BY_TOPIC: Array<[RegExp, string]> = [
  [/sự nghiệp|công danh|quan lộc/iu, "quan-loc"],
  [/tài vận|tài bạch|tiền bạc|tài lộc/iu, "tai-bach"],
  [/hôn nhân|phu thê|phối ngẫu|tình duyên|tình cảm/iu, "phu-the"],
  [/sức khỏe|tật ách|bệnh tật/iu, "tat-ach"],
  [/con cái|tử tức|tử nữ/iu, "tu-tuc"],
  [/anh em|huynh đệ/iu, "huynh-de"],
  [/cha mẹ|phụ mẫu/iu, "phu-mau"],
  [/bạn bè|nô bộc|giao hữu/iu, "no-boc"],
  [/nhà cửa|điền trạch|điền sản/iu, "dien-trach"],
  [/phúc đức/iu, "phuc-duc"],
  [/thiên di|xuất ngoại/iu, "thien-di"],
];

// Tiêu đề chú giải ("Bình chú:", "Chú thích:") bàn tiếp mục ngay trước -> không tách riêng.
const ANNOTATION_HEADING = /^(bình chú|lời bình|lời bàn|chú thích|chú giải|ghi chú|giải thích|nhận xét)\s*:?\s*$/iu;

/**
 * Mục tách từ bài tổng hợp kế thừa phạm vi của bài (câu mở đầu / tiêu đề: cặp sao, độ sáng, vị trí, giới tính, năm sinh) -
 * "TỔNG LUẬN TÀI VẬN" của bài "SAO THIÊN KHÔI, THIÊN VIỆT LUẬN TÀI VẬN" vẫn đòi đủ hai sao. Phạm vi riêng của mục thắng
 * khi cùng loại ("Thái Âm hãm địa:" trong bài mở bằng "Thái Âm nhập miếu"), chính tinh thì gộp.
 */
function inheritScope(own: TextRequirements | undefined, parent: TextRequirements | undefined): TextRequirements | undefined {
  if (!parent) return own;
  const merged: TextRequirements = { ...parent, ...own };
  if (parent.mainStars && own?.mainStars) merged.mainStars = [...new Set([...parent.mainStars, ...own.mainStars])];
  return merged;
}

// Bài bố cục cả lá số theo vị trí Tử Vi + cung Mệnh ("Lá số có Tử vi tại Dần,Cung Mệnh tại Mão": "- Tại Tí là cung Tử nữ: Phá
// Quân ..."): hai vị trí đó định ra chính tinh của cả 12 cung, nên mỗi khối "Tại <chi> là cung <X>: ..." là tri thức đúng của
// cung X -> chuyển sang file cung X (đọc cùng ngữ cảnh cung X, không lẫn vào thẻ cung Mệnh).
const LAYOUT_RULE = /^(Lá số có Tử vi tại|Tử vi ở cung|Tinh hệ cung Mệnh ở)/i;
const LAYOUT_BLOCK = /^[-•*+]?\s*Tại (?:Tý|Tí|Sửu|Dần|Mão|Thìn|Tỵ|Tị|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi) là cung ([^:]{2,20}):/iu;
const FILE_BY_PALACE: Record<string, string> = {
  "mệnh": "menh", "phụ mẫu": "phu-mau", "phúc đức": "phuc-duc", "điền trạch": "dien-trach", "quan lộc": "quan-loc", "nô bộc": "no-boc",
  "thiên di": "thien-di", "tật ách": "tat-ach", "tài bạch": "tai-bach", "tử tức": "tu-tuc", "phu thê": "phu-the", "huynh đệ": "huynh-de",
};
// Danh sách "Thái Âm tại cung Quan Lộc: ...", "(1) Tử Vi tại cung Thiên Di: ..." - mỗi khối nói về một cung; câu mở khối là lời
// khẳng định sao ở cung đó, được kiểm lại với lá số lúc hiển thị (không đúng thì cả khối bị lược).
const MAIN_NAMES = "Tử Vi|Thiên Cơ|Thái Dương|Vũ Khúc|Thiên Đồng|Liêm Trinh|Thiên Phủ|Thái Âm|Tham Lang|Cự Môn|Thiên Tướng|Thiên Lương|Thất Sát|Phá Quân";
const STAR_BLOCK = new RegExp(`^(?:(?:\\(\\d+\\)|\\d+[.)])\\s*)?(?:Sao\\s+)?(?:${MAIN_NAMES})(?:(?:,\\s*|\\s+và\\s+)(?:${MAIN_NAMES}))*\\s+tại cung ([^:]{2,20}):`, "iu");
export function splitLayoutBlocks(text: string, branchBlocks: boolean): Array<{ fileId: string; text: string }> | null {
  const intro: string[] = [];
  const blocks: Array<{ fileId: string; lines: string[] }> = [];
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const m = (branchBlocks ? line.match(LAYOUT_BLOCK) : null) ?? line.match(STAR_BLOCK);
    if (m) {
      const key = palaceKey(m[1].trim());
      const fileId = key ? FILE_BY_PALACE[key] : undefined;
      if (!fileId) return null;
      blocks.push({ fileId, lines: [line.replace(/^(?:[-•*+]|\(\d+\)|\d+[.)])\s*/, "")] });
    } else if (blocks.length) blocks[blocks.length - 1].lines.push(line);
    else intro.push(line);
  }
  if (blocks.length < 3) return null;
  // Phần mở đầu (tên cách cục) đi cùng khối cung Mệnh.
  return blocks.map((b) => ({ fileId: b.fileId, text: (b.fileId === "menh" ? [...intro, ...b.lines] : b.lines).join("\n") }));
}

type Section = { heading: string; text: string };
export function splitSections(text: string): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    if ((isSectionStart(line) && !ANNOTATION_HEADING.test(line)) || !current) {
      // Tiêu đề trống ngay trước tiêu đề khác ("VẬN MỆNH NĂM SINH KHÁC NHAU" -> "Người sinh năm Giáp: ...") gộp làm một.
      if (current && current.text === current.heading && isSectionStart(line) && current.text.length <= 100) {
        current.text = `${current.text}\n${line}`;
        current.heading = line;
        continue;
      }
      current = { heading: line, text: line };
      sections.push(current);
    } else {
      current.text = `${current.text}\n${line}`;
    }
  }
  // Mục quá ngắn gộp vào mục trước.
  const merged: Section[] = [];
  for (const s of sections) {
    const prev = merged[merged.length - 1];
    if (prev && s.text.length < SECTION_MIN_LENGTH && !LABEL_LINE.test(s.heading)) prev.text = `${prev.text}\n${s.text}`;
    else merged.push({ ...s });
  }
  return merged;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const report: string[] = [];
  let totalIn = 0;
  let totalOut = 0;

  // Lượt 1: làm sạch + tách mục + chuyển mục sang đúng cung, cho mọi file (mục chuyển sang file xử lý trước vẫn không bị sót).
  type Planned = { item: { id: string; text: string; source?: Source; accuracy?: number; section?: string }; rule: Rule; text: string; inherit?: TextRequirements; layout?: boolean };
  const plan = new Map<string, Planned[]>(FILES.map((f) => [f.id, []]));
  const planDrops = new Map<string, Record<string, number>>(FILES.map((f) => [f.id, {}]));
  const planDrop = (fileId: string, reason: string) => {
    const d = planDrops.get(fileId)!;
    d[reason] = (d[reason] ?? 0) + 1;
  };
  const planItem = (fileId: string, item: Planned["item"], rule: Rule) => {
    const text = stripForeignLayout(cleanText(item.text), conditionMainStars(rule));
    const layout = fileId === "tong-quan" ? null : splitLayoutBlocks(text, LAYOUT_RULE.test(rule.condition));
    if (layout) {
      planDrop(fileId, "bài bố cục cả lá số đã tách về từng cung");
      for (const block of layout) plan.get(block.fileId)!.push({ item: { ...item, text: block.text }, rule, text: block.text, layout: true });
      return;
    }
    // Điều kiện hai cung ("Cung Mệnh ... vô chính diệu ... và cung Điền trạch có sao Thiên phủ tọa thủ") mà nội dung nói về cung kia
    // ("Thiên Phủ tại cung Điền Trạch: ...") -> chuyển sang file cung đó.
    if (rule.clauses.length === 2) {
      const other = rule.clauses[1].palace;
      const lead = text.split("\n")[0].match(/^(?:\(\d+\)\s*)?(?:Sao\s+)?[\p{L} ]{3,25}? tại cung ([\p{L} ]{3,15}?)\s*:/u);
      const target = FILE_BY_PALACE[other];
      if (lead && target && target !== fileId && palaceKey(lead[1]) === other) {
        plan.get(target)!.push({ item, rule, text, layout: true });
        return;
      }
    }
    const sections = fileId === "tong-quan" || text.length < SPLIT_MIN_LENGTH ? [] : splitSections(text);
    if (sections.length < 2) {
      plan.get(fileId)!.push({ item, rule, text });
      return;
    }
    planDrop(fileId, "bài tổng hợp đã tách thành từng mục");
    // Phạm vi cả bài = phạm vi câu mở đầu, trừ khi dòng đầu đã là nhãn riêng của mục đầu ("Người sinh năm Giáp: ...").
    const firstLine = text.split("\n")[0].trim();
    const parentScope = LABEL_LINE.test(firstLine) || UNVERIFIABLE_SCOPE.test(firstLine) ? undefined : extractTextRequirements(text, conditionMainStars(rule));
    for (const section of sections) {
      if (UNVERIFIABLE_SCOPE.test(section.heading)) {
        planDrop(fileId, "mục theo tháng / giờ / phương sinh (lá số không có dữ liệu kiểm)");
        continue;
      }
      // Chỉ chuyển theo TIÊU ĐỀ mục thật (viết hoa / "...:" ngắn), không theo dòng nhãn "Người sinh năm Ất: Cung Quan Lộc...".
      const isTopicHeading = !LABEL_LINE.test(section.heading) && section.heading.length <= 100 && (isUpperHeading(section.heading) || /:\s*$/.test(section.heading));
      const topic = fileId === "menh" && isTopicHeading && section.heading !== sections[0].heading ? ROUTE_BY_TOPIC.find(([re]) => re.test(section.heading))?.[1] : undefined;
      const target = topic && plan.has(topic) ? topic : fileId;
      plan.get(target)!.push({ item: { ...item, text: section.text }, rule, text: section.text, inherit: section === sections[0] ? undefined : parentScope });
    }
  };
  const rawCounts = new Map<string, number>();
  for (const { id, file } of FILES) {
    const raw = JSON.parse(fs.readFileSync(path.join(CUNG_DIR, file), "utf8"));
    rawCounts.set(id, raw.interpretations?.length ?? 0);
    for (const item of raw.interpretations ?? []) {
      totalIn++;
      const condition = String(item.condition || "").normalize("NFC").trim();
      const parsed = parseCondition(condition);
      if (!parsed) {
        planDrop(id, classifyDrop(condition));
        continue;
      }
      planItem(id, item, { condition, specificity: parsed.specificity, clauses: parsed.clauses });
    }
    if (id === "menh") {
      const combos = JSON.parse(fs.readFileSync(path.join(CUNG_DIR, "star-combinations.json"), "utf8"));
      for (const section of combos.sections ?? []) {
        for (const item of section.interpretations ?? []) {
          totalIn++;
          const result = parseStarCombination(item);
          if (!result) {
            planDrop(id, "điều kiện chưa hỗ trợ");
            continue;
          }
          // priority (80-100) -> cùng thang accuracy của dữ liệu consolidated (~7) để mục chung
          // không lấn át các mục gắn chặt vị trí/sao của lá số.
          const accuracy = Math.round((Number(item.priority) || 70) / 10);
          planItem(id, { ...item, accuracy, section: section.title }, { condition: result.condition, specificity: result.parsed.specificity, clauses: result.parsed.clauses });
        }
      }
    }
  }

  // Lượt 2: dựng file đã làm mịn cho từng cung.
  for (const { id, file, title } of FILES) {
    const sources: Source[] = [];
    const sourceIndex = new Map<string, number>();
    const byText = new Map<string, Entry>();
    const dropped: Record<string, number> = { ...planDrops.get(id)! };
    const drop = (reason: string) => (dropped[reason] = (dropped[reason] ?? 0) + 1);

    const addEntry = (item: Planned["item"], rule: Rule, text: string, inherit?: TextRequirements, layout?: boolean) => {
      if (text.length < MIN_TEXT_LENGTH) return drop("nội dung quá ngắn");
      if (isChartSpecificText(text)) return drop("nội dung gắn lá số khác");
      // Đoạn bắt đầu giữa câu (chữ thường) là mảnh bị tách khỏi đoạn trước khi crawl.
      if (/^\p{Ll}/u.test(text) || isDanglingFragment(text)) return drop("mảnh câu bị tách");
      if (JARGON_TEMPLATE.test(text)) return drop("mẫu thuật ngữ vận hạn");
      // Nội dung nói về vận hạn chỉ hợp với điều kiện vận hạn (khớp theo năm xem).
      if (!isPeriodCondition(rule) && isPeriodText(text)) return drop("nội dung nói về vận hạn");

      const src = cleanSource(item.source);
      const srcKey = `${src.book}|${src.author ?? ""}|${src.translator ?? ""}`;
      if (!sourceIndex.has(srcKey)) {
        sourceIndex.set(srcKey, sources.length);
        sources.push(src);
      }

      // Phạm vi nội dung (vị trí / chính tinh / giới tính / năm sinh ở câu mở đầu) + phạm vi kế thừa từ bài gốc khi là mục tách.
      // Tổng quan lá số là bảng liệt kê 12 cung nên không trích.
      const own = id === "tong-quan" ? undefined : extractTextRequirements(text, conditionMainStars(rule));
      const requires = inheritScope(own, inherit);
      // Cùng nội dung nhưng khác phạm vi (vd độ sáng gán cho chính tinh khác nhau của điều kiện) -> mục riêng.
      const key = `${dedupeKey(text)}|${JSON.stringify(requires ?? null)}`;
      const existing = byText.get(key);
      if (existing) {
        if (!existing.rules.some((r) => r.condition === rule.condition)) existing.rules.push(rule);
        existing.accuracy = Math.max(existing.accuracy, Number(item.accuracy) || 0);
        return drop("trùng nội dung (đã gộp rule)");
      }
      if (isUnverifiableConditional(text, own)) return drop("vế 'Nếu...' không kiểm chứng được");
      byText.set(key, {
        id: item.id,
        section: item.section,
        text,
        source: sourceIndex.get(srcKey)!,
        accuracy: Number(item.accuracy) || 0,
        rules: [rule],
        ...(requires ? { requires } : {}),
        // "layout": khối tóm tắt từng cung của bài bố cục cả lá số ("Tại Tị là cung Sự nghiệp: Cự Môn / Gặp cát tinh...") - chỉ lấp chỗ.
        ...(isPopStyle(text) ? { style: "pop" as const } : layout ? { style: "layout" as const } : {}),
      });
    };

    for (const { item, rule, text, inherit, layout } of plan.get(id)!) addEntry(item, rule, text, inherit, layout);

    const { entries, merged } = mergeNearDuplicates([...byText.values()]);
    if (merged) dropped["gần trùng (đã gộp rule vào đoạn đầy đủ nhất)"] = merged;
    for (const entry of entries) entry.rules.sort((a, b) => b.specificity - a.specificity);
    totalOut += entries.length;

    // Bảng điều kiện dùng chung: mỗi điều kiện lưu một lần, mục tri thức trỏ tới bằng chỉ số.
    const conditions: Rule[] = [];
    const conditionIndex = new Map<string, number>();
    const ruleRef = (rule: Rule) => {
      let index = conditionIndex.get(rule.condition);
      if (index === undefined) {
        index = conditions.length;
        conditions.push(rule);
        conditionIndex.set(rule.condition, index);
      }
      return index;
    };

    const usedIds = new Set<string>();
    // Dữ liệu tải về trình duyệt không kèm bảng nguồn (không công khai nguồn lấy tri thức).
    // Nguồn vẫn còn trong file crawl gốc (cung/*-consolidated.json) nếu cần tra cứu nội bộ.
    const output: NormalizedKnowledgeFile = {
      schema: "tuvi-knowledge@2",
      palace: id,
      title,
      sources: [],
      conditions,
      // id trung tính (không mang dấu vết nguồn crawl) và ỔN ĐỊNH theo nội dung - truy vết được qua các lần chạy lại.
      // school / method: chỉ khi có bằng chứng (data/kb/kb-metadata.jsonl, sinh bởi kb:apply); nguồn không đưa vào đây.
      entries: entries.map(({ source: _source, rules, ...entry }) => {
        const key = kbKey(entry.text);
        let stableId = `${id}-${key.slice(4, 14)}`;
        for (let n = 2; usedIds.has(stableId); n++) stableId = `${id}-${key.slice(4, 14)}-${n}`;
        usedIds.add(stableId);
        const meta = kbMetadata.get(key);
        return {
          ...entry,
          id: stableId,
          ...(meta && meta.school !== "UNKNOWN" ? { school: meta.school, ...(meta.method ? { method: meta.method } : {}) } : {}),
          rules: rules.map(ruleRef),
        };
      }),
    };
    const outFile = path.join(OUT_DIR, `${id}.json`);
    fs.writeFileSync(outFile, JSON.stringify(output));
    const rules = entries.reduce((sum, e) => sum + e.rules.length, 0);
    report.push(
      `${id.padEnd(10)} ${String(rawCounts.get(id) ?? 0).padStart(5)} → ${String(entries.length).padStart(5)} mục (${rules} rule, ${conditions.length} điều kiện), ` +
        `${(fs.statSync(path.join(CUNG_DIR, file)).size / 1e6).toFixed(1)}MB → ${(fs.statSync(outFile).size / 1e6).toFixed(1)}MB | bỏ: ` +
        Object.entries(dropped).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", "),
    );
  }

  console.log(report.join("\n"));
  console.log(`\nTổng: ${totalIn} mục gốc → ${totalOut} mục đã làm mịn trong ${path.relative(process.cwd(), OUT_DIR)}`);
  if (process.env.KNOWLEDGE_MERGE_LOG) fs.writeFileSync(process.env.KNOWLEDGE_MERGE_LOG, JSON.stringify(mergeLog, null, 1));
}

main();
