/**
 * Utility functions for Knowledge Crawler
 */

import { createHash } from "crypto";

/**
 * Normalize Vietnamese text for comparison
 * Removes diacritics and converts to lowercase
 */
export function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim();
}

/**
 * Generate deterministic block ID from content
 * Same source + same content = same ID
 */
export function generateBlockId(
  sourceUrl: string,
  palace: string | null,
  sectionTitle: string,
  rawText: string
): string {
  const input = [
    sourceUrl,
    palace || "UNKNOWN",
    sectionTitle,
    rawText,
  ].join("|");

  const hash = createHash("sha256").update(input, "utf8").digest("hex");
  return hash.substring(0, 16);
}

/**
 * Generate section ID
 */
export function generateSectionId(
  palace: string | null,
  sectionTitle: string,
  sourceUrl: string
): string {
  const input = [palace || "UNKNOWN", sectionTitle, sourceUrl].join("|");
  const hash = createHash("sha256").update(input, "utf8").digest("hex");
  return `${palace || "UNKNOWN"}_${hash.substring(0, 12)}`;
}

/**
 * Clean HTML entities and extra whitespace
 */
export function cleanText(text: string): string {
  return text
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
 * Check if text starts with a gender indicator
 */
export function startsWithGender(text: string): "MALE" | "FEMALE" | null {
  const normalized = normalizeVietnamese(text);
  if (normalized.startsWith("nam ") || normalized.startsWith("nam,")) {
    return "MALE";
  }
  if (normalized.startsWith("nu ") || normalized.startsWith("nu,")) {
    return "FEMALE";
  }
  return null;
}

/**
 * Check if text contains a keyword
 */
export function containsKeyword(text: string, keywords: string[]): boolean {
  const normalized = normalizeVietnamese(text);
  return keywords.some((kw) => normalized.includes(normalizeVietnamese(kw)));
}

/**
 * Extract all matches of a pattern from text
 */
export function extractMatches<T>(
  text: string,
  patterns: Record<string, T>
): T[] {
  const normalized = normalizeVietnamese(text);
  const results: T[] = [];
  const seen = new Set<T>();

  for (const [pattern, value] of Object.entries(patterns)) {
    if (normalized.includes(normalizeVietnamese(pattern)) && !seen.has(value)) {
      results.push(value);
      seen.add(value);
    }
  }

  return results;
}

/**
 * Find first match of a pattern in text
 */
export function findFirstMatch<T>(
  text: string,
  patterns: Record<string, T>
): T | null {
  const normalized = normalizeVietnamese(text);

  // Sort by pattern length descending to match longer patterns first
  const sortedPatterns = Object.entries(patterns).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [pattern, value] of sortedPatterns) {
    if (normalized.includes(normalizeVietnamese(pattern))) {
      return value;
    }
  }

  return null;
}

/**
 * Split text into sentences
 */
export function splitSentences(text: string): string[] {
  // Split by period, but not if followed by number (e.g., "1.5")
  return text
    .split(/\.(?!\d)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Check if a sentence is a continuation of previous
 * (starts with lowercase or conjunction)
 */
export function isContinuation(sentence: string): boolean {
  const trimmed = sentence.trim();
  if (!trimmed) return false;

  // Check if starts with lowercase
  const firstChar = trimmed[0];
  if (firstChar === firstChar.toLowerCase() && /[a-zàáảãạ]/.test(firstChar)) {
    return true;
  }

  // Check if starts with conjunction
  const continuationStarters = [
    "và",
    "hoặc",
    "nhưng",
    "nếu",
    "thì",
    "mà",
    "cũng",
    "lại",
    "còn",
    "duy",
    "chỉ",
  ];

  const normalized = normalizeVietnamese(trimmed);
  return continuationStarters.some((starter) =>
    normalized.startsWith(normalizeVietnamese(starter) + " ")
  );
}

/**
 * Check if text is a source citation
 */
export function isSourceCitation(text: string): boolean {
  const trimmed = text.trim();
  // Source usually wrapped in * or starts with specific patterns
  if (trimmed.startsWith("*") && trimmed.endsWith("*")) return true;
  if (trimmed.startsWith("Theo ")) return true;
  if (trimmed.includes(" - ") && trimmed.includes("biên dịch")) return true;
  return false;
}

/**
 * Parse source citation text
 */
export function parseSourceCitation(text: string): {
  book: string;
  author: string;
  translator: string | null;
} | null {
  // Remove asterisks
  let cleaned = text.replace(/^\*|\*$/g, "").trim();

  // Remove "Theo " prefix
  if (cleaned.startsWith("Theo ")) {
    cleaned = cleaned.substring(5);
  }

  // Split by " - "
  const parts = cleaned.split(" - ").map((p) => p.trim());

  if (parts.length === 0) return null;

  const result = {
    book: parts[0],
    author: parts[1] || "Unknown",
    translator: null as string | null,
  };

  // Check for translator in last part
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes("biên dịch")) {
      result.translator = lastPart.replace("biên dịch", "").trim();
      // If only 2 parts (book - translator biên dịch), author is unknown
      if (parts.length === 2) {
        result.author = "Unknown";
      } else {
        // 3+ parts: book - author - translator biên dịch
        result.author = parts[1];
      }
    }
  }

  return result;
}
