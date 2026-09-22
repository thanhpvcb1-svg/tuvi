#!/usr/bin/env node
/**
 * TuVi Crawler - Node.js version
 * Crawl dữ liệu lá số từ tuvi.cohoc.net
 * 
 * Usage: node tuvi-crawler.mjs "URL"
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Keywords để scoring
const PALACE_KEYWORDS = [
  'Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc',
  'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ'
];

const STAR_KEYWORDS = [
  'Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh',
  'Thiên Phủ', 'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương',
  'Thất Sát', 'Phá Quân', 'Văn Xương', 'Văn Khúc', 'Tả Phụ', 'Hữu Bật'
];

// Extract lid từ URL
function extractLid(url) {
  const match = url.match(/-lid-(\d+)\.html/);
  return match ? match[1] : null;
}

// Score content
function scoreContent(text) {
  let score = 0;
  for (const kw of PALACE_KEYWORDS) {
    if (text.includes(kw)) score += 2;
  }
  for (const kw of STAR_KEYWORDS) {
    if (text.includes(kw)) score += 1;
  }
  return score;
}

// Hash URL
function hashUrl(url) {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

// Main crawler
async function crawl(url) {
  const lid = extractLid(url);
  if (!lid) {
    console.error('Cannot extract lid from URL');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log(`TuVi Crawler - Chart ID: ${lid}`);
  console.log(`URL: ${url}`);
  console.log('='.repeat(60));

  // Create output dir
  const outputDir = path.join(__dirname, 'tuvi_crawler', 'output', lid);
  const responsesDir = path.join(outputDir, 'responses');
  fs.mkdirSync(responsesDir, { recursive: true });

  const networkLog = [];
  const chartCandidates = [];

  // Headers giả lập browser
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
  };

  try {
    // 1. Fetch main page
    console.log('\n[FETCH] Main page...');
    const response = await fetch(url, { headers, redirect: 'follow' });
    const finalUrl = response.url;
    const status = response.status;
    const html = await response.text();

    console.log(`[STATUS] ${status}`);
    console.log(`[FINAL URL] ${finalUrl}`);

    // Check redirect
    if (finalUrl !== url) {
      console.log(`[REDIRECT] ${url} -> ${finalUrl}`);
    }

    // Check anti-bot
    if (finalUrl.includes('404') || finalUrl.includes('robot')) {
      console.log('\n[WARNING] Possible anti-bot redirect!');
    }

    // Log cookies
    const cookies = response.headers.get('set-cookie') || '';
    console.log(`[COOKIES] ${cookies.slice(0, 100)}...`);

    // Save HTML
    fs.writeFileSync(path.join(outputDir, 'page.html'), html, 'utf-8');
    console.log('[SAVED] page.html');

    // Parse HTML
    const $ = cheerio.load(html);
    const title = $('title').text();
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    // Save text
    fs.writeFileSync(path.join(outputDir, 'page.txt'), text, 'utf-8');
    console.log('[SAVED] page.txt');

    // Score page content
    const pageScore = scoreContent(text);
    console.log(`\n[SCORE] Page content score: ${pageScore}`);

    // 2. Find all script sources
    const scripts = [];
    $('script').each((i, el) => {
      const src = $(el).attr('src');
      const inline = $(el).html() || '';
      scripts.push({ index: i, src, inline: inline.slice(0, 1000) });
    });

    console.log(`\n[SCRIPTS] Found ${scripts.length} scripts`);

    // 3. Analyze inline scripts for API calls
    const apiPatterns = [
      /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /\$\.ajax\s*\(\s*\{[^}]*url\s*:\s*['"`]([^'"`]+)['"`]/g,
      /\$\.get\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /\$\.post\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /XMLHttpRequest[^;]*open\s*\(\s*['"`]\w+['"`]\s*,\s*['"`]([^'"`]+)['"`]/g
    ];

    const foundApis = new Set();
    for (const script of scripts) {
      if (script.inline) {
        for (const pattern of apiPatterns) {
          let match;
          while ((match = pattern.exec(script.inline)) !== null) {
            foundApis.add(match[1]);
          }
        }
        // Find lid reference
        if (script.inline.includes(lid)) {
          console.log(`[FOUND] lid ${lid} in script ${script.index}`);
        }
      }
    }

    if (foundApis.size > 0) {
      console.log('\n[API CANDIDATES from JS]:');
      for (const api of foundApis) {
        console.log(`  - ${api}`);
      }
    }

    // 4. Find external JS files and fetch them
    const jsUrls = scripts.filter(s => s.src).map(s => {
      if (s.src.startsWith('//')) return 'https:' + s.src;
      if (s.src.startsWith('/')) return new URL(s.src, url).href;
      if (!s.src.startsWith('http')) return new URL(s.src, url).href;
      return s.src;
    });

    console.log(`\n[FETCHING] ${jsUrls.length} external JS files...`);

    for (const jsUrl of jsUrls) {
      try {
        const jsResp = await fetch(jsUrl, { headers });
        const jsText = await jsResp.text();
        
        networkLog.push({
          url: jsUrl,
          status: jsResp.status,
          type: 'script',
          size: jsText.length
        });

        // Save JS
        const jsFile = `response_${hashUrl(jsUrl)}.js`;
        fs.writeFileSync(path.join(responsesDir, jsFile), jsText, 'utf-8');

        // Check for API patterns
        for (const pattern of apiPatterns) {
          let match;
          while ((match = pattern.exec(jsText)) !== null) {
            foundApis.add(match[1]);
          }
        }

        // Check for lid
        if (jsText.includes(lid)) {
          console.log(`[FOUND] lid ${lid} in ${jsUrl.slice(-50)}`);
        }

        // Check for tuvi keywords
        const jsScore = scoreContent(jsText);
        if (jsScore > 5) {
          console.log(`[HIGH SCORE] ${jsUrl.slice(-50)} score=${jsScore}`);
        }
      } catch (e) {
        console.log(`[ERROR] ${jsUrl.slice(-50)}: ${e.message}`);
      }
    }

    // 5. Try common API endpoints
    const baseUrl = new URL(url).origin;
    const commonApis = [
      `/api/chart/${lid}`,
      `/api/laso/${lid}`,
      `/Core.html?lid=${lid}`,
      `/ajax/chart.php?lid=${lid}`,
      `/data/chart/${lid}.json`,
      `/tuvi/data/${lid}`,
      `/api/tuvi/${lid}`
    ];

    console.log('\n[PROBING] Common API endpoints...');

    for (const apiPath of commonApis) {
      const apiUrl = baseUrl + apiPath;
      try {
        const apiResp = await fetch(apiUrl, { headers });
        const contentType = apiResp.headers.get('content-type') || '';
        
        if (apiResp.status === 200) {
          const body = await apiResp.text();
          
          networkLog.push({
            url: apiUrl,
            status: apiResp.status,
            type: 'api-probe',
            contentType,
            size: body.length
          });

          // Try parse JSON
          try {
            const json = JSON.parse(body);
            const score = scoreContent(JSON.stringify(json));
            
            if (score > 5) {
              console.log(`[FOUND API] ${apiPath} score=${score}`);
              chartCandidates.push({
                url: apiUrl,
                score,
                data: json
              });
              
              // Save
              const apiFile = `response_${hashUrl(apiUrl)}.json`;
              fs.writeFileSync(
                path.join(responsesDir, apiFile),
                JSON.stringify(json, null, 2),
                'utf-8'
              );
            }
          } catch {
            // Not JSON
          }
        }
      } catch (e) {
        // Ignore
      }
    }

    // 6. Parse HTML for embedded data
    console.log('\n[PARSING] HTML for embedded data...');

    // Find JSON-LD
    $('script[type="application/ld+json"]').each((i, el) => {
      const content = $(el).html();
      if (content) {
        console.log(`[JSON-LD] Found schema ${i}`);
        fs.writeFileSync(
          path.join(responsesDir, `jsonld_${i}.json`),
          content,
          'utf-8'
        );
      }
    });

    // Find data attributes
    $('[data-chart], [data-laso], [data-tuvi]').each((i, el) => {
      const data = $(el).data();
      console.log(`[DATA-ATTR] Found:`, Object.keys(data));
    });

    // Find inline JSON in scripts
    $('script:not([src])').each((i, el) => {
      const content = $(el).html() || '';
      
      // Look for var xxx = {...}
      const jsonMatches = content.match(/(?:var|let|const)\s+(\w+)\s*=\s*(\{[\s\S]*?\});/g);
      if (jsonMatches) {
        for (const match of jsonMatches) {
          const score = scoreContent(match);
          if (score > 5) {
            console.log(`[INLINE JSON] Found with score=${score}`);
            fs.writeFileSync(
              path.join(responsesDir, `inline_${i}.js`),
              match,
              'utf-8'
            );
          }
        }
      }
    });

    // 7. Save results
    console.log('\n[SAVING] Results...');

    // Network log
    fs.writeFileSync(
      path.join(outputDir, 'network.json'),
      JSON.stringify(networkLog, null, 2),
      'utf-8'
    );

    // Chart candidates
    fs.writeFileSync(
      path.join(outputDir, 'chart_candidates.json'),
      JSON.stringify(chartCandidates.map(c => ({
        url: c.url,
        score: c.score,
        hasData: !!c.data
      })), null, 2),
      'utf-8'
    );

    // Best candidate as normalized
    if (chartCandidates.length > 0) {
      const best = chartCandidates.sort((a, b) => b.score - a.score)[0];
      fs.writeFileSync(
        path.join(outputDir, 'raw_chart.json'),
        JSON.stringify(best.data, null, 2),
        'utf-8'
      );
      console.log(`[BEST] ${best.url} score=${best.score}`);
    }

    // Scripts analysis
    fs.writeFileSync(
      path.join(outputDir, 'scripts_analysis.json'),
      JSON.stringify({
        scripts: scripts.map(s => ({ index: s.index, src: s.src, hasInline: !!s.inline })),
        apiCandidates: [...foundApis]
      }, null, 2),
      'utf-8'
    );

    // Metadata
    fs.writeFileSync(
      path.join(outputDir, 'metadata.json'),
      JSON.stringify({
        source_url: url,
        final_url: finalUrl,
        chart_id: lid,
        crawl_time: new Date().toISOString(),
        page_title: title,
        status,
        page_score: pageScore,
        chart_candidates: chartCandidates.length,
        api_candidates: [...foundApis]
      }, null, 2),
      'utf-8'
    );

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('CRAWL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Chart ID: ${lid}`);
    console.log(`Status: ${status}`);
    console.log(`Title: ${title}`);
    console.log(`Page Score: ${pageScore}`);
    console.log(`Chart Candidates: ${chartCandidates.length}`);
    console.log(`API Candidates: ${foundApis.size}`);
    console.log(`\nOutput: ${outputDir}`);
    console.log('='.repeat(60));

    if (chartCandidates.length === 0 && pageScore > 10) {
      console.log('\n[NOTE] High page score but no API found.');
      console.log('Data might be server-side rendered in HTML.');
      console.log('Check page.html for embedded chart data.');
    }

  } catch (error) {
    console.error('\n[ERROR]', error.message);
    process.exit(1);
  }
}

// Run
const url = process.argv[2];
if (!url) {
  console.log('Usage: node tuvi-crawler.mjs "URL"');
  console.log('Example: node tuvi-crawler.mjs "https://tuvi.cohoc.net/bac-phai-la-so-tu-vi-nam-mau-dan-thang-9-ngay-7-gio-ti-duong-nam-lid-472159.html"');
  process.exit(1);
}

crawl(url);
