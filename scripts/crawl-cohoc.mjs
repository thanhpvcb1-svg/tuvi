/**
 * Crawl knowledge from tuvi.cohoc.net
 * 
 * Usage:
 *   node scripts/crawl-cohoc.mjs <url>
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const URL = process.argv[2] || "https://tuvi.cohoc.net/bac-phai-la-so-tu-vi-nam-mau-dan-thang-9-ngay-7-gio-ti-duong-nam-lid-472159.html";

async function fetchHtml(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }
  return response.text();
}

function parseInterpretations(html) {
  const blocks = [];
  
  // Find the main content area - look for interpretation sections
  // Pattern: "#### Cung X an tại Y có Z"
  const sectionRegex = /####\s*([^\n]+)\n([\s\S]*?)(?=####|$)/g;
  
  let match;
  while ((match = sectionRegex.exec(html)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    
    // Parse title to extract palace, branch, stars
    const parsed = parseTitle(title);
    if (!parsed) continue;
    
    // Parse content to extract text and source
    const { text, source } = parseContent(content);
    if (!text) continue;
    
    const block = {
      id: generateId(parsed.palace, parsed.branch, parsed.stars, parsed.phi_hoa),
      palace: parsed.palace,
      palace_name: parsed.palace_name,
      text,
      source,
    };
    
    if (parsed.branch) {
      block.branch = parsed.branch;
      block.branch_name = parsed.branch_name;
    }
    
    if (parsed.stars && parsed.stars.length > 0) {
      block.stars = parsed.stars;
    }
    
    if (parsed.phi_hoa) {
      block.phi_hoa = parsed.phi_hoa;
    }
    
    blocks.push(block);
  }
  
  return blocks;
}

function parseTitle(title) {
  // Pattern: "Cung Mệnh an tại Tuất có Kỵ Phúc"
  const palaceMatch = title.match(/[Cc]ung\s+(\S+)/);
  if (!palaceMatch) return null;
  
  const palaceName = palaceMatch[1];
  const palace = normalizePalace(palaceName);
  
  // Extract branch
  const branchMatch = title.match(/(?:an\s+)?tại\s+(\S+)/i);
  const branch = branchMatch ? normalizeBranch(branchMatch[1]) : undefined;
  const branchName = branchMatch ? branchMatch[1] : undefined;
  
  // Extract stars or phi hoa
  const hasMatch = title.match(/có\s+(.+)$/i);
  let stars;
  let phi_hoa;
  
  if (hasMatch) {
    const hasContent = hasMatch[1];
    
    // Check for phi hoa pattern: "Kỵ Phúc" = Hóa Kỵ nhập Phúc Đức
    const phiHoaMatch = hasContent.match(/^(Lộc|Quyền|Khoa|Kỵ)\s+(\S+)/);
    if (phiHoaMatch) {
      phi_hoa = {
        type: normalizeHoa(phiHoaMatch[1]),
        source_palace: palace,
        target_palace: normalizePalace(phiHoaMatch[2]),
      };
    }
    
    // Check for "M X" pattern (Mệnh chiếu từ cung X)
    const mMatch = hasContent.match(/^M\s+(\S+)/);
    if (mMatch) {
      phi_hoa = {
        type: "menh_chieu",
        source_palace: "menh",
        target_palace: normalizePalace(mMatch[1]),
      };
    }
    
    // Extract star names (if not phi hoa)
    if (!phi_hoa) {
      const starText = hasContent.replace(/^các sao\s+/i, "");
      stars = starText.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    }
  }
  
  return {
    palace,
    palace_name: palaceName,
    branch,
    branch_name: branchName,
    stars,
    phi_hoa,
  };
}

function parseContent(content) {
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
  
  let text = "";
  let source = { book: "Unknown", author: "Unknown", translator: null };
  
  for (const line of lines) {
    // Check for source citation at end
    // Pattern: "Book - Author" or "Book - Author - Translator biên dịch"
    const sourceMatch = line.match(/^([^-–—]+)\s*[-–—]\s*([^-–—]+?)(?:\s*[-–—]\s*(.+?))?$/);
    
    // Check if this looks like a source (short, no Chinese chars in middle)
    if (sourceMatch && line.length < 120) {
      const book = sourceMatch[1].trim();
      const author = sourceMatch[2].trim();
      const translator = sourceMatch[3] ? sourceMatch[3].replace(/biên dịch/i, "").trim() : null;
      
      // Validate it's likely a source
      if (book.length < 50 && author.length < 30) {
        source = { book, author, translator };
        continue;
      }
    }
    
    // Accumulate text
    if (text) text += " ";
    text += line;
  }
  
  return { text: text.trim(), source };
}

function normalizePalace(name) {
  const normalized = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
  
  const map = {
    "menh": "menh",
    "phu": "phu_mau", "phu mau": "phu_mau", "p.mau": "phu_mau",
    "phuc": "phuc_duc", "phuc duc": "phuc_duc",
    "dien": "dien_trach", "dien trach": "dien_trach",
    "quan": "quan_loc", "quan loc": "quan_loc",
    "no": "no_boc", "no boc": "no_boc",
    "di": "thien_di", "thien di": "thien_di",
    "tat": "tat_ach", "tat ach": "tat_ach",
    "tai": "tai_bach", "tai bach": "tai_bach",
    "tu": "tu_tuc", "tu tuc": "tu_tuc",
    "phu the": "phu_the",
    "huynh": "huynh_de", "huynh de": "huynh_de",
  };
  
  return map[normalized] || normalized.replace(/\s+/g, "_");
}

function normalizeBranch(name) {
  const normalized = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
  
  const map = {
    "ty": "ty", "ti": "ty",
    "suu": "suu",
    "dan": "dan",
    "mao": "mao",
    "thin": "thin",
    "ty_": "ti",
    "ngo": "ngo",
    "mui": "mui",
    "than": "than",
    "dau": "dau",
    "tuat": "tuat",
    "hoi": "hoi",
  };
  
  return map[normalized] || normalized;
}

function normalizeHoa(name) {
  const normalized = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
  
  const map = {
    "loc": "loc",
    "quyen": "quyen",
    "khoa": "khoa",
    "ky": "ky", "ki": "ky",
  };
  
  return map[normalized] || normalized;
}

function generateId(palace, branch, stars, phi_hoa) {
  const parts = [palace];
  if (branch) parts.push(branch);
  if (phi_hoa) parts.push(phi_hoa.type, phi_hoa.target_palace);
  if (stars && stars.length > 0) parts.push(stars.slice(0, 2).join("_"));
  return parts.join("_").toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "_");
}

function getSectionTitle(sectionId) {
  const titles = {
    phi_cung_tu_hoa: "Phi Cung Tứ Hóa",
    menh_chieu: "Mệnh chiếu từ cung khác",
    sao_tai_cung: "Sao tại cung",
    cach_cuc: "Cách Cục",
    general: "Luận giải chung",
  };
  return titles[sectionId] || sectionId;
}

async function main() {
  console.log(`Fetching: ${URL}\n`);
  
  try {
    const html = await fetchHtml(URL);
    console.log(`Fetched ${html.length} bytes\n`);
    
    // Save raw HTML for debugging
    const rawPath = path.join(__dirname, "../src/lib/tuvi/knowledge/unclassified/raw-cohoc.html");
    fs.writeFileSync(rawPath, html);
    console.log(`Saved raw HTML to: ${rawPath}\n`);
    
    // Parse interpretations
    const blocks = parseInterpretations(html);
    console.log(`Found ${blocks.length} interpretation blocks\n`);
    
    if (blocks.length === 0) {
      console.log("No blocks found. Check the HTML structure.");
      console.log("\nFirst 2000 chars of HTML:");
      console.log(html.substring(0, 2000));
      return;
    }
    
    // Show what we found
    for (const block of blocks) {
      console.log(`- ${block.palace_name}: ${block.text.substring(0, 60)}...`);
    }
    
    // Group by palace
    const byPalace = {};
    for (const block of blocks) {
      if (!byPalace[block.palace]) {
        byPalace[block.palace] = [];
      }
      byPalace[block.palace].push(block);
    }
    
    // Save each palace
    for (const [palace, palaceBlocks] of Object.entries(byPalace)) {
      const outPath = path.join(__dirname, `../src/lib/tuvi/knowledge/cung/${palace}.json`);
      
      // Load existing if any
      let existing = { palace, palace_name: palaceBlocks[0]?.palace_name || palace, sections: [] };
      if (fs.existsSync(outPath)) {
        existing = JSON.parse(fs.readFileSync(outPath, "utf-8"));
      }
      
      // Add new blocks to appropriate sections
      for (const block of palaceBlocks) {
        // Determine section
        let sectionId = "general";
        if (block.phi_hoa) {
          sectionId = block.phi_hoa.type === "menh_chieu" ? "menh_chieu" : "phi_cung_tu_hoa";
        } else if (block.stars) {
          sectionId = "sao_tai_cung";
        }
        
        // Find or create section
        let section = existing.sections.find(s => s.section_id === sectionId);
        if (!section) {
          section = {
            section_id: sectionId,
            title: getSectionTitle(sectionId),
            interpretations: [],
          };
          existing.sections.push(section);
        }
        
        // Add interpretation if not duplicate
        const isDuplicate = section.interpretations.some(i => i.id === block.id || i.text === block.text);
        if (!isDuplicate) {
          const interp = {
            id: block.id,
            text: block.text,
            source: block.source,
          };
          
          if (block.phi_hoa && block.phi_hoa.type !== "menh_chieu") {
            interp.type = `phi_${block.phi_hoa.type}`;
            interp.source_palace = block.phi_hoa.source_palace;
            interp.target_palace = block.phi_hoa.target_palace;
          } else if (block.phi_hoa && block.phi_hoa.type === "menh_chieu") {
            interp.type = "palace_relation";
            interp.relation_palace = block.phi_hoa.target_palace;
            interp.relation_code = `M ${block.phi_hoa.target_palace}`;
          } else if (block.stars) {
            interp.type = "star";
            interp.stars = block.stars;
          }
          
          if (block.branch) {
            interp.branches = [block.branch];
            interp.branch_names = [block.branch_name];
          }
          
          section.interpretations.push(interp);
        }
      }
      
      fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
      console.log(`\nSaved ${palaceBlocks.length} blocks to: ${outPath}`);
    }
    
    console.log("\nDone!");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
