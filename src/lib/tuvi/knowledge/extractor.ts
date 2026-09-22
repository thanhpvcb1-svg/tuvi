/**
 * Condition Extractor for Knowledge Crawler
 * Extract palace, position, stars, gender, transformations from text
 */

import type {
  Palace,
  EarthlyBranch,
  HeavenlyStem,
  Gender,
  Transformation,
  BlockConditions,
  SectionContext,
} from "./types";
import { createEmptyConditions, createEmptyContext } from "./types";
import {
  PALACE_PATTERNS,
  BRANCH_PATTERNS,
  STEM_PATTERNS,
  STAR_PATTERNS,
  TRANSFORMATION_PATTERNS,
  GENDER_PATTERNS,
  MEETING_KEYWORDS,
  SAME_PALACE_KEYWORDS,
  OPPOSITE_KEYWORDS,
  TRINE_KEYWORDS,
  EXCLUDED_KEYWORDS,
  SAT_KY_KEYWORDS,
  CAT_TINH_KEYWORDS,
} from "./constants";
import {
  normalizeVietnamese,
  findFirstMatch,
  extractMatches,
  containsKeyword,
  startsWithGender,
} from "./utils";

/**
 * Extract section context from title
 * Example: "Cung Phu thê an tại Thân có Thiên mã"
 */
export function extractSectionContext(title: string): SectionContext {
  const context = createEmptyContext();
  const normalized = normalizeVietnamese(title);

  // Extract palace
  // Pattern: "Cung X" or "cung X"
  const palaceMatch = title.match(/[Cc]ung\s+([^\s]+(?:\s+[^\s]+)?)/);
  if (palaceMatch) {
    const palaceName = palaceMatch[1].toLowerCase();
    context.palace = findFirstMatch(palaceName, PALACE_PATTERNS);
  }

  // Extract position (earthly branch)
  // Pattern: "an tại X" or "tại X"
  const positionMatch = title.match(/(?:an\s+)?tại\s+(\S+)/i);
  if (positionMatch) {
    const branchName = positionMatch[1].toLowerCase();
    context.position = findFirstMatch(branchName, BRANCH_PATTERNS);
  }

  // Extract heavenly stem
  // Pattern: "thiên can là X" or "can X"
  const stemMatch = title.match(/(?:thiên\s+)?can\s+(?:là\s+)?(\S+)/i);
  if (stemMatch) {
    const stemName = stemMatch[1].toLowerCase();
    context.heavenly_stem = findFirstMatch(stemName, STEM_PATTERNS);
  }

  // Extract required stars
  // Pattern: "có X" or "có X Y"
  const starMatch = title.match(/có\s+(.+?)(?:\s*$|\s+(?:hội|gặp|đồng))/i);
  if (starMatch) {
    const starText = starMatch[1];
    context.required_stars = extractMatches(starText, STAR_PATTERNS);
  } else {
    // Try to find stars anywhere in title after "có"
    const afterCo = title.split(/có\s+/i)[1];
    if (afterCo) {
      context.required_stars = extractMatches(afterCo, STAR_PATTERNS);
    }
  }

  // Extract transformation
  // Pattern: "phi hóa X" or "hóa X"
  const transMatch = title.match(/(?:phi\s+)?hóa\s+(\S+)/i);
  if (transMatch) {
    const transName = transMatch[1].toLowerCase();
    context.transformation = findFirstMatch(transName, TRANSFORMATION_PATTERNS);
  }

  // Extract target palace for transformation
  // Pattern: "tới cung X" or "đến cung X"
  const targetMatch = title.match(/(?:tới|đến)\s+cung\s+(\S+(?:\s+\S+)?)/i);
  if (targetMatch) {
    const targetName = targetMatch[1].toLowerCase();
    context.target_palace = findFirstMatch(targetName, PALACE_PATTERNS);
  }

  return context;
}

/**
 * Extract conditions from a knowledge block text
 * Inherits from section context and adds block-specific conditions
 */
export function extractBlockConditions(
  text: string,
  sectionContext: SectionContext
): BlockConditions {
  const conditions = createEmptyConditions();

  // Inherit from section context
  conditions.palace = sectionContext.palace;
  conditions.position = sectionContext.position;
  conditions.heavenly_stem = sectionContext.heavenly_stem;
  conditions.required_stars = [...sectionContext.required_stars];

  if (sectionContext.transformation) {
    conditions.transformations.push(sectionContext.transformation);
  }
  if (sectionContext.target_palace) {
    conditions.transformation_target.push(sectionContext.target_palace);
  }

  // Extract gender from text
  const gender = startsWithGender(text);
  if (gender) {
    conditions.gender = gender;
  } else {
    // Check for gender keywords in text
    const genderMatch = findFirstMatch(text, GENDER_PATTERNS);
    if (genderMatch) {
      conditions.gender = genderMatch;
    }
  }

  // Extract meeting stars (hội, gặp, kiến)
  if (containsKeyword(text, MEETING_KEYWORDS)) {
    const meetingStars = extractMeetingStars(text);
    conditions.meeting_stars.push(...meetingStars);
  }

  // Extract same palace stars (đồng cung, đồng độ)
  if (containsKeyword(text, SAME_PALACE_KEYWORDS)) {
    const samePalaceStars = extractSamePalaceStars(text);
    conditions.same_palace_stars.push(...samePalaceStars);
  }

  // Extract opposite stars (đối cung)
  if (containsKeyword(text, OPPOSITE_KEYWORDS)) {
    const oppositeStars = extractOppositeStars(text);
    conditions.opposite_stars.push(...oppositeStars);
  }

  // Extract trine stars (tam hợp)
  if (containsKeyword(text, TRINE_KEYWORDS)) {
    const trineStars = extractTrineStars(text);
    conditions.trine_stars.push(...trineStars);
  }

  // Extract excluded stars (không có, vô)
  if (containsKeyword(text, EXCLUDED_KEYWORDS)) {
    const excludedStars = extractExcludedStars(text);
    conditions.excluded_stars.push(...excludedStars);
  }

  // Extract additional conditions
  if (containsKeyword(text, SAT_KY_KEYWORDS)) {
    conditions.additional_conditions.push("SAT_KY");
  }
  if (containsKeyword(text, CAT_TINH_KEYWORDS)) {
    conditions.additional_conditions.push("CAT_TINH");
  }

  // Extract transformations mentioned in text
  const textTransformations = extractTransformations(text);
  for (const trans of textTransformations) {
    if (!conditions.transformations.includes(trans)) {
      conditions.transformations.push(trans);
    }
  }

  return conditions;
}

/**
 * Extract stars after meeting keywords
 */
function extractMeetingStars(text: string): string[] {
  const results: string[] = [];

  // Find text after meeting keywords
  for (const keyword of MEETING_KEYWORDS) {
    const regex = new RegExp(`${keyword}\\s+([^,\\.]+)`, "gi");
    const matches = text.matchAll(regex);

    for (const match of matches) {
      const starText = match[1];
      const stars = extractMatches(starText, STAR_PATTERNS);
      results.push(...stars);
    }
  }

  return [...new Set(results)];
}

/**
 * Extract stars in same palace
 */
function extractSamePalaceStars(text: string): string[] {
  const results: string[] = [];

  for (const keyword of SAME_PALACE_KEYWORDS) {
    const regex = new RegExp(`([^,\\.]+)\\s+${keyword}`, "gi");
    const matches = text.matchAll(regex);

    for (const match of matches) {
      const starText = match[1];
      const stars = extractMatches(starText, STAR_PATTERNS);
      results.push(...stars);
    }
  }

  return [...new Set(results)];
}

/**
 * Extract stars in opposite palace
 */
function extractOppositeStars(text: string): string[] {
  const results: string[] = [];

  for (const keyword of OPPOSITE_KEYWORDS) {
    const regex = new RegExp(`${keyword}\\s+(?:có\\s+)?([^,\\.]+)`, "gi");
    const matches = text.matchAll(regex);

    for (const match of matches) {
      const starText = match[1];
      const stars = extractMatches(starText, STAR_PATTERNS);
      results.push(...stars);
    }
  }

  return [...new Set(results)];
}

/**
 * Extract stars in trine
 */
function extractTrineStars(text: string): string[] {
  const results: string[] = [];

  for (const keyword of TRINE_KEYWORDS) {
    const regex = new RegExp(`${keyword}\\s+(?:có\\s+)?([^,\\.]+)`, "gi");
    const matches = text.matchAll(regex);

    for (const match of matches) {
      const starText = match[1];
      const stars = extractMatches(starText, STAR_PATTERNS);
      results.push(...stars);
    }
  }

  return [...new Set(results)];
}

/**
 * Extract excluded stars
 */
function extractExcludedStars(text: string): string[] {
  const results: string[] = [];

  for (const keyword of EXCLUDED_KEYWORDS) {
    const regex = new RegExp(`${keyword}\\s+([^,\\.]+)`, "gi");
    const matches = text.matchAll(regex);

    for (const match of matches) {
      const starText = match[1];
      const stars = extractMatches(starText, STAR_PATTERNS);
      results.push(...stars);
    }
  }

  return [...new Set(results)];
}

/**
 * Extract transformations from text
 */
function extractTransformations(text: string): Transformation[] {
  const results: Transformation[] = [];
  const normalized = normalizeVietnamese(text);

  // Look for "Hóa X" patterns
  const regex = /hoa\s+(loc|quyen|khoa|ky|ki)/gi;
  const matches = normalized.matchAll(regex);

  for (const match of matches) {
    const trans = findFirstMatch(match[1], TRANSFORMATION_PATTERNS);
    if (trans && !results.includes(trans)) {
      results.push(trans);
    }
  }

  return results;
}

/**
 * Detect palace from URL or content
 */
export function detectPalaceFromUrl(url: string): Palace | null {
  const normalized = normalizeVietnamese(url);

  for (const [pattern, palace] of Object.entries(PALACE_PATTERNS)) {
    const normalizedPattern = normalizeVietnamese(pattern).replace(/\s+/g, "-");
    if (normalized.includes(normalizedPattern)) {
      return palace;
    }
  }

  return null;
}

/**
 * Detect palace from content
 */
export function detectPalaceFromContent(content: string): Palace | null {
  // Look for "Cung X" pattern at the beginning
  const match = content.match(/^[Cc]ung\s+([^\s]+(?:\s+[^\s]+)?)/);
  if (match) {
    return findFirstMatch(match[1], PALACE_PATTERNS);
  }

  return null;
}
