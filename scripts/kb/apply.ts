/**
 * Chuyển kết quả đối chiếu (data/kb/bac-phai-map.json) thành metadata cho kho luận giải: data/kb/kb-metadata.jsonl.
 * Chạy: npm run kb:apply   (sau kb:map; rồi npm run knowledge:normalize để đưa school vào kho runtime)
 *
 * Quy tắc - không suy đoán:
 * - school = BAC_PHAI chỉ khi CHÍNH NGUYÊN VĂN đoạn đó (≥ 80% cụm từ, đoạn ≥ 80 ký tự) được một nguồn tự khai Bắc phái
 *   đăng; còn lại giữ UNKNOWN. Nhắc cùng khái niệm (corroborated_by) KHÔNG phải bằng chứng trường phái.
 * - source_refs (URL, tiêu đề, tác giả) chỉ lưu nội bộ ở file này - kho runtime tải lên trình duyệt không kèm nguồn.
 */
import type { KnowledgeBlock } from "./lib/blocks";

const fs = require("fs");
const path = require("path");
const KB_DIR = path.join(process.cwd(), "data/kb");
const SCHOOL_CONTAINMENT = 0.8;

type Link = {
  kb_key: string; legacy_id: string; palace: string; concepts: string[]; corroborated_by: string[];
  text_overlap: Array<{ block: string; containment: number }>;
};

function main() {
  const map = JSON.parse(fs.readFileSync(path.join(KB_DIR, "bac-phai-map.json"), "utf8")) as { links: Link[] };
  const blocks = new Map<string, KnowledgeBlock>(
    fs.readFileSync(path.join(KB_DIR, "blocks.jsonl"), "utf8").split("\n").filter(Boolean).map((l: string) => {
      const b = JSON.parse(l) as KnowledgeBlock;
      return [b.id, b];
    }),
  );
  // Độ dài đoạn trong kho: lấy từ file runtime hiện tại.
  const lengths = new Map<string, number>();
  const NORMALIZED = path.join(process.cwd(), "src/lib/tuvi/knowledge/cung/normalized");
  for (const file of fs.readdirSync(NORMALIZED).filter((f: string) => f.endsWith(".json"))) {
    for (const e of JSON.parse(fs.readFileSync(path.join(NORMALIZED, file), "utf8")).entries) lengths.set(`${file}:${e.id}`, e.text.length);
  }

  const rows = [];
  const decisions: string[] = [];
  for (const link of map.links) {
    const refs = link.text_overlap
      .map((o) => ({ o, b: blocks.get(o.block) }))
      .filter((x): x is { o: Link["text_overlap"][number]; b: KnowledgeBlock } => Boolean(x.b))
      .flatMap(({ o, b }) => b.source_refs.map((r) => ({ source_id: r.source_id, url: r.url, title: r.title, author: r.author, school: r.school, containment: o.containment, method: r.method })));
    const length = lengths.get(`${link.palace}.json:${link.legacy_id}`) ?? 0;
    const evidence = refs.filter((r) => r.school === "BAC_PHAI" && r.containment >= SCHOOL_CONTAINMENT).sort((a, b) => b.containment - a.containment)[0];
    const school = evidence && length >= 80 ? "BAC_PHAI" : "UNKNOWN";
    if (school === "BAC_PHAI") decisions.push(`${link.legacy_id}: BAC_PHAI - trùng ${Math.round(evidence.containment * 100)}% với ${evidence.url}`);
    rows.push({
      kb_key: link.kb_key,
      legacy_id: link.legacy_id,
      palace: link.palace,
      school,
      school_evidence: school === "BAC_PHAI" ? `trùng nguyên văn ${Math.round(evidence!.containment * 100)}% với ${evidence!.source_id} (nguồn tự khai Bắc phái): ${evidence!.url}` : null,
      method: school === "BAC_PHAI" ? evidence!.method : refs.find((r) => r.method)?.method ?? null,
      concepts: link.concepts,
      corroborating_blocks: link.corroborated_by.length,
      // Nguồn đăng cùng nguyên văn (không trùng lặp URL) - để truy nguồn gốc nội bộ.
      source_refs: [...new Map(refs.map((r) => [r.url, { source_id: r.source_id, url: r.url, title: r.title, author: r.author, containment: r.containment }])).values()].slice(0, 5),
    });
  }
  fs.writeFileSync(path.join(KB_DIR, "kb-metadata.jsonl"), rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  const withRefs = rows.filter((r) => r.source_refs.length).length;
  console.log(`Metadata cho ${rows.length} đoạn trong kho: ${withRefs} có nguồn đăng cùng nguyên văn, ${decisions.length} gắn BAC_PHAI (có bằng chứng).`);
  for (const d of decisions) console.log(`  · ${d}`);
}

if (/kb-apply\.js$/.test(process.argv[1] ?? "")) main();
