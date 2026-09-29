/**
 * Đối chiếu tri thức đã crawl (data/kb/blocks.jsonl) với kho luận giải hiện có (cung/normalized) - KHÔNG sửa kho.
 * Chạy: npm run kb:map   ->  data/kb/bac-phai-map.json + data/kb/report.md
 *
 * - Độ phủ khái niệm: mỗi khái niệm Tứ Hóa / phi tinh có bao nhiêu đoạn trong kho, bao nhiêu nguồn tự khai Bắc phái
 *   định nghĩa nó, bộ khớp lá số đã kiểm được chưa -> CORROBORATED / KB_ONLY / GAP_KB (+ ENGINE_GAP).
 * - Liên kết đoạn cũ: đoạn trong kho nhắc khái niệm có nguồn Bắc phái định nghĩa -> `corroborated_by` (tham chiếu
 *   nguồn, KHÔNG phải bằng chứng đoạn đó thuộc Bắc phái). school của đoạn cũ giữ UNKNOWN; chỉ khi chính nguyên văn
 *   đoạn đó được một nguồn tự khai trường phái đăng lại mới ghi `school_claims` (vẫn là đề xuất, cần duyệt).
 */
import { CONCEPTS, conceptsIn } from "./lib/entities";
import type { KnowledgeBlock } from "./lib/blocks";
import { pageCandidates, type RawPage } from "./lib/pages";
import { kbKey, shinglesOf } from "./lib/text";

const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();
const KB_DIR = path.join(ROOT, "data/kb");
const NORMALIZED = path.join(ROOT, "src/lib/tuvi/knowledge/cung/normalized");
const OVERLAP = 0.6;

function main() {
  const blocks = fs.readFileSync(path.join(KB_DIR, "blocks.jsonl"), "utf8").split("\n").filter(Boolean).map((l: string) => JSON.parse(l)) as KnowledgeBlock[];
  // Nguyên văn block (chỉ có ở bản chép cục bộ) - để so trùng với kho.
  const registry = JSON.parse(fs.readFileSync(path.join(KB_DIR, "sources.json"), "utf8"));
  const textByHash = new Map<string, string>();
  for (const source of registry.sources) {
    const file = path.join(KB_DIR, "raw", `${source.id}.jsonl`);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split("\n").filter(Boolean)) {
      for (const c of pageCandidates(JSON.parse(line) as RawPage, source).candidates) textByHash.set(c.ref.content_hash, c.text);
    }
  }

  // Kho hiện có
  const kb: Array<{ key: string; legacyId: string; palace: string; concepts: string[]; shingles: Set<string> }> = [];
  for (const file of fs.readdirSync(NORMALIZED).filter((f: string) => f.endsWith(".json"))) {
    const data = JSON.parse(fs.readFileSync(path.join(NORMALIZED, file), "utf8"));
    for (const entry of data.entries) {
      kb.push({ key: kbKey(entry.text), legacyId: entry.id, palace: data.palace, concepts: conceptsIn(entry.text), shingles: shinglesOf(entry.text) });
    }
  }

  // Trùng nguyên văn giữa block crawl và đoạn trong kho (chỉ mục ngược trên cụm từ của block - nhỏ).
  const blockShingles = new Map<string, Set<string>>();
  const index = new Map<string, string[]>();
  for (const block of blocks) {
    const text = textByHash.get(block.source_refs[0].content_hash);
    if (!text) continue;
    const set = shinglesOf(text);
    blockShingles.set(block.id, set);
    for (const s of set) index.set(s, [...(index.get(s) ?? []), block.id]);
  }
  const overlaps = new Map<string, Array<{ block: string; containment: number }>>();
  for (const entry of kb) {
    const shared = new Map<string, number>();
    for (const s of entry.shingles) for (const id of index.get(s) ?? []) shared.set(id, (shared.get(id) ?? 0) + 1);
    for (const [id, n] of shared) {
      const c = Math.max(n / Math.max(entry.shingles.size, 1), n / Math.max(blockShingles.get(id)!.size, 1));
      if (c >= OVERLAP && n >= 5) overlaps.set(entry.key, [...(overlaps.get(entry.key) ?? []), { block: id, containment: Number(c.toFixed(2)) }]);
    }
  }

  const blockById = new Map(blocks.map((b) => [b.id, b]));
  const bacPhaiByConcept = new Map<string, KnowledgeBlock[]>();
  for (const block of blocks) if (block.school === "BAC_PHAI") for (const c of block.concepts) bacPhaiByConcept.set(c, [...(bacPhaiByConcept.get(c) ?? []), block]);

  const concepts = CONCEPTS.map((concept) => {
    const inKb = kb.filter((e) => e.concepts.includes(concept.id));
    const sourceBlocks = blocks.filter((b) => b.concepts.includes(concept.id));
    const bac = bacPhaiByConcept.get(concept.id) ?? [];
    const bySchool = sourceBlocks.reduce<Record<string, number>>((acc, b) => ((acc[b.school] = (acc[b.school] ?? 0) + 1), acc), {});
    const status = inKb.length && bac.length ? "CORROBORATED" : inKb.length ? "KB_ONLY" : bac.length ? "GAP_KB" : "NO_DATA";
    return {
      id: concept.id,
      name: concept.name,
      type: concept.type,
      status,
      engine: concept.engine ?? "ENGINE_GAP",
      kb_entries: inKb.length,
      kb_by_palace: inKb.reduce<Record<string, number>>((acc, e) => ((acc[e.palace] = (acc[e.palace] ?? 0) + 1), acc), {}),
      source_blocks: bySchool,
      bac_phai_sources: [...new Map(bac.flatMap((b) => b.source_refs.filter((r) => r.school === "BAC_PHAI")).map((r) => [r.url, { url: r.url, title: r.title, author: r.author, source_id: r.source_id }])).values()].slice(0, 8),
    };
  });

  const links = kb
    .map((entry) => {
      const corroborated = entry.concepts.flatMap((c) => (bacPhaiByConcept.get(c) ?? []).slice(0, 2).map((b) => b.id));
      const textOverlap = overlaps.get(entry.key) ?? [];
      const claims = textOverlap
        .map((o) => blockById.get(o.block)!)
        .filter((b) => b.school !== "UNKNOWN")
        .map((b) => ({ school: b.school, by: b.source_refs.find((r) => r.school === b.school)?.source_id ?? b.source_refs[0].source_id, block: b.id, evidence: b.school_evidence }));
      if (!corroborated.length && !textOverlap.length) return null;
      return {
        kb_key: entry.key,
        legacy_id: entry.legacyId,
        palace: entry.palace,
        concepts: entry.concepts,
        corroborated_by: [...new Set(corroborated)],
        text_overlap: textOverlap,
        school: "UNKNOWN",
        school_claims: claims,
        needs_review: claims.length > 0,
      };
    })
    .filter(Boolean);

  const out = { generated_at: new Date().toISOString(), kb_entries: kb.length, blocks: blocks.length, concepts, links };
  fs.writeFileSync(path.join(KB_DIR, "bac-phai-map.json"), JSON.stringify(out, null, 1));

  const row = (c: (typeof concepts)[number]) =>
    `| ${c.name} | ${c.status} | ${c.kb_entries} | ${Object.entries(c.source_blocks).map(([k, v]) => `${k} ${v}`).join(", ") || "-"} | ${c.engine} |`;
  const report = [
    `# Đối chiếu tri thức Bắc phái với kho hiện có`,
    ``,
    `Sinh lúc ${out.generated_at} bởi \`npm run kb:map\`. Kho luận giải: ${kb.length} đoạn; block đã crawl: ${blocks.length}.`,
    ``,
    `| Khái niệm | Trạng thái | Đoạn trong kho | Block nguồn (theo school) | Bộ khớp lá số |`,
    `|---|---|---|---|---|`,
    ...concepts.map(row),
    ``,
    `- CORROBORATED: kho có và có nguồn tự khai Bắc phái định nghĩa. KB_ONLY: kho có nhưng chưa có nguồn Bắc phái đối chiếu.`,
    `- GAP_KB: nguồn Bắc phái có, kho chưa có. ENGINE_GAP: bộ khớp lá số chưa kiểm được khái niệm này.`,
    ``,
    `Đoạn trong kho có tham chiếu nguồn Bắc phái: ${links.length}; trùng nguyên văn với block crawl: ${links.filter((l: any) => l.text_overlap.length).length}; có đề xuất school (cần duyệt): ${links.filter((l: any) => l.needs_review).length}.`,
    `school của đoạn trong kho KHÔNG bị đổi - file bac-phai-map.json chỉ là đề xuất.`,
  ].join("\n");
  fs.writeFileSync(path.join(KB_DIR, "report.md"), report + "\n");
  console.log(report);
}

// Chỉ chạy khi gọi trực tiếp file bundle của lệnh này (không chạy khi được import, vd trong test).
if (/kb-map.js$/.test(process.argv[1] ?? "")) main();
