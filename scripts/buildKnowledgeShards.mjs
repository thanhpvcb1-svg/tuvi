/**
 * Chia kho tri thức đã làm mịn thành mảnh theo địa chi của cung đang xét, cho /api/knowledge/query (chế độ server).
 * Chạy sau `vite build` (npm run build): dist/_kb/<file>/<chi|any>.json
 *
 * Mỗi đoạn vào mảnh của những chi mà MỌI điều kiện của nó đòi (vd "Cung Mệnh an tại Ngọ..." -> ngo); đoạn có ít nhất
 * một điều kiện không gắn chi -> "any". Truy vấn một cung chỉ cần đọc mảnh chi của cung + "any" (≈ 1/4 dung lượng),
 * kết quả giống hệt khi đọc cả file vì đoạn ở mảnh chi khác không thể khớp.
 * dist/_kb/* bị chặn truy cập công khai bởi functions/_kb/[[path]].ts - chỉ Function đọc qua env.ASSETS.
 */
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("src/lib/tuvi/knowledge/cung/normalized");
const OUT = path.resolve("dist/_kb");
const PALACE_OF_FILE = {
  menh: "mệnh", "phu-mau": "phụ mẫu", "phuc-duc": "phúc đức", "dien-trach": "điền trạch", "quan-loc": "quan lộc",
  "no-boc": "nô bộc", "thien-di": "thiên di", "tat-ach": "tật ách", "tai-bach": "tài bạch", "tu-tuc": "tử tức",
  "phu-the": "phu thê", "huynh-de": "huynh đệ", than: "thân",
};
export const BRANCH_SHARD = { "tý": "ty", "sửu": "suu", "dần": "dan", "mão": "mao", "thìn": "thin", "tỵ": "ti", "ngọ": "ngo", "mùi": "mui", "thân": "than", "dậu": "dau", "tuất": "tuat", "hợi": "hoi" };

if (!fs.existsSync(path.resolve("dist"))) {
  console.error("Chưa có dist/ - chạy vite build trước.");
  process.exit(1);
}
fs.rmSync(OUT, { recursive: true, force: true });
let files = 0;
let bytes = 0;
for (const [fileId, palace] of Object.entries(PALACE_OF_FILE)) {
  const data = JSON.parse(fs.readFileSync(path.join(SRC, `${fileId}.json`), "utf8"));
  const shards = new Map();
  for (const [position, original] of data.entries.entries()) {
    // o: vị trí gốc trong file - server gộp mảnh "any" + mảnh chi theo đúng thứ tự này (kết quả giống chế độ trình duyệt).
    const entry = { ...original, o: position };
    const branches = new Set();
    let any = false;
    for (const ruleIndex of entry.rules) {
      const clause = data.conditions[ruleIndex]?.clauses.find((c) => c.palace === palace && c.branch);
      if (clause) branches.add(clause.branch);
      else any = true;
    }
    for (const key of any ? ["any"] : [...branches].map((b) => BRANCH_SHARD[b] ?? "any")) {
      if (!shards.has(key)) shards.set(key, []);
      shards.get(key).push(entry);
    }
  }
  fs.mkdirSync(path.join(OUT, fileId), { recursive: true });
  for (const key of ["any", ...Object.values(BRANCH_SHARD)]) {
    const entries = shards.get(key) ?? [];
    // Bảng điều kiện riêng của mảnh (đánh lại chỉ số).
    const conditions = [];
    const remap = new Map();
    const out = entries.map((entry) => ({
      ...entry,
      rules: entry.rules.map((r) => {
        if (!remap.has(r)) {
          remap.set(r, conditions.length);
          conditions.push(data.conditions[r]);
        }
        return remap.get(r);
      }),
    }));
    const json = JSON.stringify({ schema: data.schema, palace: data.palace, title: data.title, sources: [], conditions, entries: out });
    fs.writeFileSync(path.join(OUT, fileId, `${key}.json`), json);
    files++;
    bytes += json.length;
  }
}
console.log(`Kho tri thức (chế độ server): ${files} mảnh, ${(bytes / 1e6).toFixed(1)} MB -> dist/_kb`);
