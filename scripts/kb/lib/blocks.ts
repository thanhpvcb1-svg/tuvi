/**
 * Knowledge block (mỗi đoạn luận có nghĩa độc lập là một block), khử trùng 3 lớp và điểm chất lượng.
 *
 * Khử trùng: content_hash (nguyên văn) -> normalized_hash (bỏ dấu câu / hoa thường) -> gần trùng (≥ 90% cụm 3 từ của
 * đoạn ngắn nằm trong đoạn dài, cùng tập khái niệm). Cùng nội dung -> 1 block chuẩn + nhiều source_refs, không mất
 * provenance. Cùng nội dung nhưng nguồn KHAI trường phái khác nhau (vd CLASSICAL vs BAC_PHAI) -> giữ riêng, nối quan
 * hệ SAME_TEXT_DIFFERENT_SCHOOL. UNKNOWN không bao giờ ghi đè trường phái đã có bằng chứng.
 */
import { conceptsIn, type Entities, type KnowledgeType, type School } from "./entities";
import { containment, matchForm, normalizeText, sha256, shinglesOf } from "./text";

export type SourceRef = {
  source_id: string;
  url: string;
  canonical_url: string | null;
  title: string;
  heading: string[];
  paragraph: number;
  order: number;
  author: string | null;
  published_at: string | null;
  crawl_date: string;
  content_hash: string;
  rights: string;
  school: School;
  school_evidence: string | null;
  method: string | null;
};

export type Relation = { type: "SAME_TEXT_DIFFERENT_SCHOOL" | "ALTERNATIVE_DEFINITION" | "CONFLICTING_INTERPRETATION"; target: string; note?: string };

export type KnowledgeBlock = {
  id: string;
  type: KnowledgeType;
  school: School;
  school_evidence: string | null;
  method: string | null;
  content: { excerpt: string; chars: number; lang: string };
  concepts: string[];
  entities: Omit<Entities, "concepts">;
  source_refs: SourceRef[];
  hashes: { content: string; normalized: string };
  relations: Relation[];
  quality: {
    source_reliability: number;
    completeness: number;
    entity_confidence: number;
    school_confidence: number;
    duplicate_confidence: number;
    provenance_completeness: number;
    score: number;
  };
  status: "ACTIVE" | "REVIEW";
};

/** Ứng viên trước khử trùng: giữ nguyên văn trong bộ nhớ (không ghi ra kho khi nguồn chỉ cho trích ngắn). */
export type Candidate = { text: string; type: KnowledgeType; entities: Entities; ref: SourceRef; reliability: number };

export const EXCERPT_LIMIT = 280;
/** Trích ngắn: câu đầu (hoặc vài câu đầu) trong giới hạn ký tự, cắt ở ranh giới câu. */
export function excerptOf(text: string, limit = EXCERPT_LIMIT): string {
  const clean = normalizeText(text).replace(/\n+/g, " ");
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "), cut.lastIndexOf("? "));
  return (end > limit * 0.4 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "")) + " …";
}

const NEAR_DUP = 0.9;
const schoolConfidence = (ref: SourceRef) => (ref.school === "UNKNOWN" ? 0 : ref.school_evidence === "registry" ? 1 : 0.8);

function quality(c: Candidate, dupConfidence: number) {
  const len = c.text.length;
  const completeness = len >= 80 && len <= 2500 && /[.!?…:;"”)]$/.test(c.text.trim()) ? 1 : len >= 40 ? 0.6 : 0.3;
  const prov = [c.ref.url, c.ref.title, c.ref.author, c.ref.published_at, c.ref.heading.length ? "h" : null].filter(Boolean).length / 5;
  const q = {
    source_reliability: c.reliability,
    completeness,
    entity_confidence: c.entities.confidence,
    school_confidence: schoolConfidence(c.ref),
    duplicate_confidence: dupConfidence,
    provenance_completeness: Number(prov.toFixed(2)),
    score: 0,
  };
  // Điểm chỉ dùng xếp hạng / ưu tiên duyệt - không biến nguồn thành "chân lý".
  q.score = Number((0.3 * q.source_reliability + 0.15 * q.completeness + 0.2 * q.entity_confidence + 0.15 * q.school_confidence + 0.1 * q.duplicate_confidence + 0.1 * q.provenance_completeness).toFixed(3));
  return q;
}

const idOf = (normalizedHash: string, school: School) => `kb_${sha256(`${normalizedHash}|${school}`).slice(0, 12)}`;

/** Chọn trường phái của block chuẩn từ các nguồn: chỉ nhận trường phái có bằng chứng, UNKNOWN không ghi đè. */
function canonicalSchool(refs: SourceRef[]): { school: School; evidence: string | null; method: string | null } {
  const known = refs.filter((r) => r.school !== "UNKNOWN");
  if (!known.length) return { school: "UNKNOWN", evidence: null, method: refs.find((r) => r.method)?.method ?? null };
  const best = known.sort((a, b) => schoolConfidence(b) - schoolConfidence(a))[0];
  return { school: best.school, evidence: `${best.source_id}: ${best.school_evidence}`, method: best.method };
}

export function dedupe(candidates: Candidate[]): KnowledgeBlock[] {
  // Nhóm theo trường phái đã khai (khác phái thì không gộp); UNKNOWN được gộp vào nhóm có bằng chứng nếu trùng nội dung.
  type Group = { members: Candidate[]; dup: number[]; normalized: string; shingles: Set<string>; concepts: string; school: School };
  const groups: Group[] = [];
  const byNormalized = new Map<string, Group[]>();
  const conceptKey = (c: Candidate) => [...c.entities.concepts].sort().join("|");

  const sorted = [...candidates].sort((a, b) => b.text.length - a.text.length); // đoạn dài nhất làm bản chuẩn
  for (const c of sorted) {
    const normalized = sha256(matchForm(c.text));
    const shingles = shinglesOf(c.text);
    const compatible = (g: Group) => g.school === c.ref.school || c.ref.school === "UNKNOWN" || g.school === "UNKNOWN";
    let target = (byNormalized.get(normalized) ?? []).find(compatible);
    let dupConfidence = 1;
    if (!target && shingles.size >= 5) {
      target = groups.find((g) => compatible(g) && g.concepts === conceptKey(c) && containment(shingles, g.shingles) >= NEAR_DUP);
      if (target) dupConfidence = Number(containment(shingles, target.shingles).toFixed(2));
    }
    if (target) {
      target.members.push(c);
      target.dup.push(dupConfidence);
      if (target.school === "UNKNOWN" && c.ref.school !== "UNKNOWN") target.school = c.ref.school; // bằng chứng mới thắng UNKNOWN
      continue;
    }
    const group: Group = { members: [c], dup: [], normalized, shingles, concepts: conceptKey(c), school: c.ref.school };
    groups.push(group);
    byNormalized.set(normalized, [...(byNormalized.get(normalized) ?? []), group]);
  }

  const blocks = groups.map((g) => {
    const lead = g.members[0];
    const refs = g.members.map((m) => m.ref);
    const { school, evidence, method } = canonicalSchool(refs);
    const block: KnowledgeBlock = {
      id: idOf(g.normalized, school),
      type: lead.type,
      school,
      school_evidence: evidence,
      method,
      content: { excerpt: excerptOf(lead.text), chars: lead.text.length, lang: "vi" },
      concepts: lead.entities.concepts,
      entities: (({ concepts: _c, ...rest }) => rest)(lead.entities),
      source_refs: refs,
      hashes: { content: sha256(normalizeText(lead.text)), normalized: g.normalized },
      relations: [],
      quality: quality(lead, Math.min(1, ...g.dup)),
      status: lead.entities.confidence < 0.5 ? "REVIEW" : "ACTIVE",
    };
    return { block, group: g };
  });

  // Quan hệ 1: cùng nguyên văn nhưng nguồn khai khác trường phái.
  for (const a of blocks) {
    for (const b of blocks) {
      if (a !== b && a.group.normalized === b.group.normalized && a.block.school !== b.block.school) a.block.relations.push({ type: "SAME_TEXT_DIFFERENT_SCHOOL", target: b.block.id });
    }
  }
  // Quan hệ 2: cùng một khái niệm được các NGUỒN KHÁC NHAU định nghĩa bằng lời khác nhau - chỉ là ứng viên (máy không kết
  // luận được là mâu thuẫn), đưa vào hàng đợi duyệt. Mỗi nguồn lấy một đoạn định nghĩa đầu tiên cho mỗi khái niệm.
  const definitions = new Map<string, Map<string, (typeof blocks)[number]>>();
  for (const x of blocks) {
    const concept = definedConcept(x.block, x.group.members[0].text);
    if (!concept) continue;
    const bySource = definitions.get(concept) ?? new Map();
    const source = x.block.source_refs[0].source_id;
    if (!bySource.has(source)) bySource.set(source, x);
    definitions.set(concept, bySource);
  }
  for (const [concept, bySource] of definitions) {
    const list = [...bySource.values()];
    for (const a of list) {
      for (const b of list) {
        if (a === b || containment(a.group.shingles, b.group.shingles) >= 0.3) continue;
        a.block.relations.push({ type: "ALTERNATIVE_DEFINITION", target: b.block.id, note: `${concept}: định nghĩa khác cách diễn đạt - cần duyệt xem có mâu thuẫn không` });
        a.block.status = "REVIEW";
      }
    }
  }
  return blocks.map((x) => x.block);
}

/** Đoạn định nghĩa khái niệm: tên khái niệm đứng đầu đoạn và có "là / nghĩa là / được hiểu" ngay sau đó. */
function definedConcept(block: KnowledgeBlock, text: string): string | null {
  if (block.concepts.length !== 1) return null;
  const head = matchForm(text).slice(0, 160);
  const named = conceptsIn(head.slice(0, 80));
  return named.includes(block.concepts[0]) && / là | nghĩa là | được hiểu /.test(` ${head} `) ? block.concepts[0] : null;
}
