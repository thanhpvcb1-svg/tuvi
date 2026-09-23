/**
 * Knowledge Crawler Example
 * 
 * Demo how to use the knowledge crawler module
 * 
 * Usage:
 *   npx ts-node src/lib/tuvi/knowledge/crawler/crawl.ts
 */

import { parse, saveSections, loadPalaceKnowledge, getPalaceStats } from "../index";
import type { Palace } from "../types";

// Example HTML content (simulating crawled data)
const EXAMPLE_HTML = `
<h4>Cung Phu thê an tại Thân có Thiên mã</h4>
<p>Nam chủ lấy được vợ hiền, hội cát tinh, chủ được sự giúp đỡ từ nhà vợ hoặc lấy được vợ có tiền hoặc nhờ có sự giúp đỡ của vợ mà phát tài.</p>
<p>Nữ mệnh Thiên Mã nhập cung phu thê hội cát tinh, chủ vượng phu, có thể hưởng phú quý từ chồng, là số quý phu nhân.</p>
<p>Hội nhiều cát tinh thì nam nữ đều quý mỹ. Hội lộc tinh tốt nhất.</p>
<p>Hội sát kỵ Không Kiếp, nam nữ cô quả, sinh ly.</p>
<p>Thiên Mã nhập cung phu thê, chủ phối ngẫu ở nhà chịu khó, ở ngoài bôn ba, có dấu hiệu sống riêng khá lâu.</p>
<p>*Khai quán nhân tử vi đẩu số - Phương Ngoại Nhân - Linh Chi biên dịch*</p>

<h4>Cung Phu thê an tại Thân có Thiên mã hội Lộc Tồn</h4>
<p>Thiên Mã nhập Phu Thê, hội Lộc Tồn biểu thị sẽ được gả đi, gia cát vui sướng, gả cho người nơi xa hoặc đi làm ăn xa, kết hôn sẽ mang đến may mắn.</p>
<p>*Khai quán nhân tử vi đẩu số - Phương Ngoại Nhân - Linh Chi biên dịch*</p>
`;

/**
 * Main crawl function
 */
async function crawl() {
  console.log("=== Knowledge Crawler Demo ===\n");

  // 1. Parse HTML content
  console.log("1. Parsing HTML content...");
  const sections = parse(
    EXAMPLE_HTML,
    "https://tuvi.cohoc.net/cung-phu-the-thien-ma.html"
  );

  console.log(`   Found ${sections.length} sections\n`);

  // 2. Display parsed sections
  console.log("2. Parsed sections:");
  for (const section of sections) {
    console.log(`\n   Section: ${section.title}`);
    console.log(`   Palace: ${section.context.palace}`);
    console.log(`   Position: ${section.context.position}`);
    console.log(`   Required Stars: ${section.context.required_stars.join(", ")}`);
    console.log(`   Source: ${section.source.book} - ${section.source.author}`);
    console.log(`   Blocks: ${section.blocks.length}`);

    for (let i = 0; i < section.blocks.length; i++) {
      const block = section.blocks[i];
      console.log(`\n   Block ${i + 1}:`);
      console.log(`     ID: ${block.block_id}`);
      console.log(`     Gender: ${block.conditions.gender || "N/A"}`);
      console.log(`     Meeting Stars: ${block.conditions.meeting_stars.join(", ") || "N/A"}`);
      console.log(`     Additional: ${block.conditions.additional_conditions.join(", ") || "N/A"}`);
      console.log(`     Text: ${block.raw_text.substring(0, 80)}...`);
    }
  }

  // 3. Save to files (uncomment to actually save)
  // console.log("\n3. Saving to files...");
  // saveSections(sections);

  // 4. Show stats
  console.log("\n3. Stats:");
  const totalBlocks = sections.reduce((sum, s) => sum + s.blocks.length, 0);
  console.log(`   Total Sections: ${sections.length}`);
  console.log(`   Total Blocks: ${totalBlocks}`);
}

/**
 * Load and display existing knowledge
 */
async function showExisting(palace: Palace) {
  console.log(`\n=== Existing Knowledge for ${palace} ===\n`);

  const knowledge = loadPalaceKnowledge(palace);
  if (!knowledge) {
    console.log("No existing knowledge found.");
    return;
  }

  const stats = getPalaceStats(palace);
  if (stats) {
    console.log(`Sections: ${stats.sectionCount}`);
    console.log(`Blocks: ${stats.blockCount}`);
    console.log(`Sources: ${stats.sources.join(", ")}`);
  }
}

// Run demo
crawl().catch(console.error);
