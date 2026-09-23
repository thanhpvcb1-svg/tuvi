/**
 * HTML Parser for Knowledge Crawler
 * Parse HTML content into sections and knowledge blocks
 */

import type {
  Section,
  KnowledgeBlock,
  Source,
  SectionContext,
  Palace,
} from "./types";
import { createEmptyContext } from "./types";
import {
  extractSectionContext,
  extractBlockConditions,
  detectPalaceFromContent,
} from "./extractor";
import {
  generateBlockId,
  generateSectionId,
  cleanText,
  isSourceCitation,
  parseSourceCitation,
  isContinuation,
} from "./utils";

interface ParsedContent {
  title: string;
  paragraphs: string[];
  source: Source | null;
}

interface RawSection {
  title: string;
  content: string;
  source: Source | null;
}

/**
 * Parse HTML content and extract sections
 */
export function parseHtml(html: string, sourceUrl: string): RawSection[] {
  const sections: RawSection[] = [];

  // Remove script and style tags
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Find all h4 headings (section titles)
  // Pattern: #### or <h4>
  const sectionRegex =
    /(?:####\s*|<h4[^>]*>)(.*?)(?:\n|<\/h4>)([\s\S]*?)(?=(?:####|<h4)|$)/gi;

  let match;
  while ((match = sectionRegex.exec(cleaned)) !== null) {
    const title = cleanText(stripHtml(match[1]));
    const content = match[2];

    if (!title) continue;

    // Parse content and extract source
    const parsed = parseContent(content);

    sections.push({
      title,
      content: parsed.paragraphs.join("\n\n"),
      source: parsed.source || {
        book: "Unknown",
        author: "Unknown",
        translator: null,
        url: sourceUrl,
      },
    });
  }

  // If no h4 sections found, try to parse as single section
  if (sections.length === 0) {
    const parsed = parseContent(cleaned);
    if (parsed.paragraphs.length > 0) {
      sections.push({
        title: parsed.title || "Untitled",
        content: parsed.paragraphs.join("\n\n"),
        source: parsed.source || {
          book: "Unknown",
          author: "Unknown",
          translator: null,
          url: sourceUrl,
        },
      });
    }
  }

  return sections;
}

/**
 * Parse content to extract paragraphs and source
 */
function parseContent(content: string): ParsedContent {
  const paragraphs: string[] = [];
  let source: Source | null = null;
  let title = "";

  // Split by paragraph tags or double newlines
  const parts = content
    .split(/(?:<\/p>|<br\s*\/?>|\n\n|\n(?=\d+\.))/i)
    .map((p) => cleanText(stripHtml(p)))
    .filter((p) => p.length > 0);

  for (const part of parts) {
    // Check if this is a source citation
    if (isSourceCitation(part)) {
      const parsed = parseSourceCitation(part);
      if (parsed) {
        source = {
          ...parsed,
          url: "",
        };
      }
      continue;
    }

    // First non-source paragraph might be title
    if (!title && paragraphs.length === 0 && part.length < 100) {
      // Check if it looks like a title (starts with "Cung")
      if (part.match(/^[Cc]ung\s+/)) {
        title = part;
        continue;
      }
    }

    paragraphs.push(part);
  }

  return { title, paragraphs, source };
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Split section content into knowledge blocks
 * Each block is an independent论点 that can be queried separately
 */
export function splitIntoBlocks(content: string): string[] {
  const blocks: string[] = [];
  const lines = content.split(/\n+/).map((l) => l.trim()).filter((l) => l);

  let currentBlock: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line) continue;

    // Skip source citations
    if (isSourceCitation(line)) continue;

    // Check if this line starts a new block
    const isNewBlock = shouldStartNewBlock(line, currentBlock);

    if (isNewBlock && currentBlock.length > 0) {
      // Save current block
      blocks.push(currentBlock.join(" "));
      currentBlock = [];
    }

    currentBlock.push(line);
  }

  // Don't forget the last block
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join(" "));
  }

  return blocks;
}

/**
 * Determine if a line should start a new block
 */
function shouldStartNewBlock(line: string, currentBlock: string[]): boolean {
  // First line always starts a block
  if (currentBlock.length === 0) return true;

  // If line is a continuation, don't start new block
  if (isContinuation(line)) return false;

  // Check for numbered list (1., 2., etc.)
  if (line.match(/^\d+\.\s/)) return true;

  // Check for bullet points
  if (line.match(/^[-•]\s/)) return true;

  // Check for gender-specific statements (Nam..., Nữ...)
  if (line.match(/^(Nam|Nữ)\s+(mệnh|chủ|nhân)/i)) return true;

  // Check for conditional statements starting with "Hội", "Gặp", "Kiến"
  if (line.match(/^(Hội|Gặp|Kiến|Ngộ)\s+/i)) return true;

  // Check for "Nếu" (if) statements
  if (line.match(/^Nếu\s+/i)) return true;

  // Check if previous block is complete (ends with period and is substantial)
  const lastLine = currentBlock[currentBlock.length - 1];
  if (lastLine.endsWith(".") && currentBlock.join(" ").length > 50) {
    // New sentence that doesn't continue previous thought
    if (!isContinuation(line)) return true;
  }

  return false;
}

/**
 * Convert raw sections to structured sections with blocks
 */
export function processRawSections(
  rawSections: RawSection[],
  sourceUrl: string,
  defaultPalace: Palace | null = null
): Section[] {
  const sections: Section[] = [];

  for (const raw of rawSections) {
    // Extract context from title
    const context = extractSectionContext(raw.title);

    // Use default palace if not detected
    if (!context.palace && defaultPalace) {
      context.palace = defaultPalace;
    }

    // Try to detect palace from content if still not found
    if (!context.palace) {
      context.palace = detectPalaceFromContent(raw.content);
    }

    // Generate section ID
    const sectionId = generateSectionId(
      context.palace,
      raw.title,
      sourceUrl
    );

    // Split content into blocks
    const blockTexts = splitIntoBlocks(raw.content);

    // Create knowledge blocks
    const blocks: KnowledgeBlock[] = blockTexts.map((text) => {
      const blockId = generateBlockId(
        sourceUrl,
        context.palace,
        raw.title,
        text
      );

      const conditions = extractBlockConditions(text, context);

      return {
        block_id: blockId,
        raw_text: text,
        conditions,
      };
    });

    // Create section
    const section: Section = {
      section_id: sectionId,
      title: raw.title,
      context,
      source: {
        ...raw.source!,
        url: sourceUrl,
      },
      blocks,
    };

    sections.push(section);
  }

  return sections;
}

/**
 * Main parse function
 */
export function parse(
  html: string,
  sourceUrl: string,
  defaultPalace: Palace | null = null
): Section[] {
  const rawSections = parseHtml(html, sourceUrl);
  return processRawSections(rawSections, sourceUrl, defaultPalace);
}
