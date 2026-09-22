/**
 * Test Knowledge Service
 * Run: npx tsx scripts/test-knowledge-service.ts
 */

// Simulate the knowledge query logic
import fs from 'fs';
import path from 'path';

const KNOWLEDGE_DIR = './src/lib/tuvi/knowledge/cung';

type KnowledgeBlock = {
  block_id: string;
  condition_text: string;
  raw_text: string;
  conditions: {
    palace?: string;
    position?: string;
    heavenly_stem?: string;
    required_stars?: string[];
  };
  source: {
    book: string;
    author: string;
  };
};

type KnowledgeFile = {
  palace: string;
  palace_name?: string;
  sections?: Array<{
    section_id: string;
    title: string;
    blocks?: KnowledgeBlock[];
    interpretations?: any[];
  }>;
  blocks?: KnowledgeBlock[];
};

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "_")
    .trim();
}

function loadKnowledgeFile(filename: string): KnowledgeFile | null {
  const filepath = path.join(KNOWLEDGE_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function getAllBlocks(file: KnowledgeFile): KnowledgeBlock[] {
  const blocks: KnowledgeBlock[] = [];
  
  if (file.sections) {
    for (const section of file.sections) {
      const items = section.blocks || section.interpretations || [];
      blocks.push(...items);
    }
  }
  
  if (file.blocks) {
    blocks.push(...file.blocks);
  }
  
  return blocks;
}

function testKnowledgeQuery() {
  console.log('=== TEST KNOWLEDGE SERVICE ===\n');
  
  // Test loading menh-cohoc-full.json
  const menhFile = loadKnowledgeFile('menh-cohoc-full.json');
  if (!menhFile) {
    console.log('ERROR: Cannot load menh-cohoc-full.json');
    return;
  }
  
  console.log('Loaded menh-cohoc-full.json');
  console.log('Palace:', menhFile.palace);
  
  const blocks = getAllBlocks(menhFile);
  console.log('Total blocks:', blocks.length);
  
  // Count blocks with valid text
  const validBlocks = blocks.filter(b => b.raw_text && b.raw_text.length > 50);
  console.log('Blocks with valid text (>50 chars):', validBlocks.length);
  
  // Show sample blocks
  console.log('\n--- SAMPLE BLOCKS ---');
  for (let i = 0; i < Math.min(3, validBlocks.length); i++) {
    const block = validBlocks[i];
    console.log(`\n[${i + 1}] ${block.block_id}`);
    console.log('Condition:', block.condition_text?.substring(0, 80));
    console.log('Text:', block.raw_text?.substring(0, 150) + '...');
  }
  
  // Test other palace files
  console.log('\n\n--- OTHER PALACE FILES ---');
  const palaceFiles = [
    'quan-loc-cohoc-full.json',
    'tai-bach-cohoc-full.json',
    'phu-the-cohoc-full.json',
  ];
  
  for (const filename of palaceFiles) {
    const file = loadKnowledgeFile(filename);
    if (file) {
      const blocks = getAllBlocks(file);
      const valid = blocks.filter(b => b.raw_text && b.raw_text.length > 50);
      console.log(`${filename}: ${valid.length}/${blocks.length} valid blocks`);
    } else {
      console.log(`${filename}: NOT FOUND`);
    }
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

testKnowledgeQuery();
