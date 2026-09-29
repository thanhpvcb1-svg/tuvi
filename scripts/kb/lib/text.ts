/** Chuẩn hóa văn bản, băm nội dung, tách trang HTML thành các đoạn có ngữ cảnh (tiêu đề mục, thứ tự). */
import * as cheerio from "cheerio";

import { matchForm, normalizeText } from "./normalize";
export { kbKey, matchForm, normalizeText, sha256 } from "./normalize";

export const shinglesOf = (text: string, size = 3) => {
  const words = matchForm(text).split(" ").filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i + size <= words.length; i++) set.add(words.slice(i, i + size).join(" "));
  return set;
};

/** Tỉ lệ cụm từ của a nằm trong b. */
export const containment = (a: Set<string>, b: Set<string>) => {
  if (!a.size) return 0;
  let shared = 0;
  for (const x of a) if (b.has(x)) shared++;
  return shared / a.size;
};

export type PageBlock = { heading: string[]; paragraph: number; text: string };
export type ParsedPage = {
  title: string;
  author: string | null;
  publishedAt: string | null;
  canonicalUrl: string | null;
  lang: string | null;
  intro: string;
  blocks: PageBlock[];
};

// Đoạn rác của theme / quảng cáo / điều hướng.
const BOILERPLATE = /bài viết liên quan|xem thêm:|đăng ký|liên hệ (ngay|tư vấn)|hotline|zalo|facebook|chia sẻ bài|bình luận|copyright|©|mục lục|bấm vào|click|tải (về|xuống)/i;

/** Tách nội dung chính thành các đoạn: mỗi đoạn văn / mục danh sách là một đơn vị, kèm đường dẫn tiêu đề mục. */
export function parseHtmlPage(html: string, contentSelector: string): ParsedPage {
  const $ = cheerio.load(html);
  $("script, style, noscript, iframe, form, nav, header, footer, aside, .sharedaddy, .related, .yarpp-related, .comments, #comments, .breadcrumb, .toc, #toc_container, .ez-toc-container").remove();
  const meta = (sel: string) => $(sel).attr("content")?.trim() || null;
  const title = normalizeText($("h1").first().text() || meta('meta[property="og:title"]') || $("title").text());
  const author = meta('meta[name="author"]') || normalizeText($('[rel="author"], .author-name, .entry-author, .td-post-author-name a').first().text()) || null;
  const root = contentSelector.split(",").map((s) => $(s.trim()).first()).find((el) => el.length && el.text().trim().length > 200) ?? $("body");

  const blocks: PageBlock[] = [];
  const heading: string[] = [];
  let paragraph = 0;
  root.find("h2, h3, h4, p, li, blockquote").each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const node = $(el);
    if (tag === "li" && node.find("p").length) return; // đoạn <p> trong <li> được lấy riêng
    if ((tag === "p" || tag === "li") && node.parents("blockquote").length) return;
    const text = normalizeText(node.text());
    if (!text) return;
    if (/^h[234]$/.test(tag)) {
      const level = Number(tag[1]) - 2;
      heading.length = level;
      heading[level] = text;
      return;
    }
    if (text.length < 25 || BOILERPLATE.test(text)) return;
    blocks.push({ heading: heading.filter(Boolean), paragraph: paragraph++, text });
  });
  return {
    title,
    author: author ? normalizeText(author) : null,
    publishedAt: meta('meta[property="article:published_time"]'),
    canonicalUrl: $('link[rel="canonical"]').attr("href") || null,
    lang: $("html").attr("lang") || null,
    intro: blocks.slice(0, 2).map((b) => b.text).join(" ").slice(0, 600),
    blocks,
  };
}

/** Diễn đàn (phpBB): mỗi bài viết là một nhóm, tách đoạn theo dòng trống / <br>; tên người viết ghi vào tiêu đề nhóm. */
export function parseForumPage(html: string, postSelector: string): ParsedPage {
  const $ = cheerio.load(html);
  $("script, style, blockquote, .signature, .notice").remove();
  const blocks: PageBlock[] = [];
  let paragraph = 0;
  $(postSelector).each((index, el) => {
    const post = $(el);
    const author = normalizeText(post.closest(".post").find(".author strong, .author a.username, .username").first().text()) || `bài #${index + 1}`;
    post.find("br").replaceWith("\n");
    const lines = normalizeText(post.text()).split(/\n+/).map((l) => l.trim()).filter(Boolean);
    let buffer = "";
    const flush = () => {
      if (buffer.length >= 25 && !BOILERPLATE.test(buffer)) blocks.push({ heading: [`Bài của ${author}`], paragraph: paragraph++, text: buffer });
      buffer = "";
    };
    for (const line of lines) {
      buffer = buffer ? `${buffer} ${line}` : line;
      if (/[.!?…]$/.test(line) && buffer.length >= 120) flush();
    }
    flush();
  });
  return {
    title: normalizeText($("h2.topic-title, h1, title").first().text()),
    author: null,
    publishedAt: null,
    canonicalUrl: $('link[rel="canonical"]').attr("href") || null,
    lang: $("html").attr("lang") || null,
    intro: blocks.slice(0, 2).map((b) => b.text).join(" ").slice(0, 600),
    blocks,
  };
}

/** Đọc danh sách URL trong sitemap XML. */
export function sitemapUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
}
