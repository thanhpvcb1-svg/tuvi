/**
 * Fetch Interpretation Knowledge from TuviCoHoc
 * Lấy tri thức luận giải các cung và phi hóa từ tuvicohoc.net
 * 
 * Run: node scripts/fetch-cohoc-knowledge.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COHOC_BASE_URL = "https://tuvi.cohoc.net";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
};

// Sample chart URLs with interpretations
const SAMPLE_URLS = [
  "/bac-phai-la-so-tu-vi-nam-at-suu-thang-12-ngay-21-gio-suu-am-nam-lid-1.html",
  // Add more sample URLs to get diverse knowledge
];

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse interpretation sections from HTML
 */
function parseInterpretations(html) {
  const knowledge = {
    cungMenh: [],
    cungTaiBach: [],
    cungQuanLoc: [],
    cungPhuThe: [],
    cungPhucDuc: [],
    cungDienTrach: [],
    cungThienDi: [],
    cungTatAch: [],
    cungTuTuc: [],
    cungHuynhDe: [],
    cungPhụMau: [],
    cungNoBoc: [],
    phiHoa: [],
    tuHoa: [],
    tinhDau: [],
    general: [],
  };

  // Extract sections by pattern matching
  const patterns = [
    { key: "cungMenh", regex: /Cung Mệnh[^<]*(?:an tại|có)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
    { key: "cungTaiBach", regex: /Cung Tài bạch[^<]*(?:an tại|có)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
    { key: "cungQuanLoc", regex: /Cung Quan lộc[^<]*(?:an tại|có)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
    { key: "cungPhuThe", regex: /Cung Phu thê[^<]*(?:an tại|có)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
    { key: "cungPhucDuc", regex: /Cung Phúc đức[^<]*(?:an tại|có)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
    { key: "cungDienTrach", regex: /Cung Điền trạch[^<]*(?:an tại|có)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
    { key: "cungThienDi", regex: /Cung Thiên di[^<]*(?:an tại|có)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
    { key: "cungTatAch", regex: /Cung Tật ách[^<]*(?:an tại|có)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
    { key: "cungTuTuc", regex: /Cung Tử tức[^<]*(?:an tại|có)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
    { key: "cungHuynhDe", regex: /Cung Huynh đệ[^<]*(?:an tại|có)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
    { key: "cungPhụMau", regex: /Cung Phụ mẫu[^<]*(?:an tại|có)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
    { key: "cungNoBoc", regex: /Cung Nô bộc[^<]*(?:an tại|có)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
    { key: "phiHoa", regex: /(?:Lộc|Quyền|Khoa|Kỵ)\s+(?:nhập|phi nhập)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
    { key: "tuHoa", regex: /Hóa\s+(?:lộc|quyền|khoa|kỵ)[^<]*<\/h[34]>([\s\S]*?)(?=<h[234]|$)/gi },
  ];

  for (const { key, regex } of patterns) {
    let match;
    while ((match = regex.exec(html)) !== null) {
      const text = stripHtml(match[1]);
      if (text.length > 50 && text.length < 5000) {
        // Extract title from the match
        const titleMatch = match[0].match(/<h[34][^>]*>([^<]+)<\/h[34]>/i);
        const title = titleMatch ? stripHtml(titleMatch[1]) : "";
        
        knowledge[key].push({
          title,
          content: text,
        });
      }
    }
  }

  return knowledge;
}

/**
 * Fetch and parse a chart page
 */
async function fetchChartPage(urlPath) {
  const url = `${COHOC_BASE_URL}${urlPath}`;
  console.log(`Fetching: ${url}`);
  
  const response = await fetch(url, {
    method: "GET",
    headers: HEADERS,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return response.text();
}

/**
 * Save knowledge to markdown files
 */
function saveKnowledge(knowledge, outputDir) {
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save each category
  const categories = [
    { key: "cungMenh", name: "Cung Mệnh", file: "cung-menh.md" },
    { key: "cungTaiBach", name: "Cung Tài Bạch", file: "cung-tai-bach.md" },
    { key: "cungQuanLoc", name: "Cung Quan Lộc", file: "cung-quan-loc.md" },
    { key: "cungPhuThe", name: "Cung Phu Thê", file: "cung-phu-the.md" },
    { key: "cungPhucDuc", name: "Cung Phúc Đức", file: "cung-phuc-duc.md" },
    { key: "cungDienTrach", name: "Cung Điền Trạch", file: "cung-dien-trach.md" },
    { key: "cungThienDi", name: "Cung Thiên Di", file: "cung-thien-di.md" },
    { key: "cungTatAch", name: "Cung Tật Ách", file: "cung-tat-ach.md" },
    { key: "cungTuTuc", name: "Cung Tử Tức", file: "cung-tu-tuc.md" },
    { key: "cungHuynhDe", name: "Cung Huynh Đệ", file: "cung-huynh-de.md" },
    { key: "cungPhụMau", name: "Cung Phụ Mẫu", file: "cung-phu-mau.md" },
    { key: "cungNoBoc", name: "Cung Nô Bộc", file: "cung-no-boc.md" },
    { key: "phiHoa", name: "Phi Hóa", file: "phi-hoa.md" },
    { key: "tuHoa", name: "Tứ Hóa", file: "tu-hoa.md" },
  ];

  for (const { key, name, file } of categories) {
    const items = knowledge[key];
    if (items.length === 0) continue;

    const lines = [`# ${name}\n`, `> Nguồn: tuvi.cohoc.net\n`];
    
    for (const item of items) {
      lines.push(`## ${item.title}\n`);
      lines.push(`${item.content}\n`);
      lines.push("---\n");
    }

    const filePath = path.join(outputDir, file);
    fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
    console.log(`  ✓ Saved ${items.length} entries to ${file}`);
  }
}

async function main() {
  console.log("=== Fetch CoHoc Knowledge ===\n");
  
  // Use existing fixture if available
  const fixturePath = path.join(__dirname, "..", "tests", "fixtures", "cohoc", "detailed-interpretations.json");
  
  let knowledge;
  
  if (fs.existsSync(fixturePath)) {
    console.log("Using existing fixture...\n");
    const data = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
    
    // Convert fixture format to knowledge format
    knowledge = {
      cungMenh: [],
      cungTaiBach: [],
      cungQuanLoc: [],
      cungPhuThe: [],
      cungPhucDuc: [],
      cungDienTrach: [],
      cungThienDi: [],
      cungTatAch: [],
      cungTuTuc: [],
      cungHuynhDe: [],
      cungPhụMau: [],
      cungNoBoc: [],
      phiHoa: [],
      tuHoa: [],
      tinhDau: [],
      general: [],
    };
    
    // Parse palaces from fixture
    for (const [title, content] of Object.entries(data.palaces || {})) {
      const entry = { title, content };
      
      if (title.includes("Mệnh")) knowledge.cungMenh.push(entry);
      else if (title.includes("Tài bạch")) knowledge.cungTaiBach.push(entry);
      else if (title.includes("Quan lộc")) knowledge.cungQuanLoc.push(entry);
      else if (title.includes("Phu thê")) knowledge.cungPhuThe.push(entry);
      else if (title.includes("Phúc đức")) knowledge.cungPhucDuc.push(entry);
      else if (title.includes("Điền trạch")) knowledge.cungDienTrach.push(entry);
      else if (title.includes("Thiên di")) knowledge.cungThienDi.push(entry);
      else if (title.includes("Tật ách")) knowledge.cungTatAch.push(entry);
      else if (title.includes("Tử tức")) knowledge.cungTuTuc.push(entry);
      else if (title.includes("Huynh đệ")) knowledge.cungHuynhDe.push(entry);
      else if (title.includes("Phụ mẫu")) knowledge.cungPhụMau.push(entry);
      else if (title.includes("Nô bộc")) knowledge.cungNoBoc.push(entry);
      else if (title.includes("Lộc") || title.includes("Quyền") || title.includes("Khoa") || title.includes("Kỵ")) {
        knowledge.phiHoa.push(entry);
      }
      else knowledge.general.push(entry);
    }
  } else {
    console.log("Fetching from cohoc.net...\n");
    
    // Fetch sample pages
    const allKnowledge = {
      cungMenh: [],
      cungTaiBach: [],
      cungQuanLoc: [],
      cungPhuThe: [],
      cungPhucDuc: [],
      cungDienTrach: [],
      cungThienDi: [],
      cungTatAch: [],
      cungTuTuc: [],
      cungHuynhDe: [],
      cungPhụMau: [],
      cungNoBoc: [],
      phiHoa: [],
      tuHoa: [],
      tinhDau: [],
      general: [],
    };
    
    for (const urlPath of SAMPLE_URLS) {
      try {
        const html = await fetchChartPage(urlPath);
        const parsed = parseInterpretations(html);
        
        // Merge
        for (const key of Object.keys(allKnowledge)) {
          allKnowledge[key].push(...(parsed[key] || []));
        }
        
        // Rate limit
        await new Promise(r => setTimeout(r, 1000));
      } catch (error) {
        console.error(`  ✗ Error: ${error.message}`);
      }
    }
    
    knowledge = allKnowledge;
  }
  
  // Save to knowledge directory
  const outputDir = path.join(__dirname, "..", "src", "knowledge", "cohoc");
  console.log(`\nSaving to: ${outputDir}\n`);
  saveKnowledge(knowledge, outputDir);
  
  // Also save raw JSON
  const jsonPath = path.join(outputDir, "knowledge.json");
  fs.writeFileSync(jsonPath, JSON.stringify(knowledge, null, 2), "utf-8");
  console.log(`  ✓ Saved knowledge.json`);
  
  // Summary
  console.log("\n=== Summary ===");
  let total = 0;
  for (const [key, items] of Object.entries(knowledge)) {
    if (items.length > 0) {
      console.log(`  ${key}: ${items.length} entries`);
      total += items.length;
    }
  }
  console.log(`\nTotal: ${total} knowledge entries`);
}

main().catch(console.error);
