/**
 * Script crawl data luận giải từ tuvi.cohoc.net
 * Chạy: node scripts/crawl-cohoc.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://tuvi.cohoc.net";
const OUTPUT_DIR = path.join(__dirname, "../src/lib/tuvi/data/interpretations/crawled");

// Danh sách các cung
const PALACES = [
  { id: "menh", name: "Mệnh", keywords: ["cung-menh", "o-cung-menh"] },
  { id: "phu_mau", name: "Phụ Mẫu", keywords: ["cung-phu-mau", "o-cung-phu-mau"] },
  { id: "phuc_duc", name: "Phúc Đức", keywords: ["cung-phuc-duc", "o-cung-phuc-duc"] },
  { id: "dien_trach", name: "Điền Trạch", keywords: ["cung-dien-trach", "o-cung-dien-trach"] },
  { id: "quan_loc", name: "Quan Lộc", keywords: ["cung-quan-loc", "o-cung-quan-loc"] },
  { id: "no_boc", name: "Nô Bộc", keywords: ["cung-no-boc", "o-cung-no-boc"] },
  { id: "thien_di", name: "Thiên Di", keywords: ["cung-thien-di", "o-cung-thien-di"] },
  { id: "tat_ach", name: "Tật Ách", keywords: ["cung-tat-ach", "o-cung-tat-ach"] },
  { id: "tai_bach", name: "Tài Bạch", keywords: ["cung-tai-bach", "o-cung-tai-bach"] },
  { id: "tu_nu", name: "Tử Nữ", keywords: ["cung-tu-nu", "o-cung-tu-nu"] },
  { id: "phu_the", name: "Phu Thê", keywords: ["cung-phu-the", "o-cung-phu-the"] },
  { id: "huynh_de", name: "Huynh Đệ", keywords: ["cung-huynh-de", "o-cung-huynh-de"] },
];

// Danh sách các sao chính
const STARS = [
  { id: "tu_vi", name: "Tử Vi", keywords: ["tu-vi"] },
  { id: "thien_co", name: "Thiên Cơ", keywords: ["thien-co"] },
  { id: "thai_duong", name: "Thái Dương", keywords: ["thai-duong"] },
  { id: "vu_khuc", name: "Vũ Khúc", keywords: ["vu-khuc"] },
  { id: "thien_dong", name: "Thiên Đồng", keywords: ["thien-dong"] },
  { id: "liem_trinh", name: "Liêm Trinh", keywords: ["liem-trinh"] },
  { id: "thien_phu", name: "Thiên Phủ", keywords: ["thien-phu"] },
  { id: "thai_am", name: "Thái Âm", keywords: ["thai-am"] },
  { id: "tham_lang", name: "Tham Lang", keywords: ["tham-lang"] },
  { id: "cu_mon", name: "Cự Môn", keywords: ["cu-mon"] },
  { id: "thien_tuong", name: "Thiên Tướng", keywords: ["thien-tuong"] },
  { id: "thien_luong", name: "Thiên Lương", keywords: ["thien-luong"] },
  { id: "that_sat", name: "Thất Sát", keywords: ["that-sat"] },
  { id: "pha_quan", name: "Phá Quân", keywords: ["pha-quan"] },
];

// Fetch HTML từ URL
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

// Parse nội dung từ HTML
function parseContent(html) {
  // Lấy title
  const titleMatch = html.match(/<h1>([^<]+)<\/h1>/);
  const title = titleMatch ? decodeHtml(titleMatch[1]) : "";

  // Lấy nội dung
  const contentMatch = html.match(/<div class="noi-dung">([\s\S]*?)<\/div>/);
  let content = contentMatch ? contentMatch[1] : "";

  // Clean HTML tags, giữ lại text
  content = content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  content = decodeHtml(content);

  // Lấy tags/keywords
  const tagsMatch = html.match(/<div class="tags">([\s\S]*?)<\/div>/);
  const tags = [];
  if (tagsMatch) {
    const tagLinks = tagsMatch[1].match(/>([^<]+)<\/a>/g);
    if (tagLinks) {
      tagLinks.forEach((t) => {
        const tag = t.replace(/>([^<]+)<\/a>/, "$1").trim();
        if (tag) tags.push(decodeHtml(tag));
      });
    }
  }

  // Lấy source từ cuối nội dung (thường có dạng "Theo ... - ... biên dịch")
  const sourceMatch = content.match(/(?:Theo|Trích từ|Nguồn:?)\s*([^\n]+)$/i);
  const source = sourceMatch ? sourceMatch[1].trim() : null;

  return { title, content, tags, source };
}

// Decode HTML entities
function decodeHtml(html) {
  return html
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Lấy danh sách bài viết từ trang học tử vi
async function getArticleList(pageNum = 1) {
  const url = pageNum === 1 ? `${BASE_URL}/hoc-tu-vi.html` : `${BASE_URL}/hoc-tu-vi-${pageNum}.html`;

  console.log(`Fetching article list: ${url}`);
  const html = await fetchPage(url);

  const articles = [];
  const linkRegex = /<a href='([^']+nid-\d+\.html)'>([^<]+)<\/a>/g;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    articles.push({
      url: `${BASE_URL}/${match[1]}`,
      title: decodeHtml(match[2]),
    });
  }

  return articles;
}

// Xác định sao và cung từ title/url
function identifyStarAndPalace(title, url) {
  const titleLower = title.toLowerCase();
  const urlLower = url.toLowerCase();

  let star = null;
  let palace = null;

  // Tìm sao
  for (const s of STARS) {
    for (const kw of s.keywords) {
      if (urlLower.includes(kw) || titleLower.includes(s.name.toLowerCase())) {
        star = s;
        break;
      }
    }
    if (star) break;
  }

  // Tìm cung
  for (const p of PALACES) {
    for (const kw of p.keywords) {
      if (urlLower.includes(kw) || titleLower.includes(p.name.toLowerCase())) {
        palace = p;
        break;
      }
    }
    if (palace) break;
  }

  return { star, palace };
}

// Crawl và lưu data
async function crawl(maxPages = 5) {
  // Tạo output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results = {};
  const processedUrls = new Set();

  for (let page = 1; page <= maxPages; page++) {
    try {
      const articles = await getArticleList(page);
      console.log(`Page ${page}: Found ${articles.length} articles`);

      for (const article of articles) {
        if (processedUrls.has(article.url)) continue;
        processedUrls.add(article.url);

        const { star, palace } = identifyStarAndPalace(article.title, article.url);

        // Chỉ crawl bài về sao ở cung
        if (!star || !palace) continue;

        console.log(`  Crawling: ${article.title}`);

        try {
          const html = await fetchPage(article.url);
          const { content, tags, source } = parseContent(html);

          if (!content) continue;

          // Tổ chức theo cung
          if (!results[palace.id]) {
            results[palace.id] = {
              palace: palace.id,
              palace_name: palace.name,
              interpretations: [],
            };
          }

          results[palace.id].interpretations.push({
            star_id: star.id,
            star_name: star.name,
            title: article.title,
            content: content,
            source: source,
            tags: tags,
            url: article.url,
            crawled_at: new Date().toISOString(),
          });

          // Delay để tránh rate limit
          await new Promise((r) => setTimeout(r, 500));
        } catch (err) {
          console.error(`  Error crawling ${article.url}:`, err.message);
        }
      }

      // Delay giữa các trang
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`Error fetching page ${page}:`, err.message);
    }
  }

  // Lưu kết quả theo từng cung
  for (const [palaceId, data] of Object.entries(results)) {
    const filePath = path.join(OUTPUT_DIR, `${palaceId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`Saved: ${filePath} (${data.interpretations.length} entries)`);
  }

  // Lưu summary
  const summary = {
    crawled_at: new Date().toISOString(),
    total_articles: Object.values(results).reduce((sum, p) => sum + p.interpretations.length, 0),
    by_palace: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.interpretations.length])),
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, "_summary.json"), JSON.stringify(summary, null, 2), "utf8");

  console.log("\n=== CRAWL COMPLETE ===");
  console.log(`Total articles: ${summary.total_articles}`);
  console.log("By palace:", summary.by_palace);
}

// Run
const maxPages = parseInt(process.argv[2]) || 10;
console.log(`Starting crawl (max ${maxPages} pages)...\n`);
crawl(maxPages).catch(console.error);
