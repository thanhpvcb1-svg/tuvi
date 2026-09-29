/**
 * Kiểm tra kho tri thức crawl: npm run validate-knowledge (thoát mã 1 nếu có lỗi).
 * - SOURCE_REGISTRY: id duy nhất, school hợp lệ; nguồn khai BAC_PHAI phải ghi bằng chứng.
 * - Block: đủ trường, enum hợp lệ, id duy nhất; school khác UNKNOWN phải có bằng chứng; mọi block có provenance
 *   (URL, ngày crawl, hash); nguồn chỉ cho trích ngắn thì không vượt giới hạn trích; quan hệ trỏ tới block có thật.
 */
import { EXCERPT_LIMIT, type KnowledgeBlock } from "./lib/blocks";

const fs = require("fs");
const path = require("path");
const KB_DIR = path.join(process.cwd(), "data/kb");

const SCHOOLS = ["CLASSICAL", "BAC_PHAI", "NAM_PHAI", "OTHER", "UNKNOWN"];
const TYPES = ["PHU", "VERSE", "RULE", "STAR_INTERPRETATION", "PALACE_INTERPRETATION", "CASE_PATTERN", "TU_HOA", "PHI_HOA", "THAI_TUE", "DUNG_THAN", "COMMENTARY", "MODERN_INTERPRETATION"];

export function validateRegistry(registry: any): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const s of registry.sources ?? []) {
    if (ids.has(s.id)) errors.push(`registry: trùng id ${s.id}`);
    ids.add(s.id);
    if (![...SCHOOLS, "PER_PAGE"].includes(s.school)) errors.push(`registry ${s.id}: school "${s.school}" không hợp lệ`);
    if (s.school === "BAC_PHAI" && !s.school_evidence) errors.push(`registry ${s.id}: khai BAC_PHAI nhưng thiếu school_evidence`);
    if (typeof s.allowed !== "boolean") errors.push(`registry ${s.id}: thiếu allowed`);
    if (!/^https:\/\//.test(s.baseUrl ?? "")) errors.push(`registry ${s.id}: baseUrl phải là https`);
    if (!s.rights) errors.push(`registry ${s.id}: thiếu rights`);
  }
  return errors;
}

export function validateBlocks(blocks: KnowledgeBlock[]): string[] {
  const errors: string[] = [];
  const ids = new Set(blocks.map((b) => b.id));
  if (ids.size !== blocks.length) errors.push("block: trùng id");
  for (const b of blocks) {
    const at = `block ${b.id}`;
    if (!/^kb_[0-9a-f]{12}$/.test(b.id)) errors.push(`${at}: id sai định dạng`);
    if (!SCHOOLS.includes(b.school)) errors.push(`${at}: school "${b.school}" không hợp lệ`);
    if (!TYPES.includes(b.type)) errors.push(`${at}: type "${b.type}" không hợp lệ`);
    if (b.school !== "UNKNOWN" && !b.school_evidence) errors.push(`${at}: school ${b.school} không có bằng chứng`);
    if (!b.source_refs?.length) errors.push(`${at}: không có source_refs`);
    for (const r of b.source_refs ?? []) {
      if (!/^https?:\/\//.test(r.url)) errors.push(`${at}: source_ref thiếu URL`);
      if (!r.crawl_date || Number.isNaN(Date.parse(r.crawl_date))) errors.push(`${at}: source_ref thiếu ngày crawl`);
      if (!/^[0-9a-f]{64}$/.test(r.content_hash ?? "")) errors.push(`${at}: source_ref thiếu content_hash`);
      if (!SCHOOLS.includes(r.school)) errors.push(`${at}: source_ref school không hợp lệ`);
      if (r.rights === "excerpt-only" && b.content.excerpt.length > EXCERPT_LIMIT + 2) errors.push(`${at}: trích dài quá giới hạn cho nguồn excerpt-only`);
    }
    if ((b as any).content?.text) errors.push(`${at}: kho không được lưu nguyên văn`);
    for (const rel of b.relations) if (!ids.has(rel.target)) errors.push(`${at}: quan hệ trỏ tới block không tồn tại ${rel.target}`);
    if (!(b.quality.score >= 0 && b.quality.score <= 1)) errors.push(`${at}: quality.score ngoài [0,1]`);
  }
  return errors;
}

function main() {
  const registry = JSON.parse(fs.readFileSync(path.join(KB_DIR, "sources.json"), "utf8"));
  const file = path.join(KB_DIR, "blocks.jsonl");
  const blocks = fs.existsSync(file) ? (fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((l: string) => JSON.parse(l)) as KnowledgeBlock[]) : [];
  const errors = [...validateRegistry(registry), ...validateBlocks(blocks)];
  if (errors.length) {
    console.error(`❌ ${errors.length} lỗi:\n- ${errors.slice(0, 40).join("\n- ")}`);
    process.exit(1);
  }
  console.log(`✅ Registry ${registry.sources.length} nguồn, ${blocks.length} block hợp lệ.`);
}

// Chỉ chạy khi gọi trực tiếp file bundle của lệnh này (không chạy khi được import, vd trong test).
if (/kb-validate.js$/.test(process.argv[1] ?? "")) main();
