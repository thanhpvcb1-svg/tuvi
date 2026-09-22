#!/usr/bin/env node
/**
 * Import dữ liệu crawl từ cohoc.net vào project knowledge base
 * 
 * Usage: 
 *   node import-cohoc-to-knowledge.mjs <chart_id>              # Import tất cả
 *   node import-cohoc-to-knowledge.mjs <chart_id> --incremental # Import từng phần
 *   node import-cohoc-to-knowledge.mjs <chart_id> --palace menh # Chỉ import 1 cung
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse CLI args
const args = process.argv.slice(2);
const chartId = args.find(a => !a.startsWith('--')) || '472159';
const isIncremental = args.includes('--incremental');
const palaceFilterIdx = args.indexOf('--palace');
const palaceFilter = palaceFilterIdx >= 0 ? args[palaceFilterIdx + 1] : null;

// Map palace names
const PALACE_ID_MAP = {
  'tong-quan': null,
  'menh': 'MENH',
  'than': 'MENH', // Thân thường đồng cung với Mệnh
  'phu-mau': 'PHU_MAU',
  'phuc-duc': 'PHUC_DUC',
  'dien-trach': 'DIEN_TRACH',
  'quan-loc': 'QUAN_LOC',
  'no-boc': 'NO_BOC',
  'thien-di': 'THIEN_DI',
  'tat-ach': 'TAT_ACH',
  'tai-bach': 'TAI_BACH',
  'tu-tuc': 'TU_TUC',
  'phu-the': 'PHU_THE',
  'huynh-de': 'HUYNH_DE'
};

// Parse condition từ title
function parseCondition(condition) {
  const result = {
    position: null,
    heavenly_stem: null,
    required_stars: [],
    transformations: [],
    transformation_target: [],
    m_code: null,
    additional_conditions: []
  };

  // Parse vị trí cung (an tại Tuất, an tại Dần...)
  const posMatch = condition.match(/an tại (\S+)/i);
  if (posMatch) {
    const posMap = {
      'Tí': 'TY', 'Sửu': 'SUU', 'Dần': 'DAN', 'Mão': 'MAO',
      'Thìn': 'THIN', 'Tị': 'TI', 'Ngọ': 'NGO', 'Mùi': 'MUI',
      'Thân': 'THAN', 'Dậu': 'DAU', 'Tuất': 'TUAT', 'Hợi': 'HOI'
    };
    result.position = posMap[posMatch[1]] || null;
  }

  // Parse thiên can
  const canMatch = condition.match(/can (\S+)/i);
  if (canMatch) {
    const canMap = {
      'Giáp': 'GIAP', 'Ất': 'AT', 'Bính': 'BINH', 'Đinh': 'DINH',
      'Mậu': 'MAU', 'Kỷ': 'KY', 'Canh': 'CANH', 'Tân': 'TAN',
      'Nhâm': 'NHAM', 'Quý': 'QUY'
    };
    result.heavenly_stem = canMap[canMatch[1]] || null;
  }

  // Parse phi hóa (Lộc Tật, Kỵ Phúc, Quyền Di...)
  const phiHoaPatterns = [
    { pattern: /Lộc\s+(\S+)/i, type: 'LOC' },
    { pattern: /Quyền\s+(\S+)/i, type: 'QUYEN' },
    { pattern: /Khoa\s+(\S+)/i, type: 'KHOA' },
    { pattern: /Kỵ\s+(\S+)/i, type: 'KY' }
  ];

  const targetMap = {
    'Mệnh': 'MENH', 'Phụ': 'PHU_MAU', 'Phúc': 'PHUC_DUC', 'Điền': 'DIEN_TRACH',
    'Quan': 'QUAN_LOC', 'Nô': 'NO_BOC', 'Di': 'THIEN_DI', 'Tật': 'TAT_ACH',
    'Tài': 'TAI_BACH', 'Tử': 'TU_TUC', 'Phối': 'PHU_THE', 'Huynh': 'HUYNH_DE'
  };

  for (const { pattern, type } of phiHoaPatterns) {
    const match = condition.match(pattern);
    if (match) {
      result.transformations.push(type);
      const target = targetMap[match[1]];
      if (target) result.transformation_target.push(target);
    }
  }

  // Parse M code (M Di, M Phúc, M Tật...)
  const mCodeMatch = condition.match(/M\s+(\S+)/);
  if (mCodeMatch) {
    result.m_code = mCodeMatch[1];
    result.additional_conditions.push(`M_CODE:${mCodeMatch[1]}`);
  }

  // Parse sao (có Phá quân, có Văn xương...)
  const starPatterns = [
    /có\s+([^,]+)/gi,
    /có các sao\s+([^hội]+)/gi
  ];

  for (const pattern of starPatterns) {
    let match;
    while ((match = pattern.exec(condition)) !== null) {
      const stars = match[1].split(/[,và]+/).map(s => s.trim()).filter(s => s);
      result.required_stars.push(...stars);
    }
  }

  // Parse Hóa tinh
  if (condition.includes('Hóa lộc')) result.required_stars.push('Hóa lộc');
  if (condition.includes('Hóa quyền')) result.required_stars.push('Hóa quyền');
  if (condition.includes('Hóa khoa')) result.required_stars.push('Hóa khoa');
  if (condition.includes('Hóa kỵ')) result.required_stars.push('Hóa kỵ');

  return result;
}

// Convert một interpretation sang knowledge block format
function convertToKnowledgeBlock(interp, index, palaceId) {
  const parsed = parseCondition(interp.condition);
  
  return {
    block_id: `${palaceId}_cohoc_${index + 1}`,
    condition_text: interp.condition,
    raw_text: interp.content,
    conditions: {
      palace: PALACE_ID_MAP[palaceId] || null,
      position: parsed.position,
      heavenly_stem: parsed.heavenly_stem,
      gender: null,
      required_stars: parsed.required_stars,
      excluded_stars: [],
      same_palace_stars: [],
      meeting_stars: [],
      opposite_stars: [],
      trine_stars: [],
      transformations: parsed.transformations,
      transformation_target: parsed.transformation_target,
      additional_conditions: parsed.additional_conditions
    },
    source: {
      book: interp.source || 'tuvi.cohoc.net',
      author: extractAuthor(interp.source),
      translator: null,
      url: 'https://tuvi.cohoc.net'
    },
    accuracy: interp.accuracy || 5
  };
}

function extractAuthor(source) {
  if (!source) return 'Unknown';
  // "Tử vi đẩu số tinh hoa tập thành - Đại Đức Sơn Nhân" -> "Đại Đức Sơn Nhân"
  const parts = source.split(' - ');
  return parts.length > 1 ? parts[parts.length - 1] : source;
}

// Main import function
function importCohocData(chartId) {
  const inputPath = path.join(__dirname, 'tuvi_crawler', 'output', chartId, 'interpretations.json');
  
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    console.log('Run crawler and parser first');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const outputDir = path.join(__dirname, 'src', 'lib', 'tuvi', 'knowledge', 'cung');

  // Ensure output dir exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const stats = { total: 0, byPalace: {} };

  // Process each section (palace)
  for (const section of data.sections) {
    const sectionId = section.id;
    const palaceKey = PALACE_ID_MAP[sectionId];
    
    // Skip đại vận và vận năm (chỉ lấy 12 cung + tổng quan)
    if (sectionId.includes('dai-van') || sectionId.includes('van-nam') || sectionId.includes('phu-luc')) {
      continue;
    }

    if (!palaceKey && sectionId !== 'tong-quan' && sectionId !== 'than') {
      console.log(`[SKIP] Unknown section: ${sectionId}`);
      continue;
    }

    const blocks = section.interpretations.map((interp, idx) => 
      convertToKnowledgeBlock(interp, idx, sectionId)
    );

    // Determine output filename
    let filename;
    if (sectionId === 'tong-quan') {
      filename = 'tong-quan-cohoc.json';
    } else if (sectionId === 'than') {
      filename = 'than-cohoc.json';
    } else {
      const palaceNameMap = {
        'menh': 'menh', 'phu-mau': 'phu-mau', 'phuc-duc': 'phuc-duc',
        'dien-trach': 'dien-trach', 'quan-loc': 'quan-loc', 'no-boc': 'no-boc',
        'thien-di': 'thien-di', 'tat-ach': 'tat-ach', 'tai-bach': 'tai-bach',
        'tu-tuc': 'tu-tuc', 'phu-the': 'phu-the', 'huynh-de': 'huynh-de'
      };
      filename = `${palaceNameMap[sectionId] || sectionId}-cohoc-full.json`;
    }

    const outputData = {
      palace: palaceKey,
      source: 'tuvi.cohoc.net',
      chart_id: chartId,
      total_blocks: blocks.length,
      sections: [
        {
          section_id: sectionId,
          title: section.title,
          blocks: blocks
        }
      ]
    };

    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
    
    stats.total += blocks.length;
    stats.byPalace[sectionId] = blocks.length;
    
    console.log(`[SAVED] ${filename}: ${blocks.length} blocks`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total blocks imported: ${stats.total}`);
  console.log('\nBy palace:');
  Object.entries(stats.byPalace).forEach(([palace, count]) => {
    console.log(`  ${palace}: ${count}`);
  });
  console.log('='.repeat(60));
  console.log(`\nFiles saved to: ${outputDir}`);
}

// ============ INCREMENTAL IMPORT ============

/**
 * Import từng section một, save ngay sau mỗi section
 * Tránh load toàn bộ data vào memory
 */
function importCohocDataIncremental(chartId, palaceFilter = null) {
  const inputPath = path.join(__dirname, 'tuvi_crawler', 'output', chartId, 'interpretations.json');
  
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const outputDir = path.join(__dirname, 'src', 'lib', 'tuvi', 'knowledge', 'cung');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('='.repeat(60));
  console.log('INCREMENTAL IMPORT MODE');
  console.log('='.repeat(60));
  console.log(`Chart ID: ${chartId}`);
  console.log(`Palace filter: ${palaceFilter || 'ALL'}`);
  console.log('');

  // Read file as stream-like (parse once, process section by section)
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const stats = { total: 0, byPalace: {} };

  for (const section of data.sections) {
    const sectionId = section.id;
    
    // Skip đại vận, vận năm
    if (sectionId.includes('dai-van') || sectionId.includes('van-nam') || sectionId.includes('phu-luc')) {
      continue;
    }

    // Apply palace filter
    if (palaceFilter && sectionId !== palaceFilter) {
      continue;
    }

    const palaceKey = PALACE_ID_MAP[sectionId];
    if (!palaceKey && sectionId !== 'tong-quan' && sectionId !== 'than') {
      console.log(`[SKIP] Unknown section: ${sectionId}`);
      continue;
    }

    console.log(`\n📦 Processing: ${section.title}`);

    // Process từng interpretation
    const blocks = [];
    for (let i = 0; i < section.interpretations.length; i++) {
      const interp = section.interpretations[i];
      const block = convertToKnowledgeBlock(interp, i, sectionId);
      blocks.push(block);

      // Log progress mỗi 10 blocks
      if ((i + 1) % 10 === 0) {
        console.log(`  ... processed ${i + 1}/${section.interpretations.length}`);
      }
    }

    // Save section ngay lập tức
    const filename = getFilename(sectionId);
    const outputPath = path.join(outputDir, filename);
    
    const outputData = {
      palace: palaceKey,
      source: 'tuvi.cohoc.net',
      chart_id: chartId,
      import_mode: 'incremental',
      last_updated: new Date().toISOString(),
      total_blocks: blocks.length,
      sections: [{
        section_id: sectionId,
        title: section.title,
        blocks: blocks
      }]
    };

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
    
    stats.total += blocks.length;
    stats.byPalace[sectionId] = blocks.length;
    
    console.log(`  ✓ Saved ${blocks.length} blocks to ${filename}`);

    // Clear memory
    blocks.length = 0;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total blocks: ${stats.total}`);
  console.log('\nBy palace:');
  Object.entries(stats.byPalace).forEach(([palace, count]) => {
    console.log(`  ${palace}: ${count}`);
  });
  console.log('='.repeat(60));
}

function getFilename(sectionId) {
  const nameMap = {
    'tong-quan': 'tong-quan-cohoc.json',
    'than': 'than-cohoc.json',
    'menh': 'menh-cohoc-full.json',
    'phu-mau': 'phu-mau-cohoc-full.json',
    'phuc-duc': 'phuc-duc-cohoc-full.json',
    'dien-trach': 'dien-trach-cohoc-full.json',
    'quan-loc': 'quan-loc-cohoc-full.json',
    'no-boc': 'no-boc-cohoc-full.json',
    'thien-di': 'thien-di-cohoc-full.json',
    'tat-ach': 'tat-ach-cohoc-full.json',
    'tai-bach': 'tai-bach-cohoc-full.json',
    'tu-tuc': 'tu-tuc-cohoc-full.json',
    'phu-the': 'phu-the-cohoc-full.json',
    'huynh-de': 'huynh-de-cohoc-full.json',
  };
  return nameMap[sectionId] || `${sectionId}-cohoc.json`;
}

// ============ RUN ============

if (isIncremental) {
  importCohocDataIncremental(chartId, palaceFilter);
} else {
  importCohocData(chartId);
}
