#!/usr/bin/env node
/**
 * Parse dữ liệu lá số từ HTML của tuvi.cohoc.net
 * 
 * Usage: node parse-cohoc-chart.mjs <chart_id>
 */

import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Map tên cung
const PALACE_MAP = {
  'MỆNH': 'menh',
  'PHỤ MẪU': 'phu_mau',
  'PHÚC ĐỨC': 'phuc_duc',
  'ĐIỀN TRẠCH': 'dien_trach',
  'QUAN LỘC': 'quan_loc',
  'NÔ BỘC': 'no_boc',
  'THIÊN DI': 'thien_di',
  'TẬT ÁCH': 'tat_ach',
  'TÀI BẠCH': 'tai_bach',
  'TỬ TỨC': 'tu_tuc',
  'PHU THÊ': 'phu_the',
  'HUYNH ĐỆ': 'huynh_de'
};

function parseChart(chartId) {
  const htmlPath = path.join(__dirname, 'tuvi_crawler', 'output', chartId, 'page.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.error(`File not found: ${htmlPath}`);
    console.log('Run crawler first: node tuvi-crawler.mjs "URL"');
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(html);

  const chart = {
    chart_id: chartId,
    source: 'tuvi.cohoc.net',
    birth: {},
    palaces: {},
    metadata: {}
  };

  // 1. Parse title
  const title = $('title').text();
  chart.metadata.title = title;
  console.log(`\n[TITLE] ${title}`);

  // 2. Parse thông tin từ thien-ban (center box)
  const thienBan = $('.thien-ban');
  if (thienBan.length) {
    thienBan.find('.nhom-thienban p').each((i, el) => {
      const text = $(el).text().trim();
      
      // Parse từng dòng riêng biệt
      if (text.startsWith('Năm:')) {
        chart.birth.year = text.replace('Năm:', '').trim();
      } else if (text.startsWith('Tháng:')) {
        const match = text.match(/Tháng:\s*(\d+)/);
        if (match) chart.birth.month = match[1];
      } else if (text.startsWith('Ngày:')) {
        chart.birth.day = text.replace('Ngày:', '').trim();
      } else if (text.startsWith('Giờ:')) {
        chart.birth.hour = text.replace('Giờ:', '').trim();
      } else if (text.startsWith('Âm Dương:')) {
        chart.birth.gender = text.replace('Âm Dương:', '').trim();
      } else if (text.startsWith('Mệnh:')) {
        chart.birth.menh = $(el).find('span').text().trim() || text.replace('Mệnh:', '').trim();
      } else if (text.startsWith('Cục:')) {
        chart.birth.cuc = $(el).find('span').text().trim() || text.replace('Cục:', '').trim();
      } else if (text.startsWith('Thân cư:')) {
        chart.birth.than_cu = text.replace('Thân cư:', '').trim();
      } else if (text.startsWith('Mệnh chủ:')) {
        chart.birth.menh_chu = text.replace('Mệnh chủ:', '').trim();
      } else if (text.startsWith('Thân chủ:')) {
        chart.birth.than_chu = text.replace('Thân chủ:', '').trim();
      } else if (text.startsWith('Hỉ thần:')) {
        chart.birth.hi_than = text.replace('Hỉ thần:', '').trim();
      } else if (text.startsWith('Kị thần:')) {
        chart.birth.ki_than = text.replace('Kị thần:', '').trim();
      }
    });
  }

  console.log('\n[BIRTH INFO]');
  console.log(JSON.stringify(chart.birth, null, 2));

  // 3. Parse 12 cung
  console.log('\n[PALACES]');
  
  $('.cung').each((i, el) => {
    const cungEl = $(el);
    
    // Tên cung
    let palaceName = cungEl.find('.cung-tencung').text().trim();
    // Remove "Thân" suffix if present
    palaceName = palaceName.replace(/\s*Thân$/, '').trim();
    
    const palaceKey = PALACE_MAP[palaceName];
    if (!palaceKey) return;

    const palace = {
      name: palaceName,
      diaChi: cungEl.find('.cung-diachi').text().trim(),
      daiVan: cungEl.find('.cung-daivan').text().trim(),
      chinhTinh: [],
      saoTot: [],
      saoXau: [],
      score: cungEl.find('.cung-bottom span').text().trim()
    };

    // Chính tinh
    cungEl.find('.chinh-tinh span').each((j, star) => {
      const starName = $(star).text().trim();
      if (starName && starName !== '\u00a0') {
        palace.chinhTinh.push(starName);
      }
    });

    // Sao tốt
    cungEl.find('.sao-tot li span').each((j, star) => {
      const starName = $(star).text().trim();
      if (starName) palace.saoTot.push(starName);
    });

    // Sao xấu
    cungEl.find('.sao-xau li span').each((j, star) => {
      const starName = $(star).text().trim();
      if (starName) palace.saoXau.push(starName);
    });

    chart.palaces[palaceKey] = palace;
    
    console.log(`  ${palaceName} (${palace.diaChi}): ${palace.chinhTinh.join(', ') || 'Không có chính tinh'}`);
  });

  // 4. Save normalized chart
  const outputPath = path.join(__dirname, 'tuvi_crawler', 'output', chartId, 'normalized_chart.json');
  fs.writeFileSync(outputPath, JSON.stringify(chart, null, 2), 'utf-8');
  console.log(`\n[SAVED] ${outputPath}`);

  // 5. Summary
  console.log('\n' + '='.repeat(60));
  console.log('CHART SUMMARY');
  console.log('='.repeat(60));
  console.log(`Chart ID: ${chartId}`);
  console.log(`Năm: ${chart.birth.year || 'N/A'}`);
  console.log(`Tháng: ${chart.birth.month || 'N/A'}`);
  console.log(`Ngày: ${chart.birth.day || 'N/A'}`);
  console.log(`Giờ: ${chart.birth.hour || 'N/A'}`);
  console.log(`Giới tính: ${chart.birth.gender || 'N/A'}`);
  console.log(`Mệnh: ${chart.birth.menh || 'N/A'}`);
  console.log(`Cục: ${chart.birth.cuc || 'N/A'}`);
  console.log(`Thân cư: ${chart.birth.than_cu || 'N/A'}`);
  console.log(`Palaces: ${Object.keys(chart.palaces).length}`);
  console.log('='.repeat(60));

  return chart;
}

// Run
const chartId = process.argv[2] || '472159';
parseChart(chartId);
