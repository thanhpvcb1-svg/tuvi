/** Trang thô -> ứng viên knowledge block (dùng chung cho extract và map). */
import { classifyBlock, extractEntities, conceptsIn, resolveSchool } from "./entities";
import type { Candidate } from "./blocks";
import { matchForm, normalizeText, sha256 } from "./text";

export type RawPage = {
  source_id: string; url: string; canonical_url: string | null; fetched_at: string; title: string; author: string | null;
  published_at: string | null; intro: string; blocks: Array<{ heading: string[]; paragraph: number; text: string }>;
};

/** Đoạn lặp y hệt trên ≥ 3 trang của cùng một nguồn là khung trang (quảng cáo, giới thiệu, danh mục tài liệu). */
export function siteBoilerplate(pages: RawPage[]): Set<string> {
  const seen = new Map<string, Set<string>>();
  for (const page of pages) for (const block of page.blocks) {
    const key = matchForm(block.text);
    seen.set(key, (seen.get(key) ?? new Set()).add(page.url));
  }
  return new Set([...seen].filter(([, urls]) => urls.size >= 3).map(([key]) => key));
}

export function pageCandidates(
  page: RawPage,
  source: { school: string; rights: string; reliability: number },
  boilerplate: Set<string> = new Set(),
): { candidates: Candidate[]; noise: number } {
  page = { ...page, blocks: page.blocks.filter((b) => !boilerplate.has(matchForm(b.text))) };
  const { school, evidence, method } = resolveSchool(source.school, page.title, page.intro);
  // Gộp đoạn ngắn với đoạn kế tiếp cùng mục (một ý thường bị tách thành dòng dẫn + dòng giải thích).
  const merged: Array<{ heading: string[]; paragraph: number; text: string }> = [];
  for (const block of page.blocks) {
    const prev = merged[merged.length - 1];
    if (prev && prev.text.length < 80 && prev.heading.join("|") === block.heading.join("|")) prev.text = `${prev.text} ${block.text}`;
    else merged.push({ ...block });
  }
  const candidates: Candidate[] = [];
  let noise = 0;
  merged.forEach((block, order) => {
    const text = normalizeText(block.text);
    const entities = extractEntities(text);
    // Khái niệm nêu ở tiêu đề mục cũng thuộc về đoạn ("Tự Hóa hướng tâm" -> các đoạn giải thích bên dưới).
    entities.concepts = [...new Set([...conceptsIn(block.heading.join(" ")), ...entities.concepts])];
    const signal = entities.stars.length + entities.palaces.length + entities.hoa.length + entities.concepts.length;
    if (!signal) {
      noise++;
      return;
    }
    candidates.push({
      text,
      type: classifyBlock(entities),
      entities,
      reliability: source.reliability,
      ref: {
        source_id: page.source_id, url: page.url, canonical_url: page.canonical_url, title: page.title, heading: block.heading,
        paragraph: block.paragraph, order, author: page.author, published_at: page.published_at, crawl_date: page.fetched_at,
        content_hash: sha256(text), rights: source.rights, school, school_evidence: evidence, method,
      },
    });
  });
  return { candidates, noise };
}
