/**
 * Test pipeline tri thức (node:test): npm run test-kb
 * Test 1-3, 5 của yêu cầu + robots.txt + nhận diện thực thể + kiểm tra hợp lệ.
 * (Test 4 "không có tri thức -> AI không bịa" và Test 6 "truy vết Chart -> Evidence -> AI" thuộc giai đoạn tích hợp RAG.)
 */
import test from "node:test";
import assert from "node:assert/strict";
import { dedupe, type Candidate, type SourceRef } from "./lib/blocks";
import { extractEntities, resolveSchool, type School } from "./lib/entities";
import { isAllowed, parseRobots } from "./lib/robots";
import { sha256 } from "./lib/text";
import { validateBlocks } from "./validate";

const PHU = "Tử Vi cư Ngọ, vô Hình Kỵ, Giáp Đinh Kỷ nhân vị chí công khanh.";

function candidate(text: string, sourceId: string, school: School = "UNKNOWN", concepts: string[] = []): Candidate {
  const entities = { ...extractEntities(text), concepts };
  const ref: SourceRef = {
    source_id: sourceId, url: `https://${sourceId}.example/bai-1`, canonical_url: null, title: "Bài", heading: [], paragraph: 0, order: 0,
    author: null, published_at: null, crawl_date: "2026-09-28T00:00:00.000Z", content_hash: sha256(text), rights: "excerpt-only",
    school, school_evidence: school === "UNKNOWN" ? null : "registry", method: null,
  };
  return { text, type: "PHU", entities, ref, reliability: 0.5 };
}

test("1. Một câu phú duy nhất -> 1 knowledge chuẩn", () => {
  const blocks = dedupe([candidate(PHU, "a", "CLASSICAL")]);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].source_refs.length, 1);
  assert.deepEqual(validateBlocks(blocks), []);
});

test("2. Cùng câu trên 5 website (khác dấu câu / hoa thường) -> 1 knowledge + 5 nguồn", () => {
  const variants = [PHU, PHU.toUpperCase(), PHU.replace(/,/g, ""), `  ${PHU}  `, PHU.replace(".", "!")];
  const blocks = dedupe(variants.map((text, i) => candidate(text, `site${i}`)));
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].source_refs.length, 5);
  assert.deepEqual(new Set(blocks[0].source_refs.map((r) => r.source_id)).size, 5);
});

test("3. Cùng câu, hai trường phái -> 2 knowledge, giữ school riêng", () => {
  const blocks = dedupe([candidate(PHU, "classic", "CLASSICAL"), candidate(PHU, "bacphai", "BAC_PHAI")]);
  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks.map((b) => b.school).sort(), ["BAC_PHAI", "CLASSICAL"]);
  assert.ok(blocks.every((b) => b.relations.some((r) => r.type === "SAME_TEXT_DIFFERENT_SCHOOL")));
});

test("5. Bắc phái + không xác định trùng nội dung -> BAC_PHAI, UNKNOWN không ghi đè", () => {
  for (const order of [["BAC_PHAI", "UNKNOWN"], ["UNKNOWN", "BAC_PHAI"]] as School[][]) {
    const blocks = dedupe(order.map((school, i) => candidate(PHU, `s${i}`, school)));
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].school, "BAC_PHAI");
    assert.equal(blocks[0].source_refs.length, 2);
  }
  // Chỉ có nguồn không rõ phái -> vẫn UNKNOWN (không suy đoán dù nội dung nói về Tứ Hóa)
  assert.equal(dedupe([candidate("Hóa Kỵ nhập cung Mệnh theo Tứ Hóa phái.", "x")])[0].school, "UNKNOWN");
});

test("School chỉ lấy từ lời nguồn tự khai (tiêu đề / đoạn mở đầu)", () => {
  assert.equal(resolveSchool("PER_PAGE", "Bắc Phái Phi Tinh Tứ Hóa", "Khác với Nam phái...").school, "BAC_PHAI");
  assert.equal(resolveSchool("PER_PAGE", "Sinh Niên Tứ Hóa", "Nam phái dùng...").school, "UNKNOWN");
  assert.equal(resolveSchool("PER_PAGE", "Tứ Hóa tổng quan", "Tứ Hóa là bốn biến hóa...").school, "UNKNOWN");
  assert.equal(resolveSchool("PER_PAGE", "So sánh Nam phái và Bắc phái", "").school, "UNKNOWN");
  assert.equal(resolveSchool("BAC_PHAI", "Bất kỳ", "").evidence, "registry");
});

test("Nhận diện thực thể: 'Thất Sát tại Tý' -> THAT_SAT, TY", () => {
  const e = extractEntities("Thất Sát tại Tý, cung Mệnh gặp Hóa Kỵ, Lộc tùy Kỵ tẩu.");
  assert.ok(e.stars.includes("THAT_SAT"));
  assert.ok(e.branches.includes("TY"));
  assert.ok(e.palaces.includes("MENH"));
  assert.ok(e.hoa.includes("KY"));
  assert.ok(e.concepts.includes("LOC_TUY_KY_TAU"));
  // "thân" (cơ thể) không phải chi Thân; "canh" thường không phải can Canh
  const noise = extractEntities("giữ gìn thân thể, ăn canh nóng");
  assert.deepEqual([noise.branches, noise.stems], [[], []]);
});

test("robots.txt: Disallow / Allow / Crawl-delay / nhóm riêng", () => {
  const robots = parseRobots("User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\nCrawl-delay: 20\n\nUser-agent: BadBot\nDisallow: /", "TuViPhongLamKB");
  assert.equal(robots.crawlDelaySec, 20);
  assert.equal(isAllowed(robots, "https://x.vn/wp-admin/options.php"), false);
  assert.equal(isAllowed(robots, "https://x.vn/wp-admin/admin-ajax.php"), true);
  assert.equal(isAllowed(robots, "https://x.vn/bai-viet"), true);
  const own = parseRobots("User-agent: TuViPhongLamKB\nDisallow: /\n\nUser-agent: *\nDisallow:", "TuViPhongLamKB/1.0");
  assert.equal(isAllowed(own, "https://x.vn/bai-viet"), false);
});

test("Validator bắt school không bằng chứng và trích quá dài", () => {
  const [block] = dedupe([candidate(PHU, "a", "CLASSICAL")]);
  assert.ok(validateBlocks([{ ...block, school_evidence: null }]).some((e) => e.includes("không có bằng chứng")));
  assert.ok(validateBlocks([{ ...block, content: { ...block.content, excerpt: "x".repeat(400) } }]).some((e) => e.includes("trích dài")));
});
