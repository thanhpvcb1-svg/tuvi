/**
 * Trang thô (data/kb/raw) -> knowledge block (data/kb/blocks.jsonl) + hàng đợi duyệt (data/kb/review-queue.jsonl).
 * Chạy: npm run kb:extract
 *
 * - Mỗi đoạn luận có nghĩa độc lập = 1 block; đoạn quá ngắn (< 80 ký tự) gộp với đoạn kế tiếp cùng mục.
 * - Giữ provenance: nguồn, URL, tiêu đề mục, số đoạn, thứ tự, tác giả, ngày, hash.
 * - Nguồn "excerpt-only": kho chỉ lưu trích ngắn + hash, nguyên văn chỉ nằm ở bản chép cục bộ data/kb/raw.
 * - Đoạn không có thực thể / khái niệm Tử Vi nào (lời chào, quảng cáo) bị loại.
 */
import { dedupe, type Candidate } from "./lib/blocks";
import { pageCandidates, siteBoilerplate, type RawPage } from "./lib/pages";

const fs = require("fs");
const path = require("path");
const KB_DIR = path.join(process.cwd(), "data/kb");

function main() {
  const registry = JSON.parse(fs.readFileSync(path.join(KB_DIR, "sources.json"), "utf8"));
  const candidates: Candidate[] = [];
  const perSource: Record<string, { pages: number; blocks: number; noise: number; boilerplate: number }> = {};
  for (const source of registry.sources) {
    const file = path.join(KB_DIR, "raw", `${source.id}.jsonl`);
    if (!fs.existsSync(file)) continue;
    const stat = (perSource[source.id] = { pages: 0, blocks: 0, noise: 0, boilerplate: 0 });
    const pages = fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((line: string) => JSON.parse(line) as RawPage);
    const boilerplate = siteBoilerplate(pages);
    stat.boilerplate = boilerplate.size;
    for (const page of pages) {
      const { candidates: list, noise } = pageCandidates(page, source, boilerplate);
      stat.pages++;
      stat.blocks += list.length;
      stat.noise += noise;
      candidates.push(...list);
    }
  }
  const blocks = dedupe(candidates);
  fs.writeFileSync(path.join(KB_DIR, "blocks.jsonl"), blocks.map((b) => JSON.stringify(b)).join("\n") + (blocks.length ? "\n" : ""));
  const review = blocks
    .filter((b) => b.status === "REVIEW")
    .map((b) => ({ id: b.id, reason: b.relations.length ? b.relations.map((r) => r.type).join(",") : `entity_confidence ${b.entities.confidence}`, excerpt: b.content.excerpt.slice(0, 120) }));
  fs.writeFileSync(path.join(KB_DIR, "review-queue.jsonl"), review.map((r) => JSON.stringify(r)).join("\n") + (review.length ? "\n" : ""));

  const count = (key: (b: (typeof blocks)[number]) => string) => blocks.reduce<Record<string, number>>((acc, b) => ((acc[key(b)] = (acc[key(b)] ?? 0) + 1), acc), {});
  const multiSource = blocks.filter((b) => b.source_refs.length > 1).length;
  console.log("Theo nguồn:", JSON.stringify(perSource));
  console.log(`Ứng viên ${candidates.length} → ${blocks.length} block (${candidates.length - blocks.length} trùng gộp vào block chuẩn, ${multiSource} block có ≥2 nguồn)`);
  console.log("School:", JSON.stringify(count((b) => b.school)));
  console.log("Type:", JSON.stringify(count((b) => b.type)));
  console.log(`Hàng đợi duyệt: ${review.length}`);
}

// Chỉ chạy khi gọi trực tiếp file bundle của lệnh này (không chạy khi được import, vd trong test).
if (/kb-extract.js$/.test(process.argv[1] ?? "")) main();
