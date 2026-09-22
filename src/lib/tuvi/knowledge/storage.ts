/**
 * Storage for Knowledge Files
 * Save and load palace knowledge JSON files
 */

import * as fs from "fs";
import * as path from "path";
import type { Palace, PalaceKnowledge, Section } from "./types";
import { PALACE_FILE_NAMES } from "./constants";

const KNOWLEDGE_DIR = path.join(__dirname, "cung");
const UNCLASSIFIED_DIR = path.join(__dirname, "unclassified");

/**
 * Ensure directory exists
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Get file path for a palace
 */
export function getPalaceFilePath(palace: Palace): string {
  return path.join(KNOWLEDGE_DIR, PALACE_FILE_NAMES[palace]);
}

/**
 * Get file path for unclassified content
 */
export function getUnclassifiedFilePath(filename: string): string {
  return path.join(UNCLASSIFIED_DIR, filename);
}

/**
 * Load palace knowledge from file
 */
export function loadPalaceKnowledge(palace: Palace): PalaceKnowledge | null {
  const filePath = getPalaceFilePath(palace);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as PalaceKnowledge;
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return null;
  }
}

/**
 * Save palace knowledge to file
 */
export function savePalaceKnowledge(knowledge: PalaceKnowledge): void {
  ensureDir(KNOWLEDGE_DIR);

  const filePath = getPalaceFilePath(knowledge.palace);
  const content = JSON.stringify(knowledge, null, 2);

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Saved ${filePath}`);
}

/**
 * Merge new sections into existing palace knowledge
 * Avoids duplicates by checking block_id
 */
export function mergeSections(
  existing: PalaceKnowledge | null,
  newSections: Section[],
  palace: Palace
): PalaceKnowledge {
  if (!existing) {
    return {
      palace,
      sections: newSections,
    };
  }

  // Build set of existing block IDs
  const existingBlockIds = new Set<string>();
  for (const section of existing.sections) {
    for (const block of section.blocks) {
      existingBlockIds.add(block.block_id);
    }
  }

  // Build set of existing section IDs
  const existingSectionIds = new Set<string>();
  for (const section of existing.sections) {
    existingSectionIds.add(section.section_id);
  }

  // Process new sections
  for (const newSection of newSections) {
    if (existingSectionIds.has(newSection.section_id)) {
      // Section exists, merge blocks
      const existingSection = existing.sections.find(
        (s) => s.section_id === newSection.section_id
      );

      if (existingSection) {
        for (const block of newSection.blocks) {
          if (!existingBlockIds.has(block.block_id)) {
            existingSection.blocks.push(block);
            existingBlockIds.add(block.block_id);
          }
        }
      }
    } else {
      // New section, filter out duplicate blocks
      const filteredBlocks = newSection.blocks.filter(
        (b) => !existingBlockIds.has(b.block_id)
      );

      if (filteredBlocks.length > 0) {
        existing.sections.push({
          ...newSection,
          blocks: filteredBlocks,
        });
        existingSectionIds.add(newSection.section_id);

        for (const block of filteredBlocks) {
          existingBlockIds.add(block.block_id);
        }
      }
    }
  }

  return existing;
}

/**
 * Save sections to appropriate palace files
 */
export function saveSections(sections: Section[]): void {
  // Group sections by palace
  const byPalace = new Map<Palace | null, Section[]>();

  for (const section of sections) {
    const palace = section.context.palace;
    if (!byPalace.has(palace)) {
      byPalace.set(palace, []);
    }
    byPalace.get(palace)!.push(section);
  }

  // Save each palace file
  for (const [palace, palaceSections] of byPalace) {
    if (palace) {
      const existing = loadPalaceKnowledge(palace);
      const merged = mergeSections(existing, palaceSections, palace);
      savePalaceKnowledge(merged);
    } else {
      // Save to unclassified
      saveUnclassified(palaceSections);
    }
  }
}

/**
 * Save unclassified sections
 */
function saveUnclassified(sections: Section[]): void {
  ensureDir(UNCLASSIFIED_DIR);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(UNCLASSIFIED_DIR, `unclassified_${timestamp}.json`);

  const content = JSON.stringify({ sections }, null, 2);
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Saved unclassified sections to ${filePath}`);
}

/**
 * Get statistics for a palace file
 */
export function getPalaceStats(palace: Palace): {
  sectionCount: number;
  blockCount: number;
  sources: string[];
} | null {
  const knowledge = loadPalaceKnowledge(palace);
  if (!knowledge) return null;

  const sources = new Set<string>();
  let blockCount = 0;

  for (const section of knowledge.sections) {
    blockCount += section.blocks.length;
    sources.add(section.source.book);
  }

  return {
    sectionCount: knowledge.sections.length,
    blockCount,
    sources: Array.from(sources),
  };
}

/**
 * List all palace files
 */
export function listPalaceFiles(): { palace: Palace; exists: boolean }[] {
  return Object.entries(PALACE_FILE_NAMES).map(([palace, filename]) => ({
    palace: palace as Palace,
    exists: fs.existsSync(path.join(KNOWLEDGE_DIR, filename)),
  }));
}
