#!/usr/bin/env node
/**
 * Parse luận giải từng cung từ HTML của tuvi.cohoc.net
 * 
 * Usage: node parse-cohoc-interpretations.mjs <chart_id>
 */

import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseInterpretations(chartId) {
  const htmlPath = path.join(__dirname, 'tuvi_crawler', 'output', chartId, 'page.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.error(`File not found: ${htmlPath}`);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(html);

  const interpretations = {
    chart_id: chartId,
    source: 'tuvi.cohoc.net',
    sections: []
  };

  let currentSection = null;

  // Parse từng section trong vung-giai-doan
  $('.vung-giai-doan .noi-dung').children().each((i, el) => {
    const tagName = el.tagName.toLowerCase();
    
    // Heading = section mới (cung mới hoặc đại vận)
    if (tagName === 'h3') {
      if (currentSection) {
        interpretations.sections.push(currentSection);
      }
      
      const sectionName = $(el).find('a').attr('name') || $(el).text().trim();
      const sectionTitle = $(el).text().trim();
      
      currentSection = {
        id: sectionName,
        title: sectionTitle,
        interpretations: []
      };
    }
    
    // Div.giaidoan = một luận giải
    if (tagName === 'div' && $(el).hasClass('giaidoan')) {
      if (!currentSection) return;
      
      const condition = $(el).find('h4.nguyennhan').text().trim();
      const content = $(el).find('p.ketqua').html() || '';
      const source = $(el).find('em.thamkhao').text().trim();
      
      // Parse accuracy class (chinhxac-X)
      const classAttr = $(el).attr('class') || '';
      const accuracyMatch = classAttr.match(/chinhxac-(\d+)/);
      const accuracy = accuracyMatch ? parseInt(accuracyMatch[1]) : null;
      
      // Clean content - convert <br/> to newlines
      const cleanContent = content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
      
      currentSection.interpretations.push({
        condition,
        content: cleanContent,
        source,
        accuracy
      });
    }
  });

  // Push last section
  if (currentSection) {
    interpretations.sections.push(currentSection);
  }

  // Save full interpretations
  const outputPath = path.join(__dirname, 'tuvi_crawler', 'output', chartId, 'interpretations.json');
  fs.writeFileSync(outputPath, JSON.stringify(interpretations, null, 2), 'utf-8');
  console.log(`[SAVED] ${outputPath}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('INTERPRETATIONS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Chart ID: ${chartId}`);
  console.log(`Total sections: ${interpretations.sections.length}`);
  
  let totalInterpretations = 0;
  interpretations.sections.forEach(section => {
    totalInterpretations += section.interpretations.length;
    console.log(`  ${section.title}: ${section.interpretations.length} luận giải`);
  });
  
  console.log(`\nTotal interpretations: ${totalInterpretations}`);
  console.log('='.repeat(60));

  // Also create a simplified version grouped by palace
  const byPalace = {};
  interpretations.sections.forEach(section => {
    // Extract palace name from section id
    const palaceId = section.id;
    if (!byPalace[palaceId]) {
      byPalace[palaceId] = {
        title: section.title,
        items: []
      };
    }
    
    section.interpretations.forEach(interp => {
      byPalace[palaceId].items.push({
        condition: interp.condition,
        content: interp.content,
        source: interp.source,
        accuracy: interp.accuracy
      });
    });
  });

  const simplifiedPath = path.join(__dirname, 'tuvi_crawler', 'output', chartId, 'interpretations_by_palace.json');
  fs.writeFileSync(simplifiedPath, JSON.stringify(byPalace, null, 2), 'utf-8');
  console.log(`[SAVED] ${simplifiedPath}`);

  return interpretations;
}

// Run
const chartId = process.argv[2] || '472159';
parseInterpretations(chartId);
