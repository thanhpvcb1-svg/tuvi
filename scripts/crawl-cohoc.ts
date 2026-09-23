/**
 * Crawl knowledge from tuvi.cohoc.net
 * 
 * Usage:
 *   npx ts-node scripts/crawl-cohoc.ts <url>
 */

import * as fs from "fs";
import * as path from "path";

const URL = process.argv[2] || "https://tuvi.cohoc.net/bac-phai-la-so-tu-vi-nam-mau-dan-thang-9-ngay-7-gio-ti-duong-nam-lid-472159.html";

interface InterpretationBlock {
  id: string;
  palace: string;
  palace_name: string;
  branch?: string;
  branch_name?: string;
  stars?: string[];
  phi_hoa?: {
    type: string;
    source_palace: string;
    target_palace: string;
  };
  text: string;
  source: {
    book: string;
    author: string;
    translator: string | null;
  };
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }
  return response.text();
}

function parseInterpretations(html: string): InterpretationBlock[] {
  const blocks: InterpretationBlock[] = [];
  
  // Find the main content area - look for interpretation sections
  // Pattern: "Cung X an tại Y có Z"
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
    
    const block: InterpretationBlock = {
      id: generateId(parsed.palace, parsed.branch, parsed.stars),
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

function parseTitle(title: string): {
  palace: string;
  palace_name: string;
  branch?: string;
  branch_name?: string;
  stars?: string[];
  phi_hoa?: { type: string; source_palace: string; target_palace: string };
} | null {
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
  let stars: string[] | undefined;
  let phi_hoa: { type: string; source_palace: string; target_palace: string } | undefined;
  
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
    
    // Extract star names
    const starNames = hasContent.match(/(?:các sao\s+)?([^,]+(?:,\s*[^,]+)*)/);
    if (starNames && !phi_hoa) {
      stars = starNames[1].split(/[,，]/).map(s => s.trim()).filter(Boolean);
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

function parseContent(content: string): { text: string; source: { book: string; author: string; translator: string | null } } {
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
  
  let text = "";
  let source = { book: "Unknown", author: "Unknown", translator: null as string | null };
  
  for (const line of lines) {
    // Check for source citation
    const sourceMatch = line.match(/^(.+?)\s*[-–—]\s*(.+?)(?:\s*[-–—]\s*(.+?))?$/);
    if (sourceMatch && line.length < 100 && !line.includes("，") && !line.includes("。")) {
      // Likely a source citation
      if (sourceMatch[3]) {
        source = {
          book: sourceMatch[1].trim(),
          author: sourceMatch[2].trim(),
          translator: sourceMatch[3].replace(/biên dịch/i, "").trim() || null,
        };
      } else {
        source = {
          book: sourceMatch[1].trim(),
          author: sourceMatch[2].trim(),
          translator: null,
        };
      }
      continue;
    }
    
    // Accumulate text
    if (text) text += " ";
    text += line;
  }
  
  return { text: text.trim(), source };
}

function normalizePalace(name: string): string {
  const map: Record<string, string> = {
    "mệnh": "menh", "menh": "menh",
    "phụ": "phu_mau", "phụ mẫu": "phu_mau", "phu_mau": "phu_mau", "p.mẫu": "phu_mau",
    "phúc": "phuc_duc", "phúc đức": "phuc_duc", "phuc_duc": "phuc_duc",
    "điền": "dien_trach", "điền trạch": "dien_trach", "dien_trach": "dien_trach",
    "quan": "quan_loc", "quan lộc": "quan_loc", "quan_loc": "quan_loc",
    "nô": "no_boc", "nô bộc": "no_boc", "no_boc": "no_boc",
    "di": "thien_di", "thiên di": "thien_di", "thien_di": "thien_di",
    "tật": "tat_ach", "tật ách": "tat_ach", "tat_ach": "tat_ach",
    "tài": "tai_bach", "tài bạch": "tai_bach", "tai_bach": "tai_bach",
    "tử": "tu_tuc", "tử tức": "tu_tuc", "tu_tuc": "tu_tuc",
    "phu": "phu_the", "phu thê": "phu_the", "phu_the": "phu_the",
    "huynh": "huynh_de", "huynh đệ": "huynh_de", "huynh_de": "huynh_de",
  };
  
  const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  return map[normalized] || map[name.toLowerCase()] || normalized.replace(/\s+/g, "_");
}

function normalizeBranch(name: string): string {
  const map: Record<string, string> = {
    "tý": "ty", "ty": "ty", "tí": "ty",
    "sửu": "suu", "suu": "suu",
    "dần": "dan", "dan": "dan",
    "mão": "mao", "mao": "mao",
    "thìn": "thin", "thin": "thin",
    "tỵ": "ti", "ti": "ti", "tị": "ti",
    "ngọ": "ngo", "ngo": "ngo",
    "mùi": "mui", "mui": "mui",
    "thân": "than", "than": "than",
    "dậu": "dau", "dau": "dau",
    "tuất": "tuat", "tuat": "tuat",
    "hợi": "hoi", "hoi": "hoi",
  };
  
  const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  return map[normalized] || map[name.toLowerCase()] || normalized;
}

function normalizeHoa(name: string): string {
  const map: Record<string, string> = {
    "lộc": "loc", "loc": "loc",
    "quyền": "quyen", "quyen": "quyen",
    "khoa": "khoa",
    "kỵ": "ky", "ky": "ky", "kị": "ky",
  };
  
  const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  return map[normalized] || map[name.toLowerCase()] || normalized;
}

function generateId(palace: string, branch?: string, stars?: string[]): string {
  const parts = [palace];
  if (branch) parts.push(branch);
  if (stars && stars.length > 0) parts.push(stars.join("_"));
  return parts.join("_").toLowerCase().replace(/\s+/g, "_");
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
    
    // Group by palace
    const byPalace: Record<string, InterpretationBlock[]> = {};
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
      let existing: any = { palace, palace_name: palaceBlocks[0]?.palace_name || palace, sections: [] };
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
        let section = existing.sections.find((s: any) => s.section_id === sectionId);
        if (!section) {
          section = {
            section_id: sectionId,
            title: getSectionTitle(sectionId),
            interpretations: [],
          };
          existing.sections.push(section);
        }
        
        // Add interpretation if not duplicate
        const isDuplicate = section.interpretations.some((i: any) => i.id === block.id || i.text === block.text);
        if (!isDuplicate) {
          section.interpretations.push({
            id: block.id,
            type: block.phi_hoa ? (block.phi_hoa.type === "menh_chieu" ? "palace_relation" : `phi_${block.phi_hoa.type}`) : "star",
            ...(block.phi_hoa && block.phi_hoa.type !== "menh_chieu" && {
              source_palace: block.phi_hoa.source_palace,
              target_palace: block.phi_hoa.target_palace,
            }),
            ...(block.phi_hoa && block.phi_hoa.type === "menh_chieu" && {
              relation_palace: block.phi_hoa.target_palace,
              relation_code: `M ${block.phi_hoa.target_palace}`,
            }),
            ...(block.stars && { stars: block.stars }),
            ...(block.branch && { branches: [block.branch], branch_names: [block.branch_name] }),
            text: block.text,
            source: block.source,
          });
        }
      }
      
      fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
      console.log(`Saved ${palaceBlocks.length} blocks to: ${outPath}`);
    }
    
    console.log("\nDone!");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

function getSectionTitle(sectionId: string): string {
  const titles: Record<string, string> = {
    phi_cung_tu_hoa: "Phi Cung Tứ Hóa",
    menh_chieu: "Mệnh chiếu từ cung khác",
    sao_tai_cung: "Sao tại cung",
    cach_cuc: "Cách Cục",
    general: "Luận giải chung",
  };
  return titles[sectionId] || sectionId;
}

main();
