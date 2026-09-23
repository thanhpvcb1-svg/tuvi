/**
 * Script để parse file tri thức cổ học và xuất ra JSON
 * 
 * Usage: npx ts-node src/lib/tuvi/knowledge/scripts/parseCohocFile.ts
 */

import * as fs from "fs";
import * as path from "path";
import { parseCohocText, convertToKnowledgeFile } from "../cohocParser";

async function main() {
  const inputPath = process.argv[2] || "C:\\project\\tuvi\\tuvicohoc\\1.txt";
  const outputDir = process.argv[3] || "C:\\project\\tuvi\\src\\lib\\tuvi\\knowledge\\cung";
  
  console.log(`📖 Đọc file: ${inputPath}`);
  
  const content = fs.readFileSync(inputPath, "utf-8");
  console.log(`   Kích thước: ${(content.length / 1024).toFixed(2)} KB`);
  
  console.log("\n🔍 Phân tích tri thức...");
  const parsed = parseCohocText(content);
  
  let totalBlocks = 0;
  const palaceStats: Array<{ palace: string; count: number }> = [];
  
  for (const [palace, blocks] of parsed) {
    totalBlocks += blocks.length;
    palaceStats.push({ palace, count: blocks.length });
  }
  
  console.log(`\n📊 Thống kê:`);
  console.log(`   Tổng số cung: ${parsed.size}`);
  console.log(`   Tổng số block tri thức: ${totalBlocks}`);
  console.log(`\n   Chi tiết theo cung:`);
  
  for (const stat of palaceStats.sort((a, b) => b.count - a.count)) {
    console.log(`   - ${stat.palace}: ${stat.count} blocks`);
  }
  
  console.log(`\n💾 Xuất file JSON...`);
  
  for (const [palace, blocks] of parsed) {
    if (blocks.length === 0) continue;
    
    const knowledgeFile = convertToKnowledgeFile(palace, blocks);
    const outputPath = path.join(outputDir, `${palace}-cohoc-parsed.json`);
    
    fs.writeFileSync(outputPath, JSON.stringify(knowledgeFile, null, 2), "utf-8");
    console.log(`   ✅ ${outputPath}`);
  }
  
  console.log(`\n✨ Hoàn thành!`);
}

main().catch(console.error);
