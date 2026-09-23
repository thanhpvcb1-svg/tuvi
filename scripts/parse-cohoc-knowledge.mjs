#!/usr/bin/env node
/**
 * Parse dữ liệu crawl từ tuvicohoc.net thành knowledge JSON
 * Xử lý toàn bộ file không giới hạn input
 * 
 * Usage: node scripts/parse-cohoc-knowledge.mjs <input_file>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============ CONSTANTS ============

const PALACE_PATTERNS = {
  'CUNG MỆNH': 'menh',
  'CUNG THÂN': 'than',
  'CUNG PHỤ MẪU': 'phu_mau',
  'CUNG PHÚC ĐỨC': 'phuc_duc',
  'CUNG ĐIỀN TRẠCH': 'dien_trach',
  'CUNG QUAN LỘC': 'quan_loc',
  'CUNG NÔ BỘC': 'no_boc',
  'CUNG THIÊN DI': 'thien_di',
  'CUNG TẬT ÁCH': 'tat_ach',
  'CUNG TÀI BẠCH': 'tai_bach',
  'CUNG TỬ TỨC': 'tu_tuc',
  'CUNG PHU THÊ': 'phu_the',
  'CUNG HUYNH ĐỆ': 'huynh_de',
  'TỔNG QUAN': 'tong_quan',
};

const BRANCH_MAP = {
  'Tý': 'ty', 'Tí': 'ty', 'Sửu': 'suu', 'Dần': 'dan', 'Mão': 'mao',
  'Thìn': 'thin', 'Tị': 'ti', 'Tỵ': 'ti', 'Ngọ': 'ngo', 'Mùi': 'mui',
  'Thân': 'than', 'Dậu': 'dau', 'Tuất': 'tuat', 'Hợi': 'hoi',
};

const STEM_MAP = {
  'Giáp': 'giap', 'Ất': 'at', 'Bính': 'binh', 'Đinh': 'dinh',
  'Mậu': 'mau', 'Kỷ': 'ky', 'Canh': 'canh', 'Tân': 'tan',
  'Nhâm': 'nham', 'Quý': 'quy',
};

const TARGET_PALACE_MAP = {
  'Mệnh': 'menh', 'Phụ': 'phu_mau', 'Phúc': 'phuc_duc', 'Điền': 'dien_trach',
  'Quan': 'quan_loc', 'Nô': 'no_boc', 'Di': 'thien_di', 'Tật': 'tat_ach',
  'Tài': 'tai_bach', 'Tử': 'tu_tuc', 'Phối': 'phu_the', 'Huynh': 'huynh_de',
};

// ============ PARSER FUNCTIONS ============

/**
 * Parse condition từ title để extract metadata
 */
function parseCondition(title) {
  const result = {
    position: null,
    heavenly_stem: null,
    required_stars: [],
    transformations: [],
    transformation_target: [],
    m_code: null,
    additional: [],
  };

  // Parse vị trí cung (an tại Tuất, an tại Dần...)
  const posMatch = title.match(/an tại\s+(\S+)/i);
  if (posMatch) {
    result.position = BRANCH_MAP[posMatch[1]] || null;
  }

  // Parse thiên can (can Nhâm, can Giáp...)
  const canMatch = title.match(/can\s+(\S+)/i);
  if (canMatch) {
    result.heavenly_stem = STEM_MAP[canMatch[1]] || null;
  }

  // Parse địa chi cung (địa chi là Tuất...)
  const chiMatch = title.match(/địa chi (?:là\s+)?(\S+)/i);
  if (chiMatch) {
    result.position = BRANCH_MAP[chiMatch[1]] || result.position;
  }

  // Parse thiên can cung (thiên can là Nhâm...)
  const canCungMatch = title.match(/thiên can (?:là\s+)?(\S+)/i);
  if (canCungMatch) {
    result.heavenly_stem = STEM_MAP[canCungMatch[1]] || result.heavenly_stem;
  }

  // Parse phi hóa (Lộc Tật, Kỵ Phúc, Quyền Di...)
  const phiHoaPatterns = [
    { pattern: /có\s+Lộc\s+(\S+)/i, type: 'loc' },
    { pattern: /có\s+Quyền\s+(\S+)/i, type: 'quyen' },
    { pattern: /có\s+Khoa\s+(\S+)/i, type: 'khoa' },
    { pattern: /có\s+Kỵ\s+(\S+)/i, type: 'ky' },
  ];

  for (const { pattern, type } of phiHoaPatterns) {
    const match = title.match(pattern);
    if (match) {
      result.transformations.push(type);
      const target = TARGET_PALACE_MAP[match[1]];
      if (target) result.transformation_target.push(target);
    }
  }

  // Parse M code (M Di, M Phúc, M Tật...)
  const mCodeMatch = title.match(/M\s+(\S+)/);
  if (mCodeMatch) {
    result.m_code = `M_${mCodeMatch[1]}`;
    result.additional.push(`M_CODE:${mCodeMatch[1]}`);
  }

  // Parse sao (có Phá quân, có Văn xương...)
  const starPatterns = [
    /có\s+([^,\n]+?)(?=\s*$|\s*,|\s*hội)/gi,
    /có các sao\s+([^hội\n]+)/gi,
  ];

  for (const pattern of starPatterns) {
    let match;
    while ((match = pattern.exec(title)) !== null) {
      const stars = match[1].split(/[,và]+/).map(s => s.trim()).filter(s => s && s.length > 1);
      result.required_stars.push(...stars);
    }
  }

  // Parse Hóa tinh trong title
  if (title.includes('Hóa lộc') || title.includes('Hóa Lộc')) result.required_stars.push('Hóa lộc');
  if (title.includes('Hóa quyền') || title.includes('Hóa Quyền')) result.required_stars.push('Hóa quyền');
  if (title.includes('Hóa khoa') || title.includes('Hóa Khoa')) result.required_stars.push('Hóa khoa');
  if (title.includes('Hóa kỵ') || title.includes('Hóa Kỵ')) result.required_stars.push('Hóa kỵ');

  // Parse Tự hóa
  if (title.includes('Tự hóa') || title.includes('Tự Hóa')) {
    result.additional.push('TU_HOA');
  }

  // Parse Lai nhân cung
  if (title.includes('Lai nhân cung') || title.includes('Lai Nhân Cung')) {
    result.additional.push('LAI_NHAN_CUNG');
  }

  // Parse cung khí
  if (title.includes('Cung khí đại cát')) result.additional.push('CUNG_KHI:DAI_CAT');
  if (title.includes('Cung khí đại hung')) result.additional.push('CUNG_KHI:DAI_HUNG');
  if (title.includes('Cung khí hữu cát')) result.additional.push('CUNG_KHI:HUU_CAT');

  // Dedupe stars
  result.required_stars = [...new Set(result.required_stars)];

  return result;
}

/**
 * Extract source từ text
 */
function extractSource(text) {
  // Pattern: "Tên sách - Tác giả" hoặc "Tác giả"
  const lines = text.split('\n');
  
  // Tìm dòng cuối có pattern nguồn
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.match(/^[A-ZÀ-Ỹ].*[-–].*$/)) {
      const parts = line.split(/[-–]/);
      if (parts.length >= 2) {
        return {
          book: parts[0].trim(),
          author: parts.slice(1).join('-').trim(),
        };
      }
    }
  }

  return { book: 'tuvi.cohoc.net', author: 'Unknown' };
}

/**
 * Parse một block luận giải
 */
function parseInterpretationBlock(title, content, index, palaceId) {
  const conditions = parseCondition(title);
  const source = extractSource(content);
  
  // Determine type
  let type = 'general';
  if (conditions.transformations.length > 0) {
    type = `phi_${conditions.transformations[0]}`;
  } else if (conditions.required_stars.length > 0) {
    type = 'star_in_palace';
  } else if (conditions.heavenly_stem) {
    type = 'heavenly_stem';
  } else if (conditions.position) {
    type = 'earthly_branch';
  } else if (conditions.m_code) {
    type = 'm_code';
  }

  const block = {
    id: `${palaceId}_cohoc_${index}`,
    type,
    conditions: {},
    text: content.trim(),
    source,
  };

  // Add conditions
  if (conditions.position) {
    block.conditions.position = conditions.position;
  }
  if (conditions.heavenly_stem) {
    block.conditions.heavenly_stem = conditions.heavenly_stem;
  }
  if (conditions.required_stars.length > 0) {
    block.conditions.required_stars = conditions.required_stars;
  }
  if (conditions.transformations.length > 0) {
    block.conditions.transformation = conditions.transformations[0];
    if (conditions.transformation_target.length > 0) {
      block.conditions.target_palace = conditions.transformation_target[0];
    }
  }
  if (conditions.m_code) {
    block.conditions.m_code = conditions.m_code;
  }
  if (conditions.additional.length > 0) {
    block.conditions.additional = conditions.additional;
  }

  return block;
}

/**
 * Parse toàn bộ file text thành sections
 */
function parseFullText(text) {
  const sections = [];
  let currentPalace = null;
  let currentTitle = null;
  let currentContent = [];
  let blockIndex = 0;

  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;

    // Check for palace header
    let foundPalace = null;
    for (const [pattern, id] of Object.entries(PALACE_PATTERNS)) {
      if (line.toUpperCase().includes(pattern)) {
        foundPalace = id;
        break;
      }
    }

    if (foundPalace) {
      // Save previous content
      if (currentTitle && currentContent.length > 0) {
        const block = parseInterpretationBlock(
          currentTitle,
          currentContent.join('\n'),
          blockIndex++,
          currentPalace || 'general'
        );
        
        const section = sections.find(s => s.palace === currentPalace);
        if (section) {
          section.interpretations.push(block);
        } else {
          sections.push({
            palace: currentPalace,
            interpretations: [block],
          });
        }
      }

      currentPalace = foundPalace;
      currentTitle = null;
      currentContent = [];
      blockIndex = 0;
      continue;
    }

    // Check for interpretation title (starts with "Cung X an tại Y có Z")
    const isTitleLine = 
      line.match(/^Cung\s+\S+\s+an\s+tại/i) ||
      line.match(/^Cung\s+\S+\s+địa chi/i) ||
      line.match(/^Cung\s+\S+\s+thiên can/i) ||
      line.match(/^Cung\s+\S+\s+có\s+/i) ||
      line.match(/^Cung\s+\S+\s+phi\s+hóa/i) ||
      line.match(/^Điểm\s+"xí hoa"/i) ||
      line.match(/^Kinh nghiệm của/i) ||
      line.match(/^Thuận Thủy Kị/i) ||
      line.match(/^Dẫn xuất Lộc/i) ||
      line.match(/^Đối trì Lộc/i) ||
      line.match(/^Lai Nhân Cung/i);

    if (isTitleLine && currentPalace) {
      // Save previous block
      if (currentTitle && currentContent.length > 0) {
        const block = parseInterpretationBlock(
          currentTitle,
          currentContent.join('\n'),
          blockIndex++,
          currentPalace
        );
        
        const section = sections.find(s => s.palace === currentPalace);
        if (section) {
          section.interpretations.push(block);
        } else {
          sections.push({
            palace: currentPalace,
            interpretations: [block],
          });
        }
      }

      currentTitle = line;
      currentContent = [];
      continue;
    }

    // Add to current content
    if (currentTitle) {
      currentContent.push(line);
    }
  }

  // Save last block
  if (currentTitle && currentContent.length > 0 && currentPalace) {
    const block = parseInterpretationBlock(
      currentTitle,
      currentContent.join('\n'),
      blockIndex,
      currentPalace
    );
    
    const section = sections.find(s => s.palace === currentPalace);
    if (section) {
      section.interpretations.push(block);
    } else {
      sections.push({
        palace: currentPalace,
        interpretations: [block],
      });
    }
  }

  return sections;
}

/**
 * Group interpretations by condition type
 */
function groupByConditionType(interpretations) {
  const groups = {
    heavenly_stem: [],
    earthly_branch: [],
    star_in_palace: [],
    phi_hoa: [],
    m_code: [],
    general: [],
  };

  for (const interp of interpretations) {
    if (interp.type.startsWith('phi_')) {
      groups.phi_hoa.push(interp);
    } else if (groups[interp.type]) {
      groups[interp.type].push(interp);
    } else {
      groups.general.push(interp);
    }
  }

  return groups;
}

/**
 * Convert to final knowledge format
 */
function convertToKnowledgeFormat(sections) {
  const result = {};

  for (const section of sections) {
    const palace = section.palace;
    const groups = groupByConditionType(section.interpretations);

    const knowledgeSections = [];

    // Add sections by type
    if (groups.heavenly_stem.length > 0) {
      knowledgeSections.push({
        section_id: `${palace}_can_cung`,
        title: 'Thiên Can Cung',
        interpretations: groups.heavenly_stem,
      });
    }

    if (groups.earthly_branch.length > 0) {
      knowledgeSections.push({
        section_id: `${palace}_dia_chi`,
        title: 'Địa Chi Cung',
        interpretations: groups.earthly_branch,
      });
    }

    if (groups.star_in_palace.length > 0) {
      knowledgeSections.push({
        section_id: `${palace}_chinh_tinh`,
        title: 'Chính Tinh và Phụ Tinh',
        interpretations: groups.star_in_palace,
      });
    }

    if (groups.phi_hoa.length > 0) {
      knowledgeSections.push({
        section_id: `${palace}_phi_hoa`,
        title: 'Phi Hóa',
        interpretations: groups.phi_hoa,
      });
    }

    if (groups.m_code.length > 0) {
      knowledgeSections.push({
        section_id: `${palace}_m_code`,
        title: 'M Code (Quan hệ cung)',
        interpretations: groups.m_code,
      });
    }

    if (groups.general.length > 0) {
      knowledgeSections.push({
        section_id: `${palace}_general`,
        title: 'Luận giải tổng hợp',
        interpretations: groups.general,
      });
    }

    result[palace] = {
      palace,
      source: 'tuvi.cohoc.net',
      total_interpretations: section.interpretations.length,
      sections: knowledgeSections,
    };
  }

  return result;
}

// ============ MAIN ============

function main() {
  const inputFile = process.argv[2] || path.join(__dirname, '..', 'tuvicohoc', '1.txt');
  
  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
  }

  console.log(`Reading: ${inputFile}`);
  const text = fs.readFileSync(inputFile, 'utf-8');
  console.log(`File size: ${(text.length / 1024).toFixed(2)} KB`);

  console.log('\nParsing...');
  const sections = parseFullText(text);
  
  console.log(`\nFound ${sections.length} palace sections:`);
  for (const section of sections) {
    console.log(`  - ${section.palace}: ${section.interpretations.length} interpretations`);
  }

  console.log('\nConverting to knowledge format...');
  const knowledge = convertToKnowledgeFormat(sections);

  // Output directory
  const outputDir = path.join(__dirname, '..', 'src', 'lib', 'tuvi', 'knowledge', 'cung');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write individual palace files
  let totalBlocks = 0;
  for (const [palace, data] of Object.entries(knowledge)) {
    const filename = `${palace.replace(/_/g, '-')}-cohoc-full.json`;
    const outputPath = path.join(outputDir, filename);
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`  Saved: ${filename} (${data.total_interpretations} blocks)`);
    totalBlocks += data.total_interpretations;
  }

  // Write combined file
  const combinedPath = path.join(outputDir, 'all-cohoc-knowledge.json');
  fs.writeFileSync(combinedPath, JSON.stringify(knowledge, null, 2), 'utf-8');
  console.log(`  Saved: all-cohoc-knowledge.json`);

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total palaces: ${Object.keys(knowledge).length}`);
  console.log(`Total interpretation blocks: ${totalBlocks}`);
  console.log(`Output directory: ${outputDir}`);
  console.log('='.repeat(60));
}

main();
